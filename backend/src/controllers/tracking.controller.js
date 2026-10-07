const prisma = require("../config/database");

// Customer melacak status servis tanpa login
async function track(req, res) {
    try {
        const { nomorTelepon, nomorTiket } = req.body;

        if (!nomorTelepon && !nomorTiket) {
            return res.status(400).json({ message: "Masukkan nomor telepon atau nomor tiket" });
        }

        const where = {};

        if (nomorTiket) {
            where.nomor_tiket = nomorTiket;
        }

        if (nomorTelepon) {
            where.perangkat = {
                customer: {
                    nomor_telepon: nomorTelepon,
                },
            };
        }

        const tikets = await prisma.tiketServis.findMany({
            where,
            include: {
                perangkat: { include: { customer: true } },
                teknisi: { select: { nama: true } },
                diagnosis: { select: { masalah: true, solusi: true, estimasi_biaya: true } },
                log_perbaikan: { orderBy: { created_at: "desc" } },
                invoice: true
            },
            orderBy: { created_at: "desc" },
        });

        if (tikets.length === 0) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        // Format response untuk customer
        const result = tikets.map((t) => ({
            nomor_tiket: t.nomor_tiket,
            perangkat: `${t.perangkat.merek} ${t.perangkat.model}`,
            jenis_perangkat: t.perangkat.jenis_perangkat,
            status: t.status,
            keluhan: t.keluhan,
            kelengkapan: t.kelengkapan,
            foto_kondisi: t.foto_kondisi,
            teknisi: t.teknisi?.nama || "Belum ditugaskan",
            diagnosis: t.diagnosis
                ? {
                    masalah: t.diagnosis.masalah,
                    solusi: t.diagnosis.solusi,
                    estimasi_biaya: t.diagnosis.estimasi_biaya,
                }
                : null,
            log_perbaikan: t.log_perbaikan,
            invoice: t.invoice
                ? { total_biaya: t.invoice.total_biaya }
                : null,
            created_at: t.created_at,
        }));

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { track };
