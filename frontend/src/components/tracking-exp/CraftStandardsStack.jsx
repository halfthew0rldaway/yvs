import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MaskedLines, usePrefersReducedMotion } from "./MotionPrimitives";

gsap.registerPlugin(ScrollTrigger);

const STANDARDS = [
    {
        num: "01",
        kicker: "Konfirmasi di awal",
        title: "Estimasi biaya disampaikan sebelum pengerjaan.",
        body: "Setelah perangkat diperiksa, kami informasikan temuan kerusakan beserta perkiraan biayanya terlebih dulu. Pengerjaan baru dilanjutkan setelah Anda menyetujuinya.",
        accent: "border-t-blue-600",
    },
    {
        num: "02",
        kicker: "Terbuka & mudah dicek",
        title: "Foto kondisi dan progres tercatat di nomor servis.",
        body: "Foto awal perangkat, catatan pemeriksaan, hingga rincian komponen yang digunakan dapat Anda pantau langsung lewat halaman pelacakan ini.",
        accent: "border-t-emerald-600",
    },
    {
        num: "03",
        kicker: "Sesuai kebutuhan",
        title: "Pilihan suku cadang dibahas bersama pemilik.",
        body: "Jika ada komponen yang perlu diganti, kami sampaikan opsi yang tersedia sesuai ketersediaan dan anggaran Anda tanpa paksaan.",
        accent: "border-t-slate-900",
    },
    {
        num: "04",
        kicker: "Tercatat rapi",
        title: "Nota dan catatan garansi tersimpan digital.",
        body: "Setelah serah terima unit, rincian pembayaran dan masa garansi sesuai jenis perbaikan tersimpan di sistem agar mudah diakses bila suatu saat diperlukan.",
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

            const cards = gsap.utils.toArray("[data-stack-card]");
            cards.forEach((card, i) => {
                if (i === cards.length - 1) return;
                gsap.to(card, {
                    scale: 0.96,
                    opacity: 0.86,
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
                                03 / PRINSIP KERJA
                            </span>
                            <MaskedLines
                                as="h2"
                                lines={["Cara kami bekerja", "menangani perangkat Anda."]}
                                className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.65rem] text-slate-950 tracking-[-0.03em] leading-[1.08]"
                            />
                        </div>

                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md">
                            Kami menjaga komunikasi tetap sederhana dan jelas—mulai dari pencatatan saat unit diterima hingga pengecekan bersama saat pengambilan.
                        </p>

                        {/* Scroll-Driven Vertical Progress Hairline */}
                        <div className="hidden lg:flex items-center gap-4 pt-2">
                            <div className="w-[2px] h-24 bg-slate-200 rounded-full overflow-hidden relative">
                                <div
                                    ref={railFillRef}
                                    className="w-full h-full bg-blue-600 origin-top"
                                />
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-[260px]">
                                Seluruh status, foto kondisi, dan riwayat tindakan dapat diperiksa kembali menggunakan nomor servis Anda.
                            </p>
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
                                className={`lg:sticky bg-slate-50 border border-slate-200 border-t-[3px] ${item.accent} rounded-2xl p-6 sm:p-8 shadow-[0_14px_34px_-22px_rgba(15,23,42,0.18)] will-change-transform origin-top`}
                            >
                                <div className="pb-4 mb-4 border-b border-slate-200/80">
                                    <span className="font-mono text-xs font-bold text-slate-500">
                                        {item.num} / {item.kicker}
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
