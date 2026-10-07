import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Plus, Edit2, Trash2, MonitorSmartphone, Search, Filter } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";

export default function PerangkatList() {
    const [perangkats, setPerangkats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [jenisFilter, setJenisFilter] = useState("");

    useEffect(() => {
        fetchPerangkats();
    }, []);

    async function fetchPerangkats() {
        try {
            const res = await api.get("/perangkat");
            setPerangkats(res.data);
        } catch (err) {
            console.error(err);
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
            setPerangkats(perangkats.filter((p) => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus");
            setDeleteTarget(null);
        }
    }

    const filteredPerangkats = perangkats.filter((p) => {
        const matchesSearch = 
            p.merek.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.customer?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.serial_number && p.serial_number.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesJenis = jenisFilter ? p.jenis_perangkat === jenisFilter : true;
        
        return matchesSearch && matchesJenis;
    });

    const uniqueJenis = [...new Set(perangkats.map(p => p.jenis_perangkat))];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Perangkat</h1>
                    <p className="text-sm text-slate-500 mt-1">Daftar perangkat yang terdaftar di bengkel</p>
                </div>
                <Link
                    to="/perangkat/tambah"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Perangkat</span>
                </Link>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama customer, merek, model, atau SN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        value={jenisFilter}
                        onChange={(e) => setJenisFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm appearance-none cursor-pointer"
                    >
                        <option value="">Semua Jenis Perangkat</option>
                        {uniqueJenis.map((jenis) => (
                            <option key={jenis} value={jenis}>{jenis}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredPerangkats.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Perangkat tidak ditemukan</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Coba gunakan kata kunci pencarian atau filter yang berbeda.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">No</th>
                                    <th className="px-6 py-4 font-semibold">Customer</th>
                                    <th className="px-6 py-4 font-semibold">Jenis</th>
                                    <th className="px-6 py-4 font-semibold">Merek</th>
                                    <th className="px-6 py-4 font-semibold">Model</th>
                                    <th className="px-6 py-4 font-semibold">Serial Number</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPerangkats.map((p, i) => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{p.customer?.nama}</td>
                                        <td className="px-6 py-4 text-slate-600">{p.jenis_perangkat}</td>
                                        <td className="px-6 py-4 text-slate-600">{p.merek}</td>
                                        <td className="px-6 py-4 text-slate-600">{p.model}</td>
                                        <td className="px-6 py-4 text-slate-500">{p.serial_number || "-"}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-opacity">
                                                <Link
                                                    to={`/perangkat/edit/${p.id}`}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClick(p)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

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
