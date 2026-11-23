import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
    X, 
    Printer, 
    Download, 
    QrCode, 
    Tag, 
    ShieldCheck, 
    Building2, 
    Check, 
    Copy,
    FileText,
    Boxes
} from "lucide-react";
import QRCode from "qrcode";
import { DocumentPrintService } from "../services/documentPrintService";
import { isNativePlatform } from "../services/nativeServices";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

export const SPAREPART_LABEL_SIZES = [
    {
        id: "50x30",
        label: "50 x 30 mm",
        tag: "Mini Thermal",
        desc: "Label mini untuk kemasan kecil / sparepart satuan",
        widthMm: 50,
        heightMm: 30,
        pageCssSize: "50mm 30mm",
        orientation: "landscape"
    },
    {
        id: "60x40",
        label: "60 x 40 mm",
        tag: "Kompak",
        desc: "Ukuran standar stiker suku cadang",
        widthMm: 60,
        heightMm: 40,
        pageCssSize: "60mm 40mm",
        orientation: "landscape"
    },
    {
        id: "80x50",
        label: "80 x 50 mm",
        tag: "Standar Dus",
        desc: "Ideal untuk dus box / kemasan suku cadang",
        widthMm: 80,
        heightMm: 50,
        pageCssSize: "80mm 50mm",
        orientation: "landscape"
    },
    {
        id: "rack",
        label: "100 x 75 mm",
        tag: "Rak Gudang",
        desc: "Label rak / bin suku cadang huruf besar",
        widthMm: 100,
        heightMm: 75,
        pageCssSize: "100mm 75mm",
        orientation: "landscape"
    }
];

export default function SparepartQrModal({ isOpen, onClose, sparepart }) {
    if (!isOpen || !sparepart) return null;

    const [labelFormat, setLabelFormat] = useState("80x50");
    const [printCount, setPrintCount] = useState(1);
    const [qrDataType, setQrDataType] = useState("url"); // Default to "url" so scanning with ANY phone camera opens ERP directly
    const [copiedSku, setCopiedSku] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState("");

    const selectedSize = useMemo(() => {
        return SPAREPART_LABEL_SIZES.find(s => s.id === labelFormat) || SPAREPART_LABEL_SIZES[2];
    }, [labelFormat]);

    const skuCode = sparepart.kode_sku || sparepart.kode || `SP-${String(sparepart.id).padStart(4, "0")}`;
    const brandPrefix = sparepart.brand?.nama && sparepart.brand.nama.toLowerCase() !== "lainnya" 
        ? `${sparepart.brand.nama} ` 
        : "";
    const fullName = `${brandPrefix}${sparepart.nama}`;

    const searchUrl = typeof window !== "undefined"
        ? `${window.location.origin}/sparepart?search=${encodeURIComponent(skuCode)}`
        : `https://komputerawet.com/sparepart?search=${encodeURIComponent(skuCode)}`;

    const qrData = qrDataType === "sku" ? skuCode : searchUrl;

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
                if (active) {
                    setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&data=${encodeURIComponent(qrData)}`);
                }
            });

        return () => { active = false; };
    }, [qrData]);

    const handlePrint = () => {
        DocumentPrintService.printOrShareDocument("printable-sparepart-area", {
            filename: `Label-Sparepart-${skuCode}-${selectedSize.id}.pdf`,
            title: `Label Suku Cadang ${skuCode} - Yangversa Computer`,
            text: `Label barcode suku cadang ${fullName} dari Workshop Yangversa Computer.`,
            preferDirectPrint: !isNativePlatform(),
            widthMm: selectedSize.widthMm,
            heightMm: selectedSize.heightMm
        });
    };

    const handleDownloadPdf = () => {
        DocumentPrintService.downloadPdf("printable-sparepart-area", `Label-Sparepart-${skuCode}-${selectedSize.id}.pdf`, {
            widthMm: selectedSize.widthMm,
            heightMm: selectedSize.heightMm,
            fitContentHeight: false
        });
    };

    const handleDownloadPng = () => {
        if (!qrDataUrl) return;
        const link = document.createElement("a");
        link.href = qrDataUrl;
        link.download = `QR-${skuCode}-${sparepart.nama.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleCopySku = () => {
        navigator.clipboard.writeText(skuCode);
        setCopiedSku(true);
        setTimeout(() => setCopiedSku(false), 2000);
    };

    // Warranty Label helper
    const getWarrantyLabel = () => {
        if (!sparepart.has_garansi_distri && !sparepart.tipe_garansi_distri) {
            return "Garansi Toko";
        }
        const durasi = sparepart.tipe_garansi_distri || "Resmi";
        if (sparepart.sistem_perhitungan_garansi === "lifetime") {
            return "Garansi Lifetime Distri";
        }
        if (sparepart.sistem_perhitungan_garansi === "sejak_segel_distri") {
            return `Garansi Distri ${durasi} (Segel)`;
        }
        return `Garansi Distri ${durasi} (Nota)`;
    };

    const distriName = sparepart.distributor_nama || sparepart.supplier?.nama || "-";

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
                    .qr-modal-dialog {
                        display: contents !important;
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
                    #printable-sparepart-area {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        gap: 0 !important;
                        background: #ffffff !important;
                    }
                    .sparepart-print-item {
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
                    .sparepart-print-item:last-child {
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
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-100">
                                    {skuCode}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500 font-medium">Stiker Label Inventaris Suku Cadang</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight truncate max-w-sm mt-0.5">
                                {fullName}
                            </h3>
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

                {/* Toolbar 1: Pilihan Ukuran Label */}
                <div className="px-4 sm:px-5 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-col gap-2 no-print shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                            Pilih Format & Ukuran Label:
                        </span>
                        <span className="text-3xs text-slate-400 italic font-mono hidden sm:inline">
                            Ukuran aktif: {selectedSize.label} ({selectedSize.tag})
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SPAREPART_LABEL_SIZES.map((size) => {
                            const isSelected = labelFormat === size.id;
                            return (
                                <button
                                    key={size.id}
                                    type="button"
                                    onClick={() => setLabelFormat(size.id)}
                                    className={`px-3 py-1.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
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

                {/* Toolbar 2: Tujuan Scan & Qty Cetak */}
                <div className="px-4 sm:px-5 py-2 bg-white border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2.5 text-xs no-print shrink-0">
                    {/* Tujuan QR */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-2xs text-slate-500 font-semibold">Isi QR:</span>
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                            <button
                                type="button"
                                onClick={() => setQrDataType("url")}
                                className={`px-2 py-0.5 rounded text-2xs font-bold transition-all cursor-pointer ${
                                    qrDataType === "url" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="Buka master sparepart langsung di ERP saat discan kamera HP"
                            >
                                Link ERP Langsung
                            </button>
                            <button
                                type="button"
                                onClick={() => setQrDataType("sku")}
                                className={`px-2 py-0.5 rounded text-2xs font-bold transition-all cursor-pointer ${
                                    qrDataType === "sku" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="QR hanya berisi teks kode SKU"
                            >
                                Teks SKU
                            </button>
                        </div>
                    </div>

                    {/* Qty Cetak */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xs text-slate-500 font-semibold">Qty Cetak:</span>
                        <div className="flex items-center gap-1">
                            {[1, 2, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setPrintCount(num)}
                                    className={`px-2 py-0.5 rounded-lg text-2xs font-mono font-bold transition-all border cursor-pointer ${
                                        printCount === num
                                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {num}x
                                </button>
                            ))}
                            {sparepart.stok > 0 && sparepart.stok !== 1 && sparepart.stok !== 2 && sparepart.stok !== 5 && (
                                <button
                                    type="button"
                                    onClick={() => setPrintCount(sparepart.stok)}
                                    className={`px-2 py-0.5 rounded-lg text-3xs font-bold transition-all border cursor-pointer ${
                                        printCount === sparepart.stok
                                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                    title={`Cetak sesuai jumlah stok fisik (${sparepart.stok} unit)`}
                                >
                                    Stok ({sparepart.stok}x)
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Body / Live Preview Label */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex flex-col items-center justify-center custom-scrollbar qr-preview-body">
                    
                    <div id="printable-sparepart-area" className="w-full flex flex-col items-center gap-4">
                        {Array.from({ length: printCount }).map((_, index) => (
                            <div key={index} className="sparepart-print-item w-full flex justify-center">
                                
                                {/* ========================================================
                                    SIZE 1: 50 x 30 mm (Mini Thermal)
                                   ======================================================== */}
                                {selectedSize.id === "50x30" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-lg p-2 text-slate-900 flex items-center justify-between gap-2 overflow-hidden shadow-sm"
                                        style={{ width: "50mm", height: "30mm", boxSizing: "border-box" }}
                                    >
                                        <div className="w-[22mm] h-[22mm] shrink-0 flex items-center justify-center">
                                            {qrDataUrl && (
                                                <img 
                                                    src={qrDataUrl} 
                                                    alt={`QR ${skuCode}`} 
                                                    className="w-full h-full object-contain"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                                            <div>
                                                <span className="font-mono font-black text-[8pt] text-slate-900 leading-tight block truncate">
                                                    {skuCode}
                                                </span>
                                                <p className="font-bold text-[6.5pt] text-slate-900 leading-tight truncate mt-0.5">
                                                    {fullName}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="font-mono font-extrabold text-[8pt] text-blue-700 block leading-tight">
                                                    {formatRupiah(sparepart.harga)}
                                                </span>
                                                <span className="text-[5.5pt] text-emerald-700 font-semibold truncate block">
                                                    {getWarrantyLabel()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================
                                    SIZE 2: 60 x 40 mm (Kompak)
                                   ======================================================== */}
                                {selectedSize.id === "60x40" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-xl p-2.5 text-slate-900 flex flex-col justify-between overflow-hidden shadow-sm"
                                        style={{ width: "60mm", height: "40mm", boxSizing: "border-box" }}
                                    >
                                        <div className="flex items-center justify-between pb-1 border-b border-dashed border-slate-300">
                                            <span className="font-mono font-black text-[8pt] text-slate-900">{skuCode}</span>
                                            <span className="text-[6pt] font-bold text-slate-500 uppercase">{sparepart.kategori}</span>
                                        </div>

                                        <div className="flex items-center gap-2 py-1">
                                            <div className="w-[20mm] h-[20mm] shrink-0">
                                                {qrDataUrl && (
                                                    <img 
                                                        src={qrDataUrl} 
                                                        alt={`QR ${skuCode}`} 
                                                        className="w-full h-full object-contain"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                <h5 className="font-bold text-[7.5pt] text-slate-900 leading-tight truncate">
                                                    {fullName}
                                                </h5>
                                                <p className="font-mono font-extrabold text-[9pt] text-blue-700 leading-tight">
                                                    {formatRupiah(sparepart.harga)}
                                                </p>
                                                <p className="text-[6pt] text-emerald-700 font-semibold truncate">
                                                    {getWarrantyLabel()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-0.5 border-t border-dashed border-slate-200 flex items-center justify-between text-[5.5pt] text-slate-500 font-mono">
                                            <span>Scan untuk stok / info</span>
                                            <span>Stok: {sparepart.stok} unit</span>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================
                                    SIZE 3: 80 x 50 mm (Standar Kemasan / Dus)
                                   ======================================================== */}
                                {selectedSize.id === "80x50" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-2xl p-3 text-slate-900 flex flex-col justify-between overflow-hidden shadow-sm"
                                        style={{ width: "80mm", height: "50mm", boxSizing: "border-box" }}
                                    >
                                        {/* Header Toko */}
                                        <div className="flex items-center justify-between pb-1.5 border-b-2 border-dashed border-slate-300">
                                            <div className="flex items-center gap-2">
                                                <img src="/logo-yangversa.png" alt="YVS" className="w-5 h-5 object-contain shrink-0" />
                                                <div>
                                                    <h4 className="font-extrabold text-[8pt] uppercase tracking-wider text-slate-900 leading-tight">
                                                        YVS COMPUTER
                                                    </h4>
                                                    <p className="text-[6pt] text-slate-500 font-medium">Workshop & Komponen Laptop</p>
                                                </div>
                                            </div>
                                            <div className="px-2 py-0.5 bg-slate-900 text-white rounded-lg font-mono font-extrabold text-[8pt] tracking-wider shrink-0">
                                                {skuCode}
                                            </div>
                                        </div>

                                        {/* Content Grid */}
                                        <div className="flex items-center gap-3 py-1">
                                            <div className="w-[25mm] h-[25mm] shrink-0 p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                                                {qrDataUrl && (
                                                    <img 
                                                        src={qrDataUrl} 
                                                        alt={`QR ${skuCode}`} 
                                                        className="w-full h-full object-contain"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-0.5 text-[7pt]">
                                                <span className="inline-block px-1.5 py-0.2 rounded text-[5.5pt] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                                    {sparepart.kategori}
                                                </span>
                                                <h5 className="font-black text-[8.5pt] text-slate-900 leading-tight truncate">
                                                    {fullName}
                                                </h5>
                                                <div className="pt-0.5">
                                                    <span className="font-mono font-black text-[10pt] text-blue-700 leading-none">
                                                        {formatRupiah(sparepart.harga)}
                                                    </span>
                                                </div>
                                                <div className="text-[6pt] text-slate-600 flex items-center justify-between pt-0.5 border-t border-slate-100">
                                                    <span className="font-semibold text-emerald-700 truncate">{getWarrantyLabel()}</span>
                                                    <span className="text-slate-400 font-mono truncate">{distriName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-1 border-t-2 border-dashed border-slate-300 flex items-center justify-between text-[6pt] text-slate-500 font-mono">
                                            <span>Scan QR cek stok & spek</span>
                                            <span className="font-bold">Stok: {sparepart.stok} unit</span>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================
                                    SIZE 4: 100 x 75 mm (Rak Gudang / Bin Label)
                                   ======================================================== */}
                                {selectedSize.id === "rack" && (
                                    <div 
                                        className="bg-white border-2 border-slate-900 rounded-2xl p-4 text-slate-900 flex flex-col justify-between overflow-hidden shadow-sm"
                                        style={{ width: "100mm", height: "75mm", boxSizing: "border-box" }}
                                    >
                                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                                                LOKASI RAK SUKU CADANG GUDANG
                                            </span>
                                            <span className="px-3 py-1 bg-slate-900 text-white font-mono font-black text-sm rounded-lg">
                                                {skuCode}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 my-2">
                                            <div className="w-[32mm] h-[32mm] p-1.5 border border-slate-200 rounded-xl shrink-0 flex items-center justify-center">
                                                {qrDataUrl && (
                                                    <img 
                                                        src={qrDataUrl} 
                                                        alt={`QR ${skuCode}`} 
                                                        className="w-full h-full object-contain"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-3xs font-bold text-slate-500 uppercase">{sparepart.kategori}</span>
                                                <h4 className="font-black text-base text-slate-900 leading-snug line-clamp-2 mt-0.5">
                                                    {fullName}
                                                </h4>
                                                <p className="text-2xs text-slate-600 mt-1 font-mono">
                                                    Mitra: <span className="font-semibold">{distriName}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="text-3xs text-slate-400 font-bold uppercase block">Harga Eceran / Servis</span>
                                                <span className="font-mono font-black text-base text-blue-700">{formatRupiah(sparepart.harga)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-3xs text-slate-400 font-bold uppercase block">Kapasitas Stok</span>
                                                <span className="font-mono font-black text-sm text-slate-900">{sparepart.stok} unit</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>

                    {/* Quick SKU Copy Pill */}
                    <div className="mt-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs no-print">
                        <span className="text-xs text-slate-500 font-medium">Kode SKU:</span>
                        <span className="font-mono font-bold text-xs text-slate-900">{skuCode}</span>
                        <button
                            type="button"
                            onClick={handleCopySku}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                            title="Salin SKU"
                        >
                            {copiedSku ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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
                            title="Unduh file gambar QR mentah"
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
