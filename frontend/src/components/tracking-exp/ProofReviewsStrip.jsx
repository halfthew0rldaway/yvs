import { useState, useEffect, useRef } from "react";
import {
    Star,
    ArrowUpRight,
    Pause,
    Play,
    ShieldCheck,
    MoveHorizontal,
    CheckCircle2,
} from "lucide-react";
import { MaskedLines, usePrefersReducedMotion } from "./MotionPrimitives";
import { loadGsapRuntime } from "./motionTokens";

const REVIEWS = [
    {
        name: "Rizky Fajar",
        service: "Servis laptop & upgrade SSD",
        quote: "Pelayanannya jujur dan transparan. Teknisi menjelaskan kerusakannya secara detail tanpa ada biaya tambahan yang ditutup-tutupi.",
    },
    {
        name: "Dewi Anggraini",
        service: "Pembersihan & ganti pasta termal",
        quote: "Buat orang yang kurang paham teknis sangat terbantu karena dijelaskan pelan-pelan. Setiap penggantian suku cadang pasti dikonfirmasi biayanya dulu.",
    },
    {
        name: "Dimas Prasetyo",
        service: "Perbaikan motherboard & engsel",
        quote: "Laptop mati total dan engsel patah diperbaiki dengan rapi. Komponen bekasnya juga dikembalikan dan ada garansinya.",
    },
    {
        name: "Hendro Wijaya",
        service: "PC desktop kantor",
        quote: "Datang konsultasi PC sering restart sendiri, langsung dicek dan diberi opsi solusi yang sesuai anggaran. Komunikatif lewat WhatsApp.",
    },
    {
        name: "Bagus Pratama",
        service: "Perbaikan MacBook",
        quote: "MacBook tidak mau menyala ditangani dengan rapi. Prosesnya jelas, biaya sesuai estimasi awal, dan stafnya ramah saat ditanya perkembangan unit.",
    },
    {
        name: "Siti Nurhaliza",
        service: "Ganti keyboard & baterai",
        quote: "Sebelum dikerjakan selalu diinfokan perkiraan biayanya dulu jadi tenang. Garansi jelas dan teknisinya sopan.",
    },
];

const WARRANTY_TERMS = [
    "Masa garansi sesuai jenis perbaikan & suku cadang yang tertera di nota digital.",
    "Berlaku untuk keluhan yang sama selama segel bengkel utuh dan unit tidak terkena cairan atau benturan ulang.",
    "Cukup tunjukkan nomor servis atau kartu garansi digital di halaman pelacakan saat klaim.",
];

function ScrollCounter({ to, decimals = 0, suffix = "" }) {
    const ref = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    const [display, setDisplay] = useState(() =>
        decimals > 0 ? to.toFixed(decimals).replace(".", ",") : String(to)
    );

    useEffect(() => {
        if (reducedMotion || !ref.current) return;
        let cancelled = false;
        let ctx = null;

        loadGsapRuntime().then(({ gsap, ScrollTrigger }) => {
            if (cancelled || !ref.current) return;
            const obj = { val: 0 };
            ctx = gsap.context(() => {
                gsap.to(obj, {
                    val: to,
                    duration: 1.15,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ref.current,
                        start: "top 90%",
                        once: true,
                    },
                    onUpdate: () => {
                        setDisplay(
                            decimals > 0
                                ? obj.val.toFixed(decimals).replace(".", ",")
                                : String(Math.round(obj.val))
                        );
                    },
                });
            }, ref);
            window.requestAnimationFrame(() => ScrollTrigger.refresh());
        });

        return () => {
            cancelled = true;
            if (ctx) ctx.revert();
        };
    }, [to, decimals, reducedMotion]);

    return (
        <span ref={ref} className="tabular-nums">
            {display}
            {suffix}
        </span>
    );
}

/**
 * Interactive Before/After Comparison Slider
 * Accessible via mouse drag, touch drag, and Left/Right arrow keys.
 * Uses clearly labeled photo placeholders ([REAL_BEFORE_PHOTO_1] / [REAL_AFTER_PHOTO_1])
 * until real workshop photography is provided.
 */
function BeforeAfterSlider() {
    const [percent, setPercent] = useState(50);
    const stageRef = useRef(null);
    const draggingRef = useRef(false);

    const updateFromClientX = (clientX) => {
        const el = stageRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const ratio = ((clientX - rect.left) / rect.width) * 100;
        setPercent(Math.min(92, Math.max(8, Math.round(ratio))));
    };

    const handlePointerDown = (e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
    };

    const handlePointerMove = (e) => {
        if (!draggingRef.current) return;
        updateFromClientX(e.clientX);
    };

    const handlePointerUp = (e) => {
        draggingRef.current = false;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            setPercent((p) => Math.max(8, p - 5));
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            setPercent((p) => Math.min(92, p + 5));
        } else if (e.key === "Home") {
            e.preventDefault();
            setPercent(10);
        } else if (e.key === "End") {
            e.preventDefault();
            setPercent(90);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <span className="font-mono text-xs font-semibold text-blue-700 block">
                        DOKUMENTASI SEBELUM &amp; SESUDAH
                    </span>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-slate-950 mt-0.5">
                        Contoh perbandingan kondisi unit
                    </h3>
                </div>
                <span className="font-mono text-xs text-slate-600">
                    Geser pembatas ({percent}%)
                </span>
            </div>

            <div
                ref={stageRef}
                role="slider"
                tabIndex={0}
                aria-label="Perbandingan foto sebelum dan sesudah perbaikan"
                aria-valuemin={8}
                aria-valuemax={92}
                aria-valuenow={percent}
                data-cursor="Geser"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onKeyDown={handleKeyDown}
                className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200 select-none touch-none cursor-ew-resize bg-white"
            >
                {/* AFTER Layer (Full width base) */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col justify-between p-5 sm:p-7">
                    <div className="flex justify-end">
                        <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold">
                            SESUDAH PERBAIKAN
                        </span>
                    </div>
                    <div className="max-w-sm ml-auto text-right space-y-1.5">
                        <p className="font-mono text-xs font-semibold text-blue-700">
                            [REAL_AFTER_PHOTO_1]
                        </p>
                        <p className="font-display font-bold text-base sm:text-lg text-slate-950">
                            Unit bersih, kipas lancar &amp; lolos uji fungsi
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600">
                            Ganti dengan foto asli hasil pembersihan/perbaikan dari arsip bengkel YVS.
                        </p>
                    </div>
                </div>

                {/* BEFORE Layer (Clipped by slider percentage) */}
                <div
                    style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
                    className="absolute inset-0 bg-[#0B162C] text-white flex flex-col justify-between p-5 sm:p-7"
                >
                    <div className="flex justify-start">
                        <span className="px-3 py-1 rounded-lg bg-white/15 border border-white/25 text-white font-mono text-xs font-bold">
                            SEBELUM MASUK
                        </span>
                    </div>
                    <div className="max-w-sm space-y-1.5">
                        <p className="font-mono text-xs font-semibold text-blue-300">
                            [REAL_BEFORE_PHOTO_1]
                        </p>
                        <p className="font-display font-bold text-base sm:text-lg text-white">
                            Debu menumpuk di heatsink &amp; pasta mengering
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300">
                            Ganti dengan foto asli kondisi awal unit saat diterima di meja penerimaan.
                        </p>
                    </div>
                </div>

                {/* Vertical Divider Handle */}
                <div
                    style={{ left: `${percent}%` }}
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 -translate-x-1/2 w-[2px] bg-blue-600 pointer-events-none"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-blue-600 shadow-lg flex items-center justify-center text-blue-700">
                        <MoveHorizontal className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProofReviewsStrip() {
    const reducedMotion = usePrefersReducedMotion();
    const [isPlaying, setIsPlaying] = useState(true);
    const trackRef = useRef(null);
    const shouldAnimate = isPlaying && !reducedMotion;

    // Velocity-linked smooth marquee using GSAP ticker (transform-only, zero layout thrash)
    useEffect(() => {
        if (!shouldAnimate || !trackRef.current) return;
        let cancelled = false;
        let cleanup = null;

        loadGsapRuntime().then(({ gsap }) => {
            if (cancelled || !trackRef.current) return;
            const track = trackRef.current;
            let offset = 0;
            let hovered = false;

            const onEnter = () => {
                hovered = true;
            };
            const onLeave = () => {
                hovered = false;
            };
            track.addEventListener("pointerenter", onEnter);
            track.addEventListener("pointerleave", onLeave);

            const tick = () => {
                if (hovered) return;
                const halfWidth = track.scrollWidth / 2;
                if (halfWidth <= 0) return;
                const velocityBoost = Math.min(3.5, Math.abs(window.__yvsScrollVelocity || 0) * 0.08);
                offset += 0.65 + velocityBoost;
                if (offset >= halfWidth) offset -= halfWidth;
                track.style.transform = `translate3d(${-offset}px, 0, 0)`;
            };

            gsap.ticker.add(tick);

            cleanup = () => {
                gsap.ticker.remove(tick);
                track.removeEventListener("pointerenter", onEnter);
                track.removeEventListener("pointerleave", onLeave);
                track.style.transform = "";
            };
        });

        return () => {
            cancelled = true;
            if (cleanup) cleanup();
        };
    }, [shouldAnimate]);

    return (
        <section
            id="ulasan"
            className="w-full bg-slate-50 border-b border-slate-200 py-16 sm:py-24 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Header */}
                <div className="pb-8 sm:pb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 mb-10">
                    <div className="space-y-2.5 max-w-xl">
                        <span className="font-mono text-xs text-blue-700 font-semibold block">
                            03 / BUKTI, GARANSI &amp; ULASAN
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Hasil pengerjaan &", "pengalaman pelanggan."]}
                            className="font-display font-extrabold text-2xl sm:text-4xl text-slate-950 tracking-[-0.03em] leading-[1.12]"
                        />
                    </div>

                    {/* Verified Numbers + Placeholder Slot */}
                    <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-2 lg:pt-0">
                        <div className="space-y-1">
                            <p className="font-display font-extrabold text-2xl sm:text-4xl text-blue-600 leading-none">
                                <ScrollCounter to={4.7} decimals={1} />
                            </p>
                            <p className="text-xs font-semibold text-slate-800">/ 5,0 Google Maps</p>
                        </div>
                        <div className="space-y-1 border-l border-slate-200 pl-4 sm:pl-6">
                            <p className="font-display font-extrabold text-2xl sm:text-4xl text-slate-950 leading-none">
                                <ScrollCounter to={350} suffix="+" />
                            </p>
                            <p className="text-xs font-semibold text-slate-800">Ulasan terverifikasi</p>
                        </div>
                        <div className="space-y-1 border-l border-slate-200 pl-4 sm:pl-6">
                            <p className="font-mono font-bold text-sm sm:text-base text-slate-950 leading-tight">
                                [REAL_UNITS_REPAIRED]
                            </p>
                            <p className="text-xs font-semibold text-slate-600">Total unit ditangani</p>
                        </div>
                    </div>
                </div>

                {/* Before/After Drag Slider + Real Warranty Terms */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12 sm:mb-14">
                    <div className="lg:col-span-7">
                        <BeforeAfterSlider />
                    </div>

                    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <div>
                                <span className="font-mono text-xs font-semibold text-blue-700 block">
                                    KETENTUAN GARANSI RESMI
                                </span>
                                <h3 className="font-display font-bold text-lg text-slate-950">
                                    Jelas dan tercatat di nota
                                </h3>
                            </div>
                        </div>

                        <ul className="space-y-3.5">
                            {WARRANTY_TERMS.map((term, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-1" aria-hidden="true" />
                                    <span>{term}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <a
                                href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B162C] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
                            >
                                <span>Baca ulasan di Google Maps</span>
                                <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                            </a>

                            {!reducedMotion && (
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying((prev) => !prev)}
                                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {isPlaying ? (
                                        <>
                                            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                                            <span>Jeda ulasan</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5" aria-hidden="true" />
                                            <span>Putar ulasan</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Velocity-Linked Editorial Review Marquee */}
            <div className={shouldAnimate ? "overflow-hidden" : "overflow-x-auto px-4 sm:px-6 lg:px-10 xl:px-14"}>
                <div
                    ref={trackRef}
                    className={`yvs-exp-review-track gap-4 sm:gap-5 py-2 ${shouldAnimate ? "pl-4" : ""}`}
                >
                    {(shouldAnimate ? [...REVIEWS, ...REVIEWS] : REVIEWS).map((rev, idx) => (
                        <figure
                            key={`${rev.name}-${idx}`}
                            aria-hidden={shouldAnimate && idx >= REVIEWS.length ? "true" : undefined}
                            className="w-[300px] sm:w-[380px] shrink-0 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5"
                        >
                            <div className="space-y-3">
                                <div
                                    role="img"
                                    aria-label="5 dari 5 bintang"
                                    className="flex items-center gap-0.5 text-amber-500"
                                >
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className="w-4 h-4 fill-amber-400 text-amber-500"
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                                <blockquote className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                                    &ldquo;{rev.quote}&rdquo;
                                </blockquote>
                            </div>
                            <figcaption className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                                <span className="font-bold text-slate-950">{rev.name}</span>
                                <span className="text-slate-600">{rev.service}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
