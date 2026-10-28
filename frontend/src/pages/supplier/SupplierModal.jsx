import { useState, useEffect } from "react";
import { 
    X, 
    Building2, 
    Save, 
    Phone, 
    Mail, 
    MapPin, 
    Globe, 
    FileText, 
    ShieldCheck, 
    User,
    Sparkles
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const KATEGORI_OPTIONS = [
    "Distributor Resmi",
    "Distributor Paralel / Importir",
    "Toko Online / Marketplace",
    "Supplier Komponen"
];

export default function SupplierModal({ isOpen, onClose, supplierToEdit, onSuccess }) {
    const isEdit = Boolean(supplierToEdit);

    const [nama, setNama] = useState("");
    const [kategori, setKategori] = useState("Distributor Resmi");
    const [kontakPerson, setKontakPerson] = useState("");
    const [telepon, setTelepon] = useState("");
    const [email, setEmail] = useState("");
    const [alamat, setAlamat] = useState("");
    const [linkToko, setLinkToko] = useState("");
    const [kebijakanKlaim, setKebijakanKlaim] = useState("");
    const [catatan, setCatatan] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (supplierToEdit) {
            setNama(supplierToEdit.nama || "");
            setKategori(supplierToEdit.kategori || "Distributor Resmi");
            setKontakPerson(supplierToEdit.kontak_person || "");
            setTelepon(supplierToEdit.telepon || "");
            setEmail(supplierToEdit.email || "");
            setAlamat(supplierToEdit.alamat || "");
            setLinkToko(supplierToEdit.link_toko || "");
            setKebijakanKlaim(supplierToEdit.kebijakan_klaim || "");
            setCatatan(supplierToEdit.catatan || "");
        } else {
            setNama("");
            setKategori("Distributor Resmi");
            setKontakPerson("");
            setTelepon("");
            setEmail("");
            setAlamat("");
            setLinkToko("");
            setKebijakanKlaim("");
            setCatatan("");
        }
    }, [supplierToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nama.trim()) {
            toast.error("Nama distributor/supplier wajib diisi");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                nama: nama.trim(),
                kategori,
                kontak_person: kontakPerson.trim() || null,
                telepon: telepon.trim() || null,
                email: email.trim() || null,
                alamat: alamat.trim() || null,
                link_toko: linkToko.trim() || null,
                kebijakan_klaim: kebijakanKlaim.trim() || null,
                catatan: catatan.trim() || null
            };

            if (isEdit) {
                await api.put(`/supplier/${supplierToEdit.id}`, payload);
                toast.success("Data distributor berhasil diperbarui");
            } else {
                await api.post("/supplier", payload);
                toast.success("Distributor baru berhasil ditambahkan");
            }

            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menyimpan data distributor");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
                
                {/* Header */}
                <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                {isEdit ? "Edit Data Distributor / Supplier" : "Tambah Distributor / Supplier Baru"}
                            </h2>
                            <p className="text-xs text-slate-500">
                                Rekam kontak PIC, lokasi service center, dan kebijakan retur garansi
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    
                    {/* Nama & Kategori */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Nama Distributor / Toko Supplier <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: PT Synnex Metrodata Indonesia / Toko LCD Bandung"
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Kategori Mitra
                            </label>
                            <select
                                value={kategori}
                                onChange={(e) => setKategori(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {KATEGORI_OPTIONS.map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>Nama PIC / Sales / Meja RMA</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Budi Santoso (RMA Support)"
                                value={kontakPerson}
                                onChange={(e) => setKontakPerson(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Kontak: Telepon & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-blue-600" />
                                <span>No. WhatsApp / Telepon</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: 0812-8899-7700"
                                value={telepon}
                                onChange={(e) => setTelepon(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>Email Resmi</span>
                            </label>
                            <input
                                type="email"
                                placeholder="rma.support@distributor.co.id"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Alamat & Link Toko / Portal */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>Alamat Kantor / Service Center / Drop Point Retur</span>
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Contoh: Harco Mangga Dua Blok I No. 25, Lt. 2, Jakarta Pusat"
                                value={alamat}
                                onChange={(e) => setAlamat(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                <span>Link Toko Online / Website / Portal Garansi</span>
                            </label>
                            <input
                                type="url"
                                placeholder="https://tokopedia.com/toko-resmi atau https://portal-rma.com"
                                value={linkToko}
                                onChange={(e) => setLinkToko(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Kebijakan Retur & Klaim Garansi */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Prosedur & Kebijakan Klaim Garansi Distributor</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Contoh: Syarat klaim wajib nota toko, segel utuh, box lengkap. Proses swap 3-5 hari. Biaya ongkir retur kembali ditanggung distributor."
                            value={kebijakanKlaim}
                            onChange={(e) => setKebijakanKlaim(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            Catatan ini akan otomatis muncul sebagai panduan saat staf mengajukan klaim garansi (RMA).
                        </p>
                    </div>

                    {/* Modal Footer */}
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
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            <span>{submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Distributor"}</span>
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

