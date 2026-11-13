import React, { useEffect } from "react";
import { AlertTriangle, AlertCircle, HelpCircle, X, Loader2 } from "lucide-react";

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Konfirmasi",
    cancelText = "Batal",
    isDanger = false,
    variant = isDanger ? "danger" : "primary", // "danger" | "warning" | "primary"
    icon: CustomIcon = null,
    loading = false
}) {
    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e) {
            if (e.key === "Escape" && !loading) {
                onCancel?.();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel, loading]);

    if (!isOpen) return null;

    const actualVariant = isDanger ? "danger" : variant;

    const getVariantStyles = () => {
        switch (actualVariant) {
            case "danger":
                return {
                    badge: "bg-rose-50 text-rose-600 border-rose-200",
                    confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
                    defaultIcon: AlertTriangle
                };
            case "warning":
                return {
                    badge: "bg-amber-50 text-amber-600 border-amber-200",
                    confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
                    defaultIcon: AlertCircle
                };
            case "primary":
            default:
                return {
                    badge: "bg-blue-50 text-blue-600 border-blue-200",
                    confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
                    defaultIcon: HelpCircle
                };
        }
    };

    const variantStyles = getVariantStyles();
    const IconToRender = CustomIcon || variantStyles.defaultIcon;

    return (
        <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
            onClick={() => !loading && onCancel?.()}
        >
            <div 
                className="relative w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain bg-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                {!loading && (
                    <button 
                        type="button"
                        onClick={onCancel}
                        className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                        title="Tutup (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                
                <div className="flex flex-col items-center text-center">
                    {/* Icon Badge */}
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-3 shadow-2xs ${variantStyles.badge}`}>
                        <IconToRender className="w-5 h-5" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {title}
                    </h3>

                    {/* Message (supports multiline) */}
                    {message && (
                        <p className="text-xs text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line text-center">
                            {message}
                        </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full mt-5">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onCancel}
                            className="flex-1 min-w-[7rem] min-h-9 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onConfirm}
                            className={`flex-1 min-w-[7rem] min-h-9 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${variantStyles.confirmBtn}`}
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                            <span>{confirmText}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
