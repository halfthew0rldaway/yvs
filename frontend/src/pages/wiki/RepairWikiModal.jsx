import { useState, useEffect } from "react";
import { X, BookOpen, Save, Wrench, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const KATEGORI_OPTIONS = [
    "Motherboard / Power",
    "Layar / Display",
    "Engsel / Casing",
    "Storage & OS",
    "Pembersihan & Pasta",
    "Audio & Port",
    "Baterai & Charger",
    "Lainnya"
];

const DIFFICULTY_OPTIONS = ["Mudah", "Menengah", "Mahir"];

export default function RepairWikiModal({ isOpen, onClose, wikiToEdit = null, onSuccess }) {
    const [formData, setFormData] = useState({
        judul: "",
        merek: "",
        model_seri: "",
        kategori: "Motherboard / Power",
        tingkat_kesulitan: "Menengah",
        estimasi_waktu: "1-2 Jam",
        tingkat_sukses: 95,
        komponen_terkait: "",
        gejala: "",
        penyebab: "",
        solusi_langkah: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (wikiToEdit) {
            setFormData({
                judul: wikiToEdit.judul || "",
                merek: wikiToEdit.merek || "",
                model_seri: wikiToEdit.model_seri || "",
                kategori: wikiToEdit.kategori || "Motherboard / Power",
                tingkat_kesulitan: wikiToEdit.tingkat_kesulitan || "Menengah",
                estimasi_waktu: wikiToEdit.estimasi_waktu || "1-2 Jam",
                tingkat_sukses: wikiToEdit.tingkat_sukses || 95,
                komponen_terkait: wikiToEdit.komponen_terkait || "",
                gejala: wikiToEdit.gejala || "",
                penyebab: wikiToEdit.penyebab || "",
                solusi_langkah: wikiToEdit.solusi_langkah || ""
            });
        } else {
            setFormData({
                judul: "",
                merek: "",
                model_seri: "",
                kategori: "Motherboard / Power",
                tingkat_kesulitan: "Menengah",
                estimasi_waktu: "1-2 Jam",
                tingkat_sukses: 95,
                komponen_terkait: "",
                gejala: "",
                penyebab: "",
                solusi_langkah: "1. Bongkar unit dan lepas konektor baterai utama.\n2. Lakukan pengukuran tegangan pada jalur 19V/Vin.\n3. Periksa kondisi komponen terkait.\n4. Lakukan penggantian / perbaikan.\n5. Rakit kembali dan uji fungsionalitas."
            });
        }
    }, [wikiToEdit, isOpen]);

    if (!isOpen) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.judul.trim() || !formData.gejala.trim() || !formData.solusi_langkah.trim()) {
            toast.error("Judul, Gejala, dan Langkah Solusi wajib diisi!");
            return;
        }

        try {
            setSubmitting(true);
            if (wikiToEdit) {
                await api.put(`/repair-wiki/${wikiToEdit.id}`, formData);
                toast.success("Panduan wiki berhasil diperbarui!");
            } else {
                await api.post("/repair-wiki", formData);
                toast.success("Panduan wiki berhasil disimpan!");
            }
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menyimpan panduan wiki");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800 text-base">
                                {wikiToEdit ? "Edit Panduan Wiki Reparasi" : "Tulis Panduan Wiki Reparasi Baru"}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Dokumentasikan solusi kerusakan perangkat agar teknisi lain dapat menyelesaikannya lebih cepat.
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
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
                    {/* Judul Panduan */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Judul Masalah / Solusi <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Mengatasi Asus TUF FX505 Mati Total Konslet Jalur 19V"
                            value={formData.judul}
                            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                        />
                    </div>

                    {/* Merek & Seri Model */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Merek Perangkat
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Asus, Lenovo, Apple, Acer"
                                value={formData.merek}
                                onChange={(e) => setFormData({ ...formData, merek: e.target.value })}
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Seri / Model Perangkat
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: TUF FX505, Legion Y540, MacBook Air M1"
                                value={formData.model_seri}
                                onChange={(e) => setFormData({ ...formData, model_seri: e.target.value })}
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Kategori, Kesulitan, Estimasi & Sukses Rate */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Kategori
                            </label>
                            <select
                                value={formData.kategori}
                                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                            >
                                {KATEGORI_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Tingkat Kesulitan
                            </label>
                            <select
                                value={formData.tingkat_kesulitan}
                                onChange={(e) => setFormData({ ...formData, tingkat_kesulitan: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                            >
                                {DIFFICULTY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Estimasi Waktu
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: 1-2 Jam"
                                value={formData.estimasi_waktu}
                                onChange={(e) => setFormData({ ...formData, estimasi_waktu: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Sukses Rate (%)
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="100"
                                value={formData.tingkat_sukses}
                                onChange={(e) => setFormData({ ...formData, tingkat_sukses: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                            />
                        </div>
                    </div>

                    {/* Komponen / IC Terkait */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Komponen / Sparepart Terkait (Opsional)
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: IC Power BQ24780S, Kapasitor SMD 10uF 25V, MOSFET AON7408"
                            value={formData.komponen_terkait}
                            onChange={(e) => setFormData({ ...formData, komponen_terkait: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                        />
                    </div>

                    {/* Gejala Kerusakan */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Gejala Kerusakan <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            required
                            placeholder="Jelaskan apa yang terjadi saat laptop dinyalakan (e.g. Lampu indikator mati, tidak merespon saat tombol ditekan, ada bunyi klik perlahan)..."
                            value={formData.gejala}
                            onChange={(e) => setFormData({ ...formData, gejala: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs leading-relaxed"
                        />
                    </div>

                    {/* Akar Penyebab */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Akar Masalah / Penyebab (Opsional)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Penyebab kerusakan fisik atau kelistrikan (e.g. Kapasitor decoupling short akibat overheating atau lonjakan voltase adaptor)..."
                            value={formData.penyebab}
                            onChange={(e) => setFormData({ ...formData, penyebab: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs leading-relaxed"
                        />
                    </div>

                    {/* Langkah Solusi Pengerjaan */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Langkah-Langkah Solusi & Prosedur Pengerjaan <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={6}
                            required
                            placeholder="Tulis urutan langkah perbaikan (1, 2, 3...) beserta poin pemeriksaan voltase dan trik khusus..."
                            value={formData.solusi_langkah}
                            onChange={(e) => setFormData({ ...formData, solusi_langkah: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 text-slate-900 font-mono text-xs border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{submitting ? "Menyimpan..." : "Simpan ke Pustaka Wiki"}</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
