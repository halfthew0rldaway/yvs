import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Search, LogIn, Phone, Ticket as TicketIcon, SearchX, CheckCircle, PackageSearch, PenTool, ChevronDown, ChevronUp, User, Calendar, MonitorSmartphone, ClipboardCheck, Award, Star, MapPin, MessageCircle, Download, ShieldCheck, QrCode, CreditCard, Camera, Lightbulb, Package, X, ChevronLeft, ChevronRight, Wrench, Image as ImageIcon, Clock, AlertTriangle, Check, CheckCircle2, Play, Video, ZoomIn } from "lucide-react";
import { isVideo, getMediaUrl } from "../../utils/mediaUtils";
import { CHECKLIST_ITEMS, QC_CHECKLIST_ITEMS, getChecklistValue } from "../../utils/checklistItems";
import WarrantyCertificateModal from "../../components/WarrantyCertificateModal";
import SlaBadge, { SlaCountdownCard } from "../../components/SlaBadge";
import DefectMapperModal, { DefectMapBadge } from "../../components/DefectMapperModal";
import DigitalSignaturePadModal from "../../components/DigitalSignaturePadModal";
import ErrorBoundary from "../../components/ErrorBoundary";

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
    if (typeof parsed === "string") {
        try {
            parsed = JSON.parse(parsed);
        } catch (_) {
            return [parsed];
        }
    }
    if (typeof parsed === "string") {
        try {
            parsed = JSON.parse(parsed);
        } catch (_) {
            return [parsed];
        }
    }
    if (Array.isArray(parsed)) {
        return parsed.map(item => {
            if (!item) return "";
            if (typeof item === "string") return item;
            if (typeof item === "object" && item.url) return item.url;
            return String(item);
        }).filter(Boolean);
    }
    if (typeof parsed === "object" && parsed !== null) {
        return Object.values(parsed).map(item => (typeof item === "object" && item?.url) ? item.url : String(item)).filter(Boolean);
    }
    return [];
}

function TrackingProgress({ currentStatus }) {
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
                    return (
                        <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-base border-4 transition-all duration-500 ${
                                isCompleted ? 'bg-blue-600 border-blue-100 text-white shadow-md shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-300'
                            } ${isActive ? 'ring-4 ring-blue-50/80 scale-110' : ''}`}>
                                {isCompleted && !isActive ? <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" /> : idx + 1}
                            </div>
                            <span className={`text-4xs xs:text-3xs sm:text-xs md:text-sm font-bold absolute -bottom-6 sm:-bottom-8 whitespace-nowrap ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</span>
                        </div>
                    );
                })}
            </div>
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
                        {/* Stacked Preview Thumbnails */}
                        <div className="flex -space-x-2.5 overflow-hidden">
                            {allPhotos.slice(0, 4).map((p, i) => (
                                <img 
                                    key={i} 
                                    src={getMediaUrl(p.url)} 
                                    alt="" 
                                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-2xs" 
                                />
                            ))}
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
                    className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsGalleryModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
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
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => openLightbox(globalIdx >= 0 ? globalIdx : 0)}
                                            className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 hover:border-blue-500 transition-all shadow-2xs hover:shadow-md cursor-pointer flex items-center justify-center text-left"
                                        >
                                            {isVid ? (
                                                <div className="w-full h-full relative flex items-center justify-center">
                                                    <video src={getMediaUrl(photo.url)} className="w-full h-full object-cover opacity-80" preload="metadata" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg border border-white/20">
                                                            <Play className="w-4 h-4 fill-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                    <span className="absolute top-2 right-2 bg-purple-600 text-white text-4xs font-bold px-1.5 py-0.5 rounded shadow">
                                                        VIDEO
                                                    </span>
                                                </div>
                                            ) : (
                                                <img 
                                                    src={getMediaUrl(photo.url)} 
                                                    alt={photo.label} 
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
                            ) : (
                                <img 
                                    src={getMediaUrl(currentList[lightboxIdx].url)} 
                                    alt={currentList[lightboxIdx].label} 
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
                                    return (
                                        <button 
                                            key={idx} 
                                            type="button"
                                            onClick={() => setLightboxIdx(idx)} 
                                            className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all relative w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 cursor-pointer ${idx === lightboxIdx ? 'border-blue-400 ring-2 ring-blue-400/30 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                                        >
                                            {isVid ? (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <video src={getMediaUrl(photoUrl)} className="w-full h-full object-cover opacity-60" preload="metadata" />
                                                    <Play className="w-3.5 h-3.5 text-white fill-white absolute" />
                                                </div>
                                            ) : (
                                                <img src={getMediaUrl(photoUrl)} alt="" className="w-full h-full object-cover" />
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
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden w-full flex flex-col w-full mx-auto">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-5 bg-slate-50/80">
                <div className="space-y-1 w-full">
                    <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-semibold transition-colors bg-white px-3 py-1.5 border border-slate-200 rounded-lg w-fit shadow-sm">
                        <ChevronDown className="w-4 h-4 rotate-90" /> Kembali ke Daftar
                    </button>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <span className="font-mono font-bold text-base sm:text-lg text-slate-900">{t.nomor_tiket}</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/50 text-slate-700 rounded-md text-xs font-semibold">
                            <MonitorSmartphone className="w-3.5 h-3.5" />
                            {t.jenis_perangkat}
                        </span>
                        {t.sla_paket && <SlaBadge tiket={t} />}
                    </div>
                    <h4 className="text-slate-800 font-bold text-base sm:text-lg leading-tight break-words">{t.perangkat}</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6 mt-3">
                        <p className="text-slate-500 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            Masuk: {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                            <User className="w-4 h-4 text-slate-400" />
                            Teknisi: <span className="text-slate-700 font-semibold">{t.teknisi}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 mt-2 sm:mt-0 h-full">
                    <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wide text-center shrink-0 mt-2 sm:mt-0 ${STATUS_LABELS[t.status]?.color}`}>
                        {STATUS_LABELS[t.status]?.label}
                    </span>
                    <a 
                        href={`https://wa.me/6281234567890?text=Halo,%20saya%20ingin%20bertanya%20tentang%20status%20perbaikan%20perangkat%20saya%20dengan%20nomor%20tiket%20${t.nomor_tiket}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all mt-auto sm:mt-4 shadow-sm shadow-emerald-500/20"
                    >
                        <MessageCircle className="w-4 h-4" /> Hubungi Admin
                    </a>
                </div>
            </div>

            <div className="p-6 sm:p-8 flex-1">
                <TrackingProgress currentStatus={t.status} />

                {/* Feature 7: SLA Target & Real-time Progress Countdown */}
                {['diterima', 'didiagnosis', 'menunggu_persetujuan', 'disetujui', 'dalam_perbaikan'].includes(t.status) && (
                    <div className="mb-8">
                        <SlaCountdownCard tiket={t} />
                    </div>
                )}

                {/* QR Code and Warranty Section for Selesai / Diambil */}
                {['selesai', 'diambil'].includes(t.status) && (
                    <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-slate-900 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${t.nomor_tiket}`} alt="QR Code" className="w-20 h-20 sm:w-24 sm:h-24" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h5 className="font-bold text-xl mb-1 flex items-center justify-center sm:justify-start gap-2 text-slate-900"><QrCode className="w-5 h-5 text-blue-600"/> Tunjukkan QR ini</h5>
                                <p className="text-slate-500 text-sm leading-relaxed">Gunakan QR ini saat mengambil perangkat di toko untuk proses validasi yang lebih cepat.</p>
                            </div>
                        </div>
                        {/* Feature 9: Dynamic Real-time Warranty Card */}
                        {t.status === "diambil" ? (
                            t.warranty_status?.isExpired ? (
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-slate-900 flex flex-col justify-center shadow-sm relative overflow-hidden">
                                    <ShieldCheck className="absolute -right-8 -bottom-8 w-40 h-40 text-slate-100 pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2.5 py-1 rounded-full text-3xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Kedaluwarsa
                                            </span>
                                        </div>
                                        <h5 className="font-bold text-xl mb-1 flex items-center gap-2 text-slate-900">Masa Garansi Berakhir</h5>
                                        <p className="text-slate-500 text-sm mb-3">
                                            Garansi {t.durasi_garansi || "1 Bulan"} telah berakhir sejak {t.warranty_status?.lewatHari || 0} hari yang lalu.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-block bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
                                                Berakhir pada: {t.warranty_status?.garansi_berakhir_at ? new Date(t.warranty_status.garansi_berakhir_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                            </span>
                                            <button 
                                                onClick={() => setIsWarrantyModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
                                            >
                                                <Award className="w-3.5 h-3.5 text-amber-500" /> Sertifikat Garansi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-emerald-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-center shadow-xl relative overflow-hidden">
                                    <ShieldCheck className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2.5 py-1 rounded-full text-3xs font-bold bg-white/20 text-white border border-white/30 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" /> Sisa {t.warranty_status?.sisaHari || 0} Hari Lagi
                                            </span>
                                        </div>
                                        <h5 className="font-bold text-xl mb-1 flex items-center gap-2"><ShieldCheck className="w-6 h-6"/> Garansi Aktif</h5>
                                        <p className="text-emerald-50 text-sm mb-3">
                                            Perbaikan Anda dilindungi garansi {t.durasi_garansi || "1 Bulan"} resmi YVS Computer.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-block bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm">
                                                Berlaku hingga: {t.warranty_status?.garansi_berakhir_at ? new Date(t.warranty_status.garansi_berakhir_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                            </span>
                                            <button 
                                                onClick={() => setIsWarrantyModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                <Award className="w-3.5 h-3.5 text-emerald-600" /> Cetak Sertifikat Garansi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="bg-blue-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-center shadow-xl relative overflow-hidden">
                                <ShieldCheck className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10" />
                                <div className="relative z-10">
                                    <h5 className="font-bold text-xl mb-2 flex items-center gap-2"><ShieldCheck className="w-6 h-6"/> Garansi Disiapkan</h5>
                                    <p className="text-blue-50 text-sm mb-4">
                                        Perangkat ini mendapatkan jaminan garansi {t.durasi_garansi || "1 Bulan"} yang otomatis aktif saat unit diambil.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-block bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm">
                                            Aktif saat serah terima perangkat
                                        </span>
                                        <button 
                                            onClick={() => setIsWarrantyModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-blue-800 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all shadow-sm"
                                        >
                                            <Award className="w-3.5 h-3.5 text-blue-600" /> Preview Sertifikat Garansi
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                    return (
                        <div className="mb-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2.5 mb-4">
                                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-slate-900 text-sm sm:text-base">Kondisi Awal Perangkat (Sebelum Perbaikan)</h5>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                                {(CHECKLIST_ITEMS || []).map(item => {
                                    const val = getChecklistValue(intakeObj, item.key, item.legacyKey);
                                    const ItemIcon = item.Icon || ClipboardCheck;
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
                                                    onClick={() => setIsWarrantyModalOpen(true)}
                                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm transition-all shadow-sm shrink-0 w-full sm:w-auto cursor-pointer"
                                                >
                                                    <Award className="w-4 h-4" /> Sertifikat Garansi
                                                </button>
                                                <button onClick={() => window.print()} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 rounded-xl font-bold text-sm transition-all shadow-sm shrink-0 w-full sm:w-auto cursor-pointer">
                                                    <Download className="w-4 h-4" /> Cetak Invoice
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
                
                <div className="pt-6 border-t border-slate-100">
                    <h5 className="font-semibold text-slate-900 mb-4">Riwayat Perbaikan</h5>
                    {t?.log_perbaikan && t.log_perbaikan.length > 0 ? (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                            {[...(t.log_perbaikan || [])]
                                .sort((a,b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0))
                                .map((log, logIdx) => {
                                    let badgeColor = "bg-blue-100 text-blue-700";
                                    let label = "Perbaikan";

                                    if (log?.fase === "Diagnosis") {
                                        badgeColor = "bg-amber-100 text-amber-700";
                                        label = "Diagnosis";
                                    } else if (log?.fase === "Catatan Admin") {
                                        badgeColor = "bg-purple-100 text-purple-700";
                                        label = "Admin";
                                    }
                                    
                                    return (
                                        <div key={logIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="mb-2">
                                                <span className={`text-3xs uppercase font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>{label}</span>
                                            </div>
                                            <p className="text-slate-900 text-sm whitespace-pre-line mb-2 leading-relaxed">{log?.catatan}</p>
                                            
                                            {log?.foto_url && (
                                                <div className="mb-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExternalPhoto({ 
                                                            url: log.foto_url, 
                                                            label: `Proses: ${(log.catatan || '').substring(0, 50)}...` 
                                                        })}
                                                        className="group relative block rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer text-left"
                                                        title="Klik untuk melihat foto dalam modal"
                                                    >
                                                        <img 
                                                            src={getMediaUrl(log.foto_url)} 
                                                            alt="Dokumentasi Perbaikan" 
                                                            className="h-24 sm:h-28 object-cover rounded-xl group-hover:scale-105 transition-transform" 
                                                        />
                                                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md">
                                                                <ZoomIn className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <p className="text-xs text-slate-400 font-medium">
                                                {formatDateSafe(log?.created_at, { 
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                })}
                                            </p>
                                        </div>
                                    );
                            })}
                        </div>
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
                                            ? `Perangkat telah lulus uji kelayakan ${QC_CHECKLIST_ITEMS.length} poin kendali mutu fungsional & pembersihan menyeluruh standar workshop.`
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
                                {(QC_CHECKLIST_ITEMS || []).map(item => {
                                    const val = getChecklistValue(qcObj, item.key, item.legacyKey);
                                    const ItemIcon = item.Icon || Award;
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

            {/* Digital Warranty Certificate Modal */}
            <WarrantyCertificateModal
                isOpen={isWarrantyModalOpen}
                onClose={() => setIsWarrantyModalOpen(false)}
                tiket={t}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
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
    const [trackMethod, setTrackMethod] = useState("tiket");
    const [nomorTelepon, setNomorTelepon] = useState("");
    const [nomorTiket, setNomorTiket] = useState(queryTiket);
    const [results, setResults] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (queryTiket) {
            setNomorTiket(queryTiket);
            executeTrack({ nomorTiket: queryTiket });
        }
    }, [queryTiket]);

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
        } catch (err) {
            setError(err.response?.data?.message || "Gagal melacak servis");
        } finally {
            setLoading(false);
        }
    }

    async function handleTrack(e) {
        e.preventDefault();
        const payload = {
            nomorTelepon: trackMethod === "telepon" ? nomorTelepon : undefined,
            nomorTiket: trackMethod === "tiket" ? nomorTiket : undefined,
        };
        await executeTrack(payload);
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <PenTool className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Serv.io</h1>
                    </div>
                </div>
            </header>

            <main className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 mx-auto max-w-none">
                
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                        Lacak Perbaikan Anda
                    </h2>
                    <p className="mt-4 text-lg text-slate-500">
                        Masukkan nomor telepon atau nomor tiket untuk melihat status terkini perangkat Anda.
                    </p>
                </div>

                {/* Form Section */}
                <div className="max-w-3xl mx-auto mb-10">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
                        
                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8">
                            <button
                                type="button"
                                onClick={() => setTrackMethod("tiket")}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    trackMethod === "tiket" 
                                        ? "bg-white text-blue-700 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <TicketIcon className="w-4 h-4" />
                                Nomor Tiket
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrackMethod("telepon")}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    trackMethod === "telepon" 
                                        ? "bg-white text-blue-700 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <Phone className="w-4 h-4" />
                                Nomor Telepon
                            </button>
                        </div>

                        <form onSubmit={handleTrack} className="space-y-6">
                            {trackMethod === "tiket" ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-semibold text-slate-700">Nomor Tiket Servis</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <TicketIcon className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={nomorTiket}
                                            onChange={(e) => setNomorTiket(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none text-slate-900 transition-all font-mono placeholder:font-sans placeholder:text-slate-400 text-base"
                                            placeholder="Contoh: SRV-2024-001"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-semibold text-slate-700">Nomor Telepon Terdaftar</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Phone className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={nomorTelepon}
                                            onChange={(e) => setNomorTelepon(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none text-slate-900 transition-all placeholder:text-slate-400 text-base"
                                            placeholder="Contoh: 08123456789"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (trackMethod === 'tiket' ? !nomorTiket : !nomorTelepon)}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-md text-base"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        <span>Lacak Servis</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {error && (
                        <div className="mt-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <SearchX className="w-6 h-6 shrink-0" />
                            <p className="font-medium text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {results && results.length > 0 && !selectedTicket && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                <span>Hasil Pencarian ({results.length})</span>
                            </h3>
                        </div>
                        
                        <div className="flex flex-col gap-4 w-full px-2">
                            {results.map((t, i) => (
                                <TrackingListItem key={i} t={t} onClick={() => setSelectedTicket(t)} />
                            ))}
                        </div>
                    </div>
                )}

                {selectedTicket && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 max-w-none w-full">
                        <ErrorBoundary>
                            <TrackingDetail 
                                t={selectedTicket} 
                                onBack={() => setSelectedTicket(null)} 
                                onUpdateTicket={(updated) => {
                                    setSelectedTicket(updated);
                                    setResults(prev => prev ? prev.map(item => item.id === updated.id ? { ...item, ...updated } : item) : [updated]);
                                }}
                            />
                        </ErrorBoundary>
                    </div>
                )}

                {results && results.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 mt-8 shadow-sm max-w-3xl mx-auto"
                    >
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, -10, 10, -10, 0]
                            }}
                            transition={{ 
                                duration: 2.5, 
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-6 text-slate-400"
                        >
                            <PackageSearch className="w-8 h-8 text-slate-500" />
                        </motion.div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Tidak Ditemukan</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Kami tidak dapat menemukan riwayat servis dengan nomor tersebut. Silakan periksa kembali ketikan Anda.
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
