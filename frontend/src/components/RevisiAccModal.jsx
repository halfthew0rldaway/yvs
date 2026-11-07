import React, { useState } from "react";
import { RotateCcw, AlertTriangle, X, ShieldAlert } from "lucide-react";

export default function RevisiAccModal({
    isOpen,
    onClose,
    onConfirm,
    tiket,
    isSubmitting = false
}) {
    const [alasanRevisi, setAlasanRevisi] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const isConfirmValid = confirmText.trim().toUpperCase() === "REVISI";
    const isAlasanValid = alasanRevisi.trim().length >= 5;
    const canSubmit = isConfirmValid && isAlasanValid && !isSubmitting;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!isConfirmValid) {
            setError("Wajib mengetik kata 'REVISI' dengan tepat.");
            return;
        }
        if (!isAlasanValid) {
            setError("Alasan revisi ACC wajib diisi minimal 5 karakter.");
            return;
        }

        setError("");
        try {
            await onConfirm({
                alasan_revisi: alasanRevisi.trim(),
                konfirmasi_teks: confirmText.trim().toUpperCase()
            });
            setAlasanRevisi("");
            setConfirmText("");
        } catch (err) {
            setError(err.message || "Gagal memproses revisi ACC");
        }
    }

    function handleClose() {
        if (isSubmitting) return;
        setAlasanRevisi("");
        setConfirmText("");
        setError("");
        onClose();
    }

    return (
        <div className="modal-shell">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs modal-backdrop" 
                onClick={handleClose}
            />

            {/* Modal Dialog (60fps Spring Modal Surface) */}
            <div className="modal-panel max-w-lg z-10 border-rose-200">
                <div className="modal-grabber" />
                {/* Header */}
                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center font-bold shrink-0">
                            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-3xs xs:text-sm sm:text-base text-rose-950 leading-tight break-words">
                                Revisi Keputusan ACC Pelanggan
                            </h3>
                            <p className="text-3xs xs:text-2xs sm:text-xs text-rose-700/90 mt-0.5 font-mono truncate">
                                Tiket #{tiket?.nomor_tiket}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100/70 rounded-lg sm:rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="modal-body-tight space-y-2.5 sm:space-y-4 text-3xs xs:text-2xs sm:text-xs">
                    {/* Notice Callout */}
                    <div className="p-2.5 sm:p-3.5 bg-rose-50/60 border border-rose-200 rounded-lg sm:rounded-xl text-3xs xs:text-2xs sm:text-xs text-rose-900 leading-relaxed space-y-1.5">
                        <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 font-bold text-rose-950">
                            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                            <span className="break-words">Konsekuensi Prosedur Workshop:</span>
                        </div>
                        <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-rose-800">
                            <li className="break-words">Status tiket akan dikembalikan dari <strong>Selesai</strong> mundur ke <strong>Menunggu Persetujuan</strong>.</li>
                            <li className="break-words">Admin dapat mengubah dan mencatat ulang rincian penawaran / suku cadang (misal opsi A diganti opsi B).</li>
                            <li className="break-words"><strong>Kuota Maksimal: 1x revisi ACC</strong> per tiket servis. Histori ini akan diakumulasikan ke rekam jejak pelanggan.</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl text-3xs xs:text-2xs sm:text-xs font-semibold text-red-700 flex items-start sm:items-center gap-1.5 sm:gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 sm:mt-0" />
                            <span className="break-words">{error}</span>
                        </div>
                    )}

                    {/* Alasan Revisi */}
                    <div>
                        <label className="block text-3xs xs:text-2xs sm:text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide sm:tracking-wider">
                            Alasan Revisi ACC Pelanggan <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                            value={alasanRevisi}
                            onChange={(e) => setAlasanRevisi(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Pelanggan meminta ganti opsi penawaran karena kendala biaya, minta batalkan ganti LCD original diganti servis konektor/LCD OEM..."
                            disabled={isSubmitting}
                            className="w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-3xs xs:text-2xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                        />
                        <p className="text-3xs xs:text-2xs text-slate-500 mt-1 break-words">
                            Minimal 5 karakter. Catatan ini akan disimpan permanen di Log Audit Perbaikan.
                        </p>
                    </div>

                    {/* Typing Confirmation */}
                    <div className="p-2.5 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl space-y-2">
                        <label className="block text-3xs xs:text-2xs sm:text-xs font-semibold text-slate-700 leading-relaxed">
                            Ketik kata <span className="font-mono font-bold text-rose-600 px-1 sm:px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded">REVISI</span> di bawah untuk mengonfirmasi:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Ketik REVISI di sini"
                            disabled={isSubmitting}
                            autoComplete="off"
                            className="w-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-white border border-slate-300 rounded-lg text-3xs xs:text-2xs sm:text-sm font-mono tracking-wider focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none uppercase font-bold"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-3 sm:px-4 py-2 sm:py-2.5 text-3xs xs:text-2xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg sm:rounded-xl text-3xs xs:text-2xs sm:text-sm font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSubmitting ? 'animate-spin' : ''}`} />
                            <span className="break-words">{isSubmitting ? "Memproses..." : "Konfirmasi & Terbitkan Revisi ACC"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

