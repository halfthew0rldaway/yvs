import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, CheckCircle2, FileText } from "lucide-react";
import { DEFAULT_WORKSHOP_SIGNATURE } from "./AdminSignatureSelectorModal";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

/**
 * AlignedSignatureRow
 * Renders both Customer & Workshop Staff signatures side-by-side with identical dimensions.
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
        <div className="flex items-end justify-center sm:justify-end gap-8 sm:gap-10 print:gap-8 select-none shrink-0">
            {/* Kolom Tanda Tangan Pelanggan */}
            <div className="flex flex-col items-center justify-end text-center w-36 sm:w-44 print:w-32">
                <p className="text-slate-600 text-xs print:text-[8px] font-semibold mb-0.5">
                    Penerima / Pelanggan
                </p>

                {/* Box Area Tanda Tangan */}
                <div className="h-16 print:h-12 w-full flex items-center justify-center">
                    {activeCustomerSig ? (
                        <img 
                            src={activeCustomerSig} 
                            alt="Tanda Tangan Pelanggan" 
                            className="max-h-14 print:max-h-11 max-w-[130px] print:max-w-[100px] object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-end justify-center pb-1.5 border-b border-dashed border-slate-300 print:border-none">
                            <span className="text-3xs print:text-[7.5px] text-slate-300 print:text-slate-200 italic">
                                {isDigital ? "[ Belum TTD Digital ]" : "[ Tanda Tangan Fisik ]"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Garis Dasar Tanda Tangan */}
                <div className="w-full border-b border-slate-400 mt-0.5 mb-1"></div>

                {/* Nama Terang Pelanggan */}
                <p className="font-bold text-slate-900 text-xs print:text-[8.5px] w-full truncate max-w-[160px]">
                    {customerName || "Pelanggan"}
                </p>
                <p className="text-3xs print:text-[7px] text-slate-400 font-mono mt-0.5">
                    {customerSignedAt 
                        ? new Date(customerSignedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : "Pelanggan Yangversa"}
                </p>
            </div>

            {/* Kolom Tanda Tangan Petugas Workshop */}
            <div className="flex flex-col items-center justify-end text-center w-36 sm:w-44 print:w-32">
                <p className="text-slate-600 text-xs print:text-[8px] font-semibold mb-0.5">
                    {adminRole}
                </p>

                {/* Box Area Tanda Tangan */}
                <div className="h-16 print:h-12 w-full flex items-center justify-center">
                    {activeAdminSig ? (
                        <img 
                            src={activeAdminSig} 
                            alt={`TTD ${adminName}`} 
                            className="max-h-14 print:max-h-11 max-w-[130px] print:max-w-[100px] object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-end justify-center pb-1.5 border-b border-dashed border-slate-300 print:border-none">
                            <span className="text-3xs print:text-[7.5px] text-slate-300 print:text-slate-200 italic">
                                [ Tanda Tangan Petugas ]
                            </span>
                        </div>
                    )}
                </div>

                {/* Garis Dasar Tanda Tangan */}
                <div className="w-full border-b border-slate-400 mt-0.5 mb-1"></div>

                {/* Nama Terang Petugas */}
                <p className="font-bold text-slate-900 text-xs print:text-[8.5px] w-full truncate max-w-[160px]">
                    {adminName || "Yangversa Computer"}
                </p>
                <p className="text-3xs print:text-[7px] text-slate-400 mt-0.5">
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

    // Robust resolution for Device & Ticket metadata
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

    const handlePrint = () => {
        window.print();
    };

    const modalContent = (
        <div className="modal-shell z-[9999] bg-slate-950/70 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible invoice-modal-overlay">
            {/* Print Stylesheet for flawless 1-page A4 Portrait printing without background bleed */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                    /* Completely remove root and its 4000px height from the print layout */
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

            <div className="modal-panel max-w-4xl z-10 print:max-h-none print:h-auto print:rounded-none print:border-none print:shadow-none printable-invoice-modal">
                <div className="modal-grabber no-print" />
                {/* Modal Top Header (Screen Only) */}
                <div className="no-print px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                                Faktur Tagihan & Pembayaran Resmi
                            </h3>
                            <p className="text-2xs sm:text-xs text-slate-500 font-mono">
                                No. Tiket: {tiket.nomor_tiket} &bull; INV-{(invoice.id || 1).toString().padStart(4, '0')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Cetak lembar invoice resmi format A4 (1 Halaman)"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak Faktur</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                            title="Tutup Modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Body (Clean, compact A4 layout) */}
                <div className="p-5 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar print:overflow-visible print:p-0 print:text-[10px] print:leading-snug">
                    {/* Official Workshop Header */}
                    <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-4 print:pb-2.5">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl print:text-lg font-black text-slate-900 tracking-tight">KOMPUTERAWET.COM</h2>
                                <span className="text-xs print:text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    Yangversa Computer
                                </span>
                            </div>
                            <p className="text-slate-600 text-xs print:text-[9px] mt-0.5 font-medium">
                                Pusat Servis Laptop, PC Desktop & Pengadaan Suku Cadang
                            </p>
                            <p className="text-slate-500 text-xs print:text-[8px] mt-0.5">
                                Workshop Yangversa &bull; WhatsApp CS: 0812-3456-7890 &bull; www.komputerawet.com
                            </p>
                        </div>
                        <div className="text-left sm:text-right print:text-right shrink-0">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 mb-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 print:w-3 print:h-3" />
                                <span className="text-xs print:text-[9px] font-bold uppercase tracking-wider">Lunas</span>
                            </div>
                            <p className="text-2xs print:text-[8px] font-semibold text-slate-500 uppercase tracking-wide">Faktur Pembayaran #</p>
                            <p className="text-lg print:text-base font-mono font-bold text-slate-900 leading-tight">
                                INV-{(invoice.id || 1).toString().padStart(4, '0')}
                            </p>
                            <p className="text-2xs print:text-[8px] text-slate-500 mt-0.5">
                                Tanggal: {new Date(invoice.created_at || tiket.created_at || Date.now()).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    {/* Customer & Unit Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-3 py-4 print:py-2.5 border-b border-slate-200 text-xs print:text-[9px]">
                        <div>
                            <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1 text-2xs print:text-[8px]">
                                Ditagihkan Kepada:
                            </p>
                            <h3 className="text-base print:text-xs font-bold text-slate-900 leading-snug">{customer.nama}</h3>
                            <p className="text-slate-600 font-mono mt-0.5">{customer.nomor_telepon}</p>
                            <p className="text-slate-600 text-xs print:text-[8.5px] mt-0.5 max-w-sm">
                                {customer.alamat || "Alamat tidak dicantumkan"}
                            </p>
                        </div>
                        <div className="sm:text-right print:text-right">
                            <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1 text-2xs print:text-[8px]">
                                Data Perangkat & Tiket:
                            </p>
                            <p className="font-bold text-slate-900 text-sm print:text-xs leading-snug">
                                {jenisPerangkat} &bull; {namaPerangkatLengkap}
                            </p>
                            <p className="text-slate-600 mt-0.5">
                                Serial Number: <span className="font-mono">{serialNumber}</span>
                            </p>
                            <p className="text-slate-600 mt-0.5">
                                No. Tiket: <strong className="font-mono text-slate-900">{tiket.nomor_tiket}</strong>
                            </p>
                            <p className="text-slate-600 mt-0.5">
                                Teknisi: <span className="font-medium text-slate-800">{teknisiNama}</span>
                            </p>
                        </div>
                    </div>

                    {/* Problem & Diagnosis Summary */}
                    <div className="py-2.5 print:py-1.5 border-b border-slate-200 bg-slate-50/70 print:bg-slate-50/50 px-4 print:px-2.5 rounded-xl my-3 print:my-2 text-xs print:text-[9px]">
                        <p className="font-bold text-slate-500 uppercase tracking-wider mb-1 text-3xs print:text-[7.5px]">
                            Ringkasan Pekerjaan Servis:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
                            <div>
                                <span className="font-semibold text-slate-700">Keluhan Awal:</span>
                                <p className="text-slate-600 mt-0.5 leading-relaxed">{tiket.keluhan || "-"}</p>
                            </div>
                            {tiket.diagnosis && (
                                <div>
                                    <span className="font-semibold text-slate-700">Tindakan / Solusi Teknis:</span>
                                    <p className="text-slate-600 mt-0.5 leading-relaxed">{tiket.diagnosis.solusi || "-"}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cost Breakdown Table */}
                    <div className="py-2 overflow-x-auto print:overflow-visible">
                        <table className="w-full text-left text-xs print:text-[9px]">
                            <thead>
                                <tr className="border-b-2 border-slate-200 text-slate-900 font-bold">
                                    <th className="py-2 print:py-1">Deskripsi Item / Jasa</th>
                                    <th className="py-2 print:py-1 text-right">Harga Satuan</th>
                                    <th className="py-2 print:py-1 text-center">Qty</th>
                                    <th className="py-2 print:py-1 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-2 print:py-1 text-slate-800">
                                        <span className="font-bold block">Biaya Jasa Servis & Penanganan</span>
                                        <span className="text-slate-500 text-3xs print:text-[7.5px]">Tindakan teknis reparasi, instalasi & pengujian fungsi</span>
                                    </td>
                                    <td className="py-2 print:py-1 text-right text-slate-600 font-mono">{formatRupiah(invoice.biaya_jasa)}</td>
                                    <td className="py-2 print:py-1 text-center text-slate-600">1</td>
                                    <td className="py-2 print:py-1 text-right font-bold text-slate-900 font-mono">{formatRupiah(invoice.biaya_jasa)}</td>
                                </tr>
                                
                                {sparepartsList.map((p, index) => (
                                    <tr key={index}>
                                        <td className="py-2 print:py-1 text-slate-800">
                                            <span className="font-bold block">{p.nama}</span>
                                            <span className="text-slate-500 text-3xs print:text-[7.5px]">Suku cadang / Sparepart resmi ({p.kategori})</span>
                                        </td>
                                        <td className="py-2 print:py-1 text-right text-slate-600 font-mono">{formatRupiah(p.harga)}</td>
                                        <td className="py-2 print:py-1 text-center text-slate-600">{p.jumlah}</td>
                                        <td className="py-2 print:py-1 text-right font-bold text-slate-900 font-mono">{formatRupiah(p.harga * p.jumlah)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-300">
                                    <td colSpan="3" className="py-2.5 print:py-1.5 text-right font-bold text-slate-700 uppercase tracking-wider text-xs print:text-[9px]">
                                        Total Tagihan Lunas
                                    </td>
                                    <td className="py-2.5 print:py-1.5 text-right font-black text-base print:text-xs text-blue-700 font-mono">
                                        {formatRupiah(invoice.total_biaya)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer / Signature */}
                    <div className="pt-3 print:pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs print:text-[8px]">
                        <div className="max-w-xs">
                            <p className="font-semibold text-slate-700">Masa Garansi Servis: {tiket.durasi_garansi || "1 Bulan"}</p>
                            <p className="text-slate-500 mt-0.5">Berlaku untuk perbaikan dan komponen yang sama sesuai rincian nota di atas.</p>
                            <p className="text-slate-400 mt-1 text-3xs print:text-[7px]">Dokumen ini merupakan bukti pembayaran resmi yang sah dari Yangversa Computer.</p>
                        </div>
                        <AlignedSignatureRow
                            customerSignature={invoice?.ttd_customer}
                            customerName={invoice?.ttd_customer_nama || customer.nama}
                            customerSignedAt={invoice?.ttd_customer_at}
                            adminSignature={invoice?.ttd_admin || DEFAULT_WORKSHOP_SIGNATURE}
                            adminName={invoice?.ttd_admin_nama && invoice?.ttd_admin_nama !== "Admin" ? invoice.ttd_admin_nama : "Yangversa Computer"}
                            isDigital={true}
                            adminRole="Petugas Workshop • Kasir"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
