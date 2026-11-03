import { useState, useRef, useEffect, useCallback } from "react";
import { 
    X, 
    ZoomIn, 
    ZoomOut, 
    RotateCw, 
    RefreshCw, 
    Check, 
    Move,
    Sparkles
} from "lucide-react";

/**
 * High-precision, zero-slop Profile Photo Adjuster Modal.
 * Allows users to pan, zoom, and rotate their profile picture
 * before exporting a crisp 512x512 circular-framed image.
 */
export default function ProfilePhotoAdjustModal({
    imageSrc,
    onClose,
    onConfirm,
    isSubmitting = false
}) {
    const [imageObj, setImageObj] = useState(null);
    const [imageError, setImageError] = useState(false);
    
    // Transform states
    const [zoom, setZoom] = useState(1); // 1x to 3x
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270 deg
    const [isDragging, setIsDragging] = useState(false);
    
    // Viewport dimensions
    const VIEWPORT_SIZE = 300; // 300x300 px preview viewport
    const CROP_DIAMETER = 240; // 240px circular crop window
    const CROP_RADIUS = CROP_DIAMETER / 2;
    
    const dragStartRef = useRef({ x: 0, y: 0 });
    const panStartRef = useRef({ x: 0, y: 0 });
    const pinchStartDistRef = useRef(null);
    const zoomStartRef = useRef(1);

    // Live preview canvas ref
    const miniPreviewCanvasRef = useRef(null);

    // 1. Load image and compute initial scale
    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImageObj(img);
            setImageError(false);
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setRotation(0);
        };
        img.onerror = () => {
            setImageError(true);
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Calculate base scale to fully cover the crop circle
    const getBaseScale = useCallback((img, rot) => {
        if (!img) return 1;
        const isSwapped = rot === 90 || rot === 270;
        const effW = isSwapped ? img.height : img.width;
        const effH = isSwapped ? img.width : img.height;
        // Cover fit for the crop diameter
        return Math.max(CROP_DIAMETER / effW, CROP_DIAMETER / effH);
    }, [CROP_DIAMETER]);

    // Clamp pan to keep crop circle covered by image
    const clampPan = useCallback((targetPan, targetZoom, targetRot, img) => {
        if (!img) return targetPan;
        const base = getBaseScale(img, targetRot);
        const currentScale = base * targetZoom;
        
        const isSwapped = targetRot === 90 || targetRot === 270;
        const effW = (isSwapped ? img.height : img.width) * currentScale;
        const effH = (isSwapped ? img.width : img.height) * currentScale;

        const maxPanX = Math.max(0, (effW - CROP_DIAMETER) / 2);
        const maxPanY = Math.max(0, (effH - CROP_DIAMETER) / 2);

        return {
            x: Math.max(-maxPanX, Math.min(maxPanX, targetPan.x)),
            y: Math.max(-maxPanY, Math.min(maxPanY, targetPan.y)),
        };
    }, [getBaseScale, CROP_DIAMETER]);

    // 2. Mouse & Touch handlers for Panning and Pinch-to-zoom
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        panStartRef.current = { ...pan };
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !imageObj) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const nextPan = {
            x: panStartRef.current.x + dx,
            y: panStartRef.current.y + dy,
        };
        setPan(clampPan(nextPan, zoom, rotation, imageObj));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Wheel to Zoom
    const handleWheel = (e) => {
        e.preventDefault();
        if (!imageObj) return;
        const zoomDelta = -e.deltaY * 0.0015;
        const nextZoom = Math.max(1, Math.min(3, zoom + zoomDelta));
        setZoom(nextZoom);
        setPan(prev => clampPan(prev, nextZoom, rotation, imageObj));
    };

    // Touch handlers for mobile/trackpad pinch
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            panStartRef.current = { ...pan };
            pinchStartDistRef.current = null;
        } else if (e.touches.length === 2) {
            setIsDragging(false);
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            pinchStartDistRef.current = dist;
            zoomStartRef.current = zoom;
        }
    };

    const handleTouchMove = (e) => {
        if (!imageObj) return;
        if (e.touches.length === 1 && isDragging) {
            const dx = e.touches[0].clientX - dragStartRef.current.x;
            const dy = e.touches[0].clientY - dragStartRef.current.y;
            const nextPan = {
                x: panStartRef.current.x + dx,
                y: panStartRef.current.y + dy,
            };
            setPan(clampPan(nextPan, zoom, rotation, imageObj));
        } else if (e.touches.length === 2 && pinchStartDistRef.current) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = dist / pinchStartDistRef.current;
            const nextZoom = Math.max(1, Math.min(3, zoomStartRef.current * factor));
            setZoom(nextZoom);
            setPan(prev => clampPan(prev, nextZoom, rotation, imageObj));
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        pinchStartDistRef.current = null;
    };

    // Rotate 90 degrees
    const handleRotate = () => {
        if (!imageObj) return;
        const nextRot = (rotation + 90) % 360;
        setRotation(nextRot);
        setPan(prev => clampPan(prev, zoom, nextRot, imageObj));
    };

    // Reset transforms
    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
    };

    // 3. Render real-time mini avatar preview
    useEffect(() => {
        if (!imageObj || !miniPreviewCanvasRef.current) return;
        const canvas = miniPreviewCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = canvas.width;
        ctx.clearRect(0, 0, size, size);

        // Circular clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Scale factor from crop window to mini canvas
        const factor = size / CROP_DIAMETER;
        const base = getBaseScale(imageObj, rotation);
        const currentScale = base * zoom * factor;

        ctx.translate(size / 2 + pan.x * factor, size / 2 + pan.y * factor);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(currentScale, currentScale);
        ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);
        ctx.restore();
    }, [imageObj, zoom, pan, rotation, getBaseScale, CROP_DIAMETER]);

    // 4. Generate final 512x512 high-resolution cropped file
    const handleConfirmCrop = async () => {
        if (!imageObj) return;

        const OUTPUT_SIZE = 512;
        const outCanvas = document.createElement("canvas");
        outCanvas.width = OUTPUT_SIZE;
        outCanvas.height = OUTPUT_SIZE;
        const ctx = outCanvas.getContext("2d");
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw cropped circle onto canvas
        ctx.save();
        ctx.beginPath();
        ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Ratio from interactive preview crop circle to final 512px output
        const factor = OUTPUT_SIZE / CROP_DIAMETER;
        const base = getBaseScale(imageObj, rotation);
        const currentScale = base * zoom * factor;

        ctx.translate(OUTPUT_SIZE / 2 + pan.x * factor, OUTPUT_SIZE / 2 + pan.y * factor);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(currentScale, currentScale);
        ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);
        ctx.restore();

        // Export as WebP (fallback JPEG) Blob
        outCanvas.toBlob(
            (blob) => {
                if (!blob) return;
                const file = new File([blob], `avatar_${Date.now()}.webp`, {
                    type: "image/webp",
                    lastModified: Date.now(),
                });
                onConfirm(file);
            },
            "image/webp",
            0.92
        );
    };

    // Calculate current transform for the interactive viewport
    const baseScale = imageObj ? getBaseScale(imageObj, rotation) : 1;
    const currentScale = baseScale * zoom;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs select-none animate-in fade-in duration-200"
            onMouseUp={handleMouseUp}
            onTouchEnd={handleTouchEnd}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Sesuaikan Foto Profil
                            </h3>
                            <p className="text-3xs text-slate-500">
                                Geser dan perbesar untuk posisi yang pas di lingkaran avatar
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                        title="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Interactive Crop Viewport */}
                <div className="p-5 flex flex-col items-center bg-slate-900/5">
                    <div
                        className="relative overflow-hidden rounded-2xl bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none shadow-inner"
                        style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onWheel={handleWheel}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                    >
                        {/* The Image Layer */}
                        {imageObj && !imageError && (
                            <img
                                src={imageObj.src}
                                alt="Crop target"
                                draggable={false}
                                className="pointer-events-none absolute will-change-transform max-w-none origin-center"
                                style={{
                                    width: `${imageObj.width}px`,
                                    height: `${imageObj.height}px`,
                                    transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${currentScale})`,
                                }}
                            />
                        )}

                        {/* Circular Vignette Mask & Rule-of-Thirds Grid */}
                        <div 
                            className="absolute inset-0 pointer-events-none flex items-center justify-center"
                        >
                            {/* Circular hole with darkened surrounding mask */}
                            <div
                                className="relative rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.68)] transition-colors"
                                style={{
                                    width: `${CROP_DIAMETER}px`,
                                    height: `${CROP_DIAMETER}px`,
                                }}
                            >
                                {/* Subtle Rule-of-Thirds Grid (Appears during interaction or hover) */}
                                <div className={`absolute inset-0 rounded-full overflow-hidden transition-opacity duration-200 ${isDragging ? "opacity-40" : "opacity-20 hover:opacity-30"}`}>
                                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/70" />
                                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/70" />
                                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/70" />
                                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/70" />
                                </div>
                            </div>
                        </div>

                        {/* Drag Gesture Hint Pill */}
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white/90 text-3xs font-medium flex items-center gap-1.5 pointer-events-none border border-white/10 shadow-xs">
                            <Move className="w-3 h-3 text-blue-400" />
                            <span>Geser foto untuk memposisikan</span>
                        </div>
                    </div>
                </div>

                {/* Controls Bar: Zoom Slider & Actions */}
                <div className="px-5 py-4 space-y-3.5 border-t border-slate-100 bg-white">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                const next = Math.max(1, zoom - 0.2);
                                setZoom(next);
                                if (imageObj) setPan(prev => clampPan(prev, next, rotation, imageObj));
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Perkecil"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>

                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onChange={(e) => {
                                    const next = parseFloat(e.target.value);
                                    setZoom(next);
                                    if (imageObj) setPan(prev => clampPan(prev, next, rotation, imageObj));
                                }}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
                            />
                            <span className="text-3xs font-mono font-semibold text-slate-500 w-9 text-right">
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const next = Math.min(3, zoom + 0.2);
                                setZoom(next);
                                if (imageObj) setPan(prev => clampPan(prev, next, rotation, imageObj));
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Perbesar"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Secondary Actions (Rotate, Reset) & Mini Live Preview */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRotate}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Putar 90 Derajat"
                            >
                                <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                                <span>Putar</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Kembalikan ke posisi awal"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                        </div>

                        {/* Real-time Circular Mini Preview */}
                        <div className="flex items-center gap-2 pl-2">
                            <span className="text-3xs font-medium text-slate-400">Hasil:</span>
                            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/30 bg-slate-100 shadow-2xs">
                                <canvas
                                    ref={miniPreviewCanvasRef}
                                    width={72}
                                    height={72}
                                    className="w-full h-full block"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer with Actions */}
                <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmCrop}
                        disabled={isSubmitting || !imageObj || imageError}
                        className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                <span>Terapkan Foto</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
