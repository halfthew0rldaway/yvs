import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
    X, 
    Printer, 
    Download, 
    QrCode, 
    MonitorSmartphone, 
    User, 
    Calendar, 
    AlertCircle,
    FileText,
    Copy,
    Check,
    Layers,
    Tag,
    SlidersHorizontal
} from "lucide-react";
import QRCode from "qrcode";
import { DocumentPrintService } from "../services/documentPrintService";
import { isNativePlatform } from "../services/nativeServices";

// Label size specifications tailored for direct thermal label printers & continuous POS
export const LABEL_SIZES = [
    {
        id: "50x30",
        label: "50 x 30 mm",
        tag: "Mini / Charger",
        desc: "Ideal untuk charger, adaptor, baterai, atau bezel laptop",
        widthMm: 50,
        heightMm: 30,
        pageCssSize: "50mm 30mm",
        orientation: "landscape"
    },
    {
        id: "60x40",
        label: "60 x 40 mm",
        tag: "Kecil",
        desc: "Ukuran standar stiker unit laptop kompak",
        widthMm: 60,
        heightMm: 40,
        pageCssSize: "60mm 40mm",
        orientation: "landscape"
    },
    {
        id: "80x50",
        label: "80 x 50 mm",
        tag: "Standar Unit",
        desc: "Paling populer untuk bodi laptop servis (rekomendasi)",
        widthMm: 80,
        heightMm: 50,
        pageCssSize: "80mm 50mm",
        orientation: "landscape"
    },
    {
        id: "100x75",
        label: "100 x 75 mm",
        tag: "Besar / Dus",
        desc: "Label lengkap untuk dus kemasan, tas, atau casing luar",
        widthMm: 100,
        heightMm: 75,
        pageCssSize: "100mm 75mm",
        orientation: "landscape"
    },
    {
        id: "roll",
        label: "Struk 58/80 mm",
        tag: "Thermal Roll POS",
        desc: "Printer kasir thermal continuous roll tanpa batas stiker",
        widthMm: 72,
        heightMm: 95,
        pageCssSize: "80mm auto",
        orientation: "portrait"
    }
];

export default function TicketQrModal({ isOpen, onClose, tiket }) {
    if (!isOpen || !tiket) return null;

    const [selectedSizeId, setSelectedSizeId] = useState("80x50");
    const [qrTarget, setQrTarget] = useState("erp"); // "erp" (Buka di ERP Teknisi) | "tracking" (Portal Publik Pelanggan) | "text" (Nomor Tiket Saja)
    const [printCount, setPrintCount] = useState(1);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [copiedCode, setCopiedCode] = useState(false);

    const selectedSize = useMemo(() => {
        return LABEL_SIZES.find(s => s.id === selectedSizeId) || LABEL_SIZES[2];
    }, [selectedSizeId]);

    const erpUrl = typeof window !== "undefined"
        ? `${window.location.origin}/tiket-servis?search=${encodeURIComponent(tiket.nomor_tiket)}`
        : `https://komputerawet.com/tiket-servis?search=${encodeURIComponent(tiket.nomor_tiket)}`;

    const trackingUrl = typeof window !== "undefined"
        ? `${window.location.origin}/tracking?nomor_tiket=${encodeURIComponent(tiket.nomor_tiket)}`
        : `https://komputerawet.com/tracking?nomor_tiket=${encodeURIComponent(tiket.nomor_tiket)}`;

    const qrData = qrTarget === "erp" ? erpUrl : qrTarget === "tracking" ? trackingUrl : tiket.nomor_tiket;

    // Generate crisp QR code locally with zero network delay
    useEffect(() => {
        let active = true;
        QRCode.toDataURL(qrData, {
            width: 360,
            margin: 1,
            color: {
                dark: "#000000",
                light: "#ffffff"
            },
            errorCorrectionLevel: "M"
        })
            .then(url => {
                if (active) setQrDataUrl(url);
            })
            .catch(() => {
                // Fallback to QR server if local rendering fails
                if (active) {
                    setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&data=${encodeURIComponent(qrData)}`);
                }
            });

        return () => { active = false; };
    }, [qrData]);

    const handlePrint = () => {
        DocumentPrintService.printOrShareDocument("printable-ticket-qr-container", {
            filename: `Label-${tiket.nomor_tiket}-${selectedSize.id}.pdf`,
            title: `Label Tiket #${tiket.nomor_tiket} - Yangversa Computer`,
            text: `Label barcode unit servis ${tiket.nomor_tiket} dari Workshop Yangversa Computer.`,
            preferDirectPrint: !isNativePlatform(),
            widthMm: selectedSize.widthMm,
            heightMm: selectedSize.heightMm
        });
    };

    const handleDownloadPdf = () => {
        DocumentPrintService.downloadPdf("printable-ticket-qr-container", `Label-Tiket-${tiket.nomor_tiket}-${selectedSize.id}.pdf`, {
            widthMm: selectedSize.widthMm,
            heightMm: selectedSize.heightMm,
            fitContentHeight: false
        });
    };

    const handleDownloadPng = () => {
        if (!qrDataUrl) return;
        const link = document.createElement("a");
        link.href = qrDataUrl;
        link.download = `QR-${tiket.nomor_tiket}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(tiket.nomor_tiket);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const tglMasuk = tiket.created_at
        ? new Date(tiket.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
        : "-";

    const customerName = tiket.perangkat?.customer?.nama || "-";
    const deviceName = `${tiket.perangkat?.merek || ""} ${tiket.perangkat?.model || ""}`.trim() || "Perangkat Unit";
    const complaints = tiket.keluhan || "-";

    const modalContent = (
        <div className="modal-shell z-[9999] bg-slate-950/75 backdrop-blur-xs qr-print-portal flex items-center justify-center p-3 sm:p-4">
            
            {/* Direct Thermal & Browser Print Stylesheet */}
            <style>{`
                @media print {
                    @page {
                        size: ${selectedSize.pageCssSize};
                        margin: 0mm !important;
                    }
                    #root,
                    #root * {
                        display: none !important;
                        height: 0 !important;
                        overflow: hidden !important;
                        visibility: hidden !important;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .qr-print-portal {
                        position: static !important;
                        display: block !important;
                        background: transparent !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }
                    .modal-panel,
                    .qr-modal-dialog {
                        display: block !important;
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        max-height: none !important;
                        max-width: none !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: transparent !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .qr-preview-body {
                        padding: 0 !important;
                        margin: 0 !important;
                        background: transparent !important;
                        overflow: visible !important;
                        display: block !important;
                        height: auto !important;
                        max-height: none !important;
                    }
                    #printable-ticket-qr-container {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        gap: 0 !important;
                        background: #ffffff !important;
                    }
                    .printable-label-page {
                        width: ${selectedSize.widthMm}mm !important;
                        height: ${selectedSize.heightMm}mm !important;
                        max-width: ${selectedSize.widthMm}mm !important;
                        max-height: ${selectedSize.heightMm}mm !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        box-sizing: border-box !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        overflow: hidden !important;
                    }
                    .printable-label-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                }
            `}</style>

            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs no-print" 
                onClick={onClose} 
            />

            {/* Modal Dialog Card */}
            <div className="modal-panel max-w-2xl w-full z-10 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col qr-modal-dialog max-h-[92dvh]">
                
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 no-print shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                                    Cetak Stiker Barcode & QR Tiket
                                </h3>
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-2xs border border-blue-200">
                                    {tiket.nomor_tiket}
                                </span>
                            </div>
                            <p className="text-2xs text-slate-500 font-medium mt-0.5">
                                Khusus Direct Thermal Label Printer & Printer Struk Kasir
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar 1: Pilihan Ukuran Label Kertas */}
                <div className="px-4 sm:px-5 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-col gap-2 no-print shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                            Pilih Ukuran Kertas / Label Stiker:
                        </span>
                        <span className="text-3xs text-slate-400 italic font-mono hidden sm:inline">
                            Ukuran aktif: {selectedSize.label} ({selectedSize.tag})
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {LABEL_SIZES.map((size) => {
                            const isSelected = selectedSizeId === size.id;
                            return (
                                <button
                                    key={size.id}
                                    type="button"
                                    onClick={() => setSelectedSizeId(size.id)}
                                    className={`px-2.5 py-1.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                                        isSelected
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20"
                                            : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className={`font-black text-xs ${isSelected ? "text-white" : "text-slate-900"}`}>
                                            {size.label}
                                        </span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className={`text-3xs font-medium truncate mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                                        {size.tag}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Toolbar 2: Tujuan URL & Qty Cetak */}
                <div className="px-4 sm:px-5 py-2 bg-white border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2.5 text-xs no-print shrink-0">
                    {/* Tujuan URL Scan */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-2xs text-slate-500 font-semibold">Tujuan Scan:</span>
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                            <button
                                type="button"
                                onClick={() => setQrTarget("erp")}
                                className={`px-2 py-0.5 rounded text-2xs font-bold transition-all cursor-pointer ${
                                    qrTarget === "erp" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="Buka lembar kerja tiket langsung di ERP saat discan kamera staf"
                            >
                                Link ERP Teknisi
                            </button>
                            <button
                                type="button"
                                onClick={() => setQrTarget("tracking")}
                                className={`px-2 py-0.5 rounded text-2xs font-bold transition-all cursor-pointer ${
                                    qrTarget === "tracking" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="Buka portal tracking publik pelanggan"
                            >
                                Tracking Publik
                            </button>
                            <button
                                type="button"
                                onClick={() => setQrTarget("text")}
                                className={`px-2 py-0.5 rounded text-2xs font-semibold transition-all cursor-pointer ${
                                    qrTarget === "text" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="QR berisi teks nomor tiket saja"
                            >
                                Teks
                            </button>
                        </div>
                    </div>

                    {/* Qty Cetak Multiplier */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xs text-slate-500 font-semibold">Qty Stiker:</span>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 5].map((qty) => (
                                <button
                                    key={qty}
                                    type="button"
                                    onClick={() => setPrintCount(qty)}
                                    className={`px-2 py-0.5 rounded-lg text-2xs font-mono font-bold transition-all border cursor-pointer ${
                                        printCount === qty
                                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {qty}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Modal Body / Live Preview Label */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex flex-col items-center justify-center custom-scrollbar qr-preview-body">
                    
                    {/* Printable Container (Rendered to screen & targeted by Print Spooler) */}
                    <div id="printable-ticket-qr-container" className="w-full flex flex-col items-center gap-4">
                        {Array.from({ length: printCount }).map((_, index) => (
                            <div 
                                key={index} 
                                className="printable-label-page w-full flex justify-center"
                            >
                                
                                {/* ========================================================
                                    SIZE 1: 50 x 30 mm (Mini / Charger / Bezel)
                                   ======================================================== */}
                                {selectedSize.id === "50x30" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-lg p-1.5 text-slate-900 flex items-center justify-between gap-1.5 overflow-hidden shadow-sm"
                                        style={{ width: "47mm", height: "27mm", boxSizing: "border-box" }}
                                    >
                                        {/* QR Code Left */}
                                        <div className="w-[18mm] h-[18mm] shrink-0 flex items-center justify-center">
                                            {qrDataUrl ? (
                                                <img 
                                                    src={qrDataUrl} 
                                                    alt={`QR ${tiket.nomor_tiket}`} 
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
                                            )}
                                        </div>

                                        {/* Meta Right */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <img src="/logo-yangversa.png" alt="YVS" className="w-2.5 h-2.5 object-contain shrink-0" />
                                                    <span className="font-extrabold text-[6pt] uppercase tracking-wider text-slate-900 leading-none">
                                                        YVS COMPUTER
                                                    </span>
                                                </div>
                                                <div className="mt-0.5 px-1 py-0.2 bg-slate-900 text-white rounded font-mono font-black text-[7pt] leading-tight text-center tracking-tight truncate">
                                                    {tiket.nomor_tiket}
                                                </div>
                                            </div>

                                            <div className="space-y-0.5 text-[5.5pt] text-slate-700 leading-tight">
                                                <p className="font-bold text-slate-900 truncate">
                                                    {deviceName}
                                                </p>
                                                <p className="truncate text-slate-600">
                                                    {customerName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================
                                    SIZE 2: 60 x 40 mm (Kecil / Unit Laptop Kompak)
                                   ======================================================== */}
                                {selectedSize.id === "60x40" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-xl p-2 text-slate-900 flex flex-col justify-between overflow-hidden shadow-sm"
                                        style={{ width: "57mm", height: "37mm", boxSizing: "border-box" }}
                                    >
                                        <div className="flex items-center justify-between pb-1 border-b border-dashed border-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <img src="/logo-yangversa.png" alt="YVS" className="w-3.5 h-3.5 object-contain shrink-0" />
                                                <div>
                                                    <h4 className="font-black text-[7pt] uppercase tracking-wider text-slate-900 leading-none">
                                                        YVS COMPUTER
                                                    </h4>
                                                    <p className="text-[5pt] text-slate-500 font-medium mt-0.5">Workshop Servis Laptop</p>
                                                </div>
                                            </div>
                                            <div className="px-1.5 py-0.5 bg-slate-900 text-white rounded font-mono font-black text-[7pt] shrink-0">
                                                {tiket.nomor_tiket}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 py-0.5">
                                            <div className="w-[18mm] h-[18mm] shrink-0">
                                                {qrDataUrl && (
                                                    <img 
                                                        src={qrDataUrl} 
                                                        alt={`QR ${tiket.nomor_tiket}`} 
                                                        className="w-full h-full object-contain"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-0.5 text-[6pt] text-slate-700 leading-tight">
                                                <p className="font-bold text-slate-900 truncate">
                                                    {deviceName}
                                                </p>
                                                <p className="truncate text-slate-600">
                                                    Cust: {customerName}
                                                </p>
                                                <p className="truncate text-slate-500 text-[5.5pt]">
                                                    Kel: {complaints}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-0.5 border-t border-dashed border-slate-200 flex items-center justify-between text-[5pt] text-slate-500 font-mono">
                                            <span>Scan untuk status</span>
                                            <span>{tglMasuk}</span>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================
                                    SIZE 3: 80 x 50 mm (Standar Stiker Unit - Rekomendasi)
                                   ======================================================== */}
                                {selectedSize.id === "80x50" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-xl p-2.5 text-slate-900 flex flex-col justify-between overflow-hidden shadow-sm"
                                        style={{ width: "76mm", height: "46mm", boxSizing: "border-box" }}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between pb-1 border-b border-dashed border-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <img 
                                                    src="/logo-yangversa.png" 
                                                    alt="YVS Computer" 
                                                    className="w-4 h-4 object-contain shrink-0" 
                                                />
                                                <div>
                                                    <h4 className="font-black text-[8pt] uppercase tracking-wider text-slate-900 leading-none">
                                                        YVS COMPUTER
                                                    </h4>
                                                    <p className="text-[5.5pt] text-slate-500 font-medium">Spesialis Servis Laptop & Gadget</p>
                                                </div>
                                            </div>
                                            <div className="px-1.5 py-0.5 bg-slate-900 text-white rounded font-mono font-black text-[8pt] tracking-wider shrink-0">
                                                {tiket.nomor_tiket}
                                            </div>
                                        </div>

                                        {/* Body: QR Left + Meta Right */}
                                        <div className="flex items-center gap-2.5 py-1">
                                            <div className="w-[21mm] h-[21mm] shrink-0 bg-white border border-slate-200 rounded p-0.5 flex items-center justify-center">
                                                {qrDataUrl && (
                                                    <img 
                                                        src={qrDataUrl} 
                                                        alt={`QR ${tiket.nomor_tiket}`} 
                                                        className="w-full h-full object-contain"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-0.5 text-[6.5pt] text-slate-800 leading-snug">
                                                <div className="flex items-start gap-1">
                                                    <span className="text-slate-400 font-bold shrink-0">Unit:</span>
                                                    <span className="font-black text-slate-900 truncate">{deviceName}</span>
                                                </div>
                                                <div className="flex items-start gap-1">
                                                    <span className="text-slate-400 font-bold shrink-0">Cust:</span>
                                                    <span className="font-semibold text-slate-800 truncate">{customerName}</span>
                                                </div>
                                                <div className="flex items-start gap-1">
                                                    <span className="text-slate-400 font-bold shrink-0">Kel:</span>
                                                    <span className="font-medium text-slate-600 line-clamp-2 text-[6pt]">{complaints}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-0.5 border-t border-dashed border-slate-300 flex items-center justify-between text-[5.5pt] text-slate-500 font-mono">
                                            <span className="font-semibold">
                                                {qrTarget === "erp" ? "SCAN UNTUK LEMBAR KERJA ERP" : "SCAN UNTUK TRACKING PUBLIK"}
                                            </span>
                                            <span>Masuk: {tglMasuk}</span>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================
                                    SIZE 4: 100 x 75 mm (Besar / Kotak / Dus / Packing)
                                   ======================================================== */}
                                {selectedSize.id === "100x75" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-2xl p-3.5 text-slate-900 flex flex-col justify-between overflow-hidden shadow-sm"
                                        style={{ width: "95mm", height: "70mm", boxSizing: "border-box" }}
                                    >
                                        {/* Header Toko */}
                                        <div className="flex items-center justify-between pb-1.5 border-b-2 border-dashed border-slate-300">
                                            <div className="flex items-center gap-2.5">
                                                <img src="/logo-yangversa.png" alt="YVS" className="w-6 h-6 object-contain shrink-0" />
                                                <div>
                                                    <h4 className="font-black text-[10pt] uppercase tracking-wider text-slate-900">
                                                        YVS COMPUTER
                                                    </h4>
                                                    <p className="text-[6.5pt] text-slate-500 font-medium">Workshop Pusat Perbaikan & Rekayasa Komputer</p>
                                                </div>
                                            </div>
                                            <div className="px-2.5 py-0.5 bg-slate-900 text-white rounded-lg font-mono font-black text-xs tracking-widest shrink-0">
                                                {tiket.nomor_tiket}
                                            </div>
                                        </div>

                                        {/* Main Content Grid */}
                                        <div className="grid grid-cols-12 gap-3 py-1.5 items-center">
                                            {/* QR Container */}
                                            <div className="col-span-5 flex flex-col items-center justify-center p-1.5 bg-white border border-slate-200 rounded-lg">
                                                {qrDataUrl && (
                                                    <img 
                                                        src={qrDataUrl} 
                                                        alt={`QR ${tiket.nomor_tiket}`} 
                                                        className="w-24 h-24 object-contain"
                                                    />
                                                )}
                                                <span className="text-4xs font-mono font-bold text-slate-500 mt-0.5 uppercase text-center">
                                                    {qrTarget === "erp" ? "Buka di ERP" : "Portal Pelanggan"}
                                                </span>
                                            </div>

                                            {/* Detailed Specs */}
                                            <div className="col-span-7 space-y-1 text-xs">
                                                <div>
                                                    <span className="text-3xs text-slate-400 font-bold uppercase block">Perangkat Unit</span>
                                                    <p className="font-black text-xs text-slate-900 leading-tight truncate">
                                                        {deviceName}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-3xs text-slate-400 font-bold uppercase block">Pemilik / Pelanggan</span>
                                                    <p className="font-bold text-2xs text-slate-800 truncate">
                                                        {customerName}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-3xs text-slate-400 font-bold uppercase block">Keluhan Utama</span>
                                                    <p className="text-3xs text-slate-700 line-clamp-2 leading-tight">
                                                        {complaints}
                                                    </p>
                                                </div>

                                                <div className="pt-0.5 flex items-center justify-between text-3xs font-mono text-slate-500 border-t border-slate-100">
                                                    <span>Tgl Masuk:</span>
                                                    <span className="font-bold text-slate-700">{tglMasuk}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Disclaimer */}
                                        <div className="pt-1 border-t-2 border-dashed border-slate-300 flex items-center justify-between text-3xs text-slate-500">
                                            <span>Tempel stiker identitas ini pada dus / unit perangkat</span>
                                            <span className="font-mono font-bold">YVS Computer</span>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================
                                    SIZE 5: Struk Continuous Thermal Roll 58/80 mm (POS)
                                   ======================================================== */}
                                {selectedSize.id === "roll" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-xl p-3 text-slate-900 flex flex-col items-center text-center overflow-hidden shadow-sm"
                                        style={{ width: "70mm", minHeight: "auto", boxSizing: "border-box" }}
                                    >
                                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                            <img src="/logo-yangversa.png" alt="YVS" className="w-4 h-4 object-contain shrink-0" />
                                            <h4 className="font-black text-[9pt] uppercase tracking-wider text-slate-900">
                                                YVS COMPUTER
                                            </h4>
                                        </div>
                                        <p className="text-[6pt] text-slate-500 font-medium">Nota Identitas Unit Servis</p>
                                        
                                        <div className="my-2 px-3 py-1 bg-slate-900 text-white rounded-lg font-mono font-black text-[10pt] tracking-widest">
                                            {tiket.nomor_tiket}
                                        </div>

                                        {/* QR */}
                                        <div className="w-[32mm] h-[32mm] my-1 flex items-center justify-center">
                                            {qrDataUrl && (
                                                <img 
                                                    src={qrDataUrl} 
                                                    alt={`QR ${tiket.nomor_tiket}`} 
                                                    className="w-full h-full object-contain"
                                                />
                                            )}
                                        </div>

                                        <p className="text-[6.5pt] font-mono text-slate-500 uppercase tracking-tight">
                                            {qrTarget === "erp" ? "SCAN LEMBAR KERJA ERP" : "SCAN PORTAL PELANGGAN"}
                                        </p>

                                        {/* Divider */}
                                        <div className="w-full border-t border-dashed border-slate-300 my-2" />

                                        {/* List */}
                                        <div className="w-full space-y-1 text-[7.5pt] text-left">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Unit:</span>
                                                <span className="font-bold text-slate-900 text-right truncate max-w-[42mm]">{deviceName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Pelanggan:</span>
                                                <span className="font-semibold text-slate-800 text-right truncate max-w-[42mm]">{customerName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Keluhan:</span>
                                                <span className="font-medium text-slate-700 text-right truncate max-w-[42mm]">{complaints}</span>
                                            </div>
                                            <div className="flex justify-between text-[6.5pt] font-mono text-slate-500 pt-1 border-t border-slate-100">
                                                <span>Tgl:</span>
                                                <span>{tglMasuk}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>

                    {/* Quick Ticket Copy Pill */}
                    <div className="mt-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs no-print">
                        <span className="text-xs text-slate-500 font-medium">Nomor Tiket:</span>
                        <span className="font-mono font-bold text-xs text-slate-900">{tiket.nomor_tiket}</span>
                        <button
                            type="button"
                            onClick={handleCopyCode}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                            title="Salin Nomor Tiket"
                        >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                </div>

                {/* Modal Footer Actions */}
                <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 no-print shrink-0">
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Unduh stiker dalam format PDF vektor resolusi tinggi"
                        >
                            <FileText className="w-3.5 h-3.5 text-red-600" />
                            <span>Unduh PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPng}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Unduh gambar QR code mentah"
                        >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Unduh QR</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                            Tutup
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                            title="Cetak stiker ke printer thermal label (Spooler OS / Direct)"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak Stiker ({printCount}x)</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
