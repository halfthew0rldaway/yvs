/**
 * Offline Data Store (IndexedDB Engine)
 * 
 * Provides robust, asynchronous, high-capacity client-side caching for PWA & Capacitor.
 * Supports Stale-While-Revalidate (SWR), user-scoped data isolation, and local drafts.
 */

const DB_NAME = "yvs_offline_cache_v1";
const DB_VERSION = 2;
const CACHE_STORE = "api_cache";
const QUEUE_STORE = "sync_queue";
const DRAFT_STORE = "local_drafts";

// Default TTL for cached GET requests: 48 hours for offline capability
const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000;

let dbPromise = null;

function getDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.indexedDB) {
            return reject(new Error("IndexedDB is not supported in this environment"));
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Store 1: API Response Cache (SWR)
            if (!db.objectStoreNames.contains(CACHE_STORE)) {
                const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: "id" });
                cacheStore.createIndex("user_id", "user_id", { unique: false });
                cacheStore.createIndex("url", "url", { unique: false });
                cacheStore.createIndex("updated_at", "updated_at", { unique: false });
            }

            // Store 2: Offline Operation Sync Queue
            if (!db.objectStoreNames.contains(QUEUE_STORE)) {
                const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
                queueStore.createIndex("status", "status", { unique: false });
                queueStore.createIndex("created_at", "created_at", { unique: false });
            }

            if (!db.objectStoreNames.contains(DRAFT_STORE)) {
                const draftStore = db.createObjectStore(DRAFT_STORE, { keyPath: "id" });
                draftStore.createIndex("user_id", "user_id", { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error("[OfflineDataStore] Failed to open IndexedDB:", request.error);
            reject(request.error);
        };
    });

    return dbPromise;
}

export const offlineDataStore = {
    /**
     * Retrieve cached API response
     */
    async getCache(key) {
        try {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(CACHE_STORE, "readonly");
                const store = tx.objectStore(CACHE_STORE);
                const req = store.get(key);

                req.onsuccess = () => {
                    const record = req.result;
                    if (!record) return resolve(null);

                    // Check expiration
                    if (record.expires_at && Date.now() > record.expires_at) {
                        // Expired, asynchronously clean up
                        this.deleteCache(key).catch(() => {});
                        return resolve(null);
                    }

                    resolve(record);
                };

                req.onerror = () => resolve(null);
            });
        } catch {
            return null;
        }
    },

    /**
     * Store API response in cache
     */
    async setCache(key, data, options = {}) {
        try {
            const db = await getDB();
            const { userId = "anon", url = "", ttl = DEFAULT_TTL_MS, status = 200, headers = {} } = options;

            const record = {
                id: key,
                user_id: String(userId),
                url,
                data,
                status,
                headers,
                updated_at: Date.now(),
                expires_at: Date.now() + ttl
            };

            return new Promise((resolve) => {
                const tx = db.transaction(CACHE_STORE, "readwrite");
                const store = tx.objectStore(CACHE_STORE);
                const req = store.put(record);

                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            });
        } catch {
            return false;
        }
    },

    /**
     * Delete a specific cache item
     */
    async deleteCache(key) {
        try {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(CACHE_STORE, "readwrite");
                const store = tx.objectStore(CACHE_STORE);
                const req = store.delete(key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            });
        } catch {
            return false;
        }
    },

    /**
     * Invalidate cached entries matching a URL prefix or tag (e.g., when a ticket is created/edited)
     */
    async invalidate(urlPattern) {
        try {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(CACHE_STORE, "readwrite");
                const store = tx.objectStore(CACHE_STORE);
                const req = store.openCursor();

                req.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const url = cursor.value.url || cursor.value.id || "";
                        const match = typeof urlPattern === "string" 
                            ? url.includes(urlPattern) 
                            : urlPattern.test(url);

                        if (match) {
                            cursor.delete();
                        }
                        cursor.continue();
                    } else {
                        resolve(true);
                    }
                };

                req.onerror = () => resolve(false);
            });
        } catch {
            return false;
        }
    },

    /**
     * Purge all cached data for a user on logout to maintain privacy & security
     */
    async clearUserCache(userId) {
        try {
            const db = await getDB();
            return new Promise(resolve => {
                const tx = db.transaction([CACHE_STORE, DRAFT_STORE, QUEUE_STORE], "readwrite");
                // Legacy queue entries predate user ownership metadata. Never
                // carry them across logout or a permission change.
                tx.objectStore(QUEUE_STORE).clear();
                for (const name of [CACHE_STORE, DRAFT_STORE]) {
                    const store = tx.objectStore(name);
                    if (!userId) {
                        store.clear();
                    } else {
                        const cursor = store.index("user_id").openCursor(IDBKeyRange.only(String(userId)));
                        cursor.onsuccess = event => {
                            const row = event.target.result;
                            if (row) { row.delete(); row.continue(); }
                        };
                    }
                }
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.onabort = () => resolve(false);
            });
        } catch {
            return false;
        }
    },

    async getDraft(userId, kind, entityId) {
        if (!userId || !kind || !entityId) return null;
        try {
            const db = await getDB();
            const id = `${userId}:${kind}:${entityId}`;
            return await new Promise(resolve => {
                const req = db.transaction(DRAFT_STORE, "readonly").objectStore(DRAFT_STORE).get(id);
                req.onsuccess = () => resolve(req.result?.expires_at > Date.now() ? req.result : null);
                req.onerror = () => resolve(null);
            });
        } catch { return null; }
    },

    async setDraft(userId, kind, entityId, text) {
        if (!userId || !kind || !entityId || typeof text !== "string" || text.length > 10000) return false;
        try {
            const db = await getDB();
            return await new Promise(resolve => {
                const tx = db.transaction(DRAFT_STORE, "readwrite");
                tx.objectStore(DRAFT_STORE).put({
                    id: `${userId}:${kind}:${entityId}`,
                    user_id: String(userId), kind, entity_id: String(entityId), text,
                    updated_at: Date.now(), expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
                });
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.onabort = () => resolve(false);
            });
        } catch { return false; }
    },

    async deleteDraft(userId, kind, entityId) {
        if (!userId || !kind || !entityId) return false;
        try {
            const db = await getDB();
            return await new Promise(resolve => {
                const tx = db.transaction(DRAFT_STORE, "readwrite");
                tx.objectStore(DRAFT_STORE).delete(`${userId}:${kind}:${entityId}`);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.onabort = () => resolve(false);
            });
        } catch { return false; }
    },

    /**
     * Enqueue a non-sensitive operation for offline synchronization
     */
    async enqueueOperation(operation) {
        try {
            const db = await getDB();
            const record = {
                id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                status: "pending", // "pending" | "syncing" | "failed"
                created_at: Date.now(),
                retries: 0,
                ...operation
            };

            return new Promise((resolve, reject) => {
                const tx = db.transaction(QUEUE_STORE, "readwrite");
                const store = tx.objectStore(QUEUE_STORE);
                const req = store.put(record);
                req.onsuccess = () => resolve(record);
                req.onerror = () => reject(req.error);
            });
        } catch (err) {
            console.error("[OfflineDataStore] Failed to enqueue operation:", err);
            return null;
        }
    },

    /**
     * Get all pending operations awaiting synchronization
     */
    async getPendingOperations() {
        try {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(QUEUE_STORE, "readonly");
                const store = tx.objectStore(QUEUE_STORE);
                const index = store.index("status");
                const req = index.getAll(IDBKeyRange.only("pending"));

                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => resolve([]);
            });
        } catch {
            return [];
        }
    },

    /**
     * Remove or mark operation as completed
     */
    async removeOperation(id) {
        try {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(QUEUE_STORE, "readwrite");
                const store = tx.objectStore(QUEUE_STORE);
                const req = store.delete(id);
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            });
        } catch {
            return false;
        }
    }
};

export default offlineDataStore;
