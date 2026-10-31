import { ArrowUp, Cpu, MessageCircle, MapPin } from "lucide-react";

export default function LandingFooter() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="relative w-full bg-slate-900 text-slate-100 py-12 sm:py-16 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-800">
                    {/* Brand Column */}
                    <div className="md:col-span-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Cpu className="w-4.5 h-4.5 text-white" />
                            </div>
                            <span className="font-display font-bold text-lg text-white uppercase tracking-tight">
                                YVS Computer
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                            Pusat spesialis perbaikan laptop, workstation, motherboard BGA, dan rekayasa termal presisi. Didukung laboratorium diagnostik terkalibrasi dan transparansi penuh.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Workshop Online · Sistem ERP Aktif</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="md:col-span-3 space-y-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block">
                            Navigasi Portal
                        </span>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><a href="#service-workflow" className="hover:text-white transition-colors">Alur Pengerjaan 3D</a></li>
                            <li><a href="#service-spec" className="hover:text-white transition-colors">Spesifikasi Layanan</a></li>
                            <li><a href="#engineering-standards" className="hover:text-white transition-colors">Standar Rekayasa YVS</a></li>
                            <li><a href="#workshop-location" className="hover:text-white transition-colors">Lokasi & Jam Operasional</a></li>
                        </ul>
                    </div>

                    {/* Contact + Policy */}
                    <div className="md:col-span-4 space-y-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block">
                            Kontak &amp; Jaminan
                        </span>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Setiap unit yang diservis dilindungi garansi resmi tertulis dengan sertifikat digital ber-hash verifikasi. Kebijakan Zero-Fee memastikan tidak ada biaya jika estimasi tidak disetujui.
                        </p>
                        <div className="flex flex-col gap-2">
                            <a
                                href="https://wa.me/6281234567890"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp Konsultasi
                            </a>
                            <a
                                href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <MapPin className="w-4 h-4" />
                                Lihat Lokasi di Maps
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>
                        &copy; {new Date().getFullYear()} YVS Computer (Yangversa Service · komputerawet.com). Seluruh hak cipta dilindungi.
                    </p>
                    <button
                        type="button"
                        onClick={scrollToTop}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                        <ArrowUp className="w-3.5 h-3.5" />
                        Kembali ke Atas
                    </button>
                </div>
            </div>
        </footer>
    );
}
