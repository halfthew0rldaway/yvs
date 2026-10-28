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
    Search
} from "lucide-react";

export default function RmaForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [spareparts, setSpareparts] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
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

    const [ticketSearch, setTicketSearch] = useState("");

    useEffect(() => {
        async function loadData() {
            setFetching(true);
            try {
                const [spRes, tktRes] = await Promise.all([
                    api.get("/sparepart"),
                    api.get("/tiket-servis")
                ]);

                const spData = spRes.data || [];
                const tktData = Array.isArray(tktRes.data) ? tktRes.data : (tktRes.data?.data || []);

                setSpareparts(spData);
                setTickets(tktData);

                // Deep links from URL params
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
                        setFormData(prev => ({
                            ...prev,
                            sparepart_id: String(paramSparepartId),
                            supplier_nama: foundSp.distributor_nama || prev.supplier_nama,
                            kebijakan_garansi: foundSp.sistem_perhitungan_garansi || (foundSp.tipe_garansi_distri === "Lifetime" ? "lifetime" : "sejak_nota_customer")
                        }));
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

    // Handle ticket selection
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

            let autoSparepartId = formData.sparepart_id;
            let autoDistri = formData.supplier_nama;
            let autoPolicy = formData.kebijakan_garansi;

            // If ticket used spareparts, auto-suggest first one if none selected
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

    // Handle sparepart selection
    function handleSelectSparepart(spId) {
        const sp = spareparts.find(s => String(s.id) === String(spId));
        setFormData(prev => ({
            ...prev,
            sparepart_id: String(spId),
            supplier_nama: sp?.distributor_nama || prev.supplier_nama || "",
            kebijakan_garansi: sp?.sistem_perhitungan_garansi || (sp?.tipe_garansi_distri === "Lifetime" ? "lifetime" : "sejak_nota_customer")
        }));
    }

    // Submit handler
    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.sparepart_id) {
            toast.error("Pilih suku cadang yang akan diklaim");
            return;
        }
        if (!formData.supplier_nama.trim()) {
            toast.error("Nama supplier / distributor resmi wajib diisi");
            return;
        }
        if (!formData.alasan_rusak.trim()) {
            toast.error("Uraikan gejala kerusakan / defek suku cadang");
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

    // Filter tickets for quick search
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
            
            {/* Header with Back Button */}
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
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Formulir Pengajuan Klaim RMA Distributor
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Garansi Supplier & Retur
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Pencatatan resmi klaim suku cadang rusak, penyesuaian masa garansi nota end-user, serta fasilitas bantu klaim lifetime.
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
                    
                    {/* CARD 1: SUMBER SUKU CADANG */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    1
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Sumber Suku Cadang yang Diajukan Retur
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Pilih apakah suku cadang berasal dari unit komplain servis customer atau cacat stok toko
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sumber Selection Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                            <Laptop className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-slate-900">
                                            Unit Servis Pelanggan
                                        </span>
                                    </div>
                                    {formData.tipe_sumber === "tiket_user" && (
                                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Part dipasang pada laptop/PC customer & ditemukan bermasalah saat masa garansi pengerjaan atau komplain servis.
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
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    formData.tipe_sumber === "stok_toko"
                                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-slate-900">
                                            Stok Inventaris Bengkel / Toko
                                        </span>
                                    </div>
                                    {formData.tipe_sumber === "stok_toko" && (
                                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Cacat pabrik langsung dari etalase / DoA (Dead on Arrival) saat restock baru sebelum terjual ke customer.
                                </p>
                            </div>
                        </div>

                        {/* Detail Bagian Tiket Servis Pelanggan */}
                        {formData.tipe_sumber === "tiket_user" && (
                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                        <span>Pilih Tiket Servis Terkait:</span>
                                        <span className="text-[11px] font-normal text-slate-400">Total {tickets.length} tiket tersedia</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            value={formData.tiket_id}
                                            onChange={(e) => handleSelectTicket(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        >
                                            <option value="">-- Cari / Pilih Nomor Tiket Servis Pelanggan --</option>
                                            {filteredTickets.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    #{t.nomor_tiket} - {t.perangkat?.customer?.nama || "Pelanggan"} ({t.perangkat?.tipe || "Unit"} {t.perangkat?.model || ""})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {currentSelectedTicket && (
                                    <div className="space-y-3 pt-2 border-t border-slate-200/60">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Identitas Pelanggan</span>
                                                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">{currentSelectedTicket.perangkat?.customer?.nama || "-"}</p>
                                                <p className="text-xs text-blue-600 font-mono mt-0.5">{currentSelectedTicket.perangkat?.customer?.no_hp || "-"}</p>
                                            </div>

                                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Unit & Perangkat</span>
                                                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 truncate">{currentSelectedTicket.perangkat?.tipe || "Unit"} {currentSelectedTicket.perangkat?.model || ""}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Status: <strong className="text-slate-800">{currentSelectedTicket.status}</strong></p>
                                            </div>

                                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Tanggal Nota / Pemasangan</span>
                                                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 font-mono">
                                                    {new Date(currentSelectedTicket.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                                <span className="inline-block mt-0.5 text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                                    Day 1 Garansi End-User
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Pick Suku Cadang Terpasang pada Tiket */}
                                        {currentSelectedTicket.penggunaan_sparepart && currentSelectedTicket.penggunaan_sparepart.length > 0 ? (
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>Suku Cadang yang Dipasang pada Tiket Ini (Klik untuk Memilih Cepat):</span>
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">1-Klik isi otomatis</span>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {currentSelectedTicket.penggunaan_sparepart.map((ps, idx) => {
                                                        const isSelected = String(formData.sparepart_id) === String(ps.sparepart?.id);
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => handleSelectSparepart(ps.sparepart?.id)}
                                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                                                    isSelected
                                                                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                                }`}
                                                            >
                                                                <span>{ps.sparepart?.nama}</span>
                                                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                                                                    {ps.jumlah}x
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">
                                                Belum ada suku cadang yang dicatat pada tiket servis ini. Anda dapat memilih part dari katalog di bawah.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* CARD 2: IDENTIFIKASI SUKU CADANG & KEBIJAKAN DISTRIBUTOR */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    2
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Identifikasi Suku Cadang & Kebijakan Distributor
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Pilih suku cadang dari inventaris dan pastikan skenario perhitungan masa garansi sesuai
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Pilih Suku Cadang dari Katalog <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.sparepart_id}
                                    onChange={(e) => handleSelectSparepart(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">-- Pilih Suku Cadang dari Katalog Gudang --</option>
                                    {spareparts.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nama} ({s.brand?.nama || "No Brand"}) {s.has_garansi_distri ? `[Garansi: ${s.tipe_garansi_distri || "Distri"}]` : ""} - Stok: {s.stok}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Jumlah Unit (Qty Klaim) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={formData.jumlah}
                                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Nama Distributor / Vendor Resmi <span className="text-red-500">*</span></span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.supplier_nama}
                                    onChange={(e) => setFormData({ ...formData, supplier_nama: e.target.value })}
                                    placeholder="Contoh: PT Astrindo / Synnex Metrodata / Toko LCD"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Nomor Faktur / Nota Pembelian Awal</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nomor_faktur}
                                    onChange={(e) => setFormData({ ...formData, nomor_faktur: e.target.value })}
                                    placeholder="Contoh: INV-SUPPLIER-2026-001"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Skenario Perhitungan Garansi Distributor (3 Wide Cards) */}
                        <div className="space-y-2 pt-2">
                            <label className="block text-xs font-bold text-slate-700">
                                Skenario Perhitungan Masa Garansi Distributor:
                            </label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { 
                                        key: "sejak_nota_customer", 
                                        badge: "Authorized / Resmi",
                                        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                        title: "Sejak Nota End-User", 
                                        desc: "Day 1 dihitung sejak tanggal nota transaksi toko ke konsumen. Sesuai hukum perlindungan konsumen & garansi distributor resmi dengan grace period toko." 
                                    },
                                    { 
                                        key: "sejak_segel_distri", 
                                        badge: "Distri Independen",
                                        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
                                        title: "Sejak Segel Distributor", 
                                        desc: "Garansi sudah berjalan sejak stiker distributor ditempel (saat toko terima barang). Masa simpan di rak toko otomatis memotong sisa garansi konsumen." 
                                    },
                                    { 
                                        key: "lifetime", 
                                        badge: "Garansi Seumur Hidup",
                                        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
                                        title: "Lifetime Warranty", 
                                        desc: "Khusus RAM & Flash Storage. Selama produk diproduksi vendor & segel utuh, Toko KomputerAwet memfasilitasi dan siap mendampingi klaim ke service center." 
                                    }
                                ].map(pol => {
                                    const isSelected = formData.kebijakan_garansi === pol.key;
                                    return (
                                        <div
                                            key={pol.key}
                                            onClick={() => setFormData({ ...formData, kebijakan_garansi: pol.key })}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                isSelected
                                                    ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${pol.badgeColor}`}>
                                                    {pol.badge}
                                                </span>
                                                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                            </div>
                                            <h4 className="font-bold text-xs text-slate-900 mb-1">{pol.title}</h4>
                                            <p className="text-[11px] text-slate-500 leading-snug">{pol.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Callout Penjelasan Kebijakan */}
                        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="font-bold">
                                    {formData.kebijakan_garansi === "lifetime" 
                                        ? "Dukungan Penuh: Lifetime Warranty Assistance"
                                        : formData.kebijakan_garansi === "sejak_nota_customer"
                                        ? "Perhitungan Garansi Resmi Sejak Nota Penjualan ke Konsumen"
                                        : "Peringatan Selisih Bulan: Segel Stiker Distributor Independen"}
                                </p>
                                <p className="text-[11.5px] text-blue-800 leading-relaxed">
                                    {formData.kebijakan_garansi === "lifetime"
                                        ? "Suku cadang RAM / Flash Memory yang dibeli di kita didampingi penuh. Toko siap memfasilitasi penukaran retur ke service center resmi distributor selama segel utuh dan model didukung vendor."
                                        : formData.kebijakan_garansi === "sejak_nota_customer"
                                        ? `Berdasarkan nota pemasangan/servis pelanggan (${formData.tgl_penjualan_customer || "hari transaksi"}), hak garansi konsumen terlindungi penuh dengan bukti faktur toko.`
                                        : "Garansi telah terpotong masa simpan di toko. Pastikan stiker segel distributor pada unit fisik belum melebihi masa berlaku garansi."}
                                </p>
                            </div>
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
                                        Identifikasi Hardware & Gejala Kerusakan
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Catat nomor seri unit lama yang diklaim dan detail gejala kerusakan teknis
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>Serial Number (SN) Unit yang Rusak / Dikirim ke Distributor:</span>
                                <span className="text-[11px] text-slate-400">Penting untuk tracking unit retur</span>
                            </label>
                            <input
                                type="text"
                                value={formData.serial_number_lama}
                                onChange={(e) => setFormData({ ...formData, serial_number_lama: e.target.value })}
                                placeholder="Contoh: SN: KVR32S22S8/8-202410-0988 / SN: NVME-512-998231"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Nomor seri ini akan dicetak pada Surat Jalan Pengantar Retur agar pihak distributor tidak salah menukar unit.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Uraian Gejala Kerusakan / Defek Teknis <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={4}
                                required
                                value={formData.alasan_rusak}
                                onChange={(e) => setFormData({ ...formData, alasan_rusak: e.target.value })}
                                placeholder="Contoh: Layar LCD muncul garis vertikal merah tipis setelah 2 hari dipasang ke laptop pelanggan. Atau: Modul RAM menyebabkan crash blue screen (MEMORY_MANAGEMENT) saat ditest MemTest86 di slot 1."
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                </div>

                {/* RIGHT / SIDEBAR COLUMN (4 Columns) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* CARD 4: CEKLIS VERIFIKASI FISIK & BANTUAN KLAIM */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Verifikasi Kelayakan Klaim
                            </h3>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.kondisi_fisik_valid}
                                    onChange={(e) => setFormData({ ...formData, kondisi_fisik_valid: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded mt-0.5 shrink-0"
                                />
                                <div className="text-xs">
                                    <span className="font-bold text-slate-900 block">Kondisi Fisik Bebas Void</span>
                                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                                        Segel stiker/hologram distributor utuh, tidak ada cacat bakar, somplak, atau korosi cairan.
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.bantuan_klaim_toko}
                                    onChange={(e) => setFormData({ ...formData, bantuan_klaim_toko: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded mt-0.5 shrink-0"
                                />
                                <div className="text-xs">
                                    <span className="font-bold text-slate-900 block">Fasilitasi 'Bantu Klaim' Toko</span>
                                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                                        Komitmen layanan toko menjembatani retur pelanggan ke vendor resmi tanpa lepas tangan.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* CARD 5: LOGISTIK & EKSPEDISI PENGIRIMAN */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Logistik Pengiriman ke Vendor
                            </h3>
                        </div>

                        <div className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Kurir / Ekspedisi Pengiriman
                                </label>
                                <select
                                    value={formData.kurir_pengiriman}
                                    onChange={(e) => setFormData({ ...formData, kurir_pengiriman: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="JNE">JNE</option>
                                    <option value="J&T Express">J&T Express</option>
                                    <option value="SiCepat">SiCepat</option>
                                    <option value="Kurir Toko / Langsung">Kurir Toko / Antar Langsung</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nomor Resi Pelacakan
                                </label>
                                <input
                                    type="text"
                                    value={formData.resi_pengiriman}
                                    onChange={(e) => setFormData({ ...formData, resi_pengiriman: e.target.value })}
                                    placeholder="Kosongkan jika belum dikirim"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Beban Biaya Ongkir Ditanggung:
                                </label>
                                <select
                                    value={formData.biaya_ongkir_ditanggung}
                                    onChange={(e) => setFormData({ ...formData, biaya_ongkir_ditanggung: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="toko">Toko (Komitmen Garansi Servis)</option>
                                    <option value="distributor">Distributor (Free Return)</option>
                                    <option value="customer">Pelanggan</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* CARD 6: ACTION & SUMMARY */}
                    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Ringkasan Pengajuan Klaim
                            </h3>
                            <p className="text-sm font-bold text-white mt-1">
                                {currentSelectedSparepart?.nama || "Pilih suku cadang"}
                            </p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                Qty: {formData.jumlah} unit | {formData.tipe_sumber === "tiket_user" ? `Dari Tiket #${formData.tiket_id || '-'}` : "Stok Toko"}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Distributor:</span>
                                <span className="font-semibold text-white">{formData.supplier_nama || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Kebijakan:</span>
                                <span className="font-semibold text-blue-300">
                                    {formData.kebijakan_garansi === "lifetime" ? "Lifetime Warranty" : formData.kebijakan_garansi === "sejak_segel_distri" ? "Segel Distri" : "Nota End-User"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{submitting ? "Menerbitkan Klaim..." : "Terbitkan Pengajuan RMA"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/rma")}
                                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
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

