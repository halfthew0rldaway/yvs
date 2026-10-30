import { useState, useEffect } from "react";
import { 
    X, 
    UserPlus, 
    Save, 
    Phone, 
    Mail, 
    GraduationCap, 
    Briefcase, 
    MapPin, 
    Link2,
    Compass
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { RECRUITMENT_SOURCES } from "./jobPresets";

const PENDIDIKAN_OPTIONS = [
    "SMK TKJ / Rekayasa Perangkat Lunak",
    "SMK Elektronika / Audio Video",
    "SMA / MA / Sederajat",
    "D3 Manajemen Informatika / Teknik Komputer",
    "S1 Sistem Informasi / Teknik Informatika",
    "Otodidak / Praktisi Berpengalaman",
    "Lainnya"
];

export default function AddApplicantModal({ isOpen, onClose, jobs = [], onSuccess }) {
    const [jobId, setJobId] = useState("");
    const [sumberLamaran, setSumberLamaran] = useState("Walk-in");
    const [namaLengkap, setNamaLengkap] = useState("");
    const [nomorTelepon, setNomorTelepon] = useState("");
    const [email, setEmail] = useState("");
    const [alamat, setAlamat] = useState("");
    const [pendidikan, setPendidikan] = useState(PENDIDIKAN_OPTIONS[0]);
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
                sumber_lamaran: sumberLamaran,
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
            
            // Reset form
            setNamaLengkap("");
            setNomorTelepon("");
            setEmail("");
            setAlamat("");
            setPengalamanThn("0");
            setResumeUrl("");
            setSumberLamaran("Walk-in");
            setPendidikan(PENDIDIKAN_OPTIONS[0]);

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

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] modal-surface z-10">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                Catat Pelamar Baru
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Registrasi data kandidat ke pipeline seleksi teknisi & staf KEOS
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
                <form onSubmit={handleSubmit} className="p-6 sm:p-7 overflow-y-auto space-y-5">
                    
                    {/* Bagian 1: Posisi & Sumber Lamaran */}
                    <div className="space-y-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            1. Posisi Lowongan & Saluran Lamaran
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Posisi yang Dilamar <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={jobId}
                                        onChange={(e) => setJobId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                                        required
                                    >
                                        {jobs.map(job => (
                                            <option key={job.id} value={job.id}>
                                                {job.judul_posisi} ({job.departemen})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Sumber / Saluran Lamaran <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Compass className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={sumberLamaran}
                                        onChange={(e) => setSumberLamaran(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                                        required
                                    >
                                        {RECRUITMENT_SOURCES.map(src => (
                                            <option key={src.id} value={src.id}>
                                                {src.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bagian 2: Data Kontak Pelamar */}
                    <div className="space-y-4 pt-3 border-t border-slate-100">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            2. Data Kontak Kandidat
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

                    {/* Bagian 3: Pendidikan & Pengalaman */}
                    <div className="space-y-4 pt-3 border-t border-slate-100">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            3. Pendidikan, Pengalaman & Berkas
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Latar Belakang Pendidikan
                                </label>
                                <div className="relative">
                                    <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={pendidikan}
                                        onChange={(e) => setPendidikan(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                                    >
                                        {PENDIDIKAN_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Pengalaman Servis / Kerja (Tahun)
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
                        </div>

                        <div>
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

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
