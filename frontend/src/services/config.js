import { Capacitor } from "@capacitor/core";

/**
 * Central Environment & API Configuration
 * 
 * STRICT REQUIREMENT: The application must exclusively use the STAGING environment.
 * Staging Domain: staging.101.32.127.55.sslip.io
 * Reference URL: https://staging.101.32.127.55.sslip.io/dashboard
 */

const STAGING_API_BASE = "https://staging.101.32.127.55.sslip.io/api";
const STAGING_ASSET_BASE = "https://staging.101.32.127.55.sslip.io";

export const AppConfig = {
    env: "staging",
    isStaging: true,
    isProduction: false,
    
    // Always staging base URL
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || STAGING_API_BASE,
    assetBaseUrl: import.meta.env.VITE_API_ASSET_BASE_URL || STAGING_ASSET_BASE,

    // Cek apakah platform native Capacitor (Android/iOS)
    get isNative() {
        return Capacitor.isNativePlatform();
    },

    /**
     * Resolves an asset or uploaded file URL.
     * When running inside Capacitor (native) or Web, ensures proper origin prefix.
     */
    resolveImageUrl(path) {
        if (!path) return "";
        if (typeof path === "object") {
            path = path.url || path.path || path.src || path.foto_url || path.filename || "";
        }
        if (typeof path !== "string") return "";

        let clean = path.trim().replace(/^["']+|["']+$/g, "");
        if (!clean) return "";

        if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:") || clean.startsWith("blob:")) {
            return clean;
        }

        clean = clean.replace(/^\/+/, "");
        if (!clean.startsWith("uploads/")) {
            clean = `uploads/${clean}`;
        }

        // On native Capacitor, always prepend full asset base URL
        // On web, also prepend asset base URL if not running on the same domain
        return `${this.assetBaseUrl}/${clean}`;
    },

    /**
     * Resolves an API endpoint path.
     */
    resolveApiUrl(path) {
        if (!path) return this.apiBaseUrl;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        const clean = path.replace(/^\/+/, "");
        if (clean.startsWith("api/")) {
            return `${this.assetBaseUrl}/${clean}`;
        }
        return `${this.apiBaseUrl}/${clean}`;
    }
};

export default AppConfig;
