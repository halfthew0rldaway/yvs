const prisma = require("../config/database");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { normalizePhone, normalizeName, normalizeText } = require("../utils/normalize");
const { computeCustomerStatsAndBadges } = require("../utils/customerBadges");

function enrichCustomerWithBadges(c) {
    const allTikets = [];
    let totalBelanja = 0;
    (c.perangkat || []).forEach(p => {
        (p.tiket_servis || []).forEach(t => {
            allTikets.push(t);
            if (t.invoice?.total_biaya) {
                totalBelanja += t.invoice.total_biaya;
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
        stats,
        badges
    };
}

// Mengambil seluruh data customer dengan pencarian dan paginasi
async function getAll(req, res) {
    try {
        const { search } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);

        let where = {};
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
            where = { OR: orList };
        }

        const includeCustomerRelations = {
            perangkat: {
                include: {
                    tiket_servis: {
                        select: {
                            id: true,
                            status: true,
                            is_revisi_acc: true,
                            jml_revisi_acc: true,
                            invoice: { select: { total_biaya: true } }
                        }
                    }
                }
            }
        };

        if (!isPaginated) {
            const customers = await prisma.customer.findMany({
                where,
                include: includeCustomerRelations,
                orderBy: [{ created_at: "desc" }, { id: "desc" }],
            });
            const enriched = customers.map(enrichCustomerWithBadges);
            return res.json(enriched);
        }

        const [total, customers] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                include: includeCustomerRelations,
                orderBy: [{ created_at: "desc" }, { id: "desc" }],
                skip,
                take: limit,
            }),
        ]);

        const enriched = customers.map(enrichCustomerWithBadges);
        return res.json(buildPaginationResponse(enriched, total, page, limit));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil data customer berdasarkan ID
async function getById(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID customer tidak valid" });
        }

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                perangkat: {
                    include: {
                        tiket_servis: {
                            include: {
                                teknisi: { select: { id: true, nama: true } },
                                invoice: { select: { id: true, total_biaya: true } }
                            },
                            orderBy: { created_at: "desc" }
                        },
                        _count: {
                            select: { tiket_servis: true }
                        }
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
            totalTiket += p._count?.tiket_servis || 0;
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
            updateData.custom_badges = Array.isArray(req.body.custom_badges) ? req.body.custom_badges : [];
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

        let updated;
        try {
            updated = await prisma.customer.update({
                where: { id },
                data: {
                    custom_badges: validBadgeList
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
                await prisma.$executeRawUnsafe(`ALTER TABLE Customer ADD COLUMN IF NOT EXISTS custom_badges JSON NULL;`);
            } catch (rawErr) {
                try {
                    await prisma.$executeRawUnsafe(`ALTER TABLE customer ADD COLUMN IF NOT EXISTS custom_badges JSON NULL;`);
                } catch {}
            }
            updated = await prisma.customer.update({
                where: { id },
                data: {
                    custom_badges: validBadgeList
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

// Menghapus customer
async function remove(req, res) {
    try {
        const id = Number(req.params.id);

        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        // Proteksi integritas: Cegah penghapusan jika customer memiliki tiket servis
        const existingTiket = await prisma.tiketServis.findFirst({
            where: {
                perangkat: { customer_id: id }
            }
        });
        if (existingTiket) {
            return res.status(400).json({
                message: "Customer tidak dapat dihapus karena memiliki riwayat tiket servis dan perbaikan pada sistem demi integritas audit dan data keuangan."
            });
        }

        await prisma.customer.delete({ where: { id } });

        return res.json({ message: "Customer berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, getById, create, update, remove, updateBadges };
