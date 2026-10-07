import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { ArrowLeft, Plus, Image as ImageIcon, X, History, ClipboardList } from "lucide-react";

export default function LogPerbaikanList() {
    const { user, isAdmin, isTeknisi } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [tiket, setTiket] = useState(null);
    const [catatan, setCatatan] = useState("");
    const [fotoUrl, setFotoUrl] = useState("");
    const [fotoName, setFotoName] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchLogs();
    }, [id]);

    async function fetchLogs() {
        try {
            const [logsRes, tiketRes] = await Promise.all([
                api.get(`/log-perbaikan/${id}`),
                api.get(`/tiket-servis/${id}`)
            ]);
            setLogs(logsRes.data);
            setTiket(tiketRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.startsWith("image/")) {
            toast.error("Harap pilih file gambar");
            return;
        }

        // Check size (max 30MB)
        if (file.size > 30 * 1024 * 1024) {
            toast.error("Ukuran gambar maksimal 30MB");
            return;
        }

        setFotoName(file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            setFotoUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setFotoUrl("");
        setFotoName("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);

        try {
            await api.post("/log-perbaikan", { 
                tiket_id: Number(id), 
                catatan,
                foto_url: fotoUrl || undefined
            });
            setCatatan("");
            removePhoto();
            fetchLogs();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menambahkan log");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/tiket-servis/${id}`)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log Perbaikan</h1>
                        <p className="text-sm text-slate-500">Catatan riwayat perbaikan tiket</p>
                    </div>
                </div>
            </div>

            {/* Form tambah log */}
            {isTeknisi && tiket?.teknisi_id === user?.id && (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden mb-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <Plus className="w-5 h-5 text-blue-500" />
                    <h2 className="text-base font-bold text-slate-900">Tambah Catatan Baru</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Catatan Perbaikan</label>
                        <textarea
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                            rows={3}
                            placeholder="Tuliskan aktivitas perbaikan yang dilakukan..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Foto Dokumentasi (Opsional)</label>
                        
                        {!fotoUrl ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-all cursor-pointer"
                            >
                                <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                                <span className="text-sm font-medium">Klik untuk upload foto</span>
                                <span className="text-xs text-slate-400 mt-1">Maksimal 30MB (JPG, PNG)</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="relative inline-block">
                                <img src={fotoUrl} alt="Preview" className="h-32 rounded-lg border border-slate-200 object-cover shadow-sm" />
                                <button 
                                    type="button" 
                                    onClick={removePhoto}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="text-xs text-slate-500 mt-2 truncate max-w-[200px]">{fotoName}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                <span>Simpan Catatan</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
            )}

            {/* Daftar log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-2 p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                    <History className="w-5 h-5 text-slate-500" />
                    <h2 className="text-base font-bold text-slate-900">Riwayat Catatan</h2>
                </div>
                
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                            <ClipboardList className="w-12 h-12 mb-3 text-slate-300" />
                            <p className="text-sm font-medium text-slate-900">Belum ada riwayat perbaikan</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {logs.map((log, index) => {
                                let dotColor = "bg-blue-500";
                                let badgeColor = "bg-blue-100 text-blue-700";
                                let label = "Perbaikan";

                                if (log.fase === "Diagnosis") {
                                    dotColor = "bg-amber-500";
                                    badgeColor = "bg-amber-100 text-amber-700";
                                    label = "Diagnosis";
                                } else if (log.fase === "Catatan Admin") {
                                    dotColor = "bg-purple-500";
                                    badgeColor = "bg-purple-100 text-purple-700";
                                    label = "Admin";
                                }

                                return (
                                <div key={log.id} className="relative pl-8 pb-6 last:pb-0">
                                    {/* Timeline line */}
                                    {index !== logs.length - 1 && (
                                        <div className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-slate-200"></div>
                                    )}
                                    {/* Timeline dot */}
                                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm ${dotColor}`}></div>
                                    
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="mb-3">
                                            <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>{label}</span>
                                        </div>
                                        <p className="text-slate-800 text-sm whitespace-pre-line mb-3">{log.catatan}</p>
                                        
                                        {log.foto_url && (
                                            <div className="mb-4">
                                                <a href={log.foto_url} target="_blank" rel="noreferrer" className="block w-fit">
                                                    <img 
                                                        src={log.foto_url} 
                                                        alt="Dokumentasi Perbaikan" 
                                                        className="h-32 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                                                    />
                                                </a>
                                                <p className="text-xs text-slate-400 mt-1.5 italic flex items-center gap-1">
                                                    <ImageIcon className="w-3 h-3" /> Klik gambar untuk memperbesar
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center text-xs font-medium text-slate-400">
                                            {new Date(log.created_at).toLocaleDateString("id-ID", { 
                                                weekday: 'long', 
                                                day: 'numeric', 
                                                month: 'long', 
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
