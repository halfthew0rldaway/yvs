import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, RefreshCw, CheckCircle2, X, AlertTriangle, MapPin, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function WebcamSelfieModal({
    isOpen,
    onClose,
    onCapture,
    type = "check-in", // "check-in" | "check-out" | "tugas-luar"
    user,
    locationData,
    policy,
    isTugasLuar = false
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [capturedBlob, setCapturedBlob] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [alasanTugasLuar, setAlasanTugasLuar] = useState("");

    const isActualTugasLuar = isTugasLuar || type === "tugas-luar";

    // Start video stream
    const startCamera = useCallback(async () => {
        setCameraError(null);
        setPreviewImage(null);
        setCapturedBlob(null);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser Anda tidak mendukung akses kamera langsung.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 720 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraActive(true);
            }
        } catch (err) {
            console.error("Camera access error:", err);
            let msg = "Gagal mengakses webcam/kamera.";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                msg = "Izin kamera ditolak. Silakan izinkan akses kamera di ikon gembok pada browser Anda.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                msg = "Kamera tidak terdeteksi pada perangkat Anda.";
            }
            setCameraError(msg);
        }
    }, []);

    // Stop video stream
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            startCamera();
            setAlasanTugasLuar("");
        } else {
            stopCamera();
            setPreviewImage(null);
            setCapturedBlob(null);
            setAlasanTugasLuar("");
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, startCamera, stopCamera]);

    // Capture & Watermark on HTML5 Canvas
    const handleSnap = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement("canvas");

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 640;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1. Draw live camera video frame (mirror horizontal for selfie)
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        // 2. Draw Anti-Fraud Watermark Bar at Bottom
        const barHeight = Math.max(90, Math.round(height * 0.16));
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // slate-900 with 85% opacity
        ctx.fillRect(0, height - barHeight, width, barHeight);

        // Watermark Accent Strip
        ctx.fillStyle = isActualTugasLuar ? "#f59e0b" : type === "check-in" ? "#10b981" : "#f59e0b"; // emerald or amber
        ctx.fillRect(0, height - barHeight, width, 4);

        // Text Info
        const now = new Date();
        const timeStr = now.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric"
        }) + " • " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";

        const typeLabel = isActualTugasLuar
            ? "CHECK-IN TUGAS LUAR"
            : type === "check-in"
                ? "CHECK-IN MASUK"
                : "CHECK-OUT PULANG";

        const coordsStr = locationData?.latitude 
            ? `GPS: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)} (±${Math.round(locationData.accuracy || 0)}m)`
            : "GPS: Menunggu sinyal";

        const distanceStr = locationData?.distance !== undefined
            ? `Jarak: ${locationData.distance}m dari workshop`
            : "";

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(16, Math.round(width * 0.032))}px Inter, sans-serif`;
        ctx.fillText(`[${typeLabel}] ${user?.nama || "Karyawan"}`, 20, height - barHeight + 30);

        ctx.fillStyle = "#94a3b8"; // slate-400
        ctx.font = `${Math.max(12, Math.round(width * 0.024))}px Inter, sans-serif`;
        ctx.fillText(`🕒 ${timeStr}`, 20, height - barHeight + 54);
        ctx.fillText(`📍 ${coordsStr} ${distanceStr ? `• ${distanceStr}` : ""}`, 20, height - barHeight + 76);

        // Generate data URL for preview & Blob for upload
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        setPreviewImage(dataUrl);

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], `selfie-${isActualTugasLuar ? "tugas-luar" : type}-${Date.now()}.jpg`, { type: "image/jpeg" });
                    setCapturedBlob(file);
                }
            },
            "image/jpeg",
            0.88
        );

        stopCamera();
    };

    const handleRetake = () => {
        setPreviewImage(null);
        setCapturedBlob(null);
        startCamera();
    };

    const handleConfirm = async () => {
        if (!capturedBlob) {
            toast.error("Silakan ambil foto selfie terlebih dahulu.");
            return;
        }

        if (isActualTugasLuar && !alasanTugasLuar.trim()) {
            toast.error("Alasan atau deskripsi penugasan luar wajib diisi!");
            return;
        }

        setSubmitting(true);
        try {
            await onCapture(capturedBlob, {
                is_tugas_luar: isActualTugasLuar,
                alasan_tugas_luar: isActualTugasLuar ? alasanTugasLuar.trim() : null
            });
            onClose();
        } catch (err) {
            console.error("Submission error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl text-white ${isActualTugasLuar ? "bg-amber-600" : type === "check-in" ? "bg-emerald-600" : "bg-blue-600"}`}>
                            {isActualTugasLuar ? <MapPin className="w-5 h-5 stroke-[2.5]" /> : <Camera className="w-5 h-5 stroke-[2.5]" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                                {isActualTugasLuar
                                    ? "Check-In Tugas Luar (Di Luar Kantor)"
                                    : type === "check-in"
                                        ? "Verifikasi Wajah: Check-In Masuk"
                                        : "Verifikasi Wajah: Check-Out Pulang"}
                            </h3>
                            <p className="text-2xs sm:text-xs text-slate-500 font-medium">
                                {isActualTugasLuar
                                    ? "Presensi di luar radius workshop dengan stempel GPS & review Owner"
                                    : "Ambil foto selfie langsung dengan stempel lokasi & waktu"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Camera / Preview Area */}
                <div className="p-5 flex flex-col items-center justify-center bg-slate-900 relative min-h-[340px]">
                    {cameraError ? (
                        <div className="text-center p-6 max-w-sm">
                            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                            </div>
                            <p className="text-sm font-semibold text-white mb-2">{cameraError}</p>
                            <p className="text-xs text-slate-400 mb-4">
                                Pastikan kamera tidak sedang digunakan aplikasi lain dan izin browser telah diberikan.
                            </p>
                            <button
                                onClick={startCamera}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Coba Lagi</span>
                            </button>
                        </div>
                    ) : previewImage ? (
                        <div className="relative w-full max-w-[360px] aspect-square rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-black">
                            <img
                                src={previewImage}
                                alt="Hasil Selfie Presensi"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-3xs font-extrabold uppercase px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                                <span>Foto Siap</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full max-w-[360px] aspect-square rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-black flex items-center justify-center">
                            <video
                                ref={videoRef}
                                playsInline
                                muted
                                className="w-full h-full object-cover -scale-x-100" // CSS mirror for live view
                            />
                            {/* Face Frame Guide Overlay */}
                            <div className="absolute inset-8 rounded-full border-2 border-dashed border-white/40 pointer-events-none flex items-center justify-center">
                                <span className="text-3xs font-semibold text-white/70 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
                                    Posisikan Wajah di Lingkaran
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Location Badge Info */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-2xs sm:text-xs">
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">
                            {locationData?.distance !== undefined
                                ? `Jarak ke ${policy?.nama_kantor || "Workshop"}: ${locationData.distance} m`
                                : "Mendeteksi koordinat GPS..."}
                        </span>
                    </div>
                    {locationData?.isInRadius !== undefined && (
                        <span className={`px-2 py-0.5 rounded-md font-bold text-3xs shrink-0 ${
                            locationData.isInRadius 
                                ? "bg-emerald-100 text-emerald-800" 
                                : "bg-rose-100 text-rose-800"
                        }`}>
                            {locationData.isInRadius ? "✓ Dalam Radius" : "⚠️ Luar Radius"}
                        </span>
                    )}
                </div>

                {/* External Duty Reason Input */}
                {isActualTugasLuar && (
                    <div className="px-5 py-3.5 bg-amber-50/80 border-t border-amber-200/70">
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                            Alasan / Keperluan Penugasan Luar <span className="text-rose-500">* (Wajib diisi untuk review Owner)</span>
                        </label>
                        <textarea
                            value={alasanTugasLuar}
                            onChange={(e) => setAlasanTugasLuar(e.target.value)}
                            rows={2}
                            placeholder="Contoh: Mengantar unit laptop Asus servis ke pelanggan di Pekayon sebelum jam 9 / Ambil sparepart..."
                            className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            required
                        />
                        <p className="text-3xs text-amber-800 mt-1 font-medium">
                            Presensi kategori Tugas Luar akan dikirim ke Superadmin / Owner untuk diverifikasi.
                        </p>
                    </div>
                )}

                {/* Actions Footer */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-white">
                    {previewImage ? (
                        <>
                            <button
                                type="button"
                                onClick={handleRetake}
                                disabled={submitting}
                                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Ulangi Foto</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={submitting}
                                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                                    isActualTugasLuar
                                        ? "bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-500/20"
                                        : type === "check-in"
                                            ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/20"
                                            : "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-500/20"
                                } ${submitting ? "opacity-75 cursor-not-allowed" : ""}`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                        <span>{isActualTugasLuar ? "Kirim Presensi Tugas Luar" : "Konfirmasi & Simpan Presensi"}</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSnap}
                                disabled={!cameraActive}
                                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                                    type === "check-in"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-amber-600 hover:bg-amber-700"
                                } ${!cameraActive ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <Camera className="w-4 h-4 stroke-[2.5]" />
                                <span>Ambil Foto Wajah</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

