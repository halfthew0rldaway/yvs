import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import { DeviceService } from "./services/nativeServices";
import { offlineSyncManager } from "./services/offlineSyncManager";
import "./index.css";

// If running in Capacitor Android Native App, purge any service worker & caches completely
// so WebView network calls to staging API are never intercepted or broken.
if (typeof window !== "undefined") {
    if (Capacitor.isNativePlatform()) {
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
        // Register PWA service worker ONLY on browser / web mode
        import("virtual:pwa-register").then(({ registerSW }) => {
            registerSW({ immediate: true });
        }).catch(() => {});
    }
}

// Safe Native Device Initialization
try {
    if (DeviceService && typeof DeviceService.init === "function") {
        DeviceService.init();
    }
} catch (e) {
    console.warn("[AppInit] DeviceService.init warning:", e);
}

// Safe Offline Sync Processor Initialization
try {
    if (offlineSyncManager && typeof offlineSyncManager.init === "function") {
        offlineSyncManager.init();
    }
} catch (e) {
    console.warn("[AppInit] offlineSyncManager.init warning:", e);
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
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
