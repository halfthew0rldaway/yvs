const {
    normalizePhone,
    normalizeBrand,
    normalizeSerialNumber,
    normalizeDeviceType,
    normalizeText,
    normalizeEmail,
    normalizeCourier
} = require("../utils/normalize");

/**
 * Recursive sanitizer for objects and arrays
 */
function sanitizeValue(key, value) {
    if (typeof value === "string") {
        // Strip null bytes and control characters
        let cleaned = value.replace(/\0/g, "").trim();

        const lowerKey = typeof key === "string" ? key.toLowerCase() : String(key ?? "").toLowerCase();

        // Specific field normalizers based on key name
        if (lowerKey === "nomor_telepon" || lowerKey === "phone" || lowerKey === "telepon" || lowerKey === "customer_kontak" || lowerKey === "distributor_kontak") {
            return normalizePhone(cleaned) || cleaned;
        }
        if (lowerKey === "email") {
            return normalizeEmail(cleaned);
        }
        if (lowerKey === "merek" || lowerKey === "brand") {
            return normalizeBrand(cleaned);
        }
        if (lowerKey === "serial_number" || lowerKey === "sn" || lowerKey === "serial_number_lama" || lowerKey === "serial_number_baru") {
            return normalizeSerialNumber(cleaned);
        }
        if (lowerKey === "jenis_perangkat") {
            return normalizeDeviceType(cleaned);
        }
        if (lowerKey === "kode_unit" || lowerKey === "nomor_rma" || lowerKey === "nomor_tiket") {
            return cleaned.toUpperCase();
        }
        if (lowerKey === "kurir" || lowerKey === "kurir_pengiriman") {
            return normalizeCourier(cleaned);
        }

        // Default text normalization (collapse multi-spaces for prose fields)
        if (lowerKey === "nama" || lowerKey === "nama_lengkap" || lowerKey === "model" || lowerKey === "kategori") {
            return normalizeText(cleaned);
        }

        return cleaned;
    }

    if (Array.isArray(value)) {
        return value.map((item, index) => sanitizeValue(key, item));
    }

    if (value !== null && typeof value === "object" && !(value instanceof Date)) {
        const sanitizedObj = {};
        for (const k of Object.keys(value)) {
            // Skip binary / buffer / file / password / token fields
            if (
                k === "password" || 
                k === "password_perangkat" || 
                k === "currentPassword" || 
                k === "newPassword" || 
                k.includes("token")
            ) {
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
