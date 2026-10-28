import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
    ArrowRight,
    ShieldCheck,
    Sparkles,
    Laptop
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
    disetujui_ganti: { label: "Disetujui - Ganti Unit Baru", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    disetujui_refund: { label: "Disetujui - Refund / Potong Nota", color: "bg-sky-50 text-sky-700 border-sky-200", icon: DollarSign },
    ditolak: { label: "Ditolak / Void Garansi", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle }
};

export default function RmaList() {
    const { isAdmin, isTeknisi, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [rmaList, setRmaList] = useState([]);
    const [stats, setStats] = useState({ total: 0, diajukan: 0, dikirim: 0, disetujui_ganti: 0, disetujui_refund: 0, ditolak: 0, selesai: 0 });
    const [loading, setLoading] = useState(true);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sumberFilter, setSumberFilter] = useState("all");

    // Update Status Modal
    const [updateTarget, setUpdateTarget] = useState(null);
    const [updateForm, setUpdateForm] = useState({
        status: "dikirim",
        resi_pengiriman: "",
        kurir_pengiriman: "JNE",
        ongkir: "0",
        serial_number_lama: "",
        serial_number_baru: "",
        solusi_distributor: "Ganti Unit Baru",
        catatan_distributor: "",
        biaya_ongkir_ditanggung: "toko",
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
    }, [searchQuery, statusFilter, sumberFilter]);

    // Handle deep links: redirect directly to dedicated /rma/tambah page
    useEffect(() => {
        const action = searchParams.get("action");
        const sparepartId = searchParams.get("sparepart_id");
        const tiketId = searchParams.get("tiket_id");
        const q = searchParams.get("q");

        if (q) {
            setSearchQuery(q);
        }

        if (action === "new" || sparepartId || tiketId) {
            navigate(`/rma/tambah?${searchParams.toString()}`);
        }
    }, [searchParams, navigate]);

    useEffect(() => {
        fetchRmaList();
        fetchRmaStats();
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

    const filteredRma = rmaList.filter(item => {
        if (sumberFilter !== "all") {
            if (sumberFilter === "tiket_user" && item.tipe_sumber !== "tiket_user" && !item.tiket_id) return false;
            if (sumberFilter === "stok_toko" && (item.tipe_sumber === "tiket_user" || item.tiket_id)) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.nomor_rma.toLowerCase().includes(q) ||
            item.supplier_nama.toLowerCase().includes(q) ||
            (item.nomor_faktur && item.nomor_faktur.toLowerCase().includes(q)) ||
            (item.resi_pengiriman && item.resi_pengiriman.toLowerCase().includes(q)) ||
            (item.sparepart?.nama && item.sparepart.nama.toLowerCase().includes(q)) ||
            (item.alasan_rusak && item.alasan_rusak.toLowerCase().includes(q)) ||
            (item.customer_nama && item.customer_nama.toLowerCase().includes(q)) ||
            (item.perangkat_nama && item.perangkat_nama.toLowerCase().includes(q)) ||
            (item.serial_number_lama && item.serial_number_lama.toLowerCase().includes(q)) ||
            (item.serial_number_baru && item.serial_number_baru.toLowerCase().includes(q)) ||
            (item.tiket?.nomor_tiket && item.tiket.nomor_tiket.toLowerCase().includes(q))
        );
    });

    // Update Status Modal
    function handleOpenUpdateModal(item) {
        setUpdateTarget(item);
        setUpdateForm({
            status: item.status === "diajukan" ? "dikirim" : item.status,
            resi_pengiriman: item.resi_pengiriman || "",
            kurir_pengiriman: item.kurir_pengiriman || "JNE",
            ongkir: item.ongkir ? String(item.ongkir) : "0",
            serial_number_lama: item.serial_number_lama || "",
            serial_number_baru: item.serial_number_baru || "",
            biaya_ongkir_ditanggung: item.biaya_ongkir_ditanggung || "toko",
            solusi_distributor: item.solusi_distributor || (item.status === "disetujui_refund" ? "Refund Dana" : "Ganti Unit Baru"),
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
            toast.success(`Klaim RMA ${deleteTarget.nomor_rma} dibatalkan`);
            setDeleteTarget(null);
            fetchRmaList();
            fetchRmaStats();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus klaim RMA");
        }
    }

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Klaim Garansi Distributor (RMA)</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Supplier RMA Tracker
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Pusat pencatatan retur suku cadang cacat ke distributor resmi, pelacakan garansi nota end-user, serta bantuan klaim lifetime.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        to="/rma/tambah"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Ajukan Klaim RMA Baru</span>
                    </Link>
                </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div 
                    onClick={() => setStatusFilter("all")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        statusFilter === "all" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                >
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === "all" ? "text-slate-300" : "text-slate-400"}`}>Total Klaim</p>
                    <p className={`text-2xl font-extrabold mt-1 ${statusFilter === "all" ? "text-white" : "text-slate-900"}`}>{stats.total || 0}</p>
                </div>

                <div 
                    onClick={() => setStatusFilter("diajukan")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        statusFilter === "diajukan" ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === "diajukan" ? "text-white" : "text-amber-600"}`}>Draft / Menunggu</p>
                        <Clock className={`w-3.5 h-3.5 ${statusFilter === "diajukan" ? "text-white" : "text-amber-500"}`} />
                    </div>
                    <p className={`text-2xl font-extrabold mt-1 ${statusFilter === "diajukan" ? "text-white" : "text-slate-900"}`}>{stats.diajukan || 0}</p>
                </div>

                <div 
                    onClick={() => setStatusFilter("dikirim")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        statusFilter === "dikirim" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === "dikirim" ? "text-white" : "text-blue-600"}`}>Proses Pengiriman</p>
                        <Truck className={`w-3.5 h-3.5 ${statusFilter === "dikirim" ? "text-white" : "text-blue-500"}`} />
                    </div>
                    <p className={`text-2xl font-extrabold mt-1 ${statusFilter === "dikirim" ? "text-white" : "text-slate-900"}`}>{stats.dikirim || 0}</p>
                </div>

                <div 
                    onClick={() => setStatusFilter("disetujui_ganti")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        statusFilter === "disetujui_ganti" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === "disetujui_ganti" ? "text-white" : "text-emerald-600"}`}>Ganti Baru</p>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === "disetujui_ganti" ? "text-white" : "text-emerald-500"}`} />
                    </div>
                    <p className={`text-2xl font-extrabold mt-1 ${statusFilter === "disetujui_ganti" ? "text-white" : "text-slate-900"}`}>{stats.disetujui_ganti || 0}</p>
                </div>

                <div 
                    onClick={() => setStatusFilter("disetujui_refund")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        statusFilter === "disetujui_refund" ? "bg-sky-600 text-white border-sky-600 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === "disetujui_refund" ? "text-white" : "text-sky-600"}`}>Refund Dana</p>
                        <DollarSign className={`w-3.5 h-3.5 ${statusFilter === "disetujui_refund" ? "text-white" : "text-sky-500"}`} />
                    </div>
                    <p className={`text-2xl font-extrabold mt-1 ${statusFilter === "disetujui_refund" ? "text-white" : "text-slate-900"}`}>{stats.disetujui_refund || 0}</p>
                </div>

                <div 
                    onClick={() => setStatusFilter("ditolak")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        statusFilter === "ditolak" ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === "ditolak" ? "text-white" : "text-rose-600"}`}>Ditolak / Void</p>
                        <XCircle className={`w-3.5 h-3.5 ${statusFilter === "ditolak" ? "text-white" : "text-rose-500"}`} />
                    </div>
                    <p className={`text-2xl font-extrabold mt-1 ${statusFilter === "ditolak" ? "text-white" : "text-slate-900"}`}>{stats.ditolak || 0}</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari RMA, No. Resi, Suku Cadang, Serial Number, Pelanggan, atau Distributor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sumber Filter: All, Tiket Servis, Retail, Stok Toko */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                            {[
                                { key: "all", label: "Semua Sumber" },
                                { key: "tiket_user", label: "Tiket Servis" },
                                { key: "retail_customer", label: "Retail Konsumen" },
                                { key: "stok_toko", label: "Stok Toko" }
                            ].map((sb) => (
                                <button
                                    key={sb.key}
                                    type="button"
                                    onClick={() => setSumberFilter(sb.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                        sumberFilter === sb.key ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    {sb.label}
                                </button>
                            ))}
                        </div>

                        {(statusFilter !== "all" || sumberFilter !== "all" || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setStatusFilter("all");
                                    setSumberFilter("all");
                                    setSearchQuery("");
                                }}
                                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
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
                        title={statusFilter !== "all" || searchQuery ? "Klaim RMA Tidak Ditemukan" : "Belum Ada Klaim RMA"}
                        description={
                            statusFilter !== "all" || searchQuery
                                ? "Tidak ada klaim RMA yang cocok dengan filter atau kata kunci pencarian Anda."
                                : "Tidak ada suku cadang cacat/rusak yang sedang diajukan retur ke distributor."
                        }
                        actionLabel={statusFilter !== "all" || sumberFilter !== "all" || searchQuery ? "Reset Filter" : "Ajukan Klaim RMA Baru"}
                        onAction={
                            statusFilter !== "all" || sumberFilter !== "all" || searchQuery
                                ? () => {
                                      setStatusFilter("all");
                                      setSumberFilter("all");
                                      setSearchQuery("");
                                      setCurrentPage(1);
                                  }
                                : () => navigate("/rma/tambah")
                        }
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3.5">No. RMA & Tanggal</th>
                                <th className="px-6 py-3.5">Suku Cadang & Serial Number</th>
                                <th className="px-6 py-3.5">Sumber & Pelanggan</th>
                                <th className="px-6 py-3.5">Distributor & Kebijakan Garansi</th>
                                <th className="px-6 py-3.5">Status & Pengiriman</th>
                                <th className="px-6 py-3.5 text-right w-44">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRma.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => {
                                const statusCfg = RMA_STATUS_CONFIG[item.status] || RMA_STATUS_CONFIG.diajukan;
                                const StatusIcon = statusCfg.icon;
                                const isFromTicket = item.tipe_sumber === "tiket_user" || item.tiket_id;

                                return (
                                    <tr 
                                        key={item.id} 
                                        onClick={(e) => {
                                            if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                            handleOpenUpdateModal(item);
                                        }}
                                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 align-middle">
                                            <p className="font-mono font-bold text-slate-900">{item.nomor_rma}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {new Date(item.tgl_pengajuan || item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4 align-middle">
                                            <div className="font-semibold text-slate-800">{item.sparepart?.nama}</div>
                                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                <span>Brand: {item.sparepart?.brand?.nama || "-"}</span>
                                                <span>•</span>
                                                <span className="font-bold text-blue-600">{item.jumlah} Pcs</span>
                                                {item.serial_number_lama && (
                                                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                                                        SN: {item.serial_number_lama}
                                                    </span>
                                                )}
                                            </div>
                                            {item.serial_number_baru && (
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                                        SN Pengganti: {item.serial_number_baru}
                                                    </span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 align-middle">
                                            {isFromTicket ? (
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                                            Tiket Servis
                                                        </span>
                                                        {item.tiket && (
                                                            <Link 
                                                                to={`/tiket-servis/${item.tiket.id}`} 
                                                                className="text-xs font-mono font-bold text-blue-600 hover:underline"
                                                            >
                                                                #{item.tiket.nomor_tiket}
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-800 mt-1">
                                                        {item.customer_nama || item.tiket?.perangkat?.customer?.nama || "Pelanggan Toko"}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {item.perangkat_nama || `${item.tiket?.perangkat?.tipe || ''} ${item.tiket?.perangkat?.model || ''}`}
                                                    </p>
                                                </div>
                                            ) : item.tipe_sumber === "retail_customer" ? (
                                                <div>
                                                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        🛍️ Retail Konsumen
                                                    </span>
                                                    <p className="text-xs font-semibold text-slate-800 mt-1">
                                                        {item.customer_nama || "Pelanggan Lepas"}
                                                    </p>
                                                    {item.nomor_faktur && (
                                                        <p className="text-[11px] font-mono text-slate-500">
                                                            Faktur: {item.nomor_faktur}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                        📦 Stok Bengkel / Gudang
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 mt-1">Cacat inventaris internal</p>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{item.supplier_nama}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {item.kebijakan_garansi === "lifetime" ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                        ⭐ Lifetime Warranty
                                                    </span>
                                                ) : item.kebijakan_garansi === "sejak_segel_distri" ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        ⚠️ Segel Distri
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        ✅ Sejak Nota Customer
                                                    </span>
                                                )}
                                                {item.nomor_faktur && (
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        Faktur: {item.nomor_faktur}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex flex-col gap-1 items-start justify-center min-h-[44px]">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {statusCfg.label}
                                                </span>
                                                {item.resi_pengiriman ? (
                                                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                                                        {item.kurir_pengiriman || "Kurir"}: {item.resi_pengiriman}
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 opacity-60">
                                                        Belum ada resi
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-middle text-right">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenUpdateModal(item)}
                                                    className="inline-flex items-center justify-center gap-1 w-[80px] py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                                                    title="Update Status / Resi / Penyelesaian"
                                                >
                                                    <span>Update</span>
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-blue-600" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setPrintTarget(item)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                                                    title="Cetak Surat Jalan Retur RMA"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>

                                                {isAdmin && (
                                                    item.status === "diajukan" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(item)}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                                            title="Hapus / Batalkan Klaim"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <div className="w-8 h-8 shrink-0" aria-hidden="true" />
                                                    )
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

            {/* MODAL: UPDATE STATUS & PENYELESAIAN RMA */}
            {updateTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Update Status & Resolusi RMA</h3>
                                <p className="text-xs text-slate-500 font-mono">{updateTarget.nomor_rma} - {updateTarget.sparepart?.nama}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUpdateTarget(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitUpdate} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status Progres Klaim *</label>
                                <select
                                    value={updateForm.status}
                                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-900"
                                >
                                    <option value="diajukan">Menunggu Pengiriman ke Distributor (Draft)</option>
                                    <option value="dikirim">Sudah Dikirim ke Distributor</option>
                                    <option value="disetujui_ganti">Disetujui Distributor - Ganti Unit Baru</option>
                                    <option value="disetujui_refund">Disetujui Distributor - Refund Dana / Potong Nota</option>
                                    <option value="ditolak">Ditolak oleh Distributor (Void Garansi / Fisik Rusak)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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
                                        placeholder="Resi tracking kurir"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Resolusi dari Distributor */}
                            {["disetujui_ganti", "disetujui_refund", "ditolak"].includes(updateForm.status) && (
                                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in">
                                    <p className="text-xs font-bold text-slate-800">Detail Hasil Penyelesaian dari Distributor:</p>
                                    
                                    {updateForm.status === "disetujui_ganti" && (
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Serial Number Baru (Pengganti dari Distributor):</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={updateForm.serial_number_baru}
                                                onChange={(e) => setUpdateForm({ ...updateForm, serial_number_baru: e.target.value })}
                                                placeholder="Contoh: SN: KVR-NEW-2026-9901"
                                                className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Dicatat pada sistem agar riwayat pergantian suku cadang unit terlacak transparan.</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Solusi / Keputusan Vendor</label>
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
                                    <h4 className="font-extrabold text-sm uppercase tracking-wider">KOMPUTERAWET / YANGVERSA SERVICE</h4>
                                    <p className="text-[11px] text-slate-500">Surat Pengantar Retur Klaim Garansi Suku Cadang (RMA Slip)</p>
                                    <div className="mt-2 inline-block px-3 py-1 bg-slate-100 text-slate-900 border border-slate-300 rounded-lg font-mono font-bold text-sm tracking-wide">
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

                                {/* Detail Sumber Klaim */}
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                                    <span className="font-bold text-slate-700">Sumber Klaim: </span>
                                    {printTarget.tipe_sumber === "tiket_user" || printTarget.tiket_id ? (
                                        <span>
                                            Tiket Servis Pelanggan (Pelanggan: <strong>{printTarget.customer_nama || printTarget.tiket?.perangkat?.customer?.nama || "-"}</strong> | Unit: {printTarget.perangkat_nama || `${printTarget.tiket?.perangkat?.tipe || ''} ${printTarget.tiket?.perangkat?.model || ''}`})
                                        </span>
                                    ) : (
                                        <span>Stok Inventaris Bengkel / Gudang Toko</span>
                                    )}
                                </div>

                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-bold">
                                            <tr>
                                                <th className="p-2 text-left">Nama Sparepart</th>
                                                <th className="p-2 text-center w-16">Qty</th>
                                                <th className="p-2 text-left">Serial Number</th>
                                                <th className="p-2 text-left">Gejala Kerusakan / Defek</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t border-slate-200">
                                                <td className="p-2 font-medium">{printTarget.sparepart?.nama} ({printTarget.sparepart?.brand?.nama || "-"})</td>
                                                <td className="p-2 text-center font-bold">{printTarget.jumlah} Pcs</td>
                                                <td className="p-2 font-mono text-[11px]">{printTarget.serial_number_lama || "-"}</td>
                                                <td className="p-2 text-slate-700">{printTarget.alasan_rusak}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                                    <div>
                                        <span className="text-slate-500">Kebijakan Garansi: </span>
                                        <span className="font-semibold text-slate-800">
                                            {printTarget.kebijakan_garansi === "lifetime" ? "Lifetime Warranty (Garansi Seumur Hidup)" : printTarget.kebijakan_garansi === "sejak_segel_distri" ? "Dihitung Sejak Segel Stiker Distri" : "Dihitung Sejak Nota Penjualan ke End-User"}
                                        </span>
                                    </div>
                                    {printTarget.resi_pengiriman && (
                                        <div>
                                            <span className="text-slate-500">Resi Pengiriman: </span>
                                            <span className="font-mono font-bold">{printTarget.kurir_pengiriman} - {printTarget.resi_pengiriman}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center pt-6">
                                    <div>
                                        <p className="text-[11px] text-slate-600 mb-10">Yang Mengajukan (YVS)</p>
                                        <p className="font-bold text-xs border-t border-slate-300 pt-1">({printTarget.created_by_nama || user?.nama})</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-600 mb-10">Kurir / Ekspedisi</p>
                                        <p className="font-bold text-xs border-t border-slate-300 pt-1">({printTarget.kurir_pengiriman || "Kurir"})</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-600 mb-10">Penerima Distributor</p>
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
