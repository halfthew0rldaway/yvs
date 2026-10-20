const prisma = require("../config/database");

// Input hasil diagnosis
async function create(req, res) {
    try {
        const { tiket_id, masalah, solusi, estimasi_biaya } = req.body;

        const tiket = await prisma.tiketServis.findUnique({ where: { id: Number(tiket_id) } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        // Pastikan tiket dalam status diterima atau didiagnosis
        if (!["diterima", "didiagnosis"].includes(tiket.status)) {
            return res.status(400).json({ message: "Tiket harus dalam status diterima atau didiagnosis untuk melakukan diagnosis" });
        }

        if (req.user.role === "teknisi") {
            if (!tiket.teknisi_id) {
                return res.status(400).json({ message: "Tiket harus ditugaskan ke teknisi terlebih dahulu sebelum diagnosis" });
            }
            if (tiket.teknisi_id !== req.user.id) {
                return res.status(403).json({ message: "Anda tidak berhak mendiagnosis tiket ini" });
            }
        }

        // Pastikan teknisi sudah mengisi log diagnosis jika role teknisi
        if (req.user.role === "teknisi") {
            const logDiagnosis = await prisma.logPerbaikan.findFirst({
                where: { tiket_id: Number(tiket_id), fase: "Diagnosis" }
            });
            if (!logDiagnosis) {
                return res.status(400).json({ message: "Proteksi: Anda harus menambahkan minimal satu Log Perbaikan (Catatan Diagnosis) terlebih dahulu sebelum menyimpan hasil akhir diagnosis." });
            }
        }

        // Cek apakah sudah ada diagnosis
        const existing = await prisma.diagnosis.findUnique({ where: { tiket_id: Number(tiket_id) } });
        if (existing) {
            return res.status(400).json({ message: "Diagnosis untuk tiket ini sudah ada" });
        }

        const estimasi = Number(estimasi_biaya);
        if (isNaN(estimasi) || estimasi < 0) {
            return res.status(400).json({ message: "Estimasi biaya harus berupa angka dan tidak boleh negatif" });
        }

        const diagnosis = await prisma.$transaction(async (tx) => {
            const created = await tx.diagnosis.create({
                data: {
                    tiket_id: Number(tiket_id),
                    masalah,
                    solusi,
                    estimasi_biaya: estimasi,
                },
            });

            // Update status tiket ke didiagnosis secara atomik
            await tx.tiketServis.update({
                where: { id: Number(tiket_id) },
                data: { status: "didiagnosis" },
            });

            return created;
        });

        return res.status(201).json({ message: "Diagnosis berhasil disimpan", data: diagnosis });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui hasil diagnosis
async function update(req, res) {
    try {
        const id = Number(req.params.id);
        const { masalah, solusi, estimasi_biaya } = req.body;

        const diagnosis = await prisma.diagnosis.findUnique({
            where: { id },
            include: { tiket: true }
        });

        if (!diagnosis) {
            return res.status(404).json({ message: "Diagnosis tidak ditemukan" });
        }

        if (["selesai", "diambil", "dibatalkan"].includes(diagnosis.tiket.status)) {
            return res.status(400).json({ message: "Diagnosis tidak dapat diubah karena tiket telah selesai atau dibatalkan." });
        }

        if (req.user.role === "teknisi" && diagnosis.tiket.teknisi_id !== req.user.id) {
            return res.status(403).json({ message: "Anda tidak berhak mengubah diagnosis pada tiket ini" });
        }

        const updateData = {};
        if (masalah !== undefined) updateData.masalah = masalah;
        if (solusi !== undefined) updateData.solusi = solusi;
        if (estimasi_biaya !== undefined) {
            const estimasi = Number(estimasi_biaya);
            if (isNaN(estimasi) || estimasi < 0) {
                return res.status(400).json({ message: "Estimasi biaya harus berupa angka dan tidak boleh negatif" });
            }
            updateData.estimasi_biaya = estimasi;
        }

        const updated = await prisma.diagnosis.update({
            where: { id },
            data: updateData,
        });

        return res.json({ message: "Diagnosis berhasil diperbarui", data: updated });
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

module.exports = { create, update, getByTiketId };
