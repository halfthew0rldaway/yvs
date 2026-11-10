const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const sanitizeRequest = require("../../src/middleware/sanitizeRequest");
const { normalizePhone, normalizeSerialNumber } = require("../../src/utils/normalize");

describe("WB-SEC: Sanitization, Normalization & Security", () => {
    test("WB-SEC-001: Strips null-bytes (\\0) and trims excess whitespace from string inputs", () => {
        const req = {
            body: {
                nama: "  Budi Santoso\0  ",
                keluhan: "Mati total setelah korsleting\0"
            }
        };
        const res = {};
        const next = () => {};

        sanitizeRequest(req, res, next);

        assert.equal(req.body.nama, "Budi Santoso");
        assert.equal(req.body.keluhan, "Mati total setelah korsleting");
    });

    test("WB-SEC-002: Normalizes phone numbers (+62, spaces, dashes) to Indonesian standard 08...", () => {
        const rawPhones = [
            "+62 812-3456-7890",
            "6281234567890",
            "0812 3456 7890",
            "0812-3456-7890"
        ];

        for (const raw of rawPhones) {
            const req = { body: { nomor_telepon: raw } };
            sanitizeRequest(req, {}, () => {});
            assert.equal(req.body.nomor_telepon, "081234567890", `Failed for ${raw}`);
        }
    });

    test("WB-SEC-003: Preserves passwords, device PINs, and token keys from whitespace alteration", () => {
        const secret = " P@ssw0rd With Spaces\0 ";
        const req = {
            body: {
                password: secret,
                password_perangkat: " 123456 ",
                token_reset: "abc123xyz"
            }
        };

        sanitizeRequest(req, {}, () => {});

        // Password keys are in the exclusion list so they retain their original value
        assert.equal(req.body.password, secret);
        assert.equal(req.body.password_perangkat, " 123456 ");
        assert.equal(req.body.token_reset, "abc123xyz");
    });

    test("WB-SEC-004: Transforms ticket numbers, serial numbers, and unit codes to UPPERCASE", () => {
        const req = {
            body: {
                nomor_tiket: "srv-2026-001",
                nomor_rma: "rma-26-015",
                kode_unit: "loan-thinkpad",
                serial_number: "pf1abc23xyz"
            }
        };

        sanitizeRequest(req, {}, () => {});

        assert.equal(req.body.nomor_tiket, "SRV-2026-001");
        assert.equal(req.body.nomor_rma, "RMA-26-015");
        assert.equal(req.body.kode_unit, "LOAN-THINKPAD");
        assert.equal(req.body.serial_number, "PF1ABC23XYZ");
    });
});
