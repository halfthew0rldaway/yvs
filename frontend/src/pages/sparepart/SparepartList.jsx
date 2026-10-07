import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { Plus, Edit2, Trash2, Wrench, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function SparepartList() {
    const { isAdmin } = useAuth();
    const [spareparts, setSpareparts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Filter & Sort States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState("nama_asc");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategories, selectedBrands, sortBy]);

    useEffect(() => {
        fetchSpareparts();
    }, []);

    async function fetchSpareparts() {
        try {
            const res = await api.get("/sparepart");
            setSpareparts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleDeleteClick(sparepart) {
        setDeleteTarget(sparepart);
    }

    async function executeDelete() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/sparepart/${deleteTarget.id}`);
            setSpareparts(spareparts.filter((s) => s.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus");
            setDeleteTarget(null);
        }
    }

    const categoriesRaw = new Set();
    const brandsRaw = new Set();
    spareparts.forEach(s => {
        s.kategori.split(',').map(c => c.trim()).forEach(c => categoriesRaw.add(c));
        if (s.brand?.nama) brandsRaw.add(s.brand.nama);
    });
    const categories = Array.from(categoriesRaw).sort();
    const brands = Array.from(brandsRaw).sort();

    // Apply Filter & Sort
    let processedSpareparts = spareparts.filter(s => {
        const brandNameStr = s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "";
        const fullName = brandNameStr + s.nama;
        const matchSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase());
        const itemCats = s.kategori.split(',').map(c => c.trim());
        const matchCategory = selectedCategories.length === 0 || selectedCategories.some(c => itemCats.includes(c));
        const matchBrand = selectedBrands.length === 0 || (s.brand && selectedBrands.includes(s.brand.nama));
        return matchSearch && matchCategory && matchBrand;
    });

    processedSpareparts.sort((a, b) => {
        const aBrandStr = a.brand?.nama && a.brand.nama.toLowerCase() !== "lainnya" ? a.brand.nama + " " : "";
        const bBrandStr = b.brand?.nama && b.brand.nama.toLowerCase() !== "lainnya" ? b.brand.nama + " " : "";
        const aName = aBrandStr + a.nama;
        const bName = bBrandStr + b.nama;
        switch (sortBy) {
            case "nama_asc": return aName.localeCompare(bName);
            case "nama_desc": return bName.localeCompare(aName);
            case "stok_asc": return a.stok - b.stok;
            case "stok_desc": return b.stok - a.stok;
            case "harga_asc": return a.harga - b.harga;
            case "harga_desc": return b.harga - a.harga;
            default: return 0;
        }
    });

    // Apply Pagination
    const totalPages = Math.ceil(processedSpareparts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSpareparts = processedSpareparts.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Sparepart</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola stok dan harga suku cadang</p>
                </div>
                {isAdmin && (
                    <Link
                        to="/sparepart/tambah"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Sparepart</span>
                    </Link>
                )}
            </div>

            {/* Filter & Sort Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama sparepart..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>

                    {/* Filter Category (Multi-select e-commerce style) */}
                    <div className="w-full md:w-56 relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700 truncate">
                                    {selectedCategories.length === 0 
                                        ? "Kategori" 
                                        : `${selectedCategories.length} Kategori`}
                                </span>
                            </div>
                        </button>

                        {isFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                                <div className="absolute z-20 mt-2 w-full min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-3">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Filter Kategori</h4>
                                    <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {categories.map(c => (
                                            <label key={c} className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={selectedCategories.includes(c)}
                                                        onChange={() => {
                                                            if (selectedCategories.includes(c)) {
                                                                setSelectedCategories(selectedCategories.filter(cat => cat !== c));
                                                            } else {
                                                                setSelectedCategories([...selectedCategories, c]);
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-4 h-4 border border-slate-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                                                    <svg className="w-3 h-3 text-white absolute left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{c}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedCategories.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 px-2">
                                            <button 
                                                onClick={() => setSelectedCategories([])}
                                                className="text-xs font-semibold text-red-600 hover:text-red-700 w-full text-left"
                                            >
                                                Reset Filter
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Filter Brand */}
                    <div className="w-full md:w-56 relative">
                        <button
                            onClick={() => setIsBrandFilterOpen(!isBrandFilterOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700 truncate">
                                    {selectedBrands.length === 0 
                                        ? "Merek" 
                                        : `${selectedBrands.length} Merek`}
                                </span>
                            </div>
                        </button>

                        {isBrandFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsBrandFilterOpen(false)}></div>
                                <div className="absolute z-20 mt-2 w-full min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-3">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Filter Merek</h4>
                                    <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {brands.map(b => (
                                            <label key={b} className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={selectedBrands.includes(b)}
                                                        onChange={() => {
                                                            if (selectedBrands.includes(b)) {
                                                                setSelectedBrands(selectedBrands.filter(brand => brand !== b));
                                                            } else {
                                                                setSelectedBrands([...selectedBrands, b]);
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-4 h-4 border border-slate-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                                                    <svg className="w-3 h-3 text-white absolute left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{b}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedBrands.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 px-2">
                                            <button 
                                                onClick={() => setSelectedBrands([])}
                                                className="text-xs font-semibold text-red-600 hover:text-red-700 w-full text-left"
                                            >
                                                Reset Filter
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sort */}
                    <div className="w-full md:w-56 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ArrowUpDown className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="block w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white transition-colors"
                        >
                            <option value="nama_asc">Nama (A-Z)</option>
                            <option value="nama_desc">Nama (Z-A)</option>
                            <option value="stok_asc">Stok (Terkecil)</option>
                            <option value="stok_desc">Stok (Terbanyak)</option>
                            <option value="harga_asc">Harga (Termurah)</option>
                            <option value="harga_desc">Harga (Termahal)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : spareparts.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
                                <Wrench className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Tidak ada sparepart</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Data sparepart masih kosong.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">No</th>
                                    <th className="px-6 py-4 font-semibold">Nama Sparepart</th>
                                    <th className="px-6 py-4 font-semibold text-right">Stok</th>
                                    <th className="px-6 py-4 font-semibold text-right">Harga</th>
                                    {isAdmin && <th className="px-6 py-4 font-semibold text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedSpareparts.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
                                            Tidak ada data yang cocok dengan pencarian atau filter.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSpareparts.map((s, i) => (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-slate-500">{startIndex + i + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">{(s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "") + s.nama}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{s.kategori}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                s.stok <= 2 
                                                ? "bg-red-50 text-red-700 border-red-200" 
                                                : s.stok <= 5 
                                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            }`}>
                                                {s.stok} unit
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700">{formatRupiah(s.harga)}</td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                                    <Link
                                                        to={`/sparepart/edit/${s.id}`}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(s)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )))}
                                
                                {/* Pad empty rows to maintain consistent table height */}
                                {paginatedSpareparts.length > 0 && paginatedSpareparts.length < itemsPerPage && (
                                    Array.from({ length: itemsPerPage - paginatedSpareparts.length }).map((_, i) => (
                                        <tr key={`empty-${i}`} className="pointer-events-none border-transparent">
                                            <td className="px-6 py-4 text-transparent select-none">0</td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-transparent select-none">-</p>
                                                <p className="text-xs text-transparent mt-0.5 select-none">-</p>
                                            </td>
                                            <td className="px-6 py-4"></td>
                                            <td className="px-6 py-4"></td>
                                            {isAdmin && <td className="px-6 py-4"></td>}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-slate-200 bg-slate-50/50">
                        <p className="text-sm text-slate-500 text-center sm:text-left">
                            Menampilkan <span className="font-semibold text-slate-900">{startIndex + 1}</span> hingga <span className="font-semibold text-slate-900">{Math.min(startIndex + itemsPerPage, processedSpareparts.length)}</span> dari <span className="font-semibold text-slate-900">{processedSpareparts.length}</span> entri
                        </p>
                        <div className="flex items-center justify-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                    currentPage === page 
                                                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" 
                                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} className="px-1 text-slate-400">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Hapus Sparepart"
                message={`Apakah Anda yakin ingin menghapus sparepart "${(deleteTarget?.brand?.nama && deleteTarget.brand.nama.toLowerCase() !== "lainnya" ? deleteTarget.brand.nama + " " : "") + deleteTarget?.nama}"?`}
                onConfirm={executeDelete}
                onCancel={() => setDeleteTarget(null)}
                confirmText="Hapus"
                isDanger={true}
            />
        </div>
    );
}
