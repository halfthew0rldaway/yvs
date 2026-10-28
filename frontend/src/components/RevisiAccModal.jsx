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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
                onClick={handleClose}
            />

            {/* Modal Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden z-10 border border-rose-200 animate-fadeIn">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4.5 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center font-bold shrink-0">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-rose-950 leading-tight">
                                Revisi Keputusan ACC Pelanggan
                            </h3>
                            <p className="text-xs text-rose-700/90 mt-0.5 font-mono">
                                Tiket #{tiket?.nomor_tiket}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100/70 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                    {/* Notice Callout */}
                    <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-rose-950">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Konsekuensi Prosedur Workshop:</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-rose-800">
                            <li>Status tiket akan dikembalikan dari <strong>Selesai</strong> mundur ke <strong>Menunggu Persetujuan</strong>.</li>
                            <li>Admin dapat mengubah dan mencatat ulang rincian penawaran / suku cadang (misal opsi A diganti opsi B).</li>
                            <li><strong>Kuota Maksimal: 1x revisi ACC</strong> per tiket servis. Histori ini akan diakumulasikan ke rekam jejak pelanggan.</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Alasan Revisi */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                            Alasan Revisi ACC Pelanggan <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                            value={alasanRevisi}
                            onChange={(e) => setAlasanRevisi(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Pelanggan meminta ganti opsi penawaran karena kendala biaya, minta batalkan ganti LCD original diganti servis konektor/LCD OEM..."
                            disabled={isSubmitting}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            Minimal 5 karakter. Catatan ini akan disimpan permanen di Log Audit Perbaikan.
                        </p>
                    </div>

                    {/* Typing Confirmation */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className="block text-xs font-semibold text-slate-700">
                            Ketik kata <span className="font-mono font-bold text-rose-600 px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded">REVISI</span> di bawah untuk mengonfirmasi:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Ketik REVISI di sini"
                            disabled={isSubmitting}
                            autoComplete="off"
                            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-mono tracking-wider focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none uppercase font-bold"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                            <span>{isSubmitting ? "Memproses..." : "Konfirmasi & Terbitkan Revisi ACC"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

