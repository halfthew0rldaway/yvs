import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, User, Phone, MapPin, Smile, Sparkles, ShieldAlert, AlertTriangle, CheckCircle2, X } from "lucide-react";

export default function CustomerForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get("returnUrl");
    const isEdit = !!id;

    const [form, setForm] = useState({ 
        nama: "", 
        nomor_telepon: "", 
        alamat: "",
        tipe_kepribadian: "Netral",
        catatan_khusus: ""
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDoubleConfirmed, setIsDoubleConfirmed] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api
                .get(`/customer/${id}`)
                .then((res) => {
                    setForm({
                        nama: res.data.nama,
                        nomor_telepon: res.data.nomor_telepon,
                        alamat: res.data.alamat || "",
                        tipe_kepribadian: res.data.tipe_kepribadian || "Netral",
                        catatan_khusus: res.data.catatan_khusus || "",
                    });
                })
                .catch(() => toast.error("Customer tidak ditemukan"))
                .finally(() => setFetching(false));
        }
    }, [id, isEdit]);

    function handleSubmit(e) {
        e.preventDefault();

        const trimmedNama = form.nama.trim();
        if (!trimmedNama || trimmedNama.length < 3) {
            toast.error("Nama lengkap minimal 3 karakter");
            return;
        }

        const cleanPhone = form.nomor_telepon.replace(/[^0-9]/g, "");
        if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 13) {
            toast.error("Nomor telepon harus berupa angka antara 10-13 digit");
            return;
        }

        if (isEdit) {
            setIsDoubleConfirmed(false);
            setIsConfirmModalOpen(true);
        } else {
            executeSave();
        }
    }

    async function executeSave() {
        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/customer/${id}`, form);
                toast.success("Data pelanggan berhasil diperbarui!");
            } else {
                await api.post("/customer", form);
                toast.success("Pelanggan baru berhasil ditambahkan!");
            }
            setIsConfirmModalOpen(false);
            if (returnUrl) {
                navigate(returnUrl);
            } else {
                navigate("/customer");
            }
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
                    onClick={() => returnUrl ? navigate(returnUrl) : navigate("/customer")}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEdit ? "Edit Data Customer" : "Tambah Customer Baru"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isEdit ? "Perbarui informasi pelanggan yang sudah ada" : "Masukkan informasi pelanggan baru ke dalam sistem"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Min 3 - Max 100 karakter</span>
                    </div>
                    <input
                        type="text"
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        placeholder="Contoh: Budi Santoso"
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            Nomor Telepon <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Hanya angka, 10-13 digit</span>
                    </div>
                    <input
                        type="text"
                        value={form.nomor_telepon}
                        onChange={(e) => setForm({ ...form, nomor_telepon: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        placeholder="Contoh: 081234567890"
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            Alamat
                        </label>
                        <span className="text-[11px] text-slate-400">Maksimal 255 karakter</span>
                    </div>
                    <textarea
                        value={form.alamat}
                        onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-400"
                        rows={2}
                        placeholder="Detail alamat domisili pelanggan..."
                    />
                </div>

                {/* Profiling Karakter & Komunikasi Pelanggan */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-sm font-bold text-slate-900">Profil Pelanggan & Gaya Komunikasi</h3>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                            Panduan Adaptasi Pelayanan
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Smile className="w-4 h-4 text-slate-400" />
                                Tipe Kepribadian Pelanggan
                            </label>
                            <select
                                value={form.tipe_kepribadian}
                                onChange={(e) => setForm({ ...form, tipe_kepribadian: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            >
                                <option value="Netral">Netral (Standar / Belum Teridentifikasi)</option>
                                <option value="Koleris">Koleris (Tegas, To The Point, Fokus Solusi Cepat)</option>
                                <option value="Sanguinis">Sanguinis (Ramah, Ceria, Antusias, Suka Cerita)</option>
                                <option value="Plegmatis">Plegmatis (Tenang, Sabar, Butuh Kenyamanan & Kepastian)</option>
                                <option value="Melankolis">Melankolis (Rinci, Teliti, Kritis, Paham Teknis)</option>
                            </select>
                            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                                {form.tipe_kepribadian === "Koleris" && "Panduan: Beri respon cepat, padat, fokus solusi & kepastian estimasi waktu."}
                                {form.tipe_kepribadian === "Sanguinis" && "Panduan: Beri sambutan hangat, antusias, apresiasi, dan gaya bahasa ramah bersahabat."}
                                {form.tipe_kepribadian === "Plegmatis" && "Panduan: Jelaskan dengan sabar, beri rasa aman, dan jangan terkesan mendesak keputusan."}
                                {form.tipe_kepribadian === "Melankolis" && "Panduan: Jelaskan detail teknis logis, rincian biaya transparan, dan jaminan kualitas."}
                                {form.tipe_kepribadian === "Netral" && "Panduan: Salam hangat, mendengarkan aktif, dan berikan solusi yang jelas."}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Catatan Khusus Pelanggan
                            </label>
                            <textarea
                                value={form.catatan_khusus}
                                onChange={(e) => setForm({ ...form, catatan_khusus: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                                rows={3}
                                placeholder="Contoh: Sangat menjaga privasi data kantor, minta nota dicetak fisik, hanya bisa dihubungi WA malam hari..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button
                        type="button"
                        onClick={() => returnUrl ? navigate(returnUrl) : navigate("/customer")}
                        className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto text-center cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Data"}</span>
                    </button>
                </div>
            </form>

            {/* Double Confirmation Modal for Crucial Customer Data Edit */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-amber-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Konfirmasi Perubahan Data Pelanggan
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Periksa kembali data pelanggan sebelum perubahan disimpan ke sistem.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 text-xs sm:text-sm">
                            {/* Changed Summary Card */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500 font-medium">Nama Pelanggan:</span>
                                    <span className="font-bold text-slate-900">{form.nama}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500 font-medium">No. Telepon / WhatsApp:</span>
                                    <span className="font-mono font-bold text-blue-700">{form.nomor_telepon}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500 font-medium">Tipe Kepribadian:</span>
                                    <span className="font-semibold text-slate-800">{form.tipe_kepribadian}</span>
                                </div>
                                {form.alamat && (
                                    <div className="text-xs">
                                        <span className="text-slate-500 font-medium block mb-0.5">Alamat:</span>
                                        <span className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 block">{form.alamat}</span>
                                    </div>
                                )}
                            </div>

                            {/* Impact Notice */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="font-bold text-amber-950 block">Penting: Dampak Perubahan Data Master</strong>
                                    <p className="text-amber-800 text-[11px] leading-relaxed mt-0.5">
                                        Perubahan nama dan nomor telepon akan tersinkronisasi ke seluruh riwayat tiket servis aktif, faktur/invoice, serta kontak notifikasi WhatsApp otomatis.
                                    </p>
                                </div>
                            </div>

                            {/* Double Confirmation Checkbox */}
                            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 cursor-pointer select-none transition-all">
                                <input
                                    type="checkbox"
                                    checked={isDoubleConfirmed}
                                    onChange={(e) => setIsDoubleConfirmed(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5 shrink-0"
                                />
                                <div className="text-xs text-slate-700 leading-snug">
                                    <span className="font-bold text-slate-900 block">Saya telah memverifikasi data di atas</span>
                                    <span className="text-slate-500 text-[11px]">Saya yakin nomor telepon dan identitas pelanggan sudah valid dan benar.</span>
                                </div>
                            </label>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Periksa Kembali
                            </button>
                            <button
                                type="button"
                                onClick={executeSave}
                                disabled={!isDoubleConfirmed || loading}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white"></div>
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Ya, Simpan Perubahan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
