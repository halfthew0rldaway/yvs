const prisma = require("../config/database");

// Mencatat aktivitas perbaikan
async function create(req, res) {
    try {
        const { tiket_id, catatan, foto_url } = req.body;

        const tiket = await prisma.tiketServis.findUnique({ where: { id: Number(tiket_id) } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        if (!tiket.teknisi_id) {
            return res.status(400).json({ message: "Tiket harus ditugaskan ke teknisi terlebih dahulu sebelum log dapat ditambahkan" });
        }

        if (req.user.role === "teknisi" && tiket.teknisi_id !== req.user.id) {
            return res.status(403).json({ message: "Anda tidak berhak menambahkan log pada tiket ini" });
        }

        const fase = ["diterima", "didiagnosis", "menunggu_persetujuan", "disetujui", "dibatalkan"].includes(tiket.status) ? "Diagnosis" : "Perbaikan";

        const log = await prisma.logPerbaikan.create({
            data: {
                tiket_id: Number(tiket_id),
                fase,
                catatan,
                foto_url: foto_url || null,
            },
        });

        return res.status(201).json({ message: "Log perbaikan berhasil ditambahkan", data: log });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil log perbaikan berdasarkan tiket ID
async function getByTiketId(req, res) {
    try {
        const logs = await prisma.logPerbaikan.findMany({
            where: { tiket_id: Number(req.params.id) },
            orderBy: { created_at: "desc" },
        });

        return res.json(logs);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { create, getByTiketId };
