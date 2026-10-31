import { useState } from "react";
import { Search, Phone, Ticket as TicketIcon, MessageCircle, ShieldCheck, Microscope, Award, ArrowDown, CheckCircle2 } from "lucide-react";

export default function LandingHero({ onTrackSubmit, loading }) {
    const [trackType, setTrackType] = useState("tiket");
    const [query, setQuery] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        if (trackType === "tiket") {
            onTrackSubmit({ nomorTiket: query.trim() });
        } else {
            onTrackSubmit({ nomorTelepon: query.trim() });
        }
    };

    return (
        <section className="relative w-full bg-[#090a0d] text-zinc-100 pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-zinc-800/80 overflow-hidden">
            {/* Background Technical Grid Texture */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Workshop Live Status Badge */}
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80 mb-6 sm:mb-8 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-mono text-3xs sm:text-2xs uppercase tracking-wider text-zinc-300">
                        Workshop Online &bull; 4 Teknisi Bersertifikat Siaga &bull; SLA Diagnosis &lt; 24 Jam
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                    {/* Left Column: Editorial Value Proposition */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="space-y-3">
                            <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">
                                // Precision Hardware Engineering &bull; Level-Component Repair
                            </span>
                            <h1 className="font-grotesk font-black text-3xl sm:text-5xl lg:text-5xl tracking-tight text-white leading-[1.12]">
                                Pusat Rekayasa &amp; Reparasi Komputasi Berstandar Industri.
                            </h1>
                        </div>

                        <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl font-sans">
                            Solusi perbaikan teknis laptop, workstation, dan PC kustom tingkat mikron: dari BGA reballing, logic board power rail restoration, hingga penanganan thermal interface industri. Dilengkapi pelacakan status perbaikan live, bukti dokumentasi visual, dan sertifikat garansi digital.
                        </p>

                        {/* CTA Actions */}
                        <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                            <a
                                href="https://wa.me/6281234567890?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-900/30"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Konsultasi Teknis WhatsApp</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => {
                                    const el = document.getElementById("service-workflow");
                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer"
                            >
                                <ArrowDown className="w-4 h-4 text-zinc-400" />
                                <span>Jelajahi Alur Kerja 3D</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: High-Precision Live Tracking Input Card */}
                    <div className="lg:col-span-5" id="hero-track-card">
                        <div className="bg-[#111317] border border-zinc-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl relative">
                            {/* Card Header Spec */}
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-xs" />
                                    <h2 className="font-grotesk font-bold text-base text-white tracking-tight">
                                        Pelacakan Tiket Real-Time
                                    </h2>
                                </div>
                                <span className="font-mono text-3xs uppercase tracking-widest text-zinc-400">
                                    LIVE STATUS
                                </span>
                            </div>

                            {/* Mode Toggle Switch */}
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 mb-5">
                                <button
                                    type="button"
                                    onClick={() => setTrackType("tiket")}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                                        trackType === "tiket"
                                            ? "bg-zinc-800 text-white shadow-xs border border-zinc-700"
                                            : "text-zinc-400 hover:text-zinc-200"
                                    }`}
                                >
                                    <TicketIcon className="w-3.5 h-3.5" />
                                    No. Tiket
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTrackType("telepon")}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                                        trackType === "telepon"
                                            ? "bg-zinc-800 text-white shadow-xs border border-zinc-700"
                                            : "text-zinc-400 hover:text-zinc-200"
                                    }`}
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    No. HP
                                </button>
                            </div>

                            {/* Tracking Input Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block font-mono text-2xs uppercase tracking-wider text-zinc-400 font-bold">
                                        {trackType === "tiket"
                                            ? "Masukkan Nomor Tiket Servis"
                                            : "Masukkan Nomor HP Terdaftar"}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder={
                                                trackType === "tiket"
                                                    ? "Contoh: SRV-2024-001"
                                                    : "Contoh: 081234567890"
                                            }
                                            className="w-full px-4 py-3 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-white font-mono text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="w-full py-3.5 bg-zinc-100 hover:bg-white active:bg-zinc-200 text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" />
                                            <span>Memeriksa Telemetri Tiket...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            <span>Lacak Perangkat Sekarang</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Card Footer Micro-note */}
                            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-3xs font-mono text-zinc-500">
                                <span>Hash verifikasi SLA aktif</span>
                                <span className="text-emerald-400">Database YVS Sinkron</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 Architectural Engineering Commitments Bar */}
                <div className="mt-14 sm:mt-20 pt-8 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-tight">
                                Zero-Fee Diagnosis
                            </h4>
                            <p className="text-2xs text-zinc-400 mt-1 leading-relaxed">
                                Bebas biaya jika estimasi perbaikan tidak disepakati sebelum pengerjaan.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400 shrink-0">
                            <Microscope className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-tight">
                                Visual Audit Trail
                            </h4>
                            <p className="text-2xs text-zinc-400 mt-1 leading-relaxed">
                                Foto kondisi awal, pembuktian diagnosa, dan proses solder terunggah live.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                            <Award className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-tight">
                                Digital Warranty Pass
                            </h4>
                            <p className="text-2xs text-zinc-400 mt-1 leading-relaxed">
                                Sertifikat garansi resmi ber-hash unik langsung aktif begitu unit diambil.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-tight">
                                25-Point QC Matrix
                            </h4>
                            <p className="text-2xs text-zinc-400 mt-1 leading-relaxed">
                                Pengujian komprehensif suhu, voltase rel daya, dan kestabilan beban penuh.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
