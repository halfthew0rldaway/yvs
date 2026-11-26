import { useState, useEffect, useRef } from "react";
import { Star, ArrowUpRight, Pause, Play, Check } from "lucide-react";
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
        service: "Pembersihan & pasta termal",
        quote: "Buat orang yang kurang paham teknis sangat terbantu karena dijelaskan pelan-pelan. Setiap penggantian suku cadang selalu dikonfirmasi dulu.",
    },
    {
        name: "Dimas Prasetyo",
        service: "Perbaikan mesin & engsel",
        quote: "Laptop mati total dan engsel patah diperbaiki dengan rapi. Komponen bekasnya juga dikembalikan dan ada garansinya.",
    },
    {
        name: "Hendro Wijaya",
        service: "PC desktop kantor",
        quote: "Datang konsultasi PC sering restart sendiri, langsung dicek dan diberi opsi solusi sesuai anggaran. Komunikatif lewat WhatsApp.",
    },
    {
        name: "Bagus Pratama",
        service: "Perbaikan MacBook",
        quote: "MacBook tidak mau menyala ditangani dengan rapi. Prosesnya jelas, biaya sesuai estimasi awal, dan stafnya ramah saat ditanya progres.",
    },
    {
        name: "Siti Nurhaliza",
        service: "Ganti keyboard & baterai",
        quote: "Sebelum dikerjakan selalu diinfokan perkiraan biayanya dulu jadi tenang. Garansi jelas dan teknisinya sopan.",
    },
];

const WARRANTY_POINTS = [
    "Masa garansi sesuai jenis pengerjaan dan suku cadang yang tertera di nota digital.",
    "Berlaku selama segel bengkel utuh dan unit tidak terkena cairan atau benturan ulang.",
    "Klaim cukup menunjukkan nomor servis atau kartu garansi di halaman pelacakan.",
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

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                observer.disconnect();
                loadGsapRuntime().then(({ gsap }) => {
                    if (cancelled || !ref.current) return;
                    const obj = { val: 0 };
                    ctx = gsap.context(() => {
                        gsap.to(obj, {
                            val: to,
                            duration: 1.05,
                            ease: "power3.out",
                            onUpdate: () => {
                                setDisplay(
                                    decimals > 0
                                        ? obj.val.toFixed(decimals).replace(".", ",")
                                        : String(Math.round(obj.val))
                                );
                            },
                        });
                    }, ref);
                });
            },
            { threshold: 0.2 }
        );
        observer.observe(ref.current);

        return () => {
            cancelled = true;
            observer.disconnect();
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
 * ACT IV — Full-Bleed Obsidian Navy Proof & Velocity Reviews Chapter (#071124)
 */
export default function ProofReviewsStrip() {
    const reducedMotion = usePrefersReducedMotion();
    const [isPlaying, setIsPlaying] = useState(true);
    const sectionRef = useRef(null);
    const trackRef = useRef(null);
    const shouldAnimate = isPlaying && !reducedMotion;

    // Velocity-linked smooth marquee with cached ResizeObserver width (zero layout thrash)
    useEffect(() => {
        if (!shouldAnimate || !trackRef.current || !sectionRef.current) return;
        let cancelled = false;
        let booted = false;
        let isVisible = false;
        let cleanup = null;

        const bootMarquee = () => {
            if (booted || cancelled) return;
            booted = true;
            loadGsapRuntime().then(({ gsap }) => {
                if (cancelled || !trackRef.current) return;
                const track = trackRef.current;
                let offset = 0;
                let hovered = false;
                let halfWidth = track.scrollWidth / 2;

                const ro = new ResizeObserver(() => {
                    halfWidth = track.scrollWidth / 2;
                });
                ro.observe(track);

                const onEnter = () => {
                    hovered = true;
                };
                const onLeave = () => {
                    hovered = false;
                };
                track.addEventListener("pointerenter", onEnter);
                track.addEventListener("pointerleave", onLeave);

                const tick = () => {
                    if (hovered || !isVisible || halfWidth <= 0) return;
                    const boost = Math.min(3.5, Math.abs(window.__yvsScrollVelocity || 0) * 0.08);
                    offset += 0.6 + boost;
                    if (offset >= halfWidth) offset -= halfWidth;
                    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
                };

                gsap.ticker.add(tick);

                cleanup = () => {
                    ro.disconnect();
                    gsap.ticker.remove(tick);
                    track.removeEventListener("pointerenter", onEnter);
                    track.removeEventListener("pointerleave", onLeave);
                    track.style.transform = "";
                };
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                isVisible = entries.some((e) => e.isIntersecting);
                if (isVisible) bootMarquee();
            },
            { rootMargin: "120px 0px" }
        );
        observer.observe(sectionRef.current);

        return () => {
            cancelled = true;
            observer.disconnect();
            if (cleanup) cleanup();
        };
    }, [shouldAnimate]);

    return (
        <section
            id="ulasan"
            ref={sectionRef}
            className="w-full bg-[var(--yvs-obsidian)] text-white py-20 sm:py-28 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
                {/* Clean Asymmetric Proof & Warranty Band */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end pb-14 sm:pb-18 border-b border-white/12">
                    {/* LEFT: Monumental Verified Rating */}
                    <div className="lg:col-span-6 space-y-8">
                        <MaskedLines
                            as="h2"
                            lines={["Dipercaya pelanggan", "di Bekasi Selatan."]}
                            className="font-display font-extrabold text-3xl sm:text-5xl lg:text-[3.5rem] text-white tracking-[-0.04em] leading-[1.05]"
                        />

                        <div className="flex items-end gap-8 sm:gap-12 pt-2">
                            <div>
                                <p className="font-display font-extrabold text-5xl sm:text-7xl text-blue-400 tracking-[-0.04em] leading-none">
                                    <ScrollCounter to={4.7} decimals={1} />
                                </p>
                                <p className="text-xs sm:text-sm text-slate-300 mt-2.5">
                                    Rating dari 5,0 di Google Maps
                                </p>
                            </div>
                            <div className="pl-8 sm:pl-12 border-l border-white/15">
                                <p className="font-display font-extrabold text-5xl sm:text-7xl text-white tracking-[-0.04em] leading-none">
                                    <ScrollCounter to={350} suffix="+" />
                                </p>
                                <p className="text-xs sm:text-sm text-slate-300 mt-2.5">
                                    Ulasan pelanggan
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Grounded Warranty Terms + Actions */}
                    <div className="lg:col-span-6 space-y-6">
                        <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                            Garansi tercatat jelas di setiap nota digital
                        </h3>

                        <ul className="space-y-3">
                            {WARRANTY_POINTS.map((point, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-3 text-sm sm:text-base text-slate-200 leading-relaxed"
                                >
                                    <Check
                                        className="w-4 h-4 text-blue-400 shrink-0 mt-1.5"
                                        aria-hidden="true"
                                    />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <a
                                href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--yvs-accent)] hover:bg-[var(--yvs-accent-hover)] text-[var(--yvs-accent-ink)] text-sm font-semibold transition-colors whitespace-nowrap"
                            >
                                <span>Lihat ulasan di Google Maps</span>
                                <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                            </a>

                            {!reducedMotion && (
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying((prev) => !prev)}
                                    className="min-h-[46px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/20 hover:border-white/40 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
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

            {/* Velocity-Reactive Dark Review Ticker */}
            <div
                className={`mt-12 sm:mt-16 ${
                    shouldAnimate ? "overflow-hidden" : "overflow-x-auto px-5 sm:px-8 lg:px-12"
                }`}
            >
                <div
                    ref={trackRef}
                    className={`yvs-exp-review-track gap-5 py-2 ${shouldAnimate ? "pl-5" : ""}`}
                >
                    {(shouldAnimate ? [...REVIEWS, ...REVIEWS] : REVIEWS).map((rev, idx) => (
                        <figure
                            key={`${rev.name}-${idx}`}
                            aria-hidden={shouldAnimate && idx >= REVIEWS.length ? "true" : undefined}
                            className="w-[310px] sm:w-[390px] shrink-0 bg-[var(--yvs-obsidian-2)] border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-6"
                        >
                            <div className="space-y-3.5">
                                <div
                                    role="img"
                                    aria-label="5 dari 5 bintang"
                                    className="flex items-center gap-0.5 text-amber-400"
                                >
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className="w-4 h-4 fill-amber-400 text-amber-400"
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                                <blockquote className="text-sm sm:text-base text-slate-100 leading-relaxed">
                                    &ldquo;{rev.quote}&rdquo;
                                </blockquote>
                            </div>
                            <figcaption className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-white">{rev.name}</span>
                                <span className="text-slate-300">{rev.service}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
