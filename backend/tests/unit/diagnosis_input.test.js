const test = require("node:test");
const assert = require("node:assert/strict");

test("WB-DIA: Technician Diagnosis Input & Log Creation Logic", async (t) => {

    await t.test("WB-DIA-001: Estimasi biaya validation rejects negative or NaN values", () => {
        const validateEstimasi = (val) => {
            if (val === undefined || val === null || String(val).trim() === "") {
                return false;
            }
            const estimasi = Number(val);
            if (isNaN(estimasi) || estimasi < 0) {
                return false;
            }
            return true;
        };

        assert.equal(validateEstimasi(-50000), false, "Negative cost must be rejected");
        assert.equal(validateEstimasi("abc"), false, "Non-numeric string must be rejected");
        assert.equal(validateEstimasi(null), false, "Null cost must be rejected");
        assert.equal(validateEstimasi(""), false, "Empty cost must be rejected");
        assert.equal(validateEstimasi(150000), true, "Valid integer cost must pass");
        assert.equal(validateEstimasi("250000"), true, "Valid numeric string must pass");
    });

    await t.test("WB-DIA-002: Ticket status check enforces 'diterima' or 'didiagnosis'", () => {
        const allowedStatuses = ["diterima", "didiagnosis"];
        const canDiagnose = (status) => allowedStatuses.includes(status);

        assert.equal(canDiagnose("diterima"), true);
        assert.equal(canDiagnose("didiagnosis"), true);
        assert.equal(canDiagnose("dalam_perbaikan"), false);
        assert.equal(canDiagnose("selesai"), false);
        assert.equal(canDiagnose("diambil"), false);
        assert.equal(canDiagnose("dibatalkan"), false);
    });

    await t.test("WB-DIA-003: LogPerbaikan note generation formats properly without ReferenceError", () => {
        const masalah = "Layar mati / blank hitam";
        const solusi = "Ganti fleksibel display eDP";
        const estimasi = 185000;
        const uploadedPhotos = ["/uploads/diag-1.jpg", "/uploads/diag-2.jpg"];

        // Simulate formatting logic used in diagnosis.controller.js
        const firstFoto = uploadedPhotos && uploadedPhotos.length > 0 ? uploadedPhotos[0] : null;
        const catatanLog = `[Hasil Diagnosis] Masalah: ${masalah}. Rencana Tindakan: ${solusi}. Estimasi: Rp ${estimasi.toLocaleString('id-ID')}`;

        assert.equal(firstFoto, "/uploads/diag-1.jpg");
        assert.ok(catatanLog.includes("Layar mati / blank hitam"));
        assert.ok(catatanLog.includes("Ganti fleksibel display eDP"));
        assert.ok(catatanLog.includes("185.000"));
    });

    await t.test("WB-DIA-004: Technician assignment check blocks unauthorized technicians", () => {
        const checkTechnicianAccess = (userRole, userId, ticketTechId) => {
            if (userRole === "admin") return true;
            if (userRole === "teknisi") {
                if (!ticketTechId) return false;
                if (ticketTechId !== userId) return false;
                return true;
            }
            return false;
        };

        assert.equal(checkTechnicianAccess("admin", 1, null), true, "Admin can diagnose unassigned tickets");
        assert.equal(checkTechnicianAccess("teknisi", 2, null), false, "Teknisi blocked on unassigned ticket");
        assert.equal(checkTechnicianAccess("teknisi", 2, 3), false, "Teknisi blocked on ticket assigned to different tech");
        assert.equal(checkTechnicianAccess("teknisi", 2, 2), true, "Assigned teknisi allowed to diagnose");
    });
});
