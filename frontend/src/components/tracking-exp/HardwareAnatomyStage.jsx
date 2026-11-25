import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Layers, Cpu, Wind, HardDrive, ShieldCheck, SlidersHorizontal, ArrowRight } from "lucide-react";
import { usePrefersReducedMotion, smoothScrollToTarget } from "./MotionPrimitives";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 240;
const KEYFRAME_INDICES = [0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 239];

const getFrameSrc = (idx) => `/frames/${String(idx + 1).padStart(3, "0")}.webp`;

const ANATOMY_STAGES = [
    {
        id: "intake",
        num: "01",
        range: [0, 0.25],
        targetProgress: 0.08,
        label: "Cek fisik & foto awal",
        title: "Perangkat diperiksa utuh sebelum dibuka.",
        desc: "Setiap unit difoto kondisi fisiknya bersama kelengkapan yang dititipkan. Estimasi biaya disampaikan dulu sebelum perbaikan dimulai.",
        metric: "Gratis cek bila batal",
        icon: Layers,
        callout: { x: 26, y: 30, tag: "Casing & Layar" },
    },
    {
        id: "board",
        num: "02",
        range: [0.25, 0.52],
        targetProgress: 0.42,
        label: "Motherboard & jalur daya",
        title: "Dicari sampai ke komponen, bukan asal ganti utuh.",
        desc: "Korsleting jalur daya, IC pengisian, chipset grafis, hingga korosi cairan ditangani di tingkat komponen di bawah mikroskop.",
        metric: "Perbaikan level komponen",
        icon: Cpu,
        callout: { x: 54, y: 52, tag: "Jalur Daya 19V / VCore" },
    },
    {
        id: "thermal",
        num: "03",
        range: [0.52, 0.78],
        targetProgress: 0.68,
        label: "Pendingin & pasta termal",
        title: "Debu dibersihkan, suhu kembali stabil.",
        desc: "Sirip tembaga, kipas, dan pasta termal lama yang mengering diganti baru agar laptop tidak mudah panas atau melambat.",
        metric: "Suhu kerja lebih tenang",
        icon: Wind,
        callout: { x: 64, y: 36, tag: "Heatsink & Kipas" },
    },
    {
        id: "qc",
        num: "04",
        range: [0.78, 1.0],
        targetProgress: 0.94,
        label: "Uji 25 titik & garansi",
        title: "Diperiksa ulang 25 titik sebelum diserahkan.",
        desc: "Layar, papan ketik, suara, port, baterai, hingga kestabilan beban diuji tuntas. Komponen bekas lama dikembalikan utuh beserta garansi tertulis.",
        metric: "Garansi 30–90 hari",
        icon: ShieldCheck,
        callout: { x: 38, y: 66, tag: "Uji Akhir & Garansi" },
    },
];

/**
 * Interactive 3D Layered SVG Laptop Exploded Diagram
 * Built specifically for mobile (< 1024px) & reduced-motion users so they get a
 * tactile, 60fps, zero-bloat hardware disassembly experience without downloading 240 frames.
 */
function InteractiveExplodedDiagram({ progress, activeStage, onSelectStage, onScrub }) {
    const spread = progress; // 0 = assembled, 1 = fully exploded
    const layers = [
        {
            idx: 0,
            name: "Layar & Casing Atas",
            code: "L-01",
            zOffset: -spread * 44,
            stroke: activeStage === 0 ? "#3b82f6" : "#475569",
            fill: activeStage === 0 ? "rgba(37,99,235,0.16)" : "rgba(30,41,59,0.72)",
        },
        {
            idx: 2,
            name: "Kipas & Pipa Pendingin",
            code: "L-02",
            zOffset: -spread * 14,
            stroke: activeStage === 2 ? "#f59e0b" : "#475569",
            fill: activeStage === 2 ? "rgba(245,158,11,0.16)" : "rgba(30,41,59,0.72)",
        },
        {
            idx: 1,
            name: "Motherboard & Jalur Daya",
            code: "L-03",
            zOffset: spread * 16,
            stroke: activeStage === 1 ? "#3b82f6" : "#475569",
            fill: activeStage === 1 ? "rgba(37,99,235,0.22)" : "rgba(15,23,42,0.85)",
        },
        {
            idx: 3,
            name: "SSD, Memori & Rangka Bawah",
            code: "L-04",
            zOffset: spread * 46,
            stroke: activeStage === 3 ? "#10b981" : "#475569",
            fill: activeStage === 3 ? "rgba(16,185,129,0.16)" : "rgba(15,23,42,0.92)",
        },
    ];

    return (
        <div className="space-y-4">
            <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3">
                    <span>MODEL BEDAH LAPISAN UNIT</span>
                    <span className="text-blue-400 font-semibold">
                        BUKAAN {Math.round(progress * 100)}%
                    </span>
                </div>

                {/* Tactile 4-Layer Isometric SVG Stack */}
                <div className="relative w-full h-[250px] sm:h-[290px] flex items-center justify-center select-none">
                    <svg
                        viewBox="0 0 360 250"
                        className="w-full h-full max-w-[380px] overflow-visible"
                        role="img"
                        aria-label="Ilustrasi lapisan komponen internal laptop YVS Computer"
                    >
                        {/* Vertical alignment guide axis */}
                        <line
                            x1="180"
                            y1="26"
                            x2="180"
                            y2="224"
                            stroke="rgba(148,163,184,0.2)"
                            strokeDasharray="3 4"
                            strokeWidth="1"
                        />

                        {layers
                            .slice()
                            .reverse()
                            .map((layer) => {
                                const isActive = activeStage === layer.idx;
                                return (
                                    <g
                                        key={layer.code}
                                        onClick={() => onSelectStage(layer.idx)}
                                        style={{
                                            transform: `translateY(${layer.zOffset}px)`,
                                            transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                                        }}
                                        className="cursor-pointer"
                                    >
                                        {/* Isometric Plate */}
                                        <polygon
                                            points="180,76 308,125 180,174 52,125"
                                            fill={layer.fill}
                                            stroke={layer.stroke}
                                            strokeWidth={isActive ? "2" : "1.15"}
                                        />
                                        {/* Layer-specific technical hardware motif */}
                                        {layer.idx === 1 && (
                                            <g stroke={isActive ? "#60a5fa" : "#64748b"} strokeWidth="1.2" fill="none">
                                                <rect
                                                    x="156"
                                                    y="112"
                                                    width="48"
                                                    height="26"
                                                    rx="2"
                                                    fill={isActive ? "rgba(37,99,235,0.35)" : "rgba(51,65,85,0.4)"}
                                                />
                                                <path d="M98 125 H156 M204 125 H262 M180 94 V112 M180 138 V156" />
                                                <circle cx="122" cy="125" r="2.5" fill="#60a5fa" />
                                                <circle cx="238" cy="125" r="2.5" fill="#60a5fa" />
                                            </g>
                                        )}
                                        {layer.idx === 2 && (
                                            <g stroke={isActive ? "#fbbf24" : "#64748b"} strokeWidth="1.2" fill="none">
                                                <circle cx="145" cy="125" r="14" />
                                                <circle cx="215" cy="125" r="14" />
                                                <path d="M159 125 H201" strokeWidth="3" strokeLinecap="round" />
                                            </g>
                                        )}
                                        {layer.idx === 3 && (
                                            <g stroke={isActive ? "#34d399" : "#64748b"} strokeWidth="1.2" fill="none">
                                                <rect x="132" y="117" width="40" height="16" rx="2" />
                                                <rect x="184" y="117" width="44" height="16" rx="2" />
                                            </g>
                                        )}
                                        {layer.idx === 0 && (
                                            <polygon
                                                points="180,88 282,125 180,162 78,125"
                                                fill="none"
                                                stroke={isActive ? "#93c5fd" : "rgba(148,163,184,0.35)"}
                                                strokeWidth="1"
                                                strokeDasharray="4 3"
                                            />
                                        )}
                                        {/* Side coordinate callout label */}
                                        <text
                                            x="316"
                                            y="128"
                                            fill={isActive ? "#f8fafc" : "#64748b"}
                                            fontSize="10"
                                            fontFamily="JetBrains Mono, monospace"
                                            fontWeight={isActive ? "700" : "500"}
                                        >
                                            {layer.code}
                                        </text>
                                    </g>
                                );
                            })}
                    </svg>
                </div>

                {/* Interactive Scrubber Control */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                        <label htmlFor="yvs-mobile-anatomy-slider" className="inline-flex items-center gap-1.5 font-medium">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                            <span>Geser untuk membuka lapisan komponen</span>
                        </label>
                        <span className="font-mono text-xs text-slate-400">
                            {ANATOMY_STAGES[activeStage]?.num} / 04
                        </span>
                    </div>
                    <input
                        id="yvs-mobile-anatomy-slider"
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(progress * 100)}
                        onChange={(e) => onScrub(Number(e.target.value) / 100)}
                        className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                </div>
            </div>

            {/* Active Stage Detail Card */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-blue-400 font-semibold">
                        TAHAP {ANATOMY_STAGES[activeStage].num} · {ANATOMY_STAGES[activeStage].label}
                    </span>
                    <span className="text-emerald-400">{ANATOMY_STAGES[activeStage].metric}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-white leading-snug">
                    {ANATOMY_STAGES[activeStage].title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                    {ANATOMY_STAGES[activeStage].desc}
                </p>
            </div>

            {/* Tappable Stage Selector Pills */}
            <div className="grid grid-cols-2 gap-2">
                {ANATOMY_STAGES.map((stage, idx) => {
                    const active = idx === activeStage;
                    return (
                        <button
                            key={stage.id}
                            type="button"
                            onClick={() => onSelectStage(idx)}
                            className={`min-h-[44px] text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                                active
                                    ? "bg-blue-600/20 border-blue-500 text-white"
                                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <span className="font-mono text-[11px] text-blue-400 block">{stage.num}</span>
                            <span className="line-clamp-1">{stage.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function HardwareAnatomyStage() {
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const framesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
    const currentFrameRef = useRef(0);
    const targetProgressRef = useRef(0);
    const manualOverrideRef = useRef(false);
    const activeStageRef = useRef(0);

    const reducedMotion = usePrefersReducedMotion();
    const [isDesktopLab, setIsDesktopLab] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= 1024 : false
    );
    const [progressUi, setProgressUi] = useState(0.08);
    const [activeStage, setActiveStage] = useState(0);
    const [framesReady, setFramesReady] = useState(false);

    useEffect(() => {
        const onResize = () => setIsDesktopLab(window.innerWidth >= 1024);
        window.addEventListener("resize", onResize, { passive: true });
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const useFrameCanvas = isDesktopLab && !reducedMotion;

    const stageForProgress = (p) => {
        if (p < 0.25) return 0;
        if (p < 0.52) return 1;
        if (p < 0.78) return 2;
        return 3;
    };

    const drawCanvasFrame = useCallback((frameIdx) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const clamped = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(frameIdx)));
        let img = framesRef.current[clamped];
        if (!img?.complete || !img?.naturalWidth) {
            for (let dist = 1; dist < TOTAL_FRAMES; dist++) {
                const prev = framesRef.current[clamped - dist];
                if (prev?.complete && prev?.naturalWidth) {
                    img = prev;
                    break;
                }
                const next = framesRef.current[clamped + dist];
                if (next?.complete && next?.naturalWidth) {
                    img = next;
                    break;
                }
            }
        }
        if (!img?.complete || !img?.naturalWidth) return;

        const cw = canvas.width;
        const ch = canvas.height;
        if (!cw || !ch) return;

        const iw = img.naturalWidth || 1920;
        const ih = img.naturalHeight || 1080;
        const scale = Math.min(cw / iw, ch / ih) * 1.04;
        const dw = Math.round(iw * scale);
        const dh = Math.round(ih * scale);
        const dx = Math.round((cw - dw) / 2);
        const dy = Math.round((ch - dh) / 2);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cw, ch);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, dx, dy, dw, dh);
    }, []);

    // Lazy preload frames + GSAP ScrollTrigger scrub on Desktop only
    useEffect(() => {
        if (!useFrameCanvas) return;
        const sectionEl = sectionRef.current;
        const canvas = canvasRef.current;
        if (!sectionEl || !canvas) return;

        let cancelled = false;
        let isInView = false;
        let rafId = null;
        let loadedAllStarted = false;

        const resizeCanvas = () => {
            const w = canvas.clientWidth || 720;
            const h = canvas.clientHeight || 460;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            drawCanvasFrame(currentFrameRef.current);
        };

        const loadImage = (idx, onLoad) => {
            const existing = framesRef.current[idx];
            if (existing) {
                if (existing.complete && existing.naturalWidth > 0 && onLoad) onLoad();
                return;
            }
            const img = new Image();
            img.decoding = "async";
            img.onload = () => {
                if (cancelled) return;
                if (onLoad) onLoad();
            };
            img.src = getFrameSrc(idx);
            framesRef.current[idx] = img;
            if (img.complete && img.naturalWidth > 0 && onLoad) {
                onLoad();
            }
        };

        const loadRemainingFrames = () => {
            if (loadedAllStarted) return;
            loadedAllStarted = true;
            let cursor = 0;
            const loadBatch = () => {
                if (cancelled || cursor >= TOTAL_FRAMES) return;
                const end = Math.min(cursor + 12, TOTAL_FRAMES);
                for (let i = cursor; i < end; i++) {
                    loadImage(i, () => {
                        setFramesReady(true);
                        if (Math.abs(i - currentFrameRef.current) < 6) {
                            drawCanvasFrame(currentFrameRef.current);
                        }
                    });
                }
                cursor = end;
                if (cursor < TOTAL_FRAMES) {
                    setTimeout(loadBatch, 40);
                }
            };
            loadBatch();
        };

        // Load keyframes first so initial render is sharp immediately
        KEYFRAME_INDICES.forEach((idx) => {
            loadImage(idx, () => {
                setFramesReady(true);
                resizeCanvas();
                drawCanvasFrame(currentFrameRef.current);
            });
        });

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas, { passive: true });

        // Pause RAF when off-screen, start full frame load only when approaching viewport
        const io = new IntersectionObserver(
            ([entry]) => {
                isInView = entry.isIntersecting;
                if (isInView) {
                    loadRemainingFrames();
                    if (!rafId) loop();
                } else if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            },
            { rootMargin: "350px 0px" }
        );
        io.observe(sectionEl);

        const loop = () => {
            if (cancelled || !isInView) {
                rafId = null;
                return;
            }
            const targetFrame = targetProgressRef.current * (TOTAL_FRAMES - 1);
            const diff = targetFrame - currentFrameRef.current;
            if (Math.abs(diff) > 0.08) {
                currentFrameRef.current += diff * 0.16;
                drawCanvasFrame(currentFrameRef.current);
            }
            rafId = requestAnimationFrame(loop);
        };

        // GSAP ScrollTrigger drives targetProgress smoothly while pinned
        const st = ScrollTrigger.create({
            trigger: sectionEl,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                if (manualOverrideRef.current) return;
                const p = self.progress;
                targetProgressRef.current = p;
                setProgressUi(p);
                const nextStage = stageForProgress(p);
                if (nextStage !== activeStageRef.current) {
                    activeStageRef.current = nextStage;
                    setActiveStage(nextStage);
                }
            },
        });

        return () => {
            cancelled = true;
            st.kill();
            io.disconnect();
            window.removeEventListener("resize", resizeCanvas);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [useFrameCanvas, drawCanvasFrame]);

    const handleSelectStage = (idx) => {
        const stage = ANATOMY_STAGES[idx];
        if (!stage) return;
        activeStageRef.current = idx;
        setActiveStage(idx);
        setProgressUi(stage.targetProgress);
        targetProgressRef.current = stage.targetProgress;

        if (useFrameCanvas && sectionRef.current) {
            const rect = sectionRef.current.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const scrollableHeight = Math.max(1, sectionRef.current.offsetHeight - window.innerHeight);
            const targetY = sectionTop + scrollableHeight * stage.targetProgress;
            if (window.__yvsLenis) {
                window.__yvsLenis.scrollTo(targetY, { duration: 0.9 });
            } else {
                window.scrollTo({ top: targetY, behavior: "smooth" });
            }
        }
    };

    const handleManualScrub = (nextProgress) => {
        const clamped = Math.min(1, Math.max(0, nextProgress));
        manualOverrideRef.current = true;
        targetProgressRef.current = clamped;
        setProgressUi(clamped);
        const nextStage = stageForProgress(clamped);
        activeStageRef.current = nextStage;
        setActiveStage(nextStage);
        if (useFrameCanvas) {
            drawCanvasFrame(clamped * (TOTAL_FRAMES - 1));
            window.clearTimeout(window.__yvsScrubTimer);
            window.__yvsScrubTimer = window.setTimeout(() => {
                manualOverrideRef.current = false;
            }, 900);
        }
    };

    const currentStage = ANATOMY_STAGES[activeStage] || ANATOMY_STAGES[0];
    const StageIcon = currentStage.icon;

    return (
        <section
            id="hardware-lab"
            ref={sectionRef}
            className={`relative w-full bg-[#0B1220] text-white yvs-exp-dark-grid border-b border-slate-800 scroll-mt-16 ${
                useFrameCanvas ? "lg:h-[260vh]" : "py-14 sm:py-20"
            }`}
        >
            <div
                className={
                    useFrameCanvas
                        ? "lg:sticky lg:top-0 lg:h-screen flex items-center py-12 lg:py-0 overflow-hidden"
                        : "w-full"
                }
            >
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 lg:pb-8 mb-6 lg:mb-8 border-b border-slate-800/90">
                        <div className="space-y-2 max-w-2xl">
                            <span className="font-mono text-xs text-blue-400 tracking-wide block">
                                01 / BEDAH PROSES PERBAIKAN
                            </span>
                            <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-[1.12]">
                                Lihat apa yang terjadi saat perangkat Anda kami periksa.
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                            {useFrameCanvas
                                ? "Gulir perlahan atau geser tuas inspeksi untuk melihat setiap lapisan komponen yang kami tangani."
                                : "Geser pengatur di bawah atau ketuk tiap tahap untuk melihat bagian yang diperiksa teknisi."}
                        </p>
                    </div>

                    {/* DESKTOP VIEWPORT: Framed 240-Frame Hardware Light-Table + Editorial Chapter Switcher */}
                    {useFrameCanvas ? (
                        <div className="grid grid-cols-12 gap-8 xl:gap-12 items-center">
                            {/* LEFT: 4 Interactive Chapters (5 Cols) */}
                            <div className="col-span-5 space-y-5">
                                <div className="space-y-1.5">
                                    {ANATOMY_STAGES.map((stage, idx) => {
                                        const isActive = idx === activeStage;
                                        return (
                                            <button
                                                key={stage.id}
                                                type="button"
                                                onClick={() => handleSelectStage(idx)}
                                                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                                                    isActive
                                                        ? "bg-slate-900/95 border-blue-500/80 shadow-[0_12px_32px_-16px_rgba(37,99,235,0.45)]"
                                                        : "bg-transparent border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span
                                                        className={`font-mono text-xs font-semibold ${
                                                            isActive ? "text-blue-400" : "text-slate-500"
                                                        }`}
                                                    >
                                                        {stage.num} · {stage.label}
                                                    </span>
                                                    <span
                                                        className={`text-[11px] font-mono ${
                                                            isActive ? "text-emerald-400" : "text-slate-600"
                                                        }`}
                                                    >
                                                        {stage.metric}
                                                    </span>
                                                </div>
                                                <h3
                                                    className={`font-display font-bold text-base leading-snug ${
                                                        isActive ? "text-white" : "text-slate-400"
                                                    }`}
                                                >
                                                    {stage.title}
                                                </h3>
                                                {isActive && (
                                                    <p className="text-xs sm:text-[13px] text-slate-300 mt-2 leading-relaxed">
                                                        {stage.desc}
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="pt-1 flex items-center justify-between text-xs">
                                    <button
                                        type="button"
                                        onClick={() => smoothScrollToTarget("track-lookup", -80)}
                                        className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                                    >
                                        <span>Sudah punya nomor servis? Lacak sekarang</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT: Architectural Light-Table Hardware Stage + Callout Overlay + Manual Scrubber (7 Cols) */}
                            <div className="col-span-7 space-y-3.5">
                                <div className="relative rounded-2xl bg-white border border-slate-700/80 overflow-hidden shadow-[0_28px_70px_-24px_rgba(0,0,0,0.65)] aspect-[16/10]">
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full h-full block"
                                        aria-label="Visualisasi bedah komponen laptop YVS Computer"
                                    />

                                    {!framesReady && (
                                        <div className="absolute inset-0 bg-white flex items-center justify-center">
                                            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}

                                    {/* Architectural Corner Registration Marks */}
                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-4 border border-slate-900/10 rounded-lg"
                                    />

                                    {/* Dynamic Hardware Callout Marker */}
                                    <div
                                        style={{
                                            left: `${currentStage.callout.x}%`,
                                            top: `${currentStage.callout.y}%`,
                                            transition: "left 420ms cubic-bezier(0.22, 1, 0.36, 1), top 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                                        }}
                                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
                                    >
                                        <span className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-600/25 shrink-0" />
                                        <span className="px-2.5 py-1 rounded-md bg-slate-950/90 text-white font-mono text-[11px] font-semibold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                                            <StageIcon className="w-3 h-3 text-blue-400 shrink-0" />
                                            <span>{currentStage.callout.tag}</span>
                                        </span>
                                    </div>

                                    {/* Bottom Light-Table Frame Readout */}
                                    <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-600">
                                        <span className="px-2 py-0.5 rounded bg-white/90 border border-slate-200">
                                            FRAME {String(Math.round(progressUi * (TOTAL_FRAMES - 1)) + 1).padStart(3, "0")} / {TOTAL_FRAMES}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-white/90 border border-slate-200 font-semibold text-slate-900">
                                            {currentStage.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Tactile Manual Inspection Scrubber */}
                                <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800">
                                    <label
                                        htmlFor="yvs-desktop-anatomy-slider"
                                        className="text-xs font-mono text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-1.5"
                                    >
                                        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Inspeksi manual</span>
                                    </label>
                                    <input
                                        id="yvs-desktop-anatomy-slider"
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={Math.round(progressUi * 100)}
                                        onChange={(e) => handleManualScrub(Number(e.target.value) / 100)}
                                        className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                    />
                                    <span className="font-mono text-xs text-blue-400 font-semibold w-10 text-right tabular-nums shrink-0">
                                        {Math.round(progressUi * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* MOBILE & REDUCED-MOTION: Interactive 3D Layered SVG Exploded Laptop */
                        <InteractiveExplodedDiagram
                            progress={progressUi}
                            activeStage={activeStage}
                            onSelectStage={handleSelectStage}
                            onScrub={handleManualScrub}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
