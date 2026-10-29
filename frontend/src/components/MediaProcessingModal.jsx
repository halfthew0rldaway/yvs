import React from "react";
import { 
    Sparkles, 
    UploadCloud, 
    CheckCircle2, 
    Image as ImageIcon, 
    Video, 
    AlertCircle, 
    Loader2, 
    Check, 
    ArrowRight,
    ShieldCheck
} from "lucide-react";
import { formatBytes } from "../utils/mediaUtils";

/**
 * MediaProcessingModal
 * Visual feedback modal for client-side media compression and network upload.
 * Provides transparent, real-time status of each file being processed.
 */
export default function MediaProcessingModal({
    isOpen = false,
    stage = "compressing", // "compressing" | "uploading" | "done"
    title,
    subtitle,
    currentFileIndex = 1,
    totalFiles = 1,
    currentFileName = "",
    currentFileType = "image",
    currentOriginalSize = 0,
    currentCompressedSize = 0,
    progressPercent = 0,
    uploadedBytes = 0,
    totalBytes = 0,
    items = [],
}) {
    if (!isOpen) return null;

    const isUploading = stage === "uploading";
    const isDone = stage === "done" || progressPercent >= 100;

    // Derived savings calculation
    const hasSizeData = currentOriginalSize > 0 && currentCompressedSize > 0;
    const savingsPercent = hasSizeData 
        ? Math.max(0, Math.round(((currentOriginalSize - currentCompressedSize) / currentOriginalSize) * 100))
        : 0;

    // Default titles & subtitles
    const displayTitle = title || (
        isDone 
            ? "Pemrosesan Media Selesai!"
            : isUploading 
                ? "Mengunggah Media ke Server..." 
                : "Mengoptimalkan & Mengompresi Media..."
    );

    const displaySubtitle = subtitle || (
        isDone
            ? "Semua berkas telah berhasil dipersiapkan dan siap digunakan."
            : isUploading
                ? "Sedang mentransfer data & berkas ke sistem. Mohon jangan tutup halaman."
                : "Mengubah ukuran foto agar ringan, hemat penyimpanan, dan cepat diakses."
    );

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

                {/* Header Icon & Title */}
                <div className="flex flex-col items-center text-center mb-5">
                    <div className="relative mb-3">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                            isDone 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 scale-105" 
                                : isUploading
                                    ? "bg-purple-50 text-purple-600 border border-purple-200"
                                    : "bg-blue-50 text-blue-600 border border-blue-200"
                        }`}>
                            {isDone ? (
                                <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in-50 duration-300" />
                            ) : isUploading ? (
                                <UploadCloud className="w-8 h-8 text-purple-600 animate-bounce duration-1000" />
                            ) : (
                                <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                            )}
                        </div>
                        {!isDone && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-xs border border-slate-100">
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            </div>
                        )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {displayTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                        {displaySubtitle}
                    </p>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span className="text-slate-600 flex items-center gap-1.5">
                            {isUploading ? (
                                <span>Progres Pengunggahan</span>
                            ) : (
                                <span>Berkas {Math.min(currentFileIndex, totalFiles)} dari {totalFiles}</span>
                            )}
                        </span>
                        <span className="text-blue-700 font-bold font-mono">
                            {progressPercent}%
                        </span>
                    </div>

                    {/* Track & Bar */}
                    <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden p-0.5">
                        <div 
                            className={`h-full rounded-full transition-all duration-300 ease-out ${
                                isDone 
                                    ? "bg-emerald-500" 
                                    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                        />
                    </div>

                    {/* Network Upload Byte Counter (if available) */}
                    {isUploading && totalBytes > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                            <span>Ukuran Terunggah:</span>
                            <span className="font-semibold text-slate-700">
                                {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Active Item Card (Live Compression Details) */}
                {!isUploading && currentFileName && (
                    <div className="mb-4 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0 mb-1.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                                {currentFileType === "video" ? (
                                    <Video className="w-4 h-4 text-purple-600" />
                                ) : (
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate" title={currentFileName}>
                                    {currentFileName}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    {currentFileType === "video" ? "Berkas Video" : "Foto Kamera / Gambar"}
                                </p>
                            </div>
                            {savingsPercent > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    -{savingsPercent}%
                                </span>
                            )}
                        </div>

                        {/* Compression Size Comparison */}
                        {currentFileType !== "video" && (
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-500">Ukuran Berkas:</span>
                                <div className="flex items-center gap-1.5 font-mono">
                                    <span className="text-slate-500 line-through">
                                        {formatBytes(currentOriginalSize)}
                                    </span>
                                    {currentCompressedSize > 0 ? (
                                        <>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                            <span className="font-bold text-emerald-600">
                                                {formatBytes(currentCompressedSize)}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-blue-600 italic">mengompresi...</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Mini Item Queue / History (if multiple items) */}
                {items && items.length > 1 && (
                    <div className="mb-4 max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-xs">
                        {items.map((it, idx) => {
                            const isCurrent = idx === currentFileIndex - 1 && !isDone;
                            const isFinished = it.status === "done";
                            const isError = it.status === "error";

                            return (
                                <div 
                                    key={idx} 
                                    className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-[11px] transition-colors ${
                                        isCurrent 
                                            ? "bg-blue-50/70 border-blue-200 text-blue-900 font-semibold"
                                            : isFinished 
                                                ? "bg-slate-50/60 border-slate-200 text-slate-700"
                                                : isError 
                                                    ? "bg-rose-50 border-rose-200 text-rose-700"
                                                    : "bg-white border-slate-100 text-slate-400 opacity-60"
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {isFinished ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        ) : isCurrent ? (
                                            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                                        ) : isError ? (
                                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                                        )}
                                        <span className="truncate">{it.name}</span>
                                    </div>
                                    <span className="font-mono text-[10px] shrink-0 text-slate-500">
                                        {it.finalSize ? formatBytes(it.finalSize) : formatBytes(it.originalSize)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Reassurance Footer Badge */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 py-2 px-3 rounded-xl border border-slate-200/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto-compress cerdas: Resolusi tajam, beban server ringan.</span>
                </div>
            </div>
        </div>
    );
}

