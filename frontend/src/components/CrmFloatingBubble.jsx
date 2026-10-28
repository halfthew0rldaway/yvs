import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Clock, 
    ShieldAlert, 
    MessageCircle, 
    ArrowRight, 
    X, 
    Minus, 
    GripHorizontal,
    Wrench,
    Laptop,
    Sparkles,
    CheckCircle2
} from "lucide-react";

/**
 * ServiBot3D - High-Tech 3D Concierge Robot Mascot
 * Pure 3D floating character with porcelain-white ceramic finishes,
 * curved glossy visor, glowing azure eyes, and subtle floating levitation.
 * Renders cleanly with transparent background directly over the interface.
 */
export function ServiBot3D({ size = 64, isUrgent = false }) {
    const glowColor = isUrgent ? "#f43f5e" : "#38bdf8";
    const darkGlowColor = isUrgent ? "#9f1239" : "#0284c7";

    return (
        <div 
            className="relative flex items-center justify-center shrink-0 select-none pointer-events-none" 
            style={{ width: size, height: size }}
        >
            <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full drop-shadow-[0_10px_20px_rgba(15,23,42,0.22)]"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Porcelain Body 3D Radial Sphere */}
                    <radialGradient id="serviBody" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="45%" stopColor="#f8fafc" />
                        <stop offset="75%" stopColor="#e2e8f0" />
                        <stop offset="100%" stopColor="#94a3b8" />
                    </radialGradient>

                    {/* Dark Curved Glass Visor Screen */}
                    <linearGradient id="serviVisorGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#090d16" />
                        <stop offset="60%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>

                    {/* Expressive Glowing Eyes */}
                    <radialGradient id="serviEyeGlow" cx="40%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="45%" stopColor={glowColor} />
                        <stop offset="100%" stopColor={darkGlowColor} />
                    </radialGradient>

                    {/* Ear Audio Pods */}
                    <linearGradient id="serviEarPods" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="50%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>

                    {/* Antenna Pulse Bulb */}
                    <radialGradient id="serviAntennaBulb" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="50%" stopColor={glowColor} />
                        <stop offset="100%" stopColor={darkGlowColor} />
                    </radialGradient>
                </defs>

                {/* Soft Ground Ambient Shadow */}
                <ellipse cx="50" cy="92" rx="24" ry="4.5" fill="#0f172a" opacity="0.25" />

                {/* Floating Torso Base */}
                <path 
                    d="M 36 67 Q 50 76 64 67 L 67 79 Q 50 85 33 79 Z" 
                    fill="url(#serviBody)" 
                />

                {/* Blue Tech Collar Ring */}
                <rect x="36" y="65" width="28" height="3.5" rx="1.75" fill="#2563eb" />

                {/* Floating Left Hand */}
                <ellipse cx="23" cy="62" rx="5" ry="7" fill="url(#serviBody)" transform="rotate(-15 23 62)" />

                {/* Floating Right Hand */}
                <ellipse cx="77" cy="62" rx="5" ry="7" fill="url(#serviBody)" transform="rotate(15 77 62)" />

                {/* Antenna Stem */}
                <path d="M 50 18 L 50 9" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

                {/* Antenna Glowing Signal Bulb */}
                <circle cx="50" cy="8" r="4.5" fill="url(#serviAntennaBulb)" />
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
                <rect x="18" y="38" width="6" height="15" rx="3" fill="url(#serviEarPods)" />
                <circle cx="21" cy="45.5" r="1.5" fill={glowColor} />

                {/* Right Ear Audio Pod */}
                <rect x="76" y="38" width="6" height="15" rx="3" fill="url(#serviEarPods)" />
                <circle cx="79" cy="45.5" r="1.5" fill={glowColor} />

                {/* Main 3D Spherical Head */}
                <circle cx="50" cy="45" r="28" fill="url(#serviBody)" />

                {/* Specular Highlight Arc on Head */}
                <path 
                    d="M 33 26 C 41 21 59 21 67 26" 
                    stroke="#ffffff" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    opacity="0.65" 
                />

                {/* Glossy Visor Screen */}
                <rect 
                    x="28" 
                    y="34" 
                    width="44" 
                    height="23" 
                    rx="11.5" 
                    fill="url(#serviVisorGlass)" 
                    stroke={glowColor} 
                    strokeWidth="1" 
                    strokeOpacity="0.45" 
                />

                {/* Glass Reflection Arc across Visor */}
                <path 
                    d="M 35 36.5 Q 50 33.5 64 36.5" 
                    stroke="#ffffff" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    opacity="0.32" 
                />

                {/* Left Expressive Cyan Glowing Eye */}
                <rect x="36.5" y="41" width="7" height="9" rx="3.5" fill="url(#serviEyeGlow)" />
                <circle cx="38.5" cy="43" r="1.2" fill="#ffffff" />

                {/* Right Expressive Cyan Glowing Eye */}
                <rect x="56.5" y="41" width="7" height="9" rx="3.5" fill="url(#serviEyeGlow)" />
                <circle cx="58.5" cy="43" r="1.2" fill="#ffffff" />
            </svg>
        </div>
    );
}

export default function CrmFloatingBubble({ maintenanceDueData, onOpenRecallModal }) {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const isDraggingRef = useRef(false);

    const totalDue = Number(maintenanceDueData?.total_due || 0);
    const urgentCount = Number(maintenanceDueData?.urgent_count || 0);
    const routineCount = Number(maintenanceDueData?.routine_count || Math.max(0, totalDue - urgentCount));
    const items = maintenanceDueData?.items || [];

    // If dismissed in this session, keep hidden until refreshed
    if (isDismissed) {
        return null;
    }

    const previewItems = items.slice(0, 3);
    const routinePercent = totalDue > 0 ? Math.round((routineCount / totalDue) * 100) : 100;
    const urgentPercent = totalDue > 0 ? 100 - routinePercent : 0;

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.15}
            onDragStart={() => {
                isDraggingRef.current = true;
            }}
            onDragEnd={() => {
                setTimeout(() => {
                    isDraggingRef.current = false;
                }, 120);
            }}
            className="fixed z-[9999] select-none cursor-grab active:cursor-grabbing pointer-events-auto print:hidden right-4 sm:right-7 bottom-20 lg:bottom-7"
            style={{ touchAction: "none" }}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
            <div className="relative">
                {/* Expanded CRM Card Popover (Component-Driven, Zero Walls of Text) */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 12 }}
                            transition={{ type: "spring", stiffness: 350, damping: 26 }}
                            className="w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden mb-3 flex flex-col text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Card Header: Crisp, Clean White matching Servio Modals */}
                            <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="relative p-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center shrink-0">
                                        <ServiBot3D size={28} isUrgent={urgentCount > 0} />
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white ${
                                            urgentCount > 0 ? "bg-rose-500" : "bg-emerald-500"
                                        }`} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                                                Recall Servis
                                            </h4>
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                                urgentCount > 0 
                                                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                            }`}>
                                                {totalDue} Unit
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            Siklus Perawatan 6–12 Bulan
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <div className="p-1 text-slate-400" title="Geser posisi widget">
                                        <GripHorizontal className="w-3.5 h-3.5" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded(false)}
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Kecilkan widget"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded(false)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Tutup jendela"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Card Body: Component & Icon Driven (Zero Heavy Paragraphs) */}
                            <div className="p-4 space-y-3.5 max-h-[380px] overflow-y-auto custom-scrollbar">
                                {/* Component 1: Visual Split Ratio Bar */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
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
                                            className="bg-blue-500 transition-all duration-500" 
                                            title={`Rutin: ${routineCount} unit (${routinePercent}%)`}
                                        />
                                        <div 
                                            style={{ width: `${urgentPercent}%` }} 
                                            className="bg-rose-500 transition-all duration-500" 
                                            title={`Kritis: ${urgentCount} unit (${urgentPercent}%)`}
                                        />
                                    </div>
                                </div>

                                {/* Component 2: Visual Metric Chips with Icons */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 bg-blue-50/70 border border-blue-100/90 rounded-2xl flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">6–12 Bulan</p>
                                            <p className="text-lg font-black text-slate-800 leading-tight mt-0.5">{routineCount} <span className="text-[10px] font-normal text-slate-500">Unit</span></p>
                                        </div>
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                    </div>

                                    <div className="p-2.5 bg-rose-50/70 border border-rose-100/90 rounded-2xl flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">&gt; 1 Thn Kritis</p>
                                            <p className="text-lg font-black text-rose-600 leading-tight mt-0.5">{urgentCount} <span className="text-[10px] font-normal text-rose-400">Unit</span></p>
                                        </div>
                                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {/* Component 3: Quick Recall Action Cards (Max 3 Units) */}
                                {previewItems.length > 0 ? (
                                    <div className="space-y-1.5 pt-0.5">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                                                    `Halo Bpk/Ibu ${customerName},\n\nKami dari Serv.io Workshop menginformasikan bahwa perangkat ${deviceStr} Anda tercatat sudah ${months} bulan sejak servis terakhir. Demi menjaga kestabilan suhu dan performa komponen laptop, kami menyarankan servis berkala pembersihan kipas pendingin dan penggantian pasta termal.\n\nSilakan hubungi kami apabila berkenan menjadwalkan kunjungan servis. Terima kasih.`
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
                                                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                                                                    isCritical 
                                                                        ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                                                }`}>
                                                                    {months} bln
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{deviceStr}</p>
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
                                                            <span className="text-[10px] text-slate-400 italic shrink-0">-</span>
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

                            {/* Card Footer: Clean Catchy CTA to CRM Retention Section */}
                            <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsExpanded(false);
                                        navigate("/retensi?tab=perawatan");
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
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
                                        className="px-3 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
                                        title="Buka modal penjadwalan recall"
                                    >
                                        Jadwalkan
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Minimized Pure 3D Floating Mascot Trigger (NO BACKGROUND BOX/CONTAINER) */}
                <div 
                    onClick={() => {
                        if (!isDraggingRef.current) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                    className="flex items-center gap-2 group cursor-pointer"
                >
                    {/* Speech Bubble Teaser (Visible when collapsed) */}
                    {!isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, x: 10, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            whileHover={{ scale: 1.03 }}
                            className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200/90 text-xs text-slate-800 flex items-center gap-2 transition-all hover:border-blue-400 hover:shadow-2xl"
                        >
                            <span className="flex h-2 w-2 relative shrink-0">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    urgentCount > 0 ? "bg-rose-400" : "bg-emerald-400"
                                }`} />
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                    urgentCount > 0 ? "bg-rose-500" : "bg-emerald-500"
                                }`} />
                            </span>
                            <span className="font-bold text-slate-800 truncate max-w-[190px]">
                                {urgentCount > 0 
                                    ? `${urgentCount} unit kritis butuh recall!` 
                                    : totalDue > 0 
                                    ? `${totalDue} unit siap servis berkala`
                                    : "Semua unit aman optimal"}
                            </span>
                        </motion.div>
                    )}

                    {/* Pure Standalone 3D ServiBot (Zero Background Container / Box) */}
                    <motion.div
                        whileHover={{ scale: 1.12, rotate: [0, -4, 4, 0] }}
                        whileTap={{ scale: 0.92 }}
                        className="relative cursor-pointer select-none filter drop-shadow-xl"
                    >
                        {/* 3D ServiBot with Smooth Levitation Animation */}
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ServiBot3D size={64} isUrgent={urgentCount > 0} />
                        </motion.div>

                        {/* Notification Pill Badge on Robot */}
                        <div className={`absolute top-0 right-1 px-2 py-0.5 rounded-full text-[11px] font-black shadow-lg border-2 border-white flex items-center gap-0.5 text-white ${
                            urgentCount > 0 ? "bg-rose-500" : totalDue > 0 ? "bg-blue-600" : "bg-emerald-600"
                        }`}>
                            <span>{totalDue > 0 ? totalDue : "OK"}</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
