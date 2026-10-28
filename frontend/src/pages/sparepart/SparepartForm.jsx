import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { 
    ArrowLeft, 
    Save, 
    Package, 
    Hash, 
    DollarSign, 
    Layers, 
    Search, 
    Plus, 
    Building2, 
    FileText, 
    ShieldCheck, 
    HelpCircle, 
    Clock, 
    Sparkles, 
    Check, 
    Phone, 
    ExternalLink, 
    MessageCircle, 
    MapPin, 
    Calendar, 
    TrendingUp, 
    CheckCircle2, 
    AlertCircle,
    Info,
    X,
    QrCode
} from "lucide-react";
import SupplierModal from "../supplier/SupplierModal";
import SparepartQrModal from "../../components/SparepartQrModal";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

const KOMPATIBILITAS_OPTIONS = ["Laptop", "Desktop", "AIO", "Printer", "Aksesoris", "Lainnya", "Umum"];

const KATEGORI_HARDWARE = [
    "Storage / SSD / HDD",
    "Memory / RAM",
    "Layar / LCD",
    "Baterai",
    "Adaptor / Charger",
    "Keyboard & Touchpad",
    "Kipas & Cooling",
    "Motherboard & IC",
    "Aksesoris",
    "Lainnya"
];

export default function SparepartForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    // Form Data
    const [form, setForm] = useState({ 
        brand_id: "", 
        supplier_id: "",
        nama: "", 
        kategori: "Umum", 
        stok: "", 
        harga: "", 
        harga_beli: "",
        has_garansi_distri: true,
        tipe_garansi_distri: "1 Tahun",
        sistem_perhitungan_garansi: "sejak_nota_customer",
        distributor_nama: "",
        distributor_kontak: "",
        kebijakan_klaim: "",
        supplier_nama: "",
        nomor_faktur: "",
        tanggal_beli: new Date().toISOString().split("T")[0],
        catatan: ""
    });

    const [brands, setBrands] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [searchBrand, setSearchBrand] = useState("");
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
    
    // Add Brand Modal
    const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
    const [newBrandName, setNewBrandName] = useState("");
    const [isAddingBrand, setIsAddingBrand] = useState(false);

    // Add Supplier Modal
    const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    // Supplier Directory Selection Mode: "direktori" | "manual"
    const [supplierMode, setSupplierMode] = useState("direktori");
    const [searchSupplier, setSearchSupplier] = useState("");

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchBrands();
        fetchSuppliers();

        if (isEdit) {
            api
                .get("/sparepart")
                .then((res) => {
                    const sp = res.data.find((s) => s.id === Number(id));
                    if (sp) {
                        setForm({ 
                            brand_id: sp.brand_id ? String(sp.brand_id) : "", 
                            supplier_id: sp.supplier_id ? String(sp.supplier_id) : "",
                            nama: sp.nama, 
                            kategori: sp.kategori || "Umum", 
                            stok: String(sp.stok), 
                            harga: String(sp.harga),
                            harga_beli: sp.harga_beli ? String(sp.harga_beli) : "",
                            has_garansi_distri: sp.has_garansi_distri !== false,
                            tipe_garansi_distri: sp.tipe_garansi_distri || "1 Tahun",
                            sistem_perhitungan_garansi: sp.sistem_perhitungan_garansi || "sejak_nota_customer",
                            distributor_nama: sp.distributor_nama || (sp.supplier?.nama || ""),
                            distributor_kontak: sp.distributor_kontak || "",
                            kebijakan_klaim: sp.kebijakan_klaim || "",
                            supplier_nama: sp.distributor_nama || (sp.supplier?.nama || ""),
                            nomor_faktur: "",
                            tanggal_beli: new Date().toISOString().split("T")[0],
                            catatan: ""
                        });

                        if (!sp.supplier_id && sp.distributor_nama) {
                            setSupplierMode("manual");
                        }
                    } else {
                        toast.error("Sparepart tidak ditemukan");
                        navigate("/sparepart");
                    }
                })
                .catch(() => toast.error("Gagal memuat data suku cadang"))
                .finally(() => setFetching(false));
        } else {
            setFetching(false);
        }
    }, [id, isEdit, navigate]);

    async function fetchBrands() {
        try {
            const res = await api.get("/brand");
            setBrands(res.data || []);
        } catch (err) {
            console.error("Gagal memuat brand", err);
        }
    }

    async function fetchSuppliers() {
        try {
            const res = await api.get("/supplier");
            setSuppliers(res.data?.data || []);
        } catch (err) {
            console.warn("Gagal memuat supplier:", err);
        }
    }

    // Handle outside click for brand dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.brand-dropdown-container')) {
                setIsBrandDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Select Supplier from Directory
    const handleSelectSupplier = (supplier) => {
        if (!supplier) {
            setForm(prev => ({
                ...prev,
                supplier_id: "",
                distributor_nama: "",
                distributor_kontak: "",
                kebijakan_klaim: "",
                supplier_nama: ""
            }));
            return;
        }

        const kontakStr = [
            supplier.telepon, 
            supplier.kontak_person ? `(PIC: ${supplier.kontak_person})` : null, 
            supplier.alamat ? `- ${supplier.alamat}` : null
        ].filter(Boolean).join(" ");

        setForm(prev => ({
            ...prev,
            supplier_id: String(supplier.id),
            distributor_nama: supplier.nama,
            distributor_kontak: kontakStr,
            kebijakan_klaim: supplier.kebijakan_klaim || prev.kebijakan_klaim || "Box & kemasan asli wajib ada, segel distributor utuh, tidak ada cacat fisik/terbakar.",
            supplier_nama: supplier.nama
        }));

        toast.success(`Distributor ${supplier.nama} dipilih! Data terisi otomatis.`);
    };

    // Tambah Brand Baru
    async function handleAddBrand(e) {
        e.preventDefault();
        if (!newBrandName.trim()) return;
        
        const existingSimilar = brands.find(b => b.nama.toLowerCase().replace(/\s+/g, '') === newBrandName.toLowerCase().replace(/\s+/g, ''));
        if (existingSimilar) {
            toast.error(`Merek serupa sudah ada: ${existingSimilar.nama}. Silakan gunakan yang ada.`);
            return;
        }

        setIsAddingBrand(true);
        try {
            const res = await api.post("/brand", { nama: newBrandName.trim() });
            const newBrand = res.data.data;
            setBrands([...brands, newBrand].sort((a, b) => a.nama.localeCompare(b.nama)));
            setForm({ ...form, brand_id: String(newBrand.id) });
            setIsAddBrandModalOpen(false);
            setNewBrandName("");
            setSearchBrand("");
            toast.success("Merek berhasil ditambahkan");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menambahkan merek");
        } finally {
            setIsAddingBrand(false);
        }
    }

    // Profit & Margin Calculations
    const hppNum = Number(form.harga_beli) || 0;
    const hargaJualNum = Number(form.harga) || 0;
    const labaKotor = hargaJualNum - hppNum;
    const marginPersen = hargaJualNum > 0 ? Math.round((labaKotor / hargaJualNum) * 100) : 0;
    const markupPersen = hppNum > 0 ? Math.round((labaKotor / hppNum) * 100) : 0;

    // Apply Quick Markup Preset
    const applyMarkupPreset = (percentage) => {
        if (!hppNum || hppNum <= 0) {
            toast.error("Masukkan Harga Modal (HPP) terlebih dahulu!");
            return;
        }
        const newHarga = Math.round(hppNum * (1 + percentage / 100));
        setForm(prev => ({ ...prev, harga: String(newHarga) }));
        toast.success(`Harga jual diatur +${percentage}% (${formatRupiah(newHarga)})`);
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.brand_id) {
            toast.error("Merek (Brand) wajib dipilih!");
            return;
        }

        if (!form.nama.trim()) {
            toast.error("Nama Produk suku cadang wajib diisi!");
            return;
        }

        if (!form.harga || Number(form.harga) <= 0) {
            toast.error("Harga jual harus lebih besar dari Rp 0!");
            return;
        }

        const selectedBrand = brands.find(b => String(b.id) === String(form.brand_id));
        if (selectedBrand) {
            const regex = new RegExp(`^${selectedBrand.nama}\\s+`, "i");
            if (regex.test(form.nama)) {
                toast.error(`Nama Produk tidak boleh diawali dengan nama merek "${selectedBrand.nama}".`);
                setForm(prev => ({ ...prev, nama: prev.nama.replace(regex, "") }));
                return;
            }
        }

        setLoading(true);

        const payload = {
            ...form,
            brand_id: Number(form.brand_id),
            supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
            stok: Number(form.stok) || 0,
            harga: Number(form.harga) || 0,
            harga_beli: form.harga_beli ? Number(form.harga_beli) : undefined,
            has_garansi_distri: Boolean(form.has_garansi_distri),
            sistem_perhitungan_garansi: form.has_garansi_distri ? form.sistem_perhitungan_garansi : "tidak_ada",
            tipe_garansi_distri: form.has_garansi_distri ? form.tipe_garansi_distri : null
        };

        try {
            if (isEdit) {
                await api.put(`/sparepart/${id}`, payload);
                toast.success("Data suku cadang berhasil diperbarui!");
            } else {
                await api.post("/sparepart", payload);
                toast.success("Suku cadang baru berhasil disimpan ke inventaris!");
            }
            navigate("/sparepart");
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan");
        } finally {
            setLoading(false);
        }
    }

    // Filtered Suppliers for Directory Picker
    const filteredSuppliers = suppliers.filter(s => {
        const q = searchSupplier.toLowerCase();
        return s.nama.toLowerCase().includes(q) || 
               (s.kategori && s.kategori.toLowerCase().includes(q)) ||
               (s.alamat && s.alamat.toLowerCase().includes(q));
    });

    const activeSupplierObj = suppliers.find(s => String(s.id) === String(form.supplier_id));

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <div className="animate-spin rounded-full h-9 w-9 border-3 border-blue-600 border-t-transparent"></div>
                <p className="text-xs font-semibold text-slate-500">Memuat data suku cadang & direktori supplier...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-14">
            
            {/* TOP BAR / BREADCRUMB */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <button
                        type="button"
                        onClick={() => navigate("/sparepart")}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Kembali ke Katalog"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                {isEdit ? "Edit Suku Cadang" : "Tambah Suku Cadang Baru"}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {isEdit ? `ID #${id}` : "Inventaris Baru"}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Pencatatan spesifikasi komponen, harga modal & jual, manajemen asal supplier/distributor, serta skenario garansi resmi.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => setIsQrModalOpen(true)}
                            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Cetak Stiker Label & QR Code Part"
                        >
                            <QrCode className="w-4 h-4 text-blue-600" />
                            <span className="hidden sm:inline">Cetak Label QR</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate("/sparepart")}
                        className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Suku Cadang"}</span>
                    </button>
                </div>
            </div>

            {/* MAIN 12-COLUMN EDGE-TO-EDGE FORM GRID */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ======================================================== */}
                {/* LEFT COLUMN: IDENTITAS & ASAL SUPPLIER & GARANSI (8 COLS) */}
                {/* ======================================================== */}
                <div className="lg:col-span-8 space-y-6">

                    {/* CARD 1: IDENTITAS PRODUK & MEREK */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    1
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Identitas Produk & Spesifikasi Suku Cadang
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Pilih merek resmi dan nama produk komponen yang terdaftar
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Brand Selector Dropdown */}
                            <div className="brand-dropdown-container relative">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Merek / Brand <span className="text-rose-500">*</span></span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddBrandModalOpen(true)}
                                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                                    >
                                        <Plus className="w-3 h-3" />
                                        <span>Brand Baru</span>
                                    </button>
                                </label>
                                <div 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs sm:text-sm font-semibold"
                                    onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                                >
                                    <span className={form.brand_id ? "text-slate-900" : "text-slate-400 font-normal"}>
                                        {form.brand_id ? brands.find(b => String(b.id) === String(form.brand_id))?.nama : "-- Pilih Merek Komponen --"}
                                    </span>
                                    <div className="text-slate-400 text-xs">▼</div>
                                </div>

                                {isBrandDropdownOpen && (
                                    <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                                        <div className="p-2 border-b border-slate-100 relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Cari merek..." 
                                                value={searchBrand}
                                                onChange={e => setSearchBrand(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-52 overflow-y-auto">
                                            {brands.filter(b => b.nama.toLowerCase().includes(searchBrand.toLowerCase())).map(b => (
                                                <div 
                                                    key={b.id} 
                                                    className={`px-4 py-2.5 hover:bg-blue-50/60 cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-between ${
                                                        String(b.id) === String(form.brand_id) ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700"
                                                    }`}
                                                    onClick={() => {
                                                        setForm({ ...form, brand_id: String(b.id) });
                                                        setIsBrandDropdownOpen(false);
                                                        setSearchBrand("");
                                                    }}
                                                >
                                                    <span>{b.nama}</span>
                                                    {String(b.id) === String(form.brand_id) && <Check className="w-4 h-4 text-blue-600" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Nama Produk */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Nama / Model Produk <span className="text-rose-500">*</span></span>
                                </label>
                                <input
                                    type="text"
                                    value={form.nama}
                                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder="Contoh: FURY Beast DDR4 16GB 3200MHz"
                                    required
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Jangan ulangi nama merek di kolom ini (cukup seri/model).</p>
                            </div>

                            {/* Kompatibilitas Perangkat */}
                            <div className="sm:col-span-2 pt-2">
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    Kompatibilitas Perangkat:
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {KOMPATIBILITAS_OPTIONS.map((cat) => {
                                        const isChecked = (form.kategori || "").split(",").map(c => c.trim()).includes(cat);
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => {
                                                    let current = (form.kategori || "").split(",").map(c => c.trim()).filter(Boolean);
                                                    if (cat === "Umum") {
                                                        current = isChecked ? [] : ["Umum"];
                                                    } else {
                                                        if (isChecked) {
                                                            current = current.filter(c => c !== cat);
                                                        } else {
                                                            current.push(cat);
                                                            current = current.filter(c => c !== "Umum");
                                                        }
                                                    }
                                                    if (current.length === 0) current = ["Umum"];
                                                    setForm({ ...form, kategori: current.join(", ") });
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    isChecked
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                <span>{cat}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: ASAL PENGADAAN & DIREKTORI SUPPLIER / TOKO */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    2
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span>Asal-Usul Pengadaan & Mitra Distributor</span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                            Direktori Supplier
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Pilih mitra distributor terdaftar untuk autofill syarat klaim garansi & kontak retur
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsAddSupplierModalOpen(true)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Daftarkan Mitra Baru</span>
                            </button>
                        </div>

                        {/* Mode Tabs: Dari Direktori vs Pembelian Lepas */}
                        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/80 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setSupplierMode("direktori")}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    supplierMode === "direktori"
                                        ? "bg-white text-blue-600 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Building2 className="w-4 h-4" />
                                <span>Pilih dari Direktori Mitra ({suppliers.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSupplierMode("manual");
                                    setForm(prev => ({ ...prev, supplier_id: "" }));
                                }}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    supplierMode === "manual"
                                        ? "bg-white text-blue-600 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>Pembelian Lepas / Non-Direktori</span>
                            </button>
                        </div>

                        {/* MODE 1: DIREKTORI MITRA SUPPLIER */}
                        {supplierMode === "direktori" && (
                            <div className="space-y-4 animate-fade-in">
                                
                                {/* Search filter */}
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama distributor, kategori (Resmi/Paralel), atau kota..."
                                        value={searchSupplier}
                                        onChange={(e) => setSearchSupplier(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {searchSupplier && (
                                        <button 
                                            type="button"
                                            onClick={() => setSearchSupplier("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Active Selection Card Indicator if picked */}
                                {activeSupplierObj && (
                                    <div className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-500 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-900">{activeSupplierObj.nama}</span>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                                        {activeSupplierObj.kategori || "Distributor"}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    {activeSupplierObj.kontak_person && (
                                                        <span>PIC: {activeSupplierObj.kontak_person}</span>
                                                    )}
                                                    {activeSupplierObj.telepon && (
                                                        <span className="font-mono text-blue-700 font-semibold">{activeSupplierObj.telepon}</span>
                                                    )}
                                                    {activeSupplierObj.alamat && (
                                                        <span className="text-slate-500 line-clamp-1">{activeSupplierObj.alamat}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectSupplier(null)}
                                            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                                        >
                                            Ganti / Batal Pilih
                                        </button>
                                    </div>
                                )}

                                {/* Supplier Cards Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                                    {filteredSuppliers.map((sup) => {
                                        const isSelected = String(sup.id) === String(form.supplier_id);
                                        return (
                                            <div
                                                key={sup.id}
                                                onClick={() => handleSelectSupplier(sup)}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-2.5 ${
                                                    isSelected
                                                        ? "bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/70"
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-1.5 mb-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                                            sup.kategori === "Distributor Resmi"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : sup.kategori?.includes("Paralel")
                                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                : "bg-slate-100 text-slate-700 border-slate-200"
                                                        }`}>
                                                            {sup.kategori || "Distributor"}
                                                        </span>
                                                        {isSelected && (
                                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                                        {sup.nama}
                                                    </h4>

                                                    {sup.kontak_person && (
                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                            PIC: <span className="font-semibold text-slate-700">{sup.kontak_person}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                                    {sup.telepon ? (
                                                        <span className="font-mono text-slate-600 flex items-center gap-1">
                                                            <Phone className="w-3 h-3 text-emerald-600" />
                                                            {sup.telepon}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">No phone</span>
                                                    )}

                                                    {sup.link_toko && (
                                                        <a 
                                                            href={sup.link_toko} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-blue-600 hover:underline flex items-center gap-0.5 font-semibold text-[10px]"
                                                        >
                                                            <span>Portal/Web</span>
                                                            <ExternalLink className="w-2.5 h-2.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* MODE 2: PEMBELIAN LEPAS / MANUAL */}
                        {supplierMode === "manual" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Nama Toko / Distributor Lepas</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Misal: Toko Berkah Glodok / Pasar Komputer"
                                        value={form.distributor_nama}
                                        onChange={(e) => setForm({ ...form, distributor_nama: e.target.value, supplier_nama: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Kontak Telepon / WhatsApp Toko</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Misal: 0812-9988-7711"
                                        value={form.distributor_kontak}
                                        onChange={(e) => setForm({ ...form, distributor_kontak: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CARD 3: STATUS GARANSI & SKENARIO PERHITUNGAN DISTRIBUTOR */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    3
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                                        <span>Status Garansi & Skenario Perhitungan Distributor</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Atur apakah komponen memiliki garansi resmi dan bagaimana sistem mulai menghitung masa berlakunya
                                    </p>
                                </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input 
                                    type="checkbox" 
                                    checked={form.has_garansi_distri}
                                    onChange={(e) => setForm({ 
                                        ...form, 
                                        has_garansi_distri: e.target.checked,
                                        sistem_perhitungan_garansi: e.target.checked ? (form.sistem_perhitungan_garansi || "sejak_nota_customer") : "tidak_ada"
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-2.5 text-xs font-bold text-slate-800">
                                    {form.has_garansi_distri ? "Garansi Aktif" : "Non-Garansi (Part Pasif)"}
                                </span>
                            </label>
                        </div>

                        {form.has_garansi_distri && (
                            <div className="space-y-5 animate-fade-in">
                                
                                {/* Durasi Garansi Pills */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">
                                        Durasi Garansi Distributor:
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: "⭐ Lifetime Warranty", value: "Lifetime" },
                                            { label: "5 Tahun", value: "5 Tahun" },
                                            { label: "3 Tahun", value: "3 Tahun" },
                                            { label: "2 Tahun", value: "2 Tahun" },
                                            { label: "1 Tahun", value: "1 Tahun" },
                                            { label: "6 Bulan", value: "6 Bulan" },
                                            { label: "3 Bulan", value: "3 Bulan" },
                                            { label: "1 Bulan", value: "1 Bulan" },
                                            { label: "14 Hari (Tes)", value: "14 Hari" },
                                            { label: "7 Hari (Tes)", value: "7 Hari" }
                                        ].map((dur) => {
                                            const isSelected = form.tipe_garansi_distri === dur.value;
                                            return (
                                                <button
                                                    key={dur.value}
                                                    type="button"
                                                    onClick={() => {
                                                        const newPolicy = dur.value === "Lifetime" ? "lifetime" : (form.sistem_perhitungan_garansi === "lifetime" ? "sejak_nota_customer" : form.sistem_perhitungan_garansi);
                                                        setForm({ 
                                                            ...form, 
                                                            tipe_garansi_distri: dur.value,
                                                            sistem_perhitungan_garansi: newPolicy
                                                        });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                                >
                                                    {dur.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3 Skenario Perhitungan Garansi (Cards) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">
                                        Skenario Awal Perhitungan Garansi:
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        
                                        {/* Skenario 1: Sejak Nota Customer */}
                                        <div
                                            onClick={() => setForm({ ...form, sistem_perhitungan_garansi: "sejak_nota_customer" })}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                                                form.sistem_perhitungan_garansi === "sejak_nota_customer"
                                                    ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Authorized / Resmi
                                                    </span>
                                                    {form.sistem_perhitungan_garansi === "sejak_nota_customer" && (
                                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                                                    Sejak Nota End-User
                                                </h5>
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    Hari pertama (Day 1) dihitung sejak toko mencetak nota penjualan/servis ke pelanggan. Sesuai perlindungan konsumen & distributor resmi.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Skenario 2: Sejak Segel Distri */}
                                        <div
                                            onClick={() => setForm({ ...form, sistem_perhitungan_garansi: "sejak_segel_distri" })}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                                                form.sistem_perhitungan_garansi === "sejak_segel_distri"
                                                    ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                                        Distri Independen / Grosir
                                                    </span>
                                                    {form.sistem_perhitungan_garansi === "sejak_segel_distri" && (
                                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                                                    Sejak Segel Distributor
                                                </h5>
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    Garansi sudah berjalan sejak distributor menempelkan stiker segel (saat keluar dari gudang). Jika lama di rak toko, masa garansi sisa ke end-user terpotong.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Skenario 3: Lifetime Warranty */}
                                        <div
                                            onClick={() => setForm({ ...form, sistem_perhitungan_garansi: "lifetime", tipe_garansi_distri: "Lifetime" })}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                                                form.sistem_perhitungan_garansi === "lifetime"
                                                    ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-blue-600" />
                                                        <span>Bantu Klaim Toko</span>
                                                    </span>
                                                    {form.sistem_perhitungan_garansi === "lifetime" && (
                                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                                                    Garansi Seumur Hidup
                                                </h5>
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    Untuk RAM/Memori kit. Toko berkomitmen menjembatani proses klaim ke vendor resmi di kemudian hari selama stiker segel utuh.
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Syarat Khusus Klaim */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Ketentuan & Syarat Khusus Klaim Distributor</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Misal: Wajib bawa kemasan blister/dus asli, stiker segel distributor tidak sobek, tidak ada bekas terbakar/short"
                                        value={form.kebijakan_klaim}
                                        onChange={(e) => setForm({ ...form, kebijakan_klaim: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                            </div>
                        )}
                    </div>

                </div>

                {/* ======================================================== */}
                {/* RIGHT COLUMN: FINANSIAL, STOK & AUDIT PENGADAAN (4 COLS) */}
                {/* ======================================================== */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* CARD 4: FINANSIAL & KALKULATOR MARGIN LABA */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                <span>Finansial & Margin Laba</span>
                            </h3>
                            <span className="text-[11px] font-bold text-slate-500 font-mono">
                                HPP vs Jual
                            </span>
                        </div>

                        {/* Input Harga Modal (HPP) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                <span>Harga Modal / Beli (HPP)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">Rp</span>
                                <input
                                    type="number"
                                    value={form.harga_beli}
                                    onChange={(e) => setForm({ ...form, harga_beli: e.target.value })}
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: 250000"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Input Harga Jual */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                <span>Harga Jual ke Pelanggan <span className="text-rose-500">*</span></span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 font-mono">Rp</span>
                                <input
                                    type="number"
                                    value={form.harga}
                                    onChange={(e) => setForm({ ...form, harga: e.target.value })}
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: 350000"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Quick Markup Presets */}
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                                1-Klik Preset Margin Keuntungan:
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[
                                    { label: "+20%", val: 20 },
                                    { label: "+30%", val: 30 },
                                    { label: "+50%", val: 50 },
                                    { label: "+100%", val: 100 }
                                ].map((p) => (
                                    <button
                                        key={p.val}
                                        type="button"
                                        onClick={() => applyMarkupPreset(p.val)}
                                        className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live Margin Indicator Banner */}
                        {hargaJualNum > 0 && (
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Laba Bersih per Unit:</span>
                                    <span className={`font-bold font-mono ${labaKotor >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                        {formatRupiah(labaKotor)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Profit Margin:</span>
                                    <span className="font-bold text-blue-700 font-mono">
                                        {marginPersen}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Markup Rate:</span>
                                    <span className="font-bold text-slate-800 font-mono">
                                        {markupPersen}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CARD 5: JUMLAH STOK FISIK & AUDIT PENGADAAN */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-blue-600" />
                                <span>Stok Fisik & Logistik</span>
                            </h3>
                            <span className="text-[11px] font-bold text-slate-500">
                                Gudang Workshop
                            </span>
                        </div>

                        {/* Stok Awal */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                <span>Jumlah Stok Fisik <span className="text-rose-500">*</span></span>
                            </label>
                            <input
                                type="number"
                                value={form.stok}
                                onChange={(e) => setForm({ ...form, stok: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Contoh: 15"
                                min="0"
                                required
                            />
                        </div>

                        {!isEdit && (
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Nomor Faktur / Nota Beli (Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: INV-SMI-2026-001"
                                        value={form.nomor_faktur}
                                        onChange={(e) => setForm({ ...form, nomor_faktur: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Tanggal Pembelian</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={form.tanggal_beli}
                                        onChange={(e) => setForm({ ...form, tanggal_beli: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Catatan Logistik
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Catatan batch pengadaan stok baru..."
                                        value={form.catatan}
                                        onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CARD 6: RINGKASAN & ACTION */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Ringkasan Nilai Aset
                        </h4>

                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Total Modal Disimpan:</span>
                                <span className="font-bold font-mono text-slate-900">
                                    {formatRupiah((Number(form.stok) || 0) * hppNum)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Potensi Nilai Jual:</span>
                                <span className="font-bold font-mono text-emerald-700">
                                    {formatRupiah((Number(form.stok) || 0) * hargaJualNum)}
                                </span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{loading ? "Menyimpan Data..." : isEdit ? "Perbarui Suku Cadang" : "Simpan Suku Cadang"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/sparepart")}
                                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                        </div>
                    </div>

                </div>

            </form>

            {/* MODAL 1: TAMBAH BRAND BARU */}
            {isAddBrandModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Tambah Merek Baru</h3>
                            <button 
                                type="button" 
                                onClick={() => setIsAddBrandModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddBrand} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Merek / Brand</label>
                                <input
                                    type="text"
                                    value={newBrandName}
                                    onChange={(e) => setNewBrandName(e.target.value)}
                                    placeholder="Contoh: Kingston / Samsung / Corsair"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddBrandModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                                    disabled={isAddingBrand}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingBrand || !newBrandName.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    {isAddingBrand ? "Menyimpan..." : "Simpan Merek"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: DAFTARKAN SUPPLIER BARU SECARA INLINE */}
            <SupplierModal
                isOpen={isAddSupplierModalOpen}
                onClose={() => setIsAddSupplierModalOpen(false)}
                supplierToEdit={null}
                onSuccess={async () => {
                    await fetchSuppliers();
                    toast.success("Mitra supplier baru siap dipilih di katalog!");
                }}
            />

            {/* MODAL 3: CETAK LABEL STIKER & QR CODE */}
            {isEdit && (
                <SparepartQrModal
                    isOpen={isQrModalOpen}
                    onClose={() => setIsQrModalOpen(false)}
                    sparepart={{
                        ...form,
                        id: Number(id),
                        brand: brands.find(b => String(b.id) === String(form.brand_id)),
                        supplier: suppliers.find(s => String(s.id) === String(form.supplier_id))
                    }}
                />
            )}

        </div>
    );
}
