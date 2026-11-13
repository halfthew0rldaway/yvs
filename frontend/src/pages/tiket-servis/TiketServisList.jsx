import { useState, useEffect, useCallback, useTransition, useDeferredValue, memo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useRealtimeEvent from "../../hooks/useRealtime";
import api from "../../services/api";
import { 
    Plus, 
    Ticket, 
    ArrowRight, 
    Search, 
    X, 
    Calendar,
    ArrowUpDown,
    Clock,
    Award,
    Zap,
    AlertTriangle,
    ShieldAlert,
    Laptop,
    Send,
    Wrench,
    QrCode,
    RotateCcw,
    Camera,
    ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";
import SlaBadge from "../../components/SlaBadge";
import TicketQrModal from "../../components/TicketQrModal";
import CameraScannerModal from "../../components/CameraScannerModal";

const STATUS_LABELS = {
    diterima: { label: "Diterima", color: "bg-blue-50 text-blue-700 border-blue-200", dotColor: "bg-blue-500" },
    didiagnosis: { label: "Didiagnosis", color: "bg-purple-50 text-purple-700 border-purple-200", dotColor: "bg-purple-500" },
    menunggu_persetujuan: { label: "Menunggu Persetujuan", color: "bg-amber-50 text-amber-700 border-amber-200", dotColor: "bg-amber-500" },
    disetujui: { label: "Disetujui", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
    dalam_perbaikan: { label: "Dalam Perbaikan", color: "bg-indigo-50 text-indigo-700 border-indigo-200", dotColor: "bg-indigo-500" },
    selesai: { label: "Selesai", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
    diambil: { label: "Diambil", color: "bg-slate-50 text-slate-700 border-slate-200", dotColor: "bg-slate-400" },
    dibatalkan: { label: "Dibatalkan", color: "bg-rose-50 text-rose-600 border-rose-200", dotColor: "bg-rose-500" },
};

// Memoized Table Row Component
const TiketRow = memo(function TiketRow({ tiket, onNavigate, onSelectQr }) {
    const { hasPermission } = useAuth();
    return (
        <tr 
            onClick={(e) => {
                if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                onNavigate(tiket.id);
            }}
            className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
        >
            <td className="px-6 py-3.5 align-middle font-mono font-bold text-slate-700">
                <div className="flex items-center gap-2">
                    <span>{tiket.nomor_tiket}</span>
                    <button
                        type="button"
                        onClick={() => onSelectQr(tiket)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Lihat & Cetak QR Code Label Unit"
                    >
                        <QrCode className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
            <td className="px-6 py-3.5 align-middle text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        {tiket.created_at
                            ? new Date(tiket.created_at).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                              })
                            : "-"}
                    </span>
                </div>
            </td>
            <td className="px-6 py-3.5 align-middle font-medium text-slate-900">
                <span className="truncate max-w-[180px] block" title={tiket.perangkat?.customer?.nama || "-"}>
                    {tiket.perangkat?.customer?.nama || "-"}
                </span>
            </td>
            <td className="px-6 py-3.5 align-middle text-slate-600">
                <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                    <span className="truncate max-w-[200px]" title={`${tiket.perangkat?.merek || ""} ${tiket.perangkat?.model || ""}`}>
                        {tiket.perangkat?.merek} {tiket.perangkat?.model}
                    </span>
                </div>
            </td>
            <td className="px-6 py-3.5 align-middle">
                <SlaBadge tiket={tiket} />
            </td>
            <td className="px-6 py-3.5 align-middle text-slate-700 font-medium whitespace-nowrap">
                {tiket.teknisi?.nama ? (
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-3xs font-bold inline-flex items-center justify-center shrink-0">
                            {tiket.teknisi.nama.charAt(0)}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-slate-800 font-semibold text-xs">
                                {tiket.teknisi.nama.split("(")[0].trim()}
                            </span>
                            {tiket.teknisi.nama.includes("(") && (
                                <span className="text-slate-400 text-3xs font-normal">
                                    ({tiket.teknisi.nama.split("(")[1]?.replace(")", "")})
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-medium text-slate-400 bg-slate-50 border border-dashed border-slate-200">
                        Belum Ditugaskan
                    </span>
                )}
            </td>
            <td className="px-6 py-3.5 align-middle">
                <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap select-none">
                    <span className={`inline-flex items-center gap-1.5 w-[148px] px-2.5 py-0.5 rounded-md text-xs font-semibold border ${STATUS_LABELS[tiket.status]?.color || "bg-slate-100 text-slate-600 border-slate-200"} shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_LABELS[tiket.status]?.dotColor || 'bg-current'} shrink-0`} />
                        <span className="truncate">{STATUS_LABELS[tiket.status]?.label || tiket.status}</span>
                    </span>
                    {tiket.is_garansi_claim && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0" title={`Klaim Garansi Retur dari #${tiket.parent_tiket?.nomor_tiket || 'Lama'}`}>
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            <span>Garansi</span>
                        </span>
                    )}
                    {tiket.checklist_qc?.passed_qc && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0" title="Telah Lulus Quality Control (QC)">
                            <Award className="w-3 h-3 text-emerald-600" />
                            <span>QC</span>
                        </span>
                    )}
                    {tiket.is_revisi_acc && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0" title={`Pernah 1x Revisi ACC: ${tiket.alasan_revisi_acc || '-'}`}>
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                            <span>Revisi</span>
                        </span>
                    )}
                    {hasPermission("crm.view") && tiket.warranty_status?.status === "aktif" && tiket.warranty_status?.sisaHari <= 7 && tiket.warranty_status?.sisaHari >= 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0" title={`Masa Garansi Tersisa ${tiket.warranty_status.sisaHari} Hari`}>
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>H-{tiket.warranty_status.sisaHari}</span>
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-3.5 align-middle text-right">
                <div className="flex items-center justify-end">
                    <Link
                        to={`/tiket-servis/${tiket.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-xs border border-transparent hover:border-blue-100 cursor-pointer"
                    >
                        <span>Detail</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </td>
        </tr>
    );
});

/* ------------------------------------------------------------------ */
/* Mobile Card View (< sm) for the ticket queue                        */
/* ------------------------------------------------------------------ */
const TiketCard = memo(function TiketCard({ tiket, onNavigate, onSelectQr }) {
    const { hasPermission } = useAuth();
    const perangkatLabel = `${tiket.perangkat?.merek || ""} ${tiket.perangkat?.model || ""}`.trim();
    return (
        <div
            onClick={(e) => {
                if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                onNavigate(tiket.id);
            }}
            className="p-3.5 active:bg-blue-50/60 transition-colors cursor-pointer mobile-card-row tap-press"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Link
                        to={`/tiket-servis/${tiket.id}`}
                        className="font-mono font-bold text-sm text-slate-800 truncate"
                    >
                        {tiket.nomor_tiket}
                    </Link>
                    <button
                        type="button"
                        onClick={() => onSelectQr(tiket)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                        title="Lihat & Cetak QR Code Label Unit"
                    >
                        <QrCode className="w-3.5 h-3.5" />
                    </button>
                </div>
                <span className="text-3xs text-slate-500 font-medium whitespace-nowrap shrink-0 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {tiket.created_at
                        ? new Date(tiket.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                        : "-"}
                </span>
            </div>

            <p className="font-semibold text-sm text-slate-900 mt-1 truncate">
                {tiket.perangkat?.customer?.nama || "-"}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-3xs text-slate-600 truncate">{perangkatLabel || "-"}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-3xs font-semibold border ${STATUS_LABELS[tiket.status]?.color || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_LABELS[tiket.status]?.dotColor || 'bg-current'} shrink-0`} />
                    <span className="truncate">{STATUS_LABELS[tiket.status]?.label || tiket.status}</span>
                </span>
                {tiket.is_garansi_claim && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        <span>Garansi</span>
                    </span>
                )}
                {tiket.checklist_qc?.passed_qc && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <Award className="w-3 h-3 text-emerald-600" />
                        <span>QC</span>
                    </span>
                )}
                {tiket.is_revisi_acc && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        <RotateCcw className="w-3 h-3 text-rose-600" />
                        <span>Revisi</span>
                    </span>
                )}
                {hasPermission("crm.view") && tiket.warranty_status?.status === "aktif" && tiket.warranty_status?.sisaHari <= 7 && tiket.warranty_status?.sisaHari >= 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>H-{tiket.warranty_status.sisaHari}</span>
                    </span>
                )}
            </div>

            <div className="mt-2"><SlaBadge tiket={tiket} /></div>

            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100/80">
                {tiket.teknisi?.nama ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-3xs font-bold inline-flex items-center justify-center shrink-0">
                            {tiket.teknisi.nama.charAt(0)}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                            {tiket.teknisi.nama.split("(")[0].trim()}
                        </span>
                    </div>
                ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-medium text-slate-400 bg-slate-50 border border-dashed border-slate-200">
                        Belum Ditugaskan
                    </span>
                )}
                <Link
                    to={`/tiket-servis/${tiket.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-blue-600 bg-blue-50 rounded-lg font-bold text-3xs shrink-0"
                >
                    <span>Detail</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
});

export default function TiketServisList() {
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const canViewAllTickets = hasPermission("tickets.view_all");
    const canIntake = hasPermission("tickets.intake");
    const [searchParams, setSearchParams] = useSearchParams();
    const [tikets, setTikets] = useState([]);
    const [filter, setFilter] = useState(() => searchParams.get("status") || "");
    const [slaFilter, setSlaFilter] = useState(""); // '' | 'express' | 'overdue' | 'warning'
    const [scopeFilter, setScopeFilter] = useState(() => searchParams.get("scope") || "all"); // 'all' | 'my'
    const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || searchParams.get("q") || "");
    const [sortOrder, setSortOrder] = useState("desc"); // 'desc' | 'asc'
    const [loading, setLoading] = useState(true);
    const [selectedQrTiket, setSelectedQrTiket] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    function handleScanSuccess(decodedText) {
        setIsScannerOpen(false);
        let code = decodedText.trim();
        if (code.includes("/tracking")) {
            try {
                const parsed = new URL(code, window.location.origin);
                const tParam = parsed.searchParams.get("nomor_tiket") || parsed.searchParams.get("tiket");
                if (tParam) code = tParam;
                else if (code.includes("/tracking/")) code = code.split("/tracking/")[1].split("?")[0].split("/")[0];
            } catch (_) {}
        } else if (code.includes("/tiket-servis")) {
            try {
                const parsed = new URL(code, window.location.origin);
                const sParam = parsed.searchParams.get("search") || parsed.searchParams.get("q");
                if (sParam) code = sParam;
                else if (code.includes("/tiket-servis/")) code = code.split("/tiket-servis/")[1].split("?")[0].split("/")[0];
            } catch (_) {}
        }
        setSearchTerm(code);
        setCurrentPage(1);
        fetchTikets(code, 1);
        toast.success(`Berhasil memindai: ${code}`);
    }

    // Standardized Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Dynamic Counts
    const [unassignedCount, setUnassignedCount] = useState(0);
    const [expiringWarrantyCount, setExpiringWarrantyCount] = useState(0);
    const [expressCount, setExpressCount] = useState(0);
    const [overdueCount, setOverdueCount] = useState(0);

    const [isPending, startTransition] = useTransition();

    const handleNavigate = useCallback((id) => {
        navigate(`/tiket-servis/${id}`);
    }, [navigate]);

    const handleSelectQr = useCallback((t) => {
        setSelectedQrTiket(t);
    }, []);

    // Sync state when URL search params change (e.g. from direct QR link opened in browser)
    useEffect(() => {
        const urlStatus = searchParams.get("status") || "";
        const urlScope = searchParams.get("scope") || "all";
        const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
        setFilter(urlStatus);
        setScopeFilter(urlScope);
        if (urlSearch !== null && urlSearch !== undefined) {
            setSearchTerm(urlSearch);
        }
        setCurrentPage(1);
    }, [searchParams]);

    useEffect(() => {
        fetchTikets(searchTerm, currentPage);
    }, [currentPage, itemsPerPage, filter, slaFilter, sortOrder, scopeFilter]);

    // Real-Time SSE: Otomatis perbarui antrean tiket saat ada tiket baru atau status berubah
    useRealtimeEvent(["tiket:created", "tiket:updated"], () => {
        if (document.visibilityState === "visible") {
            fetchTikets();
        }
    });

    async function fetchTikets(targetSearch = searchTerm, page = currentPage) {
        setLoading(true);
        try {
            const params = {
                page,
                limit: itemsPerPage,
                sortOrder,
            };

            if (filter) {
                params.status = filter;
            }

            if (slaFilter === "express") {
                params.sla_paket = "express";
            } else if (slaFilter === "overdue") {
                params.sla_urgency = "overdue";
            } else if (slaFilter === "warning") {
                params.sla_urgency = "warning";
            }

            if (targetSearch.trim()) {
                params.search = targetSearch.trim();
            }

            if (!canViewAllTickets && scopeFilter === "my" && user?.id) {
                params.teknisi_id = user.id;
            }

            const res = await api.get("/tiket-servis", { params });

            if (res.data && res.data.pagination) {
                setTikets(res.data.data);
                setTotalItems(res.data.pagination.total);
                setTotalPages(res.data.pagination.totalPages);
                if (res.data.counts) {
                    setUnassignedCount(res.data.counts.unassigned || 0);
                    setExpiringWarrantyCount(res.data.counts.expiringWarranty || 0);
                    setExpressCount(res.data.counts.express || 0);
                    setOverdueCount(res.data.counts.overdue || 0);
                }
            } else if (Array.isArray(res.data)) {
                // Client-side fallback if server returned raw array
                let filtered = res.data;
                if (!canViewAllTickets && scopeFilter === "my") {
                    filtered = filtered.filter(t => t.teknisi?.id === user?.id);
                }
                if (filter === "garansi_expiring") {
                    filtered = filtered.filter(t => t.warranty_status?.status === "aktif" && t.warranty_status?.sisaHari <= 7 && t.warranty_status?.sisaHari >= 0);
                } else if (filter === "aktif") {
                    filtered = filtered.filter(t => !["selesai", "diambil", "dibatalkan"].includes(t.status));
                } else if (filter) {
                    filtered = filtered.filter(t => t.status === filter);
                }
                if (targetSearch.trim()) {
                    const term = targetSearch.toLowerCase();
                    filtered = filtered.filter(t => 
                        t.nomor_tiket?.toLowerCase().includes(term) ||
                        t.perangkat?.customer?.nama?.toLowerCase().includes(term) ||
                        t.perangkat?.merek?.toLowerCase().includes(term) ||
                        t.perangkat?.model?.toLowerCase().includes(term) ||
                        t.keluhan?.toLowerCase().includes(term) ||
                        t.teknisi?.nama?.toLowerCase().includes(term)
                    );
                }

                setTotalItems(filtered.length);
                setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1);
                const start = (page - 1) * itemsPerPage;
                setTikets(filtered.slice(start, start + itemsPerPage));

                setUnassignedCount(res.data.filter(t => t.status === "diterima" && !t.teknisi).length);
                setExpiringWarrantyCount(res.data.filter(t => t.warranty_status?.status === "aktif" && t.warranty_status?.sisaHari <= 7 && t.warranty_status?.sisaHari >= 0).length);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleSearchSubmit(e) {
        e.preventDefault();
        setCurrentPage(1);
        fetchTikets(searchTerm, 1);
    }

    function handleClearSearch() {
        setSearchTerm("");
        setCurrentPage(1);
        fetchTikets("", 1);
    }

    function handleResetAllFilters() {
        setSearchTerm("");
        setFilter("");
        setSlaFilter("");
        setSortOrder("desc");
        setCurrentPage(1);
    }

    const hasActiveFilters = Boolean(filter || slaFilter || searchTerm);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Tiket Servis</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola tiket perbaikan perangkat pelanggan</p>
                </div>
                {canIntake && (
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                            to="/tiket-servis/tambah"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0 whitespace-nowrap w-fit max-w-max"
                        >
                            <Plus className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Buat Tiket</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3.5">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    {/* Search Input & QR Scan Button */}
                    <div className="flex items-center gap-2 w-full sm:flex-1">
                        <form onSubmit={handleSearchSubmit} className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nomor tiket, customer, perangkat, keluhan, teknisi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        handleClearSearch();
                                    }
                                }}
                                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                                    title="Hapus pencarian"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </form>
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer whitespace-nowrap w-fit max-w-max"
                            title="Pindai QR Fisik Tiket dengan Kamera"
                        >
                            <Camera className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline whitespace-nowrap">Scan QR</span>
                        </button>
                    </div>

                    {/* Sorting Button */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setSortOrder(prev => prev === "desc" ? "asc" : "desc");
                                setCurrentPage(1);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 w-fit max-w-max"
                            title="Urutkan Waktu Pendaftaran"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="whitespace-nowrap">{sortOrder === "desc" ? "Terbaru" : "Terlama"}</span>
                        </button>
                    </div>
                </div>

                {/* Unified Structured Filter Section */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 space-y-2.5 shadow-2xs">
                    {/* Row 1: Workflow Status */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 w-20 shrink-0 uppercase tracking-wider select-none">
                            <Ticket className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Status</span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setFilter("");
                                    setCurrentPage(1);
                                }}
                                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                                    !filter 
                                        ? "bg-blue-600 text-white shadow-xs font-bold" 
                                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                                }`}
                            >
                                Semua Status
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFilter("aktif");
                                    setCurrentPage(1);
                                }}
                                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                                    filter === "aktif" 
                                        ? "bg-amber-600 text-white shadow-xs font-bold" 
                                        : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
                                }`}
                            >
                                Tiket Aktif
                            </button>
                            {Object.entries(STATUS_LABELS).map(([key, val]) => {
                                const showBadge = key === "diterima" && unassignedCount > 0 && !canViewAllTickets;
                                const isActive = filter === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setFilter(key);
                                            setCurrentPage(1);
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                                            isActive 
                                                ? "bg-blue-600 text-white shadow-xs font-bold" 
                                                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                                        }`}
                                    >
                                        <span>{val.label}</span>
                                        {showBadge && (
                                            <span className={`text-3xs px-1.5 py-0.2 rounded-full font-bold animate-pulse ${
                                                isActive ? "bg-red-500 text-white" : "bg-red-100 text-red-600"
                                            }`}>
                                                {unassignedCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Row 2: Priority Queues & Technician Scope */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 w-20 shrink-0 uppercase tracking-wider select-none">
                                <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Antrean</span>
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0">
                                {/* Express Queue */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSlaFilter(slaFilter === "express" ? "" : "express");
                                        setCurrentPage(1);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                                        slaFilter === "express" 
                                            ? "bg-amber-500 text-white shadow-xs font-bold" 
                                            : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-300"
                                    }`}
                                >
                                    <Zap className={`w-3.5 h-3.5 shrink-0 ${slaFilter === "express" ? "text-white fill-white" : "text-amber-500 fill-amber-500"}`} />
                                    <span className="whitespace-nowrap">Express Queue</span>
                                    <span className={`text-3xs px-1.5 py-0.2 rounded-full font-bold whitespace-nowrap ${
                                        slaFilter === "express" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"
                                    }`}>
                                        {expressCount}
                                    </span>
                                </button>

                                {/* Overdue SLA */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSlaFilter(slaFilter === "overdue" ? "" : "overdue");
                                        setCurrentPage(1);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                                        slaFilter === "overdue" 
                                            ? "bg-rose-600 text-white shadow-xs font-bold" 
                                            : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200"
                                    }`}
                                >
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span className="whitespace-nowrap">Overdue SLA</span>
                                    <span className={`text-3xs px-1.5 py-0.2 rounded-full font-bold whitespace-nowrap ${
                                        slaFilter === "overdue" ? "bg-rose-700 text-white" : "bg-rose-100 text-rose-700"
                                    }`}>
                                        {overdueCount}
                                    </span>
                                </button>

                                {/* Garansi H-3 CRM (Khusus Admin / CS) */}
                                {hasPermission("crm.view") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilter(filter === "garansi_expiring" ? "" : "garansi_expiring");
                                            setSlaFilter("");
                                            setCurrentPage(1);
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                                            filter === "garansi_expiring" 
                                                ? "bg-amber-600 text-white shadow-xs font-bold" 
                                                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                                        }`}
                                    >
                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span className="whitespace-nowrap">Garansi H-3 CRM</span>
                                        <span className={`text-3xs px-1.5 py-0.2 rounded-full font-bold whitespace-nowrap ${
                                            filter === "garansi_expiring" ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800"
                                        }`}>
                                            {expiringWarrantyCount}
                                        </span>
                                    </button>
                                )}

                                {/* Klaim Garansi Filter */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilter(filter === "klaim_garansi" ? "" : "klaim_garansi");
                                        setSlaFilter("");
                                        setCurrentPage(1);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                        filter === "klaim_garansi" 
                                            ? "bg-indigo-600 text-white shadow-xs font-bold" 
                                            : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200"
                                    }`}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Klaim Garansi</span>
                                </button>

                                {/* Reset Filter Button */}
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={handleResetAllFilters}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors border border-transparent hover:border-slate-300/60 whitespace-nowrap cursor-pointer"
                                        title="Reset semua filter"
                                    >
                                        <RotateCcw className="w-3 h-3 text-slate-400" />
                                        <span>Reset Filter</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Technician Scope Tabs (Technicians Only) */}
                        {!canViewAllTickets && (
                            <div className="flex items-center p-0.5 bg-slate-200/70 rounded-lg border border-slate-200/60 text-xs shrink-0 self-start sm:self-auto sm:ml-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setScopeFilter("all");
                                        setCurrentPage(1);
                                    }}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                        scopeFilter === "all"
                                            ? "bg-white text-slate-800 shadow-xs"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setScopeFilter("my");
                                        setCurrentPage(1);
                                    }}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                        scopeFilter === "my"
                                            ? "bg-white text-slate-800 shadow-xs"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    Tiket Saya
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Standardized Contained Table with Pagination */}
            <TableContainer
                footer={
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={itemsPerPage}
                        onPageChange={(p) => setCurrentPage(p)}
                        onPageSizeChange={(size) => {
                            setItemsPerPage(size);
                            setCurrentPage(1);
                        }}
                        unitLabel="tiket"
                        disabled={loading}
                    />
                }
            >
                {loading ? (
                    <TableLoadingState message="Memuat daftar tiket servis..." />
                ) : tikets.length === 0 ? (
                    <TableEmptyState
                        icon={Ticket}
                        title="Tidak Ada Tiket Servis"
                        description={
                            hasActiveFilters
                                ? "Tidak ada tiket yang cocok dengan filter atau kata kunci pencarian Anda." 
                                : "Belum ada tiket servis yang dibuat di bengkel."
                        }
                        actionLabel={hasActiveFilters ? "Reset Filter" : (canIntake ? "Buat Tiket Baru" : undefined)}
                        onAction={hasActiveFilters ? handleResetAllFilters : () => navigate("/tiket-servis/tambah")}
                    />
                ) : (
                    <>
                    {/* Mobile Card View (< sm) */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {tikets.map((t) => (
                            <TiketCard
                                key={t.id}
                                tiket={t}
                                onNavigate={handleNavigate}
                                onSelectQr={handleSelectQr}
                            />
                        ))}
                    </div>

                    {/* Desktop Table View (>= sm) */}
                    <table className="hidden lg:table w-full text-sm text-left whitespace-nowrap">
                        <thead className="table-header">
                            <tr>
                                <th className="px-6 py-3.5">No Tiket</th>
                                <th className="px-6 py-3.5">Tgl Masuk</th>
                                <th className="px-6 py-3.5">Customer</th>
                                <th className="px-6 py-3.5">Perangkat</th>
                                <th className="px-6 py-3.5 min-w-[210px]">Target & SLA</th>
                                <th className="px-6 py-3.5 min-w-[200px]">Teknisi</th>
                                <th className="px-6 py-3.5 min-w-[230px]">Status & QC</th>
                                <th className="px-6 py-3.5 text-right w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tikets.map((t) => (
                                <TiketRow
                                    key={t.id}
                                    tiket={t}
                                    onNavigate={handleNavigate}
                                    onSelectQr={handleSelectQr}
                                />
                            ))}
                        </tbody>
                    </table>
                    </>
                )}
            </TableContainer>

            {/* QR Code Label Modal - Lazy mounted only when requested */}
            {selectedQrTiket && (
                <TicketQrModal 
                    isOpen={!!selectedQrTiket} 
                    onClose={() => setSelectedQrTiket(null)} 
                    tiket={selectedQrTiket} 
                />
            )}

            {/* In-Browser Camera QR Scanner Modal */}
            <CameraScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanSuccess}
                title="Pindai QR Tiket Servis"
                subtitle="Arahkan kamera ke QR Code nota servis atau stiker fisik unit"
            />
        </div>
    );
}
