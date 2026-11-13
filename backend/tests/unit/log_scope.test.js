const { test } = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../../src/config/database");
const { getByTiketId } = require("../../src/controllers/log-perbaikan.controller");

test("direct repair-log URL does not reveal another technician's ticket history", async () => {
    const originalTicket = prisma.tiketServis.findUnique;
    const originalLogs = prisma.logPerbaikan.findMany;
    let queriedLogs = false;
    prisma.tiketServis.findUnique = async () => ({ teknisi_id: 9, status: "dalam_perbaikan" });
    prisma.logPerbaikan.findMany = async () => { queriedLogs = true; return []; };
    try {
        let status = 200;
        const res = { status(code) { status = code; return this; }, json() { return this; } };
        await getByTiketId({ params: { id: "23" }, user: { id: 7 }, authorization: { permissions: ["tickets.view"] } }, res);
        assert.equal(status, 403);
        assert.equal(queriedLogs, false);
    } finally {
        prisma.tiketServis.findUnique = originalTicket;
        prisma.logPerbaikan.findMany = originalLogs;
    }
});
