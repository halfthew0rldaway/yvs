import { useEffect, useRef } from "react";
import realtime from "../services/realtime";

/**
 * Custom React hook to listen for real-time Server-Sent Events (SSE)
 * @param {string|string[]} events - Event name or array of event names
 * @param {Function} callback - Function called when event is received
 */
export function useRealtimeEvent(events, callback) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        if (!events || !callback) return;

        const eventList = Array.isArray(events) ? events : [events];
        const unsubs = eventList.map((eventName) => {
            return realtime.subscribe(eventName, (data) => {
                if (callbackRef.current) {
                    callbackRef.current(data, eventName);
                }
            });
        });

        return () => {
            unsubs.forEach((unsub) => unsub());
        };
    }, [Array.isArray(events) ? events.join(",") : events]);
}

export default useRealtimeEvent;

