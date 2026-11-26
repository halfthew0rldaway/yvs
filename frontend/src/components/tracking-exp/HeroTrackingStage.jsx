import { useState } from "react";
import {
    Search,
    Camera,
    Clock,
    SearchX,
    PackageSearch,
    MessageCircle,
    AlertCircle,
    RotateCcw,
    ArrowDown,
} from "lucide-react";
import {
    MagneticWrap,
    MaskedLines,
    smoothScrollToTarget,
} from "./MotionPrimitives";
import { formatTicketInputMask } from "./motionTokens";

/**
 * ACT I — Full-Viewport Seamless Studio Hero (#EFEFEF matches /frames/001.webp cyclorama)
 * - No boxed SaaS form card, no eyebrows, no middle-dot metadata clutter.
 * - Monumental display typography + floating borderless studio laptop + sleek inline tracking command bar.
 * - Instant LCP (< 1.8s) on mobile & desktop: hero headline + 43KB studio laptop paint immediately.
 */
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
    const [inlineError, setInlineError] = useState("");
    const activeValue = trackMethod === "tiket" ? nomorTiket : nomorTelepon;

    const handleChange = (e) => {
        setInlineError("");
        const val = e.target.value;
        if (trackMethod === "tiket") {
            setNomorTiket(formatTicketInputMask(val));
        } else {
            setNomorTelepon(val.replace(/[^\d+\s-]/g, "").slice(0, 18));
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const trimmed = activeValue.trim();
        if (trackMethod === "tiket") {
            if (trimmed.length < 3) {
                setInlineError("Masukkan minimal 3 karakter nomor servis, contoh: SRV-2026-073.");
                inputRef?.current?.focus();
                return;
            }
        } else {
            const digits = trimmed.replace(/\D/g, "");
            if (digits.length < 8) {
                setInlineError("Masukkan nomor WhatsApp yang valid (minimal 8 digit angka).");
                inputRef?.current?.focus();
                return;
            }
        }
        setInlineError("");
        onSubmit(e);
    };

    const notFoundWaMessage = encodeURIComponent(
        trackMethod === "tiket"
            ? `Halo YVS Computer, saya mencoba melacak nomor servis ${nomorTiket.trim()} namun belum muncul di halaman pelacakan. Bisa bantu cek statusnya?`
            : `Halo YVS Computer, saya mencoba melacak servis dengan nomor WhatsApp ${nomorTelepon.trim()} namun belum muncul. Bisa bantu cek?`
    );

    return (
        <section
            id="track-lookup"
            className="relative w-full min-h-[100svh] yvs-studio-canvas flex flex-col justify-between pt-24 pb-10 sm:pt-28 sm:pb-12 overflow-x-clip scroll-mt-16"
        >
            <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 flex-1 flex flex-col justify-between gap-8 lg:gap-10">
                {/* Main Asymmetric Stage: Monumental Type (Left) + Borderless Floating Studio Hardware (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center my-auto">
                    {/* LEFT: Monumental Display Headline + One Sentence + Quiet WhatsApp Link */}
                    <div className="lg:col-span-6 space-y-5 sm:space-y-6 min-w-0 relative z-10">
                        <MaskedLines
                            as="h1"
                            trigger="mount"
                            lines={[
                                "Perbaikan perangkat,",
                                "terbuka di tiap tahap.",
                            ]}
                            className="font-display font-extrabold text-[2.45rem] xs:text-[2.85rem] sm:text-6xl lg:text-[4.15rem] xl:text-[4.85rem] text-[#071124] tracking-[-0.04em] leading-[1.03] break-words"
                        />

                        <p className="text-[#071124]/75 text-base sm:text-lg lg:text-[1.15rem] leading-relaxed max-w-lg font-sans">
                            Pantau hasil diagnosa, rincian biaya, foto pengerjaan, dan masa garansi langsung dari nomor servis Anda.
                        </p>

                        <div className="flex flex-wrap items-center gap-5 pt-1">
                            <a
                                href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20keluhan%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-[#071124] hover:text-[#2563EB] underline decoration-[#071124]/30 hover:decoration-[#2563EB] underline-offset-4 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
                                <span>Tanya teknisi lewat WhatsApp</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => smoothScrollToTarget("alur-servis", 0)}
                                className="hidden sm:inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[#071124]/70 hover:text-[#071124] transition-colors cursor-pointer"
                            >
                                <span>Lihat proses perbaikan</span>
                                <ArrowDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Borderless Studio Laptop Floating Directly on #EFEFEF Canvas */}
                    <div className="lg:col-span-6 min-w-0 relative flex items-center justify-center">
                        <img
                            src="/frames/001.webp"
                            alt="Perangkat laptop di meja pemeriksaan studio YVS Computer"
                            width="1280"
                            height="720"
                            fetchPriority="high"
                            decoding="async"
                            className="w-full max-w-[680px] lg:max-w-none lg:scale-[1.12] xl:scale-[1.16] h-auto object-contain select-none pointer-events-none yvs-studio-frame"
                        />
                    </div>
                </div>

                {/* Bottom Architectural Tracking Command Bar (Primary CTA Inside First Screen) */}
                <div className="relative z-20 w-full max-w-4xl">
                    <div
                        style={{ viewTransitionName: "yvs-tracking-shell" }}
                        className="bg-white rounded-2xl sm:rounded-[22px] p-3 sm:p-4 shadow-[0_28px_70px_-24px_rgba(7,17,36,0.16)] border border-[#071124]/10 space-y-3"
                    >
                        {/* Top Slim Method Selector + Format Guide */}
                        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                            <div
                                role="tablist"
                                aria-label="Metode pelacakan"
                                className="inline-flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl"
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
                                            onClick={() => {
                                                setInlineError("");
                                                setTrackMethod(tab.key);
                                            }}
                                            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                                                active
                                                    ? "bg-white text-[#071124] shadow-2xs"
                                                    : "text-[#071124]/70 hover:text-[#071124]"
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <span className="text-xs text-[#475569] font-mono hidden sm:inline">
                                {trackMethod === "tiket"
                                    ? "Format nota: SRV-2026-073"
                                    : "Nomor terdaftar di nota"}
                            </span>
                        </div>

                        {/* Single-Row Command Form on Desktop, Tactile Stack on Mobile */}
                        <form
                            onSubmit={handleFormSubmit}
                            noValidate
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                        >
                            <div className="relative flex-1 min-w-0">
                                <label htmlFor="yvs-exp-track-field" className="sr-only">
                                    {trackMethod === "tiket"
                                        ? "Masukkan nomor servis"
                                        : "Masukkan nomor WhatsApp terdaftar"}
                                </label>
                                <input
                                    id="yvs-exp-track-field"
                                    ref={inputRef}
                                    type={trackMethod === "telepon" ? "tel" : "text"}
                                    inputMode={trackMethod === "telepon" ? "tel" : "text"}
                                    autoComplete="off"
                                    spellCheck={false}
                                    aria-invalid={Boolean(inlineError || error)}
                                    aria-describedby={inlineError ? "yvs-track-inline-error" : undefined}
                                    value={activeValue}
                                    onChange={handleChange}
                                    placeholder={
                                        trackMethod === "tiket"
                                            ? "Contoh: SRV-2026-073"
                                            : "Contoh: 081234567890"
                                    }
                                    className={`yvs-exp-track-input w-full min-h-[54px] pl-4 pr-14 py-3 bg-[#F8FAFC] focus:bg-white border rounded-xl font-mono font-semibold text-[#071124] placeholder:font-sans placeholder:font-normal placeholder:text-[#475569] focus:outline-none focus:ring-4 transition-colors ${
                                        inlineError
                                            ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/15"
                                            : "border-slate-300 focus:border-[#2563EB] focus:ring-[#2563EB]/15"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={onOpenScanner}
                                    aria-label="Pindai QR pada lembar nota"
                                    title="Pindai QR nota servis"
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-lg text-[#071124]/70 hover:text-[#2563EB] hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <Camera className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>

                            <MagneticWrap strength={0.14} className="sm:w-auto w-full shrink-0">
                                <button
                                    type="submit"
                                    data-cursor="Lacak"
                                    disabled={loading}
                                    className="w-full sm:w-auto min-h-[54px] px-7 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-blue-800 text-white font-semibold text-sm sm:text-base transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                                >
                                    {loading ? (
                                        <>
                                            <span
                                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                                aria-hidden="true"
                                            />
                                            <span>Mencari...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                                            <span>Cek status servis</span>
                                        </>
                                    )}
                                </button>
                            </MagneticWrap>
                        </form>

                        {/* Inline Validation */}
                        {inlineError && (
                            <p
                                id="yvs-track-inline-error"
                                role="alert"
                                className="px-1 flex items-start gap-1.5 text-xs font-medium text-rose-700"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{inlineError}</span>
                            </p>
                        )}

                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 px-1 pt-0.5 text-xs">
                                <span className="inline-flex items-center gap-1 text-[#475569] font-medium mr-0.5">
                                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Terakhir:</span>
                                </span>
                                {recentSearches.map((item, idx) => (
                                    <button
                                        key={`${item.type}-${item.value}-${idx}`}
                                        type="button"
                                        onClick={() => {
                                            setInlineError("");
                                            onQuickSearch(item);
                                        }}
                                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-blue-50 text-[#071124] hover:text-[#2563EB] font-mono text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        {item.value}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={onClearRecent}
                                    className="min-h-[34px] text-xs font-semibold text-[#475569] hover:text-rose-700 px-2 transition-colors cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div
                                role="alert"
                                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
                            >
                                <div className="flex items-start gap-2">
                                    <SearchX className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
                                    <span className="font-semibold">{error}</span>
                                </div>
                                <a
                                    href={`https://wa.me/628121034212?text=${notFoundWaMessage}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[#2563EB] hover:underline shrink-0"
                                >
                                    Tanya admin di WhatsApp
                                </a>
                            </div>
                        )}

                        {/* Helpful Not Found State */}
                        {results && results.length === 0 && (
                            <div
                                role="status"
                                className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                            >
                                <div className="flex items-start gap-2.5">
                                    <PackageSearch className="w-5 h-5 shrink-0 text-[#2563EB] mt-0.5" aria-hidden="true" />
                                    <div>
                                        <p className="font-bold text-[#071124]">Nomor servis tidak ditemukan</p>
                                        <p className="text-[#475569] mt-0.5">
                                            Cek kembali kode di nota Anda atau hubungi admin agar kami bantu lacak.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => inputRef?.current?.focus()}
                                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-white border border-slate-300 text-[#071124] text-xs font-semibold cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Cek ulang</span>
                                    </button>
                                    <a
                                        href={`https://wa.me/628121034212?text=${notFoundWaMessage}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-[#071124] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Tanya WhatsApp</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
