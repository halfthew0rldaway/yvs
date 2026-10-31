import { useState } from "react";
import { Cpu, Wrench, Shield, Zap, Flame, HardDrive, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["Semua", "Motherboard & Daya", "Chipset & VGA", "Pembersihan & Suhu", "Kena Air & Korosi", "Pemulihan Data", "Upgrade SSD & RAM"];

const CAPABILITIES = [
    {
        code: "ENG-01",
        category: "Motherboard & Daya",
        title: "Perbaikan Motherboard & Jalur Tegangan Power",
        hardware: "Apple MacBook, ThinkPad, Dell XPS, ASUS ROG, Acer, HP, Lenovo",
        scope: "Melacak dan memperbaiki korsleting pada jalur power utama (19V / 3.3V / 5V / VCore). Penggantian IC power charging, kontroler daya, MOSFET, dan kapasitor SMD yang rusak.",
        sla: "1–3 Hari Kerja",
        warranty: "30–90 Hari",
        icon: Cpu,
        color: "text-blue-600",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
        code: "ENG-02",
        category: "Chipset & VGA",
        title: "Reballing Chipset & Perbaikan Chip Grafis (GPU)",
        hardware: "Laptop Gaming, Mobile Workstation, Mini PC, Motherboard Desktop",
        scope: "Solusi laptop layar blank, artefak garis, atau GPU tidak terdeteksi. Pemanasan terkontrol multi-zona, pembersihan korosi timah, dan pemasangan ulang bola timah (lead-free solder balls) berakurasi optik.",
        sla: "2–4 Hari Kerja",
        warranty: "60–90 Hari",
        icon: Cpu,
        color: "text-purple-600",
        badge: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
        code: "ENG-03",
        category: "Pembersihan & Suhu",
        title: "Deep Cleaning & Ganti Pasta Termal Performa Tinggi",
        hardware: "Semua Laptop High-Performance, Gaming Rig, Mini ITX, Workstation",
        scope: "Pembersihan total sirip pendingin tembaga dan kipas dari debu padat, pelumasan rotor kipas, dan aplikasi thermal paste konduktivitas tinggi (Thermal Grizzly / PTM7950) agar suhu kerja laptop tetap dingin dan stabil.",
        sla: "2–4 Jam (Same-Day)",
        warranty: "30 Hari Beban Normal",
        icon: Flame,
        color: "text-amber-600",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
        code: "ENG-04",
        category: "Kena Air & Korosi",
        title: "Penanganan Motherboard Korosif Akibat Tumpahan Cairan",
        hardware: "Laptop Terkena Tumpahan Air/Kopi/Susu, Motherboard Korosif",
        scope: "Pencucian ultrasonik logic board dalam larutan kimia non-konduktif untuk mematikan sisa korosi cairan. Rekonstruksi jalur tembaga PCB yang putus dan pelapisan insulasi UV curing.",
        sla: "1–5 Hari Kerja",
        warranty: "30–60 Hari",
        icon: Zap,
        color: "text-sky-600",
        badge: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
        code: "ENG-05",
        category: "Pemulihan Data",
        title: "Penyelamatan & Pemulihan Data (Data Recovery)",
        hardware: "Semua Laptop & PC, NVMe PCIe Gen3/Gen4, SATA SSD & HDD 2.5\"/3.5\"",
        scope: "Penyelamatan data dari SSD NVMe/SATA dan Harddisk yang mengalami kegagalan deteksi, bad sector fisik, atau kerusakan partisi file tanpa merusak media asli.",
        sla: "1–3 Hari Kerja",
        warranty: "Garansi Integritas Data",
        icon: HardDrive,
        color: "text-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
        code: "ENG-06",
        category: "Upgrade SSD & RAM",
        title: "Upgrade Kecepatan SSD, RAM & Konsultasi Rakit PC",
        hardware: "PC Desktop Custom, Laptop Upgradeable, Mini ITX / Micro-ATX",
        scope: "Pemasangan SSD NVMe generasi terbaru dan penambahan RAM multi-tasking untuk performa responsif, serta perakitan PC Desktop kustom dengan manajemen kabel rapi dan uji kestabilan suhu.",
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
        <section className="relative w-full bg-slate-50 py-16 sm:py-24 border-b border-slate-200 font-sans scroll-mt-14 sm:scroll-mt-16" id="service-spec">
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                {/* Header */}
                <div className="max-w-2xl mb-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span className="text-xs font-mono font-semibold text-blue-700 uppercase tracking-wider">
                            Katalog Layanan & Penanganan
                        </span>
                    </div>
                    <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                        Solusi Perbaikan Spesialis Berdasarkan Kebutuhan Anda
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans text-left sm:text-justify [text-justify:inter-word]">
                        Setiap tindakan perbaikan memiliki cakupan teknis yang jelas, estimasi waktu penyelesaian (SLA), dan jaminan sertifikat garansi resmi.
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

                {/* Service Cards - Balanced 2-Column Grid (Sejajar & Setara) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
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
                                    className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
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

                                                <p className="text-sm text-slate-600 leading-relaxed font-sans text-left sm:text-justify [text-justify:inter-word]">
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
