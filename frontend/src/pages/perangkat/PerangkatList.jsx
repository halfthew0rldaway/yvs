import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Plus, Edit2, Trash2, MonitorSmartphone, Search, Filter, History, User, Eye, X, RotateCcw } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";
import CustomerDetailModal from "../../components/CustomerDetailModal";
import PerangkatDetailModal from "../../components/PerangkatDetailModal";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";

export default function PerangkatList() {
    const navigate = useNavigate();
    const [perangkats, setPerangkats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [jenisFilter, setJenisFilter] = useState("");
    const [uniqueJenis, setUniqueJenis] = useState([]);

    // Modals
    const [selectedPerangkatId, setSelectedPerangkatId] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);

    // Standardized Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        // Fetch list of unique jenis once on mount for filter dropdown
        api.get("/perangkat")
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                const jenisSet = [...new Set(list.map(p => p.jenis_perangkat).filter(Boolean))];
                setUniqueJenis(jenisSet);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchPerangkats();
    }, [currentPage, pageSize, jenisFilter]);

    async function fetchPerangkats(targetSearch = searchQuery, page = currentPage) {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
            };
            if (targetSearch.trim()) {
                params.search = targetSearch.trim();
            }
            if (jenisFilter) {
                params.jenis_perangkat = jenisFilter;
            }

            const res = await api.get("/perangkat", { params });
            if (res.data && res.data.pagination) {
                setPerangkats(res.data.data);
                setTotalItems(res.data.pagination.total);
                setTotalPages(res.data.pagination.totalPages);
            } else if (Array.isArray(res.data)) {
                setPerangkats(res.data);
                setTotalItems(res.data.length);
                setTotalPages(Math.ceil(res.data.length / pageSize) || 1);
            }
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat data perangkat");
        } finally {
            setLoading(false);
        }
    }

    function handleDeleteClick(perangkat) {
        setDeleteTarget(perangkat);
    }

    async function executeDelete() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/perangkat/${deleteTarget.id}`);
            toast.success("Perangkat berhasil dihapus");
            setDeleteTarget(null);
            fetchPerangkats();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus");
            setDeleteTarget(null);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        setCurrentPage(1);
        fetchPerangkats(searchQuery, 1);
    }

    function handleResetFilters() {
        setSearchQuery("");
        setJenisFilter("");
        setCurrentPage(1);
        fetchPerangkats("", 1);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Perangkat</h1>
                    <p className="text-sm text-slate-500 mt-1">Daftar perangkat beserta riwayat & rekam medis servis</p>
                </div>
                <Link
                    to="/perangkat/tambah"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Perangkat</span>
                </Link>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama customer, merek, model, atau SN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                handleResetFilters();
                            }
                        }}
                        className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm placeholder:text-slate-400"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setCurrentPage(1);
                                fetchPerangkats("", 1);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                            title="Hapus pencarian (Esc)"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </form>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial sm:min-w-[190px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                            value={jenisFilter}
                            onChange={(e) => {
                                setJenisFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm appearance-none cursor-pointer"
                        >
                            <option value="">Semua Jenis Perangkat</option>
                            {uniqueJenis.map((jenis) => (
                                <option key={jenis} value={jenis}>{jenis}</option>
                            ))}
                        </select>
                    </div>

                    {(searchQuery || jenisFilter) && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                            title="Reset semua filter"
                        >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>Reset</span>
                        </button>
                    )}
                </div>
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
                        unitLabel="perangkat"
                        disabled={loading}
                    />
                }
            >
                {loading ? (
                    <TableLoadingState message="Memuat daftar perangkat & rekam medis..." />
                ) : perangkats.length === 0 ? (
                    <TableEmptyState
                        icon={MonitorSmartphone}
                        title="Perangkat Tidak Ditemukan"
                        description={
                            searchQuery || jenisFilter
                                ? "Tidak ada perangkat yang cocok dengan filter atau kata kunci pencarian."
                                : "Belum ada data perangkat yang terdaftar di sistem."
                        }
                        actionLabel={searchQuery || jenisFilter ? "Reset Filter" : "Tambah Perangkat Baru"}
                        onAction={searchQuery || jenisFilter ? handleResetFilters : () => navigate("/perangkat/tambah")}
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
                            <tr>
                                <th className="px-6 py-3.5 w-16">No</th>
                                <th className="px-6 py-3.5">Pemilik (Customer)</th>
                                <th className="px-6 py-3.5">Jenis</th>
                                <th className="px-6 py-3.5">Merek & Model</th>
                                <th className="px-6 py-3.5">Serial Number</th>
                                <th className="px-6 py-3.5 text-center">Rekam Jejak Servis</th>
                                <th className="px-6 py-3.5 text-right w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {perangkats.map((p, i) => {
                                const serviceCount = p._count?.tiket_servis || 0;
                                const rowNumber = (currentPage - 1) * pageSize + i + 1;

                                return (
                                    <tr 
                                        key={p.id} 
                                        onClick={(e) => {
                                            if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                            setSelectedPerangkatId(p.id);
                                        }}
                                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{rowNumber}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCustomerId(p.customer?.id)}
                                                className="font-bold text-slate-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 text-left group-hover:underline"
                                                title="Klik untuk melihat profil pemilik & perangkat lain miliknya"
                                            >
                                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate max-w-[200px]" title={p.customer?.nama}>{p.customer?.nama || "Tanpa Nama"}</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                                {p.jenis_perangkat}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPerangkatId(p.id)}
                                                className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-left truncate max-w-[220px] block"
                                                title={`Klik untuk melihat detail ${p.merek} ${p.model} & rekam jejak servis`}
                                            >
                                                {p.merek} {p.model}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{p.serial_number || "-"}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPerangkatId(p.id)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${
                                                    serviceCount > 0 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300' 
                                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                                }`}
                                                title="Buka rekam jejak servis & detail unit ini"
                                            >
                                                <History className="w-3.5 h-3.5" />
                                                <span>{serviceCount}x Servis</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPerangkatId(p.id)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Lihat Detail & Rekam Medis"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    to={`/perangkat/edit/${p.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Perangkat"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(p)}
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

            {/* Modal Detail Perangkat & Rekam Medis */}
            <PerangkatDetailModal
                perangkatId={selectedPerangkatId}
                isOpen={!!selectedPerangkatId}
                onClose={() => setSelectedPerangkatId(null)}
                onSelectCustomer={(cId) => setSelectedCustomerId(cId)}
                onSelectPerangkat={(p) => setSelectedPerangkatId(p.id)}
            />

            {/* Modal Detail Customer & Perangkat Miliknya */}
            <CustomerDetailModal
                customerId={selectedCustomerId}
                isOpen={!!selectedCustomerId}
                onClose={() => setSelectedCustomerId(null)}
                onSelectPerangkat={(p) => setSelectedPerangkatId(p.id)}
            />

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Hapus Perangkat"
                message={`Apakah Anda yakin ingin menghapus perangkat "${deleteTarget?.model}"?`}
                onConfirm={executeDelete}
                onCancel={() => setDeleteTarget(null)}
                confirmText="Hapus"
                isDanger={true}
            />
        </div>
    );
}

