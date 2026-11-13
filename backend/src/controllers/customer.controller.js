const prisma = require("../config/database");
const { Prisma } = require("@prisma/client");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { normalizePhone, normalizeName, normalizeText } = require("../utils/normalize");
const { computeCustomerStatsAndBadges } = require("../utils/customerBadges");
const { hasPermission } = require("../services/authorization.service");

function visibleTicketScope(req) {
    return hasPermission(req.authorization, "tickets.view_all") ? {} : { OR: [
        { teknisi_id: req.user.id },
        { teknisi_id: null, status: { notIn: ["selesai", "diambil", "dibatalkan"] } }
    ] };
}

function enrichCustomerWithBadges(c) {
    if (!c) return c;
    const allTikets = [];
    let totalBelanja = 0;
    try {
        (c.perangkat || []).forEach(p => {
            (p.tiket_servis || []).forEach(t => {
                if (t) {
                    allTikets.push(t);
                    if (t.invoice?.total_biaya) {
                        totalBelanja += Number(t.invoice.total_biaya) || 0;
                    }
                }
            });
        });

        const { stats, badges } = computeCustomerStatsAndBadges({
            totalPerangkat: (c.perangkat || []).length,
            tikets: allTikets,
            totalBelanja,
            customBadges: c.custom_badges
        });

        return {
            ...c,
            stats: stats || {},
            badges: badges || []
        };
    } catch (err) {
        console.warn("enrichCustomerWithBadges fallback:", err.message);
        return {
            ...c,
            stats: {},
            badges: []
        };
    }
}

// Mengambil seluruh data customer dengan pencarian dan paginasi
async function getAll(req, res) {
    try {
        const { search, tipe_kepribadian, has_perangkat, sortBy, status } = req.query;
        const canViewTickets = hasPermission(req.authorization, "tickets.view");
        const { isPaginated, page, limit, skip } = parsePagination(req.query);

        let where = {};
        const andList = [];

        // Filter status arsip:
        // status === "archived": hanya tampilkan pelanggan yang diarsipkan (is_active === false)
        // status === "all": tampilkan semua (aktif + diarsipkan)
        // default / status === "active": hanya tampilkan pelanggan aktif (is_active === true)
        if (status === "archived") {
            andList.push({ is_active: false });
        } else if (status === "all") {
            // Tampilkan seluruh pelanggan tanpa filter is_active
        } else {
            andList.push({ is_active: true });
        }

        if (search) {
            const trimmedSearch = search.trim();
            const normalizedPhone = normalizePhone(trimmedSearch);
            const orList = [
                { nama: { contains: trimmedSearch } },
                { nomor_telepon: { contains: trimmedSearch } },
            ];
            if (normalizedPhone && normalizedPhone !== trimmedSearch) {
                orList.push({ nomor_telepon: { contains: normalizedPhone } });
            }
            andList.push({ OR: orList });
        }

        if (tipe_kepribadian && tipe_kepribadian !== "all") {
            andList.push({ tipe_kepribadian: tipe_kepribadian });
        }

        if (has_perangkat === "yes") {
            andList.push({ perangkat: { some: {} } });
        } else if (has_perangkat === "no") {
            andList.push({ perangkat: { none: {} } });
        }

        if (andList.length > 0) {
            where = { AND: andList };
        }

        let orderBy = [{ created_at: "desc" }, { id: "desc" }];
        if (sortBy === "created_at_asc") {
            orderBy = [{ created_at: "asc" }, { id: "asc" }];
        } else if (sortBy === "nama_asc") {
            orderBy = [{ nama: "asc" }, { id: "asc" }];
        } else if (sortBy === "nama_desc") {
            orderBy = [{ nama: "desc" }, { id: "desc" }];
        } else if (sortBy === "perangkat_desc") {
            orderBy = [{ perangkat: { _count: "desc" } }, { id: "desc" }];
        } else if (sortBy === "perangkat_asc") {
            orderBy = [{ perangkat: { _count: "asc" } }, { id: "desc" }];
        }

        const includeCustomerRelations = {
            perangkat: {
                include: {
                    tiket_servis: canViewTickets ? {
                        where: visibleTicketScope(req),
                        include: {
                            invoice: hasPermission(req.authorization, "invoices.view") ? { select: { total_biaya: true } } : false
                        }
                    } : false
                }
            }
        };

        if (!isPaginated) {
            const customers = await prisma.customer.findMany({
                where,
                include: includeCustomerRelations,
                orderBy,
            });
            const enriched = customers.map(enrichCustomerWithBadges);
            return res.json(enriched);
        }

        const [total, customers, totalActive, totalArchived] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                include: includeCustomerRelations,
                orderBy,
                skip,
                take: limit,
            }),
            prisma.customer.count({ where: { is_active: true } }).catch(() => 0),
            prisma.customer.count({ where: { is_active: false } }).catch(() => 0),
        ]);

        const enriched = customers.map(enrichCustomerWithBadges);
        return res.json(buildPaginationResponse(enriched, total, page, limit, {
            counts: {
                totalActive,
                totalArchived,
                totalAll: (totalActive || 0) + (totalArchived || 0),
            }
        }));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil data customer berdasarkan ID
async function getById(req, res) {
    try {
        const canViewTickets = hasPermission(req.authorization, "tickets.view");
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID customer tidak valid" });
        }

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                perangkat: {
                    include: {
                        tiket_servis: canViewTickets ? {
                            where: visibleTicketScope(req),
                            include: {
                                teknisi: { select: { id: true, nama: true } },
                                invoice: hasPermission(req.authorization, "invoices.view") ? { select: { id: true, total_biaya: true } } : false
                            },
                            orderBy: { created_at: "desc" }
                        } : false,
                        _count: canViewTickets ? { select: { tiket_servis: { where: visibleTicketScope(req) } } } : false
                    },
                    orderBy: { created_at: "desc" }
                },
            },
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        // Hitung ringkasan statistik
        let totalTiket = 0;
        let totalBelanja = 0;
        const allTikets = [];

        (customer.perangkat || []).forEach(p => {
            totalTiket += (p.tiket_servis || []).length;
            (p.tiket_servis || []).forEach(t => {
                allTikets.push({
                    ...t,
                    perangkat_id: p.id,
                    perangkat_merek: p.merek,
                    perangkat_model: p.model,
                    perangkat_sn: p.serial_number,
                    jenis_perangkat: p.jenis_perangkat
                });
                if (t.invoice?.total_biaya) {
                    totalBelanja += t.invoice.total_biaya;
                }
            });
        });

        allTikets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const { stats, badges } = computeCustomerStatsAndBadges({
            totalPerangkat: (customer.perangkat || []).length,
            tikets: allTikets,
            totalBelanja,
            customBadges: customer.custom_badges
        });

        return res.json({
            ...customer,
            stats,
            badges,
            riwayat_servis: allTikets
        });
    } catch (error) {
        console.error("Error getById customer:", error);
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menambahkan customer baru (dengan proteksi duplikasi & normalisasi format)
async function create(req, res) {
    try {
        const { nama, nomor_telepon, alamat, tipe_kepribadian, catatan_khusus, allow_existing } = req.body;

        const cleanNama = normalizeName(nama);
        const cleanPhone = normalizePhone(nomor_telepon);
        const cleanAlamat = alamat ? normalizeText(alamat) : null;

        if (!cleanNama || !cleanPhone) {
            return res.status(400).json({ message: "Nama dan nomor telepon wajib diisi" });
        }

        // Cek proteksi duplikasi: apakah nomor telepon sudah terdaftar
        const existing = await prisma.customer.findFirst({
            where: { nomor_telepon: cleanPhone },
            include: { perangkat: true }
        });

        if (existing) {
            // Jika allow_existing = true (misal dari Quick-Register di intake form tiket servis),
            // gunakan kembali profil pelanggan yang ada tanpa membuat record duplikat.
            if (allow_existing) {
                return res.status(200).json({
                    message: `Customer dengan nomor ${cleanPhone} sudah terdaftar atas nama "${existing.nama}". Data riwayat dikaitkan otomatis.`,
                    data: existing,
                    isExisting: true
                });
            }

            // Jika diakses dari modul Manajemen Customer standar (tambah manual), berikan notifikasi 409 Conflict
            return res.status(409).json({
                message: `Nomor WhatsApp ${cleanPhone} sudah terdaftar atas nama "${existing.nama}" (ID: #${existing.id}). Gunakan data yang ada atau perbarui profil pelanggan tersebut.`,
                data: existing,
                isExisting: true
            });
        }

        const customer = await prisma.customer.create({
            data: { 
                nama: cleanNama, 
                nomor_telepon: cleanPhone, 
                alamat: cleanAlamat,
                tipe_kepribadian: tipe_kepribadian || "Netral",
                catatan_khusus: catatan_khusus ? normalizeText(catatan_khusus) : null
            },
        });

        return res.status(201).json({ message: "Customer berhasil ditambahkan", data: customer, isExisting: false });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui data customer
async function update(req, res) {
    try {
        const { nama, nomor_telepon, alamat, tipe_kepribadian, catatan_khusus } = req.body;
        const id = Number(req.params.id);

        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        const cleanNama = nama ? normalizeName(nama) : undefined;
        const cleanPhone = nomor_telepon ? normalizePhone(nomor_telepon) : undefined;
        const cleanAlamat = alamat !== undefined ? (alamat ? normalizeText(alamat) : null) : undefined;

        // Jika nomor telepon diubah, pastikan tidak bentrok dengan customer lain
        if (cleanPhone && cleanPhone !== existing.nomor_telepon) {
            const phoneConflict = await prisma.customer.findFirst({
                where: {
                    nomor_telepon: cleanPhone,
                    id: { not: id }
                }
            });
            if (phoneConflict) {
                return res.status(409).json({
                    message: `Nomor telepon ${cleanPhone} sudah digunakan oleh customer "${phoneConflict.nama}" (ID: #${phoneConflict.id}).`
                });
            }
        }

        const updateData = {
            nama: cleanNama, 
            nomor_telepon: cleanPhone, 
            alamat: cleanAlamat,
            tipe_kepribadian: tipe_kepribadian !== undefined ? tipe_kepribadian : undefined,
            catatan_khusus: catatan_khusus !== undefined ? (catatan_khusus ? normalizeText(catatan_khusus) : null) : undefined
        };

        if (req.body.custom_badges !== undefined) {
            updateData.custom_badges = req.body.custom_badges === null 
                ? Prisma.DbNull 
                : (Array.isArray(req.body.custom_badges) ? req.body.custom_badges : []);
        }

        const customer = await prisma.customer.update({
            where: { id },
            data: updateData,
        });

        return res.json({ message: "Customer berhasil diperbarui", data: customer });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui badge reputasi customer secara manual (bisa memilih beberapa atau menghapus semua)
async function updateBadges(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "ID customer tidak valid" });
        }

        const existing = await prisma.customer.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        const { badges } = req.body;
        let validBadgeList = null;
        if (req.body.reset) {
            validBadgeList = null;
        } else if (badges !== undefined && badges !== null) {
            if (Array.isArray(badges)) {
                validBadgeList = badges;
            } else if (typeof badges === "string") {
                try {
                    validBadgeList = JSON.parse(badges);
                } catch {
                    validBadgeList = [badges];
                }
            } else {
                validBadgeList = [];
            }
        } else {
            validBadgeList = [];
        }

        const jsonVal = validBadgeList === null ? Prisma.DbNull : validBadgeList;

        let updated;
        try {
            updated = await prisma.customer.update({
                where: { id },
                data: {
                    custom_badges: jsonVal
                },
                include: {
                    perangkat: {
                        include: {
                            tiket_servis: {
                                include: {
                                    invoice: { select: { total_biaya: true } }
                                }
                            }
                        }
                    }
                }
            });
        } catch (dbErr) {
            console.warn("Retrying customer badge update with raw column ensure:", dbErr.message);
            // Defensif: pastikan kolom custom_badges ada jika terjadi mismatch skema lokal
            try {
                for (const tbl of ["Customer", "customer"]) {
                    await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN custom_badges JSON NULL;`).catch(() => {});
                }
            } catch {}
            updated = await prisma.customer.update({
                where: { id },
                data: {
                    custom_badges: jsonVal
                },
                include: {
                    perangkat: {
                        include: {
                            tiket_servis: {
                                include: {
                                    invoice: { select: { total_biaya: true } }
                                }
                            }
                        }
                    }
                }
            });
        }

        const enriched = enrichCustomerWithBadges(updated);

        return res.json({
            message: "Badge reputasi pelanggan berhasil diperbarui",
            badges: validBadgeList,
            customer: enriched
        });
    } catch (error) {
        console.error("Error updateBadges:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat menyimpan badge", error: error.message });
    }
}

// Menghapus / Mengarsipkan customer (Soft Delete)
async function remove(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID customer tidak valid" });
        }

        const existing = await prisma.customer.findUnique({
            where: { id },
            include: {
                perangkat: {
                    include: {
                        tiket_servis: { select: { id: true, nomor_tiket: true } }
                    }
                },
                peminjaman_loaner: { select: { id: true } }
            }
        });

        if (!existing) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        const totalTickets = (existing.perangkat || []).reduce((acc, p) => acc + (p.tiket_servis || []).length, 0);
        const totalLoaners = (existing.peminjaman_loaner || []).length;
        const forceHardDelete = req.query.force === "true";

        // Jika customer memiliki riwayat tiket servis atau peminjaman unit:
        // Lakukan Soft Delete (Arsipkan) demi integritas audit & keuangan
        if (totalTickets > 0 || totalLoaners > 0 || !forceHardDelete) {
            await prisma.customer.update({
                where: { id },
                data: {
                    is_active: false,
                    deleted_at: new Date()
                }
            });

            return res.json({
                message: totalTickets > 0
                    ? `Pelanggan "${existing.nama}" berhasil diarsipkan (Status Nonaktif). Riwayat ${totalTickets} tiket servis & audit keuangan tetap aman tersimpan.`
                    : `Pelanggan "${existing.nama}" berhasil diarsipkan.`,
                isArchived: true,
                data: { id, is_active: false }
            });
        }

        // Jika tidak memiliki riwayat tiket/loaner sama sekali dan force = true:
        if (existing.perangkat && existing.perangkat.length > 0) {
            await prisma.perangkat.deleteMany({ where: { customer_id: id } });
        }
        await prisma.customer.delete({ where: { id } });

        return res.json({
            message: `Customer "${existing.nama}" berhasil dihapus permanen.`,
            isDeleted: true
        });
    } catch (error) {
        console.error("Error remove customer:", error);
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengaktifkan kembali customer yang diarsipkan (Restore)
async function restore(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID customer tidak valid" });
        }

        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        const updated = await prisma.customer.update({
            where: { id },
            data: {
                is_active: true,
                deleted_at: null
            }
        });

        return res.json({
            message: `Pelanggan "${updated.nama}" berhasil diaktifkan kembali.`,
            data: updated
        });
    } catch (error) {
        console.error("Error restore customer:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat mengaktifkan pelanggan", error: error.message });
    }
}

module.exports = { getAll, getById, create, update, remove, restore, updateBadges };
