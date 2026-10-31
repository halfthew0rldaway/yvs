import { useState } from "react";
import { Cpu, Wrench, Shield, Zap, Flame, HardDrive, Check } from "lucide-react";

const CATEGORIES = ["Semua", "Logic Board", "BGA & Silicon", "Thermal", "Liquid Damage", "Data Recovery", "Upgrade & Build"];

const CAPABILITIES = [
    {
        code: "ENG-01",
        category: "Logic Board",
        title: "Chip-Level Logic Board & Power Rail Restoration",
        hardware: "Apple MacBook, ThinkPad, Dell XPS, ASUS ROG, Razer Blade",
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
        title: "BGA Reballing & Dedicated GPU/Chipset Replacement",
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
        scope: "Restorasi termal pendingin: pembersihan korosi sirip tembaga, inspeksi heat-pipe & vapor chamber, pelumasan rotor kipas, aplikasi pasta termal konduktivitas tinggi (Thermal Grizzly Kryonaut / PTM7950).",
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
        scope: "Pemulihan data dari storage yang mengalami kegagalan controller, bad sector fisik, atau kerusakan firmware. Kloning sektor-per-sektor dan ekstraksi data terenkripsi BitLocker.",
        sla: "1–3 Hari Kerja",
        warranty: "Garansi Keberhasilan Data",
        icon: HardDrive,
        color: "text-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
        code: "ENG-06",
        category: "Upgrade & Build",
        title: "Custom PC Build & Storage/RAM Upgrade Consultation",
        hardware: "PC Desktop Custom, Laptop Upgradeable, Mini ITX / Micro-ATX",
        scope: "Konsultasi dan pemasangan upgrade RAM DDR4/DDR5, NVMe SSD, dan GPU. Perakitan PC kustom dengan manajemen kabel profesional, thermal testing, dan validasi kompatibilitas komponen.",
        sla: "Sesuai Konsultasi",
        warranty: "30 Hari Pasang",
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
        <section className="relative w-full bg-slate-50 py-16 sm:py-24 border-b border-slate-100" id="service-spec">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-2xl mb-10 space-y-3">
                    <span className="text-xs font-sans font-semibold text-blue-600 uppercase tracking-wide">
                        Spesifikasi Layanan
                    </span>
                    <h2 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                        Kapabilitas Rekayasa YVS Computer
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-sans">
                        Setiap layanan didefinisikan secara teknis dengan cakupan pekerjaan, instrumen yang digunakan, estimasi SLA, dan cakupan garansi resmi.
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all cursor-pointer border ${
                                activeCategory === cat
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Service Cards */}
                <div className="space-y-4">
                    {filtered.map((cap) => {
                        const Icon = cap.icon;
                        return (
                            <div
                                key={cap.code}
                                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-slate-300 hover:shadow-sm transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${cap.badge}`}>
                                        <Icon className={`w-5 h-5 ${cap.color}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-2.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-2xs text-slate-400 uppercase tracking-wider">{cap.code}</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-semibold border ${cap.badge}`}>
                                                {cap.category}
                                            </span>
                                        </div>

                                        <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900 leading-snug">
                                            {cap.title}
                                        </h3>

                                        <p className="text-sm text-slate-500 leading-relaxed font-sans">
                                            {cap.scope}
                                        </p>

                                        <div className="pt-1 flex flex-wrap gap-x-6 gap-y-2 text-xs font-sans text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                <span><span className="font-semibold text-slate-700">Hardware:</span> {cap.hardware}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SLA + Warranty */}
                                    <div className="flex sm:flex-col gap-3 sm:gap-2 shrink-0 sm:text-right">
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
                                            <div className="text-xs text-slate-400 font-sans uppercase tracking-wide mb-0.5">SLA</div>
                                            <div className="font-mono text-sm font-bold text-slate-900">{cap.sla}</div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
                                            <div className="text-xs text-slate-400 font-sans uppercase tracking-wide mb-0.5">Garansi</div>
                                            <div className="font-mono text-sm font-bold text-emerald-600">{cap.warranty}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
