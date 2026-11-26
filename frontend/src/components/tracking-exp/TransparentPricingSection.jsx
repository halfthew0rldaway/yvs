import { ArrowUpRight, Info } from "lucide-react";
import { MaskedLines, MagneticWrap } from "./MotionPrimitives";

const PRICING_RANGES = [
    {
        service: "Pembersihan debu & ganti pasta termal",
        scope: "Laptop, MacBook & PC desktop",
        pricePlaceholder: "[PRICE_CLEANING_START]",
    },
    {
        service: "Upgrade SSD, tambah RAM & instalasi sistem",
        scope: "Pemasangan, migrasi data, atau instalasi ulang",
        pricePlaceholder: "[PRICE_STORAGE_RAM_START]",
    },
    {
        service: "Penggantian keyboard, baterai & engsel",
        scope: "Jasa pasang + komponen sesuai tipe unit",
        pricePlaceholder: "[PRICE_KEYBOARD_BATTERY_START]",
    },
    {
        service: "Penggantian layar (LCD / LED / Retina)",
        scope: "Bergantung ukuran panel, resolusi & tipe konektor",
        pricePlaceholder: "[PRICE_DISPLAY_START]",
    },
    {
        service: "Perbaikan mesin mati total / jalur daya",
        scope: "Dikonfirmasi setelah hasil diagnosa teknisi",
        pricePlaceholder: "[PRICE_MAINBOARD_START]",
    },
    {
        service: "Penanganan perangkat terkena cairan",
        scope: "Pembersihan & evaluasi komponen terdampak",
        pricePlaceholder: "[PRICE_LIQUID_START]",
    },
];

export default function TransparentPricingSection() {
    return (
        <section
            id="estimasi-biaya"
            className="w-full bg-[#0B162C] text-white border-b border-slate-800 py-16 sm:py-24 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end pb-8 sm:pb-10 border-b border-white/15">
                    <div className="lg:col-span-7 space-y-2.5">
                        <span className="font-mono text-xs text-blue-300 font-semibold block">
                            04 / GAMBARAN BIAYA
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Kisaran biaya transparan,", "dikonfirmasi sebelum kerja."]}
                            className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.65rem] text-white tracking-[-0.03em] leading-[1.12]"
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            Tarif akhir bergantung pada merek perangkat, tingkat kerusakan, dan suku cadang yang dipilih. Tidak ada pengerjaan sebelum Anda menyetujui rinciannya.
                        </p>
                    </div>
                </div>

                {/* Editorial Pricing Ledger */}
                <div className="divide-y divide-white/15 mt-2">
                    {PRICING_RANGES.map((row, idx) => (
                        <div
                            key={row.service}
                            className="py-5 sm:py-6 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline"
                        >
                            <span className="hidden sm:block sm:col-span-1 font-mono text-xs font-semibold text-blue-300">
                                0{idx + 1}
                            </span>
                            <div className="sm:col-span-7 space-y-1">
                                <h3 className="font-display font-bold text-base sm:text-lg text-white">
                                    {row.service}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300">{row.scope}</p>
                            </div>
                            <div className="sm:col-span-4 sm:text-right pt-1 sm:pt-0">
                                <span className="text-xs text-blue-200 block">Mulai dari</span>
                                <span className="font-mono font-bold text-base sm:text-lg text-white">
                                    {row.pricePlaceholder}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Honest Disclaimer + WhatsApp CTA */}
                <div className="mt-8 pt-6 border-t border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                        <Info className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>
                            Ingin kisaran lebih spesifik untuk tipe laptop atau PC Anda? Sebutkan merek, seri, dan keluhan unit lewat WhatsApp sebelum berkunjung.
                        </span>
                    </p>
                    <MagneticWrap strength={0.16}>
                        <a
                            href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20kisaran%20biaya%20perbaikan%20untuk%20perangkat%20saya."
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                            <span>Tanya kisaran via WhatsApp</span>
                            <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                        </a>
                    </MagneticWrap>
                </div>
            </div>
        </section>
    );
}
