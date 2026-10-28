import { useState } from "react";
import { 
    X, 
    BookOpen, 
    ShieldCheck, 
    CheckCircle2, 
    Users, 
    Printer, 
    Calendar, 
    Edit3, 
    Tag, 
    Layers, 
    Sparkles, 
    AlertCircle 
} from "lucide-react";

export default function SopDetailModal({ isOpen, onClose, sop, onEdit, canModify = false }) {
    const [activeTab, setActiveTab] = useState("ringkas"); // "ringkas" | "lengkap"

    if (!isOpen || !sop) return null;

    const roleBadgeColors = {
        Semua: "bg-blue-50 text-blue-700 border-blue-200",
        Teknisi: "bg-amber-50 text-amber-700 border-amber-200",
        Frontliner: "bg-purple-50 text-purple-700 border-purple-200",
        Admin: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
                
                {/* Header Modal */}
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs">
                                    {sop.kode}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    {sop.kategori}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeColors[sop.target_role] || roleBadgeColors.Semua}`}>
                                    <Users className="w-3 h-3 mr-1" />
                                    <span>Untuk: {sop.target_role}</span>
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    v{sop.versi || "1.0"}
                                </span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                                {sop.judul}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {sop.ringkasan}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
                            title="Tutup Modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Toggle: Ringkasan Cepat vs Panduan Lengkap */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/70">
                        <button
                            type="button"
                            onClick={() => setActiveTab("ringkas")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                activeTab === "ringkas"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Poin Kunci Cepat</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("lengkap")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                activeTab === "lengkap"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Prosedur Lengkap Bertahap</span>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                    {activeTab === "ringkas" ? (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-purple-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-100/80">
                                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-3">
                                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                    <span>Checklist Inti (Wajib Diingat & Dijalankan)</span>
                                </div>
                                {sop.poin_kunci_list && sop.poin_kunci_list.length > 0 ? (
                                    <ul className="space-y-2.5">
                                        {sop.poin_kunci_list.map((point, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-50 shadow-2xs">
                                                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="font-medium text-slate-800">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Belum ada poin ringkas terdaftar untuk SOP ini.</p>
                                )}
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                <div className="text-xs text-slate-500">
                                    Butuh panduan teknis mendalam dan pasal lengkap?
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("lengkap")}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                                >
                                    Buka Prosedur Lengkap &rarr;
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
                            <div className="whitespace-pre-wrap font-sans bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                                {sop.konten}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Dokumen Resmi KomputerAwet / Serv.io KEOS</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Cetak SOP</span>
                        </button>
                        {canModify && onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(sop)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit SOP</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

