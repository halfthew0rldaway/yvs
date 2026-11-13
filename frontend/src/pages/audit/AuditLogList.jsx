import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
    ShieldAlert, 
    Search, 
    X, 
    Calendar, 
    Download, 
    Filter, 
    RefreshCw, 
    Clock, 
    User, 
    Layers, 
    CheckCircle2,
    Ticket,
    Users,
    Laptop,
    Wrench,
    FileText,
    Building2,
    Shield,
    Trash2,
    Eye,
    Copy,
    Check,
    AlertCircle,
    UserCheck,
    Package,
    Database,
    Activity,
    PlusCircle,
    Edit3,
    LogIn,
    MapPin
} from "lucide-react";
import api from "../../services/api";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";
import toast from "react-hot-toast";

const ENTITY_CONFIG = {
    tiket: {
        label: "Tiket Servis",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Ticket
    },
    customer: {
        label: "Pelanggan",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: Users
    },
    perangkat: {
        label: "Perangkat Unit",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Laptop
    },
    sparepart: {
        label: "Suku Cadang",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Wrench
    },
    invoice: {
        label: "Invoice & Pembayaran",
        color: "bg-teal-50 text-teal-700 border-teal-200",
        icon: FileText
    },
    user: {
        label: "Karyawan / Akun",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: UserCheck
    },
    presensi: {
        label: "Presensi & Absensi",
        color: "bg-cyan-50 text-cyan-700 border-cyan-200",
        icon: Clock
    },
    supplier: {
        label: "Distributor Supplier",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: Building2
    },
    rma: {
        label: "Klaim Retur RMA",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: RefreshCw
    },
    diagnosis: {
        label: "Diagnosis Teknis",
        color: "bg-violet-50 text-violet-700 border-violet-200",
        icon: CheckCircle2
    },
    loaner: {
        label: "Unit Pinjaman",
        color: "bg-sky-50 text-sky-700 border-sky-200",
        icon: Package
    },
    database: {
        label: "Database & Sistem",
        color: "bg-slate-100 text-slate-700 border-slate-300",
        icon: Database
    },
    sistem: {
        label: "Sistem Umum",
        color: "bg-slate-50 text-slate-700 border-slate-200",
        icon: Shield
    }
};

// Helper untuk kategorisasi tipe aksi (Mutasi)
function getActionBadge(action = "") {
    const act = action.toLowerCase();
    if (act.includes("membuat") || act.includes("tambah") || act.includes("menerbitkan") || act.includes("mendaftarkan")) {
        return { label: "TAMBAH", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: PlusCircle };
    }
    if (act.includes("mengubah") || act.includes("update") || act.includes("memperbarui") || act.includes("revisi") || act.includes("sesuai")) {
        return { label: "UBAH", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Edit3 };
    }
    if (act.includes("menghapus") || act.includes("batal") || act.includes("nonaktif") || act.includes("bersih")) {
        return { label: "HAPUS", color: "bg-rose-50 text-rose-700 border-rose-200", icon: Trash2 };
    }
    if (act.includes("login") || act.includes("logout") || act.includes("masuk") || act.includes("sesi")) {
        return { label: "AUTH", color: "bg-blue-50 text-blue-700 border-blue-200", icon: LogIn };
    }
    if (act.includes("check-in") || act.includes("check-out") || act.includes("presensi") || act.includes("absen")) {
        return { label: "PRESENSI", color: "bg-teal-50 text-teal-700 border-teal-200", icon: MapPin };
    }
    if (act.includes("ekspor") || act.includes("unduh") || act.includes("backup")) {
        return { label: "EKSPOR", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Download };
    }
    return { label: "MUTASI", color: "bg-slate-50 text-slate-700 border-slate-200", icon: Activity };
}

export default function AuditLogList() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalLogs: 0, todayLogs: 0, entities: [], topUsers: [] });

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEntity, setSelectedEntity] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [quickRange, setQuickRange] = useState("all"); // 'all' | 'today' | '7days' | '30days'
    const [isExporting, setIsExporting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Detail Modal & Housekeeping Modal
    const [selectedLog, setSelectedLog] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [cleanupDays, setCleanupDays] = useState(180);
    const [cleaningUp, setCleaningUp] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/activity-logs/stats");
            setStats(res.data || { totalLogs: 0, todayLogs: 0, entities: [], topUsers: [] });
        } catch (_) {
            // Stats failure silent fallback
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: pageSize,
                sortOrder: "desc"
            };

            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (selectedEntity !== "all") params.entity = selectedEntity;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await api.get("/activity-logs", { params });
            if (res.data?.pagination) {
                setLogs(res.data.data || []);
                setTotalItems(res.data.pagination.total);
                setTotalPages(res.data.pagination.totalPages);
            } else if (Array.isArray(res.data)) {
                setLogs(res.data);
                setTotalItems(res.data.length);
                setTotalPages(1);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memuat log aktivitas", { id: "audit-fetch-error" });
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchTerm, selectedEntity, startDate, endDate]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Quick Date Filter Handler
    function handleQuickRangeChange(range) {
        setQuickRange(range);
        setCurrentPage(1);

        const now = new Date();
        const formatDate = (d) => d.toISOString().split("T")[0];

        if (range === "all") {
            setStartDate("");
            setEndDate("");
        } else if (range === "today") {
            const todayStr = formatDate(now);
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (range === "7days") {
            const past = new Date();
            past.setDate(past.getDate() - 7);
            setStartDate(formatDate(past));
            setEndDate(formatDate(now));
        } else if (range === "30days") {
            const past = new Date();
            past.setDate(past.getDate() - 30);
            setStartDate(formatDate(past));
            setEndDate(formatDate(now));
        }
    }

    function handleResetFilters() {
        setSearchTerm("");
        setSelectedEntity("all");
        setStartDate("");
        setEndDate("");
        setQuickRange("all");
        setCurrentPage(1);
    }

    async function handleExportExcel() {
        try {
            setIsExporting(true);
            const params = { sortOrder: "desc" };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (selectedEntity !== "all") params.entity = selectedEntity;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await api.get("/activity-logs", { params });
            const rawLogs = res.data?.data || (Array.isArray(res.data) ? res.data : []);

            if (rawLogs.length === 0) {
                toast.error("Tidak ada data log untuk diekspor");
                return;
            }

            const exportData = rawLogs.map((item, idx) => ({
                "No": idx + 1,
                "ID": item.id,
                "Waktu Kejadian": new Date(item.created_at).toLocaleString("id-ID"),
                "Nama Operator": item.user_nama || "Sistem",
                "Email Operator": item.user?.email || "-",
                "Role": item.user?.role || "-",
                "Entitas": ENTITY_CONFIG[item.entity]?.label || item.entity || "Sistem",
                "Rincian Aktivitas / Mutasi": item.action
            }));

            const XLSX = await import("xlsx");
            const ws = XLSX.utils.json_to_sheet(exportData);
            ws["!cols"] = [
                { wch: 6 },
                { wch: 8 },
                { wch: 22 },
                { wch: 22 },
                { wch: 24 },
                { wch: 14 },
                { wch: 22 },
                { wch: 65 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Audit Trail");
            const filename = `Servio_Audit_Log_${new Date().toISOString().split("T")[0]}.xlsx`;
            XLSX.writeFile(wb, filename);

            toast.success("Log audit aktivitas berhasil diekspor ke Excel!");
        } catch (err) {
            toast.error("Gagal mengekspor data: " + err.message);
        } finally {
            setIsExporting(false);
        }
    }

    async function handleCleanupLogs() {
        try {
            setCleaningUp(true);
            const res = await api.post("/database/cleanup-logs", { olderThanDays: cleanupDays });
            toast.success(res.data?.message || "Pembersihan log berhasil!");
            setShowCleanupModal(false);
            fetchStats();
            fetchLogs();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal membersihkan log aktivitas");
        } finally {
            setCleaningUp(false);
        }
    }

    function handleCopyDetail() {
        if (!selectedLog) return;
        const text = `[AUDIT LOG #${selectedLog.id}]\nWaktu: ${new Date(selectedLog.created_at).toLocaleString("id-ID")}\nOperator: ${selectedLog.user_nama || "Sistem"} (${selectedLog.user?.role || "-"})\nEntitas: ${selectedLog.entity}\nMutasi: ${selectedLog.action}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const hasActiveFilters = Boolean(searchTerm || selectedEntity !== "all" || startDate || endDate || quickRange !== "all");

    // Format top entity
    const topEntityFormatted = useMemo(() => {
        if (!stats.entities || stats.entities.length === 0) return "-";
        const top = stats.entities[0];
        const label = ENTITY_CONFIG[top.entity]?.label || top.entity;
        return `${label} (${top.count})`;
    }, [stats.entities]);

    // Format top user
    const topUserFormatted = useMemo(() => {
        if (!stats.topUsers || stats.topUsers.length === 0) return "-";
        const top = stats.topUsers[0];
        return `${top.user_nama} (${top.count})`;
    }, [stats.topUsers]);

    return (
        <div className="space-y-4">
            {/* Header: Title, Subtitle, & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl shrink-0">
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                            Log Audit Aktivitas (Anti-Fraud)
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Rekam jejak seluruh mutasi data sensitif, revisi ACC, klaim garansi, invoice, dan master data
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={fetchLogs}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                        title="Segarkan Log"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
                        <span>Segarkan</span>
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setShowCleanupModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                        title="Pembersihan riwayat log aktivitas lama"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Pembersihan</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={isExporting || totalItems === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                        title="Unduh Laporan Audit ke Excel (.xlsx)"
                    >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>{isExporting ? "Mengekspor..." : "Ekspor Excel"}</span>
                    </button>
                </div>
            </div>

            {/* 4 Statistics Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-2xs sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Log Audit</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.totalLogs.toLocaleString("id-ID")}</p>
                        <p className="text-3xs text-slate-400 mt-0.5">Tercatat di sistem</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-2xs sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Aktivitas Hari Ini</p>
                        <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{stats.todayLogs.toLocaleString("id-ID")}</p>
                        <p className="text-3xs text-slate-400 mt-0.5">24 jam terakhir</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                        <p className="text-2xs sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Entitas Terbanyak</p>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 truncate" title={topEntityFormatted}>
                            {topEntityFormatted}
                        </p>
                        <p className="text-3xs text-slate-400 mt-0.5 truncate">Objek frekuensi tertinggi</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                        <Shield className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                        <p className="text-2xs sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Operator Teraktif</p>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 truncate" title={topUserFormatted}>
                            {topUserFormatted}
                        </p>
                        <p className="text-3xs text-slate-400 mt-0.5 truncate">Paling banyak mutasi</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar with Presets & Responsive Inputs */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 mr-1.5">Rentang Cepat:</span>
                    {[
                        { id: "all", label: "Semua Waktu" },
                        { id: "today", label: "Hari Ini" },
                        { id: "7days", label: "7 Hari Terakhir" },
                        { id: "30days", label: "30 Hari Terakhir" },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleQuickRangeChange(tab.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                quickRange === tab.id
                                    ? "bg-slate-900 text-white shadow-2xs"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search, Entity Select, and Date Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari operator atau rincian aktivitas..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-xs text-slate-800 placeholder:text-slate-400"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Entity Filter */}
                    <div className="relative">
                        <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                            value={selectedEntity}
                            onChange={(e) => {
                                setSelectedEntity(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-xs text-slate-800 cursor-pointer"
                        >
                            <option value="all">Semua Entitas Data</option>
                            <option value="tiket">Tiket Servis</option>
                            <option value="customer">Pelanggan</option>
                            <option value="perangkat">Perangkat Unit</option>
                            <option value="sparepart">Suku Cadang</option>
                            <option value="invoice">Invoice & Pembayaran</option>
                            <option value="diagnosis">Diagnosis Teknis</option>
                            <option value="user">Karyawan / User</option>
                            <option value="presensi">Presensi & Absensi</option>
                            <option value="supplier">Distributor Supplier</option>
                            <option value="rma">Klaim Retur RMA</option>
                            <option value="loaner">Unit Pinjaman</option>
                            <option value="database">Database & Sistem</option>
                            <option value="sistem">Sistem Umum</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setQuickRange("custom");
                                setCurrentPage(1);
                            }}
                            title="Dari Tanggal"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-xs text-slate-800 cursor-pointer"
                        />
                    </div>

                    {/* Date To */}
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setQuickRange("custom");
                                setCurrentPage(1);
                            }}
                            title="Sampai Tanggal"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-xs text-slate-800 cursor-pointer"
                        />
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">
                            Menampilkan hasil log sesuai kriteria filter aktif.
                        </span>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-600 font-bold cursor-pointer transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Reset Semua Filter</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Standardized Table Container */}
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
                        unitLabel="rekaman log"
                        disabled={loading}
                    />
                }
            >
                {loading ? (
                    <TableLoadingState message="Memuat rekam jejak aktivitas audit..." />
                ) : logs.length === 0 ? (
                    <TableEmptyState
                        icon={ShieldAlert}
                        title="Tidak Ada Rekaman Log"
                        description={
                            hasActiveFilters 
                                ? "Tidak ada aktivitas yang cocok dengan kata kunci pencarian atau rentang tanggal yang dipilih." 
                                : "Belum ada aktivitas mutasi yang tercatat dalam log audit sistem."
                        }
                        actionLabel={hasActiveFilters ? "Reset Filter" : undefined}
                        onAction={hasActiveFilters ? handleResetFilters : undefined}
                    />
                ) : (
                    <>
                        {/* Mobile Card View (< sm) */}
                        <div className="lg:hidden divide-y divide-slate-100">
                            {logs.map((log) => {
                                const entityInfo = ENTITY_CONFIG[log.entity] || ENTITY_CONFIG.sistem;
                                const Icon = entityInfo.icon;
                                const actionType = getActionBadge(log.action);
                                const ActionIcon = actionType.icon;

                                const dateObj = new Date(log.created_at);
                                const dateStr = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                                const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                                return (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="p-3.5 active:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-3xs shrink-0">
                                                    {(log.user_nama || "S").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 text-xs truncate">{log.user_nama || "Sistem"}</p>
                                                    <span className="text-3xs text-slate-400 uppercase font-semibold block leading-tight">
                                                        {log.user?.role || "System"}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-black uppercase tracking-wider border ${actionType.color}`}>
                                                <ActionIcon className="w-2.5 h-2.5 shrink-0" />
                                                <span>{actionType.label}</span>
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-800 font-medium mt-1.5 line-clamp-2">{log.action}</p>

                                        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100/80">
                                            <div className="flex items-center gap-1.5 min-w-0 text-3xs text-slate-500 font-mono">
                                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="font-semibold text-slate-700">{dateStr}</span>
                                                <span className="text-slate-400">{timeStr}</span>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold border ${entityInfo.color}`}>
                                                <Icon className="w-3 h-3 shrink-0" />
                                                <span>{entityInfo.label}</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View (>= sm) */}
                        <table className="hidden lg:table w-full text-xs text-left whitespace-nowrap">
                        <thead className="table-header">
                            <tr>
                                <th className="px-4 py-3">Waktu & Tanggal</th>
                                <th className="px-4 py-3">Operator</th>
                                <th className="px-4 py-3">Entitas</th>
                                <th className="px-4 py-3">Kategori</th>
                                <th className="px-4 py-3">Rincian Aktivitas / Mutasi</th>
                                <th className="px-4 py-3 text-right">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log) => {
                                const entityInfo = ENTITY_CONFIG[log.entity] || ENTITY_CONFIG.sistem;
                                const Icon = entityInfo.icon;
                                const actionType = getActionBadge(log.action);
                                const ActionIcon = actionType.icon;

                                const dateObj = new Date(log.created_at);
                                const dateStr = dateObj.toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                });
                                const timeStr = dateObj.toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit"
                                });

                                return (
                                    <tr 
                                        key={log.id} 
                                        onClick={() => setSelectedLog(log)}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="font-semibold text-slate-800">{dateStr}</span>
                                                <span className="text-slate-400 text-2xs">{timeStr}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-3xs shrink-0">
                                                    {(log.user_nama || "S").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 text-xs truncate max-w-[140px]">{log.user_nama || "Sistem"}</p>
                                                    <span className="text-3xs text-slate-400 uppercase font-semibold block leading-tight">
                                                        {log.user?.role || "System"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${entityInfo.color} whitespace-nowrap shrink-0`}>
                                                <Icon className="w-3 h-3 shrink-0" />
                                                <span>{entityInfo.label}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-black uppercase tracking-wider border ${actionType.color}`}>
                                                <ActionIcon className="w-2.5 h-2.5 shrink-0" />
                                                <span>{actionType.label}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-800 text-xs font-medium max-w-lg truncate">
                                            <span className="truncate block" title={log.action}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLog(log);
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-2xs font-bold transition-all shadow-2xs group-hover:border-slate-300"
                                            >
                                                <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                                                <span>Detail</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </>
                )}
            </TableContainer>

            {/* Modal Detail Log Audit */}
            {selectedLog && (
                <div className="modal-shell bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="modal-panel max-w-lg h-auto max-h-[88dvh] z-10">
                        <div className="modal-grabber" />
                        <div className="modal-header flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <ShieldAlert className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Rincian Log Audit #{selectedLog.id}</h3>
                                    <p className="text-2xs text-slate-400">Pusat Transparansi & Rekam Jejak Sistem Anti-Fraud</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="modal-body space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                                <div>
                                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Waktu Kejadian</span>
                                    <span className="font-bold text-slate-800">
                                        {new Date(selectedLog.created_at).toLocaleString("id-ID", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit"
                                        })} WIB
                                    </span>
                                </div>
                                <div>
                                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Objek / Entitas</span>
                                    <span className="font-bold text-slate-800 capitalize">
                                        {ENTITY_CONFIG[selectedLog.entity]?.label || selectedLog.entity}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Operator Pelaksana</span>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-sm">{selectedLog.user_nama || "Sistem Serv.io"}</span>
                                    {selectedLog.user?.role && (
                                        <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700">
                                            {selectedLog.user.role}
                                        </span>
                                    )}
                                </div>
                                {selectedLog.user?.email && (
                                    <span className="text-2xs text-slate-500 block">{selectedLog.user.email}</span>
                                )}
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Aktivitas / Mutasi Tercatat</span>
                                <p className="font-mono text-xs text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                                    {selectedLog.action}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-2xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Integritas Terekam: Catatan audit ini tersimpan permanen dan terkunci anti-tamper.</span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={handleCopyDetail}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? "Tersalin!" : "Salin Info"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Housekeeping / Pembersihan Log */}
            {showCleanupModal && (
                <div className="modal-shell bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="modal-panel max-w-md space-y-3 sm:space-y-4">
                        <div className="modal-grabber" />
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl shrink-0">
                                <Trash2 className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Pembersihan Log Audit Lama</h3>
                                <p className="text-2xs text-slate-500">Housekeeping database untuk mengoptimalkan ruang dan performa</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span className="text-2xs leading-relaxed">
                                    Tindakan ini akan menghapus permanen catatan log mutasi yang berusia lebih tua dari periode yang ditentukan. Log yang baru tidak akan terpengaruh.
                                </span>
                            </div>

                            <div>
                                <label className="text-2xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                    Hapus Catatan Lebih Tua Dari:
                                </label>
                                <select
                                    value={cleanupDays}
                                    onChange={(e) => setCleanupDays(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs font-semibold cursor-pointer"
                                >
                                    <option value={90}>Lebih dari 90 Hari (3 Bulan)</option>
                                    <option value={180}>Lebih dari 180 Hari (6 Bulan - Rekomendasi)</option>
                                    <option value={365}>Lebih dari 365 Hari (1 Tahun)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowCleanupModal(false)}
                                disabled={cleaningUp}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleCleanupLogs}
                                disabled={cleaningUp}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{cleaningUp ? "Membersihkan..." : "Bersihkan Sekarang"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
