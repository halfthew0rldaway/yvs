import { useState, useEffect, useCallback, useRef } from "react";
import { getLastActive, updateLastActive } from "../utils/authStorage";

/**
 * Hook untuk memonitor inaktivitas (idle timeout) user.
 * 
 * Fitur:
 * - Sinkronisasi antar-tab via localStorage event (aktivitas di Tab A otomatis mereset timer di Tab B).
 * - Throttled activity listener untuk performa tinggi & zero-lag.
 * - Peringatan graceful sebelum sesi terkunci (warning countdown).
 * - Kemampuan perpanjangan sesi instan (heartbeat / extendSession).
 */
export function useIdleTimer({
    timeoutMs = 30 * 60 * 1000,          // 30 menit inaktivitas total
    warningThresholdMs = 2 * 60 * 1000,  // 2 menit peringatan sebelum logout
    enabled = true,
    onIdle,
    onWarning
} = {}) {
    const [isWarning, setIsWarning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isIdle, setIsIdle] = useState(false);

    const onIdleRef = useRef(onIdle);
    const onWarningRef = useRef(onWarning);
    const lastThrottleTimeRef = useRef(0);

    // Selalu simpan referensi callback terbaru
    useEffect(() => {
        onIdleRef.current = onIdle;
        onWarningRef.current = onWarning;
    }, [onIdle, onWarning]);

    // Fungsi reset timer & catat aktivitas aktif
    const resetTimer = useCallback(() => {
        if (!enabled) return;
        updateLastActive();
        setIsWarning(false);
        setIsIdle(false);
        setRemainingSeconds(0);
    }, [enabled]);

    // Handle interaksi fisik user (mouse, keyboard, touch, scroll) dengan throttling 3 detik
    const handleUserActivity = useCallback(() => {
        if (!enabled || isIdle) return;

        const now = Date.now();
        if (now - lastThrottleTimeRef.current > 3000) {
            lastThrottleTimeRef.current = now;
            updateLastActive();
            if (isWarning) {
                setIsWarning(false);
                setRemainingSeconds(0);
            }
        }
    }, [enabled, isIdle, isWarning]);

    // Listen storage event untuk sinkronisasi antar tab
    useEffect(() => {
        if (!enabled) return;

        function handleStorageChange(e) {
            if (e.key === "yvs_last_active") {
                // Ada aktivitas di tab lain, reset peringatan di tab ini
                setIsWarning(false);
                setRemainingSeconds(0);
                setIsIdle(false);
            }
        }

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [enabled]);

    // Register event listeners untuk mendeteksi user presence
    useEffect(() => {
        if (!enabled) return;

        const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click", "wheel"];
        const throttledHandler = () => handleUserActivity();

        events.forEach((eventName) => {
            window.addEventListener(eventName, throttledHandler, { passive: true });
        });

        return () => {
            events.forEach((eventName) => {
                window.removeEventListener(eventName, throttledHandler);
            });
        };
    }, [enabled, handleUserActivity]);

    // Interval checker setiap 1 detik
    useEffect(() => {
        if (!enabled) return;

        const timer = setInterval(() => {
            const lastActive = getLastActive();
            const elapsed = Date.now() - lastActive;

            if (elapsed >= timeoutMs) {
                // Waktu inaktivitas habis!
                if (!isIdle) {
                    setIsIdle(true);
                    setIsWarning(false);
                    setRemainingSeconds(0);
                    if (onIdleRef.current) {
                        onIdleRef.current();
                    }
                }
            } else if (elapsed >= timeoutMs - warningThresholdMs) {
                // Masuk ke fase peringatan (warning dialog)
                const timeLeftSec = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
                setIsWarning(true);
                setRemainingSeconds(timeLeftSec);
                if (onWarningRef.current && !isWarning) {
                    onWarningRef.current(timeLeftSec);
                }
            } else {
                // Masih dalam fase aktif normal
                if (isWarning) {
                    setIsWarning(false);
                    setRemainingSeconds(0);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [enabled, timeoutMs, warningThresholdMs, isIdle, isWarning]);

    return {
        isWarning,
        remainingSeconds,
        isIdle,
        resetTimer
    };
}

