import { useEffect, useRef, useState } from "react";
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
    AlertCircle,
    RotateCcw,
} from "lucide-react";
import {
    MagneticWrap,
    MaskedLines,
    smoothScrollToTarget,
    usePrefersReducedMotion,
} from "./MotionPrimitives";
import { formatTicketInputMask, loadGsapRuntime } from "./motionTokens";

const SAMPLED_FRAME_INDICES = Array.from({ length: 20 }, (_, i) =>
    String(Math.min(240, Math.max(1, Math.round(1 + (i * 239) / 19)))).padStart(3, "0")
);

/**
 * Lightweight, LCP-safe scroll-scrubbed visual showcase inside the hero bottom band.
 * - Immediately paints nothing blocking LCP (uses lazy 43KB poster on mobile/saveData).
 * - On desktop fine pointers after idle, progressively loads 20 sampled WebP frames
 *   and scrubs them on a 2D canvas synced to GSAP ScrollTrigger.
 */
function HeroScrollVisualBand() {
    const bandRef = useRef(null);
    const frameBoxRef = useRef(null);
    const canvasRef = useRef(null);
    const [canvasReady, setCanvasReady] = useState(false);
    const [progressPct, setProgressPct] = useState(0);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined" || !bandRef.current) return;
        const isDesktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
        const saveData = navigator.connection?.saveData;
        if (!isDesktop || saveData) return;

        let cancelled = false;
        let ctx = null;
        const loadedImages = new Array(SAMPLED_FRAME_INDICES.length).fill(null);

        const drawFrame = (idx) => {
            const canvas = canvasRef.current;
            const img = loadedImages[idx] || loadedImages.find(Boolean);
            if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const targetW = Math.round(rect.width * dpr);
            const targetH = Math.round(rect.height * dpr);
            if (canvas.width !== targetW || canvas.height !== targetH) {
                canvas.width = targetW;
                canvas.height = targetH;
            }
            const c = canvas.getContext("2d");
            if (!c) return;
            c.clearRect(0, 0, targetW, targetH);
            // Cover crop preserving natural aspect ratio
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const boxRatio = targetW / targetH;
            let drawW = targetW;
            let drawH = targetH;
            let offsetX = 0;
            let offsetY = 0;
            if (imgRatio > boxRatio) {
                drawW = targetH * imgRatio;
                offsetX = (targetW - drawW) / 2;
            } else {
                drawH = targetW / imgRatio;
                offsetY = (targetH - drawH) / 2;
            }
            c.drawImage(img, offsetX, offsetY, drawW, drawH);
        };

        const boot = async () => {
            const { gsap, ScrollTrigger } = await loadGsapRuntime();
            if (cancelled || !bandRef.current) return;

            // Load frame 0 first, then progressively fetch remaining 19 sampled frames
            SAMPLED_FRAME_INDICES.forEach((num, idx) => {
                const img = new Image();
                img.decoding = "async";
                img.onload = () => {
                    if (cancelled) return;
                    loadedImages[idx] = img;
                    if (idx === 0) {
                        setCanvasReady(true);
                        drawFrame(0);
                    }
                };
                img.src = `/frames/${num}.webp`;
            });

            ctx = gsap.context(() => {
                const state = { frame: 0 };
                gsap.to(state, {
                    frame: SAMPLED_FRAME_INDICES.length - 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: bandRef.current,
                        start: "top 85%",
                        end: "bottom 20%",
                        scrub: 0.45,
                        onUpdate: (self) => {
                            const f = Math.round(self.progress * (SAMPLED_FRAME_INDICES.length - 1));
                            drawFrame(f);
                            setProgressPct(Math.round(self.progress * 100));
                        },
                    },
                });

                if (frameBoxRef.current) {
                    gsap.fromTo(
                        frameBoxRef.current,
                        { clipPath: "inset(4% 2% 4% 2% round 20px)" },
                        {
                            clipPath: "inset(0% 0% 0% 0% round 20px)",
                            ease: "none",
                            scrollTrigger: {
                                trigger: bandRef.current,
                                start: "top 88%",
                                end: "top 35%",
                                scrub: 0.5,
                            },
                        }
                    );
                }
            }, bandRef);

            window.requestAnimationFrame(() => ScrollTrigger.refresh());
        };

        const idle =
            typeof window.requestIdleCallback === "function"
                ? window.requestIdleCallback(() => boot().catch(() => {}), { timeout: 1200 })
                : window.setTimeout(() => boot().catch(() => {}), 500);

        return () => {
            cancelled = true;
            if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
            else window.clearTimeout(idle);
            if (ctx) ctx.revert();
        };
    }, [reducedMotion]);

    return (
        <div
            ref={bandRef}
            className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center"
        >
            {/* Visual Frame (Canvas scrub on desktop, lightweight static poster on mobile/reduced-motion) */}
            <div className="lg:col-span-7">
                <div
                    ref={frameBoxRef}
                    className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#0B162C] border border-slate-200"
                >
                    <img
                        src="/frames/001.webp"
                        alt="Proses pemeriksaan internal perangkat laptop di meja teknisi YVS Computer"
                        width="960"
                        height="540"
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            canvasReady ? "opacity-0" : "opacity-100"
                        }`}
                    />
                    <canvas
                        ref={canvasRef}
                        aria-hidden="true"
                        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                            canvasReady ? "opacity-100" : "opacity-0"
                        }`}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B162C]/85 via-[#0B162C]/35 to-transparent px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-white">
                            Pemeriksaan unit secara menyeluruh di meja kerja teknisi
                        </span>
                        <span className="hidden lg:inline-block font-mono text-xs text-blue-200 tabular-nums shrink-0">
                            {String(progressPct).padStart(2, "0")}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Grounded Editorial Pillars (Asymmetric right column — no 3-card grid) */}
            <div className="lg:col-span-5 divide-y divide-slate-200 border-t border-b border-slate-200">
                <div className="py-4 sm:py-5 flex items-baseline gap-4">
                    <span className="font-mono text-xs font-bold text-blue-600 shrink-0">01</span>
                    <div>
                        <p className="font-display font-bold text-base text-slate-950">
                            Konfirmasi biaya sebelum dikerjakan
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed mt-1">
                            Perkiraan biaya disampaikan dulu setelah diagnosa. Perbaikan baru berjalan bila Anda setuju.
                        </p>
                    </div>
                </div>
                <div className="py-4 sm:py-5 flex items-baseline gap-4">
                    <span className="font-mono text-xs font-bold text-blue-600 shrink-0">02</span>
                    <div>
                        <p className="font-display font-bold text-base text-slate-950">
                            Foto kondisi &amp; progres tercatat
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed mt-1">
                            Foto awal, catatan diagnosa, dan suku cadang yang terpasang dapat dilihat langsung dari ponsel Anda.
                        </p>
                    </div>
                </div>
                <div className="py-4 sm:py-5 flex items-baseline gap-4">
                    <span className="font-mono text-xs font-bold text-blue-600 shrink-0">03</span>
                    <div>
                        <p className="font-display font-bold text-base text-slate-950">
                            Nota &amp; garansi tersimpan digital
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed mt-1">
                            Masa garansi sesuai jenis perbaikan tercatat rapi di nomor servis agar mudah diakses kapan pun dibutuhkan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
            // Keep digits, spaces, leading +
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
            className="relative w-full bg-white border-b border-slate-200 pt-24 pb-14 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 overflow-x-clip scroll-mt-16"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Quiet Editorial Meta Line */}
                <div className="hidden sm:flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-6 mb-8 sm:mb-12 border-b border-slate-200 text-xs font-mono text-slate-600">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-950 font-semibold">YVS COMPUTER · PEKAYON BEKASI</span>
                        <span className="text-slate-300" aria-hidden="true">/</span>
                        <span>Perbaikan Laptop, MacBook &amp; PC Desktop</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>Jl. Raya Pekayon No. 25</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="text-blue-700 font-semibold">Buka setiap hari 09.00–18.00 WIB</span>
                    </div>
                </div>

                {/* Asymmetric 12-Column Hero Composition */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-start">
                    {/* LEFT: Approved Editorial Typography + Secondary WhatsApp CTA */}
                    <div className="lg:col-span-6 xl:col-span-7 space-y-5 sm:space-y-7 min-w-0">
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
                            className="font-display font-extrabold text-[1.95rem] xs:text-[2.25rem] sm:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] text-slate-950 tracking-[-0.035em] leading-[1.08]"
                        />

                        <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-sans">
                            Masukkan nomor servis atau nomor WhatsApp terdaftar. Foto kondisi awal, hasil diagnosa teknisi, rincian biaya, hingga catatan garansi bisa langsung Anda pantau di sini.
                        </p>

                        {/* Secondary Direct Actions (WhatsApp + Scroll to Process) */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
                            <MagneticWrap strength={0.16}>
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20keluhan%20perangkat%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#0B162C] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>Tanya teknisi via WhatsApp</span>
                                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                </a>
                            </MagneticWrap>

                            <button
                                type="button"
                                onClick={() => smoothScrollToTarget("alur-servis", -64)}
                                className="inline-flex items-center gap-2 min-h-[46px] px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-slate-900 border border-slate-300 hover:border-blue-300 text-sm font-semibold transition-colors cursor-pointer"
                            >
                                <span>Lihat alur pengerjaan</span>
                                <ArrowDownRight className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Primary CTA — Tactile Tracking Input Card */}
                    <div className="lg:col-span-6 xl:col-span-5 min-w-0">
                        <div
                            style={{ viewTransitionName: "yvs-tracking-shell" }}
                            className="relative bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-[0_24px_48px_-28px_rgba(11,22,44,0.16)]"
                        >
                            <div className="space-y-5">
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200/80">
                                    <div>
                                        <h2 className="font-display font-bold text-lg sm:text-xl text-slate-950 tracking-tight">
                                            Cek status servis
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                                            Masukkan kode di nota atau pindai QR.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onOpenScanner}
                                        className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
                                        title="Pindai QR pada lembar nota servis"
                                    >
                                        <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
                                        <span>Pindai QR</span>
                                    </button>
                                </div>

                                {/* Mode Switcher (Accessible AA Contrast >= 7:1) */}
                                <div
                                    role="tablist"
                                    aria-label="Metode pelacakan"
                                    className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl relative"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] bg-white rounded-lg shadow-xs border border-slate-200 transition-transform duration-200 ease-out ${
                                            trackMethod === "telepon" ? "translate-x-full" : "translate-x-0"
                                        }`}
                                    />
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
                                                className={`relative z-10 min-h-[44px] py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                                                    active
                                                        ? "text-slate-950"
                                                        : "text-slate-700 hover:text-slate-950"
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tracking Form with Smart Mask + Inline Validation */}
                                <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <label
                                                htmlFor="yvs-exp-track-field"
                                                className="block text-xs sm:text-sm font-semibold text-slate-800"
                                            >
                                                {trackMethod === "tiket"
                                                    ? "Nomor servis"
                                                    : "Nomor WhatsApp terdaftar"}
                                            </label>
                                            <span className="font-mono text-xs text-slate-600">
                                                {trackMethod === "tiket" ? "Format: SRV-YYYY-NNN" : "Contoh: 0812..."}
                                            </span>
                                        </div>

                                        <div className="relative">
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
                                                        ? "SRV-2026-073"
                                                        : "081234567890"
                                                }
                                                className={`yvs-exp-track-input w-full min-h-[52px] pl-4 pr-12 py-3 bg-white border rounded-xl font-mono font-semibold text-slate-950 placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:ring-4 transition-all ${
                                                    inlineError
                                                        ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/15"
                                                        : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/15"
                                                }`}
                                            />
                                            {trackMethod === "tiket" && (
                                                <button
                                                    type="button"
                                                    onClick={onOpenScanner}
                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                                                    aria-label="Pindai QR nota servis"
                                                    title="Pindai QR nota servis"
                                                >
                                                    <QrCode className="w-5 h-5" aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>

                                        {inlineError && (
                                            <p
                                                id="yvs-track-inline-error"
                                                role="alert"
                                                className="mt-2 flex items-start gap-1.5 text-xs font-medium text-rose-700"
                                            >
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                                                <span>{inlineError}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Recent Searches */}
                                    {recentSearches.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                            <span className="inline-flex items-center gap-1 text-slate-600 font-medium mr-0.5">
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
                                                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-300 font-mono text-xs font-semibold transition-colors cursor-pointer"
                                                >
                                                    {item.value}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={onClearRecent}
                                                className="min-h-[36px] text-xs font-semibold text-slate-600 hover:text-rose-700 px-2 py-1 transition-colors cursor-pointer"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    )}

                                    <MagneticWrap strength={0.14} className="w-full">
                                        <button
                                            type="submit"
                                            data-cursor="Lacak"
                                            disabled={loading}
                                            className="w-full min-h-[52px] py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {loading ? (
                                                <>
                                                    <span
                                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                                        aria-hidden="true"
                                                    />
                                                    <span>Mencari data servis...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="w-4 h-4" aria-hidden="true" />
                                                    <span>Cek status servis</span>
                                                </>
                                            )}
                                        </button>
                                    </MagneticWrap>
                                </form>

                                {/* Error State */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs sm:text-sm"
                                    >
                                        <SearchX className="w-5 h-5 shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
                                        <div className="space-y-2">
                                            <p className="font-semibold">{error}</p>
                                            <a
                                                href={`https://wa.me/628121034212?text=${notFoundWaMessage}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline"
                                            >
                                                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                                                <span>Tanya admin lewat WhatsApp</span>
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Helpful Not Found State */}
                                {results && results.length === 0 && (
                                    <div
                                        role="status"
                                        className="p-4 rounded-xl bg-white border border-slate-300 space-y-3 text-xs sm:text-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <PackageSearch className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" aria-hidden="true" />
                                            <div>
                                                <p className="font-bold text-slate-950">Data servis belum ditemukan</p>
                                                <p className="text-slate-600 mt-1 leading-relaxed">
                                                    Pastikan nomor servis sesuai lembar nota (contoh: <span className="font-mono font-semibold text-slate-900">SRV-2026-073</span>) atau coba cari menggunakan nomor WhatsApp yang didaftarkan.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => inputRef?.current?.focus()}
                                                className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                                <span>Periksa ulang nomor</span>
                                            </button>
                                            <a
                                                href={`https://wa.me/628121034212?text=${notFoundWaMessage}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B162C] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                                <span>Bantu cek via WhatsApp</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll-Driven Visual Inspection Band */}
                <HeroScrollVisualBand />
            </div>
        </section>
    );
}
