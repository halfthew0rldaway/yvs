import toast from 'react-hot-toast';
import { useState, useEffect, useCallback, useTransition, useDeferredValue, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Search, Plus, Edit2, Trash2, Users, Eye, MonitorSmartphone, X, Award, Filter, ArrowUpDown, RotateCcw, Archive } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";
import CustomerDetailModal from "../../components/CustomerDetailModal";
import PerangkatDetailModal from "../../components/PerangkatDetailModal";
import CustomerBadges from "../../components/CustomerBadges";
import CustomerBadgeGuideModal from "../../components/CustomerBadgeGuideModal";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";
import { PERSONALITY_TYPES } from "../../constants/personalityTypes";
export { PERSONALITY_TYPES };

// Memoized Table Row to prevent re-rendering all rows on isolated state updates
const CustomerRow = memo(function CustomerRow({ 
    customer, 
    rowNumber, 
    onSelect, 
    onDelete, 
    onRestore,
    canManage,
    onCustomerUpdated 
}) {
    const personality = PERSONALITY_TYPES[customer.tipe_kepribadian] || PERSONALITY_TYPES["Netral"];
    const isArchived = customer.is_active === false;

    return (
        <tr 
            onClick={(e) => {
                // Cegah klik dari React Portal (seperti modal badge/dialog) memicu row click
                if (!e.currentTarget.contains(e.target)) return;
                if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                onSelect(customer.id);
            }}
            className={`hover:bg-blue-50/40 cursor-pointer transition-colors group ${isArchived ? 'bg-slate-50/60 opacity-80 hover:opacity-100' : ''}`}
        >
            <td className="px-6 py-4 text-slate-400 font-mono text-xs">{rowNumber}</td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => onSelect(customer.id)}
                        className={`font-bold transition-colors text-left group-hover:underline block cursor-pointer ${
                            isArchived ? 'text-slate-600 line-through decoration-slate-400' : 'text-slate-900 hover:text-blue-600'
                        }`}
                        title="Lihat detail data pelanggan & perangkat miliknya"
                    >
                        {customer.nama}
                    </button>
                    {isArchived && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Archive className="w-2.5 h-2.5" />
                            Diarsipkan
                        </span>
                    )}
                </div>
                {customer.catatan_khusus && (
                    <p className="text-2xs text-slate-500 truncate max-w-[240px] mt-0.5" title={customer.catatan_khusus}>
                        <span className="text-slate-400 font-medium">Catatan:</span> {customer.catatan_khusus}
                    </p>
                )}
            </td>
            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <CustomerBadges 
                    customer={customer} 
                    variant="icon-only" 
                    size="normal" 
                    onCustomerUpdated={onCustomerUpdated}
                />
            </td>
            <td className="px-6 py-4">
                <span 
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${personality.badge} whitespace-nowrap shrink-0 w-fit max-w-max`}
                    title={personality.trait}
                >
                    {personality.label}
                </span>
            </td>
            <td className="px-6 py-4 text-slate-600 font-mono text-xs">{customer.nomor_telepon}</td>
            <td className="px-6 py-4 text-slate-500 truncate max-w-[240px]">{customer.alamat || "-"}</td>
            <td className="px-6 py-4 text-center">
                <button
                    type="button"
                    onClick={() => onSelect(customer.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs transition-all hover:scale-105 cursor-pointer whitespace-nowrap shrink-0 w-fit max-w-max"
                    title="Buka daftar perangkat milik pelanggan ini"
                >
                    <MonitorSmartphone className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{customer.perangkat?.length || 0} Unit</span>
                </button>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={() => onSelect(customer.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Lihat Detail Customer & Perangkat"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    {canManage && <Link
                        to={`/customer/edit/${customer.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </Link>}
                    {canManage && (isArchived ? (
                        <button
                            type="button"
                            onClick={() => onRestore(customer)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Aktifkan Kembali Pelanggan (Restore)"
                        >
                            <RotateCcw className="w-4 h-4 text-emerald-600" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onDelete(customer)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Arsipkan / Hapus"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </td>
        </tr>
    );
});
/**
 * Mobile Card view for Customer list (< sm breakpoint).
 * Table columns flatten into a stacked, tappable card so nothing overflows.
 */
const CustomerCard = memo(function CustomerCard({
    customer,
    rowNumber,
    onSelect,
    onDelete,
    onRestore,
    canManage,
    onCustomerUpdated
}) {
    const personality = PERSONALITY_TYPES[customer.tipe_kepribadian] || PERSONALITY_TYPES["Netral"];
    const isArchived = customer.is_active === false;

    return (
        <div
            onClick={(e) => {
                if (!e.currentTarget.contains(e.target)) return;
                if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                onSelect(customer.id);
            }}
            className={`p-3.5 border-b border-slate-100 last:border-b-0 active:bg-blue-50/60 transition-colors cursor-pointer mobile-card-row tap-press ${
                isArchived ? "bg-slate-50/60" : ""
            }`}
        >
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-3xs font-mono text-slate-400 shrink-0">#{rowNumber}</span>
                        <button
                            type="button"
                            onClick={() => onSelect(customer.id)}
                            className={`font-bold text-sm text-left truncate cursor-pointer ${
                                isArchived ? "text-slate-600 line-through decoration-slate-400" : "text-slate-900"
                            }`}
                        >
                            {customer.nama}
                        </button>
                        {isArchived && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-4xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Archive className="w-2.5 h-2.5" />
                                Arsip
                            </span>
                        )}
                    </div>
                    <p className="text-2xs text-slate-500 font-mono mt-0.5">{customer.nomor_telepon || "-"}</p>
                </div>
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <CustomerBadges
                        customer={customer}
                        variant="icon-only"
                        size="normal"
                        onCustomerUpdated={onCustomerUpdated}
                    />
                </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold border ${personality.badge}`}>
                    {personality.label}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-3xs">
                    <MonitorSmartphone className="w-3 h-3 shrink-0" />
                    {customer.perangkat?.length || 0} Unit
                </span>
            </div>

            {customer.alamat && (
                <p className="text-3xs text-slate-500 mt-1.5 line-clamp-2">{customer.alamat}</p>
            )}

            {/* Action row */}
            <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100/80">
                <button
                    type="button"
                    onClick={() => onSelect(customer.id)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Lihat Detail Customer & Perangkat"
                >
                    <Eye className="w-4 h-4" />
                </button>
                {canManage && <Link
                    to={`/customer/edit/${customer.id}`}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit"
                >
                    <Edit2 className="w-4 h-4" />
                </Link>}
                {canManage && (isArchived ? (
                    <button
                        type="button"
                        onClick={() => onRestore(customer)}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Aktifkan Kembali Pelanggan (Restore)"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => onDelete(customer)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Arsipkan / Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                ))}
            </div>
        </div>
    );
});



export default function CustomerList() {
    const { hasPermission } = useAuth();
    const canManage = hasPermission("customers.manage");
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("active"); // "active" | "archived" | "all"
    const [counts, setCounts] = useState({ totalActive: 0, totalArchived: 0, totalAll: 0 });
    const [tipeKepribadianFilter, setTipeKepribadianFilter] = useState("all");
    const [hasPerangkatFilter, setHasPerangkatFilter] = useState("all");
    const [sortBy, setSortBy] = useState("created_at_desc");
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [selectedPerangkatId, setSelectedPerangkatId] = useState(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Standardized Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        fetchCustomers(search, currentPage, tipeKepribadianFilter, hasPerangkatFilter, sortBy, statusFilter);
    }, [currentPage, pageSize, tipeKepribadianFilter, hasPerangkatFilter, sortBy, statusFilter]);

    async function fetchCustomers(
        targetSearch = search, 
        page = currentPage, 
        targetPersonality = tipeKepribadianFilter,
        targetHasPerangkat = hasPerangkatFilter,
        targetSortBy = sortBy,
        targetStatus = statusFilter
    ) {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
                sortBy: targetSortBy,
                status: targetStatus,
            };
            if (targetSearch.trim()) {
                params.search = targetSearch.trim();
            }
            if (targetPersonality !== "all") {
                params.tipe_kepribadian = targetPersonality;
            }
            if (targetHasPerangkat !== "all") {
                params.has_perangkat = targetHasPerangkat;
            }

            const res = await api.get("/customer", { params });
            if (res.data && res.data.pagination) {
                setCustomers(res.data.data);
                setTotalItems(res.data.pagination.total);
                setTotalPages(res.data.pagination.totalPages);
                if (res.data.counts) {
                    setCounts(res.data.counts);
                }
            } else if (Array.isArray(res.data)) {
                setCustomers(res.data);
                setTotalItems(res.data.length);
                setTotalPages(Math.ceil(res.data.length / pageSize) || 1);
            }
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat data customer");
        } finally {
            setLoading(false);
        }
    }

    const handleSelectCustomer = useCallback((id) => {
        setSelectedCustomerId(id);
    }, []);

    const handleDeleteClick = useCallback((customer) => {
        setDeleteTarget(customer);
    }, []);

    const handleRestoreClick = useCallback(async (customer) => {
        try {
            const res = await api.post(`/customer/${customer.id}/restore`);
            toast.success(res.data?.message || `Pelanggan "${customer.nama}" berhasil diaktifkan kembali.`);
            fetchCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengaktifkan kembali pelanggan.");
        }
    }, [search, currentPage, tipeKepribadianFilter, hasPerangkatFilter, sortBy, statusFilter, pageSize]);

    const handleCustomerUpdated = useCallback((updated) => {
        setCustomers((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    }, []);

    async function executeDelete() {
        if (!deleteTarget) return;
        try {
            const res = await api.delete(`/customer/${deleteTarget.id}`);
            toast.success(res.data?.message || "Customer berhasil diproses");
            setDeleteTarget(null);
            fetchCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses customer");
            setDeleteTarget(null);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        startTransition(() => {
            setCurrentPage(1);
            fetchCustomers(search, 1, tipeKepribadianFilter, hasPerangkatFilter, sortBy, statusFilter);
        });
    }

    function handleClearSearch() {
        setSearch("");
        startTransition(() => {
            setCurrentPage(1);
            fetchCustomers("", 1, tipeKepribadianFilter, hasPerangkatFilter, sortBy, statusFilter);
        });
    }

    function handleResetAllFilters() {
        setSearch("");
        setTipeKepribadianFilter("all");
        setHasPerangkatFilter("all");
        setSortBy("created_at_desc");
        setStatusFilter("active");
        startTransition(() => {
            setCurrentPage(1);
            fetchCustomers("", 1, "all", "all", "created_at_desc", "active");
        });
    }

    const hasActiveFilters = Boolean(
        search.trim() || 
        tipeKepribadianFilter !== "all" || 
        hasPerangkatFilter !== "all" || 
        sortBy !== "created_at_desc" ||
        statusFilter !== "active"
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Data Pelanggan</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola data pelanggan, profil komunikasi, dan unit perangkat yang terdaftar</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsGuideOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
                        title="Lihat definisi & SOP badge reputasi pelanggan"
                    >
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Panduan Badge</span>
                    </button>
                    {canManage && <Link
                        to="/customer/tambah"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Pelanggan</span>
                    </Link>}
                </div>
            </div>

            {/* Status Tabs: Pelanggan Aktif vs Diarsipkan (Soft Delete) */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter("active");
                        setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        statusFilter === "active"
                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Pelanggan Aktif</span>
                    {counts.totalActive > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            statusFilter === "active" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                            {counts.totalActive}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter("archived");
                        setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        statusFilter === "archived"
                            ? "border-amber-600 text-amber-600 bg-amber-50/50"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                >
                    <Archive className="w-4 h-4 text-amber-500" />
                    <span>Diarsipkan (Nonaktif)</span>
                    {counts.totalArchived > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            statusFilter === "archived" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                            {counts.totalArchived}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter("all");
                        setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        statusFilter === "all"
                            ? "border-slate-800 text-slate-900 bg-slate-100/50"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                >
                    <span>Semua Pelanggan</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3.5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
                        <div className="relative flex-1 min-w-0">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        handleClearSearch();
                                    }
                                }}
                                placeholder="Cari nama atau no telepon pelanggan..."
                                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all placeholder:text-slate-400"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                                    title="Hapus pencarian (Esc)"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0 cursor-pointer"
                        >
                            Cari
                        </button>
                    </form>

                    {/* Filter & Sort Dropdowns */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                        {/* Filter Tipologi Karakter */}
                        <div className="relative min-w-[145px] flex-1 sm:flex-initial">
                            <select
                                value={tipeKepribadianFilter}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setTipeKepribadianFilter(val);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="all">Semua Karakter</option>
                                <option value="Koleris">Koleris (Tegas & Cepat)</option>
                                <option value="Sanguinis">Sanguinis (Ramah & Hangat)</option>
                                <option value="Plegmatis">Plegmatis (Tenang & Santai)</option>
                                <option value="Melankolis">Melankolis (Rinci & Perfeksionis)</option>
                                <option value="Netral">Netral (Standar)</option>
                            </select>
                        </div>

                        {/* Filter Status Kepemilikan Perangkat */}
                        <div className="relative min-w-[135px] flex-1 sm:flex-initial">
                            <select
                                value={hasPerangkatFilter}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setHasPerangkatFilter(val);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="all">Semua Status Unit</option>
                                <option value="yes">Memiliki Perangkat</option>
                                <option value="no">Belum Ada Unit</option>
                            </select>
                        </div>

                        {/* Sort By Dropdown */}
                        <div className="relative min-w-[155px] flex-1 sm:flex-initial">
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSortBy(val);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="created_at_desc">Terdaftar: Terbaru</option>
                                <option value="created_at_asc">Terdaftar: Terlama</option>
                                <option value="nama_asc">Nama: A ke Z</option>
                                <option value="nama_desc">Nama: Z ke A</option>
                                <option value="perangkat_desc">Unit: Terbanyak</option>
                                <option value="perangkat_asc">Unit: Tersedikit</option>
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                                title="Reset semua filter dan pencarian"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filter Indicators */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 font-semibold text-2xs uppercase tracking-wider flex items-center gap-1">
                            <Filter className="w-3 h-3 text-blue-500" />
                            Filter Aktif:
                        </span>
                        {search.trim() && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-2xs font-semibold">
                                Kata Kunci: "{search}"
                                <button type="button" onClick={handleClearSearch} className="hover:text-blue-900 cursor-pointer">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {tipeKepribadianFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-2xs font-semibold">
                                Karakter: {tipeKepribadianFilter}
                                <button type="button" onClick={() => setTipeKepribadianFilter("all")} className="hover:text-indigo-900 cursor-pointer">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {hasPerangkatFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xs font-semibold">
                                Unit: {hasPerangkatFilter === "yes" ? "Memiliki Perangkat" : "Belum Ada Unit"}
                                <button type="button" onClick={() => setHasPerangkatFilter("all")} className="hover:text-emerald-900 cursor-pointer">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {sortBy !== "created_at_desc" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-2xs font-semibold">
                                Urutan: {
                                    sortBy === "created_at_asc" ? "Terdaftar Terlama" :
                                    sortBy === "nama_asc" ? "Nama A - Z" :
                                    sortBy === "nama_desc" ? "Nama Z - A" :
                                    sortBy === "perangkat_desc" ? "Unit Terbanyak" : "Unit Tersedikit"
                                }
                                <button type="button" onClick={() => setSortBy("created_at_desc")} className="hover:text-purple-900 cursor-pointer">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        <span className="text-slate-400 text-2xs ml-auto">
                            Ditemukan {totalItems} pelanggan
                        </span>
                    </div>
                )}
            </div>

            {/* Standardized Contained Table with Pagination */}
            <TableContainer
                footer={
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={(p) => setCurrentPage(p)}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                        unitLabel="pelanggan"
                        disabled={loading}
                    />
                }
            >
                {loading ? (
                    <TableLoadingState message="Memuat daftar pelanggan..." />
                ) : customers.length === 0 ? (
                    <TableEmptyState
                        icon={Users}
                        title="Tidak ada data pelanggan"
                        description={
                            hasActiveFilters
                                ? "Tidak ditemukan pelanggan yang cocok dengan kriteria pencarian dan filter yang dipilih."
                                : "Belum ada data pelanggan yang terdaftar di sistem bengkel."
                        }
                        actionLabel={hasActiveFilters ? "Reset Semua Filter" : canManage ? "Tambah Pelanggan Baru" : undefined}
                        onAction={hasActiveFilters ? handleResetAllFilters : canManage ? () => navigate("/customer/tambah") : undefined}
                    />
                ) : (
                    <>
                        {/* Mobile Card View (< sm) */}
                        <div className="sm:hidden">
                            {customers.map((c, i) => (
                                <CustomerCard
                                    key={c.id}
                                    customer={c}
                                    rowNumber={(currentPage - 1) * pageSize + i + 1}
                                    onSelect={handleSelectCustomer}
                                    onDelete={handleDeleteClick}
                                    onRestore={handleRestoreClick}
                                    canManage={canManage}
                                    onCustomerUpdated={handleCustomerUpdated}
                                />
                            ))}
                        </div>

                        {/* Desktop Table View (>= sm) */}
                        <table className="hidden sm:table w-full text-sm text-left whitespace-nowrap">
                            <thead className="table-header">
                                <tr>
                                    <th className="px-6 py-3.5 w-16">No</th>
                                    <th className="px-6 py-3.5">Nama Pelanggan</th>
                                    <th className="px-6 py-3.5">Reputasi & Badge</th>
                                    <th className="px-6 py-3.5">Tipologi Karakter</th>
                                    <th className="px-6 py-3.5">Nomor Telepon</th>
                                    <th className="px-6 py-3.5">Alamat</th>
                                    <th className="px-6 py-3.5 text-center">Unit Perangkat</th>
                                    <th className="px-6 py-3.5 text-right w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.map((c, i) => (
                                    <CustomerRow
                                        key={c.id}
                                        customer={c}
                                        rowNumber={(currentPage - 1) * pageSize + i + 1}
                                        onSelect={handleSelectCustomer}
                                        onDelete={handleDeleteClick}
                                        onRestore={handleRestoreClick}
                                        canManage={canManage}
                                        onCustomerUpdated={handleCustomerUpdated}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </TableContainer>

            {/* Modals mounted conditionally for zero idle memory footprint */}
            {deleteTarget && (
                <ConfirmModal
                    isOpen={!!deleteTarget}
                    title={
                        ((deleteTarget.perangkat || []).length > 0)
                            ? "Arsipkan Pelanggan"
                            : "Hapus / Arsipkan Pelanggan"
                    }
                    message={
                        ((deleteTarget.perangkat || []).length > 0)
                            ? `Pelanggan "${deleteTarget.nama}" memiliki riwayat ${(deleteTarget.perangkat || []).length} unit perangkat servis. Pelanggan akan dialihkan ke status Diarsipkan (Nonaktif). Riwayat tiket servis, invoice, dan audit keuangan tetap aman tersimpan demi integritas laporan bengkel.`
                            : `Apakah Anda yakin ingin mengarsipkan atau menghapus data pelanggan "${deleteTarget.nama}"?`
                    }
                    onConfirm={executeDelete}
                    onCancel={() => setDeleteTarget(null)}
                    confirmText={
                        ((deleteTarget.perangkat || []).length > 0)
                            ? "Arsipkan Pelanggan"
                            : "Arsipkan / Hapus"
                    }
                    isDanger={false}
                />
            )}

            {/* Modal Detail Customer & Perangkat */}
            {selectedCustomerId && (
                <CustomerDetailModal
                    customerId={selectedCustomerId}
                    isOpen={!!selectedCustomerId}
                    onClose={() => setSelectedCustomerId(null)}
                    onSelectPerangkat={(p) => setSelectedPerangkatId(p.id)}
                />
            )}

            {/* Modal Detail Perangkat & Rekam Medis */}
            {selectedPerangkatId && (
                <PerangkatDetailModal
                    perangkatId={selectedPerangkatId}
                    isOpen={!!selectedPerangkatId}
                    onClose={() => setSelectedPerangkatId(null)}
                    onSelectCustomer={(cId) => setSelectedCustomerId(cId)}
                />
            )}

            {/* Modal Panduan Badge Reputasi Pelanggan */}
            {isGuideOpen && (
                <CustomerBadgeGuideModal
                    isOpen={isGuideOpen}
                    onClose={() => setIsGuideOpen(false)}
                />
            )}
        </div>
    );
}

