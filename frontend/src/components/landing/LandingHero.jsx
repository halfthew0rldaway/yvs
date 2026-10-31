import { useState } from "react";
import { Search, Phone, Ticket as TicketIcon, MessageCircle, ShieldCheck, Eye, Award, CheckCircle2, ArrowDown } from "lucide-react";

const TRUST_PILLARS = [
    {
        icon: ShieldCheck,
        title: "Zero-Fee Diagnosis",
        desc: "Tidak ada biaya jika estimasi perbaikan tidak disepakati sebelum pengerjaan dimulai.",
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-100",
    },
    {
        icon: Eye,
        title: "Visual Audit Trail",
        desc: "Foto kondisi awal, proses, dan komponen yang diganti tersedia live di portal ini.",
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-100",
    },
    {
        icon: Award,
        title: "Digital Warranty Pass",
        desc: "Sertifikat garansi digital ber-hash aktif otomatis setelah serah terima unit.",
        color: "text-indigo-600",
        bg: "bg-indigo-50 border-indigo-100",
    },
    {
        icon: CheckCircle2,
        title: "25-Point QC Matrix",
        desc: "Pengujian menyeluruh thermals, daya, I/O, dan stabilitas beban sebelum diserahkan.",
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-100",
    },
];

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
        <section className="relative w-full bg-white pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-100 overflow-hidden">
            {/* Subtle dot grid texture */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
                    backgroundSize: "28px 28px",
                }}
            />

            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-blue-400 to-transparent" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Live Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-700 font-sans font-medium">
                        Workshop Online · 4 Teknisi Aktif · SLA Diagnosis &lt; 24 Jam
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    {/* Left Column */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="space-y-3">
                            <span className="text-xs font-sans font-semibold text-blue-600 uppercase tracking-wide">
                                Precision Hardware Engineering · Component-Level Repair
                            </span>
                            <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-[3.25rem] tracking-tight text-slate-900 leading-[1.1]">
                                Pusat Reparasi &amp; Rekayasa Komputer Berstandar Industri.
                            </h1>
                        </div>

                        <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
                            Solusi perbaikan laptop dan workstation level komponen: BGA reballing, power rail restoration, thermal overhaul, dan liquid damage recovery. Dilengkapi pelacakan status perbaikan live, bukti visual, dan sertifikat garansi digital.
                        </p>

                        {/* CTA Actions */}
                        <div className="pt-1 flex flex-wrap items-center gap-3 sm:gap-4">
                            <a
                                href="https://wa.me/6281234567890?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-sans font-medium text-sm transition-all shadow-md shadow-emerald-100"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Konsultasi via WhatsApp
                            </a>

                            <button
                                type="button"
                                onClick={() => {
                                    const el = document.getElementById("service-workflow");
                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-sans font-medium text-sm transition-all cursor-pointer"
                            >
                                <ArrowDown className="w-4 h-4 text-slate-400" />
                                Lihat Alur Kerja 3D
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Tracking Card */}
                    <div className="lg:col-span-5" id="hero-track-card">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-md relative">
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                                    <h2 className="font-display font-semibold text-base text-slate-900">
                                        Lacak Status Servis
                                    </h2>
                                </div>
                                <span className="text-xs text-slate-400 font-sans uppercase tracking-wide">
                                    Real-time
                                </span>
                            </div>

                            {/* Mode Toggle */}
                            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5">
                                <button
                                    type="button"
                                    onClick={() => setTrackType("tiket")}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-sans font-medium transition-all cursor-pointer ${
                                        trackType === "tiket"
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <TicketIcon className="w-3.5 h-3.5" />
                                    No. Tiket
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTrackType("telepon")}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-sans font-medium transition-all cursor-pointer ${
                                        trackType === "telepon"
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    No. HP
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-sans font-semibold text-slate-500 uppercase tracking-wide">
                                        {trackType === "tiket"
                                            ? "Masukkan Nomor Tiket Servis"
                                            : "Masukkan Nomor HP Terdaftar"}
                                    </label>
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={
                                            trackType === "tiket"
                                                ? "Contoh: SRV-2024-001"
                                                : "Contoh: 081234567890"
                                        }
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-sm placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-medium text-sm rounded-xl transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
                                            <span>Memeriksa...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            <span>Lacak Perangkat</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-400">
                                <span>Verifikasi hash SLA aktif</span>
                                <span className="text-emerald-600 font-medium">Database YVS Tersinkron</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust Pillars */}
                <div className="mt-14 sm:mt-20 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {TRUST_PILLARS.map((p) => {
                        const Icon = p.icon;
                        return (
                            <div key={p.title} className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${p.bg}`}>
                                    <Icon className={`w-4 h-4 ${p.color}`} />
                                </div>
                                <div>
                                    <h4 className="font-sans font-semibold text-sm text-slate-900">{p.title}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
