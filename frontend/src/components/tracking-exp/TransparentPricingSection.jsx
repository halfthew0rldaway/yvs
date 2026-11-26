import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
    MaskedLines,
    MagneticWrap,
    usePrefersReducedMotion,
} from "./MotionPrimitives";
import { loadGsapRuntime } from "./motionTokens";

/**
 * ACT V — Tactile Scroll-Stacked Pricing Deck on Cohesive Light Paper
 * - Strictly 100% opaque solid surfaces (`opacity: 1` always) with uniform card heights so stacked
 *   rear cards never ghost through front cards.
 * - GPU-only compositor scale depth (`scale` + `transformOrigin: top center`), zero layout thrash.
 */
const PRICING_CARDS = [
    {
        num: "01",
        category: "Perawatan rutin",
        service: "Pembersihan debu & ganti pasta termal",
        scope: "Laptop, MacBook & PC desktop",
        detail: "Pembersihan kipas, sirip pendingin, dan penggantian pasta termal agar suhu perangkat lebih terjaga saat dipakai bekerja.",
        estimate: "Konfirmasi lewat WhatsApp",
        waSubject: "pembersihan debu & pasta termal",
    },
    {
        num: "02",
        category: "Upgrade & sistem",
        service: "Upgrade SSD, tambah RAM & instalasi sistem",
        scope: "Jasa pasang, migrasi data, atau instalasi ulang OS",
        detail: "Kapasitas komponen dan ketersediaan stok disesuaikan kebutuhan perangkat Anda sebelum pengerjaan dilakukan.",
        estimate: "Sesuai kapasitas & spesifikasi",
        waSubject: "upgrade SSD / tambah RAM",
    },
    {
        num: "03",
        category: "Komponen fisik",
        service: "Penggantian keyboard, baterai & engsel",
        scope: "Opsi komponen dibahas terlebih dulu bersama pemilik",
        detail: "Teknisi memastikan kecocokan seri unit dan menyampaikan pilihan suku cadang sebelum pemesanan atau pemasangan.",
        estimate: "Sesuai tipe perangkat",
        waSubject: "ganti keyboard, baterai atau engsel",
    },
    {
        num: "04",
        category: "Layar & tampilan",
        service: "Penggantian layar (LCD / LED / Retina)",
        scope: "Bergantung ukuran panel, resolusi & konektor",
        detail: "Pengecekan kabel fleksibel dan spesifikasi panel dilakukan dulu agar layar pengganti cocok dengan mesin Anda.",
        estimate: "Sesuai tipe panel",
        waSubject: "penggantian layar perangkat",
    },
    {
        num: "05",
        category: "Mesin & daya",
        service: "Perbaikan mesin mati total / jalur daya",
        scope: "Estimasi pasti disampaikan setelah diagnosa unit",
        detail: "Unit dicek terlebih dulu di meja teknisi. Perbaikan hanya berjalan jika estimasi biaya yang dikirim sudah Anda setujui.",
        estimate: "Setelah hasil diagnosa",
        waSubject: "pengecekan mesin mati total",
    },
    {
        num: "06",
        category: "Penanganan cairan",
        service: "Penanganan perangkat terkena cairan",
        scope: "Pembersihan & evaluasi komponen yang terdampak",
        detail: "Fokus menekan korosi dan memetakan bagian yang perlu ditangani sebelum menentukan rincian biaya perbaikan.",
        estimate: "Setelah hasil diagnosa",
        waSubject: "perangkat terkena cairan",
    },
];

export default function TransparentPricingSection() {
    const deckRef = useRef(null);
    const cardInnerRefs = useRef([]);
    const [activeCard, setActiveCard] = useState(0);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined" || !deckRef.current) {
            return;
        }

        let cancelled = false;
        let ctx = null;

        loadGsapRuntime().then(({ gsap, ScrollTrigger }) => {
            if (cancelled || !deckRef.current) return;

            const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
            ctx = gsap.context(() => {
                const cards = cardInnerRefs.current.filter(Boolean);

                cards.forEach((inner, idx) => {
                    ScrollTrigger.create({
                        trigger: inner,
                        start: "top 42%",
                        end: "bottom 42%",
                        onEnter: () => setActiveCard(idx),
                        onEnterBack: () => setActiveCard(idx),
                    });

                    // Pure opaque depth scale (NEVER animate opacity < 1 or rear cards bleed through)
                    const nextInner = cards[idx + 1];
                    if (nextInner && isDesktop) {
                        const targetScale = 0.92 + idx * 0.013;
                        gsap.to(inner, {
                            scale: targetScale,
                            ease: "none",
                            scrollTrigger: {
                                trigger: nextInner,
                                start: "top 86%",
                                end: `top ${120 + idx * 20}px`,
                                scrub: true,
                                invalidateOnRefresh: true,
                            },
                        });
                    }
                });
            }, deckRef);

            window.requestAnimationFrame(() => ScrollTrigger.refresh());
        });

        return () => {
            cancelled = true;
            if (ctx) ctx.revert();
        };
    }, [reducedMotion]);

    const currentMeta = PRICING_CARDS[activeCard] || PRICING_CARDS[0];

    return (
        <section
            id="estimasi-biaya"
            className="w-full bg-[var(--yvs-paper)] text-[var(--yvs-ink)] py-20 sm:py-28 scroll-mt-16 overflow-x-clip border-t border-[var(--yvs-rule)]"
        >
            <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                    {/* LEFT (5 cols): Sticky Editorial Summary + Live Active Deck Counter */}
                    <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
                        <MaskedLines
                            as="h2"
                            lines={["Biaya disampaikan dulu,", "baru dikerjakan."]}
                            className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[2.85rem] text-[var(--yvs-ink)] tracking-[-0.035em] leading-[1.08]"
                        />

                        <p className="text-sm sm:text-base text-[var(--yvs-muted)] leading-relaxed max-w-md">
                            Tarif perbaikan mengikuti merek perangkat, tingkat kerusakan, dan pilihan suku cadang. Anda selalu menerima rincian biayanya lebih dulu sebelum pengerjaan dimulai.
                        </p>

                        {/* Quiet Folio Position Indicator */}
                        <div className="hidden lg:block pt-5 border-t border-[var(--yvs-rule)] max-w-sm space-y-1.5">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="font-mono font-bold text-sm text-[var(--yvs-accent)] tabular-nums">
                                    {currentMeta.num} / 0{PRICING_CARDS.length}
                                </span>
                                <span className="text-xs font-medium text-[var(--yvs-muted)]">
                                    {currentMeta.category}
                                </span>
                            </div>
                            <p className="font-display font-bold text-sm text-[var(--yvs-ink)] truncate">
                                {currentMeta.service}
                            </p>
                        </div>

                        <div className="pt-1">
                            <MagneticWrap strength={0.16}>
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20kisaran%20biaya%20perbaikan%20untuk%20perangkat%20saya."
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--yvs-obsidian)] hover:bg-[var(--yvs-accent)] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                                >
                                    <span>Tanya kisaran untuk seri perangkat Anda</span>
                                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                </a>
                            </MagneticWrap>
                        </div>
                    </div>

                    {/* RIGHT (7 cols): Opaque Tactile Sticky Stacking Card Deck */}
                    <div ref={deckRef} className="lg:col-span-7 space-y-5 sm:space-y-6 pb-8">
                        {PRICING_CARDS.map((row, idx) => {
                            const waHref = `https://wa.me/628121034212?text=${encodeURIComponent(
                                `Halo YVS Computer, saya ingin tanya kisaran biaya untuk ${row.waSubject}.`
                            )}`;
                            const stickyTop = `calc(5.25rem + ${idx * 20}px)`;

                            return (
                                <div
                                    key={row.num}
                                    className="lg:sticky"
                                    style={{
                                        top: stickyTop,
                                        zIndex: 10 + idx,
                                    }}
                                >
                                    <article
                                        ref={(el) => {
                                            cardInnerRefs.current[idx] = el;
                                        }}
                                        className={`yvs-stack-card rounded-2xl border border-[var(--yvs-rule)] overflow-hidden lg:min-h-[252px] flex flex-col justify-between ${
                                            idx % 2 === 0
                                                ? "bg-white"
                                                : "bg-[var(--yvs-paper-2)]"
                                        }`}
                                    >
                                        {/* Peeking Index Header Strip */}
                                        <div className="px-5 sm:px-7 py-3.5 border-b border-[var(--yvs-rule)] flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-baseline gap-2.5 min-w-0">
                                                <span className="font-mono font-bold text-xs sm:text-sm text-[var(--yvs-accent)] tabular-nums shrink-0">
                                                    {row.num}
                                                </span>
                                                <span className="text-xs font-semibold text-[var(--yvs-ink)] truncate">
                                                    {row.category}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-[var(--yvs-accent)] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                {row.estimate}
                                            </span>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between gap-4">
                                            <div className="space-y-2">
                                                <h3 className="font-display font-bold text-lg sm:text-2xl text-[var(--yvs-ink)] tracking-[-0.02em] leading-snug">
                                                    {row.service}
                                                </h3>
                                                <p className="text-sm text-[var(--yvs-muted)] leading-relaxed">
                                                    {row.detail}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-[var(--yvs-rule)] flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                                                <span className="text-xs font-medium text-[var(--yvs-muted)]">
                                                    {row.scope}
                                                </span>
                                                <a
                                                    href={waHref}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="min-h-[44px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--yvs-ink)] hover:text-[var(--yvs-accent)] transition-colors whitespace-nowrap shrink-0"
                                                >
                                                    <span>Tanya estimasi</span>
                                                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                                </a>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
