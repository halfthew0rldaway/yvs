import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { Plus, Ticket, ArrowRight } from "lucide-react";

const STATUS_LABELS = {
    diterima: { label: "Diterima", color: "bg-blue-100 text-blue-700 border-blue-200" },
    didiagnosis: { label: "Didiagnosis", color: "bg-purple-100 text-purple-700 border-purple-200" },
    menunggu_persetujuan: { label: "Menunggu Persetujuan", color: "bg-amber-100 text-amber-700 border-amber-200" },
    disetujui: { label: "Disetujui", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    dalam_perbaikan: { label: "Dalam Perbaikan", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    selesai: { label: "Selesai", color: "bg-green-100 text-green-700 border-green-200" },
    diambil: { label: "Diambil", color: "bg-slate-100 text-slate-700 border-slate-200" },
    dibatalkan: { label: "Dibatalkan", color: "bg-red-100 text-red-600 border-red-200" },
};

export default function TiketServisList() {
    const { isAdmin, user } = useAuth();
    const [allTikets, setAllTikets] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllTikets();
    }, []);

    async function fetchAllTikets() {
        setLoading(true);
        try {
            const res = await api.get("/tiket-servis");
            setAllTikets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const tikets = allTikets.filter(t => {
        if (!isAdmin && t.teknisi && t.teknisi.id !== user?.id) return false;
        if (filter && t.status !== filter) return false;
        return true;
    });
    const unassignedCount = allTikets.filter(t => t.status === "diterima" && !t.teknisi).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tiket Servis</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola tiket perbaikan perangkat pelanggan</p>
                </div>
                {isAdmin && (
                    <Link
                        to="/tiket-servis/tambah"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Buat Tiket</span>
                    </Link>
                )}
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilter("")}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        !filter 
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    Semua
                </button>
                {Object.entries(STATUS_LABELS).map(([key, val]) => {
                    const showBadge = key === "diterima" && unassignedCount > 0 && !isAdmin;
                    return (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`relative px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                                filter === key 
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {val.label}
                            {showBadge && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                    {unassignedCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : tikets.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
                                <Ticket className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Tidak ada tiket servis</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Belum ada tiket servis yang dibuat atau sesuai dengan filter.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">No Tiket</th>
                                    <th className="px-6 py-4 font-semibold">Customer</th>
                                    <th className="px-6 py-4 font-semibold">Perangkat</th>
                                    <th className="px-6 py-4 font-semibold">Teknisi</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tikets.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{t.nomor_tiket}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{t.perangkat?.customer?.nama}</td>
                                        <td className="px-6 py-4 text-slate-600">{t.perangkat?.merek} {t.perangkat?.model}</td>
                                        <td className="px-6 py-4 text-slate-600">{t.teknisi?.nama || "-"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_LABELS[t.status]?.color || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                {STATUS_LABELS[t.status]?.label || t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end transition-opacity">
                                                <Link
                                                    to={`/tiket-servis/${t.id}`}
                                                    className="inline-flex items-center gap-1.5 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-xs"
                                                >
                                                    <span>Detail</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
