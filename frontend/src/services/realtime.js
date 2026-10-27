/**
 * Realtime EventSource (Server-Sent Events) Service
 * Manages singleton SSE connection with automatic reconnection and event dispatching.
 */

class RealtimeService {
    constructor() {
        this.eventSource = null;
        this.listeners = new Map(); // eventName -> Set of callback functions
        this.connected = false;
        this.reconnectTimer = null;
        this.reconnectDelay = 2000;
        this.maxReconnectDelay = 15000;
    }

    /**
     * Initialize connection to SSE endpoint
     */
    connect() {
        if (typeof window === "undefined" || typeof EventSource === "undefined") {
            return;
        }

        // Avoid duplicate connection if already open
        if (this.eventSource && (this.eventSource.readyState === EventSource.OPEN || this.eventSource.readyState === EventSource.CONNECTING)) {
            return;
        }

        const token = localStorage.getItem("token");
        const url = token 
            ? `/api/realtime/events?token=${encodeURIComponent(token)}` 
            : `/api/realtime/events`;

        try {
            this.eventSource = new EventSource(url);

            this.eventSource.onopen = () => {
                this.connected = true;
                this.reconnectDelay = 2000; // Reset delay on successful connection
            };

            this.eventSource.onerror = () => {
                this.connected = false;
                this.disconnect();
                this.scheduleReconnect();
            };

            // Register standard events
            const standardEvents = [
                "connected",
                "dashboard:refresh",
                "tiket:created",
                "tiket:updated",
                "notification:new",
                "notification:updated",
                "invoice:created",
                "invoice:updated",
                "loaner:updated",
                "rma:updated"
            ];

            standardEvents.forEach((eventName) => {
                this.eventSource.addEventListener(eventName, (e) => {
                    let payload = {};
                    try {
                        payload = e.data ? JSON.parse(e.data) : {};
                    } catch (_) {
                        payload = e.data;
                    }
                    this.dispatchEvent(eventName, payload);
                });
            });

        } catch (err) {
            console.warn("[Realtime] Failed to establish SSE connection:", err);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimer) return;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
            this.connect();
        }, this.reconnectDelay);
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.connected = false;
    }

    /**
     * Subscribe to a specific SSE event
     * @param {string} eventName
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        this.listeners.get(eventName).add(callback);

        // Ensure connection is active
        if (!this.eventSource) {
            this.connect();
        }

        return () => {
            const callbacks = this.listeners.get(eventName);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.listeners.delete(eventName);
                }
            }
        };
    }

    /**
     * Dispatch event to registered callbacks
     */
    dispatchEvent(eventName, data) {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.forEach((cb) => {
                try {
                    cb(data);
                } catch (err) {
                    console.error(`[Realtime] Error executing listener for '${eventName}':`, err);
                }
            });
        }
    }

    isConnected() {
        return this.connected && this.eventSource?.readyState === EventSource.OPEN;
    }
}

const realtime = new RealtimeService();
export default realtime;

