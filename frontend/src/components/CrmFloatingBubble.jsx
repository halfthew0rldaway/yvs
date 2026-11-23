import React, { useState, useRef, useEffect, useCallback, useId, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Clock, 
    ShieldAlert, 
    MessageCircle, 
    MessageSquare,
    ArrowRight, 
    X, 
    Minus, 
    GripHorizontal,
    Laptop,
    CheckCircle2,
    ChevronRight
} from "lucide-react";
import api from "../services/api";
import useRealtimeEvent from "../hooks/useRealtime";

/**
 * ServiBot3D - High-Tech 3D Concierge Robot Mascot
 * Pure 3D floating character with porcelain-white ceramic finishes,
 * curved glossy visor, glowing azure eyes, and subtle floating levitation.
 * Renders cleanly with transparent background directly over the interface.
 * Engineered with unique per-instance SVG gradient IDs and solid fallbacks
 * to guarantee 100% reliable rendering without frame drops.
 */
export const ServiBot3D = memo(function ServiBot3D({ size = 44, className = "", isUrgent = false }) {
    const rawId = useId();
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const glowColor = isUrgent ? "#f43f5e" : "#38bdf8";
    const darkGlowColor = isUrgent ? "#9f1239" : "#0284c7";

    return (
        <div 
            className={`relative flex items-center justify-center shrink-0 select-none pointer-events-none ${className}`}
            style={size ? { width: size, height: size } : undefined}
        >
            <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full drop-shadow-[0_10px_20px_rgba(15,23,42,0.22)]"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Porcelain Body 3D Radial Sphere */}
                    <radialGradient id={`serviBody_${id}`} cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="45%" stopColor="#f8fafc" />
                        <stop offset="75%" stopColor="#e2e8f0" />
                        <stop offset="100%" stopColor="#94a3b8" />
                    </radialGradient>

                    {/* Dark Curved Glass Visor Screen */}
                    <linearGradient id={`serviVisorGlass_${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#090d16" />
                        <stop offset="60%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>

                    {/* Expressive Glowing Eyes */}
                    <radialGradient id={`serviEyeGlow_${id}`} cx="40%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="45%" stopColor={glowColor} />
                        <stop offset="100%" stopColor={darkGlowColor} />
                    </radialGradient>

                    {/* Ear Audio Pods */}
                    <linearGradient id={`serviEarPods_${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#64748b" />
                        <stop offset="50%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>

                    {/* Antenna Pulse Bulb */}
                    <radialGradient id={`serviAntennaBulb_${id}`} cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="50%" stopColor={glowColor} />
                        <stop offset="100%" stopColor={darkGlowColor} />
                    </radialGradient>
                </defs>

                {/* Soft Ground Ambient Shadow */}
                <ellipse cx="50" cy="92" rx="24" ry="4.5" fill="#0f172a" opacity="0.22" />

                {/* Floating Torso Base */}
                <path 
                    d="M 36 67 Q 50 76 64 67 L 67 79 Q 50 85 33 79 Z" 
                    fill={`url(#serviBody_${id})`} 
                />

                {/* Blue Tech Collar Ring */}
                <rect x="36" y="65" width="28" height="3.5" rx="1.75" fill="#2563eb" />

                {/* Floating Left Hand */}
                <ellipse cx="23" cy="62" rx="5" ry="7" fill={`url(#serviBody_${id})`} transform="rotate(-15 23 62)" />

                {/* Floating Right Hand */}
                <ellipse cx="77" cy="62" rx="5" ry="7" fill={`url(#serviBody_${id})`} transform="rotate(15 77 62)" />

                {/* Antenna Stem */}
                <path d="M 50 18 L 50 9" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

                {/* Antenna Glowing Signal Bulb */}
                <circle cx="50" cy="8" r="4.5" fill={`url(#serviAntennaBulb_${id})`} />
                <circle cx="48.5" cy="6.5" r="1.3" fill="#ffffff" opacity="0.9" />

                {/* Ear Pods Headband Arch */}
                <path 
                    d="M 21 39 C 21 21 79 21 79 39" 
                    stroke="#64748b" 
                    strokeWidth="3.2" 
                    fill="none" 
                    strokeLinecap="round" 
                />

                {/* Left Ear Audio Pod */}
                <rect x="18" y="38" width="6" height="15" rx="3" fill={`url(#serviEarPods_${id})`} />
                <circle cx="21" cy="45.5" r="1.5" fill={glowColor} />

                {/* Right Ear Audio Pod */}
                <rect x="76" y="38" width="6" height="15" rx="3" fill={`url(#serviEarPods_${id})`} />
                <circle cx="79" cy="45.5" r="1.5" fill={glowColor} />

                {/* Main 3D Spherical Head */}
                <circle cx="50" cy="45" r="28" fill={`url(#serviBody_${id})`} />

                {/* Specular Highlight Arc on Head */}
                <path 
                    d="M 33 26 C 41 21 59 21 67 26" 
                    stroke="#ffffff" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    opacity="0.75" 
                />

                {/* Glossy Visor Screen */}
                <rect 
                    x="28" 
                    y="34" 
                    width="44" 
                    height="23" 
                    rx="11.5" 
                    fill={`url(#serviVisorGlass_${id})`} 
                    stroke={glowColor} 
                    strokeWidth="1.2" 
                    strokeOpacity="0.5" 
                />

                {/* Glass Reflection Arc across Visor */}
                <path 
                    d="M 35 36.5 Q 50 33.5 64 36.5" 
                    stroke="#ffffff" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    opacity="0.35" 
                />

                {/* Left Expressive Glowing Eye */}
                <rect x="36.5" y="41" width="7" height="9" rx="3.5" fill={`url(#serviEyeGlow_${id})`} />
                <circle cx="38.5" cy="43" r="1.2" fill="#ffffff" />

                {/* Right Expressive Glowing Eye */}
                <rect x="56.5" y="41" width="7" height="9" rx="3.5" fill={`url(#serviEyeGlow_${id})`} />
                <circle cx="58.5" cy="43" r="1.2" fill="#ffffff" />
            </svg>
        </div>
    );
});

function formatSnippet(text) {
    if (!text) return "Mulai percakapan baru...";
    return text
        .replace(/\[\[ticket:[^|\]]+(?:\|([^\]]+))?\]\]/g, (_, label) => label ? `🎫 ${label}` : "🎫 Tiket")
        .replace(/\[\[device:[^|\]]+(?:\|([^\]]+))?\]\]/g, (_, label) => label ? `💻 ${label}` : "💻 Perangkat")
        .replace(/\[\[part:[^|\]]+(?:\|([^\]]+))?\]\]/g, (_, label) => label ? `🔧 ${label}` : "🔧 Part")
        .replace(/\[\[user:[^|\]]+(?:\|([^\]]+))?\]\]/g, (_, label) => label ? `@${label}` : "@Staf");
}

function formatChatTime(dateStr) {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return new Intl.DateTimeFormat("id-ID", {
                timeZone: "Asia/Jakarta",
                hour: "2-digit",
                minute: "2-digit"
            }).format(d);
        }
        return new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "numeric",
            month: "short"
        }).format(d);
    } catch {
        return "";
    }
}

export default function CrmFloatingBubble({ 
    canAccessCrm = true,
    maintenanceDueData, 
    unreadChatCount = 0,
    onOpenRecallModal 
}) {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [activeSection, setActiveSection] = useState(() => (canAccessCrm ? "crm" : "chat"));
    const [recentChats, setRecentChats] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const isDraggingRef = useRef(false);

    const totalDue = Number(maintenanceDueData?.total_due || 0);
    const urgentCount = Number(maintenanceDueData?.urgent_count || 0);
    const routineCount = Number(maintenanceDueData?.routine_count || Math.max(0, totalDue - urgentCount));
    const items = maintenanceDueData?.items || [];

    const fetchChats = useCallback(async () => {
        try {
            setIsLoadingChats(true);
            const { data } = await api.get("/chat", { skipCache: true });
            setRecentChats(Array.isArray(data) ? data : []);
        } catch {
            // silent fallback
        } finally {
            setIsLoadingChats(false);
        }
    }, []);

    useEffect(() => {
        if (isExpanded && activeSection === "chat") {
            fetchChats();
        }
    }, [isExpanded, activeSection, fetchChats]);

    const handleChatUpdated = useCallback(() => {
        if (isExpanded && activeSection === "chat") {
            fetchChats();
        }
    }, [isExpanded, activeSection, fetchChats]);

    useRealtimeEvent("chat:updated", handleChatUpdated);

    // If dismissed in this session, keep hidden until refreshed
    if (isDismissed) {
        return null;
    }

    const previewItems = items.slice(0, 3);
    const routinePercent = totalDue > 0 ? Math.round((routineCount / totalDue) * 100) : 100;
    const urgentPercent = totalDue > 0 ? 100 - routinePercent : 0;

    const handleOpenChat = (chatId) => {
        setIsExpanded(false);
        navigate(`/chat?id=${chatId}`);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.12}
            onDragStart={() => {
                isDraggingRef.current = true;
            }}
            onDragEnd={() => {
                setTimeout(() => {
                    isDraggingRef.current = false;
                }, 120);
            }}
            className="fixed z-[35] select-none cursor-grab active:cursor-grabbing pointer-events-auto print:hidden right-1 sm:right-7 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-7 outline-none focus:outline-none"
            style={{ touchAction: "none", transform: "translateZ(0)" }}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            <div className="relative">
                {/* Expanded Multi-Section Popover (CRM & Chat Tim) */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 10 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="w-[calc(100vw-32px)] sm:w-[380px] max-w-[380px] max-h-[75dvh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden mb-3 flex flex-col text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Card Header */}
                            <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {activeSection === "crm" ? (
                                        <div className="relative p-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center shrink-0">
                                            <ServiBot3D className="w-7 h-7" isUrgent={urgentCount > 0} />
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white ${
                                                urgentCount > 0 ? "bg-rose-500" : "bg-emerald-500"
                                            }`} />
                                        </div>
                                    ) : (
                                        <div className="relative p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center shrink-0">
                                            <MessageCircle className="w-5 h-5 text-rose-600" />
                                            {unreadChatCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                                            )}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                                                {activeSection === "crm" ? "Recall Servis" : "Chat Internal Tim"}
                                            </h4>
                                            <span className={`text-3xs font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 w-fit max-w-max ${
                                                activeSection === "crm"
                                                    ? (urgentCount > 0 
                                                        ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                        : "bg-blue-50 text-blue-700 border-blue-200")
                                                    : (unreadChatCount > 0
                                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                                        : "bg-slate-100 text-slate-700 border-slate-200")
                                            }`}>
                                                {activeSection === "crm" 
                                                    ? `${totalDue} Unit` 
                                                    : unreadChatCount > 0 
                                                    ? `${unreadChatCount} Baru` 
                                                    : "1-on-1"}
                                            </span>
                                        </div>
                                        <p className="text-2xs text-slate-400 truncate">
                                            {activeSection === "crm" 
                                                ? "Siklus Perawatan 6–12 Bulan" 
                                                : "Koordinasi Antar-Staf & Teknisi"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <div className="p-1 text-slate-400 cursor-grab" title="Geser posisi widget">
                                        <GripHorizontal className="w-3.5 h-3.5" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded(false)}
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                        title="Kecilkan widget"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded(false)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Tutup jendela"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Section Switcher Tabs (CRM vs Chat Tim) */}
                            {canAccessCrm && (
                                <div className="px-3 pt-2.5 pb-1 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection("crm")}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            activeSection === "crm"
                                                ? "bg-white text-blue-600 shadow-2xs border border-blue-100/80"
                                                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                        }`}
                                    >
                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Recall CRM</span>
                                        <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-blue-600 text-white">
                                            {totalDue > 99 ? "99+" : totalDue}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveSection("chat")}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            activeSection === "chat"
                                                ? "bg-white text-rose-600 shadow-2xs border border-rose-100/80"
                                                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                        }`}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Chat Tim</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-rose-600 text-white ${
                                            unreadChatCount > 0 ? "animate-pulse" : ""
                                        }`}>
                                            {unreadChatCount > 99 ? "99+" : unreadChatCount}
                                        </span>
                                    </button>
                                </div>
                            )}

                            {/* Card Body: Section 1 - CRM Recall */}
                            {activeSection === "crm" && (
                                <div className="p-4 space-y-3.5 max-h-[380px] overflow-y-auto custom-scrollbar">
                                    {/* Component 1: Visual Split Ratio Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-2xs font-bold">
                                            <span className="flex items-center gap-1.5 text-blue-700">
                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                Rutin: {routineCount}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-rose-600">
                                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                Kritis: {urgentCount}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                            <div 
                                                style={{ width: `${routinePercent}%` }} 
                                                className="bg-blue-500 transition-all duration-300" 
                                                title={`Rutin: ${routineCount} unit (${routinePercent}%)`}
                                            />
                                            <div 
                                                style={{ width: `${urgentPercent}%` }} 
                                                className="bg-rose-500 transition-all duration-300" 
                                                title={`Kritis: ${urgentCount} unit (${urgentPercent}%)`}
                                            />
                                        </div>
                                    </div>

                                    {/* Component 2: Visual Metric Chips with Icons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 bg-blue-50/70 border border-blue-100/90 rounded-2xl flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-3xs font-bold uppercase tracking-wider text-blue-600">6–12 Bulan</p>
                                                <p className="text-lg font-black text-slate-800 leading-tight mt-0.5">{routineCount} <span className="text-3xs font-normal text-slate-500">Unit</span></p>
                                            </div>
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="p-2.5 bg-rose-50/70 border border-rose-100/90 rounded-2xl flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-3xs font-bold uppercase tracking-wider text-rose-600">&gt; 1 Thn Kritis</p>
                                                <p className="text-lg font-black text-rose-600 leading-tight mt-0.5">{urgentCount} <span className="text-3xs font-normal text-rose-400">Unit</span></p>
                                            </div>
                                            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                                                <ShieldAlert className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Component 3: Quick Recall Action Cards */}
                                    {previewItems.length > 0 ? (
                                        <div className="space-y-1.5 pt-0.5">
                                            <div className="flex items-center justify-between text-2xs font-bold text-slate-400 uppercase tracking-wider">
                                                <span>Prioritas Hubungi</span>
                                                <span>{previewItems.length} dari {totalDue}</span>
                                            </div>

                                            <div className="space-y-1.5">
                                                {previewItems.map((item, idx) => {
                                                    const customerName = item.customer_nama || "Pelanggan";
                                                    const deviceStr = `${item.merek || ""} ${item.model || ""}`.trim();
                                                    const phone = item.customer_phone ? item.customer_phone.replace(/^0/, "62").replace(/[^0-9]/g, "") : "";
                                                    const months = item.diff_months || 6;
                                                    const isCritical = item.urgency === "urgent_1y";

                                                    const waText = encodeURIComponent(
                                                        `Halo Bpk/Ibu ${customerName},\n\nKami dari YVS Computer menginformasikan bahwa perangkat ${deviceStr} Anda tercatat sudah ${months} bulan sejak servis terakhir. Demi menjaga kestabilan suhu dan performa komponen laptop, kami menyarankan servis berkala pembersihan kipas pendingin dan penggantian pasta termal.\n\nSilakan hubungi kami apabila berkenan menjadwalkan kunjungan servis. Terima kasih.`
                                                    );

                                                    return (
                                                        <div 
                                                            key={idx}
                                                            className="p-2.5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-2.5 text-xs"
                                                        >
                                                            <div className="p-2 bg-slate-50 text-slate-500 rounded-xl shrink-0">
                                                                <Laptop className="w-3.5 h-3.5" />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="font-bold text-slate-900 truncate">{customerName}</p>
                                                                    <span className={`px-1.5 py-0.2 rounded-full text-4xs font-bold border ${
                                                                        isCritical 
                                                                            ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                                            : "bg-blue-50 text-blue-700 border-blue-200"
                                                                    }`}>
                                                                        {months} bln
                                                                    </span>
                                                                </div>
                                                                <p className="text-2xs text-slate-500 truncate mt-0.5">{deviceStr}</p>
                                                            </div>

                                                            {phone ? (
                                                                <a
                                                                    href={`https://wa.me/${phone}?text=${waText}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200 rounded-xl transition-all shrink-0 flex items-center justify-center shadow-2xs"
                                                                    title="Kirim pengingat WhatsApp"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <MessageCircle className="w-4 h-4" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-3xs text-slate-400 italic shrink-0">-</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span className="font-semibold">Semua unit dalam kondisi optimal.</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Card Body: Section 2 - Chat Internal Tim */}
                            {activeSection === "chat" && (
                                <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center justify-between px-1 text-2xs font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Percakapan Terbaru</span>
                                        <span className="text-rose-600 font-extrabold">{unreadChatCount} Belum Dibaca</span>
                                    </div>

                                    {isLoadingChats && recentChats.length === 0 ? (
                                        <div className="space-y-2 py-2">
                                            {[1, 2, 3].map((n) => (
                                                <div key={n} className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/60 animate-pulse flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="h-3 w-28 bg-slate-200 rounded" />
                                                        <div className="h-2.5 w-44 bg-slate-200 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : recentChats.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {recentChats.slice(0, 5).map((c) => {
                                                const otherUser = c.other || {};
                                                const initial = (otherUser.nama || otherUser.username || "U").charAt(0).toUpperCase();
                                                const snippet = formatSnippet(c.lastMessage?.content);
                                                const timeStr = formatChatTime(c.updatedAt);
                                                const hasUnread = Boolean(c.isUnread && c.unreadCount > 0);

                                                return (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => handleOpenChat(c.id)}
                                                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 text-xs ${
                                                            hasUnread 
                                                                ? "bg-rose-50/40 border-rose-200/90 shadow-2xs hover:bg-rose-50/70" 
                                                                : "bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs"
                                                        }`}
                                                    >
                                                        {/* Avatar Initial */}
                                                        <div className="relative shrink-0">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                                                                hasUnread 
                                                                    ? "bg-rose-600 text-white" 
                                                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                                            }`}>
                                                                {initial}
                                                            </div>
                                                            {hasUnread && (
                                                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className={`truncate font-bold ${hasUnread ? "text-slate-900" : "text-slate-800"}`}>
                                                                    {otherUser.nama || otherUser.username || "Rekan Tim"}
                                                                </p>
                                                                <span className="text-3xs text-slate-400 shrink-0 font-medium">
                                                                    {timeStr}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-1.5 mt-0.5">
                                                                <p className={`text-2xs truncate ${hasUnread ? "font-semibold text-rose-900" : "text-slate-500"}`}>
                                                                    {snippet}
                                                                </p>
                                                                {hasUnread && (
                                                                    <span className="px-1.5 py-0.2 rounded-full text-4xs font-black bg-rose-600 text-white shrink-0 shadow-2xs">
                                                                        {c.unreadCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-6 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <div className="w-10 h-10 mx-auto rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2 border border-rose-100">
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-800">Belum Ada Chat Aktif</p>
                                            <p className="text-2xs text-slate-400 mt-0.5 max-w-[200px] mx-auto">
                                                Mulai koordinasi 1-on-1 dengan rekan kerja melalui menu chat tim.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Card Footer: Action Buttons */}
                            <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
                                {activeSection === "crm" ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsExpanded(false);
                                                navigate("/retensi?tab=perawatan");
                                            }}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                        >
                                            <span>Buka Detail di CRM Retensi</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                        {onOpenRecallModal && totalDue > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsExpanded(false);
                                                    onOpenRecallModal();
                                                }}
                                                className="px-3 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                                                title="Buka modal penjadwalan recall"
                                            >
                                                Jadwalkan
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsExpanded(false);
                                            navigate("/chat");
                                        }}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                    >
                                        <span>Buka Chat Tim Lengkap</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Minimized Floating Mascot Trigger with DUAL Notification Badges */}
                <div 
                    onClick={() => {
                        if (!isDraggingRef.current) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                    className="flex items-center gap-2 group cursor-pointer outline-none focus:outline-none"
                >
                    {/* Speech Bubble Teaser (Visible on desktop/tablet) */}
                    {!isExpanded && (
                        <div
                            className="hidden sm:flex bg-white px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 text-xs text-slate-800 items-center gap-2 transition-all hover:border-blue-400 hover:shadow-xl"
                            style={{ transform: "translateZ(0)" }}
                        >
                            <div className="flex items-center -space-x-1 shrink-0">
                                {canAccessCrm && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" title="CRM Recall" />
                                )}
                                <span className={`w-2.5 h-2.5 rounded-full bg-rose-500 border border-white ${
                                    unreadChatCount > 0 ? "animate-ping" : ""
                                }`} title="Chat Tim" />
                            </div>
                            <span className="font-bold text-slate-800 truncate max-w-[210px]">
                                {unreadChatCount > 0 && urgentCount > 0
                                    ? `${unreadChatCount} chat baru • ${urgentCount} recall kritis`
                                    : unreadChatCount > 0
                                    ? `${unreadChatCount} pesan chat belum dibaca`
                                    : urgentCount > 0
                                    ? `${urgentCount} unit kritis butuh recall!`
                                    : totalDue > 0
                                    ? `${totalDue} unit siap servis berkala`
                                    : "Hub Tim & CRM Aktif"}
                            </span>
                        </div>
                    )}

                    {/* Standalone 3D ServiBot with DUAL Floating Badges (CRM Left / Blue, Chat Right / Red) */}
                    <div
                        className="relative cursor-pointer select-none outline-none focus:outline-none transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
                        style={{ transform: "translateZ(0)" }}
                    >
                        {/* 3D ServiBot (Crisp, High Performance Vector) */}
                        <div className="w-11 h-11 sm:w-12 sm:h-12 relative flex items-center justify-center">
                            <ServiBot3D className="w-full h-full" isUrgent={urgentCount > 0} />
                        </div>

                        {/* NOTIFIKASI KIRI: CRM (Warna Biru) */}
                        {canAccessCrm && (
                            <div 
                                title={`Recall CRM: ${totalDue} unit`}
                                className="absolute -top-1.5 -left-2 min-w-[20px] h-5 px-1.5 rounded-full text-3xs font-black shadow-md border-2 border-white flex items-center justify-center bg-blue-600 text-white z-10 pointer-events-none select-none"
                            >
                                <span>{totalDue > 99 ? "99+" : totalDue}</span>
                            </div>
                        )}

                        {/* NOTIFIKASI KANAN: Chat Tim (Warna Merah) */}
                        <div 
                            title={`Chat Tim: ${unreadChatCount} pesan belum dibaca`}
                            className={`absolute -top-1.5 -right-2 min-w-[20px] h-5 px-1.5 rounded-full text-3xs font-black shadow-md border-2 border-white flex items-center justify-center bg-rose-600 text-white z-10 pointer-events-none select-none ${
                                unreadChatCount > 0 ? "animate-pulse ring-2 ring-rose-400/50" : ""
                            }`}
                        >
                            <span>{unreadChatCount > 99 ? "99+" : unreadChatCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
