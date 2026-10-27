import { useState, useRef, useEffect, useCallback } from "react";
import { PenTool, Undo2, Trash2, Check, X, ShieldCheck, User, BookmarkPlus } from "lucide-react";

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
    showSaveProfile = false,
    defaultSaveProfile = false,
    loading = false
}) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [signerName, setSignerName] = useState(defaultName);
    const [phoneLast4, setPhoneLast4] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [strokeHistory, setStrokeHistory] = useState([]);
    const [saveProfile, setSaveProfile] = useState(defaultSaveProfile);

    // Initialize or clear canvas cleanly with device pixel ratio
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
        ctx.lineWidth = 2.8;

        setHasDrawn(false);
        setStrokeHistory([]);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSignerName(defaultName);
            setPhoneLast4("");
            setPhoneError("");
            setHasDrawn(false);
            setStrokeHistory([]);
            setSaveProfile(defaultSaveProfile);
            const timer = setTimeout(() => {
                initCanvas();
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isOpen, defaultName, defaultSaveProfile, initCanvas]);

    // Get pointer coordinates relative to canvas bounding box
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

        // Save current snapshot to stroke history for Undo
        try {
            const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setStrokeHistory(prev => [...prev.slice(-25), snapshot]);
        } catch (err) {
            console.error("Gagal menyimpan snapshot kanvas:", err);
        }

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

    // Undo the last stroke
    function handleUndo() {
        if (strokeHistory.length === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const previousHistory = [...strokeHistory];
        const lastSnapshot = previousHistory.pop();

        if (lastSnapshot) {
            ctx.putImageData(lastSnapshot, 0, 0);
        }

        setStrokeHistory(previousHistory);
        if (previousHistory.length === 0) {
            setHasDrawn(false);
        }
    }

    // Clear whole canvas
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

        // Export clean transparent PNG
        const signatureDataUrl = canvas.toDataURL("image/png");

        onSave({
            signature: signatureDataUrl,
            signerName: signerName.trim() || defaultName || "Petugas / Pelanggan",
            phoneLast4: phoneLast4.trim(),
            saveProfile
        });
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl sm:max-w-3xl w-full flex flex-col overflow-hidden my-auto animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                            <PenTool className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                                {title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Yangversa Computer • Paperless Digital Signature
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
                <div className="p-4 sm:p-6 space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                        {description}
                    </p>

                    {/* Signer Name Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nama Penandatangan
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                placeholder="Masukkan nama penandatangan"
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                    </div>

                    {/* Canvas Area with Undo & Clear Controls */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <span>Area Tanda Tangan</span>
                                <span className="text-[10px] text-blue-600 font-semibold">(Tinta Biru Resmi)</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={strokeHistory.length === 0}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                    title="Urungkan goresan terakhir"
                                >
                                    <Undo2 className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Undo ({strokeHistory.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    disabled={!hasDrawn && strokeHistory.length === 0}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                    title="Hapus semua coretan dan ulangi dari awal"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Hapus / Ulangi</span>
                                </button>
                            </div>
                        </div>

                        {/* Extra Large Canvas Container */}
                        <div className="relative w-full h-64 sm:h-72 md:h-80 bg-slate-50/70 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden touch-none flex items-center justify-center shadow-inner">
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
                                    <PenTool className="w-10 h-10 mb-2 stroke-1" />
                                    <span className="text-xs sm:text-sm font-medium tracking-wide">
                                        Bubuhkan tanda tangan di sini (Layar Sentuh / Stylus / Mouse)
                                    </span>
                                    <span className="text-[11px] text-slate-400 mt-1">
                                        Area lebih lega • Gunakan Undo jika ada goresan yang salah
                                    </span>
                                </div>
                            )}

                            {/* Baseline Guide Line */}
                            <div className="absolute bottom-8 left-8 right-8 border-b-2 border-slate-200/80 pointer-events-none flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>✕ Tanda Tangan</span>
                                <span>Garis Dasar</span>
                            </div>
                        </div>
                    </div>

                    {/* Checkbox: Save as reusable staff signature profile */}
                    {showSaveProfile && (
                        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center gap-3 cursor-pointer" onClick={() => setSaveProfile(prev => !prev)}>
                            <input
                                type="checkbox"
                                checked={saveProfile}
                                onChange={(e) => setSaveProfile(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex items-center gap-1.5 text-xs text-indigo-950 font-semibold">
                                <BookmarkPlus className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>Simpan tanda tangan ini ke daftar profil admin untuk digunakan kembali nanti</span>
                            </div>
                        </div>
                    )}

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
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2.5">
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
