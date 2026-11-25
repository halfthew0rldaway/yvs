import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { X, Save, Megaphone, Link2, Calendar, Tag } from "lucide-react";
import CustomSelect from "../../components/common/CustomSelect";

const CHANNEL_OPTIONS = [
    { value: "WhatsApp", label: "WhatsApp (Broadcast / Status)" },
    { value: "Instagram", label: "Instagram (Feed / Story / Reels)" },
    { value: "Poster Toko", label: "Poster / Spanduk Workshop" },
    { value: "Google Maps", label: "Google Maps / Profil Bisnis" },
    { value: "TikTok", label: "TikTok / Video Pendek" },
    { value: "Website / Tracking", label: "Portal Tracking Publik YVS" },
    { value: "Lainnya", label: "Saluran Lainnya" },
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

export default function CampaignNoteModal({ isOpen, onClose, note, promotions = [], defaultPromotionId = "", onSuccess }) {
    const isEdit = Boolean(note?.id);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        judul: "",
        saluran: "Instagram",
        tanggal_publikasi: toDateInputValue(null, true),
        promotion_id: defaultPromotionId || "",
        tautan_referensi: "",
        catatan: "",
    });

    useEffect(() => {
        if (!isOpen) return;
        if (note) {
            setForm({
                judul: note.judul || "",
                saluran: note.saluran || "Instagram",
                tanggal_publikasi: toDateInputValue(note.tanggal_publikasi, true),
                promotion_id: note.promotion_id ? String(note.promotion_id) : "",
                tautan_referensi: note.tautan_referensi || "",
                catatan: note.catatan || "",
            });
        } else {
            setForm({
                judul: "",
                saluran: "Instagram",
                tanggal_publikasi: toDateInputValue(null, true),
                promotion_id: defaultPromotionId ? String(defaultPromotionId) : "",
                tautan_referensi: "",
                catatan: "",
            });
        }
    }, [isOpen, note, defaultPromotionId]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                judul: form.judul.trim(),
                saluran: form.saluran,
                tanggal_publikasi: form.tanggal_publikasi,
                promotion_id: form.promotion_id ? Number(form.promotion_id) : null,
                tautan_referensi: form.tautan_referensi.trim() || null,
                catatan: form.catatan.trim() || null,
            };

            if (isEdit) {
                await api.put(`/marketing/campaigns/${note.id}`, payload);
                toast.success("Catatan kampanye berhasil diperbarui");
            } else {
                await api.post("/marketing/campaigns", payload);
                toast.success("Catatan kampanye berhasil disimpan");
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan catatan kampanye");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-shell z-[100]">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
            <div className="modal-panel max-w-3xl">
                {/* Pinned Header */}
                <div className="modal-header flex items-center justify-between gap-3 bg-slate-50/70">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                            <Megaphone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                {isEdit ? "Edit Catatan Kampanye" : "Catat Aktivitas Kampanye"}
                            </h2>
                            <p className="text-2xs sm:text-xs text-slate-500 truncate">
                                Rekam di mana, kapan, dan tautan publikasi promosi sebagai konteks hasil penukaran
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
                    <div className="modal-body space-y-4">
                        <div className="min-w-0">
                            <label className="form-label">
                                Judul Aktivitas Kampanye <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={150}
                                value={form.judul}
                                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                                placeholder="Contoh: Reels Instagram Promo Lebaran Gelombang 1"
                                className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="min-w-0">
                                <label className="form-label flex items-center gap-1.5">
                                    <Megaphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>Saluran Promosi <span className="text-rose-500">*</span></span>
                                </label>
                                <CustomSelect
                                    value={form.saluran}
                                    onChange={(e) => setForm({ ...form, saluran: e.target.value })}
                                    label="Saluran Promosi"
                                    required
                                >
                                    {CHANNEL_OPTIONS.map((ch) => (
                                        <option key={ch.value} value={ch.value}>{ch.label}</option>
                                    ))}
                                </CustomSelect>
                            </div>

                            <div className="min-w-0">
                                <label className="form-label flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>Tanggal Publikasi <span className="text-rose-500">*</span></span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={form.tanggal_publikasi}
                                    onChange={(e) => setForm({ ...form, tanggal_publikasi: e.target.value })}
                                    className="w-full min-w-0 min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="min-w-0">
                            <label className="form-label flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Promo Terkait (Opsional)</span>
                            </label>
                            <CustomSelect
                                value={form.promotion_id}
                                onChange={(e) => setForm({ ...form, promotion_id: e.target.value })}
                                label="Pilih Promo Terkait"
                                searchable
                            >
                                <option value="">-- Kampanye Umum / Tanpa Kode Promo --</option>
                                {promotions.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.kode_promo} · {p.nama_promo}
                                    </option>
                                ))}
                            </CustomSelect>
                            <p className="form-helper">
                                Kosongkan jika ini adalah promosi brand umum (contoh: pasang spanduk toko atau konten edukasi).
                            </p>
                        </div>

                        <div className="min-w-0">
                            <label className="form-label flex items-center gap-1.5">
                                <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Tautan / Link Referensi (Opsional)</span>
                            </label>
                            <input
                                type="text"
                                maxLength={500}
                                value={form.tautan_referensi}
                                onChange={(e) => setForm({ ...form, tautan_referensi: e.target.value })}
                                placeholder="https://instagram.com/p/... atau link Google Maps / poster Canva"
                                className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:font-sans"
                            />
                            <p className="form-helper">
                                URL valid otomatis tampil sebagai tombol klik langsung di daftar catatan kampanye.
                            </p>
                        </div>

                        <div className="min-w-0">
                            <label className="form-label">Catatan Detail Kampanye</label>
                            <textarea
                                rows={3}
                                value={form.catatan}
                                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                                placeholder="Contoh: Dibagikan ke 45 kontak pelanggan laptop lama via WhatsApp; jadwal repost minggu depan..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
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
                            <span>{saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Catatan"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
