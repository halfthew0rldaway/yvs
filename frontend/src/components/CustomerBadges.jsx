import React, { useState } from "react";
import { 
    AlertTriangle, 
    Crown, 
    RotateCw, 
    ShieldCheck, 
    Layers, 
    UserPlus, 
    Plus,
    Info,
    Edit3
} from "lucide-react";
import { BADGE_DEFINITIONS, computeCustomerBadges } from "../utils/customerBadges";
import CustomerBadgeGuideModal from "./CustomerBadgeGuideModal";
import ManageCustomerBadgesModal from "./ManageCustomerBadgesModal";

// Map string icon names to Lucide icon components
const ICON_MAP = {
    AlertTriangle,
    Crown,
    RotateCw,
    ShieldCheck,
    Layers,
    UserPlus
};

export default function CustomerBadges({ 
    customer, 
    badges: directBadges, 
    variant = "icon-only", // "icon-only" | "full"
    size = "normal", // "compact" | "normal" | "large"
    showGuideButton = false,
    allowManage = true,
    onCustomerUpdated,
    className = "" 
}) {
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);

    let badges = [];
    if (directBadges && Array.isArray(directBadges)) {
        badges = directBadges;
    } else if (customer) {
        badges = customer.badges || computeCustomerBadges(customer);
    }

    const hasBadges = Array.isArray(badges) && badges.length > 0;

    return (
        <>
            <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
                {hasBadges ? (
                    badges.map((b) => {
                        const def = BADGE_DEFINITIONS[b.id] || {};
                        const IconComponent = typeof b.icon === "function" 
                            ? b.icon 
                            : (ICON_MAP[b.icon] || def.icon || UserPlus);

                        const colorClass = b.colorClass || def.colorClass || "bg-slate-50 text-slate-700 border-slate-200";
                        const label = b.label || def.label || "Badge";
                        const description = b.description || def.description || "";
                        const sopGuidance = b.sopGuidance || def.sopGuidance || "";

                        // VARIANT: ICON-ONLY (Default for table columns & compact view)
                        if (variant === "icon-only") {
                            return (
                                <button
                                    key={b.id || label}
                                    type="button"
                                    onClick={(e) => {
                                        if (allowManage && customer) {
                                            e.stopPropagation();
                                            setIsManageOpen(true);
                                        }
                                    }}
                                    className={`inline-flex items-center justify-center transition-all cursor-pointer rounded-lg border shadow-2xs hover:scale-105 active:scale-95 ${
                                        size === "compact"
                                            ? "w-6 h-6 text-[10px]"
                                            : size === "large"
                                            ? "w-8 h-8 text-sm"
                                            : "w-7 h-7 text-xs"
                                    } ${colorClass}`}
                                    title={`${label}: ${description}${allowManage ? ' (Klik untuk kelola badge)' : ''}`}
                                >
                                    <IconComponent className={size === "compact" ? "w-3 h-3" : "w-3.5 h-3.5"} />
                                </button>
                            );
                        }

                        // VARIANT: FULL (Icon + Text Pill)
                        return (
                            <button
                                key={b.id || label}
                                type="button"
                                onClick={(e) => {
                                    if (allowManage && customer) {
                                        e.stopPropagation();
                                        setIsManageOpen(true);
                                    }
                                }}
                                className={`group relative inline-flex items-center gap-1 font-semibold rounded-full border transition-all cursor-pointer select-none hover:opacity-90 ${
                                    size === "compact" 
                                        ? "px-2 py-0.5 text-[10px]" 
                                        : size === "large"
                                        ? "px-3.5 py-1 text-xs"
                                        : "px-2.5 py-0.5 text-xs"
                                } ${colorClass}`}
                                title={`${label}\n• ${description}${sopGuidance ? `\n• SOP: ${sopGuidance}` : ''}`}
                            >
                                <IconComponent className={size === "compact" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
                                <span>{size === "compact" ? (b.shortLabel || def.shortLabel || label) : label}</span>
                            </button>
                        );
                    })
                ) : (
                    // Belum ada badge (atau telah dihilangkan oleh admin)
                    allowManage && customer ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsManageOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/50 text-slate-400 hover:text-blue-600 text-[11px] font-semibold transition-all cursor-pointer"
                            title="Beri badge reputasi untuk pelanggan ini"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Beri Badge</span>
                        </button>
                    ) : (
                        <span className="text-xs text-slate-400">-</span>
                    )
                )}

                {/* Edit Button jika memiliki badge dan allowManage aktif */}
                {hasBadges && allowManage && customer && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsManageOpen(true);
                        }}
                        className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Kelola / Ubah Badge Pelanggan Ini"
                    >
                        <Edit3 className="w-3 h-3" />
                    </button>
                )}

                {showGuideButton && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsGuideOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Buka Kamus & Panduan Badge Pelanggan"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Modal Panduan Badge */}
            <CustomerBadgeGuideModal 
                isOpen={isGuideOpen} 
                onClose={() => setIsGuideOpen(false)} 
            />

            {/* Modal Kelola / Kustomisasi Badge Pelanggan */}
            {customer && (
                <ManageCustomerBadgesModal
                    isOpen={isManageOpen}
                    onClose={() => setIsManageOpen(false)}
                    customer={customer}
                    onSaved={(updated) => {
                        if (onCustomerUpdated) {
                            onCustomerUpdated(updated);
                        }
                    }}
                />
            )}
        </>
    );
}
