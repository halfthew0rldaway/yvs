const rateLimit = require("express-rate-limit");

/**
 * Rate Limiter Khusus Login (Mencegah Brute Force Password)
 * Maksimal 15 percobaan login per 15 menit per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 15,
    message: {
        message: "Terlalu banyak percobaan login gagal dari IP ini. Silakan coba kembali dalam 15 menit demi keamanan akun.",
        code: "AUTH_RATE_LIMIT"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate Limiter Khusus Pelacakan Servis Publik (/api/tracking)
 * Maksimal 60 request per menit per IP
 */
const trackingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 menit
    max: 60,
    message: {
        message: "Terlalu banyak permintaan pelacakan dalam waktu singkat. Mohon tunggu 1 menit.",
        code: "TRACKING_RATE_LIMIT"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate Limiter Umum API
 * Maksimal 300 request per 1 menit per IP (sangat aman & longgar untuk penggunaan normal)
 */
const generalApiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 300,
    message: {
        message: "Batas frekuensi request terlampaui. Mohon kurangi intensitas request.",
        code: "API_RATE_LIMIT"
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Jangan batasi Server-Sent Events / SSE stream
    skip: (req) => req.originalUrl.includes("/api/realtime") || req.originalUrl.startsWith("/uploads")
});

module.exports = {
    authLimiter,
    trackingLimiter,
    generalApiLimiter
};

