import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { 
    X, Camera, RefreshCw, Check, AlertCircle, Image as ImageIcon, Trash2
} from "lucide-react";

export default function CameraCaptureModal({
    isOpen,
    onClose,
    onCapture,
    maxPhotos = 10,
    currentPhotos = [],
    onRemovePhoto,
    title = "Foto Langsung Kamera",
    subtitle = "Ambil foto dokumentasi unit secara cepat"
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

                const filename = `foto_${Date.now()}_${currentPhotos.length + 1}.jpg`;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
            {/* Hidden canvas for snapshot rendering */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                            <Camera className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    currentPhotos.length >= maxPhotos 
                                        ? "bg-amber-100 text-amber-800 border border-amber-200" 
                                        : "bg-blue-100 text-blue-700"
                                }`}>
                                    {currentPhotos.length} / {maxPhotos} Foto
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {(devices.length > 1 || !selectedDeviceId) && (
                            <button
                                type="button"
                                onClick={handleSwitchCamera}
                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                title="Ganti Kamera (Depan / Belakang)"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Viewfinder Area */}
                <div className="p-4 bg-slate-100 flex flex-col items-center justify-center overflow-hidden">
                    <div className="relative w-full aspect-video max-h-[48vh] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
                        {/* Live Video Feed */}
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            autoPlay
                            className={`w-full h-full object-contain ${facingMode === "user" && !selectedDeviceId ? "scale-x-[-1]" : ""}`}
                        />

                        {/* Shutter Flash Animation */}
                        {isFlashing && (
                            <div className="absolute inset-0 bg-white z-30 opacity-90 transition-opacity duration-150 pointer-events-none" />
                        )}

                        {/* Framing Guidelines Overlay */}
                        {isStreaming && !cameraError && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                                <div className="w-full h-full border-2 border-white/20 border-dashed rounded-xl relative">
                                    <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl-md" />
                                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr-md" />
                                    <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl-md" />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br-md" />
                                    
                                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-slate-900/70 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-medium text-slate-200 border border-white/10">
                                        Posisikan objek di area kotak
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/95 z-20">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 mb-2">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h4 className="text-slate-900 font-bold text-sm mb-1">Kamera Tidak Tersedia</h4>
                                <p className="text-xs text-slate-500 max-w-sm mb-3">
                                    {cameraError}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Coba Lagi
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Thumbnails Strip */}
                {currentPhotos.length > 0 && (
                    <div className="px-5 py-3 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-bold text-slate-500 shrink-0 uppercase tracking-wider">
                            Foto ({currentPhotos.length}):
                        </span>
                        {currentPhotos.map((photo, idx) => (
                            <div key={idx} className="relative shrink-0 group">
                                <img
                                    src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
                                    alt={`Foto ${idx + 1}`}
                                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-2xs"
                                />
                                <span className="absolute bottom-0.5 right-0.5 bg-slate-900/80 text-white text-[9px] font-mono px-1 rounded">
                                    #{idx + 1}
                                </span>
                                {onRemovePhoto && (
                                    <button
                                        type="button"
                                        onClick={() => onRemovePhoto(idx)}
                                        className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-0.5 shadow-md opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Hapus foto ini"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>

                    <button
                        type="button"
                        disabled={!isStreaming || cameraError || currentPhotos.length >= maxPhotos || isCapturing}
                        onClick={handleTakeSnapshot}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                        title={currentPhotos.length >= maxPhotos ? `Maksimal ${maxPhotos} foto tercapai` : "Ambil Foto"}
                    >
                        <Camera className="w-4 h-4" />
                        <span>Ambil Foto</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Check className="w-4 h-4" />
                        <span>Selesai ({currentPhotos.length})</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
