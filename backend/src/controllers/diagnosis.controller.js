const prisma = require("../config/database");
const { broadcast } = require("../utils/sse");

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

        // Pastikan teknisi memiliki log diagnosis; jika belum ada, otomatis buatkan dari catatan diagnosis
        if (req.user.role === "teknisi") {
            const logDiagnosis = await prisma.logPerbaikan.findFirst({
                where: { tiket_id: Number(tiket_id), fase: "Diagnosis" }
            });
            if (!logDiagnosis) {
                const catatanLog = req.body.catatan_diagnosis || `Diagnosa Awal: ${masalah}. Rencana Tindakan: ${solusi}`;
                await prisma.logPerbaikan.create({
                    data: {
                        tiket_id: Number(tiket_id),
                        fase: "Diagnosis",
                        catatan: catatanLog,
                    }
                });
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

        let uploadedPhotos = [];
        if (req.body.existing_foto_diagnosis) {
            try {
                uploadedPhotos = typeof req.body.existing_foto_diagnosis === 'string' ? JSON.parse(req.body.existing_foto_diagnosis) : req.body.existing_foto_diagnosis;
            } catch (e) { uploadedPhotos = []; }
        }
        if (req.files && req.files.length > 0) {
            const newUrls = req.files.map(file => `/uploads/${file.filename}`);
            uploadedPhotos = [...uploadedPhotos, ...newUrls];
        } else if (req.body.foto_diagnosis && uploadedPhotos.length === 0) {
            uploadedPhotos = typeof req.body.foto_diagnosis === 'string' ? JSON.parse(req.body.foto_diagnosis) : req.body.foto_diagnosis;
        }
        const fotoDiagnosisStr = uploadedPhotos && uploadedPhotos.length > 0 ? JSON.stringify(uploadedPhotos.slice(0, 25)) : null;

        const diagnosis = await prisma.$transaction(async (tx) => {
            const created = await tx.diagnosis.create({
                data: {
                    tiket_id: Number(tiket_id),
                    masalah,
                    solusi,
                    estimasi_biaya: estimasi,
                    foto_diagnosis: fotoDiagnosisStr,
                },
            });

            // Update status tiket ke didiagnosis secara atomik & simpan foto_diagnosis di tiket
            await tx.tiketServis.update({
                where: { id: Number(tiket_id) },
                data: { 
                    status: "didiagnosis",
                    foto_diagnosis: fotoDiagnosisStr || undefined
                },
            });

            return created;
        });

        broadcast("tiket:updated", { id: Number(tiket_id), status: "didiagnosis" });
        broadcast("dashboard:refresh");

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

        let existing = [];
        if (req.body.existing_foto_diagnosis) {
            try {
                existing = typeof req.body.existing_foto_diagnosis === 'string' ? JSON.parse(req.body.existing_foto_diagnosis) : req.body.existing_foto_diagnosis;
            } catch (e) { existing = []; }
        } else if (req.body.replace !== 'true' && diagnosis.foto_diagnosis) {
            try {
                existing = typeof diagnosis.foto_diagnosis === 'string' ? JSON.parse(diagnosis.foto_diagnosis) : diagnosis.foto_diagnosis;
            } catch (e) { existing = []; }
        }

        if (req.files && req.files.length > 0) {
            const newFiles = req.files.map(file => `/uploads/${file.filename}`);
            updateData.foto_diagnosis = JSON.stringify([...existing, ...newFiles].slice(0, 25));
        } else if (req.body.existing_foto_diagnosis !== undefined) {
            updateData.foto_diagnosis = JSON.stringify(existing.slice(0, 25));
        } else if (req.body.foto_diagnosis !== undefined) {
            updateData.foto_diagnosis = typeof req.body.foto_diagnosis === 'string' ? req.body.foto_diagnosis : JSON.stringify(req.body.foto_diagnosis);
        }

        const updated = await prisma.diagnosis.update({
            where: { id },
            data: updateData,
        });

        if (updateData.foto_diagnosis !== undefined) {
            await prisma.tiketServis.update({
                where: { id: diagnosis.tiket_id },
                data: { foto_diagnosis: updateData.foto_diagnosis }
            });
        }

        broadcast("tiket:updated", { id: diagnosis.tiket_id });
        broadcast("dashboard:refresh");

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
