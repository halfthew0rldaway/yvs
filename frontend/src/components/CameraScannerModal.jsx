import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    X,
    Camera,
    Flashlight,
    RefreshCw,
    Search,
    AlertCircle,
    ScanLine,
    ArrowRight,
    Upload,
    ImagePlus,
    ShieldCheck,
    Loader2,
} from "lucide-react";

const MAX_QR_FILE_BYTES = 12 * 1024 * 1024; // 12 MB safety cap for in-memory decoding
const FILE_DECODER_REGION_ID = "camera-scanner-ephemeral-file-decoder";

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

/**
 * Downscales oversized smartphone photos purely in temporary memory
 * so high-resolution QR images decode reliably without persisting any file.
 */
async function createNormalizedImageFile(file, maxDimension = 1400) {
    const objectUrl = URL.createObjectURL(file);
    const canvas = document.createElement("canvas");
    try {
        const img = await new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
            el.src = objectUrl;
        });

        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        if (!srcW || !srcH) return null;

        const scale = Math.min(1, maxDimension / Math.max(srcW, srcH));
        const targetW = Math.max(1, Math.round(srcW * scale));
        const targetH = Math.max(1, Math.round(srcH * scale));

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;

        // White background helps transparent PNG QR codes decode cleanly
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
        if (!blob) return null;
        return new File([blob], "qr-ephemeral.png", { type: "image/png" });
    } finally {
        URL.revokeObjectURL(objectUrl);
        canvas.width = 0;
        canvas.height = 0;
    }
}

/**
 * Decodes QR / barcode strictly in-memory on the client (zero server upload, zero disk persistence).
 */
async function decodeQrFromImageFile(file) {
    // 1. Try native browser BarcodeDetector first if available (fast & accurate)
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        let bitmap = null;
        try {
            const detector = new window.BarcodeDetector({
                formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8"],
            });
            bitmap = await createImageBitmap(file);
            const detected = await detector.detect(bitmap);
            if (Array.isArray(detected) && detected[0]?.rawValue) {
                return detected[0].rawValue;
            }
        } catch (_) {
            // Fall through to html5-qrcode decoder
        } finally {
            if (bitmap && typeof bitmap.close === "function") {
                try { bitmap.close(); } catch (_) {}
            }
        }
    }

    // 2. Try html5-qrcode scanFile directly on the original file in memory
    const fileScanner = new Html5Qrcode(FILE_DECODER_REGION_ID);
    try {
        try {
            const text = await fileScanner.scanFile(file, false);
            if (text) return text;
        } catch (_) {
            // 3. Retry with white-backed downscaled PNG (handles transparent QR PNGs & huge camera shots)
            const normalized = await createNormalizedImageFile(file, 1400);
            if (normalized) {
                const retryText = await fileScanner.scanFile(normalized, false);
                if (retryText) return retryText;
            }
            throw new Error("QR_NOT_FOUND");
        }
    } finally {
        try {
            fileScanner.clear();
        } catch (_) {}
    }

    throw new Error("QR_NOT_FOUND");
}

export default function CameraScannerModal({
    isOpen = false,
    onClose,
    onScan,
    title = "Pemindai QR & Barcode",
    subtitle = "Arahkan kamera atau unggah gambar QR nota servis / suku cadang",
}) {
    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);

    const [activeMode, setActiveMode] = useState("camera"); // "camera" | "upload"
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [torchOn, setTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [manualCode, setManualCode] = useState("");

    const [isDecodingFile, setIsDecodingFile] = useState(false);
    const [fileError, setFileError] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);

    const stopScanning = useCallback(async () => {
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
    }, []);

    const handleSuccessfulScan = useCallback(
        (decodedText) => {
            if (!decodedText) return;
            playScannerBeep();
            stopScanning();
            if (onScan) {
                onScan(String(decodedText).trim());
            }
        },
        [onScan, stopScanning]
    );

    const startScanning = useCallback(
        async (cameraId) => {
            await stopScanning();
            setScanError(null);

            const qrRegionId = "camera-scanner-viewfinder";
            if (!document.getElementById(qrRegionId)) return;

            const html5QrCode = new Html5Qrcode(qrRegionId);
            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: 15,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
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
        },
        [handleSuccessfulScan, stopScanning]
    );

    // Reset transient upload state whenever modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            stopScanning();
            setFileError("");
            setIsDecodingFile(false);
            setIsDragOver(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        setActiveMode("camera");
        setFileError("");
    }, [isOpen, stopScanning]);

    // Initialize camera list only while in camera mode
    useEffect(() => {
        if (!isOpen || activeMode !== "camera") {
            stopScanning();
            return;
        }

        let isMounted = true;
        Html5Qrcode.getCameras()
            .then((devices) => {
                if (!isMounted) return;
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    const backCam = devices.find(
                        (d) =>
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
    }, [isOpen, activeMode, stopScanning]);

    // Start live camera stream when camera is selected in camera mode
    useEffect(() => {
        if (isOpen && activeMode === "camera" && selectedCameraId) {
            startScanning(selectedCameraId);
        }
        return () => {
            stopScanning();
        };
    }, [isOpen, activeMode, selectedCameraId, startScanning, stopScanning]);

    const processUploadedQrFile = useCallback(
        async (file) => {
            if (!file) return;
            setFileError("");

            if (!file.type || !file.type.startsWith("image/")) {
                setFileError("Format file tidak didukung. Pilih gambar PNG, JPG, atau WebP.");
                return;
            }
            if (file.size > MAX_QR_FILE_BYTES) {
                setFileError("Ukuran gambar terlalu besar (maksimal 12 MB).");
                return;
            }

            setIsDecodingFile(true);
            await stopScanning();

            try {
                const decodedText = await decodeQrFromImageFile(file);
                handleSuccessfulScan(decodedText);
            } catch (_) {
                setFileError(
                    "Kode QR atau barcode tidak terdeteksi pada gambar ini. Pastikan QR terlihat jelas dan tidak terpotong."
                );
            } finally {
                setIsDecodingFile(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        },
        [handleSuccessfulScan, stopScanning]
    );

    // Support Ctrl+V image paste while modal is open (processed strictly in memory)
    useEffect(() => {
        if (!isOpen) return;
        const onPaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type && item.type.startsWith("image/")) {
                    const pastedFile = item.getAsFile();
                    if (pastedFile) {
                        e.preventDefault();
                        setActiveMode("upload");
                        processUploadedQrFile(pastedFile);
                        break;
                    }
                }
            }
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, [isOpen, processUploadedQrFile]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            processUploadedQrFile(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) {
            processUploadedQrFile(file);
        }
    };

    const handleToggleTorch = async () => {
        if (!html5QrCodeRef.current || !hasTorch) return;
        try {
            await html5QrCodeRef.current.applyVideoConstraints({
                advanced: [{ torch: !torchOn }],
            });
            setTorchOn(!torchOn);
        } catch (err) {
            console.warn("Gagal mengubah status lampu senter:", err);
        }
    };

    const handleSwitchCamera = () => {
        if (cameras.length <= 1) return;
        const currentIdx = cameras.findIndex((c) => c.id === selectedCameraId);
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
            className="modal-shell z-[9999] bg-slate-950/80 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="modal-panel max-w-md border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Pinned Header */}
                <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 gap-2 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                            {activeMode === "camera" ? (
                                <Camera className="w-5 h-5" />
                            ) : (
                                <ImagePlus className="w-5 h-5" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{title}</h3>
                            <p className="text-xs text-slate-500 leading-tight line-clamp-2">{subtitle}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup pemindai"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Switcher Tabs: Camera vs Ephemeral Image Upload */}
                <div className="px-4 py-2.5 bg-white border-b border-slate-100 shrink-0">
                    <div
                        role="group"
                        aria-label="Metode pemindaian QR"
                        className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl"
                    >
                        <button
                            type="button"
                            aria-pressed={activeMode === "camera"}
                            onClick={() => {
                                setFileError("");
                                setActiveMode("camera");
                            }}
                            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeMode === "camera"
                                    ? "bg-white text-blue-700 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Camera className="w-3.5 h-3.5 shrink-0" />
                            <span>Kamera Langsung</span>
                        </button>
                        <button
                            type="button"
                            aria-pressed={activeMode === "upload"}
                            onClick={() => {
                                stopScanning();
                                setFileError("");
                                setActiveMode("upload");
                            }}
                            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeMode === "upload"
                                    ? "bg-white text-blue-700 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            <span>Unggah Gambar QR</span>
                        </button>
                    </div>
                </div>

                {/* Hidden ephemeral decoder mount point (never writes to server or disk) */}
                <div id={FILE_DECODER_REGION_ID} className="hidden" aria-hidden="true" />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Pilih file gambar QR"
                />

                {/* Scrollable Body */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    {activeMode === "camera" ? (
                        <div className="relative bg-slate-950 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[300px] overflow-hidden">
                            <div
                                id="camera-scanner-viewfinder"
                                className="w-full h-full min-h-[280px] flex items-center justify-center"
                            />

                            {/* Viewfinder Target Overlay */}
                            {isScanning && !scanError && (
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                    <div className="relative w-56 h-56 border-2 border-blue-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_#38bdf8] animate-laser-scan gpu-layer" />
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

                            {/* Camera Error state with 1-click fallback to ephemeral image upload */}
                            {scanError && (
                                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-900/95 text-white">
                                    <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                                    <p className="text-xs font-semibold text-rose-200 mb-4 max-w-xs">{scanError}</p>
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        {selectedCameraId && (
                                            <button
                                                type="button"
                                                onClick={() => startScanning(selectedCameraId)}
                                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors border border-white/15 cursor-pointer"
                                            >
                                                Coba Kamera Lagi
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveMode("upload");
                                                setTimeout(() => fileInputRef.current?.click(), 50);
                                            }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            <span>Unggah Gambar QR</span>
                                        </button>
                                    </div>
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
                    ) : (
                        <div className="p-4 sm:p-5 bg-slate-50/70">
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragOver(true);
                                }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => !isDecodingFile && fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if ((e.key === "Enter" || e.key === " ") && !isDecodingFile) {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                className={`min-h-[220px] rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                                    isDragOver
                                        ? "border-blue-500 bg-blue-50/80"
                                        : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"
                                }`}
                            >
                                {isDecodingFile ? (
                                    <>
                                        <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
                                        <p className="text-sm font-bold text-slate-900">Membaca kode QR dari gambar…</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Diproses lokal secara sementara di memori perangkat Anda.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-3">
                                            <ImagePlus className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-900">
                                            Pilih foto / tangkapan layar QR nota
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                                            Klik untuk memilih dari galeri, tarik file ke sini, atau tempel gambar (Ctrl+V).
                                        </p>
                                        <span className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm">
                                            <Upload className="w-3.5 h-3.5" />
                                            <span>Pilih Gambar (PNG / JPG / WebP)</span>
                                        </span>
                                    </>
                                )}
                            </div>

                            {fileError && (
                                <div
                                    role="alert"
                                    className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                                    <span>{fileError}</span>
                                </div>
                            )}

                            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>
                                    Aman &amp; hemat penyimpanan: gambar hanya dibaca sementara di browser dan{" "}
                                    <strong className="text-slate-700">tidak disimpan ke server</strong>.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pinned Manual Input Fallback */}
                <div className="p-4 sm:p-5 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={handleManualSubmit} className="space-y-2">
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500">
                            Atau Masukkan Nomor / Kode Manual
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 min-w-0">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Contoh: SRV-2026-073 atau SP-RAM-01"
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
