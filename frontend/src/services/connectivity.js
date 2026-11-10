/**
 * Connectivity & Network Status Service
 * 
 * Accurately tracks online/offline status using standard native browser & Capacitor events.
 * Never performs artificial background ping loops that cause false offline status.
 */

class ConnectivityManager {
    constructor() {
        this.status = (typeof navigator !== "undefined" && navigator.onLine === false) ? "offline" : "online";
        this.listeners = new Set();

        if (typeof window !== "undefined") {
            window.addEventListener("online", () => this.setStatus("online"));
            window.addEventListener("offline", () => this.setStatus("offline"));
        }
    }

    get isOnline() {
        return this.status === "online";
    }

    get isOffline() {
        return this.status === "offline";
    }

    get isReconnecting() {
        return this.status === "reconnecting";
    }

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.status);
        return () => {
            this.listeners.delete(listener);
        };
    }

    notify() {
        this.listeners.forEach((listener) => {
            try {
                listener(this.status);
            } catch (err) {
                console.error("[Connectivity] Listener error:", err);
            }
        });
    }

    setStatus(newStatus) {
        if (this.status !== newStatus) {
            const oldStatus = this.status;
            this.status = newStatus;
            this.notify();

            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("yvs:connectivity-change", {
                        detail: { status: newStatus, previous: oldStatus }
                    })
                );

                if (newStatus === "online") {
                    window.dispatchEvent(new CustomEvent("yvs:online"));
                } else if (newStatus === "offline") {
                    window.dispatchEvent(new CustomEvent("yvs:offline"));
                }
            }
        }
    }

    async verifyConnectivity() {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            this.setStatus("offline");
            return false;
        }
        this.setStatus("online");
        return true;
    }
}

export const connectivity = new ConnectivityManager();
export default connectivity;
