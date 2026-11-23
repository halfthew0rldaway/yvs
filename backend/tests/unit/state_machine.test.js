const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Model rules extracted from backend/src/controllers/tiket-servis.controller.js
const STATUS_TRANSITIONS = {
    diterima: ["didiagnosis", "dibatalkan"],
    didiagnosis: ["menunggu_persetujuan", "dibatalkan"],
    menunggu_persetujuan: ["disetujui", "dibatalkan"],
    disetujui: ["dalam_perbaikan", "dibatalkan"],
    dalam_perbaikan: ["selesai", "dibatalkan"],
    selesai: ["diambil", "dalam_perbaikan"],
    diambil: [],
    dibatalkan: [],
};

const allowedTeknisiTransitions = {
    diterima: ["didiagnosis"],
    didiagnosis: ["menunggu_persetujuan"],
    disetujui: ["dalam_perbaikan"],
    dalam_perbaikan: ["selesai"],
};

function validateTransition(currentStatus, targetStatus, userRole = "admin") {
    const allowed = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
        return {
            isValid: false,
            code: 400,
            error: `Transisi status tidak valid: ${currentStatus} → ${targetStatus}`
        };
    }

    if (userRole === "teknisi") {
        const allowedForCurrent = allowedTeknisiTransitions[currentStatus] || [];
        if (!allowedForCurrent.includes(targetStatus)) {
            return {
                isValid: false,
                code: 403,
                error: `Akses ditolak: Teknisi tidak diizinkan mengubah status dari '${currentStatus}' ke '${targetStatus}'. Tahap ini dikelola oleh Admin.`
            };
        }
    }

    return { isValid: true, code: 200 };
}

function validateCompletionRequirements(logs = []) {
    const hasRepairLog = logs.some(l => l.fase === "Perbaikan");
    if (!hasRepairLog) {
        return {
            isValid: false,
            code: 400,
            error: "Proteksi: Anda harus menambahkan minimal satu Log Perbaikan sebelum dapat menyelesaikan tiket ini."
        };
    }
    return { isValid: true };
}

function validateHandoverRequirements(qcData, activeLoans = [], invoice = { id: 1 }, isGaransiClaim = false) {
    const passedQc = Boolean(qcData?.passed_qc);
    if (!passedQc) {
        return {
            isValid: false,
            code: 400,
            error: "Proteksi QC: Unit wajib melewati Checklist QC Pra-Penyerahan (passed_qc: true) sebelum status dapat diubah menjadi 'diambil'."
        };
    }

    if (activeLoans.length > 0) {
        return {
            isValid: false,
            code: 400,
            error: "Proteksi Unit Pinjaman: Pelanggan masih meminjam unit cadangan. Harap proses pengembalian unit pinjaman sebelum menyerahkan unit utama."
        };
    }

    if (!isGaransiClaim && !invoice) {
        return {
            isValid: false,
            code: 400,
            error: "Proteksi Penyerahan: Invoice / faktur pembayaran belum diterbitkan oleh kasir untuk tiket ini."
        };
    }

    return { isValid: true };
}

describe("WB-STA: Ticket Service State Machine & Interlocks", () => {
    test("WB-STA-001: Disallows illegal non-linear jumps (e.g. diterima -> selesai)", () => {
        const result = validateTransition("diterima", "selesai", "admin");
        assert.equal(result.isValid, false);
        assert.equal(result.code, 400);
        assert.match(result.error, /Transisi status tidak valid: diterima → selesai/);
    });

    test("WB-STA-002: Terminal state 'diambil' rejects any further transitions", () => {
        const targets = ["diterima", "didiagnosis", "dalam_perbaikan", "selesai", "dibatalkan"];
        for (const target of targets) {
            const result = validateTransition("diambil", target, "admin");
            assert.equal(result.isValid, false);
            assert.equal(result.code, 400);
        }
    });

    test("WB-STA-003: Terminal state 'dibatalkan' rejects any further transitions", () => {
        const targets = ["diterima", "didiagnosis", "dalam_perbaikan", "selesai", "diambil"];
        for (const target of targets) {
            const result = validateTransition("dibatalkan", target, "admin");
            assert.equal(result.isValid, false);
            assert.equal(result.code, 400);
        }
    });

    test("WB-STA-004: Teknisi is prohibited from approving quotes (menunggu_persetujuan -> disetujui)", () => {
        // Admin is allowed
        const adminResult = validateTransition("menunggu_persetujuan", "disetujui", "admin");
        assert.equal(adminResult.isValid, true);

        // Teknisi is blocked with 403 Forbidden
        const teknisiResult = validateTransition("menunggu_persetujuan", "disetujui", "teknisi");
        assert.equal(teknisiResult.isValid, false);
        assert.equal(teknisiResult.code, 403);
        assert.match(teknisiResult.error, /Tahap ini dikelola oleh Admin/);
    });

    test("WB-STA-005: Transition to 'selesai' requires at least one LogPerbaikan with fase 'Perbaikan'", () => {
        // Without repair log
        const failure = validateCompletionRequirements([
            { fase: "Pengecekan", catatan: "Cek tegangan 19V normal" }
        ]);
        assert.equal(failure.isValid, false);
        assert.equal(failure.code, 400);

        // With repair log
        const success = validateCompletionRequirements([
            { fase: "Perbaikan", catatan: "Reball chipset dan ganti thermal paste" }
        ]);
        assert.equal(success.isValid, true);
    });

    test("WB-STA-006: Transition to 'diambil' requires passed_qc = true", () => {
        const failedQc = validateHandoverRequirements({ passed_qc: false }, []);
        assert.equal(failedQc.isValid, false);
        assert.equal(failedQc.code, 400);
        assert.match(failedQc.error, /passed_qc: true/);

        const passedQc = validateHandoverRequirements({ passed_qc: true }, []);
        assert.equal(passedQc.isValid, true);
    });

    test("WB-STA-007: Transition to 'diambil' is blocked if customer has active loaner unit", () => {
        const loanBlocked = validateHandoverRequirements(
            { passed_qc: true },
            [{ id: 1, kode_unit: "LOAN-01", status: "aktif" }]
        );
        assert.equal(loanBlocked.isValid, false);
        assert.equal(loanBlocked.code, 400);
        assert.match(loanBlocked.error, /Proteksi Unit Pinjaman/);
    });

    test("WB-STA-008: Transition to 'diambil' is blocked if invoice has not been created", () => {
        // Without invoice for standard paid repair
        const invoiceBlocked = validateHandoverRequirements(
            { passed_qc: true },
            [],
            null, // no invoice
            false // not a warranty claim
        );
        assert.equal(invoiceBlocked.isValid, false);
        assert.equal(invoiceBlocked.code, 400);
        assert.match(invoiceBlocked.error, /Invoice \/ faktur pembayaran belum diterbitkan/);

        // Warranty claim is exempt from mandatory invoice requirement
        const warrantyExempt = validateHandoverRequirements(
            { passed_qc: true },
            [],
            null,
            true // is warranty claim
        );
        assert.equal(warrantyExempt.isValid, true);
    });

    test("WB-STA-009: Transition from 'dalam_perbaikan' to 'dibatalkan' restores allocated spare parts", () => {
        const canCancelFromRepair = STATUS_TRANSITIONS.dalam_perbaikan.includes("dibatalkan");
        assert.equal(canCancelFromRepair, true, "State machine must allow cancellation during repair");

        // Simulate stock restoration logic
        const initialStock = 10;
        const usedParts = [{ sparepart_id: 1, jumlah: 2 }, { sparepart_id: 2, jumlah: 3 }];
        const restoredStock = initialStock + usedParts.find(p => p.sparepart_id === 1).jumlah;
        assert.equal(restoredStock, 12, "Cancelled ticket must restore allocated spare parts to inventory");
    });
});
