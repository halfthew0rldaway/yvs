import { useState, useEffect } from "react";
import { X, UserPlus, Save, Phone, Mail, GraduationCap, Briefcase, FileText } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const PENDIDIKAN_OPTIONS = ["SMK TKJ / Rekayasa Perangkat Lunak", "SMK Elektronika / Audio Video", "SMA IPA / IPS", "D3 Manajemen Informatika / Teknik", "S1 Ilmu Komputer / Teknik Informatika", "Lainnya"];

export default function AddApplicantModal({ isOpen, onClose, jobs = [], onSuccess }) {
    const [jobId, setJobId] = useState("");
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
            toast.error("Posisi lowongan, nama lengkap, dan nomor telepon wajib diisi");
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
            
            // Reset form
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
                
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Catat Pelamar Baru (Walk-in / WA)
                            </h2>
                            <p className="text-xs text-slate-500">
                                Masukkan berkas awal kandidat ke pipeline seleksi rekrutmen
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Posisi yang Dilamar <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={jobId}
                            onChange={(e) => setJobId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>
                                    {job.judul_posisi} ({job.departemen})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nama Lengkap Pelamar <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Dimas Rizky Pratama"
                            value={namaLengkap}
                            onChange={(e) => setNamaLengkap(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                No. WhatsApp / Telepon <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="08123456789"
                                value={nomorTelepon}
                                onChange={(e) => setNomorTelepon(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Email (Opsional)
                            </label>
                            <input
                                type="email"
                                placeholder="kandidat@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Latar Belakang Pendidikan
                            </label>
                            <select
                                value={pendidikan}
                                onChange={(e) => setPendidikan(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {PENDIDIKAN_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Pengalaman Kerja (Tahun)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="30"
                                placeholder="0 (Fresh Graduate)"
                                value={pengalamanThn}
                                onChange={(e) => setPengalamanThn(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Alamat / Domisili Tinggal
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Sukajadi, Kota Bandung"
                            value={alamat}
                            onChange={(e) => setAlamat(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Link Resume CV / Google Drive (Opsional)
                        </label>
                        <input
                            type="url"
                            placeholder="https://drive.google.com/..."
                            value={resumeUrl}
                            onChange={(e) => setResumeUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            <span>{submitting ? "Mendaftarkan..." : "Daftarkan Pelamar"}</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

