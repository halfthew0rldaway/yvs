import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";
import { Search, LogIn, Phone, Ticket as TicketIcon, SearchX, CheckCircle, PackageSearch, PenTool, ChevronDown, ChevronUp, User, Calendar, MonitorSmartphone } from "lucide-react";

const STATUS_LABELS = {
    diterima: { label: "Diterima", color: "bg-blue-50 text-blue-700 border-blue-200" },
    didiagnosis: { label: "Didiagnosis", color: "bg-purple-50 text-purple-700 border-purple-200" },
    menunggu_persetujuan: { label: "Menunggu Persetujuan", color: "bg-amber-50 text-amber-700 border-amber-200" },
    disetujui: { label: "Disetujui", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    dalam_perbaikan: { label: "Dalam Perbaikan", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    selesai: { label: "Selesai", color: "bg-green-50 text-green-700 border-green-200" },
    diambil: { label: "Diambil", color: "bg-slate-50 text-slate-700 border-slate-200" },
    dibatalkan: { label: "Dibatalkan", color: "bg-red-50 text-red-600 border-red-200" },
};

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

function TrackingCard({ t, defaultExpanded = false }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    let parsedFotoKondisi = [];
    if (t.foto_kondisi) {
        try {
            parsedFotoKondisi = typeof t.foto_kondisi === 'string' ? JSON.parse(t.foto_kondisi) : t.foto_kondisi;
        } catch(e) {
            console.error("Error parsing foto_kondisi:", e);
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 mb-6 w-full flex flex-col">
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-lg text-slate-900">{t.nomor_tiket}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                            <MonitorSmartphone className="w-3 h-3" />
                            {t.jenis_perangkat}
                        </span>
                    </div>
                    <h4 className="text-slate-800 font-bold text-lg leading-tight">{t.perangkat}</h4>
                    <div className="flex flex-col gap-1.5 mt-2.5">
                        <p className="text-slate-500 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Masuk: {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Teknisi: <span className="text-slate-700 font-semibold">{t.teknisi}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto h-full mt-4 sm:mt-0">
                    <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wide ${STATUS_LABELS[t.status]?.color}`}>
                        {STATUS_LABELS[t.status]?.label}
                    </span>
                    <button className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors shadow-sm">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 sm:p-8 animate-in slide-in-from-top-2 fade-in duration-200 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h5 className="text-slate-500 font-medium mb-1">Keluhan Pelanggan</h5>
                            <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed min-h-[4rem]">{t.keluhan}</p>
                        </div>
                        <div>
                            <h5 className="text-slate-500 font-medium mb-1">Kelengkapan Perangkat</h5>
                            <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed min-h-[4rem]">{t.kelengkapan || "-"}</p>
                        </div>
                    </div>

                    {parsedFotoKondisi.length > 0 && (
                        <div className="mb-8">
                            <h5 className="text-slate-500 font-medium mb-2">Foto Kondisi Awal</h5>
                            <div className="flex flex-wrap gap-3">
                                {parsedFotoKondisi.map((foto, idx) => (
                                    <a key={idx} href={foto} target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-lg overflow-hidden hover:border-blue-500 transition-all">
                                        <img src={foto} alt={`Kondisi Awal ${idx+1}`} className="w-24 h-24 object-cover" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {t.diagnosis && (
                        <div className="mb-8 pt-6 border-t border-slate-100">
                            <h5 className="font-semibold text-slate-900 mb-4">Hasil Diagnosis</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h6 className="text-slate-500 font-medium mb-1">Masalah</h6>
                                    <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed min-h-[4rem]">{t.diagnosis.masalah}</p>
                                </div>
                                <div>
                                    <h6 className="text-slate-500 font-medium mb-1">Solusi</h6>
                                    <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed min-h-[4rem]">{t.diagnosis.solusi}</p>
                                </div>
                                <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 mt-2 flex justify-between items-center">
                                    <span className="text-blue-600 font-medium text-sm">Estimasi Biaya Awal</span>
                                    <span className="text-blue-700 font-semibold text-base">{formatRupiah(t.diagnosis.estimasi_biaya)}</span>
                                </div>
                                {t.invoice && (
                                    <div className="md:col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-200 mt-2 flex justify-between items-center shadow-sm">
                                        <span className="text-emerald-700 font-bold">Total Biaya Akhir (Real)</span>
                                        <span className="text-emerald-800 font-black text-xl">{formatRupiah(t.invoice.total_biaya)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-6 border-t border-slate-100">
                        <h5 className="font-semibold text-slate-900 mb-4">Riwayat Perbaikan</h5>
                        {t.log_perbaikan && t.log_perbaikan.length > 0 ? (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                                {t.log_perbaikan.sort((a,b) => new Date(a.created_at) - new Date(b.created_at)).map((log, logIdx) => {
                                    let badgeColor = "bg-blue-100 text-blue-700";
                                    let label = "Perbaikan";

                                    if (log.fase === "Diagnosis") {
                                        badgeColor = "bg-amber-100 text-amber-700";
                                        label = "Diagnosis";
                                    } else if (log.fase === "Catatan Admin") {
                                        badgeColor = "bg-purple-100 text-purple-700";
                                        label = "Admin";
                                    }
                                    
                                    return (
                                        <div key={logIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="mb-2">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>{label}</span>
                                            </div>
                                            <p className="text-slate-900 text-sm whitespace-pre-line mb-2 leading-relaxed">{log.catatan}</p>
                                            
                                            {log.foto_url && (
                                                <div className="mb-3">
                                                    <a href={log.foto_url} target="_blank" rel="noreferrer" className="block w-fit">
                                                        <img src={log.foto_url} alt="Dokumentasi Perbaikan" className="h-24 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity shadow-sm" />
                                                    </a>
                                                </div>
                                            )}
                                            
                                            <p className="text-xs text-slate-400 font-medium">
                                                {new Date(log.created_at).toLocaleDateString("id-ID", { 
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Belum ada riwayat perbaikan.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Tracking() {
    const [trackMethod, setTrackMethod] = useState("tiket");
    const [nomorTelepon, setNomorTelepon] = useState("");
    const [nomorTiket, setNomorTiket] = useState("");
    const [results, setResults] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleTrack(e) {
        e.preventDefault();
        setError("");
        setResults(null);
        setLoading(true);

        try {
            const res = await api.post("/tracking", {
                nomorTelepon: trackMethod === "telepon" ? nomorTelepon : undefined,
                nomorTiket: trackMethod === "tiket" ? nomorTiket : undefined,
            });
            setResults(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Gagal melacak servis");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <PenTool className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Serv.io</h1>
                    </div>
                </div>
            </header>

            <main className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 mx-auto max-w-none">
                
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                        Lacak Perbaikan Anda
                    </h2>
                    <p className="mt-4 text-lg text-slate-500">
                        Masukkan nomor telepon atau nomor tiket untuk melihat status terkini perangkat Anda.
                    </p>
                </div>

                {/* Form Section */}
                <div className="max-w-3xl mx-auto mb-10">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
                        
                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8">
                            <button
                                type="button"
                                onClick={() => setTrackMethod("tiket")}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    trackMethod === "tiket" 
                                        ? "bg-white text-blue-700 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <TicketIcon className="w-4 h-4" />
                                Nomor Tiket
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrackMethod("telepon")}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    trackMethod === "telepon" 
                                        ? "bg-white text-blue-700 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <Phone className="w-4 h-4" />
                                Nomor Telepon
                            </button>
                        </div>

                        <form onSubmit={handleTrack} className="space-y-6">
                            {trackMethod === "tiket" ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-semibold text-slate-700">Nomor Tiket Servis</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <TicketIcon className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={nomorTiket}
                                            onChange={(e) => setNomorTiket(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none text-slate-900 transition-all font-mono placeholder:font-sans placeholder:text-slate-400"
                                            placeholder="Contoh: SRV-2024-001"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-semibold text-slate-700">Nomor Telepon Terdaftar</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Phone className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={nomorTelepon}
                                            onChange={(e) => setNomorTelepon(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none text-slate-900 transition-all placeholder:text-slate-400"
                                            placeholder="Contoh: 08123456789"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (trackMethod === 'tiket' ? !nomorTiket : !nomorTelepon)}
                                className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-md"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        <span>Lacak Servis</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {error && (
                        <div className="mt-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <SearchX className="w-6 h-6 shrink-0" />
                            <p className="font-medium text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {results && results.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-none w-full">
                        <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto w-full px-2">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                <span>Hasil Pencarian ({results.length})</span>
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 w-full max-w-[2000px] mx-auto px-2 items-start">
                            {results.map((t, i) => (
                                <TrackingCard key={i} t={t} />
                            ))}
                        </div>
                    </div>
                )}

                {results && results.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 mt-8 shadow-sm max-w-3xl mx-auto"
                    >
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, -10, 10, -10, 0]
                            }}
                            transition={{ 
                                duration: 2.5, 
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-6 text-slate-400"
                        >
                            <PackageSearch className="w-8 h-8 text-slate-500" />
                        </motion.div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Tidak Ditemukan</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Kami tidak dapat menemukan riwayat servis dengan nomor tersebut. Silakan periksa kembali ketikan Anda.
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
