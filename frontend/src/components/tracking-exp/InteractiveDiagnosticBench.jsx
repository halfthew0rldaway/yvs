import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    Flame,
    Monitor,
    Droplets,
    HardDrive,
    ArrowUpRight,
    Clock,
    ShieldCheck,
    Wrench,
} from "lucide-react";
import { MaskedLines, usePrefersReducedMotion } from "./MotionPrimitives";

const DIAGNOSTIC_CASES = [
    {
        id: "power",
        code: "ZONA 01",
        symptom: "Mati total atau tidak mau cas",
        zoneName: "Jalur Daya 19V & IC Pengisian",
        summary: "Arus tidak masuk ke mesin utama atau korslet pada jalur tegangan.",
        action: "Teknisi mengukur jalur 19V, 3.3V, dan 5V di bawah mikroskop, lalu mengganti IC pengisian atau MOSFET yang rusak—tanpa harus ganti motherboard utuh.",
        eta: "1–3 hari kerja",
        warranty: "Garansi 30–90 hari",
        accent: "#3b82f6",
        accentSoft: "rgba(59,130,246,0.22)",
        icon: Zap,
        boardPoint: { x: 118, y: 122 },
    },
    {
        id: "thermal",
        code: "ZONA 02",
        symptom: "Cepat panas & kipas berisik",
        zoneName: "Pipa Pendingin, Kipas & Pasta Termal",
        summary: "Debu menutup sirip tembaga dan pasta termal prosesor sudah mengering.",
        action: "Pembersihan total sirip pendingin dan kipas, pelumasan rotor, serta penggantian pasta termal baru agar suhu kerja kembali dingin dan senyap.",
        eta: "2–4 jam (bisa ditunggu)",
        warranty: "Garansi 30 hari",
        accent: "#f59e0b",
        accentSoft: "rgba(245,158,11,0.22)",
        icon: Flame,
        boardPoint: { x: 315, y: 114 },
    },
    {
        id: "display",
        code: "ZONA 03",
        symptom: "Layar gelap, berkedip, atau bergaris",
        zoneName: "Chip Grafis (GPU) & Jalur Layar",
        summary: "Unit menyala tapi gambar tidak tampil atau muncul garis di layar.",
        action: "Pemeriksaan kabel fleksibel, jalur lampu latar layar, hingga perbaikan solder chipset grafis berakurasi tinggi atau penggantian panel sesuai spesifikasi.",
        eta: "2–4 hari kerja",
        warranty: "Garansi 60–90 hari",
        accent: "#60a5fa",
        accentSoft: "rgba(96,165,250,0.22)",
        icon: Monitor,
        boardPoint: { x: 244, y: 210 },
    },
    {
        id: "liquid",
        code: "ZONA 04",
        symptom: "Tertumpah air, kopi, atau minuman",
        zoneName: "Pencucian Ultrasonik & Rekonstruksi PCB",
        summary: "Cairan memicu korosi pada jalur tembaga dan komponen mikro.",
        action: "Segera matikan unit dan bawa ke workshop. Papan utama dibersihkan di bak ultrasonik non-konduktif lalu jalur yang putus disambung kembali dengan lapisan pelindung.",
        eta: "1–5 hari kerja",
        warranty: "Garansi 30–60 hari",
        accent: "#38bdf8",
        accentSoft: "rgba(56,189,248,0.22)",
        icon: Droplets,
        boardPoint: { x: 348, y: 236 },
    },
    {
        id: "storage",
        code: "ZONA 05",
        symptom: "Laptop lambat atau data tidak terbaca",
        zoneName: "Slot SSD NVMe & Modul Memori (RAM)",
        summary: "Kapasitas penyimpanan penuh, harddisk lama melemah, atau RAM kurang lega.",
        action: "Penyelamatan data penting dari SSD/HDD bermasalah, atau upgrade ke SSD NVMe cepat dan tambahan RAM tanpa menghapus dokumen kerja Anda.",
        eta: "Hari yang sama",
        warranty: "Garansi 30 hari",
        accent: "#10b981",
        accentSoft: "rgba(16,185,129,0.22)",
        icon: HardDrive,
        boardPoint: { x: 468, y: 222 },
    },
];

export default function InteractiveDiagnosticBench() {
    const [activeId, setActiveId] = useState("power");
    const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
    const boardWrapRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    const activeCase = DIAGNOSTIC_CASES.find((c) => c.id === activeId) || DIAGNOSTIC_CASES[0];

    const handleBoardPointerMove = (e) => {
        if (reducedMotion || typeof window === "undefined") return;
        if (!window.matchMedia("(pointer: fine)").matches) return;
        const rect = boardWrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ rx: Number((-ny * 5).toFixed(2)), ry: Number((nx * 6).toFixed(2)) });
    };

    const handleBoardPointerLeave = () => {
        setTilt({ rx: 0, ry: 0 });
    };

    const waQuery = encodeURIComponent(
        `Halo YVS Computer, perangkat saya mengalami keluhan: ${activeCase.symptom.toLowerCase()}. Bisa bantu cek estimasinya?`
    );

    return (
        <section
            id="cek-keluhan"
            className="relative w-full bg-[#0B1220] text-white yvs-exp-dark-grid border-b border-slate-800 py-16 sm:py-24 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Editorial Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end pb-8 sm:pb-10 mb-8 sm:mb-10 border-b border-slate-800/90">
                    <div className="lg:col-span-7 space-y-2.5">
                        <span className="font-mono text-xs text-blue-400 font-semibold block">
                            01 / SIMULASI PEMERIKSAAN KOMPONEN
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Pilih keluhan Anda,", "lihat bagian yang kami tangani."]}
                            className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.65rem] text-white tracking-[-0.03em] leading-[1.08]"
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                            Kami memeriksa sampai ke jalur komponen di papan utama—bukan sekadar menyarankan ganti mesin baru. Ketuk salah satu keluhan di bawah untuk melihat titik pemeriksaannya.
                        </p>
                    </div>
                </div>

                {/* Main Split Interactive Lab (Zero pinned-scroll trap; instant 60fps on desktop & mobile) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                    {/* LEFT: 5 Interactive Real-World Symptom Selectors (5 Cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-2.5 min-w-0">
                        {DIAGNOSTIC_CASES.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.id === activeId;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveId(item.id)}
                                    className={`group relative w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                                        isActive
                                            ? "bg-slate-900 border-blue-500/80 shadow-[0_12px_30px_-16px_rgba(37,99,235,0.55)]"
                                            : "bg-slate-900/45 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/75"
                                    }`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                            isActive
                                                ? "bg-blue-600/20 border-blue-500/70 text-blue-300"
                                                : "bg-slate-950/70 border-slate-800 text-slate-400 group-hover:text-slate-200"
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`font-mono text-[11px] font-semibold ${
                                                    isActive ? "text-blue-400" : "text-slate-500"
                                                }`}
                                            >
                                                {item.code}
                                            </span>
                                            <span className="font-mono text-[11px] text-slate-500">
                                                {item.eta}
                                            </span>
                                        </div>
                                        <h3
                                            className={`font-display font-bold text-sm sm:text-base mt-0.5 leading-snug ${
                                                isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                                            }`}
                                        >
                                            {item.symptom}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                            {item.zoneName}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* RIGHT: Bespoke Interactive Motherboard Blueprint + Live Diagnostic Readout (7 Cols) */}
                    <div className="lg:col-span-7 flex flex-col gap-4 min-w-0">
                        {/* Interactive SVG Motherboard Stage */}
                        <div
                            ref={boardWrapRef}
                            onPointerMove={handleBoardPointerMove}
                            onPointerLeave={handleBoardPointerLeave}
                            style={{
                                perspective: "1100px",
                            }}
                            className="relative rounded-2xl bg-[#0F172A] border border-slate-800 p-4 sm:p-6 overflow-hidden flex-1 flex flex-col justify-between min-h-[290px] sm:min-h-[340px]"
                        >
                            {/* Top Telemetry Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pb-3 border-b border-slate-800/80">
                                <span className="text-slate-300 font-semibold">
                                    SKEMA PAPAN UTAMA · {activeCase.zoneName.toUpperCase()}
                                </span>
                                <span className="text-blue-400">Ketuk komponen di papan</span>
                            </div>

                            {/* Precision Vector Motherboard Illustration */}
                            <div
                                style={{
                                    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                                    transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                                }}
                                className="relative w-full my-auto py-3 will-change-transform"
                            >
                                <svg
                                    viewBox="0 0 600 330"
                                    className="w-full h-auto block select-none"
                                    role="img"
                                    aria-label={`Skema motherboard menyoroti ${activeCase.zoneName}`}
                                >
                                    <defs>
                                        <pattern id="yvs-pcb-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                                            <circle cx="2" cy="2" r="0.8" fill="rgba(148,163,184,0.16)" />
                                        </pattern>
                                    </defs>

                                    {/* Main PCB Silhouette */}
                                    <path
                                        d="M42 28 H542 L566 52 V278 L542 302 H54 L30 278 V46 Z"
                                        fill="#111C31"
                                        stroke="#293855"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M42 28 H542 L566 52 V278 L542 302 H54 L30 278 V46 Z"
                                        fill="url(#yvs-pcb-dots)"
                                    />

                                    {/* Mounting Screw Holes */}
                                    {[
                                        [52, 48],
                                        [544, 54],
                                        [544, 280],
                                        [54, 280],
                                        [298, 46],
                                        [298, 284],
                                    ].map(([cx, cy], idx) => (
                                        <g key={idx}>
                                            <circle cx={cx} cy={cy} r="6.5" fill="#0B1220" stroke="#475569" strokeWidth="1.2" />
                                            <circle cx={cx} cy={cy} r="2.2" fill="#334155" />
                                        </g>
                                    ))}

                                    {/* Copper Circuit Bus Traces */}
                                    <g stroke="#24344F" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M126 120 H188 L206 146 H260" />
                                        <path d="M126 134 H178 L196 160 H252" />
                                        <path d="M250 185 V210 H315" />
                                        <path d="M350 132 V210 H432" />
                                        <path d="M360 236 H430" />
                                        <path d="M168 250 H322 L344 236" />
                                        <path d="M405 114 H484 V178" />
                                    </g>

                                    {/* Animated Active Signal Trace */}
                                    <path
                                        d={
                                            activeId === "power"
                                                ? "M44 122 H188 L206 146 H260"
                                                : activeId === "thermal"
                                                ? "M204 114 H422"
                                                : activeId === "display"
                                                ? "M244 42 V210 H315"
                                                : activeId === "liquid"
                                                ? "M168 250 H348 V196"
                                                : "M350 132 V210 H488"
                                        }
                                        fill="none"
                                        stroke={activeCase.accent}
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                        className="yvs-pcb-trace-pulse"
                                    />

                                    {/* ZONE 1: Power Rail 19V & VRM Phases */}
                                    <g
                                        onClick={() => setActiveId("power")}
                                        className="cursor-pointer"
                                    >
                                        <rect
                                            x="62"
                                            y="80"
                                            width="112"
                                            height="86"
                                            rx="8"
                                            fill={activeId === "power" ? activeCase.accentSoft : "rgba(15,23,42,0.75)"}
                                            stroke={activeId === "power" ? "#3b82f6" : "#334155"}
                                            strokeWidth={activeId === "power" ? "2" : "1.2"}
                                        />
                                        {/* USB-C / DC-In Port */}
                                        <rect x="30" y="106" width="24" height="32" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
                                        {/* VRM Inductors */}
                                        {[0, 1, 2, 3].map((n) => (
                                            <rect
                                                key={n}
                                                x={76 + n * 22}
                                                y="96"
                                                width="15"
                                                height="18"
                                                rx="2"
                                                fill="#1e293b"
                                                stroke={activeId === "power" ? "#60a5fa" : "#475569"}
                                                strokeWidth="1"
                                            />
                                        ))}
                                        <rect x="78" y="126" width="42" height="26" rx="3" fill="#0f172a" stroke={activeId === "power" ? "#93c5fd" : "#475569"} strokeWidth="1.1" />
                                        <text x="99" y="142" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
                                            IC 19V
                                        </text>
                                    </g>

                                    {/* ZONE 2: Dual Cooling Fans & Copper Heatpipe */}
                                    <g
                                        onClick={() => setActiveId("thermal")}
                                        className="cursor-pointer"
                                    >
                                        <rect
                                            x="194"
                                            y="64"
                                            width="242"
                                            height="98"
                                            rx="10"
                                            fill={activeId === "thermal" ? activeCase.accentSoft : "rgba(15,23,42,0.72)"}
                                            stroke={activeId === "thermal" ? "#f59e0b" : "#334155"}
                                            strokeWidth={activeId === "thermal" ? "2" : "1.2"}
                                        />
                                        {/* Heatpipe bar */}
                                        <path
                                            d="M238 113 H392"
                                            stroke={activeId === "thermal" ? "#f59e0b" : "#92400e"}
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            opacity="0.85"
                                        />
                                        {/* Left Fan */}
                                        <circle cx="238" cy="113" r="32" fill="#0b1220" stroke={activeId === "thermal" ? "#fbbf24" : "#475569"} strokeWidth="1.4" />
                                        <circle cx="238" cy="113" r="11" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                                        {/* Right Fan */}
                                        <circle cx="392" cy="113" r="32" fill="#0b1220" stroke={activeId === "thermal" ? "#fbbf24" : "#475569"} strokeWidth="1.4" />
                                        <circle cx="392" cy="113" r="11" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                                        {/* CPU Coldplate */}
                                        <rect x="292" y="92" width="46" height="42" rx="4" fill="#1e293b" stroke={activeId === "thermal" ? "#fde68a" : "#64748b"} strokeWidth="1.3" />
                                        <text x="315" y="116" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                                            CPU
                                        </text>
                                    </g>

                                    {/* ZONE 3: GPU Chipset & eDP Display Bus */}
                                    <g
                                        onClick={() => setActiveId("display")}
                                        className="cursor-pointer"
                                    >
                                        <rect
                                            x="194"
                                            y="176"
                                            width="104"
                                            height="92"
                                            rx="8"
                                            fill={activeId === "display" ? activeCase.accentSoft : "rgba(15,23,42,0.75)"}
                                            stroke={activeId === "display" ? "#60a5fa" : "#334155"}
                                            strokeWidth={activeId === "display" ? "2" : "1.2"}
                                        />
                                        <rect x="218" y="196" width="56" height="48" rx="4" fill="#0b1220" stroke={activeId === "display" ? "#93c5fd" : "#64748b"} strokeWidth="1.3" />
                                        <text x="246" y="223" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                                            GPU
                                        </text>
                                        <text x="246" y="258" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono, monospace">
                                            eDP / LAYAR
                                        </text>
                                    </g>

                                    {/* ZONE 4: Liquid / Micro-SMD Corrosion Zone */}
                                    <g
                                        onClick={() => setActiveId("liquid")}
                                        className="cursor-pointer"
                                    >
                                        <rect
                                            x="312"
                                            y="176"
                                            width="92"
                                            height="92"
                                            rx="8"
                                            fill={activeId === "liquid" ? activeCase.accentSoft : "rgba(15,23,42,0.75)"}
                                            stroke={activeId === "liquid" ? "#38bdf8" : "#334155"}
                                            strokeWidth={activeId === "liquid" ? "2" : "1.2"}
                                        />
                                        {/* Micro SMD Matrix */}
                                        {[0, 1, 2].map((row) =>
                                            [0, 1, 2].map((col) => (
                                                <rect
                                                    key={`${row}-${col}`}
                                                    x={326 + col * 24}
                                                    y={192 + row * 18}
                                                    width="14"
                                                    height="8"
                                                    rx="1.5"
                                                    fill="#1e293b"
                                                    stroke={activeId === "liquid" ? "#7dd3fc" : "#475569"}
                                                    strokeWidth="1"
                                                />
                                            ))
                                        )}
                                        <text x="358" y="258" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono, monospace">
                                            SMD / PCB
                                        </text>
                                    </g>

                                    {/* ZONE 5: NVMe M.2 SSD & SO-DIMM RAM */}
                                    <g
                                        onClick={() => setActiveId("storage")}
                                        className="cursor-pointer"
                                    >
                                        <rect
                                            x="418"
                                            y="176"
                                            width="122"
                                            height="92"
                                            rx="8"
                                            fill={activeId === "storage" ? activeCase.accentSoft : "rgba(15,23,42,0.75)"}
                                            stroke={activeId === "storage" ? "#10b981" : "#334155"}
                                            strokeWidth={activeId === "storage" ? "2" : "1.2"}
                                        />
                                        <rect x="432" y="190" width="94" height="24" rx="3" fill="#0b1220" stroke={activeId === "storage" ? "#34d399" : "#64748b"} strokeWidth="1.2" />
                                        <text x="479" y="205" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
                                            NVMe M.2 SSD
                                        </text>
                                        <rect x="432" y="224" width="94" height="24" rx="3" fill="#0b1220" stroke={activeId === "storage" ? "#34d399" : "#64748b"} strokeWidth="1.2" />
                                        <text x="479" y="239" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
                                            DDR4 / DDR5 RAM
                                        </text>
                                    </g>

                                    {/* Battery Connector Strip */}
                                    <rect x="62" y="208" width="112" height="58" rx="6" fill="#0b1220" stroke="#293855" strokeWidth="1.2" />
                                    <text x="118" y="241" textAnchor="middle" fill="#475569" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
                                        BATERAI &amp; I/O
                                    </text>

                                    {/* Active Target Reticle */}
                                    <g
                                        style={{
                                            transform: `translate(${activeCase.boardPoint.x}px, ${activeCase.boardPoint.y}px)`,
                                            transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
                                        }}
                                        pointerEvents="none"
                                    >
                                        <circle r="15" fill={activeCase.accentSoft} stroke={activeCase.accent} strokeWidth="1.4" />
                                        <circle r="4.5" fill={activeCase.accent} stroke="#ffffff" strokeWidth="1.8" />
                                    </g>
                                </svg>
                            </div>
                        </div>

                        {/* Live Diagnostic Detail Card */}
                        <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-5 sm:p-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeCase.id}
                                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <span className="font-mono text-xs text-blue-400 font-semibold block">
                                                {activeCase.code} · {activeCase.zoneName}
                                            </span>
                                            <h3 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
                                                {activeCase.summary}
                                            </h3>
                                        </div>
                                        <a
                                            href={`https://wa.me/628121034212?text=${waQuery}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0"
                                        >
                                            <span>Tanya keluhan ini</span>
                                            <ArrowUpRight className="w-4 h-4 shrink-0" />
                                        </a>
                                    </div>

                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {activeCase.action}
                                    </p>

                                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                            <span>Estimasi: <strong className="text-white">{activeCase.eta}</strong></span>
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span><strong className="text-emerald-400">{activeCase.warranty}</strong></span>
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                            <span>Gratis cek jika batal</span>
                                        </span>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
