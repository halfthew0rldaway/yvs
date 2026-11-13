const { test } = require("node:test");
const assert = require("node:assert/strict");

function checkRoute(router, method, path, permissions) {
    const route = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]);
    assert.ok(route, `${method.toUpperCase()} ${path} exists`);
    const req = { authorization: { is_super_admin: false, permissions } };
    let status;
    let nextCalled = false;
    const res = { status(code) { status = code; return { json() {} }; } };
    route.route.stack[0].handle(req, res, () => { nextCalled = true; });
    return { status, nextCalled };
}

test("a granted view permission opens its API route and revocation denies direct access", () => {
    const cases = [
        ["perangkat", "devices.view"], ["supplier", "suppliers.view"],
        ["rma", "suppliers.view"], ["loaner", "loaners.view", "/devices"],
        ["repair-wiki", "wiki.view"], ["dashboard", "dashboard.report", "/admin"],
        ["dashboard", "dashboard.view", "/teknisi"]
    ];
    for (const [name, permission, path = "/"] of cases) {
        const router = require(`../../src/routes/${name}.routes`);
        assert.equal(checkRoute(router, "get", path, [permission]).nextCalled, true, name);
        assert.equal(checkRoute(router, "get", path, []).status, 403, name);
    }
});

test("manage permission is required for mutations even with view access", () => {
    const cases = [
        ["perangkat", "devices.view", "devices.manage"],
        ["supplier", "suppliers.view", "suppliers.manage"],
        ["rma", "suppliers.view", "suppliers.manage"],
        ["loaner", "loaners.view", "loaners.manage", "/devices"],
        ["repair-wiki", "wiki.view", "wiki.manage"]
    ];
    for (const [name, view, manage, path = "/"] of cases) {
        const router = require(`../../src/routes/${name}.routes`);
        assert.equal(checkRoute(router, "post", path, [view]).status, 403, name);
        assert.equal(checkRoute(router, "post", path, [manage]).nextCalled, true, name);
    }
});

test("assigning and changing ticket status together requires both permissions", () => {
    const { requireTicketMutation } = require("../../src/middleware/auth");
    const run = permissions => {
        let status;
        let nextCalled = false;
        requireTicketMutation({ body: { teknisi_id: 7, status: "selesai" }, authorization: { permissions } },
            { status(code) { status = code; return { json() {} }; } }, () => { nextCalled = true; });
        return { status, nextCalled };
    };
    assert.equal(run(["tickets.assign"]).status, 403);
    assert.equal(run(["tickets.qc"]).status, 403);
    assert.equal(run(["tickets.assign", "tickets.qc"]).nextCalled, true);
});

test("attendance correction access stays separate from payroll review", () => {
    const router = require("../../src/routes/attendance.routes");
    assert.equal(checkRoute(router, "get", "/adjust-staff", ["attendance.adjust"]).nextCalled, true);
    assert.equal(checkRoute(router, "get", "/daily-all", ["attendance.adjust"]).status, 403);
    assert.equal(checkRoute(router, "get", "/daily-all", ["attendance.review"]).nextCalled, true);
});

test("financial reports and brand creation require their specific capabilities", () => {
    const invoices = require("../../src/routes/invoice.routes");
    const brands = require("../../src/routes/brand.routes");
    assert.equal(checkRoute(invoices, "get", "/report", ["invoices.view"]).status, 403);
    assert.equal(checkRoute(invoices, "get", "/report", ["invoices.report"]).nextCalled, true);
    assert.equal(checkRoute(brands, "post", "/", ["inventory.view"]).status, 403);
    assert.equal(checkRoute(brands, "post", "/", ["inventory.manage"]).nextCalled, true);
});

test("database export and maintenance have separate grants; demo seeding is Super Admin only", () => {
    const database = require("../../src/routes/database.routes");
    assert.equal(checkRoute(database, "post", "/export", ["system.database"]).nextCalled, true);
    assert.equal(checkRoute(database, "post", "/cleanup-logs", ["system.database"]).status, 403);
    assert.equal(checkRoute(database, "post", "/normalize-existing", ["system.database_maintain"]).nextCalled, true);
    assert.equal(checkRoute(database, "post", "/seed-dummy", ["system.database_maintain"]).status, 403);
});
