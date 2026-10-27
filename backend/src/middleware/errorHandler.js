/**
 * Centralized Global Error Handler Middleware
 * Menangani seluruh unhandled exceptions dan memetakan kode error Prisma ke pesan HTTP yang ramah.
 */
function errorHandler(err, req, res, next) {
    const isDev = process.env.NODE_ENV !== "production";

    // 1. Prisma Known Request Errors
    if (err.code === "P2002") {
        const targetFields = err.meta?.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(", ") : err.meta.target) : "kolom unik";
        return res.status(409).json({
            message: `Data ganda: nilai pada field [${targetFields}] sudah terdaftar di sistem.`,
            code: "DUPLICATE_ENTRY",
            ...(isDev ? { meta: err.meta } : {})
        });
    }

    if (err.code === "P2025") {
        return res.status(404).json({
            message: err.meta?.cause || "Data yang diminta tidak ditemukan di database.",
            code: "NOT_FOUND"
        });
    }

    if (err.code === "P2003") {
        return res.status(400).json({
            message: "Operasi gagal karena integritas relasi foreign key database terikat dengan data lain.",
            code: "FOREIGN_KEY_VIOLATION"
        });
    }

    // 2. JWT Authentication Errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            message: "Token autentikasi tidak valid. Silakan login kembali.",
            code: "INVALID_TOKEN"
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            message: "Sesi login Anda telah berakhir. Silakan login kembali.",
            code: "TOKEN_EXPIRED"
        });
    }

    // 3. Multer File Upload Errors
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            message: "Ukuran file terlalu besar. Maksimal 10MB per file.",
            code: "FILE_TOO_LARGE"
        });
    }

    // 4. Default Internal Server Error
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Terjadi kesalahan internal pada server.";

    console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err);

    return res.status(statusCode).json({
        message,
        code: err.code || "INTERNAL_SERVER_ERROR",
        ...(isDev ? { stack: err.stack } : {})
    });
}

module.exports = errorHandler;

