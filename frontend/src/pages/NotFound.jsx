import { Link } from "react-router-dom";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white text-slate-950 font-sans flex flex-col">
            <header className="border-b border-slate-200/80">
                <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
                    <Link
                        to="/tracking"
                        className="inline-flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-4 rounded-lg"
                    >
                        <img
                            src="/logo-yangversa.png"
                            alt="YVS Computer"
                            width="32"
                            height="32"
                            className="w-8 h-8 rounded-lg object-contain border border-slate-200 p-0.5 bg-white"
                        />
                        <span className="font-display font-bold text-base tracking-tight text-slate-950">
                            YVS Computer
                        </span>
                    </Link>

                    <Link
                        to="/tracking"
                        className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        <span>Lacak Servis</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
                <div className="w-full max-w-xl space-y-6">
                    <p className="font-mono text-sm font-semibold text-blue-600 tracking-wide">
                        404 · HALAMAN TIDAK DITEMUKAN
                    </p>
                    <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-slate-950 tracking-[-0.03em] leading-[1.1]">
                        Alamat yang Anda buka tidak tersedia.
                    </h1>
                    <p className="text-base text-slate-600 leading-relaxed">
                        Tautan mungkin sudah berubah atau keliru diketik. Anda bisa langsung melacak status servis perangkat atau menghubungi tim kami lewat WhatsApp.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                        <Link
                            to="/tracking"
                            className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Ke halaman pelacakan servis</span>
                        </Link>
                        <a
                            href="https://wa.me/628121034212?text=Halo%20YVS%20Computer%2C%20saya%20butuh%20bantuan%20mengecek%20status%20servis."
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 text-sm font-semibold transition-colors"
                        >
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                            <span>Hubungi WhatsApp</span>
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
