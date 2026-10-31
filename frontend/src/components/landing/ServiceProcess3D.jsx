import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { CheckCircle2, Cpu, Wrench, ShieldCheck, Search, Activity, Layers, RotateCcw, ChevronRight, Zap } from "lucide-react";

const STAGES = [
    {
        id: "intake",
        step: "01",
        title: "Intake & Non-Destructive Scanning",
        subtitle: "Pemeriksaan Fisik Awal & Uji Integritas Chassis",
        badge: "Tahap 1 · Intake",
        range: [0.0, 0.15],
        description:
            "Setiap perangkat yang masuk diperiksa secara menyeluruh tanpa intervensi invasif: nomor seri diverifikasi, integritas engsel diuji, dan chassis dianalisis untuk mencatat kondisi fisik presisi sebelum diagnosis.",
        metrics: [
            { label: "Inspeksi Chassis", value: "Toleransi 0.05mm" },
            { label: "Deteksi Voltase", value: "3.3V / 5V / 19V Rail" },
            { label: "Bukti Visual", value: "Foto Resolusi Tinggi" },
        ],
        statusText: "OPTICAL_SCAN_ACTIVE // CHASSIS_INTEGRITY_CHECK_PASS",
    },
    {
        id: "clamshell_open",
        step: "02",
        title: "Clamshell Unfolding & Telemetri Layar",
        subtitle: "Pembukaan Engsel & Diagnosis Jalur Daya Primer",
        badge: "Tahap 2 · Diagnosis",
        range: [0.15, 0.35],
        description:
            "Engsel laptop dibuka secara presisi. Panel display dan logic board menerima injeksi daya terkalibrasi untuk memverifikasi konsumsi arus standby dan mendeteksi short-circuit sebelum dekonstruksi.",
        metrics: [
            { label: "Sudut Bukaan", value: "115° Artikulasi" },
            { label: "Arus Standby", value: "0.012A Normal" },
            { label: "Display Signal", value: "eDP 4-Lane Terdeteksi" },
        ],
        statusText: "DISPLAY_PANEL_SYNC // POWER_RAILS_ACTIVE_19V",
    },
    {
        id: "logic_board",
        step: "03",
        title: "Isolasi Komponen Logic Board",
        subtitle: "Dekonstruksi Modular & Pemetaan Jalur Mikron",
        badge: "Tahap 3 · Logic Board",
        range: [0.35, 0.55],
        description:
            "Deck atas dilepas secara modular. Logic board, CPU socket, modul RAM SO-DIMM, NVMe SSD, dan sistem pendingin diisolasi di bawah mikroskop stereoskopik untuk melacak kerusakan jalur semikonduktor.",
        metrics: [
            { label: "Logic Board", value: "FR-4 Multi-Layer PCB" },
            { label: "Kapasitor SMD", value: "High-Q Tantalum" },
            { label: "Bus PCIe Gen4", value: "Jalur Terverifikasi" },
        ],
        statusText: "DECK_SEPARATED // LOGIC_BOARD_MAPPED_OK",
    },
    {
        id: "micro_repair",
        step: "04",
        title: "Mikro-Soldering & Thermal Overhaul",
        subtitle: "Pelepasan Heatsink & Aplikasi Pasta Termal Industri",
        badge: "Tahap 4 · Rework & Termal",
        range: [0.55, 0.75],
        description:
            "Sistem pendingin tembaga diangkat. Die silikon CPU & GPU dibersihkan dari residu lama dan diaplikasikan pasta termal konduktivitas tinggi (Honeywell PTM7950). Titik IC BGA dan rel daya disolder ulang dengan presisi mikron.",
        metrics: [
            { label: "Thermal Compound", value: "Phase-Change PTM7950" },
            { label: "Presisi Solder", value: "Pitch 0.02mm SMD" },
            { label: "Clean Workstation", value: "ESD-Protected Area" },
        ],
        statusText: "HEATSINK_DETACHED // THERMAL_PASTE_REAPPLIED",
    },
    {
        id: "reassembly",
        step: "05",
        title: "Rekonstruksi & Kalibrasi Torsi OEM",
        subtitle: "Pemasangan Kembali Komponen & Penguncian Chassis",
        badge: "Tahap 5 · Perakitan",
        range: [0.75, 0.90],
        description:
            "Heatsink tembaga dipasang kembali ke atas die CPU/GPU dengan torsi sekrup terkalibrasi pabrikan. Deck keyboard dan chassis dirakit ulang secara presisi dengan perlindungan anti-statis.",
        metrics: [
            { label: "Torsi Baut", value: "0.22 N·m Standar Pabrik" },
            { label: "Thermal Contact", value: "Kontak Merata 100%" },
            { label: "Chassis Alignment", value: "Presisi 0-Gap" },
        ],
        statusText: "HEATSINK_SEATED // CHASSIS_REASSEMBLED_LOCKED",
    },
    {
        id: "qc_certification",
        step: "06",
        title: "25-Point QC Seal & Garansi Digital",
        subtitle: "Stress-Test Beban Penuh & Validasi Akhir",
        badge: "Tahap 6 · QC Pass",
        range: [0.90, 1.0],
        description:
            "Unit yang telah selesai menjalani stress-test kontinu selama 2 jam (FurMark & Cinebench). Setelah seluruh 25 titik QC terkonfirmasi lulus, sertifikat garansi digital resmi ber-hash unik diterbitkan.",
        metrics: [
            { label: "Burn-In Test", value: "2 Jam Beban Penuh" },
            { label: "Delta Suhu", value: "ΔT < 14°C Suhu Normal" },
            { label: "Garansi Digital", value: "Sertifikat Ber-Hash" },
        ],
        statusText: "QC_MATRIX_25_POINT_PASS // READY_FOR_DISPATCH",
    },
];

// Helper to generate dynamic canvas texture for laptop screen
function createScreenTexture(stageIdx, progress) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");

    // Background: High-tech diagnostic desktop
    ctx.fillStyle = "#0c111a";
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
    ctx.fillStyle = "#162032";
    ctx.fillRect(0, 0, canvas.width, 44);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, 42, canvas.width, 2);

    // Header text
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#93c5fd";
    ctx.fillText("YVS COMPUTER // HARDWARE DIAGNOSTIC TELEMETRY v4.2", 24, 28);

    ctx.font = "14px monospace";
    ctx.fillStyle = "#10b981";
    ctx.fillText("STATUS: ONLINE", canvas.width - 160, 28);

    // Stage 6 special: Big QC Passed Seal
    if (stageIdx >= 5 || progress >= 0.88) {
        // Large verification card
        ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.strokeRect(180, 110, canvas.width - 360, 420);
        ctx.fillRect(180, 110, canvas.width - 360, 420);

        ctx.fillStyle = "#10b981";
        ctx.font = "bold 38px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("25-POINT QC MATRIX: PASSED", canvas.width / 2, 210);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "18px sans-serif";
        ctx.fillText("Seluruh Pengujian Daya, Beban Penuh & Suhu Lolos Sertifikasi", canvas.width / 2, 260);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "15px monospace";
        ctx.fillText("CPU PEAK TEMP: 62°C (OK)  |  GPU STRESS: PASS (120 FPS)", canvas.width / 2, 320);
        ctx.fillText("VCORE STABILITY: 1.05V ±0.01V  |  NVMe READ: 3450 MB/s", canvas.width / 2, 355);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 16px monospace";
        ctx.fillText("DIGITAL WARRANTY CERTIFICATE #YVS-PASS-2026 ACTIVE", canvas.width / 2, 430);

        ctx.textAlign = "left";
    } else {
        // Normal diagnostic telemetry panels
        // Panel 1: Volt Rails
        ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(40, 70, 440, 240);
        ctx.fillRect(40, 70, 440, 240);

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
            const y = 135 + idx * 28;
            ctx.font = "13px monospace";
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText(r.name, 58, y);
            ctx.fillStyle = "#38bdf8";
            ctx.fillText(r.val, 280, y);
            ctx.fillStyle = "#10b981";
            ctx.fillText(r.status, 390, y);
        });

        // Panel 2: Thermal Sensor Telemetry
        ctx.strokeRect(520, 70, 460, 240);
        ctx.fillRect(520, 70, 460, 240);

        ctx.font = "bold 15px monospace";
        ctx.fillStyle = "#60a5fa";
        ctx.fillText("THERMAL INTERFACE TELEMETRY", 538, 100);

        // Simple real-time bar graphs
        const thermals = [
            { label: "CPU DIE TEMPERATURE", val: "44°C", pct: 0.38, col: "#10b981" },
            { label: "GPU DIE TEMPERATURE", val: "41°C", pct: 0.35, col: "#10b981" },
            { label: "VRM MOSFET MOS1", val: "48°C", pct: 0.42, col: "#38bdf8" },
            { label: "CHIPSET PCH CORE", val: "46°C", pct: 0.40, col: "#38bdf8" },
        ];

        thermals.forEach((t, idx) => {
            const y = 130 + idx * 42;
            ctx.font = "12px monospace";
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText(`${t.label}: ${t.val}`, 538, y);

            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.fillRect(538, y + 8, 300, 10);
            ctx.fillStyle = t.col;
            ctx.fillRect(538, y + 8, 300 * t.pct, 10);
        });

        // Bottom Console Log Panel
        ctx.strokeRect(40, 340, 940, 250);
        ctx.fillRect(40, 340, 940, 250);

        ctx.font = "bold 14px monospace";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("SYSTEM WORKSHOP LOG // YVS REAL-TIME DISPATCH", 58, 370);

        const logs = [
            "[OK] Non-destructive optical scan completed. Chassis tolerance 0.05mm verified.",
            `[SYS] Active stage: ${STAGES[stageIdx]?.title || "Processing..."}`,
            "[ENG] Logic board power distribution lines mapped via stereoscopic inspection.",
            "[INFO] Micro-soldering rework and phase-change thermal compound ready.",
            "[TEL] Telemetry live link: YVS Workshop Cloud node #04 connected.",
        ];

        ctx.font = "13px monospace";
        logs.forEach((line, idx) => {
            ctx.fillStyle = idx === 0 ? "#10b981" : idx === 1 ? "#38bdf8" : "#94a3b8";
            ctx.fillText(line, 58, 410 + idx * 32);
        });
    }

    return new THREE.CanvasTexture(canvas);
}

// Helper to generate keyboard keycaps texture
function createKeyboardTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Keyboard well background
    ctx.fillStyle = "#1e2229";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Keycaps layout
    const rows = [
        ["ESC", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "DEL"],
        ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "BACKSPACE"],
        ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
        ["CAPS", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ENTER"],
        ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "SHIFT"],
        ["CTRL", "FN", "OPT", "CMD", "      SPACE      ", "CMD", "OPT", "◄", "▲▼", "►"],
    ];

    const paddingX = 24;
    const paddingY = 24;
    const rowHeight = (canvas.height - paddingY * 2) / rows.length;

    rows.forEach((row, rIdx) => {
        const y = paddingY + rIdx * rowHeight;
        const totalKeys = row.length;
        const keyWidth = (canvas.width - paddingX * 2) / totalKeys;

        row.forEach((key, kIdx) => {
            const x = paddingX + kIdx * keyWidth;
            const w = keyWidth - 6;
            const h = rowHeight - 6;

            // Keycap body
            ctx.fillStyle = "#12151b";
            ctx.strokeStyle = "#2d333f";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 4);
            ctx.fill();
            ctx.stroke();

            // Keycap letter
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(key, x + w / 2, y + h / 2);
        });
    });

    return new THREE.CanvasTexture(canvas);
}

// Helper to generate Motherboard PCB circuit texture
function createMotherboardTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    // Dark green-slate FR4 substrate
    ctx.fillStyle = "#0c201d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Circuit traces
    ctx.strokeStyle = "#1b4d45";
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
        const x1 = Math.random() * canvas.width;
        const y1 = Math.random() * canvas.height;
        const x2 = x1 + (Math.random() - 0.5) * 300;
        const y2 = y1 + (Math.random() - 0.5) * 300;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1, y2);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // Gold bus lines
    ctx.strokeStyle = "#c89b3c";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 20; i++) {
        const y = 200 + i * 24;
        ctx.beginPath();
        ctx.moveTo(120, y);
        ctx.lineTo(450, y);
        ctx.stroke();
    }

    // SMD pads
    ctx.fillStyle = "#e2b85e";
    for (let i = 0; i < 80; i++) {
        const px = 100 + Math.random() * 800;
        const py = 100 + Math.random() * 800;
        ctx.fillRect(px, py, 4, 8);
    }

    // Silkscreen text
    ctx.font = "bold 18px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("YVS ENGINEERING MAINBOARD REV 4.2", 60, 60);
    ctx.fillText("ESD PROTECTED // LEAD-FREE ROHS COMPLIANT", 60, 980);

    return new THREE.CanvasTexture(canvas);
}

export default function ServiceProcess3D() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [currentStageIdx, setCurrentStageIdx] = useState(0);
    const [scrollPct, setScrollPct] = useState(0);
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    // References for Three.js state
    const threeState = useRef({
        scene: null,
        camera: null,
        renderer: null,
        targetProgress: 0,
        currentProgress: 0,
        components: {},
        animFrameId: null,
        screenTexture: null,
        screenMaterial: null,
        isInView: true,
    });

    // Handle stage tab click to scroll directly to the stage position
    const scrollToStage = (idx) => {
        if (!containerRef.current) return;
        const stage = STAGES[idx];
        const targetPct = (stage.range[0] + stage.range[1]) / 2;
        const container = containerRef.current;
        const totalScrollable = container.offsetHeight - window.innerHeight;
        const targetScrollTop = container.offsetTop + targetPct * totalScrollable;

        window.scrollTo({
            top: targetScrollTop,
            behavior: "smooth",
        });
    };

    // --- THREE.JS SCENE SETUP & LIFECYCLE ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Check prefers-reduced-motion
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setIsReducedMotion(motionQuery.matches);

        // 1. Scene, Camera, Renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc); // ERP slate-50 studio background
        scene.fog = new THREE.FogExp2(0xf8fafc, 0.04);

        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
        camera.position.set(0, 3.2, 7.5);
        camera.lookAt(0, 0.2, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance",
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 2. Studio Lighting (Crisp high-end industrial tech lab)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
        keyLight.position.set(5, 8, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 25;
        keyLight.shadow.bias = -0.0003;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
        fillLight.position.set(-6, 4, -4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
        rimLight.position.set(0, 5, -6);
        scene.add(rimLight);

        // Ground shadow plane with circular soft shadow
        const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.18 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.15;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        // 3. MASTER LAPTOP ASSEMBLY HIERARCHY
        const laptopRoot = new THREE.Group();
        scene.add(laptopRoot);

        // Materials definition
        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x1e2430, // Space Gray anodized aluminum
            metalness: 0.8,
            roughness: 0.32,
        });

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x11141a,
            metalness: 0.85,
            roughness: 0.25,
        });

        const copperMat = new THREE.MeshStandardMaterial({
            color: 0xc87d42, // Genuine copper luster
            metalness: 0.9,
            roughness: 0.2,
        });

        const siliconDieMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.95,
            roughness: 0.08,
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.95,
            roughness: 0.15,
        });

        const thermalPasteMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8, // Shimmering silver thermal compound
            metalness: 0.4,
            roughness: 0.6,
        });

        // A. LOWER CHASSIS BASE (Fixed to base)
        const baseCaseGeo = new THREE.BoxGeometry(5.2, 0.22, 3.6);
        const baseCase = new THREE.Mesh(baseCaseGeo, chassisMat);
        baseCase.position.set(0, 0, 0);
        baseCase.castShadow = true;
        baseCase.receiveShadow = true;
        laptopRoot.add(baseCase);

        // Side ports (Left & Right USB-C / HDMI cutouts)
        const portGeo = new THREE.BoxGeometry(0.04, 0.08, 0.24);
        const leftPort1 = new THREE.Mesh(portGeo, darkMetalMat);
        leftPort1.position.set(-2.61, 0.02, -0.6);
        const leftPort2 = new THREE.Mesh(portGeo, darkMetalMat);
        leftPort2.position.set(-2.61, 0.02, -0.2);
        const rightPort = new THREE.Mesh(portGeo, darkMetalMat);
        rightPort.position.set(2.61, 0.02, -0.4);
        laptopRoot.add(leftPort1, leftPort2, rightPort);

        // Rubber feet on bottom
        const footGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
        const footMat = new THREE.MeshBasicMaterial({ color: 0x0a0c10 });
        [
            [-2.2, -1.4],
            [2.2, -1.4],
            [-2.2, 1.4],
            [2.2, 1.4],
        ].forEach(([fx, fz]) => {
            const foot = new THREE.Mesh(footGeo, footMat);
            foot.position.set(fx, -0.13, fz);
            laptopRoot.add(foot);
        });

        // B. MOTHERBOARD ASSEMBLY (Inside base)
        const mbGroup = new THREE.Group();
        mbGroup.position.set(0, 0.12, 0);
        laptopRoot.add(mbGroup);

        // PCB Substrate with copper traces texture
        const pcbTex = createMotherboardTexture();
        const pcbMat = new THREE.MeshStandardMaterial({
            map: pcbTex,
            roughness: 0.5,
            metalness: 0.2,
        });
        const pcbGeo = new THREE.BoxGeometry(4.8, 0.04, 3.2);
        const pcb = new THREE.Mesh(pcbGeo, pcbMat);
        pcb.castShadow = true;
        pcb.receiveShadow = true;
        mbGroup.add(pcb);

        // CPU Socket & Die
        const cpuSocketGeo = new THREE.BoxGeometry(1.2, 0.06, 1.2);
        const cpuSocket = new THREE.Mesh(cpuSocketGeo, darkMetalMat);
        cpuSocket.position.set(-0.8, 0.04, 0.2);
        cpuSocket.castShadow = true;
        mbGroup.add(cpuSocket);

        const cpuDieGeo = new THREE.BoxGeometry(0.8, 0.04, 0.8);
        const cpuDie = new THREE.Mesh(cpuDieGeo, siliconDieMat);
        cpuDie.position.set(-0.8, 0.08, 0.2);
        cpuDie.castShadow = true;
        mbGroup.add(cpuDie);

        // Fresh Thermal Paste Layer on CPU (Scales/appears during repair stage)
        const pasteGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.03, 24);
        const thermalPaste = new THREE.Mesh(pasteGeo, thermalPasteMat);
        thermalPaste.position.set(-0.8, 0.11, 0.2);
        thermalPaste.scale.set(0.001, 0.001, 0.001); // starts invisible
        mbGroup.add(thermalPaste);

        // GPU Die next to CPU
        const gpuDieGeo = new THREE.BoxGeometry(1.0, 0.06, 1.0);
        const gpuDie = new THREE.Mesh(gpuDieGeo, siliconDieMat);
        gpuDie.position.set(0.9, 0.05, 0.2);
        gpuDie.castShadow = true;
        mbGroup.add(gpuDie);

        // VRAM GDDR6 memory chips surrounding GPU
        const vramGeo = new THREE.BoxGeometry(0.3, 0.04, 0.35);
        [
            [0.9, 0.85],
            [0.9, -0.45],
            [1.55, 0.2],
            [0.25, 0.2],
        ].forEach(([vx, vz]) => {
            const vram = new THREE.Mesh(vramGeo, darkMetalMat);
            vram.position.set(vx, 0.05, vz);
            mbGroup.add(vram);
        });

        // Dual RAM SO-DIMM Modules
        const ramGroup = new THREE.Group();
        ramGroup.position.set(-1.4, 0.08, -0.8);
        const ramSlotGeo = new THREE.BoxGeometry(1.6, 0.04, 0.5);
        const ramSlot = new THREE.Mesh(ramSlotGeo, darkMetalMat);
        ramGroup.add(ramSlot);

        const ramStickGeo = new THREE.BoxGeometry(1.5, 0.08, 0.35);
        const ramStick = new THREE.Mesh(ramStickGeo, chassisMat);
        ramStick.position.set(0, 0.05, 0);
        ramGroup.add(ramStick);

        // RAM gold contacts
        const ramGoldGeo = new THREE.BoxGeometry(1.4, 0.02, 0.04);
        const ramGold = new THREE.Mesh(ramGoldGeo, goldMat);
        ramGold.position.set(0, 0.01, -0.16);
        ramGroup.add(ramGold);
        mbGroup.add(ramGroup);

        // M.2 NVMe SSD Module
        const nvmeGroup = new THREE.Group();
        nvmeGroup.position.set(1.4, 0.08, -0.8);
        const nvmeGeo = new THREE.BoxGeometry(0.6, 0.04, 1.6);
        const nvme = new THREE.Mesh(nvmeGeo, darkMetalMat);
        nvmeGroup.add(nvme);
        const nvmeGold = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.06), goldMat);
        nvmeGold.position.set(0, 0.01, 0.78);
        nvmeGroup.add(nvmeGold);
        mbGroup.add(nvmeGroup);

        // Power delivery chokes (Inductors R22)
        const chokeGeo = new THREE.BoxGeometry(0.24, 0.12, 0.24);
        const chokeMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.4 });
        for (let i = 0; i < 4; i++) {
            const choke = new THREE.Mesh(chokeGeo, chokeMat);
            choke.position.set(-1.6, 0.08, 0.5 - i * 0.32);
            mbGroup.add(choke);
        }

        // C. REMOVABLE HEATSINK & COOLING ASSEMBLY (Lifts up in Stage 4)
        const heatsinkGroup = new THREE.Group();
        heatsinkGroup.position.set(0, 0.18, 0);
        laptopRoot.add(heatsinkGroup);

        // CPU Copper Cold Plate
        const cpuPlateGeo = new THREE.BoxGeometry(1.0, 0.05, 1.0);
        const cpuPlate = new THREE.Mesh(cpuPlateGeo, copperMat);
        cpuPlate.position.set(-0.8, 0, 0.2);
        heatsinkGroup.add(cpuPlate);

        // GPU Copper Cold Plate
        const gpuPlateGeo = new THREE.BoxGeometry(1.1, 0.05, 1.1);
        const gpuPlate = new THREE.Mesh(gpuPlateGeo, copperMat);
        gpuPlate.position.set(0.9, 0, 0.2);
        heatsinkGroup.add(gpuPlate);

        // Dual Copper Heat Pipes (Curved tubes)
        const pipe1Geo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 16);
        const pipe1 = new THREE.Mesh(pipe1Geo, copperMat);
        pipe1.rotation.z = Math.PI / 2;
        pipe1.position.set(0.1, 0.06, -0.2);
        heatsinkGroup.add(pipe1);

        const pipe2Geo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 16);
        const pipe2 = new THREE.Mesh(pipe2Geo, copperMat);
        pipe2.rotation.z = Math.PI / 2;
        pipe2.position.set(0.1, 0.06, 0.0);
        heatsinkGroup.add(pipe2);

        // Rear Radiator Fins (Exhaust stack)
        const finStackGeo = new THREE.BoxGeometry(3.6, 0.14, 0.4);
        const finStack = new THREE.Mesh(finStackGeo, copperMat);
        finStack.position.set(0, 0.05, -1.4);
        heatsinkGroup.add(finStack);

        // Cooling Blower Fan Housing & Impeller Hub
        const fanHousingGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.16, 24);
        const fanHousing = new THREE.Mesh(fanHousingGeo, darkMetalMat);
        fanHousing.position.set(1.5, 0.06, -0.6);
        heatsinkGroup.add(fanHousing);

        const fanHubGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.18, 16);
        const fanHub = new THREE.Mesh(fanHubGeo, chassisMat);
        fanHub.position.set(1.5, 0.07, -0.6);
        heatsinkGroup.add(fanHub);

        // Fan Impeller Blades
        const bladeGeo = new THREE.BoxGeometry(0.03, 0.12, 0.35);
        for (let b = 0; b < 8; b++) {
            const blade = new THREE.Mesh(bladeGeo, darkMetalMat);
            const angle = (b / 8) * Math.PI * 2;
            blade.position.set(1.5 + Math.cos(angle) * 0.42, 0.07, -0.6 + Math.sin(angle) * 0.42);
            blade.rotation.y = angle;
            heatsinkGroup.add(blade);
        }

        // Diagnostic micro-soldering / repair light beam
        const beamGeo = new THREE.CylinderGeometry(0.04, 0.35, 1.6, 16);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
        });
        const repairBeam = new THREE.Mesh(beamGeo, beamMat);
        repairBeam.position.set(-0.8, 0.9, 0.2);
        scene.add(repairBeam);

        // D. UPPER KEYBOARD DECK (Separates / explodes in Stage 3)
        const deckGroup = new THREE.Group();
        deckGroup.position.set(0, 0.16, 0);
        laptopRoot.add(deckGroup);

        const deckPlateGeo = new THREE.BoxGeometry(5.18, 0.06, 3.58);
        const deckPlate = new THREE.Mesh(deckPlateGeo, chassisMat);
        deckPlate.castShadow = true;
        deckPlate.receiveShadow = true;
        deckGroup.add(deckPlate);

        // Keyboard keycaps plane with canvas texture
        const kbTex = createKeyboardTexture();
        const kbMat = new THREE.MeshStandardMaterial({
            map: kbTex,
            roughness: 0.4,
            metalness: 0.1,
        });
        const kbPlaneGeo = new THREE.PlaneGeometry(4.4, 2.0);
        const kbPlane = new THREE.Mesh(kbPlaneGeo, kbMat);
        kbPlane.rotation.x = -Math.PI / 2;
        kbPlane.position.set(0, 0.035, -0.4);
        deckGroup.add(kbPlane);

        // Trackpad
        const trackpadGeo = new THREE.BoxGeometry(1.8, 0.02, 1.15);
        const trackpadMat = new THREE.MeshStandardMaterial({
            color: 0x161a22,
            metalness: 0.7,
            roughness: 0.3,
        });
        const trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
        trackpad.position.set(0, 0.035, 1.0);
        deckGroup.add(trackpad);

        // E. DISPLAY LID & HINGE ASSEMBLY (Pivots open on X axis)
        // Hinge pivot point at the rear top edge of base
        const hingeGroup = new THREE.Group();
        hingeGroup.position.set(0, 0.14, -1.78);
        laptopRoot.add(hingeGroup);

        // Hinge cylinder
        const hingeCylinderGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.2, 16);
        const hingeCylinder = new THREE.Mesh(hingeCylinderGeo, darkMetalMat);
        hingeCylinder.rotation.z = Math.PI / 2;
        hingeGroup.add(hingeCylinder);

        // Display Lid Back Cover (Aluminum clamshell back)
        const lidGroup = new THREE.Group();
        // Shift lid geometry so pivot is at hinge origin
        lidGroup.position.set(0, 1.75, 0);
        hingeGroup.add(lidGroup);

        const lidBackGeo = new THREE.BoxGeometry(5.2, 3.5, 0.08);
        const lidBack = new THREE.Mesh(lidBackGeo, chassisMat);
        lidBack.castShadow = true;
        lidGroup.add(lidBack);

        // Display Screen Glass & Active Bezel
        const screenBezelGeo = new THREE.BoxGeometry(5.08, 3.38, 0.02);
        const screenBezelMat = new THREE.MeshStandardMaterial({
            color: 0x090b0e,
            roughness: 0.2,
            metalness: 0.8,
        });
        const screenBezel = new THREE.Mesh(screenBezelGeo, screenBezelMat);
        screenBezel.position.set(0, 0, 0.045);
        lidGroup.add(screenBezel);

        // Screen Display Texture
        const initialScreenTex = createScreenTexture(0, 0);
        const screenMat = new THREE.MeshBasicMaterial({
            map: initialScreenTex,
        });
        const screenPanelGeo = new THREE.PlaneGeometry(4.7, 2.95);
        const screenPanel = new THREE.Mesh(screenPanelGeo, screenMat);
        screenPanel.position.set(0, 0, 0.06);
        lidGroup.add(screenPanel);

        // Web camera dot at top bezel
        const camDot = new THREE.Mesh(
            new THREE.CircleGeometry(0.03, 16),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        camDot.position.set(0, 1.58, 0.06);
        lidGroup.add(camDot);

        // Store Three.js references
        threeState.current = {
            scene,
            camera,
            renderer,
            targetProgress: 0,
            currentProgress: 0,
            screenTexture: initialScreenTex,
            screenMaterial: screenMat,
            isInView: true,
            components: {
                laptopRoot,
                hingeGroup,
                deckGroup,
                heatsinkGroup,
                thermalPaste,
                repairBeam,
                fanHub,
            },
        };

        // Resize handler
        const handleResize = () => {
            if (!canvas) return;
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            camera.aspect = w / h;
            // Adjust camera FOV for mobile to avoid cropping laptop
            if (w < 640) {
                camera.fov = 48;
            } else if (w < 1024) {
                camera.fov = 42;
            } else {
                camera.fov = 36;
            }
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        handleResize();
        window.addEventListener("resize", handleResize);

        // 4. SCROLL PROGRESS LISTENER (Direct Scrubber)
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
            if (totalScrollable <= 0) return;

            // Direct mapping: 0 when top enters viewport, 1 when section finishes
            const progress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1);
            threeState.current.targetProgress = progress;
            setScrollPct(Math.round(progress * 100));

            // Sync current stage index
            let activeIdx = 0;
            for (let i = 0; i < STAGES.length; i++) {
                if (progress >= STAGES[i].range[0] && progress <= STAGES[i].range[1]) {
                    activeIdx = i;
                    break;
                }
            }
            setCurrentStageIdx(activeIdx);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check

        // IntersectionObserver to pause render loop when off-screen
        const observer = new IntersectionObserver(
            ([entry]) => {
                threeState.current.isInView = entry.isIntersecting;
            },
            { threshold: 0.05 }
        );
        observer.observe(containerRef.current);

        // 5. ANIMATION RENDER LOOP (Silky smooth lerp scrubber)
        let lastStageIdx = -1;
        const animate = () => {
            threeState.current.animFrameId = requestAnimationFrame(animate);

            if (!threeState.current.isInView) return;

            const state = threeState.current;
            // Smooth lerp progress towards target
            const lerpFactor = motionQuery.matches ? 0.3 : 0.085;
            state.currentProgress += (state.targetProgress - state.currentProgress) * lerpFactor;
            const p = state.currentProgress;

            const {
                laptopRoot,
                hingeGroup,
                deckGroup,
                heatsinkGroup,
                thermalPaste,
                repairBeam,
                fanHub,
            } = state.components;

            // --- A. CAMERA WAYPOINTS INTERPOLATION ---
            // 0.0 - 0.15: Closed laptop, camera approaches
            // 0.15 - 0.35: Lid opens, camera moves upward & angles into display
            // 0.35 - 0.55: Exploded view, camera zooms deep into logic board
            // 0.55 - 0.75: Heatsink lifts, camera inspects CPU socket rework
            // 0.75 - 0.90: Reassembly, camera pulls back
            // 0.90 - 1.00: Final majesty beauty hero angle
            let camX = 0, camY = 3.2, camZ = 7.5;
            let lookX = 0, lookY = 0.2, lookZ = 0;

            if (p < 0.15) {
                const t = p / 0.15;
                camX = 0;
                camY = 3.2 - t * 0.7; // 3.2 -> 2.5
                camZ = 7.5 - t * 1.5; // 7.5 -> 6.0
                lookX = 0;
                lookY = 0.2;
                lookZ = 0;
            } else if (p < 0.35) {
                const t = (p - 0.15) / 0.20;
                camX = 0;
                camY = 2.5 + t * 0.9; // 2.5 -> 3.4
                camZ = 6.0 - t * 0.8; // 6.0 -> 5.2
                lookX = 0;
                lookY = 0.2 + t * 0.6; // look slightly higher into screen
                lookZ = -0.2;
            } else if (p < 0.55) {
                const t = (p - 0.35) / 0.20;
                camX = t * 0.8; // pan to component side
                camY = 3.4 + t * 0.6; // 3.4 -> 4.0
                camZ = 5.2 - t * 2.2; // 5.2 -> 3.0 (macro dive)
                lookX = t * 0.3;
                lookY = 0.8 - t * 0.6; // look straight down at PCB
                lookZ = 0;
            } else if (p < 0.75) {
                const t = (p - 0.55) / 0.20;
                camX = 0.8 - t * 1.4; // 0.8 -> -0.6
                camY = 4.0 - t * 0.4; // 4.0 -> 3.6
                camZ = 3.0 - t * 0.4; // 3.0 -> 2.6
                lookX = -0.4; // focused on CPU socket
                lookY = 0.2;
                lookZ = 0.2;
            } else if (p < 0.90) {
                const t = (p - 0.75) / 0.15;
                camX = -0.6 + t * 1.6; // -0.6 -> 1.0
                camY = 3.6 - t * 0.8; // 3.6 -> 2.8
                camZ = 2.6 + t * 2.8; // 2.6 -> 5.4
                lookX = 0;
                lookY = 0.3;
                lookZ = 0;
            } else {
                const t = (p - 0.90) / 0.10;
                camX = 1.0 + t * 1.4; // 1.0 -> 2.4 (3/4 beauty angle)
                camY = 2.8 - t * 0.2; // 2.8 -> 2.6
                camZ = 5.4 + t * 1.0; // 5.4 -> 6.4
                lookX = 0;
                lookY = 0.4;
                lookZ = 0;
            }

            camera.position.set(camX, camY, camZ);
            camera.lookAt(lookX, lookY, lookZ);

            // --- B. HINGE CLAMSHELL OPENING (0.15 to 0.35) ---
            const maxOpenAngle = (115 * Math.PI) / 180;
            if (p < 0.15) {
                hingeGroup.rotation.x = 0; // closed flat
            } else if (p < 0.35) {
                const openT = (p - 0.15) / 0.20;
                // Smooth easeInOut curve
                const smoothT = openT < 0.5 ? 2 * openT * openT : -1 + (4 - 2 * openT) * openT;
                hingeGroup.rotation.x = -smoothT * maxOpenAngle;
            } else if (p < 0.75) {
                hingeGroup.rotation.x = -maxOpenAngle;
            } else if (p < 0.90) {
                // Gently settle to 105°
                const settleT = (p - 0.75) / 0.15;
                const settleAngle = (105 * Math.PI) / 180;
                hingeGroup.rotation.x = -(maxOpenAngle - settleT * (maxOpenAngle - settleAngle));
            } else {
                hingeGroup.rotation.x = -((105 * Math.PI) / 180);
            }

            // --- C. EXPLODED VIEW: UPPER KEYBOARD DECK (0.35 to 0.55 & returns at 0.75) ---
            if (p < 0.35) {
                deckGroup.position.y = 0.16;
            } else if (p < 0.55) {
                const t = (p - 0.35) / 0.20;
                deckGroup.position.y = 0.16 + t * 1.5; // lifts 1.5 units
            } else if (p < 0.75) {
                deckGroup.position.y = 1.66; // hovers
            } else if (p < 0.90) {
                const t = (p - 0.75) / 0.15;
                deckGroup.position.y = 1.66 - t * 1.5; // snaps back down
            } else {
                deckGroup.position.y = 0.16;
            }

            // --- D. REPAIR STAGE: HEATSINK LIFTS OFF & REPAIRS (0.55 to 0.75) ---
            if (p < 0.55) {
                heatsinkGroup.position.y = 0.18;
                thermalPaste.scale.set(0.001, 0.001, 0.001);
                repairBeam.material.opacity = 0;
            } else if (p < 0.65) {
                const t = (p - 0.55) / 0.10;
                heatsinkGroup.position.y = 0.18 + t * 1.6; // heatsink lifts
                // Thermal paste spreads on die
                thermalPaste.scale.set(t, t, t);
                repairBeam.material.opacity = t * 0.85;
            } else if (p < 0.75) {
                const t = (p - 0.65) / 0.10;
                heatsinkGroup.position.y = 1.78; // hovers
                thermalPaste.scale.set(1, 1, 1);
                // Pulse beam light
                repairBeam.material.opacity = 0.85 - t * 0.45;
            } else if (p < 0.85) {
                const t = (p - 0.75) / 0.10;
                heatsinkGroup.position.y = 1.78 - t * 1.6; // snaps firmly back onto die
                repairBeam.material.opacity = 0;
            } else {
                heatsinkGroup.position.y = 0.18;
                repairBeam.material.opacity = 0;
            }

            // Fan spin during active diagnostics / stress test
            if (p > 0.20) {
                fanHub.rotation.y += 0.12;
            }

            // --- E. UPDATE SCREEN TEXTURE WHEN STAGE CHANGES ---
            let activeIdx = 0;
            for (let i = 0; i < STAGES.length; i++) {
                if (p >= STAGES[i].range[0] && p <= STAGES[i].range[1]) {
                    activeIdx = i;
                    break;
                }
            }

            if (activeIdx !== lastStageIdx) {
                lastStageIdx = activeIdx;
                const newScreenTex = createScreenTexture(activeIdx, p);
                if (state.screenMaterial) {
                    state.screenMaterial.map.dispose();
                    state.screenMaterial.map = newScreenTex;
                    state.screenMaterial.needsUpdate = true;
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        // 6. CLEANUP
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleScroll);
            observer.disconnect();

            if (threeState.current.animFrameId) {
                cancelAnimationFrame(threeState.current.animFrameId);
            }

            // Dispose geometries and materials
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

    const activeStage = STAGES[currentStageIdx] || STAGES[0];

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-slate-50 border-b border-slate-200"
            style={{ height: "600vh" }} // 6x Viewport height for cinematic scroll scrub
            id="service-workflow"
        >
            {/* STICKY FULL-VIEWPORT 3D CANVAS & HUD */}
            <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between pointer-events-none">
                {/* 3D WebGL Canvas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block pointer-events-auto cursor-grab active:cursor-grabbing"
                />

                {/* TOP HUD BAR: Real-Time Scroll Timeline & Section Spec */}
                <div className="relative z-10 w-full pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 pointer-events-auto">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <Cpu className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-display font-bold text-sm text-slate-900">
                                        Anatomi &amp; Alur Rekayasa 3D
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-xs font-mono text-blue-600 font-semibold">
                                        Scroll-Driven Cinema
                                    </span>
                                </div>
                                <p className="text-3xs sm:text-2xs text-slate-400 font-sans hidden sm:block">
                                    Putar scroll mouse Anda ke bawah untuk menelusuri proses perbaikan secara berurutan
                                </p>
                            </div>
                        </div>

                        {/* Interactive Stage Stepper Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {STAGES.map((s, idx) => {
                                const isActive = currentStageIdx === idx;
                                const isPassed = currentStageIdx > idx;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => scrollToStage(idx)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                            isActive
                                                ? "bg-blue-600 text-white shadow-xs font-semibold"
                                                : isPassed
                                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200/80"
                                        }`}
                                    >
                                        <span>{s.step}</span>
                                        <span className="hidden md:inline">{s.badge.split(" · ")[1]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Progress Bar Line */}
                    <div className="max-w-6xl mx-auto mt-2 h-1 bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-100 ease-out rounded-full"
                            style={{ width: `${scrollPct}%` }}
                        />
                    </div>
                </div>

                {/* BOTTOM FLOATING STAGE DETAILS HUD CARD */}
                <div className="relative z-10 w-full pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 pointer-events-auto">
                    <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                        {/* Header Badge & Stage Counter */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    {activeStage.badge}
                                </span>
                                <span className="font-mono text-xs text-slate-400">
                                    Progress Timeline: {scrollPct}%
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-mono text-2xs text-slate-500 uppercase tracking-wider">
                                    {activeStage.statusText}
                                </span>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-snug">
                                {activeStage.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                                {activeStage.description}
                            </p>
                        </div>

                        {/* Quantitative Hardware Metrics for this Stage */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {activeStage.metrics.map((m, i) => (
                                <div
                                    key={i}
                                    className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2"
                                >
                                    <div className="text-3xs font-sans font-semibold text-slate-400 uppercase tracking-wide">
                                        {m.label}
                                    </div>
                                    <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                                        {m.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Interactive Navigation Hint */}
                        <div className="flex items-center justify-between text-2xs text-slate-400 font-sans pt-1">
                            <span>Scroll ke bawah untuk melanjutkan ke tahap berikutnya &darr;</span>
                            <div className="flex items-center gap-2">
                                {currentStageIdx > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => scrollToStage(currentStageIdx - 1)}
                                        className="hover:text-blue-600 transition-colors cursor-pointer"
                                    >
                                        &larr; Tahap Sebelumnya
                                    </button>
                                )}
                                {currentStageIdx < STAGES.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => scrollToStage(currentStageIdx + 1)}
                                        className="text-blue-600 font-semibold hover:underline cursor-pointer"
                                    >
                                        Tahap Berikutnya &rarr;
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
