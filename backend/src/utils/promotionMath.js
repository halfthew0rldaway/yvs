/**
 * Pure business logic helpers for Marketing Promotions, WIB date boundaries,
 * HPP-safe discount calculation, and eligibility evaluation.
 */

const VALID_DISCOUNT_TYPES = ["persen", "nominal"];
const VALID_DISCOUNT_SCOPES = ["jasa", "sparepart", "total"];

/**
 * Normalize promotion code: uppercase, strip spaces, keep alphanumeric / dash / underscore.
 */
function normalizePromoCode(raw) {
    if (typeof raw !== "string") return "";
    return raw
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "-")
        .replace(/[^A-Z0-9_-]/g, "")
        .slice(0, 50);
}

/**
 * Parse a YYYY-MM-DD string or Date into start-of-day WIB (00:00:00.000+07:00).
 */
function parseWibStartDate(input) {
    if (!input) return null;
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
        return new Date(`${input.trim()}T00:00:00.000+07:00`);
    }
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Parse a YYYY-MM-DD string or Date into end-of-day WIB (23:59:59.999+07:00)
 * so promotions never expire prematurely during the final active business day.
 */
function parseWibEndDate(input) {
    if (!input) return null;
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
        return new Date(`${input.trim()}T23:59:59.999+07:00`);
    }
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    // If timestamp is midnight UTC (date-only serialization), treat it as WIB end-of-day
    if (
        d.getUTCHours() === 0 &&
        d.getUTCMinutes() === 0 &&
        d.getUTCSeconds() === 0 &&
        d.getUTCMilliseconds() === 0
    ) {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        return new Date(`${yyyy}-${mm}-${dd}T23:59:59.999+07:00`);
    }
    return d;
}

/**
 * Check if `now` falls inside the promotion's active WIB date window.
 */
function getDateWindowState(promo, now = new Date()) {
    const start = parseWibStartDate(promo?.tanggal_mulai);
    const end = parseWibEndDate(promo?.tanggal_selesai);
    const current = now instanceof Date ? now : new Date(now);

    if (start && current.getTime() < start.getTime()) {
        return "not_started";
    }
    if (end && current.getTime() > end.getTime()) {
        return "expired";
    }
    return "active";
}

/**
 * Compute human-readable promotion lifecycle status.
 */
function getPromotionStatus(promo, now = new Date()) {
    if (!promo) return "nonaktif";
    if (!promo.is_active) return "nonaktif";
    if (promo.kuota_total !== null && promo.kuota_total !== undefined && promo.kuota_terpakai >= promo.kuota_total) {
        return "habis";
    }
    const windowState = getDateWindowState(promo, now);
    if (windowState === "not_started") return "terjadwal";
    if (windowState === "expired") return "berakhir";
    return "aktif";
}

/**
 * Check device category eligibility (supports "Semua" or comma-separated list).
 */
function matchesDeviceCategory(promoCategory, deviceType) {
    const raw = String(promoCategory || "Semua").trim();
    if (!raw || raw.toLowerCase() === "semua") return true;

    const target = String(deviceType || "").trim().toLowerCase();
    if (!target) return false;

    const allowed = raw
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);

    if (allowed.includes("semua")) return true;

    return allowed.some((cat) => target === cat || target.includes(cat) || cat.includes(target));
}

/**
 * Check ticket SLA/type eligibility ("Semua", "reguler", "prioritas", etc.).
 */
function matchesTicketType(promoTicketType, slaPaket) {
    const raw = String(promoTicketType || "Semua").trim().toLowerCase();
    if (!raw || raw === "semua") return true;

    const target = String(slaPaket || "reguler").trim().toLowerCase();
    return target === raw;
}

/**
 * Calculate HPP-safe discount based on promotion rule & scope boundary.
 * Never exceeds its target scope base amount (e.g. jasa-only promo cannot eat into sparepart HPP)
 * and never exceeds the total subtotal.
 */
function calculatePromotionDiscount(promo, { biaya_jasa = 0, biaya_sparepart = 0 } = {}) {
    const jasa = Math.max(0, Number(biaya_jasa) || 0);
    const sparepart = Math.max(0, Number(biaya_sparepart) || 0);
    const subtotal = jasa + sparepart;

    const scope = VALID_DISCOUNT_SCOPES.includes(String(promo?.cakupan_diskon || "").toLowerCase())
        ? String(promo.cakupan_diskon).toLowerCase()
        : "jasa";

    const baseAmount = scope === "jasa" ? jasa : scope === "sparepart" ? sparepart : subtotal;
    const tipe = String(promo?.tipe_diskon || "persen").toLowerCase();
    const nilai = Math.max(0, Number(promo?.nilai_diskon) || 0);

    let rawDiscount = 0;
    if (tipe === "persen") {
        const clampedPct = Math.min(100, nilai);
        rawDiscount = Math.round((baseAmount * clampedPct) / 100);
        const cap = promo?.maksimal_diskon !== null && promo?.maksimal_diskon !== undefined
            ? Number(promo.maksimal_diskon)
            : null;
        if (cap !== null && !Number.isNaN(cap) && cap > 0) {
            rawDiscount = Math.min(rawDiscount, cap);
        }
    } else {
        rawDiscount = nilai;
    }

    // Strict boundary: cannot exceed target scope base nor overall subtotal
    const discount = Math.max(0, Math.round(Math.min(rawDiscount, baseAmount, subtotal)));
    const totalAfterDiscount = Math.max(0, subtotal - discount);

    return {
        discount,
        baseAmount,
        subtotal,
        totalAfterDiscount,
        scope,
    };
}

/**
 * Full eligibility evaluation for a promotion against a service ticket & cashier inputs.
 */
function evaluatePromotionEligibility(
    promo,
    {
        biaya_jasa = 0,
        biaya_sparepart = 0,
        jenis_perangkat = "",
        sla_paket = "reguler",
        now = new Date(),
        customerAlreadyUsed = false,
    } = {}
) {
    if (!promo) {
        return { eligible: false, code: "PROMO_NOT_FOUND", reason: "Promo tidak ditemukan." };
    }

    if (!promo.is_active) {
        return { eligible: false, code: "PROMO_INACTIVE", reason: "Promo ini sedang nonaktif." };
    }

    const windowState = getDateWindowState(promo, now);
    if (windowState === "not_started") {
        return { eligible: false, code: "PROMO_NOT_STARTED", reason: "Periode promo ini belum dimulai." };
    }
    if (windowState === "expired") {
        return { eligible: false, code: "PROMO_EXPIRED", reason: "Masa berlaku promo ini telah berakhir." };
    }

    if (promo.kuota_total !== null && promo.kuota_total !== undefined && promo.kuota_terpakai >= promo.kuota_total) {
        return { eligible: false, code: "PROMO_QUOTA_EXHAUSTED", reason: "Kuota penukaran promo ini sudah habis." };
    }

    if (!matchesDeviceCategory(promo.kategori_perangkat, jenis_perangkat)) {
        return {
            eligible: false,
            code: "PROMO_CATEGORY_MISMATCH",
            reason: `Promo ini khusus kategori perangkat ${promo.kategori_perangkat} (unit saat ini: ${jenis_perangkat || "Tidak diketahui"}).`,
        };
    }

    if (!matchesTicketType(promo.tipe_tiket, sla_paket)) {
        return {
            eligible: false,
            code: "PROMO_TICKET_TYPE_MISMATCH",
            reason: `Promo ini khusus tiket layanan ${promo.tipe_tiket}.`,
        };
    }

    const jasa = Math.max(0, Number(biaya_jasa) || 0);
    const sparepart = Math.max(0, Number(biaya_sparepart) || 0);
    const subtotal = jasa + sparepart;
    const minTx = Math.max(0, Number(promo.minimal_transaksi) || 0);

    if (minTx > 0 && subtotal < minTx) {
        return {
            eligible: false,
            code: "PROMO_MIN_TRANSACTION",
            reason: `Minimal subtotal transaksi Rp ${minTx.toLocaleString("id-ID")} (saat ini Rp ${subtotal.toLocaleString("id-ID")}).`,
        };
    }

    if (promo.satu_kali_per_pelanggan && customerAlreadyUsed) {
        return {
            eligible: false,
            code: "PROMO_ALREADY_USED",
            reason: "Promo ini hanya berlaku 1 kali per pelanggan dan sudah pernah digunakan oleh nomor telepon ini.",
        };
    }

    const calc = calculatePromotionDiscount(promo, { biaya_jasa: jasa, biaya_sparepart: sparepart });

    if (calc.baseAmount <= 0) {
        const label = calc.scope === "jasa" ? "biaya jasa" : calc.scope === "sparepart" ? "biaya suku cadang" : "subtotal";
        return {
            eligible: false,
            code: "PROMO_ZERO_BASE",
            reason: `Promo tidak dapat diterapkan karena ${label} bernilai Rp 0.`,
        };
    }

    return {
        eligible: true,
        code: "ELIGIBLE",
        reason: null,
        ...calc,
    };
}

module.exports = {
    VALID_DISCOUNT_TYPES,
    VALID_DISCOUNT_SCOPES,
    normalizePromoCode,
    parseWibStartDate,
    parseWibEndDate,
    getDateWindowState,
    getPromotionStatus,
    matchesDeviceCategory,
    matchesTicketType,
    calculatePromotionDiscount,
    evaluatePromotionEligibility,
};
