import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { ArrowLeft, Printer, CheckCircle2, ShieldCheck, FileText, PenTool } from "lucide-react";
import { 
    WorkshopSignatureStamp, 
    DigitalSignatureToggleBar 
} from "../../components/DigitalSignatureStamp";
import DigitalSignaturePadModal from "../../components/DigitalSignaturePadModal";
import AdminSignatureSelectorModal, { DEFAULT_WORKSHOP_SIGNATURE } from "../../components/AdminSignatureSelectorModal";
import WarrantyCertificateModal from "../../components/WarrantyCertificateModal";

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
                            <span className="text-2xs print:text-[8px] text-slate-300 print:text-slate-200 italic">
                                {isDigital ? "[ Belum TTD ]" : "[ Tanda Tangan Fisik ]"}
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-full border-b border-slate-300 my-1"></div>
                <p className="font-bold text-slate-900 text-xs print:text-[9.5px] w-full truncate max-w-[150px]">
                    {customerName || "Pelanggan"}
                </p>
                <p className="text-3xs print:text-[7.5px] text-slate-400">
                    {customerSignedAt 
                        ? `Tertandatangani: ${new Date(customerSignedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                        : "Pelanggan YVS"}
                </p>
            </div>

            {/* Kolom Tanda Tangan Staf / Kasir dengan Cap Resmi */}
            <div className="flex flex-col items-center justify-end text-center w-36 sm:w-44 print:w-32">
                <p className="text-slate-600 text-xs print:text-[8.5px] font-semibold mb-1">
                    {adminRole}
                </p>

                {/* Box Area Tanda Tangan + Stempel Staf */}
                <div className="h-20 print:h-14 w-full flex items-center justify-center relative">
                    {isDigital ? (
                        <WorkshopSignatureStamp
                            signatureUrl={activeAdminSig}
                            signerName={adminName || "Yangversa Computer"}
                            isDigital={true}
                            width="w-full"
                            height="h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-end justify-center pb-2 border-b border-dashed border-slate-300 print:border-none">
                            <span className="text-2xs print:text-[8px] text-slate-300 print:text-slate-200 italic">
                                [ Tanda Tangan Fisik ]
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-full border-b border-slate-300 my-1"></div>
                <p className="font-bold text-slate-900 text-xs print:text-[9.5px] w-full truncate max-w-[150px]">
                    {adminName || "Yangversa Computer"}
                </p>
                <p className="text-3xs print:text-[7.5px] text-slate-400">
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
    
    // Unified Warranty Certificate Modal State (auto-open if URL has ?view=garansi)
    const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(
        searchParams.get("view") === "garansi"
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
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dokumen Faktur Servis</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Faktur resmi pembayaran perbaikan unit #{tiket.nomor_tiket}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
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

                    {/* Unified Kartu Garansi Button (Opens the beautiful tracking certificate modal) */}
                    <button
                        type="button"
                        onClick={() => setIsWarrantyModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                        title="Buka Kartu Garansi Digital Resmi (Versi Standar Pelacak / Tracking)"
                    >
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Kartu Garansi</span>
                    </button>

                    {/* Print Invoice Button */}
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
                        title="Cetak Faktur Invoice Resmi"
                    >
                        <Printer className="w-4 h-4 shrink-0" />
                        <span>Cetak Faktur</span>
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
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* FAKTUR INVOICE TAGIHAN */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8 md:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print:text-[11px] print:leading-snug">
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

            {/* Digital Warranty Certificate Modal (Unified with Tracking) */}
            <WarrantyCertificateModal
                isOpen={isWarrantyModalOpen}
                onClose={() => setIsWarrantyModalOpen(false)}
                tiket={tiket}
                customer={customer}
                perangkat={perangkat}
                invoice={invoice}
            />

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
