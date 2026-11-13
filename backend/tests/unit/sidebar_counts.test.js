const test = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../../src/config/database");
let countCalls = 0;
const prisma = {
    notification: {
        async groupBy() {
            return [
                { link: "/rma", _count: { _all: 3 } },
                { link: "/tiket-servis/42", _count: { _all: 2 } },
                { link: "https://outside.example", _count: { _all: 100 } },
                { link: null, _count: { _all: 4 } }
            ];
        }
    },
    customerRegistration: { async count() { countCalls++; return 7; } }
};
require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: prisma };
const { getSidebarCounts } = require("../../src/controllers/notification.controller");

function response() {
    return {
        body: null,
        set() { return this; },
        json(body) { this.body = body; return this; }
    };
}

test("sidebar counts include QR work only for intake staff and map linked notifications to modules", async () => {
    const res = response();
    await getSidebarCounts({ user: { id: 1 }, authorization: { permissions: ["tickets.intake"], roles: [] } }, res);
    assert.deepEqual(res.body, { counts: { "/rma": 3, "/tiket-servis": 9 }, registrations: 7 });
    assert.equal(countCalls, 1);

    const noIntake = response();
    await getSidebarCounts({ user: { id: 2 }, authorization: { permissions: ["suppliers.view"], roles: [] } }, noIntake);
    assert.deepEqual(noIntake.body, { counts: { "/rma": 3, "/tiket-servis": 2 }, registrations: 0 });
    assert.equal(countCalls, 1);
});
