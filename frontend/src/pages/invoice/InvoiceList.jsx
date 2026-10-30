import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Plus, FileText, Search, Printer, CheckCircle, TrendingUp, Wrench, User, X } from "lucide-react";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

export default function InvoiceList() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reportData, setReportData] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Standardized Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchReportSummary();
    }, [startDate, endDate]);

    useEffect(() => {
        fetchInvoices();
    }, [currentPage, pageSize, startDate, endDate]);

    async function fetchReportSummary() {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await api.get("/invoice/report", { params });
            setReportData(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchInvoices(targetSearch = searchQuery, page = currentPage) {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
            };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (targetSearch.trim()) params.search = targetSearch.trim();

            const res = await api.get("/invoice", { params });
            if (res.data && res.data.pagination) {
                setInvoices(res.data.data);
                setTotalItems(res.data.pagination.total);
                setTotalPages(res.data.pagination.totalPages);
            } else if (Array.isArray(res.data)) {
                let filtered = res.data;
                if (targetSearch.trim()) {
                    const q = targetSearch.toLowerCase();
                    filtered = filtered.filter(inv => 
                        inv.tiket?.nomor_tiket?.toLowerCase().includes(q) ||
                        inv.tiket?.perangkat?.customer?.nama?.toLowerCase().includes(q)
                    );
                }
                setTotalItems(filtered.length);
                setTotalPages(Math.ceil(filtered.length / pageSize) || 1);
                const start = (page - 1) * pageSize;
                setInvoices(filtered.slice(start, start + pageSize));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleSearchSubmit(e) {
        e.preventDefault();
        setCurrentPage(1);
        fetchInvoices(searchQuery, 1);
    }

    function handleResetFilter() {
        setStartDate("");
        setEndDate("");
        setSearchQuery("");
        setCurrentPage(1);
        fetchInvoices("", 1);
    }

    function handlePrintReport() {
        window.print();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Data & Laporan Invoice</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Rekapitulasi transaksi, pendapatan periodik, dan performa servis</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                        <FileText className="w-4 h-4 text-slate-300" />
                        <span>Rekap Laporan Keuangan</span>
                    </button>
                    <Link
                        to="/invoice/tambah"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Buat Invoice</span>
                    </Link>
                </div>
            </div>

            {/* Quick KPI Summary Cards */}
            {reportData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Omset</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                Rp
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(reportData.summary.totalPendapatan)}</h3>
                        <p className="text-xs text-slate-500 mt-1">{reportData.summary.totalInvoices} invoice tercatat</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Pendapatan Jasa</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(reportData.summary.totalJasa)}</h3>
                        <p className="text-xs text-emerald-600 font-medium mt-1">Laba murni pengerjaan</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Penjualan Part</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Wrench className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(reportData.summary.totalSparepart)}</h3>
                        <p className="text-xs text-slate-500 mt-1">Komponen & sparepart</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Tiket Servis Selesai</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{reportData.summary.tiketSelesai} Unit</h3>
                        <p className="text-xs text-slate-500 mt-1">Dari {reportData.summary.totalTiketMasuk} tiket masuk</p>
                    </div>
                </div>
            )}

            {/* Date Range & Search Filter Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-3 items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan No Tiket atau Nama Customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                setSearchQuery("");
                                setCurrentPage(1);
                                fetchInvoices("", startDate, endDate, 1);
                            }
                        }}
                        className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setCurrentPage(1);
                                fetchInvoices("", startDate, endDate, 1);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                            title="Hapus pencarian (Esc)"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </form>

                {/* Date Filter Inputs */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
                    <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs flex-1 sm:flex-none">
                        <span className="text-slate-500 font-medium shrink-0">Dari:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-transparent border-0 outline-none text-slate-800 cursor-pointer font-medium w-full sm:w-auto"
                        />
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs flex-1 sm:flex-none">
                        <span className="text-slate-500 font-medium shrink-0">Sampai:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-transparent border-0 outline-none text-slate-800 cursor-pointer font-medium w-full sm:w-auto"
                        />
                    </div>

                    {(startDate || endDate || searchQuery) && (
                        <button
                            type="button"
                            onClick={handleResetFilter}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors shrink-0"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Standardized Contained Table with Pagination */}
            <TableContainer
                footer={
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={(p) => setCurrentPage(p)}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                        unitLabel="invoice"
                        disabled={loading}
                    />
                }
            >
                {loading ? (
                    <TableLoadingState message="Memuat daftar transaksi invoice..." />
                ) : invoices.length === 0 ? (
                    <TableEmptyState
                        icon={FileText}
                        title="Invoice Tidak Ditemukan"
                        description={
                            searchQuery || startDate || endDate
                                ? "Tidak ada invoice yang sesuai dengan rentang tanggal atau kata kunci pencarian."
                                : "Belum ada transaksi invoice yang tercatat di sistem bengkel."
                        }
                        actionLabel={searchQuery || startDate || endDate ? "Reset Filter" : "Buat Invoice Pertama"}
                        onAction={searchQuery || startDate || endDate ? handleResetFilter : () => navigate("/invoice/tambah")}
                    />
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="table-header">
                            <tr>
                                <th className="px-6 py-3.5">No Tiket</th>
                                <th className="px-6 py-3.5">Customer</th>
                                <th className="px-6 py-3.5">Teknisi</th>
                                <th className="px-6 py-3.5 text-right">Biaya Jasa</th>
                                <th className="px-6 py-3.5 text-right">Biaya Sparepart</th>
                                <th className="px-6 py-3.5 text-right">Total Tagihan</th>
                                <th className="px-6 py-3.5">Tanggal Invoice</th>
                                <th className="px-6 py-3.5 text-center w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.map((inv) => (
                                <tr 
                                    key={inv.id} 
                                    onClick={(e) => {
                                        if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                        navigate(`/invoice/${inv.id}`);
                                    }}
                                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{inv.tiket?.nomor_tiket}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <span className="truncate max-w-[190px] block" title={inv.tiket?.perangkat?.customer?.nama || "-"}>
                                            {inv.tiket?.perangkat?.customer?.nama || "-"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-xs">{inv.tiket?.teknisi?.nama || "-"}</td>
                                    <td className="px-6 py-4 text-right text-slate-600 font-mono text-xs">{formatRupiah(inv.biaya_jasa)}</td>
                                    <td className="px-6 py-4 text-right text-slate-600 font-mono text-xs">{formatRupiah(inv.biaya_sparepart)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono text-xs">{formatRupiah(inv.total_biaya)}</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(inv.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Link 
                                            to={`/invoice/${inv.id}`}
                                            className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                        >
                                            Lihat / Cetak
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </TableContainer>

            {/* Modal Rekapitulasi Laporan Keuangan Periodik */}
            {isReportModalOpen && reportData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                        onClick={() => setIsReportModalOpen(false)}
                    ></div>

                    <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 border border-slate-200">
                        {/* Header Modal */}
                        <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between print:hidden">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Laporan Keuangan & Performa Workshop</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Periode: {startDate ? new Date(startDate).toLocaleDateString("id-ID") : "Awal"} s/d {endDate ? new Date(endDate).toLocaleDateString("id-ID") : "Sekarang"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handlePrintReport}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Cetak PDF / Print</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Printable Content */}
                        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
                            {/* Kop Laporan Resmi */}
                            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">SERV.IO IT REPAIR WORKSHOP</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Laporan Rekapitulasi Operasional & Omset Perbaikan</p>
                                    <p className="text-xs text-slate-400 mt-1">Dicetak pada: {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
                                        Periode: {startDate || "Semua"} - {endDate || "Semua"}
                                    </span>
                                </div>
                            </div>

                            {/* Ringkasan Finansial Card Grid */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-xs text-slate-500 font-medium block">Total Pendapatan (Omset)</span>
                                    <span className="text-lg font-bold text-blue-600 block mt-1">{formatRupiah(reportData.summary.totalPendapatan)}</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-xs text-slate-500 font-medium block">Laba Jasa Servis</span>
                                    <span className="text-lg font-bold text-emerald-600 block mt-1">{formatRupiah(reportData.summary.totalJasa)}</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-xs text-slate-500 font-medium block">Penjualan Suku Cadang</span>
                                    <span className="text-lg font-bold text-amber-600 block mt-1">{formatRupiah(reportData.summary.totalSparepart)}</span>
                                </div>
                            </div>

                            {/* Ringkasan Servis Unit */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-around text-xs">
                                <div><span className="text-slate-500">Unit Masuk:</span> <strong className="text-slate-900 ml-1">{reportData.summary.totalTiketMasuk}</strong></div>
                                <div><span className="text-slate-500">Unit Selesai:</span> <strong className="text-emerald-700 ml-1">{reportData.summary.tiketSelesai}</strong></div>
                                <div><span className="text-slate-500">Sedang Dikerjakan:</span> <strong className="text-blue-700 ml-1">{reportData.summary.tiketProses}</strong></div>
                                <div><span className="text-slate-500">Dibatalkan:</span> <strong className="text-rose-700 ml-1">{reportData.summary.tiketBatal}</strong></div>
                            </div>

                            {/* Tabel Performa Staf Teknisi */}
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-slate-500" />
                                    <span>Rekapitulasi Kinerja Teknisi pada Periode Ini</span>
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-x-auto overflow-y-auto max-h-[280px] custom-scrollbar text-xs">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                                            <tr>
                                                <th className="px-4 py-2.5">Nama Teknisi</th>
                                                <th className="px-4 py-2.5 text-center">Ditugaskan</th>
                                                <th className="px-4 py-2.5 text-center">Selesai</th>
                                                <th className="px-4 py-2.5 text-right">Kontribusi Omset</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {reportData.ringkasanTeknisi?.map((tek, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2.5 font-medium text-slate-900">{tek.nama}</td>
                                                    <td className="px-4 py-2.5 text-center text-slate-600">{tek.totalTiket}</td>
                                                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{tek.tiketSelesai}</td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatRupiah(tek.totalOmset)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <p className="text-2xs text-slate-400 text-center pt-2">
                                Dokumen ini dihasilkan secara otomatis oleh Serv.io Workshop Management System.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
