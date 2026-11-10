const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { authenticate, authorize } = require("../../src/middleware/auth");
const jwt = require("jsonwebtoken");

describe("WB-AUT: JWT Authentication & RBAC Inheritance", () => {
    const TEST_SECRET = "test-jwt-secret-yangversa-erp-2026";
    process.env.JWT_SECRET = TEST_SECRET;

    test("WB-AUT-001: authenticate rejects request missing Authorization header with 401", () => {
        let statusCode = null;
        let responseJson = null;

        const req = { headers: {} };
        const res = {
            status(code) {
                statusCode = code;
                return {
                    json(data) {
                        responseJson = data;
                    }
                };
            }
        };

        authenticate(req, res, () => {});

        assert.equal(statusCode, 401);
        assert.equal(responseJson.message, "Token tidak ditemukan");
    });

    test("WB-AUT-002: authenticate rejects expired JWT token with 401 code TOKEN_EXPIRED", () => {
        const expiredToken = jwt.sign(
            { id: 1, role: "admin" },
            TEST_SECRET,
            { expiresIn: "-10s" } // expired in past
        );

        let statusCode = null;
        let responseJson = null;

        const req = { headers: { authorization: `Bearer ${expiredToken}` } };
        const res = {
            status(code) {
                statusCode = code;
                return {
                    json(data) {
                        responseJson = data;
                    }
                };
            }
        };

        authenticate(req, res, () => {});

        assert.equal(statusCode, 401);
        assert.equal(responseJson.code, "TOKEN_EXPIRED");
    });

    test("WB-AUT-003: authenticate rejects tampered JWT signature with 401 INVALID_TOKEN", () => {
        const invalidToken = jwt.sign(
            { id: 1, role: "admin" },
            "different-secret-signature"
        );

        let statusCode = null;
        let responseJson = null;

        const req = { headers: { authorization: `Bearer ${invalidToken}` } };
        const res = {
            status(code) {
                statusCode = code;
                return {
                    json(data) {
                        responseJson = data;
                    }
                };
            }
        };

        authenticate(req, res, () => {});

        assert.equal(statusCode, 401);
        assert.equal(responseJson.code, "INVALID_TOKEN");
    });

    test("WB-AUT-004: authorize allows admin and pimpinan to inherit frontman role", () => {
        const frontmanGate = authorize("frontman");

        // Admin role accessing frontman endpoint
        let adminAllowed = false;
        const reqAdmin = { user: { id: 1, role: "admin" } };
        frontmanGate(reqAdmin, {}, () => { adminAllowed = true; });
        assert.equal(adminAllowed, true, "Admin should inherit frontman access");

        // Pimpinan role accessing frontman endpoint
        let pimpinanAllowed = false;
        const reqPimpinan = { user: { id: 2, role: "pimpinan" } };
        frontmanGate(reqPimpinan, {}, () => { pimpinanAllowed = true; });
        assert.equal(pimpinanAllowed, true, "Pimpinan should inherit frontman access");
    });

    test("WB-AUT-005: authorize rejects unauthorized roles with 403 Forbidden", () => {
        const adminGate = authorize("admin");

        let statusCode = null;
        let responseJson = null;

        const reqTeknisi = { user: { id: 3, role: "teknisi" } };
        const res = {
            status(code) {
                statusCode = code;
                return {
                    json(data) {
                        responseJson = data;
                    }
                };
            }
        };

        adminGate(reqTeknisi, res, () => {});

        assert.equal(statusCode, 403);
        assert.equal(responseJson.message, "Tidak memiliki akses");
    });
});
