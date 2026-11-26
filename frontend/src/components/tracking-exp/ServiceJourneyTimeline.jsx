import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
    usePrefersReducedMotion,
    smoothScrollToTarget,
} from "./MotionPrimitives";
import { SHARED_PROCESS_STEPS, loadGsapRuntime } from "./motionTokens";

// 30 evenly sampled frames from 001..240 for silky desktop canvas scrub
const SCRUB_FRAMES = Array.from({ length: 30 }, (_, i) =>
    String(Math.min(240, Math.max(1, Math.round(1 + (i * 239) / 29)))).padStart(3, "0")
);

// 5 dedicated crisp keyframe stills for instant mobile & reduced-motion stage switching
const STAGE_STILLS = [
    "/frames/001.webp",
    "/frames/065.webp",
    "/frames/150.webp",
    "/frames/210.webp",
    "/frames/240.webp",
];

/**
 * ACT II — Native CSS Sticky + GSAP ScrollTrigger Pure-Scrub Disassembly Process
 * Uses native `lg:sticky lg:top-0 lg:h-[100dvh]` inside a `lg:h-[320vh]` scroll runway
 * instead of GSAP `pin: true` — eliminating pin-spacer conflicts, layout jumps, and broken
 * scroll coordinates when lazy sections mount.
 */
export default function ServiceJourneyTimeline() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [canvasReady, setCanvasReady] = useState(false);
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const spineRef = useRef(null);
    const dotRef = useRef(null);
    const currentFrameRef = useRef(0);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined" || !sectionRef.current) {
            return;
        }
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        const saveData = navigator.connection?.saveData;
        if (!isDesktop) return;

        let cancelled = false;
        let ctx = null;
        let ro = null;
        const frames = new Array(SCRUB_FRAMES.length).fill(null);

        const pickNearestLoaded = (targetIdx) => {
            if (frames[targetIdx]) return frames[targetIdx];
            for (let offset = 1; offset < frames.length; offset++) {
                if (frames[targetIdx - offset]) return frames[targetIdx - offset];
                if (frames[targetIdx + offset]) return frames[targetIdx + offset];
            }
            return null;
        };

        const drawFrame = (frameIdx) => {
            currentFrameRef.current = frameIdx;
            const canvas = canvasRef.current;
            const img = pickNearestLoaded(frameIdx);
            if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const w = Math.round(rect.width * dpr);
            const h = Math.round(rect.height * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            const c = canvas.getContext("2d");
            if (!c) return;
            c.clearRect(0, 0, w, h);

            const imgRatio = img.naturalWidth / img.naturalHeight;
            const boxRatio = w / h;
            let dw = w;
            let dh = h;
            let ox = 0;
            let oy = 0;
            if (imgRatio > boxRatio) {
                dh = w / imgRatio;
                oy = (h - dh) / 2;
            } else {
                dw = h * imgRatio;
                ox = (w - dw) / 2;
            }
            c.drawImage(img, ox, oy, dw, dh);
        };

        if (!saveData) {
            SCRUB_FRAMES.forEach((num, idx) => {
                const img = new Image();
                img.decoding = "async";
                img.onload = () => {
                    if (cancelled) return;
                    frames[idx] = img;
                    if (idx === 0) {
                        setCanvasReady(true);
                        drawFrame(currentFrameRef.current);
                    } else if (idx === currentFrameRef.current) {
                        drawFrame(idx);
                    }
                };
                img.src = `/frames/${num}.webp`;
            });
        }

        if (canvasRef.current && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                drawFrame(currentFrameRef.current);
            });
            ro.observe(canvasRef.current);
        }

        loadGsapRuntime().then(({ gsap, ScrollTrigger }) => {
            if (cancelled || !sectionRef.current) return;

            ctx = gsap.context(() => {
                const pathEl = spineRef.current;
                const totalLen = pathEl ? pathEl.getTotalLength() : 252;
                if (pathEl) {
                    gsap.set(pathEl, {
                        strokeDasharray: totalLen,
                        strokeDashoffset: totalLen,
                    });
                }

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.35,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => {
                            const p = self.progress;
                            const fIdx = Math.min(
                                SCRUB_FRAMES.length - 1,
                                Math.round(p * (SCRUB_FRAMES.length - 1))
                            );
                            drawFrame(fIdx);

                            const stepIdx = Math.min(
                                SHARED_PROCESS_STEPS.length - 1,
                                Math.round(p * (SHARED_PROCESS_STEPS.length - 1))
                            );
                            setActiveIdx((prev) => (prev === stepIdx ? prev : stepIdx));
                        },
                    },
                });

                if (pathEl) {
                    tl.to(pathEl, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
                }
                if (dotRef.current && pathEl) {
                    tl.to(
                        dotRef.current,
                        {
                            motionPath: {
                                path: pathEl,
                                align: pathEl,
                                alignOrigin: [0.5, 0.5],
                            },
                            ease: "none",
                            duration: 1,
                        },
                        0
                    );
                }
            }, sectionRef);

            window.requestAnimationFrame(() => ScrollTrigger.refresh());
        });

        return () => {
            cancelled = true;
            if (ro) ro.disconnect();
            if (ctx) ctx.revert();
        };
    }, [reducedMotion]);

    const handleJumpStep = (idx) => {
        setActiveIdx(idx);
        const sec = sectionRef.current;
        if (sec && typeof window !== "undefined" && window.innerWidth >= 1024 && !reducedMotion) {
            const top = sec.getBoundingClientRect().top + window.scrollY;
            const scrollable = Math.max(0, sec.offsetHeight - window.innerHeight);
            const target = top + scrollable * (idx / (SHARED_PROCESS_STEPS.length - 1));
            const lenis = window.__yvsLenis;
            if (lenis) lenis.scrollTo(target, { duration: 0.7 });
            else window.scrollTo({ top: target, behavior: "smooth" });
        }
    };

    const current = SHARED_PROCESS_STEPS[activeIdx];

    return (
        <section
            id="alur-servis"
            ref={sectionRef}
            className={`relative w-full yvs-studio-canvas border-t border-[#071124]/10 scroll-mt-16 ${
                reducedMotion ? "" : "lg:h-[320vh]"
            }`}
        >
            <div className="lg:sticky lg:top-0 lg:h-[100dvh] lg:min-h-[680px] w-full overflow-hidden flex items-center">
                <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-10 lg:h-full lg:flex lg:flex-col lg:justify-between">
                    {/* Top Row: Quiet Editorial Statement + Interactive Step Index */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#071124]/10 lg:pt-12">
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[2.65rem] text-[#071124] tracking-[-0.035em] leading-[1.08] max-w-xl">
                            Lima tahap yang sama, langsung terlihat di tiket Anda.
                        </h2>

                        <div
                            role="tablist"
                            aria-label="Tahapan perbaikan perangkat"
                            className="flex items-center gap-1.5 overflow-x-auto yvs-no-scrollbar pb-1"
                        >
                            {SHARED_PROCESS_STEPS.map((step, idx) => {
                                const active = idx === activeIdx;
                                return (
                                    <button
                                        key={step.key}
                                        role="tab"
                                        aria-selected={active}
                                        type="button"
                                        onClick={() => handleJumpStep(idx)}
                                        className={`min-h-[44px] px-3.5 sm:px-4 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                            active
                                                ? "bg-[#071124] text-white"
                                                : "bg-white/80 hover:bg-white text-[#071124]/75 hover:text-[#071124] border border-[#071124]/10"
                                        }`}
                                    >
                                        <span className="font-mono text-xs mr-1.5 opacity-75">{step.num}</span>
                                        <span>{step.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Center Stage: Borderless Studio Exploded Laptop + Active Stage Narrative */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center flex-1 py-6 lg:py-4 min-h-0">
                        {/* LEFT (7 cols): Full-Bleed Borderless Disassembly Canvas / Keyframe */}
                        <div className="lg:col-span-7 relative flex items-center justify-center h-[280px] xs:h-[320px] sm:h-[420px] lg:h-full max-h-[520px] yvs-studio-canvas">
                            <img
                                src={STAGE_STILLS[activeIdx]}
                                alt={`Tahap ${current.num}: ${current.label}`}
                                width="1280"
                                height="720"
                                loading="lazy"
                                decoding="async"
                                className={`w-full h-full object-contain yvs-studio-frame transition-opacity duration-300 ${
                                    canvasReady ? "lg:opacity-0" : "opacity-100"
                                }`}
                            />
                            <canvas
                                ref={canvasRef}
                                aria-hidden="true"
                                className={`hidden lg:block absolute inset-0 w-full h-full yvs-studio-frame transition-opacity duration-300 ${
                                    canvasReady ? "opacity-100" : "opacity-0"
                                }`}
                            />
                        </div>

                        {/* RIGHT (5 cols): Sculptural Stage Copy + Portal Preview */}
                        <div className="lg:col-span-5 flex items-start gap-5 min-w-0">
                            <div className="hidden lg:block pt-2 shrink-0" aria-hidden="true">
                                <svg viewBox="0 0 20 260" className="w-5 h-[260px] overflow-visible">
                                    <path
                                        d="M 10 4 L 10 256"
                                        fill="none"
                                        stroke="rgba(7,17,36,0.14)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        ref={spineRef}
                                        d="M 10 4 L 10 256"
                                        fill="none"
                                        stroke="#2563EB"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        ref={dotRef}
                                        cx="10"
                                        cy="4"
                                        r="5"
                                        fill="#2563EB"
                                        stroke="#EFEFEF"
                                        strokeWidth="2.5"
                                    />
                                </svg>
                            </div>

                            <div key={current.num} className="space-y-4 min-w-0 animate-fade-in">
                                <div className="flex items-baseline gap-3">
                                    <span className="font-display font-extrabold text-5xl sm:text-6xl text-[#2563EB] tracking-[-0.04em] leading-none tabular-nums">
                                        {current.num}
                                    </span>
                                    <span className="font-display font-bold text-lg text-[#071124]">
                                        {current.label}
                                    </span>
                                </div>

                                <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#071124] tracking-[-0.025em] leading-tight">
                                    {current.title}
                                </h3>

                                <p className="text-sm sm:text-base text-[#071124]/75 leading-relaxed">
                                    {current.desc}
                                </p>

                                <div className="pt-4 border-t border-[#071124]/12 space-y-1.5">
                                    <span className="text-xs font-semibold text-[#071124]">
                                        Tercatat di halaman pelacakan
                                    </span>
                                    <p className="text-sm text-[#475569] leading-relaxed">
                                        {current.portalNote}
                                    </p>
                                </div>

                                <div className="pt-1">
                                    {activeIdx < SHARED_PROCESS_STEPS.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => handleJumpStep(activeIdx + 1)}
                                            className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                                        >
                                            <span>
                                                Tahap berikutnya: {SHARED_PROCESS_STEPS[activeIdx + 1].label}
                                            </span>
                                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => smoothScrollToTarget("track-lookup", -72)}
                                            className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                                        >
                                            <span>Cek status tiket Anda sekarang</span>
                                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
