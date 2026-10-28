import { useState, useEffect } from "react";
import { 
    X, 
    User, 
    Phone, 
    Mail, 
    GraduationCap, 
    Briefcase, 
    ExternalLink, 
    Award, 
    Save, 
    CheckCircle2, 
    XCircle, 
    UserCheck, 
    Sparkles, 
    Clock,
    FileText
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
    "Baru Masuk",
    "Screening",
    "Tes Logika & Teknis",
    "Wawancara / Trial",
    "Diterima",
    "Ditolak"
];

const STATUS_COLORS = {
    "Baru Masuk": "bg-sky-50 text-sky-700 border-sky-200",
    "Screening": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Tes Logika & Teknis": "bg-amber-50 text-amber-700 border-amber-200",
    "Wawancara / Trial": "bg-purple-50 text-purple-700 border-purple-200",
    "Diterima": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Ditolak": "bg-rose-50 text-rose-700 border-rose-200",
};

export default function ApplicantDetailModal({ isOpen, onClose, applicant, onUpdate, onOpenHireModal }) {
    const [status, setStatus] = useState("Baru Masuk");
    const [skorLogika, setSkorLogika] = useState(0);
    const [skorTeknis, setSkorTeknis] = useState(0);
    const [skorAttitude, setSkorAttitude] = useState(0);
    const [skorSop, setSkorSop] = useState(0);
    const [catatan, setCatatan] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (applicant) {
            setStatus(applicant.status || "Baru Masuk");
            setSkorLogika(applicant.skor_logika || 0);
            setSkorTeknis(applicant.skor_teknis || 0);
            setSkorAttitude(applicant.skor_attitude || 0);
            setSkorSop(applicant.skor_sop || 0);
            setCatatan(applicant.catatan_evaluasi || "");
        }
    }, [applicant, isOpen]);

    if (!isOpen || !applicant) return null;

    const rataRata = Math.round((Number(skorLogika) + Number(skorTeknis) + Number(skorAttitude) + Number(skorSop)) / 4);

    const handleSaveEvaluation = async (overrideStatus = null) => {
        try {
            setSaving(true);
            const targetStatus = overrideStatus || status;

            const payload = {
                skor_logika: Number(skorLogika),
                skor_teknis: Number(skorTeknis),
                skor_attitude: Number(skorAttitude),
                skor_sop: Number(skorSop),
                catatan_evaluasi: catatan.trim(),
                status: targetStatus
            };

            await api.post(`/recruitment/applicants/${applicant.id}/evaluate`, payload);
            toast.success("Penilaian & status kandidat berhasil diperbarui");
            
            if (overrideStatus) {
                setStatus(overrideStatus);
            }
            onUpdate();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menyimpan evaluasi");
        } finally {
            setSaving(false);
        }
    };

    const handleDirectWhatsApp = () => {
        let phone = applicant.nomor_telepon.replace(/\D/g, "");
        if (phone.startsWith("0")) phone = "62" + phone.slice(1);
        const msg = encodeURIComponent(`Halo Kak ${applicant.nama_lengkap}, kami dari Tim KomputerAwet / Serv.io terkait lamaran posisi ${applicant.job_posting?.judul_posisi || "Teknisi"}...`);
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
                
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {applicant.job_posting?.judul_posisi || "Posisi Umum"}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[status] || STATUS_COLORS["Baru Masuk"]}`}>
                                    {status}
                                </span>
                                {applicant.user_hired && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <UserCheck className="w-3 h-3 text-emerald-600" />
                                        <span>Staf Resmi Terdaftar</span>
                                    </span>
                                )}
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                                {applicant.nama_lengkap}
                            </h2>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1.5">
                                <button
                                    type="button"
                                    onClick={handleDirectWhatsApp}
                                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{applicant.nomor_telepon} (WhatsApp)</span>
                                </button>
                                {applicant.email && (
                                    <span className="inline-flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{applicant.email}</span>
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{applicant.pendidikan || "-"}</span>
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{applicant.pengalaman_thn} Thn Pengalaman</span>
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Resume Link */}
                    {applicant.resume_url && (
                        <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Lampiran CV / Berkas Portofolio:</span>
                            <a
                                href={applicant.resume_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold"
                            >
                                <span>Buka Dokumen CV</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                    
                    {/* Rubrik Penilaian Standar KEOS */}
                    <div className="bg-gradient-to-br from-indigo-50/60 via-slate-50 to-purple-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Rubrik Evaluasi KEOS (Skor 0 - 100)
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                                <span className="text-xs text-slate-500">Skor Rata-rata:</span>
                                <span className={`text-xs font-bold ${rataRata >= 75 ? "text-emerald-600" : rataRata >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                                    {rataRata}/100
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Logika & Troubleshooting */}
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">1. Logika & Troubleshooting</span>
                                    <span className="font-bold text-indigo-600">{skorLogika}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skorLogika}
                                    onChange={(e) => setSkorLogika(e.target.value)}
                                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                                />
                                <p className="text-[10px] text-slate-400">Pola pikir diagnosis akar masalah, bukan tebak-tebak.</p>
                            </div>

                            {/* Kemampuan Teknis */}
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">2. Keahlian Teknis (Hard Skill)</span>
                                    <span className="font-bold text-indigo-600">{skorTeknis}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skorTeknis}
                                    onChange={(e) => setSkorTeknis(e.target.value)}
                                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                                />
                                <p className="text-[10px] text-slate-400">Penguasaan OS, skematik, solder, rakitan & kebersihan.</p>
                            </div>

                            {/* Attitude & Integritas */}
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">3. Attitude & Integritas</span>
                                    <span className="font-bold text-indigo-600">{skorAttitude}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skorAttitude}
                                    onChange={(e) => setSkorAttitude(e.target.value)}
                                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                                />
                                <p className="text-[10px] text-slate-400">Kejujuran sparepart, tata krama, dan rasa hormat ke tim.</p>
                            </div>

                            {/* Kepatuhan SOP */}
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">4. Kepatuhan Sistem & SOP</span>
                                    <span className="font-bold text-indigo-600">{skorSop}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skorSop}
                                    onChange={(e) => setSkorSop(e.target.value)}
                                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                                />
                                <p className="text-[10px] text-slate-400">Kedisiplinan mengisi tiket, Defect Map & 8 Titik QC.</p>
                            </div>
                        </div>
                    </div>

                    {/* Status & Catatan Wawancara */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700">
                                Catatan Hasil Wawancara / Observasi Trial Day
                            </label>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">Status Tahapan:</span>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <textarea
                            rows={3}
                            placeholder="Tuliskan catatan hasil tes atau performa trial (misal: analisis skematik cepat, penataan baut rapi, komunikasi ramah)..."
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Quick Pipeline Status Actions */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs text-slate-500 font-medium">Alur Cepat Tahapan:</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleSaveEvaluation("Tes Logika & Teknis")}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Majukan ke Tes Teknis
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveEvaluation("Wawancara / Trial")}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Panggil Trial Day
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveEvaluation("Ditolak")}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Tolak
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => handleSaveEvaluation()}
                        disabled={saving}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? "Menyimpan..." : "Simpan Penilaian"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {!applicant.user_hired && status !== "Diterima" && (
                            <button
                                type="button"
                                onClick={() => onOpenHireModal(applicant)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Terima & Buat Akun Staf 🚀</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

