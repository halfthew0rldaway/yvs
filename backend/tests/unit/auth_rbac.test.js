const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { authenticate, requirePermission } = require("../../src/middleware/auth");
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

    test("WB-AUT-004: custom role access follows its granted capability", () => {
        const gate = requirePermission("customers.manage");
        let allowed = false;
        gate({ authorization: { permissions: ["customers.manage"], roles: [{ slug: "marketing" }] } }, {}, () => { allowed = true; });
        assert.equal(allowed, true);
    });

    test("WB-AUT-005: capability gate rejects unrelated grants with 403 Forbidden", () => {
        const gate = requirePermission("customers.manage");

        let statusCode = null;
        let responseJson = null;

        const reqTeknisi = { authorization: { permissions: ["customers.view"], roles: [{ slug: "marketing" }] } };
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

        gate(reqTeknisi, res, () => {});

        assert.equal(statusCode, 403);
        assert.equal(responseJson.code, "PERMISSION_DENIED");
    });
});
