const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Implementation logic from backend/src/controllers/invoice.controller.js
function calculateSparepartCost(penggunaanRecords = []) {
    return penggunaanRecords.reduce((total, p) => {
        const harga = Number(p.sparepart?.harga) || 0;
        const jumlah = Number(p.jumlah) || 0;
        return total + harga * jumlah;
    }, 0);
}

function calculateInvoiceTotal(biayaJasa, biayaSparepart, diskon = 0, dp = 0) {
    const jasa = Number(biayaJasa) || 0;
    const parts = Number(biayaSparepart) || 0;
    const disc = Number(diskon) || 0;
    const downPayment = Number(dp) || 0;

    if (isNaN(jasa) || jasa < 0) {
        throw new Error("Biaya jasa harus berupa angka dan tidak boleh negatif");
    }

    const subtotal = jasa + parts;
    const totalAfterDiscount = Math.max(0, subtotal - disc);
    const remainingBalance = Math.max(0, totalAfterDiscount - downPayment);

    return {
        biaya_jasa: jasa,
        biaya_sparepart: parts,
        subtotal,
        diskon: disc,
        total_biaya: totalAfterDiscount,
        dp: downPayment,
        sisa_tagihan: remainingBalance
    };
}

describe("WB-FIN: Financial Math & Invoicing Calculations", () => {
    test("WB-FIN-001: Correctly sums multi-item sparepart costs using array reducer", () => {
        const items = [
            { sparepart: { harga: 150000 }, jumlah: 2 }, // 300.000
            { sparepart: { harga: 250000 }, jumlah: 1 }, // 250.000
            { sparepart: { harga: 50000 }, jumlah: 3 }   // 150.000
        ];
        const totalParts = calculateSparepartCost(items);
        assert.equal(totalParts, 700000);
    });

    test("WB-FIN-002: Throws error when service fee (biaya_jasa) is negative", () => {
        assert.throws(() => {
            calculateInvoiceTotal(-50000, 200000);
        }, /Biaya jasa harus berupa angka dan tidak boleh negatif/);
    });

    test("WB-FIN-003: Computes invoice totals with discount and down payment (DP) deductions", () => {
        // Jasa: 200.000, Sparepart: 300.000, Diskon: 50.000, DP: 150.000
        const result = calculateInvoiceTotal(200000, 300000, 50000, 150000);

        assert.equal(result.subtotal, 500000);
        assert.equal(result.total_biaya, 450000); // after discount
        assert.equal(result.sisa_tagihan, 300000); // 450.000 - 150.000 DP
    });

    test("WB-FIN-004: Prevents negative remaining balance when DP exceeds total", () => {
        // Jasa: 100.000, Parts: 0, DP: 150.000
        const result = calculateInvoiceTotal(100000, 0, 0, 150000);
        assert.equal(result.sisa_tagihan, 0); // never negative
    });
});
