import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, MonitorSmartphone, User, MessageSquare, Package, Camera } from "lucide-react";

export default function TiketServisForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ perangkat_id: "", teknisi_id: "", keluhan: "", kelengkapan: "" });
    const [fotos, setFotos] = useState([]);
    const [perangkats, setPerangkats] = useState([]);
    const [teknisis, setTeknisis] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        Promise.all([api.get("/perangkat"), api.get("/dashboard/teknisi-list")])
            .then(([perangkatRes, teknisiRes]) => {
                setPerangkats(perangkatRes.data);
                setTeknisis(teknisiRes.data);
            })
            .catch(() => toast.error("Gagal memuat data"))
            .finally(() => setFetching(false));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("perangkat_id", form.perangkat_id);
            if (form.teknisi_id) formData.append("teknisi_id", form.teknisi_id);
            formData.append("keluhan", form.keluhan);
            if (form.kelengkapan) formData.append("kelengkapan", form.kelengkapan);
            
            fotos.forEach(foto => {
                formData.append("foto_kondisi", foto);
            });

            await api.post("/tiket-servis", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            navigate("/tiket-servis");
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
                    onClick={() => navigate("/tiket-servis")}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buat Tiket Servis</h1>
                    <p className="text-sm text-slate-500">Mulai proses perbaikan baru</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <MonitorSmartphone className="w-4 h-4 text-slate-400" />
                        Perangkat <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={form.perangkat_id}
                        onChange={(e) => setForm({ ...form, perangkat_id: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                        required
                    >
                        <option value="">Pilih Perangkat</option>
                        {perangkats.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.customer?.nama} - {p.merek} {p.model}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        Teknisi Penanggung Jawab
                    </label>
                    <select
                        value={form.teknisi_id}
                        onChange={(e) => setForm({ ...form, teknisi_id: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    >
                        <option value="">Belum Ditugaskan</option>
                        {teknisis.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.nama}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            Keluhan <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Min 10 - Max 1000 karakter</span>
                    </div>
                    <textarea
                        value={form.keluhan}
                        onChange={(e) => setForm({ ...form, keluhan: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                        rows={4}
                        placeholder="Deskripsikan keluhan customer secara detail..."
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            Kelengkapan Perangkat
                        </label>
                        <span className="text-[11px] text-slate-400">Maksimal 500 karakter</span>
                    </div>
                    <textarea
                        value={form.kelengkapan}
                        onChange={(e) => setForm({ ...form, kelengkapan: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                        rows={2}
                        placeholder="Contoh: Bawa charger ori, tas laptop hitam, tanpa box..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-slate-400" />
                        Foto Kondisi Perangkat (Maks 5)
                    </label>
                    <div className="flex flex-col gap-3">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files.length > 5) {
                                    toast.error("Maksimal 5 foto!");
                                    e.target.value = "";
                                    return;
                                }
                                setFotos(Array.from(e.target.files));
                            }}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all border border-slate-200 rounded-xl"
                        />
                        {fotos.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto py-2">
                                {fotos.map((foto, idx) => (
                                    <div key={idx} className="relative shrink-0">
                                        <img 
                                            src={URL.createObjectURL(foto)} 
                                            alt={`Preview ${idx+1}`} 
                                            className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate("/tiket-servis")}
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
                        <span>{loading ? "Menyimpan..." : "Buat Tiket"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
