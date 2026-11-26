import { useEffect, useRef, useState } from "react";
import {
    ClipboardList,
    Search,
    Wrench,
    ShieldCheck,
    PackageCheck,
    ArrowRight,
} from "lucide-react";
import {
    MaskedLines,
    usePrefersReducedMotion,
    smoothScrollToTarget,
} from "./MotionPrimitives";
import { SHARED_PROCESS_STEPS, loadGsapRuntime } from "./motionTokens";

const STEP_ICONS = [ClipboardList, Search, Wrench, ShieldCheck, PackageCheck];

/**
 * Section 02 — Pinned Scroll-Scrubbed Process Timeline
 * Uses the exact same 5-stage language (Diterima -> Diagnosa -> Pengerjaan -> QC -> Siap diambil)
 * as the Tracking Result page.
 * - Desktop (>= 1024px, non-reduced-motion): GSAP ScrollTrigger pinned scrub + SVG MotionPath draw.
 * - Mobile / reduced-motion: thumb-friendly 44px+ interactive step rail without scroll-trapping.
 */
export default function ServiceJourneyTimeline() {
    const [activeIdx, setActiveIdx] = useState(0);
    const sectionRef = useRef(null);
    const pinWrapRef = useRef(null);
    const pathRef = useRef(null);
    const beaconRef = useRef(null);
    const triggerRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined" || !sectionRef.current || !pinWrapRef.current) {
            return;
        }
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        if (!isDesktop) return;

        let cancelled = false;
        let booted = false;
        let ctx = null;

        const boot = () => {
            if (booted || cancelled) return;
            booted = true;
            loadGsapRuntime().then(({ gsap, ScrollTrigger }) => {
                if (cancelled || !sectionRef.current || !pinWrapRef.current) return;

                ctx = gsap.context(() => {
                    const pathEl = pathRef.current;
                    const totalLen = pathEl ? pathEl.getTotalLength() : 400;
                    if (pathEl) {
                        gsap.set(pathEl, {
                            strokeDasharray: totalLen,
                            strokeDashoffset: totalLen,
                        });
                    }

                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: pinWrapRef.current,
                            start: "top top",
                            end: "+=210%",
                            pin: true,
                            scrub: 0.55,
                            anticipatePin: 1,
                            snap: {
                                snapTo: 1 / (SHARED_PROCESS_STEPS.length - 1),
                                duration: { min: 0.18, max: 0.4 },
                                ease: "power2.out",
                            },
                            onUpdate: (self) => {
                                const nextIdx = Math.min(
                                    SHARED_PROCESS_STEPS.length - 1,
                                    Math.round(self.progress * (SHARED_PROCESS_STEPS.length - 1))
                                );
                                setActiveIdx((prev) => (prev === nextIdx ? prev : nextIdx));
                            },
                        },
                    });

                    triggerRef.current = tl.scrollTrigger;

                    if (pathEl) {
                        tl.to(pathEl, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
                    }
                    if (beaconRef.current && pathEl) {
                        tl.to(
                            beaconRef.current,
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
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    observer.disconnect();
                    boot();
                }
            },
            { rootMargin: "320px 0px" }
        );
        observer.observe(sectionRef.current);

        return () => {
            cancelled = true;
            observer.disconnect();
            triggerRef.current = null;
            if (ctx) ctx.revert();
        };
    }, [reducedMotion]);

    const handleSelectStep = (idx) => {
        setActiveIdx(idx);
        const st = triggerRef.current;
        if (st && typeof window !== "undefined" && window.innerWidth >= 1024 && !reducedMotion) {
            const targetScroll =
                st.start + (st.end - st.start) * (idx / (SHARED_PROCESS_STEPS.length - 1));
            const lenis = window.__yvsLenis;
            if (lenis) lenis.scrollTo(targetScroll, { duration: 0.65 });
            else window.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
    };

    const current = SHARED_PROCESS_STEPS[activeIdx];
    const ActiveIcon = STEP_ICONS[activeIdx] || ClipboardList;

    return (
        <section
            id="alur-servis"
            ref={sectionRef}
            className="w-full bg-slate-50 border-b border-slate-200 scroll-mt-16 overflow-x-clip"
        >
            <div
                ref={pinWrapRef}
                className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-16 sm:py-24 lg:min-h-[100dvh] lg:flex lg:flex-col lg:justify-center"
            >
                {/* Editorial Section Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-end pb-7 sm:pb-9 mb-7 sm:mb-9 border-b border-slate-200">
                    <div className="lg:col-span-7 space-y-2.5">
                        <span className="font-mono text-xs text-blue-700 font-semibold block">
                            01 / ALUR PENGERJAAN
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Lima tahap pengerjaan,", "terbuka dari awal hingga selesai."]}
                            className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.5rem] text-slate-950 tracking-[-0.03em] leading-[1.12]"
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                            Urutan tahap yang sama digunakan di halaman pelacakan tiket Anda—gulir atau pilih tahap di bawah untuk melihat apa yang tercatat di tiap langkah.
                        </p>
                    </div>
                </div>

                {/* Desktop Scrubbed SVG Horizontal Track with MotionPath Beacon */}
                <div className="hidden lg:block relative mb-6 px-2" aria-hidden="true">
                    <svg viewBox="0 0 1000 24" className="w-full h-6 overflow-visible">
                        <path
                            d="M 12 12 L 988 12"
                            fill="none"
                            stroke="#CBD5E1"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <path
                            ref={pathRef}
                            d="M 12 12 L 988 12"
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle
                            ref={beaconRef}
                            cx="12"
                            cy="12"
                            r="6"
                            fill="#2563EB"
                            stroke="#FFFFFF"
                            strokeWidth="2.5"
                        />
                    </svg>
                </div>

                {/* 5-Stage Shared Step Selector Rail (44px+ touch targets) */}
                <div
                    role="tablist"
                    aria-label="Tahapan alur servis"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6"
                >
                    {SHARED_PROCESS_STEPS.map((step, idx) => {
                        const isActive = idx === activeIdx;
                        const isPassed = idx < activeIdx;
                        const Icon = STEP_ICONS[idx] || ClipboardList;
                        return (
                            <button
                                key={step.num}
                                role="tab"
                                aria-selected={isActive}
                                type="button"
                                onClick={() => handleSelectStep(idx)}
                                className={`relative text-left min-h-[72px] p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer min-w-0 ${
                                    isActive
                                        ? "bg-[#0B162C] text-white border-[#0B162C] shadow-sm"
                                        : isPassed
                                        ? "bg-blue-50/70 text-slate-950 border-blue-200 hover:bg-blue-50"
                                        : "bg-white hover:bg-blue-50/40 text-slate-900 border-slate-200 hover:border-blue-300"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span
                                        className={`font-mono text-xs font-bold ${
                                            isActive
                                                ? "text-blue-300"
                                                : isPassed
                                                ? "text-blue-700"
                                                : "text-slate-600"
                                        }`}
                                    >
                                        {step.num}
                                    </span>
                                    <Icon
                                        className={`w-4 h-4 shrink-0 ${
                                            isActive
                                                ? "text-blue-300"
                                                : isPassed
                                                ? "text-blue-600"
                                                : "text-slate-600"
                                        }`}
                                        aria-hidden="true"
                                    />
                                </div>
                                <span className="font-display font-bold text-xs sm:text-sm block leading-snug">
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Stage Showcase Panel */}
                <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-8 lg:p-10 shadow-[0_18px_40px_-28px_rgba(11,22,44,0.12)]">
                    <div
                        key={current.num}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center animate-fade-in"
                    >
                        {/* Left Copy */}
                        <div className="lg:col-span-7 space-y-3.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-blue-700">
                                    TAHAP {current.num} / 05
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                    <ActiveIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                    <span>{current.label}</span>
                                </span>
                            </div>

                            <h3 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-slate-950 tracking-tight leading-snug">
                                {current.title}
                            </h3>
                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                                {current.desc}
                            </p>

                            <div className="pt-2">
                                {activeIdx < SHARED_PROCESS_STEPS.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectStep(activeIdx + 1)}
                                        className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
                                    >
                                        <span>
                                            Lanjut ke tahap {SHARED_PROCESS_STEPS[activeIdx + 1].label}
                                        </span>
                                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => smoothScrollToTarget("track-lookup", -80)}
                                        className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
                                    >
                                        <span>Cek nomor servis Anda sekarang</span>
                                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Live Portal Preview Card */}
                        <div className="lg:col-span-5 bg-[#0B162C] text-white rounded-2xl p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
                                <span className="font-mono text-xs text-blue-200">
                                    Yang muncul di halaman pelacakan
                                </span>
                                <span className="font-mono text-xs font-bold text-white tabular-nums">
                                    {current.num} / 05
                                </span>
                            </div>

                            {/* Segmented Progress Bar */}
                            <div className="flex items-center gap-1.5" aria-hidden="true">
                                {SHARED_PROCESS_STEPS.map((s, i) => (
                                    <span
                                        key={s.num}
                                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                            i <= activeIdx ? "bg-blue-500" : "bg-white/20"
                                        }`}
                                    />
                                ))}
                            </div>

                            <p className="text-sm text-slate-200 leading-relaxed">
                                {current.portalNote}
                            </p>

                            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                                <span className="text-slate-300">Status di portal</span>
                                <span className="font-semibold text-blue-300">{current.label}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
