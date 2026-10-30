import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { 
    X, 
    Camera, 
    Flashlight, 
    RefreshCw, 
    Search, 
    CheckCircle2, 
    AlertCircle, 
    ScanLine,
    ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Synthesizes an audible scanner beep using Web Audio API
 */
function playScannerBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    } catch (_) {}
}

export default function CameraScannerModal({
    isOpen = false,
    onClose,
    onScan,
    title = "Pemindai QR & Barcode Kamera",
    subtitle = "Arahkan kamera ke QR tiket servis atau barcode suku cadang"
}) {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [torchOn, setTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [manualCode, setManualCode] = useState("");

    // Initialize camera list on open
    useEffect(() => {
        if (!isOpen) {
            stopScanning();
            return;
        }

        let isMounted = true;
        Html5Qrcode.getCameras()
            .then((devices) => {
                if (!isMounted) return;
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    // Prefer back / environment camera on mobile
                    const backCam = devices.find(d => 
                        d.label.toLowerCase().includes("back") || 
                        d.label.toLowerCase().includes("rear") || 
                        d.label.toLowerCase().includes("belakang") ||
                        d.label.toLowerCase().includes("environment")
                    );
                    setSelectedCameraId(backCam ? backCam.id : devices[0].id);
                } else {
                    setScanError("Tidak ada kamera yang terdeteksi di perangkat ini.");
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                console.warn("Gagal mendapatkan daftar kamera:", err);
                setScanError("Izin kamera belum diberikan atau perangkat tidak mendukung.");
            });

        return () => {
            isMounted = false;
            stopScanning();
        };
    }, [isOpen]);

    // Start scanner when camera is selected
    useEffect(() => {
        if (isOpen && selectedCameraId) {
            startScanning(selectedCameraId);
        }
        return () => {
            stopScanning();
        };
    }, [isOpen, selectedCameraId]);

    const stopScanning = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.warn("Stop scanner error:", err);
            }
            html5QrCodeRef.current = null;
        }
        setIsScanning(false);
        setTorchOn(false);
        setHasTorch(false);
    };

    const startScanning = async (cameraId) => {
        await stopScanning();
        setScanError(null);

        const qrRegionId = "camera-scanner-viewfinder";
        const html5QrCode = new Html5Qrcode(qrRegionId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
        };

        try {
            await html5QrCode.start(
                cameraId,
                config,
                (decodedText) => {
                    handleSuccessfulScan(decodedText);
                },
                (_) => {
                    // Ignore transient per-frame decode misses
                }
            );

            setIsScanning(true);

            // Check if torch/flashlight is supported
            try {
                const capabilities = html5QrCode.getRunningTrackCapabilities();
                if (capabilities && capabilities.torch) {
                    setHasTorch(true);
                }
            } catch (_) {}
        } catch (err) {
            console.error("Gagal memulai scanner:", err);
            setIsScanning(false);
            setScanError("Gagal memulai pemindai kamera: " + (err.message || "Akses kamera terkendala"));
        }
    };

    const handleSuccessfulScan = (decodedText) => {
        if (!decodedText) return;
        playScannerBeep();
        stopScanning();
        if (onScan) {
            onScan(decodedText.trim());
        }
    };

    const handleToggleTorch = async () => {
        if (!html5QrCodeRef.current || !hasTorch) return;
        try {
            await html5QrCodeRef.current.applyVideoConstraints({
                advanced: [{ torch: !torchOn }]
            });
            setTorchOn(!torchOn);
        } catch (err) {
            console.warn("Gagal mengubah status lampu senter:", err);
        }
    };

    const handleSwitchCamera = () => {
        if (cameras.length <= 1) return;
        const currentIdx = cameras.findIndex(c => c.id === selectedCameraId);
        const nextIdx = (currentIdx + 1) % cameras.length;
        setSelectedCameraId(cameras[nextIdx].id);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        handleSuccessfulScan(manualCode.trim());
        setManualCode("");
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div 
                className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col modal-surface"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                            <Camera className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{title}</h3>
                            <p className="text-xs text-slate-500 leading-tight">{subtitle}</p>
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

                {/* Viewfinder Area */}
                <div className="relative bg-slate-950 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
                    <div 
                        id="camera-scanner-viewfinder" 
                        className="w-full h-full min-h-[290px] flex items-center justify-center"
                    />

                    {/* Viewfinder Target Overlay */}
                    {isScanning && !scanError && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                            <div className="relative w-56 h-56 border-2 border-blue-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
                                {/* Animated Laser Scanning Line (60fps GPU Composited) */}
                                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_#38bdf8] animate-laser-scan gpu-layer" />
                                {/* Target Corner Brackets */}
                                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl" />
                                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr" />
                                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl" />
                                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white rounded-br" />
                            </div>
                            <span className="mt-4 px-3 py-1 rounded-full text-2xs font-bold bg-black/60 text-white/90 backdrop-blur-sm border border-white/20 flex items-center gap-1.5 shadow">
                                <ScanLine className="w-3.5 h-3.5 text-blue-400" />
                                Posisikan barcode atau QR di dalam kotak
                            </span>
                        </div>
                    )}

                    {/* Error state */}
                    {scanError && (
                        <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-900/90 text-white">
                            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                            <p className="text-xs font-semibold text-rose-200 mb-3">{scanError}</p>
                            <button
                                type="button"
                                onClick={() => selectedCameraId && startScanning(selectedCameraId)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                            >
                                Coba Buka Kamera Lagi
                            </button>
                        </div>
                    )}

                    {/* Camera Control Overlay Pill */}
                    {cameras.length > 0 && (
                        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 z-10">
                            {cameras.length > 1 && (
                                <button
                                    type="button"
                                    onClick={handleSwitchCamera}
                                    className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-2xs font-bold rounded-xl border border-white/20 backdrop-blur-sm flex items-center gap-1.5 cursor-pointer shadow"
                                    title="Ganti kamera depan / belakang"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Ganti Kamera</span>
                                </button>
                            )}
                            {hasTorch && (
                                <button
                                    type="button"
                                    onClick={handleToggleTorch}
                                    className={`px-3 py-1.5 text-2xs font-bold rounded-xl border backdrop-blur-sm flex items-center gap-1.5 cursor-pointer shadow ml-auto ${
                                        torchOn 
                                            ? "bg-amber-500 text-white border-amber-400" 
                                            : "bg-black/60 hover:bg-black/80 text-white border-white/20"
                                    }`}
                                    title="Nyalakan lampu senter"
                                >
                                    <Flashlight className="w-3.5 h-3.5" />
                                    <span>{torchOn ? "Lampu ON" : "Lampu"}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Manual Input Fallback */}
                <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
                    <form onSubmit={handleManualSubmit} className="space-y-2">
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500">
                            Atau Masukkan Nomor / Kode Manual
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Contoh: TK-202610-0001 atau SP-RAM-01"
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!manualCode.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                            >
                                <span>Cari</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes scanLine {
                    0% { top: 8px; }
                    50% { top: calc(100% - 10px); }
                    100% { top: 8px; }
                }
            `}</style>
        </div>
    );
}

