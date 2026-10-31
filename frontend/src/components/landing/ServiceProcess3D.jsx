import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// Continuous Smooth Camera Path (Hermite Spline)
const CAMERA_WAYPOINTS = [
    { p: 0.00, cam: [0, 4.8, 5.8], look: [0, 0, 0] },          // Broad studio overview of motherboard
    { p: 0.20, cam: [0.6, 3.4, 4.2], look: [0.1, 0.1, 0] },     // Approaching logic board
    { p: 0.45, cam: [-0.3, 2.2, 2.2], look: [-0.6, 0.15, 0.2] },// Macro dive into CPU socket area
    { p: 0.65, cam: [-0.6, 1.8, 1.6], look: [-0.6, 0.15, 0.2] },// Close-up on CPU socket rework & thermal compound
    { p: 0.85, cam: [-0.2, 2.8, 3.6], look: [-0.1, 0.2, 0] },   // Reassembly pull-back
    { p: 1.00, cam: [2.5, 3.2, 4.5], look: [0, 0.1, 0] },       // 3/4 hero beauty angle
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

// Utility to normalize and scale any GLTF model to a target bounding size
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
    const [isLoading, setIsLoading] = useState(true);

    const threeState = useRef({
        scene: null,
        camera: null,
        renderer: null,
        targetProgress: 0,
        currentProgress: 0,
        components: {},
        animFrameId: null,
        mouseX: 0,
        mouseY: 0,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        // 1. Scene, Camera, Renderer (Neutral studio matching ERP slate-100)
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9);

        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
        camera.position.set(0, 4.8, 5.8);
        camera.lookAt(0, 0, 0);

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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
        keyLight.position.set(5, 9, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 22;
        keyLight.shadow.bias = -0.0005;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.8);
        fillLight.position.set(-6, 5, -3);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
        rimLight.position.set(0, 6, -5);
        scene.add(rimLight);

        // ESD Workbench Mat surface
        const matGeo = new THREE.BoxGeometry(6.4, 0.08, 6.4);
        const matMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.8,
            metalness: 0.15,
        });
        const workbenchMat = new THREE.Mesh(matGeo, matMaterial);
        workbenchMat.position.y = -0.04;
        workbenchMat.receiveShadow = true;
        scene.add(workbenchMat);

        // Ground shadow plane
        const shadowPlaneGeo = new THREE.PlaneGeometry(16, 16);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.22 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = 0.002;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        // 3. HARDWARE ASSEMBLY SETUP
        const hardwareRoot = new THREE.Group();
        hardwareRoot.position.set(0, 0.04, 0);
        scene.add(hardwareRoot);

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

        // Safe async loader
        const loadSafe = async (url) => {
            try {
                return await gltfLoader.loadAsync(url);
            } catch (e) {
                console.warn(`[3D Loader] Failed to load ${url}:`, e);
                return null;
            }
        };

        // Load photorealistic hardware components in parallel
        Promise.all([
            loadSafe("/models/motherboard.glb"),
            loadSafe("/models/cpu.glb"),
            loadSafe("/models/gpu.glb"),
            loadSafe("/models/ram.glb"),
        ])
            .then(([mbGltf, cpuGltf, gpuGltf, ramGltf]) => {
                // A. Real 3D Motherboard
                if (mbGltf) {
                    const mbScene = mbGltf.scene;
                    normalizeModel(mbScene, 4.2);
                    mbScene.position.set(0, 0, 0);
                    hardwareRoot.add(mbScene);
                }

                // B. Real 3D CPU in socket
                if (cpuGltf) {
                    const cpuScene = cpuGltf.scene;
                    normalizeModel(cpuScene, 0.85);
                    cpuScene.position.set(-0.6, 0.12, 0.2);
                    hardwareRoot.add(cpuScene);
                }

                // C. Real 3D Dual-Channel RAM Sticks
                if (ramGltf) {
                    const ramScene1 = ramGltf.scene;
                    normalizeModel(ramScene1, 1.35);
                    ramScene1.position.set(-1.18, 0.14, -0.55);
                    hardwareRoot.add(ramScene1);

                    const ramScene2 = ramScene1.clone(true);
                    ramScene2.position.set(-1.38, 0.14, -0.55);
                    hardwareRoot.add(ramScene2);
                }

                // D. Real 3D Dedicated GPU in PCIe Slot
                if (gpuGltf) {
                    const gpuScene = gpuGltf.scene;
                    normalizeModel(gpuScene, 1.5);
                    gpuScene.position.set(0.85, 0.16, 0.1);
                    hardwareRoot.add(gpuScene);
                }

                // E. Copper Heatsink Cooler Assembly
                const heatsinkGroup = new THREE.Group();
                heatsinkGroup.position.set(0, 0.18, 0);
                hardwareRoot.add(heatsinkGroup);

                const copperMat = new THREE.MeshStandardMaterial({
                    color: 0xdf8445,
                    metalness: 0.92,
                    roughness: 0.18,
                });
                const finMat = new THREE.MeshStandardMaterial({
                    color: 0x94a3b8,
                    metalness: 0.85,
                    roughness: 0.25,
                });

                // Copper contact cold plate
                const cpuPlate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.95), copperMat);
                cpuPlate.position.set(-0.6, 0.02, 0.2);
                cpuPlate.castShadow = true;
                heatsinkGroup.add(cpuPlate);

                // Heatpipes
                const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.8, 16), copperMat);
                pipe1.rotation.z = Math.PI / 2;
                pipe1.position.set(0.0, 0.05, 0.1);
                pipe1.castShadow = true;
                heatsinkGroup.add(pipe1);

                const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.8, 16), copperMat);
                pipe2.rotation.z = Math.PI / 2;
                pipe2.position.set(0.0, 0.05, 0.3);
                pipe2.castShadow = true;
                heatsinkGroup.add(pipe2);

                // Aluminum fin stack cooler
                const finStack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.85), finMat);
                finStack.position.set(-0.6, 0.3, 0.2);
                finStack.castShadow = true;
                heatsinkGroup.add(finStack);

                // F. High-grade Thermal Paste on CPU
                const pasteMat = new THREE.MeshStandardMaterial({
                    color: 0xb0b8c4,
                    metalness: 0.4,
                    roughness: 0.5,
                });
                const thermalPaste = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.28, 0.32, 0.025, 24),
                    pasteMat
                );
                thermalPaste.position.set(-0.6, 0.145, 0.2);
                thermalPaste.scale.set(0.001, 0.001, 0.001);
                hardwareRoot.add(thermalPaste);

                // G. Precision micro-rework laser / diagnostic calibration ring
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
                probeRing.position.set(-0.6, 0.155, 0.2);
                hardwareRoot.add(probeRing);

                // Store references for render loop
                threeState.current.components = {
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
            threeState.current.mouseX = (e.clientX / window.innerWidth - 0.5) * 0.25;
            threeState.current.mouseY = (e.clientY / window.innerHeight - 0.5) * 0.15;
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
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        // 4. ANIMATION RENDER LOOP (Continuous & Smooth)
        let clock = 0;

        const animate = () => {
            threeState.current.animFrameId = requestAnimationFrame(animate);

            clock += 0.016;
            const state = threeState.current;
            const lerpFactor = motionQuery.matches ? 0.3 : 0.085;
            state.currentProgress += (state.targetProgress - state.currentProgress) * lerpFactor;
            const p = state.currentProgress;

            const {
                heatsinkGroup,
                thermalPaste,
                probeRing,
            } = state.components;

            // Camera movement
            const { camX, camY, camZ, lookX, lookY, lookZ } = interpolateCamera(p);
            camera.position.set(camX + state.mouseX, camY + state.mouseY, camZ);
            camera.lookAt(lookX, lookY, lookZ);

            // Heatsink lift & thermal paste application (0.45 to 0.88)
            if (heatsinkGroup && thermalPaste && probeRing) {
                if (p < 0.45) {
                    heatsinkGroup.position.y = 0.18;
                    heatsinkGroup.rotation.x = 0;
                    thermalPaste.scale.set(0.001, 0.001, 0.001);
                    probeRing.material.opacity = 0;
                } else if (p < 0.60) {
                    const t = (p - 0.45) / 0.15;
                    const smoothT = t * t * (3 - 2 * t);
                    heatsinkGroup.position.y = 0.18 + smoothT * 1.5;
                    heatsinkGroup.rotation.x = smoothT * 0.2;
                    thermalPaste.scale.set(smoothT, smoothT, smoothT);
                    probeRing.material.opacity = smoothT * 0.85;
                } else if (p < 0.75) {
                    const t = (p - 0.60) / 0.15;
                    heatsinkGroup.position.y = 1.68;
                    heatsinkGroup.rotation.x = 0.2;
                    thermalPaste.scale.set(1, 1, 1);
                    probeRing.material.opacity = 0.85 - t * 0.4;
                    const pulse = 1 + Math.sin(clock * 6) * 0.08;
                    probeRing.scale.set(pulse, pulse, 1);
                } else if (p < 0.88) {
                    const t = (p - 0.75) / 0.13;
                    const smoothT = t * t * (3 - 2 * t);
                    heatsinkGroup.position.y = 1.68 - smoothT * 1.5;
                    heatsinkGroup.rotation.x = 0.2 - smoothT * 0.2;
                    probeRing.material.opacity = 0;
                } else {
                    heatsinkGroup.position.y = 0.18;
                    heatsinkGroup.rotation.x = 0;
                    probeRing.material.opacity = 0;
                }
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
                    obj.geometry?.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m?.dispose());
                    } else if (obj.material) {
                        obj.material?.dispose();
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

                {/* Subtle loading spinner overlay */}
                {isLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/80 backdrop-blur-xs transition-opacity duration-300">
                        <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </section>
    );
}
