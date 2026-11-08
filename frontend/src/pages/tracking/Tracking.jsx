import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Search, LogIn, Phone, Ticket as TicketIcon, SearchX, CheckCircle, PackageSearch, PenTool, ChevronDown, ChevronUp, User, Calendar, MonitorSmartphone, ClipboardCheck, Award, Star, MapPin, MessageCircle, Download, ShieldCheck, QrCode, CreditCard, Camera, Lightbulb, Package, X, ChevronLeft, ChevronRight, Wrench, Image as ImageIcon, ImageOff, Clock, AlertTriangle, Check, CheckCircle2, Play, Video, ZoomIn, Share2, RefreshCw, Copy, Printer, FileText } from "lucide-react";
import { isVideo, getMediaUrl } from "../../utils/mediaUtils";
import { 
    CHECKLIST_ITEMS, 
    QC_CHECKLIST_ITEMS, 
    getChecklistValue, 
    getHardwareChecklistForCategory, 
    getQcChecklistForCategory, 
    getDeviceCategory 
} from "../../utils/checklistItems";
import WarrantyCertificateModal from "../../components/WarrantyCertificateModal";
import InvoiceModal from "../../components/InvoiceModal";
import CameraScannerModal from "../../components/CameraScannerModal";
import SlaBadge, { SlaCountdownCard } from "../../components/SlaBadge";
import DefectMapperModal, { DefectMapBadge } from "../../components/DefectMapperModal";
import DigitalSignaturePadModal from "../../components/DigitalSignaturePadModal";
import ErrorBoundary from "../../components/ErrorBoundary";
import LandingNavbar from "../../components/landing/LandingNavbar";
import ServiceProcess3D from "../../components/landing/ServiceProcess3D";
import BrandTicker from "../../components/landing/BrandTicker";
import ServiceSpecSheet from "../../components/landing/ServiceSpecSheet";
import EngineeringStandards from "../../components/landing/EngineeringStandards";
import WorkshopMetrics from "../../components/landing/WorkshopMetrics";
import WorkshopLocation from "../../components/landing/WorkshopLocation";
import LandingFooter from "../../components/landing/LandingFooter";
import SpotlightCard from "../../components/tracking/SpotlightCard";
import HolographicTiltCard from "../../components/tracking/HolographicTiltCard";

const RECENT_TRACKING_KEY = "yvs_recent_tracking";

function getRecentSearches() {
    try {
        const stored = localStorage.getItem(RECENT_TRACKING_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch (_) {}
    return [];
}

function saveRecentSearch(type, value) {
    if (!value || !String(value).trim()) return;
    try {
        const clean = String(value).trim();
        const current = getRecentSearches();
        const filtered = current.filter(item => item.value !== clean);
        const updated = [{ type, value: clean, time: Date.now() }, ...filtered].slice(0, 4);
        localStorage.setItem(RECENT_TRACKING_KEY, JSON.stringify(updated));
    } catch (_) {}
}

function clearRecentSearches() {
    try {
        localStorage.removeItem(RECENT_TRACKING_KEY);
    } catch (_) {}
}

function extractTicketFromScan(text) {
    if (!text) return "";
    const clean = String(text).trim();
    try {
        if (clean.startsWith("http://") || clean.startsWith("https://")) {
            const url = new URL(clean);
            const tParam = url.searchParams.get("nomor_tiket") || url.searchParams.get("tiket");
            if (tParam) return tParam.trim();
        }
    } catch (_) {}
    return clean;
}

const STATUS_LABELS = {
    diterima: { label: "Diterima", color: "bg-blue-50 text-blue-700 border-blue-200" },
    didiagnosis: { label: "Didiagnosis", color: "bg-purple-50 text-purple-700 border-purple-200" },
    menunggu_persetujuan: { label: "Menunggu Persetujuan", color: "bg-amber-50 text-amber-700 border-amber-200" },
    disetujui: { label: "Disetujui", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    dalam_perbaikan: { label: "Dalam Perbaikan", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    selesai: { label: "Selesai", color: "bg-green-50 text-green-700 border-green-200" },
    diambil: { label: "Diambil", color: "bg-slate-50 text-slate-700 border-slate-200" },
    dibatalkan: { label: "Dibatalkan", color: "bg-red-50 text-red-600 border-red-200" },
};

function formatRupiah(num) {
    const val = typeof num === "number" ? num : (parseFloat(num) || 0);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

function formatDateSafe(dateStr, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString('id-ID', options);
    } catch (_) {
        return "-";
    }
}

function safeParseUrls(val) {
    if (!val) return [];
    let parsed = val;

    // Robustly unwrap double or triple JSON-stringified payloads from database/APIs
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
            let str = item.trim().replace(/^["']+|["']+$/g, "");
            if (str.startsWith("[") || (str.startsWith("{") && str.endsWith("}"))) {
                try {
                    const inner = JSON.parse(str);
                    if (Array.isArray(inner)) return inner.flatMap(extractUrl);
                    if (inner && typeof inner === "object") return inner.url || inner.path || inner.src || inner.filename || "";
                } catch (_) {}
            }
            return str;
        }
        if (typeof item === "object") {
            return item.url || item.path || item.src || item.foto_url || item.filename || "";
        }
        return String(item);
    };

    if (Array.isArray(parsed)) {
        return parsed.flatMap(extractUrl).filter(Boolean);
    }
    if (typeof parsed === "object" && parsed !== null) {
        return Object.values(parsed).flatMap(extractUrl).filter(Boolean);
    }
    if (typeof parsed === "string" && parsed.trim()) {
        return [parsed.trim().replace(/^["']+|["']+$/g, "")].filter(Boolean);
    }
    return [];
}

function TrackingProgress({ currentStatus, onWarrantyClick }) {
    if (currentStatus === 'dibatalkan') {
        return (
            <div className="mb-10 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <SearchX className="w-6 h-6 shrink-0" />
                <span className="font-semibold">Servis ini telah dibatalkan.</span>
            </div>
        );
    }

    const steps = [
        { id: ['diterima'], label: 'Diterima' },
        { id: ['didiagnosis', 'menunggu_persetujuan', 'disetujui'], label: 'Diagnosis' },
        { id: ['dalam_perbaikan'], label: 'Diperbaiki' },
        { id: ['selesai'], label: 'Selesai' },
        { id: ['diambil'], label: 'Diambil' }
    ];

    let currentStepIndex = steps.findIndex(step => step.id.includes(currentStatus));
    if (currentStepIndex === -1) currentStepIndex = 0;

    return (
        <div className="mb-12 w-full max-w-3xl mx-auto px-2 sm:px-4">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 rounded-full z-0"></div>
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-blue-500 rounded-full z-0 transition-all duration-700 ease-out"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                ></div>
                
                {steps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isActive = idx === currentStepIndex;
                    const isWarrantyStep = (step.label === 'Selesai' || step.label === 'Diambil') && isCompleted;

                    return (
                        <div 
                            key={idx} 
                            onClick={() => {
                                if (isWarrantyStep && onWarrantyClick) {
                                    onWarrantyClick();
                                }
                            }}
                            className={`relative z-10 flex flex-col items-center gap-2 ${isWarrantyStep ? 'cursor-pointer group' : ''}`}
                            title={isWarrantyStep ? "Klik untuk langsung melompat ke Kartu Garansi & QR Pick-up" : undefined}
                        >
                            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-base border-4 transition-all duration-500 ${
                                isCompleted ? 'bg-blue-600 border-blue-100 text-white shadow-md shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-300'
                            } ${isActive ? 'ring-4 ring-blue-50/80 scale-110' : ''} ${isWarrantyStep ? 'group-hover:scale-115 group-hover:ring-4 group-hover:ring-emerald-200' : ''}`}>
                                {isCompleted && !isActive ? <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" /> : idx + 1}
                            </div>
                            <span className={`text-4xs xs:text-3xs sm:text-xs md:text-sm font-bold absolute -bottom-6 sm:-bottom-8 whitespace-nowrap transition-colors ${isCompleted ? 'text-slate-800' : 'text-slate-400'} ${isWarrantyStep ? 'group-hover:text-emerald-700' : ''}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TrackingRepairLogNodes({ logs = [], onPhotoClick }) {
    const sorted = [...logs].sort((a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0));
    // Default null (hidden). Muncul hanya saat node diklik.
    const [selectedIdx, setSelectedIdx] = useState(null);
    const activeLog = selectedIdx !== null ? sorted[selectedIdx] : null;

    if (!sorted.length) return null;

    const getNodeStyle = (fase) => {
        switch (fase) {
            case "Diagnosis":
                return { bg: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200", ring: "ring-amber-200", label: "Diagnosis" };
            case "Catatan Admin":
                return { bg: "bg-purple-500", chip: "bg-purple-50 text-purple-700 border-purple-200", ring: "ring-purple-200", label: "Admin" };
            case "Selesai":
                return { bg: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", ring: "ring-emerald-200", label: "Selesai" };
            case "Penyerahan Unit":
                return { bg: "bg-teal-500", chip: "bg-teal-50 text-teal-700 border-teal-200", ring: "ring-teal-200", label: "Handover" };
            case "Pembatalan":
                return { bg: "bg-rose-500", chip: "bg-rose-50 text-rose-700 border-rose-200", ring: "ring-rose-200", label: "Batal" };
            case "Revisi ACC":
                return { bg: "bg-orange-500", chip: "bg-orange-50 text-orange-700 border-orange-200", ring: "ring-orange-200", label: "Revisi ACC" };
            default:
                return { bg: "bg-blue-600", chip: "bg-blue-50 text-blue-700 border-blue-200", ring: "ring-blue-200", label: fase || "Perbaikan" };
        }
    };

    return (
        <div className="space-y-3">
            {/* Horizontal Nodes Connector */}
            <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 overflow-x-auto custom-scrollbar">
                <div className="flex items-center min-w-max px-2 py-2 relative">
                    <div className="absolute left-6 right-6 top-6 h-1 bg-slate-200 rounded-full z-0"></div>
                    {sorted.map((log, idx) => {
                        const style = getNodeStyle(log?.fase);
                        const isSelected = idx === selectedIdx;
                        return (
                            <div key={idx} className="relative z-10 flex flex-col items-center mx-3 sm:mx-4 cursor-pointer group">
                                <button
                                    type="button"
                                    onClick={() => setSelectedIdx(isSelected ? null : idx)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm transition-all duration-200 cursor-pointer ${style.bg} ${
                                        isSelected 
                                            ? `ring-4 ${style.ring} scale-110 shadow-md` 
                                            : 'opacity-75 hover:opacity-100 hover:scale-105'
                                    }`}
                                    title="Klik untuk membuka/menutup rincian catatan proses ini"
                                >
                                    {idx + 1}
                                </button>
                                <span 
                                    onClick={() => setSelectedIdx(isSelected ? null : idx)}
                                    className={`text-3xs font-bold mt-2 whitespace-nowrap transition-colors ${
                                        isSelected ? 'text-slate-900 font-extrabold' : 'text-slate-400 group-hover:text-slate-600'
                                    }`}
                                >
                                    {style.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Instruction if hidden */}
            {selectedIdx === null && (
                <p className="text-2xs text-slate-400 italic text-center py-1">
                    Ketuk salah satu node angka di atas untuk membaca rincian catatan dan melihat lampiran foto.
                </p>
            )}

            {/* Selected Node Details Card (Hidden by default, shows on click) */}
            {activeLog && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                        <span className={`text-3xs uppercase font-bold px-2.5 py-1 rounded-md border ${getNodeStyle(activeLog?.fase).chip}`}>
                            Tahap #{selectedIdx + 1}: {activeLog?.fase}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xs text-slate-400 font-medium">
                                {formatDateSafe(activeLog?.created_at, { 
                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedIdx(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                                title="Tutup rincian"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line break-words mb-3">
                        {activeLog?.catatan}
                    </p>

                    {activeLog?.foto_url && (
                        <div className="pt-2 border-t border-slate-100">
                            <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                Foto Lampiran ({activeLog?.fase})
                            </span>
                            <button
                                type="button"
                                onClick={() => onPhotoClick && onPhotoClick({ 
                                    url: activeLog.foto_url, 
                                    label: `Tahap: ${activeLog.fase}` 
                                })}
                                className="group relative inline-block rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                                title="Klik untuk melihat foto dalam ukuran penuh"
                            >
                                <img 
                                    src={getMediaUrl(activeLog.foto_url)} 
                                    alt={`Foto ${activeLog.fase}`} 
                                    loading="lazy"
                                    className="h-28 object-cover rounded-xl group-hover:scale-105 transition-transform" 
                                />
                                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md">
                                        <ZoomIn className="w-4 h-4" />
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function TrackingListItem({ t, onClick }) {
    const statusInfo = STATUS_LABELS[t?.status] || {
        label: t?.status ? String(t.status).replace(/_/g, " ") : "Dalam Proses",
        color: "bg-slate-50 text-slate-700 border-slate-200"
    };

    return (
        <div 
            onClick={onClick}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 cursor-pointer hover:bg-slate-50 hover:border-blue-300 hover:shadow-md transition-all w-full"
        >
            <div className="space-y-1 w-full">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <span className="font-mono font-bold text-base sm:text-lg text-slate-900">{t?.nomor_tiket}</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-3xs font-bold uppercase tracking-wide">
                        <MonitorSmartphone className="w-3.5 h-3.5" />
                        {t?.jenis_perangkat || "Perangkat"}
                    </span>
                    {t?.sla_paket && <SlaBadge tiket={t} />}
                </div>
                <h4 className="text-slate-800 font-bold text-base sm:text-lg leading-tight break-words">{t?.perangkat || "Detail Perangkat"}</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3">
                    <p className="text-slate-500 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Masuk: {formatDateSafe(t?.created_at)}
                    </p>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        Teknisi: <span className="text-slate-700 font-semibold">{t?.teknisi || "Belum ditugaskan"}</span>
                    </p>
                </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 mt-2 sm:mt-0 shrink-0">
                <span className={`inline-flex px-3 py-1.5 rounded-full text-3xs sm:text-xs font-bold border uppercase tracking-widest text-center shrink-0 ${statusInfo.color}`}>
                    {statusInfo.label}
                </span>
                <button className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors shadow-sm hidden sm:flex shrink-0">
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
            </div>
        </div>
    );
}

/* ===== Feature 1: Photo & Video Media Gallery Modal & Lightbox ===== */
function PhotoGallery({ fotoKondisi, fotoDiagnosis, fotoSelesai, logPerbaikan, externalPhoto, onCloseExternal }) {
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const [customItem, setCustomItem] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [imgErrors, setImgErrors] = useState({});

    // Collect all media into categorized array
    const allPhotos = [];

    // 1. Initial condition photos
    const intakeUrls = safeParseUrls(fotoKondisi);
    intakeUrls.forEach((url, i) => {
        allPhotos.push({ url, label: `Kondisi Awal #${i + 1}`, category: 'intake', categoryLabel: "Kondisi Awal" });
    });

    // 2. Diagnosis proof photos/videos
    const diagUrls = safeParseUrls(fotoDiagnosis);
    diagUrls.forEach((url, i) => {
        allPhotos.push({ url, label: `Temuan Diagnosis #${i + 1}`, category: 'diagnosis', categoryLabel: "Diagnosis" });
    });

    // 3. Repair log photos
    if (Array.isArray(logPerbaikan)) {
        logPerbaikan.forEach((log, i) => {
            if (log && log.foto_url) {
                allPhotos.push({ 
                    url: log.foto_url, 
                    label: log.catatan ? `Pengerjaan: ${log.catatan.substring(0, 45)}...` : `Foto Pengerjaan #${i + 1}`, 
                    category: 'repair',
                    categoryLabel: "Pengerjaan" 
                });
            }
        });
    }

    // 4. Completed & QC photos/videos
    const selesaiUrls = safeParseUrls(fotoSelesai);
    selesaiUrls.forEach((url, i) => {
        allPhotos.push({ url, label: `Hasil Selesai & QC #${i + 1}`, category: 'completed', categoryLabel: "Selesai & QC" });
    });

    // Handle external trigger (e.g. from timeline click)
    useEffect(() => {
        if (externalPhoto && externalPhoto.url) {
            const foundIdx = allPhotos.findIndex(p => p.url === externalPhoto.url);
            if (foundIdx >= 0) {
                setLightboxIdx(foundIdx);
                setCustomItem(null);
            } else {
                setCustomItem({
                    url: externalPhoto.url,
                    label: externalPhoto.label || "Dokumentasi Perbaikan",
                    category: "repair",
                    categoryLabel: "Pengerjaan"
                });
                setLightboxIdx(0);
            }
            setLightboxOpen(true);
        }
    }, [externalPhoto]);

    if (allPhotos.length === 0 && !customItem) return null;

    const currentList = customItem ? [customItem, ...allPhotos] : allPhotos;

    const openLightbox = (idx) => { 
        setLightboxIdx(idx); 
        setCustomItem(null); 
        setLightboxOpen(true); 
    };
    
    const closeLightbox = () => { 
        setLightboxOpen(false); 
        setCustomItem(null); 
        if (onCloseExternal) onCloseExternal(); 
    };

    const goPrev = () => setLightboxIdx((prev) => (prev - 1 + currentList.length) % currentList.length);
    const goNext = () => setLightboxIdx((prev) => (prev + 1) % currentList.length);

    const intakePhotos = allPhotos.filter(p => p.category === 'intake');
    const diagPhotos = allPhotos.filter(p => p.category === 'diagnosis');
    const repairPhotos = allPhotos.filter(p => p.category === 'repair');
    const selesaiPhotos = allPhotos.filter(p => p.category === 'completed');

    const tabs = [
        { id: "all", label: "Semua", count: allPhotos.length },
        ...(intakePhotos.length > 0 ? [{ id: "intake", label: "Kondisi Awal", count: intakePhotos.length }] : []),
        ...(diagPhotos.length > 0 ? [{ id: "diagnosis", label: "Diagnosis", count: diagPhotos.length }] : []),
        ...(repairPhotos.length > 0 ? [{ id: "repair", label: "Pengerjaan", count: repairPhotos.length }] : []),
        ...(selesaiPhotos.length > 0 ? [{ id: "completed", label: "Selesai & QC", count: selesaiPhotos.length }] : []),
    ];

    const filteredPhotos = activeTab === "all" 
        ? allPhotos 
        : allPhotos.filter(p => p.category === activeTab);

    return (
        <>
            {/* Compact Summary Card instead of sprawling layout section */}
            <div className="mb-8 pt-6 border-t border-slate-100">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-blue-300 transition-all">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                            <Camera className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h5 className="font-bold text-slate-900 text-sm sm:text-base">Dokumentasi Media Perangkat</h5>
                                <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-blue-100 text-blue-700">
                                    {allPhotos.length} Media
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Foto kondisi fisik awal, pembuktian diagnosa, proses perbaikan, dan hasil akhir QC.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-stretch sm:self-center justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        {/* Stacked Interactive Preview Thumbnails with Video & Error Fallbacks */}
                        <div className="flex -space-x-2.5 overflow-hidden py-1">
                            {allPhotos.slice(0, 4).map((p, i) => {
                                const url = getMediaUrl(p.url);
                                const isVid = isVideo(p.url);
                                const hasError = imgErrors[p.url];

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => openLightbox(i)}
                                        className="relative inline-flex items-center justify-center h-9 w-9 rounded-full ring-2 ring-white shadow-2xs overflow-hidden shrink-0 transition-transform hover:scale-110 hover:z-20 cursor-pointer bg-slate-100"
                                        title={`Buka ${p.label || "Media"} (#${i + 1})`}
                                    >
                                        {isVid ? (
                                            <div className="w-full h-full bg-slate-900 text-purple-400 flex items-center justify-center relative">
                                                <video src={url} className="w-full h-full object-cover opacity-70" preload="none" muted />
                                                <Play className="w-3.5 h-3.5 fill-current absolute drop-shadow-sm" />
                                            </div>
                                        ) : hasError ? (
                                            <div className="w-full h-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                                                <Camera className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <img 
                                                src={url} 
                                                alt={p.label || ""} 
                                                loading="lazy"
                                                decoding="async"
                                                onError={() => setImgErrors(prev => ({ ...prev, [p.url]: true }))}
                                                className="w-full h-full object-cover" 
                                            />
                                        )}
                                    </button>
                                );
                            })}
                            {allPhotos.length > 4 && (
                                <button
                                    type="button"
                                    onClick={() => setIsGalleryModalOpen(true)}
                                    className="relative inline-flex items-center justify-center h-9 w-9 rounded-full ring-2 ring-white bg-blue-600 text-white text-3xs font-extrabold shadow-2xs shrink-0 hover:scale-110 hover:z-20 transition-transform cursor-pointer"
                                    title="Lihat semua media"
                                >
                                    +{allPhotos.length - 4}
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsGalleryModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer shrink-0"
                        >
                            <ZoomIn className="w-4 h-4" />
                            <span>Buka Galeri Foto</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Gallery Grid Modal */}
            {isGalleryModalOpen && (
                <div 
                    className="modal-shell z-[9990] bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsGalleryModalOpen(false)}
                >
                    <div 
                        className="modal-panel max-w-3xl animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Dokumentasi Media Perangkat</h3>
                                    <p className="text-xs text-slate-500">Total {allPhotos.length} foto & video pengerjaan</p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsGalleryModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Category Filter Tabs */}
                        {tabs.length > 2 && (
                            <div className="px-5 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar bg-slate-50/50">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                            activeTab === tab.id
                                                 ? "bg-blue-600 text-white shadow-xs"
                                                : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                                        }`}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Grid */}
                        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {filteredPhotos.map((photo, idx) => {
                                    const globalIdx = allPhotos.indexOf(photo);
                                    const isVid = isVideo(photo.url);
                                    const url = getMediaUrl(photo.url);
                                    const hasError = imgErrors[photo.url];

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => openLightbox(globalIdx >= 0 ? globalIdx : 0)}
                                            className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 hover:border-blue-500 transition-all shadow-2xs hover:shadow-md cursor-pointer flex items-center justify-center text-left"
                                        >
                                            {isVid ? (
                                                <div className="w-full h-full relative flex items-center justify-center">
                                                    <video src={url} className="w-full h-full object-cover opacity-80" preload="none" muted />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg border border-white/20">
                                                            <Play className="w-4 h-4 fill-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                    <span className="absolute top-2 right-2 bg-purple-600 text-white text-4xs font-bold px-1.5 py-0.5 rounded shadow">
                                                        VIDEO
                                                    </span>
                                                </div>
                                            ) : hasError ? (
                                                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-3 text-slate-400 gap-1.5">
                                                    <ImageOff className="w-6 h-6 text-slate-300" />
                                                    <span className="text-3xs font-medium text-slate-500 text-center line-clamp-1">{photo.label}</span>
                                                </div>
                                            ) : (
                                                <img 
                                                    src={url} 
                                                    alt={photo.label} 
                                                    loading="lazy"
                                                    decoding="async"
                                                    onError={() => setImgErrors(prev => ({ ...prev, [photo.url]: true }))}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                                                <span className="text-3xs uppercase font-bold text-blue-300 mb-0.5">{photo.categoryLabel}</span>
                                                <span className="text-white text-xs font-semibold truncate">{photo.label}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Interactive Lightbox Modal */}
            {lightboxOpen && currentList[lightboxIdx] && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" 
                    onClick={closeLightbox}
                >
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                            type="button"
                            onClick={closeLightbox} 
                            className="absolute -top-3 -right-2 sm:top-2 sm:right-2 z-10 bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-white transition-colors backdrop-blur-sm cursor-pointer shadow-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative w-full flex items-center justify-center">
                            {currentList.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={goPrev} 
                                    className="absolute left-0 sm:left-2 z-10 bg-white/10 hover:bg-white/25 p-2.5 sm:p-3 rounded-full text-white transition-all backdrop-blur-sm cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}

                            {isVideo(currentList[lightboxIdx].url) ? (
                                <video 
                                    src={getMediaUrl(currentList[lightboxIdx].url)} 
                                    controls 
                                    autoPlay 
                                    playsInline 
                                    className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl bg-black border border-white/20"
                                />
                            ) : imgErrors[currentList[lightboxIdx].url] ? (
                                <div className="max-h-[60vh] aspect-video w-full max-w-lg bg-slate-900/90 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-300 border border-white/10 shadow-2xl">
                                    <ImageOff className="w-12 h-12 text-slate-500 mb-3" />
                                    <h4 className="font-bold text-sm text-white mb-1">Pratinjau Foto Tidak Dapat Dimuat</h4>
                                    <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
                                        Berkas media ini belum tersedia di server atau tautan penyedia tidak merespons.
                                    </p>
                                </div>
                            ) : (
                                <img 
                                    src={getMediaUrl(currentList[lightboxIdx].url)} 
                                    alt={currentList[lightboxIdx].label} 
                                    onError={() => setImgErrors(prev => ({ ...prev, [currentList[lightboxIdx].url]: true }))}
                                    className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20" 
                                />
                            )}

                            {currentList.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={goNext} 
                                    className="absolute right-0 sm:right-2 z-10 bg-white/10 hover:bg-white/25 p-2.5 sm:p-3 rounded-full text-white transition-all backdrop-blur-sm cursor-pointer"
                                >
                                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}
                        </div>

                        <div className="mt-4 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-3xs font-bold bg-white/10 text-white/80 uppercase tracking-wider mb-1">
                                {currentList[lightboxIdx]?.categoryLabel || "Dokumentasi"}
                            </span>
                            <p className="text-white/95 text-sm font-semibold">{currentList[lightboxIdx]?.label || ""}</p>
                            <p className="text-white/50 text-xs mt-1">{lightboxIdx + 1} / {currentList.length}</p>
                        </div>

                        {/* Thumbnail filmstrip */}
                        {currentList.length > 1 && (
                            <div className="mt-4 flex gap-2 overflow-x-auto max-w-full pb-2 px-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                                {currentList.map((photo, idx) => {
                                    const photoUrl = typeof photo?.url === "string" ? photo.url : "";
                                    const isVid = isVideo(photoUrl);
                                    const hasError = imgErrors[photoUrl];

                                    return (
                                        <button 
                                            key={idx} 
                                            type="button"
                                            onClick={() => setLightboxIdx(idx)} 
                                            className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all relative w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 cursor-pointer ${idx === lightboxIdx ? 'border-blue-400 ring-2 ring-blue-400/30 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                                        >
                                            {isVid ? (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <video src={getMediaUrl(photoUrl)} className="w-full h-full object-cover opacity-60" preload="none" muted />
                                                    <Play className="w-3.5 h-3.5 text-white fill-white absolute" />
                                                </div>
                                            ) : hasError ? (
                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <ImageOff className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <img 
                                                    src={getMediaUrl(photoUrl)} 
                                                    alt="" 
                                                    loading="lazy"
                                                    decoding="async"
                                                    onError={() => setImgErrors(prev => ({ ...prev, [photoUrl]: true }))}
                                                    className="w-full h-full object-cover" 
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

/* ===== Feature 3: Post-Service Care Tips ===== */
function CareTipsCard({ tips }) {
    if (!tips) return null;

    return (
        <div className="mb-8 pt-6 border-t border-slate-100">
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 sm:p-6 relative overflow-hidden">
                <Lightbulb className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-200/30 rotate-12" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="bg-amber-500 p-2 rounded-xl shadow-sm">
                            <Lightbulb className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-900 text-sm sm:text-base">Tips Perawatan dari Teknisi</h5>
                            <p className="text-2xs text-amber-700 font-medium">Panduan khusus untuk menjaga perangkat Anda</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-amber-100">
                        <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{tips}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===== Feature 4: Deposited Accessories Checklist ===== */
function AccessoriesChecklist({ kelengkapanDetail, kelengkapanText }) {
    let items = [];
    if (kelengkapanDetail) {
        try {
            let parsed = typeof kelengkapanDetail === 'string' ? JSON.parse(kelengkapanDetail) : kelengkapanDetail;
            if (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch (_) {}
            }
            if (Array.isArray(parsed)) {
                items = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
                items = Object.values(parsed);
            }
        } catch(e) {
            items = [];
        }
    }

    if (!Array.isArray(items)) items = [];
    if (items.length === 0 && !kelengkapanText) return null;

    const totalItems = items.length;
    const presentItems = items.filter(i => i && i.ada).length;

    return (
        <div className="mb-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2.5 mb-4">
                <Package className="w-5 h-5 text-indigo-600" />
                <h5 className="font-semibold text-slate-900 text-sm sm:text-base">Kelengkapan Barang Titipan</h5>
                {totalItems > 0 && (
                    <span className="ml-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        {presentItems}/{totalItems} item dititipkan
                    </span>
                )}
            </div>

            {items.length > 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-white/60 transition-colors">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${item && item.ada ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                                    {item && item.ada ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <X className="w-4 h-4" />
                                    )}
                                </div>
                                <span className={`text-sm font-medium flex-1 min-w-0 break-words ${item && item.ada ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                    {item?.item || "Barang"}
                                </span>
                                <span className={`text-3xs uppercase font-bold tracking-wide px-2 py-0.5 rounded-md shrink-0 ${item && item.ada ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-400 border border-red-100'}`}>
                                    {item && item.ada ? 'Ada' : 'Tidak Ada'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : kelengkapanText ? (
                <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed whitespace-pre-line">{kelengkapanText}</p>
            ) : null}
        </div>
    );
}

/* ===== Feature: Sparepart Transparency & Old Part Return SOP Card ===== */
function SparepartTransparencyCard({ parts = [] }) {
    const hasParts = Array.isArray(parts) && parts.length > 0;

    return (
        <div className="mb-8 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                        <h5 className="font-semibold text-slate-900 text-sm sm:text-base">
                            Transparansi Suku Cadang & Komponen
                        </h5>
                        <p className="text-xs text-slate-500">
                            Komitmen integritas teknis bengkel YVS Computer
                        </p>
                    </div>
                </div>
                {hasParts && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        {parts.length} Komponen Diganti
                    </span>
                )}
            </div>

            {/* Yangversa Old Part Return SOP Guarantee Banner */}
            <div className="mb-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-2xs">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs leading-relaxed">
                    <span className="font-bold block text-amber-900">
                        SOP Garansi Komponen Bekas (Komputerawet / Yangversa)
                    </span>
                    <span className="text-amber-800/90">
                        Seluruh sparepart rusak / modul lama yang diganti <strong>wajib disimpan rapi dalam kemasan dan diserahkan kembali kepada Anda</strong> saat pengambilan unit. Kami tidak pernah menahan komponen bekas milik pelanggan.
                    </span>
                </div>
            </div>

            {hasParts ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200/80">
                    {parts.map((p, idx) => {
                        const nama = p.sparepart?.nama || p.nama || "Suku Cadang";
                        const kategori = p.sparepart?.kategori || "Komponen Pengganti";
                        const jumlah = p.jumlah || 1;
                        const serialNumber = p.serial_number;

                        return (
                            <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/70 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 shadow-2xs">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h6 className="font-bold text-slate-900 text-sm">{nama}</h6>
                                            <span className="px-2 py-0.5 rounded-md text-3xs font-semibold bg-slate-200 text-slate-700">
                                                {kategori}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                                            <span>Jumlah: <strong className="text-slate-800">{jumlah} unit</strong></span>
                                            {serialNumber && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="font-mono text-3xs px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                                                        S/N: {serialNumber}
                                                    </span>
                                                </>
                                            )}
                                            <span className="text-slate-300">•</span>
                                            <span className="text-emerald-700 font-medium">Part lama dikembalikan</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-blue-700 font-medium px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200 w-fit">
                                    Bergaransi Toko
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                    <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 shadow-2xs shrink-0">
                        <Wrench className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed">
                        <p className="font-bold text-slate-800 mb-0.5">
                            Reparasi Tingkat Komponen / Tanpa Penggantian Sparepart Baru
                        </p>
                        <p className="text-slate-500">
                            Pengerjaan unit ini diselesaikan melalui tindakan teknis (perbaikan jalur sirkuit, micro-soldering IC, reballing, ultrasonic cleaning, atau penggantian thermal paste performa tinggi) tanpa perlu mengganti modul baru, menjaga efisiensi biaya Anda.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function TrackingDetail({ t: initialTicket, onBack, onUpdateTicket }) {
    const [t, setT] = useState(initialTicket);
    const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
    const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
    const [externalPhoto, setExternalPhoto] = useState(null);

    // Interactive Customer Approval Modal State
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [approvalAction, setApprovalAction] = useState("approve"); // "approve" | "reject"
    const [phoneLast4, setPhoneLast4] = useState("");
    const [alasanBatal, setAlasanBatal] = useState("Biaya melebihi estimasi / budget");
    const [catatanBatal, setCatatanBatal] = useState("");
    const [submittingApproval, setSubmittingApproval] = useState(false);

    // Customer Sign-to-Unlock Modal State
    const [isSignInvoiceModalOpen, setIsSignInvoiceModalOpen] = useState(false);
    const [submittingSignInvoice, setSubmittingSignInvoice] = useState(false);

    // Official Invoice Modal State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    // Live Status Refreshing State
    const [refreshing, setRefreshing] = useState(false);

    // Highlight & auto-focus state for warranty card specimen
    const [isWarrantyFocused, setIsWarrantyFocused] = useState(false);

    // Auto-focus helper: smoothly scrolls into view and draws attention to the warranty card
    const scrollToWarranty = (openModal = false) => {
        const el = document.getElementById("warranty-section") || document.getElementById("warranty-card");
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setIsWarrantyFocused(true);
            setTimeout(() => setIsWarrantyFocused(false), 2400);
        }
        if (openModal) {
            setTimeout(() => setIsWarrantyModalOpen(true), 400);
        }
    };

    // Deep-linking / URL Parameter Auto-Scroll Support
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        // Auto-open Invoice Modal if requested via URL
        const wantsInvoice = 
            params.get("focus") === "invoice" || 
            params.get("action") === "invoice" || 
            params.get("tab") === "invoice" ||
            hash === "#invoice";

        if (wantsInvoice && t.invoice) {
            setIsInvoiceModalOpen(true);
            return;
        }

        if (!['selesai', 'diambil'].includes(t.status)) return;

        const wantsWarranty = 
            params.get("focus") === "garansi" || 
            params.get("action") === "garansi" || 
            params.get("tab") === "garansi" ||
            hash === "#garansi" || 
            hash === "#warranty-section";

        if (wantsWarranty) {
            const timer = setTimeout(() => {
                scrollToWarranty(params.get("open") === "true");
            }, 350);
            return () => clearTimeout(timer);
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
                if (onUpdateTicket) onUpdateTicket(data);
                toast.success("Status servis berhasil diperbarui!");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyegarkan status terbaru");
        } finally {
            setRefreshing(false);
        }
    };

    const handleShareTracking = async () => {
        const trackingUrl = `${window.location.origin}/tracking?nomor_tiket=${encodeURIComponent(t.nomor_tiket)}`;
        const shareData = {
            title: `Status Servis YVS - ${t.nomor_tiket}`,
            text: `Pantau status perbaikan unit ${t.perangkat} (${t.nomor_tiket}) di YVS Computer:`,
            url: trackingUrl
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                if (err.name !== "AbortError") {
                    // Ignore user cancellation
                }
            }
        }

        try {
            await navigator.clipboard.writeText(trackingUrl);
            toast.success("Tautan pelacakan berhasil disalin ke clipboard!");
        } catch (_) {
            toast.error("Gagal menyalin tautan");
        }
    };

    const handleCustomerSignInvoice = async ({ signature, signerName, phoneLast4: inputPhone4 }) => {
        setSubmittingSignInvoice(true);
        try {
            const res = await api.post("/tracking/sign-invoice", {
                nomorTiket: t.nomor_tiket,
                phone_last4: inputPhone4,
                signature,
                signer_nama: signerName
            });

            toast.success(res.data.message || "Tanda tangan berhasil dikonfirmasi!");
            const updatedTicket = {
                ...t,
                invoice: {
                    ...(t.invoice || {}),
                    ...(res.data.invoice || {}),
                    ttd_customer: signature,
                    ttd_customer_at: res.data.invoice?.ttd_customer_at || new Date().toISOString(),
                    ttd_customer_nama: signerName
                }
            };
            setT(updatedTicket);
            if (onUpdateTicket) onUpdateTicket(updatedTicket);
            setIsSignInvoiceModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses tanda tangan");
        } finally {
            setSubmittingSignInvoice(false);
        }
    };

    const handleOpenApprovalModal = (action) => {
        setApprovalAction(action);
        setPhoneLast4("");
        setCatatanBatal("");
        setIsApprovalModalOpen(true);
    };

    const handleSubmitApproval = async (e) => {
        e.preventDefault();
        if (!phoneLast4 || phoneLast4.trim().length < 4) {
            toast.error("Harap masukkan 4 digit terakhir nomor telepon yang terdaftar!");
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
            const updatedTicket = {
                ...t,
                status: res.data.status,
                disetujui_at: res.data.tiket?.disetujui_at || t.disetujui_at,
                target_selesai_at: res.data.tiket?.target_selesai_at || t.target_selesai_at,
                alasan_batal: res.data.tiket?.alasan_batal || t.alasan_batal,
                catatan_batal: res.data.tiket?.catatan_batal || t.catatan_batal,
            };
            setT(updatedTicket);
            if (onUpdateTicket) onUpdateTicket(updatedTicket);
            setIsApprovalModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses persetujuan");
        } finally {
            setSubmittingApproval(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden w-full flex flex-col mx-auto">
            <div className="p-5 sm:p-7 border-b border-slate-100 bg-slate-50/70">
                {/* 1. Top Identity & Status Bar */}
                <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-200/70">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="inline-flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
                                title="Kembali ke daftar tiket"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                                <span>Daftar</span>
                            </button>
                        )}
                        <span className="font-mono font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                            {t.nomor_tiket}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded-md text-3xs sm:text-xs font-semibold shrink-0">
                            <MonitorSmartphone className="w-3 h-3 text-slate-500" />
                            <span>{t.jenis_perangkat}</span>
                        </span>
                    </div>

                    {/* Status Pill Badge */}
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-3xs sm:text-xs font-extrabold border uppercase tracking-wider text-center shrink-0 shadow-2xs ${STATUS_LABELS[t.status]?.color}`}>
                        {STATUS_LABELS[t.status]?.label}
                    </span>
                </div>

                {/* 2. Device Details: Title, Metadata & Service Badges */}
                <div className="py-3.5 space-y-2">
                    <h3 className="text-slate-900 font-extrabold text-base sm:text-xl leading-snug break-words">
                        {t.perangkat}
                    </h3>

                    {/* Date & Technician Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 font-medium text-xs sm:text-sm">
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Masuk: {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </span>
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <span className="inline-flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Teknisi: <strong className="text-slate-700 font-semibold">{t.teknisi}</strong></span>
                        </span>
                    </div>

                    {/* SLA & Warranty Badges Row */}
                    {(t.sla_paket || ['selesai', 'diambil'].includes(t.status)) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {t.sla_paket && <SlaBadge tiket={t} />}
                            {['selesai', 'diambil'].includes(t.status) && (
                                <button
                                    type="button"
                                    onClick={() => scrollToWarranty(false)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/80 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer group"
                                    title="Klik untuk langsung melompat dan fokus ke Kartu Garansi"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                    <span>Garansi {t.durasi_garansi || "1 Bulan"}</span>
                                    <ChevronDown className="w-3 h-3 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Action Bar: Documents + Utility & Contact */}
                <div className="pt-3.5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    {/* Document Buttons (When selesai/diambil) */}
                    {['selesai', 'diambil'].includes(t.status) ? (
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                            {t.invoice && (
                                <button
                                    type="button"
                                    onClick={() => setIsInvoiceModalOpen(true)}
                                    className="h-8.5 px-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                    title="Buka atau cetak faktur invoice resmi"
                                >
                                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="truncate">Faktur Invoice</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsWarrantyModalOpen(true)}
                                className={`h-8.5 px-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer ${!t.invoice ? 'col-span-2' : ''}`}
                                title="Buka atau cetak sertifikat garansi resmi"
                            >
                                <Printer className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <span className="truncate">Sertifikat Garansi</span>
                            </button>
                        </div>
                    ) : <div className="hidden sm:block" />}

                    {/* Right Controls: Segarkan + Bagikan + Hubungi Admin */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-0.5 sm:pt-0">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleRefreshStatus}
                                disabled={refreshing}
                                className="inline-flex items-center gap-1.5 h-8.5 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                title="Segarkan status servis terbaru dari server"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
                                <span>{refreshing ? "Memperbarui..." : "Segarkan"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleShareTracking}
                                className="inline-flex items-center gap-1.5 h-8.5 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                                title="Bagikan tautan pelacakan langsung via WhatsApp atau salin link"
                            >
                                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Bagikan</span>
                            </button>
                        </div>

                        <a 
                            href={`https://wa.me/628121034212?text=Halo,%20saya%20ingin%20bertanya%20tentang%20status%20perbaikan%20perangkat%20saya%20dengan%20nomor%20tiket%20${t.nomor_tiket}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 h-8.5 px-3.5 sm:px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs shadow-emerald-600/20 cursor-pointer shrink-0"
                        >
                            <MessageCircle className="w-4 h-4 shrink-0" />
                            <span>Hubungi Admin</span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8 flex-1">
                <TrackingProgress currentStatus={t.status} onWarrantyClick={() => scrollToWarranty(false)} />

                {/* Feature 7: SLA Target & Real-time Progress Countdown */}
                {['diterima', 'didiagnosis', 'menunggu_persetujuan', 'disetujui', 'dalam_perbaikan'].includes(t.status) && (
                    <div className="mb-8">
                        <SlaCountdownCard tiket={t} />
                    </div>
                )}

                {/* QR Code and Warranty Section for Selesai / Diambil (Enhanced with Equal-Height Balanced Holographic Cards) */}
                {['selesai', 'diambil'].includes(t.status) && (
                    <div id="warranty-section" className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch scroll-mt-24">
                        {/* Fast-Pass Pick-up Voucher Card */}
                        <HolographicTiltCard foilType="silver" className="p-6 sm:p-7 flex flex-col justify-between h-full">
                            <div className="flex flex-col h-full justify-between">
                                {/* Top Header Badge */}
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        <QrCode className="w-3 h-3 text-blue-600" />
                                        <span>FAST-PASS PICKUP</span>
                                    </span>
                                    <span className="text-3xs font-medium text-slate-400">Verifikasi Loket</span>
                                </div>

                                {/* Content Body */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 flex-1 my-auto">
                                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/90 shrink-0 shadow-2xs flex items-center justify-center">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                                                typeof window !== "undefined"
                                                    ? `${window.location.origin}/tracking?nomor_tiket=${t.nomor_tiket}`
                                                    : t.nomor_tiket
                                            )}`} 
                                            alt={`QR ${t.nomor_tiket}`} 
                                            loading="lazy"
                                            decoding="async"
                                            className="w-20 h-20 sm:w-24 sm:h-24 mix-blend-multiply block" 
                                        />
                                    </div>
                                    <div className="text-center sm:text-left flex-1 min-w-0">
                                        <h5 className="font-bold text-lg sm:text-xl mb-1 text-slate-900">Tunjukkan QR Ini</h5>
                                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                                            Tunjukkan ke kasir atau teknisi saat mengambil unit untuk validasi kilat serah terima tanpa antre.
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom Status / Meta Bar */}
                                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="font-mono text-slate-600 font-semibold flex items-center gap-1.5">
                                        <span className="text-slate-400 font-normal">Tiket:</span>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">{t.nomor_tiket}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-slate-500 text-3xs font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Siap Dipindai
                                    </span>
                                </div>
                            </div>
                        </HolographicTiltCard>

                        {/* Feature 9: Dynamic Real-time Warranty Card Specimen */}
                        {t.status === "diambil" ? (
                            t.warranty_status?.isExpired ? (
                                <HolographicTiltCard 
                                    id="warranty-card" 
                                    foilType="slate" 
                                    className={`p-6 sm:p-7 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-500 ${isWarrantyFocused ? 'ring-4 ring-rose-400 shadow-2xl scale-[1.015]' : ''}`}
                                >
                                    <ShieldCheck className="absolute -right-8 -bottom-8 w-44 h-44 text-slate-100 pointer-events-none" />
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        {/* Top Header Badge */}
                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                                <span>MASA GARANSI BERAKHIR</span>
                                            </span>
                                            <span className="text-3xs font-medium text-slate-400">Proteksi Resmi YVS</span>
                                        </div>

                                        {/* Content Body */}
                                        <div className="flex-1 my-auto">
                                            <h5 className="font-bold text-lg sm:text-xl mb-1 text-slate-900 flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                                                <span>Garansi Telah Berakhir</span>
                                            </h5>
                                            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-1">
                                                Jaminan garansi {t.durasi_garansi || "1 Bulan"} telah berakhir sejak {t.warranty_status?.lewatHari || 0} hari yang lalu. Butuh pengecekan lanjutan? Hubungi teknisi kami.
                                            </p>
                                        </div>

                                        {/* Bottom Action Row */}
                                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                                                Berakhir: {t.warranty_status?.garansi_berakhir_at ? new Date(t.warranty_status.garansi_berakhir_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => setIsWarrantyModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200 shadow-2xs cursor-pointer"
                                            >
                                                <Award className="w-3.5 h-3.5 text-amber-500" /> <span>Lihat Sertifikat</span>
                                            </button>
                                        </div>
                                    </div>
                                </HolographicTiltCard>
                            ) : (
                                <HolographicTiltCard 
                                    id="warranty-card" 
                                    foilType="emerald" 
                                    className={`p-6 sm:p-7 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-500 ${isWarrantyFocused ? 'ring-4 ring-emerald-400 shadow-2xl scale-[1.015]' : ''}`}
                                >
                                    <ShieldCheck className="absolute -right-8 -bottom-8 w-44 h-44 text-emerald-500/10 pointer-events-none" />
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        {/* Top Header Badge */}
                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                <Clock className="w-3 h-3 text-emerald-600" />
                                                <span>GARANSI AKTIF • SISA {t.warranty_status?.sisaHari || 0} HARI</span>
                                            </span>
                                            <span className="text-3xs font-medium text-emerald-600/80">Proteksi Resmi YVS</span>
                                        </div>

                                        {/* Content Body */}
                                        <div className="flex-1 my-auto">
                                            <h5 className="font-bold text-lg sm:text-xl mb-1 text-slate-900 flex items-center gap-2">
                                                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                                <span>Garansi Resmi Aktif</span>
                                            </h5>
                                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-1">
                                                Perbaikan unit dilindungi garansi {t.durasi_garansi || "1 Bulan"} resmi YVS Computer untuk fungsi pengerjaan dan suku cadang yang diganti.
                                            </p>
                                        </div>

                                        {/* Bottom Action Row */}
                                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
                                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                                Hingga {t.warranty_status?.garansi_berakhir_at ? new Date(t.warranty_status.garansi_berakhir_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => setIsWarrantyModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer"
                                            >
                                                <Award className="w-3.5 h-3.5" /> <span>Cetak Sertifikat Garansi</span>
                                            </button>
                                        </div>
                                    </div>
                                </HolographicTiltCard>
                            )
                        ) : (
                            <HolographicTiltCard 
                                id="warranty-card" 
                                foilType="silver" 
                                className={`p-6 sm:p-7 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-500 ${isWarrantyFocused ? 'ring-4 ring-blue-400 shadow-2xl scale-[1.015]' : ''}`}
                            >
                                <ShieldCheck className="absolute -right-8 -bottom-8 w-44 h-44 text-blue-500/10 pointer-events-none" />
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    {/* Top Header Badge */}
                                    <div className="flex items-center justify-between gap-2 mb-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                                            <span>SERTIFIKAT DIGITAL TERVERIFIKASI</span>
                                        </span>
                                        <span className="text-3xs font-medium text-slate-400">Proteksi Resmi YVS</span>
                                    </div>

                                    {/* Content Body */}
                                    <div className="flex-1 my-auto">
                                        <h5 className="font-bold text-lg sm:text-xl mb-1 text-slate-900 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                                            <span>Garansi Siap Diaktifkan</span>
                                        </h5>
                                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-1">
                                            Perangkat ini mendapatkan jaminan garansi {t.durasi_garansi || "1 Bulan"} yang otomatis aktif terhitung sejak tanggal serah terima unit di toko.
                                        </p>
                                    </div>

                                    {/* Bottom Action Row */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Aktif saat serah terima
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => setIsWarrantyModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer"
                                        >
                                            <Award className="w-3.5 h-3.5" /> <span>Preview Sertifikat Garansi</span>
                                        </button>
                                    </div>
                                </div>
                            </HolographicTiltCard>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                    <div className="flex flex-col h-full">
                        <h5 className="text-slate-500 font-medium mb-2 text-sm sm:text-base">Keluhan Pelanggan</h5>
                        <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed flex-1 break-words whitespace-pre-line text-sm sm:text-base">{t.keluhan}</p>
                    </div>
                    <div className="flex flex-col h-full">
                        <h5 className="text-slate-500 font-medium mb-2 text-sm sm:text-base">Kelengkapan Perangkat</h5>
                        <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed flex-1 break-words whitespace-pre-line text-sm sm:text-base">{t.kelengkapan || "-"}</p>
                    </div>
                </div>

                {/* Feature 4: Structured Deposited Accessories Checklist */}
                <AccessoriesChecklist kelengkapanDetail={t.kelengkapan_detail} kelengkapanText={null} />

                {/* Feature 1: Photo & Video Media Gallery Modal & Lightbox */}
                <PhotoGallery 
                    fotoKondisi={t.foto_kondisi} 
                    fotoDiagnosis={t.foto_diagnosis} 
                    fotoSelesai={t.foto_selesai} 
                    logPerbaikan={t.log_perbaikan} 
                    externalPhoto={externalPhoto}
                    onCloseExternal={() => setExternalPhoto(null)}
                />

                {/* Feature 1: 2D Visual Defect Map for Customer */}
                {t?.defect_map && (() => {
                    const defectMapObj = typeof t.defect_map === "string" 
                        ? (function() { try { return JSON.parse(t.defect_map); } catch(_) { return null; } })() 
                        : t.defect_map;
                    const defectItems = Array.isArray(defectMapObj?.items) ? defectMapObj.items : [];
                    return (
                        <div className="mb-8 pt-6 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-blue-600 shadow-2xs shrink-0">
                                        <PenTool className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900 text-sm">Peta Cacat Fisik Unit (2D Blueprint)</h5>
                                        <p className="text-xs text-slate-500">
                                            {defectItems.length > 0
                                                ? `Transparansi bengkel: ${defectItems.length} goresan/cacat fisik awal terpetakan saat unit diterima.`
                                                : "Unit tercatat dalam kondisi fisik mulus tanpa cacat fisik eksterior."}
                                        </p>
                                    </div>
                                </div>
                                <DefectMapBadge 
                                    value={defectMapObj} 
                                    onClick={() => setIsDefectModalOpen(true)} 
                                />
                            </div>
                        </div>
                    );
                })()}

                {/* Checklist Intake (Before / Diagnose) */}
                {t?.checklist_intake && (() => {
                    const intakeObj = typeof t.checklist_intake === "string"
                        ? (function() { try { return JSON.parse(t.checklist_intake); } catch(_) { return {}; } })()
                        : (t.checklist_intake || {});
                    const devCat = getDeviceCategory(t?.jenis_perangkat || t?.perangkat?.jenis_perangkat);
                    const intakeItems = getHardwareChecklistForCategory(devCat);
                    return (
                        <div className="mb-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2.5 mb-4">
                                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-slate-900 text-sm sm:text-base">Kondisi Awal Perangkat (Sebelum Perbaikan)</h5>
                                <span className="text-4xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    {devCat}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                                {(intakeItems || []).map(item => {
                                    const val = getChecklistValue(intakeObj, item.key, item.legacyKey);
                                    const ItemIcon = item.Icon || item.icon || ClipboardCheck;
                                    return (
                                        <div key={item.key} className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                                            val ? "bg-emerald-50/60 border-emerald-200 text-emerald-800" : "bg-rose-50/60 border-rose-200 text-rose-800"
                                        }`}>
                                            <ItemIcon className={`w-4 h-4 shrink-0 mt-0.5 ${val ? "text-emerald-600" : "text-rose-500"}`} />
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className={`font-bold text-3xs mb-0.5 uppercase tracking-wide ${val ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {val ? "Normal / OK" : "Bermasalah"}
                                                </span>
                                                <span className={`truncate sm:whitespace-normal sm:break-words font-medium ${val ? "text-slate-800" : "text-rose-700 font-semibold"}`}>{item.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {t.diagnosis && (
                    <div className="mb-8 pt-6 border-t border-slate-100">
                        <h5 className="font-semibold text-slate-900 mb-4 text-sm sm:text-base">Hasil Diagnosis</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="flex flex-col h-full">
                                <h6 className="text-slate-500 font-medium mb-2 text-sm sm:text-base">Masalah</h6>
                                <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed flex-1 break-words whitespace-pre-line text-sm sm:text-base">{t.diagnosis.masalah}</p>
                            </div>
                            <div className="flex flex-col h-full">
                                <h6 className="text-slate-500 font-medium mb-2 text-sm sm:text-base">Solusi</h6>
                                <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed flex-1 break-words whitespace-pre-line text-sm sm:text-base">{t.diagnosis.solusi}</p>
                            </div>
                            <div className="md:col-span-2 bg-blue-50/50 p-4 sm:p-5 rounded-xl border border-blue-100/50 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <span className="text-blue-600 font-medium text-sm sm:text-base">Estimasi Biaya Awal</span>
                                <span className="text-blue-700 font-semibold text-lg">{formatRupiah(t.diagnosis.estimasi_biaya)}</span>
                            </div>

                            {/* Feature 4: Interactive Customer Approval Banner */}
                            {t.status === "menunggu_persetujuan" && (
                                <div className="md:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 shadow-md mt-4 animate-fade-in">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3.5">
                                            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md shrink-0 mt-0.5">
                                                <Clock className="w-6 h-6 animate-pulse" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200/90 text-amber-900 border border-amber-300">
                                                        Tahap Konfirmasi Pelanggan
                                                    </span>
                                                </div>
                                                <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                                                    Persetujuan Estimasi Biaya & Tindakan Perbaikan
                                                </h4>
                                                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                                                    Pemeriksaan awal selesai! Teknisi kami siap melakukan perbaikan dengan estimasi biaya di atas. Silakan pilih persetujuan Anda:
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-5 pt-4 border-t border-amber-200/70">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenApprovalModal("reject")}
                                            className="px-5 py-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Tolak & Batalkan Servis</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenApprovalModal("approve")}
                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Setujui Estimasi Biaya & Kerjakan Sekarang</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Cancellation Reason Banner */}
                            {t.status === "dibatalkan" && (
                                <div className="md:col-span-2 bg-rose-50 border border-rose-200 rounded-2xl p-5 mt-4 text-xs sm:text-sm text-rose-900 shadow-xs">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-rose-950 text-sm">Servis Ini Telah Dibatalkan</h5>
                                            {t.alasan_batal && (
                                                <p className="mt-1 text-rose-800">
                                                    <span className="font-semibold text-rose-900">Alasan:</span> {t.alasan_batal}
                                                </p>
                                            )}
                                            {t.catatan_batal && (
                                                <p className="mt-0.5 text-rose-700">{t.catatan_batal}</p>
                                            )}
                                            <p className="mt-2 text-rose-800 text-xs">
                                                Unit Anda telah dirapikan kembali dan siap diambil di meja penyerahan toko kami.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {t.invoice && (
                                <div className="md:col-span-2">
                                    {t.invoice.ttd_customer ? (
                                        /* Unlocked State: Already Signed */
                                        <div className="bg-emerald-50 p-5 sm:p-6 rounded-2xl border border-emerald-200 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-700 font-bold text-sm sm:text-base">Total Biaya Akhir (Real)</span>
                                                    <span className="inline-flex items-center gap-1 text-2xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                        Terverifikasi Digital
                                                    </span>
                                                </div>
                                                <span className="text-emerald-800 font-black text-2xl">{formatRupiah(t.invoice.total_biaya)}</span>
                                                <div className="flex items-center gap-2 text-xs text-emerald-700 mt-0.5">
                                                    <div className="w-7 h-7 bg-white rounded-md border border-emerald-200 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                                                        <img src={t.invoice.ttd_customer} alt="TTD" className="max-h-full max-w-full object-contain" />
                                                    </div>
                                                    <span>
                                                        Telah ditandatangani oleh <strong>{t.invoice.ttd_customer_nama || t.customer_nama || "Pelanggan"}</strong>
                                                        {t.invoice.ttd_customer_at && (
                                                            <> pada {new Date(t.invoice.ttd_customer_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsInvoiceModalOpen(true)}
                                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl font-bold text-sm transition-all shadow-xs shrink-0 w-full sm:w-auto cursor-pointer"
                                                >
                                                    <FileText className="w-4 h-4 text-emerald-600" /> Faktur Invoice
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsWarrantyModalOpen(true)}
                                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm transition-all shadow-sm shrink-0 w-full sm:w-auto cursor-pointer"
                                                >
                                                    <Award className="w-4 h-4" /> Sertifikat Garansi
                                                </button>
                                            </div>
                                        </div>
                                    ) : ['selesai', 'diambil'].includes(t.status) ? (
                                        /* Locked State: Service finished, requires Customer Signature to unlock Invoice & Warranty */
                                        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/70 p-5 sm:p-6 rounded-2xl border-2 border-indigo-200/90 mt-2 shadow-sm relative overflow-hidden">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                                                <div className="space-y-2">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                                                        <PenTool className="w-3.5 h-3.5" />
                                                        Sign-to-Unlock: Serah Terima Unit
                                                    </div>
                                                    <div>
                                                        <h5 className="font-extrabold text-slate-900 text-base sm:text-lg">
                                                            Tanda Tangani Nota untuk Membuka Dokumen & Garansi
                                                        </h5>
                                                        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                                                            Unit perbaikan Anda telah selesai! Silakan bubuhkan tanda tangan penerimaan secara digital langsung dari HP Anda untuk membuka <strong>Invoice Resmi</strong> dan mengaktifkan <strong>Sertifikat Garansi Digital</strong>.
                                                        </p>
                                                    </div>
                                                    <div className="pt-1 flex items-baseline gap-2">
                                                        <span className="text-xs font-semibold text-slate-500">Total Biaya:</span>
                                                        <span className="text-slate-900 font-black text-xl">{formatRupiah(t.invoice.total_biaya)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsSignInvoiceModalOpen(true)}
                                                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer w-full sm:w-auto"
                                                    >
                                                        <PenTool className="w-4 h-4" />
                                                        Tanda Tangani & Buka Dokumen
                                                    </button>
                                                    <div className="flex items-center justify-center gap-1.5 text-2xs text-slate-500 font-medium">
                                                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                                        Aman • Verifikasi 4 Digit No HP
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Pending State: Service still in progress */
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Perkiraan Biaya Akhir</span>
                                                <span className="text-slate-900 font-black text-2xl">{formatRupiah(t.invoice.total_biaya)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 italic max-w-xs sm:text-right">
                                                Dokumen invoice dan garansi resmi akan dapat diakses dan ditandatangani saat perbaikan telah dinyatakan selesai.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Feature: Yangversa Sparepart Transparency & Old Part Return SOP Card */}
                <SparepartTransparencyCard parts={t?.penggunaan_sparepart} />

                <div className="pt-6 border-t border-slate-100">
                    <h5 className="font-semibold text-slate-900 mb-4">Riwayat Perbaikan</h5>
                    {t?.log_perbaikan && t.log_perbaikan.length > 0 ? (
                        <TrackingRepairLogNodes 
                            logs={t.log_perbaikan}
                            onPhotoClick={(item) => setExternalPhoto(item)}
                        />
                    ) : (
                        <p className="text-sm text-slate-500 italic">Belum ada riwayat perbaikan.</p>
                    )}
                </div>

                {/* Feature 3: Post-Service Care Tips */}
                {['selesai', 'diambil'].includes(t?.status) && (
                    <CareTipsCard tips={t?.tips_perawatan} />
                )}

                {/* Checklist QC (After / Selesai) */}
                {t?.checklist_qc && ["selesai", "diambil"].includes(t?.status) && (() => {
                    const qcObj = typeof t.checklist_qc === "string"
                        ? (function() { try { return JSON.parse(t.checklist_qc); } catch(_) { return {}; } })()
                        : (t.checklist_qc || {});
                    const devCat = getDeviceCategory(t?.jenis_perangkat || t?.perangkat?.jenis_perangkat);
                    const qcItems = getQcChecklistForCategory(devCat);
                    return (
                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                                        <h5 className="font-semibold text-slate-900 text-sm sm:text-base">Sertifikasi Kendali Mutu (Quality Control WOW Service)</h5>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {qcObj.passed_qc
                                            ? `Perangkat telah lulus uji kelayakan ${qcItems.length} poin kendali mutu fungsional & pembersihan menyeluruh standar workshop (${devCat.toUpperCase()}).`
                                            : "Pemeriksaan fungsi perangkat sedang berlangsung pada tahap akhir perbaikan."}
                                    </p>
                                </div>
                                {qcObj.passed_qc && (
                                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider w-fit border border-emerald-300">
                                        <Award className="w-4 h-4 text-emerald-600" /> Lulus QC Resmi
                                    </span>
                                )}
                            </div>

                            {qcObj.passed_qc && (
                                <div className="mb-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                        <span className="font-bold">Unit Lolos Standar WOW Service.</span>
                                        <span className="opacity-90 block">
                                            Perangkat telah dibersihkan menyeluruh dan seluruh komponen utama diuji kelayakannya sebelum diserahkan.
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                                {(qcItems || []).map(item => {
                                    const val = getChecklistValue(qcObj, item.key, item.legacyKey);
                                    const ItemIcon = item.Icon || item.icon || Award;
                                    return (
                                        <div key={item.key} className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                                            val ? "bg-emerald-50/60 border-emerald-200 text-emerald-950" : "bg-slate-50 border-slate-200 text-slate-400"
                                        }`}>
                                            <ItemIcon className={`w-4 h-4 shrink-0 mt-0.5 ${val ? "text-emerald-600" : "text-slate-300"}`} />
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className={`font-bold text-3xs mb-0.5 uppercase tracking-wide flex items-center gap-1 ${val ? "text-emerald-700" : "text-slate-400"}`}>
                                                    {val ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3 text-emerald-600 inline shrink-0" />
                                                            <span>Normal</span>
                                                        </>
                                                    ) : "Belum diuji"}
                                                </span>
                                                <span className={`font-semibold text-slate-800 truncate sm:whitespace-normal`}>{item.label}</span>
                                                <p className="text-3xs text-slate-500 font-normal leading-tight mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Feature 6: Rating Teknisi & Rating Toko Google Maps */}
                {["selesai", "diambil"].includes(t.status) && (
                    <RatingSection ticket={t} />
                )}
            </div>

            {/* Official Workshop Invoice Modal (Consistent with Admin) */}
            <InvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                tiket={t}
                invoice={t.invoice}
            />

            {/* Digital Warranty Certificate Modal */}
            <WarrantyCertificateModal
                isOpen={isWarrantyModalOpen}
                onClose={() => setIsWarrantyModalOpen(false)}
                tiket={t}
                isCustomerView={true}
            />

            {/* Feature Sign-to-Unlock: Digital Signature Pad Modal */}
            <DigitalSignaturePadModal
                isOpen={isSignInvoiceModalOpen}
                onClose={() => setIsSignInvoiceModalOpen(false)}
                onSave={handleCustomerSignInvoice}
                defaultName={t.customer_nama || ""}
                title="Tanda Tangan Penerimaan Unit"
                description={`Bubuhkan tanda tangan Anda di layar untuk mengonfirmasi penerimaan unit ${t.perangkat}. Invoice resmi dan sertifikat garansi akan terbuka secara instan.`}
                agreementText="Dengan menandatangani ini, saya menyatakan telah menerima kembali unit perangkat dalam kondisi baik dan menyetujui rincian perbaikan serta masa garansi yang berlaku."
                requirePhoneVerify={true}
                expectedPhoneLast4={(t.customer_telepon || "").replace(/\D/g, "")}
                loading={submittingSignInvoice}
            />

            {/* Feature 1: Defect Mapper Read-Only Modal for Customer */}
            <DefectMapperModal
                isOpen={isDefectModalOpen}
                onClose={() => setIsDefectModalOpen(false)}
                value={t.defect_map}
                readOnly={true}
                title={`Peta Cacat Fisik: ${t.perangkat}`}
            />

            {/* Feature 4: Interactive Approval / Rejection Verification Modal */}
            {isApprovalModalOpen && (
                <div className="modal-shell bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="modal-panel max-w-lg border-slate-200 my-auto">
                        <div className="modal-grabber" />
                        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${approvalAction === "approve" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                    {approvalAction === "approve" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                </div>
                                <h3 className="font-bold text-slate-900 text-base">
                                    {approvalAction === "approve" ? "Konfirmasi Persetujuan Perbaikan" : "Konfirmasi Pembatalan Servis"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsApprovalModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitApproval} className="p-6 space-y-4 text-xs sm:text-sm">
                            {approvalAction === "approve" ? (
                                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                                    <p className="font-semibold">Anda menyetujui estimasi biaya sebesar:</p>
                                    <p className="text-xl font-black text-emerald-800 mt-1">{formatRupiah(t.diagnosis?.estimasi_biaya || 0)}</p>
                                    <p className="text-xs text-emerald-700 mt-1.5 leading-relaxed">
                                        Setelah dikonfirmasi, teknisi akan segera mengeksekusi perbaikan fisik unit dan SLA pengerjaan akan mulai berjalan.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                                        <p className="font-semibold">Anda memilih membatalkan perbaikan unit ini.</p>
                                        <p className="mt-0.5 text-rose-700">Unit Anda akan dirapikan kembali ke kondisi semula tanpa biaya perbaikan fisik.</p>
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Alasan Pembatalan:</label>
                                        <select
                                            value={alasanBatal}
                                            onChange={(e) => setAlasanBatal(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        >
                                            <option value="Biaya melebihi estimasi / budget">Biaya melebihi estimasi / budget</option>
                                            <option value="Ingin ganti perangkat baru">Ingin ganti perangkat baru</option>
                                            <option value="Perangkat buru-buru ingin dipakai">Perangkat buru-buru ingin dipakai</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional):</label>
                                        <textarea
                                            value={catatanBatal}
                                            onChange={(e) => setCatatanBatal(e.target.value)}
                                            placeholder="Tuliskan catatan Anda jika ada..."
                                            rows={2}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Verifikasi 4 digit terakhir nomor telepon */}
                            <div className="pt-3 border-t border-slate-100">
                                <label className="block font-bold text-slate-800 mb-1">
                                    Verifikasi Nomor WhatsApp Pelanggan:
                                </label>
                                <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                                    Demi keamanan pemilik perangkat, masukkan <strong>4 digit terakhir</strong> nomor telepon yang terdaftar pada tiket ini (contoh: jika nomor Anda 08123456<span className="text-blue-600 font-bold font-mono">7890</span>, masukkan <span className="font-mono font-bold text-blue-600">7890</span>):
                                </p>
                                <input
                                    type="text"
                                    required
                                    maxLength={4}
                                    value={phoneLast4}
                                    onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ""))}
                                    placeholder="4 Digit Terakhir"
                                    className="w-full text-center tracking-widest text-lg font-mono font-bold px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsApprovalModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingApproval || phoneLast4.length < 4}
                                    className={`px-5 py-2 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                        approvalAction === "approve"
                                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                            : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                    }`}
                                >
                                    {submittingApproval ? "Memproses..." : approvalAction === "approve" ? "Konfirmasi Setuju" : "Konfirmasi Tolak"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function RatingSection({ ticket }) {
    const [userRating, setUserRating] = useState(ticket.rating_teknisi || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(Boolean(ticket.rating_teknisi));

    async function handleRate(stars) {
        setSubmitting(true);
        try {
            const res = await api.post("/tracking/rate", {
                nomorTiket: ticket.nomor_tiket,
                rating: stars
            });
            setUserRating(stars);
            setSubmitted(true);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mt-8 pt-6 border-t border-slate-100 bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        <span>Penilaian Layanan Teknisi</span>
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {submitted 
                            ? "Terima kasih telah memberikan masukan rating untuk teknisi kami!" 
                            : `Berikan rating bintang untuk kinerja teknisi (${ticket.teknisi})`}
                    </p>
                </div>

                {/* Star Rating Input */}
                <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating || userRating) >= star;
                        return (
                            <button
                                key={star}
                                type="button"
                                disabled={submitting}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => handleRate(star)}
                                className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer disabled:cursor-wait"
                            >
                                <Star className={`w-7 h-7 ${active ? "text-amber-400 fill-amber-400 drop-shadow-sm" : "text-slate-300"}`} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Google Maps Store Review Button */}
            <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm mt-4">
                <span className="text-slate-600 font-medium text-center sm:text-left">Puas dengan hasil servis perangkat Anda?</span>
                <a
                    href={ticket.googleMapsUrl || "https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
                >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Ulas Toko di Google Maps</span>
                    <div className="flex gap-0.5 ml-1 shrink-0">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-amber-300 fill-amber-300" />)}
                    </div>
                </a>
            </div>
        </div>
    );
}

export default function Tracking() {
    const [searchParams] = useSearchParams();
    const queryTiket = searchParams.get("nomor_tiket") || searchParams.get("tiket") || "";
    const queryPhone = searchParams.get("nomor_telepon") || searchParams.get("phone") || searchParams.get("telepon") || "";
    const [trackMethod, setTrackMethod] = useState(queryPhone && !queryTiket ? "telepon" : "tiket");
    const [nomorTelepon, setNomorTelepon] = useState(queryPhone);
    const [nomorTiket, setNomorTiket] = useState(queryTiket);
    const [results, setResults] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => getRecentSearches());

    useEffect(() => {
        if (queryTiket) {
            setTrackMethod("tiket");
            setNomorTiket(queryTiket);
            executeTrack({ nomorTiket: queryTiket });
        } else if (queryPhone) {
            setTrackMethod("telepon");
            setNomorTelepon(queryPhone);
            executeTrack({ nomorTelepon: queryPhone });
        }
    }, [queryTiket, queryPhone]);

    async function executeTrack(payload) {
        setError("");
        setResults(null);
        setSelectedTicket(null);
        setLoading(true);

        try {
            const res = await api.post("/tracking", payload);
            const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
            setResults(data);
            if (data.length === 1) {
                setSelectedTicket(data[0]);
            }
            if (payload.nomorTiket) {
                saveRecentSearch("tiket", payload.nomorTiket);
                setRecentSearches(getRecentSearches());
            } else if (payload.nomorTelepon) {
                saveRecentSearch("telepon", payload.nomorTelepon);
                setRecentSearches(getRecentSearches());
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            setError(err.response?.data?.message || "Gagal melacak servis");
        } finally {
            setLoading(false);
        }
    }

    const handleScanReceipt = (scannedText) => {
        setIsCameraScannerOpen(false);
        const ticketId = extractTicketFromScan(scannedText);
        if (ticketId) {
            setTrackMethod("tiket");
            setNomorTiket(ticketId);
            toast.success(`Nota terdeteksi: ${ticketId}`);
            executeTrack({ nomorTiket: ticketId });
        } else {
            toast.error("Kode QR / Barcode nota tidak dikenali");
        }
    };

    async function handleTrack(e) {
        e.preventDefault();
        const payload = {
            nomorTelepon: trackMethod === "telepon" ? nomorTelepon : undefined,
            nomorTiket: trackMethod === "tiket" ? nomorTiket : undefined,
        };
        await executeTrack(payload);
    }

    const scrollToLookup = () => {
        const el = document.getElementById("track-lookup");
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleBackToLanding = () => {
        setSelectedTicket(null);
        setResults(null);
        setError("");
        if (window.history.pushState) {
            window.history.pushState({}, "", window.location.pathname);
        }
    };

    // --- VIEW 1: ACTIVE TICKET DETAIL OR MULTI-RESULT LIST ---
    const isViewingTracking = selectedTicket || (results && results.length > 0);

    if (isViewingTracking) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans">
                {/* Official YVS Tracking Header */}
                <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 text-slate-900 shadow-xs">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleBackToLanding}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-sans font-medium transition-all shadow-xs cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-400" />
                                <span>Kembali ke Beranda</span>
                            </button>
                            <span className="hidden sm:inline-block w-px h-5 bg-slate-200" />
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="font-display font-bold text-sm tracking-tight text-slate-900">
                                    YVS Computer
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-xs font-sans text-slate-500">
                                    Portal Pelacakan Servis
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedTicket(null);
                                    if (!results || results.length <= 1) {
                                        setResults(null);
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-sans font-medium transition-all shadow-xs cursor-pointer"
                            >
                                <Search className="w-3.5 h-3.5 text-slate-400" />
                                <span>Lacak Tiket Lain</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-12">
                    {/* Multi-result list (when searched by phone number) */}
                    {results && results.length > 0 && !selectedTicket && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 w-full">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        <span>Ditemukan {results.length} Tiket Servis</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Pilih salah satu tiket di bawah ini untuk melihat status dan riwayat pengerjaan lengkap.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 w-full">
                                {results.map((t, i) => (
                                    <TrackingListItem key={i} t={t} onClick={() => setSelectedTicket(t)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Single Ticket Detail */}
                    {selectedTicket && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 w-full">
                            <ErrorBoundary>
                                <TrackingDetail
                                    t={selectedTicket}
                                    onBack={results && results.length > 1 ? () => setSelectedTicket(null) : undefined}
                                    onUpdateTicket={(updated) => {
                                        setSelectedTicket(updated);
                                        setResults((prev) =>
                                            prev
                                                ? prev.map((item) =>
                                                      item.id === updated.id ? { ...item, ...updated } : item
                                                  )
                                                : [updated]
                                        );
                                    }}
                                />
                            </ErrorBoundary>
                        </div>
                    )}
                </main>

                {/* Camera QR & Barcode Scanner Modal */}
                <CameraScannerModal
                    isOpen={isCameraScannerOpen}
                    onClose={() => setIsCameraScannerOpen(false)}
                    onScan={handleScanReceipt}
                    title="Pindai QR / Barcode Nota Servis"
                    subtitle="Arahkan kamera ponsel Anda ke kode QR pada lembar nota fisik YVS Computer"
                />
            </div>
        );
    }

    // --- VIEW 2: EDITORIAL YVS COMPUTER BRAND PORTAL & LANDING EXPERIENCE ---
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
            {/* 1. Industrial Top Navigation */}
            <LandingNavbar onSearchClick={scrollToLookup} />

            {/* 2. Scroll-Driven Laptop Disassembly Storytelling Experience */}
            <ServiceProcess3D onTrackClick={scrollToLookup} />

            {/* 2.1 Minimal Typographic Running Brand Ticker */}
            <BrandTicker />

            {/* 3. Live Dedicated Tracking Hub Section (Immediate Natural Continuation) */}
            <section className="relative w-full bg-slate-50 py-16 sm:py-24 border-b border-slate-200 scroll-mt-14 sm:scroll-mt-16 content-deferred overflow-hidden" id="track-lookup">
                {/* Architectural Studio Ambient Light (Clean subtle luminescence, zero neon) */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[340px] bg-blue-500/[0.035] blur-[140px] rounded-full pointer-events-none -z-10" />
                <div className="absolute bottom-10 right-10 w-[500px] h-[260px] bg-slate-400/[0.04] blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
                        {/* Left Column: Heading, description, and trust guarantees */}
                        <div className="lg:col-span-5 space-y-5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                <span className="text-xs font-mono font-semibold text-blue-700 uppercase tracking-wider">
                                    Pelacakan Servis Real-Time
                                </span>
                            </div>
                            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                                Pantau Perkembangan Servis Unit Anda
                            </h2>
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans text-justify [text-justify:inter-word]">
                                Masukkan nomor tiket servis fisik atau nomor WhatsApp yang Anda daftarkan saat serah terima di toko. Seluruh foto kondisi awal, temuan mikroskop teknisi, transparansi sparepart, dan sertifikat garansi dapat Anda pantau secara langsung.
                            </p>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80 mt-0.5">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    </div>
                                    <span><strong>Bebas Biaya Diagnosis:</strong> Tidak dipungut biaya apa pun jika estimasi biaya tidak Anda setujui.</span>
                                </div>
                                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/80 mt-0.5">
                                        <Package className="w-3.5 h-3.5" />
                                    </div>
                                    <span><strong>Transparansi Suku Cadang:</strong> Komponen rusak lama wajib diserahkan kembali saat unit diambil.</span>
                                </div>
                                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                                    <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80 mt-0.5">
                                        <Award className="w-3.5 h-3.5" />
                                    </div>
                                    <span><strong>Sertifikat Garansi Resmi:</strong> Terbit otomatis digital tanpa risiko bukti nota fisik hilang.</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Tracking Search Box & Scanner with Interactive Spotlight Border */}
                        <div className="lg:col-span-7">
                            <SpotlightCard className="p-6 sm:p-8 relative">
                        {/* Tab Switcher & QR Scan Button */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-6">
                            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl flex-1">
                                <button
                                    type="button"
                                    onClick={() => setTrackMethod("tiket")}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-sans font-medium transition-all cursor-pointer ${
                                        trackMethod === "tiket"
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <TicketIcon className="w-4 h-4" />
                                    <span>Nomor Tiket</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTrackMethod("telepon")}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-sans font-medium transition-all cursor-pointer ${
                                        trackMethod === "telepon"
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>Nomor Telepon</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCameraScannerOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
                                title="Buka kamera untuk memindai QR code pada lembar nota fisik"
                            >
                                <Camera className="w-4 h-4 text-blue-600" />
                                <span>Pindai QR Nota</span>
                            </button>
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleTrack} className="space-y-4">
                            {trackMethod === "tiket" ? (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-sans font-semibold text-slate-500 uppercase tracking-wide">
                                            Nomor Tiket Servis YVS
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsCameraScannerOpen(true)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer sm:hidden"
                                        >
                                            <QrCode className="w-3.5 h-3.5" /> Pindai Kamera
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={nomorTiket}
                                            onChange={(e) => setNomorTiket(e.target.value)}
                                            placeholder="Contoh: SRV-2024-001"
                                            className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsCameraScannerOpen(true)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                            title="Pindai QR Nota Fisik"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-sans font-semibold text-slate-500 uppercase tracking-wide">
                                        Nomor WhatsApp Terdaftar
                                    </label>
                                    <input
                                        type="text"
                                        value={nomorTelepon}
                                        onChange={(e) => setNomorTelepon(e.target.value)}
                                        placeholder="Contoh: 081234567890"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>
                            )}

                            {/* Recent Searches Memory Chips */}
                            {recentSearches.length > 0 && (
                                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 text-slate-400 text-3xs font-semibold uppercase tracking-wider">
                                        <Clock className="w-3 h-3 text-slate-400" /> Riwayat:
                                    </span>
                                    {recentSearches.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setTrackMethod(item.type);
                                                if (item.type === "tiket") {
                                                    setNomorTiket(item.value);
                                                    executeTrack({ nomorTiket: item.value });
                                                } else {
                                                    setNomorTelepon(item.value);
                                                    executeTrack({ nomorTelepon: item.value });
                                                }
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 font-mono text-3xs font-medium text-slate-700 transition-colors cursor-pointer"
                                            title={`Lacak kembali ${item.value}`}
                                        >
                                            {item.value}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearRecentSearches();
                                            setRecentSearches([]);
                                        }}
                                        className="text-3xs text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                                        title="Hapus riwayat pencarian"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (trackMethod === "tiket" ? !nomorTiket : !nomorTelepon)}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-medium text-sm rounded-xl transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-blue-200 border-t-white rounded-full animate-spin" />
                                        <span>Memeriksa Database Servis...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4" />
                                        <span>Lacak Status Servis Sekarang</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm font-sans">
                                <SearchX className="w-5 h-5 shrink-0 text-red-500" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Results Empty State */}
                        {results && results.length === 0 && (
                            <div className="mt-6 p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                                    <PackageSearch className="w-5 h-5" />
                                </div>
                                <h4 className="font-display font-semibold text-sm text-slate-900">
                                    Tiket Servis Tidak Ditemukan
                                </h4>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans leading-relaxed text-justify [text-justify:inter-word]">
                                    Tidak ada catatan servis yang cocok dengan input Anda. Mohon periksa kembali nomor tiket atau hubungi hotline WhatsApp kami.
                                </p>
                            </div>
                        )}
                    </SpotlightCard>
                </div>
            </div>
        </div>
    </section>

            {/* 4. Engineering Capabilities Spec Sheet Matrix */}
            <ServiceSpecSheet />

            {/* 5. The YVS Standard / Engineering Principles */}
            <EngineeringStandards />

            {/* 6. Empirical Benchmarks & Customer Testimonials */}
            <WorkshopMetrics />

            {/* 8. Workshop Location, Hours & Direct Contact */}
            <WorkshopLocation />

            {/* 9. Architectural Technical Footer */}
            <LandingFooter />

            {/* Camera QR & Barcode Scanner Modal */}
            <CameraScannerModal
                isOpen={isCameraScannerOpen}
                onClose={() => setIsCameraScannerOpen(false)}
                onScan={handleScanReceipt}
                title="Pindai QR / Barcode Nota Servis"
                subtitle="Arahkan kamera ponsel Anda ke kode QR pada lembar nota fisik YVS Computer"
            />
        </div>
    );
}
