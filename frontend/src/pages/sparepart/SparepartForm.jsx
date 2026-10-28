import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, Package, Hash, DollarSign, Layers, CheckCircle2, XCircle, Search, Plus, Building2, FileText, ShieldCheck, HelpCircle, Clock, Sparkles, Check } from "lucide-react";

export default function SparepartForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({ 
        brand_id: "", 
        supplier_id: "",
        nama: "", 
        kategori: "Umum", 
        stok: "", 
        harga: "", 
        harga_beli: "",
        has_garansi_distri: false,
        tipe_garansi_distri: "1 Tahun",
        sistem_perhitungan_garansi: "sejak_nota_customer",
        distributor_nama: "",
        distributor_kontak: "",
        kebijakan_klaim: "",
        supplier_nama: "",
        nomor_faktur: "",
        catatan: ""
    });
    const [brands, setBrands] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [searchBrand, setSearchBrand] = useState("");
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
    
    // Add brand modal
    const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
    const [newBrandName, setNewBrandName] = useState("");
    const [isAddingBrand, setIsAddingBrand] = useState(false);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        // Fetch brands
        api.get("/brand")
            .then(res => setBrands(res.data))
            .catch(() => toast.error("Gagal memuat daftar merek"));

        // Fetch suppliers
        api.get("/supplier")
            .then(res => setSuppliers(res.data?.data || []))
            .catch(() => console.warn("Belum ada data supplier"));

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
                            has_garansi_distri: sp.has_garansi_distri || false,
                            tipe_garansi_distri: sp.tipe_garansi_distri || "1 Tahun",
                            sistem_perhitungan_garansi: sp.sistem_perhitungan_garansi || "sejak_nota_customer",
                            distributor_nama: sp.distributor_nama || "",
                            distributor_kontak: sp.distributor_kontak || "",
                            kebijakan_klaim: sp.kebijakan_klaim || "",
                            supplier_nama: sp.distributor_nama || "",
                            nomor_faktur: "",
                            catatan: ""
                        });
                    } else {
                        toast.error("Sparepart tidak ditemukan");
                        navigate("/sparepart");
                    }
                })
                .catch(() => toast.error("Gagal memuat data"))
                .finally(() => setFetching(false));
        } else {
            setFetching(false);
        }
    }, [id, isEdit, navigate]);

    // Handle outside click for dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.brand-dropdown-container')) {
                setIsBrandDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleAddBrand(e) {
        e.preventDefault();
        if (!newBrandName.trim()) return;
        
        // Prevent duplicate if similar
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

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.brand_id) {
            toast.error("Merek (Brand) wajib dipilih!");
            return;
        }

        const selectedBrand = brands.find(b => String(b.id) === String(form.brand_id));
        if (selectedBrand) {
            const regex = new RegExp(`^${selectedBrand.nama}\\s+`, "i");
            if (regex.test(form.nama)) {
                toast.error(`Nama Produk tidak boleh mengandung awalan merek "${selectedBrand.nama}".`);
                // Auto-correct suggestion
                setForm(prev => ({ ...prev, nama: prev.nama.replace(regex, "") }));
                return;
            }
        }

        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/sparepart/${id}`, form);
            } else {
                await api.post("/sparepart", form);
            }
            navigate("/sparepart");
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
                    onClick={() => navigate("/sparepart")}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEdit ? "Edit Suku Cadang" : "Tambah Suku Cadang"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isEdit ? "Perbarui informasi dan stok suku cadang" : "Masukkan suku cadang baru ke dalam inventaris"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Brand Selection Dropdown */}
                    <div className="md:col-span-1 brand-dropdown-container relative">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-400" />
                            Merek (Brand) <span className="text-red-500">*</span>
                        </label>
                        <div 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between"
                            onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                        >
                            <span className={form.brand_id ? "text-slate-900" : "text-slate-400"}>
                                {form.brand_id ? brands.find(b => String(b.id) === String(form.brand_id))?.nama : "Pilih Merek"}
                            </span>
                            <div className="text-slate-400">▼</div>
                        </div>

                        {isBrandDropdownOpen && (
                            <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                <div className="p-2 border-b border-slate-100 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari merek..." 
                                        value={searchBrand}
                                        onChange={e => setSearchBrand(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {brands.filter(b => b.nama.toLowerCase().includes(searchBrand.toLowerCase())).map(b => (
                                        <div 
                                            key={b.id} 
                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors"
                                            onClick={() => {
                                                setForm({ ...form, brand_id: String(b.id) });
                                                setIsBrandDropdownOpen(false);
                                                setSearchBrand("");
                                            }}
                                        >
                                            {b.nama}
                                        </div>
                                    ))}
                                </div>
                                {searchBrand && !brands.find(b => b.nama.toLowerCase() === searchBrand.toLowerCase()) ? (
                                    <div 
                                        className="p-3 border-t border-slate-100 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setNewBrandName(searchBrand);
                                            setIsBrandDropdownOpen(false);
                                            setIsAddBrandModalOpen(true);
                                        }}
                                    >
                                        <div className="flex items-center gap-2 text-sm text-blue-700 font-semibold">
                                            <Plus className="w-4 h-4" />
                                            Tambah Merek "{searchBrand}"
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="p-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setNewBrandName("");
                                            setIsBrandDropdownOpen(false);
                                            setIsAddBrandModalOpen(true);
                                        }}
                                    >
                                        <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                                            <Plus className="w-4 h-4" />
                                            Tambah Merek Baru
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            Nama Produk <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.nama}
                            onChange={(e) => setForm({ ...form, nama: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="Contoh: A400 240GB SATA"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-400" />
                            Kompabilitas Perangkat <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {["Laptop", "Desktop", "Printer", "Aksesoris", "Lainnya", "Umum"].map((cat) => {
                                const isChecked = (form.kategori || "").split(",").map(c => c.trim()).includes(cat);
                                return (
                                    <label
                                        key={cat}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-all flex items-center gap-2 ${
                                            isChecked
                                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isChecked}
                                            onChange={() => {
                                                let current = (form.kategori || "").split(",").map(c => c.trim()).filter(c => c);
                                                
                                                if (cat === "Umum") {
                                                    if (!isChecked) {
                                                        // Jika memilih Umum, hapus yang lain
                                                        current = ["Umum"];
                                                    } else {
                                                        // Tidak bisa uncheck Umum jika tidak ada pilihan lain, tapi kalau dipaksa
                                                        current = [];
                                                    }
                                                } else {
                                                    if (isChecked) {
                                                        current = current.filter(c => c !== cat);
                                                    } else {
                                                        current.push(cat);
                                                        // Jika memilih spesifik, hapus Umum
                                                        current = current.filter(c => c !== "Umum");
                                                    }
                                                }

                                                // Default to Umum if empty
                                                if (current.length === 0) current = ["Umum"];
                                                
                                                setForm({ ...form, kategori: current.join(", ") });
                                            }}
                                        />
                                        {cat}
                                    </label>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Pilih satu atau lebih kategori perangkat yang kompatibel dengan suku cadang ini.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-slate-400" />
                            Jumlah Stok <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={form.stok}
                            onChange={(e) => setForm({ ...form, stok: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="Contoh: 10"
                            min="0"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-slate-400" />
                                Harga Modal / Beli (HPP) (Rp)
                            </label>
                            <input
                                type="number"
                                value={form.harga_beli}
                                onChange={(e) => setForm({ ...form, harga_beli: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                                placeholder="Contoh: 100000"
                                min="0"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Harga pokok perolehan dari supplier untuk audit margin.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                Harga Jual (Rp) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={form.harga}
                                onChange={(e) => setForm({ ...form, harga: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                                placeholder="Contoh: 150000"
                                min="0"
                                required
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Harga yang dibebankan ke invoice pelanggan.</p>
                        </div>
                    </div>

                    {/* Fitur Garansi Distributor & Skenario Perhitungan */}
                    <div className="pt-5 border-t border-slate-100">
                        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                                        <span>Status & Kebijakan Garansi Distributor</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Catat apakah suku cadang ini memiliki garansi supplier/distributor resmi dan metode perhitungannya.
                                    </p>
                                </div>

                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={form.has_garansi_distri}
                                        onChange={(e) => setForm({ 
                                            ...form, 
                                            has_garansi_distri: e.target.checked,
                                            // default calculation policy when enabled
                                            sistem_perhitungan_garansi: e.target.checked ? (form.sistem_perhitungan_garansi || "sejak_nota_customer") : "tidak_ada"
                                        })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-2.5 text-xs font-bold text-slate-700">
                                        {form.has_garansi_distri ? "Ada Garansi Distri" : "Non-Garansi Distri"}
                                    </span>
                                </label>
                            </div>

                            {form.has_garansi_distri && (
                                <div className="space-y-5 pt-3 border-t border-slate-200/60 animate-fade-in">
                                    
                                    {/* Pilihan Durasi Garansi */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">
                                            Durasi Masa Garansi Distributor:
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
                                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                        }`}
                                                    >
                                                        {dur.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Skenario Perhitungan Garansi */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">
                                            Skenario Awal Perhitungan Garansi Distributor:
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            
                                            {/* Skenario 1: Sejak Nota Customer */}
                                            <div
                                                onClick={() => setForm({ ...form, sistem_perhitungan_garansi: "sejak_nota_customer" })}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                    form.sistem_perhitungan_garansi === "sejak_nota_customer"
                                                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                                                        : "bg-white border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Authorized / Resmi
                                                    </span>
                                                    {form.sistem_perhitungan_garansi === "sejak_nota_customer" && (
                                                        <Check className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <h5 className="text-xs font-bold text-slate-900 mb-1">
                                                    Sejak Nota End-User
                                                </h5>
                                                <p className="text-[11px] text-slate-500 leading-snug">
                                                    Hari pertama (Day 1) dihitung sejak nota penjualan toko ke pelanggan. Sesuai standar hukum perlindungan konsumen & distributor resmi dengan grace period.
                                                </p>
                                            </div>

                                            {/* Skenario 2: Sejak Segel Distri */}
                                            <div
                                                onClick={() => setForm({ ...form, sistem_perhitungan_garansi: "sejak_segel_distri" })}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                    form.sistem_perhitungan_garansi === "sejak_segel_distri"
                                                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                                                        : "bg-white border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                        Distri Independen
                                                    </span>
                                                    {form.sistem_perhitungan_garansi === "sejak_segel_distri" && (
                                                        <Check className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <h5 className="text-xs font-bold text-slate-900 mb-1">
                                                    Sejak Segel Distributor
                                                </h5>
                                                <p className="text-[11px] text-slate-500 leading-snug">
                                                    Garansi sudah berjalan sejak stiker distributor ditempel (sejak toko terima barang). Jika mengendap di rak toko, masa garansi sisa ke end-user terpotong.
                                                </p>
                                            </div>

                                            {/* Skenario 3: Lifetime Warranty */}
                                            <div
                                                onClick={() => setForm({ ...form, sistem_perhitungan_garansi: "lifetime", tipe_garansi_distri: "Lifetime" })}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                    form.sistem_perhitungan_garansi === "lifetime"
                                                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                                                        : "bg-white border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-blue-600" />
                                                        <span>Bantu Klaim Toko</span>
                                                    </span>
                                                    {form.sistem_perhitungan_garansi === "lifetime" && (
                                                        <Check className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <h5 className="text-xs font-bold text-slate-900 mb-1">
                                                    Garansi Seumur Hidup
                                                </h5>
                                                <p className="text-[11px] text-slate-500 leading-snug">
                                                    Untuk RAM/Memori. Toko siap membantu proses klaim ke vendor resmi di kemudian hari selama segel utuh dan tipe produk masih didukung vendor.
                                                </p>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Info Distributor & Kontak */}
                                    <div className="space-y-4">
                                        {suppliers.length > 0 && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>Pilih dari Direktori Mitra Distributor Terdaftar</span>
                                                    </span>
                                                    <span className="text-[11px] text-blue-600 font-semibold">1-Klik Autofill Kontak & Syarat</span>
                                                </label>
                                                <select
                                                    value={form.supplier_id}
                                                    onChange={(e) => {
                                                        const sId = e.target.value;
                                                        if (!sId) {
                                                            setForm(prev => ({ ...prev, supplier_id: "" }));
                                                            return;
                                                        }
                                                        const selected = suppliers.find(s => String(s.id) === String(sId));
                                                        if (selected) {
                                                            const kontakStr = [selected.telepon, selected.kontak_person ? `(${selected.kontak_person})` : null, selected.alamat ? `- ${selected.alamat}` : null].filter(Boolean).join(" ");
                                                            setForm(prev => ({
                                                                ...prev,
                                                                supplier_id: String(selected.id),
                                                                distributor_nama: selected.nama,
                                                                distributor_kontak: kontakStr,
                                                                kebijakan_klaim: selected.kebijakan_klaim || prev.kebijakan_klaim
                                                            }));
                                                            toast.success(`Distributor ${selected.nama} dipilih! Data kontak & syarat terisi.`);
                                                        }
                                                    }}
                                                    className="w-full px-3.5 py-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">-- Pilih Distributor Terdaftar (atau ketik manual di bawah) --</option>
                                                    {suppliers.map(sup => (
                                                        <option key={sup.id} value={sup.id}>
                                                            {sup.nama} ({sup.kategori || "Distributor"})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>Nama Distributor / Toko</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: PT Astrindo / Synnex Metrodata / NJT / Toko LCD"
                                                    value={form.distributor_nama}
                                                    onChange={(e) => setForm({ ...form, distributor_nama: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-semibold"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>Kontak CS / Alamat RMA Distributor</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: 0812-9988-7766 / Harco Mangga Dua Lt. 4"
                                                    value={form.distributor_kontak}
                                                    onChange={(e) => setForm({ ...form, distributor_kontak: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                    Ketentuan / Syarat Klaim Distributor
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Box asli wajib disimpan, stiker segel utuh, tidak ada korosi/terbakar, toko bantu klaim gratis"
                                                    value={form.kebijakan_klaim}
                                                    onChange={(e) => setForm({ ...form, kebijakan_klaim: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>

                    {!isEdit && Number(form.stok) > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                        Audit Pengadaan Stok Awal (Opsional)
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Data ini akan otomatis dicatat ke riwayat log audit pengadaan suku cadang gudang.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Nama Supplier / Toko Distributor
                                        </label>
                                        <input
                                            type="text"
                                            value={form.supplier_nama}
                                            onChange={(e) => setForm({ ...form, supplier_nama: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Misal: PT Mandiri Sparepart / Toko Bandung"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Nomor Faktur / Invoice Pembelian
                                        </label>
                                        <input
                                            type="text"
                                            value={form.nomor_faktur}
                                            onChange={(e) => setForm({ ...form, nomor_faktur: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Misal: INV-SUP-2026-001"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Catatan Pengadaan
                                        </label>
                                        <input
                                            type="text"
                                            value={form.catatan}
                                            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Catatan tambahan mengenai pembelian atau batch ini"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate("/sparepart")}
                        className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto text-center"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{loading ? "Menyimpan..." : "Simpan Data"}</span>
                    </button>
                </div>
            </form>

            {/* Add Brand Modal */}
            {isAddBrandModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => !isAddingBrand && setIsAddBrandModalOpen(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 overflow-hidden">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Merek Baru</h3>
                        <form onSubmit={handleAddBrand}>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Merek</label>
                                <input
                                    type="text"
                                    value={newBrandName}
                                    onChange={(e) => setNewBrandName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddBrandModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                                    disabled={isAddingBrand}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingBrand || !newBrandName.trim()}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    {isAddingBrand ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
