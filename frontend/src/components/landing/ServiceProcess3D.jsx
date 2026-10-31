import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// Continuous Camera Path Waypoints (Hermite Spline)
const CAMERA_WAYPOINTS = [
    { p: 0.00, cam: [0, 2.6, 7.2], look: [0, 0.1, 0] },     // Closed laptop beauty view
    { p: 0.15, cam: [0, 2.2, 5.8], look: [0, 0.1, 0] },     // Approach before open
    { p: 0.35, cam: [0, 3.2, 5.2], look: [0, 0.8, -0.3] },  // Lid open, viewing Retina display
    { p: 0.55, cam: [0.7, 3.8, 3.2], look: [0.1, 0.2, 0] }, // Exploded macro view diving into motherboard
    { p: 0.75, cam: [-0.6, 3.0, 2.4], look: [-0.5, 0.1, 0.2] }, // Close-up on CPU socket rework
    { p: 0.90, cam: [0.6, 2.6, 5.2], look: [0, 0.3, 0] },   // Pulls back as unit reassembles
    { p: 1.00, cam: [2.2, 2.4, 6.2], look: [0, 0.3, 0] },   // 3/4 hero beauty angle
];

function interpolateCamera(progress) {
    const p = Math.min(Math.max(progress, 0), 1);
    let idx = 0;
    for (let i = 0; i < CAMERA_WAYPOINTS.length - 1; i++) {
        if (p >= CAMERA_WAYPOINTS[i].p && p <= CAMERA_WAYPOINTS[i + 1].p) {
            idx = i;
            break;
        }
    }
    const w1 = CAMERA_WAYPOINTS[idx];
    const w2 = CAMERA_WAYPOINTS[idx + 1];
    const span = w2.p - w1.p;
    const rawT = span > 0 ? (p - w1.p) / span : 0;
    const t = rawT * rawT * (3 - 2 * rawT);

    const camX = w1.cam[0] + (w2.cam[0] - w1.cam[0]) * t;
    const camY = w1.cam[1] + (w2.cam[1] - w1.cam[1]) * t;
    const camZ = w1.cam[2] + (w2.cam[2] - w1.cam[2]) * t;

    const lookX = w1.look[0] + (w2.look[0] - w1.look[0]) * t;
    const lookY = w1.look[1] + (w2.look[1] - w1.look[1]) * t;
    const lookZ = w1.look[2] + (w2.look[2] - w1.look[2]) * t;

    return { camX, camY, camZ, lookX, lookY, lookZ };
}

// Draw dynamic screen UI onto persistent canvas
function updateScreenCanvas(canvas, progress) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle technical grid
    ctx.strokeStyle = "rgba(59, 130, 246, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Top status bar
    ctx.fillStyle = "#131b2a";
    ctx.fillRect(0, 0, canvas.width, 44);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 42, canvas.width, 2);

    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#93c5fd";
    ctx.fillText("YVS COMPUTER // HARDWARE DIAGNOSTIC TELEMETRY v4.2", 24, 28);

    ctx.font = "14px monospace";
    ctx.fillStyle = "#10b981";
    ctx.fillText("STATUS: ACTIVE", canvas.width - 160, 28);

    // Final Stage: 25-Point QC Certificate
    if (progress >= 0.88) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.strokeRect(180, 100, canvas.width - 360, 440);
        ctx.fillRect(180, 100, canvas.width - 360, 440);

        ctx.fillStyle = "#10b981";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("25-POINT QC MATRIX: PASSED", canvas.width / 2, 190);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "18px sans-serif";
        ctx.fillText("Seluruh Pengujian Daya, Beban Penuh & Suhu Lolos Sertifikasi", canvas.width / 2, 245);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "15px monospace";
        ctx.fillText("CPU PEAK TEMP: 62°C (OK)  |  GPU STRESS: PASS (120 FPS)", canvas.width / 2, 310);
        ctx.fillText("VCORE STABILITY: 1.05V ±0.01V  |  NVMe READ: 3450 MB/s", canvas.width / 2, 345);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 16px monospace";
        ctx.fillText("DIGITAL WARRANTY CERTIFICATE #YVS-PASS-2026 ACTIVE", canvas.width / 2, 420);
        ctx.textAlign = "left";
    } else {
        // Power Rail Monitor Card
        ctx.fillStyle = "rgba(22, 30, 46, 0.8)";
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(40, 70, 440, 250);
        ctx.fillRect(40, 70, 440, 250);

        ctx.font = "bold 15px monospace";
        ctx.fillStyle = "#60a5fa";
        ctx.fillText("POWER RAIL VOLTAGE MONITOR", 58, 100);

        const rails = [
            { name: "VIN PRIMARY ADAPTER", val: "19.42V", status: "STABLE" },
            { name: "3.3V ALWAYS-ON RAIL", val: "3.31V", status: "NOMINAL" },
            { name: "5.0V AUXILIARY RAIL", val: "5.04V", status: "NOMINAL" },
            { name: "CPU VCORE CONTROLLER", val: "1.05V", status: "LOCKED" },
            { name: "DRAM VDD SUPPLY", val: "1.20V", status: "NOMINAL" },
        ];

        rails.forEach((r, idx) => {
            const y = 138 + idx * 28;
            ctx.font = "13px monospace";
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText(r.name, 58, y);
            ctx.fillStyle = "#38bdf8";
            ctx.fillText(r.val, 280, y);
            ctx.fillStyle = "#10b981";
            ctx.fillText(r.status, 390, y);
        });

        // Thermal Interface Monitor Card
        ctx.strokeRect(520, 70, 460, 250);
        ctx.fillRect(520, 70, 460, 250);

        ctx.font = "bold 15px monospace";
        ctx.fillStyle = "#60a5fa";
        ctx.fillText("THERMAL INTERFACE TELEMETRY", 538, 100);

        const thermals = [
            { label: "CPU DIE TEMPERATURE", val: "44°C", pct: 0.38, col: "#10b981" },
            { label: "GPU DIE TEMPERATURE", val: "41°C", pct: 0.35, col: "#10b981" },
            { label: "VRM MOSFET MOS1", val: "48°C", pct: 0.42, col: "#38bdf8" },
            { label: "CHIPSET PCH CORE", val: "46°C", pct: 0.40, col: "#38bdf8" },
        ];

        thermals.forEach((t, idx) => {
            const y = 132 + idx * 44;
            ctx.font = "12px monospace";
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText(`${t.label}: ${t.val}`, 538, y);

            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.fillRect(538, y + 8, 300, 10);
            ctx.fillStyle = t.col;
            ctx.fillRect(538, y + 8, 300 * t.pct, 10);
        });

        // Diagnostic Console Log
        ctx.strokeRect(40, 350, 940, 240);
        ctx.fillRect(40, 350, 940, 240);

        ctx.font = "bold 14px monospace";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("SYSTEM WORKSHOP LOG // YVS REAL-TIME DISPATCH", 58, 380);

        const logs = [
            "[OK] Non-destructive optical scan completed. Chassis tolerance 0.05mm verified.",
            `[SYS] Progress Timeline: ${Math.round(progress * 100)}%`,
            "[ENG] Logic board power distribution lines mapped via stereoscopic inspection.",
            "[INFO] Micro-soldering rework and phase-change thermal compound ready.",
            "[TEL] Telemetry live link: YVS Workshop Cloud node #04 connected.",
        ];

        ctx.font = "13px monospace";
        logs.forEach((line, idx) => {
            ctx.fillStyle = idx === 0 ? "#10b981" : idx === 1 ? "#38bdf8" : "#94a3b8";
            ctx.fillText(line, 58, 418 + idx * 32);
        });
    }
}

// Utility to normalize and scale any GLTF model to a target size
function normalizeModel(model, targetSize) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.clone().multiplyScalar(scale));
    return { box, size, center, scale };
}

export default function ServiceProcess3D() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [scrollPct, setScrollPct] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const threeState = useRef({
        scene: null,
        camera: null,
        renderer: null,
        targetProgress: 0,
        currentProgress: 0,
        components: {},
        animFrameId: null,
        screenCanvas: null,
        screenTexture: null,
        mouseX: 0,
        mouseY: 0,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        // 1. Scene, Camera, Renderer (Clean studio without fog)
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9);

        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
        camera.position.set(0, 2.6, 7.2);
        camera.lookAt(0, 0.1, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
        });
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;

        // 2. High-Contrast Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(5, 9, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 22;
        keyLight.shadow.bias = -0.0005;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.7);
        fillLight.position.set(-6, 5, -3);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
        rimLight.position.set(0, 6, -5);
        scene.add(rimLight);

        // Ground shadow plane
        const shadowPlaneGeo = new THREE.PlaneGeometry(16, 16);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.15 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.12;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        // 3. MASTER SCENE ROOTS
        const masterRoot = new THREE.Group();
        scene.add(masterRoot);

        // Screen texture setup
        const screenCanvas = document.createElement("canvas");
        screenCanvas.width = 1024;
        screenCanvas.height = 640;
        updateScreenCanvas(screenCanvas, 0);
        const screenTexture = new THREE.CanvasTexture(screenCanvas);

        // GLTF Loaders Setup (Local DRACO + KTX2 + Meshopt)
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/draco/");

        const ktx2Loader = new KTX2Loader();
        ktx2Loader.setTranscoderPath("/basis/");
        ktx2Loader.detectSupport(renderer);

        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);
        gltfLoader.setKTX2Loader(ktx2Loader);
        gltfLoader.setMeshoptDecoder(MeshoptDecoder);

        // Safe async loader for robust error resilience
        const loadSafe = async (url) => {
            try {
                return await gltfLoader.loadAsync(url);
            } catch (e) {
                console.warn(`[3D Loader] Failed to load ${url}:`, e);
                return null;
            }
        };

        // Load photorealistic models in parallel
        Promise.all([
            loadSafe("/models/macbook-rigged.glb"),
            loadSafe("/models/motherboard.glb"),
            loadSafe("/models/cpu.glb"),
            loadSafe("/models/gpu.glb"),
            loadSafe("/models/ram.glb"),
        ])
            .then(([macbookGltf, mbGltf, cpuGltf, gpuGltf, ramGltf]) => {
                let macbookScene = null;
                let lidPivot = null;
                let baseGroup = null;

                // A. MACBOOK PRO RIGGING
                if (macbookGltf) {
                    macbookScene = macbookGltf.scene;
                    normalizeModel(macbookScene, 4.3);

                    lidPivot = macbookScene.getObjectByName("LidPivot");
                    baseGroup = macbookScene.getObjectByName("Base");
                    const screenMesh = macbookScene.getObjectByName("Screen");

                    if (baseGroup) {
                        baseGroup.userData.initPos = baseGroup.position.clone();
                    }

                    if (screenMesh && screenMesh.isMesh) {
                        screenMesh.material = new THREE.MeshBasicMaterial({
                            map: screenTexture,
                            toneMapped: false,
                            side: THREE.DoubleSide,
                        });
                    }

                    // Fallback LidPivot setup if not nested
                    if (!lidPivot) {
                        lidPivot = new THREE.Group();
                        lidPivot.position.set(0, 0.1, -1.5);
                        macbookScene.add(lidPivot);
                    }

                    masterRoot.add(macbookScene);
                }

                // B. INTERNAL LOGIC BOARD & HARDWARE ASSEMBLY
                const internalsGroup = new THREE.Group();
                internalsGroup.position.set(0, 0.05, 0);
                internalsGroup.visible = false;
                masterRoot.add(internalsGroup);

                // Real 3D Motherboard
                if (mbGltf) {
                    const mbScene = mbGltf.scene;
                    normalizeModel(mbScene, 3.8);
                    mbScene.position.set(0, 0, 0);
                    internalsGroup.add(mbScene);
                }

                // Real 3D CPU
                if (cpuGltf) {
                    const cpuScene = cpuGltf.scene;
                    normalizeModel(cpuScene, 0.85);
                    cpuScene.position.set(-0.6, 0.12, 0.2);
                    internalsGroup.add(cpuScene);
                }

                // Real 3D RAM Stick
                if (ramGltf) {
                    const ramScene = ramGltf.scene;
                    normalizeModel(ramScene, 1.4);
                    ramScene.position.set(-1.2, 0.15, -0.6);
                    internalsGroup.add(ramScene);
                }

                // Real 3D Dedicated GPU
                if (gpuGltf) {
                    const gpuScene = gpuGltf.scene;
                    normalizeModel(gpuScene, 1.5);
                    gpuScene.position.set(0.9, 0.18, 0.1);
                    internalsGroup.add(gpuScene);
                }

                // Heatsink assembly (Copper cooling pipes & plates)
                const heatsinkGroup = new THREE.Group();
                heatsinkGroup.position.set(0, 0.18, 0);
                internalsGroup.add(heatsinkGroup);

                const copperMat = new THREE.MeshStandardMaterial({
                    color: 0xdf8445,
                    metalness: 0.92,
                    roughness: 0.18,
                });

                const cpuPlate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.95), copperMat);
                cpuPlate.position.set(-0.6, 0.02, 0.2);
                heatsinkGroup.add(cpuPlate);

                const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 16), copperMat);
                pipe1.rotation.z = Math.PI / 2;
                pipe1.position.set(0.1, 0.05, 0.0);
                heatsinkGroup.add(pipe1);

                // Fresh Thermal Paste layer on CPU
                const pasteMat = new THREE.MeshStandardMaterial({
                    color: 0xa8b2c1,
                    metalness: 0.5,
                    roughness: 0.45,
                });
                const thermalPaste = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.32, 0.03, 24),
                    pasteMat
                );
                thermalPaste.position.set(-0.6, 0.15, 0.2);
                thermalPaste.scale.set(0.001, 0.001, 0.001);
                internalsGroup.add(thermalPaste);

                // Precision micro-rework laser ring
                const probeRing = new THREE.Mesh(
                    new THREE.RingGeometry(0.42, 0.48, 32),
                    new THREE.MeshBasicMaterial({
                        color: 0x00d4ff,
                        transparent: true,
                        opacity: 0,
                        side: THREE.DoubleSide,
                    })
                );
                probeRing.rotation.x = -Math.PI / 2;
                probeRing.position.set(-0.6, 0.16, 0.2);
                internalsGroup.add(probeRing);

                // Store references for render loop
                threeState.current.components = {
                    macbookScene,
                    baseGroup,
                    lidPivot,
                    internalsGroup,
                    heatsinkGroup,
                    thermalPaste,
                    probeRing,
                };

                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Error loading photorealistic 3D hardware assets:", err);
                setIsLoading(false);
            });

        threeState.current = {
            ...threeState.current,
            scene,
            camera,
            renderer,
            screenCanvas,
            screenTexture,
        };

        // Resize handler with mobile FOV adaptation
        const handleResize = () => {
            if (!canvas) return;
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            if (w === 0 || h === 0) return;
            camera.aspect = w / h;
            if (w < 640) {
                camera.fov = 48;
            } else if (w < 1024) {
                camera.fov = 42;
            } else {
                camera.fov = 36;
            }
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        };
        handleResize();
        window.addEventListener("resize", handleResize);

        // Subtle pointer parallax
        const handleMouseMove = (e) => {
            threeState.current.mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
            threeState.current.mouseY = (e.clientY / window.innerHeight - 0.5) * 0.2;
        };
        window.addEventListener("mousemove", handleMouseMove, { passive: true });

        // Scroll listener (Direct Scrubber)
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
            if (totalScrollable <= 0) return;

            const progress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1);
            threeState.current.targetProgress = progress;
            setScrollPct(Math.round(progress * 100));
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        // 4. ANIMATION RENDER LOOP (Continuous & Smooth)
        let clock = 0;
        let lastProgressBucket = -1;

        const animate = () => {
            threeState.current.animFrameId = requestAnimationFrame(animate);

            clock += 0.016;
            const state = threeState.current;
            const lerpFactor = motionQuery.matches ? 0.3 : 0.085;
            state.currentProgress += (state.targetProgress - state.currentProgress) * lerpFactor;
            const p = state.currentProgress;

            const {
                macbookScene,
                baseGroup,
                lidPivot,
                internalsGroup,
                heatsinkGroup,
                thermalPaste,
                probeRing,
            } = state.components;

            // Camera movement
            const { camX, camY, camZ, lookX, lookY, lookZ } = interpolateCamera(p);
            camera.position.set(camX + state.mouseX, camY + state.mouseY, camZ);
            camera.lookAt(lookX, lookY, lookZ);

            if (lidPivot) {
                // Clamshell Opening: Closed = 1.94 rad, Open = 0 rad
                const closedX = 1.94;
                const openX = 0;
                if (p < 0.15) {
                    lidPivot.rotation.x = closedX;
                } else if (p < 0.35) {
                    const openT = (p - 0.15) / 0.20;
                    const smoothT = openT * openT * (3 - 2 * openT);
                    lidPivot.rotation.x = closedX + (openX - closedX) * smoothT;
                } else if (p < 0.85) {
                    lidPivot.rotation.x = openX;
                } else {
                    // Settle at refined beauty angle
                    const settleT = (p - 0.85) / 0.15;
                    lidPivot.rotation.x = openX + 0.15 * settleT;
                }
            }

            // Exploded view transition (Motherboard revealed)
            if (internalsGroup && baseGroup) {
                const initPos = baseGroup.userData.initPos || baseGroup.position;
                if (p < 0.35) {
                    internalsGroup.visible = false;
                    baseGroup.position.copy(initPos);
                } else if (p < 0.55) {
                    const t = (p - 0.35) / 0.20;
                    internalsGroup.visible = true;
                    // MacBook base lifts and shifts forward to reveal motherboard below
                    baseGroup.position.y = initPos.y + t * 1.5;
                    baseGroup.position.z = initPos.z + t * 0.8;
                } else if (p < 0.75) {
                    internalsGroup.visible = true;
                    baseGroup.position.y = initPos.y + 1.5;
                    baseGroup.position.z = initPos.z + 0.8;
                } else if (p < 0.88) {
                    const t = (p - 0.75) / 0.13;
                    internalsGroup.visible = true;
                    baseGroup.position.y = initPos.y + (1.5 - t * 1.5);
                    baseGroup.position.z = initPos.z + (0.8 - t * 0.8);
                } else {
                    internalsGroup.visible = false;
                    baseGroup.position.copy(initPos);
                }
            }

            // Heatsink lift & thermal paste application (0.55 to 0.75)
            if (heatsinkGroup && thermalPaste && probeRing) {
                if (p < 0.55) {
                    heatsinkGroup.position.y = 0.18;
                    thermalPaste.scale.set(0.001, 0.001, 0.001);
                    probeRing.material.opacity = 0;
                } else if (p < 0.65) {
                    const t = (p - 0.55) / 0.10;
                    heatsinkGroup.position.y = 0.18 + t * 1.4;
                    thermalPaste.scale.set(t, t, t);
                    probeRing.material.opacity = t * 0.85;
                } else if (p < 0.75) {
                    const t = (p - 0.65) / 0.10;
                    heatsinkGroup.position.y = 1.58;
                    thermalPaste.scale.set(1, 1, 1);
                    probeRing.material.opacity = 0.85 - t * 0.4;
                    const pulse = 1 + Math.sin(clock * 6) * 0.08;
                    probeRing.scale.set(pulse, pulse, 1);
                } else if (p < 0.85) {
                    const t = (p - 0.75) / 0.10;
                    heatsinkGroup.position.y = 1.58 - t * 1.4;
                    probeRing.material.opacity = 0;
                } else {
                    heatsinkGroup.position.y = 0.18;
                    probeRing.material.opacity = 0;
                }
            }

            // Update screen canvas texture
            const currentBucket = p >= 0.88 ? 2 : p >= 0.15 ? 1 : 0;
            if (currentBucket !== lastProgressBucket) {
                lastProgressBucket = currentBucket;
                updateScreenCanvas(state.screenCanvas, p);
                state.screenTexture.needsUpdate = true;
            }

            renderer.render(scene, camera);
        };

        animate();

        // 5. Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("scroll", handleScroll);

            if (threeState.current.animFrameId) {
                cancelAnimationFrame(threeState.current.animFrameId);
            }

            try {
                dracoLoader.dispose();
            } catch (_) {}
            try {
                ktx2Loader.dispose();
            } catch (_) {}

            scene.traverse((obj) => {
                if (obj.isMesh) {
                    obj.geometry.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m.dispose());
                    } else if (obj.material) {
                        obj.material.dispose();
                    }
                }
            });
            renderer.dispose();
        };
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-slate-100"
            style={{ height: "400vh" }}
            id="service-workflow"
        >
            {/* Sticky 100vh viewport container */}
            <div className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden">
                {/* 3D WebGL Canvas */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block cursor-grab active:cursor-grabbing"
                    style={{ touchAction: "pan-y" }}
                />

                {/* Subtle loading spinner overlay if needed */}
                {isLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/80 backdrop-blur-xs transition-opacity duration-300">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                            <span className="font-mono text-xs text-slate-600 font-semibold">
                                Memuat Aset 3D Fotorealistik...
                            </span>
                        </div>
                    </div>
                )}

                {/* Minimal, elegant floating scrub pill at bottom (No bulky stage text cards) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span className="font-mono text-xs font-semibold text-slate-800 tracking-tight">
                            YVS 3D Telemetry Scrub
                        </span>
                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-75 rounded-full"
                                style={{ width: `${scrollPct}%` }}
                            />
                        </div>
                        <span className="font-mono text-xs text-slate-500 font-medium">
                            {scrollPct}%
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
