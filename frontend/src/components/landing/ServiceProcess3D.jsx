import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 240;

// Format frame index as 3-digit zero-padded number (001 to 240)
const getFrameSrc = (index) => {
    const padIndex = String(index + 1).padStart(3, "0");
    return `/frames/${padIndex}.webp`;
};

export default function ServiceProcess3D() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [isInitialReady, setIsInitialReady] = useState(false);

    // References for frame images and animation state
    const framesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
    const loadedCountRef = useRef(0);
    const targetProgress = useRef(0);
    const currentProgress = useRef(0);
    const animFrameId = useRef(null);
    const lastDrawnFrame = useRef(-1);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        // HiDPI canvas resizing
        const resizeCanvas = () => {
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            if (w === 0 || h === 0) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = w * dpr;
            canvas.height = h * dpr;

            // Trigger redraw on resize
            lastDrawnFrame.current = -1;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Find best available frame to draw (exact frame or closest loaded frame)
        const getBestFrame = (targetIdx) => {
            if (framesRef.current[targetIdx]?.complete && framesRef.current[targetIdx]?.naturalWidth > 0) {
                return framesRef.current[targetIdx];
            }

            // Search outward for the nearest loaded frame
            for (let dist = 1; dist < TOTAL_FRAMES; dist++) {
                const prev = targetIdx - dist;
                if (prev >= 0 && framesRef.current[prev]?.complete && framesRef.current[prev]?.naturalWidth > 0) {
                    return framesRef.current[prev];
                }
                const next = targetIdx + dist;
                if (next < TOTAL_FRAMES && framesRef.current[next]?.complete && framesRef.current[next]?.naturalWidth > 0) {
                    return framesRef.current[next];
                }
            }
            return null;
        };

        // Draw given frame index to canvas with aspect ratio preservation (contain)
        const renderFrame = (targetIdx) => {
            const img = getBestFrame(targetIdx);
            if (!img) return;

            const cw = canvas.width;
            const ch = canvas.height;
            const iw = img.naturalWidth || 1920;
            const ih = img.naturalHeight || 1080;

            const canvasAspect = cw / ch;
            const imgAspect = iw / ih;

            let dw, dh, dx, dy;
            if (canvasAspect > imgAspect) {
                dh = ch;
                dw = ch * imgAspect;
                dx = (cw - dw) / 2;
                dy = 0;
            } else {
                dw = cw;
                dh = cw / imgAspect;
                dx = 0;
                dy = (ch - dh) / 2;
            }

            // Clean background fill matching the video studio background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, cw, ch);
            ctx.drawImage(img, dx, dy, dw, dh);
            lastDrawnFrame.current = targetIdx;
        };

        // Load Frame 1 immediately for instant display
        const firstFrame = new Image();
        firstFrame.src = getFrameSrc(0);
        firstFrame.onload = () => {
            framesRef.current[0] = firstFrame;
            loadedCountRef.current += 1;
            renderFrame(0);
            setIsInitialReady(true);
        };

        // Concurrently load the remaining frames
        for (let i = 1; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFrameSrc(i);
            img.onload = () => {
                framesRef.current[i] = img;
                loadedCountRef.current += 1;
            };
        }

        // Scroll listener (Maps scroll position to 0.0 - 1.0 progress)
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const scrollable = containerRef.current.offsetHeight - window.innerHeight;
            if (scrollable <= 0) return;

            const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
            targetProgress.current = progress;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        // 60fps/120fps physics-lerp render loop
        const animate = () => {
            animFrameId.current = requestAnimationFrame(animate);

            // Responsive smooth interpolation
            const diff = targetProgress.current - currentProgress.current;
            if (Math.abs(diff) > 0.0001) {
                currentProgress.current += diff * 0.16;
            } else {
                currentProgress.current = targetProgress.current;
            }

            const frameIdx = Math.min(
                TOTAL_FRAMES - 1,
                Math.max(0, Math.round(currentProgress.current * (TOTAL_FRAMES - 1)))
            );

            if (frameIdx !== lastDrawnFrame.current) {
                renderFrame(frameIdx);
            }
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("scroll", handleScroll);
            if (animFrameId.current) {
                cancelAnimationFrame(animFrameId.current);
            }
        };
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-white"
            style={{ height: "400vh" }}
            id="service-workflow"
        >
            {/* Sticky 100vh viewport container */}
            <div className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden bg-white">
                {/* Scroll-driven Frame Canvas */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block"
                    style={{ touchAction: "pan-y" }}
                />

                {/* Subtle loading indicator before initial frame is ready */}
                {!isInitialReady && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-xs transition-opacity duration-300">
                        <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </section>
    );
}
