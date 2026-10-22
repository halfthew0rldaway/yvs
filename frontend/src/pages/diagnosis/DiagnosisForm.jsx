import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, AlertTriangle, Lightbulb, DollarSign, Send, CheckCircle2 } from "lucide-react";

export default function DiagnosisForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ masalah: "", solusi: "", estimasi_biaya: "" });
    const [diagnosisId, setDiagnosisId] = useState(null);
    const [tiket, setTiket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        async function fetchExisting() {
            try {
                const res = await api.get(`/tiket-servis/${id}`);
                setTiket(res.data);
                if (res.data?.diagnosis) {
                    setForm({
                        masalah: res.data.diagnosis.masalah || "",
                        solusi: res.data.diagnosis.solusi || "",
                        estimasi_biaya: res.data.diagnosis.estimasi_biaya ?? "",
                    });
                    setDiagnosisId(res.data.diagnosis.id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        }
        fetchExisting();
    }, [id]);

    async function handleSave(advanceToApproval = false) {
        if (!form.masalah.trim() || !form.solusi.trim() || form.estimasi_biaya === "") {
            toast.error("Harap lengkapi semua field diagnosis dan estimasi biaya.");
            return;
        }

        setLoading(true);
        try {
            if (diagnosisId) {
                await api.put(`/diagnosis/${diagnosisId}`, form);
            } else {
                await api.post("/diagnosis", { tiket_id: Number(id), ...form });
            }

            if (advanceToApproval) {
                await api.put(`/tiket-servis/${id}`, { status: "menunggu_persetujuan" });
                toast.success("Diagnosis disimpan & tiket dinaikkan ke tahap Penawaran (Menunggu Persetujuan Admin)!");
            } else {
                toast.success("Diagnosis berhasil disimpan!");
            }
            navigate(`/tiket-servis/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan diagnosis");
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const canAdvance = tiket?.status === "didiagnosis";

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/tiket-servis/${id}`)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {diagnosisId ? "Edit Hasil Diagnosis" : "Input Hasil Diagnosis"}
                            </h1>
                            {tiket?.nomor_tiket && (
                                <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                                    {tiket.nomor_tiket}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">Catat temuan masalah, solusi, dan estimasi biaya perbaikan</p>
                    </div>
                </div>

                {canAdvance && (
                    <button
                        type="button"
                        onClick={() => handleSave(true)}
                        disabled={loading}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
                    >
                        <Send className="w-4 h-4" />
                        <span>Simpan & Naikkan ke Penawaran (Admin)</span>
                    </button>
                )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
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
                        Biaya ini adalah perkiraan awal dan akan diajukan ke pelanggan untuk disetujui (ACC).
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate(`/tiket-servis/${id}`)}
                        className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto text-center"
                    >
                        Batal
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => handleSave(false)}
                            disabled={loading}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>Simpan Saja (Draft)</span>
                        </button>

                        {canAdvance ? (
                            <button
                                type="button"
                                onClick={() => handleSave(true)}
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                <span>Simpan & Naikkan ke Penawaran</span>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span>Simpan Perubahan</span>
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
