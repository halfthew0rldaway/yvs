import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, User, Phone, MapPin } from "lucide-react";

export default function CustomerForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({ nama: "", nomor_telepon: "", alamat: "" });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            api
                .get(`/customer/${id}`)
                .then((res) => {
                    setForm({
                        nama: res.data.nama,
                        nomor_telepon: res.data.nomor_telepon,
                        alamat: res.data.alamat || "",
                    });
                })
                .catch(() => toast.error("Customer tidak ditemukan"))
                .finally(() => setFetching(false));
        }
    }, [id, isEdit]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/customer/${id}`, form);
            } else {
                await api.post("/customer", form);
            }
            navigate("/customer");
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
                    onClick={() => navigate("/customer")}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEdit ? "Edit Data Customer" : "Tambah Customer Baru"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isEdit ? "Perbarui informasi pelanggan yang sudah ada" : "Masukkan informasi pelanggan baru ke dalam sistem"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Min 3 - Max 100 karakter</span>
                    </div>
                    <input
                        type="text"
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        placeholder="Contoh: Budi Santoso"
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            Nomor Telepon <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Hanya angka, 10-13 digit</span>
                    </div>
                    <input
                        type="text"
                        value={form.nomor_telepon}
                        onChange={(e) => setForm({ ...form, nomor_telepon: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        placeholder="Contoh: 081234567890"
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            Alamat
                        </label>
                        <span className="text-[11px] text-slate-400">Maksimal 255 karakter</span>
                    </div>
                    <textarea
                        value={form.alamat}
                        onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-400"
                        rows={3}
                        placeholder="Detail alamat domisili pelanggan..."
                    />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate("/customer")}
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
        </div>
    );
}
