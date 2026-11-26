import { useState } from "react";
import toast from "react-hot-toast";
import {
    MapPin,
    Navigation,
    Copy,
    Check,
    MessageCircle,
    Phone,
    ArrowUpRight,
    ArrowUp,
} from "lucide-react";
import { MagneticWrap, MaskedLines, smoothScrollToTarget } from "./MotionPrimitives";

const ADDRESS_TEXT =
    "Jl. Raya Pekayon No. 25, RT.004/RW.001, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi, Jawa Barat 17148";
const MAPS_URL =
    "https://www.google.com/maps/search/?api=1&query=Komputerawet.Com+By+Yangversa+Computer+Jl+Raya+Pekayon+Bekasi";

export default function WorkshopVisitSection({ onFocusTrack }) {
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(ADDRESS_TEXT);
            setCopied(true);
            toast.success("Alamat workshop berhasil disalin");
            setTimeout(() => setCopied(false), 2400);
        } catch {
            toast.error("Gagal menyalin alamat");
        }
    };

    return (
        <>
            <section
                id="lokasi"
                className="w-full bg-white border-b border-slate-200 py-16 sm:py-24 scroll-mt-16 overflow-x-clip"
            >
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                        {/* LEFT: Visit Info & Actions */}
                        <div className="lg:col-span-6 space-y-6">
                            <div className="space-y-3">
                                <span className="font-mono text-xs text-blue-600 font-semibold block">
                                    05 / LOKASI &amp; KONTAK
                                </span>
                                <MaskedLines
                                    as="h2"
                                    lines={["Datang langsung atau", "kirim unit lewat kurir."]}
                                    className="font-display font-extrabold text-2xl sm:text-4xl text-slate-950 tracking-[-0.03em] leading-[1.12]"
                                />
                            </div>

                            <div className="space-y-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
                                <p className="font-semibold text-slate-950">{ADDRESS_TEXT}</p>
                                <p className="text-xs sm:text-sm text-slate-500">
                                    Parkir motor dan mobil tersedia di depan ruko, ruang tunggu nyaman ber-AC. Unit juga bisa dikirim lewat Gojek/Grab Express atau ekspedisi dengan menyertakan nama dan nomor WhatsApp.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <MagneticWrap strength={0.16}>
                                    <a
                                        href={MAPS_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
                                    >
                                        <Navigation className="w-4 h-4 shrink-0" />
                                        <span>Buka di Google Maps</span>
                                        <ArrowUpRight className="w-4 h-4 shrink-0" />
                                    </a>
                                </MagneticWrap>

                                <button
                                    type="button"
                                    onClick={handleCopyAddress}
                                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-slate-500" />
                                    )}
                                    <span>{copied ? "Alamat tersalin" : "Salin alamat"}</span>
                                </button>
                            </div>

                            {/* Direct Contact Hairline Rows */}
                            <div className="pt-4 border-t border-slate-200 divide-y divide-slate-200">
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20tentang%20perbaikan%20perangkat%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="py-4 flex items-center justify-between gap-4 group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-xs text-slate-500 block">WhatsApp layanan pelanggan</span>
                                            <span className="font-mono font-bold text-sm sm:text-base text-slate-950 group-hover:text-emerald-700 transition-colors">
                                                0812-1034-212
                                            </span>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                                </a>

                                <a
                                    href="tel:0218270005"
                                    className="py-4 flex items-center justify-between gap-4 group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-xs text-slate-500 block">Telepon meja penerimaan</span>
                                            <span className="font-mono font-bold text-sm sm:text-base text-slate-950 group-hover:text-blue-600 transition-colors">
                                                (021) 8270005
                                            </span>
                                        </div>
                                    </div>
                                    <span className="font-mono text-xs text-slate-500 group-hover:text-blue-600 shrink-0">
                                        Panggil
                                    </span>
                                </a>
                            </div>
                        </div>

                        {/* RIGHT: Architectural Pekayon Blueprint Locator Card + Schedule */}
                        <div className="lg:col-span-6 space-y-5">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                                {/* Lightweight Bespoke Architectural Vector Map (Zero external iframe lag) */}
                                <div className="relative h-[220px] sm:h-[260px] bg-[#0F172A] yvs-exp-dark-grid p-5 flex flex-col justify-between overflow-hidden">
                                    <svg
                                        viewBox="0 0 600 260"
                                        className="absolute inset-0 w-full h-full opacity-55"
                                        preserveAspectRatio="xMidYMid slice"
                                        aria-hidden="true"
                                    >
                                        {/* Stylized Pekayon main road corridor */}
                                        <path
                                            d="M-20 195 Q160 155 290 130 T620 65"
                                            stroke="#334155"
                                            strokeWidth="18"
                                            fill="none"
                                        />
                                        <path
                                            d="M-20 195 Q160 155 290 130 T620 65"
                                            stroke="#64748b"
                                            strokeWidth="1.5"
                                            strokeDasharray="8 6"
                                            fill="none"
                                        />
                                        <path
                                            d="M210 -10 L255 270"
                                            stroke="#1e293b"
                                            strokeWidth="10"
                                            fill="none"
                                        />
                                        <path
                                            d="M420 20 L385 270"
                                            stroke="#1e293b"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        {/* Workshop coordinate pin */}
                                        <circle cx="305" cy="126" r="28" fill="rgba(37,99,235,0.18)" />
                                        <circle cx="305" cy="126" r="8" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                                    </svg>

                                    <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-300">
                                        <span className="px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700">
                                            PEKAYON JAYA · BEKASI SELATAN
                                        </span>
                                        <span className="text-slate-400">-6.26064, 106.98744</span>
                                    </div>

                                    <div className="relative z-10 flex items-end justify-between gap-3">
                                        <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                                                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                <span>YVS Computer · komputerawet.com</span>
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                Jl. Raya Pekayon No. 25
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Operating Hours Bar */}
                                <div className="p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200">
                                    <div className="space-y-0.5">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span>Buka setiap hari (Senin – Minggu)</span>
                                        </span>
                                        <p className="text-xs text-slate-500">
                                            Penerimaan unit, konsultasi, dan pengambilan servis
                                        </p>
                                    </div>
                                    <span className="font-mono font-bold text-base sm:text-lg text-slate-950 tabular-nums shrink-0">
                                        09.00 – 18.00 WIB
                                    </span>
                                </div>
                            </div>

                            {/* Social & Official Links */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs sm:text-sm text-slate-600">
                                <div className="flex items-center gap-4">
                                    <a
                                        href="https://www.komputerawet.com"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium hover:text-blue-600 transition-colors"
                                    >
                                        komputerawet.com
                                    </a>
                                    <span className="text-slate-300" aria-hidden="true">/</span>
                                    <a
                                        href="https://instagram.com/komputerawet"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium hover:text-blue-600 transition-colors"
                                    >
                                        Instagram @komputerawet
                                    </a>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onFocusTrack) onFocusTrack();
                                        else smoothScrollToTarget("track-lookup", -80);
                                    }}
                                    className="font-semibold text-blue-600 hover:underline cursor-pointer"
                                >
                                    Lacak nomor servis ↑
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Minimal Editorial Footer */}
            <footer className="w-full bg-slate-50 py-8 sm:py-10">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2.5">
                        <img
                            src="/logo-yangversa.png"
                            alt=""
                            className="w-6 h-6 rounded object-contain bg-white border border-slate-200 p-0.5"
                        />
                        <span>
                            &copy; {new Date().getFullYear()} YVS Computer · Yangversa Computer, Bekasi Selatan.
                        </span>
                    </div>

                    <MagneticWrap strength={0.18}>
                        <button
                            type="button"
                            onClick={() => smoothScrollToTarget("top")}
                            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-900 hover:text-white border border-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer"
                        >
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>Kembali ke atas</span>
                        </button>
                    </MagneticWrap>
                </div>
            </footer>
        </>
    );
}
