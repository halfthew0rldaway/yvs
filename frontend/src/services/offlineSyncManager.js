/**
 * Offline changes are drafts that a user reviews and submits after reconnecting.
 * Legacy sync_queue records are never replayed automatically: they have no
 * reliable conflict version or idempotency key, and the user's grants may change.
 */
import { offlineDataStore } from "./offlineDataStore";

export const offlineSyncManager = {
    init() {},

    async processQueue() {
        const pending = await offlineDataStore.getPendingOperations();
        return { pendingReview: pending.length, automaticallySubmitted: 0 };
    }
};

export default offlineSyncManager;
