import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
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
    FileSpreadsheet
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import * as XLSX from 'xlsx';

function StatCard({ label, value, icon: Icon, color = "blue" }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        red: "bg-red-50 text-red-600 border-red-100",
        slate: "bg-slate-50 text-slate-600 border-slate-200",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 flex flex-col justify-center h-full">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl border ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</p>
                    <p className="text-xl xl:text-2xl font-bold text-slate-900 mt-1 truncate" title={value}>{value}</p>
                </div>
            </div>
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

export default function Dashboard() {
    const { isAdmin, user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let isFirstLoad = true;

        const loadData = async () => {
            if (isFirstLoad) setLoading(true);
            try {
                const endpoint = isAdmin ? "/dashboard/admin" : "/dashboard/teknisi";
                const res = await api.get(endpoint);
                
                // Inject fillColor and shortName into chartData
                if (res.data.chartData) {
                    res.data.chartData = res.data.chartData.map(item => ({
                        ...item,
                        shortName: SHORT_NAMES[item.name] || item.name,
                        fillColor: STATUS_COLORS[item.name] || "#93c5fd"
                    }));
                }
                
                if (isMounted) setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted && isFirstLoad) {
                    setLoading(false);
                    isFirstLoad = false;
                }
            }
        };

        loadData();

        // Fitur Real-time Sync (Polling setiap 3 detik)
        const intervalId = setInterval(loadData, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isAdmin]);

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
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Halo, {user?.nama}! 👋</h1>
                        <p className="text-sm text-slate-500 mt-1">Selamat datang di Dashboard Admin. Berikut ringkasan performa sistem hari ini.</p>
                    </div>
                    
                    {/* Export Dropdown Group */}
                    <div className="relative">
                        <button 
                            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                        >
                            <Database className="w-4 h-4" />
                            <span>Backup Database</span>
                            <ChevronDown className="w-4 h-4 opacity-70" />
                        </button>

                        {exportDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
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
                                                        XLSX.utils.book_append_sheet(wb, ws, key.substring(0, 31)); // excel sheet names max 31 chars
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
                                        <FileSpreadsheet className="w-4 h-4" />
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
                                            } catch (error) {
                                                console.error("Gagal export JSON", error);
                                                toast.error("Gagal mengekspor database JSON");
                                            }
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2 transition-colors font-medium border-t border-slate-100"
                                    >
                                        <FileJson className="w-4 h-4" />
                                        Export as JSON
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard label="Total Customer" value={data?.totalCustomer || 0} icon={Users} color="blue" />
                    <StatCard label="Total Perangkat" value={data?.totalPerangkat || 0} icon={MonitorSmartphone} color="slate" />
                    <StatCard label="Tiket Aktif" value={data?.tiketAktif || 0} icon={Ticket} color="amber" />
                    <StatCard label="Tiket Selesai" value={data?.tiketSelesai || 0} icon={CheckCircle2} color="green" />
                    <StatCard label="Pendapatan (Bulan Ini)" value={formatRupiah(data?.pendapatanBulanIni || 0)} icon={BadgeDollarSign} color="indigo" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Charts Section */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-[420px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Distribusi Status Tiket</h2>
                        </div>
                        {data?.chartData?.length > 0 ? (
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                            {data.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fillColor} />
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
                        <div className="flex items-center gap-2 mb-6">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Stok Menipis</h2>
                        </div>
                        {data?.sparepartHampirHabis?.length > 0 ? (
                            <div className="overflow-y-auto flex-1 custom-scrollbar pr-2 -mr-2">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                            <th className="font-semibold py-3 px-4 rounded-tl-lg">Nama Suku Cadang</th>
                                            <th className="font-semibold py-3 px-4 text-right rounded-tr-lg">Sisa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.sparepartHampirHabis.map((s) => (
                                            <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-700">{s.nama}</td>
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
                                } catch (error) {
                                    console.error("Gagal export CSV", error);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export CSV Hari Ini</span>
                        </button>
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Halo, {user?.nama}! 👋</h1>
                    <p className="text-sm text-slate-500 mt-1">Selamat datang di Dashboard Teknisi. Berikut tugas perbaikan dan antrean Anda hari ini.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Antrean Tersedia" value={data?.tiketTersedia || 0} icon={Ticket} color="red" />
                <StatCard label="Tiket Ditugaskan" value={data?.tiketDitugaskan || 0} icon={ClipboardList} color="blue" />
                <StatCard label="Menunggu Diagnosis" value={data?.menungguDiagnosis || 0} icon={Search} color="amber" />
                <StatCard label="Dalam Perbaikan" value={data?.dalamPerbaikan || 0} icon={Wrench} color="indigo" />
                <StatCard label="Selesai Diperbaiki" value={data?.tiketSelesai || 0} icon={CheckCircle2} color="green" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Status Tugas Perbaikan Anda</h2>
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
                                    >
                                        {data.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fillColor} />
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
                            {data.chartData.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-4 h-4 rounded-full border-[3px] border-white shadow-sm ring-1 ring-slate-200" style={{ backgroundColor: entry.fillColor }}></div>
                                        <span className="font-semibold text-slate-700 text-sm">{entry.name}</span>
                                    </div>
                                    <div className="flex items-center justify-center min-w-[36px] px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <span className="font-bold text-slate-900">{entry.value}</span>
                                    </div>
                                </div>
                            ))}
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
                                    <tr key={tiket.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="font-mono font-medium text-slate-900">{tiket.nomor_tiket}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-slate-900">{tiket.perangkat?.merk} {tiket.perangkat?.model}</p>
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
                                            <Link to={`/tiket-servis/${tiket.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Lihat Detail</Link>
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
