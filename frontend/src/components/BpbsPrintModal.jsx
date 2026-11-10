import React, { useEffect } from "react";
import { X, Printer, FileText, CheckCircle2, ShieldCheck, User, MonitorSmartphone, Package, QrCode, Download, Share2 } from "lucide-react";
import { DocumentPrintService } from "../services/documentPrintService";
import { isNativePlatform } from "../services/nativeServices";

export default function BpbsPrintModal({ isOpen, onClose, tiket }) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !tiket) return null;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=1&data=${encodeURIComponent(
        typeof window !== "undefined"
            ? `${window.location.origin}/tracking?nomor_tiket=${tiket.nomor_tiket}`
            : `https://komputerawet.com/tracking?nomor_tiket=${tiket.nomor_tiket}`
    )}`;

    const tglMasuk = tiket.created_at
        ? new Date(tiket.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
        : "-";

    const customer = tiket.perangkat?.customer;
    const perangkat = tiket.perangkat;

    const handlePrint = () => {
        DocumentPrintService.printOrShareDocument("printable-bpbs", {
            filename: `BPBS-${tiket.nomor_tiket}.pdf`,
            title: `Tanda Terima Masuk (BPBS) #${tiket.nomor_tiket}`,
            text: `Surat Bukti Penerimaan Barang Servis (BPBS) #${tiket.nomor_tiket} - Yangversa Computer.`,
            preferDirectPrint: !isNativePlatform()
        });
    };

    const handleDownloadPdf = () => {
        DocumentPrintService.downloadPdf("printable-bpbs", `BPBS-${tiket.nomor_tiket}.pdf`, {
            orientation: "landscape",
            format: "a5"
        });
    };

    return (
        <div className="modal-shell z-[9999] bg-slate-950/70 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
            {/* Print Stylesheet for flawless 1-page A5 Landscape / Half-A4 Continuous Form printing */}
            <style>{`
                @media print {
                    @page {
                        size: A5 landscape;
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
                        font-size: 8pt !important;
                        line-height: 1.25 !important;
                    }
                    #printable-bpbs {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                        border: none !important;
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

            <div className="modal-panel max-w-5xl z-10 print:max-h-none print:h-auto print:rounded-none print:border-none print:shadow-none">
                <div className="modal-grabber no-print" />

                {/* Header Modal Bar (Screen Only) */}
                <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 shrink-0 no-print">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                    Tanda Terima Masuk (BPBS • Format Horizontal A5)
                                </h3>
                                <span className="hidden sm:inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-3xs font-semibold">
                                    Continuous Form Ready
                                </span>
                            </div>
                            <p className="text-3xs sm:text-2xs text-slate-500 font-mono mt-0.5 truncate">
                                No. Tiket: {tiket.nomor_tiket} &bull; Tgl: {tglMasuk}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200 shadow-2xs cursor-pointer active:scale-95"
                            title="Unduh Dokumen PDF Landscape A5"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Unduh PDF A5</span>
                            <span className="sm:hidden">PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            title={isNativePlatform() ? "Cetak / Kirim BPBS via WhatsApp" : "Cetak BPBS (Printer Continuous Form / PDF)"}
                        >
                            {isNativePlatform() ? (
                                <>
                                    <Share2 className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>Cetak / Kirim</span>
                                </>
                            ) : (
                                <>
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Cetak BPBS</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Area: Packed, horizontal continuous form design */}
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar print:overflow-visible print:p-0 print:text-[8pt] print:leading-tight bg-white text-slate-800" id="printable-bpbs">
                    {/* Kop Surat Toko & Header */}
                    <div className="flex flex-col sm:flex-row print:flex-row items-start sm:items-center print:items-center justify-between pb-2.5 print:pb-1.5 border-b-2 border-slate-900 gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-lg sm:text-xl print:text-base font-black tracking-tight text-slate-900 font-mono">
                                    KOMPUTERAWET.COM
                                </span>
                                <span className="text-3xs print:text-[7px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-mono border border-blue-200">
                                    YANGVERSA
                                </span>
                            </div>
                            <p className="text-3xs sm:text-2xs print:text-[7.5px] text-slate-600 font-medium leading-snug mt-0.5">
                                Pusat Reparasi Laptop, PC Desktop & Solusi Hardware Spesialis
                            </p>
                            <p className="text-3xs print:text-[7px] text-slate-500 leading-tight">
                                Jl. Raya Pekayon No. 25, Bekasi Selatan &bull; WA CS: 0812-3456-7890 &bull; www.komputerawet.com
                            </p>
                        </div>

                        <div className="text-left sm:text-right print:text-right shrink-0">
                            <div className="flex items-center sm:justify-end print:justify-end gap-1.5 mb-0.5">
                                <span className="text-3xs sm:text-2xs print:text-[7.5px] font-extrabold uppercase tracking-wider text-slate-900">
                                    BUKTI PENERIMAAN BARANG SERVIS (BPBS)
                                </span>
                            </div>
                            <p className="text-base sm:text-lg print:text-sm font-mono font-black text-blue-700 leading-tight">
                                {tiket.nomor_tiket}
                            </p>
                            <p className="text-3xs print:text-[7px] text-slate-500 font-mono">
                                Tgl Masuk: <strong className="text-slate-800">{tglMasuk}</strong> &bull; Status: <span className="text-emerald-700 font-bold">Diterima</span>
                            </p>
                        </div>
                    </div>

                    {/* Metadata Strip: 3 Compact Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2 py-2 print:py-1.5 border-b border-slate-200 text-3xs sm:text-2xs print:text-[7.5px] bg-slate-50/70 print:bg-slate-50/30 rounded-lg px-3 print:px-2 mt-2 print:mt-1">
                        {/* Data Pelanggan */}
                        <div className="space-y-0.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                                Data Pelanggan
                            </span>
                            <p className="font-bold text-slate-900 truncate">
                                {customer?.nama || "Pelanggan"}
                            </p>
                            <p className="text-slate-600 font-mono">
                                {customer?.nomor_telepon || "-"}
                            </p>
                            <p className="text-slate-500 truncate">
                                {customer?.alamat || "Bekasi & Sekitarnya"}
                            </p>
                        </div>

                        {/* Data Perangkat */}
                        <div className="space-y-0.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                                Data Perangkat
                            </span>
                            <p className="font-bold text-slate-900 truncate">
                                {perangkat?.merek} {perangkat?.model}
                            </p>
                            <p className="text-slate-600">
                                Kategori: <span className="font-medium text-slate-800">{perangkat?.jenis_perangkat || "Laptop"}</span>
                            </p>
                            <p className="text-slate-600 font-mono">
                                S/N: <span className="font-medium text-slate-800">{perangkat?.serial_number || "-"}</span>
                            </p>
                        </div>

                        {/* Layanan & Estimasi */}
                        <div className="space-y-0.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block text-3xs print:text-[6.5px]">
                                Layanan & Estimasi
                            </span>
                            <p className="text-slate-800">
                                Teknisi PIC: <strong className="text-slate-900">{tiket.teknisi?.nama || "Tim Teknisi YVS"}</strong>
                            </p>
                            <p className="text-slate-800">
                                Paket SLA: <strong className="text-blue-700 uppercase font-mono">{tiket.sla_paket || "Reguler"}</strong>
                            </p>
                            <p className="text-slate-500">
                                Konfirmasi Cek: <strong>Maks 1x24 Jam Kerja</strong>
                            </p>
                        </div>
                    </div>

                    {/* Detail Keluhan, Kelengkapan & Izin SOP (Packed 2 Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 mt-2 print:mt-1.5 text-3xs sm:text-2xs print:text-[7.5px]">
                        {/* Kolom Kiri: Keluhan & Kelengkapan */}
                        <div className="border border-slate-200 rounded-lg p-2.5 print:p-1.5 bg-white space-y-1.5">
                            <div>
                                <span className="text-slate-500 font-bold uppercase block text-3xs print:text-[6.5px]">
                                    Keluhan / Gejala Kerusakan:
                                </span>
                                <p className="font-medium text-slate-900 bg-amber-50/60 p-1.5 rounded border border-amber-200/60 leading-snug whitespace-pre-line mt-0.5">
                                    {tiket.keluhan || "Pengecekan dan perawatan menyeluruh"}
                                </p>
                            </div>
                            <div>
                                <span className="text-slate-500 font-bold uppercase block text-3xs print:text-[6.5px]">
                                    Kelengkapan Dititipkan:
                                </span>
                                <p className="text-slate-800 font-medium bg-slate-50 p-1 rounded border border-slate-200 mt-0.5 truncate">
                                    {tiket.kelengkapan || "Hanya unit (tanpa charger / aksesori)"}
                                </p>
                            </div>
                        </div>

                        {/* Kolom Kanan: Kondisi Fisik & SOP Izin */}
                        <div className="border border-slate-200 rounded-lg p-2.5 print:p-1.5 bg-white space-y-1.5">
                            <div>
                                <span className="text-slate-500 font-bold uppercase block text-3xs print:text-[6.5px]">
                                    Kondisi Fisik Saat Intake:
                                </span>
                                <p className="text-slate-800 font-medium bg-slate-50 p-1 rounded border border-slate-200 mt-0.5 truncate">
                                    {tiket.kondisi_fisik || "Normal / Bersih"}{tiket.spesifikasi_awal ? ` • ${tiket.spesifikasi_awal}` : ""}
                                </p>
                            </div>
                            <div className="border border-blue-200 bg-blue-50/40 rounded p-1.5">
                                <div className="flex items-center gap-1 font-bold text-blue-900 text-3xs print:text-[6.5px] uppercase mb-0.5">
                                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                                    <span>Persetujuan SOP & Privasi Pelanggan</span>
                                </div>
                                <div className="flex items-center gap-3 text-3xs print:text-[6.5px] text-slate-700">
                                    <span>Bongkar Casing: <strong>{tiket.izin_bongkar ? "Diizinkan" : "Tidak"}</strong></span>
                                    <span>Cek OS Windows: <strong>{tiket.izin_akses_os ? "Pengecekan Teknis" : "Tidak"}</strong></span>
                                </div>
                                <p className="text-3xs print:text-[6px] text-slate-400 italic mt-0.5">
                                    * Data & file pribadi pelanggan dijamin aman dan tidak diakses sembarangan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Strip: QR Tracking, Syarat Singkat & Dua Tanda Tangan */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-2 mt-2 print:mt-1.5 pt-2 border-t border-slate-200 items-end text-3xs print:text-[7px]">
                        {/* QR Code & Tracking Box */}
                        <div className="sm:col-span-4 print:col-span-4 flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <img
                                src={qrCodeUrl}
                                alt={`QR ${tiket.nomor_tiket}`}
                                className="w-12 h-12 bg-white p-0.5 rounded border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 leading-tight">Pantau Servis Online</p>
                                <p className="text-3xs print:text-[6px] text-slate-500 mt-0.5">
                                    Scan QR atau buka link:
                                </p>
                                <p className="text-3xs print:text-[6.5px] font-mono font-bold text-blue-700 truncate">
                                    komputerawet.com/tracking
                                </p>
                            </div>
                        </div>

                        {/* Syarat & Ketentuan Ringkas */}
                        <div className="sm:col-span-4 print:col-span-4 text-slate-500 space-y-0.5 text-3xs print:text-[6px] leading-tight px-1">
                            <p className="font-bold text-slate-700 uppercase">Ketentuan Penting:</p>
                            <p>1. BPBS ini bukti sah & <strong>wajib dibawa saat ambil unit</strong>.</p>
                            <p>2. Estimasi biaya dikonfirmasi terlebih dahulu via WhatsApp.</p>
                            <p>3. Unit selesai &gt; 60 hari tidak diambil di luar tanggung jawab toko.</p>
                        </div>

                        {/* Dual Signatures */}
                        <div className="sm:col-span-4 print:col-span-4 grid grid-cols-2 gap-2 text-center">
                            <div>
                                <p className="text-slate-500 text-3xs print:text-[6.5px]">Yang Menyerahkan,</p>
                                <div className="h-9 print:h-7 flex items-end justify-center pb-0.5">
                                    <span className="text-3xs print:text-[6px] text-slate-300 italic">[ Tanda Tangan ]</span>
                                </div>
                                <p className="font-bold text-slate-900 border-t border-slate-300 pt-0.5 truncate text-3xs print:text-[7px]">
                                    {customer?.nama || "Pelanggan"}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-3xs print:text-[6.5px]">Frontliner Penerima,</p>
                                <div className="h-9 print:h-7 flex items-end justify-center pb-0.5">
                                    <span className="text-3xs print:text-[6px] text-slate-300 italic">[ Cap Toko ]</span>
                                </div>
                                <p className="font-bold text-slate-900 border-t border-slate-300 pt-0.5 truncate text-3xs print:text-[7px]">
                                    {tiket.teknisi?.nama || "Yangversa"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Modal Bar (Screen Only) */}
                <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 no-print gap-2">
                    <span className="text-2xs sm:text-xs text-slate-500">
                        Format cetak dioptimalkan untuk ukuran continuous form setengah A4 (A5 Landscape).
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
