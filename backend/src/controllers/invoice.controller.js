const prisma = require("../config/database");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { broadcast } = require("../utils/sse");

// Mengambil seluruh invoice
async function getAll(req, res) {
    try {
        const { search, startDate, endDate } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);
        const where = {};

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.created_at.lte = end;
            }
        }

        if (search) {
            where.OR = [
                { tiket: { nomor_tiket: { contains: search } } },
                { tiket: { perangkat: { customer: { nama: { contains: search } } } } },
            ];
        }

        const include = {
            tiket: {
                include: {
                    perangkat: { include: { customer: true } },
                    teknisi: { select: { id: true, nama: true } },
                },
            },
        };

        const orderBy = [{ created_at: "desc" }, { id: "desc" }];

        if (!isPaginated) {
            const invoices = await prisma.invoice.findMany({
                where,
                include,
                orderBy,
            });
            return res.json(invoices);
        }

        const [total, invoices] = await Promise.all([
            prisma.invoice.count({ where }),
            prisma.invoice.findMany({
                where,
                include,
                orderBy,
                skip,
                take: limit,
            }),
        ]);

        return res.json(buildPaginationResponse(invoices, total, page, limit));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Membuat invoice baru
async function create(req, res) {
    try {
        const { tiket_id, biaya_jasa } = req.body;

        const tiket = await prisma.tiketServis.findUnique({
            where: { id: Number(tiket_id) },
            include: { invoice: true },
        });

        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        if (tiket.status === "dibatalkan") {
            return res.status(400).json({ message: "Tidak dapat menerbitkan invoice untuk tiket yang telah dibatalkan." });
        }

        if (tiket.invoice) {
            return res.status(400).json({ message: "Invoice untuk tiket ini sudah ada" });
        }

        // Hitung biaya sparepart dari penggunaan_sparepart
        const penggunaan = await prisma.penggunaanSparepart.findMany({
            where: { tiket_id: Number(tiket_id) },
            include: { sparepart: true },
        });

        const biaya_sparepart = penggunaan.reduce((total, p) => {
            return total + p.sparepart.harga * p.jumlah;
        }, 0);

        const jasa = Number(biaya_jasa) || 0;
        if (isNaN(jasa) || jasa < 0) {
            return res.status(400).json({ message: "Biaya jasa harus berupa angka dan tidak boleh negatif" });
        }

        const total_biaya = jasa + biaya_sparepart;

        const invoice = await prisma.invoice.create({
            data: {
                tiket_id: Number(tiket_id),
                biaya_jasa: jasa,
                biaya_sparepart,
                total_biaya,
            },
            include: {
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        penggunaan_sparepart: { include: { sparepart: true } },
                    },
                },
            },
        });

        broadcast("invoice:created", { id: invoice.id, tiket_id: invoice.tiket_id });
        broadcast("dashboard:refresh");

        return res.status(201).json({ message: "Invoice berhasil dibuat", data: invoice });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui biaya jasa invoice
async function update(req, res) {
    try {
        const id = Number(req.params.id);
        const { biaya_jasa } = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { tiket: true },
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        const jasa = Number(biaya_jasa);
        if (isNaN(jasa) || jasa < 0) {
            return res.status(400).json({ message: "Biaya jasa harus berupa angka dan tidak boleh negatif" });
        }

        const total_biaya = jasa + invoice.biaya_sparepart;

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                biaya_jasa: jasa,
                total_biaya,
            },
            include: {
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        penggunaan_sparepart: { include: { sparepart: true } },
                        teknisi: { select: { nama: true } },
                        diagnosis: true
                    },
                },
            },
        });

        broadcast("invoice:updated", { id: updated.id, tiket_id: updated.tiket_id });
        broadcast("dashboard:refresh");

        return res.json({ message: "Invoice berhasil diperbarui", data: updated });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil detail invoice berdasarkan ID (mendukung pencarian via ID invoice maupun tiket_id)
async function getById(req, res) {
    try {
        const paramId = Number(req.params.id);
        let invoice = await prisma.invoice.findUnique({
            where: { id: paramId },
            include: {
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        penggunaan_sparepart: { include: { sparepart: true } },
                        teknisi: { select: { nama: true } },
                        diagnosis: true
                    },
                },
            },
        });

        // Fallback: Jika tidak ditemukan dengan invoice id, cari apakah parameter adalah tiket_id
        if (!invoice) {
            invoice = await prisma.invoice.findUnique({
                where: { tiket_id: paramId },
                include: {
                    tiket: {
                        include: {
                            perangkat: { include: { customer: true } },
                            penggunaan_sparepart: { include: { sparepart: true } },
                            teknisi: { select: { nama: true } },
                            diagnosis: true
                        },
                    },
                },
            });
        }

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        return res.json(invoice);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil rekapitulasi laporan keuangan & performa servis periodik
async function getReport(req, res) {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        const invoiceWhere = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};
        const tiketWhere = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};

        const [invoices, tikets] = await Promise.all([
            prisma.invoice.findMany({
                where: invoiceWhere,
                include: {
                    tiket: {
                        include: {
                            perangkat: { include: { customer: true } },
                            teknisi: { select: { id: true, nama: true } }
                        }
                    }
                },
                orderBy: { created_at: "desc" }
            }),
            prisma.tiketServis.findMany({
                where: tiketWhere,
                include: {
                    teknisi: { select: { id: true, nama: true } }
                }
            })
        ]);

        const totalPendapatan = invoices.reduce((sum, inv) => sum + inv.total_biaya, 0);
        const totalJasa = invoices.reduce((sum, inv) => sum + inv.biaya_jasa, 0);
        const totalSparepart = invoices.reduce((sum, inv) => sum + inv.biaya_sparepart, 0);

        // Rekap status servis
        const tiketSelesai = tikets.filter(t => ["selesai", "diambil"].includes(t.status)).length;
        const tiketProses = tikets.filter(t => !["selesai", "diambil", "dibatalkan"].includes(t.status)).length;
        const tiketBatal = tikets.filter(t => t.status === "dibatalkan").length;

        // Rekap performa teknisi
        const teknisiMap = {};
        tikets.forEach(t => {
            const nama = t.teknisi?.nama || "Belum Ditugaskan";
            if (!teknisiMap[nama]) {
                teknisiMap[nama] = { nama, totalTiket: 0, tiketSelesai: 0, totalOmset: 0 };
            }
            teknisiMap[nama].totalTiket += 1;
            if (["selesai", "diambil"].includes(t.status)) {
                teknisiMap[nama].tiketSelesai += 1;
            }
        });

        invoices.forEach(inv => {
            const nama = inv.tiket?.teknisi?.nama || "Belum Ditugaskan";
            if (teknisiMap[nama]) {
                teknisiMap[nama].totalOmset += inv.total_biaya;
            }
        });

        const ringkasanTeknisi = Object.values(teknisiMap);

        return res.json({
            summary: {
                totalInvoices: invoices.length,
                totalPendapatan,
                totalJasa,
                totalSparepart,
                totalTiketMasuk: tikets.length,
                tiketSelesai,
                tiketProses,
                tiketBatal
            },
            ringkasanTeknisi,
            invoices
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Simpan Tanda Tangan Pelanggan di Invoice (Kasir / Front Desk)
async function saveCustomerSignature(req, res) {
    try {
        const id = Number(req.params.id);
        const { ttd_customer, ttd_customer_nama } = req.body;

        if (!ttd_customer) {
            return res.status(400).json({ message: "Goresan tanda tangan digital wajib ada" });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { tiket: { include: { perangkat: { include: { customer: true } } } } }
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        const signerName = ttd_customer_nama || invoice.tiket?.perangkat?.customer?.nama || "Pelanggan";
        const signDate = new Date();

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                ttd_customer,
                ttd_customer_at: signDate,
                ttd_customer_nama: signerName
            },
            include: {
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        penggunaan_sparepart: { include: { sparepart: true } },
                        teknisi: { select: { nama: true } },
                        diagnosis: true
                    }
                }
            }
        });

        // Catat log perbaikan serah terima digital
        await prisma.logPerbaikan.create({
            data: {
                tiket_id: invoice.tiket_id,
                fase: "Penyerahan Unit",
                catatan: `[TTD Kasir] Pelanggan (${signerName}) telah menandatangani nota serah terima secara digital.`
            }
        });

        broadcast("invoice:updated", { id: updated.id, tiket_id: updated.tiket_id });
        broadcast("tiket:updated", { id: updated.tiket_id });
        broadcast("dashboard:refresh");

        return res.json({
            message: "Tanda tangan pelanggan berhasil disimpan",
            data: updated
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menyimpan tanda tangan digital staf/admin/toko pada invoice
async function saveAdminSignature(req, res) {
    try {
        const id = Number(req.params.id);
        const { signature, signer_nama } = req.body;

        if (!signature) {
            return res.status(400).json({ message: "Goresan tanda tangan admin wajib ada" });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { tiket: true }
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        const signerName = signer_nama || req.user?.nama || "Admin Yangversa";
        const signDate = new Date();

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                ttd_admin: signature,
                ttd_admin_at: signDate,
                ttd_admin_nama: signerName
            },
            include: {
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        penggunaan_sparepart: { include: { sparepart: true } },
                        teknisi: { select: { nama: true } },
                        diagnosis: true
                    }
                }
            }
        });

        broadcast("invoice:updated", { id: updated.id, tiket_id: updated.tiket_id });
        broadcast("tiket:updated", { id: updated.tiket_id });
        broadcast("dashboard:refresh");

        return res.json({
            message: "Tanda tangan petugas workshop berhasil disimpan",
            data: updated
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, create, update, getById, getReport, saveCustomerSignature, saveAdminSignature };

