import { useState, useEffect } from "react";
import { X, Briefcase, Save, DollarSign, MapPin, Layers, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const DEPARTEMEN_OPTIONS = ["Teknisi", "Frontliner", "Operasional", "Back Office"];
const TIPE_OPTIONS = ["Full Time", "Part Time", "Magang", "Kontrak"];
const STATUS_OPTIONS = ["Aktif", "Ditutup", "Draft"];

export default function JobPostingModal({ isOpen, onClose, jobToEdit, onSuccess }) {
    const isEdit = Boolean(jobToEdit);

    const [judulPosisi, setJudulPosisi] = useState("");
    const [departemen, setDepartemen] = useState("Teknisi");
    const [tipeKerja, setTipeKerja] = useState("Full Time");
    const [lokasi, setLokasi] = useState("Workshop Utama");
    const [status, setStatus] = useState("Aktif");
    const [gajiMin, setGajiMin] = useState("");
    const [gajiMax, setGajiMax] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [kualifikasi, setKualifikasi] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (jobToEdit) {
            setJudulPosisi(jobToEdit.judul_posisi || "");
            setDepartemen(jobToEdit.departemen || "Teknisi");
            setTipeKerja(jobToEdit.tipe_kerja || "Full Time");
            setLokasi(jobToEdit.lokasi || "Workshop Utama");
            setStatus(jobToEdit.status || "Aktif");
            setGajiMin(jobToEdit.gaji_min || "");
            setGajiMax(jobToEdit.gaji_max || "");
            setDeskripsi(jobToEdit.deskripsi || "");
            setKualifikasi(jobToEdit.kualifikasi || "");
        } else {
            setJudulPosisi("");
            setDepartemen("Teknisi");
            setTipeKerja("Full Time");
            setLokasi("Workshop Utama");
            setStatus("Aktif");
            setGajiMin("");
            setGajiMax("");
            setDeskripsi("");
            setKualifikasi("");
        }
    }, [jobToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!judulPosisi.trim()) {
            toast.error("Nama posisi jabatan wajib diisi");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                judul_posisi: judulPosisi.trim(),
                departemen,
                tipe_kerja: tipeKerja,
                lokasi: lokasi.trim(),
                status,
                gaji_min: parseInt(gajiMin) || 0,
                gaji_max: parseInt(gajiMax) || 0,
                deskripsi: deskripsi.trim(),
                kualifikasi: kualifikasi.trim()
            };

            if (isEdit) {
                await api.put(`/recruitment/jobs/${jobToEdit.id}`, payload);
                toast.success("Lowongan posisi berhasil diperbarui");
            } else {
                await api.post("/recruitment/jobs", payload);
                toast.success("Lowongan posisi baru berhasil diterbitkan");
            }

            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menyimpan lowongan");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                {isEdit ? "Edit Lowongan Posisi" : "Buka Lowongan Posisi Baru"}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Posisi tim terstruktur berdasarkan kerangka Position Design KEOS
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-7 overflow-y-auto space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Judul Posisi Jabatan <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Teknisi Software & OS / Teknisi Hardware"
                            value={judulPosisi}
                            onChange={(e) => setJudulPosisi(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                {DEPARTEMEN_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Tipe Kerja
                            </label>
                            <select
                                value={tipeKerja}
                                onChange={(e) => setTipeKerja(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Ekspektasi Gaji Min (Rp)
                            </label>
                            <input
                                type="number"
                                placeholder="2500000"
                                value={gajiMin}
                                onChange={(e) => setGajiMin(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Ekspektasi Gaji Max (Rp)
                            </label>
                            <input
                                type="number"
                                placeholder="4000000"
                                value={gajiMax}
                                onChange={(e) => setGajiMax(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Tugas & Tanggung Jawab Utama
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Uraikan fokus pengerjaan harian (contoh: instalasi OS, deep cleaning, diagnosa skematik, melayani pelanggan)..."
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Kualifikasi & Syarat Kompetensi
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Kriteria wajib (contoh: SMK TKJ/Elektro, teliti, paham logika troubleshooting, jujur, mematuhi SOP)..."
                            value={kualifikasi}
                            onChange={(e) => setKualifikasi(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

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
                            <span>{submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Terbitkan Posisi"}</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
