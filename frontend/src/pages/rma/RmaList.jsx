import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { 
    RotateCcw, 
    Plus, 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Wrench, 
    Truck, 
    Package, 
    Building2, 
    DollarSign, 
    X, 
    Edit2, 
    Trash2, 
    ExternalLink, 
    Printer, 
    FileText, 
    Layers, 
    CheckCircle,
    XCircle,
    ArrowRight
} from "lucide-react";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";
import ConfirmModal from "../../components/ConfirmModal";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

const RMA_STATUS_CONFIG = {
    diajukan: { label: "Diajukan (Draft)", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    dikirim: { label: "Dikirim ke Distributor", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Truck },
    disetujui_ganti: { label: "Disetujui - Ganti Unit", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    disetujui_refund: { label: "Disetujui - Refund Dana", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: DollarSign },
    ditolak: { label: "Ditolak / Void Garansi", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle }
};

export default function RmaList() {
    const { isAdmin, isTeknisi, user } = useAuth();
    const [searchParams] = useSearchParams();

    const [rmaList, setRmaList] = useState([]);
    const [stats, setStats] = useState({ total: 0, diajukan: 0, dikirim: 0, disetujui_ganti: 0, disetujui_refund: 0, ditolak: 0, selesai: 0 });
    const [loading, setLoading] = useState(true);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Sparepart Catalog (for dropdown)
    const [spareparts, setSpareparts] = useState([]);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        sparepart_id: "",
        supplier_nama: "",
        nomor_faktur: "",
        jumlah: 1,
        alasan_rusak: "",
        resi_pengiriman: "",
        kurir_pengiriman: "JNE",
        ongkir: "0",
        tiket_id: ""
    });
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

    // Update Status Modal
    const [updateTarget, setUpdateTarget] = useState(null);
    const [updateForm, setUpdateForm] = useState({
        status: "dikirim",
        resi_pengiriman: "",
        kurir_pengiriman: "JNE",
        ongkir: "0",
        solusi_distributor: "Ganti Unit Baru",
        catatan_distributor: "",
        restock_otomatis: true
    });
    const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

    // Print Modal (Packing Slip RMA)
    const [printTarget, setPrintTarget] = useState(null);

    // Delete Target
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    // Handle deep links from TiketServis or Sparepart catalog
    useEffect(() => {
        const action = searchParams.get("action");
        const sparepartId = searchParams.get("sparepart_id");
        const tiketId = searchParams.get("tiket_id");
        const q = searchParams.get("q");

        if (q) {
            setSearchQuery(q);
        }

        if (action === "new" || sparepartId || tiketId) {
            setFormData(prev => ({
                ...prev,
                sparepart_id: sparepartId ? String(sparepartId) : prev.sparepart_id,
                tiket_id: tiketId ? String(tiketId) : prev.tiket_id,
            }));
            setIsCreateModalOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchRmaList();
        fetchRmaStats();
        fetchSparepartCatalog();
    }, [statusFilter]);

    async function fetchRmaList() {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const res = await api.get("/rma", { params });
            setRmaList(res.data || []);
        } catch (err) {
            toast.error("Gagal memuat daftar klaim RMA");
        } finally {
            setLoading(false);
        }
    }

    async function fetchRmaStats() {
        try {
            const res = await api.get("/rma/stats");
            setStats(res.data || { total: 0, diajukan: 0, dikirim: 0, disetujui_ganti: 0, disetujui_refund: 0, ditolak: 0, selesai: 0 });
        } catch (err) {
            // Keep default
        }
    }

    async function fetchSparepartCatalog() {
        try {
            const res = await api.get("/sparepart");
            setSpareparts(res.data || []);
        } catch (err) {
            // Silent error
        }
    }

    const filteredRma = rmaList.filter(item => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.nomor_rma.toLowerCase().includes(q) ||
            item.supplier_nama.toLowerCase().includes(q) ||
            (item.nomor_faktur && item.nomor_faktur.toLowerCase().includes(q)) ||
            (item.resi_pengiriman && item.resi_pengiriman.toLowerCase().includes(q)) ||
            (item.sparepart?.nama && item.sparepart.nama.toLowerCase().includes(q)) ||
            (item.alasan_rusak && item.alasan_rusak.toLowerCase().includes(q))
        );
    });

    // Create Modal
    function handleOpenCreateModal() {
        setFormData({
            sparepart_id: "",
            supplier_nama: "",
            nomor_faktur: "",
            jumlah: 1,
            alasan_rusak: "",
            resi_pengiriman: "",
            kurir_pengiriman: "JNE",
            ongkir: "0",
            tiket_id: ""
        });
        setIsCreateModalOpen(true);
    }

    async function handleSubmitCreate(e) {
        e.preventDefault();
        if (!formData.sparepart_id || !formData.supplier_nama || !formData.alasan_rusak) {
            toast.error("Lengkapi sparepart, nama supplier, dan gejala kerusakan");
            return;
        }

        setIsSubmittingCreate(true);
        try {
            const res = await api.post("/rma", formData);
            toast.success(`Klaim RMA ${res.data.nomor_rma} berhasil diajukan`);
            setIsCreateModalOpen(false);
            fetchRmaList();
            fetchRmaStats();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengajukan RMA");
        } finally {
            setIsSubmittingCreate(false);
        }
    }

    // Update Status Modal
    function handleOpenUpdateModal(item) {
        setUpdateTarget(item);
        setUpdateForm({
            status: item.status === "diajukan" ? "dikirim" : item.status,
            resi_pengiriman: item.resi_pengiriman || "",
            kurir_pengiriman: item.kurir_pengiriman || "JNE",
            ongkir: item.ongkir ? String(item.ongkir) : "0",
            solusi_distributor: item.solusi_distributor || "Ganti Unit Baru",
            catatan_distributor: item.catatan_distributor || "",
            restock_otomatis: true
        });
    }

    async function handleSubmitUpdate(e) {
        e.preventDefault();
        if (!updateTarget) return;

        setIsSubmittingUpdate(true);
        try {
            await api.put(`/rma/${updateTarget.id}`, updateForm);
            toast.success("Status klaim RMA berhasil diperbarui");
            setUpdateTarget(null);
            fetchRmaList();
            fetchRmaStats();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui status RMA");
        } finally {
            setIsSubmittingUpdate(false);
        }
    }

    // Delete
    async function handleDeleteRma() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/rma/${deleteTarget.id}`);
            toast.success("Klaim RMA berhasil dibatalkan & dihapus");
            setDeleteTarget(null);
            fetchRmaList();
            fetchRmaStats();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus klaim RMA");
        }
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shadow-2xs">
                            <RotateCcw className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Klaim Garansi Distributor (Supplier RMA)
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Pelacakan klaim garansi & retur suku cadang rusak/defek ke vendor distributor (Mangga Dua, Bandung, dsb)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Ajukan Klaim RMA Baru</span>
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Klaim RMA</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{stats.total} Kasus</h3>
                    <p className="text-xs text-slate-500 mt-1">Seluruh histori retur vendor</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Menunggu Pengiriman</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-amber-600">{stats.diajukan} Part</h3>
                    <p className="text-xs text-amber-600 font-medium mt-1">Siap dipaketkan ke kurir</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Proses di Supplier</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Truck className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-blue-600">{stats.dikirim} Part</h3>
                    <p className="text-xs text-blue-600 font-medium mt-1">Sedang dicek teknisi distributor</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Selesai (Ganti / Refund)</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-600">{stats.selesai} Kasus</h3>
                    <p className="text-xs text-emerald-600 font-medium mt-1">Klaim berhasil di-acc</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari nomor RMA, part, distributor, resi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                        <option value="all">Semua Status Klaim</option>
                        <option value="diajukan">Menunggu Pengiriman (Draft)</option>
                        <option value="dikirim">Dalam Proses di Distributor</option>
                        <option value="disetujui_ganti">Disetujui - Ganti Unit Baru</option>
                        <option value="disetujui_refund">Disetujui - Refund Dana</option>
                        <option value="ditolak">Ditolak / Void Garansi</option>
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <TableContainer
                footer={
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredRma.length / itemsPerPage) || 1}
                        totalItems={filteredRma.length}
                        pageSize={itemsPerPage}
                        onPageChange={setCurrentPage}
                        unitLabel="klaim"
                        disabled={loading}
                    />
                }
            >
                {loading ? (
                    <TableLoadingState message="Memuat daftar klaim RMA distributor..." />
                ) : filteredRma.length === 0 ? (
                    <TableEmptyState
                        icon={RotateCcw}
                        title="Belum Ada Klaim RMA"
                        description="Tidak ada suku cadang cacat/rusak yang sedang diajukan retur ke distributor."
                        actionLabel="Ajukan Klaim RMA Baru"
                        onAction={handleOpenCreateModal}
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3.5">No. RMA & Tanggal</th>
                                <th className="px-6 py-3.5">Suku Cadang & Qty</th>
                                <th className="px-6 py-3.5">Distributor & Faktur</th>
                                <th className="px-6 py-3.5">Gejala Defek / Alasan</th>
                                <th className="px-6 py-3.5">Status & Pengiriman</th>
                                <th className="px-6 py-3.5 text-right w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRma.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => {
                                const statusCfg = RMA_STATUS_CONFIG[item.status] || RMA_STATUS_CONFIG.diajukan;
                                const StatusIcon = statusCfg.icon;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono font-bold text-slate-900">{item.nomor_rma}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {new Date(item.tgl_pengajuan || item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{item.sparepart?.nama}</div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                <span>Brand: {item.sparepart?.brand?.nama || "-"}</span>
                                                <span>•</span>
                                                <span className="font-bold text-blue-600">{item.jumlah} Pcs</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{item.supplier_nama}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 font-mono">
                                                Faktur: {item.nomor_faktur || "-"}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-700 max-w-xs truncate" title={item.alasan_rusak}>
                                                {item.alasan_rusak}
                                            </p>
                                            {item.tiket && (
                                                <Link 
                                                    to={`/tiket-servis/${item.tiket.id}`} 
                                                    className="inline-block text-[11px] font-mono text-blue-600 hover:underline mt-0.5"
                                                >
                                                    Dari Tiket: {item.tiket.nomor_tiket}
                                                </Link>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {statusCfg.label}
                                            </span>
                                            {item.resi_pengiriman && (
                                                <p className="text-[11px] text-slate-600 font-mono mt-1">
                                                    {item.kurir_pengiriman || "Kurir"}: {item.resi_pengiriman}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenUpdateModal(item)}
                                                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                    title="Update Status / Resi / Penyelesaian"
                                                >
                                                    Update
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setPrintTarget(item)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                    title="Cetak Surat Jalan Retur RMA"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>

                                                {isAdmin && item.status === "diajukan" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(item)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Hapus / Batalkan Klaim"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </TableContainer>

            {/* MODAL: AJUKAN KLAIM RMA BARU */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                                    <RotateCcw className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Form Pengajuan RMA Distributor</h3>
                                    <p className="text-xs text-slate-500">Klaim retur garansi suku cadang cacat ke vendor</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
                            {formData.tiket_id && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-800">
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-blue-600" />
                                        <span>Terkait dengan Tiket Servis #{formData.tiket_id}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tiket_id: "" })}
                                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                                    >
                                        Lepas Kaitan
                                    </button>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Suku Cadang yang Rusak *</label>
                                <select
                                    required
                                    value={formData.sparepart_id}
                                    onChange={(e) => setFormData({ ...formData, sparepart_id: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                >
                                    <option value="">-- Pilih Suku Cadang --</option>
                                    {spareparts.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nama} ({s.brand?.nama || "No Brand"}) - Stok: {s.stok}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Distributor / Supplier *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.supplier_nama}
                                        onChange={(e) => setFormData({ ...formData, supplier_nama: e.target.value })}
                                        placeholder="e.g. Toko LCD Bandung / Mangga Dua"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Unit (Qty) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.jumlah}
                                        onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Nota / Faktur Pembelian (Jika Ada)</label>
                                <input
                                    type="text"
                                    value={formData.nomor_faktur}
                                    onChange={(e) => setFormData({ ...formData, nomor_faktur: e.target.value })}
                                    placeholder="INV-SUPPLIER-12345"
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Gejala Kerusakan / Defek *</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={formData.alasan_rusak}
                                    onChange={(e) => setFormData({ ...formData, alasan_rusak: e.target.value })}
                                    placeholder="e.g. LCD garis vertikal merah setelah 3 hari pemakaian, atau IC short saat dipasang"
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kurir Pengiriman (Jika Sudah Dikirim)</label>
                                    <select
                                        value={formData.kurir_pengiriman}
                                        onChange={(e) => setFormData({ ...formData, kurir_pengiriman: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    >
                                        <option value="JNE">JNE</option>
                                        <option value="J&T Express">J&T Express</option>
                                        <option value="SiCepat">SiCepat</option>
                                        <option value="Kurir Toko / Langsung">Kurir Toko / Langsung Antar</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Resi Pengiriman</label>
                                    <input
                                        type="text"
                                        value={formData.resi_pengiriman}
                                        onChange={(e) => setFormData({ ...formData, resi_pengiriman: e.target.value })}
                                        placeholder="Kosongkan jika belum dikirim"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCreate}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingCreate ? "Menyimpan..." : "Ajukan Klaim RMA"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: UPDATE STATUS & PENYELESAIAN RMA */}
            {updateTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Update Status Klaim RMA</h3>
                                <p className="text-xs text-slate-500 font-mono">{updateTarget.nomor_rma} - {updateTarget.sparepart?.nama}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUpdateTarget(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status Progres Klaim *</label>
                                <select
                                    value={updateForm.status}
                                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
                                >
                                    <option value="diajukan">Menunggu Pengiriman (Draft)</option>
                                    <option value="dikirim">Sudah Dikirim ke Distributor</option>
                                    <option value="disetujui_ganti">Disetujui Distributor - Ganti Unit Baru</option>
                                    <option value="disetujui_refund">Disetujui Distributor - Refund Dana / Kredit Saldo</option>
                                    <option value="ditolak">Ditolak oleh Distributor (Void Garansi / Fisik Rusak)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kurir Pengiriman</label>
                                    <input
                                        type="text"
                                        value={updateForm.kurir_pengiriman}
                                        onChange={(e) => setUpdateForm({ ...updateForm, kurir_pengiriman: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Resi Kurir</label>
                                    <input
                                        type="text"
                                        value={updateForm.resi_pengiriman}
                                        onChange={(e) => setUpdateForm({ ...updateForm, resi_pengiriman: e.target.value })}
                                        placeholder="Resi tracking"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                                    />
                                </div>
                            </div>

                            {["disetujui_ganti", "disetujui_refund", "ditolak"].includes(updateForm.status) && (
                                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <p className="text-xs font-bold text-slate-800">Detail Hasil Penyelesaian dari Distributor:</p>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Solusi Vendor</label>
                                        <input
                                            type="text"
                                            value={updateForm.solusi_distributor}
                                            onChange={(e) => setUpdateForm({ ...updateForm, solusi_distributor: e.target.value })}
                                            placeholder="e.g. Unit pengganti baru dikirim via JNE / Saldo dipotong invoice"
                                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catatan Tambahan Vendor</label>
                                        <textarea
                                            rows="2"
                                            value={updateForm.catatan_distributor}
                                            onChange={(e) => setUpdateForm({ ...updateForm, catatan_distributor: e.target.value })}
                                            placeholder="Keterangan resmi dari distributor"
                                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                                        />
                                    </div>
                                    {updateForm.status === "disetujui_ganti" && (
                                        <label className="flex items-center gap-2 text-xs font-semibold text-emerald-800 cursor-pointer pt-1">
                                            <input
                                                type="checkbox"
                                                checked={updateForm.restock_otomatis}
                                                onChange={(e) => setUpdateForm({ ...updateForm, restock_otomatis: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded"
                                            />
                                            <span>Otomatis tambahkan +{updateTarget.jumlah} stok ke katalog sparepart saat unit baru tiba</span>
                                        </label>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setUpdateTarget(null)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingUpdate}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingUpdate ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CETAK SURAT JALAN RMA */}
            {printTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <style>{`
                        @media print {
                            body * { visibility: hidden !important; }
                            #printable-rma-slip, #printable-rma-slip * { visibility: visible !important; }
                            #printable-rma-slip {
                                position: fixed !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                padding: 24px !important;
                                border: none !important;
                                box-shadow: none !important;
                            }
                        }
                    `}</style>
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Printer className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-900 text-base">Surat Jalan Retur Garansi (RMA Slip)</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPrintTarget(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div id="printable-rma-slip" className="border border-slate-300 rounded-xl p-6 text-slate-900 text-xs space-y-4">
                                <div className="text-center pb-3 border-b border-slate-200">
                                    <h4 className="font-extrabold text-sm uppercase tracking-wider">YANGVERSA SERVICE (YVS)</h4>
                                    <p className="text-[11px] text-slate-500">Surat Pengantar Retur Garansi Suku Cadang (RMA Slip)</p>
                                    <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white rounded font-mono font-bold text-sm">
                                        {printTarget.nomor_rma}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-slate-500 font-semibold uppercase text-[10px]">Pengirim (Workshop)</p>
                                        <p className="font-bold text-slate-900">Yangversa Service</p>
                                        <p className="text-slate-600">Teknisi: {printTarget.created_by_nama || user?.nama}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-semibold uppercase text-[10px]">Tujuan (Distributor / Supplier)</p>
                                        <p className="font-bold text-slate-900">{printTarget.supplier_nama}</p>
                                        <p className="text-slate-600">Faktur Asal: {printTarget.nomor_faktur || "-"}</p>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-bold">
                                            <tr>
                                                <th className="p-2 text-left">Nama Sparepart</th>
                                                <th className="p-2 text-center w-16">Qty</th>
                                                <th className="p-2 text-left">Gejala Kerusakan / Defek</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t border-slate-200">
                                                <td className="p-2 font-medium">{printTarget.sparepart?.nama} ({printTarget.sparepart?.brand?.nama || "-"})</td>
                                                <td className="p-2 text-center font-bold">{printTarget.jumlah} Pcs</td>
                                                <td className="p-2 text-slate-700">{printTarget.alasan_rusak}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {printTarget.resi_pengiriman && (
                                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                        <span className="text-slate-500">Resi Pengiriman: </span>
                                        <span className="font-mono font-bold">{printTarget.kurir_pengiriman} - {printTarget.resi_pengiriman}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-center pt-6">
                                    <div>
                                        <p className="text-[11px] text-slate-600 mb-10">Yang Mengajukan (YVS)</p>
                                        <p className="font-bold text-xs border-t border-slate-300 pt-1">({printTarget.created_by_nama || user?.nama})</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-600 mb-10">Diterima Petugas Distributor</p>
                                        <p className="font-bold text-xs border-t border-slate-300 pt-1">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setPrintTarget(null)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Cetak Surat Jalan Retur</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteTarget && (
                <ConfirmModal
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteRma}
                    title="Batalkan & Hapus Klaim RMA"
                    message={`Apakah Anda yakin ingin membatalkan klaim garansi [${deleteTarget.nomor_rma}] untuk part "${deleteTarget.sparepart?.nama}"?`}
                    confirmLabel="Hapus Klaim"
                    danger
                />
            )}
        </div>
    );
}

