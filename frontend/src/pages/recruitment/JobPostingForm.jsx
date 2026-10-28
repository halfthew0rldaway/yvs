import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
    Briefcase, 
    ArrowLeft, 
    Save, 
    Sparkles, 
    Plus, 
    Trash2, 
    Link2, 
    Copy, 
    Check, 
    ExternalLink, 
    MapPin, 
    Phone, 
    DollarSign, 
    Layers, 
    FileText, 
    CheckCircle2,
    Laptop,
    Cpu,
    Headphones,
    MessageCircle,
    Building2,
    Calendar,
    Users
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { JOB_PRESETS, generateBroadcastText } from "./jobPresets";

const DEPARTEMEN_OPTIONS = [
    { value: "Teknisi", label: "Teknisi Hardware & Software", icon: Laptop },
    { value: "Frontliner", label: "Frontliner & Customer Service", icon: Headphones },
    { value: "Operasional", label: "Operasional & Gudang", icon: Layers },
    { value: "Back Office", label: "Back Office & Administrasi", icon: Building2 }
];

const TIPE_OPTIONS = ["Full Time", "Part Time", "Magang", "Kontrak"];
const STATUS_OPTIONS = ["Aktif", "Ditutup", "Draft"];
const PLATFORM_OPTIONS = ["Glints", "Jobstreet", "LinkedIn", "KitaLulus", "Instagram", "Facebook", "Lainnya"];

export default function JobPostingForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [fetching, setFetching] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Form fields
    const [judulPosisi, setJudulPosisi] = useState("");
    const [departemen, setDepartemen] = useState("Teknisi");
    const [tipeKerja, setTipeKerja] = useState("Full Time");
    const [lokasi, setLokasi] = useState("Workshop Utama");
    const [nomorKontak, setNomorKontak] = useState("0812-3456-7890");
    const [status, setStatus] = useState("Aktif");
    const [gajiMin, setGajiMin] = useState("");
    const [gajiMax, setGajiMax] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [kualifikasi, setKualifikasi] = useState("");
    const [externalLinks, setExternalLinks] = useState([]);

    // Fetch existing data if edit mode
    useEffect(() => {
        if (!isEdit) {
            // Apply default preset for new job
            applyPreset(JOB_PRESETS[0]);
            return;
        }

        async function fetchJobDetail() {
            try {
                setFetching(true);
                const res = await api.get(`/recruitment/jobs/${id}`);
                const job = res.data?.data || res.data;
                if (job) {
                    setJudulPosisi(job.judul_posisi || "");
                    setDepartemen(job.departemen || "Teknisi");
                    setTipeKerja(job.tipe_kerja || "Full Time");
                    setLokasi(job.lokasi || "Workshop Utama");
                    setNomorKontak(job.nomor_kontak || "0812-3456-7890");
                    setStatus(job.status || "Aktif");
                    setGajiMin(job.gaji_min || "");
                    setGajiMax(job.gaji_max || "");
                    setDeskripsi(job.deskripsi || "");
                    setKualifikasi(job.kualifikasi || "");

                    if (Array.isArray(job.external_links)) {
                        setExternalLinks(job.external_links);
                    } else if (typeof job.external_links === "string") {
                        try {
                            setExternalLinks(JSON.parse(job.external_links));
                        } catch {
                            setExternalLinks([]);
                        }
                    } else {
                        setExternalLinks([]);
                    }
                }
            } catch (err) {
                toast.error("Gagal memuat detail lowongan");
                navigate("/recruitment");
            } finally {
                setFetching(false);
            }
        }

        fetchJobDetail();
    }, [id, isEdit]);

    function applyPreset(preset) {
        if (!preset) return;
        setJudulPosisi(preset.label);
        setDepartemen(preset.departemen);
        setTipeKerja(preset.tipe_kerja);
        setLokasi(preset.lokasi);
        setStatus("Aktif");
        setGajiMin(preset.gaji_min || "");
        setGajiMax(preset.gaji_max || "");
        setDeskripsi(preset.deskripsi || "");
        setKualifikasi(preset.kualifikasi || "");
        toast.success(`Preset '${preset.label}' berhasil diterapkan!`, { id: "preset-toast" });
    }

    const handleAddLink = () => {
        setExternalLinks([...externalLinks, { platform: "Glints", url: "" }]);
    };

    const handleLinkChange = (index, field, value) => {
        const next = [...externalLinks];
        next[index][field] = value;
        setExternalLinks(next);
    };

    const handleRemoveLink = (index) => {
        setExternalLinks(externalLinks.filter((_, i) => i !== index));
    };

    // Live simulated job object for live broadcast generator
    const currentJobPreview = {
        judul_posisi: judulPosisi || "NAMA POSISI LOWONGAN",
        departemen,
        tipe_kerja: tipeKerja,
        lokasi: lokasi || "Workshop Utama",
        nomor_kontak: nomorKontak || "0812-3456-7890",
        gaji_min: parseInt(gajiMin) || 0,
        gaji_max: parseInt(gajiMax) || 0,
        deskripsi,
        kualifikasi
    };

    const liveBroadcastText = generateBroadcastText(
        currentJobPreview, 
        "KomputerAwet / Yangversa Computer", 
        nomorKontak.trim()
    );

    const handleCopyBroadcast = () => {
        navigator.clipboard.writeText(liveBroadcastText);
        setCopied(true);
        toast.success("Teks siaran iklan disalin ke clipboard! Siap dipaste ke Glints / WhatsApp.");
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!judulPosisi.trim()) {
            toast.error("Nama posisi jabatan wajib diisi!");
            return;
        }

        try {
            setSubmitting(true);
            const filteredLinks = externalLinks
                .map(l => ({ platform: l.platform || "Lainnya", url: (l.url || "").trim() }))
                .filter(l => l.url !== "");

            const payload = {
                judul_posisi: judulPosisi.trim(),
                departemen,
                tipe_kerja: tipeKerja,
                lokasi: lokasi.trim(),
                nomor_kontak: nomorKontak.trim(),
                gaji_min: parseInt(gajiMin) || 0,
                gaji_max: parseInt(gajiMax) || 0,
                deskripsi: deskripsi.trim(),
                kualifikasi: kualifikasi.trim(),
                status,
                external_links: filteredLinks,
                iklan_template: liveBroadcastText
            };

            if (isEdit) {
                await api.put(`/recruitment/jobs/${id}`, payload);
                toast.success("Lowongan posisi berhasil diperbarui!");
            } else {
                await api.post("/recruitment/jobs", payload);
                toast.success("Lowongan posisi baru berhasil diterbitkan!");
            }

            navigate("/recruitment");
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menyimpan lowongan");
        } finally {
            setSubmitting(false);
        }
    };

    // Clean phone number for direct WA link
    let cleanWaPhone = (nomorKontak || "").replace(/\D/g, "");
    if (cleanWaPhone.startsWith("0")) cleanWaPhone = "62" + cleanWaPhone.slice(1);
    else if (cleanWaPhone.startsWith("8")) cleanWaPhone = "62" + cleanWaPhone;

    if (fetching) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Memuat data lowongan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-16">
            {/* TOP BAR / NAVIGATION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <button
                        type="button"
                        onClick={() => navigate("/recruitment")}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Kembali ke Recruitment Center"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                Position Design KEOS
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 font-medium">Recruitment Center</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            {isEdit ? `Edit Lowongan: ${judulPosisi || "Posisi"}` : "Buka Lowongan Posisi Baru"}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => navigate("/recruitment")}
                        className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>{submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Terbitkan Posisi"}</span>
                    </button>
                </div>
            </div>

            {/* MAIN FORM GRID */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    
                    {/* LEFT COLUMN: FORM CONTENT (8 COLS) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* SECTION 0: PRESET STANDAR POSISI KEOS */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Preset Standar Posisi KEOS KomputerAwet
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Klik tombol posisi di bawah untuk mengisi otomatis tugas, kualifikasi, dan estimasi gaji
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] text-blue-600 font-semibold bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100 self-start sm:self-auto">
                                    1-Klik Autofill
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                {JOB_PRESETS.map((preset) => {
                                    const isSelected = judulPosisi === preset.label;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                                                isSelected
                                                    ? "bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400"
                                                    : "bg-slate-50/60 border-slate-200 hover:bg-white hover:border-blue-300 hover:shadow-xs"
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                isSelected ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                                            }`}>
                                                {preset.id.includes("hardware") ? <Cpu className="w-4 h-4" /> :
                                                 preset.id.includes("frontdesk") ? <Headphones className="w-4 h-4" /> :
                                                 preset.id.includes("operasional") ? <Layers className="w-4 h-4" /> :
                                                 <Laptop className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className={`text-xs font-bold truncate ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                                                        {preset.label}
                                                    </span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                                </div>
                                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                    {preset.departemen} • {preset.tipe_kerja}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION 1: INFORMASI JABATAN & DEPARTEMEN */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        1. Informasi Jabatan & Penempatan
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Klasifikasi divisi, tipe kontrak, dan penempatan kerja
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Judul Posisi Jabatan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Teknisi Software & OS / Teknisi Hardware Laptop"
                                        value={judulPosisi}
                                        onChange={(e) => setJudulPosisi(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Departemen
                                        </label>
                                        <select
                                            value={departemen}
                                            onChange={(e) => setDepartemen(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            {DEPARTEMEN_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Tipe Kontrak Kerja
                                        </label>
                                        <select
                                            value={tipeKerja}
                                            onChange={(e) => setTipeKerja(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            {TIPE_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Status Lowongan
                                        </label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Lokasi Penempatan</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Workshop Utama KomputerAwet"
                                            value={lokasi}
                                            onChange={(e) => setLokasi(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Nomor WhatsApp HR / PIC <span className="text-rose-500">*</span></span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 0812-3456-7890"
                                            value={nomorKontak}
                                            onChange={(e) => setNomorKontak(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            required
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Otomatis disematkan pada link WhatsApp di template siaran iklan
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: ESTIMASI KOMPENSASI & GAJI */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        2. Estimasi Kompensasi Gaji
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Rentang gaji pokok atau paket insentif bulanan
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Gaji Minimum (Rp)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                                        <input
                                            type="number"
                                            placeholder="2500000"
                                            value={gajiMin}
                                            onChange={(e) => setGajiMin(e.target.value)}
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    {gajiMin > 0 && (
                                        <p className="text-[11px] text-blue-600 mt-1 font-semibold">
                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(gajiMin)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Gaji Maksimum (Rp)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                                        <input
                                            type="number"
                                            placeholder="4500000"
                                            value={gajiMax}
                                            onChange={(e) => setGajiMax(e.target.value)}
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    {gajiMax > 0 && (
                                        <p className="text-[11px] text-blue-600 mt-1 font-semibold">
                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(gajiMax)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: TANGGUNG JAWAB & KUALIFIKASI */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        3. Deskripsi Pekerjaan & Kualifikasi
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Tanggung jawab harian dan kriteria kompetensi pelamar
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Tugas & Tanggung Jawab Utama
                                        </label>
                                        <span className="text-[11px] text-slate-400">Gunakan bullet points (•)</span>
                                    </div>
                                    <textarea
                                        rows={6}
                                        placeholder="• Melakukan diagnosa kerusakan laptop...&#10;• Mengganti suku cadang sesuai SOP...&#10;• Menjalankan 8-Point QC Serv.io..."
                                        value={deskripsi}
                                        onChange={(e) => setDeskripsi(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all leading-relaxed"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Kualifikasi & Syarat Kompetensi Pelamar
                                        </label>
                                        <span className="text-[11px] text-slate-400">Syarat pendidikan & attitude</span>
                                    </div>
                                    <textarea
                                        rows={6}
                                        placeholder="• Pendidikan minimal SMK TKJ / Rekayasa Perangkat Lunak / Pengalaman Relevan.&#10;• Memiliki ketelitian tinggi dan integritas data pelanggan.&#10;• Mampu bekerja sama dalam tim bengkel..."
                                        value={kualifikasi}
                                        onChange={(e) => setKualifikasi(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: SHORTCUT POSTING PLATFORM CARI KERJA */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                        <Link2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            4. Tautan Shortcut Platform Eksternal
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Simpan link listing lowongan yang Anda posting di Glints, Jobstreet, atau LinkedIn
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddLink}
                                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Link Platform</span>
                                </button>
                            </div>

                            {externalLinks.length === 0 ? (
                                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                                    <p className="text-xs text-slate-500 font-medium">
                                        Belum ada link platform eksternal yang disimpan.
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Klik tombol <span className="font-semibold text-blue-600">+ Tambah Link Platform</span> jika lowongan ini juga Anda pasang di Glints, Jobstreet, KitaLulus, atau media sosial.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {externalLinks.map((link, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="w-full sm:w-36 shrink-0">
                                                <select
                                                    value={link.platform}
                                                    onChange={(e) => handleLinkChange(idx, "platform", e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {PLATFORM_OPTIONS.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex-1 relative">
                                                <input
                                                    type="url"
                                                    placeholder="https://employers.glints.id/jobs/... atau tautan listing"
                                                    value={link.url}
                                                    onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                                />
                                            </div>

                                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                                {link.url && (
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Buka Link di Tab Baru"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLink(idx)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Hapus Link"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN: STICKY BROADCAST PREVIEW & ACTION (4 COLS) */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">

                        {/* CARD 1: LIVE BROADCAST SIAP COPAS */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                        <MessageCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                            Format Iklan Siap Copas
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Real-time broadcast generator
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                    Live
                                </span>
                            </div>

                            <div className="p-4 space-y-3">
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Teks di bawah otomatis ter-generate dari isian formulir di samping. Siap disalin dan diposting ke <strong>Glints</strong>, <strong>WhatsApp Group</strong>, atau <strong>Jobstreet</strong>:
                                </p>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 max-h-72 overflow-y-auto">
                                    <pre className="text-[11.5px] text-slate-800 font-mono whitespace-pre-wrap leading-relaxed select-all">
                                        {liveBroadcastText}
                                    </pre>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleCopyBroadcast}
                                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                            copied 
                                                ? "bg-emerald-600 text-white shadow-xs" 
                                                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-2xs"
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4 text-emerald-200" />
                                                <span>Berhasil Disalin!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                <span>Salin Teks Siaran Iklan</span>
                                            </>
                                        )}
                                    </button>

                                    {cleanWaPhone && (
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(liveBroadcastText)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                                            <span>Share ke WhatsApp Langsung</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: CHECKLIST KELENGKAPAN LOWONGAN */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Checklist Kelengkapan Form
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    {judulPosisi.trim() ? (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                    )}
                                    <span className={judulPosisi.trim() ? "text-slate-800 font-semibold" : "text-slate-400"}>
                                        Judul Posisi Jabatan
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {nomorKontak.trim() ? (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                    )}
                                    <span className={nomorKontak.trim() ? "text-slate-800 font-semibold" : "text-slate-400"}>
                                        Nomor WhatsApp HR
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {deskripsi.trim() ? (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                    )}
                                    <span className={deskripsi.trim() ? "text-slate-800 font-semibold" : "text-slate-400"}>
                                        Tugas & Tanggung Jawab
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {kualifikasi.trim() ? (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                    )}
                                    <span className={kualifikasi.trim() ? "text-slate-800 font-semibold" : "text-slate-400"}>
                                        Syarat & Kualifikasi
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: ACTION CTA */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Konfirmasi & Terbitkan
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Lowongan yang berstatus <strong>Aktif</strong> akan langsung tersedia di pipeline rekrutmen dan siap menampung data pelamar masuk.
                            </p>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{submitting ? "Memproses..." : isEdit ? "Simpan Perubahan Lowongan" : "Terbitkan Lowongan Baru"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/recruitment")}
                                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                    Batal & Kembali
                                </button>
                            </div>
                        </div>

                    </div>

                </form>
        </div>
    );
}

