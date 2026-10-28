import React, { useState } from "react";
import { 
    X, 
    Printer, 
    Download, 
    QrCode, 
    Wrench, 
    Tag, 
    ShieldCheck, 
    Building2, 
    Layers, 
    Boxes,
    Check,
    Copy,
    ExternalLink
} from "lucide-react";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

export default function SparepartQrModal({ isOpen, onClose, sparepart }) {
    if (!isOpen || !sparepart) return null;

    const [labelFormat, setLabelFormat] = useState("standard"); // "standard" (Box/Kemasan) | "compact" (Thermal 50x30mm) | "rack" (Label Rak Gudang)
    const [printCount, setPrintCount] = useState(1);
    const [qrDataType, setQrDataType] = useState("sku"); // "sku" | "url"
    const [copiedSku, setCopiedSku] = useState(false);

    const skuCode = `SP-${String(sparepart.id).padStart(4, "0")}`;
    const brandPrefix = sparepart.brand?.nama && sparepart.brand.nama.toLowerCase() !== "lainnya" 
        ? `${sparepart.brand.nama} ` 
        : "";
    const fullName = `${brandPrefix}${sparepart.nama}`;

    const searchUrl = typeof window !== "undefined"
        ? `${window.location.origin}/sparepart?search=${encodeURIComponent(sparepart.nama)}`
        : `https://servio.app/sparepart?search=${encodeURIComponent(sparepart.nama)}`;

    const qrData = qrDataType === "url" ? searchUrl : skuCode;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=2&data=${encodeURIComponent(qrData)}`;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadQr = async () => {
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `QR-${skuCode}-${sparepart.nama.replace(/\s+/g, "_")}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            window.open(qrCodeUrl, "_blank");
        }
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
            {/* Print Stylesheet injection */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-sparepart-area, #printable-sparepart-area * {
                        visibility: visible !important;
                    }
                    #printable-sparepart-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: #fff !important;
                    }
                    .sparepart-print-item {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        display: block !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
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
                                <span className="text-xs text-slate-500 font-medium">Stiker Label Inventaris</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight truncate max-w-sm mt-0.5">
                                {fullName}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar Pengaturan Cetak */}
                <div className="px-6 py-3 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    
                    {/* Format Switcher */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setLabelFormat("standard")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                                labelFormat === "standard"
                                    ? "bg-blue-600 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            Box / Dus
                        </button>
                        <button
                            type="button"
                            onClick={() => setLabelFormat("compact")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                                labelFormat === "compact"
                                    ? "bg-blue-600 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            Mini Thermal
                        </button>
                        <button
                            type="button"
                            onClick={() => setLabelFormat("rack")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                                labelFormat === "rack"
                                    ? "bg-blue-600 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            Rak Gudang
                        </button>
                    </div>

                    {/* QR Code Payload Option */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-semibold">Isi QR:</span>
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
                            <button
                                type="button"
                                onClick={() => setQrDataType("sku")}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                                    qrDataType === "sku" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="QR berisi kode SKU untuk barcode scanner"
                            >
                                SKU Code
                            </button>
                            <button
                                type="button"
                                onClick={() => setQrDataType("url")}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                                    qrDataType === "url" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="QR membuka halaman servis & pencarian part saat discan kamera HP"
                            >
                                Link Serv.io
                            </button>
                        </div>
                    </div>

                    {/* Qty Print Multiplier */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-semibold">Qty Cetak:</span>
                        <div className="flex items-center gap-1">
                            {[1, 2, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setPrintCount(num)}
                                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                                        printCount === num
                                            ? "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300"
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
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                        printCount === sparepart.stok
                                            ? "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                    title={`Cetak sesuai jumlah stok fisik (${sparepart.stok} unit)`}
                                >
                                    Semua ({sparepart.stok}x)
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                {/* Modal Body / Live Preview Label */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60 flex flex-col items-center justify-center">
                    
                    {/* The Printable Container */}
                    <div id="printable-sparepart-area" className="w-full flex flex-col items-center gap-4">
                        {Array.from({ length: printCount }).map((_, index) => (
                            <div key={index} className="sparepart-print-item w-full flex justify-center">
                                
                                {/* FORMAT 1: STANDARD (Box / Dus Kemasan) */}
                                {labelFormat === "standard" && (
                                    <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm text-slate-900 flex flex-col">
                                        
                                        {/* Header Toko */}
                                        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-slate-300">
                                            <div>
                                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                                                    YANGVERSA SERVICE / KOMPUTERAWET
                                                </h4>
                                                <p className="text-[10px] text-slate-500 font-medium">Workshop & Pusat Komponen Laptop</p>
                                            </div>
                                            <div className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-mono font-extrabold text-xs tracking-wider shrink-0">
                                                {skuCode}
                                            </div>
                                        </div>

                                        {/* Content Grid: QR Left + Specs Right */}
                                        <div className="grid grid-cols-12 gap-4 py-3.5 items-center">
                                            {/* QR Code */}
                                            <div className="col-span-5 flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-xl">
                                                <img
                                                    src={qrCodeUrl}
                                                    alt={`QR ${skuCode}`}
                                                    className="w-28 h-28 object-contain"
                                                />
                                                <span className="text-[9px] font-mono font-bold text-slate-500 mt-1">
                                                    {skuCode}
                                                </span>
                                            </div>

                                            {/* Info Suku Cadang */}
                                            <div className="col-span-7 space-y-1.5 min-w-0">
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                                    {sparepart.kategori}
                                                </span>
                                                
                                                <h5 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                                                    {fullName}
                                                </h5>

                                                <div className="pt-1">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Harga Jual / Servis</span>
                                                    <span className="font-mono font-extrabold text-base text-blue-700">
                                                        {formatRupiah(sparepart.harga)}
                                                    </span>
                                                </div>

                                                <div className="text-[10px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                                                    <p className="flex items-center gap-1 truncate">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                                        <span className="font-semibold text-slate-800">{getWarrantyLabel()}</span>
                                                    </p>
                                                    <p className="flex items-center gap-1 text-slate-500 truncate">
                                                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">{distriName}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Barcode / Instruction */}
                                        <div className="pt-2 border-t-2 border-dashed border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                                            <span>Scan QR untuk cek stok / spesifikasi</span>
                                            <span className="font-mono">Stok: {sparepart.stok} unit</span>
                                        </div>

                                    </div>
                                )}

                                {/* FORMAT 2: MINI THERMAL (50mm x 30mm) */}
                                {labelFormat === "compact" && (
                                    <div className="w-72 bg-white border-2 border-slate-900 rounded-xl p-3 shadow-sm text-slate-900 flex items-center gap-3">
                                        <div className="shrink-0 p-1 bg-white border border-slate-200 rounded-lg">
                                            <img
                                                src={qrCodeUrl}
                                                alt={`QR ${skuCode}`}
                                                className="w-16 h-16 object-contain"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-extrabold text-xs text-slate-900">{skuCode}</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase">{sparepart.kategori}</span>
                                            </div>
                                            <p className="font-bold text-xs text-slate-900 leading-tight truncate">
                                                {fullName}
                                            </p>
                                            <p className="font-mono font-extrabold text-sm text-blue-700">
                                                {formatRupiah(sparepart.harga)}
                                            </p>
                                            <p className="text-[9.5px] text-emerald-700 font-semibold truncate">
                                                {getWarrantyLabel()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* FORMAT 3: RAK GUDANG / BIN LABEL */}
                                {labelFormat === "rack" && (
                                    <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-sm text-slate-900 flex flex-col">
                                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                                                LOKASI RAK SUKU CADANG
                                            </span>
                                            <span className="px-3 py-1 bg-slate-900 text-white font-mono font-black text-sm rounded-lg">
                                                {skuCode}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-5 my-4">
                                            <img
                                                src={qrCodeUrl}
                                                alt={`QR ${skuCode}`}
                                                className="w-24 h-24 object-contain border border-slate-200 p-1.5 rounded-xl shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-slate-500 uppercase">{sparepart.kategori}</p>
                                                <h4 className="font-black text-lg text-slate-900 leading-tight mt-0.5">
                                                    {fullName}
                                                </h4>
                                                <p className="text-xs text-slate-600 mt-1 font-mono">
                                                    Mitra: <span className="font-semibold">{distriName}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Harga Eceran / Servis</span>
                                                <span className="font-mono font-extrabold text-lg text-blue-700">{formatRupiah(sparepart.harga)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Kapasitas Stok</span>
                                                <span className="font-mono font-bold text-slate-800">{sparepart.stok} unit</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>

                    {/* Quick SKU Copy Pill */}
                    <div className="mt-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
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
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh File QR (PNG)</span>
                    </button>

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
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak Stiker Label ({printCount}x)</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

