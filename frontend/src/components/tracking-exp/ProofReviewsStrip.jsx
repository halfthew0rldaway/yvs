import { useState, useEffect, useRef } from "react";
import { Star, ArrowUpRight, Pause, Play } from "lucide-react";
import { useInView, animate } from "framer-motion";
import { MaskedLines, usePrefersReducedMotion } from "./MotionPrimitives";

function CountMetric({ to, decimals = 0, suffix = "" }) {
    const reducedMotion = usePrefersReducedMotion();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });
    const [display, setDisplay] = useState(() =>
        decimals > 0 ? to.toFixed(decimals).replace(".", ",") : String(to)
    );

    useEffect(() => {
        if (reducedMotion || !inView) return;
        const controls = animate(0, to, {
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (latest) => {
                setDisplay(
                    decimals > 0
                        ? latest.toFixed(decimals).replace(".", ",")
                        : String(Math.round(latest))
                );
            },
        });
        return () => controls.stop();
    }, [inView, to, decimals, reducedMotion]);

    return (
        <span ref={ref} className="tabular-nums">
            {display}
            {suffix}
        </span>
    );
}

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

export default function ProofReviewsStrip() {
    const reducedMotion = usePrefersReducedMotion();
    const [isPlaying, setIsPlaying] = useState(true);
    const shouldAnimate = isPlaying && !reducedMotion;

    return (
        <section
            id="ulasan"
            className="w-full bg-slate-50 border-b border-slate-200 py-16 sm:py-24 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Reviews Header + Verified Google Maps Score + WCAG Pause/Play Control */}
                <div className="pb-8 sm:pb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 mb-8">
                    <div className="space-y-2.5 max-w-xl">
                        <span className="font-mono text-xs text-blue-600 font-semibold block">
                            04 / ULASAN GOOGLE MAPS
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Pengalaman pelanggan", "di workshop Pekayon."]}
                            className="font-display font-extrabold text-2xl sm:text-4xl text-slate-950 tracking-[-0.03em] leading-[1.12]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        {/* Grounded Verifiable Rating */}
                        <div className="flex items-baseline gap-2 pr-4 sm:pr-6 sm:border-r sm:border-slate-200">
                            <span className="font-display font-extrabold text-3xl sm:text-4xl text-blue-600 tracking-tight leading-none">
                                <CountMetric to={4.7} decimals={1} />
                            </span>
                            <div className="text-xs text-slate-500">
                                <span className="font-mono font-semibold text-slate-800 block">/ 5,0 di Google Maps</span>
                                <span>350+ ulasan pelanggan</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {!reducedMotion && (
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying((prev) => !prev)}
                                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                                >
                                    {isPlaying ? (
                                        <>
                                            <Pause className="w-3.5 h-3.5" />
                                            <span>Jeda ulasan</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5" />
                                            <span>Putar ulasan</span>
                                        </>
                                    )}
                                </button>
                            )}

                            <a
                                href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold transition-colors"
                            >
                                <span>Buka Google Maps</span>
                                <ArrowUpRight className="w-4 h-4 shrink-0" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal Editorial Review Stream */}
            <div className={shouldAnimate ? "overflow-hidden" : "overflow-x-auto px-4 sm:px-6 lg:px-10 xl:px-14"}>
                <div
                    data-playing={shouldAnimate ? "true" : "false"}
                    className={`yvs-exp-review-track gap-4 sm:gap-5 py-2 ${
                        shouldAnimate ? "pl-4" : ""
                    }`}
                >
                    {(shouldAnimate ? [...REVIEWS, ...REVIEWS] : REVIEWS).map((rev, idx) => (
                        <figure
                            key={`${rev.name}-${idx}`}
                            aria-hidden={shouldAnimate && idx >= REVIEWS.length ? "true" : undefined}
                            className="w-[295px] sm:w-[370px] shrink-0 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-0.5 text-amber-500" aria-label="5 dari 5 bintang">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <blockquote className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                                    &ldquo;{rev.quote}&rdquo;
                                </blockquote>
                            </div>
                            <figcaption className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                                <span className="font-bold text-slate-950">{rev.name}</span>
                                <span className="text-slate-500">{rev.service}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
