const prisma = require("../config/database");

// Input hasil diagnosis
async function create(req, res) {
    try {
        const { tiket_id, masalah, solusi, estimasi_biaya } = req.body;

        const tiket = await prisma.tiketServis.findUnique({ where: { id: Number(tiket_id) } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        // Pastikan tiket dalam status diterima
        if (tiket.status !== "diterima") {
            return res.status(400).json({ message: "Tiket harus dalam status diterima untuk diagnosis" });
        }

        if (!tiket.teknisi_id) {
            return res.status(400).json({ message: "Tiket harus ditugaskan ke teknisi terlebih dahulu sebelum diagnosis" });
        }

        if (req.user.role === "teknisi" && tiket.teknisi_id !== req.user.id) {
            return res.status(403).json({ message: "Anda tidak berhak mendiagnosis tiket ini" });
        }

        // Pastikan teknisi sudah mengisi log diagnosis
        const logDiagnosis = await prisma.logPerbaikan.findFirst({
            where: { tiket_id: Number(tiket_id), fase: "Diagnosis" }
        });
        if (!logDiagnosis) {
            return res.status(400).json({ message: "Proteksi: Anda harus menambahkan minimal satu Log Perbaikan (Catatan Diagnosis) terlebih dahulu sebelum menyimpan hasil akhir diagnosis." });
        }

        // Cek apakah sudah ada diagnosis
        const existing = await prisma.diagnosis.findUnique({ where: { tiket_id: Number(tiket_id) } });
        if (existing) {
            return res.status(400).json({ message: "Diagnosis untuk tiket ini sudah ada" });
        }

        const diagnosis = await prisma.diagnosis.create({
            data: {
                tiket_id: Number(tiket_id),
                masalah,
                solusi,
                estimasi_biaya: Number(estimasi_biaya),
            },
        });

        // Update status tiket ke didiagnosis
        await prisma.tiketServis.update({
            where: { id: Number(tiket_id) },
            data: { status: "didiagnosis" },
        });

        return res.status(201).json({ message: "Diagnosis berhasil disimpan", data: diagnosis });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil diagnosis berdasarkan tiket ID
async function getByTiketId(req, res) {
    try {
        const diagnosis = await prisma.diagnosis.findUnique({
            where: { tiket_id: Number(req.params.id) },
            include: { tiket: true },
        });

        if (!diagnosis) {
            return res.status(404).json({ message: "Diagnosis tidak ditemukan" });
        }

        return res.json(diagnosis);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { create, getByTiketId };
