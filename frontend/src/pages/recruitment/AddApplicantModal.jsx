import { useState, useEffect } from "react";
import { 
    X, 
    UserPlus, 
    Save, 
    Phone, 
    Mail, 
    GraduationCap, 
    Briefcase, 
    Laptop, 
    Cpu, 
    BookOpen, 
    Layers, 
    Sparkles, 
    CheckCircle2, 
    MapPin, 
    Link2 
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const PENDIDIKAN_TILES = [
    {
        id: "SMK TKJ / Rekayasa Perangkat Lunak",
        title: "SMK TKJ / RPL",
        subtitle: "Jaringan & Software",
        icon: Laptop
    },
    {
        id: "SMK Elektronika / Audio Video",
        title: "SMK Elektronika",
        subtitle: "Hardware & Komponen",
        icon: Cpu
    },
    {
        id: "SMA IPA / IPS",
        title: "SMA / Sederajat",
        subtitle: "Pendidikan Umum",
        icon: BookOpen
    },
    {
        id: "D3 Manajemen Informatika / Teknik",
        title: "D3 Komputer / Teknik",
        subtitle: "Diploma Vokasi",
        icon: Layers
    },
    {
        id: "S1 Ilmu Komputer / Teknik Informatika",
        title: "S1 Informatika / Teknik",
        subtitle: "Sarjana Sains & Komputer",
        icon: GraduationCap
    },
    {
        id: "Otodidak / Pengalaman Lapangan",
        title: "Otodidak / Praktisi",
        subtitle: "Pengalaman Bengkel Nyata",
        icon: Sparkles
    }
];

export default function AddApplicantModal({ isOpen, onClose, jobs = [], onSuccess }) {
    const [jobId, setJobId] = useState("");
    const [namaLengkap, setNamaLengkap] = useState("");
    const [nomorTelepon, setNomorTelepon] = useState("");
    const [email, setEmail] = useState("");
    const [alamat, setAlamat] = useState("");
    const [pendidikan, setPendidikan] = useState(PENDIDIKAN_TILES[0].id);
    const [pengalamanThn, setPengalamanThn] = useState("0");
    const [resumeUrl, setResumeUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (jobs.length > 0 && !jobId) {
            setJobId(jobs[0].id);
        }
    }, [jobs, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!jobId || !namaLengkap.trim() || !nomorTelepon.trim()) {
            toast.error("Posisi lowongan, nama lengkap, dan nomor WhatsApp wajib diisi");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                job_posting_id: parseInt(jobId),
                nama_lengkap: namaLengkap.trim(),
                nomor_telepon: nomorTelepon.trim(),
                email: email.trim() || null,
                alamat: alamat.trim() || null,
                pendidikan,
                pengalaman_thn: parseInt(pengalamanThn) || 0,
                resume_url: resumeUrl.trim() || null,
                status: "Baru Masuk"
            };

            await api.post("/recruitment/applicants", payload);
            toast.success("Kandidat pelamar berhasil dicatat ke pipeline");
            
            // Reset
            setNamaLengkap("");
            setNomorTelepon("");
            setEmail("");
            setAlamat("");
            setPengalamanThn("0");
            setResumeUrl("");

            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal mendaftarkan pelamar");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* 60fps Hardware-Accelerated Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs modal-backdrop" 
                onClick={onClose} 
            />

            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] modal-surface z-10">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                Catat Pelamar Baru (Walk-in / WhatsApp)
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Registrasi data awal kandidat ke pipeline seleksi teknisi & staf KEOS
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-7 overflow-y-auto space-y-6">
                    
                    {/* Bagian 1: Posisi & Data Kontak Utama */}
                    <div className="space-y-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            1. Posisi Lowongan & Kontak Kandidat
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Posisi yang Dilamar <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={jobId}
                                    onChange={(e) => setJobId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                >
                                    {jobs.map(job => (
                                        <option key={job.id} value={job.id}>
                                            {job.judul_posisi} ({job.departemen} • {job.tipe_kerja})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Nama Lengkap Pelamar <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Dimas Rizky Pratama"
                                    value={namaLengkap}
                                    onChange={(e) => setNamaLengkap(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    No. WhatsApp / Telepon <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="08123456789"
                                        value={nomorTelepon}
                                        onChange={(e) => setNomorTelepon(e.target.value)}
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Email (Opsional)
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="kandidat@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Alamat / Domisili Tinggal
                                </label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Contoh: Sukajadi, Kota Bandung"
                                        value={alamat}
                                        onChange={(e) => setAlamat(e.target.value)}
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bagian 2: Latar Belakang Pendidikan Menggunakan Icon Box Tiles */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                2. Latar Belakang Pendidikan
                            </div>
                            <span className="text-2xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                                Pilih salah satu
                            </span>
                        </div>

                        {/* Interactive Tiles Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PENDIDIKAN_TILES.map((tile) => {
                                const IconComponent = tile.icon;
                                const isSelected = pendidikan === tile.id;

                                return (
                                    <button
                                        key={tile.id}
                                        type="button"
                                        onClick={() => setPendidikan(tile.id)}
                                        className={`p-3.5 rounded-2xl text-left transition-all relative flex flex-col justify-between border cursor-pointer ${
                                            isSelected
                                                ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20"
                                                : "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                                isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                                            }`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                            )}
                                        </div>

                                        <div>
                                            <div className={`text-xs font-bold leading-tight ${isSelected ? "text-blue-950" : "text-slate-800"}`}>
                                                {tile.title}
                                            </div>
                                            <div className="text-3xs text-slate-500 mt-0.5 leading-tight">
                                                {tile.subtitle}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bagian 3: Pengalaman & Portofolio */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            3. Pengalaman Kerja & Berkas Lampiran
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Pengalaman Servis (Tahun)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    placeholder="0 (Fresh Graduate)"
                                    value={pengalamanThn}
                                    onChange={(e) => setPengalamanThn(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Link Resume / CV Google Drive (Opsional)
                                </label>
                                <div className="relative">
                                    <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="url"
                                        placeholder="https://drive.google.com/..."
                                        value={resumeUrl}
                                        onChange={(e) => setResumeUrl(e.target.value)}
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all truncate"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            <span>{submitting ? "Mendaftarkan..." : "Daftarkan ke Pipeline"}</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
