import React, { useState } from "react";
import { 
    AlertTriangle, 
    Crown, 
    RotateCw, 
    ShieldCheck, 
    Layers, 
    UserPlus, 
    Info 
} from "lucide-react";
import { BADGE_DEFINITIONS, computeCustomerBadges } from "../utils/customerBadges";
import CustomerBadgeGuideModal from "./CustomerBadgeGuideModal";

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
    size = "normal", // "compact" | "normal" | "large"
    showGuideButton = false,
    className = "" 
}) {
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    let badges = [];
    if (directBadges && Array.isArray(directBadges)) {
        badges = directBadges;
    } else if (customer) {
        badges = customer.badges || computeCustomerBadges(customer);
    }

    if (!badges || badges.length === 0) {
        return null;
    }

    return (
        <>
            <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
                {badges.map((b) => {
                    const def = BADGE_DEFINITIONS[b.id] || {};
                    const IconComponent = typeof b.icon === "function" 
                        ? b.icon 
                        : (ICON_MAP[b.icon] || def.icon || Award);

                    const colorClass = b.colorClass || def.colorClass || "bg-slate-50 text-slate-700 border-slate-200";
                    const label = size === "compact" ? (b.shortLabel || def.shortLabel || b.label) : (b.label || def.label);
                    const description = b.description || def.description || "";
                    const sopGuidance = b.sopGuidance || def.sopGuidance || "";
                    const tooltipText = `${label}\n• ${description}${sopGuidance ? `\n• SOP: ${sopGuidance}` : ''}`;

                    return (
                        <div
                            key={b.id || label}
                            className={`group relative inline-flex items-center gap-1 font-semibold rounded-full border transition-all cursor-default select-none ${
                                size === "compact" 
                                    ? "px-2 py-0.5 text-[10px]" 
                                    : size === "large"
                                    ? "px-3.5 py-1 text-xs"
                                    : "px-2.5 py-0.5 text-xs"
                            } ${colorClass}`}
                            title={tooltipText}
                        >
                            <IconComponent className={size === "compact" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
                            <span>{label}</span>

                            {/* Floating Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col z-30 w-64 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-[11px] font-normal leading-snug pointer-events-none animate-fadeIn">
                                <div className="font-bold flex items-center gap-1.5 pb-1 border-b border-slate-800 text-slate-100">
                                    <IconComponent className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>{b.label || def.label}</span>
                                </div>
                                <p className="mt-1 text-slate-300">
                                    {description}
                                </p>
                                {sopGuidance && (
                                    <p className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-amber-300 font-medium">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">SOP Bengkel:</span>
                                        {sopGuidance}
                                    </p>
                                )}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                            </div>
                        </div>
                    );
                })}

                {showGuideButton && (
                    <button
                        type="button"
                        onClick={() => setIsGuideOpen(true)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Buka Kamus & Panduan Badge Pelanggan"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <CustomerBadgeGuideModal 
                isOpen={isGuideOpen} 
                onClose={() => setIsGuideOpen(false)} 
            />
        </>
    );
}

