import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { 
    ArrowLeft, Save, MonitorSmartphone, User, MessageSquare, Package, Camera, 
    ClipboardCheck, KeyRound, Lock, Eye, EyeOff, ShieldCheck, Shield, AlertTriangle, 
    Sparkles, Smile, History, HardDrive, CheckCircle2, Clock, Zap, Laptop
} from "lucide-react";
import { CHECKLIST_ITEMS } from "../../utils/checklistItems";
import DefectMapperModal, { DefectMapBadge } from "../../components/DefectMapperModal";
import { SLA_PENGECEKAN_PACKAGES } from "../../components/SlaBadge";

export default function TiketServisForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const perangkatParam = searchParams.get("perangkat_id");

    const [form, setForm] = useState({ 
        perangkat_id: perangkatParam || "", 
        teknisi_id: "", 
        keluhan: "", 
        kelengkapan: "",
        tipe_kunci: "Tidak Ada",
        password_perangkat: "",
        kondisi_fisik: "Bersih",
        spesifikasi_awal: "",
        prioritas_pelanggan: "Standar",
        izin_bongkar: true,
        izin_akses_os: true,
        izin_backup_mandiri: true,
        batasan_izin: ""
    });
    const [slaPaket, setSlaPaket] = useState("reguler");
    const [defectMap, setDefectMap] = useState({ items: [] });
    const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [checklist, setChecklist] = useState(
        Object.fromEntries(CHECKLIST_ITEMS.map(item => [item.key, false]))
    );
    const [fotos, setFotos] = useState([]);
    const [perangkats, setPerangkats] = useState([]);
    const [teknisis, setTeknisis] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [selectedPerangkatDetail, setSelectedPerangkatDetail] = useState(null);
    const [loadingPerangkatDetail, setLoadingPerangkatDetail] = useState(false);

    useEffect(() => {
        Promise.all([api.get("/perangkat"), api.get("/dashboard/teknisi-list")])
            .then(([perangkatRes, teknisiRes]) => {
                setPerangkats(perangkatRes.data);
                setTeknisis(teknisiRes.data);
            })
            .catch(() => toast.error("Gagal memuat data"))
            .finally(() => setFetching(false));
    }, []);

    useEffect(() => {
        if (!form.perangkat_id) {
            setSelectedPerangkatDetail(null);
            return;
        }
        setLoadingPerangkatDetail(true);
        api.get(`/perangkat/${form.perangkat_id}`)
            .then((res) => setSelectedPerangkatDetail(res.data))
            .catch(() => setSelectedPerangkatDetail(null))
            .finally(() => setLoadingPerangkatDetail(false));
    }, [form.perangkat_id]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("perangkat_id", form.perangkat_id);
            if (form.teknisi_id) formData.append("teknisi_id", form.teknisi_id);
            formData.append("keluhan", form.keluhan);
            if (form.kelengkapan) formData.append("kelengkapan", form.kelengkapan);
            formData.append("checklist_intake", JSON.stringify(checklist));
            formData.append("tipe_kunci", form.tipe_kunci);
            if (form.password_perangkat) formData.append("password_perangkat", form.password_perangkat);
            
            // Protokol Layanan, Fisik & Izin Privasi
            formData.append("kondisi_fisik", form.kondisi_fisik);
            if (form.spesifikasi_awal) formData.append("spesifikasi_awal", form.spesifikasi_awal);
            formData.append("prioritas_pelanggan", form.prioritas_pelanggan);
            formData.append("izin_bongkar", form.izin_bongkar);
            formData.append("izin_akses_os", form.izin_akses_os);
            formData.append("izin_backup_mandiri", form.izin_backup_mandiri);
            if (form.batasan_izin) formData.append("batasan_izin", form.batasan_izin);

            fotos.forEach(foto => {
                formData.append("foto_kondisi", foto);
            });

            // Feature 1: Visual Scratch & Defect Map
            if (defectMap && defectMap.items && defectMap.items.length > 0) {
                formData.append("defect_map", JSON.stringify(defectMap));
            }

            // Feature 7: SLA Express Service Package
            formData.append("sla_paket", slaPaket);

            await api.post("/tiket-servis", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Tiket servis berhasil dibuat!");
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

                    {/* Kenali Riwayat Pelanggan & Unit Sebelumnya */}
                    {loadingPerangkatDetail ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600"></div>
                            <span>Memeriksa rekam riwayat unit & profil customer...</span>
                        </div>
                    ) : selectedPerangkatDetail && (
                        <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-900 block">
                                            Profil Pelanggan & Rekam Servis
                                        </span>
                                        <span className="text-[11px] text-slate-500 block">
                                            Personalisasi pelayanan dan panduan adaptasi komunikasi
                                        </span>
                                    </div>
                                </div>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                                    (selectedPerangkatDetail.tiket_servis?.length || 0) > 0 
                                        ? "bg-amber-50 text-amber-800 border-amber-200" 
                                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}>
                                    {(selectedPerangkatDetail.tiket_servis?.length || 0) > 0 
                                        ? `${selectedPerangkatDetail.tiket_servis.length}x Servis Sebelumnya` 
                                        : "Pelanggan / Unit Baru"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <span className="text-slate-500 block text-[11px] mb-1">Gaya Komunikasi Pelanggan:</span>
                                        <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1.5">
                                            <Smile className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>{selectedPerangkatDetail.customer?.tipe_kepribadian || "Netral"}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            {selectedPerangkatDetail.customer?.tipe_kepribadian === "Koleris" && "Tegas & to the point. Sampaikan kepastian solusi dan estimasi waktu."}
                                            {selectedPerangkatDetail.customer?.tipe_kepribadian === "Sanguinis" && "Ramah & antusias. Berikan sambutan hangat dan komunikasi apresiatif."}
                                            {selectedPerangkatDetail.customer?.tipe_kepribadian === "Plegmatis" && "Tenang & sabar. Jangan mendesak keputusan dan berikan rasa aman."}
                                            {selectedPerangkatDetail.customer?.tipe_kepribadian === "Melankolis" && "Kritis & teliti. Jelaskan detail teknis dan transparansi biaya."}
                                            {(!selectedPerangkatDetail.customer?.tipe_kepribadian || selectedPerangkatDetail.customer?.tipe_kepribadian === "Netral") && "Pendekatan standar: Salam ramah, mendengarkan aktif, dan tawarkan solusi."}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <span className="text-slate-500 block text-[11px] mb-1">Catatan Khusus Pelanggan:</span>
                                        <p className="text-[11px] text-slate-700 leading-relaxed break-words">
                                            {selectedPerangkatDetail.customer?.catatan_khusus || "Tidak ada catatan khusus untuk pelanggan ini."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedPerangkatDetail.tiket_servis?.some(t => t.warranty_status?.status === "Aktif") && (
                                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Perangkat ini masih memiliki status garansi aktif dari servis sebelumnya!</span>
                                </div>
                            )}
                        </div>
                    )}
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

                {/* Pengecekan Fisik, Spesifikasi & Prioritas Pelanggan */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-900">Pengecekan Tahap Awal & Prioritas Layanan</h3>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                            Inspeksi Fisik & Penyelarasan Kebutuhan
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Kondisi Fisik Luar
                            </label>
                            <select
                                value={form.kondisi_fisik}
                                onChange={(e) => setForm({ ...form, kondisi_fisik: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                            >
                                <option value="Bersih">Bersih & Mulus (Normal)</option>
                                <option value="Kotor">Kotor / Berdebu / Jamur</option>
                                <option value="Ada yang Rusak">Ada yang Rusak / Baret / Retak Ringan</option>
                                <option value="Pecah">Pecah / Cacat Fisik Parah / Patah</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Spesifikasi Awal Unit
                            </label>
                            <input
                                type="text"
                                value={form.spesifikasi_awal}
                                onChange={(e) => setForm({ ...form, spesifikasi_awal: e.target.value })}
                                placeholder="Contoh: RAM 8GB, SSD 512GB, Intel i5, Win 11"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Feature 1: 2D Visual Defect Map trigger */}
                        <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-200/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                                        <Laptop className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900">Peta Cacat Fisik (2D Defect Map)</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                {defectMap.items.length} Titik Ditandai
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {defectMap.items.length > 0
                                                ? `${defectMap.items.length} titik cacat fisik (baret/penyok/retak) telah ditandai pada blueprint perangkat.`
                                                : "Tandai titik goresan, retak layar, penyok sudut, atau baut hilang sebelum diservis."}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDefectModalOpen(true)}
                                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                                >
                                    <Laptop className="w-3.5 h-3.5" />
                                    <span>{defectMap.items.length > 0 ? "Edit Peta Cacat" : "Buka Blueprint Cacat"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            Prioritas Penanganan Pelanggan
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                                { key: "Standar", label: "Standar", desc: "Reguler & seimbang" },
                                { key: "Data Aman", label: "Data Aman", desc: "Proteksi data pelanggan" },
                                { key: "Cepat Selesai", label: "Cepat Selesai", desc: "Kebutuhan mendesak" },
                                { key: "Biaya Hemat", label: "Biaya Hemat", desc: "Efisiensi anggaran" }
                            ].map((p) => {
                                const isSelected = form.prioritas_pelanggan === p.key;
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setForm({ ...form, prioritas_pelanggan: p.key })}
                                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[76px] ${
                                            isSelected 
                                                ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 text-blue-900 shadow-xs" 
                                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
                                        }`}
                                    >
                                        <div className="font-bold text-xs">{p.label}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 leading-tight">{p.desc}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feature 7: SLA Service Level Agreement Package */}
                    <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Paket Estimasi SLA Pengecekan & Diagnosis
                            </label>
                            <span className="text-[11px] text-slate-500 font-medium">
                                {getPreviewTarget(slaPaket)}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {SLA_PENGECEKAN_PACKAGES.map((pkg) => {
                                const isSelected = slaPaket === pkg.id;
                                const Icon = pkg.icon;
                                return (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSlaPaket(pkg.id)}
                                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                            isSelected 
                                                ? pkg.id === "express"
                                                    ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 text-amber-950 shadow-xs font-semibold"
                                                    : pkg.id === "kompleks"
                                                        ? "bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 text-purple-950 shadow-xs font-semibold"
                                                        : "bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 text-blue-950 shadow-xs font-semibold"
                                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${pkg.badgeBg}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-xs font-bold">{pkg.label}</span>
                                            </div>
                                            {pkg.id === "express" && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                                                    PRIORITAS
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                                            {pkg.desc}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                            * Estimasi SLA pengerjaan servis fisik akan ditentukan bersama pelanggan setelah hasil pemeriksaan awal selesai dirumuskan dan penawaran biaya disetujui (ACC).
                        </p>
                    </div>
                </div>

                {/* Feature 4: Device Credential Vault / PIN & Lock */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-sm font-bold text-slate-900">Keamanan & Kredensial Perangkat (Vault)</h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            Hanya terlihat oleh Teknisi & Admin
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Tipe Penguncian Layar
                            </label>
                            <select
                                value={form.tipe_kunci}
                                onChange={(e) => setForm({ ...form, tipe_kunci: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            >
                                <option value="Tidak Ada">Tidak Ada (Tanpa Kunci/Password)</option>
                                <option value="PIN">PIN Angka</option>
                                <option value="Password">Password / Kata Sandi</option>
                                <option value="Pola Kunci">Pola Gambar (Pattern)</option>
                            </select>
                        </div>

                        {form.tipe_kunci !== "Tidak Ada" && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    {form.tipe_kunci === "PIN" ? "Kode PIN Layar" : form.tipe_kunci === "Password" ? "Password Akun / BIOS" : "Catatan Pola Kunci"}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={form.password_perangkat}
                                        onChange={(e) => setForm({ ...form, password_perangkat: e.target.value })}
                                        placeholder={
                                            form.tipe_kunci === "PIN" 
                                                ? "Contoh: 123456" 
                                                : form.tipe_kunci === "Password" 
                                                    ? "Masukkan password OS / login..." 
                                                    : "Contoh: Pola huruf 'Z' dari kiri atas"
                                        }
                                        className="w-full pl-4 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-mono shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                        title={showPassword ? "Sembunyikan" : "Tampilkan"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                        * PIN/Password dibutuhkan oleh teknisi untuk melakukan pengujian fungsi internal (Keyboard, Audio, Kamera, WiFi, dan QC Akhir).
                    </p>
                </div>

                {/* Protokol Izin & Privasi Pelanggan */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-sm font-bold text-slate-900">Protokol Izin & Batasan Privasi</h3>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                            Persetujuan Formal Intake
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                            form.izin_bongkar 
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold shadow-xs" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                        }`}>
                            <div className="flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={form.izin_bongkar}
                                    onChange={(e) => setForm({ ...form, izin_bongkar: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Izin Bongkar Hardware</p>
                                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">Membuka casing & inspeksi motherboard / komponen internal</p>
                                </div>
                            </div>
                        </label>

                        <label className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                            form.izin_akses_os 
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold shadow-xs" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                        }`}>
                            <div className="flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={form.izin_akses_os}
                                    onChange={(e) => setForm({ ...form, izin_akses_os: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Izin Akses OS</p>
                                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">Login ke Windows/OS untuk pengetesan fungsi hardware & QC</p>
                                </div>
                            </div>
                        </label>

                        <label className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                            form.izin_backup_mandiri 
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold shadow-xs" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                        }`}>
                            <div className="flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={form.izin_backup_mandiri}
                                    onChange={(e) => setForm({ ...form, izin_backup_mandiri: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Izin / Konfirmasi Backup</p>
                                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">Pelanggan memahami status data & backup mandiri / persetujuan teknisi</p>
                                </div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Batasan Izin Khusus Pelanggan (Jika Ada)
                        </label>
                        <input
                            type="text"
                            value={form.batasan_izin}
                            onChange={(e) => setForm({ ...form, batasan_izin: e.target.value })}
                            placeholder="Contoh: Jangan buka partisi D:/Kerja atau folder foto pribadi..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-slate-400" />
                        Checklist Kondisi Perangkat (Inspeksi Awal)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                        {CHECKLIST_ITEMS.map(item => {
                            const ItemIcon = item.Icon;
                            return (
                                <label key={item.key} className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                                    checklist[item.key] 
                                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 font-semibold" 
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(checklist[item.key])}
                                        onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{item.label}</span>
                                </label>
                            );
                        })}
                    </div>
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

            {/* Feature 1: 2D Defect Mapper Modal */}
            <DefectMapperModal
                isOpen={isDefectModalOpen}
                onClose={() => setIsDefectModalOpen(false)}
                value={defectMap}
                onChange={setDefectMap}
                title="Tandai Cacat Fisik Perangkat (2D Defect Map)"
            />
        </div>
    );
}

function getPreviewTarget(paket) {
    const d = new Date();
    const checkHours = paket === "express" ? 4 : paket === "kompleks" ? 48 : 24;
    d.setTime(d.getTime() + checkHours * 60 * 60 * 1000);
    const timeFormatted = d.toLocaleString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }) + " WIB";
    return `Target Cek: ${timeFormatted}`;
}
