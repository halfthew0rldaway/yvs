import { useEffect, useRef, useState } from "react";
import { Search, ArrowDown, MessageCircle } from "lucide-react";

const TOTAL_FRAMES = 240;

// Format frame index as 3-digit zero-padded number (001 to 240)
const getFrameSrc = (index) => {
    const padIndex = String(index + 1).padStart(3, "0");
    return `/frames/${padIndex}.webp`;
};

const STORY_STAGES = [
    {
        id: "intro",
        range: [0.00, 0.16],
        eyebrow: "YANGVERSA COMPUTER · KOMPUTERAWET.COM",
        title: "Teman Terpercaya Merawat & Memperbaiki Komputer Anda.",
        body: "Pusat servis laptop, PC, dan MacBook di Pekayon, Bekasi. Fokus kami sederhana: solusi jujur, konsultasi transparan, dan pengerjaan yang rapi agar perangkat Anda awet digunakan.",
        badge: "Konsultasi Terbuka",
        showHeroCTA: true,
    },
    {
        id: "inspection",
        range: [0.16, 0.32],
        eyebrow: "01 // PENGECEKAN JUJUR & DETAIL",
        title: "Pengecekan Tuntas, Estimasi Biaya Dulu Tanpa Paksaan.",
        body: "Sebelum perbaikan dimulai, kami periksa akar masalahnya dan jelaskan secara terbuka kepada Anda. Tidak ada biaya siluman—jika estimasi biaya tidak disetujui, perangkat bisa diambil kembali tanpa biaya cek.",
        badge: "Bebas Biaya Cek",
    },
    {
        id: "hardware",
        range: [0.32, 0.48],
        eyebrow: "02 // PERBAIKAN & PERAWATAN BERKALA",
        title: "Dari Ganti Thermal Paste, Engsel, Hingga Masalah Motherboard.",
        body: "Menangani laptop lemot, panas berlebih, engsel patah, layar pecah, mati total, hingga upgrade SSD dan RAM. Setiap part copotan atau bekas kami kembalikan utuh ke tangan Anda.",
        badge: "Sparepart Transparan",
    },
    {
        id: "quality",
        range: [0.48, 0.65],
        eyebrow: "03 // UJI KELAYAKAN & FINISHING",
        title: "Dites Kestabilannya Sebelum Diserahkan Kembali.",
        body: "Setiap unit dibersihkan dengan rapi dan diuji suhunya agar tidak lagi overheat atau sering hang saat dipakai bekerja. Kami pastikan perangkat benar-benar siap dan nyaman digunakan.",
        badge: "Pengujian Suhu & Stabilitas",
    },
    {
        id: "ready",
        range: [0.65, 1.00],
        eyebrow: "04 // LACAK PROGRES & GARANSI JELAS",
        title: "Pantau Progres Servis Kapan Saja, Disertai Garansi Jelas.",
        body: "Anda bisa memantau foto kondisi, riwayat pengerjaan, dan status garansi secara langsung melalui portal pelacakan ini tanpa harus bolak-balik tanya ke toko.",
        badge: "Garansi Resmi Servis",
        showFinalCTA: true,
    },
];

export default function ServiceProcess3D({ onTrackClick }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [isInitialReady, setIsInitialReady] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [activeStage, setActiveStage] = useState(0);
    const [showFloatingTrack, setShowFloatingTrack] = useState(false);

    // References for frames and smooth animation loop
    const framesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
    const targetProgress = useRef(0);
    const currentFrame = useRef(0);
    const animFrameId = useRef(null);
    const activeStageRef = useRef(0);
    const showFloatingRef = useRef(false);
    const lastRenderedFrame = useRef(-1);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        // Find best available frame to draw (exact frame or closest loaded frame)
        const getBestFrame = (targetIdx) => {
            const clampedIdx = Math.min(TOTAL_FRAMES - 1, Math.max(0, targetIdx));
            if (framesRef.current[clampedIdx]?.complete && framesRef.current[clampedIdx]?.naturalWidth > 0) {
                return framesRef.current[clampedIdx];
            }

            for (let dist = 1; dist < TOTAL_FRAMES; dist++) {
                const prev = clampedIdx - dist;
                if (prev >= 0 && framesRef.current[prev]?.complete && framesRef.current[prev]?.naturalWidth > 0) {
                    return framesRef.current[prev];
                }
                const next = clampedIdx + dist;
                if (next < TOTAL_FRAMES && framesRef.current[next]?.complete && framesRef.current[next]?.naturalWidth > 0) {
                    return framesRef.current[next];
                }
            }
            return null;
        };

        // Razor-sharp single frame renderer (Zero ghosting, zero double edges)
        const drawFrame = (frameIdx) => {
            const img = getBestFrame(frameIdx);
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

            // Desktop layout enhancement: gently shift visual rightward to create space for text column
            if (window.innerWidth >= 1024 && canvasAspect > 1.35) {
                const availableSpace = (cw - dw) / 2;
                const shift = Math.min(availableSpace * 0.65, cw * 0.08);
                dx += shift;
            }

            // Integer pixel rounding prevents sub-pixel antialiasing blur
            dx = Math.round(dx);
            dy = Math.round(dy);
            dw = Math.round(dw);
            dh = Math.round(dh);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Clean background fill matching the studio white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, cw, ch);

            // Draw crisp single frame
            ctx.drawImage(img, dx, dy, dw, dh);
        };

        // HiDPI canvas resizing
        const resizeCanvas = () => {
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            if (w === 0 || h === 0) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);

            if (lastRenderedFrame.current >= 0) {
                drawFrame(lastRenderedFrame.current);
            }
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Sequential batch preloader: loads frames in orderly chunks of 8
        // Ensures earlier frames are ready first and prevents out-of-order network stalling
        let isCancelled = false;

        const loadFrameSequence = async () => {
            // 1. Load initial frame immediately
            const firstImg = new Image();
            firstImg.src = getFrameSrc(0);
            await new Promise((res) => {
                firstImg.onload = res;
                firstImg.onerror = res;
            });
            if (isCancelled) return;

            framesRef.current[0] = firstImg;
            drawFrame(0);
            lastRenderedFrame.current = 0;
            setIsInitialReady(true);
            setLoadProgress(1);

            // 2. Stream in batches of 8 frames sequentially
            let loaded = 1;
            const batchSize = 8;

            for (let i = 1; i < TOTAL_FRAMES; i += batchSize) {
                if (isCancelled) return;
                const batchPromises = [];

                for (let j = i; j < Math.min(i + batchSize, TOTAL_FRAMES); j++) {
                    const img = new Image();
                    img.src = getFrameSrc(j);
                    const p = new Promise((resolve) => {
                        img.onload = () => {
                            framesRef.current[j] = img;
                            loaded++;
                            setLoadProgress(Math.round((loaded / TOTAL_FRAMES) * 100));
                            if (lastRenderedFrame.current === j) {
                                drawFrame(j);
                            }
                            resolve();
                        };
                        img.onerror = () => {
                            loaded++;
                            setLoadProgress(Math.round((loaded / TOTAL_FRAMES) * 100));
                            resolve();
                        };
                    });
                    batchPromises.push(p);
                }

                await Promise.all(batchPromises);
            }
        };

        loadFrameSequence();

        // Scroll listener (Maps container scroll position to 0.0 - 1.0)
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

        // 60-120fps Cinema-Grade Physics Loop with Velocity Governor
        // Prevents frame teleporting during aggressive scrolling while maintaining high-speed fluidity
        let lastTime = performance.now();

        const animate = (time) => {
            animFrameId.current = requestAnimationFrame(animate);

            const dt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            // Video completes disassembly at 65% of the scroll track.
            // The remaining 35% (~1.5 to 2 full viewport scrolls) keeps the completely
            // disassembled state locked in view before seamlessly unpinning to the next section.
            const VIDEO_COMPLETE_PROGRESS = 0.65;
            const rawVideoProgress = Math.min(1.0, targetProgress.current / VIDEO_COMPLETE_PROGRESS);
            const target = rawVideoProgress * (TOTAL_FRAMES - 1);
            const frameDiff = target - currentFrame.current;

            if (Math.abs(frameDiff) > 0.005) {
                // Responsive base speed (lambda = 10.0 for snappy yet natural feel)
                const lerpFactor = 1 - Math.exp(-10.0 * dt);
                let step = frameDiff * lerpFactor;

                // Velocity Governor: Caps max speed to ~135 frames/sec
                // At 60Hz: advances ~2.2 frames/tick
                // At 120Hz ProMotion: advances ~1.1 frames/tick (every single frame rendered!)
                // Eliminates teleporting/slideshow effect during fast flicks
                const maxStep = 135 * dt;
                if (Math.abs(step) > maxStep) {
                    step = Math.sign(step) * maxStep;
                }

                currentFrame.current += step;
            } else {
                currentFrame.current = target;
            }

            // Sync storytelling stages to overall scroll progress
            const p = targetProgress.current;

            // Update active stage with zero unnecessary React re-renders
            let nextStage = 0;
            for (let i = 0; i < STORY_STAGES.length; i++) {
                if (p >= STORY_STAGES[i].range[0] && p < STORY_STAGES[i].range[1]) {
                    nextStage = i;
                    break;
                }
            }
            if (p >= STORY_STAGES[STORY_STAGES.length - 1].range[0]) {
                nextStage = STORY_STAGES.length - 1;
            }

            if (nextStage !== activeStageRef.current) {
                activeStageRef.current = nextStage;
                setActiveStage(nextStage);
            }

            // Floating quick-track button toggle (visible between 15% and 95%)
            const shouldShowFloat = p > 0.15 && p < 0.98;
            if (shouldShowFloat !== showFloatingRef.current) {
                showFloatingRef.current = shouldShowFloat;
                setShowFloatingTrack(shouldShowFloat);
            }

            // Render active frame continuously at 60-120fps
            const renderIndex = Math.min(
                Math.max(0, Math.round(currentFrame.current)),
                TOTAL_FRAMES - 1
            );

            if (renderIndex !== lastRenderedFrame.current) {
                lastRenderedFrame.current = renderIndex;
                drawFrame(renderIndex);
            }
        };

        animFrameId.current = requestAnimationFrame(animate);

        return () => {
            isCancelled = true;
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("scroll", handleScroll);
            if (animFrameId.current) {
                cancelAnimationFrame(animFrameId.current);
            }
        };
    }, []);

    const currentStage = STORY_STAGES[activeStage] || STORY_STAGES[0];

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-white"
            style={{ height: "540vh" }}
            id="service-workflow"
        >
            {/* Sticky 100vh viewport container */}
            <div className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden bg-white">
                {/* 1. Top Preload Progress Bar (Fades out when 100% buffered) */}
                {loadProgress < 100 && (
                    <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-slate-100 overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-200"
                            style={{ width: `${loadProgress}%` }}
                        />
                    </div>
                )}

                {/* 2. Scroll-driven Canvas Centerpiece */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block"
                    style={{ touchAction: "pan-y" }}
                />

                {/* 3. Desktop & Tablet Storytelling Column (Non-obstructive left placement) */}
                <div className="hidden lg:flex absolute inset-y-0 left-0 z-20 flex-col justify-center pointer-events-none p-8 lg:pl-16 lg:pr-8 max-w-xl xl:max-w-2xl">
                    <div className="pointer-events-auto transition-all duration-300">
                        <div className="bg-white/92 backdrop-blur-md border border-slate-200/90 rounded-2xl p-7 lg:p-9 shadow-sm space-y-4">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                <span className="font-mono text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                    {currentStage.eyebrow}
                                </span>
                            </div>

                            <h2 className="font-display font-bold text-2xl lg:text-3xl xl:text-4xl text-slate-900 tracking-tight leading-[1.18]">
                                {currentStage.title}
                            </h2>

                            <p className="font-sans text-slate-600 text-sm lg:text-base leading-relaxed">
                                {currentStage.body}
                            </p>

                            {/* Stage Action Buttons */}
                            {currentStage.showHeroCTA ? (
                                <div className="pt-2 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onTrackClick}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-semibold text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
                                    >
                                        <Search className="w-4 h-4" />
                                        Lacak Status Servis
                                    </button>
                                    <a
                                        href="https://wa.me/6281234567890?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-medium text-sm transition-all"
                                    >
                                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                                        Konsultasi WA
                                    </a>
                                </div>
                            ) : currentStage.showFinalCTA ? (
                                <div className="pt-2 space-y-2">
                                    <button
                                        type="button"
                                        onClick={onTrackClick}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-semibold text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
                                    >
                                        <Search className="w-4 h-4" />
                                        Buka Formulir Pelacakan
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5 pt-0.5">
                                        <span>↓</span>
                                        <span>Gulir ke bawah untuk langsung membuka formulir pelacakan</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="pt-1 flex items-center gap-2 text-xs font-mono text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <span>Scroll ke bawah untuk melanjutkan alur pengerjaan</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Mobile Storytelling Card (Docked at Bottom) */}
                <div className="lg:hidden absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-md space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                                {currentStage.eyebrow}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                                0{activeStage + 1} / 0{STORY_STAGES.length}
                            </span>
                        </div>
                        <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-snug">
                            {currentStage.title}
                        </h3>
                        <p className="font-sans text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {currentStage.body}
                        </p>
                        <button
                            type="button"
                            onClick={onTrackClick}
                            className="w-full mt-1.5 py-2 px-3 rounded-lg bg-blue-600 text-white font-sans text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <Search className="w-3.5 h-3.5" />
                            Lacak Status Servis
                        </button>
                    </div>
                </div>

                {/* 5. Persistent Floating Quick-Track Action */}
                <div
                    className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
                        showFloatingTrack
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 translate-y-4 pointer-events-none"
                    }`}
                >
                    <button
                        type="button"
                        onClick={onTrackClick}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all cursor-pointer border border-blue-500/30"
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span>Lacak Tiket Servis</span>
                    </button>
                </div>

                {/* Subtle initial spinner */}
                {!isInitialReady && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-xs transition-opacity duration-300">
                        <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </section>
    );
}
