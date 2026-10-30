import { useState, useEffect } from "react";
import { X, UserCheck, ShieldCheck, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function HireApplicantModal({ isOpen, onClose, applicant, onSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("ServioStaff2026!");
    const [role, setRole] = useState("teknisi");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (applicant) {
            setEmail(applicant.email || "");
            const defaultRole = applicant.job_posting?.departemen === "Frontliner" ? "admin" : "teknisi";
            setRole(defaultRole);
            setPassword("ServioStaff2026!");
        }
    }, [applicant, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e) {
            if (e.key === "Escape" && !submitting) onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, submitting, onClose]);

    if (!isOpen || !applicant) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Email staf wajib diisi untuk login ke sistem");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                email: email.trim().toLowerCase(),
                password: password.trim(),
                role
            };

            const res = await api.post(`/recruitment/applicants/${applicant.id}/hire`, payload);
            toast.success(res.data?.message || "Kandidat berhasil di-onboard menjadi staf resmi!");
            
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal meng-onboard staf");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            {/* 60fps Hardware-Accelerated Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs modal-backdrop"
                onClick={() => !submitting && onClose()}
            />

            {/* 60fps Spring Modal Surface */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh] modal-surface z-10">
                
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-emerald-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Konfirmasi Penerimaan Staf
                            </h2>
                            <p className="text-xs text-slate-500">
                                Onboard kandidat terpilih langsung menjadi User Serv.io
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

                {/* Candidate Highlight Card */}
                <div className="p-5 sm:p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                        <div className="text-xs text-slate-400 font-medium">Kandidat Terpilih:</div>
                        <div className="text-sm font-bold text-slate-900">{applicant.nama_lengkap}</div>
                        <div className="text-xs text-blue-600 font-semibold">
                            Posisi: {applicant.job_posting?.judul_posisi || "Staf"}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Email Login Akun <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="dimas@komputerawet.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Hak Akses / Role Sistem
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            >
                                <option value="teknisi">TEKNISI (Akses Tiket, Pengerjaan, QC, Wiki)</option>
                                <option value="admin">ADMIN (Akses Kasir, BPBS, Rekrutmen, Laporan)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Password Awal Default
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Staf dapat mengubah password ini saat pertama kali login.
                            </p>
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
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{submitting ? "Memproses..." : "Aktifkan Akun & Terima"}</span>
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

