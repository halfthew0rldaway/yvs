const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { 
    calculateSlaPengecekanTarget, 
    calculateSlaPengerjaanTarget, 
    calculateWarrantyExpiry, 
    getWarrantyStatus,
    getSlaStatus
} = require("../../src/utils/tiket");

describe("WB-SLA: SLA Timers & Warranty Expiry Math", () => {
    test("WB-SLA-001: calculateSlaPengecekanTarget generates earlier target for 'prioritas' than 'reguler'", () => {
        const now = new Date("2026-11-10T10:00:00Z");
        const regulerTarget = calculateSlaPengecekanTarget(now, "reguler");
        const prioritasTarget = calculateSlaPengecekanTarget(now, "prioritas");

        assert.ok(regulerTarget instanceof Date);
        assert.ok(prioritasTarget instanceof Date);
        assert.ok(prioritasTarget.getTime() <= regulerTarget.getTime(), "Prioritas SLA target must be sooner or equal to reguler");
    });

    test("WB-SLA-002: calculateWarrantyExpiry accurately calculates 30 days, 1 month, and 1 year", () => {
        const base = new Date("2026-01-01T00:00:00Z");

        // 30 Days
        const d30 = calculateWarrantyExpiry(base, "30 Hari");
        const diffDays = Math.round((d30 - base) / (1000 * 60 * 60 * 24));
        assert.equal(diffDays, 30);

        // 1 Month
        const m1 = calculateWarrantyExpiry(base, "1 Bulan");
        assert.equal(m1.getMonth(), 1); // February

        // 1 Year
        const y1 = calculateWarrantyExpiry(base, "1 Tahun");
        assert.equal(y1.getFullYear(), 2027);
    });

    test("WB-SLA-003: getWarrantyStatus correctly flags active vs expired warranties", () => {
        const now = new Date();
        
        // Picked up yesterday with 30 days warranty -> Active
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const activeTicket = {
            status: "diambil",
            tgl_diambil: yesterday,
            durasi_garansi: "30 Hari"
        };
        const activeStatus = getWarrantyStatus(activeTicket);
        assert.equal(activeStatus.status, "aktif");
        assert.equal(activeStatus.isExpired, false);

        // Picked up 40 days ago with 30 days warranty -> Expired (status: 'kedaluwarsa')
        const past40d = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
        const expiredTicket = {
            status: "diambil",
            tgl_diambil: past40d,
            durasi_garansi: "30 Hari"
        };
        const expiredStatus = getWarrantyStatus(expiredTicket);
        assert.equal(expiredStatus.status, "kedaluwarsa");
        assert.equal(expiredStatus.isExpired, true);
        assert.equal(expiredStatus.label, "Garansi Kedaluwarsa");
    });

    test("WB-SLA-004: getSlaStatus detects overdue and paused phases", () => {
        const now = new Date();

        // Overdue ticket: target was 2 days ago (urgency evaluates to "danger")
        const pastTarget = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const overdueTicket = {
            status: "dalam_perbaikan",
            created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            target_selesai_at: pastTarget,
            disetujui_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
            sla_paket: "reguler"
        };
        const overdueStatus = getSlaStatus(overdueTicket);
        assert.equal(overdueStatus.is_overdue, true);
        assert.equal(overdueStatus.urgency, "danger");

        // Paused ticket: waiting for customer quote approval (urgency evaluates to "paused")
        const quoteWaitingTicket = {
            status: "menunggu_persetujuan",
            created_at: now,
            target_pengecekan_at: now,
            sla_paket: "reguler"
        };
        const pausedStatus = getSlaStatus(quoteWaitingTicket);
        assert.equal(pausedStatus.is_paused, true);
        assert.equal(pausedStatus.urgency, "paused");
    });
});
