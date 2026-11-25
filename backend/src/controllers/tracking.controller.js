const prisma = require("../config/database");
const { getWarrantyStatus, getSlaStatus, calculateSlaPengerjaanTarget } = require("../utils/tiket");
const { broadcast } = require("../utils/sse");
const { normalizePhone } = require("../utils/normalize");

// Helper untuk masking nama pelanggan demi privasi publik (misal: "Budi Santoso" -> "Bu** Sa*****")
function maskName(nama) {
    if (!nama || typeof nama !== "string") return "Pelanggan";
    const parts = nama.trim().split(/\s+/);
    return parts.map(part => {
        if (part.length <= 2) return part[0] + "*";
        return part.slice(0, 2) + "*".repeat(Math.max(part.length - 2, 2));
    }).join(" ");
}

// Helper untuk masking nomor telepon pelanggan (misal: "081234567890" -> "0812 •••••• 90")
// PENTING: Hanya menampilkan 4 digit depan dan 2 digit belakang agar 4 digit rahasia tetap terlindungi
function maskPhone(phone) {
    if (!phone || typeof phone !== "string") return "";
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 8) return "••••••••";
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(-2);
    return `${prefix} •••••• ${suffix}`;
}

// Helper untuk masking serial number perangkat (misal: "NXK7SN123456" -> "NXK•••••456")
function maskSerialNumber(sn) {
    if (!sn || typeof sn !== "string" || sn === "-") return "-";
    const clean = sn.trim();
    if (clean.length <= 6) return clean.slice(0, 2) + "••••";
    return clean.slice(0, 3) + "•••••" + clean.slice(-3);
}

// Customer melacak status servis tanpa login
async function track(req, res) {
    try {
        const nomorTelepon = req.body?.nomorTelepon || req.query?.nomorTelepon || req.query?.phone;
        const nomorTiket = req.body?.nomorTiket || req.query?.nomorTiket || req.query?.nomor_tiket || req.query?.tiket;

        if (!nomorTelepon && !nomorTiket) {
            return res.status(400).json({ message: "Masukkan nomor telepon atau nomor tiket" });
        }

        const where = {};

        if (nomorTiket) {
            const cleanTiket = String(nomorTiket).trim();
            where.OR = [
                { nomor_tiket: cleanTiket },
                { nomor_tiket: cleanTiket.toUpperCase() },
                { nomor_tiket: cleanTiket.toLowerCase() }
            ];
        }

        if (nomorTelepon) {
            const rawPhone = String(nomorTelepon).trim();
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
                diagnosis: { select: { masalah: true, solusi: true, estimasi_biaya: true, created_at: true } },
                log_perbaikan: { orderBy: { created_at: "desc" } },
                penggunaan_sparepart: { include: { sparepart: { select: { nama: true, kategori: true, harga: true } } } },
                invoice: true
            },
            orderBy: { created_at: "desc" },
        });

        if (tikets.length === 0) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        // Format response untuk customer dengan masking PII ketat
        const result = tikets.map((t) => {
            let slaStatus = null;
            try {
                slaStatus = getSlaStatus(t);
            } catch (_) {}

            let warrantyStatus = null;
            try {
                warrantyStatus = getWarrantyStatus(t);
            } catch (_) {}

            const merek = t.perangkat?.merek || "";
            const model = t.perangkat?.model || "";
            const perangkatNama = `${merek} ${model}`.trim() || "Perangkat";

            return {
                id: t.id,
                nomor_tiket: t.nomor_tiket,
                // Masking data sensitif pelanggan untuk mencegah scraping & kebocoran PII publik
                customer_nama: maskName(t.perangkat?.customer?.nama),
                customer_telepon: maskPhone(t.perangkat?.customer?.nomor_telepon),
                customer_alamat: "", // Alamat rumah pelanggan disembunyikan demi privasi
                perangkat: perangkatNama,
                merek: merek,
                model: model,
                serial_number: maskSerialNumber(t.perangkat?.serial_number),
                jenis_perangkat: t.perangkat?.jenis_perangkat || "Perangkat",
                status: t.status,
                keluhan: t.keluhan || "-",
                kelengkapan: t.kelengkapan || "-",
                kelengkapan_detail: t.kelengkapan_detail,
                foto_kondisi: t.foto_kondisi,
                foto_diagnosis: t.foto_diagnosis || t.diagnosis?.foto_diagnosis || null,
                foto_selesai: t.foto_selesai || null,
                foto_handover: t.foto_handover || null,
                defect_map: t.defect_map,
                sla_paket: t.sla_paket,
                target_pengecekan_at: t.target_pengecekan_at,
                disetujui_at: t.disetujui_at,
                target_selesai_at: t.target_selesai_at,
                sla_status: slaStatus,
                teknisi: t.teknisi?.nama || "Belum ditugaskan",
                diagnosis: t.diagnosis
                    ? {
                        masalah: t.diagnosis.masalah || "-",
                        solusi: t.diagnosis.solusi || "-",
                        estimasi_biaya: t.diagnosis.estimasi_biaya || 0,
                        created_at: t.diagnosis.created_at || null,
                    }
                    : null,
                log_perbaikan: t.log_perbaikan || [],
                penggunaan_sparepart: t.penggunaan_sparepart?.map(ps => ({
                    nama: ps.sparepart?.nama || "Sparepart",
                    kategori: ps.sparepart?.kategori || "Umum",
                    harga: ps.sparepart?.harga || 0,
                    jumlah: ps.jumlah || 1,
                    sparepart: {
                        nama: ps.sparepart?.nama || "Sparepart",
                        kategori: ps.sparepart?.kategori || "Umum",
                        harga: ps.sparepart?.harga || 0
                    }
                })) || [],
                invoice: t.invoice
                    ? { 
                        id: t.invoice.id,
                        biaya_jasa: t.invoice.biaya_jasa || 0,
                        biaya_sparepart: t.invoice.biaya_sparepart || 0,
                        diskon: t.invoice.diskon || 0,
                        nominal_dp: t.invoice.nominal_dp || 0,
                        total_biaya: t.invoice.total_biaya || 0,
                        status_pembayaran: t.invoice.status_pembayaran || "lunas",
                        metode_pembayaran: t.invoice.metode_pembayaran || "Tunai",
                        ttd_customer: t.invoice.ttd_customer,
                        ttd_customer_at: t.invoice.ttd_customer_at,
                        ttd_customer_nama: t.invoice.ttd_customer_nama,
                        ttd_admin: t.invoice.ttd_admin,
                        ttd_admin_at: t.invoice.ttd_admin_at,
                        ttd_admin_nama: t.invoice.ttd_admin_nama,
                        created_at: t.invoice.created_at
                    }
                    : null,
                created_at: t.created_at,
                completed_at: t.completed_at,
                tgl_diambil: t.tgl_diambil,
                durasi_garansi: t.durasi_garansi || "1 Bulan",
                garansi_berakhir_at: t.garansi_berakhir_at,
                warranty_status: warrantyStatus,
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
            };
        });

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Submitting rating without login (Public with single-submission lock & phone verification)
async function submitRating(req, res) {
    try {
        const { nomorTiket, rating, phone_last4 } = req.body;
        if (!nomorTiket || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Nomor tiket dan rating (1-5 star) wajib diisi" });
        }

        const cleanTiket = String(nomorTiket).trim();
        const tiket = await prisma.tiketServis.findFirst({
            where: {
                OR: [
                    { nomor_tiket: cleanTiket },
                    { nomor_tiket: cleanTiket.toUpperCase() },
                    { nomor_tiket: cleanTiket.toLowerCase() }
                ]
            },
            include: {
                perangkat: { include: { customer: true } }
            }
        });

        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        if (!["selesai", "diambil"].includes(tiket.status)) {
            return res.status(400).json({ message: "Penilaian rating hanya dapat diberikan setelah perbaikan selesai atau unit diambil." });
        }

        // Kunci rating: Mencegah manipulasi atau penimpaan rating yang sudah pernah dikirim
        if (tiket.rating_submitted_at) {
            return res.status(400).json({ message: "Penilaian untuk tiket servis ini sudah pernah dikirim dan tidak dapat diubah." });
        }

        // Verifikasi 4 digit terakhir nomor telepon pelanggan jika terdaftar
        const rawCustomerPhone = (tiket.perangkat?.customer?.nomor_telepon || "").replace(/\D/g, "");
        if (rawCustomerPhone.length >= 4) {
            const cleanInputPhone = String(phone_last4 || "").replace(/\D/g, "");
            if (!phone_last4 || cleanInputPhone.length < 4 || !rawCustomerPhone.endsWith(cleanInputPhone)) {
                return res.status(403).json({ message: "Verifikasi gagal: Masukkan 4 digit terakhir nomor telepon yang terdaftar pada tiket ini untuk memberikan penilaian." });
            }
        }

        const updated = await prisma.tiketServis.update({
            where: { id: tiket.id },
            data: {
                rating_teknisi: Number(rating),
                rating_submitted_at: new Date()
            }
        });

        broadcast("tiket:updated", { id: tiket.id, nomor_tiket: tiket.nomor_tiket });

        return res.json({
            message: "Terima kasih atas penilaian Anda!",
            rating: updated.rating_teknisi,
            googleMapsUrl: "https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
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

        const cleanTiket = String(nomorTiket).trim();
        const tiket = await prisma.tiketServis.findFirst({
            where: {
                OR: [
                    { nomor_tiket: cleanTiket },
                    { nomor_tiket: cleanTiket.toUpperCase() },
                    { nomor_tiket: cleanTiket.toLowerCase() }
                ]
            },
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

        if (rawCustomerPhone.length >= 4) {
            if (!rawCustomerPhone.endsWith(cleanInputPhone) || cleanInputPhone.length < 4) {
                return res.status(403).json({ message: "Verifikasi gagal: 4 digit terakhir nomor telepon tidak cocok dengan nomor yang terdaftar." });
            }
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
            const notification = await prisma.notification.create({
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
            broadcast("notification:new", notification);
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
            const notification = await prisma.notification.create({
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
            broadcast("notification:new", notification);
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

// Fitur Sign-to-Unlock: Pelanggan menandatangani nota serah terima secara mandiri via tracking
async function signCustomerInvoice(req, res) {
    try {
        const { nomorTiket, phone_last4, signature, signer_nama } = req.body;
        if (!nomorTiket || !phone_last4 || !signature) {
            return res.status(400).json({ message: "Nomor tiket, verifikasi 4 digit no telepon, dan tanda tangan wajib diisi." });
        }

        // Validasi payload signature: mencegah upload payload raksasa atau format tidak valid
        if (typeof signature !== "string" || !signature.startsWith("data:image/") || signature.length > 500000) {
            return res.status(400).json({ message: "Format tanda tangan tidak valid atau ukuran gambar melebihi batas." });
        }

        const cleanTiket = String(nomorTiket).trim();
        const tiket = await prisma.tiketServis.findFirst({
            where: {
                OR: [
                    { nomor_tiket: cleanTiket },
                    { nomor_tiket: cleanTiket.toUpperCase() },
                    { nomor_tiket: cleanTiket.toLowerCase() }
                ]
            },
            include: {
                perangkat: { include: { customer: true } },
                invoice: true,
                teknisi: true
            }
        });

        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        if (!tiket.invoice) {
            return res.status(400).json({ message: "Invoice untuk tiket ini belum diterbitkan oleh kasir." });
        }

        // Cegah penimpaan tanda tangan yang sudah ada (Immutability protection)
        if (tiket.invoice.ttd_customer) {
            return res.status(400).json({ message: "Invoice ini sudah pernah ditandatangani sebelumnya dan tidak dapat diubah kembali." });
        }

        // Verifikasi 4 digit terakhir nomor HP customer
        const rawCustomerPhone = (tiket.perangkat?.customer?.nomor_telepon || "").replace(/\D/g, "");
        const cleanInputPhone = String(phone_last4).replace(/\D/g, "");

        if (rawCustomerPhone.length >= 4) {
            if (!rawCustomerPhone.endsWith(cleanInputPhone) || cleanInputPhone.length < 4) {
                return res.status(403).json({ message: "Verifikasi gagal: 4 digit terakhir nomor telepon tidak cocok dengan nomor yang terdaftar." });
            }
        }

        const namaPenandatangan = signer_nama ? String(signer_nama).trim().slice(0, 100) : (tiket.perangkat?.customer?.nama || "Pelanggan");
        const signDate = new Date();

        const updatedInvoice = await prisma.invoice.update({
            where: { id: tiket.invoice.id },
            data: {
                ttd_customer: signature,
                ttd_customer_at: signDate,
                ttd_customer_nama: namaPenandatangan
            }
        });

        // Catat log serah terima digital
        await prisma.logPerbaikan.create({
            data: {
                tiket_id: tiket.id,
                fase: "Penyerahan Unit",
                catatan: `[Self-Sign Tracking] Pelanggan (${namaPenandatangan}) telah memverifikasi & membubuhkan tanda tangan digital melalui portal tracking.`
            }
        });

        broadcast("invoice:updated", { id: updatedInvoice.id, tiket_id: tiket.id });
        broadcast("tiket:updated", { id: tiket.id, nomor_tiket: tiket.nomor_tiket });
        broadcast("dashboard:refresh");

        return res.json({
            message: "Tanda tangan berhasil dikonfirmasi! Dokumen Invoice dan Garansi telah terbuka.",
            invoice: {
                id: updatedInvoice.id,
                biaya_jasa: updatedInvoice.biaya_jasa,
                biaya_sparepart: updatedInvoice.biaya_sparepart,
                total_biaya: updatedInvoice.total_biaya,
                ttd_customer: updatedInvoice.ttd_customer,
                ttd_customer_at: updatedInvoice.ttd_customer_at,
                ttd_customer_nama: updatedInvoice.ttd_customer_nama,
                created_at: updatedInvoice.created_at
            }
        });
    } catch (error) {
        console.error("Gagal menyimpan tanda tangan customer via tracking:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat memproses tanda tangan", error: error.message });
    }
}

/**
 * GET /api/tracking/promotions
 * Public read-only active offers explicitly opted in for `/tracking` showcase.
 * Zero PII, zero internal sales data.
 */
async function getPublicPromotions(req, res) {
    try {
        const { getPromotionStatus, matchesDeviceCategory } = require("../utils/promotionMath");
        const { kategori_perangkat } = req.query;
        const now = new Date();

        const promos = await prisma.promotion.findMany({
            where: {
                is_active: true,
                tampil_di_tracking: true,
            },
            orderBy: [{ tanggal_selesai: "asc" }, { created_at: "desc" }],
        });

        let activePublic = promos
            .filter((p) => getPromotionStatus(p, now) === "aktif")
            .map((p) => ({
                id: p.id,
                kode_promo: p.kode_promo,
                nama_promo: p.nama_promo,
                deskripsi: p.deskripsi || null,
                tipe_diskon: p.tipe_diskon,
                nilai_diskon: p.nilai_diskon,
                cakupan_diskon: p.cakupan_diskon,
                maksimal_diskon: p.maksimal_diskon,
                minimal_transaksi: p.minimal_transaksi || 0,
                kategori_perangkat: p.kategori_perangkat || "Semua",
                tipe_tiket: p.tipe_tiket || "Semua",
                tanggal_selesai: p.tanggal_selesai,
                sisa_kuota: p.kuota_total !== null ? Math.max(0, p.kuota_total - p.kuota_terpakai) : null,
                satu_kali_per_pelanggan: Boolean(p.satu_kali_per_pelanggan),
            }));

        if (kategori_perangkat) {
            activePublic = activePublic.filter((p) => matchesDeviceCategory(p.kategori_perangkat, kategori_perangkat));
        }

        return res.json(activePublic);
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat penawaran promo publik" });
    }
}

module.exports = { track, submitRating, respondDiagnosisApproval, signCustomerInvoice, getPublicPromotions };
