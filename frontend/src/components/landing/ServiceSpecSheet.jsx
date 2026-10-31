import { useState } from "react";
import { Cpu, Wrench, Shield, Zap, Flame, HardDrive, Terminal, ArrowRight, Check } from "lucide-react";

const CAPABILITIES = [
    {
        code: "ENG-SPEC-01",
        category: "Logic Board",
        title: "Chip-Level Logic Board & Power Rail Restoration",
        hardware: "Apple MacBook, ThinkPad, Dell XPS, ASUS ROG, Razer Blade",
        scope: "Melacak short-circuit mikron pada jalur tegangan primer (19V / 3.3V / 5V / 1.05V VCore). Penggantian IC PWM charging, controller power-sequencing, MOSFET high/low side, dan kapasitor tantalum SMD.",
        instrument: "Stereoscopic Microscope (45x), Thermal FLIR Cam, JBC Nano Rework, Hakko Desoldering",
        sla: "1 - 3 Hari Kerja",
        warranty: "30 - 90 Hari Resmi",
    },
    {
        code: "ENG-SPEC-02",
        category: "BGA & Silicon",
        title: "BGA Reballing & Dedicated GPU/Chipset Replacement",
        hardware: "Laptop Gaming, Mobile Workstation, Mini PC, Motherboard Desktop",
        scope: "Pelepasan IC BGA menggunakan profil termal multi-zona inframerah terprogram. Pembersihan sisa timah oksidasi, penyusunan lead-free solder ball matrix 0.35mm - 0.5mm, dan penanaman ulang dengan alignment presisi optik.",
        instrument: "Scotle High-Precision Optical Alignment BGA Station, Stensil BGA Laser Direct-Heat",
        sla: "2 - 4 Hari Kerja",
        warranty: "60 - 90 Hari Resmi",
    },
    {
        code: "ENG-SPEC-03",
        category: "Thermal",
        title: "Advanced Thermal Architecture Overhaul & Acoustic Tuning",
        hardware: "Semua Laptop High-Performance, Gaming Rig, Mini ITX, Workstation",
        scope: "Restorasi konduktivitas termal pendingin: pembersihan korosi sirip tempa tembaga, inspeksi keretakan pipa heat-pipe vapor chamber, pelumasan bantalan rotor kipas, dan aplikasi pasta termal konduktivitas tinggi (Honeywell PTM7950 / Thermal Grizzly Kryonaut).",
        instrument: "Digital Anemometer, Sound Decibel Meter, Calibrated Torque Driver, FurMark Burn-In Rig",
        sla: "2 - 4 Jam (Same-Day)",
        warranty: "30 Hari Beban Normal",
    },
    {
        code: "ENG-SPEC-04",
        category: "Liquid Damage",
        title: "Ultrasonic Remediation & Corroded Trace Rebuilding",
        hardware: "Laptop Terkena Tumpahan Air/Kopi/Susu, Motherboard Korosif",
        scope: "Pencucian ultrasonik logic board dalam larutan kimia non-konduktif khusus untuk melarutkan sisa gula, mineral, dan oksidasi tembaga. Rekonstruksi jalur PCB tembaga yang terputus menggunakan kawat enamel ultra-halus (0.02mm) dan solder mask UV curing.",
        instrument: "Industrial Heated Ultrasonic Bath, UV Curing Lamp, Microsoldering Enamel Probe",
        sla: "2 - 4 Hari Kerja",
        warranty: "30 - 60 Hari Resmi",
    },
    {
        code: "ENG-SPEC-05",
        category: "Forensic Data",
        title: "Hardware-Level Data Recovery & NAND Flash Diagnostics",
        hardware: "NVMe SSD, SATA SSD, Flash Storage Terkunci, Hard Disk Mekanik Bad Sector",
        scope: "Penanganan media penyimpanan tidak terdeteksi (bad sector kritis, controller firmware panic, PCB controller terbakar). Bypass hardware, pemindahan chip memori NAND ke donor board, atau rekonstruksi partisi low-level.",
        instrument: "PC-3000 Flash / Portable, Clean Air Laminar Flow Bench, Rom Programmer",
        sla: "2 - 5 Hari Kerja",
        warranty: "Integritas File 100%",
    },
    {
        code: "ENG-SPEC-06",
        category: "Custom Rig",
        title: "Custom Workstation Assembly & Stress Benchmarking",
        hardware: "PC Rendering 3D, Deep Learning AI Rig, Audio Studio Workstation",
        scope: "Perancangan arsitektur kabel kustom presisi, manajemen airflow tekanan positif, instalasi custom loop liquid cooling, undervolting CPU/GPU terkalibrasi untuk stabilitas 24/7 dan temperatur optimal.",
        instrument: "MemTest86+, Cinebench R23 Multi-Core 2H, Prime95 Small FFTs, Wattmeter Digital",
        sla: "1 - 3 Hari Kerja",
        warranty: "Garansi Rakitan 1 Tahun",
    },
];

const CATEGORIES = ["Semua", "Logic Board", "BGA & Silicon", "Thermal", "Liquid Damage", "Forensic Data", "Custom Rig"];

export default function ServiceSpecSheet() {
    const [activeCategory, setActiveCategory] = useState("Semua");

    const filtered = activeCategory === "Semua"
        ? CAPABILITIES
        : CAPABILITIES.filter((c) => c.category === activeCategory);

    return (
        <section className="relative w-full bg-[#0e1014] text-zinc-100 py-16 sm:py-24 border-b border-zinc-800/80" id="service-spec">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Editorial Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-800">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-400" />
                            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold">
                                SPECIFICATION // ENGINEERING CAPABILITIES
                            </span>
                        </div>
                        <h2 className="font-grotesk font-black text-2xl sm:text-4xl text-white tracking-tight">
                            Lembar Spesifikasi Rekayasa &amp; Perbaikan
                        </h2>
                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                            Parameter teknis terperinci mengenai cakupan pengerjaan, instrumentasi laboratorium, estimasi waktu penyelesaian (SLA), dan garansi resmi YVS Computer.
                        </p>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-2xs font-mono font-bold transition-all cursor-pointer ${
                                    activeCategory === cat
                                        ? "bg-zinc-100 text-zinc-950 shadow-xs"
                                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Technical Spec Sheet Layout (Editorial Matrix, not generic cards) */}
                <div className="mt-8 space-y-4">
                    {filtered.map((item, idx) => (
                        <div
                            key={item.code}
                            className="bg-[#12151b] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-5 sm:p-7 transition-all"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* Column 1: Index Code & Identity */}
                                <div className="lg:col-span-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-400">
                                            {item.code}
                                        </span>
                                        <span className="font-mono text-3xs uppercase tracking-wider text-zinc-400">
                                            {item.category}
                                        </span>
                                    </div>
                                    <h3 className="font-grotesk font-bold text-base sm:text-lg text-white leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-3xs font-mono text-zinc-400">
                                        Unit Target: <span className="text-zinc-300">{item.hardware}</span>
                                    </p>
                                </div>

                                {/* Column 2: Scope of Work & Procedures */}
                                <div className="lg:col-span-6 space-y-3">
                                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                                        {item.scope}
                                    </p>
                                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-start gap-2.5">
                                        <Wrench className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                        <div className="text-3xs font-mono text-zinc-400 leading-normal">
                                            <strong className="text-zinc-300">Instrumentasi Lab:</strong> {item.instrument}
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: SLA Turnaround & Warranty */}
                                <div className="lg:col-span-3 flex lg:flex-col justify-between items-end lg:items-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-800/80">
                                    <div className="text-left lg:text-right">
                                        <span className="block font-mono text-3xs uppercase tracking-widest text-zinc-400">
                                            Turnaround SLA
                                        </span>
                                        <span className="font-mono text-sm sm:text-base font-bold text-white">
                                            {item.sla}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-mono text-3xs uppercase tracking-widest text-zinc-400">
                                            Proteksi Garansi
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80">
                                            <Shield className="w-3 h-3" />
                                            {item.warranty}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Technical Consultation Prompt */}
                <div className="mt-8 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-amber-400 shrink-0" />
                        <p className="text-xs font-mono text-zinc-300">
                            Membutuhkan penanganan perangkat khusus atau konsultasi skema sirkuit kompleks?
                        </p>
                    </div>
                    <a
                        href="https://wa.me/6281234567890?text=Halo%20teknisi%20YVS,%20saya%20ingin%20konsultasi%20kendala%20khusus%20perangkat%20saya"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                        <span>Hubungi Teknisi Lab YVS</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </section>
    );
}
