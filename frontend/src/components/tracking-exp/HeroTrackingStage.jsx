import { memo, useEffect, useState } from "react";
import {
    Search,
    Camera,
    Clock,
    SearchX,
    PackageSearch,
    MessageCircle,
    AlertCircle,
    RotateCcw,
    ArrowUpRight,
} from "lucide-react";
import {
    MagneticWrap,
    MaskedLines,
    smoothScrollToTarget,
} from "./MotionPrimitives";
import { formatTicketInputMask } from "./motionTokens";

/**
 * ACT I — Unslopped Swiss-Editorial Hero on Cohesive Light Paper (--yvs-paper)
 * - Localizes typing state inside HeroTrackingStage so keystrokes never trigger
 *   root-level or below-the-fold re-renders (keeps keyboard INP < 16ms).
 * - Semantic toggle buttons (`aria-pressed`) instead of orphaned ARIA tabs.
 */
const HeroTrackingStage = memo(function HeroTrackingStage({
    initialMethod = "tiket",
    initialTiket = "",
    initialTelepon = "",
    loading,
    error,
    results,
    recentSearches,
    onLookupSubmit,
    onQuickSearch,
    onClearRecent,
    onWarmResult,
    onOpenScanner,
    inputRef,
}) {
    const [trackMethod, setTrackMethod] = useState(initialMethod);
    const [nomorTiket, setNomorTiket] = useState(initialTiket);
    const [nomorTelepon, setNomorTelepon] = useState(initialTelepon);
    const [inlineError, setInlineError] = useState("");

    useEffect(() => {
        setTrackMethod(initialMethod);
    }, [initialMethod]);

    useEffect(() => {
        if (initialTiket) setNomorTiket(initialTiket);
    }, [initialTiket]);

    useEffect(() => {
        if (initialTelepon) setNomorTelepon(initialTelepon);
    }, [initialTelepon]);

    const activeValue = trackMethod === "tiket" ? nomorTiket : nomorTelepon;

    const handleChange = (e) => {
        if (inlineError) setInlineError("");
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
        onLookupSubmit?.(trackMethod, trimmed);
    };

    const notFoundWaMessage = encodeURIComponent(
        trackMethod === "tiket"
            ? `Halo YVS Computer, saya mencoba melacak nomor servis ${nomorTiket.trim()} namun belum muncul di halaman pelacakan. Bisa bantu cek statusnya?`
            : `Halo YVS Computer, saya mencoba melacak servis dengan nomor WhatsApp ${nomorTelepon.trim()} namun belum muncul. Bisa bantu cek?`
    );

    return (
        <section
            id="track-lookup"
            className="relative w-full min-h-[92svh] lg:min-h-[100svh] bg-[var(--yvs-paper)] flex flex-col justify-between pt-24 pb-12 sm:pt-32 sm:pb-16 overflow-x-clip scroll-mt-16"
        >
            <div
                aria-hidden="true"
                className="yvs-hero-dot-grid pointer-events-none absolute inset-0 opacity-80"
            />
            <div className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 flex-1 flex flex-col justify-between gap-12 lg:gap-16">
                {/* 1. Asymmetric Editorial Header: Monumental Display Left + Concise Lede Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end pt-4 sm:pt-8">
                    <div className="lg:col-span-8 min-w-0">
                        <MaskedLines
                            as="h1"
                            trigger="mount"
                            lines={["Perbaikan perangkat,", "terbuka di tiap tahap."]}
                            className="font-display font-extrabold text-[2.5rem] xs:text-[2.9rem] sm:text-6xl lg:text-[4.5rem] xl:text-[5.25rem] text-[var(--yvs-ink)] tracking-[-0.04em] leading-[1.03]"
                        />
                    </div>

                    <div className="lg:col-span-4 space-y-4 lg:pb-2 min-w-0">
                        <p className="text-[var(--yvs-muted)] text-base sm:text-[1.0625rem] leading-relaxed max-w-[38ch]">
                            Pantau hasil diagnosa, rincian biaya, foto pengerjaan, dan kartu garansi digital langsung dari nomor servis Anda.
                        </p>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                            <a
                                href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20keluhan%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--yvs-ink)] hover:text-[var(--yvs-accent)] underline decoration-[var(--yvs-rule)] hover:decoration-[var(--yvs-accent)] underline-offset-4 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 text-[var(--yvs-accent)] shrink-0" aria-hidden="true" />
                                <span>Tanya lewat WhatsApp</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => {
                                    window.dispatchEvent(new Event("yvs:arm-sections"));
                                    window.requestAnimationFrame(() => {
                                        smoothScrollToTarget("alur-servis", 0);
                                    });
                                }}
                                className="min-h-[44px] inline-flex items-center text-sm font-medium text-[var(--yvs-muted)] hover:text-[var(--yvs-ink)] transition-colors cursor-pointer"
                            >
                                Lihat alur pengerjaan
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Full-Width Architectural Tracking Command Bar (Equal Left & Right Edges) */}
                <div
                    style={{ viewTransitionName: "yvs-tracking-shell" }}
                    className="w-full pt-8 border-t border-[var(--yvs-rule)] space-y-4"
                >
                    {/* Method Switcher + Subtle Format & Recent Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div
                            role="group"
                            aria-label="Metode pelacakan"
                            className="inline-flex items-center gap-6"
                        >
                            {[
                                { key: "tiket", label: "Nomor servis" },
                                { key: "telepon", label: "Nomor WhatsApp" },
                            ].map((tab) => {
                                const active = trackMethod === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => {
                                            setInlineError("");
                                            setTrackMethod(tab.key);
                                        }}
                                        className={`relative min-h-[44px] py-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                                            active
                                                ? "text-[var(--yvs-ink)]"
                                                : "text-[var(--yvs-muted)] hover:text-[var(--yvs-ink)]"
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            aria-hidden="true"
                                            className={`absolute inset-x-0 bottom-0 h-[2px] bg-[var(--yvs-accent)] transition-transform duration-200 origin-left ${
                                                active ? "scale-x-100" : "scale-x-0"
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--yvs-muted)]">
                            {recentSearches.length > 0 ? (
                                <>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Terakhir dicari:</span>
                                    </span>
                                    {recentSearches.map((item, idx) => (
                                        <button
                                            key={`${item.type}-${item.value}-${idx}`}
                                            type="button"
                                            onClick={() => {
                                                setInlineError("");
                                                onQuickSearch(item);
                                            }}
                                            className="min-h-[44px] px-3 py-1 rounded-lg bg-[var(--yvs-paper-2)] hover:bg-blue-50 text-[var(--yvs-ink)] hover:text-[var(--yvs-accent)] font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap"
                                        >
                                            {item.value}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={onClearRecent}
                                        className="min-h-[44px] px-2 font-semibold text-[var(--yvs-muted)] hover:text-rose-700 transition-colors cursor-pointer"
                                    >
                                        Hapus
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInlineError("");
                                        onQuickSearch({ type: "tiket", value: "SRV-2026-073" });
                                    }}
                                    className="min-h-[44px] inline-flex items-center gap-1 font-medium text-[var(--yvs-muted)] hover:text-[var(--yvs-accent)] transition-colors cursor-pointer whitespace-nowrap"
                                >
                                    <span>Contoh: SRV-2026-073</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Equal-Height Input + Primary Blue CTA Row (56px matched height) */}
                    <form
                        onSubmit={handleFormSubmit}
                        noValidate
                        className="flex flex-col sm:flex-row items-stretch gap-3"
                    >
                        <div className="yvs-border-beam-wrap relative flex-1 min-w-0">
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
                                onFocus={onWarmResult}
                                onChange={handleChange}
                                placeholder={
                                    trackMethod === "tiket"
                                        ? "Contoh: SRV-2026-073"
                                        : "Contoh: 081234567890"
                                }
                                className={`yvs-exp-track-input w-full h-[56px] pl-4 pr-28 bg-white border rounded-xl font-mono font-semibold text-[var(--yvs-ink)] placeholder:font-sans placeholder:font-normal placeholder:text-[var(--yvs-muted)] transition-colors ${
                                    inlineError
                                        ? "border-rose-500"
                                        : "border-[var(--yvs-rule)] hover:border-slate-400"
                                }`}
                            />
                            {!inlineError && (
                                <span aria-hidden="true" className="yvs-border-beam-ring" />
                            )}
                            <button
                                type="button"
                                onClick={onOpenScanner}
                                aria-label="Pindai atau unggah gambar QR pada lembar nota"
                                title="Pindai kamera atau unggah gambar QR nota servis"
                                className="absolute right-2 inset-y-0 my-auto z-20 h-[44px] px-3 rounded-lg bg-[var(--yvs-paper-2)] hover:bg-blue-50 text-[var(--yvs-ink)] hover:text-[var(--yvs-accent)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            >
                                <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span className="hidden xs:inline">Pindai QR</span>
                            </button>
                        </div>

                        <MagneticWrap strength={0.12} className="sm:w-auto w-full shrink-0">
                            <button
                                type="submit"
                                disabled={loading}
                                onPointerEnter={onWarmResult}
                                className="yvs-btn-shimmer w-full sm:w-auto h-[56px] px-8 rounded-xl bg-[var(--yvs-accent)] hover:bg-[var(--yvs-accent-hover)] text-[var(--yvs-accent-ink)] font-semibold text-sm sm:text-base transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                            >
                                {loading ? (
                                    <>
                                        <span
                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full motion-safe:animate-spin"
                                            aria-hidden="true"
                                        />
                                        <span>Mencari…</span>
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

                    {/* Reserved Helper / Inline Validation Row */}
                    {inlineError && (
                        <p
                            id="yvs-track-inline-error"
                            role="alert"
                            className="flex items-start gap-1.5 text-xs font-medium text-rose-700"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{inlineError}</span>
                        </p>
                    )}

                    {/* Error State */}
                    {error && (
                        <div
                            role="alert"
                            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                        >
                            <div className="flex items-start gap-2">
                                <SearchX className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
                                <span className="font-semibold">{error}</span>
                            </div>
                            <a
                                href={`https://wa.me/628121034212?text=${notFoundWaMessage}`}
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[44px] inline-flex items-center font-semibold text-[var(--yvs-accent)] hover:underline shrink-0"
                            >
                                Tanya admin di WhatsApp
                            </a>
                        </div>
                    )}

                    {/* Helpful Not Found State */}
                    {results && results.length === 0 && (
                        <div
                            role="status"
                            className="p-4 rounded-xl bg-[var(--yvs-paper-2)] border border-[var(--yvs-rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                        >
                            <div className="flex items-start gap-2.5">
                                <PackageSearch className="w-5 h-5 shrink-0 text-[var(--yvs-accent)] mt-0.5" aria-hidden="true" />
                                <div>
                                    <p className="font-bold text-[var(--yvs-ink)]">Nomor servis belum ditemukan</p>
                                    <p className="text-[var(--yvs-muted)] text-xs sm:text-sm mt-0.5">
                                        Periksa kembali kode pada lembar nota atau hubungi admin lewat WhatsApp agar kami bantu cek.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => inputRef?.current?.focus()}
                                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-white border border-[var(--yvs-rule)] text-[var(--yvs-ink)] text-xs font-semibold cursor-pointer whitespace-nowrap"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Periksa ulang</span>
                                </button>
                                <a
                                    href={`https://wa.me/628121034212?text=${notFoundWaMessage}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-[var(--yvs-accent)] hover:bg-[var(--yvs-accent-hover)] text-[var(--yvs-accent-ink)] text-xs font-semibold transition-colors whitespace-nowrap"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Tanya WhatsApp</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Quiet 3-Column Hairline Facts Footer inside Hero */}
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-[var(--yvs-rule)] pt-7 border-t border-[var(--yvs-rule)]">
                    <div className="sm:pr-8 space-y-1">
                        <dt className="font-display font-bold text-sm text-[var(--yvs-ink)]">
                            Konfirmasi biaya di awal
                        </dt>
                        <dd className="text-sm text-[var(--yvs-muted)] leading-relaxed">
                            Perkiraan biaya disampaikan dulu setelah diagnosa, baru dikerjakan bila Anda setuju.
                        </dd>
                    </div>
                    <div className="sm:px-8 space-y-1">
                        <dt className="font-display font-bold text-sm text-[var(--yvs-ink)]">
                            Dokumentasi &amp; suku cadang terbuka
                        </dt>
                        <dd className="text-sm text-[var(--yvs-muted)] leading-relaxed">
                            Foto kondisi awal, catatan pengerjaan, dan komponen yang diganti tercatat di nomor servis.
                        </dd>
                    </div>
                    <div className="sm:pl-8 space-y-1">
                        <dt className="font-display font-bold text-sm text-[var(--yvs-ink)]">
                            Workshop Pekayon, Bekasi Selatan
                        </dt>
                        <dd className="text-sm text-[var(--yvs-muted)] leading-relaxed">
                            Jl. Raya Pekayon No. 25, buka setiap hari pukul 09.00 sampai 18.00 WIB.
                        </dd>
                    </div>
                </dl>
            </div>
        </section>
    );
});

export default HeroTrackingStage;
