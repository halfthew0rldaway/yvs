const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Sanitizes ticket number to be safe for directory & file names across OS (Linux/Windows/macOS)
 * Example: "TKT/2026/001" or "TKT-202610-001" -> "TKT-202610-001"
 */
function sanitizeTicketNumber(noTiket) {
    if (!noTiket) return "TKT-UNKNOWN";
    return String(noTiket).trim().replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "_");
}

/**
 * Generates and ensures hierarchical ticket media directory structure:
 * uploads/tickets/YYYY/MM/[NO_TIKET]
 */
function getTicketMediaDirectory(noTiket, date = new Date()) {
    const cleanNo = sanitizeTicketNumber(noTiket);
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const targetDir = path.join(__dirname, `../../uploads/tickets/${year}/${month}/${cleanNo}`);

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    return {
        absoluteDir: targetDir,
        relativeUrlBase: `/uploads/tickets/${year}/${month}/${cleanNo}`,
        year,
        month,
        cleanNo
    };
}

/**
 * Relocates a single staged file into structured ticket media folder with smart naming:
 * [NO_TIKET]_[STAGE]_[TIMESTAMP]_[RANDOM].[ext]
 *
 * Stage examples:
 * - MASUK: Foto/video kondisi awal saat unit diterima (intake)
 * - DIAGNOSA: Foto/video temuan teknisi saat pengecekan kerusakan
 * - PERBAIKAN: Foto/video log pengerjaan teknisi
 * - SELESAI: Foto/video hasil servis & QC akhir sebelum serah terima
 *
 * @param {Object|string} file - Multer file object or file path string
 * @param {string} noTiket - Ticket number
 * @param {string} stage - Workflow stage ("MASUK" | "DIAGNOSA" | "PERBAIKAN" | "SELESAI")
 * @param {Date} [date] - Timestamp date
 * @returns {string|null} - Final public URL, e.g. "/uploads/tickets/2026/10/TKT-202610-001/TKT-202610-001_MASUK_20261030_134500_a1b2.mp4"
 */
function relocateSingleFile(file, noTiket, stage = "MASUK", date = new Date()) {
    if (!file) return null;

    const currentFilePath = typeof file === "string" ? file : file.path;
    if (!currentFilePath) return null;

    // If file does not exist at current path, check if it's already an active URL
    if (!fs.existsSync(currentFilePath)) {
        if (typeof file === "string" && file.startsWith("/uploads/")) {
            return file;
        }
        return null;
    }

    const { absoluteDir, relativeUrlBase, cleanNo } = getTicketMediaDirectory(noTiket, date);
    const cleanStage = (stage || "MASUK").toUpperCase().replace(/[^A-Z0-9_]/g, "");

    // Format timestamp: YYYYMMDD_HHMMSS
    const pad = (n) => String(n).padStart(2, "0");
    const timestamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    const randomHex = crypto.randomBytes(2).toString("hex"); // 4 random hex chars for uniqueness

    const ext = (path.extname(currentFilePath) || (typeof file === "object" && file.originalname ? path.extname(file.originalname) : "") || ".jpg").toLowerCase();
    const finalFilename = `${cleanNo}_${cleanStage}_${timestamp}_${randomHex}${ext}`;
    const destinationPath = path.join(absoluteDir, finalFilename);

    // If destination already matches source (e.g. re-run), return existing relative URL
    if (path.resolve(currentFilePath) === path.resolve(destinationPath)) {
        return `${relativeUrlBase}/${finalFilename}`;
    }

    // Atomically move the file with EXDEV (cross-device) fallback
    try {
        fs.renameSync(currentFilePath, destinationPath);
    } catch (err) {
        if (err.code === "EXDEV") {
            fs.copyFileSync(currentFilePath, destinationPath);
            try { fs.unlinkSync(currentFilePath); } catch (e) { /* ignore cleanup error */ }
        } else {
            throw err;
        }
    }

    // Update Multer file metadata if object passed
    if (typeof file === "object") {
        file.destination = absoluteDir;
        file.filename = finalFilename;
        file.path = destinationPath;
    }

    return `${relativeUrlBase}/${finalFilename}`;
}

/**
 * Relocates an array of Multer files into the structured ticket directory
 *
 * @param {Array|Object} files - Multer file(s)
 * @param {string} noTiket - Ticket number
 * @param {string} stage - Workflow stage
 * @param {Date} [date] - Timestamp date
 * @returns {Array<string>} - Array of final relative URLs for database storage
 */
function relocateTicketMedia(files, noTiket, stage = "MASUK", date = new Date()) {
    if (!files) return [];
    const list = Array.isArray(files) ? files : [files];
    const urls = [];

    for (const file of list) {
        try {
            const finalUrl = relocateSingleFile(file, noTiket, stage, date);
            if (finalUrl) {
                urls.push(finalUrl);
            }
        } catch (err) {
            console.error(`[mediaStorage] Gagal memindahkan file ${file.filename || file}:`, err);
            // Fallback: retain original upload path if move fails
            if (file.filename) {
                urls.push(`/uploads/${file.filename}`);
            }
        }
    }

    return urls;
}

module.exports = {
    sanitizeTicketNumber,
    getTicketMediaDirectory,
    relocateSingleFile,
    relocateTicketMedia
};
