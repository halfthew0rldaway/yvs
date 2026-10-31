import { useEffect, useRef, useState } from "react";
import { Search, MessageCircle, Clock, ShieldCheck, ChevronRight } from "lucide-react";

const TOTAL_FRAMES = 240;

const getFrameSrc = (index) => {
    const padIndex = String(index + 1).padStart(3, "0");
    return `/frames/${padIndex}.webp`;
};

const STORY_STAGES = [
    {
        id: "intro",
        range: [0.00, 0.12],
        eyebrow: "KOMPUTERAWET.COM · YANGVERSA COMPUTER",
        title: "Teman Terpercaya Merawat & Memperbaiki Komputer Anda.",
        body: "Pusat spesialis servis laptop, PC Desktop, dan MacBook di Pekayon, Bekasi. Fokus kami sederhana: solusi jujur, konsultasi transparan, dan pengerjaan yang rapi agar perangkat Anda awet digunakan.",
        badge: "Buka Setiap Hari 09–18 WIB",
    },
    {
        id: "inspection",
        range: [0.12, 0.25],
        eyebrow: "TAHAP 01 · PEMERIKSAAN DETAIL",
        title: "Pengecekan Tuntas, Estimasi Biaya Dulu Tanpa Paksaan.",
        body: "Sebelum perbaikan dimulai, teknisi memeriksa akar masalah hingga ke level mikroskopis dan menjelaskan secara terbuka. Jika estimasi biaya tidak disetujui, perangkat bisa diambil kembali tanpa biaya cek.",
        badge: "Bebas Biaya Cek",
    },
    {
        id: "hardware",
        range: [0.25, 0.38],
        eyebrow: "TAHAP 02 · PERBAIKAN & PENGGANTIAN SUKU CADANG",
        title: "Dari Ganti Thermal Paste, Engsel, Hingga Masalah Motherboard.",
        body: "Menangani laptop lemot, panas berlebih, engsel patah, layar pecah, mati total, hingga upgrade SSD dan RAM. Setiap part copotan atau bekas kami kembalikan utuh ke tangan Anda.",
        badge: "Sparepart Transparan",
    },
    {
        id: "quality",
        range: [0.38, 0.50],
        eyebrow: "TAHAP 03 · PENGUJIAN STABILITAS & SUHU",
        title: "Dites Kestabilannya Sebelum Diserahkan Kembali.",
        body: "Setiap unit dibersihkan dengan rapi dan diuji suhunya agar tidak lagi overheat atau sering hang saat dipakai bekerja. Kami pastikan perangkat benar-benar siap dan nyaman digunakan.",
        badge: "Pengujian Suhu & Stabilitas",
    },
    {
        id: "ready",
        range: [0.50, 1.00],
        eyebrow: "TAHAP 04 · SERAH TERIMA & GARANSI RESMI",
        title: "Pantau Progres Servis Kapan Saja, Disertai Garansi Jelas.",
        body: "Anda bisa memantau foto kondisi, riwayat pengerjaan, dan status garansi secara langsung melalui portal pelacakan ini tanpa harus bolak-balik tanya ke toko.",
        badge: "Garansi Resmi Servis",
    },
];

export default function ServiceProcess3D({ onTrackClick }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [isInitialReady, setIsInitialReady] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [activeStage, setActiveStage] = useState(0);

    const framesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
    const targetProgress = useRef(0);
    const currentFrame = useRef(0);
    const animFrameId = useRef(null);
    const activeStageRef = useRef(0);
    const lastRenderedFrame = useRef(-1);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

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

        // Razor-sharp single frame renderer (Zero ghosting, 100% full-screen blend-in)
        const drawFrame = (frameIdx) => {
            const img = getBestFrame(frameIdx);
            if (!img) return;

            const cw = canvas.width;
            const ch = canvas.height;
            if (cw === 0 || ch === 0) return;

            const iw = img.naturalWidth || 1920;
            const ih = img.naturalHeight || 1080;

            const canvasAspect = cw / ch;
            const imgAspect = iw / ih;

            let dw, dh, dx, dy;
            const isDesktopOrTablet = window.innerWidth >= 768;

            if (!isDesktopOrTablet) {
                // Mobile portrait/landscape: keep laptop centered or slightly upward above the docked card
                if (canvasAspect < 1.0) {
                    dw = cw;
                    dh = cw / imgAspect;
                    dx = 0;
                    dy = Math.max(0, (ch - dh) * 0.28);
                } else {
                    dh = ch * 0.90;
                    dw = dh * imgAspect;
                    dx = (cw - dw) / 2;
                    dy = (ch - dh) / 2;
                }
            } else {
                // Desktop & iPad layout: shift the 3D laptop cleanly rightward so the left text column has zero collision
                dh = Math.min(ch * 0.94, ch);
                dw = dh * imgAspect;
                if (dw > cw * 1.15) {
                    dw = cw * 1.15;
                    dh = dw / imgAspect;
                }
                dy = (ch - dh) / 2;

                // Center of hardware in source image is at x ≈ 0.52 * iw.
                // Position hardware center intentionally on the right side of the canvas:
                let targetCenterX;
                if (cw >= 1280) {
                    targetCenterX = cw * 0.65;
                } else if (cw >= 1024) {
                    targetCenterX = cw * 0.62;
                } else {
                    targetCenterX = cw * 0.58;
                }

                dx = targetCenterX - dw * 0.52;

                // Ensure hardware right edge (at ~0.78 * dw) has breathing room and never clips
                const hardwareRightMax = cw - 24;
                if (dx + dw * 0.78 > hardwareRightMax) {
                    dx = hardwareRightMax - dw * 0.78;
                }
            }

            dx = Math.round(dx);
            dy = Math.round(dy);
            dw = Math.round(dw);
            dh = Math.round(dh);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Clean background fill matching the studio pure white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, cw, ch);

            // Draw full-bleed frame
            ctx.drawImage(img, dx, dy, dw, dh);
        };

        // HiDPI full-screen canvas resizing
        const resizeCanvas = () => {
            if (!canvas) return;
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

        let isCancelled = false;

        const loadFrameSequence = async () => {
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

        let lastTime = performance.now();

        const animate = (time) => {
            animFrameId.current = requestAnimationFrame(animate);

            const dt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            // Video completes disassembly at 48% of the scroll track.
            // The remaining 52% (~3.4 full viewport scrolls) keeps the completely
            // disassembled state locked in view before seamlessly unpinning to the next section.
            const VIDEO_COMPLETE_PROGRESS = 0.48;
            const rawVideoProgress = Math.min(1.0, targetProgress.current / VIDEO_COMPLETE_PROGRESS);
            const target = rawVideoProgress * (TOTAL_FRAMES - 1);
            const frameDiff = target - currentFrame.current;

            if (Math.abs(frameDiff) > 0.005) {
                // Adaptive lerp: fast catch-up when frameDiff is large, silky smooth on normal scroll
                const baseLerp = 1 - Math.exp(-14.0 * dt);
                const distanceRatio = Math.min(1.0, Math.abs(frameDiff) / 60);
                const effectiveLerp = baseLerp + (1.0 - baseLerp) * (distanceRatio * 0.45);
                let step = frameDiff * effectiveLerp;

                // Max step allows fast response (up to 380 frames/sec) so it never gets left behind
                const maxStep = 380 * dt;
                if (Math.abs(step) > maxStep) {
                    step = Math.sign(step) * maxStep;
                }

                currentFrame.current += step;
            } else {
                currentFrame.current = target;
            }

            const p = targetProgress.current;

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
            className="relative w-full bg-white font-sans scroll-mt-14 sm:scroll-mt-16"
            style={{ height: "650vh" }}
            id="service-workflow"
        >
            {/* Sticky viewport container (Full-bleed 100vw, offset below navbar) */}
            <div className="sticky top-14 sm:top-16 w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden bg-white">
                {/* 1. Preload Progress Indicator */}
                {loadProgress < 100 && (
                    <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-slate-100 overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-200"
                            style={{ width: `${loadProgress}%` }}
                        />
                    </div>
                )}

                {/* 2. Full-Bleed 3D Canvas Centerpiece (100% viewport width & height, 100% white blend-in) */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block"
                    style={{ touchAction: "pan-y" }}
                />

                {/* 3. Desktop & iPad Storytelling Overlay (Left Column, wide-to-edge container, pointer-events-none container) */}
                <div className="hidden md:flex absolute inset-0 z-20 items-center pointer-events-none">
                    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                        <div className="pointer-events-auto max-w-md lg:max-w-[460px] xl:max-w-[500px] space-y-4">
                            {/* Header Pill & Step Counter */}
                            <div className="flex items-center gap-2.5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                    <span className="font-mono text-3xs sm:text-xs font-semibold text-blue-700 uppercase tracking-wider">
                                        {currentStage.eyebrow}
                                    </span>
                                </div>
                                <span className="font-mono text-3xs font-bold text-slate-500 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-full">
                                    0{activeStage + 1} / 0{STORY_STAGES.length}
                                </span>
                            </div>

                            {/* Balanced 5-Segment Progress Bar */}
                            <div className="grid grid-cols-5 gap-1.5 w-full max-w-xs">
                                {STORY_STAGES.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            idx <= activeStage ? "bg-blue-600" : "bg-slate-200"
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Dynamic Stage Title */}
                            <h1 className="font-display font-extrabold text-xl sm:text-2xl lg:text-3xl xl:text-[2.25rem] text-slate-900 tracking-tight leading-[1.2]">
                                {currentStage.title}
                            </h1>

                            {/* Dynamic Stage Description */}
                            <p className="font-sans text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed text-justify [text-justify:inter-word]">
                                {currentStage.body}
                            </p>

                            {/* Interactive CTAs */}
                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onTrackClick}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-semibold text-sm transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>Lacak Status Servis</span>
                                </button>

                                <a
                                    href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20laptop/PC%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/95 hover:bg-white text-slate-700 border border-slate-200 font-sans font-medium text-sm transition-all shadow-2xs hover:border-slate-300"
                                >
                                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                                    <span>Konsultasi WA</span>
                                </a>
                            </div>

                            {/* Subtle Scroll Hint */}
                            <div className="flex items-center gap-2 text-3xs sm:text-xs font-mono text-slate-400 pt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                <span>Gulir ke bawah untuk melihat tahapan perbaikan perangkat</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Mobile Storytelling Card (Docked cleanly at bottom for phones) */}
                <div className="md:hidden absolute bottom-3 left-3 right-3 z-20 pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-md space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-3xs font-bold text-blue-600 uppercase tracking-wider truncate">
                                {currentStage.eyebrow}
                            </span>
                            <span className="font-mono text-3xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                                0{activeStage + 1} / 0{STORY_STAGES.length}
                            </span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${((activeStage + 1) / STORY_STAGES.length) * 100}%` }}
                            />
                        </div>
                        <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">
                            {currentStage.title}
                        </h3>
                        <p className="font-sans text-xs text-slate-600 line-clamp-2 leading-relaxed text-justify [text-justify:inter-word]">
                            {currentStage.body}
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onTrackClick}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/20 cursor-pointer"
                            >
                                <Search className="w-3.5 h-3.5" />
                                Lacak Servis
                            </button>
                            <a
                                href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center"
                                title="Konsultasi WhatsApp"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
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
