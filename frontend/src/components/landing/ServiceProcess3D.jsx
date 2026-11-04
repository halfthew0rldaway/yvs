import { useEffect, useRef, useState } from "react";
import { Search, MessageCircle, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { useDevice } from "../../hooks/useDevice";

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
        title: "Empat Keunggulan yang Bikin Anda Tenang.",
        body: "Spesialis servis laptop, PC Desktop, dan MacBook di Pekayon, Bekasi. Kami bekerja dengan transparansi biaya, sparepart original, dan garansi resmi — bukan sekadar tukar barang yang rusak.",
        badge: "Buka Setiap Hari 09–18 WIB",
    },
    {
        id: "inspection",
        range: [0.18, 0.38],
        eyebrow: "KEUNGGULAN 01 · TRANSPARANSI HARGA",
        title: "Biaya Dinaikkan Dulu, Tidak Ada Biaya Siluman.",
        body: "Estimasi biaya dan rencana perbaikan kami sampaikan sebelum satu pun komponen disentuh. Kalau perbaikan tidak disetujui, unit tetap bisa Anda ambil tanpa biaya cek. Tidak ada kejutan harga di akhir.",
        badge: "Gratis Cek, Tidak Paksa",
    },
    {
        id: "hardware",
        range: [0.38, 0.60],
        eyebrow: "KEUNGGULAN 02 · KEAHLIAN TINGKAT KOMPONEN",
        title: "Yang Lain-Ganti Unit, Kami Perbaiki Akar Masalahnya.",
        body: "Laptop mati total, motherboard rusak, BGA reballing, hingga kerusakan akibat cairan kami tangani di level komponen. Bukan sekadar menukar barang, tapi membenahi penyebabnya sampai unit benar-benar awet dipakai.",
        badge: "BGA Reballing & Level Komponen",
    },
    {
        id: "quality",
        range: [0.60, 0.82],
        eyebrow: "KEUNGGULAN 03 · SPAREPART ORIGINAL & TERPERCAYA",
        title: "Sparepart Original, Part Copotan Pun Dibawa Kembali.",
        body: "Komponen pengganti kami pakai part original dan bergaransi, bukan barang tiruan. Bahkan part copotan unit Anda tetap kami kembalikan utuh sebagai bukti penggantian yang jujur.",
        badge: "Part Original Bergaransi",
    },
    {
        id: "ready",
        range: [0.82, 1.00],
        eyebrow: "KEUNGGULAN 04 · GARANSI RESMI & PELACAKAN LIVE",
        title: "Diagnosa Jelas, Garansi Resmi, Bisa Dilacak Real-time.",
        body: "Setiap perbaikan disertai garansi 30–90 hari tertulis dan progresnya bisa Anda pantau langsung lewat portal pelacakan. Tak perlu bolak-balik tanya kabar ke toko.",
        badge: "Garansi 30–90 Hari",
    },
];

export default function ServiceProcess3D({ onTrackClick }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [activeStage, setActiveStage] = useState(0);

    // ── Pre-rendered scroll "video" gate (desktop only) ─────────────────────
    // The 240-frame WebP sequence (+ canvas + scroll listeners + RAF loop) is heavy,
    // so it is ONLY rendered on desktop. On phones/tablets it is skipped entirely:
    // no frame downloads, no canvas, no scroll listeners, no RAF loop.
    const { width: deviceWidth } = useDevice();

    // Phones/tablets are detected via UA. Note: in "desktop mode" the UA still
    // carries the mobile token (e.g. iPhone), but the viewport becomes wide, which
    // is what we key off below.
    const isMobileUserAgent =
        typeof navigator !== "undefined" &&
        /Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i.test(
            navigator.userAgent || ""
        );

    // Thresholds:
    //  • Desktop UA  -> show from 900px (the storytelling overlay needs the width).
    //  • Mobile UA   -> only show from 960px, i.e. genuine "desktop mode".
    //    This keeps big phones in landscape (~932px) hidden, while a phone that
    //    requested the desktop site (980px) does get the video.
    const showVideoSequence = deviceWidth >= 900 && (!isMobileUserAgent || deviceWidth >= 960);

    const framesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
    const targetProgress = useRef(0);
    const currentFrame = useRef(0);
    const animFrameId = useRef(null);
    const activeStageRef = useRef(0);
    const lastRenderedFrame = useRef(-1);

    useEffect(() => {
        if (!showVideoSequence) return;

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
            } else if (framesRef.current[0]) {
                drawFrame(0);
            }
        };

        resizeCanvas();

        // Instant First Frame paint (already preloaded via index.html <link rel="preload">)
        const initialImg = new Image();
        initialImg.src = getFrameSrc(0);
        const onFirstFrameReady = () => {
            if (!isCancelled) {
                framesRef.current[0] = initialImg;
                drawFrame(0);
                lastRenderedFrame.current = 0;
            }
        };
        if (initialImg.complete && initialImg.naturalWidth > 0) {
            onFirstFrameReady();
        } else {
            initialImg.onload = onFirstFrameReady;
            if (initialImg.decode) {
                initialImg.decode().then(onFirstFrameReady).catch(() => {});
            }
        }

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

            // Phase 1: Ensure First Frame is painted
            if (!framesRef.current[0]) {
                const firstImg = await loadAndDecode(0);
                if (isCancelled) return;
                if (firstImg) {
                    drawFrame(0);
                    lastRenderedFrame.current = 0;
                }
            }
            wakeLoop();

            // Phase 2: Immediate burst for first 24 frames (smooth initial scroll transition)
            const earlyFrames = Array.from({ length: 24 }, (_, i) => i + 1);
            await Promise.all(earlyFrames.map(idx => loadAndDecode(idx)));
            if (isCancelled) return;
            wakeLoop();

            // Phase 3: Fast parallel stream for all keyframes and remaining frames
            const remaining = [];
            for (let i = 25; i < TOTAL_FRAMES; i++) {
                if (!framesRef.current[i]) {
                    remaining.push(i);
                }
            }

            let currentIndex = 0;
            const CONCURRENCY = 20;

            const worker = async () => {
                while (currentIndex < remaining.length && !isCancelled) {
                    const targetIdx = remaining[currentIndex++];
                    if (targetIdx === undefined) break;

                    const img = await loadAndDecode(targetIdx);
                    if (img && !isCancelled) {
                        if (Math.round(currentFrame.current) === targetIdx) {
                            wakeLoop();
                        }
                    }
                }
            };

            const workers = Array.from({ length: CONCURRENCY }, () => worker());
            await Promise.all(workers);
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
    }, [showVideoSequence]);

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

    // Mobile / tablet: hide the pre-rendered video experience completely.
    if (!showVideoSequence) return null;

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-white font-sans h-[440vh] sm:h-[650vh]"
            id="service-workflow"
        >
            {/* Sticky viewport container (True 100dvh Fullscreen Studio, isolated render layer) */}
            <div className="sticky top-0 w-full h-[100dvh] overflow-hidden bg-white [contain:paint]">
                {/* 1. Full-Bleed 3D Canvas Centerpiece (Dedicated GPU layer, zero ghosting, pure blend) */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block transform-gpu will-change-transform"
                    style={{ touchAction: "pan-y" }}
                />

                {/* 3. Desktop storytelling overlay (Left Column, wide-to-edge container, pointer-events-none container) */}
                <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
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

            </div>
        </section>
    );
}
