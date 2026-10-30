import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";
import {
    ArrowLeft,
    Save,
    MonitorSmartphone,
    User,
    Box,
    Hash,
    Laptop,
    Monitor,
    Printer,
    HardDrive,
    Keyboard,
    Boxes,
    Search,
    UserCheck,
    X,
    Check,
    Phone,
    ArrowRightLeft,
    Sparkles,
    UserPlus,
    CheckCircle2,
    ShieldAlert,
    AlertTriangle
} from "lucide-react";

const DEVICE_TYPES = [
    {
        id: "Laptop",
        label: "Laptop",
        sub: "Notebook, Ultrabook, MacBook",
        icon: Laptop,
        activeColor: "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20",
        iconColor: "text-blue-600"
    },
    {
        id: "Desktop PC",
        label: "Desktop PC",
        sub: "Tower, Mini PC, All-in-One",
        icon: Monitor,
        activeColor: "border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20",
        iconColor: "text-indigo-600"
    },
    {
        id: "Printer",
        label: "Printer",
        sub: "Inkjet, Laser, Scanner, POS",
        icon: Printer,
        activeColor: "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20",
        iconColor: "text-emerald-600"
    },
    {
        id: "Penyimpanan (HDD/SSD)",
        label: "Penyimpanan",
        sub: "Internal/Ext HDD, SSD, Flashdisk",
        icon: HardDrive,
        activeColor: "border-amber-600 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20",
        iconColor: "text-amber-600"
    },
    {
        id: "Aksesoris (Mouse/Keyboard)",
        label: "Aksesoris",
        sub: "Keyboard, Mouse, Headset",
        icon: Keyboard,
        activeColor: "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20",
        iconColor: "text-purple-600"
    },
    {
        id: "Lainnya",
        label: "Lainnya",
        sub: "Gadget, Konsol, IoT & lainnya",
        icon: Boxes,
        activeColor: "border-slate-800 bg-slate-100/80 text-slate-900 ring-2 ring-slate-400/20",
        iconColor: "text-slate-700"
    }
];

const POPULAR_BRANDS = [
    "ASUS", "Lenovo", "HP", "Acer", "Dell", "Apple", "MSI", "Samsung", "Canon", "Epson", "Toshiba", "Brother"
];

export default function PerangkatForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const customerParam = searchParams.get("customer_id");
    const returnUrl = searchParams.get("returnUrl");
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({
        customer_id: customerParam || "",
        jenis_perangkat: "Laptop",
        merek: "",
        model: "",
        serial_number: "",
    });
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [riwayat, setRiwayat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDoubleConfirmed, setIsDoubleConfirmed] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get("/customer"),
            isEdit ? api.get(`/perangkat/${id}`) : null,
        ])
            .then(([customerRes, perangkatRes]) => {
                setCustomers(customerRes.data || []);
                if (perangkatRes) {
                    const p = perangkatRes.data;
                    setForm({
                        customer_id: p.customer_id,
                        jenis_perangkat: p.jenis_perangkat || "Laptop",
                        merek: p.merek,
                        model: p.model,
                        serial_number: p.serial_number || "",
                    });
                    setRiwayat(p.tiket_servis || []);
                } else if (customerParam) {
                    setForm(prev => ({ ...prev, customer_id: customerParam }));
                }
            })
            .catch(() => toast.error("Gagal memuat data"))
            .finally(() => setFetching(false));
    }, [id, isEdit, customerParam]);

    useEffect(() => {
        if (!isConfirmModalOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setIsConfirmModalOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isConfirmModalOpen]);

    // Pelanggan yang sedang terpilih
    const selectedCustomer = useMemo(() => {
        if (!form.customer_id) return null;
        return customers.find(c => String(c.id) === String(form.customer_id)) || null;
    }, [customers, form.customer_id]);

    // Daftar pelanggan terfilter untuk fitur pencarian instan
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) {
            return customers.slice(0, 6);
        }
        const q = customerSearch.trim().toLowerCase();
        const cleanDigits = q.replace(/\D/g, "");

        return customers.filter(c => {
            const nameMatch = c.nama?.toLowerCase().includes(q);
            const rawPhone = c.nomor_telepon || "";
            const phoneMatch = rawPhone.toLowerCase().includes(q) || (cleanDigits && rawPhone.replace(/\D/g, "").includes(cleanDigits));
            return nameMatch || phoneMatch;
        }).slice(0, 8);
    }, [customers, customerSearch]);

    function handleSubmit(e) {
        e.preventDefault();

        if (!form.customer_id) {
            toast.error("Silakan cari dan pilih customer pemilik terlebih dahulu");
            return;
        }

        if (!form.jenis_perangkat) {
            toast.error("Silakan pilih kategori jenis perangkat");
            return;
        }

        if (!form.merek.trim()) {
            toast.error("Merek perangkat wajib diisi");
            return;
        }

        if (!form.model.trim()) {
            toast.error("Model perangkat wajib diisi");
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
                await api.put(`/perangkat/${id}`, form);
                toast.success("Data perangkat berhasil diperbarui!");
            } else {
                await api.post("/perangkat", form);
                toast.success("Perangkat baru berhasil ditambahkan!");
            }
            setIsConfirmModalOpen(false);
            if (returnUrl) {
                navigate(returnUrl);
            } else {
                navigate("/perangkat");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan perangkat");
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600"></div>
                <span className="text-xs text-slate-500 font-medium">Memuat form data perangkat...</span>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => returnUrl ? navigate(returnUrl) : navigate("/perangkat")}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEdit ? "Edit Data Perangkat" : "Tambah Perangkat Baru"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isEdit ? "Perbarui informasi spesifikasi perangkat pelanggan" : "Daftarkan unit perangkat servis baru ke sistem"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8 space-y-8">
                
                {/* 1. SELEKTOR CUSTOMER SEARCHABLE */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            Customer Pemilik Unit <span className="text-red-500">*</span>
                        </label>
                        {!selectedCustomer && (
                            <Link
                                to="/customer/new"
                                target="_blank"
                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                + Pelanggan Baru
                            </Link>
                        )}
                    </div>

                    {selectedCustomer ? (
                        // Card Pelanggan Terpilih
                        <div className="p-4 bg-gradient-to-r from-blue-50/80 via-slate-50/80 to-indigo-50/40 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
                                    {selectedCustomer.nama ? selectedCustomer.nama.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-900 text-base">{selectedCustomer.nama}</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                            {selectedCustomer.tipe_kepribadian || "Pelanggan"}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Terpilih
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                            {selectedCustomer.nomor_telepon}
                                        </span>
                                        {selectedCustomer.alamat && (
                                            <span className="text-slate-400 font-sans hidden sm:inline truncate max-w-[280px]">
                                                • {selectedCustomer.alamat}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    setForm(prev => ({ ...prev, customer_id: "" }));
                                    setCustomerSearch("");
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer self-start sm:self-center"
                            >
                                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                                <span>Ganti Pelanggan</span>
                            </button>
                        </div>
                    ) : (
                        // Search Box & List Pelanggan
                        <div className="space-y-2.5">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    placeholder="Ketik nama atau nomor WhatsApp pelanggan (contoh: Budi / 0812...)"
                                    className="w-full pl-10 pr-9 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                                />
                                {customerSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setCustomerSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-2 space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    <span>{customerSearch ? "Hasil Pencarian Pelanggan" : "Rekomendasi Pelanggan Terdaftar"}</span>
                                    <span>{filteredCustomers.length} ditemukan</span>
                                </div>

                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setForm(prev => ({ ...prev, customer_id: c.id }));
                                                setCustomerSearch("");
                                            }}
                                            className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-blue-50/80 hover:border-blue-200 border border-slate-200/80 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 transition-colors">
                                                    {c.nama ? c.nama.charAt(0).toUpperCase() : "U"}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-800 text-xs truncate group-hover:text-blue-700">
                                                        {c.nama}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono">
                                                        {c.nomor_telepon} {c.alamat ? `• ${c.alamat.substring(0, 30)}...` : ""}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-2">
                                                Pilih <Check className="w-3.5 h-3.5" />
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                                        <p>Pelanggan dengan kata kunci "{customerSearch}" tidak ditemukan.</p>
                                        <Link
                                            to="/customer/new"
                                            target="_blank"
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold underline text-xs"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" /> Daftarkan Pelanggan Baru Sekarang
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. PILIHAN KATEGORI / JENIS PERANGKAT VISUAL DENGAN ICON BOX */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <MonitorSmartphone className="w-4 h-4 text-blue-600" />
                            Kategori Jenis Perangkat <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-slate-400 font-medium">Pilih tipe unit yang diservis</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {DEVICE_TYPES.map((type) => {
                            const IconComponent = type.icon;
                            const isSelected = form.jenis_perangkat === type.id;

                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, jenis_perangkat: type.id }))}
                                    className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                                        isSelected
                                            ? type.activeColor + " shadow-sm -translate-y-0.5"
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700"
                                    }`}
                                >
                                    {/* Active Checkmark Pill */}
                                    {isSelected && (
                                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </span>
                                    )}

                                    <div className="space-y-2">
                                        <div className={`p-2.5 rounded-xl w-fit transition-transform group-hover:scale-105 ${
                                            isSelected ? "bg-white shadow-xs " + type.iconColor : "bg-slate-100 text-slate-600"
                                        }`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs text-slate-900 leading-tight">
                                                {type.label}
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 leading-tight">
                                                {type.sub}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. DETAIL SPESIFIKASI: MEREK & MODEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Box className="w-4 h-4 text-blue-600" />
                                Merek Perangkat <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-400">Otomatis ternormalisasi</span>
                        </div>
                        <input
                            type="text"
                            list="brand-suggestions"
                            value={form.merek}
                            onChange={(e) => setForm({ ...form, merek: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                            placeholder="Contoh: ASUS, Lenovo, HP, Apple..."
                            required
                        />
                        <datalist id="brand-suggestions">
                            {POPULAR_BRANDS.map(b => (
                                <option key={b} value={b} />
                            ))}
                        </datalist>

                        {/* Quick Brand Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                            <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Pilihan Populer:</span>
                            {POPULAR_BRANDS.map(brand => {
                                const isBrandActive = form.merek.trim().toUpperCase() === brand.toUpperCase();
                                return (
                                    <button
                                        key={brand}
                                        type="button"
                                        onClick={() => setForm({ ...form, merek: brand })}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                            isBrandActive
                                                ? "bg-blue-600 text-white shadow-2xs scale-105"
                                                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60"
                                        }`}
                                    >
                                        {brand}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <MonitorSmartphone className="w-4 h-4 text-blue-600" />
                                Model / Seri Spesifik <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-400">Maksimal 100 karakter</span>
                        </div>
                        <input
                            type="text"
                            value={form.model}
                            onChange={(e) => setForm({ ...form, model: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                            placeholder="Contoh: ROG Zephyrus G14 / ThinkPad T490 / L3210"
                            required
                        />
                        <p className="text-[11px] text-slate-400 mt-2">
                            Masukkan seri detail unit untuk memudahkan pencarian kompatibilitas sparepart.
                        </p>
                    </div>
                </div>

                {/* 4. SERIAL NUMBER & CATATAN */}
                <div className="pt-2 border-t border-slate-100">
                    <div className="max-w-md">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-blue-600" />
                                Serial Number (S/N)
                            </label>
                            <span className="text-[11px] text-slate-400 font-medium">Opsional tapi disarankan</span>
                        </div>
                        <input
                            type="text"
                            value={form.serial_number}
                            onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-mono text-sm uppercase"
                            placeholder="Contoh: SN-8924018247 (atau nomor seri di bawah stiker unit)"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            Serial number digunakan untuk mencegah tertukarnya unit antar pelanggan dan validasi garansi.
                        </p>
                    </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => returnUrl ? navigate(returnUrl) : navigate("/perangkat")}
                        className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-2xs w-full sm:w-auto text-center text-sm cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 text-sm cursor-pointer"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{loading ? "Menyimpan..." : isEdit ? "Perbarui Perangkat" : "Simpan Perangkat"}</span>
                    </button>
                </div>
            </form>

            {/* Riwayat Servis Perangkat (Saat Mode Edit) */}
            {isEdit && riwayat.length > 0 && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <MonitorSmartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                Rekam Jejak Servis Unit Ini
                            </h2>
                            <p className="text-xs text-slate-500">
                                Histori tiket perbaikan yang tercatat pada perangkat ini
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                        <div className="w-full overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Nomor Tiket</th>
                                        <th className="px-6 py-4">Tanggal Masuk</th>
                                        <th className="px-6 py-4">Keluhan</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {riwayat.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((tiket) => (
                                        <tr 
                                            key={tiket.id} 
                                            onClick={(e) => {
                                                if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                                navigate(`/tiket-servis/${tiket.id}`);
                                            }}
                                            className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-900 font-mono">{tiket.nomor_tiket}</td>
                                            <td className="px-6 py-4 text-xs">{new Date(tiket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                            <td className="px-6 py-4 truncate max-w-[220px] text-xs" title={tiket.keluhan}>{tiket.keluhan}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                    tiket.status === 'selesai' || tiket.status === 'diambil' 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : tiket.status === 'dibatalkan'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {tiket.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/tiket-servis/${tiket.id}`)}
                                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors text-xs cursor-pointer"
                                                >
                                                    Lihat Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {/* Double Confirmation Modal for Crucial Device Data Edit */}
            {isConfirmModalOpen && (
                <div 
                    className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
                    onClick={() => setIsConfirmModalOpen(false)}
                >
                    <div 
                        className="modal-surface relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-amber-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Konfirmasi Perubahan Data Perangkat
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Periksa kembali data perangkat sebelum perubahan disimpan ke sistem.
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
                                    <span className="text-slate-500 font-medium">Customer Pemilik:</span>
                                    <span className="font-bold text-slate-900">{selectedCustomer?.nama || "Pelanggan Terpilih"}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500 font-medium">Kategori / Jenis:</span>
                                    <span className="font-semibold text-slate-800">{form.jenis_perangkat}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500 font-medium">Merek & Model:</span>
                                    <span className="font-bold text-slate-900">{form.merek} {form.model}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium">Serial Number (SN):</span>
                                    <span className="font-mono font-bold text-indigo-700">{form.serial_number || "Tanpa Serial Number"}</span>
                                </div>
                            </div>

                            {/* Impact Notice */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="font-bold text-amber-950 block">Penting: Dampak Perubahan Data Unit</strong>
                                    <p className="text-amber-800 text-[11px] leading-relaxed mt-0.5">
                                        Perubahan nomor seri atau data unit akan memengaruhi pencarian barcode/QR, histori pengerjaan teknisi, dan validasi klaim garansi di masa mendatang.
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
                                    <span className="font-bold text-slate-900 block">Saya telah memverifikasi unit fisik</span>
                                    <span className="text-slate-500 text-[11px]">Saya yakin merek, tipe, nomor seri, dan kepemilikan unit sudah sesuai fisik perangkat.</span>
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
                                        <span>Ya, Simpan Perangkat</span>
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
