/**
 * Utility functions for media handling, video detection, and browser-side image compression.
 */

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".3gp", ".avi", ".m4v"];

/**
 * Determines whether a file, URL, or filename is a video.
 * @param {string|File|Blob} item
 * @returns {boolean}
 */
export function isVideo(item) {
    if (!item) return false;
    if (typeof item === "string") {
        const clean = item.split("?")[0].toLowerCase();
        return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
    }
    if (item instanceof File || item instanceof Blob) {
        if (item.type && item.type.startsWith("video/")) return true;
        const name = (item.name || "").toLowerCase();
        return VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext));
    }
    return false;
}

/**
 * Returns a browser-renderable source URL for an image or video file / path.
 * @param {string|File|Blob} media
 * @returns {string}
 */
export function getMediaUrl(media) {
    if (!media) return "";
    if (typeof media === "string") {
        if (media.startsWith("http") || media.startsWith("data:") || media.startsWith("blob:")) {
            return media;
        }
        return `/${media.replace(/^\/+/, "")}`;
    }
    if (media instanceof File || media instanceof Blob) {
        return URL.createObjectURL(media);
    }
    return "";
}

/**
 * Compresses an image client-side before upload (WhatsApp-style compression).
 * Automatically resizes images larger than maxWidth/maxHeight (default 1600px)
 * and encodes as high-efficiency JPEG with quality 0.8.
 *
 * Videos and non-compressible images (GIFs, SVGs) are returned untouched.
 *
 * @param {File} file
 * @param {Object} options
 * @returns {Promise<File>}
 */
export async function compressImage(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = {}) {
    if (!file || !(file instanceof File)) return file;

    // Do not compress videos or non-image files
    if (!file.type || !file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
        return file;
    }

    // If image is already smaller than 300 KB, keep original to avoid unnecessary re-encoding
    if (file.size <= 300 * 1024) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate scaled dimensions keeping aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob || blob.size >= file.size) {
                            // If compression didn't reduce file size, return original
                            return resolve(file);
                        }

                        const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                        const compressedFile = new File([blob], cleanName, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

