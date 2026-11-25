import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { X, Save, Tag, Calendar, ShieldCheck, Globe, Info } from "lucide-react";
import CustomSelect from "../../components/common/CustomSelect";

const DEVICE_CATEGORIES = [
    { value: "Semua", label: "Semua Kategori Perangkat" },
    { value: "Laptop", label: "Khusus Laptop" },
    { value: "PC Desktop", label: "Khusus PC Desktop / AIO" },
    { value: "Printer", label: "Khusus Printer / Scanner" },
    { value: "Smartphone", label: "Khusus Smartphone / Tablet" },
    { value: "Laptop, PC Desktop", label: "Laptop & PC Desktop" },
];

function toDateInputValue(dateVal, fallbackToday = false) {
    if (!dateVal) {
        if (!fallbackToday) return "";
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return "";
    const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    const yyyy = wib.getUTCFullYear();
    const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(wib.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function PromotionFormModal({ isOpen, onClose, promotion, onSuccess }) {
    const isEdit = Boolean(promotion?.id);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        kode_promo: "",
        nama_promo: "",
        deskripsi: "",
        tipe_diskon: "persen",
        nilai_diskon: "",
        cakupan_diskon: "jasa",
        maksimal_diskon: "",
        minimal_transaksi: 0,
        kategori_perangkat: "Semua",
        tipe_tiket: "Semua",
        tanggal_mulai: toDateInputValue(null, true),
        tanggal_selesai: toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        kuota_total: "",
        satu_kali_per_pelanggan: false,
        tampil_di_tracking: false,
        is_active: true,
    });

    useEffect(() => {
        if (!isOpen) return;
        if (promotion) {
            setForm({
                kode_promo: promotion.kode_promo || "",
                nama_promo: promotion.nama_promo || "",
                deskripsi: promotion.deskripsi || "",
                tipe_diskon: promotion.tipe_diskon || "persen",
                nilai_diskon: promotion.nilai_diskon ?? "",
                cakupan_diskon: promotion.cakupan_diskon || "jasa",
                maksimal_diskon: promotion.maksimal_diskon ?? "",
                minimal_transaksi: promotion.minimal_transaksi ?? 0,
                kategori_perangkat: promotion.kategori_perangkat || "Semua",
                tipe_tiket: promotion.tipe_tiket || "Semua",
                tanggal_mulai: toDateInputValue(promotion.tanggal_mulai, true),
                tanggal_selesai: toDateInputValue(promotion.tanggal_selesai, true),
                kuota_total: promotion.kuota_total ?? "",
                satu_kali_per_pelanggan: Boolean(promotion.satu_kali_per_pelanggan),
                tampil_di_tracking: Boolean(promotion.tampil_di_tracking),
                is_active: promotion.is_active !== false,
            });
        } else {
            const today = toDateInputValue(null, true);
            const nextMonth = toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
            setForm({
                kode_promo: "",
                nama_promo: "",
                deskripsi: "",
                tipe_diskon: "persen",
                nilai_diskon: "",
                cakupan_diskon: "jasa",
                maksimal_diskon: "",
                minimal_transaksi: 0,
                kategori_perangkat: "Semua",
                tipe_tiket: "Semua",
                tanggal_mulai: today,
                tanggal_selesai: nextMonth,
                kuota_total: "",
                satu_kali_per_pelanggan: false,
                tampil_di_tracking: false,
                is_active: true,
            });
        }
    }, [isOpen, promotion]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                kode_promo: form.kode_promo.trim().toUpperCase(),
                nilai_diskon: Number(form.nilai_diskon),
                maksimal_diskon: form.tipe_diskon === "persen" && form.maksimal_diskon !== "" ? Number(form.maksimal_diskon) : null,
                minimal_transaksi: Number(form.minimal_transaksi || 0),
                kuota_total: form.kuota_total !== "" ? Number(form.kuota_total) : null,
                tampil_di_tracking: Boolean(form.tampil_di_tracking),
            };

            if (isEdit) {
                await api.put(`/marketing/promotions/${promotion.id}`, payload);
                toast.success("Promo berhasil diperbarui");
            } else {
                await api.post("/marketing/promotions", payload);
                toast.success("Promo baru berhasil dibuat");
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan data promo");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-shell z-[100]">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
            <div className="modal-panel max-w-6xl">
                {/* Pinned Header */}
                <div className="modal-header flex items-center justify-between gap-3 bg-slate-50/70">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                            <Tag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                {isEdit ? "Edit Penawaran Promo" : "Buat Promo Baru"}
                            </h2>
                            <p className="text-2xs sm:text-xs text-slate-500 truncate">
                                Atur kode, potongan, batas kuota, dan tampilan publik. Catatan kampanye dikelola di tab Catatan Kampanye.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors shrink-0"
                        aria-label="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Shell */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="modal-body">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
                            {/* LEFT COLUMN: Identitas + Aturan Diskon */}
                            <div className="space-y-4 min-w-0">
                                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5 min-w-0">
                                    <h3 className="section-overline flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Identitas Penawaran
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div className="min-w-0">
                                            <label className="form-label">
                                                Kode Promo <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={50}
                                                value={form.kode_promo}
                                                onChange={(e) => setForm({ ...form, kode_promo: e.target.value.toUpperCase().replace(/\s+/g, "-") })}
                                                placeholder="Contoh: LEBARAN2026"
                                                className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                            <p className="form-helper">Otomatis huruf kapital tanpa spasi.</p>
                                        </div>
                                        <div className="min-w-0">
                                            <label className="form-label">
                                                Nama Penawaran <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={150}
                                                value={form.nama_promo}
                                                onChange={(e) => setForm({ ...form, nama_promo: e.target.value })}
                                                placeholder="Contoh: Diskon Lebaran Servis Laptop"
                                                className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <label className="form-label">Deskripsi Singkat Penawaran (Opsional)</label>
                                        <textarea
                                            rows={2}
                                            value={form.deskripsi}
                                            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                                            placeholder="Contoh: Potongan khusus jasa pembersihan & servis laptop selama periode promo berlangsung."
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5 min-w-0">
                                    <h3 className="section-overline flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Aturan Diskon &amp; Proteksi Margin
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <div className="min-w-0">
                                            <label className="form-label">Tipe Potongan</label>
                                            <CustomSelect
                                                value={form.tipe_diskon}
                                                onChange={(e) => setForm({ ...form, tipe_diskon: e.target.value })}
                                                label="Tipe Potongan"
                                            >
                                                <option value="persen">Persentase (%)</option>
                                                <option value="nominal">Nominal Tetap (Rp)</option>
                                            </CustomSelect>
                                        </div>
                                        <div className="min-w-0">
                                            <label className="form-label">
                                                {form.tipe_diskon === "persen" ? "Nilai (%)" : "Nilai (Rp)"} <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max={form.tipe_diskon === "persen" ? "100" : undefined}
                                                value={form.nilai_diskon}
                                                onChange={(e) => setForm({ ...form, nilai_diskon: e.target.value })}
                                                placeholder={form.tipe_diskon === "persen" ? "15" : "30000"}
                                                className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <label className="form-label">Cakupan</label>
                                            <CustomSelect
                                                value={form.cakupan_diskon}
                                                onChange={(e) => setForm({ ...form, cakupan_diskon: e.target.value })}
                                                label="Cakupan Potongan"
                                            >
                                                <option value="jasa">Hanya Jasa (Aman HPP)</option>
                                                <option value="total">Total Tagihan</option>
                                                <option value="sparepart">Hanya Sparepart</option>
                                            </CustomSelect>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {form.tipe_diskon === "persen" && (
                                            <div className="min-w-0">
                                                <label className="form-label">Batas Maksimal Diskon (Rp)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={form.maksimal_diskon}
                                                    onChange={(e) => setForm({ ...form, maksimal_diskon: e.target.value })}
                                                    placeholder="Kosongkan = Tanpa batas"
                                                    className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <label className="form-label">Minimal Subtotal Transaksi (Rp)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.minimal_transaksi}
                                                onChange={(e) => setForm({ ...form, minimal_transaksi: e.target.value })}
                                                placeholder="0"
                                                className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {form.cakupan_diskon === "jasa" && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-start gap-2 leading-relaxed">
                                            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span>Potongan hanya dihitung dari <strong>Biaya Jasa</strong> sehingga modal (HPP) suku cadang tetap terlindungi.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Kelayakan, Periode & Kuota + Publikasi Tracking */}
                            <div className="space-y-4 min-w-0">
                                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5 min-w-0">
                                    <h3 className="section-overline flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Kelayakan, Periode &amp; Kuota
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div className="min-w-0">
                                            <label className="form-label">Kategori Perangkat</label>
                                            <CustomSelect
                                                value={form.kategori_perangkat}
                                                onChange={(e) => setForm({ ...form, kategori_perangkat: e.target.value })}
                                                label="Kategori Perangkat"
                                            >
                                                {DEVICE_CATEGORIES.map((c) => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </CustomSelect>
                                        </div>
                                        <div className="min-w-0">
                                            <label className="form-label">Tipe Layanan Tiket</label>
                                            <CustomSelect
                                                value={form.tipe_tiket}
                                                onChange={(e) => setForm({ ...form, tipe_tiket: e.target.value })}
                                                label="Tipe Layanan Tiket"
                                            >
                                                <option value="Semua">Semua Tipe Tiket</option>
                                                <option value="reguler">Khusus Reguler</option>
                                                <option value="prioritas">Khusus Prioritas / Express</option>
                                            </CustomSelect>
                                        </div>
                                        <div className="min-w-0">
                                            <label className="form-label">
                                                Tanggal Mulai <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={form.tanggal_mulai}
                                                onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                                                className="w-full min-w-0 min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <label className="form-label">
                                                Tanggal Selesai (23:59 WIB) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={form.tanggal_selesai}
                                                onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                                                className="w-full min-w-0 min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <label className="form-label">Kuota Maksimal</label>
                                            <input
                                                type="number"
                                                min={isEdit ? Math.max(1, promotion?.kuota_terpakai || 1) : 1}
                                                value={form.kuota_total}
                                                onChange={(e) => setForm({ ...form, kuota_total: e.target.value })}
                                                placeholder="Kosongkan = Tanpa Batas"
                                                className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                            {isEdit && promotion?.kuota_terpakai > 0 && (
                                                <p className="form-helper">Sudah terpakai {promotion.kuota_terpakai} kali.</p>
                                            )}
                                        </div>
                                        <div className="flex items-center sm:pt-5 min-w-0">
                                            <label className="flex items-start gap-2.5 cursor-pointer select-none !mb-0">
                                                <input
                                                    type="checkbox"
                                                    checked={form.satu_kali_per_pelanggan}
                                                    onChange={(e) => setForm({ ...form, satu_kali_per_pelanggan: e.target.checked })}
                                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                                />
                                                <span className="text-xs text-slate-700 leading-snug">
                                                    <strong className="block text-slate-800">Batasi 1x per pelanggan</strong>
                                                    Dicek otomatis via nomor telepon.
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2.5 min-w-0">
                                    <h3 className="section-overline !text-blue-700 flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Visibilitas Portal Publik (/tracking)
                                    </h3>
                                    <label className="flex items-start gap-2.5 cursor-pointer select-none p-3 rounded-xl bg-white border border-blue-100 !mb-0">
                                        <input
                                            type="checkbox"
                                            checked={form.tampil_di_tracking}
                                            onChange={(e) => setForm({ ...form, tampil_di_tracking: e.target.checked })}
                                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                        />
                                        <span className="text-xs text-slate-700 leading-relaxed min-w-0">
                                            <strong className="block text-slate-900">Tampilkan di Section Promo Halaman Tracking</strong>
                                            Saat aktif &amp; kuota tersedia, penawaran ini otomatis muncul di <code className="bg-slate-100 px-1 rounded text-2xs">/tracking</code> agar pelanggan bisa menyalin kode promo untuk ditunjukkan ke kasir.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pinned Footer */}
                    <div className="modal-footer bg-slate-50/70">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary min-h-[40px] px-4 text-[13px] sm:text-sm flex-1 xs:flex-none justify-center"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary min-h-[40px] px-5 text-[13px] sm:text-sm flex-1 xs:flex-none flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 shrink-0" />
                            <span>{saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Promo"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
