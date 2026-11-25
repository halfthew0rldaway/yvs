const prisma = require("../config/database");
const { broadcast } = require("../utils/sse");
const { normalizePhone } = require("../utils/normalize");
const {
    VALID_DISCOUNT_TYPES,
    VALID_DISCOUNT_SCOPES,
    normalizePromoCode,
    parseWibStartDate,
    parseWibEndDate,
    getPromotionStatus,
    evaluatePromotionEligibility,
} = require("../utils/promotionMath");

/**
 * Check whether a customer (by customer_id or normalized phone) has already redeemed a promotion
 * on any non-cancelled ticket invoice.
 */
async function hasCustomerRedeemedPromo(db, promotionId, customer) {
    if (!promotionId || !customer) return false;
    const normalizedPhone = normalizePhone(customer.nomor_telepon || "");

    const existingInvoices = await db.invoice.findMany({
        where: {
            promotion_id: Number(promotionId),
            tiket: { status: { not: "dibatalkan" } },
        },
        select: {
            id: true,
            tiket: {
                select: {
                    perangkat: {
                        select: {
                            customer_id: true,
                            customer: { select: { nomor_telepon: true } },
                        },
                    },
                },
            },
        },
    });

    return existingInvoices.some((inv) => {
        const invCustId = inv.tiket?.perangkat?.customer_id;
        if (customer.id && invCustId === customer.id) return true;
        if (normalizedPhone) {
            const invPhone = normalizePhone(inv.tiket?.perangkat?.customer?.nomor_telepon || "");
            if (invPhone && invPhone === normalizedPhone) return true;
        }
        return false;
    });
}

function validatePromoPayload(body, isUpdate = false) {
    const errors = [];

    const kode = body.kode_promo !== undefined ? normalizePromoCode(body.kode_promo) : undefined;
    if (!isUpdate && (!kode || kode.length < 3)) {
        errors.push("Kode promo minimal 3 karakter (huruf/angka/strip)");
    } else if (kode !== undefined && kode.length < 3) {
        errors.push("Kode promo minimal 3 karakter (huruf/angka/strip)");
    }

    const nama = body.nama_promo !== undefined ? String(body.nama_promo).trim() : undefined;
    if (!isUpdate && !nama) {
        errors.push("Nama promo wajib diisi");
    } else if (nama !== undefined && !nama) {
        errors.push("Nama promo tidak boleh kosong");
    }

    const tipe = body.tipe_diskon !== undefined ? String(body.tipe_diskon).toLowerCase() : (!isUpdate ? "persen" : undefined);
    if (tipe !== undefined && !VALID_DISCOUNT_TYPES.includes(tipe)) {
        errors.push("Tipe diskon harus 'persen' atau 'nominal'");
    }

    const cakupan = body.cakupan_diskon !== undefined ? String(body.cakupan_diskon).toLowerCase() : (!isUpdate ? "jasa" : undefined);
    if (cakupan !== undefined && !VALID_DISCOUNT_SCOPES.includes(cakupan)) {
        errors.push("Cakupan diskon harus 'jasa', 'sparepart', atau 'total'");
    }

    const nilai = body.nilai_diskon !== undefined ? Number(body.nilai_diskon) : undefined;
    if (!isUpdate && (nilai === undefined || Number.isNaN(nilai) || nilai <= 0)) {
        errors.push("Nilai diskon harus lebih besar dari 0");
    } else if (nilai !== undefined && (Number.isNaN(nilai) || nilai <= 0)) {
        errors.push("Nilai diskon harus lebih besar dari 0");
    }
    if (tipe === "persen" && nilai !== undefined && nilai > 100) {
        errors.push("Diskon persentase tidak boleh melebihi 100%");
    }

    let maksDiskon;
    if (body.maksimal_diskon !== undefined) {
        if (body.maksimal_diskon === "" || body.maksimal_diskon === null) {
            maksDiskon = null;
        } else {
            const parsed = Number(body.maksimal_diskon);
            if (Number.isNaN(parsed) || parsed < 0) {
                errors.push("Batas maksimal diskon tidak valid");
            } else {
                maksDiskon = parsed === 0 ? null : parsed;
            }
        }
    }

    let minTx;
    if (body.minimal_transaksi !== undefined) {
        const parsed = Number(body.minimal_transaksi || 0);
        if (Number.isNaN(parsed) || parsed < 0) {
            errors.push("Minimal transaksi tidak boleh negatif");
        } else {
            minTx = parsed;
        }
    }

    let kuotaTotal;
    if (body.kuota_total !== undefined) {
        if (body.kuota_total === "" || body.kuota_total === null) {
            kuotaTotal = null;
        } else {
            const parsed = parseInt(body.kuota_total, 10);
            if (Number.isNaN(parsed) || parsed < 1) {
                errors.push("Kuota total harus minimal 1 atau dikosongkan untuk tanpa batas");
            } else {
                kuotaTotal = parsed;
            }
        }
    }

    const tglMulai = body.tanggal_mulai !== undefined ? parseWibStartDate(body.tanggal_mulai) : undefined;
    const tglSelesai = body.tanggal_selesai !== undefined ? parseWibEndDate(body.tanggal_selesai) : undefined;
    if (!isUpdate && (!tglMulai || !tglSelesai)) {
        errors.push("Tanggal mulai dan tanggal selesai wajib diisi dengan format valid");
    }
    if (tglMulai && tglSelesai && tglSelesai.getTime() < tglMulai.getTime()) {
        errors.push("Tanggal selesai tidak boleh lebih awal dari tanggal mulai");
    }

    let tglPromosi;
    if (body.tanggal_promosi !== undefined) {
        if (body.tanggal_promosi === "" || body.tanggal_promosi === null) {
            tglPromosi = null;
        } else {
            const parsed = parseWibStartDate(body.tanggal_promosi);
            if (!parsed) errors.push("Tanggal kampanye promosi tidak valid");
            else tglPromosi = parsed;
        }
    }

    return {
        errors,
        data: {
            ...(kode !== undefined ? { kode_promo: kode } : {}),
            ...(nama !== undefined ? { nama_promo: nama } : {}),
            ...(body.deskripsi !== undefined ? { deskripsi: body.deskripsi ? String(body.deskripsi).trim() : null } : {}),
            ...(tipe !== undefined ? { tipe_diskon: tipe } : {}),
            ...(nilai !== undefined ? { nilai_diskon: nilai } : {}),
            ...(cakupan !== undefined ? { cakupan_diskon: cakupan } : {}),
            ...(maksDiskon !== undefined ? { maksimal_diskon: maksDiskon } : {}),
            ...(minTx !== undefined ? { minimal_transaksi: minTx } : {}),
            ...(body.kategori_perangkat !== undefined ? { kategori_perangkat: String(body.kategori_perangkat || "Semua").trim() } : {}),
            ...(body.tipe_tiket !== undefined ? { tipe_tiket: String(body.tipe_tiket || "Semua").trim() } : {}),
            ...(tglMulai !== undefined ? { tanggal_mulai: tglMulai } : {}),
            ...(tglSelesai !== undefined ? { tanggal_selesai: tglSelesai } : {}),
            ...(kuotaTotal !== undefined ? { kuota_total: kuotaTotal } : {}),
            ...(body.satu_kali_per_pelanggan !== undefined ? { satu_kali_per_pelanggan: Boolean(body.satu_kali_per_pelanggan) } : {}),
            ...(body.saluran_promosi !== undefined ? { saluran_promosi: body.saluran_promosi ? String(body.saluran_promosi).trim() : null } : {}),
            ...(tglPromosi !== undefined ? { tanggal_promosi: tglPromosi } : {}),
            ...(body.catatan_kampanye !== undefined ? { catatan_kampanye: body.catatan_kampanye ? String(body.catatan_kampanye).trim() : null } : {}),
            ...(body.tampil_di_tracking !== undefined ? { tampil_di_tracking: Boolean(body.tampil_di_tracking) } : {}),
            ...(body.is_active !== undefined ? { is_active: Boolean(body.is_active) } : {}),
        },
    };
}

/**
 * GET /api/marketing/promotions
 * Lists all promotions with real-time redemption metrics & status.
 */
async function listPromotions(req, res) {
    try {
        const { search, status, saluran } = req.query;
        const now = new Date();

        const promos = await prisma.promotion.findMany({
            include: {
                _count: { select: { campaign_notes: true } },
                invoices: {
                    where: { tiket: { status: { not: "dibatalkan" } } },
                    select: {
                        id: true,
                        diskon: true,
                        total_biaya: true,
                        biaya_jasa: true,
                        biaya_sparepart: true,
                    },
                },
            },
            orderBy: [{ is_active: "desc" }, { created_at: "desc" }],
        });

        let enriched = promos.map((p) => {
            const computedStatus = getPromotionStatus(p, now);
            const activeInvoices = p.invoices || [];
            const totalDiskonDiberikan = activeInvoices.reduce((s, inv) => s + (Number(inv.diskon) || 0), 0);
            const totalOmsetBersih = activeInvoices.reduce((s, inv) => s + (Number(inv.total_biaya) || 0), 0);
            const totalOmsetKotor = activeInvoices.reduce(
                (s, inv) => s + (Number(inv.biaya_jasa) || 0) + (Number(inv.biaya_sparepart) || 0),
                0
            );
            const sisaKuota = p.kuota_total !== null && p.kuota_total !== undefined
                ? Math.max(0, p.kuota_total - p.kuota_terpakai)
                : null;

            const { invoices, _count, ...rest } = p;
            return {
                ...rest,
                status: computedStatus,
                sisa_kuota: sisaKuota,
                campaign_notes_count: _count?.campaign_notes || 0,
                redemptions_count: activeInvoices.length,
                total_diskon_diberikan: totalDiskonDiberikan,
                total_omset_bersih: totalOmsetBersih,
                total_omset_kotor: totalOmsetKotor,
            };
        });

        if (search) {
            const q = String(search).toLowerCase();
            enriched = enriched.filter(
                (p) =>
                    p.kode_promo.toLowerCase().includes(q) ||
                    p.nama_promo.toLowerCase().includes(q) ||
                    (p.saluran_promosi || "").toLowerCase().includes(q) ||
                    (p.catatan_kampanye || "").toLowerCase().includes(q)
            );
        }

        if (status && status !== "all") {
            enriched = enriched.filter((p) => p.status === status);
        }

        if (saluran && saluran !== "all") {
            const ch = String(saluran).toLowerCase();
            enriched = enriched.filter((p) => (p.saluran_promosi || "").toLowerCase().includes(ch));
        }

        return res.json(enriched);
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat daftar promosi", error: error.message });
    }
}

/**
 * GET /api/marketing/promotions/active
 * Accessible to cashiers (`invoices.manage`) and marketing staff (`marketing.view`).
 * Returns currently active promos, optionally evaluated against a specific ticket & biaya_jasa.
 */
async function listActivePromotions(req, res) {
    try {
        const { tiket_id, biaya_jasa } = req.query;
        const now = new Date();

        const promos = await prisma.promotion.findMany({
            where: { is_active: true },
            orderBy: [{ tanggal_selesai: "asc" }, { created_at: "desc" }],
        });

        // Filter only currently running promos with remaining quota
        const running = promos.filter((p) => getPromotionStatus(p, now) === "aktif");

        let ticketCtx = null;
        if (tiket_id) {
            const tiket = await prisma.tiketServis.findUnique({
                where: { id: Number(tiket_id) },
                include: {
                    perangkat: { include: { customer: true } },
                    penggunaan_sparepart: { include: { sparepart: true } },
                },
            });
            if (tiket) {
                const biayaSparepart = (tiket.penggunaan_sparepart || []).reduce(
                    (sum, item) => sum + (Number(item.sparepart?.harga) || 0) * (Number(item.jumlah) || 0),
                    0
                );
                ticketCtx = {
                    tiket,
                    biaya_sparepart: biayaSparepart,
                    biaya_jasa: Math.max(0, Number(biaya_jasa) || 0),
                    jenis_perangkat: tiket.perangkat?.jenis_perangkat || "",
                    sla_paket: tiket.sla_paket || "reguler",
                    customer: tiket.perangkat?.customer || null,
                };
            }
        }

        const results = await Promise.all(
            running.map(async (p) => {
                const sisaKuota = p.kuota_total !== null && p.kuota_total !== undefined
                    ? Math.max(0, p.kuota_total - p.kuota_terpakai)
                    : null;

                let eligibility = null;
                if (ticketCtx) {
                    const alreadyUsed = p.satu_kali_per_pelanggan
                        ? await hasCustomerRedeemedPromo(prisma, p.id, ticketCtx.customer)
                        : false;
                    eligibility = evaluatePromotionEligibility(p, {
                        biaya_jasa: ticketCtx.biaya_jasa,
                        biaya_sparepart: ticketCtx.biaya_sparepart,
                        jenis_perangkat: ticketCtx.jenis_perangkat,
                        sla_paket: ticketCtx.sla_paket,
                        now,
                        customerAlreadyUsed: alreadyUsed,
                    });
                }

                return {
                    id: p.id,
                    kode_promo: p.kode_promo,
                    nama_promo: p.nama_promo,
                    tipe_diskon: p.tipe_diskon,
                    nilai_diskon: p.nilai_diskon,
                    cakupan_diskon: p.cakupan_diskon,
                    maksimal_diskon: p.maksimal_diskon,
                    minimal_transaksi: p.minimal_transaksi,
                    kategori_perangkat: p.kategori_perangkat,
                    tipe_tiket: p.tipe_tiket,
                    tanggal_mulai: p.tanggal_mulai,
                    tanggal_selesai: p.tanggal_selesai,
                    kuota_total: p.kuota_total,
                    kuota_terpakai: p.kuota_terpakai,
                    sisa_kuota: sisaKuota,
                    satu_kali_per_pelanggan: p.satu_kali_per_pelanggan,
                    saluran_promosi: p.saluran_promosi,
                    eligibility,
                };
            })
        );

        return res.json(results);
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat daftar promo aktif", error: error.message });
    }
}

/**
 * POST /api/marketing/promotions/validate
 * Dry-run validation for InvoiceForm before submitting.
 */
async function validatePromotion(req, res) {
    try {
        const { promotion_id, kode_promo, tiket_id, biaya_jasa = 0 } = req.body;

        let promo = null;
        if (promotion_id) {
            promo = await prisma.promotion.findUnique({ where: { id: Number(promotion_id) } });
        } else if (kode_promo) {
            const cleanCode = normalizePromoCode(kode_promo);
            promo = await prisma.promotion.findUnique({ where: { kode_promo: cleanCode } });
        }

        if (!promo) {
            return res.status(404).json({
                eligible: false,
                code: "PROMO_NOT_FOUND",
                message: "Kode promo tidak ditemukan dalam sistem.",
            });
        }

        let biayaSparepart = 0;
        let jenisPerangkat = "";
        let slaPaket = "reguler";
        let customer = null;

        if (tiket_id) {
            const tiket = await prisma.tiketServis.findUnique({
                where: { id: Number(tiket_id) },
                include: {
                    perangkat: { include: { customer: true } },
                    penggunaan_sparepart: { include: { sparepart: true } },
                },
            });
            if (!tiket) {
                return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
            }
            biayaSparepart = (tiket.penggunaan_sparepart || []).reduce(
                (sum, p) => sum + (Number(p.sparepart?.harga) || 0) * (Number(p.jumlah) || 0),
                0
            );
            jenisPerangkat = tiket.perangkat?.jenis_perangkat || "";
            slaPaket = tiket.sla_paket || "reguler";
            customer = tiket.perangkat?.customer || null;
        }

        const alreadyUsed = promo.satu_kali_per_pelanggan && customer
            ? await hasCustomerRedeemedPromo(prisma, promo.id, customer)
            : false;

        const evaluation = evaluatePromotionEligibility(promo, {
            biaya_jasa: Number(biaya_jasa) || 0,
            biaya_sparepart: biayaSparepart,
            jenis_perangkat: jenisPerangkat,
            sla_paket: slaPaket,
            now: new Date(),
            customerAlreadyUsed: alreadyUsed,
        });

        return res.json({
            promotion: {
                id: promo.id,
                kode_promo: promo.kode_promo,
                nama_promo: promo.nama_promo,
                tipe_diskon: promo.tipe_diskon,
                nilai_diskon: promo.nilai_diskon,
                cakupan_diskon: promo.cakupan_diskon,
                maksimal_diskon: promo.maksimal_diskon,
                minimal_transaksi: promo.minimal_transaksi,
                kategori_perangkat: promo.kategori_perangkat,
                sisa_kuota: promo.kuota_total !== null ? Math.max(0, promo.kuota_total - promo.kuota_terpakai) : null,
            },
            ...evaluation,
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memvalidasi promo", error: error.message });
    }
}

/**
 * GET /api/marketing/promotions/:id
 * Detail promo & full redemption tracking list (invoices that used this offer).
 */
async function getPromotionDetail(req, res) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "ID promo tidak valid" });
        }

        const promo = await prisma.promotion.findUnique({
            where: { id },
            include: {
                campaign_notes: {
                    orderBy: [{ tanggal_publikasi: "desc" }, { created_at: "desc" }],
                },
                invoices: {
                    include: {
                        tiket: {
                            include: {
                                perangkat: { include: { customer: true } },
                            },
                        },
                    },
                    orderBy: { created_at: "desc" },
                },
            },
        });

        if (!promo) {
            return res.status(404).json({ message: "Promo tidak ditemukan" });
        }

        const activeInvoices = promo.invoices.filter((inv) => inv.tiket?.status !== "dibatalkan");

        // Determine new vs returning per redeemed invoice
        const customerIds = [
            ...new Set(activeInvoices.map((inv) => inv.tiket?.perangkat?.customer_id).filter(Boolean)),
        ];
        const customerTicketHistories = customerIds.length
            ? await prisma.tiketServis.findMany({
                  where: {
                      status: { not: "dibatalkan" },
                      perangkat: { customer_id: { in: customerIds } },
                  },
                  select: {
                      id: true,
                      created_at: true,
                      perangkat: { select: { customer_id: true } },
                  },
              })
            : [];

        const ticketsByCustomer = new Map();
        for (const t of customerTicketHistories) {
            const cid = t.perangkat?.customer_id;
            if (!cid) continue;
            if (!ticketsByCustomer.has(cid)) ticketsByCustomer.set(cid, []);
            ticketsByCustomer.get(cid).push(t);
        }

        const redemptions = activeInvoices.map((inv) => {
            const cid = inv.tiket?.perangkat?.customer_id;
            const currentTicket = inv.tiket;
            let customerType = "tidak_diketahui";
            if (cid && currentTicket) {
                const history = ticketsByCustomer.get(cid) || [];
                const priorTickets = history.filter(
                    (h) => h.id !== currentTicket.id && new Date(h.created_at) < new Date(currentTicket.created_at)
                );
                customerType = priorTickets.length > 0 ? "returning" : "baru";
            }

            return {
                invoice_id: inv.id,
                nomor_invoice: `INV-${String(inv.id).padStart(4, "0")}`,
                tiket_id: inv.tiket_id,
                nomor_tiket: currentTicket?.nomor_tiket || "-",
                customer_nama: currentTicket?.perangkat?.customer?.nama || "-",
                customer_telepon: currentTicket?.perangkat?.customer?.nomor_telepon || "-",
                perangkat: currentTicket?.perangkat
                    ? `${currentTicket.perangkat.merek} ${currentTicket.perangkat.model}`.trim()
                    : "-",
                jenis_perangkat: currentTicket?.perangkat?.jenis_perangkat || "-",
                biaya_jasa: inv.biaya_jasa,
                biaya_sparepart: inv.biaya_sparepart,
                subtotal: (inv.biaya_jasa || 0) + (inv.biaya_sparepart || 0),
                diskon: inv.diskon || 0,
                total_biaya: inv.total_biaya,
                status_pembayaran: inv.status_pembayaran,
                keterangan_diskon: inv.keterangan_diskon,
                customer_type: customerType,
                created_at: inv.created_at,
            };
        });

        const totalDiskon = redemptions.reduce((s, r) => s + r.diskon, 0);
        const totalOmsetBersih = redemptions.reduce((s, r) => s + r.total_biaya, 0);
        const totalOmsetKotor = redemptions.reduce((s, r) => s + r.subtotal, 0);

        const { invoices, ...promoData } = promo;
        return res.json({
            ...promoData,
            status: getPromotionStatus(promo),
            sisa_kuota: promo.kuota_total !== null ? Math.max(0, promo.kuota_total - promo.kuota_terpakai) : null,
            summary: {
                redemptions_count: redemptions.length,
                total_diskon_diberikan: totalDiskon,
                total_omset_bersih: totalOmsetBersih,
                total_omset_kotor: totalOmsetKotor,
                new_customers: redemptions.filter((r) => r.customer_type === "baru").length,
                returning_customers: redemptions.filter((r) => r.customer_type === "returning").length,
            },
            redemptions,
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat detail promo", error: error.message });
    }
}

/**
 * POST /api/marketing/promotions
 */
async function createPromotion(req, res) {
    try {
        const { errors, data } = validatePromoPayload(req.body, false);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0], errors });
        }

        const existing = await prisma.promotion.findUnique({ where: { kode_promo: data.kode_promo } });
        if (existing) {
            return res.status(409).json({ message: `Kode promo "${data.kode_promo}" sudah terdaftar.` });
        }

        const created = await prisma.promotion.create({
            data: {
                ...data,
                created_by_nama: req.user?.nama || req.user?.username || "Admin",
            },
        });

        broadcast("marketing:updated", { id: created.id });
        return res.status(201).json({
            message: "Promo berhasil dibuat",
            data: { ...created, status: getPromotionStatus(created) },
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Kode promo sudah digunakan." });
        }
        return res.status(500).json({ message: "Gagal membuat promo", error: error.message });
    }
}

/**
 * PUT /api/marketing/promotions/:id
 */
async function updatePromotion(req, res) {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.promotion.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Promo tidak ditemukan" });
        }

        const { errors, data } = validatePromoPayload(req.body, true);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0], errors });
        }

        // Guard date range against existing value if only one date is updated
        const effectiveStart = data.tanggal_mulai || existing.tanggal_mulai;
        const effectiveEnd = data.tanggal_selesai || existing.tanggal_selesai;
        if (effectiveEnd.getTime() < effectiveStart.getTime()) {
            return res.status(400).json({ message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai" });
        }

        // Guard quota cannot be lowered below already redeemed count
        if (data.kuota_total !== undefined && data.kuota_total !== null && data.kuota_total < existing.kuota_terpakai) {
            return res.status(400).json({
                message: `Kuota total tidak boleh lebih kecil dari jumlah yang sudah digunakan (${existing.kuota_terpakai}).`,
            });
        }

        // Guard percentage <= 100 when mixing existing/new fields
        const effectiveType = data.tipe_diskon || existing.tipe_diskon;
        const effectiveVal = data.nilai_diskon !== undefined ? data.nilai_diskon : existing.nilai_diskon;
        if (effectiveType === "persen" && effectiveVal > 100) {
            return res.status(400).json({ message: "Diskon persentase tidak boleh melebihi 100%" });
        }

        if (data.kode_promo && data.kode_promo !== existing.kode_promo) {
            const clash = await prisma.promotion.findUnique({ where: { kode_promo: data.kode_promo } });
            if (clash) {
                return res.status(409).json({ message: `Kode promo "${data.kode_promo}" sudah terdaftar.` });
            }
        }

        const updated = await prisma.promotion.update({
            where: { id },
            data,
        });

        broadcast("marketing:updated", { id: updated.id });
        return res.json({
            message: "Promo berhasil diperbarui",
            data: { ...updated, status: getPromotionStatus(updated) },
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Kode promo sudah digunakan." });
        }
        return res.status(500).json({ message: "Gagal memperbarui promo", error: error.message });
    }
}

/**
 * PATCH /api/marketing/promotions/:id/toggle
 */
async function togglePromotion(req, res) {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.promotion.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Promo tidak ditemukan" });
        }

        const updated = await prisma.promotion.update({
            where: { id },
            data: { is_active: !existing.is_active },
        });

        broadcast("marketing:updated", { id: updated.id });
        return res.json({
            message: updated.is_active ? "Promo diaktifkan kembali" : "Promo dinonaktifkan",
            data: { ...updated, status: getPromotionStatus(updated) },
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal mengubah status promo", error: error.message });
    }
}

/**
 * DELETE /api/marketing/promotions/:id
 * Blocks hard deletion if promotion was already redeemed on invoices to preserve audit trail.
 */
async function deletePromotion(req, res) {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.promotion.findUnique({
            where: { id },
            include: { _count: { select: { invoices: true } } },
        });
        if (!existing) {
            return res.status(404).json({ message: "Promo tidak ditemukan" });
        }

        if (existing._count.invoices > 0) {
            return res.status(400).json({
                message: `Promo "${existing.nama_promo}" sudah digunakan pada ${existing._count.invoices} invoice. Nonaktifkan promo ini agar riwayat keuangan tetap utuh.`,
            });
        }

        await prisma.promotion.delete({ where: { id } });
        broadcast("marketing:updated", { id });
        return res.json({ message: "Promo berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menghapus promo", error: error.message });
    }
}

/**
 * GET /api/marketing/outreach
 * Filter active customers for targeted promotional outreach (copyable list / CSV / 1-click WA).
 */
async function getOutreachList(req, res) {
    try {
        const {
            kategori_perangkat = "Semua",
            min_days_since_visit = 0,
            min_tickets = 0,
            search = "",
        } = req.query;

        const minDays = Math.max(0, Number(min_days_since_visit) || 0);
        const minTicketsNum = Math.max(0, Number(min_tickets) || 0);
        const nowMs = Date.now();

        const customers = await prisma.customer.findMany({
            where: {
                is_active: true,
                deleted_at: null,
            },
            include: {
                perangkat: {
                    include: {
                        tiket_servis: {
                            where: { status: { not: "dibatalkan" } },
                            include: { invoice: { select: { total_biaya: true } } },
                            orderBy: { created_at: "desc" },
                        },
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        const items = [];
        for (const c of customers) {
            const devices = c.perangkat || [];
            const allTickets = devices.flatMap((d) =>
                (d.tiket_servis || []).map((t) => ({
                    ...t,
                    jenis_perangkat: d.jenis_perangkat,
                    device_label: `${d.merek || ""} ${d.model || ""}`.trim(),
                }))
            );

            // Category filter
            if (kategori_perangkat && kategori_perangkat.toLowerCase() !== "semua") {
                const targetCat = kategori_perangkat.toLowerCase();
                const hasDeviceCat = devices.some((d) =>
                    String(d.jenis_perangkat || "").toLowerCase().includes(targetCat)
                );
                if (!hasDeviceCat) continue;
            }

            if (allTickets.length < minTicketsNum) continue;

            // Compute last visit date (prefer tgl_diambil, fallback created_at)
            let lastVisitDate = null;
            let lastDevice = devices[0] ? `${devices[0].merek || ""} ${devices[0].model || ""}`.trim() : "-";
            let lastDeviceCategory = devices[0]?.jenis_perangkat || "-";

            if (allTickets.length > 0) {
                allTickets.sort((a, b) => {
                    const da = new Date(a.tgl_diambil || a.created_at).getTime();
                    const db = new Date(b.tgl_diambil || b.created_at).getTime();
                    return db - da;
                });
                const latest = allTickets[0];
                lastVisitDate = latest.tgl_diambil || latest.created_at;
                lastDevice = latest.device_label || lastDevice;
                lastDeviceCategory = latest.jenis_perangkat || lastDeviceCategory;
            }

            const daysSinceVisit = lastVisitDate
                ? Math.floor((nowMs - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
                : null;

            if (minDays > 0 && (daysSinceVisit === null || daysSinceVisit < minDays)) {
                continue;
            }

            const totalSpend = allTickets.reduce((sum, t) => sum + (Number(t.invoice?.total_biaya) || 0), 0);
            const normalizedTelp = normalizePhone(c.nomor_telepon || "") || c.nomor_telepon || "";

            const q = String(search || "").trim().toLowerCase();
            if (q) {
                const hay = `${c.nama} ${normalizedTelp} ${lastDevice} ${lastDeviceCategory}`.toLowerCase();
                if (!hay.includes(q)) continue;
            }

            items.push({
                id: c.id,
                nama: c.nama,
                nomor_telepon: normalizedTelp,
                tipe_kepribadian: c.tipe_kepribadian || "Netral",
                device_categories: [...new Set(devices.map((d) => d.jenis_perangkat).filter(Boolean))],
                last_device: lastDevice,
                last_device_category: lastDeviceCategory,
                total_tickets: allTickets.length,
                total_spend: totalSpend,
                last_visit_at: lastVisitDate,
                days_since_visit: daysSinceVisit,
            });
        }

        // Sort: longest absent customers first (best outreach candidates), then highest spend
        items.sort((a, b) => {
            const da = a.days_since_visit ?? -1;
            const db = b.days_since_visit ?? -1;
            if (db !== da) return db - da;
            return b.total_spend - a.total_spend;
        });

        return res.json({
            total: items.length,
            customers: items,
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat daftar outreach pelanggan", error: error.message });
    }
}

/**
 * GET /api/marketing/report
 * Compare offers by redemptions, discount granted, invoice value, and new vs returning customers.
 */
async function getMarketingReport(req, res) {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate) {
            const s = parseWibStartDate(startDate);
            if (s) dateFilter.gte = s;
        }
        if (endDate) {
            const e = parseWibEndDate(endDate);
            if (e) dateFilter.lte = e;
        }
        const invoiceDateWhere = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};

        const [promotions, allInvoices] = await Promise.all([
            prisma.promotion.findMany({
                orderBy: [{ created_at: "desc" }],
            }),
            prisma.invoice.findMany({
                where: {
                    ...invoiceDateWhere,
                    tiket: { status: { not: "dibatalkan" } },
                },
                include: {
                    tiket: {
                        select: {
                            id: true,
                            created_at: true,
                            perangkat: { select: { customer_id: true } },
                        },
                    },
                },
            }),
        ]);

        // Load prior ticket timestamps for customers who redeemed any promo
        const promoInvoices = allInvoices.filter((inv) => inv.promotion_id !== null);
        const manualDiscountInvoices = allInvoices.filter((inv) => inv.promotion_id === null && (Number(inv.diskon) || 0) > 0);

        const promoCustomerIds = [
            ...new Set(promoInvoices.map((inv) => inv.tiket?.perangkat?.customer_id).filter(Boolean)),
        ];

        const customerTickets = promoCustomerIds.length
            ? await prisma.tiketServis.findMany({
                  where: {
                      status: { not: "dibatalkan" },
                      perangkat: { customer_id: { in: promoCustomerIds } },
                  },
                  select: {
                      id: true,
                      created_at: true,
                      perangkat: { select: { customer_id: true } },
                  },
              })
            : [];

        const ticketsByCustomer = new Map();
        for (const t of customerTickets) {
            const cid = t.perangkat?.customer_id;
            if (!cid) continue;
            if (!ticketsByCustomer.has(cid)) ticketsByCustomer.set(cid, []);
            ticketsByCustomer.get(cid).push(t);
        }

        const invoicesByPromo = new Map();
        for (const inv of promoInvoices) {
            if (!invoicesByPromo.has(inv.promotion_id)) invoicesByPromo.set(inv.promotion_id, []);
            invoicesByPromo.get(inv.promotion_id).push(inv);
        }

        const now = new Date();
        const offers = promotions.map((p) => {
            const list = invoicesByPromo.get(p.id) || [];
            let totalDiskon = 0;
            let totalOmsetBersih = 0;
            let totalOmsetKotor = 0;
            let newCustomers = 0;
            let returningCustomers = 0;
            let unknownCustomers = 0;

            for (const inv of list) {
                totalDiskon += Number(inv.diskon) || 0;
                totalOmsetBersih += Number(inv.total_biaya) || 0;
                totalOmsetKotor += (Number(inv.biaya_jasa) || 0) + (Number(inv.biaya_sparepart) || 0);

                const cid = inv.tiket?.perangkat?.customer_id;
                if (!cid || !inv.tiket?.created_at) {
                    unknownCustomers += 1;
                } else {
                    const history = ticketsByCustomer.get(cid) || [];
                    const hasPrior = history.some(
                        (h) => h.id !== inv.tiket.id && new Date(h.created_at) < new Date(inv.tiket.created_at)
                    );
                    if (hasPrior) returningCustomers += 1;
                    else newCustomers += 1;
                }
            }

            return {
                id: p.id,
                kode_promo: p.kode_promo,
                nama_promo: p.nama_promo,
                saluran_promosi: p.saluran_promosi || "-",
                status: getPromotionStatus(p, now),
                kuota_total: p.kuota_total,
                kuota_terpakai: p.kuota_terpakai,
                sisa_kuota: p.kuota_total !== null ? Math.max(0, p.kuota_total - p.kuota_terpakai) : null,
                redemptions: list.length,
                total_diskon: totalDiskon,
                total_omset_bersih: totalOmsetBersih,
                total_omset_kotor: totalOmsetKotor,
                avg_invoice_value: list.length > 0 ? Math.round(totalOmsetBersih / list.length) : 0,
                new_customers: newCustomers,
                returning_customers: returningCustomers,
                unknown_customers: unknownCustomers,
            };
        });

        offers.sort((a, b) => b.redemptions - a.redemptions || b.total_omset_bersih - a.total_omset_bersih);

        const totalPromoRedemptions = promoInvoices.length;
        const totalPromoDiskon = promoInvoices.reduce((s, inv) => s + (Number(inv.diskon) || 0), 0);
        const totalPromoRevenue = promoInvoices.reduce((s, inv) => s + (Number(inv.total_biaya) || 0), 0);
        const totalManualDiskon = manualDiscountInvoices.reduce((s, inv) => s + (Number(inv.diskon) || 0), 0);

        return res.json({
            summary: {
                total_promotions: promotions.length,
                active_promotions: promotions.filter((p) => getPromotionStatus(p, now) === "aktif").length,
                total_redemptions: totalPromoRedemptions,
                total_promo_diskon: totalPromoDiskon,
                total_promo_revenue: totalPromoRevenue,
                total_manual_discount_count: manualDiscountInvoices.length,
                total_manual_diskon: totalManualDiskon,
                total_new_customers: offers.reduce((s, o) => s + o.new_customers, 0),
                total_returning_customers: offers.reduce((s, o) => s + o.returning_customers, 0),
            },
            offers,
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat laporan marketing", error: error.message });
    }
}

function sanitizeReferenceLink(raw) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (!str) return null;
    const lower = str.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
        return { error: "Format tautan tidak diizinkan." };
    }
    return str.slice(0, 500);
}

/**
 * GET /api/marketing/campaigns
 * Dedicated Campaign Notes timeline across channels & offers.
 */
async function listCampaignNotes(req, res) {
    try {
        const { search = "", saluran = "all", promotion_id = "" } = req.query;
        const where = {};
        if (saluran && saluran !== "all") {
            where.saluran = saluran;
        }
        if (promotion_id && promotion_id !== "all") {
            if (promotion_id === "none") {
                where.promotion_id = null;
            } else {
                const pid = Number(promotion_id);
                if (!Number.isNaN(pid)) where.promotion_id = pid;
            }
        }

        const notes = await prisma.campaignNote.findMany({
            where,
            include: {
                promotion: {
                    select: { id: true, kode_promo: true, nama_promo: true, is_active: true },
                },
            },
            orderBy: [{ tanggal_publikasi: "desc" }, { created_at: "desc" }],
        });

        const q = String(search || "").trim().toLowerCase();
        const filtered = q
            ? notes.filter((n) => {
                  const hay = `${n.judul} ${n.saluran} ${n.catatan || ""} ${n.tautan_referensi || ""} ${n.promotion?.kode_promo || ""} ${n.promotion?.nama_promo || ""}`.toLowerCase();
                  return hay.includes(q);
              })
            : notes;

        return res.json(filtered);
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat catatan kampanye", error: error.message });
    }
}

/**
 * POST /api/marketing/campaigns
 */
async function createCampaignNote(req, res) {
    try {
        const { judul, saluran, tanggal_publikasi, promotion_id, tautan_referensi, catatan } = req.body;

        const cleanJudul = String(judul || "").trim();
        const cleanSaluran = String(saluran || "").trim();
        const parsedDate = parseWibStartDate(tanggal_publikasi);

        if (!cleanJudul) return res.status(400).json({ message: "Judul aktivitas kampanye wajib diisi" });
        if (!cleanSaluran) return res.status(400).json({ message: "Saluran promosi wajib dipilih" });
        if (!parsedDate) return res.status(400).json({ message: "Tanggal publikasi wajib valid" });

        const cleanLink = sanitizeReferenceLink(tautan_referensi);
        if (cleanLink && typeof cleanLink === "object" && cleanLink.error) {
            return res.status(400).json({ message: cleanLink.error });
        }

        let promoIdVal = null;
        if (promotion_id !== undefined && promotion_id !== null && String(promotion_id).trim() !== "") {
            const pid = Number(promotion_id);
            const exists = await prisma.promotion.findUnique({ where: { id: pid }, select: { id: true } });
            if (!exists) return res.status(404).json({ message: "Promo terkait tidak ditemukan" });
            promoIdVal = pid;
        }

        const created = await prisma.campaignNote.create({
            data: {
                judul: cleanJudul.slice(0, 150),
                saluran: cleanSaluran.slice(0, 100),
                tanggal_publikasi: parsedDate,
                promotion_id: promoIdVal,
                tautan_referensi: cleanLink,
                catatan: catatan ? String(catatan).trim() : null,
                created_by_nama: req.user?.nama || req.user?.username || "Admin",
            },
            include: {
                promotion: { select: { id: true, kode_promo: true, nama_promo: true, is_active: true } },
            },
        });

        broadcast("marketing:updated", { campaign_id: created.id, promotion_id: promoIdVal });
        return res.status(201).json({ message: "Catatan kampanye berhasil ditambahkan", data: created });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menambahkan catatan kampanye", error: error.message });
    }
}

/**
 * PUT /api/marketing/campaigns/:id
 */
async function updateCampaignNote(req, res) {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.campaignNote.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: "Catatan kampanye tidak ditemukan" });

        const { judul, saluran, tanggal_publikasi, promotion_id, tautan_referensi, catatan } = req.body;
        const updateData = {};

        if (judul !== undefined) {
            const cleanJudul = String(judul).trim();
            if (!cleanJudul) return res.status(400).json({ message: "Judul aktivitas kampanye tidak boleh kosong" });
            updateData.judul = cleanJudul.slice(0, 150);
        }
        if (saluran !== undefined) {
            const cleanSaluran = String(saluran).trim();
            if (!cleanSaluran) return res.status(400).json({ message: "Saluran promosi wajib dipilih" });
            updateData.saluran = cleanSaluran.slice(0, 100);
        }
        if (tanggal_publikasi !== undefined) {
            const parsedDate = parseWibStartDate(tanggal_publikasi);
            if (!parsedDate) return res.status(400).json({ message: "Tanggal publikasi tidak valid" });
            updateData.tanggal_publikasi = parsedDate;
        }
        if (tautan_referensi !== undefined) {
            const cleanLink = sanitizeReferenceLink(tautan_referensi);
            if (cleanLink && typeof cleanLink === "object" && cleanLink.error) {
                return res.status(400).json({ message: cleanLink.error });
            }
            updateData.tautan_referensi = cleanLink;
        }
        if (catatan !== undefined) {
            updateData.catatan = catatan ? String(catatan).trim() : null;
        }
        if (promotion_id !== undefined) {
            if (promotion_id === null || String(promotion_id).trim() === "") {
                updateData.promotion_id = null;
            } else {
                const pid = Number(promotion_id);
                const exists = await prisma.promotion.findUnique({ where: { id: pid }, select: { id: true } });
                if (!exists) return res.status(404).json({ message: "Promo terkait tidak ditemukan" });
                updateData.promotion_id = pid;
            }
        }

        const updated = await prisma.campaignNote.update({
            where: { id },
            data: updateData,
            include: {
                promotion: { select: { id: true, kode_promo: true, nama_promo: true, is_active: true } },
            },
        });

        broadcast("marketing:updated", { campaign_id: updated.id });
        return res.json({ message: "Catatan kampanye berhasil diperbarui", data: updated });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memperbarui catatan kampanye", error: error.message });
    }
}

/**
 * DELETE /api/marketing/campaigns/:id
 */
async function deleteCampaignNote(req, res) {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.campaignNote.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: "Catatan kampanye tidak ditemukan" });

        await prisma.campaignNote.delete({ where: { id } });
        broadcast("marketing:updated", { campaign_id: id });
        return res.json({ message: "Catatan kampanye berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menghapus catatan kampanye", error: error.message });
    }
}

module.exports = {
    hasCustomerRedeemedPromo,
    listPromotions,
    listActivePromotions,
    validatePromotion,
    getPromotionDetail,
    createPromotion,
    updatePromotion,
    togglePromotion,
    deletePromotion,
    getOutreachList,
    getMarketingReport,
    listCampaignNotes,
    createCampaignNote,
    updateCampaignNote,
    deleteCampaignNote,
};
