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
    Clock,
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
            toast.success("Alamat bengkel berhasil disalin");
            setTimeout(() => setCopied(false), 2400);
        } catch {
            toast.error("Gagal menyalin alamat");
        }
    };

    return (
        <footer id="lokasi" className="w-full bg-white scroll-mt-16 overflow-x-clip">
            {/* Large Editorial Footer Statement */}
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 pt-16 sm:pt-24 pb-12 sm:pb-16 border-b border-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
                    <div className="lg:col-span-8 space-y-3">
                        <span className="font-mono text-xs text-blue-700 font-semibold block">
                            05 / LOKASI &amp; KONTAK
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Datang langsung atau", "kirim unit lewat kurir."]}
                            className="font-display font-extrabold text-3xl sm:text-5xl lg:text-[3.5rem] text-slate-950 tracking-[-0.035em] leading-[1.08]"
                        />
                    </div>
                    <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
                        <MagneticWrap strength={0.18}>
                            <a
                                href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20tentang%20perbaikan%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[48px] inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
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
                                else smoothScrollToTarget("track-lookup", -80);
                            }}
                            className="min-h-[48px] inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <span>Lacak nomor servis</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Visit Details, Hours & Clean Pekayon Map Card */}
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-12 sm:py-16 border-b border-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                    {/* Address & Direct Contacts */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="space-y-2.5 max-w-xl">
                            <p className="font-display font-bold text-lg text-slate-950 leading-snug">
                                {ADDRESS_TEXT}
                            </p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Parkir motor dan mobil tersedia di depan ruko, dengan ruang tunggu nyaman ber-AC. Unit juga bisa dikirim via Gojek/Grab Express atau ekspedisi dengan mencantumkan nama dan nomor WhatsApp aktif.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <MagneticWrap strength={0.16}>
                                <a
                                    href={MAPS_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B162C] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                                >
                                    <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>Buka di Google Maps</span>
                                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                </a>
                            </MagneticWrap>

                            <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="min-h-[46px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold transition-colors cursor-pointer"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                                ) : (
                                    <Copy className="w-4 h-4 text-slate-600" aria-hidden="true" />
                                )}
                                <span>{copied ? "Alamat tersalin" : "Salin alamat"}</span>
                            </button>
                        </div>

                        <div className="pt-4 border-t border-slate-200 divide-y divide-slate-200">
                            <a
                                href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20tentang%20perbaikan%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[60px] py-3.5 flex items-center justify-between gap-4 group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <MessageCircle className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
                                    <div className="min-w-0">
                                        <span className="text-xs text-slate-600 block">WhatsApp layanan pelanggan</span>
                                        <span className="font-mono font-bold text-sm sm:text-base text-slate-950 group-hover:text-blue-700 transition-colors">
                                            0812-1034-212
                                        </span>
                                    </div>
                                </div>
                                <ArrowUpRight
                                    className="w-4 h-4 text-slate-600 group-hover:text-blue-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0"
                                    aria-hidden="true"
                                />
                            </a>

                            <a
                                href="tel:0218270005"
                                className="min-h-[60px] py-3.5 flex items-center justify-between gap-4 group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Phone className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
                                    <div className="min-w-0">
                                        <span className="text-xs text-slate-600 block">Telepon meja penerimaan</span>
                                        <span className="font-mono font-bold text-sm sm:text-base text-slate-950 group-hover:text-blue-700 transition-colors">
                                            (021) 8270005
                                        </span>
                                    </div>
                                </div>
                                <span className="font-mono text-xs font-semibold text-slate-700 group-hover:text-blue-700 shrink-0">
                                    Panggil
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Clean Architectural Location Card + Schedule */}
                    <div className="lg:col-span-6 space-y-5">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                            <div className="relative h-[220px] sm:h-[250px] bg-[#0B162C] p-5 sm:p-6 flex flex-col justify-between overflow-hidden">
                                <svg
                                    viewBox="0 0 600 250"
                                    className="absolute inset-0 w-full h-full opacity-50"
                                    preserveAspectRatio="xMidYMid slice"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M-20 190 Q170 150 295 125 T620 65"
                                        stroke="#1E3A5F"
                                        strokeWidth="22"
                                        fill="none"
                                    />
                                    <path
                                        d="M-20 190 Q170 150 295 125 T620 65"
                                        stroke="#60A5FA"
                                        strokeWidth="1.5"
                                        strokeDasharray="8 6"
                                        fill="none"
                                    />
                                    <path d="M210 -10 L255 260" stroke="#172A46" strokeWidth="10" fill="none" />
                                    <path d="M420 10 L385 260" stroke="#172A46" strokeWidth="8" fill="none" />
                                    <circle cx="305" cy="122" r="30" fill="rgba(37,99,235,0.24)" />
                                    <circle cx="305" cy="122" r="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                                </svg>

                                <div className="relative z-10 flex items-center justify-between gap-2 text-xs font-mono text-blue-100">
                                    <span className="px-2.5 py-1 rounded-lg bg-[#0B162C]/90 border border-white/15">
                                        PEKAYON JAYA · BEKASI SELATAN
                                    </span>
                                    <span className="text-slate-300 hidden xs:inline">-6.26064, 106.98744</span>
                                </div>

                                <div className="relative z-10 flex items-end justify-between gap-3">
                                    <div className="px-3.5 py-2.5 rounded-xl bg-[#0B162C]/95 border border-white/15 text-white">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                                            <span>YVS Computer · komputerawet.com</span>
                                        </div>
                                        <span className="text-xs text-slate-300 font-mono">
                                            Jl. Raya Pekayon No. 25
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200">
                                <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Buka setiap hari (Senin – Minggu)</span>
                                    </span>
                                    <p className="text-xs text-slate-600">
                                        Penerimaan unit, konsultasi, dan pengambilan servis
                                    </p>
                                </div>
                                <span className="font-mono font-bold text-base sm:text-lg text-slate-950 tabular-nums shrink-0">
                                    09.00 – 18.00 WIB
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-slate-700">
                            <div className="flex items-center gap-4">
                                <a
                                    href="https://www.komputerawet.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-h-[44px] inline-flex items-center font-medium hover:text-blue-700 transition-colors"
                                >
                                    komputerawet.com
                                </a>
                                <span className="text-slate-300" aria-hidden="true">/</span>
                                <a
                                    href="https://instagram.com/komputerawet"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-h-[44px] inline-flex items-center font-medium hover:text-blue-700 transition-colors"
                                >
                                    Instagram @komputerawet
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Legal Bar */}
            <div className="w-full bg-slate-50 py-6 sm:py-8">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                        <img
                            src="/logo-yangversa.png"
                            alt=""
                            width="24"
                            height="24"
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
                            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#0B162C] hover:text-white border border-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
                        >
                            <ArrowUp className="w-4 h-4" aria-hidden="true" />
                            <span>Kembali ke atas</span>
                        </button>
                    </MagneticWrap>
                </div>
            </div>
        </footer>
    );
}
