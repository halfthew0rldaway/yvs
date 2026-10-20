import React from "react";

/**
 * Standardized Loading State for Data Tables
 */
export default function TableLoadingState({ message = "Memuat data tabel...", minHeight = "py-20" }) {
    return (
        <div className={`flex flex-col items-center justify-center ${minHeight} text-slate-400 select-none`}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mb-3"></div>
            <p className="text-xs font-medium text-slate-500">{message}</p>
        </div>
    );
}

