import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
    HeartHandshake, 
    Calendar, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    Copy, 
    Check, 
    MessageCircle, 
    ExternalLink, 
    Search, 
    Filter, 
    Laptop, 
    User, 
    Phone, 
    ShieldAlert, 
    ShieldCheck, 
    RefreshCw, 
    ChevronRight, 
    AlertTriangle, 
    Tag, 
    PackageCheck, 
    Inbox,
    Sparkles,
    ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

// Mapping tipe kepribadian ke nuansa warna & instruksi tone
const PERSONALITY_MAP = {
    Koleris: {
        label: "Koleris",
        desc: "Tegas & To The Point",
        badge: "bg-rose-50 text-rose-700 border-rose-200",
        btnActive: "bg-rose-600 text-white border-rose-600"
    },
    Sanguinis: {
        label: "Sanguinis",
        desc: "Ramah & Antusias",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        btnActive: "bg-amber-600 text-white border-amber-600"
    },
    Melankolis: {
        label: "Melankolis",
        desc: "Rinci & Data Teknis",
        badge: "bg-purple-50 text-purple-700 border-purple-200",
        btnActive: "bg-purple-600 text-white border-purple-600"
    },
    Plegmatis: {
        label: "Plegmatis",
        desc: "Sopan & Kalem",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        btnActive: "bg-emerald-600 text-white border-emerald-600"
    },
    Netral: {
        label: "Netral",
        desc: "Standar Profesional",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        btnActive: "bg-slate-800 text-white border-slate-800"
    }
};

export default function RetensiCrm() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Tab active state (perawatan | unclaimed | garansi)
    const activeTab = searchParams.get("tab") || "perawatan";
    const selectedParamId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

    // Loading & Refreshing states
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data states
    const [maintenanceData, setMaintenanceData] = useState({ items: [], total_due: 0, urgent_count: 0, routine_count: 0 });
    const [unclaimedData, setUnclaimedData] = useState({ items: [], total_unclaimed: 0, aging_count: 0, critical_count: 0 });
    const [warrantyData, setWarrantyData] = useState([]);

    // Sub-filters & Searches
    const [searchTerm, setSearchTerm] = useState("");
    const [maintFilter, setMaintFilter] = useState("all"); // all | urgent_1y | routine_6m | unsent
    const [unclaimedFilter, setUnclaimedFilter] = useState("all"); // all | critical_30d | aging_14d | unsent
    const [warrantyFilter, setWarrantyFilter] = useState("all"); // all | h3 | h7

    // Selected item state per tab
    const [selectedMaintId, setSelectedMaintId] = useState(null);
    const [selectedUnclaimedId, setSelectedUnclaimedId] = useState(null);
    const [selectedWarrantyId, setSelectedWarrantyId] = useState(null);

    // Draft message parameters
    const [selectedTone, setSelectedTone] = useState("Netral");
    const [includePromo, setIncludePromo] = useState(true);
    const [customNote, setCustomNote] = useState("");
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch all CRM endpoints
    const fetchAllData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);
        try {
            const [mRes, uRes, wRes] = await Promise.allSettled([
                api.get("/tiket-servis/maintenance/due"),
                api.get("/tiket-servis/unclaimed/due"),
                api.get("/tiket-servis/warranty/expiring")
            ]);
            
            if (mRes.status === "fulfilled") {
                setMaintenanceData(mRes.value?.data || { items: [], total_due: 0, urgent_count: 0, routine_count: 0 });
            }
            if (uRes.status === "fulfilled") {
                setUnclaimedData(uRes.value?.data || { items: [], total_unclaimed: 0, aging_count: 0, critical_count: 0 });
            }
            if (wRes.status === "fulfilled") {
                setWarrantyData(Array.isArray(wRes.value?.data) ? wRes.value.data : []);
            }
            if (mRes.status === "rejected" && uRes.status === "rejected" && wRes.status === "rejected") {
                toast.error("Gagal memuat data retensi pelanggan.");
            }
        } catch (err) {
            console.error("Gagal memuat data Retensi CRM:", err);
            toast.error("Gagal memuat data retensi pelanggan.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Set initial selection when tab or data changes
    useEffect(() => {
        if (activeTab === "perawatan" && maintenanceData.items.length > 0) {
            if (selectedParamId && maintenanceData.items.some(i => i.id === selectedParamId)) {
                setSelectedMaintId(selectedParamId);
            } else if (!selectedMaintId) {
                setSelectedMaintId(maintenanceData.items[0].id);
            }
        } else if (activeTab === "unclaimed" && unclaimedData.items.length > 0) {
            if (selectedParamId && unclaimedData.items.some(i => i.id === selectedParamId)) {
                setSelectedUnclaimedId(selectedParamId);
            } else if (!selectedUnclaimedId) {
                setSelectedUnclaimedId(unclaimedData.items[0].id);
            }
        } else if (activeTab === "garansi" && warrantyData.length > 0) {
            if (selectedParamId && warrantyData.some(i => i.id === selectedParamId)) {
                setSelectedWarrantyId(selectedParamId);
            } else if (!selectedWarrantyId) {
                setSelectedWarrantyId(warrantyData[0].id);
            }
        }
    }, [activeTab, maintenanceData.items, unclaimedData.items, warrantyData, selectedParamId]);

    // Handle tab change
    const handleTabChange = (newTab) => {
        setSearchParams({ tab: newTab });
        setSearchTerm("");
        setCustomNote("");
    };

    // Active item objects
    const currentMaintItem = useMemo(() => {
        return maintenanceData.items.find(i => i.id === selectedMaintId) || null;
    }, [maintenanceData.items, selectedMaintId]);

    const currentUnclaimedItem = useMemo(() => {
        return unclaimedData.items.find(i => i.id === selectedUnclaimedId) || null;
    }, [unclaimedData.items, selectedUnclaimedId]);

    const currentWarrantyItem = useMemo(() => {
        return warrantyData.find(i => i.id === selectedWarrantyId) || null;
    }, [warrantyData, selectedWarrantyId]);

    // Sinkronisasi default tone saat berganti item
    useEffect(() => {
        if (activeTab === "perawatan" && currentMaintItem) {
            setSelectedTone(currentMaintItem.customer_personality || "Netral");
        } else if (activeTab === "unclaimed" && currentUnclaimedItem) {
            setSelectedTone(currentUnclaimedItem.customer_personality || "Netral");
        } else if (activeTab === "garansi" && currentWarrantyItem) {
            setSelectedTone(currentWarrantyItem.perangkat?.customer?.tipe_kepribadian || "Netral");
        }
    }, [activeTab, selectedMaintId, selectedUnclaimedId, selectedWarrantyId]);

    // Filtered lists
    const filteredMaintList = useMemo(() => {
        return maintenanceData.items.filter(item => {
            const matchesSearch = !searchTerm.trim() || 
                item.customer_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.merek?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nomor_tiket?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (maintFilter === "urgent_1y") return item.urgency === "urgent_1y";
            if (maintFilter === "routine_6m") return item.urgency === "routine_6m";
            if (maintFilter === "unsent") return !item.is_follow_up_sent;
            return true;
        });
    }, [maintenanceData.items, searchTerm, maintFilter]);

    const filteredUnclaimedList = useMemo(() => {
        return unclaimedData.items.filter(item => {
            const matchesSearch = !searchTerm.trim() || 
                item.customer_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.merek?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nomor_tiket?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (unclaimedFilter === "critical_30d") return item.diff_days >= 30;
            if (unclaimedFilter === "aging_14d") return item.diff_days >= 14;
            if (unclaimedFilter === "unsent") return (item.last_reminder_sent || 0) === 0;
            return true;
        });
    }, [unclaimedData.items, searchTerm, unclaimedFilter]);

    const filteredWarrantyList = useMemo(() => {
        return warrantyData.filter(item => {
            const custName = item.perangkat?.customer?.nama || "";
            const merek = item.perangkat?.merek || "";
            const model = item.perangkat?.model || "";
            const matchesSearch = !searchTerm.trim() || 
                custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                merek.toLowerCase().includes(searchTerm.toLowerCase()) ||
                model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nomor_tiket?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            const sisa = item.warranty_status?.sisaHari ?? 99;
            if (warrantyFilter === "h3") return sisa <= 3;
            if (warrantyFilter === "h7") return sisa <= 7;
            return true;
        });
    }, [warrantyData, searchTerm, warrantyFilter]);

    // --- Message Generators (Zero Emojis) ---
    const generateMaintenanceMsg = (item, tone) => {
        if (!item) return "";
        const nama = item.customer_nama || "Pelanggan";
        const unit = `${item.merek} ${item.model}`;
        const periodeStr = item.urgency === "urgent_1y" 
            ? "sudah beroperasi lebih dari 1 tahun pasca perbaikan terakhir" 
            : "sudah beroperasi sekitar 6 bulan pasca servis";

        const promoText = includePromo 
            ? "\n* Khusus pelanggan setia, kami berikan fasilitas Free Thermal Check & Diskon Jasa Perawatan 15% jika reservasi minggu ini." 
            : "";
        const noteText = customNote.trim() ? `\n* Catatan: ${customNote.trim()}` : "";

        switch (tone) {
            case "Koleris":
                return `Halo Bpk/Ibu ${nama}, ini Serv.io Workshop.\n\nPerangkat Anda (${unit}) tercatat ${periodeStr}. Untuk menjaga kestabilan sistem dan mencegah overhead/kerusakan komponen, unit disarankan melakukan perawatan berkala:\n1. Pembersihan tumpukan debu pendingin\n2. Pembaruan pasta termal kering\n3. Pemeriksaan kesehatan storage & tegangan baterai.${promoText}${noteText}\n\nSilakan konfirmasi jadwal kunjungan jika unit ingin dijadwalkan perawatan hari ini. Terima kasih.`;
            case "Sanguinis":
                return `Halo Bpk/Ibu ${nama}! Semoga harinya menyenangkan bersama ${unit}.\n\nKami melihat laptop Anda ${periodeStr} di Serv.io. Supaya performanya tetap kencang, adem, dan bebas lag, sekarang adalah waktu terbaik untuk perawatan berkala pembersihan kipas dan repaste pasta pendingin.${promoText}${noteText}\n\nKapan ada waktu luang untuk mampir ke workshop kami? Tim kami siap menyambut Anda. Terima kasih!`;
            case "Melankolis":
                return `Yth. Bpk/Ibu ${nama},\n\nBerdasarkan sistem pemeliharaan Serv.io untuk unit ${unit} (No. Tiket: #${item.nomor_tiket}), perangkat Anda ${periodeStr}.\n\nStandar siklus operasional 6-12 bulan merekomendasikan:\n- Penggantian senyawa konduksi termal (thermal paste) untuk efisiensi pendinginan\n- Pembersihan debu pada heatsink & fan bearing\n- Uji diagnostik SMART SSD & voltase pengisian daya.${promoText}${noteText}\n\nLayanan tersedia di workshop kami pada jam operasional. Terima kasih atas kepercayaan Anda.`;
            case "Plegmatis":
                return `Selamat siang Bpk/Ibu ${nama}, salam dari tim Serv.io.\n\nSekadar menyapa dan memastikan ${unit} Anda tetap beroperasi lancar. Mengingat unit ${periodeStr}, jika Anda berkenan, kami menyarankan pengecekan suhu dan pembersihan berkala agar laptop selalu nyaman digunakan.${promoText}${noteText}\n\nSilakan berkunjung saat Anda senggang. Terima kasih banyak atas kesetiaan Anda.`;
            default:
                return `Halo Bpk/Ibu ${nama},\n\nKami dari Serv.io Workshop menginformasikan bahwa perangkat ${unit} Anda ${periodeStr}. Demi performa optimal dan pencegahan overheat, disarankan melakukan servis berkala (pembersihan sirkulasi debu dan penggantian thermal paste).${promoText}${noteText}\n\nSilakan hubungi kami untuk reservasi atau langsung datang ke workshop. Terima kasih.`;
        }
    };

    const generateUnclaimedMsg = (item, tone) => {
        if (!item) return "";
        const nama = item.customer_nama || "Pelanggan";
        const unit = `${item.merek} ${item.model}`;
        const biaya = item.total_biaya ? `Rp ${Number(item.total_biaya).toLocaleString("id-ID")}` : "-";
        const statusBayar = item.status_pembayaran || "Belum Dibayar";
        const noteText = customNote.trim() ? `\n* Catatan: ${customNote.trim()}` : "";

        if (item.diff_days >= 90) {
            return `Yth. Bpk/Ibu ${nama},\n\nKami dari Serv.io menginformasikan mengenai perangkat Anda (${unit}, No. Tiket: #${item.nomor_tiket}) yang telah selesai dikerjakan sejak lebih dari 3 bulan yang lalu dan masih berada di rak penyimpanan workshop kami.\n\nDetail Invoice: ${biaya} (${statusBayar}).${noteText}\n\nMengingat kapasitas ruang penyimpanan workshop kami yang terbatas serta risiko penyimpanan jangka panjang di luar pengawasan, kami mohon kesediaan Bpk/Ibu untuk mengambil unit ini dalam waktu dekat. Workshop kami buka setiap hari kerja. Mohon hubungi kami untuk konfirmasi. Terima kasih.`;
        } else if (item.diff_days >= 30) {
            return `Halo Bpk/Ibu ${nama},\n\nIni adalah pengingat dari Serv.io mengenai unit ${unit} (Tiket #${item.nomor_tiket}). Perbaikan telah selesai lebih dari 30 hari yang lalu dan unit siap diambil di workshop kami.\n\nTotal Biaya: ${biaya} (${statusBayar}).${noteText}\n\nSilakan datang ke toko pada jam operasional untuk pengambilan dan verifikasi perangkat. Terima kasih.`;
        } else {
            return `Halo Bpk/Ibu ${nama},\n\nKami mengabarkan bahwa perbaikan untuk perangkat ${unit} (Tiket #${item.nomor_tiket}) telah rampung dan siap diambil di Serv.io Workshop.\n\nTotal Biaya: ${biaya} (${statusBayar}).${noteText}\n\nSilakan membawa nota atau nomor tiket saat pengambilan unit. Terima kasih atas kepercayaan Anda.`;
        }
    };

    const generateWarrantyMsg = (item, tone) => {
        if (!item) return "";
        const custName = item.perangkat?.customer?.nama || "Pelanggan";
        const unit = `${item.perangkat?.merek} ${item.perangkat?.model}`;
        const sisaHari = item.warranty_status?.sisaHari ?? 0;
        const noteText = customNote.trim() ? `\n* Catatan: ${customNote.trim()}` : "";

        return `Halo Bpk/Ibu ${custName},\n\nKami dari Serv.io ingin menanyakan kabar dan performa perangkat ${unit} Anda (Tiket #${item.nomor_tiket}) pasca perbaikan tempo hari.\n\nSebagai bagian dari komitmen layanan kami, kami informasikan bahwa masa garansi servis unit Anda tersisa ${sisaHari} hari lagi. Jika Anda merasakan kendala atau performa yang kurang optimal, silakan bawa kembali ke workshop agar dapat diperiksa tanpa biaya tambahan.${noteText}\n\nTerima kasih telah mempercayakan perbaikan kepada Serv.io.`;
    };

    // Current displayed text
    const activeMessageText = useMemo(() => {
        if (activeTab === "perawatan" && currentMaintItem) {
            return generateMaintenanceMsg(currentMaintItem, selectedTone);
        } else if (activeTab === "unclaimed" && currentUnclaimedItem) {
            return generateUnclaimedMsg(currentUnclaimedItem, selectedTone);
        } else if (activeTab === "garansi" && currentWarrantyItem) {
            return generateWarrantyMsg(currentWarrantyItem, selectedTone);
        }
        return "";
    }, [activeTab, currentMaintItem, currentUnclaimedItem, currentWarrantyItem, selectedTone, includePromo, customNote]);

    // Copy handler
    const handleCopy = () => {
        if (!activeMessageText) return;
        navigator.clipboard.writeText(activeMessageText);
        setCopied(true);
        toast.success("Pesan berhasil disalin ke clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    // Actions
    const handleMarkMaintSent = async (openWa = false) => {
        if (!currentMaintItem) return;
        setActionLoading(true);
        try {
            if (openWa && currentMaintItem.customer_phone) {
                const phone = currentMaintItem.customer_phone.replace(/\D/g, "");
                const targetPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;
                window.open(`https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(activeMessageText)}`, "_blank");
            }
            await api.post(`/tiket-servis/${currentMaintItem.id}/reminder-maintenance`, {
                catatan: `Recall ${currentMaintItem.urgency === 'urgent_1y' ? '≥ 1 Tahun' : '6-11 Bulan'} (${selectedTone})`
            });
            toast.success("Pengingat perawatan berkala berhasil dicatat!");
            fetchAllData(true);
        } catch (err) {
            toast.error("Gagal mencatat pengingat perawatan berkala.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkUnclaimedSent = async (openWa = false) => {
        if (!currentUnclaimedItem) return;
        setActionLoading(true);
        try {
            if (openWa && currentUnclaimedItem.customer_phone) {
                const phone = currentUnclaimedItem.customer_phone.replace(/\D/g, "");
                const targetPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;
                window.open(`https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(activeMessageText)}`, "_blank");
            }
            const nextLevel = (currentUnclaimedItem.last_reminder_sent || 0) + 1;
            await api.post(`/tiket-servis/${currentUnclaimedItem.id}/reminder-unclaimed`, {
                reminder_level: nextLevel,
                catatan: `Pengingat Pengambilan Tahap ${nextLevel} (${currentUnclaimedItem.diff_days} hari selesai)`
            });
            toast.success("Pengingat pengambilan unit berhasil dicatat!");
            fetchAllData(true);
        } catch (err) {
            toast.error("Gagal mencatat pengingat pengambilan unit.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkWarrantySent = async (openWa = false) => {
        if (!currentWarrantyItem) return;
        setActionLoading(true);
        try {
            const phoneRaw = currentWarrantyItem.perangkat?.customer?.nomor_telepon || "";
            if (openWa && phoneRaw) {
                const phone = phoneRaw.replace(/\D/g, "");
                const targetPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;
                window.open(`https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(activeMessageText)}`, "_blank");
            }
            await api.post(`/tiket-servis/${currentWarrantyItem.id}/reminder-garansi`, {
                catatan: `Follow-up garansi H-${currentWarrantyItem.warranty_status?.sisaHari || 0}`
            });
            toast.success("Follow-up garansi berhasil dicatat!");
            fetchAllData(true);
        } catch (err) {
            toast.error("Gagal mencatat follow-up garansi.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <HeartHandshake className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-slate-900">Retensi & Layanan CRM</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Pusat komunikasi pelanggan purna-servis, pengingat perawatan berkala, dan manajemen penumpukan unit selesai
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => fetchAllData(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                        title="Segarkan data CRM"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
                        <span>Segarkan</span>
                    </button>
                </div>
            </div>

            {/* Quick Stat Cards / Navigation Switchers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Perawatan Berkala */}
                <button
                    type="button"
                    onClick={() => handleTabChange("perawatan")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        activeTab === "perawatan"
                            ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>Perawatan Berkala</span>
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            6 - 12 Bulan
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">{maintenanceData.total_due}</span>
                        <span className="text-xs font-medium text-slate-500">unit siap disapa</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5 text-[11px] font-semibold text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {maintenanceData.urgent_count} Kritis (≥ 1 Thn)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {maintenanceData.routine_count} Rutin
                        </span>
                    </div>
                </button>

                {/* Card 2: Unit Belum Diambil */}
                <button
                    type="button"
                    onClick={() => handleTabChange("unclaimed")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        activeTab === "unclaimed"
                            ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <PackageCheck className="w-4 h-4 text-amber-600" />
                            <span>Unit Selesai Di Rak</span>
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Belum Diambil
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">{unclaimedData.total_unclaimed}</span>
                        <span className="text-xs font-medium text-slate-500">unit tersimpan</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5 text-[11px] font-semibold text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {unclaimedData.aging_count} Mengendap (&gt; 14 Hari)
                        </span>
                        {unclaimedData.critical_count > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                {unclaimedData.critical_count} &ge; 30 Hari
                            </span>
                        )}
                    </div>
                </button>

                {/* Card 3: Evaluasi Garansi H-7 */}
                <button
                    type="button"
                    onClick={() => handleTabChange("garansi")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        activeTab === "garansi"
                            ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Masa Garansi Toko</span>
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            H-7 Habis
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">{warrantyData.length}</span>
                        <span className="text-xs font-medium text-slate-500">unit aktif garansi</span>
                    </div>
                    <p className="mt-2.5 text-[11px] font-medium text-slate-500">
                        Follow-up kepuasan pelanggan sebelum masa garansi toko kedaluwarsa
                    </p>
                </button>
            </div>

            {/* Main Workspace: Split Queue & Action Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tab Navigation Bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/70">
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
                        <button
                            type="button"
                            onClick={() => handleTabChange("perawatan")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                                activeTab === "perawatan"
                                    ? "bg-blue-600 text-white shadow-2xs"
                                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Perawatan Berkala (6-12 Bln)</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "perawatan" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                                {maintenanceData.total_due}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange("unclaimed")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                                activeTab === "unclaimed"
                                    ? "bg-amber-600 text-white shadow-2xs"
                                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                            }`}
                        >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Unit Belum Diambil</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "unclaimed" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                                {unclaimedData.total_unclaimed}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange("garansi")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                                activeTab === "garansi"
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                            }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Follow-Up Garansi (H-7)</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "garansi" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                                {warrantyData.length}
                            </span>
                        </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">Template Komunikasi: WhatsApp</span>
                    </div>
                </div>

                {/* Workspace Body: Split View (40% List / 60% Interactive Action Panel) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
                    {/* Left Column: List Queue (lg:col-span-5) */}
                    <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col bg-slate-50/30">
                        {/* Search & Sub-filters */}
                        <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari pelanggan, no tiket, merek..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Filter Pills per Active Tab */}
                            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                                {activeTab === "perawatan" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setMaintFilter("all")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${maintFilter === "all" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                        >
                                            Semua ({maintenanceData.total_due})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMaintFilter("urgent_1y")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${maintFilter === "urgent_1y" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"}`}
                                        >
                                            &ge; 1 Thn ({maintenanceData.urgent_count})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMaintFilter("routine_6m")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${maintFilter === "routine_6m" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"}`}
                                        >
                                            6-11 Bln ({maintenanceData.routine_count})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMaintFilter("unsent")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${maintFilter === "unsent" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                        >
                                            Belum Diingatkan
                                        </button>
                                    </>
                                )}

                                {activeTab === "unclaimed" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setUnclaimedFilter("all")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${unclaimedFilter === "all" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                        >
                                            Semua ({unclaimedData.total_unclaimed})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUnclaimedFilter("aging_14d")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${unclaimedFilter === "aging_14d" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"}`}
                                        >
                                            &gt; 14 Hari ({unclaimedData.aging_count})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUnclaimedFilter("critical_30d")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${unclaimedFilter === "critical_30d" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"}`}
                                        >
                                            &ge; 30 Hari ({unclaimedData.critical_count})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUnclaimedFilter("unsent")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${unclaimedFilter === "unsent" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                        >
                                            Belum Diingatkan
                                        </button>
                                    </>
                                )}

                                {activeTab === "garansi" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setWarrantyFilter("all")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${warrantyFilter === "all" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                        >
                                            Semua ({warrantyData.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWarrantyFilter("h3")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${warrantyFilter === "h3" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"}`}
                                        >
                                            Kritis (H-3)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWarrantyFilter("h7")}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${warrantyFilter === "h7" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"}`}
                                        >
                                            Dalam H-7
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Queue Items List */}
                        <div className="flex-1 overflow-y-auto max-h-[550px] p-2 space-y-1.5 custom-scrollbar">
                            {/* TAB 1: PERAWATAN BERKALA LIST */}
                            {activeTab === "perawatan" && (
                                filteredMaintList.length === 0 ? (
                                    <div className="text-center py-12 px-4 text-slate-500">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                        <p className="text-xs font-bold text-slate-700">Tidak ada antrean perawatan berkala</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Semua pelanggan telah disapa atau belum mencapai ambang 6 bulan.</p>
                                    </div>
                                ) : (
                                    filteredMaintList.map((item) => {
                                        const isSelected = selectedMaintId === item.id;
                                        const isUrgent = item.urgency === "urgent_1y";
                                        const persConfig = PERSONALITY_MAP[item.customer_personality] || PERSONALITY_MAP.Netral;

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedMaintId(item.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? "bg-white border-blue-500 shadow-xs ring-1 ring-blue-500/20"
                                                        : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.customer_nama}</h4>
                                                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${persConfig.badge}`}>
                                                                {persConfig.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                                                            {item.merek} {item.model}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                                        isUrgent 
                                                            ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                            : "bg-blue-50 text-blue-700 border-blue-200"
                                                    }`}>
                                                        {item.diff_months} Bln Lalu
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100">
                                                    <span className="font-mono">#{item.nomor_tiket}</span>
                                                    {item.is_follow_up_sent ? (
                                                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                            <span>Sudah Diingatkan</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-amber-500" />
                                                            <span>Belum Diingatkan</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {/* TAB 2: UNCLAIMED DEVICES LIST */}
                            {activeTab === "unclaimed" && (
                                filteredUnclaimedList.length === 0 ? (
                                    <div className="text-center py-12 px-4 text-slate-500">
                                        <PackageCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                        <p className="text-xs font-bold text-slate-700">Rak penyimpanan bersih!</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada unit selesai yang menumpuk di bengkel.</p>
                                    </div>
                                ) : (
                                    filteredUnclaimedList.map((item) => {
                                        const isSelected = selectedUnclaimedId === item.id;
                                        const isCritical = item.diff_days >= 30;
                                        const isAging = item.diff_days >= 14;

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedUnclaimedId(item.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? "bg-white border-amber-500 shadow-xs ring-1 ring-amber-500/20"
                                                        : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.customer_nama}</h4>
                                                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                                                            {item.merek} {item.model}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                                        isCritical
                                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                                            : isAging
                                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                                            : "bg-slate-100 text-slate-700 border-slate-200"
                                                    }`}>
                                                        {item.diff_days} Hari Selesai
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100">
                                                    <span className="font-mono">#{item.nomor_tiket}</span>
                                                    <span className="text-slate-700 font-bold">
                                                        Rp {Number(item.total_biaya || 0).toLocaleString("id-ID")}
                                                    </span>
                                                    {(item.last_reminder_sent || 0) > 0 ? (
                                                        <span className="text-emerald-700 font-semibold">
                                                            Tahap {item.last_reminder_sent}x
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-700 font-semibold">
                                                            Belum Disapa
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {/* TAB 3: WARRANTY EXPIRING LIST */}
                            {activeTab === "garansi" && (
                                filteredWarrantyList.length === 0 ? (
                                    <div className="text-center py-12 px-4 text-slate-500">
                                        <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                        <p className="text-xs font-bold text-slate-700">Tidak ada garansi yang hampir habis</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Semua garansi unit masih panjang atau sudah selesai.</p>
                                    </div>
                                ) : (
                                    filteredWarrantyList.map((item) => {
                                        const isSelected = selectedWarrantyId === item.id;
                                        const sisa = item.warranty_status?.sisaHari ?? 0;
                                        const isCritical = sisa <= 3;

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedWarrantyId(item.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? "bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500/20"
                                                        : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-bold text-slate-900 truncate">
                                                            {item.perangkat?.customer?.nama || "Pelanggan"}
                                                        </h4>
                                                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                                                            {item.perangkat?.merek} {item.perangkat?.model}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                                        isCritical
                                                            ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold"
                                                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                    }`}>
                                                        Sisa {sisa} Hari
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100">
                                                    <span className="font-mono">#{item.nomor_tiket}</span>
                                                    <span className="text-slate-600 font-medium">
                                                        Garansi s/d: {item.warranty_status?.garansi_berakhir_at ? new Date(item.warranty_status.garansi_berakhir_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </div>

                    {/* Right Column: Interactive Detail & Communication Canvas (lg:col-span-7) */}
                    <div className="lg:col-span-7 p-5 flex flex-col justify-between bg-white">
                        {/* TAB 1: PERAWATAN BERKALA ACTIVE PANEL */}
                        {activeTab === "perawatan" && (
                            !currentMaintItem ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                                    <Inbox className="w-10 h-10 stroke-[1.5] text-slate-300 mb-2" />
                                    <p className="text-xs font-semibold text-slate-600">Pilih unit di sebelah kiri untuk melihat detail perawatan</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Unit Info Header */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900">{currentMaintItem.customer_nama}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${PERSONALITY_MAP[currentMaintItem.customer_personality]?.badge || PERSONALITY_MAP.Netral.badge}`}>
                                                    Tipe {currentMaintItem.customer_personality || "Netral"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                                                {currentMaintItem.merek} {currentMaintItem.model} • Tiket #{currentMaintItem.nomor_tiket}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                WhatsApp: <span className="font-mono font-semibold text-slate-700">{currentMaintItem.customer_phone || "Tidak ada nomor"}</span>
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right shrink-0">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                currentMaintItem.urgency === "urgent_1y"
                                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                            }`}>
                                                {currentMaintItem.urgency === "urgent_1y" ? "Kritis (≥ 1 Tahun)" : "Siklus Rutin (6-11 Bulan)"}
                                            </span>
                                            <p className="text-[11px] text-slate-500 font-medium mt-1">
                                                {currentMaintItem.diff_months} bulan ({currentMaintItem.diff_days} hari) lalu
                                            </p>
                                        </div>
                                    </div>

                                    {/* Technical Checklist Recommendation */}
                                    <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs space-y-1.5">
                                        <span className="font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Rekomendasi Servis Periode 6-12 Bulan:</span>
                                        </span>
                                        <p className="font-semibold text-slate-800">{currentMaintItem.recommended_service}</p>
                                        <p className="text-[11px] text-slate-600">
                                            Pembersihan debu heatsink kipas, penggantian pasta termal kering, dan pengecekan kesehatan SSD.
                                        </p>
                                    </div>

                                    {/* Tone Selector & Customization Controls */}
                                    <div className="space-y-3 pt-1">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Gaya Bahasa Komunikasi WhatsApp:
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                                {Object.keys(PERSONALITY_MAP).map((toneKey) => {
                                                    const p = PERSONALITY_MAP[toneKey];
                                                    const isSelected = selectedTone === toneKey;
                                                    return (
                                                        <button
                                                            key={toneKey}
                                                            type="button"
                                                            onClick={() => setSelectedTone(toneKey)}
                                                            className={`p-1.5 rounded-lg text-center transition-all border text-[11px] font-semibold ${
                                                                isSelected
                                                                    ? p.btnActive + " shadow-2xs"
                                                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                            }`}
                                                        >
                                                            <div>{p.label}</div>
                                                            <div className={`text-[9px] truncate ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                                                                {p.desc}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={includePromo}
                                                    onChange={(e) => setIncludePromo(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs font-semibold text-slate-700">Sertakan penawaran loyalitas (Free Thermal Check & Diskon 15%)</span>
                                            </label>
                                        </div>

                                        <div>
                                            <input
                                                type="text"
                                                value={customNote}
                                                onChange={(e) => setCustomNote(e.target.value)}
                                                placeholder="Catatan tambahan (opsional): Misal: Toko kami buka setiap hari sampai pukul 20.00 WIB..."
                                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Preview Chat Bubble */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Pratinjau Pesan WhatsApp:</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleCopy}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                <span>{copied ? "Tersalin" : "Salin Teks"}</span>
                                            </button>
                                        </div>
                                        <div className="bg-[#EFEAE2] p-3.5 rounded-xl border border-[#D1D7DB] text-xs font-sans text-slate-900 whitespace-pre-line leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar select-text shadow-inner">
                                            {activeMessageText}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                                        <Link
                                            to={`/tiket-servis/${currentMaintItem.id}`}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                                        >
                                            <span>Lihat Tiket Asal</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkMaintSent(false)}
                                            disabled={actionLoading}
                                            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                                        >
                                            Tandai Terkirim Saja
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkMaintSent(true)}
                                            disabled={actionLoading || !currentMaintItem.customer_phone}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span>Kirim WhatsApp & Tandai</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        {/* TAB 2: UNCLAIMED DEVICES ACTIVE PANEL */}
                        {activeTab === "unclaimed" && (
                            !currentUnclaimedItem ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                                    <PackageCheck className="w-10 h-10 stroke-[1.5] text-slate-300 mb-2" />
                                    <p className="text-xs font-semibold text-slate-600">Pilih unit di sebelah kiri untuk melihat status pengambilan</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Unit Info Header */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">{currentUnclaimedItem.customer_nama}</h3>
                                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                                                {currentUnclaimedItem.merek} {currentUnclaimedItem.model} • Tiket #{currentUnclaimedItem.nomor_tiket}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                WhatsApp: <span className="font-mono font-semibold text-slate-700">{currentUnclaimedItem.customer_phone || "Tidak ada nomor"}</span>
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right shrink-0">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                currentUnclaimedItem.diff_days >= 30
                                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                                    : currentUnclaimedItem.diff_days >= 14
                                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                            }`}>
                                                {currentUnclaimedItem.stage_label}
                                            </span>
                                            <p className="text-[11px] text-slate-500 font-medium mt-1">
                                                Selesai {currentUnclaimedItem.diff_days} hari lalu
                                            </p>
                                        </div>
                                    </div>

                                    {/* Storage & Invoice Warning Banner */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                                        <span className="font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Informasi Penyimpanan & Tagihan:</span>
                                        </span>
                                        <div className="flex items-center justify-between font-medium text-slate-700 pt-1">
                                            <span>Total Biaya Perbaikan:</span>
                                            <span className="font-bold text-slate-900 font-mono">
                                                Rp {Number(currentUnclaimedItem.total_biaya || 0).toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between font-medium text-slate-700">
                                            <span>Status Pembayaran:</span>
                                            <span className={`font-bold ${currentUnclaimedItem.status_pembayaran === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {currentUnclaimedItem.status_pembayaran}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between font-medium text-slate-700">
                                            <span>Pengingat Telah Dikirim:</span>
                                            <span className="font-bold text-slate-900">
                                                {currentUnclaimedItem.last_reminder_sent || 0} Kali
                                            </span>
                                        </div>
                                    </div>

                                    {/* Custom Note Input */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Catatan Tambahan untuk Pelanggan (Opsional):
                                        </label>
                                        <input
                                            type="text"
                                            value={customNote}
                                            onChange={(e) => setCustomNote(e.target.value)}
                                            placeholder="Misal: Harap konfirmasi jika diwakilkan orang lain saat pengambilan..."
                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                                        />
                                    </div>

                                    {/* Preview Chat Bubble */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Pratinjau Pesan Pengingat Pengambilan:</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleCopy}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                <span>{copied ? "Tersalin" : "Salin Teks"}</span>
                                            </button>
                                        </div>
                                        <div className="bg-[#EFEAE2] p-3.5 rounded-xl border border-[#D1D7DB] text-xs font-sans text-slate-900 whitespace-pre-line leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar select-text shadow-inner">
                                            {activeMessageText}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                                        <Link
                                            to={`/tiket-servis/${currentUnclaimedItem.id}`}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                                        >
                                            <span>Buka Detail Tiket</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkUnclaimedSent(false)}
                                            disabled={actionLoading}
                                            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                                        >
                                            Tandai Terkirim Saja
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkUnclaimedSent(true)}
                                            disabled={actionLoading || !currentUnclaimedItem.customer_phone}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span>Kirim WhatsApp & Naikkan Tahap</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        {/* TAB 3: WARRANTY EXPIRING ACTIVE PANEL */}
                        {activeTab === "garansi" && (
                            !currentWarrantyItem ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                                    <ShieldCheck className="w-10 h-10 stroke-[1.5] text-slate-300 mb-2" />
                                    <p className="text-xs font-semibold text-slate-600">Pilih unit di sebelah kiri untuk melihat evaluasi garansi</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Unit Info Header */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                {currentWarrantyItem.perangkat?.customer?.nama || "Pelanggan"}
                                            </h3>
                                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                                                {currentWarrantyItem.perangkat?.merek} {currentWarrantyItem.perangkat?.model} • Tiket #{currentWarrantyItem.nomor_tiket}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                WhatsApp: <span className="font-mono font-semibold text-slate-700">{currentWarrantyItem.perangkat?.customer?.nomor_telepon || "Tidak ada nomor"}</span>
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right shrink-0">
                                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                Tersisa {currentWarrantyItem.warranty_status?.sisaHari ?? 0} Hari Garansi
                                            </span>
                                            <p className="text-[11px] text-slate-500 font-medium mt-1">
                                                Kedaluwarsa: {currentWarrantyItem.warranty_status?.garansi_berakhir_at ? new Date(currentWarrantyItem.warranty_status.garansi_berakhir_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Evaluation Guidance */}
                                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                                        <span className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Maksud Follow-Up Kepuasan Pelanggan:</span>
                                        </span>
                                        <p className="text-slate-700 leading-relaxed">
                                            Menanyakan apakah perangkat bekerja dengan baik atau timbul kendala sebelum garansi toko habis. Tindakan proaktif ini meningkatkan loyalitas dan mencegah keluhan pelanggan setelah masa garansi terlewat.
                                        </p>
                                    </div>

                                    {/* Preview Chat Bubble */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Pratinjau Pesan Evaluasi Garansi:</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleCopy}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                <span>{copied ? "Tersalin" : "Salin Teks"}</span>
                                            </button>
                                        </div>
                                        <div className="bg-[#EFEAE2] p-3.5 rounded-xl border border-[#D1D7DB] text-xs font-sans text-slate-900 whitespace-pre-line leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar select-text shadow-inner">
                                            {activeMessageText}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                                        <Link
                                            to={`/tiket-servis/${currentWarrantyItem.id}`}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                                        >
                                            <span>Buka Detail Tiket</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkWarrantySent(false)}
                                            disabled={actionLoading}
                                            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                                        >
                                            Tandai Terkirim Saja
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkWarrantySent(true)}
                                            disabled={actionLoading || !currentWarrantyItem.perangkat?.customer?.nomor_telepon}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span>Kirim WhatsApp & Tandai</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
