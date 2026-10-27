import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useRealtimeEvent from "../../hooks/useRealtime";
import api from "../../services/api";
import {
    Users,
    MonitorSmartphone,
    Ticket,
    CheckCircle2,
    BadgeDollarSign,
    AlertTriangle,
    ClipboardList,
    Search,
    Wrench,
    Activity,
    Clock,
    Download,
    Database,
    ChevronDown,
    FileJson,
    FileSpreadsheet,
    Timer,
    TrendingUp,
    ArrowRight,
    Zap,
    ShieldAlert,
    Calendar,
    MessageCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area, LineChart, Line } from 'recharts';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon: Icon, color = "blue", to }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200 transition-colors",
        amber: "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200 transition-colors",
        red: "bg-red-50 text-red-600 border-red-100 group-hover:bg-red-100 group-hover:border-red-200 transition-colors",
        slate: "bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-slate-100 group-hover:border-slate-300 transition-colors",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 transition-colors",
    };

    const cardContent = (
        <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</p>
                <p className="text-xl xl:text-2xl font-bold text-slate-900 mt-1 truncate" title={value}>{value}</p>
            </div>
            {to && (
                <div className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4" />
                </div>
            )}
        </div>
    );

    if (to) {
        return (
            <Link 
                to={to} 
                className="group bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-center h-full block cursor-pointer"
            >
                {cardContent}
            </Link>
        );
    }

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 flex flex-col justify-center h-full">
            {cardContent}
        </div>
    );
}

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} jam lalu`;
    if (diffHrs < 48) return `Kemarin`;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date);
}

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white text-slate-700 text-sm rounded-lg px-4 py-3 shadow-lg border border-slate-100">
                <p className="font-medium text-slate-500 mb-1">{payload[0].payload.name}</p>
                <p className="font-bold text-lg text-slate-800" style={{ color: payload[0].payload.fillColor || "#3b82f6" }}>
                    {payload[0].value} <span className="text-sm font-medium text-slate-400">Tiket</span>
                </p>
            </div>
        );
    }
    return null;
};

// Mapping warna soft sesuai status tiket
const STATUS_COLORS = {
    "Diterima": "#94a3b8", // slate-400
    "Didiagnosis": "#60a5fa", // blue-400
    "Menunggu Persetujuan": "#fbbf24", // amber-400
    "Disetujui": "#34d399", // emerald-400
    "Dalam Perbaikan": "#a78bfa", // violet-400
    "Selesai": "#10b981", // emerald-500
    "Diambil": "#0ea5e9", // sky-500
    "Dibatalkan": "#f87171", // red-400
};

// Nama singkatan untuk X-Axis agar tidak tabrakan
const SHORT_NAMES = {
    "Menunggu Persetujuan": "Persetujuan",
    "Dalam Perbaikan": "Perbaikan",
    "Dibatalkan": "Batal",
    "Didiagnosis": "Diagnosis"
};

// SLA & Antrean Monitoring Card with Donut Chart and Interactive Filter Cards
function SlaMonitoringCard({ slaSummary, isTeknisi = false }) {
    const navigate = useNavigate();
    const totalActive = slaSummary?.totalActive ?? 0;
    const overdueCount = slaSummary?.overdueCount ?? 0;
    const expressCount = slaSummary?.expressCount ?? 0;
    const pendingApprovalCount = slaSummary?.pendingApprovalCount ?? 0;
    const onTrackCount = slaSummary?.onTrackCount ?? 0;
    const warningCount = slaSummary?.warningCount ?? 0;

    const rawChartData = slaSummary?.chartData || [
        { name: "Sesuai Estimasi", shortName: "On Track", value: onTrackCount, color: "#10b981", percent: 0 },
        { name: "Mendekati Batas", shortName: "Warning (<12j)", value: warningCount, color: "#f59e0b", percent: 0 },
        { name: "Melewati Estimasi", shortName: "Overdue", value: overdueCount, color: "#ef4444", percent: 0 },
        { name: "Menunggu Persetujuan", shortName: "Pause (ACC)", value: pendingApprovalCount, color: "#64748b", percent: 0 },
    ];

    const activeSegments = rawChartData.filter(item => item.value > 0);
    const hasData = totalActive > 0 && activeSegments.length > 0;
    const chartSegments = hasData 
        ? activeSegments 
        : [{ name: "Tidak ada tiket aktif", value: 1, color: "#e2e8f0", isDummy: true }];

    const handleSliceClick = (entry) => {
        if (!entry || entry.isDummy) return;
        const scopePrefix = isTeknisi ? "scope=my&" : "";
        if (entry.name === "Sesuai Estimasi") {
            navigate(`/tiket-servis?${scopePrefix}status=aktif`);
        } else if (entry.name === "Mendekati Batas") {
            navigate(`/tiket-servis?${scopePrefix}sla_urgency=warning`);
        } else if (entry.name === "Melewati Estimasi") {
            navigate(`/tiket-servis?${scopePrefix}sla_urgency=overdue`);
        } else if (entry.name === "Menunggu Persetujuan") {
            navigate(`/tiket-servis?${scopePrefix}status=menunggu_persetujuan`);
        }
    };

    const scopePrefix = isTeknisi ? "scope=my&" : "";

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                        <Timer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Kepatuhan Estimasi SLA & Antrean</h2>
                        <p className="text-xs text-slate-400">Monitoring ketepatan waktu pengerjaan dan prioritas tiket aktif</p>
                    </div>
                </div>
                {overdueCount > 0 && (
                    <Link
                        to={`/tiket-servis?${scopePrefix}sla_urgency=overdue`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all group self-start sm:self-auto"
                    >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>{overdueCount} Melewati Estimasi</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Donut Chart */}
                <div className="w-full lg:w-5/12 flex flex-col items-center">
                    <div className="w-full h-[210px] relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartSegments}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={62}
                                    outerRadius={88}
                                    paddingAngle={hasData ? 3 : 0}
                                    dataKey="value"
                                    stroke="none"
                                    className={hasData ? "cursor-pointer" : ""}
                                    onClick={(e) => e && handleSliceClick(e)}
                                >
                                    {chartSegments.map((entry, index) => (
                                        <Cell 
                                            key={`sla-cell-${index}`} 
                                            fill={entry.color} 
                                            className={hasData ? "hover:opacity-80 transition-opacity cursor-pointer" : ""} 
                                        />
                                    ))}
                                </Pie>
                                {hasData && (
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length && !payload[0].payload.isDummy) {
                                                const item = payload[0].payload;
                                                return (
                                                    <div className="bg-white text-slate-700 text-xs rounded-xl px-3 py-2 shadow-lg border border-slate-100">
                                                        <p className="font-semibold text-slate-800">{item.name}</p>
                                                        <p className="font-bold text-sm mt-0.5" style={{ color: item.color }}>
                                                            {item.value} <span className="text-xs font-normal text-slate-400">tiket ({item.percent}%)</span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                )}
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {totalActive}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                Tiket Aktif
                            </span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-1 text-xs">
                        {rawChartData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                <span className="text-slate-500 font-medium">{item.shortName}:</span>
                                <span className="font-bold text-slate-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4 Cards (2x2 grid) */}
                <div className="w-full lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Melewati Estimasi */}
                    <Link
                        to={`/tiket-servis?${scopePrefix}sla_urgency=overdue`}
                        className={`group p-4 rounded-xl border transition-all flex items-start justify-between ${
                            overdueCount > 0 
                                ? "bg-rose-50/50 border-rose-200 hover:bg-rose-50 hover:border-rose-300 hover:shadow-xs" 
                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${overdueCount > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"}`}>
                                    <ShieldAlert className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">Melewati Estimasi</span>
                            </div>
                            <p className="text-[11px] text-slate-400 pl-0.5">Overdue batas waktu servis</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-extrabold ${overdueCount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                                {overdueCount}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                    </Link>

                    {/* Prioritas Express */}
                    <Link
                        to={`/tiket-servis?${scopePrefix}sla_paket=express`}
                        className={`group p-4 rounded-xl border transition-all flex items-start justify-between ${
                            expressCount > 0 
                                ? "bg-amber-50/50 border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:shadow-xs" 
                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${expressCount > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}>
                                    <Zap className="w-4 h-4 fill-current" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">Prioritas Express</span>
                            </div>
                            <p className="text-[11px] text-slate-400 pl-0.5">Antrean cepat paket kilat</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-extrabold ${expressCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                {expressCount}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                    </Link>

                    {/* Menunggu Persetujuan */}
                    <Link
                        to={`/tiket-servis?${scopePrefix}status=menunggu_persetujuan`}
                        className={`group p-4 rounded-xl border transition-all flex items-start justify-between ${
                            pendingApprovalCount > 0 
                                ? "bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 hover:shadow-xs" 
                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${pendingApprovalCount > 0 ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-400"}`}>
                                    <Clock className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">Menunggu Persetujuan</span>
                            </div>
                            <p className="text-[11px] text-slate-400 pl-0.5">Estimasi SLA dijeda (ACC)</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-extrabold ${pendingApprovalCount > 0 ? "text-slate-700" : "text-slate-400"}`}>
                                {pendingApprovalCount}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                    </Link>

                    {/* Sesuai Estimasi */}
                    <Link
                        to={`/tiket-servis?${scopePrefix}status=aktif`}
                        className={`group p-4 rounded-xl border transition-all flex items-start justify-between ${
                            onTrackCount > 0 
                                ? "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xs" 
                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${onTrackCount > 0 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">Sesuai Estimasi</span>
                            </div>
                            <p className="text-[11px] text-slate-400 pl-0.5">Pengerjaan tepat waktu</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-extrabold ${onTrackCount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                                {onTrackCount}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { isAdmin, user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

    const loadData = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const endpoint = isAdmin ? "/dashboard/admin" : "/dashboard/teknisi";
            const res = await api.get(endpoint);
            
            // Inject fillColor and shortName into chartData
            if (res.data?.chartData) {
                res.data.chartData = res.data.chartData.map(item => ({
                    ...item,
                    shortName: SHORT_NAMES[item.name] || item.name,
                    fillColor: STATUS_COLORS[item.name] || "#93c5fd"
                }));
            }
            
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadData(true);

        // Fallback polling lambat (90 detik) sebagai proteksi jika koneksi SSE sempat freeze
        const fallbackId = setInterval(() => {
            if (document.visibilityState === "visible") {
                loadData(false);
            }
        }, 90000);

        return () => clearInterval(fallbackId);
    }, [loadData]);

    // Real-Time EventSource (SSE): Memperbarui dashboard secara instan tanpa delay saat ada perubahan
    useRealtimeEvent(["dashboard:refresh", "tiket:created", "tiket:updated", "invoice:created"], () => {
        if (document.visibilityState === "visible") {
            loadData(false);
        }
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (isAdmin) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Halo, {user?.nama}!</h1>
                        <p className="text-sm text-slate-500 mt-1">Selamat datang di Dashboard Admin. Berikut ringkasan performa sistem hari ini.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard label="Total Customer" value={data?.totalCustomer || 0} icon={Users} color="blue" to="/customer" />
                    <StatCard label="Total Perangkat" value={data?.totalPerangkat || 0} icon={MonitorSmartphone} color="slate" to="/perangkat" />
                    <StatCard label="Tiket Aktif" value={data?.tiketAktif || 0} icon={Ticket} color="amber" to="/tiket-servis?status=aktif" />
                    <StatCard label="Tiket Selesai" value={data?.tiketSelesai || 0} icon={CheckCircle2} color="green" to="/tiket-servis?status=selesai" />
                    <StatCard label="Pendapatan (Bulan Ini)" value={formatRupiah(data?.pendapatanBulanIni || 0)} icon={BadgeDollarSign} color="indigo" to="/invoice" />
                </div>

                {/* SLA & Antrean Compliance Chart Card */}
                <SlaMonitoringCard slaSummary={data?.slaSummary} isTeknisi={false} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Charts Section */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-[420px]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Distribusi Status Tiket</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Klik salah satu bar untuk melihat daftar tiket terkait</p>
                            </div>
                            <Link to="/tiket-servis" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                                <span>Semua Tiket</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                        {data?.chartData?.length > 0 ? (
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={data.chartData} 
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        onClick={(e) => {
                                            if (e && e.activePayload && e.activePayload.length > 0) {
                                                const clicked = e.activePayload[0].payload;
                                                const statusKey = (clicked.name || "").toLowerCase().replace(/ /g, "_");
                                                if (statusKey) {
                                                    navigate(`/tiket-servis?status=${statusKey}`);
                                                }
                                            }
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="shortName" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            interval={0}
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                                            dy={10} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                            allowDecimals={false} 
                                            dx={-10} 
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} className="cursor-pointer">
                                            {data.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fillColor} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-[300px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Belum ada data tiket
                            </div>
                        )}
                    </div>

                    {/* Sparepart hampir habis */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-[420px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Stok Menipis</h2>
                            </div>
                            <Link to="/sparepart" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                                <span>Katalog</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                        {data?.sparepartHampirHabis?.length > 0 ? (
                            <div className="overflow-y-auto flex-1 custom-scrollbar pr-2 -mr-2">
                                <table className="w-full text-sm text-left">
                                    <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_#e2e8f0]">
                                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                            <th className="font-semibold py-3 px-4 rounded-tl-lg">Nama Suku Cadang</th>
                                            <th className="font-semibold py-3 px-4 text-right rounded-tr-lg">Sisa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.sparepartHampirHabis.map((s) => (
                                            <tr 
                                                key={s.id} 
                                                onClick={(e) => {
                                                    if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                                    navigate('/sparepart');
                                                }}
                                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                title="Klik untuk membuka katalog sparepart"
                                            >
                                                <td className="py-3 px-4 font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{s.nama}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                                        {s.stok}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 flex-1 flex flex-col justify-center bg-slate-50/50 rounded-xl">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mx-auto mb-3 text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <p className="text-slate-600 font-medium">Stok Aman</p>
                                <p className="text-slate-400 text-sm mt-1">Semua sparepart mencukupi.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 3: Tren Pendapatan + Avg Waktu + Top Kerusakan */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tren Pendapatan Bulanan - Area Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-[380px]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tren Pendapatan 6 Bulan</h2>
                            </div>
                            <Link to="/invoice" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                                <span>Rincian Invoice</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                        {data?.trendPendapatan?.length > 0 ? (
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.trendPendapatan} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
                                        <Tooltip
                                            formatter={(value) => [formatRupiah(value), "Pendapatan"]}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                            labelStyle={{ fontWeight: 600, color: '#334155' }}
                                        />
                                        <Area type="monotone" dataKey="pendapatan" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorPendapatan)" dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Belum ada data pendapatan
                            </div>
                        )}
                    </div>

                    {/* Rata-rata Waktu + Top 5 Kerusakan */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        {/* Rata-rata Waktu Penyelesaian */}
                        <Link 
                            to="/tiket-servis?status=selesai"
                            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer block"
                            title="Klik untuk melihat tiket yang telah selesai diperbaiki"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Timer className="w-5 h-5 text-amber-500" />
                                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">Rata-rata Waktu Servis</h2>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{data?.rataRataHari || 0}</span>
                                <span className="text-sm font-medium text-slate-500">hari</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Dari {data?.totalTiketSelesaiDihitung || 0} tiket yang sudah selesai
                            </p>
                        </Link>

                        {/* Top 5 Jenis Kerusakan */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-violet-500" />
                                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">Top Kerusakan</h2>
                                </div>
                                <Link to="/tiket-servis" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                                    <span>Semua</span>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                            {data?.topKerusakan?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.topKerusakan.map((item, i) => {
                                        const max = data.topKerusakan[0]?.value || 1;
                                        const pct = Math.round((item.value / max) * 100);
                                        const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-400"];
                                        return (
                                            <Link 
                                                key={i} 
                                                to={`/tiket-servis?search=${encodeURIComponent(item.name)}`}
                                                className="group block cursor-pointer"
                                                title={`Cari tiket dengan kerusakan: ${item.name}`}
                                            >
                                                <div className="flex items-center justify-between mb-1 gap-2">
                                                    <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600 truncate flex-1 min-w-0 transition-colors">{item.name}</span>
                                                    <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors shrink-0">{item.value} tiket</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${colors[i % colors.length]} group-hover:opacity-80 transition-opacity`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">Belum ada data diagnosis</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Activity Log Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Log Aktivitas Terbaru</h2>
                                <p className="text-sm text-slate-500">Pantau pergerakan data dan tugas di dalam sistem</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link 
                                to="/users" 
                                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-sm group"
                                title="Lihat daftar user & performa"
                            >
                                <span>User & Performa</span>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <button 
                                onClick={async () => {
                                    try {
                                        const today = new Date().toISOString().split("T")[0];
                                        const res = await api.get(`/dashboard/activities/export?date=${today}`, {
                                            responseType: 'blob'
                                        });
                                        const url = window.URL.createObjectURL(new Blob([res.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `activity_log_${today}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.parentNode.removeChild(link);
                                        window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                        console.error("Gagal export CSV", error);
                                    }
                                }}
                                className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                                title="Unduh log aktivitas harian ke format CSV"
                            >
                                <Download className="w-4 h-4 text-slate-500" />
                                <span className="hidden sm:inline">Export Log</span>
                            </button>

                            {/* Backup Database Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
                                    title="Cadangkan seluruh database sistem"
                                >
                                    <Database className="w-4 h-4 text-emerald-400" />
                                    <span>Backup Database</span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                                </button>

                                {exportDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setExportDropdownOpen(false)}></div>
                                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
                                            <div className="py-1">
                                                <button
                                                    onClick={async () => {
                                                        setExportDropdownOpen(false);
                                                        try {
                                                            const res = await api.get('/dashboard/database/export');
                                                            const dbData = res.data;
                                                            delete dbData.exportedAt;
                                                            
                                                            const wb = XLSX.utils.book_new();
                                                            
                                                            for (const key of Object.keys(dbData)) {
                                                                if (Array.isArray(dbData[key]) && dbData[key].length > 0) {
                                                                    const ws = XLSX.utils.json_to_sheet(dbData[key]);
                                                                    XLSX.utils.book_append_sheet(wb, ws, key.substring(0, 31));
                                                                }
                                                            }
                                                            
                                                            XLSX.writeFile(wb, `Servio_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
                                                            toast.success("Database diekspor ke Excel!");
                                                        } catch (error) {
                                                            console.error("Gagal export excel", error);
                                                            toast.error("Gagal mengekspor database ke Excel");
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2 transition-colors font-medium"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                                    Export as Excel
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        setExportDropdownOpen(false);
                                                        try {
                                                            const res = await api.get('/dashboard/database/export', {
                                                                responseType: 'blob'
                                                            });
                                                            const url = window.URL.createObjectURL(new Blob([res.data]));
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.setAttribute('download', `servio_db_backup_${new Date().toISOString().split('T')[0]}.json`);
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            link.parentNode.removeChild(link);
                                                            window.URL.revokeObjectURL(url);
                                                        } catch (error) {
                                                            console.error("Gagal export JSON", error);
                                                            toast.error("Gagal mengekspor database JSON");
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2 transition-colors font-medium border-t border-slate-100"
                                                >
                                                    <FileJson className="w-4 h-4 text-amber-600" />
                                                    Export as JSON
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {data?.recentActivities?.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                            <div className="relative pl-4 space-y-7 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px before:h-full before:w-[2px] before:bg-slate-100 pb-4 pt-2">
                                {data.recentActivities.map((log) => {
                                    // Generate a deterministic color based on the user's ID
                                    const colors = [
                                        "bg-blue-500 ring-blue-100", 
                                        "bg-emerald-500 ring-emerald-100", 
                                        "bg-purple-500 ring-purple-100", 
                                        "bg-amber-500 ring-amber-100", 
                                        "bg-rose-500 ring-rose-100",
                                        "bg-teal-500 ring-teal-100"
                                    ];
                                    const colorIndex = log.user_id ? log.user_id % colors.length : 0;
                                    const userColor = colors[colorIndex];

                                    return (
                                    <div key={log.id} className="relative flex items-start gap-6 group">
                                        <div className={`absolute left-0 w-[14px] h-[14px] rounded-full border-[3px] border-white ring-1 mt-1 shadow-sm transition-transform ${userColor}`} />
                                        <div className="ml-6 flex-1 bg-white">
                                            <p className="text-[15px] font-medium text-slate-700 leading-tight">{log.action}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs text-slate-500 font-bold">{log.user_nama}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3"/>{formatTimeAgo(log.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            Belum ada aktivitas terekam.
                        </div>
                    )}
                </div>

            </div>
        );
    }

    // Dashboard Teknisi
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Halo, {user?.nama}!</h1>
                    <p className="text-sm text-slate-500 mt-1">Selamat datang di Dashboard Teknisi. Berikut tugas perbaikan dan antrean Anda hari ini.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard label="Antrean Tersedia" value={data?.tiketTersedia || 0} icon={Ticket} color="red" to="/tiket-servis?status=diterima" />
                <StatCard label="Tiket Ditugaskan" value={data?.tiketDitugaskan || 0} icon={ClipboardList} color="blue" to="/tiket-servis?scope=my" />
                <StatCard label="Menunggu Diagnosis" value={data?.menungguDiagnosis || 0} icon={Search} color="amber" to="/tiket-servis?scope=my&status=diterima" />
                <StatCard label="Dalam Perbaikan" value={data?.dalamPerbaikan || 0} icon={Wrench} color="indigo" to="/tiket-servis?scope=my&status=dalam_perbaikan" />
                <StatCard label="Selesai Diperbaiki" value={data?.tiketSelesai || 0} icon={CheckCircle2} color="green" to="/tiket-servis?scope=my&status=selesai" />
            </div>

            {/* SLA & Antrean Compliance Chart Card */}
            <SlaMonitoringCard slaSummary={data?.slaSummary} isTeknisi={true} />

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Status Tugas Perbaikan Anda</h2>
                    <Link to="/tiket-servis?scope=my" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                        <span>Buka Semua Tiket Saya</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
                {data?.chartData?.length > 0 ? (
                    <div className="flex flex-col md:flex-row items-center gap-8 h-auto md:h-[300px]">
                        {/* Donut Chart */}
                        <div className="w-full md:w-1/2 h-[250px] md:h-full flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={105}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                            if (e && e.name) {
                                                const statusKey = e.name.toLowerCase().replace(/ /g, "_");
                                                navigate(`/tiket-servis?scope=my&status=${statusKey}`);
                                            }
                                        }}
                                    >
                                        {data.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fillColor} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Inner Circle Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-extrabold text-slate-800">
                                    {data.chartData.reduce((acc, curr) => acc + curr.value, 0)}
                                </span>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Total Tiket</span>
                            </div>
                        </div>

                        {/* Status Summary List */}
                        <div className="w-full md:w-1/2 flex flex-col gap-3 justify-center">
                            {data.chartData.map((entry, index) => {
                                const statusKey = entry.name.toLowerCase().replace(/ /g, "_");
                                return (
                                    <Link 
                                        key={index} 
                                        to={`/tiket-servis?scope=my&status=${statusKey}`}
                                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-200 transition-all shadow-sm group cursor-pointer"
                                        title={`Buka tiket berstatus ${entry.name}`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-4 h-4 rounded-full border-[3px] border-white shadow-sm ring-1 ring-slate-200" style={{ backgroundColor: entry.fillColor }}></div>
                                            <span className="font-semibold text-slate-700 group-hover:text-blue-600 text-sm transition-colors">{entry.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center min-w-[36px] px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-sm group-hover:border-blue-200">
                                                <span className="font-bold text-slate-900 group-hover:text-blue-600">{entry.value}</span>
                                            </div>
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Belum ada tugas tiket
                    </div>
                )}
            </div>

            {/* Active Tickets List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Antrean Pekerjaan Saya</h2>
                            <p className="text-sm text-slate-500">5 Tiket perbaikan aktif terbaru yang sedang Anda tangani</p>
                        </div>
                    </div>
                    <Link to="/tiket-servis?scope=my" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                        <span>Semua Tiket</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
                
                {data?.activeTickets?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiket</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Perangkat</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.activeTickets.map(tiket => (
                                    <tr 
                                        key={tiket.id} 
                                        onClick={(e) => {
                                            if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                            navigate(`/tiket-servis/${tiket.id}`);
                                        }}
                                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                        title="Buka detail tiket servis"
                                    >
                                        <td className="py-3 px-4">
                                            <span className="font-mono font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{tiket.nomor_tiket}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-slate-900">{tiket.perangkat?.merk || tiket.perangkat?.merek} {tiket.perangkat?.model}</p>
                                            <p className="text-xs text-slate-500">{tiket.perangkat?.customer?.nama}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                tiket.status === "diterima" ? "bg-red-50 text-red-600 border border-red-200" :
                                                tiket.status === "didiagnosis" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                                tiket.status === "menunggu_persetujuan" ? "bg-orange-50 text-orange-600 border border-orange-200" :
                                                tiket.status === "disetujui" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                                                "bg-blue-50 text-blue-600 border border-blue-200"
                                            }`}>
                                                {tiket.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                                                Detail <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        Belum ada tiket yang ditugaskan kepada Anda saat ini.
                    </div>
                )}
            </div>

        </div>
    );
}
