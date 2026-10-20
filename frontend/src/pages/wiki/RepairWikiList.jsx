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
    ExternalLink
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import RepairWikiModal from "./RepairWikiModal";
import RepairWikiDetailModal from "./RepairWikiDetailModal";

const KATEGORI_TABS = [
    { id: "all", label: "Semua Kategori" },
    { id: "Motherboard / Power", label: "Motherboard / Power" },
    { id: "Layar / Display", label: "Layar / Display" },
    { id: "Engsel / Casing", label: "Engsel / Casing" },
    { id: "Storage & OS", label: "Storage & OS" },
    { id: "Pembersihan & Pasta", label: "Pembersihan & Pasta" },
    { id: "Audio & Port", label: "Audio & Port" },
];

const DIFFICULTY_MAP = {
    Mudah: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Menengah: "bg-amber-50 text-amber-700 border-amber-200",
    Mahir: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function RepairWikiList() {
    const { user, isAdmin } = useAuth();
    const [wikis, setWikis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedKategori, setSelectedKategori] = useState("all");
    const [selectedMerek, setSelectedMerek] = useState("all");
    const [selectedDifficulty, setSelectedDifficulty] = useState("all");
    const [brands, setBrands] = useState([]);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [wikiToEdit, setWikiToEdit] = useState(null);
    const [activeWikiDetail, setActiveWikiDetail] = useState(null);

    useEffect(() => {
        fetchBrands();
    }, []);

    useEffect(() => {
        fetchWikis();
    }, [selectedKategori, selectedMerek, selectedDifficulty]);

    async function fetchBrands() {
        try {
            const res = await api.get("/brand");
            setBrands(res.data || []);
        } catch (err) {
            console.error("Gagal memuat daftar brand", err);
        }
    }

    async function fetchWikis(searchQuery = search) {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery && searchQuery.trim() !== "") params.search = searchQuery.trim();
            if (selectedKategori !== "all") params.kategori = selectedKategori;
            if (selectedMerek !== "all") params.merek = selectedMerek;
            if (selectedDifficulty !== "all") params.tingkat_kesulitan = selectedDifficulty;

            const res = await api.get("/repair-wiki", { params });
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setWikis(list);
        } catch (error) {
            toast.error("Gagal memuat pustaka wiki reparasi");
        } finally {
            setLoading(false);
        }
    }

    function handleSearchSubmit(e) {
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
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pustaka Wiki Reparasi</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {wikis.length} Panduan
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Basis pengetahuan hardware internal untuk solusi cepat kasus kerusakan laptop & komputer.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setWikiToEdit(null);
                            setIsCreateModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tulis Panduan Baru</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan judul, gejala, solusi, seri model, atau kode IC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    fetchWikis("");
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </form>

                    {/* Merek Filter */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                            value={selectedMerek}
                            onChange={(e) => setSelectedMerek(e.target.value)}
                            className="w-full md:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Semua Merek</option>
                            {brands.map(b => (
                                <option key={b.id} value={b.nama}>{b.nama}</option>
                            ))}
                        </select>

                        {/* Difficulty Filter */}
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="w-full md:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Semua Level</option>
                            <option value="Mudah">Mudah</option>
                            <option value="Menengah">Menengah</option>
                            <option value="Mahir">Mahir</option>
                        </select>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                    {KATEGORI_TABS.map(tab => {
                        const isActive = selectedKategori === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedKategori(tab.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                                    isActive 
                                        ? "bg-slate-900 text-white font-semibold shadow-xs" 
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Wiki Cards Grid */}
            {loading ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-medium">Memuat pustaka wiki reparasi...</p>
                </div>
            ) : wikis.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">Belum Ada Panduan Wiki</h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                        Tidak ada catatan wiki yang sesuai dengan filter atau pencarian Anda. Tulis panduan baru untuk memperkaya database toko.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setWikiToEdit(null);
                            setIsCreateModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tulis Panduan Pertama</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wikis.map(wiki => {
                        const diffBadge = DIFFICULTY_MAP[wiki.tingkat_kesulitan] || DIFFICULTY_MAP.Menengah;
                        return (
                            <div
                                key={wiki.id}
                                onClick={() => setActiveWikiDetail(wiki)}
                                className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    {/* Badges Top */}
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            {wiki.merek || "Umum"} {wiki.model_seri ? `• ${wiki.model_seri}` : ""}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {wiki.kategori}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${diffBadge}`}>
                                            {wiki.tingkat_kesulitan}
                                        </span>
                                    </div>

                                    {/* Judul */}
                                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
                                        {wiki.judul}
                                    </h3>

                                    {/* Gejala Preview */}
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                        <span className="font-medium text-slate-700">Gejala: </span>
                                        {wiki.gejala}
                                    </p>

                                    {/* Komponen Preview */}
                                    {wiki.komponen_terkait && (
                                        <div className="inline-block px-2 py-1 bg-slate-50 border border-slate-200/60 rounded-md text-[10px] font-mono text-slate-600 max-w-full truncate mb-3">
                                            Part: {wiki.komponen_terkait}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Card */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{wiki.estimasi_waktu || "1-2 Jam"}</span>
                                        {wiki.tingkat_sukses && (
                                            <span className="text-emerald-600 font-medium">
                                                • {wiki.tingkat_sukses}% Sukses
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                        Buka
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <RepairWikiModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setWikiToEdit(null);
                }}
                wikiToEdit={wikiToEdit}
                onSuccess={fetchWikis}
            />

            <RepairWikiDetailModal
                isOpen={Boolean(activeWikiDetail)}
                onClose={() => setActiveWikiDetail(null)}
                wiki={activeWikiDetail}
                canModify={isAdmin || (activeWikiDetail && user && activeWikiDetail.user_id === user.id)}
                onEdit={(wiki) => {
                    setWikiToEdit(wiki);
                    setIsCreateModalOpen(true);
                }}
                onDelete={handleDeleteWiki}
            />

        </div>
    );
}
