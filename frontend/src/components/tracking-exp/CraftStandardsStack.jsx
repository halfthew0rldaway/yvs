import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MaskedLines, usePrefersReducedMotion } from "./MotionPrimitives";

gsap.registerPlugin(ScrollTrigger);

const STANDARDS = [
    {
        num: "01",
        kicker: "Tanpa biaya tersembunyi",
        title: "Estimasi biaya jelas sebelum dikerjakan.",
        body: "Setelah unit diperiksa, kami kirimkan rincian kerusakan dan perkiraan biayanya. Jika belum cocok, perangkat tetap bisa Anda ambil tanpa biaya cek sama sekali.",
        highlight: "Rp 0 biaya cek jika batal",
        accent: "border-t-blue-600",
    },
    {
        num: "02",
        kicker: "Bukti pengerjaan terbuka",
        title: "Foto proses & komponen lama dikembalikan utuh.",
        body: "Anda tidak perlu menebak apa yang dikerjakan di dalam ruang servis. Foto kondisi awal, foto komponen yang diganti, dan bagian bekasnya kami serahkan kembali.",
        highlight: "Dokumentasi foto di portal ini",
        accent: "border-t-emerald-600",
    },
    {
        num: "03",
        kicker: "Pilihan sesuai anggaran",
        title: "Suku cadang original atau kompatibel, Anda yang memilih.",
        body: "Kami jelaskan kelebihan tiap opsi suku cadang secara jujur sesuai kebutuhan pemakaian harian Anda, tanpa memaksa memilih yang paling mahal.",
        highlight: "Konsultasi jujur tanpa paksaan",
        accent: "border-t-slate-900",
    },
    {
        num: "04",
        kicker: "Uji 25 titik & garansi",
        title: "Diperiksa menyeluruh sebelum pulang, bergaransi resmi.",
        body: "Sebelum unit dinyatakan selesai, teknisi menguji layar, tombol, audio, port, suhu, dan kestabilan baterai. Sertifikat garansi digital 30–90 hari langsung aktif.",
        highlight: "Garansi tersimpan otomatis",
        accent: "border-t-amber-600",
    },
];

export default function CraftStandardsStack() {
    const containerRef = useRef(null);
    const railFillRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || !containerRef.current) return;
        const isDesktop = window.innerWidth >= 1024;
        if (!isDesktop) return;

        const ctx = gsap.context(() => {
            // Vertical scroll progress rail on left editorial column
            if (railFillRef.current) {
                gsap.fromTo(
                    railFillRef.current,
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        ease: "none",
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: "top 35%",
                            end: "bottom 75%",
                            scrub: true,
                        },
                    }
                );
            }

            // Progressively stacking cards subtle depth scale-down as next card arrives
            const cards = gsap.utils.toArray("[data-stack-card]");
            cards.forEach((card, i) => {
                if (i === cards.length - 1) return;
                gsap.to(card, {
                    scale: 0.955,
                    opacity: 0.84,
                    ease: "none",
                    scrollTrigger: {
                        trigger: cards[i + 1],
                        start: "top 68%",
                        end: "top 24%",
                        scrub: true,
                    },
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, [reducedMotion]);

    return (
        <section
            id="standar"
            ref={containerRef}
            className="w-full bg-white border-b border-slate-200 py-16 sm:py-24 scroll-mt-16"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                    {/* Left Sticky Manifesto Column */}
                    <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                        <div className="space-y-3">
                            <span className="font-mono text-xs text-blue-600 font-semibold block">
                                03 / STANDAR KERJA YVS
                            </span>
                            <MaskedLines
                                as="h2"
                                lines={["Empat hal yang", "selalu kami jaga."]}
                                className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.75rem] text-slate-950 tracking-[-0.03em] leading-[1.08]"
                            />
                        </div>

                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md">
                            Banyak orang ragu menservis komputer karena takut biayanya membengkak atau komponen ditukar. Kami membangun alur kerja yang terbuka supaya Anda tetap tenang.
                        </p>

                        {/* Scroll-Driven Vertical Progress Hairline */}
                        <div className="hidden lg:flex items-center gap-4 pt-2">
                            <div className="w-[2px] h-28 bg-slate-200 rounded-full overflow-hidden relative">
                                <div
                                    ref={railFillRef}
                                    className="w-full h-full bg-blue-600 origin-top"
                                />
                            </div>
                            <div className="space-y-1.5 text-xs text-slate-500">
                                <p className="font-semibold text-slate-900">Pemeriksaan 25 titik uji mutu</p>
                                <p className="leading-relaxed max-w-[260px]">
                                    Suhu prosesor, kestabilan daya, pengisian baterai, port USB/HDMI, keyboard, audio, hingga layar dicek satu per satu.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Progressively Stacking Cards */}
                    <div className="lg:col-span-7 space-y-4 lg:space-y-6">
                        {STANDARDS.map((item, idx) => (
                            <article
                                key={item.num}
                                data-stack-card
                                style={
                                    !reducedMotion
                                        ? { top: `calc(5.5rem + ${idx * 18}px)` }
                                        : undefined
                                }
                                className={`lg:sticky bg-slate-50 border border-slate-200 border-t-[3px] ${item.accent} rounded-2xl p-6 sm:p-8 shadow-[0_14px_34px_-22px_rgba(15,23,42,0.2)] will-change-transform origin-top`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200/80">
                                    <span className="font-mono text-xs font-bold text-slate-500">
                                        {item.num} / {item.kicker}
                                    </span>
                                    <span className="font-mono text-xs font-semibold text-slate-800">
                                        {item.highlight}
                                    </span>
                                </div>

                                <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-950 tracking-tight leading-snug mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                                    {item.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
