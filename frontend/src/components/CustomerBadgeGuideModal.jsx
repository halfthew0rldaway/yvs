import React from "react";
import { X, Award, ShieldAlert, Sparkles, BookOpen } from "lucide-react";
import { BADGE_DEFINITIONS } from "../utils/customerBadges";

export default function CustomerBadgeGuideModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const badgeList = Object.values(BADGE_DEFINITIONS);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 border border-slate-200 animate-fadeIn">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                                Sistem & Panduan Badge Reputasi Pelanggan
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Klasifikasi otomatis berdasarkan riwayat servis, loyalitas, dan rekam jejak ACC
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                    <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <strong className="font-semibold">Pedoman Workshop:</strong> Sistem ini mengkalkulasi rekam jejak setiap pelanggan di seluruh perangkat yang pernah ia daftarkan. Gunakan indikator ini untuk menentukan perlunya konfirmasi ekstra, penawaran uang muka (DP), atau pemberian privilege loyalitas.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 pt-1">
                        {badgeList.map((badge) => {
                            const IconComponent = badge.icon;
                            return (
                                <div 
                                    key={badge.id}
                                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.colorClass}`}>
                                                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                                <span>{badge.label}</span>
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded-md">
                                            Syarat: {badge.criteria}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {badge.description}
                                    </p>

                                    <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs">
                                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider shrink-0 mt-0.5">SOP Tindakan:</span>
                                        <span className="text-slate-600">{badge.sopGuidance}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                        Total 6 kategori reputasi pelanggan terintegrasi
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                        Tutup Panduan
                    </button>
                </div>
            </div>
        </div>
    );
}
