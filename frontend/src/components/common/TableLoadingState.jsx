import React from "react";

/**
 * Standardized High-Performance Loading State for Data Tables (60fps GPU Composited)
 */
export default function TableLoadingState({ message = "Memuat data tabel...", minHeight = "py-20", showSkeleton = true }) {
    return (
        <div className={`flex flex-col items-center justify-center ${minHeight} text-slate-400 select-none gpu-layer animate-fade-in`}>
            <div className="relative w-9 h-9 mb-3">
                <div className="w-9 h-9 rounded-full border-2 border-slate-200/80"></div>
                <div className="absolute inset-0 w-9 h-9 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs font-semibold text-slate-500 tracking-wide">{message}</p>
        </div>
    );
}

