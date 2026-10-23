import React from "react";
import { X, Printer, ShieldCheck, Check, Award, AlertTriangle, Clock, Laptop, User, Package, Calendar, Wrench, Shield, CheckCircle2 } from "lucide-react";

export default function WarrantyCertificateModal({
    isOpen,
    onClose,
    tiket,
    customer: propCustomer,
    perangkat: propPerangkat,
    invoice: propInvoice
}) {
    if (!isOpen || !tiket) return null;

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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            {/* Inline Print Styles (Landscape Orientation) */}
            <style>{`
                @page {
                    size: landscape;
                    margin: 8mm;
                }
                @media print {
                    body * {
                        visibility: hidden !important;
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
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Control Action Bar (Screen Only - Clean Light Modern Header) */}
                <div className="no-print px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span>Kartu Garansi Digital Resmi</span>
                                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                    #{tiket.nomor_tiket}
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Yangversa Computer &bull; Service & Hardware Protection Pass</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                            title="Cetak atau Simpan PDF"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak / PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="overflow-y-auto p-4 sm:p-7 bg-slate-100/70 custom-scrollbar flex justify-center items-center">
                    <div
                        id="warranty-certificate-document"
                        className="bg-white w-full max-w-[940px] rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden text-slate-800 font-sans"
                    >
                        {/* Top Gradient Stripe */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

                        {/* Subtle Background Watermark */}
                        <div className="absolute right-4 bottom-4 pointer-events-none opacity-[0.03] select-none">
                            <Award className="w-72 h-72 text-blue-900" />
                        </div>

                        <div className="p-5 sm:p-7">
                            {/* Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm tracking-tight shadow-xs shrink-0">
                                        YVS
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                                                Yangversa Computer
                                            </h1>
                                            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline-block">
                                                Pusat Reparasi Laptop & PC
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                            <Shield className="w-3 h-3 text-blue-600" />
                                            <span>Official Warranty & Service Protection Pass</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">No. Tiket</span>
                                        <span className="font-mono font-bold text-xs text-slate-800">
                                            #{tiket.nomor_tiket}
                                        </span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                                {/* Durasi */}
                                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/80">Durasi Garansi</p>
                                        <p className="text-lg font-black text-emerald-950 truncate">{durasi}</p>
                                        <p className="text-[11px] text-emerald-700 font-medium truncate">
                                            {isExpired ? "Telah Berakhir" : tiket.warranty_status?.sisaHari !== undefined ? `Sisa ${tiket.warranty_status.sisaHari} hari lagi` : "Perlindungan Purnajual"}
                                        </p>
                                    </div>
                                </div>

                                {/* Periode */}
                                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800/80">Periode Perlindungan</p>
                                        <p className="text-xs font-bold text-blue-950 truncate mt-0.5">
                                            {tglMulaiFormatted} — {tglBerakhirFormatted}
                                        </p>
                                        <p className="text-[11px] text-blue-700/90 font-medium truncate">
                                            Dihitung sejak unit diserahterimakan
                                        </p>
                                    </div>
                                </div>

                                {/* Layanan */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 border border-slate-300">
                                        <Wrench className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kategori Servis</p>
                                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                            {tiket.kategori_perbaikan || "Servis Hardware / Komponen"}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-medium truncate">
                                            {tiket.diagnosis?.solusi ? tiket.diagnosis.solusi : "Sesuai standar QC Workshop"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Grid: Left (Specs & Parts) vs Right (QR Verification) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 items-stretch">
                                {/* Left Side: Unit & Owner Specs + Covered Parts (7 cols) */}
                                <div className="lg:col-span-8 flex flex-col justify-between gap-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        {/* Unit Info */}
                                        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                                            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-200/60 font-bold text-slate-800 uppercase text-[11px]">
                                                <Laptop className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Data Perangkat</span>
                                            </div>
                                            <div className="space-y-1 text-slate-700">
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-slate-400">Unit:</span>
                                                    <span className="font-bold text-slate-900 truncate text-right">
                                                        {perangkat.merek} {perangkat.model}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-slate-400">Kategori:</span>
                                                    <span className="font-medium text-slate-800">{perangkat.jenis_perangkat || "Laptop"}</span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-slate-400">No. Seri:</span>
                                                    <span className="font-mono text-slate-800">{perangkat.serial_number || "-"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Owner Info */}
                                        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                                            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-200/60 font-bold text-slate-800 uppercase text-[11px]">
                                                <User className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Data Pelanggan</span>
                                            </div>
                                            <div className="space-y-1 text-slate-700">
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-slate-400">Nama:</span>
                                                    <span className="font-bold text-slate-900 truncate text-right">
                                                        {customer.nama}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-slate-400">Kontak:</span>
                                                    <span className="font-mono text-slate-800">{customer.nomor_telepon}</span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-slate-400">Tgl Selesai:</span>
                                                    <span className="font-medium text-slate-800">{tglMulaiFormatted}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Covered Spareparts */}
                                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
                                        <div className="flex items-center gap-1.5 pb-1.5 mb-2 border-b border-slate-200/60 font-bold text-slate-800 uppercase text-[11px]">
                                            <Package className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Komponen / Suku Cadang Terlindungi:</span>
                                        </div>
                                        {spareparts.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {spareparts.map((p, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-800 shadow-2xs"
                                                    >
                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                        <span>{(p.sparepart?.brand?.nama && p.sparepart.brand.nama.toLowerCase() !== "lainnya" ? p.sparepart.brand.nama + " " : "") + (p.sparepart?.nama || p.nama)} ({p.jumlah} unit)</span>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-600 italic">
                                                Perbaikan motherboard / modul komponen tanpa penggantian suku cadang baru (terlindungi jaminan fungsi).
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: QR Code Verification Card (4 cols) */}
                                <div className="lg:col-span-4 bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 flex flex-col items-center justify-center text-center">
                                    <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs mb-2">
                                        <img
                                            src={qrCodeUrl}
                                            alt="QR Verifikasi Tiket"
                                            className="w-24 h-24 object-contain"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    </div>
                                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1 justify-center">
                                        <span>Scan Verifikasi Resmi</span>
                                        <Award className="w-3.5 h-3.5 text-blue-600" />
                                    </p>
                                    <p className="text-[10px] text-slate-500 leading-tight mt-1 max-w-[200px]">
                                        Pindai QR untuk melacak keaslian garansi & status perbaikan secara online.
                                    </p>
                                    <span className="mt-2 text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                        CERT-YVS-{tiket.nomor_tiket}
                                    </span>
                                </div>
                            </div>

                            {/* Bottom Strip: Essential Warranty Terms (No Wall of Text!) */}
                            <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600 font-medium">
                                    <span className="flex items-center gap-1 text-slate-800">
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <strong>Segel Utuh:</strong> Segel workshop wajib tidak sobek/dibongkar.
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-800">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <strong>Bebas Human Error:</strong> Tidak terkena air/jatuh/konslet.
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-800">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <strong>Klaim Mudah:</strong> Cukup tunjukkan kartu ini / nomor tiket.
                                    </span>
                                </div>

                                <div className="text-[11px] font-semibold text-slate-400 shrink-0 sm:text-right">
                                    Yangversa Quality Certified &bull; Service Excellence
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
