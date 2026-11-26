import { useState } from "react";
import toast from "react-hot-toast";
import {
    Navigation,
    Copy,
    Check,
    MessageCircle,
    ArrowUpRight,
    ArrowUp,
} from "lucide-react";
import { MagneticWrap, MaskedLines, smoothScrollToTarget } from "./MotionPrimitives";

const ADDRESS_TEXT =
    "Jl. Raya Pekayon No. 25, RT.004/RW.001, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi 17148";
const MAPS_URL =
    "https://www.google.com/maps/search/?api=1&query=Komputerawet.Com+By+Yangversa+Computer+Jl+Raya+Pekayon+Bekasi";

/**
 * ACT VI — Monumental Editorial Footer (Deep Obsidian Navy #071124)
 */
export default function WorkshopVisitSection({ onFocusTrack }) {
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(ADDRESS_TEXT);
            setCopied(true);
            toast.success("Alamat bengkel disalin");
            setTimeout(() => setCopied(false), 2400);
        } catch {
            toast.error("Gagal menyalin alamat");
        }
    };

    return (
        <footer
            id="lokasi"
            className="w-full bg-[var(--yvs-obsidian)] text-white scroll-mt-16 overflow-x-clip"
        >
            {/* Monumental Closing Statement */}
            <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-20 sm:pt-28 pb-16 border-b border-white/12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
                    <div className="lg:col-span-8">
                        <MaskedLines
                            as="h2"
                            lines={["Datang langsung ke Pekayon", "atau kirim unit lewat kurir."]}
                            className="font-display font-extrabold text-3xl sm:text-5xl lg:text-[4rem] text-white tracking-[-0.04em] leading-[1.04]"
                        />
                    </div>
                    <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
                        <MagneticWrap strength={0.18}>
                            <a
                                href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20tentang%20perbaikan%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[50px] inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--yvs-accent)] hover:bg-[var(--yvs-accent-hover)] text-[var(--yvs-accent-ink)] text-sm font-semibold transition-colors whitespace-nowrap"
                            >
                                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>Chat WhatsApp</span>
                                <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                            </a>
                        </MagneticWrap>
                        <button
                            type="button"
                            onClick={() => {
                                if (onFocusTrack) onFocusTrack();
                                else smoothScrollToTarget("track-lookup", -72);
                            }}
                            className="min-h-[50px] inline-flex items-center px-6 py-3 rounded-full border border-white/25 hover:border-white text-white text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Cek status servis
                        </button>
                    </div>
                </div>
            </div>

            {/* Clean 3-Column Architectural Info Strip */}
            <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-14 grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-white/12">
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-slate-400">Alamat bengkel</h3>
                    <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                        {ADDRESS_TEXT}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <a
                            href={MAPS_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Buka Google Maps</span>
                        </a>
                        <button
                            type="button"
                            onClick={handleCopyAddress}
                            className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                            ) : (
                                <Copy className="w-4 h-4" aria-hidden="true" />
                            )}
                            <span>{copied ? "Tersalin" : "Salin alamat"}</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-slate-400">Jam operasional</h3>
                    <p className="font-display font-bold text-2xl text-white tabular-nums">
                        09.00 s.d. 18.00 WIB
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Buka setiap hari (Senin sampai Minggu). Parkir motor &amp; mobil tersedia di depan ruko, ruang tunggu ber-AC.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-slate-400">Kontak langsung</h3>
                    <div className="space-y-2 text-sm sm:text-base">
                        <a
                            href="https://wa.me/628121034212"
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[44px] flex items-center justify-between text-white hover:text-blue-400 transition-colors font-mono font-semibold"
                        >
                            <span>WhatsApp</span>
                            <span>0812-1034-212</span>
                        </a>
                        <a
                            href="tel:0218270005"
                            className="min-h-[44px] flex items-center justify-between text-slate-200 hover:text-blue-400 transition-colors font-mono font-semibold"
                        >
                            <span>Telepon</span>
                            <span>(021) 8270005</span>
                        </a>
                        <div className="flex items-center gap-4 pt-2 text-sm text-slate-300">
                            <a
                                href="https://www.komputerawet.com"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white transition-colors"
                            >
                                komputerawet.com
                            </a>
                            <a
                                href="https://instagram.com/komputerawet"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white transition-colors"
                            >
                                @komputerawet
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-Bleed Dual-Track Kinetic Brand Mast */}
            <div
                aria-hidden="true"
                className="yvs-marquee-group yvs-footer-mast-edge w-full pt-10 sm:pt-12 pb-6 sm:pb-8 space-y-2.5 sm:space-y-3 select-none overflow-hidden"
            >
                {/* Track 1 — Monumental Upper Display Wordmark (flows left) */}
                <div
                    style={{
                        "--yvs-marquee-duration": "44s",
                        "--yvs-marquee-gap": "2.75rem",
                    }}
                    className="flex flex-row overflow-hidden [gap:var(--yvs-marquee-gap)]"
                >
                    {[0, 1, 2].map((copyIdx) => (
                        <div
                            key={copyIdx}
                            className="yvs-marquee-h-lane flex shrink-0 items-center [gap:var(--yvs-marquee-gap)]"
                        >
                            {[0, 1].map((itemIdx) => (
                                <span
                                    key={itemIdx}
                                    className="inline-flex items-center gap-8 sm:gap-11 whitespace-nowrap"
                                >
                                    <span className="font-display font-extrabold text-[clamp(2.85rem,8.5vw,7.75rem)] leading-[0.88] tracking-[-0.045em] text-white/[0.11] transition-colors duration-300 hover:text-white/25">
                                        YVS COMPUTER
                                    </span>
                                    <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-blue-500/45 shrink-0" />
                                </span>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Track 2 — Architectural Counter-Track Attribution (flows right) */}
                <div
                    style={{
                        "--yvs-marquee-duration": "52s",
                        "--yvs-marquee-gap": "2.25rem",
                    }}
                    className="flex flex-row overflow-hidden [gap:var(--yvs-marquee-gap)]"
                >
                    {[0, 1, 2].map((copyIdx) => (
                        <div
                            key={copyIdx}
                            data-reverse="true"
                            className="yvs-marquee-h-lane flex shrink-0 items-center [gap:var(--yvs-marquee-gap)]"
                        >
                            {[0, 1].map((itemIdx) => (
                                <span
                                    key={itemIdx}
                                    className="inline-flex items-center gap-5 sm:gap-8 whitespace-nowrap"
                                >
                                    <span className="inline-flex items-baseline gap-2.5 sm:gap-4">
                                        <span className="font-mono font-medium text-xs sm:text-base tracking-[0.22em] uppercase text-slate-400/75">
                                            BY
                                        </span>
                                        <span className="font-display font-extrabold text-[clamp(1.5rem,3.6vw,3.15rem)] leading-[0.95] tracking-[-0.03em] text-blue-400/55 transition-colors duration-300 hover:text-blue-400/85">
                                            KOMPUTERAWET.COM
                                        </span>
                                    </span>
                                    <span className="w-8 sm:w-14 h-px bg-white/15 shrink-0" />
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Grounded Legal & Navigation Bar */}
            <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pb-8 pt-2">
                <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <span>
                        &copy; {new Date().getFullYear()} YVS Computer · by Komputerawet.com, Bekasi Selatan.
                    </span>
                    <button
                        type="button"
                        onClick={() => smoothScrollToTarget("top")}
                        className="min-h-[44px] inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
                    >
                        <span>Kembali ke atas</span>
                        <ArrowUp className="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </footer>
    );
}
