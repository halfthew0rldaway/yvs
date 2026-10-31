import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { CheckCircle2, Cpu, Wrench, ShieldCheck, Search, Activity, Layers, RotateCcw } from "lucide-react";

const STAGES = [
    {
        id: "intake",
        step: "01",
        title: "Intake & Non-Destructive Scanning",
        subtitle: "Pemeriksaan Fisik & Uji Jalur Daya Awal",
        badge: "Tahap 1",
        description:
            "Setiap perangkat yang masuk dianalisis secara menyeluruh menggunakan mikroskop stereoskopik dan thermal scanner tanpa intervensi invasif sebelum diagnosis disepakati.",
        metrics: [
            { label: "Inspeksi Chassis", value: "Toleransi 0.05mm" },
            { label: "Deteksi Voltase", value: "3.3V / 5V / 19V Rail" },
            { label: "Bukti Visual", value: "Foto Resolusi Tinggi" },
        ],
        statusText: "OPTICAL_SCAN_ACTIVE // CHASSIS_INTEGRITY_CHECK_PASS",
    },
    {
        id: "exploded",
        step: "02",
        title: "Isolasi Modul & Exploded Diagnosis",
        subtitle: "Pemisahan Subsistem & Pemetaan Jalur Singkat",
        badge: "Tahap 2",
        description:
            "Unit didekonstruksi secara modular. Komponen pendingin, logic board, dan power distribution diisolasi untuk melacak titik korsleting atau degradasi semikonduktor.",
        metrics: [
            { label: "Thermal Dissipation", value: "Heatsink Detached" },
            { label: "Micro-Probing", value: "12 Power Test Points" },
            { label: "Status Kerusakan", value: "Terdokumentasi Lengkap" },
        ],
        statusText: "MODULE_ISOLATED // MULTIMETER_DIAGNOSTIC_POINT_OK",
    },
    {
        id: "microsolder",
        step: "03",
        title: "Mikro-Soldering & Thermal Overhaul",
        subtitle: "Penggantian IC BGA & Pasta Termal Industri",
        badge: "Tahap 3",
        description:
            "Teknisi tersertifikasi mengeksekusi reballing BGA, penggantian MOSFET/kapasitor mikro SMD, serta mengaplikasikan thermal interface compound berkadar konduktivitas tinggi.",
        metrics: [
            { label: "Presisi Soldering", value: "0.02mm Pitch" },
            { label: "Thermal Compound", value: "Phase-Change Compound" },
            { label: "Clean Room", value: "ESD-Protected Workstation" },
        ],
        statusText: "IC_REBALLED // SOLDER_JOINT_INSPECTED_PASS",
    },
    {
        id: "assembly_qc",
        step: "04",
        title: "Rekonstruksi & 25-Point QC Seal",
        subtitle: "Stress-Test Suhu, Beban Penuh & Garansi Digital",
        badge: "Tahap 4",
        description:
            "Unit dirakit ulang dengan torsi baut terkalibrasi pabrikan. Diuji beban penuh selama minimum 2 jam kontinu sebelum diterbitkan sertifikat garansi resmi ber-hash unik.",
        metrics: [
            { label: "Stress Test", value: "FurMark & Cinebench 2H" },
            { label: "Thermal Delta", value: "Delta T < 14°C Normal" },
            { label: "Garansi YVS", value: "Sertifikat Digital Valid" },
        ],
        statusText: "TELEMETRY_NORMAL // 25_POINT_QC_SEAL_CERTIFIED",
    },
];

export default function ServiceProcess3D() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [currentStageIdx, setCurrentStageIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isLowPower, setIsLowPower] = useState(false);
    const [isSceneReady, setIsSceneReady] = useState(false);

    // Three.js internal references
    const threeRef = useRef({
        scene: null,
        camera: null,
        renderer: null,
        components: {},
        animId: null,
        targetProgress: 0,
        currentProgress: 0,
        isVisible: true,
        reducedMotion: false,
    });

    // Handle smooth progress update
    const handleStageClick = (idx) => {
        const target = idx / (STAGES.length - 1);
        threeRef.current.targetProgress = target;
        if (containerRef.current) {
            const container = containerRef.current;
            const top = container.offsetTop + target * (container.offsetHeight - window.innerHeight);
            window.scrollTo({ top, behavior: "smooth" });
        }
    };

    useEffect(() => {
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        threeRef.current.reducedMotion = motionQuery.matches;

        // Check hardware tier
        const cores = navigator.hardwareConcurrency || 4;
        const isMobile = window.innerWidth < 768;
        if (cores <= 2 && isMobile) {
            setIsLowPower(true);
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // --- THREE.JS INITIALIZATION ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0c0d10);
        scene.fog = new THREE.FogExp2(0x0c0d10, 0.045);

        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 600;

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
        camera.position.set(0, 4.2, 7.8);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance",
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // --- LIGHTING SETUP (Studio Engineering Rig) ---
        const ambientLight = new THREE.AmbientLight(0xd4d8e0, 0.7);
        scene.add(ambientLight);

        // Key light: Crisp neutral titanium
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(4, 7, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 25;
        keyLight.shadow.bias = -0.0005;
        scene.add(keyLight);

        // Fill light: Cool slate industrial fill
        const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.8);
        fillLight.position.set(-5, 3, -3);
        scene.add(fillLight);

        // Rim / contour accent light
        const rimLight = new THREE.PointLight(0x38bdf8, 1.2, 15);
        rimLight.position.set(0, 4, -4);
        scene.add(rimLight);

        // --- GEOMETRIES & MATERIALS CREATION ---
        const group = new THREE.Group();
        scene.add(group);

        // 1. Lower Chassis Plate (CNC milled aluminum dark anodized)
        const chassisGeo = new THREE.BoxGeometry(4.8, 0.14, 3.4);
        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x16181d,
            roughness: 0.5,
            metalness: 0.7,
        });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.position.y = -0.2;
        chassis.receiveShadow = true;
        group.add(chassis);

        // 2. Motherboard PCB (Substrate layer matte dark graphite with micro traces)
        const pcbGeo = new THREE.BoxGeometry(4.4, 0.08, 3.0);
        const pcbMat = new THREE.MeshStandardMaterial({
            color: 0x111317,
            roughness: 0.6,
            metalness: 0.25,
        });
        const pcb = new THREE.Mesh(pcbGeo, pcbMat);
        pcb.position.y = 0.0;
        pcb.castShadow = true;
        pcb.receiveShadow = true;
        group.add(pcb);

        // 2b. Motherboard Gold Bus Traces & Grid Accents
        const gridHelper = new THREE.GridHelper(3.8, 18, 0xc8983e, 0x272f3d);
        gridHelper.position.y = 0.045;
        group.add(gridHelper);

        // 3. CPU / GPU Silicon Socket & BGA Chip Die
        const cpuSocketGeo = new THREE.BoxGeometry(1.2, 0.06, 1.2);
        const cpuSocketMat = new THREE.MeshStandardMaterial({
            color: 0x0a0c10,
            roughness: 0.4,
            metalness: 0.85,
        });
        const cpuSocket = new THREE.Mesh(cpuSocketGeo, cpuSocketMat);
        cpuSocket.position.set(-0.6, 0.08, 0.1);
        group.add(cpuSocket);

        // BGA Mirror Silicon Die
        const cpuDieGeo = new THREE.BoxGeometry(0.85, 0.03, 0.85);
        const cpuDieMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.08,
            metalness: 0.98,
        });
        const cpuDie = new THREE.Mesh(cpuDieGeo, cpuDieMat);
        cpuDie.position.set(-0.6, 0.12, 0.1);
        group.add(cpuDie);

        // Thermal Interface Compound Droplet (Phase change pad simulation)
        const pasteGeo = new THREE.CylinderGeometry(0.35, 0.42, 0.02, 16);
        const pasteMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.7,
            metalness: 0.1,
            transparent: true,
            opacity: 0,
        });
        const pasteMesh = new THREE.Mesh(pasteGeo, pasteMat);
        pasteMesh.position.set(-0.6, 0.14, 0.1);
        group.add(pasteMesh);

        // VRM Power Inductors & Caps
        const vrmGroup = new THREE.Group();
        const vrmGeo = new THREE.BoxGeometry(0.24, 0.16, 0.24);
        const vrmMat = new THREE.MeshStandardMaterial({ color: 0x1e2229, roughness: 0.3, metalness: 0.9 });
        for (let i = 0; i < 4; i++) {
            const vrm = new THREE.Mesh(vrmGeo, vrmMat);
            vrm.position.set(-1.4, 0.12, -0.4 + i * 0.32);
            vrmGroup.add(vrm);
        }
        group.add(vrmGroup);

        // RAM SO-DIMM Slots
        const ramGeo = new THREE.BoxGeometry(1.6, 0.14, 0.3);
        const ramMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.4, metalness: 0.6 });
        const ramStick1 = new THREE.Mesh(ramGeo, ramMat);
        ramStick1.position.set(0.9, 0.11, -0.6);
        const ramStick2 = new THREE.Mesh(ramGeo, ramMat);
        ramStick2.position.set(0.9, 0.11, -0.15);
        group.add(ramStick1);
        group.add(ramStick2);

        // M.2 NVMe Slot with Thermal Label
        const m2Geo = new THREE.BoxGeometry(1.5, 0.05, 0.45);
        const m2Mat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });
        const m2Mesh = new THREE.Mesh(m2Geo, m2Mat);
        m2Mesh.position.set(0.9, 0.08, 0.75);
        group.add(m2Mesh);

        // 4. Copper Heat Pipes & Thermal Fin Block (Exploded Component)
        const coolerGroup = new THREE.Group();
        coolerGroup.position.set(0, 0, 0);

        // Pure Sintered Copper Heat Pipes
        const copperMat = new THREE.MeshStandardMaterial({
            color: 0xc8703a,
            roughness: 0.28,
            metalness: 0.92,
        });

        const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 16), copperMat);
        pipe1.rotation.z = Math.PI / 2;
        pipe1.position.set(-0.2, 0.22, 0.0);
        coolerGroup.add(pipe1);

        const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 16), copperMat);
        pipe2.rotation.z = Math.PI / 2;
        pipe2.position.set(-0.2, 0.22, 0.2);
        coolerGroup.add(pipe2);

        // Pure Copper CPU Contact Cold Plate
        const coldPlate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.0), copperMat);
        coldPlate.position.set(-0.6, 0.18, 0.1);
        coolerGroup.add(coldPlate);

        // Aluminum Radiator Fin Stack
        const finGeo = new THREE.BoxGeometry(0.9, 0.32, 1.3);
        const finMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.35,
            metalness: 0.85,
        });
        const finStack = new THREE.Mesh(finGeo, finMat);
        finStack.position.set(1.05, 0.28, 0.1);
        coolerGroup.add(finStack);

        group.add(coolerGroup);

        // 5. Turbine Fan Assembly (Rotates with RPM)
        const fanGroup = new THREE.Group();
        fanGroup.position.set(1.05, 0.3, 0.1);

        const fanHousingGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.22, 24);
        const fanHousingMat = new THREE.MeshStandardMaterial({
            color: 0x0f1218,
            roughness: 0.6,
            metalness: 0.3,
        });
        const fanHousing = new THREE.Mesh(fanHousingGeo, fanHousingMat);
        fanGroup.add(fanHousing);

        // Fan Rotor with pitched blades
        const rotorGroup = new THREE.Group();
        const bladeGeo = new THREE.BoxGeometry(0.1, 0.15, 0.42);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.4,
            metalness: 0.5,
        });
        for (let b = 0; b < 9; b++) {
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.y = (b * Math.PI * 2) / 9;
            blade.rotation.z = 0.2;
            blade.position.x = Math.cos((b * Math.PI * 2) / 9) * 0.25;
            blade.position.z = Math.sin((b * Math.PI * 2) / 9) * 0.25;
            rotorGroup.add(blade);
        }
        fanGroup.add(rotorGroup);
        group.add(fanGroup);

        // 6. Diagnostic Optical Laser Scanner Beam Plane
        const laserGeo = new THREE.PlaneGeometry(4.6, 0.12);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
        });
        const laserBeam = new THREE.Mesh(laserGeo, laserMat);
        laserBeam.rotation.x = Math.PI / 2;
        laserBeam.position.set(0, 0.25, -1.6);
        group.add(laserBeam);

        // 7. Micro-soldering precision indicator / Thermal target ring
        const targetRingGeo = new THREE.RingGeometry(0.2, 0.25, 24);
        const targetRingMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
        });
        const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
        targetRing.rotation.x = -Math.PI / 2;
        targetRing.position.set(-0.6, 0.2, 0.1);
        group.add(targetRing);

        threeRef.current = {
            ...threeRef.current,
            scene,
            camera,
            renderer,
            components: {
                group,
                chassis,
                pcb,
                coolerGroup,
                fanGroup,
                rotorGroup,
                laserBeam,
                targetRing,
                pasteMesh,
                cpuDie,
            },
        };

        setIsSceneReady(true);

        // --- RENDER LOOP ---
        let clock = new THREE.Clock();

        const animate = () => {
            const ref = threeRef.current;
            if (!ref.renderer || !ref.scene || !ref.camera) return;

            // Stop rendering when outside viewport
            if (!ref.isVisible) {
                ref.animId = requestAnimationFrame(animate);
                return;
            }

            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            // Smooth interpolation to target scroll progress
            ref.currentProgress += (ref.targetProgress - ref.currentProgress) * 0.08;
            const p = Math.max(0, Math.min(1, ref.currentProgress));

            const {
                group,
                chassis,
                coolerGroup,
                fanGroup,
                rotorGroup,
                laserBeam,
                targetRing,
                pasteMesh,
            } = ref.components;

            // STAGE 01: Intake Optical Scan (0.00 - 0.25)
            // STAGE 02: Exploded Isolation (0.25 - 0.50)
            // STAGE 03: Microsoldering & Thermal (0.50 - 0.75)
            // STAGE 04: Assembly & 25-Point QC (0.75 - 1.00)

            // Stage 1 Laser Sweep (active when p < 0.3)
            if (p < 0.32) {
                laserBeam.visible = true;
                const sweepCycle = (elapsed * 1.5) % 3.0 - 1.5;
                laserBeam.position.z = sweepCycle;
                laserBeam.material.opacity = (1 - p / 0.32) * 0.9;
            } else {
                laserBeam.visible = false;
            }

            // Stage 2 & 3: Component Exploded View Lifting
            let explodeFactor = 0;
            if (p >= 0.22 && p < 0.78) {
                // Peak exploded height in stages 2 and 3
                const stageP = (p - 0.22) / 0.56;
                explodeFactor = Math.sin(stageP * Math.PI);
            }

            // Chassis lowers
            chassis.position.y = -0.2 - explodeFactor * 0.5;

            // Cooler floats up
            coolerGroup.position.y = explodeFactor * 1.35;

            // Fan floats up even higher
            fanGroup.position.y = 0.3 + explodeFactor * 1.6;

            // Stage 3: Microsoldering glow & thermal paste application
            if (p >= 0.48 && p < 0.78) {
                const microP = (p - 0.48) / 0.3;
                targetRing.visible = true;
                targetRing.material.opacity = Math.sin(microP * Math.PI) * (0.6 + Math.sin(elapsed * 8) * 0.3);
                targetRing.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.1);

                pasteMesh.visible = true;
                pasteMesh.material.opacity = Math.min(1, microP * 2);
                pasteMesh.scale.set(1 + microP * 0.2, 1, 1 + microP * 0.2);
            } else if (p >= 0.78) {
                targetRing.visible = false;
                pasteMesh.visible = true;
                pasteMesh.material.opacity = 1;
            } else {
                targetRing.visible = false;
                pasteMesh.visible = false;
            }

            // Stage 4: Fan spin up when assembled
            if (p > 0.72) {
                const fanSpeed = ((p - 0.72) / 0.28) * 25;
                rotorGroup.rotation.y += fanSpeed * delta;
            } else {
                rotorGroup.rotation.y += 0.8 * delta; // subtle idle rotation
            }

            // Camera orbit & angle transitions based on progress
            if (!ref.reducedMotion) {
                // Smooth camera motion
                const targetCamY = 3.6 + Math.sin(p * Math.PI) * 0.8;
                const targetCamZ = 7.4 - Math.sin(p * Math.PI * 0.5) * 1.2;
                const targetCamX = Math.sin(p * Math.PI * 1.5) * 0.9;

                ref.camera.position.x += (targetCamX - ref.camera.position.x) * 0.05;
                ref.camera.position.y += (targetCamY - ref.camera.position.y) * 0.05;
                ref.camera.position.z += (targetCamZ - ref.camera.position.z) * 0.05;
                ref.camera.lookAt(0, explodeFactor * 0.4, 0);

                // Subtle hardware tilt
                group.rotation.y = 0.35 + Math.sin(elapsed * 0.5) * 0.05 + p * 0.4;
                group.rotation.x = 0.2 + Math.cos(elapsed * 0.4) * 0.02 - explodeFactor * 0.08;
            }

            ref.renderer.render(ref.scene, ref.camera);
            ref.animId = requestAnimationFrame(animate);
        };

        threeRef.current.animId = requestAnimationFrame(animate);

        // --- RESIZE LISTENER ---
        const handleResize = () => {
            if (!canvasRef.current || !threeRef.current.renderer || !threeRef.current.camera) return;
            const w = canvasRef.current.clientWidth;
            const h = canvasRef.current.clientHeight;
            threeRef.current.camera.aspect = w / h;
            // Adjust FOV on small mobile devices to avoid cutoffs
            threeRef.current.camera.fov = w < 640 ? 50 : 38;
            threeRef.current.camera.updateProjectionMatrix();
            threeRef.current.renderer.setSize(w, h);
        };

        window.addEventListener("resize", handleResize);

        // --- INTERSECTION OBSERVER FOR GPU EFFICIENCY ---
        const observer = new IntersectionObserver(
            ([entry]) => {
                threeRef.current.isVisible = entry.isIntersecting;
            },
            { threshold: 0.05 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        // --- SCROLL DRIVER LISTENER ---
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
            if (totalScrollable <= 0) return;

            const scrolled = -rect.top;
            const rawProgress = scrolled / totalScrollable;
            const clamped = Math.max(0, Math.min(1, rawProgress));

            threeRef.current.targetProgress = clamped;
            setProgress(clamped);

            const activeIdx = Math.min(
                STAGES.length - 1,
                Math.max(0, Math.floor(clamped * STAGES.length))
            );
            setCurrentStageIdx(activeIdx);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleScroll);
            if (containerRef.current) observer.unobserve(containerRef.current);
            if (threeRef.current.animId) cancelAnimationFrame(threeRef.current.animId);

            // Clean Three.js memory allocations
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            renderer.dispose();
        };
    }, []);

    const activeStage = STAGES[currentStageIdx];

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-[#0c0d10] text-zinc-100 border-y border-zinc-800/80"
            style={{ height: "320vh" }}
            id="service-workflow"
        >
            {/* Sticky 100vh Viewport Wrapper */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
                {/* 3D WebGL Canvas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing z-0"
                />

                {/* Top Telemetry Header HUD */}
                <div className="relative z-10 w-full px-4 sm:px-8 pt-6 sm:pt-8 pointer-events-none">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4 backdrop-blur-[2px]">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <div className="font-mono text-2xs sm:text-xs uppercase tracking-widest text-zinc-400">
                                YVS Engineering Lab &bull; Hardware Service Disassembly Telemetry
                            </div>
                        </div>

                        {/* Interactive Stage Scrubbers */}
                        <div className="pointer-events-auto flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 shadow-lg">
                            {STAGES.map((s, idx) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleStageClick(idx)}
                                    className={`px-2.5 py-1 text-2xs font-mono font-bold rounded transition-all cursor-pointer ${
                                        currentStageIdx === idx
                                            ? "bg-zinc-100 text-zinc-950 shadow-xs"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                    }`}
                                >
                                    {s.step} {s.badge}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Architectural HUD Card */}
                <div className="relative z-10 w-full px-4 sm:px-8 pb-6 sm:pb-8 pointer-events-none">
                    <div className="max-w-7xl mx-auto">
                        <div className="pointer-events-auto bg-zinc-950/85 border border-zinc-800 backdrop-blur-md rounded-2xl p-5 sm:p-7 shadow-2xl transition-all max-w-2xl">
                            {/* Step Badge & Tech Status Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-zinc-800/80 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                                        STAGE {activeStage.step} / 04
                                    </span>
                                    <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
                                        {activeStage.subtitle}
                                    </span>
                                </div>
                                <div className="font-mono text-3xs text-emerald-400 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" />
                                    <span>{activeStage.statusText}</span>
                                </div>
                            </div>

                            {/* Headline */}
                            <h3 className="font-grotesk text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                                {activeStage.title}
                            </h3>

                            {/* Detailed Description */}
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-5">
                                {activeStage.description}
                            </p>

                            {/* 3 Telemetry Spec Tags */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                {activeStage.metrics.map((m, mi) => (
                                    <div
                                        key={mi}
                                        className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-2.5 flex flex-col justify-between"
                                    >
                                        <span className="text-3xs font-mono uppercase tracking-widest text-zinc-500 mb-0.5">
                                            {m.label}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-zinc-200">
                                            {m.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Scroll Indicator Prompt */}
                            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-3xs font-mono text-zinc-500">
                                <span>Gulir ke bawah untuk melihat urutan pengerjaan &rarr;</span>
                                <span className="text-zinc-400 font-bold">
                                    {(progress * 100).toFixed(0)}% PROGRESS
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
