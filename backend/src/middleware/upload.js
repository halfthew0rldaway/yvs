const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { processMediaFiles } = require("../services/videoCompressor");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, "../../uploads");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'tiket-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/3gpp'
    ];
    if (allowedTypes.includes(file.mimetype) || (file.mimetype && file.mimetype.startsWith('video/'))) {
        cb(null, true);
    } else {
        cb(new Error("Hanya file foto (JPG, PNG, WEBP) dan video (MP4, MOV, WEBM) yang diizinkan!"), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB max per file for video
    },
    fileFilter: fileFilter
});

// Dedicated storage for user avatars / profile photos
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, "../../uploads/avatars");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

const avatarFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Hanya file gambar (JPG, PNG, WEBP) yang diizinkan untuk foto profil!"), false);
    }
};

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB max for avatar
    },
    fileFilter: avatarFilter
});

/**
 * Express middleware to automatically compress and transcode uploaded videos
 * into optimized web-streaming MP4 format (+faststart, max 720p).
 */
const compressMedia = async (req, res, next) => {
    try {
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            await processMediaFiles(req.files);
        } else if (req.file) {
            await processMediaFiles([req.file]);
        }
        next();
    } catch (err) {
        console.error("[compressMedia] Middleware error:", err);
        // Continue even if transcoding encountered an issue
        next();
    }
};

module.exports = upload;
module.exports.upload = upload;
module.exports.uploadAvatar = uploadAvatar;
module.exports.compressMedia = compressMedia;
