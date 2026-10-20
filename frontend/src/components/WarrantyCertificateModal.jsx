import React, { useRef } from "react";
import { X, Printer, ShieldCheck, Check, Award, AlertTriangle, Clock, QrCode } from "lucide-react";

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

    const invoice = propInvoice || tiket.invoice;

    // Tracking & QR Verification URL
    const trackingUrl = typeof window !== "undefined"
        ? `${window.location.origin}/tracking?nomor_tiket=${tiket.nomor_tiket}`
        : `https://yangversacomputer.com/tracking?nomor_tiket=${tiket.nomor_tiket}`;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=2&data=${encodeURIComponent(trackingUrl)}`;

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
        month: "long",
        year: "numeric"
    });

    const tglBerakhirFormatted = garansiBerakhirDate
        ? garansiBerakhirDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
        : "Saat unit diserahterimakan";

    // Spareparts
    const spareparts = tiket.penggunaan_sparepart || [];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            {/* Inline Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #warranty-certificate-document, #warranty-certificate-document * {
                        visibility: visible !important;
                    }
                    #warranty-certificate-document {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 10mm 15mm !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Modal Dialog Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Control Action Bar (Screen Only) */}
                <div className="no-print px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-white">Sertifikat Garansi Digital</h3>
                            <p className="text-xs text-slate-400">Tiket #{tiket.nomor_tiket} &bull; Yangversa Computer Service</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            title="Cetak atau Simpan PDF"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">Cetak / Simpan PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Printable Document Container */}
                <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/60 custom-scrollbar flex justify-center">
                    <div
                        id="warranty-certificate-document"
                        className="bg-white w-full max-w-[760px] p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden text-slate-800 font-sans"
                    >
                        {/* Elegant Watermark Seal */}
                        <div className="absolute right-6 top-24 pointer-events-none opacity-[0.03] select-none">
                            <Award className="w-80 h-80 text-blue-900" />
                        </div>

                        {/* Top Letterhead */}
                        <div className="border-b-2 border-slate-900 pb-4 mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                                            YVS
                                        </div>
                                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                                            Yangversa Computer
                                        </h1>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        Pusat Spesialis Reparasi Laptop, PC Desktop, & Hardware Komputer
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Jl. Babakan Tengah No. 23, Bogor &bull; WhatsApp: 0812-3456-7890 &bull; Website: yangversacomputer.com
                                    </p>
                                </div>

                                <div className="sm:text-right shrink-0">
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">
                                        Nomor Sertifikat
                                    </span>
                                    <span className="text-sm font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md inline-block mt-0.5 border border-slate-200">
                                        CERT-YVS-{tiket.nomor_tiket}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Certificate Title Badge */}
                        <div className="text-center my-6">
                            <span className="px-3.5 py-1 bg-blue-50 text-blue-800 border border-blue-200/80 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                                <Award className="w-3.5 h-3.5 text-blue-600" />
                                Sertifikat Jaminan Garansi Resmi
                            </span>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                Official Warranty & Service Protection
                            </h2>
                            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
                                Dokumen ini menyatakan perlindungan garansi purnajual atas perbaikan teknis dan suku cadang yang telah teruji melalui tahapan Quality Control.
                            </p>
                        </div>

                        {/* Status Garansi Banner */}
                        <div className={`p-4 rounded-xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isExpired 
                                ? "bg-rose-50/70 border-rose-200 text-rose-900"
                                : (isDiambil || isCompleted
                                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                                    : "bg-blue-50/70 border-blue-200 text-blue-900")
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    isExpired 
                                        ? "bg-rose-100 text-rose-700" 
                                        : (isDiambil || isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")
                                }`}>
                                    {isExpired ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            Status Perlindungan:
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            isExpired 
                                                ? "bg-rose-200 text-rose-800" 
                                                : (isDiambil ? "bg-emerald-200 text-emerald-900" : "bg-blue-200 text-blue-900")
                                        }`}>
                                            {isExpired ? "Kedaluwarsa" : (isDiambil ? "Garansi Aktif" : "Garansi Disiapkan")}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold mt-0.5">
                                        {isExpired 
                                            ? `Masa garansi berakhir pada ${tglBerakhirFormatted}.` 
                                            : `Garansi berlaku ${durasi} hingga ${tglBerakhirFormatted}.`}
                                    </p>
                                </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">Durasi Masa Garansi</span>
                                <span className="text-base font-black tracking-tight">{durasi}</span>
                            </div>
                        </div>

                        {/* Info Grid: Customer & Device */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
                            {/* Pelanggan */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 flex items-center justify-between">
                                    <span>Identitas Pemilik</span>
                                    <span className="text-slate-400 font-mono text-[10px]">#TIKET-{tiket.nomor_tiket}</span>
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nama Pelanggan:</span>
                                        <strong className="text-slate-800">{customer.nama}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nomor Kontak:</span>
                                        <span className="font-mono text-slate-700">{customer.nomor_telepon}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tanggal Serah Terima:</span>
                                        <span className="text-slate-700">{tglMulaiFormatted}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Perangkat */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5">
                                    Detail Perangkat
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Kategori / Unit:</span>
                                        <strong className="text-slate-800">{perangkat.jenis_perangkat || "Perangkat"}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Merek & Tipe Model:</span>
                                        <strong className="text-slate-800">{perangkat.merek} {perangkat.model}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nomor Seri (Serial No):</span>
                                        <span className="font-mono text-slate-700">{perangkat.serial_number || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cakupan Garansi / Scope of Coverage */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-6 text-xs">
                            <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-2.5">
                                Cakupan Pekerjaan & Suku Cadang Terlindungi:
                            </p>
                            <div className="space-y-2 text-slate-700">
                                <div className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-slate-900">Jasa Perbaikan & Rekayasa Teknis:</strong>
                                        <p className="text-slate-600 mt-0.5">
                                            {tiket.diagnosis?.solusi || tiket.keluhan || "Servis dan perbaikan sesuai laporan pemeriksaan teknis workshop."}
                                        </p>
                                    </div>
                                </div>

                                {spareparts.length > 0 ? (
                                    <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="text-slate-900">Suku Cadang Baru Terpasang:</strong>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {spareparts.map((p, idx) => (
                                                    <span key={idx} className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-800 shadow-2xs">
                                                        {p.sparepart?.nama || p.nama} ({p.jumlah} unit)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="text-slate-900">Perbaikan Hardware / IC:</strong>
                                            <p className="text-slate-600 mt-0.5">
                                                Perbaikan motherboard / komponen modular tanpa penggantian sparepart baru.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Syarat & Ketentuan Klaim (SOP Workshop) */}
                        <div className="mb-6 text-xs text-slate-600">
                            <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                                Syarat & Ketentuan Klaim Garansi Resmi:
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-600">
                                <li>
                                    <strong className="text-slate-700">Cakupan Masalah:</strong> Garansi berlaku atas kendala fungsi yang sama atau kerusakan pada suku cadang yang diganti dalam perbaikan ini.
                                </li>
                                <li>
                                    <strong className="text-slate-700">Integritas Segel:</strong> Segel garansi resmi Yangversa pada unit harus utuh, tidak sobek, dan tidak pernah dibongkar pihak lain.
                                </li>
                                <li>
                                    <strong className="text-slate-700">Batasan Kelalaian:</strong> Tidak berlaku untuk kerusakan akibat kelalaian pemakaian setelah penyerahan (terkena air, terjatuh, lonjakan listrik, force majeure).
                                </li>
                                <li>
                                    <strong className="text-slate-700">Kemudahan Klaim:</strong> Cukup tunjukkan kartu/sertifikat digital ini atau sebutkan nomor tiket <strong className="text-blue-700 font-mono">#{tiket.nomor_tiket}</strong> kepada customer service kami.
                                </li>
                                <li>
                                    <strong className="text-slate-700">Penanganan Prioritas:</strong> Unit yang masuk dalam periode klaim garansi akan mendapat prioritas pengerjaan utama oleh Teknisi Ahli.
                                </li>
                            </ol>
                        </div>

                        {/* Signatures, Stamp & QR Code */}
                        <div className="pt-4 border-t-2 border-slate-900 flex flex-row items-end justify-between gap-4 text-xs">
                            {/* QR Code Verification */}
                            <div className="flex items-center gap-3">
                                <div className="p-1 bg-white border border-slate-300 rounded-xl shadow-2xs">
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Verifikasi Tiket"
                                        className="w-16 h-16 sm:w-20 sm:h-20"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Scan Verifikasi Digital</p>
                                    <p className="text-slate-500 text-[10px] sm:text-[11px] mt-0.5 max-w-[150px] leading-tight">
                                        Pindai QR ini untuk melacak keaslian dokumen & status garansi real-time.
                                    </p>
                                </div>
                            </div>

                            {/* Customer Signature */}
                            <div className="text-center min-w-[110px] sm:min-w-[130px]">
                                <p className="text-slate-400 text-[11px] mb-10 sm:mb-12">Penerima / Pelanggan</p>
                                <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 text-[11px] sm:text-xs truncate">
                                    {customer.nama}
                                </p>
                            </div>

                            {/* Workshop Stamp & Signature */}
                            <div className="text-center min-w-[120px] sm:min-w-[150px] relative">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none -top-2">
                                    <Award className="w-16 h-16 text-blue-900" />
                                </div>
                                <p className="text-slate-400 text-[11px] mb-10 sm:mb-12">Yangversa Computer</p>
                                <p className="font-bold text-blue-900 border-t border-slate-300 pt-1 text-[11px] sm:text-xs">
                                    Service Excellence
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

