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

const DEFAULT_MEMORY_TTL_MS = 25000; // 25s fast in-memory cache for snappy navigation
const memoryCache = new Map();
const inFlightRequests = new Map();

export function clearMemoryCache(pattern) {
    if (!pattern) {
        memoryCache.clear();
        return;
    }
    for (const key of memoryCache.keys()) {
        if (key.includes(pattern)) {
            memoryCache.delete(key);
        }
    }
}

api.clearMemoryCache = clearMemoryCache;

function isCacheableGet(url = "", method = "") {
    if (String(method).toLowerCase() !== "get") return false;
    return !NON_CACHEABLE_ROUTES.some(route => url.includes(route));
}

function getCacheKey(userId, url, params) {
    const query = params ? JSON.stringify(params) : "";
    return `u_${userId || "anon"}:${url}${query ? `?${query}` : ""}`;
}

// Intercept api.request to provide In-Flight Deduplication & Instant In-Memory SWR Caching
const originalRequest = api.request.bind(api);

api.request = function (configOrUrl, maybeConfig) {
    let config = {};
    if (typeof configOrUrl === "string") {
        config = maybeConfig || {};
        config.url = configOrUrl;
    } else {
        config = configOrUrl || {};
    }

    const method = String(config.method || "get").toLowerCase();
    const url = config.url || "";
    const user = getStoredUser();

    // Only apply in-flight dedup and memory cache for cacheable GET requests
    if (isCacheableGet(url, method)) {
        const cacheKey = getCacheKey(user?.id, url, config.params);
        const bypassCache = config.skipCache || config.headers?.["Cache-Control"] === "no-cache" || config.params?._t;

        // 1. Instant In-Memory Cache Hit (< 25s)
        if (!bypassCache && memoryCache.has(cacheKey)) {
            const entry = memoryCache.get(cacheKey);
            const age = Date.now() - entry.timestamp;
            if (age < (config.cacheTtl || DEFAULT_MEMORY_TTL_MS)) {
                return Promise.resolve({
                    data: entry.data,
                    status: entry.status,
                    statusText: "OK (Memory Cache)",
                    headers: { ...entry.headers, "x-yvs-cache": "memory" },
                    config,
                    isCached: true
                });
            }
        }

        // 2. In-Flight Request Deduplication: reuse identical active network promise
        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const requestPromise = originalRequest(config)
            .then((response) => {
                if (response && response.status >= 200 && response.status < 300) {
                    memoryCache.set(cacheKey, {
                        data: response.data,
                        status: response.status,
                        headers: response.headers,
                        timestamp: Date.now()
                    });
                }
                return response;
            })
            .finally(() => {
                inFlightRequests.delete(cacheKey);
            });

        inFlightRequests.set(cacheKey, requestPromise);
        return requestPromise;
    }

    // Auto-clear memory cache prefix on mutations (POST, PUT, PATCH, DELETE)
    if (["post", "put", "patch", "delete"].includes(method)) {
        const baseRoute = url.split("?")[0].split("/").slice(0, 3).join("/");
        if (baseRoute) {
            clearMemoryCache(baseRoute);
        }
    }

    return originalRequest(config);
};

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
