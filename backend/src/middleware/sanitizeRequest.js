const {
    normalizePhone,
    normalizeBrand,
    normalizeSerialNumber,
    normalizeDeviceType,
    normalizeText
} = require("../utils/normalize");

/**
 * Recursive sanitizer for objects and arrays
 */
function sanitizeValue(key, value) {
    if (typeof value === "string") {
        // Strip null bytes and control characters
        let cleaned = value.replace(/\0/g, "").trim();

        // Specific field normalizers based on key name
        const lowerKey = (key || "").toLowerCase();
        if (lowerKey === "nomor_telepon" || lowerKey === "phone" || lowerKey === "telepon") {
            return normalizePhone(cleaned) || cleaned;
        }
        if (lowerKey === "merek" || lowerKey === "brand") {
            return normalizeBrand(cleaned);
        }
        if (lowerKey === "serial_number" || lowerKey === "sn") {
            return normalizeSerialNumber(cleaned);
        }
        if (lowerKey === "jenis_perangkat") {
            return normalizeDeviceType(cleaned);
        }

        // Default text normalization (collapse multi-spaces for prose fields)
        if (lowerKey === "nama" || lowerKey === "model" || lowerKey === "kategori") {
            return normalizeText(cleaned);
        }

        return cleaned;
    }

    if (Array.isArray(value)) {
        return value.map((item, index) => sanitizeValue(index, item));
    }

    if (value !== null && typeof value === "object" && !(value instanceof Date)) {
        const sanitizedObj = {};
        for (const k of Object.keys(value)) {
            // Skip binary / buffer / file fields
            if (k === "password" || k === "password_perangkat" || k.includes("token")) {
                sanitizedObj[k] = value[k]; // Do not modify passwords or tokens!
            } else {
                sanitizedObj[k] = sanitizeValue(k, value[k]);
            }
        }
        return sanitizedObj;
    }

    return value;
}

/**
 * Express middleware to automatically clean and sanitize all incoming request bodies and query parameters
 */
function sanitizeRequest(req, res, next) {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeValue("", req.body);
    }
    if (req.query && typeof req.query === "object") {
        req.query = sanitizeValue("", req.query);
    }
    next();
}

module.exports = sanitizeRequest;

