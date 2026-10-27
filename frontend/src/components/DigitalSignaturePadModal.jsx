import { useState, useRef, useEffect, useCallback } from "react";
import { PenTool, RotateCcw, Check, X, ShieldCheck, User } from "lucide-react";

export default function DigitalSignaturePadModal({
    isOpen,
    onClose,
    onSave,
    defaultName = "",
    title = "Tanda Tangan Serah Terima Digital",
    description = "Bubuhkan paraf / tanda tangan Anda di area kanvas bawah ini menggunakan jari atau stylus.",
    agreementText = "Dengan ini saya mengonfirmasi bahwa unit perangkat telah selesai diperbaiki dan diterima kembali dalam kondisi baik sesuai kesepakatan servis.",
    requirePhoneVerify = false,
    expectedPhoneLast4 = "",
    loading = false
}) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [signerName, setSignerName] = useState(defaultName);
    const [phoneLast4, setPhoneLast4] = useState("");
    const [phoneError, setPhoneError] = useState("");

    // Initialize or resize canvas cleanly with device pixel ratio
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Set high-res canvas dimensions
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1d4ed8"; // Royal blue ink
        ctx.lineWidth = 2.5;

        setHasDrawn(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSignerName(defaultName);
            setPhoneLast4("");
            setPhoneError("");
            setHasDrawn(false);
            // Delay slightly to ensure modal is rendered and dimensions are computed
            const timer = setTimeout(() => {
                initCanvas();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, defaultName, initCanvas]);

    // Get pointer coordinates relative to canvas
    function getCoords(e) {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // Drawing Handlers
    function startDrawing(e) {
        if (e.cancelable) e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const { x, y } = getCoords(e);

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasDrawn(true);
    }

    function draw(e) {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const { x, y } = getCoords(e);

        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function stopDrawing() {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.closePath();
        }
        setIsDrawing(false);
    }

    function handleClear() {
        initCanvas();
    }

    function handleConfirm() {
        if (!hasDrawn) {
            alert("Harap bubuhkan tanda tangan di kanvas sebelum menyimpan.");
            return;
        }

        if (requirePhoneVerify) {
            const clean = phoneLast4.replace(/\D/g, "");
            if (clean.length !== 4) {
                setPhoneError("Wajib mengisi 4 digit terakhir nomor telepon untuk verifikasi.");
                return;
            }
            if (expectedPhoneLast4 && !expectedPhoneLast4.endsWith(clean)) {
                setPhoneError("4 digit terakhir nomor telepon tidak cocok.");
                return;
            }
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Export as clean transparent PNG
        const signatureDataUrl = canvas.toDataURL("image/png");

        onSave({
            signature: signatureDataUrl,
            signerName: signerName.trim() || defaultName || "Pelanggan",
            phoneLast4: phoneLast4.trim()
        });
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full flex flex-col overflow-hidden animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                            <PenTool className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 leading-tight">
                                {title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Yangversa Computer • Paperless Handover
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                        {description}
                    </p>

                    {/* Signer Name Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nama Penandatangan (Pelanggan / Perwakilan)
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                placeholder="Masukkan nama penandatangan"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <span>Area Tanda Tangan</span>
                                <span className="text-[10px] text-blue-600 font-semibold">(Tinta Biru Resmi)</span>
                            </span>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Ulangi (Hapus)</span>
                            </button>
                        </div>

                        <div className="relative w-full h-44 sm:h-48 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden touch-none flex items-center justify-center">
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-full cursor-crosshair"
                            />

                            {/* Watermark Guidelines */}
                            {!hasDrawn && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300">
                                    <PenTool className="w-8 h-8 mb-1 stroke-1" />
                                    <span className="text-xs font-medium tracking-wide">
                                        Coret tanda tangan di sini (Layar Sentuh / Mouse)
                                    </span>
                                </div>
                            )}

                            {/* Baseline Guide Line */}
                            <div className="absolute bottom-6 left-8 right-8 border-b border-slate-200 pointer-events-none flex justify-between text-[9px] text-slate-300">
                                <span>✕ Tanda Tangan</span>
                                <span>Baseline</span>
                            </div>
                        </div>
                    </div>

                    {/* Optional 4-Digit Phone Verification for Customer Self-Sign */}
                    {requirePhoneVerify && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Verifikasi 4 Digit Terakhir No. WhatsApp / HP
                            </label>
                            <input
                                type="text"
                                maxLength={4}
                                value={phoneLast4}
                                onChange={(e) => {
                                    setPhoneLast4(e.target.value.replace(/\D/g, ""));
                                    setPhoneError("");
                                }}
                                placeholder="Contoh: 8123"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 tracking-widest outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-center"
                            />
                            {phoneError && (
                                <p className="text-[11px] text-rose-600 mt-1 font-medium">{phoneError}</p>
                            )}
                        </div>
                    )}

                    {/* Disclaimer Agreement */}
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-blue-900 leading-relaxed">
                            {agreementText}
                        </p>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!hasDrawn || loading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 disabled:shadow-none transition-all cursor-pointer"
                    >
                        {loading ? (
                            <span>Menyimpan...</span>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                <span>Konfirmasi & Simpan</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

