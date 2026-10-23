import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { 
    X, Camera, RefreshCw, Check, AlertCircle, Sparkles, Image as ImageIcon, Trash2
} from "lucide-react";

export default function CameraCaptureModal({
    isOpen,
    onClose,
    onCapture,
    maxPhotos = 5,
    currentPhotos = [],
    onRemovePhoto
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [facingMode, setFacingMode] = useState("environment"); // default rear camera
    const [isFlashing, setIsFlashing] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    // Start / Restart Camera
    useEffect(() => {
        if (!isOpen) {
            stopStream();
            return;
        }

        startCamera();

        return () => {
            stopStream();
        };
    }, [isOpen, selectedDeviceId, facingMode]);

    function stopStream() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
            streamRef.current = null;
        }
        setIsStreaming(false);
    }

    async function startCamera() {
        stopStream();
        setCameraError(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("Browser Anda tidak mendukung akses kamera langsung.");
            return;
        }

        try {
            const constraints = {
                audio: false,
                video: selectedDeviceId 
                    ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
                    : { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch((err) => {
                    console.error("Video play error:", err);
                });
            }

            setIsStreaming(true);

            // Enumerate video devices
            try {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = allDevices.filter(d => d.kind === "videoinput");
                setDevices(videoInputs);
            } catch (enumErr) {
                console.warn("Could not enumerate devices:", enumErr);
            }
        } catch (err) {
            console.error("Gagal membuka kamera:", err);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setCameraError("Izin akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setCameraError("Tidak ada perangkat kamera / webcam yang terdeteksi.");
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                setCameraError("Kamera sedang digunakan oleh aplikasi lain.");
            } else {
                setCameraError("Gagal membuka kamera: " + (err.message || "Kesalahan tidak dikenal"));
            }
        }
    }

    // Toggle Camera (front/back or next device)
    function handleSwitchCamera() {
        if (devices.length > 1) {
            const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
            const nextIndex = (currentIndex + 1) % devices.length;
            setSelectedDeviceId(devices[nextIndex].deviceId);
        } else {
            setFacingMode(prev => prev === "environment" ? "user" : "environment");
        }
    }

    // Snap Photo
    function handleTakeSnapshot() {
        if (!videoRef.current || !canvasRef.current || isCapturing) return;

        if (currentPhotos.length >= maxPhotos) {
            toast.error(`Maksimal ${maxPhotos} foto! Hapus salah satu foto jika ingin mengambil foto baru.`);
            return;
        }

        setIsCapturing(true);
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const width = video.videoWidth || 1280;
            const height = video.videoHeight || 720;

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            // If front camera (user facing), mirror back so orientation is natural
            if (facingMode === "user" && !selectedDeviceId) {
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
            }

            ctx.drawImage(video, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) {
                    toast.error("Gagal mengambil foto dari kamera");
                    setIsCapturing(false);
                    return;
                }

                const filename = `foto_kondisi_${Date.now()}_${currentPhotos.length + 1}.jpg`;
                const file = new File([blob], filename, { type: "image/jpeg" });
                
                onCapture(file);
                toast.success(`Foto ${currentPhotos.length + 1} berhasil diambil!`);
                setIsCapturing(false);
            }, "image/jpeg", 0.92);
        } catch (err) {
            console.error("Snapshot error:", err);
            toast.error("Terjadi kesalahan saat memproses gambar.");
            setIsCapturing(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            {/* Hidden canvas for snapshot rendering */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                            <Camera className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                                Foto Langsung Kamera
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {currentPhotos.length} / {maxPhotos} Foto
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400">
                                Ambil foto fisik/kondisi perangkat pelanggan secara cepat
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {(devices.length > 1 || !selectedDeviceId) && (
                            <button
                                type="button"
                                onClick={handleSwitchCamera}
                                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                                title="Ganti Kamera (Depan / Belakang)"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Viewfinder Area */}
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[320px] sm:min-h-[400px]">
                    {/* Live Video Feed */}
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className={`w-full h-full object-contain max-h-[55vh] ${facingMode === "user" && !selectedDeviceId ? "scale-x-[-1]" : ""}`}
                    />

                    {/* Shutter Flash Animation */}
                    {isFlashing && (
                        <div className="absolute inset-0 bg-white z-30 opacity-90 transition-opacity duration-150 pointer-events-none" />
                    )}

                    {/* Framing Guidelines Overlay */}
                    {isStreaming && !cameraError && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                            <div className="w-full h-full max-w-lg border-2 border-white/20 border-dashed rounded-2xl relative">
                                {/* Corner markers */}
                                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />

                                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-medium text-slate-200 border border-white/10">
                                    Posisikan perangkat di dalam area kotak
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 z-20">
                            <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 mb-3">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h4 className="text-white font-bold text-base mb-1">Kamera Tidak Tersedia</h4>
                            <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                                {cameraError}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Coba Lagi
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Tutup & Pilih File
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Gallery Strip (Photos Taken in this session) */}
                {currentPhotos.length > 0 && (
                    <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-slate-400 shrink-0 uppercase tracking-wider pl-1">
                            Foto ({currentPhotos.length}):
                        </span>
                        {currentPhotos.map((photo, idx) => (
                            <div key={idx} className="relative shrink-0 group">
                                <img
                                    src={URL.createObjectURL(photo)}
                                    alt={`Foto ${idx + 1}`}
                                    className="w-12 h-12 object-cover rounded-xl border border-slate-700 shadow-sm"
                                />
                                <span className="absolute bottom-0.5 right-0.5 bg-slate-900/90 text-white text-[9px] font-mono px-1 rounded">
                                    #{idx + 1}
                                </span>
                                {onRemovePhoto && (
                                    <button
                                        type="button"
                                        onClick={() => onRemovePhoto(idx)}
                                        className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Hapus foto ini"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>

                    {/* Big Shutter Button */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={!isStreaming || cameraError || currentPhotos.length >= maxPhotos || isCapturing}
                            onClick={handleTakeSnapshot}
                            className="relative flex items-center justify-center p-1 rounded-full border-4 border-white/30 hover:border-blue-400 disabled:opacity-40 transition-all cursor-pointer active:scale-95 group"
                            title={currentPhotos.length >= maxPhotos ? "Maksimal foto tercapai" : "Jepret Foto"}
                        >
                            <div className="w-14 h-14 rounded-full bg-white group-hover:bg-blue-500 transition-colors flex items-center justify-center shadow-lg">
                                <Camera className="w-6 h-6 text-slate-900 group-hover:text-white transition-colors" />
                            </div>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Check className="w-4 h-4" />
                        <span>Selesai ({currentPhotos.length})</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

