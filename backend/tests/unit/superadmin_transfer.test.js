const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const prisma = require("../../src/config/database");
const { setSuperAdmin, deleteUser } = require("../../src/controllers/user.controller");

test("the last Super Admin cannot be demoted even after password confirmation", async () => {
    const originalFind = prisma.user.findUnique;
    const originalTransaction = prisma.$transaction;
    const password = await bcrypt.hash("correct-password", 4);
    let wrote = false;
    prisma.user.findUnique = async () => ({ id: 7, nama: "Owner", password });
    prisma.$transaction = async action => action({
        $queryRaw: async () => [{ id: 7 }],
        user: {
            findUnique: async () => ({ id: 7, is_super_admin: true }),
            update: async () => { wrote = true; }
        }
    });
    try {
        let status = 200;
        const res = { status(code) { status = code; return this; }, json() { return this; } };
        await setSuperAdmin({ user: { id: 7 }, params: { id: "7" }, body: { enabled: false, currentPassword: "correct-password" } }, res);
        assert.equal(status, 409);
        assert.equal(wrote, false);
    } finally {
        prisma.user.findUnique = originalFind;
        prisma.$transaction = originalTransaction;
    }
});

test("an actor demoted during a delete request cannot remove another administrator", async () => {
    const originalTransaction = prisma.$transaction;
    let deleted = false;
    prisma.$transaction = async action => action({
        $queryRaw: async () => [{ id: 9 }, { id: 8 }],
        user: {
            findUnique: async () => ({ id: 8, nama: "Last Admin", is_super_admin: true }),
            delete: async () => { deleted = true; }
        }
    });
    try {
        let status = 200;
        const res = { status(code) { status = code; return this; }, json() { return this; } };
        await deleteUser({ user: { id: 7 }, params: { id: "8" } }, res);
        assert.equal(status, 403);
        assert.equal(deleted, false);
    } finally {
        prisma.$transaction = originalTransaction;
    }
});
