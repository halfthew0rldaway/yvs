import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import useConnectivity from "../hooks/useConnectivity";

/**
 * In-flow Connectivity Notice Bar
 * 
 * Sits naturally within the layout flow directly below the navbar.
 * NEVER floats over headers, FABs, or action buttons.
 * Strictly returns null whenever navigator.onLine is true.
 */
export default function ConnectivityBanner() {
    const { isOffline, isReconnecting, checkNow } = useConnectivity();

    // If browser / device reports online, NEVER display offline notice
    if (typeof navigator !== "undefined" && navigator.onLine) {
        return null;
    }

    if (!isOffline && !isReconnecting) {
        return null;
    }

    return (
        <aside
            aria-label="Status Koneksi"
            className="w-full bg-slate-900 text-amber-300 border-b border-amber-500/30 px-3.5 py-1.5 flex items-center justify-center gap-2 text-2xs sm:text-xs font-semibold shrink-0 select-none z-10 transition-all duration-200"
        >
            {isOffline && (
                <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="text-white font-medium truncate">
                        Mode Offline • Menampilkan Data Tersimpan
                    </span>
                    <button
                        type="button"
                        onClick={checkNow}
                        className="ml-1 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded text-3xs font-bold transition-all cursor-pointer shrink-0"
                    >
                        Cek
                    </button>
                </>
            )}

            {isReconnecting && (
                <>
                    <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-blue-400" />
                    <span className="text-white font-medium truncate">
                        Menghubungkan ke server...
                    </span>
                </>
            )}
        </aside>
    );
}
