import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
    usePrefersReducedMotion,
    smoothScrollToTarget,
} from "./MotionPrimitives";
import { SHARED_PROCESS_STEPS, loadGsapMotionPathRuntime } from "./motionTokens";

const TOTAL_SOURCE_FRAMES = 240;
const SAMPLED_COUNT = 80;

// 80 crisp evenly sampled frame indices across 001..240 (1 frame every ~20px of scroll = smooth 60fps scrub with 10x lower VRAM)
const FRAME_NUMBERS = Array.from({ length: SAMPLED_COUNT }, (_, i) =>
    String(Math.min(TOTAL_SOURCE_FRAMES, Math.max(1, Math.round(1 + (i * (TOTAL_SOURCE_FRAMES - 1)) / (SAMPLED_COUNT - 1))))).padStart(3, "0")
);

// 12 priority keyframes decoded first for instant response when entering section
const PRIORITY_INDICES = Array.from({ length: 12 }, (_, i) =>
    Math.min(SAMPLED_COUNT - 1, Math.round((i * (SAMPLED_COUNT - 1)) / 11))
);

// 5 dedicated keyframe stills for mobile & reduced-motion stage switching
const STAGE_STILLS = [
    "/frames/001.webp",
    "/frames/065.webp",
    "/frames/150.webp",
    "/frames/210.webp",
    "/frames/240.webp",
];

function yieldForInput() {
    const busy =
        typeof navigator !== "undefined" &&
        navigator.scheduling?.isInputPending?.({ includeContinuous: false });
    return new Promise((resolve) => window.setTimeout(resolve, busy ? 48 : 6));
}

/**
 * ACT II — Native CSS Sticky + Viewport-Gated 80-Frame Scroll-Scrubbed Disassembly Theatre
 * - Defers all frame fetching/decoding until #alur-servis nears the viewport (0 cost on Hero load/INP).
 * - Decodes off-thread at display resolution (`resizeWidth: 1080`) with input-yielding workers.
 * - Uses an inertia-damped RAF lerp loop so even coarse mouse-wheel notches scrub smoothly.
 */
export default function ServiceJourneyTimeline() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [canvasReady, setCanvasReady] = useState(false);
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const spineRef = useRef(null);
    const dotRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined" || !sectionRef.current) {
            return;
        }
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        const saveData = navigator.connection?.saveData;
        if (!isDesktop) return;

        let cancelled = false;
        let streamStarted = false;
        let ctx = null;
        let ro = null;
        let io = null;
        let rafId = null;
        let inView = false;
        let spineTl = null;

        const bitmaps = new Array(SAMPLED_COUNT).fill(null);
        let ctx2d = null;
        let boxW = 0;
        let boxH = 0;
        let dpr = 1;
        let targetProgress = 0;
        let smoothProgress = 0;
        let lastDrawnIdx = -1;
        let lastTickTime = 0;

        const pickNearestLoaded = (targetIdx) => {
            if (bitmaps[targetIdx]) return { img: bitmaps[targetIdx], idx: targetIdx };
            for (let offset = 1; offset < SAMPLED_COUNT; offset++) {
                if (targetIdx - offset >= 0 && bitmaps[targetIdx - offset]) {
                    return { img: bitmaps[targetIdx - offset], idx: targetIdx - offset };
                }
                if (targetIdx + offset < SAMPLED_COUNT && bitmaps[targetIdx + offset]) {
                    return { img: bitmaps[targetIdx + offset], idx: targetIdx + offset };
                }
            }
            return null;
        };

        const syncCanvasSize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            boxW = Math.round(rect.width * dpr);
            boxH = Math.round(rect.height * dpr);
            if (canvas.width !== boxW || canvas.height !== boxH) {
                canvas.width = boxW;
                canvas.height = boxH;
                ctx2d = canvas.getContext("2d", { desynchronized: true });
                lastDrawnIdx = -1;
            } else if (!ctx2d) {
                ctx2d = canvas.getContext("2d", { desynchronized: true });
            }
        };

        const drawFrame = (frameIdx) => {
            const canvas = canvasRef.current;
            if (!canvas || boxW === 0 || boxH === 0) return;
            const picked = pickNearestLoaded(frameIdx);
            if (!picked) return;
            if (picked.idx === lastDrawnIdx && frameIdx !== 0) return;

            const img = picked.img;
            const iw = img.width || img.naturalWidth;
            const ih = img.height || img.naturalHeight;
            if (!iw || !ih) return;

            const c = ctx2d || canvas.getContext("2d", { desynchronized: true });
            if (!c) return;
            ctx2d = c;
            c.clearRect(0, 0, boxW, boxH);

            const scale = Math.min(boxW / iw, boxH / ih);
            const dw = iw * scale;
            const dh = ih * scale;
            const ox = (boxW - dw) / 2;
            const oy = (boxH - dh) / 2;
            c.drawImage(img, ox, oy, dw, dh);
            lastDrawnIdx = picked.idx;
        };

        const decodeFrame = async (idx) => {
            if (cancelled || bitmaps[idx]) return;
            const url = `/frames/${FRAME_NUMBERS[idx]}.webp`;
            try {
                if (typeof createImageBitmap === "function") {
                    const res = await fetch(url);
                    if (!res.ok || cancelled) return;
                    const blob = await res.blob();
                    if (cancelled) return;
                    // Downscale off-thread to 1080px wide (~2.5MB RGBA instead of 14.7MB 4K)
                    const bmp = await createImageBitmap(blob, {
                        resizeWidth: 1080,
                        resizeQuality: "medium",
                    });
                    if (cancelled) {
                        bmp.close?.();
                        return;
                    }
                    bitmaps[idx] = bmp;
                } else {
                    const img = new Image();
                    img.decoding = "async";
                    img.src = url;
                    await img.decode();
                    if (cancelled) return;
                    bitmaps[idx] = img;
                }

                if (idx === 0) {
                    setCanvasReady(true);
                    syncCanvasSize();
                    drawFrame(0);
                } else {
                    const activeFrame = Math.min(
                        SAMPLED_COUNT - 1,
                        Math.round(smoothProgress * (SAMPLED_COUNT - 1))
                    );
                    if (Math.abs(idx - activeFrame) <= 2) {
                        lastDrawnIdx = -1;
                        drawFrame(activeFrame);
                    }
                }
            } catch (_) {
                // Ignore aborted frames on unmount
            }
        };

        const startFrameStream = async () => {
            if (streamStarted || saveData || cancelled) return;
            streamStarted = true;
            await Promise.all(PRIORITY_INDICES.map((i) => decodeFrame(i)));
            if (cancelled) return;

            const prioritySet = new Set(PRIORITY_INDICES);
            const queue = [];
            for (let i = 0; i < SAMPLED_COUNT; i++) {
                if (!prioritySet.has(i)) queue.push(i);
            }

            let cursor = 0;
            const workerCount = 2;
            const workers = Array.from({ length: workerCount }, async () => {
                while (!cancelled && cursor < queue.length) {
                    const nextIdx = queue[cursor++];
                    await decodeFrame(nextIdx);
                    await yieldForInput();
                }
            });
            await Promise.all(workers);
        };

        const tickLerp = (now) => {
            rafId = null;
            if (cancelled) return;

            const dt = lastTickTime ? Math.min(0.05, (now - lastTickTime) / 1000) : 1 / 60;
            lastTickTime = now;

            const delta = targetProgress - smoothProgress;
            if (Math.abs(delta) > 0.00025) {
                // Frame-rate independent damping so 60Hz, 120Hz, and 144Hz feel identical
                smoothProgress += delta * (1 - Math.exp(-dt * 14));
                const frameIdx = Math.min(
                    SAMPLED_COUNT - 1,
                    Math.max(0, Math.round(smoothProgress * (SAMPLED_COUNT - 1)))
                );
                drawFrame(frameIdx);
                if (spineTl) spineTl.progress(smoothProgress);
                if (inView) rafId = window.requestAnimationFrame(tickLerp);
            } else if (smoothProgress !== targetProgress) {
                lastTickTime = 0;
                smoothProgress = targetProgress;
                const frameIdx = Math.min(
                    SAMPLED_COUNT - 1,
                    Math.max(0, Math.round(smoothProgress * (SAMPLED_COUNT - 1)))
                );
                drawFrame(frameIdx);
                if (spineTl) spineTl.progress(smoothProgress);
            } else {
                lastTickTime = 0;
            }
        };

        const ensureTicker = () => {
            if (!rafId && !cancelled && inView) {
                rafId = window.requestAnimationFrame(tickLerp);
            }
        };

        syncCanvasSize();

        if (canvasRef.current && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                syncCanvasSize();
                const frameIdx = Math.min(
                    SAMPLED_COUNT - 1,
                    Math.max(0, Math.round(smoothProgress * (SAMPLED_COUNT - 1)))
                );
                drawFrame(frameIdx);
            });
            ro.observe(canvasRef.current);
        }

        // Only stream frames once section nears the viewport so Hero load & typing stay 100% idle
        io = new IntersectionObserver(
            (entries) => {
                inView = entries.some((e) => e.isIntersecting);
                if (inView) {
                    startFrameStream();
                    ensureTicker();
                }
            },
            { rootMargin: "220px 0px" }
        );
        io.observe(sectionRef.current);

        loadGsapMotionPathRuntime().then(({ gsap, ScrollTrigger }) => {
            if (cancelled || !sectionRef.current) return;

            ctx = gsap.context(() => {
                const pathEl = spineRef.current;
                const totalLen = pathEl ? pathEl.getTotalLength() : 272;
                if (pathEl) {
                    gsap.set(pathEl, {
                        strokeDasharray: totalLen,
                        strokeDashoffset: totalLen,
                    });
                }

                spineTl = gsap.timeline({ paused: true });
                if (pathEl) {
                    spineTl.to(pathEl, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
                }
                if (dotRef.current && pathEl) {
                    spineTl.to(
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

                ScrollTrigger.create({
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: true,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        targetProgress = self.progress;
                        ensureTicker();

                        const stepIdx = Math.min(
                            SHARED_PROCESS_STEPS.length - 1,
                            Math.round(self.progress * (SHARED_PROCESS_STEPS.length - 1))
                        );
                        setActiveIdx((prev) => (prev === stepIdx ? prev : stepIdx));
                    },
                });
            }, sectionRef);

            window.requestAnimationFrame(() => ScrollTrigger.refresh());
        });

        return () => {
            cancelled = true;
            if (rafId) window.cancelAnimationFrame(rafId);
            if (ro) ro.disconnect();
            if (io) io.disconnect();
            if (ctx) ctx.revert();
            bitmaps.forEach((bmp) => bmp?.close?.());
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
            if (lenis) lenis.scrollTo(target, { duration: 0.75 });
            else window.scrollTo({ top: target, behavior: "smooth" });
        }
    };

    const current = SHARED_PROCESS_STEPS[activeIdx];

    return (
        <section
            id="alur-servis"
            ref={sectionRef}
            className={`relative w-full yvs-studio-canvas border-t border-[var(--yvs-rule)] scroll-mt-16 ${
                reducedMotion ? "" : "lg:min-h-[340svh]"
            }`}
        >
            <div className="lg:sticky lg:top-0 lg:h-[100dvh] lg:min-h-[640px] w-full overflow-hidden flex items-center">
                <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-14 py-12 sm:py-16 lg:pt-[4.5rem] lg:pb-6 lg:h-full lg:flex lg:flex-col lg:justify-between gap-4">
                    {/* Top Row: Compact Headline + Step Selector Buttons */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[var(--yvs-rule)] shrink-0">
                        <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] text-[var(--yvs-ink)] tracking-[-0.035em] leading-[1.08] max-w-2xl">
                            Lima tahap yang sama, langsung terlihat di tiket Anda.
                        </h2>

                        <div
                            role="group"
                            aria-label="Tahapan perbaikan perangkat"
                            className="flex items-center gap-1.5 overflow-x-auto yvs-no-scrollbar pb-0.5 shrink-0"
                        >
                            {SHARED_PROCESS_STEPS.map((step, idx) => {
                                const active = idx === activeIdx;
                                return (
                                    <button
                                        key={step.key}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => handleJumpStep(idx)}
                                        className={`min-h-[44px] px-3.5 sm:px-4 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                            active
                                                ? "bg-[var(--yvs-obsidian)] text-white"
                                                : "bg-[var(--yvs-paper-2)] hover:bg-white text-[var(--yvs-muted)] hover:text-[var(--yvs-ink)] border border-[var(--yvs-rule)]"
                                        }`}
                                    >
                                        <span className="font-mono text-xs mr-1.5 opacity-80">{step.num}</span>
                                        <span>{step.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Wide Center Stage: Heroic Disassembly Canvas (8 cols) + Active Stage Narrative (4 cols) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center flex-1 min-h-0">
                        {/* LEFT (8 cols): Full-Scale Borderless Scrubbed Canvas */}
                        <div className="lg:col-span-8 relative flex items-center justify-center h-[280px] xs:h-[340px] sm:h-[440px] lg:h-full lg:max-h-[680px] w-full yvs-studio-canvas">
                            <img
                                src={STAGE_STILLS[activeIdx]}
                                alt={`Tahap ${current.num}: ${current.label}`}
                                width="1280"
                                height="720"
                                loading="lazy"
                                decoding="async"
                                className={`w-full h-full object-contain yvs-studio-frame transition-opacity duration-200 ${
                                    canvasReady ? "lg:opacity-0" : "opacity-100"
                                }`}
                            />
                            <canvas
                                ref={canvasRef}
                                aria-hidden="true"
                                className={`hidden lg:block absolute inset-0 w-full h-full yvs-studio-frame transition-opacity duration-200 ${
                                    canvasReady ? "opacity-100" : "opacity-0"
                                }`}
                            />
                        </div>

                        {/* RIGHT (4 cols): Sculptural Stage Copy + Live Progress Spine */}
                        <div className="lg:col-span-4 flex items-start gap-5 min-w-0">
                            <div className="hidden lg:block pt-2 shrink-0" aria-hidden="true">
                                <svg viewBox="0 0 20 280" className="w-5 h-[280px] overflow-visible">
                                    <path
                                        d="M 10 4 L 10 276"
                                        fill="none"
                                        stroke="rgba(7,17,36,0.14)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        ref={spineRef}
                                        d="M 10 4 L 10 276"
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
                                        stroke="#FFFFFF"
                                        strokeWidth="2.5"
                                    />
                                </svg>
                            </div>

                            <div className="space-y-4 min-w-0">
                                <div className="flex items-baseline gap-3">
                                    <span className="font-display font-extrabold text-5xl sm:text-6xl xl:text-[4.25rem] text-[var(--yvs-accent)] tracking-[-0.04em] leading-none tabular-nums">
                                        {current.num}
                                    </span>
                                    <span className="font-display font-bold text-lg sm:text-xl text-[var(--yvs-ink)]">
                                        {current.label}
                                    </span>
                                </div>

                                <h3 className="font-display font-bold text-2xl sm:text-3xl text-[var(--yvs-ink)] tracking-[-0.025em] leading-tight">
                                    {current.title}
                                </h3>

                                <p className="text-sm sm:text-base text-[var(--yvs-muted)] leading-relaxed">
                                    {current.desc}
                                </p>

                                <div className="pt-4 border-t border-[var(--yvs-rule)] space-y-1.5">
                                    <span className="text-xs font-semibold text-[var(--yvs-ink)]">
                                        Tercatat di halaman pelacakan
                                    </span>
                                    <p className="text-sm text-[var(--yvs-muted)] leading-relaxed">
                                        {current.portalNote}
                                    </p>
                                </div>

                                <div className="pt-1">
                                    {activeIdx < SHARED_PROCESS_STEPS.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => handleJumpStep(activeIdx + 1)}
                                            className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-[var(--yvs-accent)] hover:text-[var(--yvs-accent-hover)] cursor-pointer whitespace-nowrap"
                                        >
                                            <span>
                                                Tahap berikutnya: {SHARED_PROCESS_STEPS[activeIdx + 1].label}
                                            </span>
                                            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => smoothScrollToTarget("track-lookup", -72)}
                                            className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-[var(--yvs-accent)] hover:text-[var(--yvs-accent-hover)] cursor-pointer whitespace-nowrap"
                                        >
                                            <span>Cek status tiket sekarang</span>
                                            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
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
