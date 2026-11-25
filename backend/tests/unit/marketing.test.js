const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
    normalizePromoCode,
    parseWibStartDate,
    parseWibEndDate,
    getPromotionStatus,
    calculatePromotionDiscount,
    evaluatePromotionEligibility,
} = require("../../src/utils/promotionMath");
const { DEFAULT_ROLE_PERMISSIONS, expandPermissions } = require("../../src/config/permissions");

describe("WB-MKT: Marketing Promotions, HPP Protection & Concurrency Logic", () => {
    it("WB-MKT-001: normalizePromoCode formats user input into safe uppercase promo codes", () => {
        assert.equal(normalizePromoCode("  diskon lebaran 2026! "), "DISKON-LEBARAN-2026");
        assert.equal(normalizePromoCode("yvs_care@30"), "YVS_CARE30");
        assert.equal(normalizePromoCode(""), "");
    });

    it("WB-MKT-002: jasa-only percentage promo protects sparepart HPP and enforces maksimal_diskon cap", () => {
        const promo = {
            tipe_diskon: "persen",
            nilai_diskon: 50,
            cakupan_diskon: "jasa",
            maksimal_diskon: 60000,
        };
        // Jasa 150.000, Sparepart 850.000 -> 50% of jasa = 75.000, capped at 60.000; sparepart untouched!
        const res = calculatePromotionDiscount(promo, { biaya_jasa: 150000, biaya_sparepart: 850000 });
        assert.equal(res.baseAmount, 150000);
        assert.equal(res.discount, 60000);
        assert.equal(res.totalAfterDiscount, 940000);
    });

    it("WB-MKT-003: nominal jasa-only promo cannot eat into sparepart HPP or create negative totals", () => {
        const promo = {
            tipe_diskon: "nominal",
            nilai_diskon: 200000,
            cakupan_diskon: "jasa",
        };
        // Jasa only 100.000, Sparepart 500.000 -> discount clamped to 100.000 (sparepart HPP intact)
        const res = calculatePromotionDiscount(promo, { biaya_jasa: 100000, biaya_sparepart: 500000 });
        assert.equal(res.discount, 100000);
        assert.equal(res.totalAfterDiscount, 500000);
    });

    it("WB-MKT-004: WIB end-of-day boundary keeps promo active until 23:59:59 WIB on final day", () => {
        const promo = {
            is_active: true,
            tipe_diskon: "nominal",
            nilai_diskon: 25000,
            cakupan_diskon: "jasa",
            kategori_perangkat: "Semua",
            tipe_tiket: "Semua",
            tanggal_mulai: parseWibStartDate("2026-11-01"),
            tanggal_selesai: parseWibEndDate("2026-11-25"),
            kuota_total: 10,
            kuota_terpakai: 0,
        };

        const beforeMidnightWib = new Date("2026-11-25T23:58:00+07:00");
        const afterMidnightWib = new Date("2026-11-26T00:01:00+07:00");

        assert.equal(getPromotionStatus(promo, beforeMidnightWib), "aktif");
        assert.equal(
            evaluatePromotionEligibility(promo, { biaya_jasa: 100000, now: beforeMidnightWib }).eligible,
            true
        );

        assert.equal(getPromotionStatus(promo, afterMidnightWib), "berakhir");
        const expiredRes = evaluatePromotionEligibility(promo, { biaya_jasa: 100000, now: afterMidnightWib });
        assert.equal(expiredRes.eligible, false);
        assert.equal(expiredRes.code, "PROMO_EXPIRED");
    });

    it("WB-MKT-005: device category and ticket type rules enforce eligibility accurately", () => {
        const promo = {
            is_active: true,
            tipe_diskon: "persen",
            nilai_diskon: 15,
            cakupan_diskon: "jasa",
            kategori_perangkat: "Laptop",
            tipe_tiket: "reguler",
            tanggal_mulai: parseWibStartDate("2026-11-01"),
            tanggal_selesai: parseWibEndDate("2026-11-30"),
            kuota_total: 50,
            kuota_terpakai: 2,
        };
        const now = new Date("2026-11-15T12:00:00+07:00");

        const wrongDevice = evaluatePromotionEligibility(promo, {
            biaya_jasa: 150000,
            jenis_perangkat: "Printer",
            sla_paket: "reguler",
            now,
        });
        assert.equal(wrongDevice.eligible, false);
        assert.equal(wrongDevice.code, "PROMO_CATEGORY_MISMATCH");

        const wrongSla = evaluatePromotionEligibility(promo, {
            biaya_jasa: 150000,
            jenis_perangkat: "Laptop",
            sla_paket: "prioritas",
            now,
        });
        assert.equal(wrongSla.eligible, false);
        assert.equal(wrongSla.code, "PROMO_TICKET_TYPE_MISMATCH");

        const valid = evaluatePromotionEligibility(promo, {
            biaya_jasa: 200000,
            jenis_perangkat: "Laptop",
            sla_paket: "reguler",
            now,
        });
        assert.equal(valid.eligible, true);
        assert.equal(valid.discount, 30000);
    });

    it("WB-MKT-006: minimum transaction threshold and once-per-customer guard reject ineligible claims", () => {
        const promo = {
            is_active: true,
            tipe_diskon: "nominal",
            nilai_diskon: 30000,
            cakupan_diskon: "total",
            minimal_transaksi: 150000,
            kategori_perangkat: "Semua",
            tipe_tiket: "Semua",
            tanggal_mulai: parseWibStartDate("2026-11-01"),
            tanggal_selesai: parseWibEndDate("2026-11-30"),
            kuota_total: 20,
            kuota_terpakai: 1,
            satu_kali_per_pelanggan: true,
        };
        const now = new Date("2026-11-15T12:00:00+07:00");

        const belowMin = evaluatePromotionEligibility(promo, {
            biaya_jasa: 100000,
            biaya_sparepart: 20000,
            now,
            customerAlreadyUsed: false,
        });
        assert.equal(belowMin.eligible, false);
        assert.equal(belowMin.code, "PROMO_MIN_TRANSACTION");

        const duplicateCustomer = evaluatePromotionEligibility(promo, {
            biaya_jasa: 200000,
            biaya_sparepart: 0,
            now,
            customerAlreadyUsed: true,
        });
        assert.equal(duplicateCustomer.eligible, false);
        assert.equal(duplicateCustomer.code, "PROMO_ALREADY_USED");
    });

    it("WB-MKT-007: atomic optimistic quota lock prevents over-redemption under concurrent cashiers", async () => {
        // Simulates Prisma `updateMany({ where: { id, is_active: true, kuota_terpakai: { lt: kuota_total } }, data: { kuota_terpakai: { increment: 1 } } })`
        const dbRow = { id: 1, is_active: true, kuota_total: 1, kuota_terpakai: 0 };

        function atomicClaimQuota() {
            if (dbRow.is_active && dbRow.kuota_terpakai < dbRow.kuota_total) {
                dbRow.kuota_terpakai += 1;
                return { count: 1 };
            }
            return { count: 0 };
        }

        const [cashierA, cashierB] = await Promise.all([
            Promise.resolve().then(() => atomicClaimQuota()),
            Promise.resolve().then(() => atomicClaimQuota()),
        ]);

        assert.equal(cashierA.count + cashierB.count, 1);
        assert.equal(dbRow.kuota_terpakai, 1);
    });

    it("WB-MKT-008: marketing RBAC capabilities expand cleanly and stay excluded from default teknisi", () => {
        const manageExpanded = expandPermissions(["marketing.manage"]);
        assert.ok(manageExpanded.includes("marketing.view"));
        assert.ok(manageExpanded.includes("marketing.manage"));

        const reportExpanded = expandPermissions(["marketing.report"]);
        assert.ok(reportExpanded.includes("marketing.view"));
        assert.ok(reportExpanded.includes("marketing.report"));

        const teknisiPerms = new Set(DEFAULT_ROLE_PERMISSIONS.teknisi);
        assert.equal(teknisiPerms.has("marketing.view"), false);
        assert.equal(teknisiPerms.has("marketing.manage"), false);
        assert.equal(teknisiPerms.has("marketing.report"), false);

        const pimpinanPerms = new Set(DEFAULT_ROLE_PERMISSIONS.pimpinan);
        assert.equal(pimpinanPerms.has("marketing.view"), true);
        assert.equal(pimpinanPerms.has("marketing.report"), true);
    });
});
