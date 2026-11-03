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
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
            onClick={() => !loading && onCancel?.()}
        >
            <div 
                className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                {!loading && (
                    <button 
                        type="button"
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                        title="Tutup (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                
                <div className="flex flex-col items-center text-center mt-1">
                    {/* Icon Badge */}
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3.5 shadow-2xs ${variantStyles.badge}`}>
                        <IconToRender className="w-6 h-6" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {title}
                    </h3>

                    {/* Message (supports multiline) */}
                    {message && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-line text-center">
                            {message}
                        </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 w-full mt-6">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles.confirmBtn}`}
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                            <span>{confirmText}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
