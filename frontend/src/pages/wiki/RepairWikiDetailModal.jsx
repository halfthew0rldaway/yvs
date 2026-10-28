import { useState } from "react";
import { 
    X, 
    BookOpen, 
    Wrench, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Cpu, 
    Tag, 
    ExternalLink,
    Edit3,
    Trash2
} from "lucide-react";

export default function RepairWikiDetailModal({ isOpen, onClose, wiki, onEdit, onDelete, canModify = false }) {
    if (!isOpen || !wiki) return null;

    const difficultyColors = {
        Mudah: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Menengah: "bg-amber-50 text-amber-700 border-amber-200",
        Mahir: "bg-rose-50 text-rose-700 border-rose-200",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    {wiki.merek || "Umum"} {wiki.model_seri ? `• ${wiki.model_seri}` : ""}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    {wiki.kategori}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${difficultyColors[wiki.tingkat_kesulitan] || difficultyColors.Menengah}`}>
                                    {wiki.tingkat_kesulitan}
                                </span>
                                {wiki.tingkat_sukses && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>{wiki.tingkat_sukses}% Sukses</span>
                                    </span>
                                )}
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                                {wiki.judul}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 pt-3 border-t border-slate-200/60">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Estimasi: <strong>{wiki.estimasi_waktu || "1-2 Jam"}</strong>
                        </span>
                        <span>
                            Ditulis oleh: <strong>{wiki.user?.nama || "Teknisi"}</strong>
                        </span>
                        {wiki.sumber_tiket_id && (
                            <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                                <ExternalLink className="w-3 h-3" />
                                <span>Dari Tiket Servis #{wiki.sumber_tiket_id}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                    
                    {/* Gejala Kerusakan */}
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                        <div className="flex items-center gap-2 mb-1.5 text-amber-900 font-semibold text-xs uppercase tracking-wider">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>Gejala & Keluhan Utama</span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                            {wiki.gejala}
                        </p>
                    </div>

                    {/* Penyebab Teknis (Jika ada) */}
                    {wiki.penyebab && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                            <div className="flex items-center gap-2 mb-1.5 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                                <Cpu className="w-4 h-4 text-slate-500" />
                                <span>Akar Masalah / Penyebab Kerusakan</span>
                            </div>
                            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                                {wiki.penyebab}
                            </p>
                        </div>
                    )}

                    {/* Komponen / Sparepart Terkait */}
                    {wiki.komponen_terkait && (
                        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                            <div className="flex items-center gap-2 mb-1 text-blue-900 font-semibold text-xs uppercase tracking-wider">
                                <Tag className="w-3.5 h-3.5 text-blue-600" />
                                <span>Komponen / IC / Sparepart Terkait</span>
                            </div>
                            <p className="text-blue-950 font-medium font-mono text-xs">
                                {wiki.komponen_terkait}
                            </p>
                        </div>
                    )}

                    {/* Langkah Solusi & Prosedur Pengerjaan */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                            <Wrench className="w-4 h-4 text-blue-600" />
                            <span>Langkah-Langkah Solusi & Perbaikan</span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 text-slate-800 font-mono text-xs whitespace-pre-line leading-relaxed border border-slate-200 shadow-2xs overflow-x-auto">
                            {wiki.solusi_langkah}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2">
                        {canModify && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onEdit(wiki);
                                    }}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                                >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit Panduan</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm(`Yakin ingin menghapus panduan wiki "${wiki.judul}"?`)) {
                                            onDelete(wiki.id);
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Hapus</span>
                                </button>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                    >
                        Tutup
                    </button>
                </div>

            </div>
        </div>
    );
}

