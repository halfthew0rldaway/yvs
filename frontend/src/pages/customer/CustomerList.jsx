import toast from 'react-hot-toast';
import { useState, useEffect, useCallback, useTransition, useDeferredValue, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Search, Plus, Edit2, Trash2, Users, Eye, MonitorSmartphone, X, Award, Filter, ArrowUpDown, RotateCcw } from "lucide-react";
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
    onCustomerUpdated 
}) {
    const personality = PERSONALITY_TYPES[customer.tipe_kepribadian] || PERSONALITY_TYPES["Netral"];

    return (
        <tr 
            onClick={(e) => {
                // Cegah klik dari React Portal (seperti modal badge/dialog) memicu row click
                if (!e.currentTarget.contains(e.target)) return;
                if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                onSelect(customer.id);
            }}
            className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
        >
            <td className="px-6 py-4 text-slate-400 font-mono text-xs">{rowNumber}</td>
            <td className="px-6 py-4">
                <button
                    type="button"
                    onClick={() => onSelect(customer.id)}
                    className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left group-hover:underline block cursor-pointer"
                    title="Lihat detail data pelanggan & perangkat miliknya"
                >
                    {customer.nama}
                </button>
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
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${personality.badge}`}
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs transition-all hover:scale-105 cursor-pointer"
                    title="Buka daftar perangkat milik pelanggan ini"
                >
                    <MonitorSmartphone className="w-3.5 h-3.5" />
                    <span>{customer.perangkat?.length || 0} Unit</span>
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
                    <Link
                        to={`/customer/edit/${customer.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => onDelete(customer)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

export default function CustomerList() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
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
        fetchCustomers(search, currentPage, tipeKepribadianFilter, hasPerangkatFilter, sortBy);
    }, [currentPage, pageSize, tipeKepribadianFilter, hasPerangkatFilter, sortBy]);

    async function fetchCustomers(
        targetSearch = search, 
        page = currentPage, 
        targetPersonality = tipeKepribadianFilter,
        targetHasPerangkat = hasPerangkatFilter,
        targetSortBy = sortBy
    ) {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
                sortBy: targetSortBy,
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

    const handleCustomerUpdated = useCallback((updated) => {
        setCustomers((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    }, []);

    async function executeDelete() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/customer/${deleteTarget.id}`);
            toast.success("Customer berhasil dihapus");
            setDeleteTarget(null);
            fetchCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus");
            setDeleteTarget(null);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        startTransition(() => {
            setCurrentPage(1);
            fetchCustomers(search, 1, tipeKepribadianFilter, hasPerangkatFilter, sortBy);
        });
    }

    function handleClearSearch() {
        setSearch("");
        startTransition(() => {
            setCurrentPage(1);
            fetchCustomers("", 1, tipeKepribadianFilter, hasPerangkatFilter, sortBy);
        });
    }

    function handleResetAllFilters() {
        setSearch("");
        setTipeKepribadianFilter("all");
        setHasPerangkatFilter("all");
        setSortBy("created_at_desc");
        startTransition(() => {
            setCurrentPage(1);
            fetchCustomers("", 1, "all", "all", "created_at_desc");
        });
    }

    const hasActiveFilters = Boolean(
        search.trim() || 
        tipeKepribadianFilter !== "all" || 
        hasPerangkatFilter !== "all" || 
        sortBy !== "created_at_desc"
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
                    <Link
                        to="/customer/tambah"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Pelanggan</span>
                    </Link>
                </div>
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
                        actionLabel={hasActiveFilters ? "Reset Semua Filter" : "Tambah Pelanggan Baru"}
                        onAction={hasActiveFilters ? handleResetAllFilters : () => navigate("/customer/tambah")}
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
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
                                    onCustomerUpdated={handleCustomerUpdated}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </TableContainer>

            {/* Modals mounted conditionally for zero idle memory footprint */}
            {deleteTarget && (
                <ConfirmModal
                    isOpen={!!deleteTarget}
                    title="Hapus Customer"
                    message={`Apakah Anda yakin ingin menghapus pelanggan "${deleteTarget?.nama}"? Data yang sudah dihapus tidak dapat dikembalikan.`}
                    onConfirm={executeDelete}
                    onCancel={() => setDeleteTarget(null)}
                    confirmText="Hapus"
                    isDanger={true}
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

