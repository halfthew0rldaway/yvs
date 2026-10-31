import { Shield, ArrowUp, Cpu } from "lucide-react";

export default function LandingFooter() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="relative w-full bg-[#08090b] text-zinc-100 py-12 sm:py-16 border-t border-zinc-900 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-zinc-800/80">
                    {/* Brand Column */}
                    <div className="md:col-span-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200 font-mono font-black text-xs">
                                YVS
                            </div>
                            <span className="font-grotesk font-black text-lg text-white uppercase tracking-tight">
                                Yangversa Computer
                            </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                            Pusat spesialis perbaikan laptop, workstation, motherboard BGA, dan rekayasa termal presisi. Didukung laboratorium diagnostik terkalibrasi dan transparansi penuh.
                        </p>
                        <div className="flex items-center gap-2 font-mono text-3xs text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>SISTEM TELEMETRI WORKSHOP AKTIF &bull; v2.4</span>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="md:col-span-3 space-y-3 font-mono text-xs">
                        <span className="text-3xs uppercase tracking-widest text-zinc-400 font-bold block">
                            NAVIGASI PORTAL
                        </span>
                        <ul className="space-y-2 text-zinc-400 text-2xs">
                            <li>
                                <a href="#service-workflow" className="hover:text-white transition-colors">
                                    01 // Alur Pengerjaan 3D
                                </a>
                            </li>
                            <li>
                                <a href="#service-spec" className="hover:text-white transition-colors">
                                    02 // Spesifikasi Layanan
                                </a>
                            </li>
                            <li>
                                <a href="#engineering-standards" className="hover:text-white transition-colors">
                                    03 // Standar Rekayasa YVS
                                </a>
                            </li>
                            <li>
                                <a href="#workshop-location" className="hover:text-white transition-colors">
                                    04 // Lokasi &amp; Jam Operasional
                                </a>
                            </li>
                            <li>
                                <a href="#track-lookup" className="hover:text-white transition-colors">
                                    05 // Formulir Pelacakan Servis
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Standards Notice */}
                    <div className="md:col-span-4 space-y-3 font-mono text-xs">
                        <span className="text-3xs uppercase tracking-widest text-zinc-400 font-bold block">
                            JAMINAN &amp; PROTEKSI RESMI
                        </span>
                        <p className="text-3xs text-zinc-400 leading-relaxed font-sans">
                            Setiap unit yang diservis di YVS Computer dilindungi oleh garansi resmi tertulis dengan sertifikat digital ber-hash verifikasi. Kebijakan Zero-Fee memastikan pelanggan tidak dikenakan biaya apapun apabila estimasi diagnosis tidak disetujui.
                        </p>
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={scrollToTop}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-2xs font-mono font-bold transition-colors cursor-pointer"
                            >
                                <ArrowUp className="w-3.5 h-3.5" />
                                <span>Kembali ke Atas</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-3xs text-zinc-400">
                    <p>
                        &copy; {new Date().getFullYear()} YVS Computer (Yangversa Service &bull; komputerawet.com). Seluruh hak cipta dilindungi.
                    </p>
                    <div className="flex items-center gap-4">
                        <span>ESD Safe Workstation</span>
                        <span>&bull;</span>
                        <span>Micro-Soldering Lab</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
