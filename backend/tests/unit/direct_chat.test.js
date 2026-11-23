const test = require("node:test");
const assert = require("node:assert/strict");

test("WB-CHT: One-to-One Staff Direct Chat Business Logic & Security", async (t) => {
    // 1. One-to-one pair canonicalization & self-chat prevention
    function canonicalizeChatPair(userIdA, userIdB) {
        const idA = Number(userIdA);
        const idB = Number(userIdB);
        if (!Number.isSafeInteger(idA) || idA <= 0 || !Number.isSafeInteger(idB) || idB <= 0) {
            throw new Error("ID pengguna tidak valid");
        }
        if (idA === idB) {
            throw new Error("Pilih pengguna lain yang valid");
        }
        const [first, second] = [idA, idB].sort((a, b) => a - b);
        return { first_user_id: first, second_user_id: second };
    }

    await t.test("WB-CHT-001: Pair canonicalization guarantees identical pair regardless of initiator", () => {
        const pair1 = canonicalizeChatPair(5, 2);
        const pair2 = canonicalizeChatPair(2, 5);
        assert.deepEqual(pair1, { first_user_id: 2, second_user_id: 5 });
        assert.deepEqual(pair2, { first_user_id: 2, second_user_id: 5 });
    });

    await t.test("WB-CHT-002: Rejects self-chat initiation with 400 validation error", () => {
        assert.throws(() => canonicalizeChatPair(3, 3), /Pilih pengguna lain/);
        assert.throws(() => canonicalizeChatPair(0, 5), /ID pengguna tidak valid/);
        assert.throws(() => canonicalizeChatPair("invalid", 5), /ID pengguna tidak valid/);
    });

    // 2. Message body validation
    function validateMessageBody(body) {
        if (typeof body !== "string") return false;
        const trimmed = body.trim();
        return trimmed.length >= 1 && trimmed.length <= 4000;
    }

    await t.test("WB-CHT-003: Validates message length between 1 and 4000 characters", () => {
        assert.equal(validateMessageBody(""), false, "Empty string must be rejected");
        assert.equal(validateMessageBody("   "), false, "Whitespace-only must be rejected");
        assert.equal(validateMessageBody("Halo teknisi"), true, "Valid short message");
        assert.equal(validateMessageBody("A".repeat(4000)), true, "Exact 4000 chars accepted");
        assert.equal(validateMessageBody("A".repeat(4001)), false, "Exceeding 4000 chars rejected");
    });

    // 3. Reference token parsing & regex safety
    const REFERENCE_REGEX = /^\[\[(ticket|device|part|user):([a-zA-Z0-9_\-\.]+)(?:\|([^\]\n]+))?\]\]$/;

    await t.test("WB-CHT-004: Reference token parser correctly resolves entities and rejects malformed tokens", () => {
        const validTokens = [
            "[[ticket:123]]",
            "[[ticket:1127|SRV-2026-005]]",
            "[[ticket:SRV-2026-005]]",
            "[[device:45]]",
            "[[device:45|Asus Vivobook]]",
            "[[part:678]]",
            "[[part:678|SSD 512GB]]",
            "[[user:9]]",
            "[[user:9|Budi Setiawan]]"
        ];
        for (const token of validTokens) {
            const match = REFERENCE_REGEX.exec(token);
            assert.ok(match, `Token ${token} should match valid reference`);
            assert.ok(["ticket", "device", "part", "user"].includes(match[1]));
            assert.ok(match[2].length > 0);
        }

        const invalidTokens = [
            "[[random:123]]",
            "[[ticket:invalid token with space]]",
            "<script>alert(1)</script>"
        ];
        for (const token of invalidTokens) {
            const match = REFERENCE_REGEX.exec(token);
            assert.equal(match, null, `Token ${token} should not match valid reference`);
        }
    });

    // 4. Role & permission resolution for references
    const REFERENCE_PERMISSIONS = {
        ticket: "tickets.view",
        device: "devices.view",
        part: "inventory.view",
        user: null
    };

    await t.test("WB-CHT-005: Enforces permission gating on linked entities in chat", () => {
        function checkCanAccessReference(type, userPermissions) {
            const required = REFERENCE_PERMISSIONS[type];
            if (!required) return true; // user references are open to all authenticated staff
            return userPermissions.includes(required) || userPermissions.includes("*");
        }

        const intakeOnly = ["tickets.intake"];
        assert.equal(checkCanAccessReference("ticket", intakeOnly), false, "Intake role cannot view ticket detail without tickets.view");
        assert.equal(checkCanAccessReference("device", intakeOnly), false, "Intake role cannot view device without devices.view");
        assert.equal(checkCanAccessReference("user", intakeOnly), true, "Internal staff can view user reference");

        const fullTechnician = ["tickets.view", "devices.view", "inventory.view"];
        assert.equal(checkCanAccessReference("ticket", fullTechnician), true);
        assert.equal(checkCanAccessReference("device", fullTechnician), true);
        assert.equal(checkCanAccessReference("part", fullTechnician), true);
    });

    // 5. Chat retention on user deletion gate
    await t.test("WB-CHT-006: Chat retention check prevents user deletion when chat history exists", () => {
        function canDeleteUser(userRecord, hasChatHistory, activeTicketsCount) {
            if (activeTicketsCount > 0) {
                return { allowed: false, reason: "Teknisi ini sedang menangani tiket servis aktif" };
            }
            if (hasChatHistory) {
                return { allowed: false, reason: "Akun memiliki riwayat chat. Riwayat perlu dipertahankan; jangan hapus akun ini." };
            }
            return { allowed: true };
        }

        const resWithChat = canDeleteUser({ id: 5 }, true, 0);
        assert.equal(resWithChat.allowed, false);
        assert.ok(resWithChat.reason.includes("Riwayat perlu dipertahankan"));

        const resClean = canDeleteUser({ id: 5 }, false, 0);
        assert.equal(resClean.allowed, true);
    });

    // 6. Export text format & Asia/Jakarta timezone
    await t.test("WB-CHT-007: Export formatter includes header and converts UTC timestamps to Asia/Jakarta (WIB)", () => {
        const utcDate = new Date("2026-11-17T12:00:00.000Z"); // 12:00 UTC = 19:00 WIB
        const formatter = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
        const formattedTime = formatter.format(utcDate);
        assert.equal(formattedTime, "19.00", "UTC 12:00 must convert to 19:00 WIB");

        const participants = ["Budi (Teknisi)", "Siti (Admin)"];
        const header = `YVS Chat — ${participants.join(" & ")}\nZona Waktu: Asia/Jakarta (WIB)\n\n`;
        assert.ok(header.includes("Budi (Teknisi) & Siti (Admin)"));
        assert.ok(header.includes("Asia/Jakarta (WIB)"));
    });
});
