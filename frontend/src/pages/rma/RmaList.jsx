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
    ArrowRight,
    ShieldCheck,
    UserCheck,
    Sparkles,
    Check,
    Phone,
    Laptop,
    User,
    CheckSquare,
    Square
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
    const [searchParams] = useSearchParams();

    const [rmaList, setRmaList] = useState([]);
    const [stats, setStats] = useState({ total: 0, diajukan: 0, dikirim: 0, disetujui_ganti: 0, disetujui_refund: 0, ditolak: 0, selesai: 0 });
    const [loading, setLoading] = useState(true);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sumberFilter, setSumberFilter] = useState("all");

    // Sparepart Catalog & Tickets
    const [spareparts, setSpareparts] = useState([]);
    const [tickets, setTickets] = useState([]);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        tipe_sumber: "tiket_user", // "tiket_user" | "stok_toko"
        tiket_id: "",
        customer_nama: "",
        customer_kontak: "",
        perangkat_nama: "",
        tgl_penjualan_customer: "",
        sparepart_id: "",
        supplier_nama: "",
        nomor_faktur: "",
        serial_number_lama: "",
        kebijakan_garansi: "sejak_nota_customer", // "sejak_nota_customer", "sejak_segel_distri", "lifetime"
        tgl_pembelian_distri: "",
        kondisi_fisik_valid: true,
        bantuan_klaim_toko: true,
        biaya_ongkir_ditanggung: "toko", // "toko", "distributor", "customer"
        jumlah: 1,
        alasan_rusak: "",
        kurir_pengiriman: "JNE",
        resi_pengiriman: "",
        ongkir: "0"
    });
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

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
            setIsCreateModalOpen(true);
            if (tiketId) {
                handleSelectTicket(tiketId);
            }
            if (sparepartId) {
                handleSelectSparepart(sparepartId);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        fetchRmaList();
        fetchRmaStats();
        fetchSparepartCatalog();
        fetchTickets();
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

    async function fetchTickets() {
        try {
            const res = await api.get("/tiket-servis");
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setTickets(data);
        } catch (err) {
            // Silent error
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

    // Handle selecting a Ticket in Create Modal
    function handleSelectTicket(tiketId) {
        if (!tiketId) {
            setFormData(prev => ({
                ...prev,
                tiket_id: "",
                customer_nama: "",
                customer_kontak: "",
                perangkat_nama: "",
                tgl_penjualan_customer: ""
            }));
            return;
        }
        const found = tickets.find(t => String(t.id) === String(tiketId));
        if (found) {
            const custName = found.perangkat?.customer?.nama || "";
            const custHp = found.perangkat?.customer?.no_hp || "";
            const deviceName = `${found.perangkat?.tipe || "Unit"} ${found.perangkat?.model || ""}`.trim();
            const tglJual = found.created_at ? new Date(found.created_at).toISOString().split("T")[0] : "";
            
            // Check if ticket used spareparts
            let autoSparepartId = formData.sparepart_id;
            let autoDistri = formData.supplier_nama;
            let autoPolicy = formData.kebijakan_garansi;
            if (!autoSparepartId && found.penggunaan_sparepart && found.penggunaan_sparepart.length > 0) {
                const firstPs = found.penggunaan_sparepart[0].sparepart;
                if (firstPs) {
                    autoSparepartId = String(firstPs.id);
                    autoDistri = firstPs.distributor_nama || "";
                    autoPolicy = firstPs.sistem_perhitungan_garansi || (firstPs.tipe_garansi_distri === "Lifetime" ? "lifetime" : "sejak_nota_customer");
                }
            }

            setFormData(prev => ({
                ...prev,
                tipe_sumber: "tiket_user",
                tiket_id: String(tiketId),
                customer_nama: custName,
                customer_kontak: custHp,
                perangkat_nama: deviceName,
                tgl_penjualan_customer: tglJual,
                sparepart_id: autoSparepartId || prev.sparepart_id,
                supplier_nama: autoDistri || prev.supplier_nama,
                kebijakan_garansi: autoPolicy || prev.kebijakan_garansi
            }));
        }
    }

    // Handle selecting a Sparepart in Create Modal
    function handleSelectSparepart(spId) {
        const sp = spareparts.find(s => String(s.id) === String(spId));
        setFormData(prev => ({
            ...prev,
            sparepart_id: String(spId),
            supplier_nama: sp?.distributor_nama || prev.supplier_nama || "",
            kebijakan_garansi: sp?.sistem_perhitungan_garansi || (sp?.tipe_garansi_distri === "Lifetime" ? "lifetime" : "sejak_nota_customer")
        }));
    }

    // Create Modal Open
    function handleOpenCreateModal() {
        setFormData({
            tipe_sumber: "tiket_user",
            tiket_id: "",
            customer_nama: "",
            customer_kontak: "",
            perangkat_nama: "",
            tgl_penjualan_customer: "",
            sparepart_id: "",
            supplier_nama: "",
            nomor_faktur: "",
            serial_number_lama: "",
            kebijakan_garansi: "sejak_nota_customer",
            tgl_pembelian_distri: "",
            kondisi_fisik_valid: true,
            bantuan_klaim_toko: true,
            biaya_ongkir_ditanggung: "toko",
            jumlah: 1,
            alasan_rusak: "",
            kurir_pengiriman: "JNE",
            resi_pengiriman: "",
            ongkir: "0"
        });
        setIsCreateModalOpen(true);
    }

    async function handleSubmitCreate(e) {
        e.preventDefault();
        if (!formData.sparepart_id || !formData.supplier_nama || !formData.alasan_rusak) {
            toast.error("Lengkapi sparepart, nama supplier/distributor, dan gejala kerusakan");
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

    // Active selected ticket in create modal
    const currentSelectedTicket = formData.tiket_id 
        ? tickets.find(t => String(t.id) === String(formData.tiket_id)) 
        : null;

    // Active selected sparepart in create modal
    const currentSelectedSparepart = formData.sparepart_id 
        ? spareparts.find(s => String(s.id) === String(formData.sparepart_id)) 
        : null;

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
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Ajukan Klaim RMA Baru</span>
                    </button>
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sumber Filter: All, Tiket Servis, Stok Toko */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                            {[
                                { key: "all", label: "Semua Sumber" },
                                { key: "tiket_user", label: "Tiket Servis Customer" },
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
                                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap"
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
                        actionLabel={statusFilter !== "all" || searchQuery ? "Reset Filter" : "Ajukan Klaim RMA Baru"}
                        onAction={
                            statusFilter !== "all" || searchQuery
                                ? () => {
                                      setStatusFilter("all");
                                      setSumberFilter("all");
                                      setSearchQuery("");
                                      setCurrentPage(1);
                                  }
                                : handleOpenCreateModal
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
                                <th className="px-6 py-3.5 text-right w-28">Aksi</th>
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
                                        <td className="px-6 py-4">
                                            <p className="font-mono font-bold text-slate-900">{item.nomor_rma}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {new Date(item.tgl_pengajuan || item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4">
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

                                        <td className="px-6 py-4">
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
                                            ) : (
                                                <div>
                                                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                        📦 Stok Bengkel / Gudang
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 mt-1">Cacat inventaris internal</p>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
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
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                                    title="Update Status / Resi / Penyelesaian"
                                                >
                                                    <span>Update</span>
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-blue-600" />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl shadow-2xs">
                                    <RotateCcw className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Pengajuan Klaim RMA Distributor</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Retur suku cadang cacat ke vendor / distributor resmi</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmitCreate} className="p-6 overflow-y-auto space-y-5">
                            
                            {/* Step 1: Pilihan Sumber Suku Cadang */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    1. Sumber Suku Cadang yang Diklaim
                                </label>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setFormData(prev => ({ ...prev, tipe_sumber: "tiket_user" }))}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            formData.tipe_sumber === "tiket_user"
                                                ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20"
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <Laptop className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Unit Servis Pelanggan</span>
                                            </span>
                                            {formData.tipe_sumber === "tiket_user" && <Check className="w-4 h-4 text-blue-600" />}
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Part dipasang pada laptop/PC customer & ditemukan bermasalah saat garansi servis.
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => setFormData(prev => ({ 
                                            ...prev, 
                                            tipe_sumber: "stok_toko",
                                            tiket_id: "",
                                            customer_nama: "",
                                            customer_kontak: "",
                                            perangkat_nama: ""
                                        }))}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            formData.tipe_sumber === "stok_toko"
                                                ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20"
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <Package className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Stok Inventaris Gudang</span>
                                            </span>
                                            {formData.tipe_sumber === "stok_toko" && <Check className="w-4 h-4 text-blue-600" />}
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Part cacat pabrik / DoA (Dead on Arrival) langsung dari stok toko.
                                        </p>
                                    </div>
                                </div>

                                {/* Detail Jika dari Tiket Servis Customer */}
                                {formData.tipe_sumber === "tiket_user" && (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Pilih Tiket Servis Terkait:
                                            </label>
                                            <select
                                                value={formData.tiket_id}
                                                onChange={(e) => handleSelectTicket(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            >
                                                <option value="">-- Pilih Nomor Tiket Servis / Pelanggan --</option>
                                                {tickets.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        #{t.nomor_tiket} - {t.perangkat?.customer?.nama || "Pelanggan"} ({t.perangkat?.tipe || "Unit"} {t.perangkat?.model || ""})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {currentSelectedTicket && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/80 text-xs">
                                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Pelanggan</span>
                                                    <span className="font-bold text-slate-900">{currentSelectedTicket.perangkat?.customer?.nama || "-"}</span>
                                                    <span className="text-[11px] text-slate-500 block">{currentSelectedTicket.perangkat?.customer?.no_hp || "-"}</span>
                                                </div>

                                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Perangkat</span>
                                                    <span className="font-bold text-slate-900">{currentSelectedTicket.perangkat?.tipe || "Unit"} {currentSelectedTicket.perangkat?.model || ""}</span>
                                                    <span className="text-[11px] text-slate-500 block">Status: {currentSelectedTicket.status}</span>
                                                </div>

                                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Tanggal Servis / Nota</span>
                                                    <span className="font-bold text-slate-900">
                                                        {new Date(currentSelectedTicket.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600 block font-semibold">Day 1 Garansi End-User</span>
                                                </div>

                                                {/* Quick Pick Spareparts from Ticket */}
                                                {currentSelectedTicket.penggunaan_sparepart && currentSelectedTicket.penggunaan_sparepart.length > 0 && (
                                                    <div className="sm:col-span-3 pt-1">
                                                        <span className="text-[11px] font-bold text-slate-700 block mb-1">
                                                            Suku Cadang yang Terpasang di Tiket #{currentSelectedTicket.nomor_tiket}:
                                                        </span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {currentSelectedTicket.penggunaan_sparepart.map((ps, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => handleSelectSparepart(ps.sparepart?.id)}
                                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                                                        String(formData.sparepart_id) === String(ps.sparepart?.id)
                                                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                                                    }`}
                                                                >
                                                                    {ps.sparepart?.nama} ({ps.jumlah}x)
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Detail Suku Cadang & Garansi Distributor */}
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    2. Identifikasi Suku Cadang & Kebijakan Distributor
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Pilih Suku Cadang yang Rusak <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.sparepart_id}
                                            onChange={(e) => handleSelectSparepart(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Pilih Suku Cadang dari Katalog --</option>
                                            {spareparts.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.nama} ({s.brand?.nama || "No Brand"}) {s.has_garansi_distri ? `[Garansi: ${s.tipe_garansi_distri || "Distri"}]` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Jumlah Unit (Qty) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={formData.jumlah}
                                            onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Nama Distributor / Vendor Resmi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.supplier_nama}
                                            onChange={(e) => setFormData({ ...formData, supplier_nama: e.target.value })}
                                            placeholder="e.g. PT Astrindo / Synnex Metrodata / Toko LCD"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            No. Faktur Pembelian Asal (Jika Ada)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nomor_faktur}
                                            onChange={(e) => setFormData({ ...formData, nomor_faktur: e.target.value })}
                                            placeholder="INV-SUPPLIER-12345"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Skenario Perhitungan Garansi Distributor */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Metode / Skenario Perhitungan Garansi:
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {[
                                            { 
                                                key: "sejak_nota_customer", 
                                                title: "Sejak Nota End-User", 
                                                desc: "Authorized: Dihitung dari tanggal nota penjualan/pasang toko ke konsumen." 
                                            },
                                            { 
                                                key: "sejak_segel_distri", 
                                                title: "Sejak Segel Distri", 
                                                desc: "Independen: Garansi berjalan sejak stiker distributor toko terima barang." 
                                            },
                                            { 
                                                key: "lifetime", 
                                                title: "Lifetime Warranty", 
                                                desc: "RAM/Memori: Garansi seumur hidup produk, toko bantu klaim distributor." 
                                            }
                                        ].map(pol => (
                                            <div
                                                key={pol.key}
                                                onClick={() => setFormData({ ...formData, kebijakan_garansi: pol.key })}
                                                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                    formData.kebijakan_garansi === pol.key
                                                        ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                                                        : "bg-white border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-xs text-slate-900">{pol.title}</span>
                                                    {formData.kebijakan_garansi === pol.key && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{pol.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Smart Policy Banner */}
                                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="font-bold">
                                            {formData.kebijakan_garansi === "lifetime" 
                                                ? "Kebijakan Garansi Seumur Hidup (RAM / Flash Storage)"
                                                : formData.kebijakan_garansi === "sejak_nota_customer"
                                                ? "Perhitungan Sejak Nota Penjualan ke Konsumen"
                                                : "Perhitungan Sejak Tanggal Segel Stiker Distributor"}
                                        </p>
                                        <p className="text-[11px] text-blue-800 leading-relaxed">
                                            {formData.kebijakan_garansi === "lifetime"
                                                ? "Suku cadang yang dibeli di KomputerAwet / Serv.io didampingi penuh. Toko siap memfasilitasi penukaran retur ke service center resmi selama segel utuh."
                                                : formData.kebijakan_garansi === "sejak_nota_customer"
                                                ? `Sesuai hak perlindungan konsumen, tanggal nota ke pelanggan (${formData.tgl_penjualan_customer || "hari pemasangan"}) adalah Day 1 masa garansi berjalan.`
                                                : "Garansi telah terpotong masa simpan di toko. Pastikan tanggal segel stiker distributor masih dalam periode garansi sebelum dikirim."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Identifikasi Hardware & Kerusakan */}
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    3. Identifikasi Hardware & Gejala Kerusakan
                                </label>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Serial Number (SN) Unit yang Rusak / Diklaim
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.serial_number_lama}
                                        onChange={(e) => setFormData({ ...formData, serial_number_lama: e.target.value })}
                                        placeholder="Contoh: SN: KVR32S22S8/8-202410-0988"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                    <p className="text-[10.5px] text-slate-400 mt-1">Dicatat pada nota surat jalan retur agar distributor tidak salah unit.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Gejala Kerusakan / Defek <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={formData.alasan_rusak}
                                        onChange={(e) => setFormData({ ...formData, alasan_rusak: e.target.value })}
                                        placeholder="Contoh: Layar bergaris vertikal merah tipis setelah 2 hari dipakai, atau RAM menyebabkan crash blue screen (MEMORY_MANAGEMENT) saat ditest MemTest86"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                                    />
                                </div>

                                {/* Checklist Inspeksi Fisik Toko */}
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <p className="text-xs font-bold text-slate-800">Ceklis Verifikasi Fisik Teknisi Sebelum Retur:</p>
                                    
                                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.kondisi_fisik_valid}
                                            onChange={(e) => setFormData({ ...formData, kondisi_fisik_valid: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span>Segel hologram / distributor utuh, tidak cacat bakar, somplak, atau kena cairan (Bebas Void).</span>
                                    </label>

                                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.bantuan_klaim_toko}
                                            onChange={(e) => setFormData({ ...formData, bantuan_klaim_toko: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span>Toko memberikan layanan 'Bantu Klaim' untuk menjembatani pelanggan dengan distributor.</span>
                                    </label>
                                </div>
                            </div>

                            {/* Step 4: Logistik Pengiriman */}
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    4. Logistik & Ekspedisi Pengiriman
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kurir Pengiriman</label>
                                        <select
                                            value={formData.kurir_pengiriman}
                                            onChange={(e) => setFormData({ ...formData, kurir_pengiriman: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="JNE">JNE</option>
                                            <option value="J&T Express">J&T Express</option>
                                            <option value="SiCepat">SiCepat</option>
                                            <option value="Kurir Toko / Langsung">Kurir Toko / Antar Langsung</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Resi (Jika Ada)</label>
                                        <input
                                            type="text"
                                            value={formData.resi_pengiriman}
                                            onChange={(e) => setFormData({ ...formData, resi_pengiriman: e.target.value })}
                                            placeholder="Kosongkan jika belum dikirim"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Beban Ongkir Ditanggung</label>
                                        <select
                                            value={formData.biaya_ongkir_ditanggung}
                                            onChange={(e) => setFormData({ ...formData, biaya_ongkir_ditanggung: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="toko">Toko (Layanan Toko)</option>
                                            <option value="distributor">Distributor (Free Return)</option>
                                            <option value="customer">Pelanggan</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCreate}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                >
                                    {isSubmittingCreate ? "Memproses..." : "Terbitkan Pengajuan RMA"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
