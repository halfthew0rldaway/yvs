import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Plus, FileText, Search, Filter } from "lucide-react";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [monthFilter, setMonthFilter] = useState("");

    useEffect(() => {
        fetchInvoices();
    }, []);

    async function fetchInvoices() {
        try {
            const res = await api.get("/invoice");
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredInvoices = invoices.filter((inv) => {
        const matchesSearch = 
            inv.tiket?.nomor_tiket?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            inv.tiket?.perangkat?.customer?.nama?.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesMonth = true;
        if (monthFilter) {
            const invDate = new Date(inv.created_at);
            const invMonthStr = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
            matchesMonth = invMonthStr === monthFilter;
        }

        return matchesSearch && matchesMonth;
    });

    const uniqueMonths = [...new Set(invoices.map(inv => {
        const d = new Date(inv.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }))].sort().reverse();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Invoice</h1>
                    <p className="text-sm text-slate-500 mt-1">Daftar tagihan pembayaran pelanggan</p>
                </div>
                <Link
                    to="/invoice/tambah"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Buat Invoice</span>
                </Link>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan No Tiket atau Nama Customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm appearance-none cursor-pointer"
                    >
                        <option value="">Semua Bulan</option>
                        {uniqueMonths.map((m) => {
                            const [year, month] = m.split('-');
                            const monthName = new Date(year, month - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                            return <option key={m} value={m}>{monthName}</option>;
                        })}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Invoice tidak ditemukan</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Coba gunakan kata kunci pencarian atau filter yang berbeda.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">No Tiket</th>
                                    <th className="px-6 py-4 font-semibold">Customer</th>
                                    <th className="px-6 py-4 font-semibold text-right">Biaya Jasa</th>
                                    <th className="px-6 py-4 font-semibold text-right">Biaya Sparepart</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                                    <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{inv.tiket?.nomor_tiket}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{inv.tiket?.perangkat?.customer?.nama}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">{formatRupiah(inv.biaya_jasa)}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">{formatRupiah(inv.biaya_sparepart)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatRupiah(inv.total_biaya)}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(inv.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</td>
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
                </div>
            </div>
        </div>
    );
}
