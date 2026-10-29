import { lazy } from "react";

/**
 * Wraps React.lazy with automatic reload on dynamic import failure.
 * This happens when a new build is deployed to the server and the user's
 * open browser tab still tries to request obsolete chunk hashes.
 */
export function lazyWithRetry(componentImport) {
    return lazy(async () => {
        const pageHasBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem("page-has-been-force-refreshed") || "false"
        );

        try {
            const component = await componentImport();
            window.sessionStorage.setItem("page-has-been-force-refreshed", "false");
            return component;
        } catch (error) {
            const isChunkLoadError = 
                error?.message?.includes("dynamically imported module") ||
                error?.message?.includes("Importing a module script failed") ||
                error?.message?.includes("Loading chunk");

            if (isChunkLoadError && !pageHasBeenForceRefreshed) {
                // New deployment detected: refresh once to fetch latest index.html with new chunk hashes
                window.sessionStorage.setItem("page-has-been-force-refreshed", "true");
                window.location.reload();
                return new Promise(() => {}); // Suspend until reload completes
            }

            // Already refreshed once or different error, let ErrorBoundary handle it
            throw error;
        }
    });
}

