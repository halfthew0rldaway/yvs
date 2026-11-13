import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, QrCode, X } from "lucide-react";
import toast from "react-hot-toast";
import AppConfig from "../services/config";

export default function CustomerRegistrationInviteModal({ isOpen, onClose, onSubmitted }) {
    const [qr, setQr] = useState("");
    const [error, setError] = useState("");
    const publicOrigin = AppConfig.isNative ? AppConfig.assetBaseUrl : window.location.origin;
    const link = `${publicOrigin.replace(/\/$/, "")}/tracking/register`;

    useEffect(() => {
        if (!isOpen) { setQr(""); setError(""); }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        QRCode.toDataURL(link, { width: 320, margin: 2, errorCorrectionLevel: "M" })
            .then(setQr).catch(() => setError("QR tidak dapat ditampilkan. Gunakan tautan di bawah."));
    }, [isOpen, link]);

    async function copyLink() {
        try { await navigator.clipboard.writeText(link); toast.success("Tautan disalin"); }
        catch { toast.error("Gagal menyalin tautan"); }
    }

    if (!isOpen) return null;
    return <div className="modal-shell z-[100] bg-slate-900/60 backdrop-blur-xs">
        <div className="modal-panel max-w-md">
            <div className="modal-grabber" />
            <div className="modal-header flex shrink-0 items-center justify-between gap-3">
                <div className="flex items-center gap-2"><QrCode size={20} className="text-blue-600" /><h2 className="text-base font-bold text-slate-900">QR Form Pelanggan</h2></div>
                <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X size={19} /></button>
            </div>
            <div className="modal-body flex-1 overflow-y-auto p-5 text-center custom-scrollbar">
                <p className="mb-4 text-sm text-slate-600">QR ini tetap sama. Unduh, cetak, lalu tempel di depan agar setiap pelanggan bisa mengisi data sebelum menyerahkan perangkat.</p>
                {qr && <img src={qr} alt="QR formulir pelanggan" className="mx-auto w-64 max-w-full rounded-xl border border-slate-200" />}
                <p className="mt-3 break-all text-xs text-slate-500">{link}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {qr && <a href={qr} download="yangversa-form-pelanggan-qr.png" className="btn-primary inline-flex items-center gap-1.5"><Download size={15} /> Unduh QR</a>}
                    <button type="button" onClick={copyLink} className="btn-secondary inline-flex items-center gap-1.5"><Copy size={15} /> Salin tautan</button>
                    <a href={link} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-1.5"><ExternalLink size={15} /> Buka formulir</a>
                </div>
                {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            </div>
            <div className="modal-footer flex shrink-0 justify-end"><button type="button" onClick={() => { onSubmitted?.(); onClose(); }} className="btn-secondary">Selesai</button></div>
        </div>
    </div>;
}
