import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Users, 
    Briefcase, 
    UserPlus, 
    Search, 
    Plus, 
    CheckCircle2, 
    Clock, 
    ChevronRight, 
    X, 
    Award, 
    Phone, 
    Mail, 
    GraduationCap, 
    Calendar,
    Layers,
    UserCheck,
    XCircle,
    Building2,
    DollarSign,
    Sparkles,
    Edit3,
    Share2,
    ExternalLink,
    Link2,
    Compass,
    RotateCcw
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

import AddApplicantModal from "./AddApplicantModal";
import ApplicantDetailModal from "./ApplicantDetailModal";
import HireApplicantModal from "./HireApplicantModal";
import ShareJobModal from "./ShareJobModal";
import { RECRUITMENT_SOURCES } from "./jobPresets";

const STATUS_TABS = [
    { id: "all", label: "Semua Status" },
    { id: "Baru Masuk", label: "Baru Masuk" },
    { id: "Screening", label: "Screening" },
    { id: "Tes Logika & Teknis", label: "Tes Logika & Teknis" },
    { id: "Wawancara / Trial", label: "Wawancara / Trial" },
    { id: "Diterima", label: "Diterima (Hired)" },
    { id: "Ditolak", label: "Ditolak" },
];

const STATUS_BADGES = {
    "Baru Masuk": "bg-slate-100 text-slate-700 border-slate-200",
    "Screening": "bg-blue-50 text-blue-700 border-blue-200",
    "Tes Logika & Teknis": "bg-amber-50 text-amber-700 border-amber-200",
    "Wawancara / Trial": "bg-sky-50 text-sky-700 border-sky-200",
    "Diterima": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Ditolak": "bg-rose-50 text-rose-700 border-rose-200",
};

export default function RecruitmentDashboard() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();

    // Main Tab: "pipeline" or "jobs"
    const [activeTab, setActiveTab] = useState("pipeline"); // "pipeline" | "jobs"

    // Stats
    const [stats, setStats] = useState({
        total_pelamar: 0,
        baru_masuk: 0,
        screening: 0,
        tes_teknis: 0,
        trial_wawancara: 0,
        diterima: 0,
        ditolak: 0,
        lowongan_aktif: 0,
        sumber_stats: []
    });

    // Jobs state
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    // Applicants state
    const [applicants, setApplicants] = useState([]);
    const [loadingApplicants, setLoadingApplicants] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedJobFilter, setSelectedJobFilter] = useState("all");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
    const [selectedSourceFilter, setSelectedSourceFilter] = useState("all");

    // Modals
    const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
    const [activeApplicantDetail, setActiveApplicantDetail] = useState(null);
    const [hireModalApplicant, setHireModalApplicant] = useState(null);
    const [shareJobTarget, setShareJobTarget] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchJobs();
        fetchApplicants();
    }, []);

    useEffect(() => {
        fetchApplicants(search, selectedJobFilter, selectedStatusFilter, selectedSourceFilter);
    }, [selectedJobFilter, selectedStatusFilter, selectedSourceFilter]);

    async function fetchStats() {
        try {
            const res = await api.get("/recruitment/stats");
            if (res.data?.data) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error("Gagal memuat statistik rekrutmen", err);
        }
    }

    async function fetchJobs() {
        try {
            setLoadingJobs(true);
            const res = await api.get("/recruitment/jobs");
            setJobs(res.data?.data || []);
        } catch (err) {
            console.error("Gagal memuat lowongan", err);
        } finally {
            setLoadingJobs(false);
        }
    }

    async function fetchApplicants(
        searchQuery = search,
        targetJob = selectedJobFilter,
        targetStatus = selectedStatusFilter,
        targetSource = selectedSourceFilter
    ) {
        try {
            setLoadingApplicants(true);
            const params = {};
            if (searchQuery && searchQuery.trim() !== "") params.search = searchQuery.trim();
            if (targetJob !== "all") params.job_id = targetJob;
            if (targetStatus !== "all") params.status = targetStatus;
            if (targetSource !== "all") params.sumber = targetSource;

            const res = await api.get("/recruitment/applicants", { params });
            setApplicants(res.data?.data || []);
        } catch (err) {
            console.error("Gagal memuat daftar pelamar", err);
        } finally {
            setLoadingApplicants(false);
        }
    }

    function handleSearchSubmit(e) {
        e.preventDefault();
        fetchApplicants();
    }

    function handleResetFilters() {
        setSearch("");
        setSelectedJobFilter("all");
        setSelectedStatusFilter("all");
        setSelectedSourceFilter("all");
        fetchApplicants("", "all", "all", "all");
    }

    const formatRupiah = (val) => {
        if (!val) return "0";
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
    };

    // Calculate source counts map from stats
    const sourceCounts = (stats.sumber_stats || []).reduce((acc, item) => {
        acc[item.sumber] = item.count;
        return acc;
    }, {});

    const hasActiveFilters = Boolean(
        search.trim() || 
        selectedJobFilter !== "all" || 
        selectedStatusFilter !== "all" || 
        selectedSourceFilter !== "all"
    );

    return (
        <div className="space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Pusat Rekrutmen & Seleksi Tim
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                KEOS Standard
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Pipeline seleksi teknisi & staf berdasarkan standar Position Design, Uji Logika Troubleshooting, dan Pelacakan Saluran Pelamar.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsAddApplicantOpen(true)}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4 text-slate-600" />
                        <span>Catat Pelamar Baru</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/recruitment/jobs/tambah")}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Buka Lowongan Baru</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-2xs font-semibold text-slate-400">Total Pelamar</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{stats.total_pelamar}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">{stats.lowongan_aktif} Posisi Aktif</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-2xs font-semibold text-blue-600">Screening Awal</div>
                    <div className="text-xl font-bold text-blue-700 mt-1">{stats.baru_masuk + stats.screening}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">Menunggu review berkas</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-2xs font-semibold text-amber-600">Uji Logika & Teknis</div>
                    <div className="text-xl font-bold text-amber-700 mt-1">{stats.tes_teknis}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">Tahap tes diagnosis</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-2xs font-semibold text-sky-600">Wawancara & Trial</div>
                    <div className="text-xl font-bold text-sky-700 mt-1">{stats.trial_wawancara}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">Trial day di workshop</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
                    <div className="text-2xs font-semibold text-emerald-600">Diterima (Hired)</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">{stats.diterima}</div>
                    <div className="text-3xs text-slate-500 mt-0.5">Staf resmi aktif</div>
                </div>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="flex items-center p-1.5 bg-slate-200/70 rounded-2xl max-w-md">
                <button
                    type="button"
                    onClick={() => setActiveTab("pipeline")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === "pipeline"
                            ? "bg-white text-blue-600 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Pipeline Pelamar</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-3xs font-semibold ${
                        activeTab === "pipeline" ? "bg-blue-100 text-blue-700" : "bg-slate-300 text-slate-700"
                    }`}>
                        {applicants.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("jobs")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === "jobs"
                            ? "bg-white text-blue-600 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Briefcase className="w-4 h-4" />
                    <span>Daftar Lowongan</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-3xs font-semibold ${
                        activeTab === "jobs" ? "bg-blue-100 text-blue-700" : "bg-slate-300 text-slate-700"
                    }`}>
                        {jobs.length}
                    </span>
                </button>
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: PIPELINE PELAMAR                                  */}
            {/* ======================================================== */}
            {activeTab === "pipeline" && (
                <div className="space-y-4">

                    {/* Sebaran Sumber Pelamar (Channel Origin Tracker) */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Compass className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Sebaran Saluran Pelamar (Dari Mana Saja Pelamar Masuk?)
                                </span>
                            </div>
                            <span className="text-3xs text-slate-400">
                                Klik salah satu untuk memfilter pipeline
                            </span>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            <button
                                type="button"
                                onClick={() => setSelectedSourceFilter("all")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    selectedSourceFilter === "all"
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                            >
                                <span>Semua Saluran</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-3xs font-bold ${
                                    selectedSourceFilter === "all" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                                }`}>
                                    {stats.total_pelamar}
                                </span>
                            </button>

                            {RECRUITMENT_SOURCES.map((source) => {
                                const count = sourceCounts[source.id] || 0;
                                const isSelected = selectedSourceFilter === source.id;

                                return (
                                    <button
                                        key={source.id}
                                        type="button"
                                        onClick={() => setSelectedSourceFilter(isSelected ? "all" : source.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                                            isSelected
                                                ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20"
                                                : count > 0
                                                    ? `${source.color} hover:opacity-90 shadow-2xs`
                                                    : "bg-slate-50 text-slate-400 border-slate-200/80 hover:bg-slate-100"
                                        }`}
                                    >
                                        <span>{source.short}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-3xs font-bold ${
                                            isSelected
                                                ? "bg-blue-700 text-white"
                                                : count > 0
                                                    ? "bg-white/80 text-current"
                                                    : "bg-slate-200/60 text-slate-500"
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama kandidat, nomor WhatsApp, pendidikan, atau sumber..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            fetchApplicants("", selectedJobFilter, selectedStatusFilter, selectedSourceFilter);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </form>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
                                <select
                                    value={selectedJobFilter}
                                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="all">Semua Posisi Lowongan</option>
                                    {jobs.map(j => (
                                        <option key={j.id} value={j.id}>{j.judul_posisi}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedSourceFilter}
                                    onChange={(e) => setSelectedSourceFilter(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="all">Semua Saluran (Sumber)</option>
                                    {RECRUITMENT_SOURCES.map(src => (
                                        <option key={src.id} value={src.id}>
                                            {src.label} {sourceCounts[src.id] ? `(${sourceCounts[src.id]})` : ""}
                                        </option>
                                    ))}
                                </select>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                                        title="Reset semua filter"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                            {STATUS_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedStatusFilter(tab.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                                        selectedStatusFilter === tab.id
                                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Applicant Cards / List */}
                    {loadingApplicants ? (
                        <div className="py-16 text-center text-slate-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-2"></div>
                            <p className="text-xs">Memuat data kandidat pelamar...</p>
                        </div>
                    ) : applicants.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Tidak ada pelamar pada filter ini</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Belum ada berkas pelamar terdaftar pada kriteria ini. Ubah saluran/posisi atau catat pelamar baru.
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Semua Filter</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {applicants.map((app) => {
                                const avgScore = Math.round((Number(app.skor_logika || 0) + Number(app.skor_teknis || 0) + Number(app.skor_attitude || 0) + Number(app.skor_sop || 0)) / 4);
                                const hasEvaluation = avgScore > 0;

                                const matchedSource = RECRUITMENT_SOURCES.find(s => s.id === app.sumber_lamaran) || {
                                    id: app.sumber_lamaran || "Walk-in",
                                    label: app.sumber_lamaran || "Walk-in",
                                    short: app.sumber_lamaran || "Walk-in",
                                    color: "bg-slate-100 text-slate-700 border-slate-200"
                                };

                                return (
                                    <div
                                        key={app.id}
                                        onClick={() => setActiveApplicantDetail(app)}
                                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between group"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                    <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[130px]">
                                                        {app.job_posting?.judul_posisi || "Posisi"}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md text-3xs font-semibold border ${matchedSource.color} flex items-center gap-1`}>
                                                        <Compass className="w-2.5 h-2.5 opacity-70" />
                                                        <span>{matchedSource.short}</span>
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-md text-3xs font-bold border shrink-0 ${STATUS_BADGES[app.status] || STATUS_BADGES["Baru Masuk"]}`}>
                                                    {app.status}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                    {app.nama_lengkap}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="font-mono">{app.nomor_telepon}</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                                                <div className="flex items-center justify-between text-slate-500">
                                                    <span>Pendidikan:</span>
                                                    <span className="font-semibold text-slate-700 truncate max-w-[150px]">{app.pendidikan || "-"}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-slate-500">
                                                    <span>Pengalaman:</span>
                                                    <span className="font-semibold text-slate-700">{app.pengalaman_thn} Tahun</span>
                                                </div>
                                            </div>

                                            {/* Score Preview */}
                                            {hasEvaluation ? (
                                                <div className="flex items-center justify-between px-3 py-2 bg-blue-50/70 rounded-xl border border-blue-100">
                                                    <span className="text-2xs font-semibold text-blue-900 flex items-center gap-1">
                                                        <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                        <span>Skor Evaluasi KEOS:</span>
                                                    </span>
                                                    <span className={`text-xs font-bold ${avgScore >= 75 ? "text-emerald-700" : avgScore >= 60 ? "text-amber-700" : "text-rose-700"}`}>
                                                        {avgScore}/100
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-2xs text-slate-400 italic px-1">
                                                    Belum dilakukan penilaian rubrik KEOS
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="text-slate-400 text-2xs">
                                                {new Date(app.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                            </span>
                                            <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                                <span>Review & Nilai</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: DAFTAR LOWONGAN POSISI                            */}
            {/* ======================================================== */}
            {activeTab === "jobs" && (
                <div className="space-y-4">
                    {loadingJobs ? (
                        <div className="py-16 text-center text-slate-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-2"></div>
                            <p className="text-xs">Memuat data lowongan...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Belum ada lowongan terdaftar</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Buka lowongan jabatan baru untuk mulai merekrut kandidat teknisi atau frontliner.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                {job.departemen} • {job.tipe_kerja}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-3xs font-bold border ${
                                                job.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                                            }`}>
                                                {job.status}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                                            {job.judul_posisi}
                                        </h3>

                                        {job.gaji_min > 0 && (
                                            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block font-mono">
                                                {formatRupiah(job.gaji_min)} - {formatRupiah(job.gaji_max)}
                                            </div>
                                        )}

                                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                            {job.deskripsi || "Tidak ada deskripsi rinci."}
                                        </p>

                                        {/* Platform Shortcuts if saved */}
                                        {Array.isArray(job.external_links) && job.external_links.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                {job.external_links.map((link, i) => (
                                                    <a
                                                        key={i}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                                        title={`Buka di ${link.platform}`}
                                                    >
                                                        <span>{link.platform}</span>
                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                            <Users className="w-3.5 h-3.5 text-blue-600" />
                                            <span>{job._count?.pelamar || 0} Pelamar Terdaftar</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setShareJobTarget(job)}
                                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                                title="Lihat Format Iklan Loker Siap Copas"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                                <span>Iklan Copas</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/recruitment/jobs/edit/${job.id}`)}
                                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <AddApplicantModal
                isOpen={isAddApplicantOpen}
                onClose={() => setIsAddApplicantOpen(false)}
                jobs={jobs}
                onSuccess={() => {
                    fetchApplicants();
                    fetchStats();
                }}
            />

            <ApplicantDetailModal
                isOpen={Boolean(activeApplicantDetail)}
                onClose={() => setActiveApplicantDetail(null)}
                applicant={activeApplicantDetail}
                onUpdate={() => {
                    fetchApplicants();
                    fetchStats();
                }}
                onOpenHireModal={(app) => {
                    setActiveApplicantDetail(null);
                    setHireModalApplicant(app);
                }}
            />

            <HireApplicantModal
                isOpen={Boolean(hireModalApplicant)}
                onClose={() => setHireModalApplicant(null)}
                applicant={hireModalApplicant}
                onSuccess={() => {
                    fetchApplicants();
                    fetchStats();
                }}
            />

            <ShareJobModal
                isOpen={Boolean(shareJobTarget)}
                onClose={() => setShareJobTarget(null)}
                job={shareJobTarget}
            />

        </div>
    );
}
