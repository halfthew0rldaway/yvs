import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
    Building2, 
    Plus, 
    Search, 
    Phone, 
    Mail, 
    MapPin, 
    Globe, 
    ShieldCheck, 
    Edit3, 
    Trash2, 
    Package, 
    RotateCcw, 
    ExternalLink, 
    MessageCircle,
    User,
    CheckCircle2,
    Layers,
    Filter
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import SupplierModal from "./SupplierModal";
import ConfirmModal from "../../components/ConfirmModal";

export default function SupplierList() {
    const { isAdmin } = useAuth();

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [kategoriFilter, setKategoriFilter] = useState("all");

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/supplier", {
                params: {
                    search: searchQuery || undefined,
                    kategori: kategoriFilter !== "all" ? kategoriFilter : undefined
                }
            });
            setSuppliers(res.data?.data || []);
        } catch (err) {
            console.error("Gagal memuat supplier:", err);
            toast.error("Gagal memuat data distributor/supplier");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [searchQuery, kategoriFilter]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await api.delete(`/supplier/${deleteTarget.id}`);
            toast.success(res.data?.message || "Distributor berhasil dihapus");
            setDeleteTarget(null);
            fetchSuppliers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus distributor");
        }
    };

    // Calculate quick stats
    const totalSuppliers = suppliers.length;
    const resmiCount = suppliers.filter(s => s.kategori === "Distributor Resmi").length;
    const totalSparepartsLinked = suppliers.reduce((acc, curr) => acc + (curr._count?.spareparts || 0), 0);
    const totalRmaLinked = suppliers.reduce((acc, curr) => acc + (curr._count?.supplier_rma || 0), 0);

    return (
        <div className="w-full space-y-6 pb-12">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Direktori Supplier & Distributor
                            </h1>
                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                                {totalSuppliers} Mitra
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Pusat data distributor resmi, kontak meja klaim RMA, alamat service center & toko online
                        </p>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedSupplier(null);
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Distributor</span>
                    </button>
                )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-2xs font-semibold text-slate-400">Total Mitra Supplier</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{totalSuppliers}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">Terdaftar aktif di sistem</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-2xs font-semibold text-blue-600">Distributor Resmi (ATP)</div>
                    <div className="text-xl font-bold text-blue-700 mt-1">{resmiCount}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">Synnex, NJT, Astrindo, dll</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-2xs font-semibold text-emerald-600">Katalog Terhubung</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">{totalSparepartsLinked}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">Item sparepart terafiliasi</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-2xs font-semibold text-amber-600">Riwayat Klaim RMA</div>
                    <div className="text-xl font-bold text-amber-700 mt-1">{totalRmaLinked}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">Total retur garansi dicatat</div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                        type="text"
                        placeholder="Cari nama distributor, kontak PIC, telepon, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={kategoriFilter}
                        onChange={(e) => setKategoriFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="all">Semua Kategori Mitra</option>
                        <option value="Distributor Resmi">Distributor Resmi</option>
                        <option value="Distributor Paralel / Importir">Distributor Paralel</option>
                        <option value="Toko Online / Marketplace">Toko Online / Marketplace</option>
                        <option value="Supplier Komponen">Supplier Komponen</option>
                    </select>
                </div>
            </div>

            {/* Supplier Cards Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Memuat direktori distributor...</p>
                </div>
            ) : suppliers.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">Belum ada data distributor</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Tambahkan mitra distributor resmi atau toko supplier suku cadang untuk memudahkan pelacakan klaim garansi RMA.
                    </p>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSupplier(null);
                                setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Distributor Sekarang</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {suppliers.map((sup) => {
                        let cleanPhone = (sup.telepon || "").replace(/\D/g, "");
                        if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
                        else if (cleanPhone.startsWith("8")) cleanPhone = "62" + cleanPhone;

                        return (
                            <div 
                                key={sup.id}
                                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                            >
                                <div className="p-5 space-y-3.5">
                                    {/* Top Row: Category badge & Actions */}
                                    <div className="flex items-start justify-between gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-3xs font-bold border ${
                                            sup.kategori === "Distributor Resmi"
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : sup.kategori === "Toko Online / Marketplace"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-slate-100 text-slate-700 border-slate-200"
                                        }`}>
                                            {sup.kategori || "Distributor"}
                                        </span>

                                        {isAdmin && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSupplier(sup);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Data Distributor"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(sup)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Hapus Distributor"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Supplier Title */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {sup.nama}
                                        </h3>
                                        {sup.kontak_person && (
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span>{sup.kontak_person}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Contact Details */}
                                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                                        {sup.telepon && (
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    <span className="font-mono text-slate-700 truncate">{sup.telepon}</span>
                                                </div>
                                                {cleanPhone && (
                                                    <a
                                                        href={`https://wa.me/${cleanPhone}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-2xs font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        <MessageCircle className="w-3 h-3" />
                                                        <span>WA</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {sup.email && (
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{sup.email}</span>
                                            </div>
                                        )}

                                        {sup.alamat && (
                                            <div className="flex items-start gap-1.5 text-2xs text-slate-500 leading-relaxed pt-0.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{sup.alamat}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Kebijakan Retur & RMA */}
                                    {sup.kebijakan_klaim && (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-2xs space-y-1">
                                            <div className="flex items-center gap-1 font-bold text-slate-700">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Kebijakan Garansi / Prosedur Retur:</span>
                                            </div>
                                            <p className="text-slate-600 line-clamp-3 leading-relaxed">
                                                {sup.kebijakan_klaim}
                                            </p>
                                        </div>
                                    )}

                                </div>

                                {/* Card Footer: Stats & Link */}
                                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3 text-slate-500 font-medium">
                                        <span className="flex items-center gap-1" title="Jumlah sparepart yang disuplai">
                                            <Package className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{sup._count?.spareparts || 0} part</span>
                                        </span>
                                        <span className="flex items-center gap-1" title="Jumlah klaim RMA yang diajukan">
                                            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{sup._count?.supplier_rma || 0} RMA</span>
                                        </span>
                                    </div>

                                    {sup.link_toko && (
                                        <a
                                            href={sup.link_toko}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline text-xs"
                                        >
                                            <span>Buka Toko/Web</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <SupplierModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedSupplier(null);
                }}
                supplierToEdit={selectedSupplier}
                onSuccess={fetchSuppliers}
            />

            <ConfirmModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Hapus Data Distributor"
                message={`Apakah Anda yakin ingin menghapus data distributor "${deleteTarget?.nama}"? Jika terdapat riwayat sparepart atau klaim RMA, status akan dinonaktifkan secara aman.`}
                confirmText="Hapus Distributor"
                confirmColor="danger"
            />

        </div>
    );
}
