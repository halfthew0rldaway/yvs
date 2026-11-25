const prisma = require("../config/database");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { broadcast } = require("../utils/sse");
const {
    normalizePromoCode,
    evaluatePromotionEligibility,
    calculatePromotionDiscount,
} = require("../utils/promotionMath");
const { hasCustomerRedeemedPromo } = require("./marketing.controller");

const PROMO_SELECT = {
    id: true,
    kode_promo: true,
    nama_promo: true,
    tipe_diskon: true,
    nilai_diskon: true,
    cakupan_diskon: true,
    saluran_promosi: true,
};

function createHttpError(status, message, code) {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
}

// Mengambil seluruh invoice
async function getAll(req, res) {
    try {
        const { search, startDate, endDate } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);
        const where = {};

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.created_at.lte = end;
            }
        }

        if (search) {
            where.OR = [
                { tiket: { nomor_tiket: { contains: search } } },
                { tiket: { perangkat: { customer: { nama: { contains: search } } } } },
            ];
        }

        const include = {
            promotion: { select: PROMO_SELECT },
            tiket: {
                include: {
                    perangkat: { include: { customer: true } },
                    teknisi: { select: { id: true, nama: true } },
                },
            },
        };

        const orderBy = [{ created_at: "desc" }, { id: "desc" }];

        if (!isPaginated) {
            const invoices = await prisma.invoice.findMany({
                where,
                include,
                orderBy,
                take: 100, // Safety cap to prevent unconstrained query exhaustion
            });
            return res.json(invoices);
        }

        const [total, invoices] = await Promise.all([
            prisma.invoice.count({ where }),
            prisma.invoice.findMany({
                where,
                include,
                orderBy,
                skip,
                take: limit,
            }),
        ]);

        return res.json(buildPaginationResponse(invoices, total, page, limit));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Membuat invoice baru
// Membuat invoice baru (ACID transaction untuk penguncian kuota promo & perlindungan race condition)
async function create(req, res) {
    try {
        const {
            tiket_id,
            biaya_jasa,
            diskon = 0,
            promotion_id = null,
            kode_promo = null,
            keterangan_diskon = null,
            nominal_dp = 0,
            status_pembayaran,
            metode_pembayaran = "Tunai",
            catatan
        } = req.body;

        const jasa = Number(biaya_jasa);
        if (biaya_jasa === "" || biaya_jasa === undefined || biaya_jasa === null || Number.isNaN(jasa) || jasa < 0) {
            return res.status(400).json({ message: "Biaya jasa harus berupa angka dan tidak boleh negatif" });
        }

        const dp = Math.max(0, Number(nominal_dp) || 0);

        const invoice = await prisma.$transaction(async (tx) => {
            const tiket = await tx.tiketServis.findUnique({
                where: { id: Number(tiket_id) },
                include: {
                    invoice: true,
                    perangkat: { include: { customer: true } },
                    penggunaan_sparepart: { include: { sparepart: true } },
                },
            });

            if (!tiket) {
                throw createHttpError(404, "Tiket servis tidak ditemukan", "TICKET_NOT_FOUND");
            }

            if (tiket.status === "dibatalkan") {
                throw createHttpError(400, "Tidak dapat menerbitkan invoice untuk tiket yang telah dibatalkan.", "TICKET_CANCELLED");
            }

            if (tiket.invoice) {
                throw createHttpError(400, "Invoice untuk tiket ini sudah ada", "INVOICE_EXISTS");
            }

            const biaya_sparepart = (tiket.penggunaan_sparepart || []).reduce((total, p) => {
                return total + (Number(p.sparepart?.harga) || 0) * (Number(p.jumlah) || 0);
            }, 0);

            const subtotal = jasa + biaya_sparepart;
            let finalDisc = 0;
            let finalPromotionId = null;
            let finalKeteranganDiskon = null;

            const hasPromoInput =
                (promotion_id !== null && promotion_id !== undefined && String(promotion_id).trim() !== "") ||
                (kode_promo !== null && kode_promo !== undefined && String(kode_promo).trim() !== "");

            if (hasPromoInput) {
                let promo = null;
                if (promotion_id !== null && promotion_id !== undefined && String(promotion_id).trim() !== "") {
                    promo = await tx.promotion.findUnique({ where: { id: Number(promotion_id) } });
                } else {
                    const cleanCode = normalizePromoCode(String(kode_promo));
                    promo = await tx.promotion.findUnique({ where: { kode_promo: cleanCode } });
                }

                if (!promo) {
                    throw createHttpError(404, "Promo yang dipilih tidak ditemukan.", "PROMO_NOT_FOUND");
                }

                const customerAlreadyUsed = promo.satu_kali_per_pelanggan
                    ? await hasCustomerRedeemedPromo(tx, promo.id, tiket.perangkat?.customer)
                    : false;

                const evaluation = evaluatePromotionEligibility(promo, {
                    biaya_jasa: jasa,
                    biaya_sparepart,
                    jenis_perangkat: tiket.perangkat?.jenis_perangkat || "",
                    sla_paket: tiket.sla_paket || "reguler",
                    now: new Date(),
                    customerAlreadyUsed,
                });

                if (!evaluation.eligible) {
                    throw createHttpError(400, evaluation.reason, evaluation.code);
                }

                // Atomic optimistic quota lock: protects against concurrent cashiers claiming the last slot
                const quotaGuard =
                    promo.kuota_total !== null && promo.kuota_total !== undefined
                        ? { id: promo.id, is_active: true, kuota_terpakai: { lt: promo.kuota_total } }
                        : { id: promo.id, is_active: true };

                const claimResult = await tx.promotion.updateMany({
                    where: quotaGuard,
                    data: { kuota_terpakai: { increment: 1 } },
                });

                if (claimResult.count === 0) {
                    throw createHttpError(
                        409,
                        "Maaf, kuota promo baru saja habis terpakai kasir lain atau promo telah dinonaktifkan.",
                        "PROMO_QUOTA_RACE"
                    );
                }

                finalDisc = evaluation.discount;
                finalPromotionId = promo.id;
                finalKeteranganDiskon = keterangan_diskon && String(keterangan_diskon).trim()
                    ? String(keterangan_diskon).trim().slice(0, 255)
                    : `Promo: ${promo.nama_promo} (${promo.kode_promo})`.slice(0, 255);
            } else {
                const rawManualDisc = Math.max(0, Number(diskon) || 0);
                finalDisc = Math.min(subtotal, Math.round(rawManualDisc));
                finalKeteranganDiskon = finalDisc > 0
                    ? (keterangan_diskon && String(keterangan_diskon).trim()
                        ? String(keterangan_diskon).trim().slice(0, 255)
                        : "Penyesuaian Harga / Apresiasi")
                    : null;
            }

            const total_biaya = Math.max(0, subtotal - finalDisc);

            // Tentukan status pembayaran otomatis jika tidak dispesifikasikan eksplisit
            let statusBayar = status_pembayaran;
            if (!statusBayar) {
                if (dp >= total_biaya || total_biaya === 0) {
                    statusBayar = "lunas";
                } else if (dp > 0) {
                    statusBayar = "dp_awal";
                } else {
                    statusBayar = "belum_lunas";
                }
            }

            return tx.invoice.create({
                data: {
                    tiket_id: Number(tiket_id),
                    biaya_jasa: jasa,
                    biaya_sparepart,
                    diskon: finalDisc,
                    promotion_id: finalPromotionId,
                    keterangan_diskon: finalKeteranganDiskon,
                    nominal_dp: dp,
                    total_biaya,
                    status_pembayaran: statusBayar,
                    metode_pembayaran: String(metode_pembayaran || "Tunai").trim(),
                    catatan: catatan ? String(catatan).trim() : null,
                },
                include: {
                    promotion: { select: PROMO_SELECT },
                    tiket: {
                        include: {
                            perangkat: { include: { customer: true } },
                            penggunaan_sparepart: { include: { sparepart: true } },
                        },
                    },
                },
            });
        });

        broadcast("invoice:created", { id: invoice.id, tiket_id: invoice.tiket_id });
        broadcast("dashboard:refresh");
        if (invoice.promotion_id) {
            broadcast("marketing:updated", { id: invoice.promotion_id });
        }

        return res.status(201).json({ message: "Invoice berhasil dibuat", data: invoice });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message, code: error.code });
        }
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui biaya jasa & status pembayaran invoice
async function update(req, res) {
    try {
        const id = Number(req.params.id);
        const {
            biaya_jasa,
            diskon,
            keterangan_diskon,
            remove_promotion = false,
            nominal_dp,
            status_pembayaran,
            metode_pembayaran,
            catatan
        } = req.body;

        const { updated, promoTouchedId } = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id },
                include: { tiket: true, promotion: true },
            });

            if (!invoice) {
                throw createHttpError(404, "Invoice tidak ditemukan", "INVOICE_NOT_FOUND");
            }

            const jasa = biaya_jasa !== undefined ? Number(biaya_jasa) : invoice.biaya_jasa;
            if (Number.isNaN(jasa) || jasa < 0) {
                throw createHttpError(400, "Biaya jasa harus berupa angka dan tidak boleh negatif", "INVALID_JASA");
            }

            const subtotal = jasa + invoice.biaya_sparepart;
            let finalPromotionId = invoice.promotion_id;
            let finalDisc = invoice.diskon || 0;
            let finalKeteranganDiskon = invoice.keterangan_diskon;
            let touchedPromo = null;

            if (remove_promotion && invoice.promotion_id) {
                await tx.promotion.updateMany({
                    where: { id: invoice.promotion_id, kuota_terpakai: { gt: 0 } },
                    data: { kuota_terpakai: { decrement: 1 } },
                });
                touchedPromo = invoice.promotion_id;
                finalPromotionId = null;
                finalDisc = diskon !== undefined ? Math.min(subtotal, Math.max(0, Number(diskon) || 0)) : 0;
                finalKeteranganDiskon = finalDisc > 0
                    ? (keterangan_diskon ? String(keterangan_diskon).trim().slice(0, 255) : "Penyesuaian Harga / Apresiasi")
                    : null;
            } else if (invoice.promotion_id && invoice.promotion) {
                // Re-evaluate discount cleanly if biaya_jasa changed while promo remains linked
                if (biaya_jasa !== undefined) {
                    const recalc = calculatePromotionDiscount(invoice.promotion, {
                        biaya_jasa: jasa,
                        biaya_sparepart: invoice.biaya_sparepart,
                    });
                    finalDisc = recalc.discount;
                }
                if (keterangan_diskon !== undefined) {
                    finalKeteranganDiskon = keterangan_diskon ? String(keterangan_diskon).trim().slice(0, 255) : invoice.keterangan_diskon;
                }
            } else {
                finalDisc = diskon !== undefined
                    ? Math.min(subtotal, Math.max(0, Number(diskon) || 0))
                    : Math.min(subtotal, invoice.diskon || 0);
                if (keterangan_diskon !== undefined) {
                    finalKeteranganDiskon = finalDisc > 0 && keterangan_diskon
                        ? String(keterangan_diskon).trim().slice(0, 255)
                        : finalDisc > 0 ? "Penyesuaian Harga / Apresiasi" : null;
                } else if (finalDisc === 0) {
                    finalKeteranganDiskon = null;
                }
            }

            const dp = nominal_dp !== undefined ? Math.max(0, Number(nominal_dp) || 0) : (invoice.nominal_dp || 0);
            const total_biaya = Math.max(0, subtotal - finalDisc);

            let statusBayar = status_pembayaran !== undefined ? status_pembayaran : invoice.status_pembayaran;
            if (!statusBayar && status_pembayaran === undefined) {
                if (dp >= total_biaya || total_biaya === 0) {
                    statusBayar = "lunas";
                } else if (dp > 0) {
                    statusBayar = "dp_awal";
                } else {
                    statusBayar = "belum_lunas";
                }
            }

            const result = await tx.invoice.update({
                where: { id },
                data: {
                    biaya_jasa: jasa,
                    diskon: finalDisc,
                    promotion_id: finalPromotionId,
                    keterangan_diskon: finalKeteranganDiskon,
                    nominal_dp: dp,
                    total_biaya,
                    status_pembayaran: statusBayar,
                    metode_pembayaran: metode_pembayaran !== undefined ? String(metode_pembayaran).trim() : undefined,
                    catatan: catatan !== undefined ? (catatan ? String(catatan).trim() : null) : undefined,
                },
                include: {
                    promotion: { select: PROMO_SELECT },
                    tiket: {
                        include: {
                            perangkat: { include: { customer: true } },
                            penggunaan_sparepart: { include: { sparepart: true } },
                            teknisi: { select: { nama: true } },
                            diagnosis: true
                        },
                    },
                },
            });

            return { updated: result, promoTouchedId: touchedPromo || result.promotion_id };
        });

        broadcast("invoice:updated", { id: updated.id, tiket_id: updated.tiket_id });
        broadcast("dashboard:refresh");
        if (promoTouchedId) {
            broadcast("marketing:updated", { id: promoTouchedId });
        }

        return res.json({ message: "Invoice berhasil diperbarui", data: updated });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message, code: error.code });
        }
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil detail invoice berdasarkan ID (mendukung pencarian via ID invoice maupun tiket_id)
async function getById(req, res) {
    try {
        const paramId = Number(req.params.id);
        let invoice = await prisma.invoice.findUnique({
            where: { id: paramId },
            include: {
                promotion: { select: PROMO_SELECT },
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        penggunaan_sparepart: { include: { sparepart: true } },
                        teknisi: { select: { nama: true } },
                        diagnosis: true
                    },
                },
            },
        });

        // Fallback: Jika tidak ditemukan dengan invoice id, cari apakah parameter adalah tiket_id
        if (!invoice) {
            invoice = await prisma.invoice.findUnique({
                where: { tiket_id: paramId },
                include: {
                    promotion: { select: PROMO_SELECT },
                    tiket: {
                        include: {
                            perangkat: { include: { customer: true } },
                            penggunaan_sparepart: { include: { sparepart: true } },
                            teknisi: { select: { nama: true } },
                            diagnosis: true
                        },
                    },
                },
            });
        }

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        return res.json(invoice);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil rekapitulasi laporan keuangan & performa servis periodik
async function getReport(req, res) {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        const invoiceWhere = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};
        const tiketWhere = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};

        const [invoices, tikets] = await Promise.all([
            prisma.invoice.findMany({
                where: invoiceWhere,
                include: {
                    tiket: {
                        include: {
                            perangkat: { include: { customer: true } },
                            teknisi: { select: { id: true, nama: true } }
                        }
                    }
                },
                orderBy: { created_at: "desc" }
            }),
            prisma.tiketServis.findMany({
                where: tiketWhere,
                include: {
                    teknisi: { select: { id: true, nama: true } }
                }
            })
        ]);

        const totalPendapatan = invoices.reduce((sum, inv) => sum + inv.total_biaya, 0);
        const totalJasa = invoices.reduce((sum, inv) => sum + inv.biaya_jasa, 0);
        const totalSparepart = invoices.reduce((sum, inv) => sum + inv.biaya_sparepart, 0);

        // Rekap status servis
        const tiketSelesai = tikets.filter(t => ["selesai", "diambil"].includes(t.status)).length;
        const tiketProses = tikets.filter(t => !["selesai", "diambil", "dibatalkan"].includes(t.status)).length;
        const tiketBatal = tikets.filter(t => t.status === "dibatalkan").length;

        // Rekap performa teknisi
        const teknisiMap = {};
        tikets.forEach(t => {
            const nama = t.teknisi?.nama || "Belum Ditugaskan";
            if (!teknisiMap[nama]) {
                teknisiMap[nama] = { nama, totalTiket: 0, tiketSelesai: 0, totalOmset: 0 };
            }
            teknisiMap[nama].totalTiket += 1;
            if (["selesai", "diambil"].includes(t.status)) {
                teknisiMap[nama].tiketSelesai += 1;
            }
        });

        invoices.forEach(inv => {
            const nama = inv.tiket?.teknisi?.nama || "Belum Ditugaskan";
            if (teknisiMap[nama]) {
                teknisiMap[nama].totalOmset += inv.total_biaya;
            }
        });

        const ringkasanTeknisi = Object.values(teknisiMap);

        return res.json({
            summary: {
                totalInvoices: invoices.length,
                totalPendapatan,
                totalJasa,
                totalSparepart,
                totalTiketMasuk: tikets.length,
                tiketSelesai,
                tiketProses,
                tiketBatal
            },
            ringkasanTeknisi,
            invoices
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Simpan Tanda Tangan Pelanggan di Invoice (Kasir / Front Desk)
async function saveCustomerSignature(req, res) {
    try {
        const id = Number(req.params.id);
        const { ttd_customer, ttd_customer_nama } = req.body;

        if (!ttd_customer) {
            return res.status(400).json({ message: "Goresan tanda tangan digital wajib ada" });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { tiket: { include: { perangkat: { include: { customer: true } } } } }
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        const signerName = ttd_customer_nama || invoice.tiket?.perangkat?.customer?.nama || "Pelanggan";
        const signDate = new Date();

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                ttd_customer,
                ttd_customer_at: signDate,
                ttd_customer_nama: signerName
            },
            include: {
                promotion: { select: PROMO_SELECT },
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        penggunaan_sparepart: { include: { sparepart: true } },
                        teknisi: { select: { nama: true } },
                        diagnosis: true
                    }
                }
            }
        });

        // Catat log perbaikan serah terima digital
        await prisma.logPerbaikan.create({
            data: {
                tiket_id: invoice.tiket_id,
                fase: "Penyerahan Unit",
                catatan: `[TTD Kasir] Pelanggan (${signerName}) telah menandatangani nota serah terima secara digital.`
            }
        });

        broadcast("invoice:updated", { id: updated.id, tiket_id: updated.tiket_id });
        broadcast("tiket:updated", { id: updated.tiket_id });
        broadcast("dashboard:refresh");

        return res.json({
            message: "Tanda tangan pelanggan berhasil disimpan",
            data: updated
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menyimpan tanda tangan digital staf/admin/toko pada invoice
async function saveAdminSignature(req, res) {
    try {
        const id = Number(req.params.id);
        const { signature, signer_nama } = req.body;

        if (!signature) {
            return res.status(400).json({ message: "Goresan tanda tangan admin wajib ada" });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { tiket: true }
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        const signerName = signer_nama || req.user?.nama || "Admin Yangversa";
        const signDate = new Date();

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                ttd_admin: signature,
                ttd_admin_at: signDate,
                ttd_admin_nama: signerName
            },
            include: {
                promotion: { select: PROMO_SELECT },
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        penggunaan_sparepart: { include: { sparepart: true } },
                        teknisi: { select: { nama: true } },
                        diagnosis: true
                    }
                }
            }
        });

        broadcast("invoice:updated", { id: updated.id, tiket_id: updated.tiket_id });
        broadcast("tiket:updated", { id: updated.tiket_id });
        broadcast("dashboard:refresh");

        return res.json({
            message: "Tanda tangan petugas workshop berhasil disimpan",
            data: updated
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, create, update, getById, getReport, saveCustomerSignature, saveAdminSignature };

