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
        range: [0.00, 0.16],
        eyebrow: "KOMPUTERAWET.COM · YANGVERSA COMPUTER",
        title: "Teman Terpercaya Merawat & Memperbaiki Komputer Anda.",
        body: "Pusat spesialis servis laptop, PC Desktop, dan MacBook di Pekayon, Bekasi. Fokus kami sederhana: solusi jujur, konsultasi transparan, dan pengerjaan yang rapi agar perangkat Anda awet digunakan.",
        badge: "Buka Setiap Hari 09–18 WIB",
    },
    {
        id: "inspection",
        range: [0.16, 0.32],
        eyebrow: "TAHAP 01 · PEMERIKSAAN DETAIL",
        title: "Pengecekan Tuntas, Estimasi Biaya Dulu Tanpa Paksaan.",
        body: "Sebelum perbaikan dimulai, teknisi memeriksa akar masalah hingga ke level mikroskopis dan menjelaskan secara terbuka. Jika estimasi biaya tidak disetujui, perangkat bisa diambil kembali tanpa biaya cek.",
        badge: "Bebas Biaya Cek",
    },
    {
        id: "hardware",
        range: [0.32, 0.48],
        eyebrow: "TAHAP 02 · PERBAIKAN & PENGGANTIAN SUKU CADANG",
        title: "Dari Ganti Thermal Paste, Engsel, Hingga Masalah Motherboard.",
        body: "Menangani laptop lemot, panas berlebih, engsel patah, layar pecah, mati total, hingga upgrade SSD dan RAM. Setiap part copotan atau bekas kami kembalikan utuh ke tangan Anda.",
        badge: "Sparepart Transparan",
    },
    {
        id: "quality",
        range: [0.48, 0.65],
        eyebrow: "TAHAP 03 · PENGUJIAN STABILITAS & SUHU",
        title: "Dites Kestabilannya Sebelum Diserahkan Kembali.",
        body: "Setiap unit dibersihkan dengan rapi dan diuji suhunya agar tidak lagi overheat atau sering hang saat dipakai bekerja. Kami pastikan perangkat benar-benar siap dan nyaman digunakan.",
        badge: "Pengujian Suhu & Stabilitas",
    },
    {
        id: "ready",
        range: [0.65, 1.00],
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

            dx = Math.round(dx);
            dy = Math.round(dy);
            dw = Math.round(dw);
            dh = Math.round(dh);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, cw, ch);
            ctx.drawImage(img, dx, dy, dw, dh);
        };

        const resizeCanvas = () => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const w = rect.width || canvas.clientWidth || 600;
            const h = rect.height || canvas.clientHeight || 450;
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

            const VIDEO_COMPLETE_PROGRESS = 0.65;
            const rawVideoProgress = Math.min(1.0, targetProgress.current / VIDEO_COMPLETE_PROGRESS);
            const target = rawVideoProgress * (TOTAL_FRAMES - 1);
            const frameDiff = target - currentFrame.current;

            if (Math.abs(frameDiff) > 0.005) {
                const lerpFactor = 1 - Math.exp(-10.0 * dt);
                let step = frameDiff * lerpFactor;

                const maxStep = 135 * dt;
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
            className="relative w-full bg-white font-sans"
            style={{ height: "540vh" }}
            id="service-workflow"
        >
            {/* Sticky viewport container - perfectly offset below navbar to prevent overlap/cutoff */}
            <div className="sticky top-14 sm:top-16 w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden bg-white flex flex-col justify-center">
                {/* Preload Progress Indicator */}
                {loadProgress < 100 && (
                    <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-slate-100 overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-200"
                            style={{ width: `${loadProgress}%` }}
                        />
                    </div>
                )}

                {/* Unified Balanced Edge-to-Edge Grid (Sejajar & Setara on Any Zoom Level) */}
                <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 md:gap-8 lg:gap-14 py-2 sm:py-4 md:py-6 relative z-10 my-auto h-full">
                    
                    {/* Left Column: Brand, Storytelling, and Direct Actions */}
                    <div className="w-full md:w-5/12 lg:w-5/12 flex flex-col justify-center space-y-2 sm:space-y-3 lg:space-y-4 shrink-0 order-2 md:order-1">
                        
                        {/* Header Pill & Step Counter */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-50 border border-blue-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                <span className="font-mono text-4xs sm:text-3xs md:text-xs font-semibold text-blue-700 uppercase tracking-wider">
                                    {currentStage.eyebrow}
                                </span>
                            </div>
                            <span className="font-mono text-4xs sm:text-3xs font-bold text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                                0{activeStage + 1} / 0{STORY_STAGES.length}
                            </span>
                        </div>

                        {/* Balanced 5-Segment Progress Bar */}
                        <div className="grid grid-cols-5 gap-1.5 w-full">
                            {STORY_STAGES.map((s, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                                        idx <= activeStage ? "bg-blue-600" : "bg-slate-200"
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Dynamic Stage Title */}
                        <h1 className="font-display font-extrabold text-lg sm:text-2xl md:text-3xl lg:text-4xl text-slate-900 tracking-tight leading-[1.2]">
                            {currentStage.title}
                        </h1>

                        {/* Dynamic Stage Description */}
                        <p className="font-sans text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-3 sm:line-clamp-none">
                            {currentStage.body}
                        </p>

                        {/* Interactive CTAs */}
                        <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={onTrackClick}
                                className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 md:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-semibold text-xs sm:text-sm transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                            >
                                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Lacak Status Servis</span>
                            </button>

                            <a
                                href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20laptop/PC%20saya"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-medium text-xs sm:text-sm transition-all"
                            >
                                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                <span>Konsultasi WA</span>
                            </a>
                        </div>

                        {/* Subtle Scroll Hint */}
                        <div className="hidden sm:flex items-center gap-2 text-3xs sm:text-xs font-mono text-slate-400 pt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>Gulir ke bawah untuk melihat tahapan perbaikan perangkat</span>
                        </div>
                    </div>

                    {/* Right Column: High-DPI Disassembly Visual Stage */}
                    <div className="w-full md:w-7/12 lg:w-7/12 flex-1 md:h-full flex items-center justify-center relative overflow-hidden order-1 md:order-2 h-[26vh] sm:h-[32vh] md:h-full max-h-[220px] sm:max-h-[280px] md:max-h-[75vh] 2xl:max-h-[82vh]">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full block object-contain"
                            style={{ touchAction: "pan-y" }}
                        />
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
