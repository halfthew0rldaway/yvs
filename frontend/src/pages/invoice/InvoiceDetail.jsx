import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { ArrowLeft, Printer, CheckCircle2, ShieldCheck, FileText, PenTool, Download, Share2, User, MonitorSmartphone, Wrench } from "lucide-react";
import { 
    WorkshopSignatureStamp, 
    DigitalSignatureToggleBar 
} from "../../components/DigitalSignatureStamp";
import DigitalSignaturePadModal from "../../components/DigitalSignaturePadModal";
import AdminSignatureSelectorModal, { DEFAULT_WORKSHOP_SIGNATURE } from "../../components/AdminSignatureSelectorModal";
import WarrantyCertificateModal from "../../components/WarrantyCertificateModal";
import { DocumentPrintService } from "../../services/documentPrintService";
import { isNativePlatform } from "../../services/nativeServices";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

/**
 * AlignedSignatureRow
 * Renders both Customer & Workshop Staff signatures side-by-side with packed dimensions for half-A4 continuous form.
 */
function AlignedSignatureRow({
    customerSignature,
    customerName,
    customerSignedAt,
    adminSignature,
    adminName,
    isDigital = true,
    adminRole = "Kasir / Petugas Toko"
}) {
    const activeAdminSig = isDigital ? (adminSignature || DEFAULT_WORKSHOP_SIGNATURE) : null;
    const activeCustomerSig = isDigital ? customerSignature : null;

    return (
        <div className="flex items-end justify-center sm:justify-end gap-6 sm:gap-8 print:gap-6 select-none shrink-0">
            {/* Kolom Tanda Tangan Pelanggan */}
            <div className="flex flex-col items-center justify-end text-center w-32 sm:w-36 print:w-28">
                <p className="text-slate-600 text-3xs sm:text-2xs print:text-[7.5px] font-semibold mb-0.5 uppercase tracking-wide">
                    Penerima / Pelanggan
                </p>

                {/* Box Area Tanda Tangan */}
                <div className="h-12 print:h-9 w-full flex items-center justify-center">
                    {activeCustomerSig ? (
                        <img 
                            src={activeCustomerSig} 
                            alt="Tanda Tangan Pelanggan" 
                            className="max-h-11 print:max-h-8 max-w-[110px] print:max-w-[85px] object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-end justify-center pb-1 border-b border-dashed border-slate-300 print:border-none">
                            <span className="text-3xs print:text-[7px] text-slate-300 print:text-slate-200 italic">
                                {isDigital ? "[ Belum TTD Digital ]" : "[ Tanda Tangan ]"}
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-full border-b border-slate-400 mt-0.5 mb-0.5"></div>
                <p className="font-bold text-slate-900 text-2xs sm:text-xs print:text-[8px] w-full truncate max-w-[130px] print:max-w-[100px] leading-tight">
                    {customerName || "Pelanggan"}
                </p>
                <p className="text-3xs print:text-[6.5px] text-slate-400 font-mono">
                    {customerSignedAt 
                        ? new Date(customerSignedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : "Pelanggan YVS"}
                </p>
            </div>

            {/* Kolom Tanda Tangan Staf / Kasir */}
            <div className="flex flex-col items-center justify-end text-center w-32 sm:w-36 print:w-28">
                <p className="text-slate-600 text-3xs sm:text-2xs print:text-[7.5px] font-semibold mb-0.5 uppercase tracking-wide">
                    {adminRole}
                </p>

                <div className="h-12 print:h-9 w-full flex items-center justify-center relative">
                    {activeAdminSig ? (
                        <img 
                            src={activeAdminSig} 
                            alt={`TTD ${adminName}`} 
                            className="max-h-11 print:max-h-8 max-w-[110px] print:max-w-[85px] object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-end justify-center pb-1 border-b border-dashed border-slate-300 print:border-none">
                            <span className="text-3xs print:text-[7px] text-slate-300 print:text-slate-200 italic">
                                [ Tanda Tangan Staf ]
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-full border-b border-slate-400 mt-0.5 mb-0.5"></div>
                <p className="font-bold text-slate-900 text-2xs sm:text-xs print:text-[8px] w-full truncate max-w-[130px] print:max-w-[100px] leading-tight">
                    {adminName || "Yangversa Computer"}
                </p>
                <p className="text-3xs print:text-[6.5px] text-slate-400">
                    Yangversa Computer
                </p>
            </div>
        </div>
    );
}

export default function InvoiceDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isAutoPrint = searchParams.get("print") === "true";

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    // Digital Signature Toggle Mode
    const [isDigitalSignature, setIsDigitalSignature] = useState(true);

    // Modals
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isAdminSignatureModalOpen, setIsAdminSignatureModalOpen] = useState(false);
    const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
    const [savingSignature, setSavingSignature] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await api.get(`/invoice/${id}`);
                setInvoice(response.data);
            } catch (err) {
                console.error("Gagal memuat invoice:", err);
                toast.error("Gagal memuat dokumen invoice");
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    useEffect(() => {
        if (!loading && invoice && isAutoPrint) {
            const timer = setTimeout(() => {
                DocumentPrintService.printOrShareDocument("printable-invoice-detail", {
                    filename: `Faktur-INV-${String(invoice.id).padStart(4, '0')}.pdf`,
                    title: `Faktur #${String(invoice.id).padStart(4, '0')} - Yangversa Computer`,
                    text: `Faktur resmi pembayaran perbaikan unit #${invoice.tiket?.nomor_tiket} dari Yangversa Computer.`,
                    preferDirectPrint: !isNativePlatform()
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [loading, invoice, isAutoPrint]);

    const toggleDigitalSignature = () => {
        setIsDigitalSignature(prev => !prev);
    };

    const handleSaveCustomerSignature = async (signatureData, signerName) => {
        setSavingSignature(true);
        try {
            const response = await api.post(`/invoice/${id}/signature`, {
                ttd_customer: signatureData,
                ttd_customer_nama: signerName
            });
            setInvoice(response.data.data);
            setIsSignatureModalOpen(false);
            toast.success("Tanda tangan pelanggan berhasil disimpan di kasir!");
        } catch (err) {
            console.error("Gagal simpan TTD:", err);
            toast.error(err.response?.data?.message || "Gagal menyimpan tanda tangan pelanggan");
        } finally {
            setSavingSignature(false);
        }
    };

    const handleSelectAdminSignature = async (selectedSignature, selectedName) => {
        try {
            const response = await api.post(`/invoice/${id}/admin-signature`, {
                signature: selectedSignature,
                signer_nama: selectedName
            });
            setInvoice(response.data.data);
            setIsAdminSignatureModalOpen(false);
            toast.success(`Tanda tangan "${selectedName}" berhasil disematkan!`);
        } catch (err) {
            console.error("Gagal pasang TTD admin:", err);
            toast.error(err.response?.data?.message || "Gagal menerapkan tanda tangan petugas");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium text-xs">Memuat dokumen faktur...</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="max-w-md mx-auto text-center py-16 px-4">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-slate-800">Faktur Tidak Ditemukan</h2>
                <p className="text-slate-500 text-xs mt-1 mb-6">Data faktur yang Anda cari mungkin telah dipindahkan atau ID tidak valid.</p>
                <Link to="/invoice" className="btn-secondary text-xs inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Invoice
                </Link>
            </div>
        );
    }

    const { tiket } = invoice;
    const { perangkat } = tiket;
    const { customer } = perangkat;
    const invoiceNumber = `INV-${String(invoice.id).padStart(4, '0')}`;
    const formattedDate = new Date(invoice.created_at).toLocaleDateString("id-ID", { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    const namaPerangkatLengkap = `${perangkat?.merek || ""} ${perangkat?.model || ""}`.trim() || "Perangkat Servis";

    const sparepartsList = (tiket.penggunaan_sparepart || []).map(p => ({
        nama: p.nama || p.sparepart?.nama || "Suku Cadang",
        kategori: p.kategori || p.sparepart?.kategori || "Umum",
        harga: Number(p.harga || p.sparepart?.harga || 0),
        jumlah: Number(p.jumlah || 1)
    }));

    return (
        <div className="space-y-3 pb-12 print:space-y-0 print:pb-0 print:m-0">
            {/* Top Minimal Action Bar (Clean, no clutter, no-print) */}
            <div className="no-print print:hidden flex flex-wrap items-center justify-between gap-2.5 pb-1">
                <Link 
                    to="/invoice" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-2xs transition-colors shrink-0"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Daftar Invoice</span>
                </Link>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <DigitalSignatureToggleBar
                        isDigital={isDigitalSignature}
                        onToggle={toggleDigitalSignature}
                        onOpenSelector={() => setIsAdminSignatureModalOpen(true)}
                        adminName={invoice?.ttd_admin_nama}
                    />

                    <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs select-none ${
                            invoice?.ttd_customer
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold"
                                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold"
                        }`}
                        title={invoice?.ttd_customer ? "Pelanggan sudah tanda tangan digital (Klik untuk perbarui)" : "Minta tanda tangan pelanggan di kasir"}
                    >
                        {invoice?.ttd_customer ? (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>TTD: Terisi</span>
                            </>
                        ) : (
                            <>
                                <PenTool className="w-3.5 h-3.5" />
                                <span>+ TTD Pelanggan</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsWarrantyModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                        title="Buka Kartu Garansi Digital Resmi"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Garansi</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => DocumentPrintService.downloadPdf("printable-invoice-detail", `Faktur-${invoiceNumber}.pdf`, { orientation: "landscape", format: "a5" })}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200 shadow-2xs cursor-pointer"
                        title="Unduh Salinan Dokumen PDF Landscape"
                    >
                        <Download className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span>PDF</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => DocumentPrintService.printOrShareDocument("printable-invoice-detail", {
                            filename: `Faktur-${invoiceNumber}.pdf`,
                            title: `Faktur #${invoiceNumber} - Yangversa Computer`,
                            text: `Faktur resmi pembayaran perbaikan unit #${tiket?.nomor_tiket || ''} dari Yangversa Computer.`,
                            preferDirectPrint: !isNativePlatform()
                        })}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title={isNativePlatform() ? "Cetak / Kirim Faktur via WhatsApp" : "Cetak Faktur (Printer Continuous Form / PDF)"}
                    >
                        {isNativePlatform() ? (
                            <>
                                <Share2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                <span>Cetak / Kirim</span>
                            </>
                        ) : (
                            <>
                                <Printer className="w-3.5 h-3.5 shrink-0" />
                                <span>Cetak Faktur</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Injected Print Stylesheet for Half-A4 Continuous Form */}
            <style>{`
                @media print {
                    @page {
                        size: 210mm 140mm;
                        margin: 4mm 6mm;
                    }
                    html, body, #root, main, .custom-scrollbar {
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        background: white !important;
                        font-size: 8.5pt !important;
                        line-height: 1.25 !important;
                    }
                    .no-print, [data-no-print="true"], header, nav, aside {
                        display: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* FAKTUR INVOICE TAGIHAN (Horizontal, Packed & Responsive) */}
            <div id="printable-invoice-detail" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 max-w-5xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print:text-[8.5pt] print:leading-tight">
                {/* Official Workshop Header Bar */}
                <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-center print:items-center gap-2 border-b-2 border-slate-900 pb-2.5 print:pb-1.5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl print:text-base font-black text-slate-900 tracking-tight font-mono">
                                KOMPUTERAWET.COM
                            </h2>
                            <span className="text-3xs print:text-[7px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono">
                                YANGVERSA COMPUTER
                            </span>
                        </div>
                        <p className="text-slate-600 text-3xs sm:text-2xs print:text-[7.5px] font-medium leading-snug mt-0.5">
                             Workshop Reparasi Laptop, PC Desktop & Solusi Hardware Spesialis
                        </p>
                        <p className="text-slate-500 text-3xs print:text-[7px] leading-tight">
                            Jl. Raya Pekayon No. 25, Bekasi Selatan &bull; WA CS: 0812-3456-7890 &bull; www.komputerawet.com
                        </p>
                    </div>

                    {/* Title & Status */}
                    <div className="text-left sm:text-right print:text-right shrink-0">
                        <div className="flex items-center sm:justify-end print:justify-end mb-0.5">
                            <span className="text-3xs sm:text-2xs print:text-[7.5px] font-extrabold uppercase tracking-wider text-slate-700">
                                FAKTUR PEMBAYARAN RESMI
                            </span>
                        </div>
                        <p className="text-base sm:text-lg print:text-sm font-mono font-black text-blue-700 leading-tight">
                            {invoiceNumber}
                        </p>
                        <p className="text-3xs print:text-[7px] text-slate-500 font-mono">
                            No. Tiket: <strong className="text-slate-800">{tiket.nomor_tiket}</strong> &bull; Tanggal: {formattedDate}
                        </p>
                    </div>
                </div>

                {/* Metadata Strip: 3 Compact Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2 py-2 print:py-1.5 border-b border-slate-200 text-3xs sm:text-2xs print:text-[7.5px] bg-slate-50/70 print:bg-slate-50/30 rounded-lg px-3 print:px-2 mt-2 print:mt-1">
                    <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                            Data Pelanggan
                        </span>
                        <p className="font-bold text-slate-900 truncate">{customer.nama}</p>
                        <p className="text-slate-600 font-mono">{customer.nomor_telepon}</p>
                        <p className="text-slate-500 truncate">{customer.alamat || "Bekasi & Sekitarnya"}</p>
                    </div>

                    <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                            Data Perangkat
                        </span>
                        <p className="font-bold text-slate-900 truncate">{namaPerangkatLengkap}</p>
                        <p className="text-slate-600">Kategori: <span className="font-medium text-slate-800">{perangkat.jenis_perangkat}</span></p>
                        <p className="text-slate-600 font-mono">S/N: <span className="font-medium text-slate-800">{perangkat.serial_number || "-"}</span></p>
                    </div>

                    <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                            Layanan & Petugas
                        </span>
                        <p className="text-slate-800">Teknisi PIC: <strong className="text-slate-900">{tiket.teknisi?.nama || "Tim Teknisi YVS"}</strong></p>
                        <p className="text-slate-800">Paket SLA: <strong className="text-blue-700 uppercase font-mono">{tiket.sla_paket || "Reguler"}</strong></p>
                        <p className="text-slate-500 font-mono">Masuk: {new Date(tiket.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                </div>

                {/* Items Table (Responsive & Compact) */}
                <div className="mt-2 print:mt-1.5 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-3xs sm:text-2xs print:text-[7.5px]">
                        <thead>
                            <tr className="border-b-2 border-slate-300 bg-slate-100/80 text-slate-800 font-bold uppercase tracking-wider">
                                <th className="py-1 px-2 print:py-0.5 print:px-1 w-8 text-center">#</th>
                                <th className="py-1 px-2 print:py-0.5 print:px-1">Deskripsi Item / Tindakan Jasa</th>
                                <th className="py-1 px-2 print:py-0.5 print:px-1 text-center w-28">Kategori</th>
                                <th className="py-1 px-2 print:py-0.5 print:px-1 text-right w-28">Harga Satuan</th>
                                <th className="py-1 px-2 print:py-0.5 print:px-1 text-center w-12">Qty</th>
                                <th className="py-1 px-2 print:py-0.5 print:px-1 text-right w-32">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                            <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-400 font-mono">1</td>
                                <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-slate-900">
                                    <span className="font-bold block leading-tight">Biaya Jasa Servis & Penanganan Teknis</span>
                                    <span className="text-3xs print:text-[6.5px] text-slate-500">Tindakan reparasi, solder/reballing, instalasi & pengujian fungsi perangkat</span>
                                </td>
                                <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-600 font-medium">Jasa Servis</td>
                                <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-right text-slate-600 font-mono">{formatRupiah(invoice.biaya_jasa)}</td>
                                <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-700 font-mono font-medium">1</td>
                                <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-right font-bold text-slate-900 font-mono">{formatRupiah(invoice.biaya_jasa)}</td>
                            </tr>
                            
                            {sparepartsList.map((p, index) => (
                                <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-400 font-mono">{index + 2}</td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-slate-900">
                                        <span className="font-bold block leading-tight">{p.nama}</span>
                                        <span className="text-3xs print:text-[6.5px] text-slate-500">Suku cadang / komponen pengganti resmi</span>
                                    </td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-600">{p.kategori}</td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-right text-slate-600 font-mono">{formatRupiah(p.harga)}</td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-700 font-mono font-medium">{p.jumlah}</td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-right font-bold text-slate-900 font-mono">{formatRupiah(p.harga * p.jumlah)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-400 bg-slate-50/60 font-bold">
                                <td colSpan="4" className="py-1.5 px-2 print:py-1 print:px-1 text-slate-600 text-3xs print:text-[7px]">
                                    Total {sparepartsList.length + 1} item tindakan jasa & suku cadang
                                </td>
                                <td className="py-1.5 px-2 print:py-1 print:px-1 text-right text-slate-700 uppercase tracking-wide text-2xs print:text-[7.5px]">
                                    TOTAL BIAYA:
                                </td>
                                <td className="py-1.5 px-2 print:py-1 print:px-1 text-right font-black text-sm sm:text-base print:text-[10pt] text-blue-700 font-mono">
                                    {formatRupiah(invoice.total_biaya)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer / Dual Signature (Horizontal Bottom Strip) */}
                <div className="mt-2.5 print:mt-2 pt-2 border-t border-slate-200 flex flex-col sm:flex-row print:flex-row justify-between items-end gap-3 text-3xs sm:text-2xs print:text-[7px]">
                    <div className="max-w-md text-slate-600 leading-snug">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Masa Garansi Servis: <span className="text-blue-700">{tiket.durasi_garansi || "1 Bulan"}</span></span>
                        </div>
                        <p className="text-slate-500 text-3xs print:text-[6.5px]">
                            Garansi berlaku untuk perbaikan & komponen pengganti yang sama. Nota ini merupakan bukti pembayaran sah dan tanda serah terima resmi Yangversa Computer.
                        </p>
                    </div>

                    <AlignedSignatureRow
                        customerSignature={invoice?.ttd_customer}
                        customerName={invoice?.ttd_customer_nama || customer.nama}
                        customerSignedAt={invoice?.ttd_customer_at}
                        adminSignature={invoice?.ttd_admin}
                        adminName={invoice?.ttd_admin_nama || "Yangversa Computer"}
                        isDigital={isDigitalSignature}
                        adminRole="Kasir / Petugas Toko"
                    />
                </div>
            </div>

            {/* Digital Warranty Certificate Modal */}
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
