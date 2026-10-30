import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { X, Award, Check, Sparkles, Trash2, RotateCcw, Info } from "lucide-react";
import { BADGE_DEFINITIONS, computeCustomerBadges } from "../utils/customerBadges";

export default function ManageCustomerBadgesModal({ 
    isOpen, 
    onClose, 
    customer, 
    onSaved 
}) {
    const [selectedBadges, setSelectedBadges] = useState([]);
    const [systemRecommended, setSystemRecommended] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !customer) return;

        // Hitung badge rekomendasi sistem otomatis
        const sys = computeCustomerBadges({
            ...customer,
            custom_badges: null
        }).map(b => b.id);
        setSystemRecommended(sys);

        // Inisialisasi badge yang sedang aktif pada customer
        if (customer.custom_badges !== undefined && customer.custom_badges !== null) {
            const list = Array.isArray(customer.custom_badges) 
                ? customer.custom_badges 
                : (typeof customer.custom_badges === "string" ? JSON.parse(customer.custom_badges) : []);
            setSelectedBadges(list);
        } else {
            // Jika belum ada override kustom, defaultkan ke rekomendasi sistem
            const active = (customer.badges || computeCustomerBadges(customer)).map(b => b.id);
            setSelectedBadges(active);
        }
    }, [isOpen, customer]);

    if (!isOpen || !customer) return null;

    const allBadgeList = Object.values(BADGE_DEFINITIONS);

    function toggleBadge(badgeId) {
        if (selectedBadges.includes(badgeId)) {
            setSelectedBadges(selectedBadges.filter(id => id !== badgeId));
        } else {
            setSelectedBadges([...selectedBadges, badgeId]);
        }
    }

    function handleClearAll() {
        setSelectedBadges([]);
    }

    function handleResetToSystem() {
        setSelectedBadges([...systemRecommended]);
        toast.success("Badge dikembalikan ke rekomendasi sistem");
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            const res = await api.patch(`/customer/${customer.id}/badges`, {
                badges: selectedBadges
            });
            toast.success("Badge reputasi pelanggan berhasil diperbarui!");
            if (onSaved) {
                onSaved(res.data.customer || {
                    ...customer,
                    custom_badges: selectedBadges,
                    badges: selectedBadges.map(id => BADGE_DEFINITIONS[id]).filter(Boolean)
                });
            }
            onClose();
        } catch (err) {
            console.error("Gagal menyimpan badge:", err);
            const msg = err.response?.data?.message || err.message || "Gagal menyimpan badge pelanggan";
            toast.error(`Gagal: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    }

    const modalContent = (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto overflow-x-hidden whitespace-normal"
            onClick={(e) => {
                e.stopPropagation();
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
            }}
        >
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs modal-backdrop" 
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />

            {/* Modal Dialog: Wide to edge format (60fps Spring Modal Surface) */}
            <div 
                className="relative bg-white rounded-3xl shadow-2xl max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full flex flex-col overflow-hidden z-10 border border-slate-200 modal-surface my-auto max-h-[92vh] whitespace-normal text-slate-800"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                            <Award className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-tight">
                                Atur Badge Reputasi Pelanggan
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium truncate">
                                <span className="font-semibold text-slate-800">{customer.nama}</span> • {customer.nomor_telepon || "Tanpa Nomor HP"}
                                {customer.alamat && <span className="hidden sm:inline text-slate-400"> • {customer.alamat}</span>}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        disabled={isSaving}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0 ml-4"
                        title="Tutup dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header Actions Bar */}
                <div className="px-6 sm:px-8 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs whitespace-normal">
                    <div className="flex items-center gap-2 text-slate-600 min-w-0">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-700">
                            Pilih satu atau lebih badge reputasi pelanggan (bisa dikosongkan):
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResetToSystem();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Gunakan badge rekomendasi hasil kalkulasi otomatis sistem"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                            <span>Rekomendasi Sistem</span>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearAll();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Hapus semua badge dari profil pelanggan ini"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Kosongkan Semua</span>
                        </button>
                    </div>
                </div>

                {/* Body Content - Responsive 2-Column Grid with comfortable spacing */}
                <div 
                    className="overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar px-6 sm:px-8 py-5 whitespace-normal"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allBadgeList.map((badge) => {
                            const IconComponent = badge.icon;
                            const isSelected = selectedBadges.includes(badge.id);
                            const isAuto = systemRecommended.includes(badge.id);

                            return (
                                <div
                                    key={badge.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleBadge(badge.id);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleBadge(badge.id);
                                        }
                                    }}
                                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none w-full relative ${
                                        isSelected 
                                            ? "border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20" 
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                                    }`}
                                >
                                    <div>
                                        {/* Card Top Row: Checkbox, Badge Pill, Saran Chip, Category */}
                                        <div className="flex items-center gap-2.5 flex-wrap justify-between mb-2.5">
                                            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                                {/* Checkbox */}
                                                <div 
                                                    className="shrink-0"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleBadge(badge.id);
                                                    }}
                                                >
                                                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                                        isSelected 
                                                            ? "bg-blue-600 border-blue-600 text-white shadow-2xs" 
                                                            : "border-slate-300 bg-white"
                                                    }`}>
                                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                    </div>
                                                </div>

                                                {/* Badge Pill */}
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.colorClass}`}>
                                                    <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{badge.label}</span>
                                                </span>

                                                {/* Saran Sistem Tag */}
                                                {isAuto && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                                        <Sparkles className="w-3 h-3 text-amber-600" />
                                                        Saran Sistem
                                                    </span>
                                                )}
                                            </div>

                                            {/* Short Label Tag on Right */}
                                            {badge.shortLabel && (
                                                <span className="text-[11px] font-semibold text-slate-400 shrink-0 ml-auto">
                                                    {badge.shortLabel}
                                                </span>
                                            )}
                                        </div>

                                        {/* Badge Description */}
                                        <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed break-words">
                                            {badge.description}
                                        </p>
                                    </div>

                                    {/* SOP Guidance Callout */}
                                    {badge.sopGuidance && (
                                        <div className="mt-1 p-2.5 sm:p-3 bg-slate-50/90 rounded-xl border border-slate-200/70 text-xs flex items-start gap-2.5">
                                            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 bg-slate-200/70 rounded">
                                                SOP
                                            </span>
                                            <span className="leading-relaxed flex-1 text-[11.5px] text-slate-600 break-words">
                                                {badge.sopGuidance}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                            {selectedBadges.length} badge dipilih
                        </span>
                        {selectedBadges.length === 0 && (
                            <span className="text-xs text-slate-400 italic hidden sm:inline">
                                (Profil tanpa badge reputasi)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            disabled={isSaving}
                            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSave();
                            }}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                            <span>{isSaving ? "Menyimpan..." : "Simpan Badge"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
