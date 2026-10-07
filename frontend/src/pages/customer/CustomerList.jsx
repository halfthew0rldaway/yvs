import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Search, Plus, Edit2, Trash2, Users } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";

export default function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    async function fetchCustomers() {
        try {
            const params = search ? { search } : {};
            const res = await api.get("/customer", { params });
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleDeleteClick(customer) {
        setDeleteTarget(customer);
    }

    async function executeDelete() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/customer/${deleteTarget.id}`);
            setCustomers(customers.filter((c) => c.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus");
            setDeleteTarget(null);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        fetchCustomers();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Customer</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola data pelanggan bengkel Anda</p>
                </div>
                <Link
                    to="/customer/tambah"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Customer</span>
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                    <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau no telp..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            Cari
                        </button>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Tidak ada customer</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Anda belum menambahkan data customer atau tidak ada yang cocok dengan pencarian.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">No</th>
                                    <th className="px-6 py-4 font-semibold">Nama</th>
                                    <th className="px-6 py-4 font-semibold">Nomor Telepon</th>
                                    <th className="px-6 py-4 font-semibold">Alamat</th>
                                    <th className="px-6 py-4 font-semibold text-center">Perangkat</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.map((c, i) => (
                                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{c.nama}</td>
                                        <td className="px-6 py-4 text-slate-600">{c.nomor_telepon}</td>
                                        <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{c.alamat || "-"}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium text-xs">
                                                {c.perangkat?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-opacity">
                                                <Link
                                                    to={`/customer/edit/${c.id}`}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClick(c)}
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
                title="Hapus Customer"
                message={`Apakah Anda yakin ingin menghapus customer "${deleteTarget?.nama}"? Data yang sudah dihapus tidak dapat dikembalikan.`}
                onConfirm={executeDelete}
                onCancel={() => setDeleteTarget(null)}
                confirmText="Hapus"
                isDanger={true}
            />
        </div>
    );
}
