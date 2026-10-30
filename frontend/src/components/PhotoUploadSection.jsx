import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { 
    Camera, 
    Upload, 
    Trash2, 
    X, 
    Plus, 
    ZoomIn, 
    ZoomOut,
    RotateCcw,
    Image as ImageIcon, 
    Video, 
    Play, 
    Sparkles 
} from "lucide-react";
import CameraCaptureModal from "./CameraCaptureModal";
import MediaProcessingModal from "./MediaProcessingModal";
import { isVideo, getMediaUrl, compressImage } from "../utils/mediaUtils";

export default function PhotoUploadSection({
    label = "Dokumentasi Foto & Video Perangkat",
    sublabel = "Unggah foto/video atau ambil langsung melalui kamera",
    maxPhotos = 10,
    photos = [],
    onChange,
    disabled = false,
    allowVideo = true
}) {
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [zoomScale, setZoomScale] = useState(1);
    const [isCompressing, setIsCompressing] = useState(false);

    // HD Quality toggle state (persisted in localStorage)
    const [isHdMode, setIsHdMode] = useState(() => {
        try {
            return localStorage.getItem("yvs_upload_hd_mode") === "true";
        } catch {
            return false;
        }
    });

    const toggleHdMode = () => {
        setIsHdMode(prev => {
            const next = !prev;
            try {
                localStorage.setItem("yvs_upload_hd_mode", String(next));
            } catch {}
            if (next) {
                toast.success("Mode HD Aktif: Berkas foto & video akan diunggah dengan kualitas asli tanpa kompresi.");
            } else {
                toast("Mode Seimbang Aktif: Resolusi 2.5K tajam & jernih (kualitas 90%, anti-pecah).", {
                    icon: null
                });
            }
            return next;
        });
    };

    const [processingModal, setProcessingModal] = useState({
        isOpen: false,
        stage: "compressing",
        title: "",
        subtitle: "",
        currentFileIndex: 1,
        totalFiles: 1,
        currentFileName: "",
        currentFileType: "image",
        currentOriginalSize: 0,
        currentCompressedSize: 0,
        progressPercent: 0,
        items: []
    });

    const fileInputRef = useRef(null);
    const nativeCameraInputRef = useRef(null);
    const nativeVideoInputRef = useRef(null);

    async function handleAddPhoto(newFile) {
        if (photos.length >= maxPhotos) {
            toast.error(`Maksimal ${maxPhotos} media!`);
            return;
        }

        const isVid = isVideo(newFile);
        let finalFile = newFile;

        // Auto compress if image
        if (newFile instanceof File && !isVid) {
            setIsCompressing(true);
            setProcessingModal({
                isOpen: true,
                stage: isHdMode ? "done" : "compressing",
                isHd: isHdMode,
                title: isHdMode ? "Menyiapkan Foto HD (Kualitas Asli)..." : "Mengoptimalkan Foto Kamera (2.5K)...",
                subtitle: isHdMode 
                    ? "Mode HD aktif: Foto disimpan tanpa kompresi dengan resolusi 100% penuh." 
                    : "Mengompresi hasil foto cerdas agar tajam, jernih, dan cepat diunggah.",
                currentFileIndex: 1,
                totalFiles: 1,
                currentFileName: newFile.name || "foto_kamera.jpg",
                currentFileType: "image",
                currentOriginalSize: newFile.size,
                currentCompressedSize: isHdMode ? newFile.size : 0,
                progressPercent: isHdMode ? 100 : 40,
                items: [{
                    name: newFile.name || "foto_kamera.jpg",
                    originalSize: newFile.size,
                    finalSize: isHdMode ? newFile.size : null,
                    isVideo: false,
                    status: isHdMode ? "done" : "processing"
                }]
            });

            try {
                if (isHdMode) {
                    finalFile = newFile;
                    await new Promise(r => setTimeout(r, 350));
                } else {
                    finalFile = await compressImage(newFile, { isHd: false, maxWidth: 2560, maxHeight: 2560, quality: 0.90 });
                    setProcessingModal(prev => ({
                        ...prev,
                        currentCompressedSize: finalFile.size,
                        progressPercent: 100,
                        stage: "done",
                        items: [{
                            name: newFile.name || "foto_kamera.jpg",
                            originalSize: newFile.size,
                            finalSize: finalFile.size,
                            isVideo: false,
                            status: "done"
                        }]
                    }));
                    await new Promise(r => setTimeout(r, 400));
                }
            } catch (err) {
                console.error("Gagal kompresi foto kamera:", err);
            } finally {
                setIsCompressing(false);
                setProcessingModal(prev => ({ ...prev, isOpen: false }));
            }
        }

        const updated = [...photos, finalFile];
        onChange(updated);
    }

    function handleRemovePhoto(index) {
        const updated = photos.filter((_, i) => i !== index);
        onChange(updated);
    }

    async function handleFileSelect(e) {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const availableSlots = maxPhotos - photos.length;
        if (availableSlots <= 0) {
            toast.error(`Maksimal ${maxPhotos} media sudah tercapai!`);
            e.target.value = "";
            return;
        }

        const filesToProcess = selectedFiles.slice(0, availableSlots);
        if (selectedFiles.length > availableSlots) {
            toast.error(`Hanya ${availableSlots} media yang ditambahkan (Maksimal ${maxPhotos} item).`);
        }

        setIsCompressing(true);

        const initialItems = filesToProcess.map(file => ({
            name: file.name,
            originalSize: file.size,
            finalSize: null,
            isVideo: isVideo(file),
            status: "pending"
        }));

        setProcessingModal({
            isOpen: true,
            stage: isHdMode ? "done" : "compressing",
            isHd: isHdMode,
            title: isHdMode ? "Menyiapkan Media HD (Kualitas Asli)..." : "Mengoptimalkan Foto (Resolusi Tinggi 2.5K)...",
            subtitle: isHdMode 
                ? `Mode HD aktif: ${filesToProcess.length} berkas disimpan kualitas penuh tanpa kompresi.`
                : `Memproses ${filesToProcess.length} berkas foto/video dengan resolusi tajam & ukuran hemat.`,
            currentFileIndex: 1,
            totalFiles: filesToProcess.length,
            currentFileName: filesToProcess[0]?.name || "",
            currentFileType: isVideo(filesToProcess[0]) ? "video" : "image",
            currentOriginalSize: filesToProcess[0]?.size || 0,
            currentCompressedSize: isHdMode ? (filesToProcess[0]?.size || 0) : 0,
            progressPercent: isHdMode ? 100 : 5,
            items: initialItems
        });

        try {
            const processedFiles = [];
            for (let i = 0; i < filesToProcess.length; i++) {
                const file = filesToProcess[i];
                const isVid = isVideo(file);

                setProcessingModal(prev => ({
                    ...prev,
                    currentFileIndex: i + 1,
                    currentFileName: file.name,
                    currentFileType: isVid ? "video" : "image",
                    currentOriginalSize: file.size,
                    currentCompressedSize: isHdMode ? file.size : 0,
                    progressPercent: isHdMode ? 100 : Math.round(((i) / filesToProcess.length) * 95) + 5,
                    items: prev.items.map((it, idx) => idx === i ? { ...it, status: "processing" } : it)
                }));

                if (isVid) {
                    // If video, check max size 100MB
                    if (file.size > 100 * 1024 * 1024) {
                        toast.error(`Video "${file.name}" melebihi batas 100 MB!`);
                        setProcessingModal(prev => ({
                            ...prev,
                            items: prev.items.map((it, idx) => idx === i ? { ...it, status: "error" } : it)
                        }));
                        continue;
                    }
                    processedFiles.push(file);
                    setProcessingModal(prev => ({
                        ...prev,
                        items: prev.items.map((it, idx) => idx === i ? { ...it, status: "done", finalSize: file.size } : it)
                    }));
                } else if (isHdMode) {
                    // In HD mode, keep original uncompressed file
                    processedFiles.push(file);
                    setProcessingModal(prev => ({
                        ...prev,
                        currentCompressedSize: file.size,
                        items: prev.items.map((it, idx) => idx === i ? { ...it, status: "done", finalSize: file.size } : it)
                    }));
                } else {
                    // Standard Mode: Smart balanced 2.5K high-res compression (anti-burik)
                    const compressed = await compressImage(file, { isHd: false, maxWidth: 2560, maxHeight: 2560, quality: 0.90 });
                    processedFiles.push(compressed);
                    setProcessingModal(prev => ({
                        ...prev,
                        currentCompressedSize: compressed.size,
                        items: prev.items.map((it, idx) => idx === i ? { ...it, status: "done", finalSize: compressed.size } : it)
                    }));
                }

                // Smooth brief pause so the UI is responsive & visually informative
                await new Promise(r => setTimeout(r, isHdMode ? 30 : 70));
            }

            setProcessingModal(prev => ({
                ...prev,
                progressPercent: 100,
                stage: "done",
                title: isHdMode ? "Media HD Siap Disimpan!" : "Semua Media Berhasil Dioptimalkan!",
                subtitle: `${processedFiles.length} berkas siap disimpan.`
            }));

            await new Promise(r => setTimeout(r, 500));

            if (processedFiles.length > 0) {
                onChange([...photos, ...processedFiles]);
                toast.success(
                    isHdMode
                        ? `${processedFiles.length} media kualitas asli HD siap disimpan!`
                        : `${processedFiles.length} media berhasil dioptimalkan & ditambahkan!`
                );
            }
        } catch (err) {
            console.error("Gagal memproses media:", err);
            toast.error("Terjadi kesalahan saat memproses media");
        } finally {
            setIsCompressing(false);
            setProcessingModal(prev => ({ ...prev, isOpen: false }));
            e.target.value = "";
        }
    }

    return (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Camera className="w-4 h-4 text-blue-600" />
                            <span>{label}</span>
                        </label>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            photos.length >= maxPhotos 
                                ? "bg-amber-100 text-amber-800 border border-amber-200" 
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                            {photos.length} / {maxPhotos} Media
                        </span>

                        {/* Interactive HD Quality Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleHdMode}
                            disabled={disabled || isCompressing}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
                                isHdMode 
                                    ? "bg-amber-500/10 text-amber-900 border-amber-300 shadow-2xs hover:bg-amber-500/20" 
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                            title={isHdMode ? "Mode HD aktif: 100% resolusi asli tanpa kompresi" : "Mode Standar Seimbang: Resolusi 2.5K tajam, kualitas 90% (anti-buram & hemat kuota)"}
                        >
                            <div className={`w-2 h-2 rounded-full transition-colors ${isHdMode ? "bg-amber-500 ring-2 ring-amber-300 animate-pulse" : "bg-slate-400"}`} />
                            <span className={`px-1.5 py-0.2 rounded text-3xs font-black uppercase tracking-wider ${
                                isHdMode ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700"
                            }`}>
                                HD
                            </span>
                            <span className="hidden sm:inline">
                                {isHdMode ? "Kualitas Asli" : "Seimbang 2.5K"}
                            </span>
                        </button>
                    </div>
                    {sublabel && (
                        <p className="text-xs text-slate-500 mt-1">
                            {isHdMode 
                                ? "Mode HD aktif: Foto & video disimpan kualitas asli tanpa kompresi (ukuran berkas penuh)." 
                                : sublabel}
                        </p>
                    )}
                </div>

                {/* Hidden Native File & Camera Inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={allowVideo ? "image/*,video/*" : "image/*"}
                    disabled={disabled || isCompressing || photos.length >= maxPhotos}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={disabled || isCompressing || photos.length >= maxPhotos}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                {allowVideo && (
                    <input
                        ref={nativeVideoInputRef}
                        type="file"
                        accept="video/*"
                        capture="environment"
                        disabled={disabled || isCompressing || photos.length >= maxPhotos}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        disabled={disabled || isCompressing || photos.length >= maxPhotos}
                        onClick={() => setIsCameraModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-40 cursor-pointer"
                        title="Buka Kamera Langsung / Webcam"
                    >
                        <Camera className="w-4 h-4" />
                        <span>Foto Kamera</span>
                    </button>

                    {/* Mobile Direct Video Shutter */}
                    {allowVideo && (
                        <button
                            type="button"
                            disabled={disabled || isCompressing || photos.length >= maxPhotos}
                            onClick={() => nativeVideoInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-600/20 disabled:opacity-40 cursor-pointer"
                            title="Rekam Video Kerusakan / Selesai Servis"
                        >
                            <Video className="w-4 h-4" />
                            <span>Rekam Video</span>
                        </button>
                    )}

                    <button
                        type="button"
                        disabled={disabled || isCompressing || photos.length >= maxPhotos}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
                        title="Pilih Foto atau Video dari Galeri"
                    >
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Pilih File</span>
                    </button>
                </div>
            </div>

            {/* Media Thumbnails Grid */}
            {photos.length === 0 ? (
                <div 
                    onClick={() => !disabled && !isCompressing && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                        Belum ada dokumentasi media
                    </p>
                    <p className="text-2xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Klik untuk memilih berkas dari galeri atau gunakan tombol Foto Kamera di atas.
                        {isHdMode 
                            ? " Mode HD Kualitas Asli aktif." 
                            : " Foto otomatis dioptimalkan resolusi tajam 2.5K."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {photos.map((item, idx) => {
                        const mediaUrl = getMediaUrl(item);
                        const isVid = isVideo(item);

                        return (
                            <div 
                                key={idx} 
                                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs"
                            >
                                {isVid ? (
                                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-2 text-white relative">
                                        <video 
                                            src={mediaUrl} 
                                            className="w-full h-full object-cover opacity-80"
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
                                                <Play className="w-4 h-4 fill-white ml-0.5" />
                                            </div>
                                        </div>
                                        <span className="absolute bottom-1 right-1 text-3xs font-mono font-bold bg-black/70 px-1 py-0.5 rounded text-slate-200">
                                            VIDEO
                                        </span>
                                    </div>
                                ) : (
                                    <img 
                                        src={mediaUrl} 
                                        alt={`Dokumentasi ${idx + 1}`} 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                                    />
                                )}

                                {/* Overlay Buttons */}
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewMedia({ url: mediaUrl, isVideo: isVid });
                                            setZoomScale(1);
                                        }}
                                        className="p-2 bg-white text-slate-900 rounded-lg shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                        title={isVid ? "Putar video" : "Perbesar detail foto"}
                                    >
                                        {isVid ? <Play className="w-4 h-4 fill-slate-900" /> : <ZoomIn className="w-4 h-4" />}
                                    </button>
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePhoto(idx)}
                                            className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                            title="Hapus media ini"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white font-mono font-bold text-3xs px-1.5 py-0.5 rounded shadow pointer-events-none">
                                    #{idx + 1}
                                </span>
                            </div>
                        );
                    })}

                    {/* Add More Slot */}
                    {!disabled && photos.length < maxPhotos && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl aspect-square flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-600 transition-all cursor-pointer group"
                            title="Tambah foto atau video"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-2xs font-bold">Tambah Media</span>
                        </button>
                    )}
                </div>
            )}

            {/* In-Browser Live Camera Capture Modal */}
            <CameraCaptureModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={handleAddPhoto}
                maxPhotos={maxPhotos}
                currentPhotos={photos}
                onRemovePhoto={handleRemovePhoto}
                title={label}
                subtitle={`Maksimal ${maxPhotos} media dapat didokumentasikan.`}
            />

            {/* Lightbox Media Preview Modal (Foto & Video with Micro-Zoom) */}
            {previewMedia && (
                <div 
                    onClick={() => {
                        setPreviewMedia(null);
                        setZoomScale(1);
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
                >
                    <div 
                        className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center select-none" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {previewMedia.isVideo ? (
                            <div className="w-full flex flex-col items-center">
                                <video 
                                    src={previewMedia.url} 
                                    controls 
                                    autoPlay 
                                    playsInline 
                                    className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl bg-black border border-white/20"
                                />
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center overflow-hidden">
                                <div 
                                    className={`relative max-w-full max-h-[78vh] overflow-auto rounded-2xl flex items-center justify-center transition-all ${
                                        zoomScale > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
                                    }`}
                                    onClick={() => setZoomScale(prev => prev === 1 ? 2 : prev === 2 ? 3 : 1)}
                                    title="Klik untuk zoom in / zoom out"
                                >
                                    <img 
                                        src={previewMedia.url} 
                                        alt="Preview Full" 
                                        style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
                                        className="max-w-full max-h-[78vh] object-contain transition-transform duration-200 ease-out"
                                    />
                                </div>

                                {/* Floating Zoom Controls Bar for High Detail Inspection */}
                                <div className="mt-3 inline-flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-2xl text-white text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setZoomScale(prev => Math.max(1, prev - 0.5))}
                                        disabled={zoomScale <= 1}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                                        title="Perkecil"
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="font-mono font-bold text-2xs min-w-[45px] text-center">
                                        {Math.round(zoomScale * 100)}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setZoomScale(prev => Math.min(3.5, prev + 0.5))}
                                        disabled={zoomScale >= 3.5}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                                        title="Perbesar Detail (Hingga 350%)"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-white/20 mx-1" />
                                    <button
                                        type="button"
                                        onClick={() => setZoomScale(1)}
                                        className="px-2 py-0.5 hover:bg-white/20 rounded-lg font-semibold text-2xs transition-colors cursor-pointer flex items-center gap-1"
                                        title="Reset Skala 100%"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setPreviewMedia(null);
                                setZoomScale(1);
                            }}
                            className="absolute -top-3 -right-3 p-2 bg-white text-slate-900 rounded-full hover:bg-slate-200 transition-colors shadow-xl cursor-pointer"
                            title="Tutup Preview"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Live Media Processing & Compression Loading Modal */}
            <MediaProcessingModal {...processingModal} isHd={isHdMode} />
        </div>
    );
}
