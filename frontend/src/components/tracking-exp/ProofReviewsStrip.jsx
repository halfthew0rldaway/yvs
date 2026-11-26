import { useState, useEffect, useRef, useMemo } from "react";
import { Star, ArrowUpRight, Pause, Play, Check } from "lucide-react";
import { MaskedLines, usePrefersReducedMotion } from "./MotionPrimitives";
import { loadGsapRuntime } from "./motionTokens";
import VerticalMarquee from "./VerticalMarquee";

// 16 ulasan bintang-5 aktual & utuh dari listing resmi Google Maps Komputerawet.Com By: Yangversa Computer
const REVIEWS = [
    {
        id: "deddy",
        initials: "DM",
        name: "Deddy Muchtaridy",
        dateText: "3 bulan lalu",
        quote: "Sering lihat papan namanya cukup aneh Yangversa, sekali waktu laptop rusak jadinya mampir ke sini. Bagus pelayanan FO dan hasil kerja teknisinya juga bagus.. Setiap ada progres dilaporkan sebelum diambil tindakan yg berkonsekuensi biaya.",
    },
    {
        id: "rizka",
        initials: "RE",
        name: "rizka elinda",
        dateText: "2 minggu lalu",
        quote: "Di rekomendasi oleh rekan kerja untuk service di yangversa computer untuk service engsel laptop yang rusak. Alhamdulillah pelayanannya baik, ramah dan sangat membantu sekali. Terima kasih.",
    },
    {
        id: "pelita",
        initials: "PM",
        name: "pelita menembak",
        dateText: "3 minggu lalu",
        quote: "Layanan maksimal. Ramah dan customer diajak diskusi dulu ttg kerusakan. Jadi bisa paham ttg komputer juga. Recomended untuk wil. Bekasi",
    },
    {
        id: "aulia",
        initials: "AR",
        name: "Aulia Rahma",
        dateText: "2 minggu lalu",
        quote: "Pertama kali service laptop di yangversa computer, Alhamdulillah pelayanan sangat memuaskan dan sangat amat membantu. Terima kasih yangversa computer.",
    },
    {
        id: "emil",
        initials: "EI",
        name: "Emil Iskandar",
        dateText: "4 bulan lalu",
        quote: "Service keyboard laptop Infinix anak saya dikerjakan dengan cepat dan rapi. Hasilnya bagus, harga wajar, dan pelayanannya ramah. Terima kasih!",
    },
    {
        id: "alfiraas",
        initials: "AB",
        name: "Alfiraas Bagdja",
        dateText: "1 tahun lalu",
        quote: "mantap! udah bertahun tahun benerin komputer, laptop, dll. ga pernah ngecewain. cepet ngerjainnya, dan hasilnya bagus banget!",
    },
    {
        id: "rustam",
        initials: "RF",
        name: "Rustam Effendi",
        dateText: "5 tahun lalu",
        quote: "Tempat service laptop yang kompeten, dengan analisa kerusakan yang detail dan menyeluruh. Di tangani teknisi yang handal. Jika hanya di analisa dan pengecekan kerusakan laptop FREE alias gratis, ga selesai ga usah bayar, garansi service ditangani dengan baik setelah service. Mantap, jujur dan terpercaya....Recommended banget",
    },
    {
        id: "surya",
        initials: "SP",
        name: "Surya Perkasa",
        dateText: "3 bulan lalu",
        quote: "Alhamdulillah pelayanannya ramah, dan hasil kerjanya baik.",
    },
    {
        id: "ariyanto",
        initials: "AS",
        name: "Ariyanto Sie",
        dateText: "2 tahun lalu",
        quote: "Proses nya sangat profesional.. pengecekan kerusakan dg laporan yg detail dan kita di beri beberapa alternatif perbaikan dg biayanya..serta garansi... top & memuaskan",
    },
    {
        id: "dhimas",
        initials: "DH",
        name: "Dhimas Harjanto",
        dateText: "2 tahun lalu",
        quote: "Sudah 2 kali service laptop di sini. Hasil pengecekan dijelaskan dengan sangat baik Hasil pengerjaan rapih dan cepat. Jadi kepercayaan kalau ada masalah dengan komputer.",
    },
    {
        id: "yulina",
        initials: "YL",
        name: "Yulina",
        dateText: "2 tahun lalu",
        quote: "Pelayanan baik. Admin fast respon. Harga minimalis. Mengerti akan mahasiswi heheheh sukses terus yangversa",
    },
    {
        id: "lukky",
        initials: "LM",
        name: "lukky man",
        dateText: "8 bulan lalu",
        quote: "service nya memuaskan dan di cek detail lptop dsebelum dan sesudahnya keren.puas rekomen banget",
    },
    {
        id: "joanes",
        initials: "JL",
        name: "Joanes Leonardi",
        dateText: "8 bulan lalu",
        quote: "Petugas servis berpengalaman dan mahir di bidang nya, bisa servis printer canon, laptop, layar monitor, isi ulang catridge dan lain-lain. Serta parkiran luas",
    },
    {
        id: "lucky",
        initials: "LM",
        name: "lucky meeting",
        dateText: "9 bulan lalu",
        quote: "Sudah berkali kali sy service disini dan merasa puas baik service dan harga. Rekomen banget deh",
    },
    {
        id: "sanli",
        initials: "SS",
        name: "Sanli Sanjaya",
        dateText: "3 bulan lalu",
        quote: "Servis printer sudah 2 kali... Sgt puas",
    },
    {
        id: "djunaidy",
        initials: "DS",
        name: "Djunaidy Small",
        dateText: "1 tahun lalu",
        quote: "Sangat cepat murah tepat waktu ...komunikasi baik, sblm dikerjakan dikonfirmasi trlbh dahulu hingga persetujuan.. terima kasih Yangversa Pekayon ..",
    },
];

const WARRANTY_POINTS = [
    "Masa garansi sesuai jenis pengerjaan dan suku cadang yang tertera di nota digital.",
    "Berlaku selama segel bengkel utuh dan unit tidak terkena cairan atau benturan ulang.",
    "Klaim cukup menunjukkan nomor servis atau kartu garansi di halaman pelacakan.",
];

function partitionReviews(items, colCount = 4) {
    const buckets = Array.from({ length: colCount }, () => []);
    items.forEach((item, idx) => {
        buckets[idx % colCount].push(item);
    });
    return buckets;
}

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

function EditorialReviewCard({ review }) {
    return (
        <figure className="w-[178px] sm:w-[245px] lg:w-[278px] shrink-0 rounded-2xl bg-[var(--yvs-obsidian-2)] border border-white/12 p-3.5 sm:p-5 flex flex-col justify-between gap-3.5 sm:gap-4 shadow-[0_14px_34px_-16px_rgba(2,6,23,0.75)] transition-colors duration-200 hover:border-blue-400/35">
            <div className="space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                    <div
                        role="img"
                        aria-label="5 dari 5 bintang"
                        className="flex items-center gap-0.5 text-amber-400"
                    >
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                                key={s}
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400"
                                aria-hidden="true"
                            />
                        ))}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-blue-300 bg-blue-500/12 border border-blue-400/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {review.dateText}
                    </span>
                </div>

                <blockquote className="text-xs sm:text-[13.5px] text-slate-100 leading-relaxed">
                    &ldquo;{review.quote}&rdquo;
                </blockquote>
            </div>

            <figcaption className="pt-2.5 sm:pt-3 border-t border-white/10 flex items-center gap-2 sm:gap-2.5">
                <span
                    aria-hidden="true"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-semibold text-blue-300 shrink-0"
                >
                    {review.initials}
                </span>
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {review.name}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                        Ulasan Google Maps
                    </p>
                </div>
            </figcaption>
        </figure>
    );
}

/**
 * ACT IV — Full-Bleed Obsidian Navy Proof & 3D Tiled Vertical Review Wall (#071124)
 */
export default function ProofReviewsStrip() {
    const reducedMotion = usePrefersReducedMotion();
    const [isPlaying, setIsPlaying] = useState(true);

    const lanes = useMemo(() => {
        const [col1, col2, col3, col4] = partitionReviews(REVIEWS, 4);
        return [
            {
                id: "lane-1",
                reverse: false,
                duration: "38s",
                className: "flex",
                items: col1,
            },
            {
                id: "lane-2",
                reverse: true,
                duration: "42s",
                className: "flex",
                items: col2,
            },
            {
                id: "lane-3",
                reverse: false,
                duration: "40s",
                className: "hidden md:flex",
                items: col3,
            },
            {
                id: "lane-4",
                reverse: true,
                duration: "44s",
                className: "hidden lg:flex",
                items: col4,
            },
        ];
    }, []);

    const isPaused = !isPlaying || reducedMotion;

    return (
        <section
            id="ulasan"
            className="w-full bg-[var(--yvs-obsidian)] text-white py-20 sm:py-28 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
                {/* Clean Asymmetric Proof & Warranty Band */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end pb-14 sm:pb-16 border-b border-white/12">
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
                                    <ScrollCounter to={355} />
                                </p>
                                <p className="text-xs sm:text-sm text-slate-300 mt-2.5">
                                    Ulasan di Google Maps
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
                                    aria-pressed={!isPlaying}
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

                {/* Architectural 3D Perspective Tiled Vertical Review Wall */}
                {reducedMotion ? (
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {REVIEWS.slice(0, 8).map((rev) => (
                            <EditorialReviewCard key={rev.id} review={rev} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-12 sm:mt-16">
                        <div className="yvs-review-3d-stage relative h-[430px] sm:h-[490px] lg:h-[540px] w-full rounded-3xl border border-white/10 bg-[var(--yvs-obsidian)] overflow-hidden flex items-center justify-center">
                            <div className="yvs-review-3d-plane flex flex-row items-center justify-center gap-3.5 sm:gap-5 h-[145%]">
                                {lanes.map((lane, laneIdx) => (
                                    <div
                                        key={lane.id}
                                        aria-hidden={laneIdx > 0 ? "true" : undefined}
                                        className={`${lane.className} h-full`}
                                    >
                                        <VerticalMarquee
                                            reverse={lane.reverse}
                                            paused={isPaused}
                                            pauseOnHover
                                            repeat={2}
                                            duration={lane.duration}
                                            gap="1rem"
                                            className="h-full"
                                        >
                                            {lane.items.map((rev) => (
                                                <EditorialReviewCard
                                                    key={`${lane.id}-${rev.id}`}
                                                    review={rev}
                                                />
                                            ))}
                                        </VerticalMarquee>
                                    </div>
                                ))}
                            </div>

                            {/* Directional Obsidian Edge Vignettes blending cards into section canvas */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[var(--yvs-obsidian)] via-[var(--yvs-obsidian)]/65 to-transparent"
                            />
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[var(--yvs-obsidian)] via-[var(--yvs-obsidian)]/65 to-transparent"
                            />
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-24 bg-gradient-to-r from-[var(--yvs-obsidian)] via-[var(--yvs-obsidian)]/55 to-transparent"
                            />
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-24 bg-gradient-to-l from-[var(--yvs-obsidian)] via-[var(--yvs-obsidian)]/55 to-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
