import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { MaskedLines, usePrefersReducedMotion } from "./MotionPrimitives";
import { loadGsapRuntime } from "./motionTokens";

const SERVICES = [
    {
        num: "01",
        category: "Daya & mesin",
        title: "Mati total atau tidak mengisi daya",
        symptoms: "Perangkat tidak menyala, lampu indikator mati, atau sering mati mendadak saat dipakai.",
        detail: "Pemeriksaan menyeluruh mulai dari adaptor, baterai, konektor daya, hingga komponen papan utama sesuai hasil pengecekan teknisi.",
        devices: "Laptop, MacBook & PC desktop",
    },
    {
        num: "02",
        category: "Layar & fisik",
        title: "Layar, keyboard, baterai & engsel",
        symptoms: "Layar bergaris atau gelap, tombol macet, baterai cepat turun, atau engsel patah.",
        detail: "Pengecekan kabel fleksibel, panel layar, modul keyboard, baterai, hingga perbaikan dudukan engsel dengan opsi suku cadang sesuai kebutuhan.",
        devices: "Laptop kerja, gaming & MacBook",
    },
    {
        num: "03",
        category: "Perawatan suhu",
        title: "Pembersihan debu & ganti pasta termal",
        symptoms: "Kipas berisik, bodi cepat panas, atau performa menurun ketika dipakai bekerja lama.",
        detail: "Pembersihan debu pada kipas dan jalur pendingin serta penggantian pasta termal agar suhu perangkat lebih stabil.",
        devices: "Disarankan tiap 6–12 bulan",
    },
    {
        num: "04",
        category: "Kena cairan",
        title: "Penanganan perangkat terkena cairan",
        symptoms: "Tertumpah air, kopi, atau minuman lainnya ke area keyboard maupun mesin.",
        detail: "Pembersihan sisa cairan dan evaluasi bagian terdampak untuk menekan risiko kerusakan lanjutan. Matikan perangkat dan jangan dinyalakan dulu.",
        devices: "Laptop & MacBook",
    },
    {
        num: "05",
        category: "Upgrade sistem",
        title: "Upgrade SSD, tambah RAM & instalasi",
        symptoms: "Membuka aplikasi terasa lambat atau ruang penyimpanan sudah hampir penuh.",
        detail: "Pemasangan SSD, penambahan RAM, pemindahan sistem serta dokumen, hingga instalasi ulang OS dan perakitan PC desktop.",
        devices: "Laptop & PC desktop",
    },
    {
        num: "06",
        category: "Data & penyimpanan",
        title: "Pengecekan & penyelamatan data",
        symptoms: "SSD atau harddisk sulit terbaca, sistem gagal masuk, atau perlu memindahkan file penting.",
        detail: "Pemeriksaan media penyimpanan dan upaya penyelamatan dokumen penting sesuai tingkat kerusakan perangkat.",
        devices: "SSD NVMe, SATA & harddisk eksternal",
    },
];

/**
 * ACT III — Native CSS Sticky + GSAP ScrollTrigger Pure-Scrub Horizontal Gallery
 * Uses native `lg:sticky lg:top-0 lg:h-[100dvh]` inside a `lg:h-[240vh]` scroll runway
 * (zero GSAP pin-spacer DOM mutations) so horizontal scrubbing never jumps or breaks.
 */
export default function ServiceCatalogRail() {
    const sectionRef = useRef(null);
    const viewportRef = useRef(null);
    const trackRef = useRef(null);
    const progressRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined" || !sectionRef.current || !trackRef.current) {
            return;
        }
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        if (!isDesktop) return;

        let cancelled = false;
        let ctx = null;

        loadGsapRuntime().then(({ gsap, ScrollTrigger }) => {
            if (cancelled || !sectionRef.current || !trackRef.current) return;

            ctx = gsap.context(() => {
                const getDistance = () => {
                    const track = trackRef.current;
                    const vp = viewportRef.current;
                    if (!track || !vp) return 0;
                    return Math.max(0, track.scrollWidth - vp.clientWidth);
                };

                gsap.to(trackRef.current, {
                    x: () => -getDistance(),
                    ease: "none",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.45,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => {
                            if (progressRef.current) {
                                progressRef.current.style.transform = `scaleX(${self.progress})`;
                            }
                        },
                    },
                });
            }, sectionRef);

            window.requestAnimationFrame(() => ScrollTrigger.refresh());
        });

        return () => {
            cancelled = true;
            if (ctx) ctx.revert();
        };
    }, [reducedMotion]);

    return (
        <section
            id="layanan"
            ref={sectionRef}
            className={`relative w-full bg-white scroll-mt-16 ${
                reducedMotion ? "" : "lg:h-[240vh]"
            }`}
        >
            <div
                ref={viewportRef}
                className="lg:sticky lg:top-0 lg:h-[100dvh] lg:min-h-[680px] w-full py-16 sm:py-24 lg:py-0 lg:flex lg:flex-col lg:justify-center overflow-hidden"
            >
                {/* Header */}
                <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pb-8 lg:pb-10 lg:pt-12 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
                    <MaskedLines
                        as="h2"
                        lines={["Layanan yang biasa", "kami tangani di bengkel."]}
                        className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[2.85rem] text-[#071124] tracking-[-0.035em] leading-[1.08] max-w-2xl"
                    />
                    <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-sm">
                        Setiap perbaikan dimulai dari pemeriksaan jelas. Anda bisa konsultasi dulu lewat WhatsApp sebelum membawa unit.
                    </p>
                </div>

                {/* Horizontal Editorial Plates */}
                <div className="w-full overflow-x-auto lg:overflow-visible yvs-no-scrollbar snap-x snap-mandatory lg:snap-none">
                    <div
                        ref={trackRef}
                        className="flex items-stretch gap-5 sm:gap-6 px-5 sm:px-8 lg:px-12 w-max"
                    >
                        {SERVICES.map((service) => {
                            const waText = encodeURIComponent(
                                `Halo YVS Computer, saya ingin tanya mengenai layanan ${service.title.toLowerCase()}.`
                            );
                            return (
                                <article
                                    key={service.num}
                                    data-cursor="Lihat"
                                    className="snap-start w-[300px] sm:w-[380px] lg:w-[420px] shrink-0 bg-[#F8FAFC] hover:bg-white border border-[#071124]/10 hover:border-[#2563EB]/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-8 transition-colors duration-300"
                                >
                                    <div className="space-y-5">
                                        <div className="flex items-baseline justify-between gap-3 pb-4 border-b border-[#071124]/10">
                                            <span className="font-display font-extrabold text-4xl text-[#2563EB] tracking-[-0.04em] leading-none">
                                                {service.num}
                                            </span>
                                            <span className="text-xs font-medium text-[#475569]">
                                                {service.category}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            <h3 className="font-display font-bold text-xl sm:text-2xl text-[#071124] tracking-[-0.02em] leading-snug">
                                                {service.title}
                                            </h3>
                                            <p className="text-sm text-[#475569] leading-relaxed">
                                                {service.symptoms}
                                            </p>
                                            <p className="text-sm text-[#071124]/80 leading-relaxed pt-1">
                                                {service.detail}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-[#071124]/10 flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-[#475569]">
                                            {service.devices}
                                        </span>
                                        <a
                                            href={`https://wa.me/628121034212?text=${waText}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="min-h-[44px] inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#071124] hover:text-[#2563EB] transition-colors shrink-0"
                                        >
                                            <span>Tanya WhatsApp</span>
                                            <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                        </a>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>

                {/* Desktop Horizontal Scroll Progress Hairline */}
                <div className="hidden lg:block w-full max-w-[1440px] mx-auto px-12 pt-10" aria-hidden="true">
                    <div className="h-[2px] w-full bg-[#071124]/10 overflow-hidden">
                        <div
                            ref={progressRef}
                            className="h-full w-full bg-[#2563EB] origin-left"
                            style={{ transform: "scaleX(0)" }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
