import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Search, Plus, Edit2, Trash2, Users, Eye, MonitorSmartphone, X, Award } from "lucide-react";
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

export default function CustomerList() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
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

    useEffect(() => {
        fetchCustomers();
    }, [currentPage, pageSize]);

    async function fetchCustomers(targetSearch = search, page = currentPage) {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
            };
            if (targetSearch.trim()) {
                params.search = targetSearch.trim();
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

    function handleDeleteClick(customer) {
        setDeleteTarget(customer);
    }

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
        setCurrentPage(1);
        fetchCustomers(search, 1);
    }

    function handleClearSearch() {
        setSearch("");
        setCurrentPage(1);
        fetchCustomers("", 1);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Pelanggan</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Kelola data pelanggan, profil komunikasi, dan unit perangkat yang terdaftar</p>
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
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-xl">
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
                            search
                                ? `Tidak ditemukan pelanggan dengan kata kunci "${search}".`
                                : "Belum ada data pelanggan yang terdaftar di sistem bengkel."
                        }
                        actionLabel={search ? "Reset Pencarian" : "Tambah Pelanggan Baru"}
                        onAction={search ? handleClearSearch : () => navigate("/customer/tambah")}
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
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
                            {customers.map((c, i) => {
                                const personality = PERSONALITY_TYPES[c.tipe_kepribadian] || PERSONALITY_TYPES["Netral"];
                                const rowNumber = (currentPage - 1) * pageSize + i + 1;

                                return (
                                    <tr 
                                        key={c.id} 
                                        onClick={(e) => {
                                            // Cegah klik dari React Portal (seperti modal badge/dialog yang di-render di document.body) memicu row click
                                            if (!e.currentTarget.contains(e.target)) return;
                                            if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                            setSelectedCustomerId(c.id);
                                        }}
                                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{rowNumber}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCustomerId(c.id)}
                                                className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left group-hover:underline block"
                                                title="Lihat detail data pelanggan & perangkat miliknya"
                                            >
                                                {c.nama}
                                            </button>
                                            {c.catatan_khusus && (
                                                <p className="text-[11px] text-slate-500 truncate max-w-[240px] mt-0.5" title={c.catatan_khusus}>
                                                    <span className="text-slate-400 font-medium">Catatan:</span> {c.catatan_khusus}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <CustomerBadges 
                                                customer={c} 
                                                variant="icon-only" 
                                                size="normal" 
                                                onCustomerUpdated={(updated) => {
                                                    setCustomers(prev => prev.map(item => item.id === updated.id ? { ...item, ...updated } : item));
                                                }}
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
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{c.nomor_telepon}</td>
                                        <td className="px-6 py-4 text-slate-500 truncate max-w-[240px]">{c.alamat || "-"}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCustomerId(c.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs transition-all hover:scale-105"
                                                title="Buka daftar perangkat milik pelanggan ini"
                                            >
                                                <MonitorSmartphone className="w-3.5 h-3.5" />
                                                <span>{c.perangkat?.length || 0} Unit</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCustomerId(c.id)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Lihat Detail Customer & Perangkat"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    to={`/customer/edit/${c.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(c)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </TableContainer>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Hapus Customer"
                message={`Apakah Anda yakin ingin menghapus pelanggan "${deleteTarget?.nama}"? Data yang sudah dihapus tidak dapat dikembalikan.`}
                onConfirm={executeDelete}
                onCancel={() => setDeleteTarget(null)}
                confirmText="Hapus"
                isDanger={true}
            />

            {/* Modal Detail Customer & Perangkat */}
            <CustomerDetailModal
                customerId={selectedCustomerId}
                isOpen={!!selectedCustomerId}
                onClose={() => setSelectedCustomerId(null)}
                onSelectPerangkat={(p) => setSelectedPerangkatId(p.id)}
            />

            {/* Modal Detail Perangkat & Rekam Medis */}
            <PerangkatDetailModal
                perangkatId={selectedPerangkatId}
                isOpen={!!selectedPerangkatId}
                onClose={() => setSelectedPerangkatId(null)}
                onSelectCustomer={(cId) => setSelectedCustomerId(cId)}
            />

            {/* Modal Panduan Badge Reputasi Pelanggan */}
            <CustomerBadgeGuideModal
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
            />
        </div>
    );
}

