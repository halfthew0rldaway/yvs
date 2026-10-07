import toast from 'react-hot-toast';
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, AlertTriangle, Lightbulb, DollarSign } from "lucide-react";

export default function DiagnosisForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ masalah: "", solusi: "", estimasi_biaya: "" });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/diagnosis", { tiket_id: Number(id), ...form });
            navigate(`/tiket-servis/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(`/tiket-servis/${id}`)}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Input Hasil Diagnosis</h1>
                    <p className="text-sm text-slate-500">Catat temuan masalah dan solusi perbaikan</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-slate-400" />
                        Masalah yang Ditemukan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={form.masalah}
                        onChange={(e) => setForm({ ...form, masalah: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-400"
                        rows={3}
                        placeholder="Deskripsikan masalah teknis yang teridentifikasi secara jelas..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-slate-400" />
                        Solusi yang Direkomendasikan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={form.solusi}
                        onChange={(e) => setForm({ ...form, solusi: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-400"
                        rows={3}
                        placeholder="Tindakan atau perbaikan yang perlu dilakukan..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        Estimasi Biaya Jasa & Part (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={form.estimasi_biaya}
                        onChange={(e) => setForm({ ...form, estimasi_biaya: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        placeholder="Contoh: 150000"
                        min="0"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Biaya ini adalah perkiraan awal dan akan diajukan ke pelanggan untuk disetujui.
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate(`/tiket-servis/${id}`)}
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
                        <span>{loading ? "Menyimpan..." : "Simpan Diagnosis"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
