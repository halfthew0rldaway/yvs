/**
 * Offline Sync Manager
 * 
 * Handles background synchronization of queued offline operations when connectivity returns.
 * Protects security by disallowing unauthorized or security-sensitive offline transactions.
 */

import { offlineDataStore } from "./offlineDataStore";
import api from "./api";

let isSyncing = false;

export const offlineSyncManager = {
    init() {
        if (typeof window !== "undefined") {
            window.addEventListener("yvs:online", () => {
                this.processQueue();
            });
            if (typeof navigator !== "undefined" && navigator.onLine) {
                setTimeout(() => {
                    this.processQueue();
                }, 2000);
            }
        }
    },

    async processQueue() {
        if (isSyncing) return;
        isSyncing = true;

        try {
            const pendingOps = await offlineDataStore.getPendingOperations();
            if (!pendingOps || pendingOps.length === 0) {
                isSyncing = false;
                return;
            }

            console.log(`[OfflineSync] Found ${pendingOps.length} pending operation(s) to synchronize...`);

            for (const op of pendingOps) {
                try {
                    // Only process safe allowed endpoints
                    const isAllowedEndpoint = op.url && (
                        op.url.includes("/draft") ||
                        op.url.includes("/checklist") ||
                        op.url.includes("/catatan") ||
                        op.isSafeOffline
                    );

                    if (!isAllowedEndpoint) {
                        console.warn("[OfflineSync] Operation not eligible for auto-sync, skipping:", op);
                        await offlineDataStore.removeOperation(op.id);
                        continue;
                    }

                    // Execute request
                    if (op.method === "POST") {
                        await api.post(op.url, op.payload, { skipOfflineCache: true });
                    } else if (op.method === "PUT") {
                        await api.put(op.url, op.payload, { skipOfflineCache: true });
                    } else if (op.method === "PATCH") {
                        await api.patch(op.url, op.payload, { skipOfflineCache: true });
                    }

                    // On success, remove from queue
                    await offlineDataStore.removeOperation(op.id);
                    console.log(`[OfflineSync] Successfully synchronized operation: ${op.id}`);
                } catch (err) {
                    console.error(`[OfflineSync] Failed to sync operation ${op.id}:`, err);
                    op.retries = (op.retries || 0) + 1;
                    if (op.retries > 3) {
                        // Max retries exceeded, remove to prevent blocking queue
                        await offlineDataStore.removeOperation(op.id);
                    }
                }
            }

            // Invalidate relevant cache so UI gets fresh synced state
            await offlineDataStore.invalidate("/tiket");
            await offlineDataStore.invalidate("/dashboard");
        } catch (err) {
            console.error("[OfflineSync] Error during queue processing:", err);
        } finally {
            isSyncing = false;
        }
    }
};

export default offlineSyncManager;
