import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { 
    ArrowLeft, 
    Save, 
    RotateCcw, 
    Layers, 
    Laptop, 
    Package, 
    Building2, 
    ShieldCheck, 
    Truck, 
    Sparkles, 
    Check, 
    X, 
    Clock, 
    DollarSign, 
    User, 
    Phone, 
    AlertTriangle,
    FileText,
    HelpCircle,
    Search,
    ShoppingBag,
    CheckCircle2,
    Calendar,
    Wrench,
    ExternalLink
} from "lucide-react";

export default function RmaForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [spareparts, setSpareparts] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        tipe_sumber: "tiket_user", // "tiket_user" | "retail_customer" | "stok_toko"
        tiket_id: "",
        customer_nama: "",
        customer_kontak: "",
        perangkat_nama: "",
        tgl_penjualan_customer: "",
        sparepart_id: "",
        supplier_id: "",
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

    const [ticketSearch, setTicketSearch] = useState("");
    const [sparepartSearch, setSparepartSearch] = useState("");

    useEffect(() => {
        async function loadData() {
            setFetching(true);
            try {
                const [spRes, tktRes, supRes] = await Promise.all([
                    api.get("/sparepart"),
                    api.get("/tiket-servis"),
                    api.get("/supplier").catch(() => ({ data: { data: [] } }))
                ]);

                const spData = spRes.data || [];
                const tktData = Array.isArray(tktRes.data) ? tktRes.data : (tktRes.data?.data || []);
                const supData = supRes.data?.data || [];

                setSpareparts(spData);
                setTickets(tktData);
                setSuppliers(supData);

                // Deep links from URL params (e.g. ?tiket_id=5&sparepart_id=12)
                const paramTicketId = searchParams.get("tiket_id");
                const paramSparepartId = searchParams.get("sparepart_id");

                if (paramTicketId) {
                    const foundT = tktData.find(t => String(t.id) === String(paramTicketId));
                    if (foundT) {
                        const custName = foundT.perangkat?.customer?.nama || "";
                        const custHp = foundT.perangkat?.customer?.no_hp || "";
                        const deviceName = `${foundT.perangkat?.tipe || "Unit"} ${foundT.perangkat?.model || ""}`.trim();
                        const tglJual = foundT.created_at ? new Date(foundT.created_at).toISOString().split("T")[0] : "";

                        setFormData(prev => ({
                            ...prev,
                            tipe_sumber: "tiket_user",
                            tiket_id: String(paramTicketId),
                            customer_nama: custName,
                            customer_kontak: custHp,
                            perangkat_nama: deviceName,
                            tgl_penjualan_customer: tglJual
                        }));
                    }
                }

                if (paramSparepartId) {
                    const foundSp = spData.find(s => String(s.id) === String(paramSparepartId));
                    if (foundSp) {
                        applySparepartAutoDetect(foundSp);
                    }
                }
            } catch (err) {
                toast.error("Gagal memuat data referensi");
            } finally {
                setFetching(false);
            }
        }

        loadData();
    }, [searchParams]);

    // Auto-detect & lock supplier and warranty details from sparepart data
    function applySparepartAutoDetect(sp) {
        if (!sp) return;

        const distriName = sp.supplier?.nama || sp.distributor_nama || "Distributor Resmi";
        const distriContact = sp.supplier?.telepon || sp.distributor_kontak || "";
        const policy = sp.sistem_perhitungan_garansi || (sp.tipe_garansi_distri === "Lifetime" ? "lifetime" : "sejak_nota_customer");

        setFormData(prev => ({
            ...prev,
            sparepart_id: String(sp.id),
            supplier_id: sp.supplier_id ? String(sp.supplier_id) : (sp.supplier?.id ? String(sp.supplier.id) : ""),
            supplier_nama: distriName,
            kebijakan_garansi: policy
        }));

        toast.success(`Suku cadang "${sp.nama}" dipilih! Data distributor & garansi terdeteksi otomatis.`, { id: "sp-detect" });
    }

    // Handle ticket selection
    function handleSelectTicket(tiketId) {
        if (!tiketId) {
            setFormData(prev => ({
                ...prev,
                tiket_id: "",
                customer_nama: "",
                customer_kontak: "",
                perangkat_nama: "",
                tgl_penjualan_customer: "",
                sparepart_id: "",
                supplier_nama: "",
                serial_number_lama: ""
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
            const installedParts = found.penggunaan_sparepart || [];
            let autoSp = null;
            let autoSn = "";

            if (installedParts.length > 0) {
                const firstUsage = installedParts[0];
                autoSp = firstUsage.sparepart;
                autoSn = firstUsage.serial_number || "";
            }

            setFormData(prev => {
                const next = {
                    ...prev,
                    tipe_sumber: "tiket_user",
                    tiket_id: String(tiketId),
                    customer_nama: custName,
                    customer_kontak: custHp,
                    perangkat_nama: deviceName,
                    tgl_penjualan_customer: tglJual,
                    serial_number_lama: autoSn || prev.serial_number_lama
                };

                if (autoSp) {
                    next.sparepart_id = String(autoSp.id);
                    next.supplier_id = autoSp.supplier_id ? String(autoSp.supplier_id) : "";
                    next.supplier_nama = autoSp.supplier?.nama || autoSp.distributor_nama || "Distributor Resmi";
                    next.kebijakan_garansi = autoSp.sistem_perhitungan_garansi || (autoSp.tipe_garansi_distri === "Lifetime" ? "lifetime" : "sejak_nota_customer");
                }

                return next;
            });

            if (autoSp) {
                toast.success(`Tiket #${found.nomor_tiket} dipilih! Mendeteksi suku cadang terpasang: ${autoSp.nama}`, { id: "ticket-detect" });
            }
        }
    }

    // Submit handler
    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.sparepart_id) {
            toast.error("Pilih suku cadang yang akan diklaim!");
            return;
        }
        if (!formData.supplier_nama.trim()) {
            toast.error("Nama supplier / distributor resmi wajib terisi!");
            return;
        }
        if (!formData.alasan_rusak.trim()) {
            toast.error("Uraikan gejala kerusakan / trouble hardware yang terjadi!");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post("/rma", formData);
            toast.success(`Klaim RMA ${res.data.nomor_rma} berhasil diterbitkan!`);
            navigate("/rma");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengajukan RMA");
        } finally {
            setSubmitting(false);
        }
    }

    const currentSelectedTicket = formData.tiket_id 
        ? tickets.find(t => String(t.id) === String(formData.tiket_id)) 
        : null;

    const currentSelectedSparepart = formData.sparepart_id 
        ? spareparts.find(s => String(s.id) === String(formData.sparepart_id)) 
        : null;

    // Filter tickets that actually have spareparts installed (prioritized for RMA)
    const ticketsWithParts = tickets.filter(t => t.penggunaan_sparepart && t.penggunaan_sparepart.length > 0);
    const ticketsWithoutParts = tickets.filter(t => !t.penggunaan_sparepart || t.penggunaan_sparepart.length === 0);

    const filteredTickets = tickets.filter(t => {
        if (!ticketSearch.trim()) return true;
        const q = ticketSearch.toLowerCase();
        return (
            t.nomor_tiket?.toLowerCase().includes(q) ||
            t.perangkat?.customer?.nama?.toLowerCase().includes(q) ||
            t.perangkat?.customer?.no_hp?.toLowerCase().includes(q) ||
            t.perangkat?.model?.toLowerCase().includes(q)
        );
    });

    const filteredSpareparts = spareparts.filter(s => {
        if (!sparepartSearch.trim()) return true;
        const q = sparepartSearch.toLowerCase();
        return (
            s.nama?.toLowerCase().includes(q) ||
            s.kategori?.toLowerCase().includes(q) ||
            s.distributor_nama?.toLowerCase().includes(q) ||
            s.brand?.nama?.toLowerCase().includes(q)
        );
    });

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-xs text-slate-500">Memuat formulir pengajuan RMA...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-16">
            
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <button
                        type="button"
                        onClick={() => navigate("/rma")}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Kembali ke Daftar RMA"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Formulir Pengajuan Klaim RMA Distributor
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Auto-Detect Distributor
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Auto-detect suku cadang dari tiket servis, pencatatan nota end-user, serta fasilitas bantu klaim distributor resmi.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/rma")}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{submitting ? "Memproses..." : "Terbitkan Klaim RMA"}</span>
                    </button>
                </div>
            </div>

            {/* Form Container - Wide Edge to Edge 12-Column Grid */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT / MAIN COLUMN (8 Columns) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* CARD 1: 3 KATEGORI SUMBER KLAIM */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    1
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Sumber & Asal-Usul Suku Cadang yang Diklaim
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Pilih apakah sparepart dipasang pada tiket servis, dibeli lepas oleh konsumen, atau stok inventaris toko
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3 Sumber Selection Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            
                            {/* Kategori 1: Unit Servis Pelanggan */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, tipe_sumber: "tiket_user" }))}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    formData.tipe_sumber === "tiket_user"
                                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                            <Laptop className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-slate-900">
                                            Tiket Servis User
                                        </span>
                                    </div>
                                    {formData.tipe_sumber === "tiket_user" && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    )}
                                </div>
                                <p className="text-2xs text-slate-500 leading-snug">
                                    Sparepart dipasang teknisi pada laptop/PC customer saat servis (RAM, SSD, LCD). <strong>Auto-detect tiket & part!</strong>
                                </p>
                            </div>

                            {/* Kategori 2: Pembelian Langsung Konsumen (Retail) */}
                            <div
                                onClick={() => setFormData(prev => ({ 
                                    ...prev, 
                                    tipe_sumber: "retail_customer",
                                    tiket_id: ""
                                }))}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    formData.tipe_sumber === "retail_customer"
                                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <ShoppingBag className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-slate-900">
                                            Beli Langsung / Retail
                                        </span>
                                    </div>
                                    {formData.tipe_sumber === "retail_customer" && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    )}
                                </div>
                                <p className="text-2xs text-slate-500 leading-snug">
                                    Customer beli sparepart lepas tanpa servis unit (misal beli charger / RAM sendiri), dengan nota toko.
                                </p>
                            </div>

                            {/* Kategori 3: Stok Toko / Dead on Arrival */}
                            <div
                                onClick={() => setFormData(prev => ({ 
                                    ...prev, 
                                    tipe_sumber: "stok_toko",
                                    tiket_id: "",
                                    customer_nama: "",
                                    customer_kontak: "",
                                    perangkat_nama: ""
                                }))}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    formData.tipe_sumber === "stok_toko"
                                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-slate-900">
                                            Stok Gudang Toko
                                        </span>
                                    </div>
                                    {formData.tipe_sumber === "stok_toko" && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    )}
                                </div>
                                <p className="text-2xs text-slate-500 leading-snug">
                                    Cacat pabrik langsung saat baru datang dari distributor (DoA) atau rusak di rak toko sebelum terjual.
                                </p>
                            </div>

                        </div>

                        {/* CASE 1: TIKET SERVIS USER (AUTO DETECT) */}
                        {formData.tipe_sumber === "tiket_user" && (
                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Search className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Pilih Tiket Servis Customer:</span>
                                        </span>
                                        <span className="text-2xs font-semibold text-blue-600">
                                            {ticketsWithParts.length} tiket memiliki riwayat sparepart
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            value={formData.tiket_id}
                                            onChange={(e) => handleSelectTicket(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        >
                                            <option value="">-- Pilih Tiket Servis (Diurutkan dari yang memakai sparepart) --</option>
                                            <optgroup label="Tiket Servis Dengan Sparepart Terpasang">
                                                {ticketsWithParts.map(t => {
                                                    const partNames = t.penggunaan_sparepart.map(ps => ps.sparepart?.nama).filter(Boolean).join(", ");
                                                    return (
                                                        <option key={t.id} value={t.id}>
                                                            #{t.nomor_tiket} - {t.perangkat?.customer?.nama || "Pelanggan"} ({t.perangkat?.tipe || "Unit"} {t.perangkat?.model || ""}) • Part: [{partNames}]
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                            <optgroup label="Tiket Servis Lainnya (Jasa / Tanpa Part)">
                                                {ticketsWithoutParts.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        #{t.nomor_tiket} - {t.perangkat?.customer?.nama || "Pelanggan"} ({t.perangkat?.tipe || "Unit"} {t.perangkat?.model || ""})
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>

                                {currentSelectedTicket && (
                                    <div className="space-y-4 pt-2 border-t border-slate-200/60">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                <span className="text-3xs text-slate-400 font-bold uppercase block tracking-wider">Identitas Pelanggan</span>
                                                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">{currentSelectedTicket.perangkat?.customer?.nama || "-"}</p>
                                                <p className="text-xs text-blue-600 font-mono mt-0.5">{currentSelectedTicket.perangkat?.customer?.no_hp || "-"}</p>
                                            </div>

                                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                <span className="text-3xs text-slate-400 font-bold uppercase block tracking-wider">Unit & Perangkat</span>
                                                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 truncate">{currentSelectedTicket.perangkat?.tipe || "Unit"} {currentSelectedTicket.perangkat?.model || ""}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Status: <strong className="text-slate-800">{currentSelectedTicket.status}</strong></p>
                                            </div>

                                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                <span className="text-3xs text-slate-400 font-bold uppercase block tracking-wider">Tanggal Nota / Pengerjaan</span>
                                                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                                                    {currentSelectedTicket.created_at ? new Date(currentSelectedTicket.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                                                </p>
                                                <span className="inline-block text-3xs text-emerald-600 font-bold mt-0.5 bg-emerald-50 px-1.5 py-0.2 rounded">
                                                    Day 1 Garansi Konsumen
                                                </span>
                                            </div>
                                        </div>

                                        {/* AUTO-DETECTED INSTALLED SPAREPARTS */}
                                        {currentSelectedTicket.penggunaan_sparepart && currentSelectedTicket.penggunaan_sparepart.length > 0 ? (
                                            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>Suku Cadang yang Terpasang pada Tiket Ini (Klik untuk Klaim):</span>
                                                    </span>
                                                    <span className="text-2xs text-blue-700 font-semibold">1-Klik Auto-Detect</span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                    {currentSelectedTicket.penggunaan_sparepart.map((ps) => {
                                                        const isSelected = String(formData.sparepart_id) === String(ps.sparepart_id);
                                                        return (
                                                            <button
                                                                key={ps.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (ps.sparepart) {
                                                                        applySparepartAutoDetect(ps.sparepart);
                                                                        if (ps.serial_number) {
                                                                            setFormData(prev => ({ ...prev, serial_number_lama: ps.serial_number }));
                                                                        }
                                                                    }
                                                                }}
                                                                className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                                                                    isSelected
                                                                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                                        : "bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
                                                                }`}
                                                            >
                                                                <div>
                                                                    <div className="font-bold text-xs">
                                                                        {ps.sparepart?.nama || "Suku Cadang"}
                                                                    </div>
                                                                    <div className={`text-2xs mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                                                                        Distri: {ps.sparepart?.distributor_nama || "Resmi"} • {ps.sparepart?.tipe_garansi_distri || "Garansi"}
                                                                    </div>
                                                                    {ps.serial_number && (
                                                                        <div className={`text-2xs font-mono mt-0.5 ${isSelected ? "text-blue-200" : "text-blue-600 font-semibold"}`}>
                                                                            SN: {ps.serial_number}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {isSelected && <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                                                Tiket ini belum memiliki catatan suku cadang terpasang di sistem. Silakan pilih suku cadang secara manual di bawah.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CASE 2: PEMBELIAN LANGSUNG PELANGGAN (RETAIL) */}
                        {formData.tipe_sumber === "retail_customer" && (
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3 animate-fade-in">
                                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                    <span>Identitas Pembelian Konsumen (Nota Penjualan Toko)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Nama Customer
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Hendra Wijaya"
                                            value={formData.customer_nama}
                                            onChange={(e) => setFormData(prev => ({ ...prev, customer_nama: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            No. WhatsApp Customer
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="0812-3456-7890"
                                            value={formData.customer_kontak}
                                            onChange={(e) => setFormData(prev => ({ ...prev, customer_kontak: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Nomor Nota / Faktur Toko
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: INV-2026-0045"
                                            value={formData.nomor_faktur}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nomor_faktur: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* CARD 2: AUTO-DETECT SUKU CADANG & DISTRIBUTOR */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    2
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Identifikasi Suku Cadang & Status Garansi Distributor
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Data distributor, kontak RMA, dan skenario garansi terdeteksi otomatis dari master katalog suku cadang
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Dropdown Suku Cadang */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                    <span>Pilih Suku Cadang yang Mengalami Defek <span className="text-rose-500">*</span></span>
                                    <span className="text-2xs font-normal text-slate-400">Total {spareparts.length} item katalog</span>
                                </label>
                                <select
                                    value={formData.sparepart_id}
                                    onChange={(e) => {
                                        const foundSp = spareparts.find(s => String(s.id) === String(e.target.value));
                                        if (foundSp) {
                                            applySparepartAutoDetect(foundSp);
                                        } else {
                                            setFormData(prev => ({ ...prev, sparepart_id: "" }));
                                        }
                                    }}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">-- Cari & Pilih Suku Cadang --</option>
                                    {spareparts.map((sp) => (
                                        <option key={sp.id} value={sp.id}>
                                            {sp.brand?.nama || ""} {sp.nama} ({sp.kategori}) • Distri: {sp.distributor_nama || "Resmi"} ({sp.tipe_garansi_distri || "Garansi"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* PROMINENT AUTO-DETECTED BANNER */}
                            {currentSelectedSparepart ? (
                                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                                                    Data Distributor & Garansi Terdeteksi Otomatis
                                                </h4>
                                                <p className="text-2xs text-emerald-700">
                                                    Anda tidak perlu input ulang informasi distributor atau skenario garansi.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-2xs font-bold bg-emerald-200/60 text-emerald-900 px-2.5 py-0.5 rounded-full">
                                            Master Sync Valid
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                                        <div className="bg-white p-3 rounded-xl border border-emerald-100">
                                            <span className="text-3xs text-slate-400 font-bold uppercase block tracking-wider">Distributor Resmi</span>
                                            <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                                                {currentSelectedSparepart.distributor_nama || formData.supplier_nama || "Distributor Resmi"}
                                            </p>
                                            {currentSelectedSparepart.distributor_kontak && (
                                                <p className="text-2xs text-blue-600 font-mono mt-0.5 truncate">
                                                    {currentSelectedSparepart.distributor_kontak}
                                                </p>
                                            )}
                                        </div>

                                        <div className="bg-white p-3 rounded-xl border border-emerald-100">
                                            <span className="text-3xs text-slate-400 font-bold uppercase block tracking-wider">Status & Durasi Garansi</span>
                                            <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                                                {currentSelectedSparepart.tipe_garansi_distri || "Garansi Distributor"}
                                            </p>
                                            <p className="text-2xs text-emerald-700 font-semibold mt-0.5">
                                                {formData.kebijakan_garansi === "lifetime" ? "Lifetime Warranty (RAM)" : "Garansi Pabrik Resmi"}
                                            </p>
                                        </div>

                                        <div className="bg-white p-3 rounded-xl border border-emerald-100">
                                            <span className="text-3xs text-slate-400 font-bold uppercase block tracking-wider">Skenario Perhitungan</span>
                                            <p className="font-bold text-blue-700 text-xs sm:text-sm mt-0.5">
                                                {formData.kebijakan_garansi === "lifetime" ? "Seumur Hidup (Lifetime)" : formData.kebijakan_garansi === "sejak_segel_distri" ? "Sejak Segel Distri" : "Sejak Nota End-User"}
                                            </p>
                                            <p className="text-2xs text-slate-400 mt-0.5">
                                                {formData.kebijakan_garansi === "sejak_nota_customer" ? "Day 1 dimulai saat nota jual customer" : "Mengikuti stiker/segel distributor"}
                                            </p>
                                        </div>
                                    </div>

                                    {currentSelectedSparepart.kebijakan_klaim && (
                                        <div className="text-2xs text-emerald-900 bg-white/80 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
                                            <strong>Prosedur / Ketentuan Retur Distributor:</strong> {currentSelectedSparepart.kebijakan_klaim}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                    Silakan pilih salah satu suku cadang di atas untuk memicu auto-detect data distributor & kebijakan garansi.
                                </div>
                            )}

                        </div>
                    </div>

                    {/* CARD 3: IDENTIFIKASI HARDWARE & GEJALA KERUSAKAN */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    3
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Identifikasi Hardware & Gejala Kerusakan Teknis
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Fokus teknisi: Catat Serial Number (SN) fisik unit rusak dan rincian masalah teknis
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Serial Number (SN) Fisik Unit Rusak <span className="text-rose-500">*</span></span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: SN: KG-98214-X / SN pada stiker barcode"
                                        value={formData.serial_number_lama}
                                        onChange={(e) => setFormData(prev => ({ ...prev, serial_number_lama: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <p className="text-2xs text-slate-400 mt-1">
                                        Nomor seri yang tertera pada badan IC / barcode komponen fisik untuk verifikasi distributor.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Jumlah Unit yang Diklaim (Qty)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.jumlah}
                                        onChange={(e) => setFormData(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Detail Kerusakan */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Gejala Kerusakan Teknis / Defek <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Uraikan detail kerusakan secara teknis. Contoh:&#10;• RAM bluescreen WHEA_UNCORRECTABLE_ERROR saat running benchmark 3DMark.&#10;• SSD freeze total dan hilang dari boot list BIOS setelah suhu kerja 15 menit.&#10;• LCD muncul garis putih vertikal di sisi kanan panel..."
                                    value={formData.alasan_rusak}
                                    onChange={(e) => setFormData(prev => ({ ...prev, alasan_rusak: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-medium"
                                    required
                                />
                            </div>

                            {/* Checklist Kondisi Fisik & Fasilitas Bantu Klaim */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <label className="flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.kondisi_fisik_valid}
                                        onChange={(e) => setFormData(prev => ({ ...prev, kondisi_fisik_valid: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 mt-0.5 focus:ring-blue-500"
                                    />
                                    <div className="text-xs">
                                        <span className="font-bold text-slate-800 block">Kondisi Fisik Lolos Syarat Garansi</span>
                                        <span className="text-slate-500 text-2xs leading-snug">
                                            Segel distributor utuh, tidak ada pin patah, tidak ada korosi cairan, dan tidak gosong/terbakar.
                                        </span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.bantuan_klaim_toko}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bantuan_klaim_toko: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 mt-0.5 focus:ring-blue-500"
                                    />
                                    <div className="text-xs">
                                        <span className="font-bold text-slate-800 block">Fasilitas Bantu Klaim Toko</span>
                                        <span className="text-slate-500 text-2xs leading-snug">
                                            Toko menjembatani komunikasi ke distributor menggunakan faktur toko untuk melindungi hak garansi pelanggan.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>

                    </div>

                </div>

                {/* RIGHT / SIDE COLUMN (4 Columns Sticky) */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
                    
                    {/* CARD 4: LOGISTIK EKSPEDISI & PENGIRIMAN */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <Truck className="w-4 h-4 text-blue-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Logistik Pengiriman Ekspedisi
                            </h3>
                        </div>

                        <div className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Kurir Ekspedisi / Drop Point
                                </label>
                                <select
                                    value={formData.kurir_pengiriman}
                                    onChange={(e) => setFormData(prev => ({ ...prev, kurir_pengiriman: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="JNE">JNE Express</option>
                                    <option value="J&T">J&T Express</option>
                                    <option value="SiCepat">SiCepat</option>
                                    <option value="TiKi">TiKi</option>
                                    <option value="Lion Parcel">Lion Parcel</option>
                                    <option value="Antar Langsung">Antar Langsung ke Service Center</option>
                                    <option value="Lainnya">Lainnya / Titip Kurir Toko</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nomor Resi Pengiriman (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: JNE8822001199"
                                    value={formData.resi_pengiriman}
                                    onChange={(e) => setFormData(prev => ({ ...prev, resi_pengiriman: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Ongkir (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.ongkir}
                                        onChange={(e) => setFormData(prev => ({ ...prev, ongkir: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Penanggung Ongkir
                                    </label>
                                    <select
                                        value={formData.biaya_ongkir_ditanggung}
                                        onChange={(e) => setFormData(prev => ({ ...prev, biaya_ongkir_ditanggung: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="toko">Toko</option>
                                        <option value="distributor">Distributor</option>
                                        <option value="customer">Customer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 5: RINGKASAN & ACTION CTA */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Ringkasan Pengajuan Klaim RMA
                            </h3>
                            <p className="text-sm font-bold text-slate-900 mt-1">
                                {currentSelectedSparepart?.nama || "Pilih suku cadang"}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                Qty: {formData.jumlah} unit | {
                                    formData.tipe_sumber === "tiket_user" 
                                        ? `Tiket #${formData.tiket_id || '-'}` 
                                        : formData.tipe_sumber === "retail_customer" 
                                        ? "Retail / Beli Lepas" 
                                        : "Stok Toko"
                                }
                            </p>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Distributor:</span>
                                <span className="font-semibold text-slate-900 truncate max-w-[170px]">{formData.supplier_nama || "-"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">SN Fisik:</span>
                                {formData.serial_number_lama ? (
                                    <span className="font-mono text-slate-900 font-bold truncate max-w-[170px]">{formData.serial_number_lama}</span>
                                ) : (
                                    <span className="font-sans text-2xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">Belum diisi</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Kebijakan:</span>
                                <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                                    {formData.kebijakan_garansi === "lifetime" ? "Lifetime Warranty" : formData.kebijakan_garansi === "sejak_segel_distri" ? "Segel Distri" : "Nota End-User"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{submitting ? "Menerbitkan Klaim..." : "Terbitkan Pengajuan RMA"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/rma")}
                                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                        </div>
                    </div>

                </div>

            </form>
        </div>
    );
}
