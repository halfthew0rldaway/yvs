import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer, ShieldCheck, Check, Award, AlertTriangle, Clock, Laptop, User, Package, Calendar, Wrench, Shield, CheckCircle2 } from "lucide-react";
import { WorkshopSignatureStamp, DigitalSignatureToggleBar } from "./DigitalSignatureStamp";
import { DEFAULT_WORKSHOP_SIGNATURE } from "./AdminSignatureSelectorModal";

export default function WarrantyCertificateModal({
    isOpen,
    onClose,
    tiket,
    customer: propCustomer,
    perangkat: propPerangkat,
    invoice: propInvoice,
    isCustomerView = false
}) {
    if (!isOpen || !tiket) return null;

    // Detect if rendered in customer tracking portal (auto-hide internal admin toggles)
    const isPublicTracking = isCustomerView || (typeof window !== "undefined" && window.location.pathname.startsWith("/tracking"));

    // Resolve customer info
    const customer = propCustomer || tiket.perangkat?.customer || {
        nama: tiket.customer_nama || "Pelanggan",
        nomor_telepon: tiket.customer_telepon || "-"
    };

    // Resolve device info
    const perangkat = propPerangkat || tiket.perangkat || {
        jenis_perangkat: tiket.jenis_perangkat || "Perangkat",
        merek: tiket.merek || (tiket.perangkat?.split(" ")[0] || ""),
        model: tiket.model || (tiket.perangkat?.split(" ").slice(1).join(" ") || ""),
        serial_number: tiket.serial_number || "-"
    };

    // Resolve invoice info
    const effectiveInvoice = propInvoice || tiket.invoice || {};

    // Tracking & QR Verification URL
    const trackingUrl = typeof window !== "undefined"
        ? `${window.location.origin}/tracking?nomor_tiket=${tiket.nomor_tiket}`
        : `https://yangversacomputer.com/tracking?nomor_tiket=${tiket.nomor_tiket}`;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=1&data=${encodeURIComponent(trackingUrl)}`;

    // Dates & Status
    const isDiambil = tiket.status === "diambil";
    const isCompleted = tiket.status === "selesai" || isDiambil;
    const durasi = tiket.durasi_garansi || "1 Bulan";

    const tglMulai = tiket.tgl_diambil 
        ? new Date(tiket.tgl_diambil) 
        : (tiket.completed_at ? new Date(tiket.completed_at) : (tiket.created_at ? new Date(tiket.created_at) : new Date()));

    const garansiBerakhirDate = tiket.warranty_status?.garansi_berakhir_at 
        ? new Date(tiket.warranty_status.garansi_berakhir_at)
        : (tiket.garansi_berakhir_at ? new Date(tiket.garansi_berakhir_at) : null);

    const isExpired = tiket.warranty_status?.isExpired || (garansiBerakhirDate && garansiBerakhirDate < new Date());

    const tglMulaiFormatted = tglMulai.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    const tglBerakhirFormatted = garansiBerakhirDate
        ? garansiBerakhirDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "Saat serah terima unit";

    // Spareparts
    const spareparts = tiket.penggunaan_sparepart || [];

    // Digital Signature Toggle State (Synced with localStorage)
    const [isDigitalSignature, setIsDigitalSignature] = useState(() => {
        try {
            const saved = localStorage.getItem("yvs_invoice_digital_signature");
            return saved !== null ? saved === "true" : true;
        } catch {
            return true;
        }
    });

    // In customer tracking view, always enforce verified official digital signature & stamp
    const effectiveIsDigital = isPublicTracking ? true : isDigitalSignature;

    const toggleDigitalSignature = () => {
        setIsDigitalSignature((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("yvs_invoice_digital_signature", String(next));
            } catch {}
            return next;
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const modalContent = (
        <div className="modal-shell z-[999] bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
            {/* Inline Print Styles (Landscape Orientation) */}
            <style>{`
                @page {
                    size: landscape;
                    margin: 8mm;
                }
                @media print {
                    #root, #root * {
                        display: none !important;
                        height: 0 !important;
                        overflow: hidden !important;
                    }
                    html, body {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #warranty-certificate-document, #warranty-certificate-document * {
                        visibility: visible !important;
                    }
                    #warranty-certificate-document {
                        position: fixed !important;
                        left: 50% !important;
                        top: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        width: 270mm !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 7mm 9mm !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        border-radius: 14px !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Modal Dialog Card (Landscape Max-Width) */}
            <div className="modal-panel max-w-5xl z-10 print:max-h-none print:rounded-none print:border-none print:shadow-none">
                <div className="modal-grabber no-print" />
                {/* Control Action Bar (Screen Only - Clean Light Modern Header) */}
                <div className="no-print px-3 sm:px-6 py-3 sm:py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2.5 bg-emerald-100 text-emerald-700 rounded-lg sm:rounded-xl border border-emerald-200 shrink-0">
                            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-xs xs:text-sm sm:text-base flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                                <span className="break-words">Kartu Garansi Digital Resmi</span>
                                <span className="text-3xs sm:text-2xs font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                    #{tiket.nomor_tiket}
                                </span>
                            </h3>
                            <p className="text-3xs xs:text-2xs sm:text-xs text-slate-500 mt-0.5 truncate">Yangversa Computer &bull; Service & Hardware Protection</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end w-full sm:w-auto">
                        {!isPublicTracking && (
                            <DigitalSignatureToggleBar
                                isDigital={isDigitalSignature}
                                onToggle={toggleDigitalSignature}
                            />
                        )}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg sm:rounded-xl text-3xs xs:text-2xs sm:text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                            title="Cetak atau Simpan PDF"
                        >
                            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="whitespace-nowrap">Cetak / PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg sm:rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Area with Smooth Mobile Touch Scroll */}
                <div className="overflow-x-auto overflow-y-auto p-1.5 xs:p-2 sm:p-6 bg-slate-100/70 custom-scrollbar flex justify-start lg:justify-center items-start overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                    <div
                        id="warranty-certificate-document"
                        className="bg-white min-w-[640px] xs:min-w-[700px] lg:min-w-0 w-full max-w-[940px] rounded-lg sm:rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden text-slate-800 font-sans shrink-0 my-auto"
                    >
                        {/* Top Gradient Stripe */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

                        {/* Subtle Background Watermark */}
                        <div className="absolute right-4 bottom-4 pointer-events-none opacity-[0.03] select-none">
                            <Award className="w-72 h-72 text-blue-900" />
                        </div>

                        <div className="p-4 sm:p-7">
                            {/* Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs sm:text-sm tracking-tight shadow-xs shrink-0">
                                        YVS
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            <h1 className="text-sm xs:text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                                                Yangversa Computer
                                            </h1>
                                            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-3xs xs:text-2xs font-semibold text-slate-500 hidden sm:inline-block">
                                                Pusat Reparasi Laptop & PC
                                            </span>
                                        </div>
                                        <p className="text-3xs xs:text-2xs text-blue-700 font-bold uppercase tracking-wide sm:tracking-wider flex items-center gap-1.5 mt-0.5">
                                            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                                            <span className="break-words">Official Warranty & Service Protection Pass</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                                    <div className="text-left sm:text-right">
                                        <span className="text-3xs font-bold text-slate-400 uppercase tracking-widest block">No. Tiket</span>
                                        <span className="font-mono font-bold text-3xs xs:text-2xs sm:text-xs text-slate-800">
                                            #{tiket.nomor_tiket}
                                        </span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-3xs xs:text-2xs sm:text-xs font-bold border shrink-0 ${
                                        isExpired 
                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                            : (isDiambil || isCompleted
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-blue-50 text-blue-700 border-blue-200")
                                    }`}>
                                        {isExpired ? (
                                            <>
                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                                <span>Kedaluwarsa</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>{isDiambil ? "Garansi Aktif" : "Garansi Disiapkan"}</span>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Hero 3-Stat Metric Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-5">
                                {/* Durasi */}
                                <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-3xs font-bold uppercase tracking-wider text-emerald-800/80">Durasi Garansi</p>
                                        <p className="text-sm xs:text-base sm:text-lg font-black text-emerald-950 truncate">{durasi}</p>
                                        <p className="text-3xs xs:text-2xs text-emerald-700 font-medium truncate">
                                            {isExpired ? "Telah Berakhir" : tiket.warranty_status?.sisaHari !== undefined ? `Sisa ${tiket.warranty_status.sisaHari} hari lagi` : "Perlindungan Purnajual"}
                                        </p>
                                    </div>
                                </div>

                                {/* Periode */}
                                <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-3xs font-bold uppercase tracking-wider text-blue-800/80">Periode Perlindungan</p>
                                        <p className="text-3xs xs:text-2xs sm:text-xs font-bold text-blue-950 truncate mt-0.5">
                                            {tglMulaiFormatted} — {tglBerakhirFormatted}
                                        </p>
                                        <p className="text-3xs xs:text-2xs text-blue-700/90 font-medium truncate">
                                            Dihitung sejak unit diserahterimakan
                                        </p>
                                    </div>
                                </div>

                                {/* Layanan */}
                                <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 border border-slate-300">
                                        <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-3xs font-bold uppercase tracking-wider text-slate-500">Kategori Servis</p>
                                        <p className="text-3xs xs:text-2xs sm:text-xs font-bold text-slate-900 truncate mt-0.5">
                                            {tiket.kategori_perbaikan || "Servis Hardware / Komponen"}
                                        </p>
                                        <p className="text-3xs xs:text-2xs text-slate-500 font-medium truncate">
                                            {tiket.diagnosis?.solusi ? tiket.diagnosis.solusi : "Sesuai standar QC Workshop"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Grid: Left (Specs & Parts) vs Right (QR Verification) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-4 mb-3 sm:mb-4 items-stretch">
                                {/* Left Side: Unit & Owner Specs + Covered Parts (7 cols) */}
                                <div className="lg:col-span-8 flex flex-col justify-between gap-2.5 sm:gap-3 min-w-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-3xs xs:text-2xs sm:text-xs">
                                        {/* Unit Info */}
                                        <div className="p-2.5 sm:p-3.5 bg-slate-50/70 rounded-lg sm:rounded-xl border border-slate-200/80 min-w-0">
                                            <div className="flex items-center gap-1.5 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 border-b border-slate-200/60 font-bold text-slate-800 uppercase text-3xs sm:text-2xs">
                                                <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                                                <span>Data Perangkat</span>
                                            </div>
                                            <div className="space-y-1 text-slate-700">
                                                <div className="flex justify-between gap-2 min-w-0">
                                                    <span className="text-slate-400 shrink-0">Unit:</span>
                                                    <span className="font-bold text-slate-900 truncate text-right min-w-0">
                                                        {perangkat.merek} {perangkat.model}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-2 min-w-0">
                                                    <span className="text-slate-400 shrink-0">Kategori:</span>
                                                    <span className="font-medium text-slate-800 truncate text-right min-w-0">{perangkat.jenis_perangkat || "Laptop"}</span>
                                                </div>
                                                <div className="flex justify-between gap-2 min-w-0">
                                                    <span className="text-slate-400 shrink-0">No. Seri:</span>
                                                    <span className="font-mono text-slate-800 truncate text-right min-w-0">{perangkat.serial_number || "-"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Owner Info */}
                                        <div className="p-2.5 sm:p-3.5 bg-slate-50/70 rounded-lg sm:rounded-xl border border-slate-200/80 min-w-0">
                                            <div className="flex items-center gap-1.5 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 border-b border-slate-200/60 font-bold text-slate-800 uppercase text-3xs sm:text-2xs">
                                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                                                <span>Data Pelanggan</span>
                                            </div>
                                            <div className="space-y-1 text-slate-700">
                                                <div className="flex justify-between gap-2 min-w-0">
                                                    <span className="text-slate-400 shrink-0">Nama:</span>
                                                    <span className="font-bold text-slate-900 truncate text-right min-w-0">
                                                        {customer.nama}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-2 min-w-0">
                                                    <span className="text-slate-400 shrink-0">Kontak:</span>
                                                    <span className="font-mono text-slate-800 truncate text-right min-w-0">{customer.nomor_telepon}</span>
                                                </div>
                                                <div className="flex justify-between gap-2 min-w-0">
                                                    <span className="text-slate-400 shrink-0">Tgl Selesai:</span>
                                                    <span className="font-medium text-slate-800 truncate text-right min-w-0">{tglMulaiFormatted}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Covered Spareparts */}
                                    <div className="p-2.5 sm:p-3 bg-slate-50/70 rounded-lg sm:rounded-xl border border-slate-200/80 text-3xs xs:text-2xs sm:text-xs min-w-0">
                                        <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 sm:mb-2 border-b border-slate-200/60 font-bold text-slate-800 uppercase text-3xs sm:text-2xs">
                                            <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
                                            <span className="break-words">Komponen / Suku Cadang Terlindungi:</span>
                                        </div>
                                        {spareparts.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {spareparts.map((p, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg text-3xs xs:text-2xs font-semibold text-slate-800 shadow-2xs max-w-full"
                                                    >
                                                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                                        <span className="break-words">{(p.sparepart?.brand?.nama && p.sparepart.brand.nama.toLowerCase() !== "lainnya" ? p.sparepart.brand.nama + " " : "") + (p.sparepart?.nama || p.nama)} ({p.jumlah} unit)</span>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-3xs xs:text-2xs text-slate-600 italic">
                                                Perbaikan motherboard / modul komponen tanpa penggantian suku cadang baru (terlindungi jaminan fungsi).
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: QR Code Verification Card & Workshop Signature (4 cols) */}
                                <div className="lg:col-span-4 bg-slate-50/80 rounded-lg sm:rounded-xl border border-slate-200/80 p-2.5 sm:p-4 flex flex-col items-center justify-between text-center min-w-0">
                                    <div className="flex flex-col items-center w-full">
                                        <div className="p-1.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-2xs mb-1.5">
                                            <img
                                                src={qrCodeUrl}
                                                alt="QR Verifikasi Tiket"
                                                className="w-16 h-16 xs:w-20 xs:h-20 print:w-16 print:h-16 object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = "none";
                                                }}
                                            />
                                        </div>
                                        <p className="font-bold text-slate-900 text-3xs xs:text-2xs sm:text-xs flex flex-wrap items-center gap-1 justify-center">
                                            <span>Scan Verifikasi Resmi</span>
                                            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                                        </p>
                                        <span className="mt-1 text-4xs font-mono font-bold text-slate-500 bg-white px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 break-all">
                                            CERT-YVS-{tiket.nomor_tiket}
                                        </span>
                                    </div>

                                    {/* Workshop & Customer Signatures (Zero Buttons, Symmetrically Aligned) */}
                                    <div className="w-full pt-2 sm:pt-2.5 mt-2 sm:mt-2.5 border-t border-slate-200/80 flex items-end justify-center gap-4 sm:gap-8">
                                        {/* Penerima Garansi */}
                                        <div className="flex flex-col items-center justify-end text-center w-24 xs:w-28 print:w-24">
                                            <p className="text-slate-500 text-4xs print:text-[7.5px] font-medium mb-0.5">
                                                Penerima Garansi
                                            </p>
                                            <div className="h-12 xs:h-14 print:h-11 w-full flex items-center justify-center">
                                                {effectiveIsDigital && (effectiveInvoice.ttd_customer || tiket.invoice?.ttd_customer) ? (
                                                    <img 
                                                        src={effectiveInvoice.ttd_customer || tiket.invoice?.ttd_customer} 
                                                        alt="TTD Pelanggan" 
                                                        className="max-h-12 print:max-h-10 max-w-[90px] print:max-w-[75px] object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-4xs print:text-[7px] text-slate-300 print:text-slate-200 italic select-none">
                                                        {effectiveIsDigital ? "[ Belum TTD ]" : "[ TTD Fisik ]"}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-full border-b border-slate-300 my-0.5"></div>
                                            <p className="font-bold text-slate-900 text-4xs print:text-[8px] w-full truncate max-w-[105px]">
                                                {effectiveInvoice.ttd_customer_nama || tiket.invoice?.ttd_customer_nama || customer.nama || "Pelanggan"}
                                            </p>
                                            <p className="text-4xs print:text-[6.5px] text-slate-400">
                                                Pelanggan
                                            </p>
                                        </div>

                                        {/* Petugas Workshop */}
                                        <div className="flex flex-col items-center justify-end text-center w-24 xs:w-28 print:w-24">
                                            <p className="text-slate-500 text-4xs print:text-[7.5px] font-medium mb-0.5">
                                                Petugas Workshop
                                            </p>
                                            <div className="h-12 xs:h-14 print:h-11 w-full flex items-center justify-center">
                                                {effectiveIsDigital ? (
                                                    <img 
                                                        src={effectiveInvoice.ttd_admin || tiket.invoice?.ttd_admin || DEFAULT_WORKSHOP_SIGNATURE} 
                                                        alt="TTD Petugas" 
                                                        className="max-h-12 print:max-h-10 max-w-[90px] print:max-w-[75px] object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-4xs print:text-[7px] text-slate-300 print:text-slate-200 italic select-none">
                                                        [ TTD Petugas ]
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-full border-b border-slate-300 my-0.5"></div>
                                            <p className="font-bold text-slate-900 text-4xs print:text-[8px] w-full truncate max-w-[105px]">
                                                {effectiveInvoice.ttd_admin_nama || tiket.invoice?.ttd_admin_nama || "Yangversa Computer"}
                                            </p>
                                            <p className="text-4xs print:text-[6.5px] text-slate-400">
                                                Yangversa Computer
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Strip: Essential Warranty Terms (No Wall of Text!) */}
                            <div className="p-2.5 sm:p-3 bg-slate-50/90 rounded-lg sm:rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-3xs xs:text-2xs sm:text-xs">
                                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-x-4 sm:gap-y-1.5 text-3xs xs:text-2xs text-slate-600 font-medium min-w-0">
                                    <span className="flex items-start gap-1 text-slate-800">
                                        <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                                        <span className="break-words"><strong>Segel Utuh:</strong> Segel workshop wajib tidak sobek/dibongkar.</span>
                                    </span>
                                    <span className="flex items-start gap-1 text-slate-800">
                                        <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                                        <span className="break-words"><strong>Bebas Human Error:</strong> Tidak terkena air/jatuh/konslet.</span>
                                    </span>
                                    <span className="flex items-start gap-1 text-slate-800">
                                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                                        <span className="break-words"><strong>Klaim Mudah:</strong> Cukup tunjukkan kartu ini / nomor tiket.</span>
                                    </span>
                                </div>

                                <div className="text-3xs xs:text-2xs font-semibold text-slate-400 shrink-0 sm:text-right">
                                    Yangversa Quality Certified &bull; Service Excellence
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
