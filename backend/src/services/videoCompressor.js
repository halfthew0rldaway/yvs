const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".3gp", ".avi", ".m4v"];

/**
 * Checks whether a file is a video based on MIME type or file extension
 */
function isVideoFile(filename, mimetype = "") {
    if (mimetype && mimetype.startsWith("video/")) return true;
    const ext = path.extname(filename || "").toLowerCase();
    return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Checks if ffmpeg binary is available in system PATH
 */
let ffmpegAvailable = null;
function checkFfmpeg() {
    if (ffmpegAvailable !== null) return Promise.resolve(ffmpegAvailable);
    return new Promise((resolve) => {
        execFile("ffmpeg", ["-version"], (err) => {
            ffmpegAvailable = !err;
            if (!ffmpegAvailable) {
                console.warn("[videoCompressor] FFmpeg not found in PATH. Videos will be saved without compression.");
            } else {
                console.log("[videoCompressor] FFmpeg is ready for automatic video transcoding.");
            }
            resolve(ffmpegAvailable);
        });
    });
}

/**
 * Compresses an uploaded video file to universal streaming MP4 (H.264 / AAC, max 720p, +faststart)
 * Replaces the original raw video file with the optimized .mp4 file.
 * Returns the final filename.
 */
async function compressVideo(filePath) {
    const hasFfmpeg = await checkFfmpeg();
    if (!hasFfmpeg) return path.basename(filePath);

    const dir = path.dirname(filePath);
    const originalExt = path.extname(filePath);
    const baseName = path.basename(filePath, originalExt);
    const outputFilename = `${baseName}-ready.mp4`;
    const outputPath = path.join(dir, outputFilename);

    // FFmpeg compression arguments:
    // - scale='min(1920,iw)':-2 : scale down to max 1080p (Full HD), keep even height
    // - format=yuv420p : standard 8-bit chroma sub-sampling playable on all mobile & desktop browsers
    // - libx264 -preset veryfast -crf 23 : visually crisp quality (lossless perception) with fast encoding
    // - aac -b:a 128k : universal audio codec
    // - movflags +faststart : enables instant web streaming (moov atom at beginning)
    const args = [
        "-y",
        "-i", filePath,
        "-vf", "scale='min(1920,iw)':-2,format=yuv420p",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        outputPath
    ];

    return new Promise((resolve) => {
        execFile("ffmpeg", args, { timeout: 180000 }, (error) => {
            if (error) {
                console.error("[videoCompressor] FFmpeg compression failed, keeping original:", error.message);
                if (fs.existsSync(outputPath)) {
                    try { fs.unlinkSync(outputPath); } catch (_) {}
                }
                return resolve(path.basename(filePath));
            }

            try {
                // Delete original raw uncompressed video if output was successfully written
                if (fs.existsSync(outputPath) && outputPath !== filePath) {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }
                resolve(outputFilename);
            } catch (cleanupErr) {
                console.error("[videoCompressor] Cleanup error:", cleanupErr);
                resolve(outputFilename);
            }
        });
    });
}

/**
 * Processes an array of Multer files in-place:
 * Transcodes videos to optimized MP4 and updates file metadata (filename, path, size).
 */
async function processMediaFiles(files) {
    if (!files || !Array.isArray(files) || files.length === 0) return files;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isVideoFile(file.originalname || file.filename, file.mimetype)) {
            const initialSize = file.size;
            try {
                const finalFilename = await compressVideo(file.path);
                file.filename = finalFilename;
                file.path = path.join(path.dirname(file.path), finalFilename);
                const stat = fs.existsSync(file.path) ? fs.statSync(file.path) : null;
                if (stat) {
                    file.size = stat.size;
                    const savedPct = initialSize > 0 ? (((initialSize - file.size) / initialSize) * 100).toFixed(1) : 0;
                    console.log(`[videoCompressor] Transcoded ${file.originalname}: ${(initialSize / (1024 * 1024)).toFixed(2)} MB -> ${(file.size / (1024 * 1024)).toFixed(2)} MB (${savedPct}% reduction)`);
                }
            } catch (err) {
                console.error(`[videoCompressor] Error transcoding ${file.filename}:`, err);
            }
        }
    }
    return files;
}

module.exports = {
    isVideoFile,
    checkFfmpeg,
    compressVideo,
    processMediaFiles
};
