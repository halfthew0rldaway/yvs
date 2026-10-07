import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, MonitorSmartphone, User, Box, Hash } from "lucide-react";

export default function PerangkatForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({
        customer_id: "",
        jenis_perangkat: "",
        merek: "",
        model: "",
        serial_number: "",
    });
    const [customers, setCustomers] = useState([]);
    const [riwayat, setRiwayat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/customer"),
            isEdit ? api.get(`/perangkat/${id}`) : null,
        ])
            .then(([customerRes, perangkatRes]) => {
                setCustomers(customerRes.data);
                if (perangkatRes) {
                    const p = perangkatRes.data;
                    setForm({
                        customer_id: p.customer_id,
                        jenis_perangkat: p.jenis_perangkat,
                        merek: p.merek,
                        model: p.model,
                        serial_number: p.serial_number || "",
                    });
                    setRiwayat(p.tiket_servis || []);
                }
            })
            .catch(() => toast.error("Gagal memuat data"))
            .finally(() => setFetching(false));
    }, [id, isEdit]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/perangkat/${id}`, form);
            } else {
                await api.post("/perangkat", form);
            }
            navigate("/perangkat");
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/perangkat")}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEdit ? "Edit Data Perangkat" : "Tambah Perangkat Baru"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isEdit ? "Perbarui informasi perangkat pelanggan" : "Masukkan informasi perangkat yang akan diservis"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        Customer Pemilik <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={form.customer_id}
                        onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                        required
                    >
                        <option value="">Pilih Customer</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nama} - {c.nomor_telepon}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <MonitorSmartphone className="w-4 h-4 text-slate-400" />
                            Jenis Perangkat <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.jenis_perangkat}
                            onChange={(e) => setForm({ ...form, jenis_perangkat: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                            required
                        >
                            <option value="">Pilih Jenis</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Desktop PC">Desktop PC</option>
                            <option value="Printer">Printer</option>
                            <option value="Penyimpanan (HDD/SSD)">Penyimpanan (HDD/SSD/Flashdisk)</option>
                            <option value="Aksesoris (Mouse/Keyboard)">Aksesoris (Mouse/Keyboard dll)</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Box className="w-4 h-4 text-slate-400" />
                                Merek <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-400">Maksimal 50 karakter</span>
                        </div>
                        <input
                            type="text"
                            value={form.merek}
                            onChange={(e) => setForm({ ...form, merek: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="Contoh: ASUS, HP, Lenovo..."
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <MonitorSmartphone className="w-4 h-4 text-slate-400" />
                                Model <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-400">Maksimal 50 karakter</span>
                        </div>
                        <input
                            type="text"
                            value={form.model}
                            onChange={(e) => setForm({ ...form, model: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="Contoh: ROG Zephyrus G14"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-slate-400" />
                                Serial Number
                            </label>
                            <span className="text-[11px] text-slate-400">Maksimal 100 karakter</span>
                        </div>
                        <input
                            type="text"
                            value={form.serial_number}
                            onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="SN/Nomor Seri perangkat"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate("/perangkat")}
                        className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto text-center"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{loading ? "Menyimpan..." : "Simpan Data"}</span>
                    </button>
                </div>
            </form>

            {/* Riwayat Servis Perangkat (Admin POV) */}
            {isEdit && riwayat.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                        <MonitorSmartphone className="w-5 h-5 text-indigo-500" />
                        Histori Perbaikan Perangkat Ini
                    </h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Nomor Tiket</th>
                                        <th className="px-6 py-4">Tanggal Masuk</th>
                                        <th className="px-6 py-4">Keluhan</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {riwayat.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((tiket) => (
                                        <tr key={tiket.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-900">{tiket.nomor_tiket}</td>
                                            <td className="px-6 py-4">{new Date(tiket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                            <td className="px-6 py-4 truncate max-w-[200px]" title={tiket.keluhan}>{tiket.keluhan}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                                                    tiket.status === 'selesai' || tiket.status === 'diambil' 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : tiket.status === 'dibatalkan'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {tiket.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/tiket-servis/${tiket.id}`)}
                                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors text-xs"
                                                >
                                                    Lihat Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
