const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Model rules extracted from backend/src/controllers/tiket-servis.controller.js
const STATUS_TRANSITIONS = {
    diterima: ["didiagnosis", "dibatalkan"],
    didiagnosis: ["menunggu_persetujuan", "dibatalkan"],
    menunggu_persetujuan: ["disetujui", "dibatalkan"],
    disetujui: ["dalam_perbaikan", "dibatalkan"],
    dalam_perbaikan: ["selesai"],
    selesai: ["diambil"],
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

function validateHandoverRequirements(qcData, activeLoans = []) {
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
});
