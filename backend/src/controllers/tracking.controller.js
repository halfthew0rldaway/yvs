const prisma = require("../config/database");
const { getWarrantyStatus, getSlaStatus, calculateSlaPengerjaanTarget } = require("../utils/tiket");
const { broadcast } = require("../utils/sse");
const { normalizePhone } = require("../utils/normalize");

// Customer melacak status servis tanpa login
async function track(req, res) {
    try {
        const { nomorTelepon, nomorTiket } = req.body;

        if (!nomorTelepon && !nomorTiket) {
            return res.status(400).json({ message: "Masukkan nomor telepon atau nomor tiket" });
        }

        const where = {};

        if (nomorTiket) {
            where.nomor_tiket = nomorTiket.trim();
        }

        if (nomorTelepon) {
            const rawPhone = nomorTelepon.trim();
            const cleanDigits = rawPhone.replace(/\D/g, "");
            const normalized08 = normalizePhone(rawPhone);
            const normalized62 = cleanDigits.startsWith("0") ? "62" + cleanDigits.slice(1) : cleanDigits;

            const phoneVariants = Array.from(new Set([
                rawPhone,
                cleanDigits,
                normalized08,
                normalized62,
                `+${normalized62}`
            ])).filter(Boolean);

            where.perangkat = {
                customer: {
                    nomor_telepon: { in: phoneVariants }
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
            alasan_batal: t.alasan_batal,
            catatan_batal: t.catatan_batal,
            status_part_bekas: t.status_part_bekas,
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

// Pelanggan menyetujui atau menolak estimasi diagnosis secara online (Public with 4-digit verification)
async function respondDiagnosisApproval(req, res) {
    try {
        const { nomorTiket, action, phone_last4, alasan_batal, catatan } = req.body;
        if (!nomorTiket || !action || !phone_last4) {
            return res.status(400).json({ message: "Nomor tiket, aksi (approve/reject), dan 4 digit terakhir nomor telepon wajib diisi." });
        }

        if (!["approve", "reject"].includes(action)) {
            return res.status(400).json({ message: "Aksi tidak valid. Pilih 'approve' atau 'reject'." });
        }

        const tiket = await prisma.tiketServis.findUnique({
            where: { nomor_tiket: nomorTiket },
            include: {
                perangkat: { include: { customer: true } },
                diagnosis: true,
                teknisi: true
            }
        });

        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        if (tiket.status !== "menunggu_persetujuan") {
            return res.status(400).json({ message: `Tiket ini sedang dalam status '${tiket.status}', bukan 'menunggu_persetujuan'.` });
        }

        // Verifikasi 4 digit terakhir nomor HP customer
        const rawCustomerPhone = (tiket.perangkat?.customer?.nomor_telepon || "").replace(/\D/g, "");
        const cleanInputPhone = String(phone_last4).replace(/\D/g, "");

        if (!rawCustomerPhone.endsWith(cleanInputPhone) || cleanInputPhone.length < 4) {
            return res.status(403).json({ message: "Verifikasi gagal: 4 digit terakhir nomor telepon tidak cocok dengan nomor yang terdaftar." });
        }

        if (action === "approve") {
            const approvalDate = new Date();
            const slaPaket = tiket.sla_paket || "reguler";
            const targetSelesai = calculateSlaPengerjaanTarget(approvalDate, slaPaket);

            const updated = await prisma.tiketServis.update({
                where: { id: tiket.id },
                data: {
                    status: "disetujui",
                    disetujui_at: approvalDate,
                    target_selesai_at: targetSelesai
                }
            });

            // Catat log perbaikan
            const formattedBiaya = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(tiket.diagnosis?.estimasi_biaya || 0);
            await prisma.logPerbaikan.create({
                data: {
                    tiket_id: tiket.id,
                    fase: "Persetujuan Pelanggan",
                    catatan: `[ACC Online Portal] Pelanggan menyetujui estimasi biaya (${formattedBiaya}) melalui web tracking.`
                }
            });

            // Notifikasi ke teknisi & admin
            await prisma.notification.create({
                data: {
                    recipient_role: "teknisi",
                    user_id: tiket.teknisi_id || undefined,
                    sender_nama: tiket.perangkat?.customer?.nama || "Pelanggan",
                    tipe: "tiket",
                    judul: `Penawaran Disetujui: ${tiket.nomor_tiket}`,
                    pesan: `Pelanggan telah menyetujui estimasi perbaikan untuk unit ${tiket.perangkat?.merek} ${tiket.perangkat?.model}. Pengerjaan fisik dapat segera dimulai.`,
                    link: `/tiket-servis/${tiket.id}`
                }
            });

            broadcast("tiket:updated", { id: tiket.id, nomor_tiket: tiket.nomor_tiket, status: "disetujui" });
            broadcast("notification:new", { judul: `Penawaran Disetujui: ${tiket.nomor_tiket}` });
            broadcast("dashboard:refresh");

            return res.json({
                message: "Terima kasih! Persetujuan Anda telah diterima. Teknisi kami akan segera memproses perbaikan unit Anda.",
                status: "disetujui",
                tiket: updated
            });
        } else {
            // Reject / Batal
            const updated = await prisma.tiketServis.update({
                where: { id: tiket.id },
                data: {
                    status: "dibatalkan",
                    alasan_batal: alasan_batal || "Ditolak pelanggan melalui portal tracking",
                    catatan_batal: catatan || "Pelanggan memilih membatalkan perbaikan setelah menerima penawaran estimasi biaya."
                }
            });

            // Catat log perbaikan
            await prisma.logPerbaikan.create({
                data: {
                    tiket_id: tiket.id,
                    fase: "Pembatalan",
                    catatan: `[Ditolak Online Portal] Pelanggan menolak estimasi perbaikan melalui web tracking. Alasan: ${alasan_batal || "Tidak disebutkan"}${catatan ? ` (${catatan})` : ""}`
                }
            });

            // Notifikasi ke admin
            await prisma.notification.create({
                data: {
                    recipient_role: "admin",
                    sender_nama: tiket.perangkat?.customer?.nama || "Pelanggan",
                    tipe: "tiket",
                    judul: `Penawaran Ditolak: ${tiket.nomor_tiket}`,
                    pesan: `Pelanggan menolak estimasi biaya untuk tiket ${tiket.nomor_tiket}. Alasan: ${alasan_batal || "Tidak disebutkan"}. Unit siap dirapikan untuk pengembalian.`,
                    link: `/tiket-servis/${tiket.id}`
                }
            });

            broadcast("tiket:updated", { id: tiket.id, nomor_tiket: tiket.nomor_tiket, status: "dibatalkan" });
            broadcast("notification:new", { judul: `Penawaran Ditolak: ${tiket.nomor_tiket}` });
            broadcast("dashboard:refresh");

            return res.json({
                message: "Pembatalan perbaikan telah dicatat. Anda dapat mengambil kembali unit Anda di toko kami.",
                status: "dibatalkan",
                tiket: updated
            });
        }
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { track, submitRating, respondDiagnosisApproval };
