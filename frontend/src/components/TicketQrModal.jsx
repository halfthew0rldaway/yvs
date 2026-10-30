import React, { useRef } from "react";
import { X, Printer, Download, QrCode, MonitorSmartphone, User, Calendar, AlertCircle } from "lucide-react";

export default function TicketQrModal({ isOpen, onClose, tiket }) {
    if (!isOpen || !tiket) return null;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=2&data=${encodeURIComponent(tiket.nomor_tiket)}`;

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
            link.download = `QR-${tiket.nomor_tiket}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Gagal mendownload QR Code:", err);
            window.open(qrCodeUrl, "_blank");
        }
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* 60fps Hardware-Accelerated Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs modal-backdrop no-print" 
                onClick={onClose} 
            />

            {/* Print Stylesheet injection */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-ticket-label, #printable-ticket-label * {
                        visibility: visible !important;
                    }
                    #printable-ticket-label {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100mm !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 12px !important;
                        box-shadow: none !important;
                        border: 1.5px solid #000 !important;
                        background: #fff !important;
                        color: #000 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 modal-surface z-10">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">Label & QR Code Tiket</h3>
                            <p className="text-xs text-slate-500 font-mono">{tiket.nomor_tiket}</p>
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

                {/* Modal Body / Printable Label */}
                <div className="p-6 overflow-y-auto flex flex-col items-center">
                    <div
                        id="printable-ticket-label"
                        className="w-full bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm text-slate-900 flex flex-col items-center"
                    >
                        {/* Shop Header */}
                        <div className="text-center pb-3 border-b-2 border-dashed border-slate-300 w-full">
                            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                                Yangversa Service (YVS)
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">Spesialis Servis Laptop & Gadget</p>
                            <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white rounded-lg font-mono font-extrabold text-base tracking-widest">
                                {tiket.nomor_tiket}
                            </div>
                        </div>

                        {/* QR Code Container */}
                        <div className="my-4 p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center">
                            <img
                                src={qrCodeUrl}
                                alt={`QR Code ${tiket.nomor_tiket}`}
                                className="w-48 h-48 object-contain"
                            />
                            <span className="text-[10px] font-mono font-semibold text-slate-400 mt-1">
                                SCAN UNTUK KLAIM / TRACKING
                            </span>
                        </div>

                        {/* Ticket Meta Details */}
                        <div className="w-full space-y-2 text-xs border-t-2 border-dashed border-slate-300 pt-3">
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
                                    <MonitorSmartphone className="w-3.5 h-3.5" /> Unit:
                                </span>
                                <span className="font-bold text-slate-900 text-right">
                                    {tiket.perangkat?.merek} {tiket.perangkat?.model}
                                </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                                <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" /> Pelanggan:
                                </span>
                                <span className="font-semibold text-slate-800 text-right">
                                    {tiket.perangkat?.customer?.nama || "-"}
                                </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                                <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> Keluhan:
                                </span>
                                <span className="font-medium text-slate-700 text-right line-clamp-2 max-w-[220px]">
                                    {tiket.keluhan || "-"}
                                </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                                <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Tgl Masuk:
                                </span>
                                <span className="font-mono text-slate-600 text-[11px] text-right">
                                    {tglMasuk}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 text-center w-full">
                            <p className="text-[10px] text-slate-400 font-medium">
                                Tempel label stiker ini pada unit perangkat pelanggan
                            </p>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh QR (PNG)</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                            Tutup
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Stiker Unit</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

