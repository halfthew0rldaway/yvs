const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { hasPermission } = require("../../src/services/authorization.service");
const { requireTicketMutation } = require("../../src/middleware/auth");

describe("WB-RBAC: modular permission checks", () => {
    test("technician capabilities do not include intake, approval, invoice, or handover", () => {
        const auth = { is_super_admin: false, permissions: ["tickets.diagnosis", "tickets.repair", "tickets.qc"] };
        assert.equal(hasPermission(auth, "tickets.diagnosis"), true);
        assert.equal(hasPermission(auth, "tickets.repair"), true);
        assert.equal(hasPermission(auth, "tickets.intake"), false);
        assert.equal(hasPermission(auth, "tickets.approval"), false);
        assert.equal(hasPermission(auth, "tickets.handover"), false);
    });

    test("ticket state changes resolve to their own capability", () => {
        let nextCalled = false;
        let denied = null;
        const req = { body: { status: "selesai" }, authorization: { is_super_admin: false, permissions: ["tickets.repair"] } };
        const res = { status: () => ({ json: body => { denied = body; } }) };
        requireTicketMutation(req, res, () => { nextCalled = true; });
        assert.equal(nextCalled, false);
        assert.equal(denied.code, "PERMISSION_DENIED");
    });

    test("super admin bypasses individual permissions", () => {
        assert.equal(hasPermission({ is_super_admin: true, permissions: [] }, "roles.manage"), true);
    });
});
