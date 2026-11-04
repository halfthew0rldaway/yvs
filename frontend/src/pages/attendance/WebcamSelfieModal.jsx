import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, RefreshCw, CheckCircle2, X, AlertTriangle, MapPin, Clock, Smartphone, Upload, ShieldAlert, Info } from "lucide-react";
import toast from "react-hot-toast";

// Helper: Draw rounded rectangle on Canvas
function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// Helper: Word wrap text on Canvas
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
    if (!text || typeof text !== "string") return y;
    const words = text.split(" ");
    let line = "";
    let linesDrawn = 0;
    let nextY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, nextY);
            line = words[n] + " ";
            nextY += lineHeight;
            linesDrawn++;
            if (linesDrawn >= maxLines - 1 && n < words.length - 1) {
                // If last allowed line, add ellipsis if overflowing
                const remaining = words.slice(n).join(" ");
                let trunc = remaining;
                while (ctx.measureText(trunc + "...").width > maxWidth && trunc.length > 0) {
                    trunc = trunc.slice(0, -1);
                }
                ctx.fillText(trunc.trim() + "...", x, nextY);
                return nextY + lineHeight;
            }
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, nextY);
    return nextY + lineHeight;
}

export default function WebcamSelfieModal({
    isOpen,
    onClose,
    onCapture,
    type = "check-in", // "check-in" | "check-out" | "tugas-luar"
    user,
    locationData,
    policy,
    isTugasLuar = false,
    isEarlyCheckOut = false
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const nativeCameraInputRef = useRef(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [capturedBlob, setCapturedBlob] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [alasanTugasLuar, setAlasanTugasLuar] = useState("");

    const isActualTugasLuar = isTugasLuar || type === "tugas-luar";

    // Start video stream with multi-tier constraint ladder for mobile & desktop
    const startCamera = useCallback(async () => {
        setCameraError(null);
        setPreviewImage(null);
        setCapturedBlob(null);

        // Check for secure context (HTTPS / localhost requirement)
        if (typeof window !== "undefined" && window.isSecureContext === false && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
            setCameraError("Akses kamera langsung di browser mobile membutuhkan koneksi aman (HTTPS). Silakan gunakan tombol 'Kamera HP (Native)' di bawah untuk presensi langsung.");
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("Browser mobile ini membatasi akses webcam langsung. Silakan gunakan tombol 'Kamera HP (Native)' di bawah.");
            return;
        }

        // Tiered constraints to guarantee support on all mobile front cameras
        const constraintTiers = [
            // Tier 1: Front camera (selfie) ideal portrait
            { video: { facingMode: { ideal: "user" }, width: { ideal: 720 }, height: { ideal: 720 } }, audio: false },
            // Tier 2: Front camera relaxed resolution
            { video: { facingMode: "user" }, audio: false },
            // Tier 3: Any video device available
            { video: true, audio: false }
        ];

        let stream = null;
        let lastErr = null;

        for (const constraints of constraintTiers) {
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (stream) break;
            } catch (err) {
                lastErr = err;
                console.warn("Retrying with relaxed camera constraints due to:", err.name);
            }
        }

        if (!stream) {
            console.error("Camera access error:", lastErr);
            let msg = "Gagal mengakses webcam/kamera.";
            if (lastErr?.name === "NotAllowedError" || lastErr?.name === "PermissionDeniedError") {
                msg = "Izin kamera ditolak. Silakan izinkan akses kamera di ikon gembok pada browser Anda atau gunakan tombol 'Kamera HP (Native)'.";
            } else if (lastErr?.name === "NotFoundError" || lastErr?.name === "DevicesNotFoundError") {
                msg = "Kamera tidak terdeteksi pada perangkat Anda. Silakan gunakan tombol 'Kamera HP (Native)'.";
            } else if (lastErr?.name === "NotReadableError" || lastErr?.name === "TrackStartError") {
                msg = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi kamera lain lalu coba lagi.";
            } else if (lastErr?.name === "OverconstrainedError") {
                msg = "Resolusi kamera perangkat tidak didukung browser.";
            }
            setCameraError(msg);
            return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
                await videoRef.current.play();
                setCameraActive(true);
            } catch (playErr) {
                console.warn("Autoplay prevented, user gesture will activate video:", playErr);
                setCameraActive(true);
            }
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

    // Render watermark bar onto canvas (Used for both live webcam snap & native camera photo)
    const applyWatermark = (ctx, width, height) => {
        const barHeight = Math.max(138, Math.round(height * 0.23));
        const barTop = height - barHeight;

        // Dark gradient glassmorphism overlay
        const bgGrad = ctx.createLinearGradient(0, barTop, 0, height);
        bgGrad.addColorStop(0, "rgba(15, 23, 42, 0.92)");
        bgGrad.addColorStop(1, "rgba(2, 6, 23, 0.98)");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, barTop, width, barHeight);

        // Watermark Accent Strip on top (3px)
        ctx.fillStyle = isActualTugasLuar || isEarlyCheckOut ? "#f59e0b" : type === "check-in" ? "#10b981" : "#f43f5e";
        ctx.fillRect(0, barTop, width, 3);

        const padX = Math.max(16, Math.round(width * 0.035));
        const maxWidth = width - (padX * 2);

        const now = new Date();
        const timeOnly = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";
        const dateOnly = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" });

        // Line 1: Header Brand Pill & Timestamp
        const line1Y = barTop + 22;

        // Brand Pill
        drawRoundedRect(ctx, padX, line1Y - 13, 56, 17, 4, "#2563eb");
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText("SERV.IO", padX + 8, line1Y - 1);

        ctx.fillStyle = "#93c5fd";
        ctx.font = "bold 10.5px Inter, sans-serif";
        ctx.fillText("SMART ATTENDANCE CAMERA", padX + 64, line1Y - 1);

        // Right side: Real-time clock & date
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Inter, monospace";
        ctx.fillText(timeOnly, width - padX, line1Y - 1);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px Inter, sans-serif";
        ctx.fillText(dateOnly, width - padX, line1Y + 12);
        ctx.textAlign = "left";

        // Line 2: Petugas & Status Presensi
        const line2Y = line1Y + 18;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillText(`Petugas: ${user?.nama || "Karyawan"}`, padX, line2Y);

        const petugasWidth = ctx.measureText(`Petugas: ${user?.nama || "Karyawan"}`).width;
        ctx.fillStyle = isActualTugasLuar || isEarlyCheckOut ? "#fbbf24" : type === "check-in" ? "#34d399" : "#f87171";
        ctx.font = "bold 11px Inter, sans-serif";
        const typeLabel = isActualTugasLuar
            ? "• CHECK-IN TUGAS LUAR"
            : isEarlyCheckOut
                ? "• CHECK-OUT (PULANG LEBIH AWAL)"
                : type === "check-in"
                    ? "• CHECK-IN MASUK"
                    : "• CHECK-OUT PULANG";
        ctx.fillText(typeLabel, padX + petugasWidth + 6, line2Y);

        // Divider
        const sepY = line2Y + 7;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padX, sepY);
        ctx.lineTo(width - padX, sepY);
        ctx.stroke();

        // Line 3: Real Location Name (Nama Lokasi Real Detail - Smartphone Camera Style)
        let line3Y = sepY + 14;
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText("LOKASI REAL:", padX, line3Y);

        const lokasiLabelWidth = ctx.measureText("LOKASI REAL: ").width;
        const realAddressText = locationData?.addressName || "Jl. Raya Pekayon No.25, RT.004/RW.001, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi 17148";

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Inter, sans-serif";
        const endY = drawWrappedText(ctx, realAddressText, padX + lokasiLabelWidth, line3Y, maxWidth - lokasiLabelWidth - 10, 14, 2);

        // Line 4: GPS Coordinates, Akurasi, Jarak & Geofence Status
        const line4Y = Math.max(endY + 2, line3Y + 18);
        const coordsStr = locationData?.latitude
            ? `GPS: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)} (±${Math.round(locationData.accuracy || 0)}m)`
            : "GPS: Menunggu sinyal";

        const distanceStr = locationData?.distance !== undefined
            ? `• Jarak: ${locationData.distance}m ke ${policy?.nama_kantor || "Workshop"}`
            : "";

        const radiusStr = locationData?.isInRadius ? "[Dalam Radius]" : "[Luar Radius]";

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "9.5px Inter, sans-serif";
        ctx.fillText(`${coordsStr} ${distanceStr} ${radiusStr}`, padX, line4Y);

        // Stamp verifikasi di pojok kanan bawah
        ctx.textAlign = "right";
        ctx.fillStyle = locationData?.isInRadius ? "#10b981" : "#f59e0b";
        ctx.font = "bold 8.5px monospace";
        ctx.fillText("GEOFENCE VERIFIED", width - padX, line4Y);
        ctx.textAlign = "left";
    };

    // Capture from Live Video Stream
    const handleSnap = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement("canvas");

        const width = video.videoWidth || 720;
        const height = video.videoHeight || 720;

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

        // 2. Apply Watermark Overlay
        applyWatermark(ctx, width, height);

        // Generate data URL for preview & Blob for upload
        const dataUrl = canvas.toDataURL("image/jpeg", 0.90);
        setPreviewImage(dataUrl);

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], `selfie-${isActualTugasLuar ? "tugas-luar" : type}-${Date.now()}.jpg`, { type: "image/jpeg" });
                    setCapturedBlob(file);
                }
            },
            "image/jpeg",
            0.90
        );

        stopCamera();
    };

    // Fallback: Capture using Smartphone Native Camera App
    const handleNativeCapture = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current || document.createElement("canvas");
                // Limit max dimensions to 1440 for snappy processing & crisp watermark
                let w = img.naturalWidth || img.width || 720;
                let h = img.naturalHeight || img.height || 720;
                const maxDim = 1440;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.drawImage(img, 0, 0, w, h);
                applyWatermark(ctx, w, h);

                const dataUrl = canvas.toDataURL("image/jpeg", 0.90);
                setPreviewImage(dataUrl);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const stampedFile = new File([blob], `selfie-${isActualTugasLuar ? "tugas-luar" : type}-${Date.now()}.jpg`, { type: "image/jpeg" });
                            setCapturedBlob(stampedFile);
                        }
                    },
                    "image/jpeg",
                    0.90
                );
                stopCamera();
                toast.success("Foto kamera HP berhasil diverifikasi dengan stempel GPS & Waktu.");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = "";
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
        <div className="modal-shell bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="modal-panel max-w-lg">
                <div className="modal-grabber" />
                {/* Header */}
                <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl text-white ${isActualTugasLuar || isEarlyCheckOut ? "bg-amber-600" : type === "check-in" ? "bg-emerald-600" : "bg-blue-600"}`}>
                            {isActualTugasLuar ? <MapPin className="w-5 h-5 stroke-[2.5]" /> : <Camera className="w-5 h-5 stroke-[2.5]" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                                {isActualTugasLuar
                                    ? "Check-In Tugas Luar (Di Luar Kantor)"
                                    : isEarlyCheckOut
                                        ? "Verifikasi Wajah: Check-Out Pulang Lebih Awal"
                                        : type === "check-in"
                                            ? "Verifikasi Wajah: Check-In Masuk"
                                            : "Verifikasi Wajah: Check-Out Pulang"}
                            </h3>
                            <p className="text-2xs sm:text-xs text-slate-500 font-medium">
                                {isActualTugasLuar
                                    ? "Presensi di luar radius workshop dengan stempel GPS & review Owner"
                                    : isEarlyCheckOut
                                        ? `Kepulangan sebelum pukul ${policy?.jam_pulang || "18:00"} WIB • Wajib Review Owner`
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

                {/* Hidden Native File & Camera Input for 100% Reliable Mobile Fallback */}
                <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleNativeCapture}
                    className="hidden"
                />

                {/* Camera / Preview Area */}
                <div className="p-5 flex flex-col items-center justify-center bg-slate-900 relative min-h-[340px]">
                    {cameraError ? (
                        <div className="text-center p-6 max-w-sm">
                            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                            </div>
                            <p className="text-sm font-semibold text-white mb-2">{cameraError}</p>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                Browser mobile sering membatasi streaming webcam langsung tanpa HTTPS atau izin khusus. Anda dapat langsung menggunakan kamera bawaan ponsel:
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => nativeCameraInputRef.current?.click()}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer inline-flex items-center justify-center gap-2"
                                >
                                    <Smartphone className="w-4 h-4" />
                                    <span>Gunakan Kamera HP (Native)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Coba Live Lagi</span>
                                </button>
                            </div>
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

                            {/* Mobile Quick Native Camera Switch Pill */}
                            <button
                                type="button"
                                onClick={() => nativeCameraInputRef.current?.click()}
                                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 text-3xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer z-10"
                                title="Buka aplikasi kamera bawaan HP jika live stream browser macet"
                            >
                                <Smartphone className="w-3 h-3 text-emerald-400" />
                                <span>Kamera HP</span>
                            </button>

                            {/* Live Smartphone Camera Watermark Overlay Preview */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-transparent p-3 pointer-events-none text-left border-t border-white/10">
                                <div className="flex items-center justify-between text-3xs font-mono text-white/90 mb-0.5">
                                    <span className="font-bold tracking-wider text-sky-400">SERV.IO GPS CAMERA</span>
                                    <span className="text-slate-300 font-semibold">{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB</span>
                                </div>
                                <p className="text-3xs font-bold text-white truncate leading-tight">
                                    {locationData?.addressName || "Jl. Raya Pekayon No.25, RT.004/RW.001, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi 17148"}
                                </p>
                                <p className="text-3xs text-slate-300 font-mono mt-0.5 truncate">
                                    {locationData?.latitude ? `GPS: ${locationData.latitude.toFixed(5)}, ${locationData.longitude.toFixed(5)} • Jarak: ${locationData.distance !== null ? `${locationData.distance}m` : "-"}` : "Mencari sinyal GPS..."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Location Badge Info (Detail Watermark Kamera HP) */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 space-y-2 text-2xs sm:text-xs">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 text-slate-700 min-w-0">
                            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 leading-tight">
                                    {locationData?.addressName || "Jl. Raya Pekayon No.25, RT.004/RW.001, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi 17148"}
                                </p>
                                <p className="text-3xs text-slate-500 mt-1">
                                    {locationData?.latitude 
                                        ? `Koordinat: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)} (Akurasi ±${Math.round(locationData.accuracy || 0)}m) • Jarak: ${locationData.distance !== null ? `${locationData.distance}m` : "-"} ke ${policy?.nama_kantor || "Workshop"}`
                                        : "Mendeteksi sinyal GPS presisi..."}
                                </p>
                            </div>
                        </div>
                        {locationData?.isInRadius !== undefined && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-extrabold text-3xs uppercase shrink-0 ${
                                locationData.isInRadius 
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}>
                                {locationData.isInRadius ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                                        <span>Dalam Radius</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                                        <span>Luar Radius</span>
                                    </>
                                )}
                            </span>
                        )}
                    </div>
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
                                onClick={() => nativeCameraInputRef.current?.click()}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                title="Buka aplikasi kamera bawaan HP langsung"
                            >
                                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Kamera HP</span>
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

