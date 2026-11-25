import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import useRealtimeEvent from "../../hooks/useRealtime";
import CustomSelect from "../../components/common/CustomSelect";
import PromotionFormModal from "./PromotionFormModal";
import PromotionRedemptionModal from "./PromotionRedemptionModal";
import CampaignNoteModal from "./CampaignNoteModal";
import {
    Megaphone,
    Plus,
    Search,
    Tag,
    Users,
    BarChart3,
    Edit3,
    Trash2,
    Eye,
    Power,
    Copy,
    Download,
    MessageSquare,
    Calendar,
    Filter,
    Globe,
    Link2,
    ExternalLink,
    NotebookPen,
    CheckCircle2,
    X,
    Send,
    Sparkles,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

function formatDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE = {
    aktif: { label: "Aktif", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    terjadwal: { label: "Terjadwal", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    habis: { label: "Kuota Habis", cls: "bg-amber-50 text-amber-800 border-amber-200" },
    berakhir: { label: "Berakhir", cls: "bg-slate-100 text-slate-600 border-slate-200" },
    nonaktif: { label: "Nonaktif", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const SCOPE_LABEL = {
    jasa: "Khusus Jasa",
    sparepart: "Khusus Sparepart",
    total: "Total Tagihan",
};

function buildCustomerPromoMessage(promo, cust) {
    const nama = cust?.nama || "Pelanggan";
    const unit = cust?.last_device && cust.last_device !== "-" ? cust.last_device : "perangkat Anda";

    if (!promo) {
        return `Halo Kak ${nama}, salam dari YVS Computer!\n\nKami ingin menyapa dan mengabarkan bahwa workshop kami siap membantu perawatan atau servis perangkat ${unit} Anda. Silakan mampir ke workshop Pekayon Jaya kapan saja. Terima kasih!`;
    }

    const scopeText = promo.cakupan_diskon === "jasa"
        ? "biaya jasa servis"
        : promo.cakupan_diskon === "sparepart"
        ? "pembelian suku cadang"
        : "total tagihan servis";

    const discountText = promo.tipe_diskon === "persen"
        ? `diskon ${promo.nilai_diskon}% ${scopeText}${promo.maksimal_diskon ? ` (maks. ${formatRupiah(promo.maksimal_diskon)})` : ""}`
        : `potongan ${formatRupiah(promo.nilai_diskon)} untuk ${scopeText}`;

    const terms = [];
    if (promo.kategori_perangkat && promo.kategori_perangkat !== "Semua") {
        terms.push(`khusus perangkat ${promo.kategori_perangkat}`);
    }
    if (Number(promo.minimal_transaksi) > 0) {
        terms.push(`minimal transaksi ${formatRupiah(promo.minimal_transaksi)}`);
    }
    if (promo.satu_kali_per_pelanggan) {
        terms.push("berlaku 1x per pelanggan");
    }
    if (promo.tanggal_selesai) {
        terms.push(`berlaku s/d ${formatDate(promo.tanggal_selesai)}`);
    }

    const termsLine = terms.length > 0 ? `\nKetentuan: ${terms.join(", ")}.` : "";
    const descLine = promo.deskripsi ? `\n${promo.deskripsi}` : "";

    return `Halo Kak ${nama}, salam dari YVS Computer!\n\nKami punya penawaran spesial *${promo.nama_promo}* untuk perangkat ${unit} Anda berupa *${discountText}*.${descLine}${termsLine}\n\nGunakan kode promo: *${promo.kode_promo}* — cukup tunjukkan pesan ini ke kasir saat pengambilan/pembayaran unit. Terima kasih!`;
}

export default function MarketingPage() {
    const { hasPermission } = useAuth();
    const canManage = hasPermission("marketing.manage");
    const canReport = hasPermission("marketing.report");

    const [activeTab, setActiveTab] = useState("promotions");

    // Tab 1: Promotions state
    const [promotions, setPromotions] = useState([]);
    const [loadingPromos, setLoadingPromos] = useState(true);
    const [promoSearch, setPromoSearch] = useState("");
    const [promoStatusFilter, setPromoStatusFilter] = useState("all");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [redemptionPromoId, setRedemptionPromoId] = useState(null);

    // Tab 2: Dedicated Campaign Notes state
    const [campaigns, setCampaigns] = useState([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [campaignFilters, setCampaignFilters] = useState({ search: "", saluran: "all", promotion_id: "all" });
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);

    // Tab 3: Customer Outreach state (defaults to "0" so active customers appear immediately)
    const [outreachData, setOutreachData] = useState({ total: 0, customers: [] });
    const [loadingOutreach, setLoadingOutreach] = useState(false);
    const [outreachFilters, setOutreachFilters] = useState({
        kategori_perangkat: "Semua",
        min_days_since_visit: "0",
        min_tickets: "0",
        search: "",
    });
    const [selectedTemplatePromoId, setSelectedTemplatePromoId] = useState("");
    const [selectedOutreachCustomer, setSelectedOutreachCustomer] = useState(null);
    const [composedOutreachMessage, setComposedOutreachMessage] = useState("");
    const [sentCustomerIds, setSentCustomerIds] = useState(() => new Set());
    const [outreachPage, setOutreachPage] = useState(1);
    const [outreachPageSize, setOutreachPageSize] = useState(10);
    const composerCardRef = useRef(null);
    const outreachListScrollRef = useRef(null);

    // Tab 4: Basic Results / Report state
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportDates, setReportDates] = useState({ startDate: "", endDate: "" });

    const fetchPromotions = useCallback(async () => {
        try {
            const res = await api.get("/marketing/promotions", { skipCache: true });
            setPromotions(Array.isArray(res.data) ? res.data : []);
        } catch {
            toast.error("Gagal memuat daftar promosi");
        } finally {
            setLoadingPromos(false);
        }
    }, []);

    const fetchCampaigns = useCallback(async () => {
        setLoadingCampaigns(true);
        try {
            const res = await api.get("/marketing/campaigns", {
                params: campaignFilters,
                skipCache: true,
            });
            setCampaigns(Array.isArray(res.data) ? res.data : []);
        } catch {
            toast.error("Gagal memuat catatan kampanye");
        } finally {
            setLoadingCampaigns(false);
        }
    }, [campaignFilters]);

    const fetchOutreach = useCallback(async () => {
        setLoadingOutreach(true);
        try {
            const res = await api.get("/marketing/outreach", {
                params: outreachFilters,
                skipCache: true,
            });
            setOutreachData(res.data || { total: 0, customers: [] });
        } catch {
            toast.error("Gagal memuat daftar outreach pelanggan");
        } finally {
            setLoadingOutreach(false);
        }
    }, [outreachFilters]);

    const fetchReport = useCallback(async () => {
        if (!canReport) return;
        setLoadingReport(true);
        try {
            const params = {};
            if (reportDates.startDate) params.startDate = reportDates.startDate;
            if (reportDates.endDate) params.endDate = reportDates.endDate;
            const res = await api.get("/marketing/report", { params, skipCache: true });
            setReportData(res.data);
        } catch {
            toast.error("Gagal memuat laporan hasil promosi");
        } finally {
            setLoadingReport(false);
        }
    }, [canReport, reportDates]);

    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    useEffect(() => {
        if (activeTab === "campaigns") fetchCampaigns();
        if (activeTab === "outreach") fetchOutreach();
        if (activeTab === "report" && canReport) fetchReport();
    }, [activeTab, fetchCampaigns, fetchOutreach, fetchReport, canReport]);

    useRealtimeEvent(["marketing:updated", "invoice:created", "invoice:updated"], () => {
        fetchPromotions();
        if (activeTab === "campaigns") fetchCampaigns();
        if (activeTab === "report" && canReport) fetchReport();
    });

    const filteredPromotions = useMemo(() => {
        return promotions.filter((p) => {
            if (promoStatusFilter !== "all" && p.status !== promoStatusFilter) return false;
            if (promoSearch.trim()) {
                const q = promoSearch.toLowerCase();
                const hay = `${p.kode_promo} ${p.nama_promo} ${p.saluran_promosi || ""} ${p.kategori_perangkat || ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [promotions, promoSearch, promoStatusFilter]);

    const activePromosForTemplate = useMemo(
        () => promotions.filter((p) => p.status === "aktif" || p.status === "terjadwal"),
        [promotions]
    );

    const selectedTemplatePromo = useMemo(
        () => promotions.find((p) => String(p.id) === String(selectedTemplatePromoId)) || null,
        [promotions, selectedTemplatePromoId]
    );

    // Reset outreach pagination to page 1 when filters or total items change
    useEffect(() => {
        setOutreachPage(1);
    }, [outreachFilters, outreachPageSize]);

    const outreachTotalPages = Math.max(1, Math.ceil((outreachData.customers?.length || 0) / outreachPageSize));
    const safeOutreachPage = Math.min(outreachPage, outreachTotalPages);
    const paginatedOutreachCustomers = useMemo(() => {
        const list = outreachData.customers || [];
        const start = (safeOutreachPage - 1) * outreachPageSize;
        return list.slice(start, start + outreachPageSize);
    }, [outreachData.customers, safeOutreachPage, outreachPageSize]);

    const handleOutreachPageChange = (nextPage) => {
        const clamped = Math.max(1, Math.min(nextPage, outreachTotalPages));
        setOutreachPage(clamped);
        outreachListScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleToggleActive = async (promo) => {
        try {
            const res = await api.patch(`/marketing/promotions/${promo.id}/toggle`);
            toast.success(res.data?.message || "Status promo diperbarui");
            fetchPromotions();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengubah status promo");
        }
    };

    const handleDeletePromo = async (promo) => {
        if (!window.confirm(`Hapus promo "${promo.nama_promo}" (${promo.kode_promo})?`)) return;
        try {
            await api.delete(`/marketing/promotions/${promo.id}`);
            toast.success("Promo berhasil dihapus");
            fetchPromotions();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus promo");
        }
    };

    const handleDeleteCampaign = async (note) => {
        if (!window.confirm(`Hapus catatan kampanye "${note.judul}"?`)) return;
        try {
            await api.delete(`/marketing/campaigns/${note.id}`);
            toast.success("Catatan kampanye berhasil dihapus");
            fetchCampaigns();
            fetchPromotions();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus catatan kampanye");
        }
    };

    const handleSelectOutreachPromo = (promoId) => {
        setSelectedTemplatePromoId(promoId);
        const promo = promotions.find((p) => String(p.id) === String(promoId)) || null;

        if (selectedOutreachCustomer) {
            setComposedOutreachMessage(buildCustomerPromoMessage(promo, selectedOutreachCustomer));
        }

        if (!promo) return;

        // Auto-match single device category filter when applicable so outreach targets relevant owners
        const validSingleCategories = ["Laptop", "PC Desktop", "Printer", "Smartphone"];
        if (validSingleCategories.includes(promo.kategori_perangkat)) {
            setOutreachFilters((prev) => ({ ...prev, kategori_perangkat: promo.kategori_perangkat }));
            toast.success(`Promo ${promo.kode_promo} dipilih · Daftar disaring ke pemilik ${promo.kategori_perangkat}`);
        } else {
            toast.success(`Promo ${promo.kode_promo} dipilih · Silakan pilih pelanggan di daftar`);
        }
    };

    const handleSelectOutreachCustomer = (cust) => {
        setSelectedOutreachCustomer(cust);
        setComposedOutreachMessage(buildCustomerPromoMessage(selectedTemplatePromo, cust));
        // On mobile/tablet where composer stacks below list, scroll smoothly to composer
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setTimeout(() => {
                composerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 60);
        }
    };

    const handleCopyComposedMessage = async () => {
        if (!composedOutreachMessage.trim()) return;
        try {
            await navigator.clipboard.writeText(composedOutreachMessage);
            toast.success(`Pesan untuk ${selectedOutreachCustomer?.nama || "pelanggan"} berhasil disalin`);
        } catch {
            toast.error("Gagal menyalin pesan");
        }
    };

    const handleSendComposedWhatsApp = () => {
        if (!selectedOutreachCustomer) return;
        let phone = String(selectedOutreachCustomer.nomor_telepon || "").replace(/\D/g, "");
        if (!phone) {
            toast.error("Nomor telepon pelanggan tidak tersedia");
            return;
        }
        if (phone.startsWith("0")) phone = "62" + phone.slice(1);
        const text = encodeURIComponent(composedOutreachMessage);
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
        setSentCustomerIds((prev) => {
            const next = new Set(prev);
            next.add(selectedOutreachCustomer.id);
            return next;
        });
    };

    const handleCopyPhoneList = async () => {
        const phones = outreachData.customers.map((c) => `${c.nama} - ${c.nomor_telepon}`).join("\n");
        if (!phones) {
            toast.error("Tidak ada kontak untuk disalin");
            return;
        }
        try {
            await navigator.clipboard.writeText(phones);
            toast.success(`${outreachData.customers.length} kontak berhasil disalin ke clipboard`);
        } catch {
            toast.error("Gagal menyalin ke clipboard");
        }
    };

    const handleExportOutreachCsv = () => {
        if (!outreachData.customers.length) {
            toast.error("Tidak ada data untuk diekspor");
            return;
        }
        const headers = ["Nama", "Nomor Telepon", "Kategori Perangkat", "Perangkat Terakhir", "Total Servis", "Hari Sejak Kunjungan", "Total Belanja"];
        const rows = outreachData.customers.map((c) => [
            `"${String(c.nama || "").replace(/"/g, '""')}"`,
            `"${c.nomor_telepon || ""}"`,
            `"${c.last_device_category || ""}"`,
            `"${String(c.last_device || "").replace(/"/g, '""')}"`,
            c.total_tickets || 0,
            c.days_since_visit ?? "",
            c.total_spend || 0,
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `outreach-yvs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Daftar outreach berhasil diekspor (CSV)");
    };

    const promoKpis = useMemo(() => {
        const aktif = promotions.filter((p) => p.status === "aktif").length;
        const totalRedemptions = promotions.reduce((s, p) => s + (p.redemptions_count || 0), 0);
        const totalDiskon = promotions.reduce((s, p) => s + (p.total_diskon_diberikan || 0), 0);
        const totalOmset = promotions.reduce((s, p) => s + (p.total_omset_bersih || 0), 0);
        return { aktif, totalRedemptions, totalDiskon, totalOmset };
    }, [promotions]);

    return (
        <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-5 pb-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                    <h1 className="page-title flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                            <Megaphone className="w-5 h-5" />
                        </span>
                        <span className="truncate">Marketing &amp; Promosi</span>
                    </h1>
                    <p className="page-subtitle">
                        Kelola penawaran diskon resmi, catatan kampanye, daftar outreach, dan hasil penukaran invoice.
                    </p>
                </div>

                {canManage && (
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingCampaign(null);
                                setIsCampaignModalOpen(true);
                            }}
                            className="btn-secondary min-h-[40px] px-3 sm:px-4 text-[13px] sm:text-sm flex items-center justify-center gap-1.5 min-w-0"
                        >
                            <NotebookPen className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="truncate">Catat Kampanye</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingPromo(null);
                                setIsFormModalOpen(true);
                            }}
                            className="btn-primary min-h-[40px] px-3 sm:px-4 text-[13px] sm:text-sm flex items-center justify-center gap-1.5 min-w-0"
                        >
                            <Plus className="w-4 h-4 shrink-0" />
                            <span className="truncate">Buat Promo</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile-First Balanced Tabs (2x2 Grid on Mobile, Inline Row on >= sm) */}
            <div className="grid grid-cols-2 sm:inline-flex sm:flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-full sm:w-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab("promotions")}
                    className={`min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer min-w-0 ${
                        activeTab === "promotions"
                            ? "bg-white text-blue-700 shadow-2xs border border-slate-200/70"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Tag className="w-4 h-4 shrink-0" />
                    <span className="truncate">Daftar Promo</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("campaigns")}
                    className={`min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer min-w-0 ${
                        activeTab === "campaigns"
                            ? "bg-white text-blue-700 shadow-2xs border border-slate-200/70"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <NotebookPen className="w-4 h-4 shrink-0" />
                    <span className="truncate">Kampanye</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("outreach")}
                    className={`min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer min-w-0 ${
                        activeTab === "outreach"
                            ? "bg-white text-blue-700 shadow-2xs border border-slate-200/70"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Users className="w-4 h-4 shrink-0" />
                    <span className="truncate">Outreach</span>
                </button>
                {canReport && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("report")}
                        className={`min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer min-w-0 ${
                            activeTab === "report"
                                ? "bg-white text-blue-700 shadow-2xs border border-slate-200/70"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <BarChart3 className="w-4 h-4 shrink-0" />
                        <span className="truncate">Hasil Promo</span>
                    </button>
                )}
            </div>

            {/* ================= TAB 1: PROMOTIONS ================= */}
            {activeTab === "promotions" && (
                <div className="space-y-4 min-w-0">
                    {/* Unified Balanced KPI Strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Promo Aktif</span>
                            <p className="text-base xs:text-lg sm:text-xl font-bold text-emerald-600 tabular-nums mt-1 truncate">{promoKpis.aktif}</p>
                            <span className="text-2xs sm:text-xs text-slate-500 block truncate mt-0.5">dari {promotions.length} penawaran</span>
                        </div>
                        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Total Penukaran</span>
                            <p className="text-base xs:text-lg sm:text-xl font-bold text-slate-900 tabular-nums mt-1 truncate">{promoKpis.totalRedemptions}</p>
                            <span className="text-2xs sm:text-xs text-slate-500 block truncate mt-0.5">invoice pakai promo</span>
                        </div>
                        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Total Potongan</span>
                            <p className="text-base xs:text-lg sm:text-xl font-bold text-rose-600 font-mono tabular-nums mt-1 truncate">{formatRupiah(promoKpis.totalDiskon)}</p>
                            <span className="text-2xs sm:text-xs text-slate-500 block truncate mt-0.5">diskon resmi tercatat</span>
                        </div>
                        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Nilai Invoice</span>
                            <p className="text-base xs:text-lg sm:text-xl font-bold text-blue-700 font-mono tabular-nums mt-1 truncate">{formatRupiah(promoKpis.totalOmset)}</p>
                            <span className="text-2xs sm:text-xs text-slate-500 block truncate mt-0.5">total tagihan bersih</span>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 min-w-0">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={promoSearch}
                                onChange={(e) => setPromoSearch(e.target.value)}
                                placeholder="Cari kode promo, nama penawaran, atau kategori..."
                                className="w-full min-h-[40px] pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="w-full sm:w-52 shrink-0">
                            <CustomSelect
                                value={promoStatusFilter}
                                onChange={(e) => setPromoStatusFilter(e.target.value)}
                                label="Filter Status"
                            >
                                <option value="all">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="terjadwal">Terjadwal</option>
                                <option value="habis">Kuota Habis</option>
                                <option value="berakhir">Berakhir</option>
                                <option value="nonaktif">Nonaktif</option>
                            </CustomSelect>
                        </div>
                    </div>

                    {/* Content */}
                    {loadingPromos ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 flex justify-center">
                            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredPromotions.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
                            <Tag className="w-9 h-9 text-slate-300 mx-auto" />
                            <h3 className="text-sm font-bold text-slate-700">Belum ada penawaran promo</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">Buat promo resmi pertama Anda agar kasir dapat menerapkannya secara terstruktur pada invoice.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Cards (< 1024px) */}
                            <div className="space-y-3 lg:hidden">
                                {filteredPromotions.map((p) => {
                                    const badge = STATUS_BADGE[p.status] || STATUS_BADGE.nonaktif;
                                    const pct = p.kuota_total ? Math.min(100, Math.round((p.kuota_terpakai / p.kuota_total) * 100)) : 0;
                                    return (
                                        <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-mono text-2xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                                            {p.kode_promo}
                                                        </span>
                                                        {p.tampil_di_tracking && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xs font-semibold">
                                                                <Globe className="w-3 h-3 shrink-0" /> Tracking
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 text-sm mt-1.5 break-words">{p.nama_promo}</h3>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border shrink-0 ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div className="min-w-0">
                                                    <span className="text-2xs text-slate-500 block">Potongan</span>
                                                    <strong className="text-slate-900 block truncate mt-0.5">
                                                        {p.tipe_diskon === "persen" ? `${p.nilai_diskon}%` : formatRupiah(p.nilai_diskon)}
                                                    </strong>
                                                    <span className="text-2xs text-slate-500 block truncate">{SCOPE_LABEL[p.cakupan_diskon] || p.cakupan_diskon}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-2xs text-slate-500 block">Penukaran</span>
                                                    <strong className="text-slate-900 block truncate mt-0.5">
                                                        {p.redemptions_count} {p.kuota_total ? `/ ${p.kuota_total}` : "klaim"}
                                                    </strong>
                                                    <span className="text-2xs text-slate-500 block truncate">
                                                        {p.sisa_kuota !== null ? `Sisa ${p.sisa_kuota}` : "Tanpa batas"}
                                                    </span>
                                                </div>
                                            </div>

                                            {p.kuota_total && (
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
                                                </div>
                                            )}

                                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /> {formatDate(p.tanggal_mulai)} – {formatDate(p.tanggal_selesai)}</span>
                                                {p.campaign_notes_count > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCampaignFilters({ search: "", saluran: "all", promotion_id: String(p.id) });
                                                            setActiveTab("campaigns");
                                                        }}
                                                        className="inline-flex items-center gap-1 text-amber-700 font-semibold hover:underline"
                                                    >
                                                        <Megaphone className="w-3.5 h-3.5 shrink-0" /> {p.campaign_notes_count} Log Kampanye
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setRedemptionPromoId(p.id)}
                                                    className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1.5"
                                                >
                                                    <Eye className="w-3.5 h-3.5 shrink-0" /> Riwayat Penukaran
                                                </button>
                                                {canManage && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingPromo(p); setIsFormModalOpen(true); }}
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                                                            title="Edit Promo"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleActive(p)}
                                                            className={`w-9 h-9 flex items-center justify-center rounded-lg border ${p.is_active ? "text-amber-700 border-amber-200 hover:bg-amber-50" : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"}`}
                                                            title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                        >
                                                            <Power className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletePromo(p)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg text-rose-600 border border-rose-200 hover:bg-rose-50"
                                                            title="Hapus Promo"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table (>= 1024px) */}
                            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-2xs tracking-wider">
                                            <th className="py-3 px-4">Penawaran &amp; Kode</th>
                                            <th className="py-3 px-4">Aturan Diskon</th>
                                            <th className="py-3 px-4">Periode &amp; Kategori</th>
                                            <th className="py-3 px-4">Log Kampanye</th>
                                            <th className="py-3 px-4">Kuota &amp; Penukaran</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPromotions.map((p) => {
                                            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.nonaktif;
                                            const pct = p.kuota_total ? Math.min(100, Math.round((p.kuota_terpakai / p.kuota_total) * 100)) : 0;
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/70">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-mono text-2xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                                                {p.kode_promo}
                                                            </span>
                                                            {p.tampil_di_tracking && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xs font-semibold" title="Ditampilkan di halaman publik /tracking">
                                                                    <Globe className="w-3 h-3" /> Tracking
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="font-bold text-slate-900 mt-1 text-xs sm:text-sm">{p.nama_promo}</p>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-bold text-slate-900 block">
                                                            {p.tipe_diskon === "persen" ? `${p.nilai_diskon}%` : formatRupiah(p.nilai_diskon)}
                                                        </span>
                                                        <span className="text-2xs text-slate-500 block">
                                                            {SCOPE_LABEL[p.cakupan_diskon] || p.cakupan_diskon}
                                                            {p.maksimal_diskon ? ` · Max ${formatRupiah(p.maksimal_diskon)}` : ""}
                                                        </span>
                                                        {p.minimal_transaksi > 0 && (
                                                            <span className="text-2xs text-slate-400 block">Min. {formatRupiah(p.minimal_transaksi)}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        <span className="block font-medium">{formatDate(p.tanggal_mulai)} – {formatDate(p.tanggal_selesai)}</span>
                                                        <span className="text-2xs text-slate-500">
                                                            {p.kategori_perangkat} · {p.tipe_tiket}
                                                            {p.satu_kali_per_pelanggan ? " · 1x/No. HP" : ""}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {p.campaign_notes_count > 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCampaignFilters({ search: "", saluran: "all", promotion_id: String(p.id) });
                                                                    setActiveTab("campaigns");
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-2xs font-semibold hover:bg-amber-100 cursor-pointer"
                                                            >
                                                                <Megaphone className="w-3 h-3" /> {p.campaign_notes_count} Log
                                                            </button>
                                                        ) : (
                                                            <span className="text-2xs text-slate-400">Belum dicatat</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-between text-2xs font-semibold text-slate-700 mb-1">
                                                            <span>{p.redemptions_count} terpakai</span>
                                                            <span className="text-slate-400">
                                                                {p.kuota_total ? `Sisa ${p.sisa_kuota}` : "Unlimited"}
                                                            </span>
                                                        </div>
                                                        {p.kuota_total && (
                                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        )}
                                                        <span className="text-2xs text-rose-600 font-mono block mt-1">
                                                            {formatRupiah(p.total_diskon_diberikan)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border ${badge.cls}`}>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="inline-flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setRedemptionPromoId(p.id)}
                                                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                                                                title="Lihat Riwayat Penukaran"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {canManage && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { setEditingPromo(p); setIsFormModalOpen(true); }}
                                                                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                                                                        title="Edit Promo"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleActive(p)}
                                                                        className={`p-1.5 rounded-lg transition-colors ${p.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                                                                        title={p.is_active ? "Nonaktifkan Promo" : "Aktifkan Promo"}
                                                                    >
                                                                        <Power className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeletePromo(p)}
                                                                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                                                        title="Hapus Promo"
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
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ================= TAB 2: DEDICATED CAMPAIGN NOTES ================= */}
            {activeTab === "campaigns" && (
                <div className="space-y-4 min-w-0">
                    {/* Filter Bar */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                        <div className="relative lg:col-span-2 min-w-0">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={campaignFilters.search}
                                onChange={(e) => setCampaignFilters({ ...campaignFilters, search: e.target.value })}
                                placeholder="Cari judul aktivitas, catatan, atau tautan..."
                                className="w-full min-h-[40px] pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="min-w-0">
                            <CustomSelect
                                value={campaignFilters.saluran}
                                onChange={(e) => setCampaignFilters({ ...campaignFilters, saluran: e.target.value })}
                                label="Filter Saluran"
                            >
                                <option value="all">Semua Saluran</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Poster Toko">Poster Toko</option>
                                <option value="Google Maps">Google Maps</option>
                                <option value="TikTok">TikTok</option>
                                <option value="Website / Tracking">Portal Tracking Publik</option>
                                <option value="Lainnya">Lainnya</option>
                            </CustomSelect>
                        </div>
                        <div className="min-w-0">
                            <CustomSelect
                                value={campaignFilters.promotion_id}
                                onChange={(e) => setCampaignFilters({ ...campaignFilters, promotion_id: e.target.value })}
                                label="Filter Promo"
                                searchable
                            >
                                <option value="all">Semua Promo</option>
                                <option value="none">Kampanye Umum (Tanpa Promo)</option>
                                {promotions.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.kode_promo} - {p.nama_promo}
                                    </option>
                                ))}
                            </CustomSelect>
                        </div>
                    </div>

                    {loadingCampaigns ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 flex justify-center">
                            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
                            <NotebookPen className="w-9 h-9 text-slate-300 mx-auto" />
                            <h3 className="text-sm font-bold text-slate-700">Belum ada catatan kampanye</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">Catat di mana dan kapan promo dipublikasikan (Instagram, WhatsApp, Poster Toko, dll.) beserta tautannya.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Cards (< 1024px) */}
                            <div className="space-y-3 lg:hidden">
                                {campaigns.map((cn) => {
                                    const isUrl = cn.tautan_referensi && /^https?:\/\//i.test(cn.tautan_referensi);
                                    return (
                                        <div key={cn.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5 text-xs min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-2xs font-bold">
                                                        <Megaphone className="w-3 h-3 shrink-0" /> {cn.saluran}
                                                    </span>
                                                    <h3 className="font-bold text-slate-900 text-sm mt-1.5 break-words">{cn.judul}</h3>
                                                </div>
                                                <span className="text-2xs text-slate-500 font-mono shrink-0">{formatDate(cn.tanggal_publikasi)}</span>
                                            </div>
                                            {cn.promotion ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-2xs font-bold max-w-full">
                                                    <Tag className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{cn.promotion.kode_promo} · {cn.promotion.nama_promo}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-block text-2xs text-slate-400 italic">Kampanye Umum / Brand Awareness</span>
                                            )}
                                            {cn.catatan && <p className="text-xs text-slate-600 leading-relaxed break-words">{cn.catatan}</p>}
                                            {cn.tautan_referensi && (
                                                isUrl ? (
                                                    <a
                                                        href={cn.tautan_referensi}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-2xs max-w-full"
                                                    >
                                                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">Buka Tautan Referensi</span>
                                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                                    </a>
                                                ) : (
                                                    <p className="text-2xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 break-words">
                                                        {cn.tautan_referensi}
                                                    </p>
                                                )
                                            )}
                                            {canManage && (
                                                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingCampaign(cn); setIsCampaignModalOpen(true); }}
                                                        className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 font-semibold"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteCampaign(cn)}
                                                        className="min-h-[36px] px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5 font-semibold"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table (>= 1024px) */}
                            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-2xs tracking-wider">
                                            <th className="py-3 px-4">Tanggal &amp; Saluran</th>
                                            <th className="py-3 px-4">Aktivitas &amp; Catatan</th>
                                            <th className="py-3 px-4">Promo Terkait</th>
                                            <th className="py-3 px-4">Tautan / Referensi</th>
                                            <th className="py-3 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {campaigns.map((cn) => {
                                            const isUrl = cn.tautan_referensi && /^https?:\/\//i.test(cn.tautan_referensi);
                                            return (
                                                <tr key={cn.id} className="hover:bg-slate-50/70">
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <span className="font-semibold text-slate-800 block">{formatDate(cn.tanggal_publikasi)}</span>
                                                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-2xs font-bold">
                                                            <Megaphone className="w-3 h-3" /> {cn.saluran}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 max-w-md">
                                                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{cn.judul}</p>
                                                        {cn.catatan && <p className="text-slate-600 mt-0.5 leading-snug">{cn.catatan}</p>}
                                                        {cn.created_by_nama && <span className="text-2xs text-slate-400 block mt-1">Dicatat oleh {cn.created_by_nama}</span>}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {cn.promotion ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setRedemptionPromoId(cn.promotion.id)}
                                                                className="text-left group cursor-pointer"
                                                            >
                                                                <span className="font-mono text-2xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded group-hover:bg-blue-100">
                                                                    {cn.promotion.kode_promo}
                                                                </span>
                                                                <span className="block text-slate-700 font-medium mt-1">{cn.promotion.nama_promo}</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Kampanye Umum</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 max-w-[220px]">
                                                        {cn.tautan_referensi ? (
                                                            isUrl ? (
                                                                <a
                                                                    href={cn.tautan_referensi}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-2xs"
                                                                    title={cn.tautan_referensi}
                                                                >
                                                                    <Link2 className="w-3.5 h-3.5" /> Buka Tautan <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            ) : (
                                                                <span className="font-mono text-2xs text-slate-600 block truncate" title={cn.tautan_referensi}>
                                                                    {cn.tautan_referensi}
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        {canManage && (
                                                            <div className="inline-flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setEditingCampaign(cn); setIsCampaignModalOpen(true); }}
                                                                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                                                                    title="Edit Catatan"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteCampaign(cn)}
                                                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                                                    title="Hapus Catatan"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ================= TAB 3: CUSTOMER OUTREACH (3-STEP GUIDED FLOW) ================= */}
            {activeTab === "outreach" && (
                <div className="space-y-4 min-w-0">
                    {/* STEP 1: Pilih Promo / Diskon + Filter Pelanggan */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                                <h2 className="section-title truncate">Pilih Promo yang Ingin Ditawarkan</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={handleCopyPhoneList}
                                    className="btn-secondary min-h-[38px] px-3 text-xs flex items-center justify-center gap-1.5 min-w-0"
                                >
                                    <Copy className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Salin ({outreachData.total})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportOutreachCsv}
                                    className="btn-secondary min-h-[38px] px-3 text-xs flex items-center justify-center gap-1.5 min-w-0"
                                >
                                    <Download className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Ekspor CSV</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
                            <div className="min-w-0">
                                <label className="form-label">Promo / Diskon Aktif</label>
                                <CustomSelect
                                    value={selectedTemplatePromoId}
                                    onChange={(e) => handleSelectOutreachPromo(e.target.value)}
                                    label="Pilih Promo untuk Ditawarkan"
                                    searchable
                                >
                                    <option value="">-- Pesan Sapaan Umum (Tanpa Promo) --</option>
                                    {activePromosForTemplate.map((p) => {
                                        const valStr = p.tipe_diskon === "persen" ? `${p.nilai_diskon}%` : formatRupiah(p.nilai_diskon);
                                        return (
                                            <option key={p.id} value={p.id}>
                                                {p.kode_promo} · {p.nama_promo} ({valStr})
                                            </option>
                                        );
                                    })}
                                </CustomSelect>
                            </div>

                            {selectedTemplatePromo ? (
                                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono font-bold text-blue-700 truncate">
                                            {selectedTemplatePromo.kode_promo} · {selectedTemplatePromo.nama_promo}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectOutreachPromo("")}
                                            className="text-2xs font-bold text-blue-700 hover:underline shrink-0 cursor-pointer"
                                        >
                                            Ganti / Reset
                                        </button>
                                    </div>
                                    <p className="text-2xs sm:text-xs text-blue-800 break-words">
                                        Potongan{" "}
                                        <strong>
                                            {selectedTemplatePromo.tipe_diskon === "persen"
                                                ? `${selectedTemplatePromo.nilai_diskon}%`
                                                : formatRupiah(selectedTemplatePromo.nilai_diskon)}
                                        </strong>{" "}
                                        ({SCOPE_LABEL[selectedTemplatePromo.cakupan_diskon] || selectedTemplatePromo.cakupan_diskon})
                                        {" "}· Kategori: <strong>{selectedTemplatePromo.kategori_perangkat}</strong>
                                        {" "}· s/d {formatDate(selectedTemplatePromo.tanggal_selesai)}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                                    Pilih salah satu promo aktif di sebelah kiri, lalu klik pelanggan di bawah untuk memunculkan pesan penawaran personal siap kirim.
                                </div>
                            )}
                        </div>

                        {/* Customer Filters */}
                        <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            <div className="min-w-0">
                                <label className="form-label">Kategori Perangkat</label>
                                <CustomSelect
                                    value={outreachFilters.kategori_perangkat}
                                    onChange={(e) => setOutreachFilters({ ...outreachFilters, kategori_perangkat: e.target.value })}
                                    label="Kategori Perangkat"
                                >
                                    <option value="Semua">Semua Perangkat</option>
                                    <option value="Laptop">Pemilik Laptop</option>
                                    <option value="PC Desktop">Pemilik PC Desktop</option>
                                    <option value="Printer">Pemilik Printer</option>
                                    <option value="Smartphone">Pemilik Smartphone</option>
                                </CustomSelect>
                            </div>
                            <div className="min-w-0">
                                <label className="form-label">Terakhir Berkunjung</label>
                                <CustomSelect
                                    value={outreachFilters.min_days_since_visit}
                                    onChange={(e) => setOutreachFilters({ ...outreachFilters, min_days_since_visit: e.target.value })}
                                    label="Lama Tidak Berkunjung"
                                >
                                    <option value="0">Kapan saja (Semua)</option>
                                    <option value="30">Lebih dari 30 hari lalu</option>
                                    <option value="90">Lebih dari 3 bulan (90 hari)</option>
                                    <option value="180">Lebih dari 6 bulan (180 hari)</option>
                                    <option value="365">Lebih dari 1 tahun (365 hari)</option>
                                </CustomSelect>
                            </div>
                            <div className="min-w-0">
                                <label className="form-label">Minimal Riwayat Servis</label>
                                <CustomSelect
                                    value={outreachFilters.min_tickets}
                                    onChange={(e) => setOutreachFilters({ ...outreachFilters, min_tickets: e.target.value })}
                                    label="Minimal Riwayat Servis"
                                >
                                    <option value="0">Semua Pelanggan</option>
                                    <option value="1">Minimal 1x Servis</option>
                                    <option value="2">Repeat Customer (≥ 2x)</option>
                                    <option value="4">Pelanggan Setia (≥ 4x)</option>
                                </CustomSelect>
                            </div>
                            <div className="min-w-0">
                                <label className="form-label">Cari Nama / No. HP / Unit</label>
                                <input
                                    type="text"
                                    value={outreachFilters.search}
                                    onChange={(e) => setOutreachFilters({ ...outreachFilters, search: e.target.value })}
                                    placeholder="Ketik pencarian..."
                                    className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* STEP 2 (Daftar Pelanggan dengan Bounded Scroll & Pagination) + STEP 3 (Pesan Siap Kirim) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch lg:h-[560px]">
                        {/* LEFT: STEP 2 — Pilih Pelanggan (bounded container, no whole-page infinite scroll) */}
                        <div className="lg:col-span-7 lg:h-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-w-0">
                            {/* Pinned Header */}
                            <div className="px-3.5 sm:px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                                    <h3 className="section-title truncate">Pilih Pelanggan ({outreachData.total})</h3>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {sentCustomerIds.size > 0 && (
                                        <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                            {sentCustomerIds.size} terkirim
                                        </span>
                                    )}
                                    <div className="inline-flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5" role="group" aria-label="Jumlah pelanggan per halaman">
                                        {[10, 20, 50].map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setOutreachPageSize(size)}
                                                className={`px-2 py-1 rounded-md text-2xs font-bold transition-colors cursor-pointer ${
                                                    outreachPageSize === size
                                                        ? "bg-blue-600 text-white"
                                                        : "text-slate-600 hover:bg-slate-100"
                                                }`}
                                                title={`Tampilkan ${size} pelanggan per halaman`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bounded Internal Scroll Area — only this box scrolls, never the whole page */}
                            {loadingOutreach ? (
                                <div className="p-12 flex justify-center">
                                    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : outreachData.customers.length === 0 ? (
                                <div className="p-10 text-center text-xs sm:text-sm text-slate-500">
                                    Tidak ditemukan pelanggan yang cocok dengan kriteria filter saat ini.
                                </div>
                            ) : (
                                <>
                                    <div
                                        ref={outreachListScrollRef}
                                        className="max-h-[380px] sm:max-h-[440px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-2.5 sm:p-3 space-y-2 bg-slate-50/40"
                                    >
                                        {paginatedOutreachCustomers.map((c) => {
                                            const isSelected = selectedOutreachCustomer?.id === c.id;
                                            const isSent = sentCustomerIds.has(c.id);
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => handleSelectOutreachCustomer(c)}
                                                    className={`w-full text-left rounded-xl border p-3 sm:p-3.5 transition-all cursor-pointer min-w-0 ${
                                                        isSelected
                                                            ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/15 shadow-xs"
                                                            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60 shadow-2xs"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2.5">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-bold text-slate-900 text-sm break-words">{c.nama}</span>
                                                                {isSent && (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-2xs font-bold">
                                                                        <CheckCircle2 className="w-3 h-3 shrink-0" /> Terkirim
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="font-mono text-xs text-slate-500 mt-0.5">{c.nomor_telepon}</p>
                                                        </div>
                                                        <span className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 ${
                                                            isSelected
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-slate-100 text-slate-700"
                                                        }`}>
                                                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                                            <span>{isSelected ? "Dipilih" : "Pilih"}</span>
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 pt-2 border-t border-slate-100">
                                                        <span className="break-words">Unit: <strong>{c.last_device}</strong> ({c.last_device_category})</span>
                                                        <span>Servis: <strong>{c.total_tickets}x</strong></span>
                                                        {c.days_since_visit !== null && (
                                                            <span className="text-amber-700 font-semibold">{c.days_since_visit} hari lalu</span>
                                                        )}
                                                        <span className="font-mono text-slate-500 sm:ml-auto">{formatRupiah(c.total_spend)}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Pinned Compact Pagination Footer */}
                                    <div className="px-3.5 sm:px-4 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
                                        <span className="tabular-nums">
                                            Menampilkan{" "}
                                            <strong className="text-slate-900">
                                                {(safeOutreachPage - 1) * outreachPageSize + 1}–{Math.min(safeOutreachPage * outreachPageSize, outreachData.customers.length)}
                                            </strong>{" "}
                                            dari <strong className="text-slate-900">{outreachData.customers.length}</strong> pelanggan
                                        </span>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <button
                                                type="button"
                                                onClick={() => handleOutreachPageChange(safeOutreachPage - 1)}
                                                disabled={safeOutreachPage <= 1}
                                                aria-label="Halaman sebelumnya"
                                                className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <ChevronLeft className="w-4 h-4 shrink-0" />
                                                <span className="hidden xs:inline">Prev</span>
                                            </button>
                                            <span className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-800 tabular-nums inline-flex items-center">
                                                {safeOutreachPage} / {outreachTotalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleOutreachPageChange(safeOutreachPage + 1)}
                                                disabled={safeOutreachPage >= outreachTotalPages}
                                                aria-label="Halaman selanjutnya"
                                                className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <span className="hidden xs:inline">Next</span>
                                                <ChevronRight className="w-4 h-4 shrink-0" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* RIGHT: STEP 3 — Premade Message Appears ONLY After Selecting a Customer */}
                        <div ref={composerCardRef} className="lg:col-span-5 lg:h-full min-w-0 flex flex-col">
                            {selectedOutreachCustomer ? (
                                <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm p-4 sm:p-5 flex flex-col gap-3.5 min-w-0 lg:h-full overflow-hidden">
                                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 shrink-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                                            <div className="min-w-0">
                                                <h3 className="section-title truncate">Pesan Siap Kirim</h3>
                                                <p className="text-2xs text-slate-500 truncate">
                                                    Untuk <strong className="text-slate-800">{selectedOutreachCustomer.nama}</strong> ({selectedOutreachCustomer.nomor_telepon})
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOutreachCustomer(null)}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
                                            title="Tutup & pilih pelanggan lain"
                                            aria-label="Tutup"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 text-2xs shrink-0">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                                            Unit: {selectedOutreachCustomer.last_device}
                                        </span>
                                        {selectedTemplatePromo ? (
                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                                                Promo: {selectedTemplatePromo.kode_promo}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                                                Pesan Umum (Tanpa Promo)
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex flex-col flex-1 min-h-0">
                                        <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
                                            <label className="form-label !mb-0">Isi Pesan WhatsApp (Bisa Diedit)</label>
                                            <button
                                                type="button"
                                                onClick={() => setComposedOutreachMessage(buildCustomerPromoMessage(selectedTemplatePromo, selectedOutreachCustomer))}
                                                className="text-2xs font-semibold text-blue-600 hover:underline shrink-0 cursor-pointer"
                                            >
                                                Reset Teks
                                            </button>
                                        </div>
                                        <textarea
                                            rows={8}
                                            value={composedOutreachMessage}
                                            onChange={(e) => setComposedOutreachMessage(e.target.value)}
                                            className="w-full lg:flex-1 lg:min-h-0 resize-none px-3.5 py-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none leading-relaxed custom-scrollbar"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5 pt-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleCopyComposedMessage}
                                            className="btn-secondary min-h-[40px] px-3 text-xs sm:text-sm flex items-center justify-center gap-1.5"
                                        >
                                            <Copy className="w-4 h-4 shrink-0" />
                                            <span>Salin Pesan</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSendComposedWhatsApp}
                                            className="min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                        >
                                            <Send className="w-4 h-4 shrink-0" />
                                            <span>Kirim WA</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="hidden lg:flex lg:h-full flex-col items-center justify-center text-center bg-slate-50/80 rounded-xl border border-dashed border-slate-300 p-8 space-y-2.5">
                                    <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-2xs">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800">Pesan Personal Belum Dibuka</h3>
                                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                                        Pilih promo di <strong>Langkah 1</strong>, lalu klik salah satu pelanggan di <strong>Langkah 2</strong>. Teks penawaran personal siap kirim akan langsung muncul di sini.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= TAB 4: BASIC RESULTS & OFFER COMPARISON ================= */}
            {activeTab === "report" && canReport && (
                <div className="space-y-4 min-w-0">
                    {/* Mobile-First Date Filter */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap items-end gap-3">
                        <div className="min-w-0 sm:w-48">
                            <label className="form-label">Dari Tanggal Invoice</label>
                            <input
                                type="date"
                                value={reportDates.startDate}
                                onChange={(e) => setReportDates({ ...reportDates, startDate: e.target.value })}
                                className="w-full min-w-0 min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>
                        <div className="min-w-0 sm:w-48">
                            <label className="form-label">Sampai Tanggal</label>
                            <input
                                type="date"
                                value={reportDates.endDate}
                                onChange={(e) => setReportDates({ ...reportDates, endDate: e.target.value })}
                                className="w-full min-w-0 min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>
                        {(reportDates.startDate || reportDates.endDate) && (
                            <button
                                type="button"
                                onClick={() => setReportDates({ startDate: "", endDate: "" })}
                                className="btn-secondary min-h-[40px] px-4 text-xs sm:text-sm xs:col-span-2 sm:col-span-1 justify-center"
                            >
                                Reset Periode
                            </button>
                        )}
                    </div>

                    {loadingReport || !reportData ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 flex justify-center">
                            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Unified Balanced KPI Strip */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Penukaran Promo</span>
                                    <p className="text-base xs:text-lg sm:text-xl font-bold text-slate-900 tabular-nums mt-1 truncate">{reportData.summary.total_redemptions}</p>
                                    <span className="text-2xs sm:text-xs text-slate-500 block truncate mt-0.5">
                                        {reportData.summary.total_new_customers} Baru · {reportData.summary.total_returning_customers} Kembali
                                    </span>
                                </div>
                                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Omset Invoice Promo</span>
                                    <p className="text-base xs:text-lg sm:text-xl font-bold text-blue-700 font-mono tabular-nums mt-1 truncate">
                                        {formatRupiah(reportData.summary.total_promo_revenue)}
                                    </p>
                                    <span className="text-2xs sm:text-xs text-slate-500 block truncate mt-0.5">Total tagihan bersih</span>
                                </div>
                                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Potongan Promo</span>
                                    <p className="text-base xs:text-lg sm:text-xl font-bold text-rose-600 font-mono tabular-nums mt-1 truncate">
                                        {formatRupiah(reportData.summary.total_promo_diskon)}
                                    </p>
                                    <span className="text-2xs sm:text-xs text-slate-500 block truncate mt-0.5">Via kode promo resmi</span>
                                </div>
                                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Potongan Manual</span>
                                    <p className="text-base xs:text-lg sm:text-xl font-bold text-amber-700 font-mono tabular-nums mt-1 truncate">
                                        {formatRupiah(reportData.summary.total_manual_diskon)}
                                    </p>
                                    <span className="text-2xs sm:text-xs text-slate-500 block truncate mt-0.5">{reportData.summary.total_manual_discount_count} transaksi kasir</span>
                                </div>
                            </div>

                            {/* Comparison Table / Cards */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
                                    <h3 className="section-title">Perbandingan Hasil per Penawaran Promo</h3>
                                </div>
                                {reportData.offers.length === 0 ? (
                                    <div className="p-8 text-center text-xs sm:text-sm text-slate-500">Belum ada data penawaran untuk dibandingkan.</div>
                                ) : (
                                    <>
                                        {/* Mobile Cards (< lg) */}
                                        <div className="divide-y divide-slate-100 lg:hidden">
                                            {reportData.offers.map((o) => (
                                                <div key={o.id} className="p-4 space-y-2.5 text-xs min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setRedemptionPromoId(o.id)}
                                                            className="text-left min-w-0 flex-1"
                                                        >
                                                            <span className="font-mono text-2xs font-bold text-blue-700">{o.kode_promo}</span>
                                                            <p className="font-bold text-slate-900 text-sm break-words mt-0.5">{o.nama_promo}</p>
                                                        </button>
                                                        <span className="text-2xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold shrink-0">
                                                            {o.saluran_promosi}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <div className="min-w-0 truncate">Penukaran: <strong>{o.redemptions}</strong></div>
                                                        <div className="min-w-0 truncate">Baru/Kembali: <strong>{o.new_customers}/{o.returning_customers}</strong></div>
                                                        <div className="text-rose-600 font-mono truncate">Diskon: {formatRupiah(o.total_diskon)}</div>
                                                        <div className="text-blue-700 font-mono font-bold truncate">Omset: {formatRupiah(o.total_omset_bersih)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table (>= lg) */}
                                        <div className="hidden lg:block overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-2xs tracking-wider">
                                                        <th className="py-3 px-4">Promo</th>
                                                        <th className="py-3 px-4">Saluran</th>
                                                        <th className="py-3 px-4 text-center">Penukaran</th>
                                                        <th className="py-3 px-4 text-center">Baru vs Kembali</th>
                                                        <th className="py-3 px-4 text-right">Total Potongan</th>
                                                        <th className="py-3 px-4 text-right">Nilai Invoice Bersih</th>
                                                        <th className="py-3 px-4 text-right">Rata-Rata Nota</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {reportData.offers.map((o) => (
                                                        <tr key={o.id} className="hover:bg-slate-50/70">
                                                            <td className="py-3 px-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRedemptionPromoId(o.id)}
                                                                    className="text-left group cursor-pointer"
                                                                >
                                                                    <span className="font-mono text-2xs font-bold text-blue-700 group-hover:underline">{o.kode_promo}</span>
                                                                    <span className="block font-bold text-slate-900 text-xs sm:text-sm">{o.nama_promo}</span>
                                                                </button>
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-600">{o.saluran_promosi}</td>
                                                            <td className="py-3 px-4 text-center font-bold text-slate-900">
                                                                {o.redemptions}
                                                                {o.sisa_kuota !== null && (
                                                                    <span className="block text-2xs font-normal text-slate-400">sisa {o.sisa_kuota}</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                                                                    <span className="text-blue-700">{o.new_customers} Baru</span>
                                                                    <span className="text-slate-300">|</span>
                                                                    <span className="text-emerald-700">{o.returning_customers} Kembali</span>
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600">
                                                                {formatRupiah(o.total_diskon)}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                                                {formatRupiah(o.total_omset_bersih)}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono text-slate-600">
                                                                {formatRupiah(o.avg_invoice_value)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Modals */}
            <PromotionFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                promotion={editingPromo}
                onSuccess={fetchPromotions}
            />

            <PromotionRedemptionModal
                isOpen={Boolean(redemptionPromoId)}
                onClose={() => setRedemptionPromoId(null)}
                promotionId={redemptionPromoId}
            />

            <CampaignNoteModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                note={editingCampaign}
                promotions={promotions}
                onSuccess={() => {
                    fetchCampaigns();
                    fetchPromotions();
                }}
            />
        </div>
    );
}
