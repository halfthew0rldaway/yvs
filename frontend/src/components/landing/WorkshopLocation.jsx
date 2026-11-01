import { useState } from "react";
import { MapPin, Clock, MessageCircle, ArrowUpRight, Navigation, ShieldCheck, Phone, Copy, Check, Globe } from "lucide-react";
import toast from "react-hot-toast";

function InstagramIcon({ className = "w-4 h-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
    );
}

const ADDRESS_TEXT = "Jl. Raya Pekayon No. 25, RT.004/RW.001, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi, Jawa Barat 17148";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Komputerawet.Com+By+Yangversa+Computer+Jl+Raya+Pekayon+Bekasi";

export default function WorkshopLocation() {
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(ADDRESS_TEXT);
            setCopied(true);
            toast.success("Alamat workshop berhasil disalin!");
            setTimeout(() => setCopied(false), 2500);
        } catch (_) {
            toast.error("Gagal menyalin alamat");
        }
    };

    return (
        <section className="relative w-full bg-white py-16 sm:py-24 border-b border-slate-100 font-sans scroll-mt-14 sm:scroll-mt-16 content-deferred" id="workshop-location">
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                {/* Header */}
                <div className="space-y-3 max-w-2xl pb-10 border-b border-slate-100 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span className="text-xs font-mono font-semibold text-blue-700 uppercase tracking-wider">
                            Pusat Workshop & Layanan
                        </span>
                    </div>
                    <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                        Lokasi Workshop dan Jadwal Pelayanan
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans text-justify [text-justify:inter-word]">
                        Kunjungi workshop kami langsung di Pekayon Bekasi untuk konsultasi tatap muka, pengecekan gratis di depan Anda, atau kirimkan perangkat Anda secara aman melalui kurir instan / ekspedisi.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Address + Hours */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Address Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                                            Komputerawet.com · Yangversa Computer
                                        </h3>
                                        <span className="font-mono text-3xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                            Pekayon, Bekasi
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                        {ADDRESS_TEXT}
                                    </p>
                                    <p className="text-xs text-slate-400 font-sans leading-relaxed pt-0.5">
                                        Patokan: Seberang deretan ruko utama, parkir motor & mobil tersedia luas, ruang tunggu ber-AC.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                                <a
                                    href={MAPS_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-sans text-xs sm:text-sm font-semibold transition-all shadow-xs"
                                >
                                    <Navigation className="w-4 h-4" />
                                    <span>Petunjuk Arah Google Maps</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>

                                <button
                                    type="button"
                                    onClick={handleCopyAddress}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                                    title="Salin alamat lengkap"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                    <span>{copied ? "Tersalin!" : "Salin Alamat"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Operating Hours Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-base text-slate-900">
                                            Jadwal Layanan Workshop
                                        </h3>
                                        <span className="text-xs text-slate-500">Penerimaan & Konsultasi Servis</span>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Buka Hari Ini
                                </span>
                            </div>

                            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <span className="font-bold text-emerald-950 text-sm block">
                                        Buka Setiap Hari (Senin – Minggu)
                                    </span>
                                    <span className="text-xs text-emerald-800">
                                        Termasuk akhir pekan, siap melayani konsultasi langsung
                                    </span>
                                </div>
                                <span className="font-mono font-extrabold text-base sm:text-lg text-emerald-700 px-3 py-1 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                                    09:00 – 18:00 WIB
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed font-sans pt-1 text-justify [text-justify:inter-word]">
                                Kirim unit via kurir instan (Gojek / Grab Express) atau kargo (JNE / J&T) diterima setiap hari pada jam operasional kerja dengan mencantumkan nama dan nomor WhatsApp aktif Anda.
                            </p>
                        </div>
                    </div>

                    {/* Right: Direct Contacts */}
                    <div className="lg:col-span-6">
                        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-3xs font-mono font-semibold whitespace-nowrap shrink-0">
                                    LAYANAN KONSULTASI
                                </div>
                                <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
                                    Hubungi Langsung Tim Teknisi YVS
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-sans text-justify [text-justify:inter-word]">
                                    Konsultasikan masalah perangkat Anda sebelum datang. Kami siap membantu memperkirakan kemungkinan kerusakan (laptop mati total, layar gelap, overheat, engsel retak, upgrade komponen) secara transparan.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* WhatsApp Primary */}
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition-all group"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-900 font-bold font-sans">WhatsApp Customer Service</div>
                                            <div className="text-xs text-emerald-800 font-mono font-semibold mt-0.5">0812-1034-212 (Respon Cepat)</div>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>

                                {/* Telephone Landline - Clickable for Instant Mobile Dialing */}
                                <a
                                    href="tel:0218270005"
                                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors group cursor-pointer"
                                    title="Hubungi telepon workshop"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-2xs shrink-0 group-hover:border-blue-300">
                                            <Phone className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-900 font-bold font-sans">Telepon Workshop (Meja Penerimaan)</div>
                                            <div className="text-xs text-slate-600 font-mono font-semibold mt-0.5">(021) 8270005</div>
                                        </div>
                                    </div>
                                    <span className="text-3xs font-mono font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                        Panggil
                                    </span>
                                </a>

                                {/* Official Channels */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <a
                                        href="https://www.komputerawet.com"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-2.5 text-xs text-slate-700 font-medium"
                                    >
                                        <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span className="truncate">komputerawet.com</span>
                                    </a>

                                    <a
                                        href="https://instagram.com/komputerawet"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-2.5 text-xs text-slate-700 font-medium"
                                    >
                                        <InstagramIcon className="w-4 h-4 text-pink-600 shrink-0" />
                                        <span className="truncate">@komputerawet</span>
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 pt-2 text-xs font-sans text-slate-500 border-t border-slate-100">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Konsultasi jujur · Transparansi biaya · Garansi resmi tertulis</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
