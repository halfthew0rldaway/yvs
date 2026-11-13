const { test } = require("node:test");
const assert = require("node:assert/strict");
const { findLoginUser } = require("../../src/controllers/auth.controller");

function users(rows) {
    return { user: { findUnique: async ({ where }) => rows.find(row =>
        (where.username !== undefined && row.username === where.username) ||
        (where.email !== undefined && row.email === where.email)
    ) || null } };
}

test("custom username wins over a legacy alias and email prefix", async () => {
    const custom = { username: "pimpinan", email: "marketing@example.com" };
    const owner = { username: "owner", email: "owner@workshop.com" };
    assert.equal(await findLoginUser("pimpinan", users([owner, custom])), custom);
    assert.equal(await findLoginUser("marketing", users([
        { username: "other", email: "marketing@workshop.local" },
        { username: "marketing-team", email: "marketing@another.example" }
    ])), null);
});

test("leadership aliases use the current owner and the fictional Bambang alias is removed", async () => {
    const arni = { username: "arni", email: "arni@workshop.com" };
    const formerOwner = { username: "owner", email: "owner@workshop.com" };
    assert.equal(await findLoginUser("pimpinan", users([formerOwner, arni])), arni);
    assert.equal(await findLoginUser("superadmin", users([formerOwner, arni])), arni);
    assert.equal(await findLoginUser("bambang", users([formerOwner, arni])), null);
    const vivero = { username: "vivero", email: "vivero@workshop.com" };
    assert.equal(await findLoginUser("pimpinan", users([formerOwner, vivero])), vivero);
});
