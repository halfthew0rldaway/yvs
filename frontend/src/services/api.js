import axios from "axios";
import { getAuthToken, updateLastActive, getStoredUser } from "../utils/authStorage";
import { offlineDataStore } from "./offlineDataStore";
import AppConfig from "./config";
import connectivity from "./connectivity";

const api = axios.create({
    baseURL: AppConfig.apiBaseUrl,
    timeout: 30000,
});

// Non-cacheable endpoint prefixes (e.g. live GPS/attendance, raw DB operations, auth credentials)
const NON_CACHEABLE_ROUTES = [
    "/auth/",
    "/attendance/",
    "/database/",
    "/health"
];

function isCacheableGet(url = "", method = "") {
    if (String(method).toLowerCase() !== "get") return false;
    return !NON_CACHEABLE_ROUTES.some(route => url.includes(route));
}

function getCacheKey(userId, url, params) {
    const query = params ? JSON.stringify(params) : "";
    return `u_${userId || "anon"}:${url}${query ? `?${query}` : ""}`;
}

// Sertakan token di setiap request & catat aktivitas
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Setiap request API autentikasi menandakan user sedang aktif
        updateLastActive();
    }
    return config;
});

// Handle response & SWR offline caching
api.interceptors.response.use(
    (response) => {
        const method = response.config?.method;
        const url = response.config?.url || "";
        const user = getStoredUser();

        // If GET succeeded and is cacheable, cache in IndexedDB in background
        if (isCacheableGet(url, method)) {
            const cacheKey = getCacheKey(user?.id, url, response.config?.params);
            offlineDataStore.setCache(cacheKey, response.data, {
                userId: user?.id,
                url,
                status: response.status
            }).catch(() => {});
        } else if (["post", "put", "patch", "delete"].includes(String(method).toLowerCase())) {
            // Auto-invalidate related cache prefix on mutation
            const baseRoute = url.split("?")[0].split("/").slice(0, 3).join("/");
            if (baseRoute) {
                offlineDataStore.invalidate(baseRoute).catch(() => {});
            }
        }

        // Mark connectivity as online on successful API communication
        if (!connectivity.isOnline) {
            connectivity.setStatus("online");
        }

        return response;
    },
    async (error) => {
        const status = error.response?.status;
        const url = error.config?.url || "";
        const method = error.config?.method;
        const isNetworkOrOffline = !error.response || error.code === "ERR_NETWORK" || error.message?.includes("Network Error");

        if (isNetworkOrOffline && typeof navigator !== "undefined" && navigator.onLine === false) {
            connectivity.setStatus("offline");
        }

        // Offline Fallback for GET requests: serve from IndexedDB cache if available
        if (isNetworkOrOffline && isCacheableGet(url, method)) {
            try {
                const user = getStoredUser();
                const cacheKey = getCacheKey(user?.id, url, error.config?.params);
                const cached = await offlineDataStore.getCache(cacheKey);
                if (cached && cached.data) {
                    return {
                        data: cached.data,
                        status: 200,
                        statusText: "OK (Cached Offline)",
                        headers: { "x-yvs-cache": "offline-indexeddb" },
                        config: error.config,
                        isOfflineCache: true,
                        cachedAt: cached.updated_at
                    };
                }
            } catch (cacheErr) {
                console.warn("[OfflineDataStore] Fallback lookup failed:", cacheErr);
            }
        }

        // Jangan tangani 401 jika request sengaja ditujukan ke endpoint login
        const isLoginRequest = url.includes("/auth/login");

        if (status === 401 && !isLoginRequest) {
            const errorCode = error.response?.data?.code || "UNAUTHORIZED";
            const errorMessage = error.response?.data?.message || "Sesi login Anda telah berakhir.";

            // Pancarkan event global agar Re-login Modal in-app terbuka tanpa reload paksa
            if (typeof window !== "undefined") {
                const isAuthPage = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/tracking");
                if (!isAuthPage) {
                    window.dispatchEvent(
                        new CustomEvent("yvs:session-expired", {
                            detail: {
                                code: errorCode,
                                message: errorMessage,
                                url
                            }
                        })
                    );
                }
            }
        }

        // Tangkap error validasi dari backend dan format pesannya agar UI bisa langsung menampilkannya di Toast
        if (status === 400 && error.response?.data?.errors) {
            const errorList = error.response.data.errors.map((e) => e.message).join("\n• ");
            error.response.data.message = `Data tidak sesuai:\n• ${errorList}`;
        }

        return Promise.reject(error);
    }
);

export default api;
