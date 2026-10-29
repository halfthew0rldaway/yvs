import React, { useState, useEffect, useCallback } from "react";
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
    Shield
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
        label: "Perangkat",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Laptop
    },
    sparepart: {
        label: "Sparepart",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Wrench
    },
    invoice: {
        label: "Invoice",
        color: "bg-teal-50 text-teal-700 border-teal-200",
        icon: FileText
    },
    user: {
        label: "Karyawan / User",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: User
    },
    supplier: {
        label: "Supplier",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: Building2
    },
    rma: {
        label: "Klaim RMA",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: RefreshCw
    },
    diagnosis: {
        label: "Diagnosis",
        color: "bg-violet-50 text-violet-700 border-violet-200",
        icon: CheckCircle2
    },
    sistem: {
        label: "Sistem",
        color: "bg-slate-50 text-slate-700 border-slate-200",
        icon: Shield
    }
};

export default function AuditLogList() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalLogs: 0, todayLogs: 0, entities: [] });

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEntity, setSelectedEntity] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/activity-logs/stats");
            setStats(res.data || { totalLogs: 0, todayLogs: 0, entities: [] });
        } catch (_) {}
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
            toast.error(err.response?.data?.message || "Gagal memuat log aktivitas");
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

    function handleResetFilters() {
        setSearchTerm("");
        setSelectedEntity("all");
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
    }

    async function handleExportExcel() {
        try {
            setIsExporting(true);
            // Fetch unpaginated filtered logs (up to 500 records)
            const params = {
                sortOrder: "desc"
            };
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
                "Waktu Kejadian": new Date(item.created_at).toLocaleString("id-ID"),
                "Nama Operator": item.user_nama || "Sistem",
                "Role": item.user?.role || "-",
                "Entitas": ENTITY_CONFIG[item.entity]?.label || item.entity || "Sistem",
                "Rincian Mutasi / Aktivitas": item.action
            }));

            const XLSX = await import("xlsx");
            const ws = XLSX.utils.json_to_sheet(exportData);
            ws["!cols"] = [
                { wch: 6 },
                { wch: 22 },
                { wch: 20 },
                { wch: 14 },
                { wch: 18 },
                { wch: 60 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Audit Trail");
            const filename = `Audit_Log_Yangversa_${new Date().toISOString().split("T")[0]}.xlsx`;
            XLSX.writeFile(wb, filename);

            toast.success("Log audit aktivitas berhasil diekspor ke Excel!");
        } catch (err) {
            toast.error("Gagal mengekspor data: " + err.message);
        } finally {
            setIsExporting(false);
        }
    }

    const hasActiveFilters = Boolean(searchTerm || selectedEntity !== "all" || startDate || endDate);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                Log Audit Aktivitas (Anti-Fraud)
                            </h1>
                            <p className="text-xs text-slate-500">
                                Rekam jejak seluruh mutasi data sensitif, revisi ACC, klaim garansi, invoice, dan master data
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchLogs}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                        title="Segarkan Log"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
                        <span>Segarkan</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={isExporting || totalItems === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        title="Unduh Laporan Audit ke Excel (.xlsx)"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isExporting ? "Mengekspor..." : "Ekspor Excel"}</span>
                    </button>
                </div>
            </div>

            {/* Statistics Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Log Audit</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.totalLogs.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktivitas Hari Ini</p>
                        <p className="text-2xl font-black text-emerald-600 mt-0.5">{stats.todayLogs.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entitas Terbanyak</p>
                        <p className="text-sm font-bold text-slate-800 mt-1 capitalize">
                            {stats.entities[0] ? `${stats.entities[0].entity} (${stats.entities[0].count})` : "-"}
                        </p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Shield className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari operator atau rincian mutasi..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-xs text-slate-800"
                        />
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
                            <option value="invoice">Invoice / Faktur</option>
                            <option value="diagnosis">Diagnosis Teknis</option>
                            <option value="user">Karyawan / User</option>
                            <option value="supplier">Distributor Supplier</option>
                            <option value="rma">Klaim RMA</option>
                            <option value="loaner">Unit Pinjaman</option>
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
                                setCurrentPage(1);
                            }}
                            title="Sampai Tanggal"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-xs text-slate-800 cursor-pointer"
                        />
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-500">
                            Menampilkan hasil log dengan kriteria filter aktif.
                        </span>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-600 font-semibold cursor-pointer transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Reset Filter</span>
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
                                ? "Tidak ada aktivitas yang sesuai dengan kata kunci atau rentang tanggal yang dipilih." 
                                : "Belum ada aktivitas mutasi yang tercatat dalam log audit sistem."
                        }
                        actionLabel={hasActiveFilters ? "Reset Filter" : undefined}
                        onAction={hasActiveFilters ? handleResetFilters : undefined}
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
                            <tr>
                                <th className="px-6 py-3.5">Waktu & Tanggal</th>
                                <th className="px-6 py-3.5">Operator</th>
                                <th className="px-6 py-3.5">Entitas</th>
                                <th className="px-6 py-3.5">Rincian Aktivitas / Mutasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log) => {
                                const entityInfo = ENTITY_CONFIG[log.entity] || ENTITY_CONFIG.sistem;
                                const Icon = entityInfo.icon;
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
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-3.5 font-mono text-xs text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="font-semibold text-slate-800">{dateStr}</span>
                                                <span className="text-slate-400 text-[11px]">{timeStr}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                                    {(log.user_nama || "S").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-xs">{log.user_nama || "Sistem"}</p>
                                                    {log.user?.role && (
                                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                                            {log.user.role}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${entityInfo.color}`}>
                                                <Icon className="w-3 h-3" />
                                                <span>{entityInfo.label}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-800 text-xs font-medium max-w-xl truncate">
                                            <span title={log.action}>
                                                {log.action}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </TableContainer>
        </div>
    );
}

