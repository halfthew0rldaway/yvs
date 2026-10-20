const prisma = require("../config/database");
const { getWarrantyStatus, getSlaStatus } = require("../utils/tiket");

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
                penggunaan_sparepart: { include: { sparepart: { select: { nama: true, kategori: true } } } },
                invoice: true
            },
            orderBy: { created_at: "desc" },
        });

        if (tikets.length === 0) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        // Format response untuk customer
        const result = tikets.map((t) => ({
            id: t.id,
            nomor_tiket: t.nomor_tiket,
            customer_nama: t.perangkat?.customer?.nama || "Pelanggan",
            customer_telepon: t.perangkat?.customer?.nomor_telepon || "",
            perangkat: `${t.perangkat.merek} ${t.perangkat.model}`,
            merek: t.perangkat.merek,
            model: t.perangkat.model,
            serial_number: t.perangkat.serial_number || "-",
            jenis_perangkat: t.perangkat.jenis_perangkat,
            status: t.status,
            keluhan: t.keluhan,
            kelengkapan: t.kelengkapan,
            kelengkapan_detail: t.kelengkapan_detail,
            foto_kondisi: t.foto_kondisi,
            defect_map: t.defect_map,
            sla_paket: t.sla_paket,
            target_pengecekan_at: t.target_pengecekan_at,
            disetujui_at: t.disetujui_at,
            target_selesai_at: t.target_selesai_at,
            sla_status: getSlaStatus(t),
            teknisi: t.teknisi?.nama || "Belum ditugaskan",
            diagnosis: t.diagnosis
                ? {
                    masalah: t.diagnosis.masalah,
                    solusi: t.diagnosis.solusi,
                    estimasi_biaya: t.diagnosis.estimasi_biaya,
                }
                : null,
            log_perbaikan: t.log_perbaikan,
            penggunaan_sparepart: t.penggunaan_sparepart?.map(ps => ({
                nama: ps.sparepart.nama,
                kategori: ps.sparepart.kategori,
                jumlah: ps.jumlah
            })) || [],
            invoice: t.invoice
                ? { total_biaya: t.invoice.total_biaya }
                : null,
            created_at: t.created_at,
            completed_at: t.completed_at,
            tgl_diambil: t.tgl_diambil,
            durasi_garansi: t.durasi_garansi,
            garansi_berakhir_at: t.garansi_berakhir_at,
            warranty_status: getWarrantyStatus(t),
            is_garansi_claim: t.is_garansi_claim,
            tips_perawatan: t.tips_perawatan,
            rating_teknisi: t.rating_teknisi,
            rating_submitted_at: t.rating_submitted_at,
            checklist_intake: t.checklist_intake,
            checklist_qc: t.checklist_qc,
            googleMapsUrl: "https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
        }));

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Submitting rating without login (Public)
async function submitRating(req, res) {
    try {
        const { nomorTiket, rating } = req.body;
        if (!nomorTiket || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Nomor tiket dan rating (1-5 star) wajib diisi" });
        }

        const tiket = await prisma.tiketServis.findUnique({ where: { nomor_tiket: nomorTiket } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        if (!["selesai", "diambil"].includes(tiket.status)) {
            return res.status(400).json({ message: "Penilaian rating hanya dapat diberikan setelah perbaikan selesai atau unit diambil." });
        }

        const updated = await prisma.tiketServis.update({
            where: { nomor_tiket: nomorTiket },
            data: {
                rating_teknisi: Number(rating),
                rating_submitted_at: new Date()
            }
        });

        return res.json({
            message: "Terima kasih atas penilaian Anda!",
            rating: updated.rating_teknisi,
            googleMapsUrl: "https://maps.google.com/?q=Serv.io+IT+Repair+Center"
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { track, submitRating };
