import { lazy, Suspense, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import api from "../../services/api";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Calendar,
    User,
    MonitorSmartphone,
    ClipboardCheck,
    ShieldCheck,
    QrCode,
    MessageCircle,
    Share2,
    RefreshCw,
    FileText,
    Printer,
    AlertTriangle,
    Clock,
    Wrench,
    Package,
    Lightbulb,
    Star,
    MapPin,
    PenTool,
    X,
    Check,
    ImageOff,
    Play,
    Image as ImageIcon,
    Copy,
    Award,
    SearchX,
} from "lucide-react";
import { isVideo, getMediaUrl } from "../../utils/mediaUtils";
import {
    getChecklistValue,
    getHardwareChecklistForCategory,
    getQcChecklistForCategory,
    getDeviceCategory,
} from "../../utils/checklistItems";
import SlaBadge, { SlaCountdownCard } from "../SlaBadge";
import { DefectMapBadge } from "../DefectMapperModal";
import { SHARED_PROCESS_STEPS, loadGsapRuntime, MOTION_TOKENS } from "./motionTokens";
import { MagneticWrap, usePrefersReducedMotion } from "./MotionPrimitives";

// Heavy modals lazy-loaded ONLY when customer opens them
const WarrantyCertificateModal = lazy(() => import("../WarrantyCertificateModal"));
const InvoiceModal = lazy(() => import("../InvoiceModal"));
const DefectMapperModal = lazy(() => import("../DefectMapperModal"));
const DigitalSignaturePadModal = lazy(() => import("../DigitalSignaturePadModal"));

const SEMANTIC_STATUS = {
    diterima: {
        label: "Diterima",
        badge: "bg-blue-50 text-blue-800 border-blue-200",
        dot: "bg-blue-600",
    },
    didiagnosis: {
        label: "Diagnosa",
        badge: "bg-blue-50 text-blue-800 border-blue-200",
        dot: "bg-blue-600",
    },
    menunggu_persetujuan: {
        label: "Menunggu Persetujuan",
        badge: "bg-amber-50 text-amber-900 border-amber-300",
        dot: "bg-amber-500",
    },
    disetujui: {
        label: "Disetujui",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dot: "bg-emerald-600",
    },
    dalam_perbaikan: {
        label: "Pengerjaan",
        badge: "bg-blue-50 text-blue-800 border-blue-200",
        dot: "bg-blue-600",
    },
    selesai: {
        label: "Lulus QC · Siap Diambil",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dot: "bg-emerald-600",
    },
    diambil: {
        label: "Sudah Diambil",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dot: "bg-emerald-600",
    },
    dibatalkan: {
        label: "Dibatalkan",
        badge: "bg-rose-50 text-rose-800 border-rose-200",
        dot: "bg-rose-600",
    },
};

function formatRupiah(num) {
    const val = typeof num === "number" ? num : parseFloat(num) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(val);
}

function formatDateSafe(dateStr, options = { day: "numeric", month: "long", year: "numeric" }) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("id-ID", options);
    } catch (_) {
        return "-";
    }
}

function safeParseUrls(val) {
    if (!val) return [];
    let parsed = val;
    for (let depth = 0; depth < 5; depth++) {
        if (typeof parsed === "string") {
            const trimmed = parsed.trim();
            if (
                (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
                (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                (trimmed.startsWith('"') && trimmed.endsWith('"'))
            ) {
                try {
                    const next = JSON.parse(trimmed);
                    if (next === parsed) break;
                    parsed = next;
                } catch (_) {
                    break;
                }
            } else {
                break;
            }
        } else {
            break;
        }
    }

    const extractUrl = (item) => {
        if (!item) return "";
        if (typeof item === "string") {
            const str = item.trim().replace(/^["']+|["']+$/g, "");
            if (str.startsWith("[") || (str.startsWith("{") && str.endsWith("}"))) {
                try {
                    const inner = JSON.parse(str);
                    if (Array.isArray(inner)) return inner.flatMap(extractUrl);
                    if (inner && typeof inner === "object") {
                        return inner.url || inner.path || inner.src || inner.filename || "";
                    }
                } catch (_) {}
            }
            return str;
        }
        if (typeof item === "object") {
            return item.url || item.path || item.src || item.foto_url || item.filename || "";
        }
        return String(item);
    };

    if (Array.isArray(parsed)) return parsed.flatMap(extractUrl).filter(Boolean);
    if (typeof parsed === "object" && parsed !== null) {
        return Object.values(parsed).flatMap(extractUrl).filter(Boolean);
    }
    if (typeof parsed === "string" && parsed.trim()) {
        return [parsed.trim().replace(/^["']+|["']+$/g, "")].filter(Boolean);
    }
    return [];
}

function TicketQrImage({ nomorTiket, size = 160 }) {
    const [qrUrl, setQrUrl] = useState("");
    const targetUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/tracking?nomor_tiket=${encodeURIComponent(nomorTiket)}`
            : nomorTiket || "";

    useEffect(() => {
        if (!nomorTiket) return;
        let active = true;
        QRCode.toDataURL(targetUrl, {
            width: size * 2,
            margin: 1,
            color: { dark: "#0B162C", light: "#FFFFFF" },
            errorCorrectionLevel: "M",
        })
            .then((url) => {
                if (active) setQrUrl(url);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [targetUrl, nomorTiket, size]);

    if (!qrUrl) {
        return (
            <div
                style={{ width: size, height: size }}
                className="rounded-xl bg-slate-100 animate-pulse"
                aria-label="Memuat kode QR"
            />
        );
    }

    return (
        <img
            src={qrUrl}
            alt={`QR pelacakan ${nomorTiket}`}
            width={size}
            height={size}
            className="block rounded-lg"
            style={{ width: size, height: size }}
        />
    );
}

/**
 * Vertical Progress Path built from SHARED_PROCESS_STEPS
 * Features SVG stroke draw + GSAP MotionPath active marker + semantic pulse on current stage.
 */
function VerticalProcessPath({ currentStatus, tiket, activeStepKey, onSelectStep }) {
    const svgPathRef = useRef(null);
    const markerRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    if (currentStatus === "dibatalkan") {
        return (
            <div
                role="alert"
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3"
            >
                <SearchX className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                    <p className="font-bold text-sm">Servis ini dibatalkan</p>
                    <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        Unit dirapikan kembali dan siap diambil di meja penerimaan bengkel.
                    </p>
                </div>
            </div>
        );
    }

    const timestamps = {
        diterima: tiket?.created_at,
        diagnosis:
            tiket?.diagnosis?.created_at ||
            tiket?.log_perbaikan?.find((l) => l.fase === "Diagnosis")?.created_at,
        perbaikan:
            tiket?.disetujui_at ||
            tiket?.log_perbaikan?.find((l) => l.fase?.toLowerCase().includes("perbaikan"))?.created_at,
        selesai:
            tiket?.completed_at ||
            tiket?.log_perbaikan?.find((l) => l.fase === "Selesai")?.created_at,
        diambil:
            tiket?.tgl_diambil ||
            tiket?.invoice?.ttd_customer_at ||
            tiket?.log_perbaikan?.find((l) => l.fase === "Penyerahan Unit")?.created_at,
    };

    let currentIdx = SHARED_PROCESS_STEPS.findIndex((s) => s.statuses.includes(currentStatus));
    if (currentIdx === -1) currentIdx = 0;

    const progressRatio = currentIdx / (SHARED_PROCESS_STEPS.length - 1);

    useEffect(() => {
        const pathEl = svgPathRef.current;
        if (!pathEl) return;
        const totalLen = pathEl.getTotalLength();

        if (reducedMotion) {
            pathEl.style.strokeDasharray = String(totalLen);
            pathEl.style.strokeDashoffset = String(totalLen * (1 - progressRatio));
            return;
        }

        let cancelled = false;
        let tween = null;

        loadGsapRuntime().then(({ gsap }) => {
            if (cancelled || !svgPathRef.current) return;
            gsap.set(svgPathRef.current, {
                strokeDasharray: totalLen,
                strokeDashoffset: totalLen,
            });
            tween = gsap.timeline();
            tween.to(
                svgPathRef.current,
                {
                    strokeDashoffset: totalLen * (1 - progressRatio),
                    duration: 0.95,
                    ease: MOTION_TOKENS.ease.gsapEditorial,
                },
                0
            );
            if (markerRef.current) {
                tween.to(
                    markerRef.current,
                    {
                        motionPath: {
                            path: svgPathRef.current,
                            align: svgPathRef.current,
                            alignOrigin: [0.5, 0.5],
                            start: 0,
                            end: Math.max(0.01, progressRatio),
                        },
                        duration: 0.95,
                        ease: MOTION_TOKENS.ease.gsapEditorial,
                    },
                    0
                );
            }
        });

        return () => {
            cancelled = true;
            if (tween) tween.kill();
        };
    }, [progressRatio, reducedMotion]);

    const formatStepTime = (dateStr) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return null;
            return d.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (_) {
            return null;
        }
    };

    return (
        <nav aria-label="Tahapan perbaikan perangkat" className="relative pl-1">
            {/* Vertical SVG Spine + MotionPath Progress Beacon */}
            <svg
                viewBox="0 0 24 400"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute left-[19px] top-6 bottom-6 w-6 h-[calc(100%-3rem)] pointer-events-none overflow-visible"
            >
                <path d="M 12 0 L 12 400" fill="none" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                <path
                    ref={svgPathRef}
                    d="M 12 0 L 12 400"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle
                    ref={markerRef}
                    cx="12"
                    cy="0"
                    r="4.5"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                />
            </svg>

            <ol className="space-y-2.5 relative z-10">
                {SHARED_PROCESS_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isReached = idx <= currentIdx;
                    const isSelected = activeStepKey === step.key;
                    const timeStr = formatStepTime(timestamps[step.key]);

                    return (
                        <li key={step.key}>
                            <button
                                type="button"
                                disabled={!isReached}
                                onClick={() => isReached && onSelectStep(step.key)}
                                aria-current={isCurrent ? "step" : undefined}
                                className={`w-full min-h-[64px] text-left flex items-start gap-3.5 p-3 rounded-xl border transition-all ${
                                    isSelected
                                        ? "bg-blue-50/80 border-blue-300 shadow-2xs"
                                        : isReached
                                        ? "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                                        : "bg-transparent border-transparent opacity-55 cursor-not-allowed"
                                }`}
                            >
                                {/* Node Circle */}
                                <div className="relative mt-0.5 shrink-0">
                                    {isCurrent && (
                                        <span
                                            aria-hidden="true"
                                            className={`absolute inset-0 rounded-full yvs-stage-pulse-ring ${
                                                currentStatus === "menunggu_persetujuan"
                                                    ? "bg-amber-400"
                                                    : currentStatus === "selesai" || currentStatus === "diambil"
                                                    ? "bg-emerald-400"
                                                    : "bg-blue-400"
                                            }`}
                                        />
                                    )}
                                    <span
                                        className={`relative w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 transition-colors ${
                                            isCurrent
                                                ? currentStatus === "menunggu_persetujuan"
                                                    ? "bg-amber-500 border-amber-200 text-white"
                                                    : currentStatus === "selesai" || currentStatus === "diambil"
                                                    ? "bg-emerald-600 border-emerald-200 text-white"
                                                    : "bg-blue-600 border-blue-200 text-white"
                                                : isCompleted
                                                ? "bg-blue-600 border-blue-200 text-white"
                                                : "bg-white border-slate-300 text-slate-600"
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-4 h-4" aria-hidden="true" />
                                        ) : (
                                            step.num
                                        )}
                                    </span>
                                </div>

                                {/* Stage Label & Timestamp */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={`font-display font-bold text-sm ${
                                                isSelected
                                                    ? "text-blue-800"
                                                    : isReached
                                                    ? "text-slate-950"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {step.label}
                                        </span>
                                        {isCurrent && (
                                            <span className="font-mono text-xs font-semibold text-blue-700 shrink-0">
                                                Saat ini
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                        {timeStr || (isReached ? "Ketuk untuk lihat rincian" : "Menunggu tahap sebelumnya")}
                                    </p>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/**
 * Clean Photo & Video Gallery with Lightbox (Zero hover-only UI on mobile)
 */
function MediaDocumentation({ fotoKondisi, fotoDiagnosis, fotoSelesai, logPerbaikan, filterCategory, heading }) {
    const [lightboxIdx, setLightboxIdx] = useState(-1);
    const [imgErrors, setImgErrors] = useState({});

    const items = [];
    safeParseUrls(fotoKondisi).forEach((url, i) =>
        items.push({ url, label: `Kondisi Awal #${i + 1}`, cat: "intake", catLabel: "Sebelum" })
    );
    safeParseUrls(fotoDiagnosis).forEach((url, i) =>
        items.push({ url, label: `Temuan Diagnosa #${i + 1}`, cat: "diagnosis", catLabel: "Diagnosa" })
    );
    if (Array.isArray(logPerbaikan)) {
        logPerbaikan.forEach((log, i) => {
            if (log?.foto_url) {
                items.push({
                    url: log.foto_url,
                    label: log.catatan ? log.catatan.slice(0, 60) : `Foto Pengerjaan #${i + 1}`,
                    cat: "repair",
                    catLabel: "Pengerjaan",
                });
            }
        });
    }
    safeParseUrls(fotoSelesai).forEach((url, i) =>
        items.push({ url, label: `Hasil Akhir & QC #${i + 1}`, cat: "completed", catLabel: "Sesudah" })
    );

    const visible = filterCategory ? items.filter((it) => it.cat === filterCategory) : items;
    if (!visible.length) return null;

    return (
        <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2">
                <h4 className="font-display font-bold text-sm sm:text-base text-slate-950 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                    <span>{heading || "Dokumentasi Foto & Video"}</span>
                </h4>
                <span className="font-mono text-xs text-slate-600">{visible.length} berkas</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visible.map((item, idx) => {
                    const url = getMediaUrl(item.url);
                    const vid = isVideo(item.url);
                    const hasErr = imgErrors[item.url];
                    return (
                        <button
                            key={`${item.url}-${idx}`}
                            type="button"
                            onClick={() => setLightboxIdx(idx)}
                            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-blue-500 transition-colors cursor-pointer text-left"
                        >
                            {vid ? (
                                <div className="w-full h-full bg-[#0B162C] flex items-center justify-center">
                                    <Play className="w-7 h-7 text-white fill-white" aria-hidden="true" />
                                </div>
                            ) : hasErr ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-600 gap-1">
                                    <ImageOff className="w-5 h-5" aria-hidden="true" />
                                    <span className="text-xs text-center">{item.catLabel}</span>
                                </div>
                            ) : (
                                <img
                                    src={url}
                                    alt={item.label}
                                    loading="lazy"
                                    decoding="async"
                                    onError={() => setImgErrors((p) => ({ ...p, [item.url]: true }))}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <span className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-md bg-[#0B162C]/80 text-white text-xs font-medium truncate">
                                {item.catLabel}
                            </span>
                        </button>
                    );
                })}
            </div>

            {lightboxIdx >= 0 && visible[lightboxIdx] && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Pratinjau dokumentasi"
                    className="fixed inset-0 z-[9999] bg-[#0B162C]/95 flex items-center justify-center p-4"
                    onClick={() => setLightboxIdx(-1)}
                >
                    <div
                        className="relative max-w-4xl w-full flex flex-col items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setLightboxIdx(-1)}
                            aria-label="Tutup pratinjau"
                            className="self-end min-w-[44px] min-h-[44px] rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {isVideo(visible[lightboxIdx].url) ? (
                            <video
                                src={getMediaUrl(visible[lightboxIdx].url)}
                                controls
                                autoPlay
                                playsInline
                                className="max-h-[72vh] max-w-full rounded-xl bg-black"
                            />
                        ) : (
                            <img
                                src={getMediaUrl(visible[lightboxIdx].url)}
                                alt={visible[lightboxIdx].label}
                                className="max-h-[72vh] max-w-full object-contain rounded-xl"
                            />
                        )}
                        <div className="flex items-center justify-between w-full max-w-md text-white text-sm">
                            <button
                                type="button"
                                disabled={visible.length <= 1}
                                onClick={() =>
                                    setLightboxIdx((i) => (i - 1 + visible.length) % visible.length)
                                }
                                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                                aria-label="Foto sebelumnya"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-medium text-center px-3">
                                {visible[lightboxIdx].label} ({lightboxIdx + 1}/{visible.length})
                            </span>
                            <button
                                type="button"
                                disabled={visible.length <= 1}
                                onClick={() => setLightboxIdx((i) => (i + 1) % visible.length)}
                                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                                aria-label="Foto berikutnya"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TechnicianRatingCard({ ticket }) {
    const [selectedStars, setSelectedStars] = useState(ticket.rating_teknisi || 0);
    const [phoneLast4, setPhoneLast4] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(Boolean(ticket.rating_teknisi));
    const [showVerify, setShowVerify] = useState(false);

    async function handleConfirmRating(e) {
        e.preventDefault();
        const clean = phoneLast4.replace(/\D/g, "");
        if (clean.length !== 4) {
            toast.error("Masukkan 4 digit terakhir nomor WhatsApp Anda.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post("/tracking/rate", {
                nomorTiket: ticket.nomor_tiket,
                rating: selectedStars,
                phone_last4: clean,
            });
            setSubmitted(true);
            setShowVerify(false);
            toast.success(res.data.message || "Terima kasih atas penilaian Anda.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengirim penilaian");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h4 className="font-display font-bold text-base text-slate-950">
                        Penilaian Layanan Teknisi
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        {submitted
                            ? "Terima kasih, penilaian Anda sudah tercatat."
                            : `Berikan penilaian untuk kinerja teknisi (${ticket.teknisi || "Tim YVS"}).`}
                    </p>
                </div>
                <div className="flex items-center gap-1" role="group" aria-label="Pilih bintang penilaian">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            disabled={submitting || submitted}
                            aria-label={`${star} dari 5 bintang`}
                            onClick={() => {
                                setSelectedStars(star);
                                setShowVerify(true);
                            }}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white cursor-pointer disabled:cursor-default"
                        >
                            <Star
                                className={`w-6 h-6 ${
                                    selectedStars >= star
                                        ? "text-amber-500 fill-amber-400"
                                        : "text-slate-300"
                                }`}
                                aria-hidden="true"
                            />
                        </button>
                    ))}
                </div>
            </div>

            {showVerify && !submitted && (
                <form
                    onSubmit={handleConfirmRating}
                    className="pt-4 border-t border-blue-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                    <label htmlFor="rating-phone4" className="text-xs font-semibold text-slate-800 shrink-0">
                        4 digit terakhir No. WA:
                    </label>
                    <input
                        id="rating-phone4"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="7890"
                        value={phoneLast4}
                        onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="yvs-exp-track-input sm:w-28 min-h-[44px] px-3 text-center font-mono font-bold bg-white border border-slate-300 rounded-xl"
                    />
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={submitting || phoneLast4.length !== 4}
                            className="min-h-[44px] flex-1 sm:flex-none px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                        >
                            {submitting ? "Mengirim..." : "Kirim Penilaian"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowVerify(false)}
                            className="min-h-[44px] px-3 text-xs font-semibold text-slate-700 hover:text-slate-950 cursor-pointer"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            )}

            <div className="pt-4 border-t border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm text-slate-700 font-medium">
                    Puas dengan hasil servis perangkat Anda?
                </span>
                <a
                    href={ticket.googleMapsUrl || "https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0B162C] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                    <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Ulas YVS di Google Maps</span>
                </a>
            </div>
        </div>
    );
}

function TicketDetailExperience({ initialTicket, onBackToList, onUpdateTicket }) {
    const [t, setT] = useState(initialTicket);
    const rootRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        setT(initialTicket);
    }, [initialTicket]);

    const resolveInitialStep = (status) => {
        if (status === "diambil") return "diambil";
        if (status === "selesai") return "selesai";
        if (status === "dalam_perbaikan") return "perbaikan";
        if (["didiagnosis", "menunggu_persetujuan", "disetujui"].includes(status)) return "diagnosis";
        return "diterima";
    };

    const [activeStepKey, setActiveStepKey] = useState(() => resolveInitialStep(initialTicket?.status));
    const [refreshing, setRefreshing] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
    const [isSignInvoiceModalOpen, setIsSignInvoiceModalOpen] = useState(false);
    const [submittingSignInvoice, setSubmittingSignInvoice] = useState(false);

    // Approval Modal state
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [approvalAction, setApprovalAction] = useState("approve");
    const [phoneLast4, setPhoneLast4] = useState("");
    const [alasanBatal, setAlasanBatal] = useState("Biaya melebihi estimasi / budget");
    const [catatanBatal, setCatatanBatal] = useState("");
    const [submittingApproval, setSubmittingApproval] = useState(false);

    // Choreographed result entrance via GSAP (transform + opacity only)
    useEffect(() => {
        if (reducedMotion || !rootRef.current) return;
        let cancelled = false;
        let ctx = null;

        loadGsapRuntime().then(({ gsap }) => {
            if (cancelled || !rootRef.current) return;
            ctx = gsap.context(() => {
                gsap.fromTo(
                    "[data-result-stagger]",
                    { y: 18, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: MOTION_TOKENS.duration.base,
                        stagger: MOTION_TOKENS.stagger.tight,
                        ease: MOTION_TOKENS.ease.gsapEditorial,
                        clearProps: "transform",
                    }
                );
            }, rootRef);
        });

        return () => {
            cancelled = true;
            if (ctx) ctx.revert();
        };
    }, [t?.nomor_tiket, reducedMotion]);

    // Deep-linking for invoice / warranty query params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        if (
            (params.get("focus") === "invoice" || params.get("action") === "invoice" || hash === "#invoice") &&
            t.invoice
        ) {
            setIsInvoiceModalOpen(true);
            return;
        }
        if (
            ["selesai", "diambil"].includes(t.status) &&
            (params.get("focus") === "garansi" ||
                params.get("action") === "garansi" ||
                hash === "#garansi")
        ) {
            setActiveStepKey("diambil");
            if (params.get("open") === "true") {
                setIsWarrantyModalOpen(true);
            }
        }
    }, [t.status, t.invoice]);

    const handleRefreshStatus = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            const res = await api.post("/tracking", { nomorTiket: t.nomor_tiket });
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            if (data) {
                setT(data);
                onUpdateTicket?.(data);
                toast.success("Status servis diperbarui.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyegarkan status");
        } finally {
            setRefreshing(false);
        }
    };

    const handleShareTracking = async () => {
        const trackingUrl = `${window.location.origin}/tracking?nomor_tiket=${encodeURIComponent(
            t.nomor_tiket
        )}`;
        const shareData = {
            title: `Status Servis YVS - ${t.nomor_tiket}`,
            text: `Pantau perbaikan ${t.perangkat} (${t.nomor_tiket}) di YVS Computer:`,
            url: trackingUrl,
        };
        if (navigator.share && navigator.canShare?.(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (_) {}
        }
        try {
            await navigator.clipboard.writeText(trackingUrl);
            toast.success("Tautan pelacakan disalin.");
        } catch (_) {
            toast.error("Gagal menyalin tautan");
        }
    };

    const handleSubmitApproval = async (e) => {
        e.preventDefault();
        if (phoneLast4.trim().length < 4) {
            toast.error("Masukkan 4 digit terakhir nomor WhatsApp terdaftar.");
            return;
        }
        setSubmittingApproval(true);
        try {
            const res = await api.post("/tracking/respond", {
                nomorTiket: t.nomor_tiket,
                action: approvalAction,
                phone_last4: phoneLast4.trim(),
                alasan_batal: approvalAction === "reject" ? alasanBatal : undefined,
                catatan: approvalAction === "reject" ? catatanBatal : undefined,
            });
            toast.success(res.data.message);
            const updated = {
                ...t,
                status: res.data.status,
                disetujui_at: res.data.tiket?.disetujui_at || t.disetujui_at,
                target_selesai_at: res.data.tiket?.target_selesai_at || t.target_selesai_at,
                alasan_batal: res.data.tiket?.alasan_batal || t.alasan_batal,
                catatan_batal: res.data.tiket?.catatan_batal || t.catatan_batal,
            };
            setT(updated);
            onUpdateTicket?.(updated);
            setIsApprovalModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses persetujuan");
        } finally {
            setSubmittingApproval(false);
        }
    };

    const handleCustomerSignInvoice = async ({ signature, signerName, phoneLast4: inputPhone4 }) => {
        setSubmittingSignInvoice(true);
        try {
            const res = await api.post("/tracking/sign-invoice", {
                nomorTiket: t.nomor_tiket,
                phone_last4: inputPhone4,
                signature,
                signer_nama: signerName,
            });
            toast.success(res.data.message || "Tanda tangan tersimpan.");
            const updated = {
                ...t,
                invoice: {
                    ...(t.invoice || {}),
                    ...(res.data.invoice || {}),
                    ttd_customer: signature,
                    ttd_customer_at: res.data.invoice?.ttd_customer_at || new Date().toISOString(),
                    ttd_customer_nama: signerName,
                },
            };
            setT(updated);
            onUpdateTicket?.(updated);
            setIsSignInvoiceModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses tanda tangan");
        } finally {
            setSubmittingSignInvoice(false);
        }
    };

    const statusMeta = SEMANTIC_STATUS[t.status] || {
        label: String(t.status || "Dalam Proses").replace(/_/g, " "),
        badge: "bg-slate-100 text-slate-800 border-slate-300",
        dot: "bg-slate-600",
    };

    const waUrl = `https://wa.me/628121034212?text=${encodeURIComponent(
        `Halo YVS Computer, saya ingin menanyakan perkembangan servis nomor ${t.nomor_tiket} (${t.perangkat}).`
    )}`;

    // Parse accessories safely
    let kelengkapanList = [];
    if (t.kelengkapan_detail) {
        try {
            let parsed =
                typeof t.kelengkapan_detail === "string"
                    ? JSON.parse(t.kelengkapan_detail)
                    : t.kelengkapan_detail;
            if (typeof parsed === "string") parsed = JSON.parse(parsed);
            if (Array.isArray(parsed)) kelengkapanList = parsed;
            else if (parsed && typeof parsed === "object") kelengkapanList = Object.values(parsed);
        } catch (_) {}
    }

    const parts = Array.isArray(t.penggunaan_sparepart) ? t.penggunaan_sparepart : [];
    const logs = Array.isArray(t.log_perbaikan) ? t.log_perbaikan : [];
    const inv = t.invoice;
    const warrantyRemaining = Number(t.warranty_status?.sisaHari);
    const hasWarrantyCountdown = Number.isFinite(warrantyRemaining);

    return (
        <div ref={rootRef} className="space-y-8 pb-24 lg:pb-12">
            {/* 1. Monumental Obsidian Navy Ticket Hero Band */}
            <section
                data-result-stagger
                className="bg-[#071124] text-white rounded-3xl p-6 sm:p-9 lg:p-11 shadow-[0_28px_70px_-28px_rgba(7,17,36,0.35)] space-y-7"
            >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/12">
                    <div className="space-y-2.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {onBackToList && (
                                <button
                                    type="button"
                                    onClick={onBackToList}
                                    className="min-h-[44px] inline-flex items-center gap-1 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                    <span>Semua tiket</span>
                                </button>
                            )}
                            <span className="font-mono font-bold text-sm sm:text-base text-blue-300 tracking-wide">
                                {t.nomor_tiket}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-medium">
                                <MonitorSmartphone className="w-3.5 h-3.5 text-blue-300" aria-hidden="true" />
                                <span>{t.jenis_perangkat || "Perangkat"}</span>
                            </span>
                        </div>
                        <h1 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.75rem] text-white tracking-[-0.035em] leading-[1.08] break-words">
                            {t.perangkat}
                        </h1>
                    </div>

                    {/* Semantic Status Pill */}
                    <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border shrink-0 ${statusMeta.badge}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} aria-hidden="true" />
                        <span>{statusMeta.label}</span>
                    </span>
                </div>

                {/* Hairline 3-Column Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 text-sm">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                            <span>Tanggal masuk</span>
                        </span>
                        <p className="font-display font-bold text-base text-white">
                            {formatDateSafe(t.created_at)}
                        </p>
                    </div>
                    <div className="sm:border-l sm:border-white/12 sm:pl-6 space-y-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                            <span>Teknisi penanggung jawab</span>
                        </span>
                        <p className="font-display font-bold text-base text-white">
                            {t.teknisi || "Menunggu penugasan"}
                        </p>
                    </div>
                    <div className="sm:border-l sm:border-white/12 sm:pl-6 space-y-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                            <span>Estimasi &amp; garansi</span>
                        </span>
                        <div className="pt-0.5 flex flex-wrap items-center gap-2">
                            {t.sla_paket ? (
                                <SlaBadge tiket={t} />
                            ) : (
                                <span className="font-display font-bold text-base text-white">
                                    {["selesai", "diambil"].includes(t.status)
                                        ? `Garansi ${t.durasi_garansi || "1 Bulan"}`
                                        : "Menunggu konfirmasi"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Crisp Editorial Pill Action Bar (all >= 44px) */}
                <div className="pt-5 border-t border-white/12 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRefreshStatus}
                            disabled={refreshing}
                            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`w-4 h-4 text-blue-300 ${refreshing ? "animate-spin" : ""}`}
                                aria-hidden="true"
                            />
                            <span>{refreshing ? "Memperbarui..." : "Segarkan"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleShareTracking}
                            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <Share2 className="w-4 h-4 text-slate-300" aria-hidden="true" />
                            <span>Bagikan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsQrModalOpen(true)}
                            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <QrCode className="w-4 h-4 text-blue-300" aria-hidden="true" />
                            <span>QR Tiket</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {["selesai", "diambil"].includes(t.status) && inv && (
                            <button
                                type="button"
                                onClick={() => setIsInvoiceModalOpen(true)}
                                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#071124] hover:bg-blue-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                            >
                                <FileText className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                                <span>Faktur Nota</span>
                            </button>
                        )}
                        {["selesai", "diambil"].includes(t.status) && (
                            <button
                                type="button"
                                onClick={() => setIsWarrantyModalOpen(true)}
                                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                            >
                                <Printer className="w-4 h-4" aria-hidden="true" />
                                <span>Kartu Garansi</span>
                            </button>
                        )}
                        <MagneticWrap strength={0.14}>
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>WhatsApp Admin</span>
                            </a>
                        </MagneticWrap>
                    </div>
                </div>
            </section>

            {/* SLA Countdown (when ticket is still in progress) */}
            {["diterima", "didiagnosis", "menunggu_persetujuan", "disetujui", "dalam_perbaikan"].includes(
                t.status
            ) && (
                <div data-result-stagger>
                    <SlaCountdownCard tiket={t} />
                </div>
            )}

            {/* Approval Required Priority Banner (Semantic Amber) */}
            {t.status === "menunggu_persetujuan" && t.diagnosis && (
                <section
                    data-result-stagger
                    aria-label="Persetujuan estimasi biaya"
                    className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 space-y-4"
                >
                    <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="font-mono text-xs font-bold text-amber-900">
                                KONFIRMASI DIPERLUKAN
                            </p>
                            <h2 className="font-display font-bold text-lg text-slate-950 mt-0.5">
                                Setujui estimasi biaya {formatRupiah(t.diagnosis.estimasi_biaya)}?
                            </h2>
                            <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                                Pemeriksaan selesai. Pengerjaan perbaikan baru kami lanjutkan setelah Anda menyetujui estimasi di bawah.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setApprovalAction("approve");
                                setPhoneLast4("");
                                setIsApprovalModalOpen(true);
                            }}
                            className="min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
                        >
                            <Check className="w-4 h-4" aria-hidden="true" />
                            <span>Setujui &amp; lanjutkan perbaikan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setApprovalAction("reject");
                                setPhoneLast4("");
                                setCatatanBatal("");
                                setIsApprovalModalOpen(true);
                            }}
                            className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-800 text-sm font-bold transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" aria-hidden="true" />
                            <span>Batalkan servis</span>
                        </button>
                    </div>
                </section>
            )}

            {/* 2. Main Split: Vertical SVG Process Path (Left) + Stage Details & Price Breakdown (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT: Vertical Process Path + Warranty Countdown */}
                <aside data-result-stagger className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                        <div className="pb-3 border-b border-slate-200">
                            <span className="font-mono text-xs font-semibold text-blue-700 block">
                                ALUR PERBAIKAN
                            </span>
                            <h2 className="font-display font-bold text-base sm:text-lg text-slate-950 mt-0.5">
                                Progres 5 tahap unit Anda
                            </h2>
                        </div>

                        <VerticalProcessPath
                            currentStatus={t.status}
                            tiket={t}
                            activeStepKey={activeStepKey}
                            onSelectStep={setActiveStepKey}
                        />
                    </div>

                    {/* Price Breakdown Summary Card (Always visible if estimate or invoice exists) */}
                    {(t.diagnosis?.estimasi_biaya > 0 || inv) && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3.5">
                            <span className="font-mono text-xs font-semibold text-blue-700 block">
                                RINCIAN BIAYA
                            </span>
                            {inv ? (
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-600">Biaya jasa</dt>
                                        <dd className="font-mono font-semibold text-slate-950">
                                            {formatRupiah(inv.biaya_jasa)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-600">Suku cadang</dt>
                                        <dd className="font-mono font-semibold text-slate-950">
                                            {formatRupiah(inv.biaya_sparepart)}
                                        </dd>
                                    </div>
                                    {Number(inv.diskon) > 0 && (
                                        <div className="flex justify-between gap-2 text-emerald-700">
                                            <dt>
                                                {inv.keterangan_diskon
                                                    ? `Potongan (${inv.keterangan_diskon})`
                                                    : "Potongan / Apresiasi"}
                                            </dt>
                                            <dd className="font-mono font-semibold">
                                                -{formatRupiah(inv.diskon)}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="pt-2.5 border-t border-slate-200 flex justify-between gap-2 text-base">
                                        <dt className="font-bold text-slate-950">Total</dt>
                                        <dd className="font-mono font-extrabold text-blue-700">
                                            {formatRupiah(inv.total_biaya)}
                                        </dd>
                                    </div>
                                </dl>
                            ) : (
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm text-slate-600">Estimasi awal</span>
                                    <span className="font-mono font-extrabold text-lg text-blue-700">
                                        {formatRupiah(t.diagnosis.estimasi_biaya)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* RIGHT: Selected Stage Details */}
                <div data-result-stagger className="lg:col-span-8 space-y-6 min-w-0">
                    {/* STAGE 1: DITERIMA */}
                    {activeStepKey === "diterima" && (
                        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
                            <div className="pb-4 border-b border-slate-200">
                                <span className="font-mono text-xs font-semibold text-blue-700 block">
                                    TAHAP 01 · DITERIMA
                                </span>
                                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-950 mt-0.5">
                                    Catatan penerimaan &amp; kondisi awal
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                    <h3 className="text-xs font-semibold text-slate-600">Keluhan pelanggan</h3>
                                    <p className="text-sm text-slate-950 leading-relaxed whitespace-pre-line">
                                        {t.keluhan || "-"}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                    <h3 className="text-xs font-semibold text-slate-600">Catatan kelengkapan</h3>
                                    <p className="text-sm text-slate-950 leading-relaxed whitespace-pre-line">
                                        {t.kelengkapan || "-"}
                                    </p>
                                </div>
                            </div>

                            {kelengkapanList.length > 0 && (
                                <div className="space-y-2.5">
                                    <h3 className="font-display font-bold text-sm text-slate-950">
                                        Daftar barang titipan
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {kelengkapanList.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                                            >
                                                <span
                                                    className={
                                                        item?.ada
                                                            ? "text-slate-900 font-medium"
                                                            : "text-slate-500 line-through"
                                                    }
                                                >
                                                    {item?.item || "Barang"}
                                                </span>
                                                <span
                                                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                                        item?.ada
                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                            : "bg-slate-200 text-slate-700"
                                                    }`}
                                                >
                                                    {item?.ada ? "Ada" : "Tidak"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {t.defect_map && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <PenTool className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
                                        <div>
                                            <p className="font-bold text-sm text-slate-950">Peta kondisi fisik unit</p>
                                            <p className="text-xs text-slate-600">
                                                Catatan goresan/fisik yang diperiksa bersama saat penerimaan.
                                            </p>
                                        </div>
                                    </div>
                                    <DefectMapBadge
                                        value={
                                            typeof t.defect_map === "string"
                                                ? (() => {
                                                      try {
                                                          return JSON.parse(t.defect_map);
                                                      } catch {
                                                          return null;
                                                      }
                                                  })()
                                                : t.defect_map
                                        }
                                        onClick={() => setIsDefectModalOpen(true)}
                                    />
                                </div>
                            )}

                            {t.checklist_intake && (() => {
                                const obj =
                                    typeof t.checklist_intake === "string"
                                        ? (() => {
                                              try {
                                                  return JSON.parse(t.checklist_intake);
                                              } catch {
                                                  return {};
                                              }
                                          })()
                                        : t.checklist_intake;
                                const cat = getDeviceCategory(t.jenis_perangkat);
                                const items = getHardwareChecklistForCategory(cat) || [];
                                if (!items.length) return null;
                                return (
                                    <div className="space-y-3 pt-4 border-t border-slate-200">
                                        <h3 className="font-display font-bold text-sm text-slate-950 flex items-center gap-2">
                                            <ClipboardCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
                                            <span>Pengecekan fungsi saat diterima ({cat})</span>
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                                            {items.map((item) => {
                                                const ok = getChecklistValue(obj, item.key, item.legacyKey);
                                                return (
                                                    <div
                                                        key={item.key}
                                                        className={`p-3 rounded-xl border ${
                                                            ok
                                                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                                                : "bg-rose-50/70 border-rose-200 text-rose-950"
                                                        }`}
                                                    >
                                                        <span className="font-bold block">
                                                            {ok ? "Normal" : "Bermasalah"}
                                                        </span>
                                                        <span className="text-slate-800 block mt-0.5">
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            <MediaDocumentation
                                fotoKondisi={t.foto_kondisi}
                                fotoDiagnosis={t.foto_diagnosis}
                                fotoSelesai={t.foto_selesai}
                                logPerbaikan={t.log_perbaikan}
                                filterCategory="intake"
                                heading="Foto kondisi awal (Sebelum)"
                            />
                        </section>
                    )}

                    {/* STAGE 2: DIAGNOSA */}
                    {activeStepKey === "diagnosis" && (
                        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
                            <div className="pb-4 border-b border-slate-200">
                                <span className="font-mono text-xs font-semibold text-blue-700 block">
                                    TAHAP 02 · DIAGNOSA
                                </span>
                                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-950 mt-0.5">
                                    Hasil pemeriksaan &amp; rekomendasi teknisi
                                </h2>
                            </div>

                            {t.diagnosis ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                                                <span>Temuan pemeriksaan</span>
                                            </h3>
                                            <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-line">
                                                {t.diagnosis.masalah}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
                                            <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                                <Wrench className="w-4 h-4 text-blue-600" aria-hidden="true" />
                                                <span>Rencana penanganan</span>
                                            </h3>
                                            <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-line">
                                                {t.diagnosis.solusi}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-[#0B162C] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <span className="text-xs text-blue-200 block">
                                                Estimasi biaya jasa &amp; komponen
                                            </span>
                                            <span className="text-xs text-slate-300">
                                                Disampaikan sebelum perbaikan dimulai
                                            </span>
                                        </div>
                                        <span className="font-mono font-extrabold text-xl text-white">
                                            {formatRupiah(t.diagnosis.estimasi_biaya)}
                                        </span>
                                    </div>

                                    <MediaDocumentation
                                        fotoKondisi={t.foto_kondisi}
                                        fotoDiagnosis={t.foto_diagnosis}
                                        fotoSelesai={t.foto_selesai}
                                        logPerbaikan={t.log_perbaikan}
                                        filterCategory="diagnosis"
                                        heading="Dokumentasi temuan diagnosa"
                                    />
                                </>
                            ) : (
                                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                                    <p className="font-semibold text-slate-900">Unit sedang dalam pemeriksaan</p>
                                    <p className="text-xs sm:text-sm text-slate-600">
                                        Hasil diagnosa dan perkiraan biaya akan muncul di sini segera setelah pengecekan selesai.
                                    </p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* STAGE 3: PENGERJAAN */}
                    {activeStepKey === "perbaikan" && (
                        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
                            <div className="pb-4 border-b border-slate-200">
                                <span className="font-mono text-xs font-semibold text-blue-700 block">
                                    TAHAP 03 · PENGERJAAN
                                </span>
                                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-950 mt-0.5">
                                    Catatan teknisi &amp; suku cadang terpasang
                                </h2>
                            </div>

                            {/* Sparepart Used */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-display font-bold text-sm text-slate-950 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-blue-600" aria-hidden="true" />
                                        <span>Suku cadang yang digunakan</span>
                                    </h3>
                                    <span className="font-mono text-xs text-slate-600">
                                        {parts.length} item
                                    </span>
                                </div>

                                {parts.length > 0 ? (
                                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                                        {parts.map((p, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                            >
                                                <div>
                                                    <p className="font-bold text-sm text-slate-950">
                                                        {p.sparepart?.nama || p.nama || "Suku Cadang"}
                                                    </p>
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        Jumlah: {p.jumlah || 1} unit
                                                        {p.serial_number ? ` · S/N: ${p.serial_number}` : ""}
                                                        {" · Komponen lama dikembalikan"}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg w-fit">
                                                    Tercatat di garansi
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
                                        Pengerjaan ditangani tanpa penggantian komponen baru sesuai hasil pemeriksaan teknisi.
                                    </p>
                                )}
                            </div>

                            {/* Repair Log Timeline */}
                            {logs.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-slate-200">
                                    <h3 className="font-display font-bold text-sm text-slate-950">
                                        Riwayat catatan teknisi
                                    </h3>
                                    <div className="space-y-2.5">
                                        {logs.map((log, i) => (
                                            <div
                                                key={log.id || i}
                                                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                    <span className="font-bold text-blue-700">
                                                        {log.fase || "Catatan Pengerjaan"}
                                                    </span>
                                                    <span className="font-mono text-slate-600">
                                                        {formatDateSafe(log.created_at, {
                                                            day: "numeric",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-800 leading-relaxed">
                                                    {log.catatan}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <MediaDocumentation
                                fotoKondisi={t.foto_kondisi}
                                fotoDiagnosis={t.foto_diagnosis}
                                fotoSelesai={t.foto_selesai}
                                logPerbaikan={t.log_perbaikan}
                                filterCategory="repair"
                                heading="Foto selama pengerjaan"
                            />
                        </section>
                    )}

                    {/* STAGE 4: QC */}
                    {activeStepKey === "selesai" && (
                        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
                            <div className="pb-4 border-b border-slate-200">
                                <span className="font-mono text-xs font-semibold text-blue-700 block">
                                    TAHAP 04 · QC
                                </span>
                                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-950 mt-0.5">
                                    Hasil pengecekan akhir (Quality Control)
                                </h2>
                            </div>

                            {t.checklist_qc ? (() => {
                                const obj =
                                    typeof t.checklist_qc === "string"
                                        ? (() => {
                                              try {
                                                  return JSON.parse(t.checklist_qc);
                                              } catch {
                                                  return {};
                                              }
                                          })()
                                        : t.checklist_qc;
                                const cat = getDeviceCategory(t.jenis_perangkat);
                                const qcItems = getQcChecklistForCategory(cat) || [];
                                return (
                                    <div className="space-y-4">
                                        {obj.passed_qc && (
                                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                                                <CheckCircle2
                                                    className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                                                    aria-hidden="true"
                                                />
                                                <p className="text-sm leading-relaxed">
                                                    <strong>Unit lulus pengecekan akhir.</strong> Seluruh fungsi utama telah diuji kembali sebelum serah terima.
                                                </p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                            {qcItems.map((item) => {
                                                const ok = getChecklistValue(obj, item.key, item.legacyKey);
                                                return (
                                                    <div
                                                        key={item.key}
                                                        className={`p-3 rounded-xl border ${
                                                            ok
                                                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                                                : "bg-slate-50 border-slate-200 text-slate-600"
                                                        }`}
                                                    >
                                                        <span className="font-bold block">
                                                            {ok ? "Lulus uji" : "Belum diuji"}
                                                        </span>
                                                        <span className="text-slate-900 font-semibold block mt-0.5">
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })() : (
                                <p className="text-sm text-slate-600">
                                    Pengecekan akhir dilakukan setelah perbaikan selesai.
                                </p>
                            )}

                            {t.tips_perawatan && (
                                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                                    <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4 text-blue-600" aria-hidden="true" />
                                        <span>Saran perawatan dari teknisi</span>
                                    </h3>
                                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                                        {t.tips_perawatan}
                                    </p>
                                </div>
                            )}

                            <MediaDocumentation
                                fotoKondisi={t.foto_kondisi}
                                fotoDiagnosis={t.foto_diagnosis}
                                fotoSelesai={t.foto_selesai}
                                logPerbaikan={t.log_perbaikan}
                                filterCategory="completed"
                                heading="Foto hasil akhir (Sesudah)"
                            />
                        </section>
                    )}

                    {/* STAGE 5: SIAP DIAMBIL / SERAH TERIMA */}
                    {activeStepKey === "diambil" && (
                        <section className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* QR Reopen & Pickup Verification Card (Crisp white + blue, no holographic gimmick) */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4">
                                    <div>
                                        <span className="font-mono text-xs font-semibold text-blue-700 block">
                                            QR VERIFIKASI TIKET
                                        </span>
                                        <h2 className="font-display font-bold text-lg text-slate-950 mt-0.5">
                                            Tunjukkan saat pengambilan
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                                            <TicketQrImage nomorTiket={t.nomor_tiket} size={104} />
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                            Pindai untuk membuka ulang halaman tiket ini kapan saja atau tunjukkan ke kasir saat serah terima unit.
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                                        <span className="font-mono font-bold text-slate-900">{t.nomor_tiket}</span>
                                        <button
                                            type="button"
                                            onClick={handleShareTracking}
                                            className="min-h-[36px] inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline cursor-pointer"
                                        >
                                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                            <span>Salin tautan</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Warranty Countdown Card (Semantic green/rose only for warranty state) */}
                                <div
                                    className={`rounded-2xl p-6 border flex flex-col justify-between gap-4 ${
                                        t.status === "diambil" && t.warranty_status?.isExpired
                                            ? "bg-rose-50/70 border-rose-200"
                                            : "bg-emerald-50/70 border-emerald-200"
                                    }`}
                                >
                                    <div>
                                        <span
                                            className={`font-mono text-xs font-bold block ${
                                                t.status === "diambil" && t.warranty_status?.isExpired
                                                    ? "text-rose-800"
                                                    : "text-emerald-800"
                                            }`}
                                        >
                                            {t.status === "diambil"
                                                ? t.warranty_status?.isExpired
                                                    ? "MASA GARANSI BERAKHIR"
                                                    : hasWarrantyCountdown
                                                    ? `GARANSI AKTIF · SISA ${warrantyRemaining} HARI`
                                                    : "GARANSI AKTIF"
                                                : "GARANSI SIAP DIAKTIFKAN"}
                                        </span>
                                        <h2 className="font-display font-bold text-lg text-slate-950 mt-0.5 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
                                            <span>Garansi {t.durasi_garansi || "1 Bulan"}</span>
                                        </h2>
                                    </div>

                                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                        {t.status === "diambil" && t.warranty_status?.garansi_berakhir_at
                                            ? `Berlaku hingga ${formatDateSafe(
                                                  t.warranty_status.garansi_berakhir_at
                                              )} untuk pengerjaan dan suku cadang yang tertera di nota.`
                                            : "Masa garansi mulai aktif sejak tanggal serah terima perangkat di bengkel."}
                                    </p>

                                    <div className="pt-3 border-t border-slate-200/80 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsWarrantyModalOpen(true)}
                                            className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl bg-[#0B162C] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                                        >
                                            <Award className="w-4 h-4" aria-hidden="true" />
                                            <span>Buka Kartu Garansi</span>
                                        </button>
                                        {inv && !inv.ttd_customer && (
                                            <button
                                                type="button"
                                                onClick={() => setIsSignInvoiceModalOpen(true)}
                                                className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                                            >
                                                <PenTool className="w-4 h-4" aria-hidden="true" />
                                                <span>Tanda Tangan</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* All Photos Comparison when completed */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
                                <MediaDocumentation
                                    fotoKondisi={t.foto_kondisi}
                                    fotoDiagnosis={t.foto_diagnosis}
                                    fotoSelesai={t.foto_selesai}
                                    logPerbaikan={t.log_perbaikan}
                                    heading="Seluruh dokumentasi sebelum & sesudah"
                                />
                            </div>
                        </section>
                    )}

                    {/* Rating Card (when selesai or diambil) */}
                    {["selesai", "diambil"].includes(t.status) && (
                        <TechnicianRatingCard ticket={t} />
                    )}
                </div>
            </div>

            {/* Mobile-First Thumb-Reachable Bottom Action Bar (44px+ targets) */}
            <div
                aria-label="Aksi cepat pelacakan"
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-slate-200 px-3 py-2.5 shadow-[0_-8px_24px_rgba(11,22,44,0.08)]"
                style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom, 10px))" }}
            >
                <div className="grid grid-cols-3 gap-2">
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[46px] inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                        <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>WhatsApp</span>
                    </a>
                    <button
                        type="button"
                        onClick={handleShareTracking}
                        className="min-h-[46px] inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold cursor-pointer"
                    >
                        <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Bagikan</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        className="min-h-[46px] inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl bg-[#0B162C] text-white text-xs font-semibold cursor-pointer"
                    >
                        <QrCode className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>QR Tiket</span>
                    </button>
                </div>
            </div>

            {/* QR Reopen Modal */}
            {isQrModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Kode QR tiket ${t.nomor_tiket}`}
                    className="modal-shell bg-[#0B162C]/65"
                    onClick={() => setIsQrModalOpen(false)}
                >
                    <div
                        className="modal-panel max-w-sm p-6 text-center space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-blue-700">QR PELACAKAN</span>
                            <button
                                type="button"
                                onClick={() => setIsQrModalOpen(false)}
                                aria-label="Tutup QR"
                                className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-5 h-5 text-slate-700" />
                            </button>
                        </div>
                        <div className="mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 w-fit">
                            <TicketQrImage nomorTiket={t.nomor_tiket} size={184} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-mono font-bold text-lg text-slate-950">{t.nomor_tiket}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pindai dengan kamera ponsel untuk membuka ulang status tiket ini atau tunjukkan saat pengambilan unit.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleShareTracking}
                            className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                        >
                            Salin tautan pelacakan
                        </button>
                    </div>
                </div>
            )}

            {/* Approval / Cancellation Modal */}
            {isApprovalModalOpen && (
                <div className="modal-shell bg-[#0B162C]/65">
                    <div className="modal-panel max-w-lg border-slate-200 my-auto">
                        <div className="modal-header shrink-0 px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
                            <h3 className="font-display font-bold text-base text-slate-950">
                                {approvalAction === "approve"
                                    ? "Konfirmasi Persetujuan Perbaikan"
                                    : "Konfirmasi Pembatalan Servis"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsApprovalModalOpen(false)}
                                aria-label="Tutup dialog"
                                className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-5 h-5 text-slate-700" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmitApproval}
                            className="flex flex-col flex-1 min-h-0 overflow-hidden"
                        >
                            <div className="modal-body overflow-y-auto flex-1 p-5 space-y-4 text-sm">
                                {approvalAction === "approve" ? (
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                                        <p className="font-semibold">Estimasi yang disetujui:</p>
                                        <p className="font-mono font-extrabold text-xl mt-1">
                                            {formatRupiah(t.diagnosis?.estimasi_biaya || 0)}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label
                                                htmlFor="cancel-reason"
                                                className="block text-xs font-semibold text-slate-800 mb-1"
                                            >
                                                Alasan pembatalan
                                            </label>
                                            <select
                                                id="cancel-reason"
                                                value={alasanBatal}
                                                onChange={(e) => setAlasanBatal(e.target.value)}
                                                className="w-full min-h-[44px] px-3 bg-white border border-slate-300 rounded-xl"
                                            >
                                                <option value="Biaya melebihi estimasi / budget">
                                                    Biaya melebihi anggaran
                                                </option>
                                                <option value="Ingin ganti perangkat baru">
                                                    Ingin ganti perangkat baru
                                                </option>
                                                <option value="Perangkat buru-buru ingin dipakai">
                                                    Perangkat segera dipakai
                                                </option>
                                                <option value="Lainnya">Lainnya</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="cancel-note"
                                                className="block text-xs font-semibold text-slate-800 mb-1"
                                            >
                                                Catatan tambahan (opsional)
                                            </label>
                                            <textarea
                                                id="cancel-note"
                                                value={catatanBatal}
                                                onChange={(e) => setCatatanBatal(e.target.value)}
                                                rows={2}
                                                className="w-full p-3 bg-white border border-slate-300 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="approval-phone4"
                                        className="block text-xs font-bold text-slate-900 mb-1"
                                    >
                                        Verifikasi 4 digit terakhir nomor WhatsApp terdaftar
                                    </label>
                                    <input
                                        id="approval-phone4"
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        maxLength={4}
                                        value={phoneLast4}
                                        onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ""))}
                                        placeholder="Contoh: 7890"
                                        className="yvs-exp-track-input w-full min-h-[48px] text-center tracking-widest font-mono font-bold px-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer shrink-0 px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsApprovalModalOpen(false)}
                                    className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-semibold cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingApproval || phoneLast4.length < 4}
                                    className={`min-h-[44px] px-5 rounded-xl text-white text-sm font-bold disabled:opacity-50 cursor-pointer ${
                                        approvalAction === "approve"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-rose-600 hover:bg-rose-700"
                                    }`}
                                >
                                    {submittingApproval
                                        ? "Memproses..."
                                        : approvalAction === "approve"
                                        ? "Konfirmasi Setuju"
                                        : "Konfirmasi Batal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lazy Heavy Modals */}
            <Suspense fallback={null}>
                {isInvoiceModalOpen && (
                    <InvoiceModal
                        isOpen={isInvoiceModalOpen}
                        onClose={() => setIsInvoiceModalOpen(false)}
                        tiket={t}
                        invoice={t.invoice}
                    />
                )}
                {isWarrantyModalOpen && (
                    <WarrantyCertificateModal
                        isOpen={isWarrantyModalOpen}
                        onClose={() => setIsWarrantyModalOpen(false)}
                        tiket={t}
                        isCustomerView={true}
                    />
                )}
                {isDefectModalOpen && (
                    <DefectMapperModal
                        isOpen={isDefectModalOpen}
                        onClose={() => setIsDefectModalOpen(false)}
                        value={t.defect_map}
                        readOnly={true}
                        title={`Peta Kondisi Fisik: ${t.perangkat}`}
                    />
                )}
                {isSignInvoiceModalOpen && (
                    <DigitalSignaturePadModal
                        isOpen={isSignInvoiceModalOpen}
                        onClose={() => setIsSignInvoiceModalOpen(false)}
                        onSave={handleCustomerSignInvoice}
                        defaultName={t.customer_nama || ""}
                        title="Tanda Tangan Penerimaan Unit"
                        description={`Bubuhkan tanda tangan Anda untuk mengonfirmasi penerimaan unit ${t.perangkat}.`}
                        agreementText="Saya menyatakan telah menerima kembali unit perangkat dalam kondisi baik dan menyetujui rincian perbaikan serta garansi yang berlaku."
                        requirePhoneVerify={true}
                        expectedPhoneLast4=""
                        loading={submittingSignInvoice}
                    />
                )}
            </Suspense>
        </div>
    );
}

export default function TrackingResultView({
    results,
    selectedTicket,
    onSelectTicket,
    onBackToLanding,
    onSearchAnother,
    onUpdateTicket,
    headingRef,
}) {
    return (
        <div className="yvs-exp-scope min-h-screen bg-slate-50 font-sans text-slate-950">
            <a
                href="#tracking-result-main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:text-sm focus:font-semibold"
            >
                Lewati ke detail servis
            </a>

            <header className="bg-white/95 lg:backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={onBackToLanding}
                            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-700" aria-hidden="true" />
                            <span>Beranda</span>
                        </button>
                        <div
                            ref={headingRef}
                            tabIndex={-1}
                            className="hidden sm:flex items-center gap-2 min-w-0 focus:outline-none"
                        >
                            <img
                                src="/logo-yangversa.png"
                                alt=""
                                width="24"
                                height="24"
                                className="w-6 h-6 rounded object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                            />
                            <span className="font-display font-bold text-sm text-slate-950 truncate">
                                YVS Computer
                            </span>
                            <span className="text-slate-300" aria-hidden="true">/</span>
                            <span className="text-xs font-mono font-semibold text-slate-700 truncate">
                                {selectedTicket
                                    ? selectedTicket.nomor_tiket
                                    : `${results?.length || 0} tiket ditemukan`}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onSearchAnother}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B162C] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
                    >
                        <Search className="w-4 h-4" aria-hidden="true" />
                        <span>Lacak tiket lain</span>
                    </button>
                </div>
            </header>

            <main
                id="tracking-result-main"
                style={{ viewTransitionName: "yvs-tracking-shell" }}
                className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10"
            >
                {results && results.length > 0 && !selectedTicket && (
                    <div className="space-y-5 max-w-4xl mx-auto">
                        <div className="pb-4 border-b border-slate-200">
                            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-950">
                                Ditemukan {results.length} tiket servis
                            </h1>
                            <p className="text-sm text-slate-600 mt-1">
                                Pilih salah satu perangkat di bawah untuk melihat perkembangan lengkapnya.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {results.map((item, idx) => {
                                const meta = SEMANTIC_STATUS[item?.status] || {
                                    label: item?.status || "Dalam Proses",
                                    badge: "bg-slate-100 text-slate-800 border-slate-300",
                                };
                                return (
                                    <button
                                        key={item.id || idx}
                                        type="button"
                                        onClick={() => onSelectTicket(item)}
                                        className="w-full text-left bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer"
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-bold text-base text-slate-950">
                                                    {item.nomor_tiket}
                                                </span>
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                    {item.jenis_perangkat || "Perangkat"}
                                                </span>
                                            </div>
                                            <p className="font-display font-bold text-base sm:text-lg text-slate-950">
                                                {item.perangkat}
                                            </p>
                                            <p className="text-xs text-slate-600">
                                                Masuk: {formatDateSafe(item.created_at)} · Teknisi:{" "}
                                                {item.teknisi || "Belum ditugaskan"}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border w-fit shrink-0 ${meta.badge}`}
                                        >
                                            {meta.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {selectedTicket && (
                    <TicketDetailExperience
                        initialTicket={selectedTicket}
                        onBackToList={
                            results && results.length > 1 ? () => onSelectTicket(null) : undefined
                        }
                        onUpdateTicket={onUpdateTicket}
                    />
                )}
            </main>
        </div>
    );
}
