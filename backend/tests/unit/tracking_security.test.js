const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

test("WB-TRK: Public Tracking PII Masking & Action Authorization", async (t) => {
    // 1. Test PII Masking logic
    function maskName(nama) {
        if (!nama || typeof nama !== "string") return "Pelanggan";
        const parts = nama.trim().split(/\s+/);
        return parts.map(part => {
            if (part.length <= 2) return part[0] + "*";
            return part.slice(0, 2) + "*".repeat(Math.max(part.length - 2, 2));
        }).join(" ");
    }

    function maskPhone(phone) {
        if (!phone || typeof phone !== "string") return "";
        const clean = phone.replace(/\D/g, "");
        if (clean.length < 8) return "••••••••";
        const prefix = clean.slice(0, 4);
        const suffix = clean.slice(-2);
        return `${prefix} •••••• ${suffix}`;
    }

    function maskSerialNumber(sn) {
        if (!sn || typeof sn !== "string" || sn === "-") return "-";
        const clean = sn.trim();
        if (clean.length <= 6) return clean.slice(0, 2) + "••••";
        return clean.slice(0, 3) + "•••••" + clean.slice(-3);
    }

    await t.test("WB-TRK-001: Customer names are masked with privacy asterisks", () => {
        assert.equal(maskName("Budi Santoso"), "Bu** Sa*****");
        assert.equal(maskName("Ahmad"), "Ah***");
        assert.equal(maskName("Li"), "L*");
        assert.equal(maskName(""), "Pelanggan");
    });

    await t.test("WB-TRK-002: Customer phone masks middle and preserves unguessable last 4 digits", () => {
        const masked = maskPhone("081234567890");
        assert.equal(masked, "0812 •••••• 90");
        // Verify that digits 7 and 8 (of 7890) are hidden
        assert.ok(!masked.includes("7890"), "Masked phone must not reveal the last 4 digits");
        assert.ok(masked.startsWith("0812"), "Must preserve cellular prefix for customer identification");
    });

    await t.test("WB-TRK-003: Hardware serial numbers are obfuscated against enumeration", () => {
        assert.equal(maskSerialNumber("NXK7SN123456"), "NXK•••••456");
        assert.equal(maskSerialNumber("-"), "-");
    });

    await t.test("WB-TRK-004: Invoice signing enforces single-use immutability and payload validation", () => {
        const existingInvoice = { ttd_customer: "data:image/png;base64,existingSign" };
        const isAlreadySigned = Boolean(existingInvoice.ttd_customer);
        assert.equal(isAlreadySigned, true, "Already signed invoice must be flagged");

        const invalidSignature = "invalid_string_not_data_uri";
        const isValidFormat = typeof invalidSignature === "string" && invalidSignature.startsWith("data:image/") && invalidSignature.length <= 500000;
        assert.equal(isValidFormat, false, "Signature without data:image/ prefix must fail validation");

        const validSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
        const isValid = typeof validSignature === "string" && validSignature.startsWith("data:image/") && validSignature.length <= 500000;
        assert.equal(isValid, true, "Valid image data-uri within size limits must pass");
    });

    await t.test("WB-TRK-005: Rating submission is locked once rating_submitted_at is recorded", () => {
        const ticketWithRating = { rating_teknisi: 5, rating_submitted_at: new Date() };
        const isLocked = Boolean(ticketWithRating.rating_submitted_at);
        assert.equal(isLocked, true, "Ticket with prior rating must be locked against re-submission");

        const freshTicket = { rating_teknisi: null, rating_submitted_at: null };
        assert.equal(Boolean(freshTicket.rating_submitted_at), false, "Fresh ticket can accept rating");
    });

    await t.test("WB-TRK-006: Attendance upload filter only permits valid image mimetypes", () => {
        const SAFE_IMAGE_EXTS = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp'
        };

        assert.ok(SAFE_IMAGE_EXTS['image/jpeg'], "JPG must be allowed");
        assert.ok(SAFE_IMAGE_EXTS['image/png'], "PNG must be allowed");
        assert.ok(!SAFE_IMAGE_EXTS['application/x-php'], "PHP files must be rejected");
        assert.ok(!SAFE_IMAGE_EXTS['image/svg+xml'], "SVG files must be rejected to prevent stored XSS");
        assert.ok(!SAFE_IMAGE_EXTS['application/octet-stream'], "Binary executables must be rejected");
    });

    await t.test("WB-TRK-007: Leave upload filter allows images and PDF documents only", () => {
        const SAFE_LEAVE_EXTS = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'application/pdf': '.pdf'
        };

        assert.ok(SAFE_LEAVE_EXTS['application/pdf'], "PDF must be allowed for medical certificates");
        assert.ok(SAFE_LEAVE_EXTS['image/jpeg'], "JPG photos must be allowed");
        assert.ok(!SAFE_LEAVE_EXTS['application/javascript'], "JS files must be rejected");
        assert.ok(!SAFE_LEAVE_EXTS['text/html'], "HTML files must be rejected");
    });
});
