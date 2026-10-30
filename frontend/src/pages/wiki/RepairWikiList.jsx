import { useState, useEffect } from "react";
import { 
    Search, 
    BookOpen, 
    Plus, 
    Filter, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Cpu, 
    ChevronRight, 
    Sparkles, 
    X, 
    ExternalLink, 
    ShieldCheck, 
    Users, 
    Layers, 
    FileText, 
    Wrench, 
    Printer,
    Check 
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import RepairWikiModal from "./RepairWikiModal";
import RepairWikiDetailModal from "./RepairWikiDetailModal";
import SopDetailModal from "./SopDetailModal";
import SopFormModal from "./SopFormModal";

const KATEGORI_WIKI_TABS = [
    { id: "all", label: "Semua Kategori" },
    { id: "Motherboard / Power", label: "Motherboard / Power" },
    { id: "Layar / Display", label: "Layar / Display" },
    { id: "Engsel / Casing", label: "Engsel / Casing" },
    { id: "Storage & OS", label: "Storage & OS" },
    { id: "Pembersihan & Pasta", label: "Pembersihan & Pasta" },
    { id: "Audio & Port", label: "Audio & Port" },
];

const KATEGORI_SOP_TABS = [
    { id: "all", label: "Semua SOP" },
    { id: "Teknisi & QC", label: "Teknisi & QC" },
    { id: "Frontliner & CS", label: "Frontliner & CS" },
    { id: "Operasional Toko", label: "Operasional Toko" },
    { id: "Keselamatan & K3", label: "Keselamatan & K3" },
];

const DIFFICULTY_MAP = {
    Mudah: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Menengah: "bg-amber-50 text-amber-700 border-amber-200",
    Mahir: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function RepairWikiList() {
    const { user, isAdmin } = useAuth();
    
    // Top-Level Mode: "sop" or "wiki"
    const [mainTab, setMainTab] = useState("sop"); // "sop" | "wiki"

    // SOP States
    const [sops, setSops] = useState([]);
    const [loadingSop, setLoadingSop] = useState(true);
    const [sopSearch, setSopSearch] = useState("");
    const [selectedSopKategori, setSelectedSopKategori] = useState("all");
    const [selectedSopRole, setSelectedSopRole] = useState("all");
    const [activeSopDetail, setActiveSopDetail] = useState(null);
    const [isSopFormOpen, setIsSopFormOpen] = useState(false);
    const [sopToEdit, setSopToEdit] = useState(null);

    // Hardware Wiki States
    const [wikis, setWikis] = useState([]);
    const [loadingWiki, setLoadingWiki] = useState(true);
    const [wikiSearch, setWikiSearch] = useState("");
    const [selectedWikiKategori, setSelectedWikiKategori] = useState("all");
    const [selectedMerek, setSelectedMerek] = useState("all");
    const [selectedDifficulty, setSelectedDifficulty] = useState("all");
    const [brands, setBrands] = useState([]);
    const [isCreateWikiOpen, setIsCreateWikiOpen] = useState(false);
    const [wikiToEdit, setWikiToEdit] = useState(null);
    const [activeWikiDetail, setActiveWikiDetail] = useState(null);

    useEffect(() => {
        fetchBrands();
        fetchSops();
    }, []);

    useEffect(() => {
        if (mainTab === "sop") {
            fetchSops();
        } else {
            fetchWikis();
        }
    }, [mainTab, selectedSopKategori, selectedSopRole, selectedWikiKategori, selectedMerek, selectedDifficulty]);

    async function fetchBrands() {
        try {
            const res = await api.get("/brand");
            setBrands(res.data || []);
        } catch (err) {
            console.error("Gagal memuat daftar brand", err);
        }
    }

    async function fetchSops(searchQuery = sopSearch) {
        try {
            setLoadingSop(true);
            const params = {};
            if (searchQuery && searchQuery.trim() !== "") params.search = searchQuery.trim();
            if (selectedSopKategori !== "all") params.kategori = selectedSopKategori;
            if (selectedSopRole !== "all") params.target_role = selectedSopRole;

            const res = await api.get("/sop", { params });
            const list = Array.isArray(res.data?.data) ? res.data.data : [];
            setSops(list);
        } catch (error) {
            console.error("Gagal memuat dokumen SOP", error);
        } finally {
            setLoadingSop(false);
        }
    }

    async function fetchWikis(searchQuery = wikiSearch) {
        try {
            setLoadingWiki(true);
            const params = {};
            if (searchQuery && searchQuery.trim() !== "") params.search = searchQuery.trim();
            if (selectedWikiKategori !== "all") params.kategori = selectedWikiKategori;
            if (selectedMerek !== "all") params.merek = selectedMerek;
            if (selectedDifficulty !== "all") params.tingkat_kesulitan = selectedDifficulty;

            const res = await api.get("/repair-wiki", { params });
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setWikis(list);
        } catch (error) {
            toast.error("Gagal memuat pustaka wiki reparasi");
        } finally {
            setLoadingWiki(false);
        }
    }

    function handleSopSearchSubmit(e) {
        e.preventDefault();
        fetchSops();
    }

    function handleWikiSearchSubmit(e) {
        e.preventDefault();
        fetchWikis();
    }

    async function handleDeleteWiki(id) {
        try {
            await api.delete(`/repair-wiki/${id}`);
            toast.success("Panduan wiki berhasil dihapus");
            setActiveWikiDetail(null);
            fetchWikis();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menghapus panduan wiki");
        }
    }

    return (
        <div className="space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
                        {mainTab === "sop" ? <ShieldCheck className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                Pusat SOP & Knowledge Base
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                KEOS Standard
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pusat panduan operasional standar & basis pengetahuan teknis workshop KomputerAwet / Serv.io.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {mainTab === "sop" ? (
                        isAdmin && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSopToEdit(null);
                                    setIsSopFormOpen(true);
                                }}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tulis SOP Baru</span>
                            </button>
                        )
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setWikiToEdit(null);
                                setIsCreateWikiOpen(true);
                            }}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tulis Kasus Hardware</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Segmented Main Navigation Tabs */}
            <div className="flex items-center p-1.5 bg-slate-200/70 rounded-2xl max-w-md">
                <button
                    type="button"
                    onClick={() => setMainTab("sop")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        mainTab === "sop"
                            ? "bg-white text-blue-600 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Standar SOP Operasional</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                        mainTab === "sop" ? "bg-blue-100 text-blue-700" : "bg-slate-300 text-slate-700"
                    }`}>
                        {sops.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab("wiki")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        mainTab === "wiki"
                            ? "bg-white text-blue-600 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Wrench className="w-4 h-4" />
                    <span>Pustaka Servis Hardware</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                        mainTab === "wiki" ? "bg-blue-100 text-blue-700" : "bg-slate-300 text-slate-700"
                    }`}>
                        {wikis.length}
                    </span>
                </button>
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: STANDAR SOP OPERASIONAL                           */}
            {/* ======================================================== */}
            {mainTab === "sop" && (
                <div className="space-y-5">
                    {/* Filter & Search Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <form onSubmit={handleSopSearchSubmit} className="relative flex-1 w-full">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari kode SOP (e.g. SOP-OPS-004), judul panduan, atau kata kunci..."
                                    value={sopSearch}
                                    onChange={(e) => setSopSearch(e.target.value)}
                                    className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {sopSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSopSearch("");
                                            fetchSops("");
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </form>

                            {/* Role Filter */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <select
                                    value={selectedSopRole}
                                    onChange={(e) => setSelectedSopRole(e.target.value)}
                                    className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Semua Peran / Role</option>
                                    <option value="Teknisi">Khusus Teknisi</option>
                                    <option value="Frontliner">Khusus Frontliner</option>
                                    <option value="Admin">Khusus Admin</option>
                                </select>
                            </div>
                        </div>

                        {/* Category Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                            {KATEGORI_SOP_TABS.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedSopKategori(cat.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                                        selectedSopKategori === cat.id
                                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SOP Cards Grid */}
                    {loadingSop ? (
                        <div className="py-16 text-center text-slate-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-2"></div>
                            <p className="text-xs">Memuat dokumen SOP KEOS...</p>
                        </div>
                    ) : sops.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Tidak ada SOP ditemukan</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Coba ubah kata kunci pencarian atau ganti filter kategori untuk menemukan dokumen SOP yang dicari.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sops.map((sop) => (
                                <div
                                    key={sop.id || sop.kode}
                                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all p-5 flex flex-col justify-between group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                {sop.kode}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                    {sop.kategori}
                                                </span>
                                                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                                    {sop.target_role}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                                                {sop.judul}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                {sop.ringkasan}
                                            </p>
                                        </div>

                                        {/* Poin Kunci Preview (Max 2 bullet points) */}
                                        {sop.poin_kunci_list && sop.poin_kunci_list.length > 0 && (
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                                                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3 text-blue-600" />
                                                    <span>Inti Prosedur:</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {sop.poin_kunci_list.slice(0, 2).map((pt, i) => (
                                                        <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                                                            <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                                            <span className="line-clamp-1">{pt}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Footnotes */}
                                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            Versi {sop.versi || "1.0"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setActiveSopDetail(sop)}
                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                        >
                                            <span>Baca SOP Lengkap</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: PUSTAKA SERVIS HARDWARE                           */}
            {/* ======================================================== */}
            {mainTab === "wiki" && (
                <div className="space-y-5">
                    {/* Filter Bar & Search */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <form onSubmit={handleWikiSearchSubmit} className="relative flex-1 w-full">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan judul, gejala, solusi, seri model, atau kode IC..."
                                    value={wikiSearch}
                                    onChange={(e) => setWikiSearch(e.target.value)}
                                    className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {wikiSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWikiSearch("");
                                            fetchWikis("");
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </form>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <select
                                    value={selectedMerek}
                                    onChange={(e) => setSelectedMerek(e.target.value)}
                                    className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Semua Merek Brand</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.nama}>{b.nama}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Semua Tingkat</option>
                                    <option value="Mudah">Mudah</option>
                                    <option value="Menengah">Menengah</option>
                                    <option value="Mahir">Mahir</option>
                                </select>
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                            {KATEGORI_WIKI_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedWikiKategori(tab.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                                        selectedWikiKategori === tab.id
                                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Wiki List Cards */}
                    {loadingWiki ? (
                        <div className="py-16 text-center text-slate-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-2"></div>
                            <p className="text-xs">Memuat pustaka hardware...</p>
                        </div>
                    ) : wikis.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Belum ada panduan hardware</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Tulis catatan reparasi baru agar solusi teknis dapat dipelajari oleh seluruh teknisi.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {wikis.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setActiveWikiDetail(item)}
                                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between group"
                                >
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[170px]">
                                                {item.merek || "Umum"} {item.model_seri ? `• ${item.model_seri}` : ""}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${DIFFICULTY_MAP[item.tingkat_kesulitan] || DIFFICULTY_MAP.Menengah}`}>
                                                {item.tingkat_kesulitan}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {item.judul}
                                        </h3>

                                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 space-y-1">
                                            <p className="text-[11px] text-slate-400 font-medium">Gejala Utama:</p>
                                            <p className="line-clamp-2 font-medium text-slate-800">{item.gejala}</p>
                                        </div>
                                    </div>

                                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{item.estimasi_waktu || "1-2 Jam"}</span>
                                        </div>
                                        <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                            <span>Detail</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals for SOP */}
            <SopDetailModal
                isOpen={Boolean(activeSopDetail)}
                onClose={() => setActiveSopDetail(null)}
                sop={activeSopDetail}
                canModify={isAdmin}
                onEdit={(sop) => {
                    setActiveSopDetail(null);
                    setSopToEdit(sop);
                    setIsSopFormOpen(true);
                }}
            />

            <SopFormModal
                isOpen={isSopFormOpen}
                onClose={() => {
                    setIsSopFormOpen(false);
                    setSopToEdit(null);
                }}
                sopToEdit={sopToEdit}
                onSuccess={() => fetchSops()}
            />

            {/* Modals for Hardware Wiki */}
            <RepairWikiDetailModal
                isOpen={Boolean(activeWikiDetail)}
                onClose={() => setActiveWikiDetail(null)}
                wiki={activeWikiDetail}
                canModify={isAdmin || user?.id === activeWikiDetail?.user_id}
                onEdit={(wiki) => {
                    setActiveWikiDetail(null);
                    setWikiToEdit(wiki);
                    setIsCreateWikiOpen(true);
                }}
                onDelete={(id) => handleDeleteWiki(id)}
            />

            <RepairWikiModal
                isOpen={isCreateWikiOpen}
                onClose={() => {
                    setIsCreateWikiOpen(false);
                    setWikiToEdit(null);
                }}
                wikiToEdit={wikiToEdit}
                onSuccess={() => fetchWikis()}
            />

        </div>
    );
}
