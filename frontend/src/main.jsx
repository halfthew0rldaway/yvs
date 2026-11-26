import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const isNativeCapacitor = () =>
    Boolean(typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.());

// If running in Capacitor Android Native App, purge any service worker & caches completely
// so WebView network calls to staging API are never intercepted or broken.
if (typeof window !== "undefined") {
    if (isNativeCapacitor()) {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                }
            }).catch(() => {});
        }
        if ("caches" in window) {
            caches.keys().then((names) => {
                names.forEach((name) => caches.delete(name));
            }).catch(() => {});
        }
    } else if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        // Defer PWA service worker registration & 5MB precache well past FCP/LCP/TTI
        window.addEventListener("load", () => {
            const registerDeferred = () => {
                import("virtual:pwa-register").then(({ registerSW }) => {
                    registerSW({ immediate: true });
                }).catch(() => {});
            };
            window.setTimeout(() => {
                if (typeof window.requestIdleCallback === "function") {
                    window.requestIdleCallback(registerDeferred, { timeout: 3000 });
                } else {
                    registerDeferred();
                }
            }, 2500);
        }, { once: true });
    }

    // Defer native bridges & offline ERP queue strictly to native Capacitor builds
    // or signed-in ERP sessions so public /tracking visitors pay zero bundle/IndexedDB cost.
    const scheduleBackgroundInit = () => {
        import("./services/nativeServices")
            .then(({ DeviceService }) => {
                if (DeviceService && typeof DeviceService.init === "function") {
                    DeviceService.init();
                }
            })
            .catch((e) => console.warn("[AppInit] DeviceService.init warning:", e));

        import("./services/offlineSyncManager")
            .then(({ offlineSyncManager }) => {
                if (offlineSyncManager && typeof offlineSyncManager.init === "function") {
                    offlineSyncManager.init();
                }
            })
            .catch((e) => console.warn("[AppInit] offlineSyncManager.init warning:", e));
    };

    const hasStaffSession = (() => {
        try {
            return Boolean(window.localStorage.getItem("token") || window.sessionStorage.getItem("token"));
        } catch (_) {
            return false;
        }
    })();

    const isPublicTrackingPath =
        window.location.pathname === "/tracking" ||
        window.location.pathname.startsWith("/tracking/");

    if (isNativeCapacitor()) {
        scheduleBackgroundInit();
    } else if (hasStaffSession && !isPublicTrackingPath) {
        if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(scheduleBackgroundInit, { timeout: 2500 });
        } else {
            window.addEventListener("load", () => window.setTimeout(scheduleBackgroundInit, 400), { once: true });
        }
    }
}

// Auto-handle Vite dynamic import chunk failures when a new version is deployed on server
window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    console.warn("New build version detected or chunk load failed. Reloading page...");
    window.location.reload();
});

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
