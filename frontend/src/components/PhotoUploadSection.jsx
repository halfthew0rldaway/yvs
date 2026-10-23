import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Camera, Upload, Trash2, X, Plus, ZoomIn, Image as ImageIcon } from "lucide-react";
import CameraCaptureModal from "./CameraCaptureModal";

export default function PhotoUploadSection({
    label = "Foto Dokumentasi Perangkat",
    sublabel = "Unggah foto atau ambil foto langsung melalui kamera",
    maxPhotos = 10,
    photos = [],
    onChange,
    disabled = false
}) {
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const fileInputRef = useRef(null);
    const nativeCameraInputRef = useRef(null);

    function handleAddPhoto(newFile) {
        if (photos.length >= maxPhotos) {
            toast.error(`Maksimal ${maxPhotos} foto!`);
            return;
        }
        const updated = [...photos, newFile];
        onChange(updated);
    }

    function handleRemovePhoto(index) {
        const updated = photos.filter((_, i) => i !== index);
        onChange(updated);
    }

    function handleFileSelect(e) {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const availableSlots = maxPhotos - photos.length;
        if (availableSlots <= 0) {
            toast.error(`Maksimal ${maxPhotos} foto sudah tercapai!`);
            e.target.value = "";
            return;
        }

        const filesToAdd = selectedFiles.slice(0, availableSlots);
        if (selectedFiles.length > availableSlots) {
            toast.error(`Hanya ${availableSlots} foto yang ditambahkan (Maksimal ${maxPhotos} foto).`);
        }

        const updated = [...photos, ...filesToAdd];
        onChange(updated);
        e.target.value = "";
    }

    function getPhotoSrc(photo) {
        if (!photo) return "";
        if (typeof photo === "string") {
            return photo.startsWith("http") || photo.startsWith("data:") ? photo : `/${photo.replace(/^\/+/, "")}`;
        }
        return URL.createObjectURL(photo);
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
                            {photos.length} / {maxPhotos} Foto
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
                    accept="image/*"
                    disabled={disabled || photos.length >= maxPhotos}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={disabled || photos.length >= maxPhotos}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        disabled={disabled || photos.length >= maxPhotos}
                        onClick={() => setIsCameraModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-40 cursor-pointer"
                        title="Buka Kamera Langsung / Webcam"
                    >
                        <Camera className="w-4 h-4" />
                        <span>Foto Langsung (Kamera)</span>
                    </button>

                    {/* Mobile Camera Direct Shutter */}
                    <button
                        type="button"
                        disabled={disabled || photos.length >= maxPhotos}
                        onClick={() => nativeCameraInputRef.current?.click()}
                        className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-40 cursor-pointer"
                        title="Buka Kamera Bawaan HP"
                    >
                        <Camera className="w-4 h-4" />
                        <span>Kamera HP</span>
                    </button>

                    <button
                        type="button"
                        disabled={disabled || photos.length >= maxPhotos}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
                        title="Pilih File dari Komputer / Galeri"
                    >
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Pilih File</span>
                    </button>
                </div>
            </div>

            {/* Photo Thumbnails Grid */}
            {photos.length === 0 ? (
                <div 
                    onClick={() => !disabled && setIsCameraModalOpen(true)}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                        <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                        Klik untuk Buka Kamera Langsung atau Pilih File
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Mendukung jepret kamera langsung webcam/HP atau unggah foto JPG/PNG (Maksimal {maxPhotos} foto)
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 pt-1">
                    {photos.map((foto, idx) => (
                        <div 
                            key={idx} 
                            className="relative group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs aspect-square flex items-center justify-center"
                        >
                            <img 
                                src={getPhotoSrc(foto)} 
                                alt={`Dokumentasi ${idx + 1}`} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                            />
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setPreviewImage(getPhotoSrc(foto))}
                                    className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                                    title="Perbesar foto"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(idx)}
                                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                                        title="Hapus foto ini"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <span className="absolute top-1.5 left-1.5 bg-slate-900/75 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none">
                                #{idx + 1}
                            </span>
                        </div>
                    ))}

                    {/* Add More Slot (if < maxPhotos) */}
                    {!disabled && photos.length < maxPhotos && (
                        <button
                            type="button"
                            onClick={() => setIsCameraModalOpen(true)}
                            className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl aspect-square flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-600 transition-all cursor-pointer group"
                            title="Tambah foto dari kamera"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold">Tambah Foto</span>
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
                subtitle={`Maksimal ${maxPhotos} foto dapat didokumentasikan.`}
            />

            {/* Lightbox Image Preview Modal */}
            {previewImage && (
                <div 
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in cursor-zoom-out"
                >
                    <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={previewImage} 
                            alt="Preview Full" 
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
                        />
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-3 -right-3 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

