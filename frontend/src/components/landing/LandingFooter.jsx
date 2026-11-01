import { ArrowUp, Cpu, MessageCircle, MapPin, Phone, Globe, Clock, ShieldCheck } from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
    );
}

export default function LandingFooter() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="relative w-full bg-slate-50 text-slate-700 py-12 sm:py-16 border-t border-slate-200 font-sans content-deferred">
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 pb-12 border-b border-slate-200">
                    {/* Brand Column */}
                    <div className="md:col-span-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs text-white shrink-0">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight block leading-tight">
                                    YVS Computer
                                </span>
                                <span className="text-3xs font-mono text-slate-500 uppercase tracking-wider">
                                    Yangversa · komputerawet.com
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed max-w-sm text-left sm:text-justify [text-justify:inter-word]">
                            Pusat spesialis servis laptop, MacBook, dan PC desktop di Pekayon, Bekasi. Mengedepankan pemeriksaan jujur, estimasi transparan tanpa paksaan, dan pengembalian utuh seluruh komponen lama.
                        </p>

                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl w-fit">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Buka Setiap Hari: 09:00 – 18:00 WIB</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="md:col-span-3 space-y-3">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                            Navigasi Layanan
                        </span>
                        <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
                            <li>
                                <a href="#service-workflow" className="hover:text-blue-600 transition-colors">
                                    Proses Perbaikan
                                </a>
                            </li>
                            <li>
                                <a href="#track-lookup" className="hover:text-blue-600 transition-colors">
                                    Lacak Tiket Servis
                                </a>
                            </li>
                            <li>
                                <a href="#service-spec" className="hover:text-blue-600 transition-colors">
                                    Layanan Kami
                                </a>
                            </li>
                            <li>
                                <a href="#engineering-standards" className="hover:text-blue-600 transition-colors">
                                    Standar Pemeriksaan
                                </a>
                            </li>
                            <li>
                                <a href="#workshop-reviews" className="hover:text-blue-600 transition-colors">
                                    Ulasan Pelanggan (4.7★)
                                </a>
                            </li>
                            <li>
                                <a href="#workshop-location" className="hover:text-blue-600 transition-colors">
                                    Lokasi & Jadwal Layanan
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Workshop Info */}
                    <div className="md:col-span-4 space-y-3.5">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                            Kontak & Alamat Workshop
                        </span>
                        
                        <div className="text-xs sm:text-sm text-slate-600 space-y-1 leading-relaxed">
                            <p className="font-semibold text-slate-800">Workshop Fisik Pekayon:</p>
                            <p>Jl. Raya Pekayon No. 25, RT.004/RW.001, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi 17148</p>
                        </div>

                        <div className="space-y-2 pt-1 text-xs sm:text-sm">
                            <a
                                href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                                <span>WhatsApp: 0812-1034-212</span>
                            </a>
                            <a
                                href="tel:0218270005"
                                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                                title="Panggil Telepon Workshop"
                            >
                                <Phone className="w-4 h-4 shrink-0 text-blue-600" />
                                <span>Telepon: (021) 8270005</span>
                            </a>
                            <a
                                href="https://instagram.com/komputerawet"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <InstagramIcon className="w-4 h-4 shrink-0 text-pink-600" />
                                <span>Instagram: @komputerawet</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
                    <div className="space-y-0.5 text-center sm:text-left">
                        <p>
                            &copy; {new Date().getFullYear()} Komputerawet.com · Yangversa Computer. Seluruh hak cipta dilindungi.
                        </p>
                        <p className="text-3xs text-slate-400">
                            BEKASI SELATAN · KOORDINAT: -6.2573, 106.9864
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={scrollToTop}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-sans font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Kembali ke Atas</span>
                    </button>
                </div>
            </div>
        </footer>
    );
}
