import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
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
    Wrench
} from "lucide-react";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";
import SlaBadge from "../../components/SlaBadge";

const STATUS_LABELS = {
    diterima: { label: "Diterima", color: "bg-blue-100 text-blue-700 border-blue-200" },
    didiagnosis: { label: "Didiagnosis", color: "bg-purple-100 text-purple-700 border-purple-200" },
    menunggu_persetujuan: { label: "Menunggu Persetujuan", color: "bg-amber-100 text-amber-700 border-amber-200" },
    disetujui: { label: "Disetujui", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    dalam_perbaikan: { label: "Dalam Perbaikan", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    selesai: { label: "Selesai", color: "bg-green-100 text-green-700 border-green-200" },
    diambil: { label: "Diambil", color: "bg-slate-100 text-slate-700 border-slate-200" },
    dibatalkan: { label: "Dibatalkan", color: "bg-red-100 text-red-600 border-red-200" },
};

export default function TiketServisList() {
    const { isAdmin, isTeknisi, user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tikets, setTikets] = useState([]);
    const [filter, setFilter] = useState(() => searchParams.get("status") || "");
    const [slaFilter, setSlaFilter] = useState(""); // '' | 'express' | 'overdue' | 'warning'
    const [scopeFilter, setScopeFilter] = useState(() => searchParams.get("scope") || "all"); // 'all' | 'my'
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("desc"); // 'desc' | 'asc'
    const [loading, setLoading] = useState(true);

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

    // Sync state when URL search params change
    useEffect(() => {
        const urlStatus = searchParams.get("status") || "";
        const urlScope = searchParams.get("scope") || "all";
        setFilter(urlStatus);
        setScopeFilter(urlScope);
        setCurrentPage(1);
    }, [searchParams]);

    useEffect(() => {
        fetchTikets();
    }, [currentPage, itemsPerPage, filter, slaFilter, sortOrder, scopeFilter]);

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

            if (!isAdmin && scopeFilter === "my" && user?.id) {
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
                if (!isAdmin && scopeFilter === "my") {
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tiket Servis</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola tiket perbaikan perangkat pelanggan</p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2.5">
                        <Link
                            to="/tiket-servis/tambah"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Buat Tiket</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative w-full sm:flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nomor tiket, customer, perangkat, keluhan, teknisi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm"
                        />
                    </form>

                    {/* Sorting & Search Button */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setSortOrder(prev => prev === "desc" ? "asc" : "desc");
                                setCurrentPage(1);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
                            title="Urutkan Waktu Pendaftaran"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                            <span>{sortOrder === "desc" ? "Terbaru" : "Terlama"}</span>
                        </button>

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Technician Scope Tabs (Technicians Only) */}
                {!isAdmin && (
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                        <button
                            type="button"
                            onClick={() => {
                                setScopeFilter("all");
                                setCurrentPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                scopeFilter === "all"
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Semua Tiket Bengkel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setScopeFilter("my");
                                setCurrentPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                scopeFilter === "my"
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Tiket Saya
                        </button>
                    </div>
                )}

                {/* Status Filter Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => {
                            setFilter("");
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            !filter 
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            filter === "aktif" 
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm" 
                                : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                        }`}
                    >
                        Tiket Aktif
                    </button>
                    {Object.entries(STATUS_LABELS).map(([key, val]) => {
                        const showBadge = key === "diterima" && unassignedCount > 0 && !isAdmin;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setFilter(key);
                                    setCurrentPage(1);
                                }}
                                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                    filter === key 
                                        ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                {val.label}
                                {showBadge && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                        {unassignedCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    {/* CRM Garansi H-3 Filter */}
                    <button
                        type="button"
                        onClick={() => {
                            setFilter("garansi_expiring");
                            setSlaFilter("");
                            setCurrentPage(1);
                        }}
                        className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                            filter === "garansi_expiring" 
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm" 
                                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Garansi H-3 CRM ({expiringWarrantyCount})</span>
                    </button>

                    {/* SLA Express Queue Filter */}
                    <button
                        type="button"
                        onClick={() => {
                            setSlaFilter(slaFilter === "express" ? "" : "express");
                            setCurrentPage(1);
                        }}
                        className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                            slaFilter === "express" 
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm font-bold" 
                                : "bg-white text-amber-800 border-amber-300 hover:bg-amber-50"
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Express Queue ({expressCount})</span>
                    </button>

                    {/* SLA Overdue Filter */}
                    <button
                        type="button"
                        onClick={() => {
                            setSlaFilter(slaFilter === "overdue" ? "" : "overdue");
                            setCurrentPage(1);
                        }}
                        className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                            slaFilter === "overdue" 
                                ? "bg-rose-600 text-white border-rose-600 shadow-sm font-bold" 
                                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                        }`}
                    >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        <span>Overdue SLA ({overdueCount})</span>
                    </button>
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
                            searchTerm || filter || slaFilter
                                ? "Tidak ada tiket yang cocok dengan filter atau kata kunci pencarian Anda." 
                                : "Belum ada tiket servis yang dibuat di bengkel."
                        }
                        actionLabel={searchTerm || filter || slaFilter ? "Reset Filter" : (isAdmin ? "Buat Tiket Baru" : undefined)}
                        onAction={searchTerm || filter || slaFilter ? () => { setSearchTerm(""); setFilter(""); setSlaFilter(""); setCurrentPage(1); } : () => window.location.assign("/tiket-servis/tambah")}
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
                            <tr>
                                <th className="px-6 py-3.5">No Tiket</th>
                                <th className="px-6 py-3.5">Tgl Masuk</th>
                                <th className="px-6 py-3.5">Customer</th>
                                <th className="px-6 py-3.5">Perangkat</th>
                                <th className="px-6 py-3.5">Target & SLA</th>
                                <th className="px-6 py-3.5">Teknisi</th>
                                <th className="px-6 py-3.5">Status & QC</th>
                                <th className="px-6 py-3.5 text-right w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tikets.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{t.nomor_tiket}</td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>
                                                {t.created_at
                                                    ? new Date(t.created_at).toLocaleDateString("id-ID", {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                      })
                                                    : "-"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{t.perangkat?.customer?.nama || "-"}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span>{t.perangkat?.merek} {t.perangkat?.model}</span>
                                            {t.defect_map?.items?.length > 0 && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title={`${t.defect_map.items.length} cacat fisik tercatat`}>
                                                    <Laptop className="w-2.5 h-2.5" />
                                                    {t.defect_map.items.length} Defek
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <SlaBadge tiket={t} />
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{t.teknisi?.nama || "-"}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_LABELS[t.status]?.color || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                {STATUS_LABELS[t.status]?.label || t.status}
                                            </span>
                                            {t.checklist_qc?.passed_qc && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Telah Lulus QC">
                                                    <Award className="w-3 h-3 text-emerald-600" />
                                                    QC
                                                </span>
                                            )}
                                            {t.warranty_status?.status === "aktif" && t.warranty_status?.sisaHari <= 7 && t.warranty_status?.sisaHari >= 0 && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300" title={`Garansi tersisa ${t.warranty_status.sisaHari} hari`}>
                                                    <Clock className="w-3 h-3 text-amber-700" />
                                                    H-{t.warranty_status.sisaHari}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end">
                                            <Link
                                                to={`/tiket-servis/${t.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-xs border border-transparent hover:border-blue-100"
                                            >
                                                <span>Detail</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </TableContainer>
        </div>
    );
}
