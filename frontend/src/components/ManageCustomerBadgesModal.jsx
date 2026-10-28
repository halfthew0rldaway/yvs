import React, { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { X, Award, Check, Sparkles, Trash2, RotateCcw, ShieldCheck, Info } from "lucide-react";
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
                onSaved(res.data.customer);
            }
            onClose();
        } catch (err) {
            console.error("Gagal menyimpan badge:", err);
            toast.error(err.response?.data?.message || "Gagal menyimpan badge pelanggan");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden z-10 border border-slate-200 animate-fadeIn my-auto max-h-[90vh]">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                            <Award className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                                Atur Badge Reputasi Pelanggan
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                                <span className="font-semibold text-slate-700">{customer.nama}</span> • {customer.nomor_telepon || "Tanpa Nomor HP"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0 ml-2"
                        title="Tutup dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header Actions Bar */}
                <div className="px-5 sm:px-6 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium">
                            Pilih badge manual (bisa lebih dari satu atau dikosongkan):
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={handleResetToSystem}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                            title="Gunakan badge rekomendasi hasil kalkulasi otomatis sistem"
                        >
                            <RotateCcw className="w-3 h-3 text-blue-600" />
                            <span>Rekomendasi Sistem</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                            title="Hapus semua badge dari profil pelanggan ini"
                        >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Kosongkan</span>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-3 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                        {allBadgeList.map((badge) => {
                            const IconComponent = badge.icon;
                            const isSelected = selectedBadges.includes(badge.id);
                            const isAuto = systemRecommended.includes(badge.id);

                            return (
                                <div
                                    key={badge.id}
                                    onClick={() => toggleBadge(badge.id)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none w-full ${
                                        isSelected 
                                            ? "border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/20" 
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                                    }`}
                                >
                                    {/* Checkbox box */}
                                    <div className="pt-0.5 shrink-0">
                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                            isSelected 
                                                ? "bg-blue-600 border-blue-600 text-white shadow-2xs" 
                                                : "border-slate-300 bg-white"
                                        }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </div>

                                    {/* Badge Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.colorClass}`}>
                                                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                                <span>{badge.label}</span>
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                {isAuto && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                        <Sparkles className="w-3 h-3 text-amber-600" />
                                                        Saran Sistem
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    {badge.shortLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-600 leading-relaxed break-words mt-1">
                                            {badge.description}
                                        </p>

                                        {badge.sopGuidance && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
                                                <span className="font-bold text-slate-700 uppercase tracking-wider shrink-0 text-[10px]">SOP:</span>
                                                <span className="leading-tight">{badge.sopGuidance}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                            {selectedBadges.length} badge aktif
                        </span>
                        {selectedBadges.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">
                                (Tanpa badge reputasi)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                        >
                            <span>{isSaving ? "Menyimpan..." : "Simpan Badge"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
