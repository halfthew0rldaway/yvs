import React, { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { X, Award, Check, Sparkles, Trash2, RotateCcw } from "lucide-react";
import { BADGE_DEFINITIONS, computeCustomerBadges } from "../utils/customerBadges";

export default function ManageCustomerBadgesModal({ 
    isOpen, 
    onClose, 
    customer, 
    onSaved 
}) {
    const [selectedBadges, setSelectedBadges] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !customer) return;

        // Inisialisasi badge yang sedang aktif
        if (customer.custom_badges !== undefined && customer.custom_badges !== null) {
            const list = Array.isArray(customer.custom_badges) 
                ? customer.custom_badges 
                : (typeof customer.custom_badges === "string" ? JSON.parse(customer.custom_badges) : []);
            setSelectedBadges(list);
        } else {
            // Ambil badge yang ada atau hitung dari sistem
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
        const sysBadges = computeCustomerBadges({
            ...customer,
            custom_badges: null
        }).map(b => b.id);
        setSelectedBadges(sysBadges);
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
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full flex flex-col overflow-hidden z-10 border border-slate-200 animate-fadeIn">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900 leading-tight">
                                Atur Badge Reputasi Pelanggan
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium truncate max-w-xs">
                                {customer.nama} • {customer.nomor_telepon}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 font-semibold">
                            Pilih badge (bisa lebih dari satu atau kosong):
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleResetToSystem}
                                className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                title="Gunakan rekomendasi sistem otomatis"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset Sistem</span>
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                title="Hilangkan semua badge untuk pelanggan ini"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span>Kosongkan</span>
                            </button>
                        </div>
                    </div>

                    {/* Badge Selection Cards */}
                    <div className="space-y-2.5">
                        {allBadgeList.map((badge) => {
                            const IconComponent = badge.icon;
                            const isSelected = selectedBadges.includes(badge.id);

                            return (
                                <div
                                    key={badge.id}
                                    onClick={() => toggleBadge(badge.id)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                        isSelected 
                                            ? "border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/20" 
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                                    }`}
                                >
                                    <div className="pt-0.5 shrink-0">
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                            isSelected 
                                                ? "bg-blue-600 border-blue-600 text-white" 
                                                : "border-slate-300 bg-white"
                                        }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.colorClass}`}>
                                                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                                <span>{badge.label}</span>
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 leading-snug">
                                            {badge.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                        {selectedBadges.length} badge dipilih
                    </span>
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
