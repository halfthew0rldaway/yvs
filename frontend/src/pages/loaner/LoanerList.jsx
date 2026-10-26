import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { 
    Laptop, 
    Plus, 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Wrench, 
    User, 
    Ticket, 
    Calendar, 
    DollarSign, 
    Edit, 
    Trash2, 
    X, 
    ArrowRight, 
    Printer, 
    RotateCcw, 
    ShieldCheck, 
    FileText, 
    MessageCircle,
    Smartphone,
    Monitor,
    Layers
} from "lucide-react";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";
import ConfirmModal from "../../components/ConfirmModal";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

function generateLoanWaLink(customer, loanerDevice, record) {
    if (!customer?.nomor_telepon) return "#";
    let phone = customer.nomor_telepon.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    const text = `Halo Kak ${customer.nama}, kami dari Yangversa Service ingin mengonfirmasi perihal unit pinjaman *[${loanerDevice?.kode_unit}] ${loanerDevice?.nama}* (No. Pinjam: ${record?.nomor_peminjaman || "-"}).\n\nJika ada pertanyaan mengenai unit cadangan atau update progres servis perangkat kakak, silakan hubungi kami ya. Terima kasih!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function LoanerList() {
    const { isAdmin, isTeknisi, user } = useAuth();
    const [searchParams] = useSearchParams();
    
    // Main View Tab: "devices" (Unit Pool) | "records" (Histori & Pinjaman Aktif)
    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "records" ? "records" : "devices");

    // Device Pool States
    const [devices, setDevices] = useState([]);
    const [deviceStats, setDeviceStats] = useState({ total: 0, tersedia: 0, dipinjam: 0, dalam_perawatan: 0 });
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [deviceSearch, setDeviceSearch] = useState("");
    const [deviceStatusFilter, setDeviceStatusFilter] = useState("all");
    const [deviceKategoriFilter, setDeviceKategoriFilter] = useState("all");

    // Loan Records States
    const [records, setRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(true);
    const [recordSearch, setRecordSearch] = useState("");
    const [recordStatusFilter, setRecordStatusFilter] = useState("all"); // "all", "aktif", "dikembalikan"

    // Modals
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [deviceForm, setDeviceForm] = useState({
        kode_unit: "",
        nama: "",
        kategori: "Laptop",
        serial_number: "",
        spesifikasi: "",
        kelengkapan: "Unit + Charger Original + Tas",
        kondisi_fisik: "Mulus / Normal",
        status: "tersedia",
        catatan: ""
    });
    const [isSubmittingDevice, setIsSubmittingDevice] = useState(false);

    // Loan New Modal
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [preselectedDevice, setPreselectedDevice] = useState(null);
    const [activeTickets, setActiveTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loanForm, setLoanForm] = useState({
        loaner_device_id: "",
        tiket_id: "",
        estimasi_kembali: "",
        deposit_uang: "",
        catatan_kondisi_pinjam: "",
        syarat_ketentuan_acc: true
    });
    const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

    // Return Modal
    const [returnTarget, setReturnTarget] = useState(null);
    const [returnForm, setReturnForm] = useState({
        catatan_kondisi_kembali: "Dikembalikan lengkap, fungsi normal & data telah di-reset",
        kondisi_unit_akhir: "tersedia", // "tersedia" | "dalam_perawatan"
        deposit_dikembalikan: true
    });
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

    // Handover Agreement Print Modal
    const [printTarget, setPrintTarget] = useState(null);

    // Delete Device Modal
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchDevices();
        fetchDeviceStats();
    }, [deviceStatusFilter, deviceKategoriFilter]);

    useEffect(() => {
        if (activeTab === "records") {
            fetchRecords();
        }
    }, [activeTab, recordStatusFilter]);

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, deviceSearch, deviceStatusFilter, deviceKategoriFilter, recordSearch, recordStatusFilter]);

    // Handle deep links from TiketServisDetail (e.g. /loaner?action=new&tiket_id=12)
    useEffect(() => {
        const action = searchParams.get("action");
        const tiketId = searchParams.get("tiket_id");
        const tab = searchParams.get("tab");
        const q = searchParams.get("q");

        if (tab === "records") {
            setActiveTab("records");
        }
        if (q) {
            setRecordSearch(q);
        }
        if (action === "new" || tiketId) {
            handleOpenLoanModal(null, tiketId);
        }
    }, [searchParams]);

    async function fetchDevices() {
        setLoadingDevices(true);
        try {
            const params = {};
            if (deviceStatusFilter !== "all") params.status = deviceStatusFilter;
            if (deviceKategoriFilter !== "all") params.kategori = deviceKategoriFilter;
            if (deviceSearch.trim()) params.search = deviceSearch.trim();

            const res = await api.get("/loaner/devices", { params });
            setDevices(res.data || []);
        } catch (err) {
            toast.error("Gagal memuat daftar unit pinjaman");
        } finally {
            setLoadingDevices(false);
        }
    }

    async function fetchDeviceStats() {
        try {
            const res = await api.get("/loaner/devices/stats");
            setDeviceStats(res.data || { total: 0, tersedia: 0, dipinjam: 0, dalam_perawatan: 0 });
        } catch (err) {
            // Keep default
        }
    }

    async function fetchRecords() {
        setLoadingRecords(true);
        try {
            const params = {};
            if (recordStatusFilter !== "all") params.status = recordStatusFilter;
            if (recordSearch.trim()) params.search = recordSearch.trim();

            const res = await api.get("/loaner/records", { params });
            setRecords(res.data || []);
        } catch (err) {
            toast.error("Gagal memuat log peminjaman");
        } finally {
            setLoadingRecords(false);
        }
    }

    async function fetchActiveTickets() {
        setLoadingTickets(true);
        try {
            // Ambil tiket yang aktif berjalan (diterima, didiagnosis, disetujui, dalam_perbaikan)
            const res = await api.get("/tiket-servis?status=aktif&limit=100");
            const list = res.data?.tikets || res.data || [];
            setActiveTickets(list);
        } catch (err) {
            toast.error("Gagal memuat tiket servis aktif");
        } finally {
            setLoadingTickets(false);
        }
    }

    // Filtered lists
    const filteredDevices = devices.filter(d => {
        if (!deviceSearch.trim()) return true;
        const q = deviceSearch.toLowerCase();
        return (
            d.kode_unit.toLowerCase().includes(q) ||
            d.nama.toLowerCase().includes(q) ||
            (d.serial_number && d.serial_number.toLowerCase().includes(q)) ||
            (d.spesifikasi && d.spesifikasi.toLowerCase().includes(q))
        );
    });

    const filteredRecords = records.filter(r => {
        if (!recordSearch.trim()) return true;
        const q = recordSearch.toLowerCase();
        return (
            r.nomor_peminjaman.toLowerCase().includes(q) ||
            r.customer?.nama?.toLowerCase().includes(q) ||
            r.customer?.nomor_telepon?.toLowerCase().includes(q) ||
            r.tiket?.nomor_tiket?.toLowerCase().includes(q) ||
            r.loaner_device?.kode_unit?.toLowerCase().includes(q) ||
            r.loaner_device?.nama?.toLowerCase().includes(q)
        );
    });

    // Handle Device Form
    function handleOpenAddDevice() {
        setEditingDevice(null);
        setDeviceForm({
            kode_unit: `LOAN-${String(devices.length + 1).padStart(2, "0")}`,
            nama: "",
            kategori: "Laptop",
            serial_number: "",
            spesifikasi: "",
            kelengkapan: "Unit + Charger Original + Tas",
            kondisi_fisik: "Mulus / Normal",
            status: "tersedia",
            catatan: ""
        });
        setIsDeviceModalOpen(true);
    }

    function handleOpenEditDevice(d) {
        setEditingDevice(d);
        setDeviceForm({
            kode_unit: d.kode_unit,
            nama: d.nama,
            kategori: d.kategori || "Laptop",
            serial_number: d.serial_number || "",
            spesifikasi: d.spesifikasi || "",
            kelengkapan: d.kelengkapan || "",
            kondisi_fisik: d.kondisi_fisik || "Mulus / Normal",
            status: d.status || "tersedia",
            catatan: d.catatan || ""
        });
        setIsDeviceModalOpen(true);
    }

    async function handleSubmitDevice(e) {
        e.preventDefault();
        setIsSubmittingDevice(true);
        try {
            if (editingDevice) {
                await api.put(`/loaner/devices/${editingDevice.id}`, deviceForm);
                toast.success("Unit cadangan berhasil diperbarui");
            } else {
                await api.post("/loaner/devices", deviceForm);
                toast.success("Unit cadangan baru berhasil ditambahkan");
            }
            setIsDeviceModalOpen(false);
            fetchDevices();
            fetchDeviceStats();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan data unit");
        } finally {
            setIsSubmittingDevice(false);
        }
    }

    async function handleDeleteDevice() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/loaner/devices/${deleteTarget.id}`);
            toast.success("Unit cadangan berhasil dihapus");
            setDeleteTarget(null);
            fetchDevices();
            fetchDeviceStats();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus unit");
        }
    }

    // Handle Loan Form
    function handleOpenLoanModal(device = null, targetTiketId = null) {
        setPreselectedDevice(device);
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + 3); // Default 3 hari ke depan

        setLoanForm({
            loaner_device_id: device ? String(device.id) : (devices.find(d => d.status === "tersedia")?.id || ""),
            tiket_id: targetTiketId ? String(targetTiketId) : "",
            estimasi_kembali: estDate.toISOString().split("T")[0],
            deposit_uang: "0",
            catatan_kondisi_pinjam: device?.kondisi_fisik || "Fungsi normal, OS siap pakai, tidak ada lecet parah",
            syarat_ketentuan_acc: true
        });
        fetchActiveTickets();
        setIsLoanModalOpen(true);
    }

    async function handleSubmitLoan(e) {
        e.preventDefault();
        if (!loanForm.loaner_device_id || !loanForm.tiket_id) {
            toast.error("Pilih unit cadangan dan tiket servis tujuan");
            return;
        }

        setIsSubmittingLoan(true);
        try {
            const res = await api.post("/loaner/records", loanForm);
            toast.success(`Unit berhasil dipinjamkan! No: ${res.data.nomor_peminjaman}`);
            setIsLoanModalOpen(false);
            fetchDevices();
            fetchDeviceStats();
            if (activeTab === "records") fetchRecords();
            // Tawarkan cetak surat perjanjian
            setPrintTarget(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses peminjaman unit");
        } finally {
            setIsSubmittingLoan(false);
        }
    }

    // Handle Return Form
    function handleOpenReturnModal(record) {
        setReturnTarget(record);
        setReturnForm({
            catatan_kondisi_kembali: "Dikembalikan lengkap, fungsi normal & data customer telah di-reset",
            kondisi_unit_akhir: "tersedia",
            deposit_dikembalikan: true
        });
    }

    async function handleSubmitReturn(e) {
        e.preventDefault();
        if (!returnTarget) return;

        setIsSubmittingReturn(true);
        try {
            await api.put(`/loaner/records/${returnTarget.id}/return`, returnForm);
            toast.success("Pengembalian unit pinjaman berhasil dicatat");
            setReturnTarget(null);
            fetchDevices();
            fetchDeviceStats();
            if (activeTab === "records") fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses pengembalian");
        } finally {
            setIsSubmittingReturn(false);
        }
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shadow-2xs">
                            <Laptop className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Unit Pinjaman (Loaner Devices)
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Manajemen inventori laptop/gadget cadangan untuk dipinjamkan ke pelanggan selama servis berjalan
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleOpenAddDevice}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-blue-600" />
                            <span>Tambah Unit Baru</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => handleOpenLoanModal()}
                        disabled={deviceStats.tersedia === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title={deviceStats.tersedia === 0 ? "Tidak ada unit tersedia" : "Pinjamkan unit ke customer"}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Pinjamkan Unit Cadangan</span>
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Pool Unit</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Laptop className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{deviceStats.total} Unit</h3>
                    <p className="text-xs text-slate-500 mt-1">Perangkat siap workshop</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Tersedia di Rak</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-600">{deviceStats.tersedia} Unit</h3>
                    <p className="text-xs text-emerald-600 font-medium mt-1">Siap dipinjamkan segera</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Sedang Dipinjam</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-amber-600">{deviceStats.dipinjam} Unit</h3>
                    <p className="text-xs text-amber-600 font-medium mt-1">Sedang dibawa customer</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Dalam Perawatan</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Wrench className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700">{deviceStats.dalam_perawatan} Unit</h3>
                    <p className="text-xs text-slate-500 mt-1">Maintenance / instalasi OS</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={() => { setActiveTab("devices"); setCurrentPage(1); }}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                            activeTab === "devices"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <Laptop className="w-4 h-4" />
                        <span>Daftar Unit Cadangan ({devices.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setActiveTab("records"); setCurrentPage(1); }}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                            activeTab === "records"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>Log & Riwayat Peminjaman</span>
                        {deviceStats.dipinjam > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-700 rounded-full">
                                {deviceStats.dipinjam} Aktif
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* TAB 1: DEVICE POOL */}
            {activeTab === "devices" && (
                <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari kode unit, model, serial..."
                                value={deviceSearch}
                                onChange={(e) => setDeviceSearch(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            <select
                                value={deviceStatusFilter}
                                onChange={(e) => setDeviceStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="all">Semua Status</option>
                                <option value="tersedia">Tersedia (Ready)</option>
                                <option value="dipinjam">Sedang Dipinjam</option>
                                <option value="dalam_perawatan">Dalam Perawatan</option>
                            </select>

                            <select
                                value={deviceKategoriFilter}
                                onChange={(e) => setDeviceKategoriFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Smartphone">Smartphone</option>
                                <option value="Tablet">Tablet</option>
                                <option value="PC">PC / Desktop</option>
                            </select>
                        </div>
                    </div>

                    {/* Table Devices */}
                    <TableContainer
                        footer={
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredDevices.length / itemsPerPage) || 1}
                                totalItems={filteredDevices.length}
                                pageSize={itemsPerPage}
                                onPageChange={setCurrentPage}
                                unitLabel="unit"
                                disabled={loadingDevices}
                            />
                        }
                    >
                        {loadingDevices ? (
                            <TableLoadingState message="Memuat pool unit pinjaman..." />
                        ) : filteredDevices.length === 0 ? (
                            <TableEmptyState
                                icon={Laptop}
                                title="Tidak Ada Unit Cadangan"
                                description="Belum ada perangkat dalam pool pinjaman. Tambahkan unit cadangan untuk melayani customer VIP / darurat."
                                actionLabel={isAdmin ? "Tambah Unit Cadangan" : undefined}
                                onAction={isAdmin ? handleOpenAddDevice : undefined}
                            />
                        ) : (
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3.5">Kode & Unit</th>
                                        <th className="px-6 py-3.5">Spesifikasi & Kelengkapan</th>
                                        <th className="px-6 py-3.5">Kondisi Fisik</th>
                                        <th className="px-6 py-3.5">Status Peminjaman</th>
                                        <th className="px-6 py-3.5 text-right w-32">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((d) => {
                                        const activeLoan = d.pinjaman?.[0];
                                        return (
                                            <tr 
                                                key={d.id} 
                                                onClick={(e) => {
                                                    if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                                    if (d.status === "tersedia") {
                                                        handleOpenLoanModal(d);
                                                    } else if (d.status === "dipinjam" && activeLoan) {
                                                        handleOpenReturnModal(activeLoan);
                                                    } else if (isAdmin) {
                                                        handleOpenEditDevice(d);
                                                    }
                                                }}
                                                className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                            {d.kategori === "Smartphone" ? (
                                                                <Smartphone className="w-5 h-5 text-slate-600" />
                                                            ) : (
                                                                <Laptop className="w-5 h-5 text-slate-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-extrabold text-xs text-blue-600 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md">
                                                                    {d.kode_unit}
                                                                </span>
                                                                <span className="font-bold text-slate-900">{d.nama}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                {d.kategori} {d.serial_number ? `• SN: ${d.serial_number}` : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <p className="font-medium text-slate-800 text-xs truncate" title={d.spesifikasi || "-"}>
                                                            {d.spesifikasi || "-"}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 truncate mt-0.5" title={d.kelengkapan || "-"}>
                                                            🎒 {d.kelengkapan || "Unit Only"}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                                                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                                        {d.kondisi_fisik || "Normal"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    {d.status === "tersedia" ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Tersedia di Rak
                                                        </span>
                                                    ) : d.status === "dipinjam" ? (
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    Dipinjam ({activeLoan?.customer?.nama || "Pelanggan"})
                                                                </span>
                                                                {activeLoan?.customer?.nomor_telepon && (
                                                                    <a
                                                                        href={generateLoanWaLink(activeLoan.customer, d, activeLoan)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center"
                                                                        title={`Chat WhatsApp (${activeLoan.customer.nomor_telepon})`}
                                                                    >
                                                                        <MessageCircle className="w-3.5 h-3.5" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {activeLoan?.tiket && (
                                                                <Link 
                                                                    to={`/tiket-servis/${activeLoan.tiket.id}`} 
                                                                    className="block text-[11px] font-mono text-blue-600 hover:underline mt-1 font-semibold"
                                                                >
                                                                    Tiket: {activeLoan.tiket.nomor_tiket} →
                                                                </Link>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                            <Wrench className="w-3.5 h-3.5 text-slate-400" />
                                                            Dalam Perawatan
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {d.status === "tersedia" ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenLoanModal(d)}
                                                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                                title="Pinjamkan unit ini"
                                                            >
                                                                Pinjamkan
                                                            </button>
                                                        ) : d.status === "dipinjam" && activeLoan ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenReturnModal(activeLoan)}
                                                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                                title="Catat pengembalian unit"
                                                            >
                                                                Kembalikan
                                                            </button>
                                                        ) : null}

                                                        {isAdmin && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEditDevice(d)}
                                                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                                    title="Edit Data Unit"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeleteTarget(d)}
                                                                    disabled={d.status === "dipinjam"}
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                                                                    title="Hapus Unit"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
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
                </div>
            )}

            {/* TAB 2: LOAN RECORDS */}
            {activeTab === "records" && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nomor pinjam, customer, unit..."
                                value={recordSearch}
                                onChange={(e) => setRecordSearch(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={recordStatusFilter}
                                onChange={(e) => setRecordStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="all">Semua Riwayat</option>
                                <option value="aktif">Sedang Aktif Dipinjam</option>
                                <option value="dikembalikan">Sudah Dikembalikan</option>
                            </select>
                        </div>
                    </div>

                    {/* Table Records */}
                    <TableContainer
                        footer={
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredRecords.length / itemsPerPage) || 1}
                                totalItems={filteredRecords.length}
                                pageSize={itemsPerPage}
                                onPageChange={setCurrentPage}
                                unitLabel="peminjaman"
                                disabled={loadingRecords}
                            />
                        }
                    >
                        {loadingRecords ? (
                            <TableLoadingState message="Memuat histori peminjaman..." />
                        ) : filteredRecords.length === 0 ? (
                            <TableEmptyState
                                icon={FileText}
                                title="Belum Ada Riwayat Peminjaman"
                                description="Belum ada transaksi peminjaman unit cadangan yang tercatat di sistem."
                            />
                        ) : (
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3.5">No. Pinjam & Tanggal</th>
                                        <th className="px-6 py-3.5">Unit Cadangan</th>
                                        <th className="px-6 py-3.5">Pelanggan & Tiket Servis</th>
                                        <th className="px-6 py-3.5">Tenggat & Jaminan</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5 text-right w-28">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((r) => (
                                        <tr 
                                            key={r.id} 
                                            onClick={(e) => {
                                                if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                                setPrintTarget(r);
                                            }}
                                            className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-mono font-bold text-slate-900">{r.nomor_peminjaman}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(r.tanggal_pinjam).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                                        {r.loaner_device?.kode_unit}
                                                    </span>
                                                    <span className="font-semibold text-slate-800">{r.loaner_device?.nama}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{r.loaner_device?.kelengkapan}</p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-slate-900">{r.customer?.nama}</span>
                                                    {r.customer?.nomor_telepon && (
                                                        <a
                                                            href={generateLoanWaLink(r.customer, r.loaner_device, r)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center"
                                                            title={`Chat WhatsApp (${r.customer.nomor_telepon})`}
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Link to={`/tiket-servis/${r.tiket?.id}`} className="text-xs text-blue-600 hover:underline font-mono">
                                                        {r.tiket?.nomor_tiket}
                                                    </Link>
                                                    <span className="text-xs text-slate-400">• {r.tiket?.perangkat?.merek} {r.tiket?.perangkat?.model}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-xs">
                                                <div className="text-slate-800 font-medium">
                                                    {r.estimasi_kembali
                                                        ? `Batas: ${new Date(r.estimasi_kembali).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
                                                        : "Tanpa batas waktu"}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                                                    <span>Deposit: {r.deposit_uang > 0 ? formatRupiah(r.deposit_uang) : "Tanpa Deposit"}</span>
                                                    {r.deposit_uang > 0 && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.deposit_dikembalikan ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {r.deposit_dikembalikan ? 'Dikembalikan' : 'Ditahan'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {r.status === "aktif" ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Sedang Dipinjam
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Telah Kembali
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {r.status === "aktif" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenReturnModal(r)}
                                                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                        >
                                                            Kembalikan
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPrintTarget(r)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                        title="Cetak Surat Perjanjian Peminjaman"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </TableContainer>
                </div>
            )}

            {/* MODAL: TAMBAH / EDIT UNIT CADANGAN */}
            {isDeviceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 text-base">
                                {editingDevice ? "Edit Unit Cadangan" : "Tambah Unit Cadangan Baru"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsDeviceModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitDevice} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kode Unit *</label>
                                    <input
                                        type="text"
                                        required
                                        value={deviceForm.kode_unit}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, kode_unit: e.target.value })}
                                        placeholder="LOAN-01"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Perangkat</label>
                                    <select
                                        value={deviceForm.kategori}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, kategori: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    >
                                        <option value="Laptop">Laptop</option>
                                        <option value="Smartphone">Smartphone</option>
                                        <option value="Tablet">Tablet</option>
                                        <option value="PC">PC / Desktop</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama / Merek & Model *</label>
                                <input
                                    type="text"
                                    required
                                    value={deviceForm.nama}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, nama: e.target.value })}
                                    placeholder="e.g. Lenovo ThinkPad T480 Core i5"
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Seri (Serial Number)</label>
                                    <input
                                        type="text"
                                        value={deviceForm.serial_number}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value })}
                                        placeholder="SN12345678"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Ketersediaan</label>
                                    <select
                                        value={deviceForm.status}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, status: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    >
                                        <option value="tersedia">Tersedia (Ready di Rak)</option>
                                        <option value="dalam_perawatan">Dalam Perawatan / Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Spesifikasi Singkat</label>
                                <input
                                    type="text"
                                    value={deviceForm.spesifikasi}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, spesifikasi: e.target.value })}
                                    placeholder="e.g. Intel Core i5 8th, RAM 16GB, SSD 256GB, Win 11 Pro"
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kelengkapan Bawaan</label>
                                <input
                                    type="text"
                                    value={deviceForm.kelengkapan}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, kelengkapan: e.target.value })}
                                    placeholder="e.g. Unit + Charger Original 65W + Tas YVS"
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi Fisik</label>
                                    <input
                                        type="text"
                                        value={deviceForm.kondisi_fisik}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, kondisi_fisik: e.target.value })}
                                        placeholder="Mulus / Normal"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Internal</label>
                                    <input
                                        type="text"
                                        value={deviceForm.catatan}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, catatan: e.target.value })}
                                        placeholder="Khusus customer VIP"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsDeviceModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDevice}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingDevice ? "Menyimpan..." : "Simpan Unit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: PROSES PEMINJAMAN UNIT */}
            {isLoanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                                    <Laptop className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Peminjaman Unit Cadangan</h3>
                                    <p className="text-xs text-slate-500">Serah terima unit backup untuk customer servis</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLoanModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitLoan} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Unit Cadangan Tersedia *</label>
                                <select
                                    required
                                    value={loanForm.loaner_device_id}
                                    onChange={(e) => setLoanForm({ ...loanForm, loaner_device_id: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                >
                                    <option value="">-- Pilih Unit Cadangan --</option>
                                    {devices
                                        .filter(d => d.status === "tersedia" || (preselectedDevice && d.id === preselectedDevice.id))
                                        .map((d) => (
                                            <option key={d.id} value={d.id}>
                                                [{d.kode_unit}] {d.nama} ({d.kategori})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tiket Servis Customer Tujuan *</label>
                                <select
                                    required
                                    value={loanForm.tiket_id}
                                    onChange={(e) => setLoanForm({ ...loanForm, tiket_id: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                >
                                    <option value="">-- Pilih Tiket Servis Aktif --</option>
                                    {activeTickets.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nomor_tiket} - {t.perangkat?.customer?.nama} ({t.perangkat?.merek} {t.perangkat?.model})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">Hanya menampilkan tiket yang berstatus servis aktif.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Tanggal Kembali</label>
                                    <input
                                        type="date"
                                        value={loanForm.estimasi_kembali}
                                        onChange={(e) => setLoanForm({ ...loanForm, estimasi_kembali: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Uang Deposit / Jaminan (Rp)</label>
                                    <input
                                        type="number"
                                        value={loanForm.deposit_uang}
                                        onChange={(e) => setLoanForm({ ...loanForm, deposit_uang: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kondisi Unit Saat Penyerahan</label>
                                <textarea
                                    rows="2"
                                    value={loanForm.catatan_kondisi_pinjam}
                                    onChange={(e) => setLoanForm({ ...loanForm, catatan_kondisi_pinjam: e.target.value })}
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                                    Ketentuan Serah Terima Unit:
                                </p>
                                <p className="text-[11px] leading-relaxed">
                                    Customer bertanggung jawab penuh atas keamanan fisik dan data unit pinjaman. Unit wajib dikembalikan dalam kondisi normal saat servis unit utama selesai.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsLoanModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingLoan}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingLoan ? "Memproses..." : "Konfirmasi & Serahkan Unit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: PENGEMBALIAN UNIT */}
            {returnTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-amber-600" />
                                <h3 className="font-bold text-slate-900 text-base">Proses Pengembalian Unit</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReturnTarget(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReturn} className="p-6 space-y-4">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Unit:</span>
                                    <span className="font-bold text-slate-900">{returnTarget.loaner_device?.kode_unit} - {returnTarget.loaner_device?.nama}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Peminjam:</span>
                                    <span className="font-semibold text-slate-800">{returnTarget.customer?.nama}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Deposit Masuk:</span>
                                    <span className="font-mono font-bold text-slate-800">{formatRupiah(returnTarget.deposit_uang)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status Kondisi Fisik Akhir</label>
                                <select
                                    value={returnForm.kondisi_unit_akhir}
                                    onChange={(e) => setReturnForm({ ...returnForm, kondisi_unit_akhir: e.target.value })}
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                >
                                    <option value="tersedia">Normal & Lengkap (Siap Dipinjamkan Lagi)</option>
                                    <option value="dalam_perawatan">Ada Kendala / Perlu Servis & Cek Lab</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Pemeriksaan Saat Kembali</label>
                                <textarea
                                    rows="2"
                                    value={returnForm.catatan_kondisi_kembali}
                                    onChange={(e) => setReturnForm({ ...returnForm, catatan_kondisi_kembali: e.target.value })}
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                                />
                            </div>

                            {returnTarget.deposit_uang > 0 && (
                                <label className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={returnForm.deposit_dikembalikan}
                                        onChange={(e) => setReturnForm({ ...returnForm, deposit_dikembalikan: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    <span>Uang deposit sebesar {formatRupiah(returnTarget.deposit_uang)} telah diserahkan kembali ke customer</span>
                                </label>
                            )}

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setReturnTarget(null)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReturn}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingReturn ? "Menyimpan..." : "Selesaikan Pengembalian"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CETAK SURAT PERJANJIAN PINJAM UNIT */}
            {printTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <style>{`
                        @media print {
                            body * { visibility: hidden !important; }
                            #printable-loan-agreement, #printable-loan-agreement * { visibility: visible !important; }
                            #printable-loan-agreement {
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
                                <h3 className="font-bold text-slate-900 text-base">Surat Serah Terima Unit Pinjaman</h3>
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
                            <div id="printable-loan-agreement" className="border border-slate-300 rounded-xl p-6 text-slate-900 text-xs space-y-4">
                                <div className="text-center pb-3 border-b border-slate-200">
                                    <h4 className="font-extrabold text-sm uppercase tracking-wider">YANGVERSA SERVICE (YVS)</h4>
                                    <p className="text-[11px] text-slate-500">Formulir Serah Terima & Perjanjian Unit Cadangan</p>
                                    <p className="font-mono font-bold text-slate-800 text-sm mt-1">{printTarget.nomor_peminjaman}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-slate-500 font-semibold uppercase text-[10px]">Pihak Pertama (Workshop)</p>
                                        <p className="font-bold text-slate-900">Yangversa Service</p>
                                        <p className="text-slate-600">Petugas: {printTarget.created_by_nama || user?.nama}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-semibold uppercase text-[10px]">Pihak Kedua (Pelanggan)</p>
                                        <p className="font-bold text-slate-900">{printTarget.customer?.nama}</p>
                                        <p className="text-slate-600">{printTarget.customer?.nomor_telepon}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Unit Pinjaman:</span>
                                        <span className="font-bold">[{printTarget.loaner_device?.kode_unit}] {printTarget.loaner_device?.nama}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Kelengkapan:</span>
                                        <span>{printTarget.loaner_device?.kelengkapan || "Unit + Charger"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tiket Servis Terkait:</span>
                                        <span className="font-mono font-bold">{printTarget.tiket?.nomor_tiket}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tenggat Pengembalian:</span>
                                        <span className="font-bold text-amber-700">
                                            {printTarget.estimasi_kembali
                                                ? new Date(printTarget.estimasi_kembali).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                                                : "Saat servis unit utama selesai"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Jaminan / Deposit:</span>
                                        <span className="font-mono font-bold">{formatRupiah(printTarget.deposit_uang)}</span>
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-200 pt-2 space-y-1">
                                    <p className="font-bold text-slate-700">Syarat & Ketentuan Peminjaman:</p>
                                    <ol className="list-decimal pl-3 space-y-0.5">
                                        <li>Pihak Kedua wajib menjaga kebersihan dan keutuhan unit yang dipinjamkan.</li>
                                        <li>Kerusakan atau kehilangan akibat kelalaian pemakaian menjadi tanggung jawab Pihak Kedua.</li>
                                        <li>Unit pinjaman wajib dikembalikan selambat-lambatnya saat unit utama yang diservis siap diambil.</li>
                                    </ol>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center pt-4">
                                    <div>
                                        <p className="text-[11px] text-slate-600 mb-10">Petugas Workshop</p>
                                        <p className="font-bold text-xs border-t border-slate-300 pt-1">({printTarget.created_by_nama || user?.nama})</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-600 mb-10">Pelanggan Penerima</p>
                                        <p className="font-bold text-xs border-t border-slate-300 pt-1">({printTarget.customer?.nama})</p>
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
                                    <span>Cetak Surat Perjanjian</span>
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
                    onConfirm={handleDeleteDevice}
                    title="Hapus Unit Cadangan"
                    message={`Apakah Anda yakin ingin menghapus unit [${deleteTarget.kode_unit}] ${deleteTarget.nama} dari daftar pool pinjaman?`}
                    confirmLabel="Hapus Unit"
                    danger
                />
            )}
        </div>
    );
}

