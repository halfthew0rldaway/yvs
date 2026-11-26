import { ArrowUpRight } from "lucide-react";
import { MaskedLines, MagneticWrap } from "./MotionPrimitives";

/**
 * Clean Swiss-Editorial Pricing Ledger on Pure Gallery White (#FFFFFF).
 * Displays clear, honest starting indications with zero ugly raw template brackets.
 * Final cost is always confirmed after technician diagnosis before repair begins.
 */
const PRICING_ROWS = [
    {
        service: "Pembersihan debu & ganti pasta termal",
        scope: "Laptop, MacBook & PC desktop",
        estimate: "Konfirmasi lewat WhatsApp",
    },
    {
        service: "Upgrade SSD, tambah RAM & instalasi sistem",
        scope: "Jasa pasang, migrasi data, atau instalasi ulang OS",
        estimate: "Sesuai kapasitas & spesifikasi",
    },
    {
        service: "Penggantian keyboard, baterai & engsel",
        scope: "Opsi komponen dibahas terlebih dulu bersama pemilik",
        estimate: "Sesuai tipe perangkat",
    },
    {
        service: "Penggantian layar (LCD / LED / Retina)",
        scope: "Bergantung ukuran panel, resolusi & konektor",
        estimate: "Sesuai tipe panel",
    },
    {
        service: "Perbaikan mesin mati total / jalur daya",
        scope: "Estimasi pasti disampaikan setelah diagnosa unit",
        estimate: "Setelah hasil diagnosa",
    },
    {
        service: "Penanganan perangkat terkena cairan",
        scope: "Pembersihan & evaluasi komponen yang terdampak",
        estimate: "Setelah hasil diagnosa",
    },
];

export default function TransparentPricingSection() {
    return (
        <section
            id="estimasi-biaya"
            className="w-full bg-white text-[#071124] py-20 sm:py-28 scroll-mt-16 overflow-x-clip border-t border-[#071124]/10"
        >
            <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                    {/* Left Sticky Editorial Summary */}
                    <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
                        <MaskedLines
                            as="h2"
                            lines={["Biaya disampaikan dulu,", "baru dikerjakan."]}
                            className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[2.85rem] text-[#071124] tracking-[-0.035em] leading-[1.08]"
                        />

                        <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-md">
                            Tarif perbaikan mengikuti merek perangkat, tingkat kerusakan, dan pilihan suku cadang. Anda selalu menerima rincian biayanya lebih dulu sebelum pengerjaan dimulai.
                        </p>

                        <div className="pt-2">
                            <MagneticWrap strength={0.16}>
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20kisaran%20biaya%20perbaikan%20untuk%20perangkat%20saya."
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#071124] hover:bg-[#2563EB] text-white text-sm font-semibold transition-colors"
                                >
                                    <span>Tanya kisaran untuk seri perangkat Anda</span>
                                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                </a>
                            </MagneticWrap>
                        </div>
                    </div>

                    {/* Right Swiss Hairline Ledger */}
                    <div className="lg:col-span-7 divide-y divide-[#071124]/12 border-y border-[#071124]/12">
                        {PRICING_ROWS.map((row, idx) => (
                            <div
                                key={row.service}
                                className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-6 hover:bg-[#F8FAFC] transition-colors px-3 -mx-3 rounded-xl"
                            >
                                <div className="flex items-baseline gap-4 min-w-0">
                                    <span className="font-mono text-xs font-bold text-[#2563EB] shrink-0">
                                        0{idx + 1}
                                    </span>
                                    <div className="space-y-1 min-w-0">
                                        <h3 className="font-display font-bold text-base sm:text-lg text-[#071124] leading-snug">
                                            {row.service}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-[#475569]">{row.scope}</p>
                                    </div>
                                </div>

                                <span className="text-xs sm:text-sm font-semibold text-[#071124] sm:text-right pl-8 sm:pl-0 shrink-0">
                                    {row.estimate}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
