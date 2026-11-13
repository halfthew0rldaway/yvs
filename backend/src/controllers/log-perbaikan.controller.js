const prisma = require("../config/database");
const { relocateTicketMedia } = require("../services/mediaStorage");
const { hasPermission } = require("../services/authorization.service");

// Mencatat aktivitas perbaikan
async function create(req, res) {
    try {
        const { tiket_id, catatan } = req.body;

        const tiket = await prisma.tiketServis.findUnique({ where: { id: Number(tiket_id) } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        let finalFotoUrl = req.body.foto_url || null;
        if (req.file) {
            const [relocatedUrl] = relocateTicketMedia([req.file], tiket.nomor_tiket, "PERBAIKAN");
            finalFotoUrl = relocatedUrl || `/uploads/${req.file.filename}`;
        }

        if (!tiket.teknisi_id) {
            return res.status(400).json({ message: "Tiket harus ditugaskan ke teknisi terlebih dahulu sebelum log dapat ditambahkan" });
        }

        if (["selesai", "diambil", "dibatalkan"].includes(tiket.status)) {
            return res.status(409).json({ message: "Tiket sudah ditutup. Catatan perbaikan tidak dapat ditambahkan" });
        }

        if (!hasPermission(req.authorization, "tickets.view_all") && tiket.teknisi_id !== req.user.id) {
            return res.status(403).json({ message: "Anda tidak berhak menambahkan log pada tiket ini" });
        }

        const fase = ["diterima", "didiagnosis", "menunggu_persetujuan", "disetujui", "dibatalkan"].includes(tiket.status) ? "Diagnosis" : "Perbaikan";

        const log = await prisma.logPerbaikan.create({
            data: {
                tiket_id: Number(tiket_id),
                fase,
                catatan,
                foto_url: finalFotoUrl,
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
        const tiket = await prisma.tiketServis.findUnique({ where: { id: Number(req.params.id) }, select: { teknisi_id: true, status: true } });
        if (!tiket) return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        if (!hasPermission(req.authorization, "tickets.view_all")) {
            const isMine = tiket.teknisi_id === req.user.id;
            const isOpenPool = !tiket.teknisi_id && !["selesai", "diambil", "dibatalkan"].includes(tiket.status);
            if (!isMine && !isOpenPool) return res.status(403).json({ message: "Anda tidak memiliki akses ke tiket servis ini" });
        }
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
