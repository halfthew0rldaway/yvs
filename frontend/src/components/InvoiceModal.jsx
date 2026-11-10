import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, CheckCircle2, FileText, Download, Share2, Wrench, User, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { DEFAULT_WORKSHOP_SIGNATURE } from "./AdminSignatureSelectorModal";
import { DocumentPrintService } from "../services/documentPrintService";
import { isNativePlatform } from "../services/nativeServices";

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

                {/* Box Area Tanda Tangan (Tinggi compact untuk continuous form) */}
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

                {/* Garis Dasar Tanda Tangan */}
                <div className="w-full border-b border-slate-400 mt-0.5 mb-0.5"></div>

                {/* Nama Terang Pelanggan */}
                <p className="font-bold text-slate-900 text-2xs sm:text-xs print:text-[8px] w-full truncate max-w-[130px] print:max-w-[100px] leading-tight">
                    {customerName || "Pelanggan"}
                </p>
                <p className="text-3xs print:text-[6.5px] text-slate-400 font-mono">
                    {customerSignedAt 
                        ? new Date(customerSignedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : "Pelanggan YVS"}
                </p>
            </div>

            {/* Kolom Tanda Tangan Petugas Workshop */}
            <div className="flex flex-col items-center justify-end text-center w-32 sm:w-36 print:w-28">
                <p className="text-slate-600 text-3xs sm:text-2xs print:text-[7.5px] font-semibold mb-0.5 uppercase tracking-wide">
                    {adminRole}
                </p>

                {/* Box Area Tanda Tangan */}
                <div className="h-12 print:h-9 w-full flex items-center justify-center">
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

                {/* Garis Dasar Tanda Tangan */}
                <div className="w-full border-b border-slate-400 mt-0.5 mb-0.5"></div>

                {/* Nama Terang Petugas */}
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

export default function InvoiceModal({
    isOpen,
    onClose,
    tiket,
    invoice: propInvoice,
    customer: propCustomer,
    perangkat: propPerangkat
}) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !tiket || typeof document === "undefined") return null;

    const invoice = propInvoice || tiket.invoice || {
        id: tiket.id || 1,
        biaya_jasa: 0,
        biaya_sparepart: 0,
        total_biaya: 0,
        created_at: tiket.created_at
    };

    const customer = propCustomer || (typeof tiket.perangkat === "object" && tiket.perangkat?.customer) || {
        nama: tiket.customer_nama || "Pelanggan",
        nomor_telepon: tiket.customer_telepon || "-",
        alamat: tiket.customer_alamat || ""
    };

    const jenisPerangkat = (typeof tiket.perangkat === "object" && tiket.perangkat?.jenis_perangkat) || tiket.jenis_perangkat || "Perangkat";
    const serialNumber = (typeof tiket.perangkat === "object" && tiket.perangkat?.serial_number) || tiket.serial_number || "-";
    const teknisiNama = typeof tiket.teknisi === "object" ? (tiket.teknisi?.nama || "Tim Teknisi YVS") : (tiket.teknisi || "Tim Teknisi YVS");

    const namaPerangkatLengkap = typeof tiket.perangkat === "string" 
        ? tiket.perangkat 
        : `${tiket.perangkat?.merek || tiket.merek || ""} ${tiket.perangkat?.model || tiket.model || ""}`.trim() || "Perangkat Servis";

    const sparepartsList = (tiket.penggunaan_sparepart || []).map(p => ({
        nama: p.nama || p.sparepart?.nama || "Suku Cadang",
        kategori: p.kategori || p.sparepart?.kategori || "Umum",
        harga: Number(p.harga || p.sparepart?.harga || 0),
        jumlah: Number(p.jumlah || 1)
    }));

    const invoiceNumber = `INV-${(invoice.id || 1).toString().padStart(4, '0')}`;
    const formattedDate = new Date(invoice.created_at || tiket.created_at || Date.now()).toLocaleDateString("id-ID", { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    const handlePrint = () => {
        DocumentPrintService.printOrShareDocument("printable-invoice-modal-content", {
            filename: `Faktur-${invoiceNumber}.pdf`,
            title: `Faktur #${invoiceNumber} - Yangversa Computer`,
            text: `Faktur resmi pembayaran perbaikan unit #${tiket.nomor_tiket} dari Workshop Yangversa Computer.`,
            preferDirectPrint: !isNativePlatform()
        });
    };

    const handleDownloadPdf = () => {
        DocumentPrintService.downloadPdf("printable-invoice-modal-content", `Faktur-${invoiceNumber}.pdf`, {
            orientation: "landscape",
            format: "a5"
        });
    };

    const modalContent = (
        <div className="modal-shell z-[9999] bg-slate-950/70 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible invoice-modal-overlay">
            {/* Print Stylesheet for flawless 1-page A5 Landscape / Half-A4 Continuous Form Dot Matrix Printing */}
            <style>{`
                @media print {
                    @page {
                        size: 210mm 140mm;
                        margin: 4mm 6mm;
                    }
                    #root,
                    #root * {
                        display: none !important;
                        height: 0 !important;
                        overflow: hidden !important;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #0f172a !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-size: 8.5pt !important;
                        line-height: 1.25 !important;
                    }
                    .invoice-modal-overlay {
                        position: static !important;
                        display: block !important;
                        background: transparent !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        height: auto !important;
                        width: 100% !important;
                    }
                    .printable-invoice-modal {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="modal-panel max-w-5xl z-10 print:max-h-none print:h-auto print:rounded-none print:border-none print:shadow-none printable-invoice-modal">
                <div className="modal-grabber no-print" />

                {/* Modal Top Header (Screen Only) */}
                <div className="no-print px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                                Faktur Pembayaran #{invoiceNumber}
                            </h3>
                            <p className="text-3xs sm:text-2xs text-slate-500 font-mono mt-0.5">
                                No. Tiket: {tiket.nomor_tiket}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 shadow-2xs cursor-pointer active:scale-95"
                            title="Unduh Salinan Dokumen PDF Landscape Langsung"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Unduh PDF A5</span>
                            <span className="sm:hidden">PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            title={isNativePlatform() ? "Cetak / Kirim Faktur via WhatsApp" : "Cetak Faktur (Printer Continuous Form / PDF)"}
                        >
                            {isNativePlatform() ? (
                                <>
                                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Cetak / Kirim</span>
                                </>
                            ) : (
                                <>
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Cetak Faktur</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                            title="Tutup Modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Body: Horizontal, packed, compact styling */}
                <div id="printable-invoice-modal-content" className="p-4 sm:p-6 overflow-y-auto custom-scrollbar print:overflow-visible print:p-0 print:text-[8.5pt] print:leading-tight">
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

                        {/* Title & Invoice Status Meta */}
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

                    {/* Metadata Strip: 3 Compact Columns (Packed & High Information Density) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2 py-2 print:py-1.5 border-b border-slate-200 text-3xs sm:text-2xs print:text-[7.5px] bg-slate-50/70 print:bg-slate-50/30 rounded-lg px-3 print:px-2 mt-2 print:mt-1">
                        {/* Data Pelanggan */}
                        <div className="space-y-0.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                                Data Pelanggan
                            </span>
                            <p className="font-bold text-slate-900 truncate">
                                {customer.nama || "Pelanggan"}
                            </p>
                            <p className="text-slate-600 font-mono">
                                {customer.nomor_telepon || "-"}
                            </p>
                            <p className="text-slate-500 truncate">
                                {customer.alamat || "Bekasi & Sekitarnya"}
                            </p>
                        </div>

                        {/* Data Perangkat */}
                        <div className="space-y-0.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                                Data Perangkat
                            </span>
                            <p className="font-bold text-slate-900 truncate">
                                {namaPerangkatLengkap}
                            </p>
                            <p className="text-slate-600">
                                Kategori: <span className="font-medium text-slate-800">{jenisPerangkat}</span>
                            </p>
                            <p className="text-slate-600 font-mono">
                                S/N: <span className="font-medium text-slate-800">{serialNumber}</span>
                            </p>
                        </div>

                        {/* Petugas & Layanan */}
                        <div className="space-y-0.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                                Layanan & Petugas
                            </span>
                            <p className="text-slate-800">
                                Teknisi PIC: <strong className="text-slate-900">{teknisiNama}</strong>
                            </p>
                            <p className="text-slate-800">
                                Paket SLA: <strong className="text-blue-700 uppercase font-mono">{tiket.sla_paket || "Reguler"}</strong>
                            </p>
                            <p className="text-slate-500 font-mono">
                                Masuk: {new Date(tiket.created_at || Date.now()).toLocaleDateString('id-ID')}
                            </p>
                        </div>
                    </div>

                    {/* Responsive Items Table: Tight padding & compact line heights */}
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
                                {/* Baris 1: Biaya Jasa Servis */}
                                <tr className="hover:bg-slate-50/50">
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-400 font-mono">1</td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-slate-900">
                                        <span className="font-bold block leading-tight">Biaya Jasa Servis & Penanganan Teknis</span>
                                        <span className="text-3xs print:text-[6.5px] text-slate-500">Tindakan teknis reparasi, solder/reballing, instalasi & pengujian fungsi perangkat</span>
                                    </td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-600 font-medium">Jasa Servis</td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-right text-slate-600 font-mono">{formatRupiah(invoice.biaya_jasa)}</td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-700 font-mono font-medium">1</td>
                                    <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-right font-bold text-slate-900 font-mono">{formatRupiah(invoice.biaya_jasa)}</td>
                                </tr>
                                
                                {/* Baris 2..N: Suku Cadang Terpakai */}
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

                    {/* Footer & Dual Digital Signature Bar (Compact Horizontal Bottom) */}
                    <div className="mt-2.5 print:mt-2 pt-2 border-t border-slate-200 flex flex-col sm:flex-row print:flex-row justify-between items-end gap-3 text-3xs sm:text-2xs print:text-[7px]">
                        <div className="max-w-md text-slate-600 leading-snug">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Masa Garansi Servis: <span className="text-blue-700">{tiket.durasi_garansi || "1 Bulan"}</span></span>
                            </div>
                            <p className="text-slate-500 text-3xs print:text-[6.5px]">
                                Garansi berlaku untuk kerusakan & komponen pengganti yang sama. Nota ini merupakan bukti pembayaran sah dan tanda serah terima resmi Yangversa Computer.
                            </p>
                        </div>

                        {/* Dual Signatures */}
                        <AlignedSignatureRow
                            customerSignature={invoice?.ttd_customer}
                            customerName={invoice?.ttd_customer_nama || customer.nama}
                            customerSignedAt={invoice?.ttd_customer_at}
                            adminSignature={invoice?.ttd_admin || DEFAULT_WORKSHOP_SIGNATURE}
                            adminName={invoice?.ttd_admin_nama && invoice?.ttd_admin_nama !== "Admin" ? invoice.ttd_admin_nama : "Yangversa Computer"}
                            isDigital={true}
                            adminRole="Kasir / Petugas Toko"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
