import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { Plus, Edit2, Trash2, Wrench, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, PackagePlus, History, DollarSign, AlertTriangle, CheckCircle, ExternalLink, X, TrendingUp, Download, Calendar, Building2, FileSpreadsheet, ShoppingCart, Bell, Send, MessageCircle, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import ConfirmModal from "../../components/ConfirmModal";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";
import RestockManifestModal from "../../components/RestockManifestModal";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

export default function SparepartList() {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [spareparts, setSpareparts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Filter & Sort States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [stockStatusFilter, setStockStatusFilter] = useState("all"); // 'all', 'low', 'out'
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState("nama_asc");

    // Quick Restock Modal State
    const [restockModalTarget, setRestockModalTarget] = useState(null);
    const [restockQty, setRestockQty] = useState("");
    const [restockHPP, setRestockHPP] = useState("");
    const [restockSupplier, setRestockSupplier] = useState("");
    const [restockFaktur, setRestockFaktur] = useState("");
    const [restockTanggal, setRestockTanggal] = useState(new Date().toISOString().split("T")[0]);
    const [restockNotes, setRestockNotes] = useState("");
    const [submittingRestock, setSubmittingRestock] = useState(false);

    // Usage & Restock History Modal State
    const [historyModalTarget, setHistoryModalTarget] = useState(null);
    const [historyTab, setHistoryTab] = useState("usage"); // "usage" | "restock"
    const [usageHistoryData, setUsageHistoryData] = useState(null);
    const [itemRestockLogs, setItemRestockLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Global Restock Logs Modal State
    const [isGlobalRestockModalOpen, setIsGlobalRestockModalOpen] = useState(false);
    const [globalRestockLogs, setGlobalRestockLogs] = useState([]);
    const [loadingGlobalRestock, setLoadingGlobalRestock] = useState(false);
    const [globalRestockSearch, setGlobalRestockSearch] = useState("");
    const [globalRestockSupplier, setGlobalRestockSupplier] = useState("all");
    const [globalRestockStartDate, setGlobalRestockStartDate] = useState("");
    const [globalRestockEndDate, setGlobalRestockEndDate] = useState("");

    // Restock Manifest Modal State
    const [isRestockManifestOpen, setIsRestockManifestOpen] = useState(false);

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

    // Reminder Restock untuk Teknisi ke Admin
    async function handleReminderRestock(sparepart) {
        try {
            const res = await api.post(`/sparepart/${sparepart.id}/reminder-restock`);
            const brand = sparepart.brand?.nama && sparepart.brand.nama.toLowerCase() !== "lainnya" ? `${sparepart.brand.nama} ` : "";
            const fullName = `${brand}${sparepart.nama}`;
            toast.success(`Pengingat restock untuk "${fullName}" terkirim ke Admin!`, { duration: 4000 });
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengirim pengingat ke Admin");
        }
    }

    // Quick Restock Handlers
    function handleOpenRestock(sparepart) {
        setRestockModalTarget(sparepart);
        setRestockQty("");
        setRestockHPP(sparepart.harga_beli ? String(sparepart.harga_beli) : "");
        setRestockSupplier("");
        setRestockFaktur("");
        setRestockTanggal(new Date().toISOString().split("T")[0]);
        setRestockNotes("");
    }

    async function handleSaveRestock(e) {
        e.preventDefault();
        if (!restockModalTarget) return;
        if (!restockQty || Number(restockQty) <= 0) {
            toast.error("Jumlah unit masuk minimal 1");
            return;
        }

        setSubmittingRestock(true);
        try {
            const payload = {
                jumlah_masuk: Number(restockQty),
                catatan: restockNotes,
                supplier_nama: restockSupplier || "Distributor Umum",
                nomor_faktur: restockFaktur,
                tanggal_beli: restockTanggal
            };
            if (restockHPP) {
                payload.harga_beli_baru = Number(restockHPP);
            }

            const res = await api.post(`/sparepart/${restockModalTarget.id}/restock`, payload);
            toast.success(res.data.message || "Stok berhasil ditambahkan!");
            
            // Update state
            setSpareparts(prev => prev.map(s => s.id === restockModalTarget.id ? res.data.data : s));
            setRestockModalTarget(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menambah stok");
        } finally {
            setSubmittingRestock(false);
        }
    }

    // Usage & Restock History Handlers
    async function handleOpenUsageHistory(sparepart, initialTab = "usage") {
        setHistoryModalTarget(sparepart);
        setHistoryTab(initialTab);
        setUsageHistoryData(null);
        setItemRestockLogs([]);
        setLoadingHistory(true);
        try {
            const [usageRes, restockRes] = await Promise.all([
                api.get(`/sparepart/${sparepart.id}/usage-history`),
                api.get(`/sparepart/${sparepart.id}/restock-history`).catch(() => ({ data: [] }))
            ]);
            setUsageHistoryData(usageRes.data);
            setItemRestockLogs(restockRes.data || []);
        } catch (err) {
            toast.error("Gagal memuat riwayat suku cadang");
        } finally {
            setLoadingHistory(false);
        }
    }

    // Global Restock Logs Handlers
    async function handleOpenGlobalRestock() {
        setIsGlobalRestockModalOpen(true);
        setLoadingGlobalRestock(true);
        setGlobalRestockSearch("");
        setGlobalRestockSupplier("all");
        setGlobalRestockStartDate("");
        setGlobalRestockEndDate("");
        try {
            const res = await api.get("/sparepart/restock-logs/all");
            setGlobalRestockLogs(res.data || []);
        } catch (err) {
            toast.error("Gagal memuat log audit pengadaan");
        } finally {
            setLoadingGlobalRestock(false);
        }
    }

    function handleExportRestockExcel() {
        if (filteredGlobalRestockLogs.length === 0) {
            toast.error("Tidak ada data log pengadaan untuk diekspor");
            return;
        }

        const exportData = filteredGlobalRestockLogs.map((log, index) => ({
            "No": index + 1,
            "Tanggal Pembelian": new Date(log.tanggal_beli || log.created_at).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }),
            "No. Faktur": log.nomor_faktur || "-",
            "Nama Suku Cadang": log.sparepart?.nama || "Sparepart",
            "Brand": log.sparepart?.brand?.nama || "-",
            "Kategori": log.sparepart?.kategori || "-",
            "Supplier / Distributor": log.supplier_nama || "Distributor Umum",
            "Qty Masuk (Pcs)": log.jumlah_masuk,
            "HPP Satuan (Rp)": log.harga_beli_pcs,
            "Total Nilai (Rp)": log.harga_beli_pcs * log.jumlah_masuk,
            "Admin Penginput": log.user_nama || "Admin",
            "Catatan": log.catatan || "-"
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = [
            { wch: 6 },
            { wch: 18 },
            { wch: 18 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 25 },
            { wch: 16 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 32 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit Pengadaan");

        const dateStr = new Date().toISOString().split("T")[0];
        XLSX.writeFile(wb, `Rekap_Pengadaan_Sparepart_${dateStr}.xlsx`);
        toast.success("Berhasil mengekspor rekap audit pengadaan ke Excel!");
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
        
        let matchStock = true;
        if (stockStatusFilter === "low") {
            matchStock = s.stok > 0 && s.stok <= 5;
        } else if (stockStatusFilter === "out") {
            matchStock = s.stok === 0;
        } else if (stockStatusFilter === "available") {
            matchStock = s.stok > 5;
        }

        return matchSearch && matchCategory && matchBrand && matchStock;
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

    // Summary Metrics
    const totalInventoryValue = spareparts.reduce((sum, s) => sum + ((s.harga_beli || s.harga * 0.7) * s.stok), 0);
    const totalPotentialRevenue = spareparts.reduce((sum, s) => sum + (s.harga * s.stok), 0);
    const totalUnitsInStock = spareparts.reduce((sum, s) => sum + s.stok, 0);
    const lowStockCount = spareparts.filter(s => s.stok > 0 && s.stok <= 5).length;
    const outOfStockCount = spareparts.filter(s => s.stok === 0).length;

    // Global Restock Filtering & KPI Calculations
    const uniqueSuppliers = Array.from(new Set(
        globalRestockLogs.map(l => l.supplier_nama?.trim()).filter(Boolean)
    )).sort();

    const filteredGlobalRestockLogs = globalRestockLogs.filter(log => {
        if (globalRestockSearch) {
            const q = globalRestockSearch.toLowerCase();
            const matchSearch = (
                log.sparepart?.nama?.toLowerCase().includes(q) ||
                log.supplier_nama?.toLowerCase().includes(q) ||
                log.nomor_faktur?.toLowerCase().includes(q) ||
                log.user_nama?.toLowerCase().includes(q) ||
                log.catatan?.toLowerCase().includes(q)
            );
            if (!matchSearch) return false;
        }

        if (globalRestockSupplier !== "all") {
            const suppName = log.supplier_nama || "Distributor Umum";
            if (suppName !== globalRestockSupplier) {
                return false;
            }
        }

        const logDate = new Date(log.tanggal_beli || log.created_at);
        if (globalRestockStartDate) {
            const start = new Date(globalRestockStartDate);
            start.setHours(0, 0, 0, 0);
            if (logDate < start) return false;
        }
        if (globalRestockEndDate) {
            const end = new Date(globalRestockEndDate);
            end.setHours(23, 59, 59, 999);
            if (logDate > end) return false;
        }

        return true;
    });

    const totalRestockEntries = filteredGlobalRestockLogs.length;
    const totalRestockUnits = filteredGlobalRestockLogs.reduce((sum, l) => sum + (Number(l.jumlah_masuk) || 0), 0);
    const totalRestockSpend = filteredGlobalRestockLogs.reduce((sum, l) => sum + ((Number(l.harga_beli_pcs) || 0) * (Number(l.jumlah_masuk) || 0)), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Sparepart & Logistik</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola stok, harga modal (HPP), quick restock, dan audit pemakaian suku cadang</p>
                </div>
                {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleOpenGlobalRestock}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-2xs"
                        >
                            <History className="w-4 h-4 text-slate-500" />
                            <span>Log Pengadaan & Restok</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRestockManifestOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-2xs"
                        >
                            <ShoppingCart className="w-4 h-4 text-slate-500" />
                            <span>Daftar Belanja Supplier</span>
                            {(lowStockCount + outOfStockCount) > 0 && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                                    {lowStockCount + outOfStockCount}
                                </span>
                            )}
                        </button>
                        <Link
                            to="/rma"
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-2xs"
                        >
                            <RotateCcw className="w-4 h-4 text-blue-600" />
                            <span>Klaim RMA Supplier</span>
                        </Link>
                        <Link
                            to="/sparepart/tambah"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Sparepart Baru</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Inventory Valuation & KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Item & Stok</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Wrench className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{spareparts.length} Jenis</h3>
                    <p className="text-xs text-slate-500 mt-1">Total {totalUnitsInStock} unit fisik di gudang</p>
                </div>

                {isAdmin ? (
                    <>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider">Nilai Modal Aset (HPP)</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{formatRupiah(totalInventoryValue)}</h3>
                            <p className="text-xs text-emerald-600 font-medium mt-1">Nilai modal aset tersimpan</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider">Potensi Omset Jual</span>
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{formatRupiah(totalPotentialRevenue)}</h3>
                            <p className="text-xs text-slate-500 mt-1">Potensi margin: {formatRupiah(totalPotentialRevenue - totalInventoryValue)}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider">Stok Aman (&gt; 5 Unit)</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{spareparts.filter(s => s.stok > 5).length} Jenis</h3>
                            <p className="text-xs text-emerald-600 font-medium mt-1">Stok siap dipasang teknisi</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider">Stok Menipis (1-5)</span>
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-amber-600">{lowStockCount} Jenis</h3>
                            <p className="text-xs text-amber-600 font-medium mt-1">Gunakan tombol "Ingatkan Admin"</p>
                        </div>
                    </>
                )}

                <div
                    onClick={() => isAdmin && setIsRestockManifestOpen(true)}
                    className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm ${isAdmin ? "cursor-pointer hover:border-amber-300 hover:shadow-md group" : ""} transition-all`}
                    title={isAdmin ? "Klik untuk membuka Generator Daftar Belanja Supplier" : undefined}
                >
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                            {isAdmin ? "Status Restock" : "Kebutuhan Restock"}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-amber-600">{lowStockCount} Menipis</span>
                        <span className="text-sm font-bold text-red-600">/ {outOfStockCount} Habis</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {isAdmin ? "Buka Daftar Belanja WhatsApp →" : `${outOfStockCount} item habis tidak dapat dipasang`}
                    </p>
                </div>
            </div>

            {/* Quick Filter Tabs for Stock Status */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setStockStatusFilter("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        stockStatusFilter === "all"
                            ? "bg-slate-800 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    Semua Sparepart ({spareparts.length})
                </button>
                <button
                    onClick={() => setStockStatusFilter("low")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        stockStatusFilter === "low"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
                    }`}
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Stok Menipis (≤ 5)</span>
                    <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">{lowStockCount}</span>
                </button>
                <button
                    onClick={() => setStockStatusFilter("out")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        stockStatusFilter === "out"
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                    }`}
                >
                    <span>Stok Habis (0)</span>
                    <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">{outOfStockCount}</span>
                </button>
                <button
                    onClick={() => setStockStatusFilter("available")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        stockStatusFilter === "available"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    Stok Aman (&gt; 5)
                </button>
            </div>


            {/* Filter & Sort Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 min-w-0 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama sparepart..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setSearchQuery("");
                                }
                            }}
                            className="block w-full pl-9 pr-9 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                                title="Hapus pencarian (Esc)"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter & Sort Controls Group */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        {/* Filter Category (Multi-select e-commerce style) */}
                        <div className="w-full sm:flex-1 lg:w-48 lg:flex-none relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Filter className="h-4 w-4 text-slate-400 shrink-0" />
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
                        <div className="w-full sm:flex-1 lg:w-48 lg:flex-none relative">
                            <button
                                onClick={() => setIsBrandFilterOpen(!isBrandFilterOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Filter className="h-4 w-4 text-slate-400 shrink-0" />
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
                        <div className="w-full sm:flex-1 lg:w-48 lg:flex-none relative">
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
            </div>

            <TableContainer
                footer={
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={processedSpareparts.length}
                        pageSize={itemsPerPage}
                        onPageChange={(p) => setCurrentPage(p)}
                        onPageSizeChange={(size) => {
                            setItemsPerPage(size);
                            setCurrentPage(1);
                        }}
                        unitLabel="sparepart"
                        disabled={loading}
                    />
                }
            >
                {loading ? (
                    <TableLoadingState message="Memuat inventaris sparepart..." />
                ) : spareparts.length === 0 ? (
                    <TableEmptyState
                        icon={Wrench}
                        title="Tidak Ada Sparepart"
                        description="Data master sparepart masih kosong di sistem bengkel."
                        actionLabel={isAdmin ? "Tambah Sparepart Baru" : undefined}
                        onAction={isAdmin ? () => navigate("/sparepart/tambah") : undefined}
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
                            <tr>
                                <th className="px-6 py-3.5 font-semibold">No</th>
                                <th className="px-6 py-3.5 font-semibold">Nama Sparepart</th>
                                <th className="px-6 py-3.5 font-semibold text-right">Stok</th>
                                {isAdmin && <th className="px-6 py-3.5 font-semibold text-right">Harga Modal (HPP)</th>}
                                <th className="px-6 py-3.5 font-semibold text-right">Harga Jual</th>
                                {isAdmin && <th className="px-6 py-3.5 font-semibold text-right">Margin / Unit</th>}
                                <th className="px-6 py-3.5 font-semibold text-center">Riwayat</th>
                                <th className="px-6 py-3.5 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedSpareparts.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 6} className="px-6 py-12 text-center text-slate-500">
                                        Tidak ada data yang cocok dengan pencarian atau filter.
                                    </td>
                                </tr>
                            ) : (
                                paginatedSpareparts.map((s, i) => {
                                    const hpp = s.harga_beli || Math.round(s.harga * 0.7);
                                    const margin = s.harga - hpp;
                                    const marginPercent = s.harga > 0 ? Math.round((margin / s.harga) * 100) : 0;

                                    return (
                                        <tr 
                                            key={s.id} 
                                            onClick={(e) => {
                                                if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                                handleOpenUsageHistory(s);
                                            }}
                                            className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4 text-slate-500">{startIndex + i + 1}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-900">{(s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "") + s.nama}</p>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <p className="text-xs text-slate-500">{s.kategori}</p>
                                                    {(s.supplier?.nama || s.distributor_nama) && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                                                            <Building2 className="w-3 h-3 text-slate-400" />
                                                            <span>{s.supplier?.nama || s.distributor_nama}</span>
                                                        </span>
                                                    )}
                                                    {s.has_garansi_distri && (
                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                                            s.tipe_garansi_distri === "Lifetime" || s.sistem_perhitungan_garansi === "lifetime"
                                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                : s.sistem_perhitungan_garansi === "sejak_segel_distri"
                                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        }`}>
                                                            {s.tipe_garansi_distri === "Lifetime" || s.sistem_perhitungan_garansi === "lifetime" ? "✨ Garansi Lifetime" : `🛡️ Distri: ${s.tipe_garansi_distri || "1 Thn"}`}
                                                            {s.sistem_perhitungan_garansi === "sejak_segel_distri" && " (Segel)"}
                                                            {s.sistem_perhitungan_garansi === "sejak_nota_customer" && " (Nota)"}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                        s.stok <= 2 
                                                        ? "bg-red-50 text-red-700 border-red-200" 
                                                        : s.stok <= 5 
                                                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    }`}>
                                                        {s.stok} unit
                                                    </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleOpenRestock(s)}
                                                            className="p-1 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded transition-colors"
                                                            title="Quick Restock / Tambah Stok"
                                                        >
                                                            <PackagePlus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            {isAdmin && <td className="px-6 py-4 text-right text-slate-600 font-mono text-xs">{formatRupiah(hpp)}</td>}
                                            <td className="px-6 py-4 text-right font-medium text-slate-900 font-mono text-xs">{formatRupiah(s.harga)}</td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-semibold text-emerald-600 text-xs">+{formatRupiah(margin)}</span>
                                                    <span className="block text-[10px] text-slate-400">({marginPercent}%)</span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleOpenUsageHistory(s)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                                                    title="Lihat riwayat tiket yang menggunakan part ini"
                                                >
                                                    <History className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>Audit</span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isAdmin ? (
                                                    <div className="flex items-center justify-end gap-1 transition-opacity">
                                                        <Link
                                                            to={`/rma/tambah?sparepart_id=${s.id}`}
                                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Klaim Retur Garansi Distributor (RMA)"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </Link>
                                                        <Link
                                                            to={`/sparepart/edit/${s.id}`}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteClick(s)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            to={`/rma/tambah?sparepart_id=${s.id}`}
                                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Klaim Retur Garansi Distributor (RMA)"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </Link>
                                                        {s.stok <= 5 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReminderRestock(s)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-95"
                                                                title="Kirim pengingat restock ke Admin"
                                                            >
                                                                <Bell className="w-3.5 h-3.5 text-amber-600" />
                                                                <span>Ingatkan Admin</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 font-medium">Stok Aman</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </TableContainer>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Hapus Sparepart"
                message={`Apakah Anda yakin ingin menghapus sparepart "${(deleteTarget?.brand?.nama && deleteTarget.brand.nama.toLowerCase() !== "lainnya" ? deleteTarget.brand.nama + " " : "") + deleteTarget?.nama}"?`}
                onConfirm={executeDelete}
                onCancel={() => setDeleteTarget(null)}
                confirmText="Hapus"
                isDanger={true}
            />

            {/* Quick Restock Modal */}
            {restockModalTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                        onClick={() => !submittingRestock && setRestockModalTarget(null)}
                    ></div>

                    <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden z-10 border border-slate-200">
                        <div className="px-6 py-5 bg-slate-800 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                                    <PackagePlus className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-white">Quick Restock / Tambah Stok</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">
                                        {restockModalTarget.nama}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setRestockModalTarget(null)}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRestock} className="p-6 space-y-4 text-xs">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                <div>
                                    <span className="text-slate-500">Stok Saat Ini:</span>
                                    <span className="font-bold text-slate-900 ml-1.5">{restockModalTarget.stok} unit</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Harga Jual:</span>
                                    <span className="font-bold text-slate-900 ml-1.5">{formatRupiah(restockModalTarget.harga)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Jumlah Unit Masuk <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={restockQty}
                                    onChange={(e) => setRestockQty(e.target.value)}
                                    placeholder="Contoh: 10"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Stok akhir setelah restock: <strong>{Number(restockModalTarget.stok) + (Number(restockQty) || 0)} unit</strong>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Harga Beli / HPP per Unit (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={restockHPP}
                                        onChange={(e) => setRestockHPP(e.target.value)}
                                        placeholder="Contoh: 150000"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tanggal Pembelian
                                    </label>
                                    <input
                                        type="date"
                                        value={restockTanggal}
                                        onChange={(e) => setRestockTanggal(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Nama Supplier / Distributor
                                    </label>
                                    <span className="text-[10px] text-slate-400">Pilih cepat:</span>
                                </div>
                                <input
                                    type="text"
                                    value={restockSupplier}
                                    onChange={(e) => setRestockSupplier(e.target.value)}
                                    placeholder="Contoh: Sentral Part Harco Mangga Dua"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {["Sentral Part Harco", "Gudang Sparepart Jkt", "Distributor Resmi", "Toko Komputer Lokal"].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setRestockSupplier(s)}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        No. Faktur / Nota Pembelian
                                    </label>
                                    <input
                                        type="text"
                                        value={restockFaktur}
                                        onChange={(e) => setRestockFaktur(e.target.value)}
                                        placeholder="Contoh: INV-2026/089"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Catatan Pengadaan
                                    </label>
                                    <input
                                        type="text"
                                        value={restockNotes}
                                        onChange={(e) => setRestockNotes(e.target.value)}
                                        placeholder="Contoh: Batch baru garansi 1 tahun"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setRestockModalTarget(null)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingRestock}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {submittingRestock ? "Menyimpan..." : "Simpan Stok Masuk"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Item Audit Modal: Usage & Restock History Tabs */}
            {historyModalTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                        onClick={() => setHistoryModalTarget(null)}
                    ></div>

                    <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden z-10 border border-slate-200">
                        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                                    <History className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-white">Audit Jejak Suku Cadang</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">
                                        {historyModalTarget.nama}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setHistoryModalTarget(null)}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Summary Bar */}
                        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                            <div>
                                <span>Stok Gudang: </span>
                                <strong className="text-slate-900 text-sm font-mono">{historyModalTarget.stok} Unit</strong>
                            </div>
                            <div>
                                <span>Total Terpakai Servis: </span>
                                <strong className="text-blue-600 text-sm font-mono">{usageHistoryData?.sparepart?.totalTerpakai || 0} Unit</strong>
                            </div>
                            <div>
                                <span>Total Frekuensi Restok: </span>
                                <strong className="text-emerald-700 text-sm font-mono">{itemRestockLogs.length} Kali</strong>
                            </div>
                        </div>

                        {historyModalTarget.has_garansi_distri && (
                            <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-blue-900">🛡️ Garansi Distri:</span>
                                    <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 font-semibold text-[11px]">
                                        {historyModalTarget.tipe_garansi_distri || "1 Tahun"}
                                    </span>
                                    <span className="text-slate-500 text-[11px]">
                                        {historyModalTarget.sistem_perhitungan_garansi === "lifetime" ? "(Lifetime Support / Toko Bantu Klaim)" : historyModalTarget.sistem_perhitungan_garansi === "sejak_segel_distri" ? "(Dihitung Sejak Segel Distri)" : "(Dihitung Sejak Nota End-User)"}
                                    </span>
                                </div>
                                {historyModalTarget.distributor_nama && (
                                    <div className="text-[11px] text-slate-600">
                                        Distri: <strong className="text-slate-800">{historyModalTarget.distributor_nama}</strong>
                                        {historyModalTarget.distributor_kontak && ` (${historyModalTarget.distributor_kontak})`}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sub-tabs */}
                        <div className="flex border-b border-slate-200 bg-white px-6">
                            <button
                                type="button"
                                onClick={() => setHistoryTab("usage")}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                                    historyTab === "usage"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Pemakaian di Tiket Servis ({usageHistoryData?.history?.length || 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => setHistoryTab("restock")}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                                    historyTab === "restock"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Riwayat Pembelian & Restok ({itemRestockLogs.length})
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs custom-scrollbar">
                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mb-3"></div>
                                    <p className="text-xs">Memuat rekam data...</p>
                                </div>
                            ) : historyTab === "usage" ? (
                                !usageHistoryData?.history || usageHistoryData.history.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                                            <Wrench className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-800">Belum Pernah Digunakan</h4>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                            Sparepart ini belum tercatat digunakan pada tiket servis manapun.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {usageHistoryData.history.map((h, idx) => (
                                            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900 text-xs">{h.nomor_tiket}</span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                                                            {h.status_tiket}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-600 mt-1">
                                                        {h.perangkat} — Pemilik: <strong className="text-slate-800">{h.customer}</strong>
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Teknisi: {h.teknisi} &bull; {new Date(h.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs">
                                                        Dipakai: {h.jumlah} Unit
                                                    </span>
                                                    <Link
                                                        to={`/tiket-servis/${h.tiket_id}`}
                                                        className="block text-[11px] text-blue-600 hover:text-blue-800 font-semibold mt-1"
                                                    >
                                                        Buka Tiket &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                itemRestockLogs.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                                            <PackagePlus className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-800">Belum Ada Riwayat Restok Khusus</h4>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                            Stok awal dimasukkan saat registrasi pertama atau sebelum sistem log pengadaan diaktifkan.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {itemRestockLogs.map((log) => (
                                            <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-colors">
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                            +{log.jumlah_masuk} Unit Masuk
                                                        </span>
                                                        <span className="font-semibold text-slate-800">
                                                            {formatRupiah(log.harga_beli_pcs)} / unit
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500">
                                                        {new Date(log.tanggal_beli || log.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                                                    <div>
                                                        <span className="text-slate-400">Supplier:</span> <strong className="text-slate-700">{log.supplier_nama || "Supplier Umum"}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">No. Faktur:</span> <strong className="text-slate-700 font-mono">{log.nomor_faktur || "-"}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Admin Penginput:</span> <strong className="text-slate-700">{log.user_nama || "Admin"}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Total Pengeluaran:</span> <strong className="text-slate-900">{formatRupiah(log.harga_beli_pcs * log.jumlah_masuk)}</strong>
                                                    </div>
                                                </div>
                                                {log.catatan && (
                                                    <p className="mt-2 text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200/80">
                                                        Catatan: {log.catatan}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Restock Procurement Audit Modal */}
            {isGlobalRestockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
                        onClick={() => setIsGlobalRestockModalOpen(false)}
                    ></div>

                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden z-10 border border-slate-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-blue-400">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-white">Log Audit Pengadaan & Restok Gudang</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Rekapitulasi riwayat pembelian suku cadang dari distributor & supplier
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExportRestockExcel}
                                    disabled={loadingGlobalRestock || filteredGlobalRestockLogs.length === 0}
                                    className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                                    title="Unduh rekap pengadaan sebagai file Excel (.xlsx)"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Export Excel</span>
                                </button>
                                <button
                                    onClick={() => setIsGlobalRestockModalOpen(false)}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* KPI Summary Cards */}
                        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Transaksi</p>
                                    <p className="text-base font-bold text-slate-900 mt-0.5">{totalRestockEntries} <span className="text-xs font-normal text-slate-500">entri</span></p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <History className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Unit Masuk</p>
                                    <p className="text-base font-bold text-emerald-700 mt-0.5">+{totalRestockUnits} <span className="text-xs font-normal text-slate-500">pcs</span></p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <PackagePlus className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Nilai Pembelian</p>
                                    <p className="text-base font-bold text-slate-900 mt-0.5">{formatRupiah(totalRestockSpend)}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Search & Advanced Filters Bar */}
                        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                                {/* Search Filter */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={globalRestockSearch}
                                        onChange={(e) => setGlobalRestockSearch(e.target.value)}
                                        placeholder="Cari sparepart, faktur..."
                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none"
                                    />
                                </div>

                                {/* Supplier Filter */}
                                <div className="relative">
                                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                                    <select
                                        value={globalRestockSupplier}
                                        onChange={(e) => setGlobalRestockSupplier(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none"
                                    >
                                        <option value="all">Semua Supplier ({uniqueSuppliers.length})</option>
                                        {uniqueSuppliers.map((supp) => (
                                            <option key={supp} value={supp}>{supp}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Range: Start */}
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Dari:</span>
                                    <input
                                        type="date"
                                        value={globalRestockStartDate}
                                        onChange={(e) => setGlobalRestockStartDate(e.target.value)}
                                        className="w-full bg-transparent text-xs text-slate-700 outline-none"
                                    />
                                </div>

                                {/* Date Range: End */}
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Sampai:</span>
                                    <input
                                        type="date"
                                        value={globalRestockEndDate}
                                        onChange={(e) => setGlobalRestockEndDate(e.target.value)}
                                        className="w-full bg-transparent text-xs text-slate-700 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Active Filter Chips / Reset */}
                            {(globalRestockSearch || globalRestockSupplier !== "all" || globalRestockStartDate || globalRestockEndDate) && (
                                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                                    <span className="text-[11px]">
                                        Menampilkan <strong>{filteredGlobalRestockLogs.length}</strong> dari {globalRestockLogs.length} total entri log pengadaan
                                    </span>
                                    <button
                                        onClick={() => {
                                            setGlobalRestockSearch("");
                                            setGlobalRestockSupplier("all");
                                            setGlobalRestockStartDate("");
                                            setGlobalRestockEndDate("");
                                        }}
                                        className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                                    >
                                        Reset Semua Filter
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Table / List */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs custom-scrollbar">
                            {loadingGlobalRestock ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                                    <p className="text-xs">Memuat rekap audit pengadaan...</p>
                                </div>
                            ) : globalRestockLogs.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                                        <PackagePlus className="w-7 h-7" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800">Belum Ada Catatan Restok</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                        Saat Anda melakukan Restok pada suku cadang atau menambahkan barang dengan stok awal, seluruh riwayat transaksi pengadaan akan tercatat otomatis di sini.
                                    </p>
                                </div>
                            ) : filteredGlobalRestockLogs.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800">Tidak Ada Data yang Cocok</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                        Tidak ditemukan transaksi pengadaan yang sesuai dengan kriteria filter saat ini.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setGlobalRestockSearch("");
                                            setGlobalRestockSupplier("all");
                                            setGlobalRestockStartDate("");
                                            setGlobalRestockEndDate("");
                                        }}
                                        className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                                    >
                                        Hapus Filter
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto overflow-y-auto max-h-[480px] custom-scrollbar border border-slate-200 rounded-xl">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                                            <tr className="border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                                                <th className="py-3 px-3.5">Tanggal</th>
                                                <th className="py-3 px-3.5">No. Faktur</th>
                                                <th className="py-3 px-3.5">Nama Suku Cadang</th>
                                                <th className="py-3 px-3.5">Supplier</th>
                                                <th className="py-3 px-3.5 text-center">Qty Masuk</th>
                                                <th className="py-3 px-3.5 text-right">HPP Satuan</th>
                                                <th className="py-3 px-3.5 text-right">Total Pengeluaran</th>
                                                <th className="py-3 px-3.5">Admin & Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {filteredGlobalRestockLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-3.5 text-slate-600 font-medium">
                                                        {new Date(log.tanggal_beli || log.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-3 px-3.5 font-mono text-slate-700">
                                                        {log.nomor_faktur ? (
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold text-[11px]">
                                                                {log.nomor_faktur}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3.5">
                                                        <div className="font-bold text-slate-900">{log.sparepart?.nama || "Sparepart"}</div>
                                                        <span className="text-[10px] text-slate-400">{log.sparepart?.brand?.nama || log.sparepart?.kategori}</span>
                                                    </td>
                                                    <td className="py-3 px-3.5 text-slate-700 font-medium">
                                                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px] border border-slate-200">
                                                            <Building2 className="w-3 h-3 text-slate-500" />
                                                            {log.supplier_nama || "Distributor Umum"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3.5 text-center">
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                                                            +{log.jumlah_masuk}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right font-mono text-slate-700">
                                                        {formatRupiah(log.harga_beli_pcs)}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                                                        {formatRupiah(log.harga_beli_pcs * log.jumlah_masuk)}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-slate-500 max-w-[200px]">
                                                        <span className="font-semibold text-slate-700">{log.user_nama || "Admin"}</span>
                                                        {log.catatan && (
                                                            <p className="text-[10px] text-slate-400 italic truncate" title={log.catatan}>
                                                                {log.catatan}
                                                            </p>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-100/90 font-bold text-slate-800 border-t-2 border-slate-200 sticky bottom-0 z-10">
                                            <tr>
                                                <td colSpan={4} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-[11px]">
                                                    Total Terfilter ({filteredGlobalRestockLogs.length} transaksi):
                                                </td>
                                                <td className="py-2.5 px-3.5 text-center text-emerald-700 font-mono text-xs">
                                                    +{totalRestockUnits}
                                                </td>
                                                <td className="py-2.5 px-3.5"></td>
                                                <td className="py-2.5 px-3.5 text-right text-slate-900 font-mono text-xs">
                                                    {formatRupiah(totalRestockSpend)}
                                                </td>
                                                <td className="py-2.5 px-3.5"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Restock Manifest Modal */}
            <RestockManifestModal
                isOpen={isRestockManifestOpen}
                onClose={() => setIsRestockManifestOpen(false)}
            />
        </div>
    );
}
