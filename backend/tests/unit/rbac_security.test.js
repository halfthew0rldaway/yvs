const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } = require("../../src/config/permissions");
const { hasPermission } = require("../../src/services/authorization.service");
const { requirePermission, requireSuperAdmin, requireTicketMutation } = require("../../src/middleware/auth");
const prisma = require("../../src/config/database");
const ticketController = require("../../src/controllers/tiket-servis.controller");

function responseCapture() {
    const result = { status: null, body: null };
    return { result, res: { status: status => { result.status = status; return { json: body => { result.body = body; } }; } } };
}

describe("RBAC security boundary regression", () => {
    test("permission catalogue has unique, well-formed capability keys", () => {
        const codes = PERMISSIONS.map(([code]) => code);
        assert.equal(new Set(codes).size, codes.length);
        assert.ok(codes.every(code => /^[a-z]+\.[a-z_]+$/.test(code)));
    });

    test("default technician cannot reach admin ticket stages or financial controls", () => {
        const technical = new Set(DEFAULT_ROLE_PERMISSIONS.teknisi);
        ["tickets.intake", "tickets.assign", "tickets.approval", "tickets.handover", "invoices.manage", "roles.manage", "users.manage"].forEach(code => assert.equal(technical.has(code), false, code));
        ["tickets.diagnosis", "tickets.repair", "tickets.qc", "inventory.use"].forEach(code => assert.equal(technical.has(code), true, code));
    });

    test("malformed authorization objects fail closed", () => {
        assert.equal(hasPermission({ permissions: null }, "tickets.repair"), false);
        assert.equal(hasPermission({ permissions: ["tickets.repair"] }, ""), false);
        assert.equal(hasPermission({ permissions: ["tickets.repair"] }, []), false);
    });

    test("permission middleware distinguishes unauthenticated and forbidden requests", () => {
        let next = false; let capture = responseCapture();
        requirePermission("tickets.repair")({}, capture.res, () => { next = true; });
        assert.equal(next, false); assert.equal(capture.result.status, 401);
        capture = responseCapture();
        requirePermission("tickets.repair")({ authorization: { is_super_admin: false, permissions: ["tickets.diagnosis"] } }, capture.res, () => { next = true; });
        assert.equal(capture.result.status, 403); assert.equal(capture.result.body.code, "PERMISSION_DENIED");
    });

    test("every sensitive ticket state is checked against its own capability", () => {
        const states = { didiagnosis: "tickets.diagnosis", menunggu_persetujuan: "tickets.diagnosis", disetujui: "tickets.approval", dalam_perbaikan: "tickets.repair", selesai: "tickets.qc", diambil: "tickets.handover", dibatalkan: "tickets.cancel" };
        for (const [status, permission] of Object.entries(states)) {
            const capture = responseCapture(); let next = false;
            requireTicketMutation({ body: { status }, authorization: { is_super_admin: false, permissions: [permission] } }, capture.res, () => { next = true; });
            assert.equal(next, true, `${status} requires ${permission}`);
        }
    });

    test("only Super Admin crosses the privilege-management gate", () => {
        let next = false; let capture = responseCapture();
        requireSuperAdmin({ authorization: { is_super_admin: false } }, capture.res, () => { next = true; });
        assert.equal(next, false); assert.equal(capture.result.status, 403);
        requireSuperAdmin({ authorization: { is_super_admin: true } }, {}, () => { next = true; });
        assert.equal(next, true);
    });

    test("ticket field permissions block mixed payload privilege escalation", () => {
        const capture = responseCapture(); let next = false;
        requireTicketMutation({ body: { status: "didiagnosis", tipe_kunci: "PIN" }, authorization: { permissions: ["tickets.diagnosis"] } }, capture.res, () => { next = true; });
        assert.equal(next, false);
        assert.equal(capture.result.status, 403);
        assert.deepEqual(capture.result.body.requiredPermissions, ["tickets.intake"]);
    });

    test("self claim is distinct from assigning another user", () => {
        const run = (teknisi_id, permissions) => {
            const capture = responseCapture(); let next = false;
            requireTicketMutation({ user: { id: 7 }, body: { teknisi_id }, authorization: { permissions } }, capture.res, () => { next = true; });
            return { next, status: capture.result.status };
        };
        assert.equal(run(7, ["tickets.claim"]).next, true);
        assert.equal(run(8, ["tickets.claim"]).status, 403);
        assert.equal(run(8, ["tickets.assign"]).next, true);
    });

    test("assign grant can delegate an unclaimed ticket without view_all", async () => {
        const originalFind = prisma.tiketServis.findUnique;
        const originalUpdate = prisma.tiketServis.update;
        const ticket = { id: 17, nomor_tiket: "T-17", status: "diterima", teknisi_id: null, created_at: new Date() };
        let updatedAssignee = null;
        prisma.tiketServis.findUnique = async () => ticket;
        prisma.tiketServis.update = async ({ data }) => {
            updatedAssignee = data.teknisi_id;
            return { ...ticket, ...data };
        };
        try {
            const req = { params: { id: "17" }, body: { teknisi_id: 8 }, user: { id: 7 }, authorization: { permissions: ["tickets.assign"] } };
            let status = 200;
            const res = { status(code) { status = code; return this; }, json() { return this; } };
            await ticketController.update(req, res);
            assert.equal(status, 200);
            assert.equal(updatedAssignee, 8);
        } finally {
            prisma.tiketServis.findUnique = originalFind;
            prisma.tiketServis.update = originalUpdate;
        }
    });
});
