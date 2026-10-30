import React from "react";
import { FolderSearch } from "lucide-react";

/**
 * Standardized Empty State for Data Tables
 */
export default function TableEmptyState({
    icon: Icon = FolderSearch,
    title = "Data Tidak Ditemukan",
    description = "Tidak ada rekaman data yang cocok dengan kriteria pencarian atau filter saat ini.",
    actionLabel,
    onAction,
}) {
    return (
        <div className="text-center py-16 px-4 animate-fade-in gpu-layer">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-3 text-slate-400">
                <Icon className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">{description}</p>
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

