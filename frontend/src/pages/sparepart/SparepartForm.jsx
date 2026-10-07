import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, Package, Hash, DollarSign, Layers, CheckCircle2, XCircle, Search, Plus } from "lucide-react";

export default function SparepartForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({ brand_id: "", nama: "", kategori: "Umum", stok: "", harga: "" });
    const [brands, setBrands] = useState([]);
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

        if (isEdit) {
            api
                .get("/sparepart")
                .then((res) => {
                    const sp = res.data.find((s) => s.id === Number(id));
                    if (sp) {
                        setForm({ 
                            brand_id: sp.brand_id ? String(sp.brand_id) : "", 
                            nama: sp.nama, 
                            kategori: sp.kategori || "Umum", 
                            stok: String(sp.stok), 
                            harga: String(sp.harga) 
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

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            Harga (Rp) <span className="text-red-500">*</span>
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
                    </div>
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
