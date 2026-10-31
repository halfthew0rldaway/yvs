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
        range: [0.00, 0.20],
        eyebrow: "YVS COMPUTER · INDUSTRIAL REPAIR LAB",
        title: "Rekayasa & Reparasi Komputer Berstandar Presisi.",
        body: "Spesialis pemulihan laptop dan workstation level komponen: BGA reballing, power rail restoration, liquid damage recovery, dan kalibrasi termal komprehensif.",
        badge: "Standar Industri",
        showHeroCTA: true,
    },
    {
        id: "inspection",
        range: [0.20, 0.45],
        eyebrow: "01 // DIAGNOSTIK MIKROSKOPIK",
        title: "Pemeriksaan Non-Destruktif & Pemetaan Sirkuit.",
        body: "Setiap perangkat melalui audit toleransi fisik 0.05mm, stereoskopik optik logic board, dan pengujian multi-rail voltage sebelum estimasi diajukan. Bebas biaya jika estimasi tidak disepakati.",
        badge: "Toleransi 0.05mm",
    },
    {
        id: "hardware",
        range: [0.45, 0.70],
        eyebrow: "02 // TINGKAT KOMPONEN & BGA",
        title: "Restorasi Inti: Motherboard, VRM & Power Rail.",
        body: "Perbaikan jalur pendek (short-circuit), penggantian kapasitor low-ESR, reballing chip BGA, serta aplikasi senyawa termal fase cair (Phase-Change TIM) tanpa penggantian papan secara buta.",
        badge: "Level Komponen",
    },
    {
        id: "quality",
        range: [0.70, 0.88],
        eyebrow: "03 // QUALITY CONTROL MATRIX",
        title: "25-Point QC Matrix & Pengujian Beban Penuh.",
        body: "Pengujian ketat kestabilan daya, stres termal CPU & GPU di bawah beban 100%, verifikasi integritas NVMe/RAM, dan validasi I/O selama minimal 4 jam sebelum perakitan akhir disetujui.",
        badge: "Burn-in Test 4 Jam",
    },
    {
        id: "ready",
        range: [0.88, 1.00],
        eyebrow: "04 // TRANSPARANSI & GARANSI",
        title: "Perangkat Anda Siap. Terpantau Real-Time.",
        body: "Seluruh riwayat pengerjaan, foto visual audit, dan sertifikat garansi digital ber-hash aktif otomatis. Cek perkembangan unit Anda langsung melalui portal pelacakan mandiri.",
        badge: "Garansi Digital",
        showFinalCTA: true,
    },
];

export default function ServiceProcess3D({ onTrackClick }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [isInitialReady, setIsInitialReady] = useState(false);
    const [activeStage, setActiveStage] = useState(0);
    const [showFloatingTrack, setShowFloatingTrack] = useState(false);

    // References for frames and smooth animation loop
    const framesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
    const targetProgress = useRef(0);
    const currentProgress = useRef(0);
    const animFrameId = useRef(null);
    const activeStageRef = useRef(0);
    const showFloatingRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        let lastRenderedProgress = -1;

        // HiDPI canvas resizing
        const resizeCanvas = () => {
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            if (w === 0 || h === 0) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = w * dpr;
            canvas.height = h * dpr;

            lastRenderedProgress = -1;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

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

        // Sub-frame cross-fading renderer for 60fps/120fps continuous motion
        const renderBlendedFrames = (idxA, idxB, alphaB) => {
            const imgA = getBestFrame(idxA);
            if (!imgA) return;

            const cw = canvas.width;
            const ch = canvas.height;
            const iw = imgA.naturalWidth || 1920;
            const ih = imgA.naturalHeight || 1080;

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

            // Clean background fill matching the video studio background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, cw, ch);

            // 1. Draw base frame
            ctx.globalAlpha = 1.0;
            ctx.drawImage(imgA, dx, dy, dw, dh);

            // 2. Sub-frame alpha blend for ultra-smooth 60fps/120fps transitions
            if (alphaB > 0.015 && idxA !== idxB) {
                const imgB = getBestFrame(idxB);
                if (imgB && imgB !== imgA) {
                    ctx.globalAlpha = alphaB;
                    ctx.drawImage(imgB, dx, dy, dw, dh);
                    ctx.globalAlpha = 1.0;
                }
            }
        };

        // Priority-based async image loader with off-thread GPU decoding
        const preloadFrames = async () => {
            // Tier 1: Decode Frame 1 immediately
            const firstImg = new Image();
            firstImg.src = getFrameSrc(0);
            try {
                await firstImg.decode();
            } catch (_) {}
            framesRef.current[0] = firstImg;
            renderBlendedFrames(0, 0, 0);
            setIsInitialReady(true);

            // Tier 2: Anchor keyframes distributed across the entire timeline
            const stride = 12;
            const anchorPromises = [];
            for (let i = stride; i < TOTAL_FRAMES; i += stride) {
                const img = new Image();
                img.src = getFrameSrc(i);
                anchorPromises.push(
                    img.decode().then(() => {
                        framesRef.current[i] = img;
                    }).catch(() => {
                        framesRef.current[i] = img;
                    })
                );
            }
            await Promise.allSettled(anchorPromises);

            // Tier 3: Asynchronously decode all remaining intermediate frames
            for (let i = 1; i < TOTAL_FRAMES; i++) {
                if (framesRef.current[i]) continue;
                const img = new Image();
                img.src = getFrameSrc(i);
                img.decode().then(() => {
                    framesRef.current[i] = img;
                }).catch(() => {
                    framesRef.current[i] = img;
                });
            }
        };

        preloadFrames();

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

        // 60fps/120fps render loop with framerate-independent physics damping
        let lastTime = performance.now();

        const animate = (time) => {
            animFrameId.current = requestAnimationFrame(animate);

            const dt = Math.min((time - lastTime) / 1000, 0.08);
            lastTime = time;

            // Exponential damping (lambda = 16 for buttery smooth glide)
            const lambda = 16;
            const lerpFactor = 1 - Math.exp(-lambda * dt);

            const diff = targetProgress.current - currentProgress.current;
            if (Math.abs(diff) > 0.00002) {
                currentProgress.current += diff * lerpFactor;
            } else {
                currentProgress.current = targetProgress.current;
            }

            const p = currentProgress.current;

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

            // Render sub-frame blended transition
            if (Math.abs(p - lastRenderedProgress) > 0.00008) {
                lastRenderedProgress = p;

                const floatIndex = p * (TOTAL_FRAMES - 1);
                const floorIdx = Math.floor(floatIndex);
                const ceilIdx = Math.min(floorIdx + 1, TOTAL_FRAMES - 1);
                const fraction = floatIndex - floorIdx;

                renderBlendedFrames(floorIdx, ceilIdx, fraction);
            }
        };

        animFrameId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("scroll", handleScroll);
            if (animFrameId.current) {
                cancelAnimationFrame(animFrameId.current);
            }
        };
    }, []);

    const jumpToStage = (stageIdx) => {
        if (!containerRef.current) return;
        const stage = STORY_STAGES[stageIdx];
        if (!stage) return;
        const scrollable = containerRef.current.offsetHeight - window.innerHeight;
        const targetY = containerRef.current.offsetTop + stage.range[0] * scrollable + 15;
        window.scrollTo({ top: targetY, behavior: "smooth" });
    };

    const currentStage = STORY_STAGES[activeStage] || STORY_STAGES[0];

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-white"
            style={{ height: "450vh" }}
            id="service-workflow"
        >
            {/* Sticky 100vh viewport container */}
            <div className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden bg-white">
                {/* 1. Scroll-driven Canvas Centerpiece */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block"
                    style={{ touchAction: "pan-y" }}
                />

                {/* 2. Desktop & Tablet Storytelling Column (Non-obstructive left placement) */}
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
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={onTrackClick}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-semibold text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
                                    >
                                        <Search className="w-4 h-4" />
                                        Buka Formulir Pelacakan
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
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

                {/* 3. Mobile Storytelling Card (Docked at Bottom) */}
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

                {/* 4. Desktop Vertical Step Navigation (Right Rail) */}
                <div className="hidden lg:flex flex-col gap-2 absolute top-1/2 -translate-y-1/2 right-8 z-20 pointer-events-auto">
                    {STORY_STAGES.map((s, idx) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => jumpToStage(idx)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-mono cursor-pointer ${
                                activeStage === idx
                                    ? "bg-slate-900 text-white font-semibold shadow-sm"
                                    : "bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border border-slate-200/60"
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    activeStage === idx ? "bg-blue-400" : "bg-slate-300"
                                }`}
                            />
                            <span>0{idx + 1}</span>
                            <span className="hidden xl:inline text-[11px] font-sans font-normal opacity-85">
                                {s.badge}
                            </span>
                        </button>
                    ))}
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
