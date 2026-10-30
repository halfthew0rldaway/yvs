import { useState, useEffect } from "react";
import { X, ShieldCheck, Save, AlertCircle, Plus, Trash2 } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const KATEGORI_OPTIONS = [
    "Operasional Toko",
    "Teknisi & QC",
    "Frontliner & CS",
    "Keselamatan & K3",
    "Manajemen & Finance"
];

const ROLE_OPTIONS = ["Semua", "Teknisi", "Frontliner", "Admin"];

export default function SopFormModal({ isOpen, onClose, sopToEdit, onSuccess }) {
    const isEdit = Boolean(sopToEdit);

    const [kode, setKode] = useState("");
    const [judul, setJudul] = useState("");
    const [kategori, setKategori] = useState("Operasional Toko");
    const [targetRole, setTargetRole] = useState("Semua");
    const [ringkasan, setRingkasan] = useState("");
    const [konten, setKonten] = useState("");
    const [poinKunciList, setPoinKunciList] = useState([""]);
    const [versi, setVersi] = useState("1.0");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (sopToEdit) {
            setKode(sopToEdit.kode || "");
            setJudul(sopToEdit.judul || "");
            setKategori(sopToEdit.kategori || "Operasional Toko");
            setTargetRole(sopToEdit.target_role || "Semua");
            setRingkasan(sopToEdit.ringkasan || "");
            setKonten(sopToEdit.konten || "");
            setVersi(sopToEdit.versi || "1.0");

            if (Array.isArray(sopToEdit.poin_kunci_list) && sopToEdit.poin_kunci_list.length > 0) {
                setPoinKunciList(sopToEdit.poin_kunci_list);
            } else if (sopToEdit.poin_kunci) {
                try {
                    setPoinKunciList(JSON.parse(sopToEdit.poin_kunci));
                } catch {
                    setPoinKunciList(sopToEdit.poin_kunci.split("\n").filter(Boolean));
                }
            } else {
                setPoinKunciList([""]);
            }
        } else {
            setKode("");
            setJudul("");
            setKategori("Operasional Toko");
            setTargetRole("Semua");
            setRingkasan("");
            setKonten("");
            setPoinKunciList([""]);
            setVersi("1.0");
        }
    }, [sopToEdit, isOpen]);

    if (!isOpen) return null;

    const handleAddPoint = () => {
        setPoinKunciList([...poinKunciList, ""]);
    };

    const handlePointChange = (idx, value) => {
        const next = [...poinKunciList];
        next[idx] = value;
        setPoinKunciList(next);
    };

    const handleRemovePoint = (idx) => {
        setPoinKunciList(poinKunciList.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!kode.trim() || !judul.trim() || !ringkasan.trim() || !konten.trim()) {
            toast.error("Kode, Judul, Ringkasan, dan Konten SOP wajib diisi");
            return;
        }

        try {
            setSubmitting(true);
            const filteredPoints = poinKunciList.map(p => p.trim()).filter(Boolean);

            const payload = {
                kode: kode.trim().toUpperCase(),
                judul: judul.trim(),
                kategori,
                target_role: targetRole,
                ringkasan: ringkasan.trim(),
                konten: konten.trim(),
                poin_kunci: filteredPoints,
                versi: versi.trim() || "1.0"
            };

            if (isEdit) {
                await api.put(`/sop/${sopToEdit.id}`, payload);
                toast.success("Dokumen SOP berhasil diperbarui");
            } else {
                await api.post("/sop", payload);
                toast.success("Dokumen SOP baru berhasil dibuat");
            }

            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menyimpan SOP");
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
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                {isEdit ? "Edit Dokumen SOP" : "Tulis SOP Standar Baru"}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Format standar operasional untuk pedoman kerja tim KomputerAwet / Serv.io
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Kode SOP <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: SOP-OPS-004"
                                value={kode}
                                onChange={(e) => setKode(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Kategori
                            </label>
                            <select
                                value={kategori}
                                onChange={(e) => setKategori(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                {KATEGORI_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Target Role
                            </label>
                            <select
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                {ROLE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Judul SOP <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: SOP Grooming & Standar Penampilan Karyawan"
                            value={judul}
                            onChange={(e) => setJudul(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Ringkasan Singkat (1-2 Kalimat) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Tuliskan tujuan dan esensi SOP secara ringkas agar cepat dipahami tim..."
                            value={ringkasan}
                            onChange={(e) => setRingkasan(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                        />
                    </div>

                    {/* Poin Kunci / Quick Glance */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                                Poin Kunci / Quick Glance (Checklist Cepat Tim)
                            </label>
                            <button
                                type="button"
                                onClick={handleAddPoint}
                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Poin</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            {poinKunciList.map((point, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="w-5 text-2xs font-bold text-slate-400 text-center font-mono">
                                        {idx + 1}.
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Poin penting yang wajib ditaati..."
                                        value={point}
                                        onChange={(e) => handlePointChange(idx, e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                    {poinKunciList.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePoint(idx)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Prosedur Lengkap Bertahap <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={8}
                            placeholder="Tuliskan bab, alur pengerjaan, aturan teknis, dan standar penyelesaian..."
                            value={konten}
                            onChange={(e) => setKonten(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all leading-relaxed"
                            required
                        />
                    </div>

                    {/* Footer Submit */}
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
                            <span>{submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Terbitkan SOP"}</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
