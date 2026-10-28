const prisma = require("../config/database");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { normalizeText } = require("../utils/normalize");

// Mengambil seluruh data sparepart
async function getAll(req, res) {
    try {
        const { search, brand_id, kategori, stokStatus, sortBy, sortOrder } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);
        const where = {};

        if (search) {
            where.OR = [
                { nama: { contains: search } },
                { kategori: { contains: search } },
                { brand: { nama: { contains: search } } },
            ];
        }

        if (brand_id) {
            where.brand_id = Number(brand_id);
        }

        if (kategori) {
            where.kategori = kategori;
        }

        if (stokStatus === "habis") {
            where.stok = 0;
        } else if (stokStatus === "menipis") {
            where.stok = { gt: 0, lte: 5 };
        } else if (stokStatus === "aman") {
            where.stok = { gt: 5 };
        }

        let orderBy = [{ created_at: "desc" }, { id: "desc" }];
        if (sortBy === "nama") {
            orderBy = [{ nama: sortOrder === "desc" ? "desc" : "asc" }, { id: "asc" }];
        } else if (sortBy === "stok") {
            orderBy = [{ stok: sortOrder === "asc" ? "asc" : "desc" }, { id: "desc" }];
        } else if (sortBy === "harga") {
            orderBy = [{ harga: sortOrder === "asc" ? "asc" : "desc" }, { id: "desc" }];
        }

        const include = { brand: true };
        const isTeknisi = req.user?.role === "teknisi";

        if (!isPaginated) {
            const spareparts = await prisma.sparepart.findMany({
                where,
                include,
                orderBy,
            });
            const sanitized = isTeknisi
                ? spareparts.map(s => {
                    const { harga_beli, ...rest } = s;
                    return rest;
                })
                : spareparts;
            return res.json(sanitized);
        }

        const [total, spareparts, allForSummary] = await Promise.all([
            prisma.sparepart.count({ where }),
            prisma.sparepart.findMany({
                where,
                include,
                orderBy,
                skip,
                take: limit,
            }),
            prisma.sparepart.findMany({
                select: { stok: true, harga_beli: true }
            }),
        ]);

        let totalStok = 0;
        let totalNilaiAset = 0;
        allForSummary.forEach(s => {
            totalStok += s.stok || 0;
            totalNilaiAset += (s.stok || 0) * (s.harga_beli || 0);
        });

        const sanitizedList = isTeknisi
            ? spareparts.map(s => {
                const { harga_beli, ...rest } = s;
                return rest;
            })
            : spareparts;

        const summary = isTeknisi
            ? { totalStok }
            : { totalStok, totalNilaiAset };

        return res.json(buildPaginationResponse(sanitizedList, total, page, limit, {
            summary
        }));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menambahkan sparepart baru (dengan proteksi duplikasi nama per brand)
async function create(req, res) {
    try {
        const { 
            nama, 
            kategori, 
            stok, 
            harga, 
            harga_beli, 
            brand_id, 
            supplier_nama, 
            nomor_faktur, 
            tanggal_beli, 
            catatan,
            has_garansi_distri,
            tipe_garansi_distri,
            sistem_perhitungan_garansi,
            distributor_nama,
            distributor_kontak,
            kebijakan_klaim
        } = req.body;

        if (!brand_id) {
            return res.status(400).json({ message: "Brand wajib dipilih" });
        }

        const cleanNama = normalizeText(nama);
        if (!cleanNama) {
            return res.status(400).json({ message: "Nama sparepart wajib diisi" });
        }

        // Cek apakah item sparepart ini sudah terdaftar pada brand yang sama
        const existing = await prisma.sparepart.findFirst({
            where: {
                brand_id: Number(brand_id),
                nama: cleanNama
            },
            include: { brand: true }
        });

        if (existing) {
            return res.status(409).json({
                message: `Sparepart "${cleanNama}" untuk brand "${existing.brand?.nama || 'ini'}" sudah terdaftar (ID: #${existing.id}, Stok saat ini: ${existing.stok}). Silakan gunakan fitur 'Restock' untuk menambah stok barang ini tanpa membuat item duplikat.`,
                data: existing
            });
        }

        const initialStok = Number(stok) || 0;
        const initialHpp = harga_beli !== undefined ? Number(harga_beli) : Math.round(Number(harga) * 0.7);

        const sparepart = await prisma.sparepart.create({
            data: { 
                nama: cleanNama, 
                brand_id: Number(brand_id),
                kategori: kategori || "Umum", 
                stok: initialStok, 
                harga: Number(harga),
                harga_beli: initialHpp,
                has_garansi_distri: Boolean(has_garansi_distri),
                tipe_garansi_distri: tipe_garansi_distri || null,
                sistem_perhitungan_garansi: sistem_perhitungan_garansi || null,
                distributor_nama: distributor_nama ? distributor_nama.trim() : (supplier_nama ? supplier_nama.trim() : null),
                distributor_kontak: distributor_kontak ? distributor_kontak.trim() : null,
                kebijakan_klaim: kebijakan_klaim ? kebijakan_klaim.trim() : null
            },
            include: { brand: true }
        });

        // Audit Trail Pengadaan: Jika stok awal > 0, catat RestockLog
        if (initialStok > 0) {
            const parsedTanggalBeli = tanggal_beli ? new Date(tanggal_beli) : new Date();
            await prisma.restockLog.create({
                data: {
                    sparepart_id: sparepart.id,
                    supplier_nama: supplier_nama || "Stok Awal Inventaris",
                    jumlah_masuk: initialStok,
                    harga_beli_pcs: initialHpp,
                    nomor_faktur: nomor_faktur || `INIT-${sparepart.id}`,
                    tanggal_beli: isNaN(parsedTanggalBeli.getTime()) ? new Date() : parsedTanggalBeli,
                    catatan: catatan || "Stok awal saat pendaftaran item sparepart baru",
                    user_id: req.user?.id || null,
                    user_nama: req.user?.nama || "Admin",
                }
            });
        }

        return res.status(201).json({ message: "Sparepart berhasil ditambahkan", data: sparepart });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui data sparepart
async function update(req, res) {
    try {
        const { 
            nama, 
            kategori, 
            stok, 
            harga, 
            harga_beli, 
            brand_id,
            has_garansi_distri,
            tipe_garansi_distri,
            sistem_perhitungan_garansi,
            distributor_nama,
            distributor_kontak,
            kebijakan_klaim
        } = req.body;
        const id = Number(req.params.id);

        const existing = await prisma.sparepart.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Sparepart tidak ditemukan" });
        }

        const sparepart = await prisma.sparepart.update({
            where: { id },
            data: {
                nama: nama || undefined,
                brand_id: brand_id ? Number(brand_id) : undefined,
                kategori: kategori || undefined,
                stok: stok !== undefined ? Number(stok) : undefined,
                harga: harga !== undefined ? Number(harga) : undefined,
                harga_beli: harga_beli !== undefined ? Number(harga_beli) : undefined,
                has_garansi_distri: has_garansi_distri !== undefined ? Boolean(has_garansi_distri) : undefined,
                tipe_garansi_distri: tipe_garansi_distri !== undefined ? tipe_garansi_distri : undefined,
                sistem_perhitungan_garansi: sistem_perhitungan_garansi !== undefined ? sistem_perhitungan_garansi : undefined,
                distributor_nama: distributor_nama !== undefined ? (distributor_nama ? distributor_nama.trim() : null) : undefined,
                distributor_kontak: distributor_kontak !== undefined ? (distributor_kontak ? distributor_kontak.trim() : null) : undefined,
                kebijakan_klaim: kebijakan_klaim !== undefined ? (kebijakan_klaim ? kebijakan_klaim.trim() : null) : undefined
            },
            include: { brand: true }
        });

        return res.json({ message: "Sparepart berhasil diperbarui", data: sparepart });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menghapus sparepart
async function remove(req, res) {
    try {
        const id = Number(req.params.id);

        const existing = await prisma.sparepart.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Sparepart tidak ditemukan" });
        }

        // Proteksi integritas: Cegah penghapusan jika sparepart memiliki riwayat pemakaian
        const existingUsage = await prisma.penggunaanSparepart.findFirst({
            where: { sparepart_id: id }
        });
        if (existingUsage) {
            return res.status(400).json({
                message: "Suku cadang tidak dapat dihapus karena memiliki riwayat pemakaian pada tiket servis. Anda dapat mengubah stok menjadi 0 jika suku cadang sudah tidak digunakan."
            });
        }

        await prisma.sparepart.delete({ where: { id } });

        return res.json({ message: "Sparepart berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Quick Restock: Menambah stok langsung dengan catatan pengadaan
async function restock(req, res) {
    try {
        const id = Number(req.params.id);
        const { jumlah_masuk, harga_beli_baru, supplier_nama, nomor_faktur, tanggal_beli, catatan } = req.body;

        const qty = Number(jumlah_masuk);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: "Jumlah barang masuk harus berupa angka positif minimal 1" });
        }

        const existing = await prisma.sparepart.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Sparepart tidak ditemukan" });
        }

        const hppPerPcs = (harga_beli_baru !== undefined && Number(harga_beli_baru) > 0) 
            ? Number(harga_beli_baru) 
            : existing.harga_beli;

        const updateData = {
            stok: { increment: qty }
        };

        if (harga_beli_baru !== undefined && Number(harga_beli_baru) > 0) {
            updateData.harga_beli = Number(harga_beli_baru);
        }

        const updated = await prisma.sparepart.update({
            where: { id },
            data: updateData,
            include: { brand: true }
        });

        // Simpan ke log audit pengadaan RestockLog
        const parsedTanggalBeli = tanggal_beli ? new Date(tanggal_beli) : new Date();
        const restockLog = await prisma.restockLog.create({
            data: {
                sparepart_id: id,
                supplier_nama: supplier_nama || null,
                jumlah_masuk: qty,
                harga_beli_pcs: hppPerPcs,
                nomor_faktur: nomor_faktur || null,
                tanggal_beli: isNaN(parsedTanggalBeli.getTime()) ? new Date() : parsedTanggalBeli,
                catatan: catatan || null,
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
            }
        });

        // Catat activity log
        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
                action: `Restock +${qty} unit (${existing.nama}) dari ${supplier_nama || "Supplier"}`,
                entity: `Sparepart #${id}`
            }
        });

        return res.json({ 
            message: `Berhasil menambah ${qty} unit stok untuk ${existing.nama}`,
            data: updated,
            restock_log: restockLog
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan saat restock", error: error.message });
    }
}

// Mengambil riwayat pengadaan dan restok untuk sparepart tertentu
async function getRestockHistory(req, res) {
    try {
        const id = Number(req.params.id);

        const logs = await prisma.restockLog.findMany({
            where: { sparepart_id: id },
            orderBy: { created_at: "desc" },
            include: {
                sparepart: { select: { id: true, nama: true, kategori: true, brand: true } },
                user: { select: { id: true, nama: true, role: true } }
            }
        });

        return res.json(logs);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan saat mengambil riwayat restok", error: error.message });
    }
}

// Mengambil seluruh riwayat pengadaan dan restok (Audit Pengadaan Global)
async function getAllRestockLogs(req, res) {
    try {
        const { search, supplier, startDate, endDate } = req.query;
        const where = {};

        if (supplier && supplier !== "all") {
            where.supplier_nama = { equals: supplier, mode: "insensitive" };
        }

        if (startDate || endDate) {
            where.tanggal_beli = {};
            if (startDate) {
                where.tanggal_beli.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.tanggal_beli.lte = end;
            }
        }

        if (search && search.trim() !== "") {
            const q = search.trim();
            where.OR = [
                { nomor_faktur: { contains: q, mode: "insensitive" } },
                { supplier_nama: { contains: q, mode: "insensitive" } },
                { catatan: { contains: q, mode: "insensitive" } },
                { user_nama: { contains: q, mode: "insensitive" } },
                { sparepart: { nama: { contains: q, mode: "insensitive" } } },
            ];
        }

        const logs = await prisma.restockLog.findMany({
            where,
            orderBy: { created_at: "desc" },
            include: {
                sparepart: { select: { id: true, nama: true, kategori: true, brand: true } },
                user: { select: { id: true, nama: true, role: true } }
            },
            take: 500
        });

        return res.json(logs);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan saat mengambil log pengadaan", error: error.message });
    }
}

// Mengambil riwayat penggunaan sparepart di seluruh tiket servis
async function getUsageHistory(req, res) {
    try {
        const id = Number(req.params.id);

        const sparepart = await prisma.sparepart.findUnique({
            where: { id },
            include: {
                brand: true,
                penggunaan_sparepart: {
                    include: {
                        tiket: {
                            include: {
                                perangkat: { include: { customer: true } },
                                teknisi: { select: { nama: true } },
                                invoice: { select: { total_biaya: true } }
                            }
                        }
                    },
                    orderBy: {
                        id: "desc"
                    }
                }
            }
        });

        if (!sparepart) {
            return res.status(404).json({ message: "Sparepart tidak ditemukan" });
        }

        const totalTerpakai = sparepart.penggunaan_sparepart.reduce((sum, p) => sum + p.jumlah, 0);

        return res.json({
            sparepart: {
                id: sparepart.id,
                nama: sparepart.nama,
                kategori: sparepart.kategori,
                stok: sparepart.stok,
                harga: sparepart.harga,
                harga_beli: sparepart.harga_beli,
                brand: sparepart.brand?.nama || "Umum",
                totalTerpakai
            },
            history: sparepart.penggunaan_sparepart.map(p => ({
                id: p.id,
                jumlah: p.jumlah,
                tiket_id: p.tiket.id,
                nomor_tiket: p.tiket.nomor_tiket,
                status_tiket: p.tiket.status,
                perangkat: `${p.tiket.perangkat.merek} ${p.tiket.perangkat.model}`,
                customer: p.tiket.perangkat.customer?.nama || "-",
                teknisi: p.tiket.teknisi?.nama || "Belum ditugaskan",
                tanggal: p.tiket.created_at
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menggunakan sparepart pada tiket (dengan pengurangan stok otomatis, validasi atomik, dan sinkronisasi invoice)
async function use(req, res) {
    try {
        const { tiket_id, sparepart_id, jumlah } = req.body;
        const qty = Number(jumlah);

        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: "Jumlah penggunaan sparepart harus lebih besar dari 0" });
        }

        const tiket = await prisma.tiketServis.findUnique({ where: { id: Number(tiket_id) } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        if (tiket.status !== "dalam_perbaikan") {
            return res.status(400).json({ message: "Penambahan suku cadang hanya dapat dilakukan saat tiket dalam status 'Dalam Perbaikan'" });
        }

        if (req.user.role === "teknisi" && tiket.teknisi_id !== req.user.id) {
            return res.status(403).json({ message: "Akses ditolak: Ini bukan tiket Anda." });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Cek stok terbaru di dalam transaksi untuk mencegah race condition
            const currentSparepart = await tx.sparepart.findUnique({ where: { id: Number(sparepart_id) } });
            if (!currentSparepart) {
                throw new Error("Sparepart tidak ditemukan");
            }
            if (currentSparepart.stok < qty) {
                throw new Error(`Stok sparepart tidak mencukupi (sisa ${currentSparepart.stok})`);
            }

            // Kurangi stok sparepart
            await tx.sparepart.update({
                where: { id: Number(sparepart_id) },
                data: { stok: { decrement: qty } },
            });

            // Upsert penggunaan: jika sudah pernah ditambahkan, tambahkan jumlahnya
            const penggunaan = await tx.penggunaanSparepart.upsert({
                where: {
                    tiket_id_sparepart_id: {
                        tiket_id: Number(tiket_id),
                        sparepart_id: Number(sparepart_id),
                    }
                },
                update: {
                    jumlah: { increment: qty },
                },
                create: {
                    tiket_id: Number(tiket_id),
                    sparepart_id: Number(sparepart_id),
                    jumlah: qty,
                },
            });

            // Sinkronisasi invoice jika sudah pernah diterbitkan sebelumnya
            const existingInvoice = await tx.invoice.findUnique({ where: { tiket_id: Number(tiket_id) } });
            if (existingInvoice) {
                const allPenggunaan = await tx.penggunaanSparepart.findMany({
                    where: { tiket_id: Number(tiket_id) },
                    include: { sparepart: true }
                });
                const biaya_sparepart = allPenggunaan.reduce((sum, p) => sum + (p.sparepart.harga * p.jumlah), 0);
                const total_biaya = existingInvoice.biaya_jasa + biaya_sparepart;
                await tx.invoice.update({
                    where: { id: existingInvoice.id },
                    data: { biaya_sparepart, total_biaya }
                });
            }

            return penggunaan;
        });

        return res.status(201).json({ message: "Sparepart berhasil digunakan", data: result });
    } catch (error) {
        return res.status(400).json({ message: error.message || "Terjadi kesalahan saat mencatat suku cadang" });
    }
}

// Membatalkan atau menghapus penggunaan sparepart dan mengembalikan stok ke gudang
async function removeUsage(req, res) {
    try {
        const id = Number(req.params.id);
        const penggunaan = await prisma.penggunaanSparepart.findUnique({
            where: { id },
            include: { tiket: true, sparepart: true }
        });

        if (!penggunaan) {
            return res.status(404).json({ message: "Catatan penggunaan sparepart tidak ditemukan" });
        }

        if (penggunaan.tiket.status !== "dalam_perbaikan") {
            return res.status(400).json({ message: "Penggunaan suku cadang hanya dapat dibatalkan saat tiket dalam status 'Dalam Perbaikan'" });
        }

        if (req.user.role === "teknisi" && penggunaan.tiket.teknisi_id !== req.user.id) {
            return res.status(403).json({ message: "Akses ditolak: Ini bukan tiket Anda." });
        }

        await prisma.$transaction(async (tx) => {
            // Kembalikan stok sparepart
            await tx.sparepart.update({
                where: { id: penggunaan.sparepart_id },
                data: { stok: { increment: penggunaan.jumlah } }
            });

            // Hapus penggunaan
            await tx.penggunaanSparepart.delete({ where: { id } });

            // Update invoice jika sudah terbit
            const existingInvoice = await tx.invoice.findUnique({ where: { tiket_id: penggunaan.tiket_id } });
            if (existingInvoice) {
                const remainingPenggunaan = await tx.penggunaanSparepart.findMany({
                    where: { tiket_id: penggunaan.tiket_id },
                    include: { sparepart: true }
                });
                const biaya_sparepart = remainingPenggunaan.reduce((sum, p) => sum + (p.sparepart.harga * p.jumlah), 0);
                const total_biaya = existingInvoice.biaya_jasa + biaya_sparepart;
                await tx.invoice.update({
                    where: { id: existingInvoice.id },
                    data: { biaya_sparepart, total_biaya }
                });
            }
        });

        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
                action: `Membatalkan pemakaian ${penggunaan.jumlah}x ${penggunaan.sparepart.nama} pada tiket #${penggunaan.tiket.nomor_tiket} (stok dikembalikan)`,
                entity: `Tiket #${penggunaan.tiket.nomor_tiket}`
            }
        });

        return res.json({ message: "Penggunaan sparepart berhasil dibatalkan dan stok dikembalikan" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan saat membatalkan sparepart", error: error.message });
    }
}

// Generator Manifest Belanja / Restock Kebutuhan Suku Cadang ke Supplier
async function getRestockManifest(req, res) {
    try {
        // 1. Dapatkan semua sparepart dengan stok <= 5 (menipis atau habis)
        const lowStockParts = await prisma.sparepart.findMany({
            where: { stok: { lte: 5 } },
            include: {
                brand: true,
                restock_logs: {
                    orderBy: { created_at: "desc" },
                    take: 1
                }
            },
            orderBy: [{ stok: "asc" }, { nama: "asc" }]
        });

        // 2. Dapatkan sparepart yang saat ini sedang aktif dibutuhkan pada tiket berstatus disetujui atau dalam_perbaikan
        const activeUsage = await prisma.penggunaanSparepart.findMany({
            where: {
                tiket: {
                    status: { in: ["disetujui", "dalam_perbaikan"] }
                }
            },
            include: {
                sparepart: {
                    include: { brand: true }
                },
                tiket: {
                    select: { nomor_tiket: true, status: true }
                }
            }
        });

        const activeDemandMap = {};
        activeUsage.forEach(usage => {
            const sid = usage.sparepart_id;
            if (!activeDemandMap[sid]) {
                activeDemandMap[sid] = {
                    totalNeeded: 0,
                    ticketNumbers: []
                };
            }
            activeDemandMap[sid].totalNeeded += usage.jumlah;
            if (!activeDemandMap[sid].ticketNumbers.includes(usage.tiket.nomor_tiket)) {
                activeDemandMap[sid].ticketNumbers.push(usage.tiket.nomor_tiket);
            }
        });

        // 3. Format items
        const manifestItems = lowStockParts.map(item => {
            const demand = activeDemandMap[item.id] || { totalNeeded: 0, ticketNumbers: [] };
            const lastLog = item.restock_logs?.[0] || null;

            let suggestedQty = 5;
            if (item.stok === 0) {
                suggestedQty = Math.max(5, demand.totalNeeded + 3);
            } else if (item.stok <= 2) {
                suggestedQty = 5;
            } else {
                suggestedQty = 3;
            }

            let urgency = "menipis";
            if (item.stok === 0) urgency = "habis";
            if (demand.totalNeeded > 0) urgency = "urgent_tiket";

            return {
                id: item.id,
                nama: item.nama,
                brand_id: item.brand_id,
                brand_nama: item.brand?.nama || "Umum",
                kategori: item.kategori,
                stok: item.stok,
                harga_beli: item.harga_beli,
                harga_jual: item.harga,
                urgency,
                demand_active: demand.totalNeeded,
                demand_tickets: demand.ticketNumbers,
                suggested_qty: suggestedQty,
                last_supplier: lastLog?.supplier_nama || null,
                last_buy_price: lastLog?.harga_beli_pcs || item.harga_beli,
                last_restock_at: lastLog?.created_at || null
            };
        });

        // Dapatkan juga supplier unik dari riwayat
        const suppliers = await prisma.restockLog.findMany({
            where: { supplier_nama: { not: null } },
            select: { supplier_nama: true },
            distinct: ["supplier_nama"]
        });
        const supplierList = suppliers
            .map(s => s.supplier_nama?.trim())
            .filter(s => s && s.toLowerCase() !== "stok awal inventaris");

        return res.json({
            manifest_items: manifestItems,
            total_items_to_restock: manifestItems.length,
            suppliers: [...new Set(supplierList)]
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan saat memuat manifest belanja", error: error.message });
    }
}

// Mengirimkan notifikasi dan pengingat restock sparepart menipis ke Admin
async function reminderRestock(req, res) {
    try {
        const { id } = req.params;
        const sparepart = await prisma.sparepart.findUnique({
            where: { id: Number(id) },
            include: { brand: true }
        });

        if (!sparepart) {
            return res.status(404).json({ message: "Sparepart tidak ditemukan" });
        }

        const brandName = sparepart.brand?.nama ? `${sparepart.brand.nama} ` : "";
        const fullName = `${brandName}${sparepart.nama}`;
        const senderNama = req.user?.nama || "Teknisi";
        const senderId = req.user?.id || null;

        const actionText = `Pengingat Restock: Teknisi ${senderNama} mengingatkan bahwa stok sparepart "${fullName}" menipis (sisa: ${sparepart.stok} unit)`;

        // 1. Simpan ke ActivityLog untuk audit trail
        await prisma.activityLog.create({
            data: {
                user_id: senderId,
                user_nama: senderNama,
                action: actionText,
                entity: "sparepart"
            }
        });

        // 2. Simpan ke Notification untuk Admin
        let notif = null;
        try {
            notif = await prisma.notification.create({
                data: {
                    recipient_role: "admin",
                    sender_id: senderId,
                    sender_nama: senderNama,
                    tipe: "restock_sparepart",
                    judul: `Stok Menipis: ${fullName}`,
                    pesan: `Teknisi ${senderNama} meminta restock untuk suku cadang "${fullName}". Stok saat ini tersisa ${sparepart.stok} unit di gudang.`,
                    link: "/sparepart"
                }
            });
        } catch (e) {
            // Silently proceed if table is in sync process
        }

        const waText = `Halo Admin Serv.io, saya ${senderNama} ingin menginfokan bahwa stok sparepart *${fullName}* saat ini sudah menipis (tersisa *${sparepart.stok} unit*). Mohon bantuan pengadaan / restock suku cadang tersebut. Terima kasih!`;

        return res.json({
            message: `Pengingat restock untuk ${fullName} berhasil dikirim ke Admin`,
            sparepart_id: sparepart.id,
            nama: fullName,
            stok: sparepart.stok,
            wa_text: waText,
            notification: notif
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { 
    getAll, 
    create, 
    update, 
    remove, 
    use, 
    removeUsage, 
    restock, 
    getUsageHistory, 
    getRestockHistory, 
    getAllRestockLogs,
    getRestockManifest,
    reminderRestock
};

