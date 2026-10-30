import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
    X, 
    Wrench, 
    CheckCircle2, 
    Clock, 
    DollarSign, 
    TrendingUp, 
    Star, 
    Search, 
    ExternalLink, 
    Laptop, 
    User, 
    Phone, 
    Calendar,
    RotateCcw,
    Layers,
    AlertCircle,
    CheckCircle
} from "lucide-react";
import api from "../services/api";
import UserAvatar from "./common/UserAvatar";

const STATUS_BADGES = {
    diterima: "bg-blue-50 text-blue-700 border-blue-200",
    didiagnosis: "bg-purple-50 text-purple-700 border-purple-200",
    menunggu_persetujuan: "bg-amber-50 text-amber-700 border-amber-200",
    disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dalam_perbaikan: "bg-indigo-50 text-indigo-700 border-indigo-200",
    selesai: "bg-green-50 text-green-700 border-green-200",
    diambil: "bg-slate-50 text-slate-700 border-slate-200",
    dibatalkan: "bg-red-50 text-red-600 border-red-200",
};

export default function TechnicianPerformanceModal({ isOpen, onClose, technicianId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'selesai' | 'aktif' | 'dibatalkan'
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen && technicianId) {
            fetchDetail();
        } else {
            setData(null);
            setStatusFilter("all");
            setSearchQuery("");
        }
    }, [isOpen, technicianId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users/performance/${technicianId}`);
            setData(res.data);
        } catch (err) {
            console.error("Gagal memuat detail performa teknisi:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
    };

    const teknisi = data?.teknisi;
    const summary = data?.summary || {};
    const tickets = data?.tickets || [];

    // Filter tickets
    const filteredTickets = tickets.filter(tk => {
        // Status filter
        if (statusFilter === "selesai") {
            if (!["selesai", "diambil"].includes(tk.status)) return false;
        } else if (statusFilter === "aktif") {
            if (["selesai", "diambil", "dibatalkan"].includes(tk.status)) return false;
        } else if (statusFilter === "dibatalkan") {
            if (tk.status !== "dibatalkan") return false;
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchNo = tk.nomor_tiket?.toLowerCase().includes(q);
            const matchCust = tk.customer?.nama?.toLowerCase().includes(q) || tk.customer?.nomor_telepon?.includes(q);
            const matchDev = `${tk.perangkat?.merek || ""} ${tk.perangkat?.model || ""}`.toLowerCase().includes(q);
            const matchKeluhan = tk.keluhan?.toLowerCase().includes(q);
            return matchNo || matchCust || matchDev || matchKeluhan;
        }

        return true;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* 60fps Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs modal-backdrop" 
                onClick={onClose} 
            />

            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] modal-surface z-10">
                
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        {loading ? (
                            <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
                        ) : (
                            <UserAvatar user={teknisi} size="w-12 h-12" textSize="text-base" rounded="rounded-2xl" />
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                    {loading ? "Memuat..." : teknisi?.nama}
                                </h2>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                                    <Wrench className="w-3 h-3" />
                                    <span>Teknisi Perbaikan</span>
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                                {loading ? "..." : teknisi?.email}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0 cursor-pointer"
                        title="Tutup Modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400 space-y-3">
                            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs font-medium">Memuat riwayat tiket & analitik performa teknisi...</p>
                        </div>
                    ) : (
                        <>
                            {/* KPI Metrics Summary Strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                                    <span className="text-2xs font-semibold text-slate-400 block">Total Tiket</span>
                                    <span className="text-lg font-bold text-slate-900 mt-0.5 block">{summary.totalAssigned || 0}</span>
                                    <span className="text-3xs text-slate-500">Ditugaskan</span>
                                </div>

                                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
                                    <span className="text-2xs font-semibold text-emerald-700 block">Selesai / Diambil</span>
                                    <span className="text-lg font-bold text-emerald-800 mt-0.5 block">{summary.completedCount || 0}</span>
                                    <span className="text-3xs text-emerald-600">{summary.completionRate || 0}% Tingkat Selesai</span>
                                </div>

                                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100">
                                    <span className="text-2xs font-semibold text-blue-700 block">Sedang Dikerjakan</span>
                                    <span className="text-lg font-bold text-blue-800 mt-0.5 block">
                                        {(summary.inProgressCount || 0) + (summary.inDiagnosisCount || 0)}
                                    </span>
                                    <span className="text-3xs text-blue-600">Aktif di Meja Servis</span>
                                </div>

                                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
                                    <span className="text-2xs font-semibold text-amber-700 block">Nilai Pekerjaan</span>
                                    <span className="text-xs sm:text-sm font-bold text-amber-900 mt-1 block truncate">
                                        {formatCurrency(summary.totalRevenue)}
                                    </span>
                                    <span className="text-3xs text-amber-700">Omset Tiket Selesai</span>
                                </div>

                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                                    <span className="text-2xs font-semibold text-slate-400 block">Rata-rata Waktu</span>
                                    <span className="text-base font-bold text-slate-800 mt-0.5 block">
                                        {summary.avgRepairHours > 0 ? `${summary.avgRepairHours} jam` : "N/A"}
                                    </span>
                                    <span className="text-3xs text-slate-500">Durasi Pengerjaan</span>
                                </div>

                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                                    <span className="text-2xs font-semibold text-slate-400 block">Rating Pelanggan</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        <span className="text-base font-bold text-slate-800">
                                            {summary.avgRating ? summary.avgRating : "5.0"}
                                        </span>
                                    </div>
                                    <span className="text-3xs text-slate-500">
                                        {summary.ratingCount ? `${summary.ratingCount} Ulasan` : "Rating Default"}
                                    </span>
                                </div>
                            </div>

                            {/* Filters & Search Bar */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                {/* Segmented Status Tabs */}
                                <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("all")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                            statusFilter === "all" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Semua ({tickets.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("selesai")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                            statusFilter === "selesai" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Selesai ({summary.completedCount || 0})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("aktif")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                            statusFilter === "aktif" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Aktif ({(summary.inProgressCount || 0) + (summary.inDiagnosisCount || 0)})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("dibatalkan")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                            statusFilter === "dibatalkan" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Dibatalkan ({summary.cancelledCount || 0})
                                    </button>
                                </div>

                                {/* Search Input */}
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari no tiket, pelanggan, atau unit..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Ticket Detail Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                <div className="overflow-x-auto max-h-[46vh] custom-scrollbar">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3">No. Tiket</th>
                                                <th className="px-4 py-3">Perangkat & Keluhan</th>
                                                <th className="px-4 py-3">Pelanggan</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Biaya Servis</th>
                                                <th className="px-4 py-3">Waktu & Durasi</th>
                                                <th className="px-4 py-3 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredTickets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                                                            <Layers className="w-5 h-5" />
                                                        </div>
                                                        <p className="font-semibold text-slate-700">Tidak ada tiket yang cocok</p>
                                                        <p className="text-3xs text-slate-400 mt-0.5">
                                                            Coba ubah kata kunci pencarian atau tab status di atas.
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTickets.map((tk) => {
                                                    const isCompleted = ["selesai", "diambil"].includes(tk.status);

                                                    return (
                                                        <tr key={tk.id} className="hover:bg-slate-50/70 transition-colors">
                                                            <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-blue-600">
                                                                <Link 
                                                                    to={`/tiket-servis/${tk.id}`}
                                                                    className="hover:underline flex items-center gap-1 group"
                                                                    title="Buka Halaman Tiket Servis"
                                                                >
                                                                    <span>{tk.nomor_tiket}</span>
                                                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </Link>
                                                            </td>

                                                            <td className="px-4 py-3.5 min-w-[180px] max-w-[240px]">
                                                                <div className="font-semibold text-slate-900 truncate">
                                                                    {tk.perangkat?.merek} {tk.perangkat?.model}
                                                                </div>
                                                                <p className="text-3xs text-slate-500 line-clamp-1 mt-0.5" title={tk.keluhan}>
                                                                    {tk.keluhan || "Tidak ada keluhan tertulis"}
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                                <div className="font-medium text-slate-800 truncate max-w-[140px]">
                                                                    {tk.customer?.nama || "-"}
                                                                </div>
                                                                <span className="text-3xs font-mono text-slate-400">
                                                                    {tk.customer?.nomor_telepon || "-"}
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold border capitalize ${STATUS_BADGES[tk.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                                                    {tk.status.replace(/_/g, " ")}
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                                <div className="font-semibold text-slate-900 font-mono">
                                                                    {formatCurrency(tk.invoice?.total_biaya || 0)}
                                                                </div>
                                                                <span className={`text-3xs font-semibold ${
                                                                    tk.invoice?.status_pembayaran === "lunas" 
                                                                        ? "text-emerald-600" 
                                                                        : "text-slate-400"
                                                                }`}>
                                                                    {tk.invoice?.status_pembayaran === "lunas" ? "Lunas" : "Belum Lunas"}
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-2xs">
                                                                <div>
                                                                    Masuk: {new Date(tk.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                                                </div>
                                                                {isCompleted && tk.completed_at ? (
                                                                    <div className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                        <span>
                                                                            {tk.duration_hours > 0 ? `${tk.duration_hours} jam` : "Selesai"}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        <span>Sedang berjalan</span>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                                <Link
                                                                    to={`/tiket-servis/${tk.id}`}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-2xs font-semibold transition-colors"
                                                                >
                                                                    <span>Detail</span>
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <span className="text-2xs text-slate-500 font-medium">
                        Menampilkan {filteredTickets.length} dari {tickets.length} total tiket penugasan
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>

            </div>
        </div>
    );
}

