import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { ArrowLeft, Printer, CheckCircle2, ShieldCheck, FileText, QrCode, Award, Wrench, Shield, Check, PenTool, Edit } from "lucide-react";
import { 
    WorkshopSignatureStamp, 
    DigitalSignatureToggleBar 
} from "../../components/DigitalSignatureStamp";
import DigitalSignaturePadModal from "../../components/DigitalSignaturePadModal";
import AdminSignatureSelectorModal, { DEFAULT_WORKSHOP_SIGNATURE } from "../../components/AdminSignatureSelectorModal";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

/**
 * AlignedSignatureRow
 * Renders both Customer & Workshop Staff signatures side-by-side with identical dimensions & zero inline buttons.
 */
function AlignedSignatureRow({
    customerSignature,
    customerName,
    customerSignedAt,
    adminSignature,
    adminName,
    isDigital = true,
    adminRole = "Petugas Workshop • Kasir"
}) {
    const activeAdminSig = isDigital ? (adminSignature || DEFAULT_WORKSHOP_SIGNATURE) : null;
    const activeCustomerSig = isDigital ? customerSignature : null;

    return (
        <div className="flex items-end justify-center sm:justify-end gap-8 sm:gap-10 print:gap-10 select-none shrink-0">
            {/* Kolom Tanda Tangan Pelanggan */}
            <div className="flex flex-col items-center justify-end text-center w-36 sm:w-44 print:w-32">
                <p className="text-slate-600 text-xs print:text-[8.5px] font-semibold mb-1">
                    Penerima / Pelanggan
                </p>

                {/* Box Area Tanda Tangan (Tinggi Presisi & Rata) */}
                <div className="h-20 print:h-14 w-full flex items-center justify-center">
                    {activeCustomerSig ? (
                        <img 
                            src={activeCustomerSig} 
                            alt="Tanda Tangan Pelanggan" 
                            className="max-h-16 print:max-h-12 max-w-[140px] print:max-w-[105px] object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-end justify-center pb-2 border-b border-dashed border-slate-300 print:border-none">
                            <span className="text-3xs print:text-[8px] text-slate-300 print:text-slate-200 italic">
                                {isDigital ? "[ Belum TTD Digital ]" : "[ Tanda Tangan Fisik ]"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Garis Dasar Tanda Tangan */}
                <div className="w-full border-b border-slate-400 mt-1 mb-1"></div>

                {/* Nama Terang Pelanggan */}
                <p className="font-bold text-slate-900 text-xs print:text-[9px] w-full truncate max-w-[160px]">
                    {customerName || "Pelanggan"}
                </p>
                <p className="text-3xs print:text-[7.5px] text-slate-400 font-mono mt-0.5">
                    {customerSignedAt 
                        ? new Date(customerSignedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : "Pelanggan Yangversa"}
                </p>
            </div>

            {/* Kolom Tanda Tangan Petugas Workshop */}
            <div className="flex flex-col items-center justify-end text-center w-36 sm:w-44 print:w-32">
                <p className="text-slate-600 text-xs print:text-[8.5px] font-semibold mb-1">
                    {adminRole}
                </p>

                {/* Box Area Tanda Tangan (Tinggi Presisi & Rata) */}
                <div className="h-20 print:h-14 w-full flex items-center justify-center">
                    {activeAdminSig ? (
                        <img 
                            src={activeAdminSig} 
                            alt={`TTD ${adminName}`} 
                            className="max-h-16 print:max-h-12 max-w-[140px] print:max-w-[105px] object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-end justify-center pb-2 border-b border-dashed border-slate-300 print:border-none">
                            <span className="text-3xs print:text-[8px] text-slate-300 print:text-slate-200 italic">
                                [ Tanda Tangan Petugas ]
                            </span>
                        </div>
                    )}
                </div>

                {/* Garis Dasar Tanda Tangan */}
                <div className="w-full border-b border-slate-400 mt-1 mb-1"></div>

                {/* Nama Terang Petugas */}
                <p className="font-bold text-slate-900 text-xs print:text-[9px] w-full truncate max-w-[160px]">
                    {adminName || "Yangversa Computer"}
                </p>
                <p className="text-3xs print:text-[7.5px] text-slate-400 mt-0.5">
                    Yangversa Computer
                </p>
            </div>
        </div>
    );
}

export default function InvoiceDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isAdminSignatureModalOpen, setIsAdminSignatureModalOpen] = useState(false);
    const [savingSignature, setSavingSignature] = useState(false);
    
    // View modes: "invoice" | "garansi" | "both"
    const [activeDocTab, setActiveDocTab] = useState(
        searchParams.get("view") === "garansi" ? "garansi" : "invoice"
    );

    // Digital vs Physical Signature toggle (persisted in localStorage)
    const [isDigitalSignature, setIsDigitalSignature] = useState(() => {
        try {
            const saved = localStorage.getItem("yvs_invoice_digital_signature");
            return saved !== null ? saved === "true" : true;
        } catch {
            return true;
        }
    });

    const toggleDigitalSignature = () => {
        setIsDigitalSignature(prev => {
            const next = !prev;
            try {
                localStorage.setItem("yvs_invoice_digital_signature", String(next));
            } catch {}
            return next;
        });
    };

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

    async function handleSaveCustomerSignature({ signature, signerName }) {
        setSavingSignature(true);
        try {
            const res = await api.post(`/invoice/${invoice.id}/signature`, {
                ttd_customer: signature,
                ttd_customer_nama: signerName
            });
            setInvoice(res.data.data);
            setIsSignatureModalOpen(false);
            toast.success("Tanda tangan pelanggan berhasil disimpan!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan tanda tangan pelanggan");
        } finally {
            setSavingSignature(false);
        }
    }

    async function handleSelectAdminSignature({ signature, signerName }) {
        try {
            const res = await api.post(`/invoice/${invoice.id}/admin-signature`, {
                signature,
                signer_nama: signerName
            });
            setInvoice(res.data.data);
            toast.success(`Tanda tangan ${signerName} berhasil diterapkan!`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menerapkan tanda tangan admin");
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

    const trackingUrl = typeof window !== "undefined"
        ? `${window.location.origin}/tracking?nomor_tiket=${tiket.nomor_tiket}`
        : `https://komputerawet.com/tracking?nomor_tiket=${tiket.nomor_tiket}`;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=2&data=${encodeURIComponent(trackingUrl)}`;

    const showInvoice = activeDocTab === "invoice" || activeDocTab === "both";
    const showGaransi = activeDocTab === "garansi" || activeDocTab === "both";

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Header & Controls Panel (Hidden in Print) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <Link
                        to="/invoice"
                        className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dokumen Resmi Workshop</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Faktur pembayaran & sertifikat garansi resmi Yangversa</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* View Switcher */}
                    <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveDocTab("invoice")}
                            className={`py-2 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeDocTab === "invoice" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Faktur Invoice</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveDocTab("garansi")}
                            className={`py-2 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeDocTab === "garansi" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Kartu Garansi</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveDocTab("both")}
                            className={`py-2 px-3 rounded-lg transition-all hidden md:flex items-center gap-1.5 cursor-pointer ${
                                activeDocTab === "both" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <span>Keduanya</span>
                        </button>
                    </div>

                    {/* Master Digital Signature Toggle & Admin Selector */}
                    <DigitalSignatureToggleBar
                        isDigital={isDigitalSignature}
                        onToggle={toggleDigitalSignature}
                        onOpenSelector={() => setIsAdminSignatureModalOpen(true)}
                        adminName={invoice?.ttd_admin_nama}
                    />

                    {/* Customer Signature Action Button */}
                    <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs select-none ${
                            invoice?.ttd_customer
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold"
                                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold"
                        }`}
                        title={invoice?.ttd_customer ? "Pelanggan sudah tanda tangan digital (Klik untuk perbarui)" : "Minta tanda tangan pelanggan di kasir"}
                    >
                        {invoice?.ttd_customer ? (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>TTD Pelanggan: Terisi</span>
                            </>
                        ) : (
                            <>
                                <PenTool className="w-3.5 h-3.5" />
                                <span>+ TTD Pelanggan</span>
                            </>
                        )}
                    </button>

                    {/* Print Document Button */}
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Cetak Dokumen</span>
                    </button>
                </div>
            </div>

            {/* Injected Print Stylesheet for Perfect A4 Portrait Document Printing */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm;
                    }
                    html, body, #root, main, .custom-scrollbar {
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    .print-break-page {
                        page-break-after: always !important;
                        break-after: page !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* DOCUMENT 1: INVOICE TAGIHAN */}
            {showInvoice && (
                <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8 md:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print:text-[11px] print:leading-snug ${showGaransi && activeDocTab === "both" ? "print-break-page print:break-after-page mb-10" : ""}`}>
                    {/* Official Workshop Header */}
                    <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6 print:pb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl print:text-xl font-black text-slate-900 tracking-tight">KOMPUTERAWET.COM</h2>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Yangversa Computer</span>
                            </div>
                            <p className="text-slate-600 text-xs print:text-[10px] mt-1 font-medium">Pusat Servis Laptop, PC Desktop & Pengadaan Suku Cadang</p>
                            <p className="text-slate-500 text-xs print:text-[9px] mt-0.5">Workshop Yangversa &bull; WhatsApp CS: 0812-3456-7890 &bull; www.komputerawet.com</p>
                        </div>
                        <div className="text-left md:text-right print:text-right shrink-0">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 print:py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 print:w-3 print:h-3" />
                                <span className="text-xs print:text-[10px] font-bold uppercase tracking-wider">Lunas</span>
                            </div>
                            <p className="text-xs print:text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Faktur Pembayaran #</p>
                            <p className="text-xl print:text-base font-mono font-bold text-slate-900">INV-{invoice.id.toString().padStart(4, '0')}</p>
                            <p className="text-xs print:text-[9px] text-slate-500 mt-1">Tanggal: {new Date(invoice.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Customer & Unit Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-3 py-6 print:py-3 border-b border-slate-200 text-xs print:text-[10px]">
                        <div>
                            <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ditagihkan Kepada:</p>
                            <h3 className="text-base print:text-sm font-bold text-slate-900">{customer.nama}</h3>
                            <p className="text-slate-600 mt-0.5">{customer.nomor_telepon}</p>
                            <p className="text-slate-600">{customer.alamat || "Alamat tidak dicantumkan"}</p>
                        </div>
                        <div className="md:text-right print:text-right">
                            <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data Perangkat & Tiket:</p>
                            <p className="font-bold text-slate-900 text-sm">{perangkat.jenis_perangkat} {perangkat.merek} {perangkat.model}</p>
                            <p className="text-slate-600">Serial Number: {perangkat.serial_number || "-"}</p>
                            <p className="text-slate-600 mt-1">No. Tiket: <strong className="font-mono text-slate-900">{tiket.nomor_tiket}</strong></p>
                            <p className="text-slate-600">Teknisi Penanggung Jawab: {tiket.teknisi?.nama || "Tim Teknisi YVS"}</p>
                        </div>
                    </div>

                    {/* Problem & Diagnosis Summary */}
                    <div className="py-4 print:py-2 border-b border-slate-200 bg-slate-50/70 print:bg-transparent px-5 print:px-0 rounded-xl my-4 print:my-2 text-xs print:text-[10px]">
                        <p className="font-semibold text-slate-500 uppercase tracking-wider mb-2">Ringkasan Pekerjaan Servis:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                            <div>
                                <span className="font-semibold text-slate-700">Keluhan Awal:</span>
                                <p className="text-slate-600 mt-0.5">{tiket.keluhan}</p>
                            </div>
                            {tiket.diagnosis && (
                                <div>
                                    <span className="font-semibold text-slate-700">Tindakan / Solusi Teknis:</span>
                                    <p className="text-slate-600 mt-0.5">{tiket.diagnosis.solusi}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cost Breakdown Table */}
                    <div className="py-2 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs print:text-[10px] min-w-[340px]">
                            <thead>
                                <tr className="border-b-2 border-slate-200 text-slate-900 font-bold">
                                    <th className="py-3 print:py-1">Deskripsi Item / Jasa</th>
                                    <th className="py-3 print:py-1 text-right">Harga Satuan</th>
                                    <th className="py-3 print:py-1 text-center">Qty</th>
                                    <th className="py-3 print:py-1 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-3 print:py-1 text-slate-800">
                                        <span className="font-bold block">Biaya Jasa Servis & Penanganan</span>
                                        <span className="text-slate-500 text-2xs print:text-[8px]">Tindakan teknis reparasi, instalasi & pengujian fungsi</span>
                                    </td>
                                    <td className="py-3 print:py-1 text-right text-slate-600 font-mono">{formatRupiah(invoice.biaya_jasa)}</td>
                                    <td className="py-3 print:py-1 text-center text-slate-600">1</td>
                                    <td className="py-3 print:py-1 text-right font-bold text-slate-900 font-mono">{formatRupiah(invoice.biaya_jasa)}</td>
                                </tr>
                                
                                {tiket.penggunaan_sparepart && tiket.penggunaan_sparepart.map((p, index) => (
                                    <tr key={index}>
                                        <td className="py-3 print:py-1 text-slate-800">
                                            <span className="font-bold block">{p.sparepart.nama}</span>
                                            <span className="text-slate-500 text-2xs print:text-[8px]">Suku cadang / Sparepart resmi</span>
                                        </td>
                                        <td className="py-3 print:py-1 text-right text-slate-600 font-mono">{formatRupiah(p.sparepart.harga)}</td>
                                        <td className="py-3 print:py-1 text-center text-slate-600">{p.jumlah}</td>
                                        <td className="py-3 print:py-1 text-right font-bold text-slate-900 font-mono">{formatRupiah(p.sparepart.harga * p.jumlah)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-300">
                                    <td colSpan="3" className="py-4 print:py-2 text-right font-bold text-slate-700 uppercase tracking-wider">Total Tagihan Lunas</td>
                                    <td className="py-4 print:py-2 text-right font-black text-lg print:text-sm text-blue-700 font-mono">{formatRupiah(invoice.total_biaya)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer / Signature */}
                    <div className="pt-6 print:pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs print:text-[9px]">
                        <div className="max-w-xs">
                            <p className="font-semibold text-slate-700">Masa Garansi Servis: {tiket.durasi_garansi || "1 Bulan"}</p>
                            <p className="text-slate-500 mt-0.5">Berlaku untuk perbaikan dan komponen yang sama sesuai rincian nota di atas.</p>
                            <p className="text-slate-400 mt-1">Dokumen ini merupakan bukti pembayaran resmi yang sah dari Yangversa Computer.</p>
                        </div>
                        <AlignedSignatureRow
                            customerSignature={invoice?.ttd_customer}
                            customerName={invoice?.ttd_customer_nama || customer.nama}
                            customerSignedAt={invoice?.ttd_customer_at}
                            adminSignature={invoice?.ttd_admin}
                            adminName={invoice?.ttd_admin_nama || "Yangversa Computer"}
                            isDigital={isDigitalSignature}
                            adminRole="Petugas Workshop • Kasir"
                        />
                    </div>
                </div>
            )}

            {/* DOCUMENT 2: KARTU GARANSI RESMI */}
            {showGaransi && (
                <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-900 p-4 sm:p-8 md:p-12 max-w-4xl mx-auto print:shadow-none print:p-0 print:max-w-none print:text-[11px] print:leading-snug">
                    {/* Certificate Official Header */}
                    <div className="border-b-2 border-slate-900 pb-5 text-center relative">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <ShieldCheck className="w-6 h-6 text-emerald-600 print:w-5 print:h-5" />
                            <h2 className="text-xl print:text-lg font-black text-slate-900 tracking-wider uppercase">
                                KOMPUTERAWET.COM BY YANGVERSA COMPUTER
                            </h2>
                        </div>
                        <h3 className="text-2xl print:text-xl font-black text-slate-900 tracking-tight mt-1">
                            SERTIFIKAT KARTU GARANSI RESMI
                        </h3>
                        <p className="text-xs print:text-[10px] text-slate-500 mt-0.5 font-medium">
                            Jaminan Kualitas Perbaikan & Layanan Purna Jual &bull; Transparent &bull; Trusted &bull; WOW
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-800 border border-slate-300">
                            <span>No. Garansi:</span>
                            <span className="text-blue-700">GAR-{tiket.nomor_tiket}</span>
                        </div>
                    </div>

                    {/* Unit & Owner Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-200 text-xs print:text-[10px]">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                            <p className="font-bold text-slate-900 uppercase tracking-wider text-2xs border-b border-slate-200 pb-1 mb-2">
                                Identitas Pelanggan & Perangkat
                            </p>
                            <p><span className="text-slate-500 w-28 inline-block">Nama Pemilik:</span> <strong className="text-slate-900">{customer.nama}</strong></p>
                            <p><span className="text-slate-500 w-28 inline-block">No. Telepon:</span> <span className="text-slate-800 font-mono">{customer.nomor_telepon}</span></p>
                            <p><span className="text-slate-500 w-28 inline-block">Tipe Perangkat:</span> <strong className="text-slate-900">{perangkat.jenis_perangkat} {perangkat.merek} {perangkat.model}</strong></p>
                            <p><span className="text-slate-500 w-28 inline-block">Serial Number:</span> <span className="font-mono text-slate-700">{perangkat.serial_number || "-"}</span></p>
                            <p><span className="text-slate-500 w-28 inline-block">Nomor Tiket:</span> <strong className="font-mono text-blue-700">{tiket.nomor_tiket}</strong></p>
                        </div>

                        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5 flex flex-col justify-between">
                            <div>
                                <p className="font-bold text-emerald-950 uppercase tracking-wider text-2xs border-b border-emerald-200 pb-1 mb-2 flex items-center justify-between">
                                    <span>Masa Berlaku Garansi</span>
                                    <span className="text-3xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                        Status: Garansi Aktif
                                    </span>
                                </p>
                                <p><span className="text-emerald-800 w-28 inline-block">Durasi Garansi:</span> <strong className="text-emerald-950 text-sm">{tiket.durasi_garansi || "1 Bulan"}</strong></p>
                                <p><span className="text-emerald-800 w-28 inline-block">Mulai Berlaku:</span> <span className="text-slate-800">{new Date(tiket.tgl_diambil || invoice.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                                <p><span className="text-emerald-800 w-28 inline-block">Berakhir Pada:</span> <strong className="text-emerald-900">{tiket.garansi_berakhir_at ? new Date(tiket.garansi_berakhir_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</strong></p>
                            </div>
                            <p className="text-3xs text-emerald-700/80 pt-2 border-t border-emerald-200/60">
                                &bull; Perlindungan garansi berlaku penuh selama segel workshop tidak rusak.
                            </p>
                        </div>
                    </div>

                    {/* Scope of Coverage */}
                    <div className="py-5 border-b border-slate-200 text-xs print:text-[10px]">
                        <p className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                            Komponen & Pekerjaan yang Dilindungi Garansi:
                        </p>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-slate-800">Jasa Servis & Reparasi Teknis:</strong>
                                    <span className="text-slate-600 ml-1">{tiket.diagnosis?.solusi || tiket.keluhan}</span>
                                </div>
                            </div>
                            {tiket.penggunaan_sparepart && tiket.penggunaan_sparepart.length > 0 && (
                                <div className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-slate-800">Suku Cadang Baru Terpasang:</strong>
                                        <span className="text-slate-600 ml-1">
                                            {tiket.penggunaan_sparepart.map(p => `${p.sparepart.nama} (${p.jumlah} pcs)`).join(", ")}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Official Terms & Conditions (5 SOP Points) */}
                    <div className="py-5 border-b border-slate-200 text-xs print:text-[9.5px]">
                        <p className="font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                            Ketentuan & Syarat Klaim Garansi Resmi Yangversa:
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
                            <li><strong>Cakupan Garansi:</strong> Garansi berlaku untuk kendala fungsi yang sama atau kerusakan pada suku cadang yang diganti dalam servis ini.</li>
                            <li><strong>Integritas Segel:</strong> Segel garansi Yangversa yang terpasang pada casing perangkat harus dalam kondisi utuh, tidak sobek, dan tidak pernah dibuka pihak ketiga.</li>
                            <li><strong>Batasan Garansi:</strong> Garansi tidak berlaku untuk kerusakan akibat kelalaian pemakaian setelah penyerahan (seperti jatuh, terkena cairan, benturan fisik, korsleting tegangan listrik rumah, atau force majeure).</li>
                            <li><strong>Prosedur Klaim:</strong> Cukup tunjukkan sertifikat digital ini atau sebutkan nomor tiket <strong>{tiket.nomor_tiket}</strong> kepada frontliner saat membawa perangkat ke workshop.</li>
                            <li><strong>Prioritas Penanganan:</strong> Seluruh klaim garansi akan diprioritaskan sebagai penanganan utama oleh Kepala Teknisi sesuai standar pelayanan prima workshop.</li>
                        </ol>
                    </div>

                    {/* Signatures & Verification Stamp */}
                    <div className="pt-6 print:pt-4 flex flex-row items-end justify-between gap-6 text-xs print:text-[9px]">
                        {/* QR Code Verification */}
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">
                                <img
                                    src={qrCodeUrl}
                                    alt="QR Verifikasi Tiket"
                                    className="w-16 h-16 print:w-14 print:h-14"
                                    onError={(e) => {
                                        // Fallback if offline
                                        e.target.style.display = "none";
                                    }}
                                />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Scan Verifikasi Keaslian</p>
                                <p className="text-slate-500 text-3xs print:text-[8px] mt-0.5 max-w-[160px]">
                                    Pindai barcode untuk verifikasi status tiket & garansi real-time
                                </p>
                            </div>
                        </div>

                        {/* Aligned Signatures (Customer & Staff Penyerahan) */}
                        <AlignedSignatureRow
                            customerSignature={invoice?.ttd_customer}
                            customerName={invoice?.ttd_customer_nama || customer.nama}
                            customerSignedAt={invoice?.ttd_customer_at}
                            adminSignature={invoice?.ttd_admin}
                            adminName={invoice?.ttd_admin_nama || "Yangversa Computer"}
                            isDigital={isDigitalSignature}
                            adminRole="Petugas Penyerahan Unit"
                        />
                    </div>
                </div>
            )}

            {/* In-Store Customer Digital Signature Pad Modal */}
            <DigitalSignaturePadModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSave={handleSaveCustomerSignature}
                defaultName={customer.nama}
                title="Tanda Tangan Pelanggan di Kasir"
                description={`Pelanggan (${customer.nama}) dapat menandatangani serah terima unit di layar ini menggunakan jari, stylus, atau mouse.`}
                agreementText="Dengan menandatangani ini, saya menyatakan telah menerima kembali unit dalam kondisi baik, menyetujui rincian biaya perbaikan, dan memahami masa ketentuan garansi yang berlaku."
                requirePhoneVerify={false}
                loading={savingSignature}
            />

            {/* Modal Pemilihan Profil Tanda Tangan Staf / Admin */}
            <AdminSignatureSelectorModal
                isOpen={isAdminSignatureModalOpen}
                onClose={() => setIsAdminSignatureModalOpen(false)}
                onSelect={handleSelectAdminSignature}
                currentSignature={invoice?.ttd_admin}
                currentSignerName={invoice?.ttd_admin_nama}
                invoiceId={invoice?.id}
            />
        </div>
    );
}
