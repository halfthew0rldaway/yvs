import React from "react";
import { X, Printer, FileText, CheckCircle2, ShieldCheck, User, MonitorSmartphone, Package, QrCode } from "lucide-react";

export default function BpbsPrintModal({ isOpen, onClose, tiket }) {
    if (!isOpen || !tiket) return null;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=1&data=${encodeURIComponent(
        typeof window !== "undefined"
            ? `${window.location.origin}/tracking?nomor_tiket=${tiket.nomor_tiket}`
            : `https://komputerawet.com/tracking?nomor_tiket=${tiket.nomor_tiket}`
    )}`;

    const tglMasuk = tiket.created_at
        ? new Date(tiket.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
        : "-";

    const customer = tiket.perangkat?.customer;
    const perangkat = tiket.perangkat;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
            {/* Print Stylesheet injection */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-bpbs, #printable-bpbs * {
                        visibility: visible !important;
                    }
                    #printable-bpbs {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 210mm !important;
                        margin: 0 !important;
                        padding: 16px 20px !important;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
                {/* Header Modal Bar */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 shrink-0 no-print">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">Surat Tanda Terima Masuk (BPBS)</h3>
                            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">Bukti Penerimaan Barang Servis resmi untuk pelanggan</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 justify-end">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Cetak BPBS</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="p-4 sm:p-8 overflow-y-auto bg-white text-slate-800" id="printable-bpbs">
                    {/* Kop Surat Toko */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black tracking-tight text-slate-900 font-mono">KOMPUTERAWET.COM</span>
                                <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono">YANGVERSA</span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                                Pusat Reparasi Laptop, PC Desktop & Solusi Hardware Spesialis
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                Motto Layanan: <span className="font-semibold text-blue-700">Transparent · Trusted · WOW</span>
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <span className="text-xs font-extrabold px-3 py-1 bg-slate-900 text-white rounded-lg inline-block uppercase tracking-wider">
                                Tanda Terima Masuk (BPBS)
                            </span>
                            <p className="text-xs font-mono font-bold text-blue-700 mt-1">{tiket.nomor_tiket}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{tglMasuk}</p>
                        </div>
                    </div>

                    {/* Quick Metadata Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200 mt-4 text-xs">
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Paket SLA</span>
                            <span className="font-bold text-slate-800 uppercase">{tiket.sla_paket || "Reguler"}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Prioritas Harapan</span>
                            <span className="font-bold text-slate-800">{tiket.prioritas_pelanggan || "Standar"}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Teknisi PIC</span>
                            <span className="font-bold text-slate-800">{tiket.teknisi?.nama || "Tim Teknisi"}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status Awal</span>
                            <span className="font-bold text-blue-700">Diterima di Toko</span>
                        </div>
                    </div>

                    {/* Grid Identitas Pelanggan & Perangkat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {/* Data Pelanggan */}
                        <div className="border border-slate-200 rounded-xl p-4 bg-white">
                            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                                <User className="w-4 h-4 text-blue-600" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Data Pelanggan</h4>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Nama:</span>
                                    <span className="font-bold text-slate-900">{customer?.nama || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">No. WhatsApp:</span>
                                    <span className="font-mono font-medium text-slate-900">{customer?.nomor_telepon || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Alamat / Wilayah:</span>
                                    <span className="text-slate-700 text-right max-w-[60%] truncate">{customer?.alamat || "-"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Data Perangkat */}
                        <div className="border border-slate-200 rounded-xl p-4 bg-white">
                            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                                <MonitorSmartphone className="w-4 h-4 text-blue-600" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Data Perangkat</h4>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Jenis & Tipe:</span>
                                    <span className="font-bold text-slate-900">{perangkat?.jenis_perangkat || "Laptop"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Merek / Seri:</span>
                                    <span className="font-bold text-slate-900">{perangkat?.merek} {perangkat?.model}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Serial Number:</span>
                                    <span className="font-mono text-slate-700">{perangkat?.serial_number || "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kelengkapan & Kondisi Fisik */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white mt-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <span className="text-slate-500 block uppercase font-semibold text-[10px] mb-1">
                                    Kelengkapan Yang Dititipkan:
                                </span>
                                <p className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                                    {tiket.kelengkapan || "Hanya unit (tanpa charger / aksesori)"}
                                </p>
                            </div>
                            <div>
                                <span className="text-slate-500 block uppercase font-semibold text-[10px] mb-1">
                                    Kondisi Fisik Saat Intake:
                                </span>
                                <p className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                                    {tiket.kondisi_fisik || "Normal / Bersih"}
                                    {tiket.spesifikasi_awal ? ` • ${tiket.spesifikasi_awal}` : ""}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <span className="text-slate-500 block uppercase font-semibold text-[10px] mb-1">
                                Keluhan / Gejala Kerusakan Awal:
                            </span>
                            <p className="text-slate-900 font-medium bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed whitespace-pre-line">
                                {tiket.keluhan}
                            </p>
                        </div>
                    </div>

                    {/* SOP Permission (Bab 9 Privasi & Izin) */}
                    <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-3.5 mt-4 text-xs">
                        <div className="flex items-center gap-2 mb-2 font-bold text-blue-900 text-[11px] uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span>Persetujuan Izin & Jaminan Privasi (SOP Service Excellent Yangversa)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                </span>
                                <span>Izin Bongkar Casing: <strong>{tiket.izin_bongkar ? "Diizinkan" : "Tidak Diizinkan"}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                </span>
                                <span>Izin Cek Windows: <strong>{tiket.izin_akses_os ? "Pengecekan Teknis Saja" : "Tidak Diizinkan"}</strong></span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 italic">
                            * Jaminan Toko: Kami tidak pernah membuka, menyalin, atau mendistribusikan file pribadi/foto pelanggan. Pengecekan OS murni teknis diagnostik.
                        </p>
                    </div>

                    {/* QR Code & Tracking Info */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-dashed border-slate-300 rounded-xl mt-4 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <img
                                src={qrCodeUrl}
                                alt={`QR Tracking ${tiket.nomor_tiket}`}
                                className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0"
                            />
                            <div>
                                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Pantau Status Servis Secara Real-Time</h5>
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                    Scan QR code di samping menggunakan kamera smartphone Anda atau buka:
                                </p>
                                <p className="text-[11px] font-mono font-bold text-blue-700 mt-0.5">
                                    {typeof window !== "undefined" ? window.location.origin : "https://komputerawet.com"}/tracking
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 shrink-0">
                            <span>Estimasi Konfirmasi Penawaran:</span>
                            <span className="block font-bold text-slate-800 text-xs">Maksimal 1 x 24 Jam Kerja</span>
                        </div>
                    </div>

                    {/* Syarat & Ketentuan Workshop */}
                    <div className="mt-4 pt-3 border-t border-slate-200 text-[9.5px] text-slate-500 space-y-1 leading-normal">
                        <p className="font-bold text-slate-700 uppercase">Syarat & Ketentuan Penerimaan Servis:</p>
                        <ol className="list-decimal pl-4 space-y-0.5">
                            <li>Surat Tanda Terima Masuk (BPBS) ini merupakan bukti sah penyerahan barang dan <strong>wajib dibawa saat pengambilan unit</strong>.</li>
                            <li>Tindakan perbaikan dan biaya akan dikonfirmasikan terlebih dahulu ke WhatsApp pelanggan sebelum teknisi mengeksekusi perbaikan.</li>
                            <li>Pelanggan wajib melakukan backup data penting sebelum servis; workshop berupaya optimal menjaga data namun tidak bertanggung jawab atas resiko kehilangan data akibat kerusakan storage/OS bawaan unit.</li>
                            <li>Unit servis yang telah selesai/dibatalkan dan tidak diambil lebih dari 60 (enam puluh) hari kalender sejak tanggal pemberitahuan bukan lagi menjadi tanggung jawab workshop.</li>
                        </ol>
                    </div>

                    {/* Kolom Tanda Tangan */}
                    <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-slate-200 text-center text-xs">
                        <div>
                            <p className="text-slate-500 text-[11px]">Yang Menyerahkan (Pelanggan),</p>
                            <div className="h-16 flex items-end justify-center">
                                <span className="text-[10px] text-slate-300 italic mb-1">[ Tanda Tangan / Paraf ]</span>
                            </div>
                            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[140px]">
                                ( {customer?.nama || "Pelanggan"} )
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[11px]">Petugas Penerima (Frontliner),</p>
                            <div className="h-16 flex items-end justify-center">
                                <span className="text-[10px] text-slate-300 italic mb-1">[ Cap & Paraf Toko ]</span>
                            </div>
                            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[140px]">
                                ( {tiket.teknisi?.nama || "Frontliner Yangversa"} )
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Modal Bar */}
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0 no-print">
                    <span className="text-xs text-slate-500">Format cetak dioptimalkan untuk ukuran kertas A5 atau A4.</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

