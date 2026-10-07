const prisma = require("../config/database");

// Mengambil seluruh invoice
async function getAll(req, res) {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        return res.json(invoices);
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

        const total_biaya = Number(biaya_jasa) + biaya_sparepart;

        const invoice = await prisma.invoice.create({
            data: {
                tiket_id: Number(tiket_id),
                biaya_jasa: Number(biaya_jasa),
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

        return res.status(201).json({ message: "Invoice berhasil dibuat", data: invoice });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil detail invoice berdasarkan ID
async function getById(req, res) {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id: Number(id) },
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

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        return res.json(invoice);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, create, getById };
