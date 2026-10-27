import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
    Database,
    HardDrive,
    FolderArchive,
    Download,
    FileSpreadsheet,
    FileCode,
    FileText,
    CheckCircle2,
    Clock,
    ShieldCheck,
    AlertTriangle,
    Trash2,
    RefreshCw,
    Layers,
    Calendar,
    Users,
    Ticket,
    BadgeDollarSign,
    Wrench,
    RotateCcw,
    Laptop,
    BookOpen,
    Activity,
    Check,
    Info,
    Sparkles
} from "lucide-react";

export default function DatabaseManagement() {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Export options
    const [selectedFormat, setSelectedFormat] = useState("excel"); // excel, json, sql
    const [dateRange, setDateRange] = useState("all"); // all, month, quarter, year, custom
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedModules, setSelectedModules] = useState([
        "customers",
        "tiketServis",
        "invoices",
        "spareparts",
        "activityLogs",
        "loaner",
        "rma",
        "wikis"
    ]);

    const [isExporting, setIsExporting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isNormalizing, setIsNormalizing] = useState(false);

    // Housekeeping modal
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [cleanupDays, setCleanupDays] = useState(365);
    const [isCleaning, setIsCleaning] = useState(false);

    const moduleOptions = [
        {
            id: "customers",
            name: "Pelanggan & Unit Perangkat",
            desc: "Data profil customer, no telepon, riwayat perangkat & serial number",
            icon: Users,
            countKey: "customer",
            color: "text-blue-600 bg-blue-50 border-blue-100"
        },
        {
            id: "tiketServis",
            name: "Tiket Servis, Diagnosis & SOP",
            desc: "Keluhan, SLA, checklist fisik, durasi garansi, riwayat pengerjaan",
            icon: Ticket,
            countKey: "tiketServis",
            color: "text-indigo-600 bg-indigo-50 border-indigo-100"
        },
        {
            id: "invoices",
            name: "Faktur, Invoice & Finansial",
            desc: "Rincian biaya jasa, biaya sparepart, total transaksi pembayaran",
            icon: BadgeDollarSign,
            countKey: "invoice",
            color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
            id: "spareparts",
            name: "Gudang Suku Cadang & Log Restok",
            desc: "Katalog sparepart, stok, HPP/harga modal, harga jual, audit pembelian",
            icon: Wrench,
            countKey: "sparepart",
            color: "text-amber-600 bg-amber-50 border-amber-100"
        },
        {
            id: "activityLogs",
            name: "Log Aktivitas & Jejak Audit",
            desc: "Audit trail pencatatan setiap aksi admin/teknisi di sistem",
            icon: Activity,
            countKey: "activityLog",
            color: "text-slate-700 bg-slate-100 border-slate-200"
        },
        {
            id: "loaner",
            name: "Unit Pinjaman (Loaner Pool)",
            desc: "Katalog unit cadangan, riwayat peminjaman customer & uang deposit",
            icon: Laptop,
            countKey: "loaner",
            color: "text-purple-600 bg-purple-50 border-purple-100"
        },
        {
            id: "rma",
            name: "Klaim Garansi Distributor (RMA)",
            desc: "Riwayat pengajuan suku cadang cacat, kurir, dan solusi refund/ganti",
            icon: RotateCcw,
            countKey: "rma",
            color: "text-rose-600 bg-rose-50 border-rose-100"
        },
        {
            id: "wikis",
            name: "Basis Pengetahuan (Repair Wiki)",
            desc: "SOP langkah perbaikan hardware motherboard, layar, dan thermal",
            icon: BookOpen,
            countKey: "wiki",
            color: "text-teal-600 bg-teal-50 border-teal-100"
        }
    ];

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await api.get("/database/stats");
            if (res.data) {
                setStats(res.data);
            }
        } catch (err) {
            console.error("Gagal memuat statistik database:", err);
            toast.error(err.response?.data?.message || "Gagal memuat statistik database");
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Toggle specific module selection
    const toggleModule = (modId) => {
        setSelectedModules(prev =>
            prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
        );
    };

    // Preset Selectors
    const selectAllModules = () => {
        setSelectedModules(moduleOptions.map(m => m.id));
    };

    const selectServiceOnly = () => {
        setSelectedModules(["customers", "tiketServis"]);
    };

    const selectFinanceOnly = () => {
        setSelectedModules(["invoices", "spareparts"]);
    };

    const selectAuditOnly = () => {
        setSelectedModules(["activityLogs"]);
    };

    // Execute Export
    const handleExport = async () => {
        if (selectedModules.length === 0) {
            toast.error("Pilih minimal satu modul data untuk diekspor");
            return;
        }

        if (dateRange === "custom" && !startDate && !endDate) {
            toast.error("Silakan tentukan tanggal mulai atau tanggal akhir");
            return;
        }

        setIsExporting(true);
        const toastId = toast.loading("Menyiapkan berkas cadangan database...");

        try {
            const payload = {
                modules: selectedModules,
                format: selectedFormat,
                dateRange,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            };

            if (selectedFormat === "excel") {
                const res = await api.post("/database/export", payload);
                const { sheets, filename } = res.data;

                const wb = XLSX.utils.book_new();
                let sheetCount = 0;

                for (const sheetName of Object.keys(sheets)) {
                    const rows = sheets[sheetName];
                    if (Array.isArray(rows) && rows.length > 0) {
                        const ws = XLSX.utils.json_to_sheet(rows);
                        // Sheet name max 31 chars in Excel
                        const safeTitle = sheetName.substring(0, 31);
                        XLSX.utils.book_append_sheet(wb, ws, safeTitle);
                        sheetCount++;
                    }
                }

                if (sheetCount === 0) {
                    toast.error("Tidak ada data ditemukan untuk parameter yang dipilih", { id: toastId });
                    setIsExporting(false);
                    return;
                }

                XLSX.writeFile(wb, filename || `Servio_Backup_${new Date().toISOString().split("T")[0]}.xlsx`);
                toast.success(`Cadangan Excel berhasil diunduh (${sheetCount} lembar kerja)!`, { id: toastId });
            } else {
                // SQL or JSON (Direct File Blob Download)
                const res = await api.post("/database/export", payload, {
                    responseType: "blob"
                });

                const blob = new Blob([res.data], {
                    type: selectedFormat === "sql" ? "application/sql" : "application/json"
                });

                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = downloadUrl;
                const ext = selectedFormat === "sql" ? "sql" : "json";
                link.download = `Servio_Backup_${new Date().toISOString().split("T")[0]}.${ext}`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);

                toast.success(`Cadangan ${selectedFormat.toUpperCase()} berhasil diunduh!`, { id: toastId });
            }

            // Refresh stats to reflect new export log
            fetchStats();
        } catch (err) {
            console.error("Gagal ekspor database:", err);
            toast.error("Gagal mengunduh cadangan database", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    // Execute Log Cleanup
    const handleCleanup = async () => {
        setIsCleaning(true);
        try {
            const res = await api.post("/database/cleanup-logs", { olderThanDays: cleanupDays });
            toast.success(res.data.message || "Pembersihan log berhasil!");
            setIsCleanupModalOpen(false);
            fetchStats();
        } catch (err) {
            console.error("Gagal membersihkan log:", err);
            toast.error("Gagal melakukan pembersihan log");
        } finally {
            setIsCleaning(false);
        }
    };

    // Execute Seed Realistic Dummy Data
    const handleSeedDummy = async () => {
        setIsSeeding(true);
        const toastId = toast.loading("Menyuntikkan data dummy realistis ke database...");
        try {
            const res = await api.post("/database/seed-dummy");
            toast.success(res.data.message || "Data realistis berhasil ditambahkan!", { id: toastId, duration: 5000 });
            fetchStats();
        } catch (err) {
            console.error("Gagal seed dummy:", err);
            toast.error(err.response?.data?.message || "Gagal menambahkan data dummy", { id: toastId });
        } finally {
            setIsSeeding(false);
        }
    };

    // Execute Normalization & Deduplication Cleanup
    const handleNormalize = async () => {
        setIsNormalizing(true);
        const toastId = toast.loading("Menstandarisasi nomor WhatsApp (08...) & merek kanonikal (ASUS, HP, Lenovo)...");
        try {
            const res = await api.post("/database/normalize-existing");
            toast.success(res.data.message || "Normalisasi database berhasil!", { id: toastId, duration: 6000 });
            fetchStats();
        } catch (err) {
            console.error("Gagal normalisasi database:", err);
            toast.error(err.response?.data?.message || "Gagal melakukan normalisasi database", { id: toastId });
        } finally {
            setIsNormalizing(false);
        }
    };

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
                            <Database className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen & Cadangan Database</h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Pusat ekspor data, cadangan terenkripsi, dan pemantauan kapasitas penyimpanan sistem
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleNormalize}
                        disabled={isNormalizing}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        title="Menstandarisasi merek (ASUS, HP, Lenovo), nomor WhatsApp (08...), dan serial number tanpa merusak relasi data"
                    >
                        <ShieldCheck className={`w-3.5 h-3.5 ${isNormalizing ? "animate-spin" : ""}`} />
                        <span>{isNormalizing ? "Menormalisasi..." : "Normalisasi & Rapihkan Data"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleSeedDummy}
                        disabled={isSeeding}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        title="Menambahkan data dummy realistis (pelanggan, perangkat, tiket, invoice, rma, loaner) tanpa menghapus data lama"
                    >
                        <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
                        <span>{isSeeding ? "Menyuntikkan Data..." : "+ Tambah Data Dummy Realistis"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={fetchStats}
                        disabled={loadingStats}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                        title="Perbarui metrik kapasitas"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingStats ? "animate-spin" : ""}`} />
                        <span>Refresh Metrik</span>
                    </button>
                </div>
            </div>

            {/* Top Stat Cards (Storage & Health) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Database Storage */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kapasitas Database</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <HardDrive className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                            {loadingStats ? "..." : `${stats?.dbSizeMB || 0} MB`}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sehat</span>
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Ukuran tabel relasional MySQL</p>
                </div>

                {/* Media Files Storage */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Media Foto (/uploads)</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <FolderArchive className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                            {loadingStats ? "..." : `${stats?.uploadsSizeMB || 0} MB`}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                            ({stats?.uploadsFileCount || 0} berkas)
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Foto intake, diagnosis & QC</p>
                </div>

                {/* Total Records */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Baris Data</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                            {loadingStats ? "..." : (stats?.totalRecords || 0).toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-slate-400">rekaman</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Akumulasi seluruh modul</p>
                </div>

                {/* Last Backup Record */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cadangan Terakhir</span>
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-sm font-bold text-slate-900 truncate">
                            {stats?.lastBackup ? new Date(stats.lastBackup.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            }) : "Belum Pernah"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                            {stats?.lastBackup?.user_nama ? `Oleh: ${stats.lastBackup.user_nama}` : "Pencadangan manual"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Export Configuration Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Download className="w-5 h-5 text-blue-600" />
                        <span>Konfigurasi Cadangan & Ekspor Data</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pilih format, rentang waktu, dan modul yang ingin dicadangkan ke perangkat Anda
                    </p>
                </div>

                {/* Section 1: Choose Format */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        1. Pilih Format Berkas Cadangan:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Excel */}
                        <div
                            onClick={() => setSelectedFormat("excel")}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                                selectedFormat === "excel"
                                    ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                {selectedFormat === "excel" && (
                                    <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm mt-3">Spreadsheet Excel (.xlsx)</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Multi-sheet terpisah untuk setiap tabel. Format paling ideal untuk pembukuan, evaluasi pimpinan & akuntan.
                            </p>
                        </div>

                        {/* JSON */}
                        <div
                            onClick={() => setSelectedFormat("json")}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                                selectedFormat === "json"
                                    ? "border-blue-600 bg-blue-50/40 shadow-sm"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                                    <FileCode className="w-5 h-5" />
                                </div>
                                {selectedFormat === "json" && (
                                    <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm mt-3">Struktur JSON (.json)</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Snapshot data terstruktur dengan relasi utuh. Format standar untuk integrasi API dan arsip digital developer.
                            </p>
                        </div>

                        {/* SQL Dump */}
                        <div
                            onClick={() => setSelectedFormat("sql")}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                                selectedFormat === "sql"
                                    ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                                    <Database className="w-5 h-5" />
                                </div>
                                {selectedFormat === "sql" && (
                                    <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm mt-3">Native MySQL Dump (.sql)</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Berisi perintah script `INSERT INTO`. Siap di-restore langsung ke server/database baru jika terjadi migrasi hosting.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Choose Date Range */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        2. Tentukan Rentang Waktu Data:
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: "all", label: "Sepanjang Waktu (All Time)" },
                            { id: "month", label: "Bulan Ini" },
                            { id: "quarter", label: "Kuartal Ini (3 Bulan)" },
                            { id: "year", label: "Tahun Ini" },
                            { id: "custom", label: "Kustom Tanggal" }
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setDateRange(item.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    dateRange === item.id
                                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {dateRange === "custom" && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <div className="w-full sm:w-auto">
                                <label className="text-[11px] text-slate-500 font-medium block mb-1">Dari Tanggal:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <span className="text-slate-400 hidden sm:inline pt-5">&mdash;</span>
                            <div className="w-full sm:w-auto">
                                <label className="text-[11px] text-slate-500 font-medium block mb-1">Sampai Tanggal:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 3: Select Modules */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                            3. Pilih Modul Tabel yang Ingin Diikutsertakan ({selectedModules.length} dipilih):
                        </label>
                        {/* Preset Quick Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <button
                                type="button"
                                onClick={selectAllModules}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                            >
                                Pilih Semua
                            </button>
                            <button
                                type="button"
                                onClick={selectServiceOnly}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                            >
                                Hanya Servis
                            </button>
                            <button
                                type="button"
                                onClick={selectFinanceOnly}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                            >
                                Finansial & Gudang
                            </button>
                            <button
                                type="button"
                                onClick={selectAuditOnly}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                            >
                                Hanya Log Audit
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 pt-2">
                        {moduleOptions.map((mod) => {
                            const isSelected = selectedModules.includes(mod.id);
                            const Icon = mod.icon;
                            const count = stats?.counts?.[mod.countKey] || 0;

                            return (
                                <div
                                    key={mod.id}
                                    onClick={() => toggleModule(mod.id)}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                                        isSelected
                                            ? "border-blue-500 bg-blue-50/30 shadow-2xs"
                                            : "border-slate-200 hover:border-slate-300 bg-white opacity-60"
                                    }`}
                                >
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}} // Controlled by parent div
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className={`p-2 rounded-xl border ${mod.color} shrink-0`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-bold text-slate-900 text-xs truncate">{mod.name}</h4>
                                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                                {count.toLocaleString("id-ID")} baris
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">
                                            {mod.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Password hash pengguna otomatis disamarkan demi standar keamanan privasi.</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                    >
                        {isExporting ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Mengekstrak Data Database...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <span>Unduh Cadangan Database Sekarang</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Bottom Maintenance / Housekeeping Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Pembersihan Log Aktivitas Berkala (Housekeeping)</h3>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                            Log aktivitas audit terus bertambah seiring berjalannya transaksi harian. Anda dapat membersihkan rekaman jejak audit yang sudah berusia lebih dari 1 tahun untuk menghemat kapasitas disk dan menjaga kecepatan kueri database.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsCleanupModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Bersihkan Log Lama</span>
                </button>
            </div>

            {/* Confirmation Modal for Cleanup */}
            {isCleanupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Konfirmasi Pembersihan Log</h3>
                                <p className="text-xs text-slate-500">Hanya menghapus rekaman riwayat aktivitas, data tiket & invoice tetap aman.</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-bold text-slate-700 block">Pilih Batas Waktu Log yang Akan Dihapus:</label>
                            <select
                                value={cleanupDays}
                                onChange={(e) => setCleanupDays(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={365}>Lebih lama dari 1 Tahun (365 Hari)</option>
                                <option value={180}>Lebih lama dari 6 Bulan (180 Hari)</option>
                                <option value={90}>Lebih lama dari 3 Bulan (90 Hari)</option>
                            </select>
                        </div>

                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                            <span>
                                <strong>Penting:</strong> Tindakan ini permanen. Sebaiknya Anda mengunduh cadangan (*backup*) data log terlebih dahulu sebelum melakukan pembersihan.
                            </span>
                        </div>

                        <div className="pt-3 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsCleanupModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleCleanup}
                                disabled={isCleaning}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isCleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                <span>Ya, Bersihkan Log</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

