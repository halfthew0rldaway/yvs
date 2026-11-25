import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import {
    X,
    Printer,
    ShieldCheck,
    Check,
    AlertTriangle,
    Laptop,
    User,
    Package,
    Calendar,
    Wrench,
    CheckCircle2,
    Download,
    Share2,
} from "lucide-react";
import { DigitalSignatureToggleBar } from "./DigitalSignatureStamp";
import { DEFAULT_WORKSHOP_SIGNATURE } from "./AdminSignatureSelectorModal";
import { DocumentPrintService } from "../services/documentPrintService";
import { isNativePlatform } from "../services/nativeServices";

export default function WarrantyCertificateModal({
    isOpen,
    onClose,
    tiket,
    customer: propCustomer,
    perangkat: propPerangkat,
    invoice: propInvoice,
    isCustomerView = false,
}) {
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [isDigitalSignature, setIsDigitalSignature] = useState(() => {
        try {
            const saved = localStorage.getItem("yvs_invoice_digital_signature");
            return saved !== null ? saved === "true" : true;
        } catch {
            return true;
        }
    });

    const nomorTiket = tiket?.nomor_tiket || "";
    const trackingUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/tracking?nomor_tiket=${nomorTiket}`
            : `https://yangversacomputer.com/tracking?nomor_tiket=${nomorTiket}`;

    // Generate crisp offline-safe local QR data URL (prevents CORS tainting on PDF export)
    useEffect(() => {
        if (!isOpen || !nomorTiket) return;
        let active = true;
        QRCode.toDataURL(trackingUrl, {
            width: 240,
            margin: 1,
            color: { dark: "#0f172a", light: "#ffffff" },
            errorCorrectionLevel: "M",
        })
            .then((url) => {
                if (active) setQrDataUrl(url);
            })
            .catch(() => {
                if (active) setQrDataUrl("");
            });
        return () => {
            active = false;
        };
    }, [isOpen, nomorTiket, trackingUrl]);

    if (!isOpen || !tiket) return null;

    const isPublicTracking =
        isCustomerView ||
        (typeof window !== "undefined" && window.location.pathname.startsWith("/tracking"));

    // Resolve customer info safely across both authenticated ERP and public tracking payloads
    const rawPerangkatObj =
        typeof tiket.perangkat === "object" && tiket.perangkat !== null ? tiket.perangkat : null;
    const perangkatString = typeof tiket.perangkat === "string" ? tiket.perangkat.trim() : "";

    const customer = propCustomer || rawPerangkatObj?.customer || {
        nama: tiket.customer_nama || "Pelanggan",
        nomor_telepon: tiket.customer_telepon || "-",
    };

    const resolvedPerangkat = propPerangkat || rawPerangkatObj || {
        jenis_perangkat: tiket.jenis_perangkat || "Perangkat",
        merek: tiket.merek || "",
        model: tiket.model || "",
        serial_number: tiket.serial_number || "-",
    };

    const unitLabel =
        `${resolvedPerangkat.merek || ""} ${resolvedPerangkat.model || ""}`.trim() ||
        perangkatString ||
        tiket.device_name ||
        "-";
    const categoryLabel = resolvedPerangkat.jenis_perangkat || tiket.jenis_perangkat || "Laptop";
    const serialLabel =
        resolvedPerangkat.serial_number && String(resolvedPerangkat.serial_number).trim()
            ? resolvedPerangkat.serial_number
            : "-";

    const effectiveInvoice = propInvoice || tiket.invoice || {};
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

    // Dates & Warranty Status (strict null/NaN guards so "Sisa null hari lagi" can never appear)
    const isDiambil = tiket.status === "diambil";
    const isCompleted = tiket.status === "selesai" || isDiambil;
    const durasi = tiket.durasi_garansi || "1 Bulan";

    const tglMulaiRaw = tiket.tgl_diambil || tiket.completed_at || tiket.created_at;
    const tglMulai = tglMulaiRaw ? new Date(tglMulaiRaw) : new Date();

    const garansiBerakhirRaw =
        tiket.warranty_status?.garansi_berakhir_at || tiket.garansi_berakhir_at || null;
    const garansiBerakhirDate = garansiBerakhirRaw ? new Date(garansiBerakhirRaw) : null;
    const hasValidEnd = garansiBerakhirDate && !Number.isNaN(garansiBerakhirDate.getTime());

    const isExpired = Boolean(
        tiket.warranty_status?.isExpired || (hasValidEnd && garansiBerakhirDate < new Date())
    );

    const rawSisaHari = tiket.warranty_status?.sisaHari;
    const sisaHari =
        rawSisaHari !== null && rawSisaHari !== undefined && Number.isFinite(Number(rawSisaHari))
            ? Number(rawSisaHari)
            : hasValidEnd
            ? Math.max(0, Math.ceil((garansiBerakhirDate.getTime() - Date.now()) / 86400000))
            : null;

    const remainingSubtitle = isExpired
        ? "Masa garansi telah berakhir"
        : sisaHari !== null
        ? sisaHari > 0
            ? `Tersisa ${sisaHari} hari lagi`
            : "Berakhir hari ini"
        : isDiambil
        ? "Perlindungan purnajual aktif"
        : "Aktif saat unit diambil";

    const tglMulaiFormatted = tglMulai.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const tglBerakhirFormatted = hasValidEnd
        ? garansiBerakhirDate.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "Dihitung saat pengambilan";

    const spareparts = Array.isArray(tiket.penggunaan_sparepart) ? tiket.penggunaan_sparepart : [];

    const customerSignName =
        effectiveInvoice.ttd_customer_nama ||
        tiket.invoice?.ttd_customer_nama ||
        customer.nama ||
        "Pelanggan";
    const adminSignName =
        effectiveInvoice.ttd_admin_nama ||
        tiket.invoice?.ttd_admin_nama ||
        "Yangversa Computer";
    const showAdminSublabel = !String(adminSignName).toLowerCase().includes("yangversa");

    const handlePrint = () => {
        DocumentPrintService.printOrShareDocument("warranty-certificate-document", {
            filename: `Kartu-Garansi-${nomorTiket || "YVS"}.pdf`,
            title: `Kartu Garansi Resmi #${nomorTiket}`,
            text: `Kartu garansi resmi perbaikan YVS Computer untuk tiket #${nomorTiket}.`,
            preferDirectPrint: !isNativePlatform(),
        });
    };

    const handleDownloadPdf = () => {
        DocumentPrintService.downloadPdf(
            "warranty-certificate-document",
            `Kartu-Garansi-${nomorTiket || "YVS"}.pdf`
        );
    };

    const modalContent = (
        <div className="modal-shell z-[999] bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
            {/* Inline Print Styles (Landscape A4 / Half-A4 Clean Output) */}
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
                        width: 268mm !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        border-radius: 12px !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="modal-panel max-w-5xl z-10 print:max-h-none print:rounded-none print:border-none print:shadow-none">
                <div className="modal-grabber no-print" />

                {/* Modal Control Header */}
                <div className="no-print modal-header bg-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display font-bold text-slate-950 text-sm sm:text-base leading-tight">
                                    Kartu Garansi Resmi
                                </h3>
                                <span className="font-mono text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                    #{nomorTiket}
                                </span>
                            </div>
                            <p className="text-2xs sm:text-xs text-slate-500 mt-0.5 truncate">
                                YVS Computer · Pekayon, Bekasi
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                        {!isPublicTracking && (
                            <DigitalSignatureToggleBar
                                isDigital={isDigitalSignature}
                                onToggle={toggleDigitalSignature}
                            />
                        )}
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                            title="Unduh file PDF"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Unduh PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                            title={isNativePlatform() ? "Cetak atau bagikan kartu garansi" : "Cetak kartu garansi"}
                        >
                            {isNativePlatform() ? (
                                <>
                                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>Bagikan</span>
                                </>
                            ) : (
                                <>
                                    <Printer className="w-3.5 h-3.5 shrink-0" />
                                    <span>Cetak</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Tutup kartu garansi"
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Document Viewport */}
                <div className="overflow-y-auto p-3 sm:p-6 bg-slate-100/80 custom-scrollbar flex justify-center">
                    <div
                        id="warranty-certificate-document"
                        className="w-full max-w-[920px] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-slate-800 font-sans"
                    >
                        {/* Clean Brand Accent Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500" />

                        <div className="p-4 sm:p-7 space-y-5">
                            {/* Document Masthead */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                                <div className="flex items-center gap-3 min-w-0">
                                    <img
                                        src="/logo-yangversa.png"
                                        alt="YVS Computer"
                                        className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-1 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h1 className="font-display text-base sm:text-lg font-extrabold text-slate-950 tracking-tight leading-tight">
                                            YANGVERSA COMPUTER
                                        </h1>
                                        <p className="text-2xs sm:text-xs text-slate-500 font-medium mt-0.5">
                                            Kartu Garansi Resmi Perbaikan · Pekayon, Bekasi
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                    <div className="sm:text-right">
                                        <span className="text-2xs font-semibold text-slate-400 block">Nomor Servis</span>
                                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                                            #{nomorTiket}
                                        </span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 ${
                                            isExpired
                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : isDiambil
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : isCompleted
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : "bg-slate-100 text-slate-700 border-slate-200"
                                        }`}
                                    >
                                        {isExpired ? (
                                            <>
                                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                <span>Berakhir</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                <span>{isDiambil ? "Garansi Aktif" : "Siap Aktif"}</span>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* 3-Column Balanced Summary Strip (No awkward truncation) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-white text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-2xs font-bold uppercase tracking-wider text-emerald-800/80">
                                            Masa Garansi
                                        </p>
                                        <p className="font-display text-base sm:text-lg font-extrabold text-emerald-950 leading-snug">
                                            {durasi}
                                        </p>
                                        <p className="text-2xs text-emerald-700 font-medium mt-0.5 leading-snug">
                                            {remainingSubtitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-white text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-2xs font-bold uppercase tracking-wider text-blue-800/80">
                                            Periode Berlaku
                                        </p>
                                        <p className="text-xs sm:text-[13px] font-bold text-slate-900 mt-0.5 leading-snug">
                                            {hasValidEnd
                                                ? `${tglMulaiFormatted} – ${tglBerakhirFormatted}`
                                                : `Mulai ${tglMulaiFormatted}`}
                                        </p>
                                        <p className="text-2xs text-blue-700/90 font-medium mt-0.5 leading-snug">
                                            {hasValidEnd
                                                ? "Berlaku sejak tanggal serah terima"
                                                : "Masa berlaku dihitung saat unit diambil"}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-white text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                        <Wrench className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                                            Penanganan
                                        </p>
                                        <p className="text-xs sm:text-[13px] font-bold text-slate-900 mt-0.5 leading-snug">
                                            {tiket.kategori_perbaikan || "Perbaikan Perangkat & Komponen"}
                                        </p>
                                        <p className="text-2xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                                            {tiket.diagnosis?.solusi || "Telah melewati uji kualitas 25 titik workshop"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Balanced Middle Grid: Left Specs + Covered Parts (8 cols) | Right Verification + Signatures (4 cols) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                                {/* Left Column: Zero dangling gap — Covered Parts expands cleanly to match right height */}
                                <div className="lg:col-span-8 flex flex-col gap-3.5 min-w-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                                        {/* Data Perangkat */}
                                        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5 min-w-0">
                                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/70 font-bold text-slate-800 text-2xs uppercase tracking-wider">
                                                <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                <span>Data Perangkat</span>
                                            </div>
                                            <dl className="space-y-1.5">
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <dt className="text-slate-500 shrink-0">Unit</dt>
                                                    <dd className="font-bold text-slate-950 text-right break-words min-w-0">
                                                        {unitLabel}
                                                    </dd>
                                                </div>
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <dt className="text-slate-500 shrink-0">Kategori</dt>
                                                    <dd className="font-medium text-slate-800 text-right">{categoryLabel}</dd>
                                                </div>
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <dt className="text-slate-500 shrink-0">No. Seri</dt>
                                                    <dd className="font-mono text-slate-800 text-right truncate">{serialLabel}</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        {/* Data Pelanggan */}
                                        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5 min-w-0">
                                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/70 font-bold text-slate-800 text-2xs uppercase tracking-wider">
                                                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Data Pelanggan</span>
                                            </div>
                                            <dl className="space-y-1.5">
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <dt className="text-slate-500 shrink-0">Nama</dt>
                                                    <dd className="font-bold text-slate-950 text-right truncate min-w-0">
                                                        {customer.nama}
                                                    </dd>
                                                </div>
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <dt className="text-slate-500 shrink-0">Kontak</dt>
                                                    <dd className="font-mono text-slate-800 text-right truncate">
                                                        {customer.nomor_telepon}
                                                    </dd>
                                                </div>
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <dt className="text-slate-500 shrink-0">Tgl Selesai</dt>
                                                    <dd className="font-medium text-slate-800 text-right">
                                                        {tglMulaiFormatted}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>

                                    {/* Komponen / Suku Cadang Terlindungi (flex-1 fills exact remaining height cleanly) */}
                                    <div className="flex-1 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between gap-3 min-w-0">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                                                <span className="flex items-center gap-1.5 font-bold text-slate-800 text-2xs uppercase tracking-wider">
                                                    <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    <span>Komponen &amp; Suku Cadang Terlindungi</span>
                                                </span>
                                                {spareparts.length > 0 && (
                                                    <span className="font-mono text-2xs text-slate-500">
                                                        {spareparts.length} item
                                                    </span>
                                                )}
                                            </div>

                                            {spareparts.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {spareparts.map((p, idx) => {
                                                        const brandName =
                                                            p.sparepart?.brand?.nama &&
                                                            p.sparepart.brand.nama.toLowerCase() !== "lainnya"
                                                                ? `${p.sparepart.brand.nama} `
                                                                : "";
                                                        return (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800"
                                                            >
                                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                <span>
                                                                    {brandName}
                                                                    {p.sparepart?.nama || p.nama} ({p.jumlah} unit)
                                                                </span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    Perbaikan papan utama / modul komponen tanpa penggantian suku cadang baru, terlindungi jaminan fungsi sesuai keluhan awal.
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-2xs text-slate-500 pt-2 border-t border-slate-200/60">
                                            Cukup tunjukkan nomor servis <strong>#{nomorTiket}</strong> atau pindai QR di samping saat mengajukan klaim garansi di workshop Pekayon.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Offline-Safe QR Verification + Signatures */}
                                <div className="lg:col-span-4 bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 flex flex-col items-center justify-between gap-4 text-center min-w-0">
                                    <div className="flex flex-col items-center">
                                        <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-2xs mb-2">
                                            {qrDataUrl ? (
                                                <img
                                                    src={qrDataUrl}
                                                    alt={`QR Verifikasi ${nomorTiket}`}
                                                    className="w-24 h-24 object-contain block"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 bg-slate-100 rounded flex items-center justify-center text-2xs text-slate-400">
                                                    QR
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-bold text-slate-900 text-xs">
                                            Verifikasi Keaslian Garansi
                                        </p>
                                        <span className="mt-1 font-mono text-2xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 break-all">
                                            CERT-YVS-{nomorTiket}
                                        </span>
                                    </div>

                                    {/* Symmetrical Signatures */}
                                    <div className="w-full pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-3 items-end">
                                        <div className="flex flex-col items-center text-center min-w-0">
                                            <span className="text-2xs text-slate-500 font-medium">Penerima</span>
                                            <div className="h-12 w-full flex items-center justify-center my-1">
                                                {effectiveIsDigital &&
                                                (effectiveInvoice.ttd_customer || tiket.invoice?.ttd_customer) ? (
                                                    <img
                                                        src={effectiveInvoice.ttd_customer || tiket.invoice?.ttd_customer}
                                                        alt="Tanda tangan pelanggan"
                                                        className="max-h-11 max-w-full object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-2xs text-slate-400 italic select-none">
                                                        {effectiveIsDigital ? "Belum TTD" : "TTD Fisik"}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-full border-b border-slate-300 mb-1" />
                                            <span className="font-bold text-slate-900 text-2xs truncate w-full">
                                                {customerSignName}
                                            </span>
                                            <span className="text-3xs text-slate-400">Pelanggan</span>
                                        </div>

                                        <div className="flex flex-col items-center text-center min-w-0">
                                            <span className="text-2xs text-slate-500 font-medium">Workshop</span>
                                            <div className="h-12 w-full flex items-center justify-center my-1">
                                                {effectiveIsDigital ? (
                                                    <img
                                                        src={
                                                            effectiveInvoice.ttd_admin ||
                                                            tiket.invoice?.ttd_admin ||
                                                            DEFAULT_WORKSHOP_SIGNATURE
                                                        }
                                                        alt="Tanda tangan petugas YVS"
                                                        className="max-h-11 max-w-full object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-2xs text-slate-400 italic select-none">
                                                        TTD Petugas
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-full border-b border-slate-300 mb-1" />
                                            <span className="font-bold text-slate-900 text-2xs truncate w-full">
                                                {adminSignName}
                                            </span>
                                            <span className="text-3xs text-slate-400">
                                                {showAdminSublabel ? "YVS Computer" : "Petugas Resmi"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Clean 3-Column Balanced Warranty Terms Footer */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 text-2xs sm:text-xs text-slate-600">
                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="text-slate-900">Segel utuh:</strong> Segel garansi workshop tidak robek atau dibongkar pihak lain.
                                    </span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="text-slate-900">Pemakaian wajar:</strong> Tidak berlaku untuk kerusakan akibat cairan, jatuh, atau korsleting listrik luar.
                                    </span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="text-slate-900">Klaim praktis:</strong> Bawa unit dan sebutkan nomor servis tanpa wajib membawa kertas fisik.
                                    </span>
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
