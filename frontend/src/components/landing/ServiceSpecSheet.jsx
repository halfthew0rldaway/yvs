import { useState } from "react";
import { Cpu, Wrench, Shield, Zap, Flame, HardDrive, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["Semua", "Logic Board", "BGA & Silicon", "Thermal", "Liquid Damage", "Data Recovery", "Upgrade & Build"];

const CAPABILITIES = [
    {
        code: "ENG-01",
        category: "Logic Board",
        title: "Chip-Level Logic Board & Power Rail Restoration",
        hardware: "Apple MacBook, ThinkPad, Dell XPS, ASUS ROG, Acer, HP, Lenovo",
        scope: "Melacak short-circuit pada jalur tegangan primer (19V / 3.3V / 5V / VCore). Penggantian IC PWM charging, controller power-sequencing, MOSFET, dan kapasitor SMD.",
        sla: "1–3 Hari Kerja",
        warranty: "30–90 Hari",
        icon: Cpu,
        color: "text-blue-600",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
        code: "ENG-02",
        category: "BGA & Silicon",
        title: "BGA Reballing & Dedicated GPU / Chipset Replacement",
        hardware: "Laptop Gaming, Mobile Workstation, Mini PC, Motherboard Desktop",
        scope: "Pelepasan IC BGA dengan profil termal multi-zona inframerah. Pembersihan oksidasi, penyusunan lead-free solder ball 0.35–0.5mm, dan penanaman ulang dengan alignment presisi optik.",
        sla: "2–4 Hari Kerja",
        warranty: "60–90 Hari",
        icon: Cpu,
        color: "text-purple-600",
        badge: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
        code: "ENG-03",
        category: "Thermal",
        title: "Advanced Thermal Architecture Overhaul & Acoustic Tuning",
        hardware: "Semua Laptop High-Performance, Gaming Rig, Mini ITX, Workstation",
        scope: "Restorasi termal pendingin: pembersihan korosi sirip tembaga, inspeksi heat-pipe & vapor chamber, pelumasan rotor kipas, aplikasi pasta termal konduktivitas tinggi (Thermal Grizzly / PTM7950).",
        sla: "2–4 Jam (Same-Day)",
        warranty: "30 Hari Beban Normal",
        icon: Flame,
        color: "text-amber-600",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
        code: "ENG-04",
        category: "Liquid Damage",
        title: "Ultrasonic Remediation & Corroded Trace Rebuilding",
        hardware: "Laptop Terkena Tumpahan Air/Kopi/Susu, Motherboard Korosif",
        scope: "Pencucian ultrasonik logic board dalam larutan kimia non-konduktif khusus. Rekonstruksi jalur PCB tembaga yang terputus menggunakan kawat enamel ultra-halus dan solder mask UV curing.",
        sla: "1–5 Hari Kerja",
        warranty: "30–60 Hari",
        icon: Zap,
        color: "text-sky-600",
        badge: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
        code: "ENG-05",
        category: "Data Recovery",
        title: "NVMe / SATA SSD & HDD Data Recovery",
        hardware: "Semua Laptop & PC, NVMe PCIe Gen3/Gen4, SATA SSD & HDD 2.5\"/3.5\"",
        scope: "Pemulihan data dari storage yang mengalami kegagalan controller, bad sector fisik, atau kerusakan firmware. Kloning sektor-per-sektor dan ekstraksi partisi penting.",
        sla: "1–3 Hari Kerja",
        warranty: "Garansi Integritas Data",
        icon: HardDrive,
        color: "text-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
        code: "ENG-06",
        category: "Upgrade & Build",
        title: "Custom PC Build & Storage / RAM Upgrade Consultation",
        hardware: "PC Desktop Custom, Laptop Upgradeable, Mini ITX / Micro-ATX",
        scope: "Konsultasi dan pemasangan upgrade RAM DDR4/DDR5, NVMe SSD, dan GPU. Perakitan PC kustom dengan manajemen kabel profesional, thermal testing, dan validasi kompatibilitas komponen.",
        sla: "Sesuai Konsultasi",
        warranty: "30 Hari Pemasangan",
        icon: Wrench,
        color: "text-indigo-600",
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
];

export default function ServiceSpecSheet() {
    const [activeCategory, setActiveCategory] = useState("Semua");

    const filtered = activeCategory === "Semua"
        ? CAPABILITIES
        : CAPABILITIES.filter((c) => c.category === activeCategory);

    return (
        <section className="relative w-full bg-slate-50 py-16 sm:py-24 border-b border-slate-200 font-sans" id="service-spec">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-2xl mb-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span className="text-xs font-mono font-semibold text-blue-700 uppercase tracking-wider">
                            Spesifikasi Layanan Presisi
                        </span>
                    </div>
                    <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                        Kapabilitas Rekayasa YVS Computer
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-sans">
                        Setiap pengerjaan didefinisikan secara transparan: cakupan diagnosis, perangkat keras yang didukung, estimasi SLA waktu pengerjaan, dan jaminan garansi resmi.
                    </p>
                </div>

                {/* Category Filter - Mobile Horizontal Scrollable + Desktop Wrap */}
                <div className="flex gap-2 overflow-x-auto pb-3 sm:pb-0 sm:flex-wrap mb-8 no-scrollbar scroll-smooth">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-sans font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                                activeCategory === cat
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Service Cards */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((cap) => {
                            const Icon = cap.icon;
                            return (
                                <motion.div
                                    key={cap.code}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 hover:border-slate-300 hover:shadow-xs transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            {/* Icon */}
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 shadow-2xs ${cap.badge}`}>
                                                <Icon className={`w-5 h-5 ${cap.color}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-2 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-3xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                        {cap.code}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-mono font-semibold border ${cap.badge}`}>
                                                        {cap.category}
                                                    </span>
                                                </div>

                                                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-snug">
                                                    {cap.title}
                                                </h3>

                                                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                                                    {cap.scope}
                                                </p>

                                                <div className="pt-1 text-xs font-sans text-slate-500">
                                                    <span className="font-semibold text-slate-700">Dukungan Unit:</span>{" "}
                                                    <span className="text-slate-600">{cap.hardware}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SLA + Warranty Badges */}
                                        <div className="flex sm:flex-col gap-2.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-left sm:text-right flex-1 sm:flex-initial">
                                                <span className="text-3xs text-slate-400 font-mono uppercase tracking-wider block mb-0.5">
                                                    Estimasi SLA
                                                </span>
                                                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                                                    {cap.sla}
                                                </span>
                                            </div>

                                            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3.5 py-2 text-left sm:text-right flex-1 sm:flex-initial">
                                                <span className="text-3xs text-emerald-700 font-mono uppercase tracking-wider block mb-0.5">
                                                    Masa Garansi
                                                </span>
                                                <span className="font-mono text-xs sm:text-sm font-bold text-emerald-700">
                                                    {cap.warranty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
