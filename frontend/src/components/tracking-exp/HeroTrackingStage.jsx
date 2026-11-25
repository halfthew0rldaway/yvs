import { useRef } from "react";
import { motion } from "framer-motion";
import {
    Search,
    QrCode,
    Camera,
    Clock,
    SearchX,
    PackageSearch,
    ArrowDownRight,
    MessageCircle,
    ArrowRight,
} from "lucide-react";
import { MagneticWrap, MaskedLines, smoothScrollToTarget } from "./MotionPrimitives";

export default function HeroTrackingStage({
    trackMethod,
    setTrackMethod,
    nomorTiket,
    setNomorTiket,
    nomorTelepon,
    setNomorTelepon,
    loading,
    error,
    results,
    recentSearches,
    onSubmit,
    onQuickSearch,
    onClearRecent,
    onOpenScanner,
    inputRef,
}) {
    const panelRef = useRef(null);

    const handlePointerMove = (e) => {
        const panel = panelRef.current;
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        panel.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        panel.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    return (
        <section
            id="track-lookup"
            className="relative w-full bg-slate-50 yvs-exp-drafting-grid border-b border-slate-200 pt-20 pb-12 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 overflow-x-clip scroll-mt-16"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Top Architectural Meta Bar */}
                <div className="hidden sm:flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-6 sm:pb-8 mb-8 sm:mb-12 border-b border-slate-200/90 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-900 font-semibold">YVS / PEKAYON BEKASI</span>
                        <span className="text-slate-300" aria-hidden="true">/</span>
                        <span>Servis Laptop, MacBook &amp; PC</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Jl. Raya Pekayon No. 25</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="text-emerald-700 font-semibold">Buka setiap hari 09.00–18.00</span>
                    </div>
                </div>

                {/* Asymmetric Editorial 12-Column Composition */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-12 xl:gap-16 items-start">
                    {/* LEFT: Editorial Typography + Live Circuit Trace + Secondary Actions */}
                    <div className="lg:col-span-6 xl:col-span-7 space-y-4 sm:space-y-7 lg:space-y-8 min-w-0">
                        <MaskedLines
                            as="h1"
                            trigger="mount"
                            lines={[
                                "Lacak perbaikan",
                                "perangkat Anda,",
                                "jelas di tiap tahap.",
                            ]}
                            accentLineIndex={2}
                            accentClassName="text-blue-600"
                            className="font-display font-extrabold text-[1.95rem] xs:text-[2.2rem] sm:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] text-slate-950 tracking-[-0.035em] leading-[1.04]"
                        />

                        <p className="text-slate-600 text-sm sm:text-lg leading-relaxed max-w-xl font-sans">
                            Masukkan nomor servis atau nomor WhatsApp terdaftar. Foto kondisi awal, hasil pemeriksaan teknisi, rincian biaya, hingga garansi bisa langsung dilihat di sini.
                        </p>

                        {/* Bespoke Animated PCB Copper Trace Line (Desktop & Tablet) */}
                        <div className="hidden sm:block pt-1 max-w-xl" aria-hidden="true">
                            <svg
                                viewBox="0 0 540 34"
                                fill="none"
                                className="w-full h-8 text-slate-300"
                                preserveAspectRatio="xMinYMid meet"
                            >
                                <path
                                    d="M2 17 H140 L158 5 H295 L312 17 H438 L452 29 H534"
                                    stroke="currentColor"
                                    strokeWidth="1.25"
                                />
                                <path
                                    d="M2 17 H140 L158 5 H295 L312 17 H438 L452 29 H534"
                                    stroke="#2563eb"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    className="yvs-pcb-trace-pulse"
                                />
                                <circle cx="4" cy="17" r="3" fill="#2563eb" />
                                <circle cx="158" cy="5" r="2.5" fill="#fff" stroke="#2563eb" strokeWidth="1.5" />
                                <circle cx="312" cy="17" r="2.5" fill="#fff" stroke="#64748b" strokeWidth="1.5" />
                                <circle cx="452" cy="29" r="2.5" fill="#fff" stroke="#2563eb" strokeWidth="1.5" />
                                <rect x="530" y="25" width="8" height="8" rx="1.5" fill="#2563eb" />
                            </svg>
                        </div>

                        {/* Secondary Direct Links (Desktop & Tablet; mobile puts tracking form right above fold) */}
                        <div className="hidden sm:flex flex-wrap items-center gap-3 sm:gap-5 pt-1">
                            <MagneticWrap strength={0.16}>
                                <button
                                    type="button"
                                    onClick={() => smoothScrollToTarget("cek-keluhan", -64)}
                                    className="inline-flex items-center gap-2 min-h-[44px] px-4 sm:px-5 py-2.5 rounded-lg bg-white hover:bg-slate-900 hover:text-white text-slate-900 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    <span>Cek titik kerusakan perangkat</span>
                                    <ArrowDownRight className="w-4 h-4 shrink-0" />
                                </button>
                            </MagneticWrap>

                            <a
                                href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20keluhan%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 min-h-[44px] px-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Tanya teknisi via WhatsApp</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* RIGHT: Immediate Tracking Instrument Panel (Always Accessible Above Fold) */}
                    <div className="lg:col-span-6 xl:col-span-5 min-w-0">
                        <div
                            ref={panelRef}
                            onPointerMove={handlePointerMove}
                            style={{ viewTransitionName: "yvs-tracking-shell" }}
                            className="group relative bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-7 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)] overflow-hidden"
                        >
                            {/* Subtle pointer-reactive studio border sheen (desktop fine pointer only) */}
                            <div
                                aria-hidden="true"
                                className="hidden lg:block pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background:
                                        "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(37, 99, 235, 0.08), transparent 65%)",
                                }}
                            />

                            <div className="relative z-10 space-y-5">
                                {/* Panel Header */}
                                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div>
                                        <h2 className="font-display font-bold text-lg sm:text-xl text-slate-950 tracking-tight">
                                            Cek status servis
                                        </h2>
                                        <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
                                            Pilih cara pencarian atau pindai QR di lembar nota.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onOpenScanner}
                                        className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                                        title="Pindai QR pada lembar nota servis"
                                    >
                                        <Camera className="w-3.5 h-3.5 shrink-0" />
                                        <span>Pindai QR</span>
                                    </button>
                                </div>

                                {/* Spring-Animated Mode Switcher */}
                                <div
                                    role="tablist"
                                    aria-label="Metode pelacakan"
                                    className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl relative"
                                >
                                    {[
                                        { key: "tiket", label: "Nomor servis" },
                                        { key: "telepon", label: "Nomor WhatsApp" },
                                    ].map((tab) => {
                                        const active = trackMethod === tab.key;
                                        return (
                                            <button
                                                key={tab.key}
                                                role="tab"
                                                aria-selected={active}
                                                type="button"
                                                onClick={() => setTrackMethod(tab.key)}
                                                className={`relative z-10 min-h-[40px] py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                                                    active ? "text-slate-950" : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            >
                                                {active && (
                                                    <motion.span
                                                        layoutId="yvs-track-tab-pill"
                                                        transition={{ type: "spring", stiffness: 460, damping: 34 }}
                                                        className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/90 -z-10"
                                                    />
                                                )}
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tracking Form */}
                                <form onSubmit={onSubmit} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="yvs-exp-track-field"
                                            className="block text-xs sm:text-[13px] font-semibold text-slate-700 mb-1.5"
                                        >
                                            {trackMethod === "tiket"
                                                ? "Masukkan nomor servis"
                                                : "Masukkan nomor WhatsApp terdaftar"}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="yvs-exp-track-field"
                                                ref={inputRef}
                                                type="text"
                                                autoComplete="off"
                                                value={trackMethod === "tiket" ? nomorTiket : nomorTelepon}
                                                onChange={(e) =>
                                                    trackMethod === "tiket"
                                                        ? setNomorTiket(e.target.value)
                                                        : setNomorTelepon(e.target.value)
                                                }
                                                placeholder={
                                                    trackMethod === "tiket"
                                                        ? "Contoh: SRV-2026-001"
                                                        : "Contoh: 081234567890"
                                                }
                                                className="yvs-exp-track-input w-full min-h-[48px] pl-4 pr-12 py-3 bg-slate-50 focus:bg-white border border-slate-300/90 focus:border-blue-600 rounded-xl font-mono text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                                            />
                                            {trackMethod === "tiket" && (
                                                <button
                                                    type="button"
                                                    onClick={onOpenScanner}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                                    aria-label="Pindai QR nota servis"
                                                    title="Pindai QR nota servis"
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Searches */}
                                    {recentSearches.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium mr-0.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Terakhir dicari:</span>
                                            </span>
                                            {recentSearches.map((item, idx) => (
                                                <button
                                                    key={`${item.type}-${item.value}-${idx}`}
                                                    type="button"
                                                    onClick={() => onQuickSearch(item)}
                                                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 font-mono text-xs font-medium transition-colors cursor-pointer"
                                                >
                                                    {item.value}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={onClearRecent}
                                                className="text-xs text-slate-400 hover:text-rose-600 px-1.5 py-1 transition-colors cursor-pointer"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={
                                            loading ||
                                            (trackMethod === "tiket" ? !nomorTiket.trim() : !nomorTelepon.trim())
                                        }
                                        className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Mencari data servis...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-4 h-4" />
                                                <span>Lacak servis</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Error State */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs sm:text-sm"
                                    >
                                        <SearchX className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {/* Not Found Empty State */}
                                {results && results.length === 0 && (
                                    <div
                                        role="status"
                                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs sm:text-sm"
                                    >
                                        <PackageSearch className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-slate-900">Data servis tidak ditemukan</p>
                                            <p className="text-slate-600 mt-0.5 leading-relaxed">
                                                Periksa kembali nomor servis di nota Anda atau hubungi WhatsApp kami di{" "}
                                                <a
                                                    href="https://wa.me/628121034212"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-semibold text-blue-600 hover:underline"
                                                >
                                                    0812-1034-212
                                                </a>
                                                .
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Architectural Principles Bar (No cards-inside-cards, pure editorial grid) */}
                <div className="mt-12 sm:mt-16 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-slate-200">
                    <div className="sm:pr-8 space-y-1">
                        <p className="font-mono text-xs text-blue-600 font-semibold">01 · Cek tanpa risiko</p>
                        <p className="font-display font-bold text-base text-slate-900">Gratis cek bila tidak jadi</p>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Biaya diinfokan sebelum pengerjaan. Bila batal, perangkat bisa langsung diambil tanpa biaya cek.
                        </p>
                    </div>
                    <div className="sm:px-8 space-y-1">
                        <p className="font-mono text-xs text-blue-600 font-semibold">02 · Bukti transparan</p>
                        <p className="font-display font-bold text-base text-slate-900">Komponen lama dikembalikan</p>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Foto kerusakan dan seluruh komponen bekas penggantian selalu diserahkan utuh kepada pemilik.
                        </p>
                    </div>
                    <div className="sm:pl-8 space-y-1">
                        <p className="font-mono text-xs text-blue-600 font-semibold">03 · Jaminan tertulis</p>
                        <p className="font-display font-bold text-base text-slate-900">Garansi digital 30–90 hari</p>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Tercatat otomatis di sistem pelacakan, aman walau lembar nota kertas suatu saat terselip.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
