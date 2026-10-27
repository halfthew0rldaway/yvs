import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Camera, Upload, Trash2, X, Plus, ZoomIn, Image as ImageIcon, Video, Play, Sparkles } from "lucide-react";
import CameraCaptureModal from "./CameraCaptureModal";
import { isVideo, getMediaUrl, compressImage } from "../utils/mediaUtils";

export default function PhotoUploadSection({
    label = "Dokumentasi Foto & Video Perangkat",
    sublabel = "Unggah foto/video atau ambil langsung melalui kamera (Kompresi otomatis)",
    maxPhotos = 10,
    photos = [],
    onChange,
    disabled = false,
    allowVideo = true
}) {
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const fileInputRef = useRef(null);
    const nativeCameraInputRef = useRef(null);
    const nativeVideoInputRef = useRef(null);

    async function handleAddPhoto(newFile) {
        if (photos.length >= maxPhotos) {
            toast.error(`Maksimal ${maxPhotos} media!`);
            return;
        }

        // Auto compress if image
        let finalFile = newFile;
        if (newFile instanceof File && !isVideo(newFile)) {
            finalFile = await compressImage(newFile);
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
        const toastId = toast.loading("Mengoptimalkan & mengompresi media...");

        try {
            const processedFiles = [];
            for (const file of filesToProcess) {
                // If video, check max size 100MB
                if (isVideo(file)) {
                    if (file.size > 100 * 1024 * 1024) {
                        toast.error(`Video "${file.name}" melebihi batas 100 MB!`);
                        continue;
                    }
                    processedFiles.push(file);
                } else {
                    // WhatsApp-style automatic image compression
                    const compressed = await compressImage(file);
                    processedFiles.push(compressed);
                }
            }

            if (processedFiles.length > 0) {
                onChange([...photos, ...processedFiles]);
                toast.success(`${processedFiles.length} media berhasil ditambahkan (terkompresi)!`, { id: toastId });
            } else {
                toast.dismiss(toastId);
            }
        } catch (err) {
            console.error("Gagal memproses media:", err);
            toast.error("Terjadi kesalahan saat memproses media", { id: toastId });
        } finally {
            setIsCompressing(false);
            e.target.value = "";
        }
    }

    return (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                    <div className="flex items-center gap-2">
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
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Auto-Compress
                        </span>
                    </div>
                    {sublabel && (
                        <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>
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
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                        <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                        Klik untuk Ambil Foto, Rekam Video, atau Pilih File
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Mendukung foto JPG/PNG dan video MP4/MOV/WEBM (Auto-transcode ke streaming 720p H.264)
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pt-1">
                    {photos.map((foto, idx) => {
                        const mediaUrl = getMediaUrl(foto);
                        const isVid = isVideo(foto);

                        return (
                            <div 
                                key={idx} 
                                className="relative group bg-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-2xs aspect-square flex items-center justify-center"
                            >
                                {isVid ? (
                                    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                                        <video 
                                            src={mediaUrl} 
                                            className="w-full h-full object-cover opacity-80" 
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-xs">
                                                <Play className="w-4 h-4 fill-white ml-0.5" />
                                            </div>
                                        </div>
                                        <span className="absolute bottom-1.5 right-1.5 bg-purple-600/90 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                            <Video className="w-2.5 h-2.5" />
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
                                        onClick={() => setPreviewMedia({ url: mediaUrl, isVideo: isVid })}
                                        className="p-2 bg-white text-slate-900 rounded-lg shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                        title={isVid ? "Putar video" : "Perbesar foto"}
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

                                <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none">
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
                            <span className="text-[11px] font-bold">Tambah Media</span>
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

            {/* Lightbox Media Preview Modal (Foto & Video) */}
            {previewMedia && (
                <div 
                    onClick={() => setPreviewMedia(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
                >
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
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
                            <img 
                                src={previewMedia.url} 
                                alt="Preview Full" 
                                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => setPreviewMedia(null)}
                            className="absolute -top-3 -right-3 p-2 bg-white text-slate-900 rounded-full hover:bg-slate-200 transition-colors shadow-xl cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
