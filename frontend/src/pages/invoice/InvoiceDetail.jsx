import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Printer, CheckCircle2 } from "lucide-react";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function InvoiceDetail() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    async function fetchInvoice() {
        try {
            const res = await api.get(`/invoice/${id}`);
            setInvoice(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-900">Invoice Tidak Ditemukan</h2>
                <Link to="/invoice" className="text-blue-600 hover:underline mt-2 inline-block">Kembali ke Daftar Invoice</Link>
            </div>
        );
    }

    const { tiket } = invoice;
    const { perangkat } = tiket;
    const { customer } = perangkat;

    return (
        <div className="w-full space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Link
                        to="/invoice"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Detail Invoice</h1>
                        <p className="text-sm text-slate-500 mt-1">Pratinjau tagihan pembayaran servis</p>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Invoice</span>
                </button>
            </div>

            {/* A4 Printable Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print:text-[11px] print:leading-snug">
                <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-8 print:gap-1 border-b border-slate-200 pb-8 print:pb-2">
                    <div>
                        <h2 className="text-3xl print:text-xl font-black text-slate-900 tracking-tight">Serv.io</h2>
                        <p className="text-slate-500 mt-2 print:mt-0 text-sm print:text-[10px] max-w-xs">Pusat Layanan Perbaikan Komputer & Perangkat Elektronik Terpercaya.</p>
                    </div>
                    <div className="text-left md:text-right print:text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 print:py-0 print:px-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4 print:mb-1">
                            <CheckCircle2 className="w-4 h-4 print:w-3 print:h-3" />
                            <span className="text-xs print:text-[9px] font-bold uppercase tracking-wide">Lunas</span>
                        </div>
                        <p className="text-sm print:text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Invoice #</p>
                        <p className="text-2xl print:text-lg font-mono font-bold text-slate-900">INV-{invoice.id.toString().padStart(4, '0')}</p>
                        <p className="text-sm print:text-[9px] text-slate-500 mt-2 print:mt-0">Tanggal: {new Date(invoice.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row print:flex-row justify-between gap-8 print:gap-4 py-8 print:py-2 border-b border-slate-200">
                    <div>
                        <p className="text-xs print:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 print:mb-1">Ditagihkan Kepada:</p>
                        <h3 className="text-lg print:text-base font-bold text-slate-900">{customer.nama}</h3>
                        <p className="text-slate-600 mt-1 print:mt-0">{customer.email}</p>
                        <p className="text-slate-600">{customer.telepon}</p>
                        <p className="text-slate-600 mt-1 print:mt-0">{customer.alamat || "-"}</p>
                    </div>
                    <div className="md:text-right print:text-right">
                        <p className="text-xs print:text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-3 print:mb-0.5">Detail Perangkat & Tiket:</p>
                        <p className="text-slate-900 font-medium">{perangkat.jenis_perangkat} {perangkat.merk} {perangkat.model}</p>
                        <p className="text-slate-600">S/N: {perangkat.serial_number || "-"}</p>
                        <p className="text-slate-600 mt-2 print:mt-0.5">No. Tiket: <span className="font-mono font-medium">{tiket.nomor_tiket}</span></p>
                        <p className="text-slate-600">Teknisi: {tiket.teknisi?.nama || "-"}</p>
                    </div>
                </div>

                <div className="py-6 print:py-2 border-b border-slate-200 bg-slate-50/50 print:bg-transparent px-6 print:px-0 rounded-xl my-6 print:my-2">
                    <p className="text-xs print:text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-3 print:mb-1">Catatan Perbaikan:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-1 gap-6 print:gap-1.5 text-sm print:text-[10px]">
                        <div>
                            <p className="font-semibold text-slate-700 mb-1 print:mb-0">Keluhan Pelanggan:</p>
                            <p className="text-slate-600">{tiket.keluhan}</p>
                        </div>
                        {tiket.diagnosis && (
                            <div>
                                <p className="font-semibold text-slate-700 mb-1 print:mb-0">Diagnosis & Tindakan:</p>
                                <p className="text-slate-600"><span className="font-medium text-slate-700">Masalah:</span> {tiket.diagnosis.masalah}</p>
                                <p className="text-slate-600 mt-1 print:mt-0"><span className="font-medium text-slate-700">Tindakan/Solusi:</span> {tiket.diagnosis.solusi}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="py-2 print:py-0">
                    <p className="text-xs print:text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-4 print:mb-1">Rincian Biaya:</p>
                    <table className="w-full text-left text-sm print:text-[10px]">
                        <thead>
                            <tr className="border-b-2 border-slate-200 text-slate-900">
                                <th className="py-3 print:py-1 font-semibold">Deskripsi</th>
                                <th className="py-3 print:py-1 font-semibold text-right">Harga Satuan</th>
                                <th className="py-3 print:py-1 font-semibold text-right">Qty</th>
                                <th className="py-3 print:py-1 font-semibold text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Biaya Jasa */}
                            <tr>
                                <td className="py-4 print:py-1 text-slate-700">
                                    <span className="font-semibold block">Biaya Jasa Servis</span>
                                    <span className="text-slate-500 text-xs print:text-[8px]">Penanganan teknis perbaikan perangkat</span>
                                </td>
                                <td className="py-4 print:py-1 text-right text-slate-600">{formatRupiah(invoice.biaya_jasa)}</td>
                                <td className="py-4 print:py-1 text-right text-slate-600">1</td>
                                <td className="py-4 print:py-1 text-right font-medium text-slate-900">{formatRupiah(invoice.biaya_jasa)}</td>
                            </tr>
                            
                            {/* Sparepart */}
                            {tiket.penggunaan_sparepart && tiket.penggunaan_sparepart.map((p, index) => (
                                <tr key={index}>
                                    <td className="py-4 print:py-1 text-slate-700">
                                        <span className="font-semibold block">{p.sparepart.nama}</span>
                                        <span className="text-slate-500 text-xs print:text-[8px]">Suku cadang / Sparepart</span>
                                    </td>
                                    <td className="py-4 print:py-1 text-right text-slate-600">{formatRupiah(p.sparepart.harga)}</td>
                                    <td className="py-4 print:py-1 text-right text-slate-600">{p.jumlah}</td>
                                    <td className="py-4 print:py-1 text-right font-medium text-slate-900">{formatRupiah(p.sparepart.harga * p.jumlah)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3" className="py-6 print:py-2 text-right font-semibold text-slate-500 uppercase tracking-wider">Total Pembayaran</td>
                                <td className="py-6 print:py-2 text-right font-black text-xl print:text-sm text-blue-600">{formatRupiah(invoice.total_biaya)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="pt-8 print:pt-4 text-center sm:text-left text-sm print:text-[10px] text-slate-500 border-t border-slate-200 print:mt-4">
                    <p>Terima kasih telah mempercayakan perbaikan perangkat Anda kepada Serv.io.</p>
                    <p className="mt-1 print:mt-0">Invoice ini sah dan diterbitkan secara digital.</p>
                </div>
            </div>
        </div>
    );
}
