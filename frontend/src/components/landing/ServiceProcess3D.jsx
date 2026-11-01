import { useEffect, useRef, useState } from "react";
import { Search, MessageCircle, Clock, ShieldCheck, ChevronRight } from "lucide-react";

const TOTAL_FRAMES = 240;

const getFrameSrc = (index) => {
    const padIndex = String(index + 1).padStart(3, "0");
    return `/frames/${padIndex}.webp`;
};

// Keyframes that must be loaded before scroll is unlocked.
// One per stage boundary + first and last = guaranteed smooth stage transitions.
const KEYFRAME_INDICES = [0, 22, 43, 72, 96, 120, 144, 168, 192, 210, 239];

const STORY_STAGES = [
    {
        id: "intro",
        range: [0.00, 0.18],
        eyebrow: "KOMPUTERAWET.COM · YANGVERSA COMPUTER",
        shortEyebrow: "YVS COMPUTER · PEKAYON",
        title: "Teman Terpercaya Merawat & Memperbaiki Komputer Anda.",
        body: "Pusat spesialis servis laptop, PC Desktop, dan MacBook di Pekayon, Bekasi. Solusi jujur, konsultasi transparan, dan pengerjaan rapi agar perangkat Anda awet digunakan.",
        badge: "Buka Setiap Hari 09–18 WIB",
    },
    {
        id: "inspection",
        range: [0.18, 0.38],
        eyebrow: "TAHAP 01 · PEMERIKSAAN DETAIL",
        shortEyebrow: "TAHAP 01 · DIAGNOSIS DETAIL",
        title: "Pengecekan Tuntas, Estimasi Biaya Dulu Tanpa Paksaan.",
        body: "Sebelum perbaikan dimulai, teknisi memeriksa akar masalah hingga ke level mikroskopis dan menjelaskan secara terbuka. Jika biaya tidak disetujui, unit dapat diambil tanpa biaya cek.",
        badge: "Bebas Biaya Cek",
    },
    {
        id: "hardware",
        range: [0.38, 0.60],
        eyebrow: "TAHAP 02 · PERBAIKAN & PENGGANTIAN SUKU CADANG",
        shortEyebrow: "TAHAP 02 · PERBAIKAN HARDWARE",
        title: "Dari Ganti Thermal Paste, Engsel, Hingga Masalah Motherboard.",
        body: "Menangani laptop lemot, panas berlebih, engsel patah, layar pecah, mati total, hingga upgrade SSD dan RAM. Setiap suku cadang copotan dikembalikan utuh ke tangan Anda.",
        badge: "Sparepart Transparan",
    },
    {
        id: "quality",
        range: [0.60, 0.82],
        eyebrow: "TAHAP 03 · PENGUJIAN STABILITAS & SUHU",
        shortEyebrow: "TAHAP 03 · UJI KESTABILAN & SUHU",
        title: "Dites Kestabilannya Sebelum Diserahkan Kembali.",
        body: "Setiap unit dibersihkan dengan rapi dan diuji suhunya agar tidak lagi overheat atau sering hang saat dipakai bekerja. Kami pastikan perangkat siap dan nyaman digunakan.",
        badge: "Pengujian Suhu & Stabilitas",
    },
    {
        id: "ready",
        range: [0.82, 1.00],
        eyebrow: "TAHAP 04 · SERAH TERIMA & GARANSI RESMI",
        shortEyebrow: "TAHAP 04 · SERAH TERIMA & GARANSI",
        title: "Pantau Progres Servis Kapan Saja, Disertai Garansi Jelas.",
        body: "Anda bisa memantau foto kondisi, riwayat pengerjaan, dan status garansi secara langsung melalui portal pelacakan ini tanpa harus bolak-balik tanya ke toko.",
        badge: "Garansi Resmi Servis",
    },
];

export default function ServiceProcess3D({ onTrackClick }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [isInitialReady, setIsInitialReady] = useState(false);
    const [isScrollReady, setIsScrollReady] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [activeStage, setActiveStage] = useState(0);

    const framesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
    const targetProgress = useRef(0);
    const currentFrame = useRef(0);
    const animFrameId = useRef(null);
    const activeStageRef = useRef(0);
    const lastRenderedFrame = useRef(-1);
    const scrollReadyRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // desynchronized: true reduces input-to-render latency on mobile and Chromium browsers
        const ctx = canvas.getContext("2d", {
            alpha: false,
            desynchronized: true,
        });
        if (!ctx) return;

        let isRunning = false;
        let isVisible = true;
        let isCancelled = false;
        let lastTime = performance.now();

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
                // Mobile portrait/landscape:
                if (canvasAspect < 1.0) {
                    // Top HUD occupies ~54px, Bottom docked panel occupies ~180px
                    const topHudHeight = 54;
                    const bottomPanelHeight = 180;
                    const availableH = Math.max(220, ch - topHudHeight - bottomPanelHeight);

                    // Hardware aspect ratio in 1920x1080 source frame:
                    // Hardware width ≈ 0.542 * iw, hardware height ≈ 0.89 * ih
                    // Aspect ratio of the hardware itself = (0.542 / 0.89) * (1920 / 1080) ≈ 1.082
                    const hwAspect = 1.082;

                    // Available bounding box for the hardware (with breathing room):
                    const maxHwW = Math.min(cw * 0.90, 480);
                    const maxHwH = availableH * 0.86;

                    let targetHwWidth, hwHeight;
                    if (maxHwW / hwAspect <= maxHwH) {
                        targetHwWidth = maxHwW;
                        hwHeight = targetHwWidth / hwAspect;
                    } else {
                        hwHeight = maxHwH;
                        targetHwWidth = hwHeight * hwAspect;
                    }

                    dw = targetHwWidth / 0.542;
                    dh = dw / imgAspect;

                    // Center hardware horizontally: hardware center is at 0.52 * dw
                    dx = (cw / 2) - (dw * 0.52);

                    // Center hardware vertically in the exact window between top HUD and bottom sheet:
                    const hwTopOffset = dh * 0.043;
                    dy = topHudHeight + ((availableH - hwHeight) / 2) - hwTopOffset;
                } else {
                    dh = ch * 0.85;
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

        // Device-aware HiDPI canvas resizing
        // On mobile devices (<768px), DPR 1.5 provides pin-sharp retina rendering (>326 ppi)
        // while slashing memory bandwidth and GPU fillrate workload by 44% compared to 2x/3x DPR!
        const resizeCanvas = () => {
            if (!canvas) return;
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            if (w === 0 || h === 0) return;

            const isDesktopOrTablet = window.innerWidth >= 768;
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                isDesktopOrTablet ? 2 : 1.5
            );
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);

            if (lastRenderedFrame.current >= 0) {
                drawFrame(lastRenderedFrame.current);
            }
        };

        resizeCanvas();

        // Cached layout metrics to completely eliminate layout reflow / thrashing during scroll
        let cachedContainerTop = 0;
        let cachedScrollable = 1;

        const updateMetrics = () => {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            cachedContainerTop = rect.top + scrollTop;
            cachedScrollable = Math.max(1, container.offsetHeight - window.innerHeight);
        };

        updateMetrics();

        // Optimized demand-driven render loop (Sleeps when idle or out of viewport = 0% CPU)
        const animate = (time) => {
            if (!isVisible) {
                isRunning = false;
                return;
            }

            const dt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            // Spread all 240 frames across the storytelling timeline for buttery-smooth pacing
            const VIDEO_COMPLETE_PROGRESS = 0.88;
            const rawVideoProgress = Math.min(1.0, targetProgress.current / VIDEO_COMPLETE_PROGRESS);
            const target = rawVideoProgress * (TOTAL_FRAMES - 1);
            const frameDiff = target - currentFrame.current;

            if (Math.abs(frameDiff) > 0.002) {
                // Snappy critically-damped spring follower — tight enough to never visually lag
                // behind the user's scroll position, even during fast swipes.
                // k=35 ensures the frame catches up within ~2-3 visual frames (~33-50ms)
                const baseLerp = 1 - Math.exp(-35.0 * dt);
                // For large jumps (fast scrolling), boost convergence so animation never feels stuck
                const distanceRatio = Math.min(1.0, Math.abs(frameDiff) / 20);
                const effectiveLerp = baseLerp + (1.0 - baseLerp) * (distanceRatio * 0.6);
                currentFrame.current += frameDiff * Math.min(1.0, effectiveLerp);
                animFrameId.current = requestAnimationFrame(animate);
            } else {
                currentFrame.current = target;
                isRunning = false; // Sleep: stops requestAnimationFrame when target reached!
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

        const wakeLoop = () => {
            if (isRunning || !isVisible) return;
            isRunning = true;
            lastTime = performance.now();
            animFrameId.current = requestAnimationFrame(animate);
        };

        // Layout-free instant scroll handler
        const handleScroll = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const progress = Math.min(Math.max((scrollY - cachedContainerTop) / cachedScrollable, 0), 1);
            targetProgress.current = progress;
            wakeLoop();
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", () => {
            updateMetrics();
            resizeCanvas();
            handleScroll();
        }, { passive: true });

        // IntersectionObserver to completely halt execution when scrolled out of view
        let observer = null;
        if ("IntersectionObserver" in window) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    isVisible = entry.isIntersecting;
                    if (isVisible) {
                        updateMetrics();
                        wakeLoop();
                    } else {
                        if (animFrameId.current) {
                            cancelAnimationFrame(animFrameId.current);
                            animFrameId.current = null;
                        }
                        isRunning = false;
                    }
                },
                { rootMargin: "100px 0px" }
            );
            observer.observe(container);
        }

        // High-Speed Concurrent Frame Streaming with Asynchronous Decoding
        // Images are pre-decoded in parallel workers so canvas drawing never drops frames
        const loadFrameSequence = async () => {
            const loadAndDecode = async (index) => {
                if (isCancelled || framesRef.current[index]) return framesRef.current[index];
                const img = new Image();
                img.src = getFrameSrc(index);

                try {
                    if (img.decode) {
                        await img.decode();
                    } else {
                        await new Promise((res, rej) => {
                            img.onload = res;
                            img.onerror = rej;
                        });
                    }
                    if (!isCancelled) {
                        framesRef.current[index] = img;
                        return img;
                    }
                } catch {
                    if (img.complete && img.naturalWidth > 0 && !isCancelled) {
                        framesRef.current[index] = img;
                        return img;
                    }
                }
                return null;
            };

            // Phase 1: Instant First Frame for fastest First Contentful Paint
            const firstImg = await loadAndDecode(0);
            if (isCancelled) return;
            if (firstImg) {
                drawFrame(0);
                lastRenderedFrame.current = 0;
            }
            setIsInitialReady(true);
            setLoadProgress(2);
            wakeLoop();

            // Phase 2: Load all keyframes (stage-boundary frames) BEFORE unlocking scroll.
            // This guarantees every stage transition has a real frame available — no stale/stuck frames.
            const keyframePromises = KEYFRAME_INDICES.filter(i => i !== 0).map(idx => loadAndDecode(idx));
            await Promise.all(keyframePromises);
            if (isCancelled) return;

            let loadedCount = KEYFRAME_INDICES.length;
            setLoadProgress(Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100)));

            // Unlock scroll — keyframes are ready, animation can track scroll smoothly
            scrollReadyRef.current = true;
            setIsScrollReady(true);
            handleScroll();
            wakeLoop();

            // Phase 3: Fill in the gaps between keyframes with burst loading
            // Prioritize frames near keyframes first for dense coverage, then fill remaining
            const remaining = [];
            for (let i = 1; i < TOTAL_FRAMES; i++) {
                if (!KEYFRAME_INDICES.includes(i)) {
                    remaining.push(i);
                }
            }

            let currentIndex = 0;
            const CONCURRENCY = 16;

            const worker = async () => {
                while (currentIndex < remaining.length && !isCancelled) {
                    const targetIdx = remaining[currentIndex++];
                    if (targetIdx === undefined) break;

                    const img = await loadAndDecode(targetIdx);
                    if (img && !isCancelled) {
                        loadedCount++;
                        // Throttle progress updates to avoid excessive re-renders
                        if (loadedCount % 12 === 0 || loadedCount === TOTAL_FRAMES) {
                            setLoadProgress(Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100)));
                        }
                        if (Math.round(currentFrame.current) === targetIdx) {
                            wakeLoop();
                        }
                    }
                }
            };

            const workers = Array.from({ length: CONCURRENCY }, () => worker());
            await Promise.all(workers);
            if (!isCancelled) {
                setLoadProgress(100);
            }
        };

        loadFrameSequence();
        handleScroll();
        wakeLoop();

        return () => {
            isCancelled = true;
            if (observer) observer.disconnect();
            window.removeEventListener("scroll", handleScroll);
            if (animFrameId.current) {
                cancelAnimationFrame(animFrameId.current);
            }
        };
    }, []);

    const scrollToStage = (stageIdx) => {
        if (!containerRef.current) return;
        const stage = STORY_STAGES[stageIdx];
        if (!stage) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const containerTop = rect.top + scrollTop;
        const scrollable = containerRef.current.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const targetScrollY = containerTop + (stage.range[0] + 0.01) * scrollable;
        window.scrollTo({ top: targetScrollY, behavior: "smooth" });
    };

    const currentStage = STORY_STAGES[activeStage] || STORY_STAGES[0];

    // Scroll-gate: prevent the user from scrolling past the animation section
    // while keyframes are still loading. Once isScrollReady is true, the container
    // expands to its full scrollable height and the animation plays seamlessly.
    const containerHeight = isScrollReady
        ? undefined // use CSS class height
        : "100vh";  // collapse to single viewport — no scroll travel until keyframes ready

    return (
        <section
            ref={containerRef}
            className={`relative w-full bg-white font-sans ${isScrollReady ? 'h-[440vh] sm:h-[650vh]' : ''}`}
            style={!isScrollReady ? { height: containerHeight } : undefined}
            id="service-workflow"
        >
            {/* Sticky viewport container (True 100dvh Fullscreen Studio, isolated render layer) */}
            <div className="sticky top-0 w-full h-[100dvh] overflow-hidden bg-white [contain:paint]">
                {/* 1. Preload Progress Indicator */}
                {loadProgress < 100 && (
                    <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-slate-100 overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-200"
                            style={{ width: `${loadProgress}%` }}
                        />
                    </div>
                )}

                {/* 2. Full-Bleed 3D Canvas Centerpiece (Dedicated GPU layer, zero ghosting, pure blend) */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block transform-gpu will-change-transform"
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

                            {/* Balanced 5-Segment Progress Bar - Clickable to Jump */}
                            <div className="grid grid-cols-5 gap-1.5 w-full max-w-xs">
                                {STORY_STAGES.map((s, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => scrollToStage(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                            idx <= activeStage ? "bg-blue-600" : "bg-slate-200 hover:bg-slate-300"
                                        }`}
                                        aria-label={`Loncat ke ${s.eyebrow}`}
                                    />
                                ))}
                            </div>

                            {/* Dynamic Stage Title */}
                            <h1 className="font-display font-extrabold text-xl sm:text-2xl lg:text-3xl xl:text-[2.25rem] text-slate-900 tracking-tight leading-[1.2]">
                                {currentStage.title}
                            </h1>

                            {/* Dynamic Stage Description */}
                            <p className="font-sans text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed text-left">
                                {currentStage.body}
                            </p>

                            {/* Interactive CTAs */}
                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onTrackClick}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-semibold text-sm transition-all shadow-sm shadow-blue-500/20 cursor-pointer whitespace-nowrap shrink-0 w-fit max-w-max"
                                >
                                    <Search className="w-4 h-4 shrink-0" />
                                    <span className="whitespace-nowrap">Lacak Status Servis</span>
                                </button>

                                <a
                                    href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20laptop/PC%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/95 hover:bg-white text-slate-700 border border-slate-200 font-sans font-medium text-sm transition-all shadow-2xs hover:border-slate-300 whitespace-nowrap shrink-0 w-fit max-w-max"
                                >
                                    <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className="whitespace-nowrap">Konsultasi WA</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Mobile Viewport Architecture: Integrated Top HUD & Docked Bottom Glass Sheet */}
                <div className="md:hidden">
                    {/* Top Viewfinder HUD with Interactive Stage Stepper */}
                    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-auto px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3 bg-gradient-to-b from-white via-white/95 to-transparent">
                        {/* 5-Segment Interactive Progress Line */}
                        <div className="grid grid-cols-5 gap-1.5 w-full">
                            {STORY_STAGES.map((s, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => scrollToStage(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                        idx === activeStage
                                            ? "bg-blue-600 h-2 shadow-xs"
                                            : idx < activeStage
                                            ? "bg-blue-300"
                                            : "bg-slate-200/90"
                                    }`}
                                    aria-label={`Pindah ke ${s.shortEyebrow || s.eyebrow}`}
                                />
                            ))}
                        </div>

                        {/* Top Metadata Row: Stage Label & Counter */}
                        <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                                <span className="font-mono text-3xs font-bold text-blue-700 uppercase tracking-wider truncate">
                                    {currentStage.shortEyebrow || currentStage.eyebrow}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-3xs font-extrabold text-slate-700 bg-white/90 border border-slate-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                                    0{activeStage + 1} / 0{STORY_STAGES.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Docked Editorial Glass Sheet (Edge-to-Edge, Seamless, Zero Pop-up Feel) */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto pb-[max(env(safe-area-inset-bottom,0px),10px)]">
                        <div className="bg-white/94 backdrop-blur-xl border-t border-slate-200/80 rounded-t-3xl shadow-[0_-8px_30px_rgba(15,23,42,0.06)] px-4 sm:px-6 pt-2 pb-3 space-y-2">
                            {/* Subtle Grab Bar Indicator */}
                            <div className="w-8 h-1 bg-slate-300/80 rounded-full mx-auto mb-1" />

                            {/* Badge Pill */}
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-mono text-3xs font-bold tracking-wider uppercase whitespace-nowrap shrink-0 w-fit max-w-max">
                                    ✦ {currentStage.badge}
                                </span>
                                <span className="text-3xs font-mono text-slate-400 whitespace-nowrap shrink-0">
                                    Swipe scroll ↓
                                </span>
                            </div>

                            {/* Stage Title */}
                            <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                                {currentStage.title}
                            </h3>

                            {/* Stage Description */}
                            <p className="font-sans text-xs text-slate-600 leading-relaxed text-left line-clamp-2">
                                {currentStage.body}
                            </p>

                            {/* Streamlined Mobile Action Bar */}
                            <div className="pt-1 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onTrackClick}
                                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-sans text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[40px] transition-all whitespace-nowrap shrink-0 w-fit"
                                >
                                    <Search className="w-3.5 h-3.5 shrink-0" />
                                    <span className="whitespace-nowrap">Lacak Status Servis</span>
                                </button>
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20laptop/PC%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-700 border border-emerald-200 font-sans text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs min-h-[40px] transition-all whitespace-nowrap shrink-0 w-fit max-w-max"
                                    title="Konsultasi WhatsApp"
                                >
                                    <MessageCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                    <span className="whitespace-nowrap">WA CS</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subtle initial spinner — shows until first frame is painted */}
                {!isInitialReady && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white transition-opacity duration-300">
                        <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                )}

                {/* Keyframe loading overlay — shows after first frame but before scroll is unlocked.
                    Covers the canvas with a gentle indicator so the user knows scrolling will be 
                    enabled momentarily, without the animation appearing frozen. */}
                {isInitialReady && !isScrollReady && (
                    <div className="absolute inset-0 z-25 flex flex-col items-center justify-end pb-[max(env(safe-area-inset-bottom,0px),24px)] pointer-events-none transition-opacity duration-500">
                        <div className="flex flex-col items-center gap-2 animate-pulse">
                            <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-600 rounded-full animate-spin" />
                            <span className="text-3xs font-mono font-medium text-slate-400 tracking-wider uppercase">Menyiapkan animasi...</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
