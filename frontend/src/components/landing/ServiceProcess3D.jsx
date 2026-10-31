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

// Continuous Camera Path Waypoints (No sudden jumps, C0-continuous)
const CAMERA_WAYPOINTS = [
    { p: 0.00, cam: [0, 2.8, 7.2], look: [0, 0.1, 0] },
    { p: 0.15, cam: [0, 2.2, 5.8], look: [0, 0.1, 0] },
    { p: 0.35, cam: [0, 3.2, 5.2], look: [0, 0.6, -0.3] },
    { p: 0.55, cam: [0.8, 3.8, 3.2], look: [0.1, 0.2, 0] },
    { p: 0.75, cam: [-0.6, 3.3, 2.6], look: [-0.6, 0.2, 0.2] },
    { p: 0.90, cam: [0.6, 2.8, 5.2], look: [0, 0.3, 0] },
    { p: 1.00, cam: [2.2, 2.6, 6.2], look: [0, 0.3, 0] },
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
    const segmentSpan = w2.p - w1.p;
    const rawT = segmentSpan > 0 ? (p - w1.p) / segmentSpan : 0;
    // Cubic hermite smoothing
    const t = rawT * rawT * (3 - 2 * rawT);

    const camX = w1.cam[0] + (w2.cam[0] - w1.cam[0]) * t;
    const camY = w1.cam[1] + (w2.cam[1] - w1.cam[1]) * t;
    const camZ = w1.cam[2] + (w2.cam[2] - w1.cam[2]) * t;

    const lookX = w1.look[0] + (w2.look[0] - w1.look[0]) * t;
    const lookY = w1.look[1] + (w2.look[1] - w1.look[1]) * t;
    const lookZ = w1.look[2] + (w2.look[2] - w1.look[2]) * t;

    return { camX, camY, camZ, lookX, lookY, lookZ };
}

// Draw dynamic screen UI onto an existing canvas
function updateScreenCanvas(canvas, stageIdx, progress) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a0f18";
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
    ctx.fillStyle = "#141c2b";
    ctx.fillRect(0, 0, canvas.width, 44);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 42, canvas.width, 2);

    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#93c5fd";
    ctx.fillText("YVS COMPUTER // HARDWARE DIAGNOSTIC TELEMETRY v4.2", 24, 28);

    ctx.font = "14px monospace";
    ctx.fillStyle = "#10b981";
    ctx.fillText("STATUS: ACTIVE", canvas.width - 160, 28);

    // Stage 6 special: 25-Point QC Certificate
    if (stageIdx >= 5 || progress >= 0.88) {
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
            `[SYS] Active stage: ${STAGES[stageIdx]?.title || "Processing..."}`,
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

// Generate keyboard texture
function createKeyboardTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1e2229";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

            ctx.fillStyle = "#12151b";
            ctx.strokeStyle = "#2d333f";
            ctx.lineWidth = 1.5;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            ctx.fillStyle = "#cbd5e1";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(key, x + w / 2, y + h / 2);
        });
    });

    return new THREE.CanvasTexture(canvas);
}

// Generate Motherboard PCB circuit texture
function createMotherboardTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0c201d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    ctx.strokeStyle = "#c89b3c";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 20; i++) {
        const y = 200 + i * 24;
        ctx.beginPath();
        ctx.moveTo(120, y);
        ctx.lineTo(450, y);
        ctx.stroke();
    }

    ctx.fillStyle = "#e2b85e";
    for (let i = 0; i < 80; i++) {
        const px = 100 + Math.random() * 800;
        const py = 100 + Math.random() * 800;
        ctx.fillRect(px, py, 4, 8);
    }

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
        isInView: true,
        mouseX: 0,
        mouseY: 0,
    });

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

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        // 1. Scene, Camera, Renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        scene.fog = new THREE.FogExp2(0xf8fafc, 0.04);

        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
        camera.position.set(0, 2.8, 7.2);
        camera.lookAt(0, 0.1, 0);

        // Standard WebGLRenderer without powerPreference to prevent Linux GPU subsystem query warnings
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
        });
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;

        // Use PCFShadowMap (PCFSoftShadowMap is deprecated/removed in Three.js r187)
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;

        // 2. Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
        keyLight.position.set(5, 8, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 22;
        keyLight.shadow.bias = -0.0005;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
        fillLight.position.set(-6, 4, -4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
        rimLight.position.set(0, 5, -6);
        scene.add(rimLight);

        // Ground shadow plane
        const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.18 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.12;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        // 3. MASTER LAPTOP ASSEMBLY
        const laptopRoot = new THREE.Group();
        scene.add(laptopRoot);

        // Materials
        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x1e2430, // Space gray aluminum
            metalness: 0.8,
            roughness: 0.32,
        });

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x11141a,
            metalness: 0.85,
            roughness: 0.25,
        });

        const copperMat = new THREE.MeshStandardMaterial({
            color: 0xc87d42,
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
            color: 0x94a3b8,
            metalness: 0.4,
            roughness: 0.6,
        });

        // A. LOWER CHASSIS BASE
        const baseCaseGeo = new THREE.BoxGeometry(5.2, 0.22, 3.6);
        const baseCase = new THREE.Mesh(baseCaseGeo, chassisMat);
        baseCase.position.set(0, 0, 0);
        baseCase.castShadow = true;
        baseCase.receiveShadow = true;
        laptopRoot.add(baseCase);

        // Side ports
        const portGeo = new THREE.BoxGeometry(0.04, 0.08, 0.24);
        const leftPort1 = new THREE.Mesh(portGeo, darkMetalMat);
        leftPort1.position.set(-2.61, 0.02, -0.6);
        const leftPort2 = new THREE.Mesh(portGeo, darkMetalMat);
        leftPort2.position.set(-2.61, 0.02, -0.2);
        const rightPort = new THREE.Mesh(portGeo, darkMetalMat);
        rightPort.position.set(2.61, 0.02, -0.4);
        laptopRoot.add(leftPort1, leftPort2, rightPort);

        // Rubber feet
        const footGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
        const footMat = new THREE.MeshBasicMaterial({ color: 0x0a0c10 });
        [
            [-2.2, -1.4],
            [2.2, -1.4],
            [-2.2, 1.4],
            [2.2, 1.4],
        ].forEach(([fx, fz]) => {
            const foot = new THREE.Mesh(footGeo, footMat);
            foot.position.set(fx, -0.12, fz);
            laptopRoot.add(foot);
        });

        // B. MOTHERBOARD ASSEMBLY (FR-4 substrate + chips inside base)
        const mbGroup = new THREE.Group();
        mbGroup.position.set(0, 0.02, 0);
        laptopRoot.add(mbGroup);

        const pcbTex = createMotherboardTexture();
        const pcbMat = new THREE.MeshStandardMaterial({
            map: pcbTex,
            roughness: 0.5,
            metalness: 0.2,
        });
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.04, 3.2), pcbMat);
        pcb.castShadow = true;
        pcb.receiveShadow = true;
        mbGroup.add(pcb);

        // CPU Socket & Die
        const cpuSocket = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 1.2), darkMetalMat);
        cpuSocket.position.set(-0.8, 0.04, 0.2);
        mbGroup.add(cpuSocket);

        const cpuDie = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.8), siliconDieMat);
        cpuDie.position.set(-0.8, 0.075, 0.2);
        mbGroup.add(cpuDie);

        // Fresh Thermal Paste Layer on CPU
        const thermalPaste = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.35, 0.03, 24),
            thermalPasteMat
        );
        thermalPaste.position.set(-0.8, 0.095, 0.2);
        thermalPaste.scale.set(0.001, 0.001, 0.001);
        mbGroup.add(thermalPaste);

        // Pulsing precision micro-rework ring around CPU
        const probeRingGeo = new THREE.RingGeometry(0.48, 0.54, 32);
        const probeRingMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
        });
        const probeRing = new THREE.Mesh(probeRingGeo, probeRingMat);
        probeRing.rotation.x = -Math.PI / 2;
        probeRing.position.set(-0.8, 0.098, 0.2);
        mbGroup.add(probeRing);

        // GPU Die & VRAM
        const gpuDie = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 1.0), siliconDieMat);
        gpuDie.position.set(0.9, 0.05, 0.2);
        mbGroup.add(gpuDie);

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
        ramGroup.position.set(-1.4, 0.06, -0.8);
        const ramSlot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.5), darkMetalMat);
        ramGroup.add(ramSlot);

        const ramStick = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.35), chassisMat);
        ramStick.position.set(0, 0.05, 0);
        ramGroup.add(ramStick);

        const ramGold = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.04), goldMat);
        ramGold.position.set(0, 0.01, -0.16);
        ramGroup.add(ramGold);
        mbGroup.add(ramGroup);

        // M.2 NVMe SSD
        const nvmeGroup = new THREE.Group();
        nvmeGroup.position.set(1.4, 0.06, -0.8);
        const nvme = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 1.6), darkMetalMat);
        nvmeGroup.add(nvme);
        const nvmeGold = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.06), goldMat);
        nvmeGold.position.set(0, 0.01, 0.78);
        nvmeGroup.add(nvmeGold);
        mbGroup.add(nvmeGroup);

        // Power Inductors (Chokes)
        const chokeGeo = new THREE.BoxGeometry(0.24, 0.12, 0.24);
        const chokeMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.4 });
        for (let i = 0; i < 4; i++) {
            const choke = new THREE.Mesh(chokeGeo, chokeMat);
            choke.position.set(-1.6, 0.08, 0.5 - i * 0.32);
            mbGroup.add(choke);
        }

        // C. REMOVABLE HEATSINK ASSEMBLY (Lifts up in Stage 4)
        const heatsinkGroup = new THREE.Group();
        heatsinkGroup.position.set(0, 0.06, 0);
        laptopRoot.add(heatsinkGroup);

        // Copper cold plates
        const cpuPlate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 1.0), copperMat);
        cpuPlate.position.set(-0.8, 0.06, 0.2);
        heatsinkGroup.add(cpuPlate);

        const gpuPlate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 1.1), copperMat);
        gpuPlate.position.set(0.9, 0.06, 0.2);
        heatsinkGroup.add(gpuPlate);

        // Copper heatpipes
        const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 16), copperMat);
        pipe1.rotation.z = Math.PI / 2;
        pipe1.position.set(0.1, 0.09, -0.2);
        heatsinkGroup.add(pipe1);

        const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 16), copperMat);
        pipe2.rotation.z = Math.PI / 2;
        pipe2.position.set(0.1, 0.09, 0.0);
        heatsinkGroup.add(pipe2);

        // Radiator fin stack at exhaust
        const finStack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 0.4), copperMat);
        finStack.position.set(0, 0.07, -1.4);
        heatsinkGroup.add(finStack);

        // Cooling fan
        const fanHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.16, 24), darkMetalMat);
        fanHousing.position.set(1.5, 0.07, -0.6);
        heatsinkGroup.add(fanHousing);

        const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.18, 16), chassisMat);
        fanHub.position.set(1.5, 0.08, -0.6);
        heatsinkGroup.add(fanHub);

        const bladeGeo = new THREE.BoxGeometry(0.03, 0.12, 0.35);
        for (let b = 0; b < 8; b++) {
            const blade = new THREE.Mesh(bladeGeo, darkMetalMat);
            const angle = (b / 8) * Math.PI * 2;
            blade.position.set(1.5 + Math.cos(angle) * 0.42, 0.08, -0.6 + Math.sin(angle) * 0.42);
            blade.rotation.y = angle;
            heatsinkGroup.add(blade);
        }

        // Micro-soldering precision light beam
        const beamGeo = new THREE.CylinderGeometry(0.04, 0.35, 1.8, 16);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
        });
        const repairBeam = new THREE.Mesh(beamGeo, beamMat);
        repairBeam.position.set(-0.8, 1.0, 0.2);
        scene.add(repairBeam);

        // D. UPPER KEYBOARD DECK (Lifts up in Stage 3)
        const deckGroup = new THREE.Group();
        deckGroup.position.set(0, 0.11, 0);
        laptopRoot.add(deckGroup);

        const deckPlate = new THREE.Mesh(new THREE.BoxGeometry(5.18, 0.04, 3.58), chassisMat);
        deckPlate.position.set(0, 0.02, 0);
        deckPlate.castShadow = true;
        deckPlate.receiveShadow = true;
        deckGroup.add(deckPlate);

        // Keyboard plane
        const kbTex = createKeyboardTexture();
        const kbMat = new THREE.MeshStandardMaterial({
            map: kbTex,
            roughness: 0.4,
            metalness: 0.1,
        });
        const kbPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.0), kbMat);
        kbPlane.rotation.x = -Math.PI / 2;
        kbPlane.position.set(0, 0.041, -0.4);
        deckGroup.add(kbPlane);

        // Trackpad
        const trackpad = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.01, 1.15), darkMetalMat);
        trackpad.position.set(0, 0.041, 1.0);
        deckGroup.add(trackpad);

        // Power button & status LED
        const pwrBtn = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.2), darkMetalMat);
        pwrBtn.position.set(2.0, 0.041, -1.4);
        deckGroup.add(pwrBtn);

        const ledMesh = new THREE.Mesh(new THREE.CircleGeometry(0.015, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        ledMesh.rotation.x = -Math.PI / 2;
        ledMesh.position.set(2.3, 0.042, -1.4);
        deckGroup.add(ledMesh);

        // E. DISPLAY LID & HINGE (Pivots open on X axis)
        const hingeGroup = new THREE.Group();
        hingeGroup.position.set(0, 0.11, -1.75);
        laptopRoot.add(hingeGroup);

        const hingeCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 16), darkMetalMat);
        hingeCylinder.rotation.z = Math.PI / 2;
        hingeGroup.add(hingeCylinder);

        // Display Lid Assembly (Pivot is at rear hinge; center is offset forward by half depth)
        const lidGroup = new THREE.Group();
        lidGroup.position.set(0, 0.04, 1.75);
        hingeGroup.add(lidGroup);

        // Aluminum outer back shell
        const lidBack = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 3.5), chassisMat);
        lidBack.position.set(0, 0.01, 0);
        lidBack.castShadow = true;
        lidGroup.add(lidBack);

        // Screen bezel (facing down towards keyboard when closed flat)
        const screenBezelMat = new THREE.MeshStandardMaterial({
            color: 0x090b0e,
            roughness: 0.2,
            metalness: 0.8,
        });
        const screenBezel = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 3.42), screenBezelMat);
        screenBezel.rotation.x = Math.PI / 2;
        screenBezel.position.set(0, -0.021, 0);
        lidGroup.add(screenBezel);

        // Active display screen panel (Single reusable canvas texture)
        const screenCanvas = document.createElement("canvas");
        screenCanvas.width = 1024;
        screenCanvas.height = 640;
        updateScreenCanvas(screenCanvas, 0, 0);

        const screenTexture = new THREE.CanvasTexture(screenCanvas);
        const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
        const screenPanel = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.94), screenMat);
        screenPanel.rotation.x = Math.PI / 2;
        screenPanel.position.set(0, -0.022, 0);
        lidGroup.add(screenPanel);

        // Web camera dot at top bezel (front of laptop when closed)
        const camDot = new THREE.Mesh(
            new THREE.CircleGeometry(0.025, 16),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        camDot.rotation.x = Math.PI / 2;
        camDot.position.set(0, -0.023, 1.6);
        lidGroup.add(camDot);

        // Store Three.js references
        threeState.current = {
            scene,
            camera,
            renderer,
            targetProgress: 0,
            currentProgress: 0,
            screenCanvas,
            screenTexture,
            isInView: true,
            mouseX: 0,
            mouseY: 0,
            components: {
                laptopRoot,
                hingeGroup,
                deckGroup,
                heatsinkGroup,
                thermalPaste,
                probeRing,
                repairBeam,
                fanHub,
            },
        };

        // Resize handler with mobile FOV adaptation
        const handleResize = () => {
            if (!canvas) return;
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            if (w === 0 || h === 0) return;
            camera.aspect = w / h;
            if (w < 640) {
                camera.fov = 50;
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

        // Subtle parallax pointer movement
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
        handleScroll();

        // IntersectionObserver to pause rendering when off-screen
        const observer = new IntersectionObserver(
            ([entry]) => {
                threeState.current.isInView = entry.isIntersecting;
            },
            { threshold: 0.05 }
        );
        observer.observe(containerRef.current);

        // 4. ANIMATION RENDER LOOP (Silky smooth lerp scrubber)
        let lastStageIdx = -1;
        let clock = 0;

        const animate = () => {
            threeState.current.animFrameId = requestAnimationFrame(animate);

            if (!threeState.current.isInView) return;

            clock += 0.016;
            const state = threeState.current;
            const lerpFactor = motionQuery.matches ? 0.3 : 0.085;
            state.currentProgress += (state.targetProgress - state.currentProgress) * lerpFactor;
            const p = state.currentProgress;

            const {
                hingeGroup,
                deckGroup,
                heatsinkGroup,
                thermalPaste,
                probeRing,
                repairBeam,
                fanHub,
            } = state.components;

            // --- A. SMOOTH CAMERA WAYPOINTS ---
            const { camX, camY, camZ, lookX, lookY, lookZ } = interpolateCamera(p);
            // Apply slight interactive mouse parallax
            camera.position.set(camX + state.mouseX, camY + state.mouseY, camZ);
            camera.lookAt(lookX, lookY, lookZ);

            // --- B. HINGE CLAMSHELL OPENING (0.15 to 0.35) ---
            const maxOpenAngle = (115 * Math.PI) / 180;
            if (p < 0.15) {
                hingeGroup.rotation.x = 0; // completely flat closed
            } else if (p < 0.35) {
                const openT = (p - 0.15) / 0.20;
                const smoothT = openT * openT * (3 - 2 * openT);
                hingeGroup.rotation.x = -smoothT * maxOpenAngle;
            } else if (p < 0.75) {
                hingeGroup.rotation.x = -maxOpenAngle;
            } else if (p < 0.90) {
                const settleT = (p - 0.75) / 0.15;
                const settleAngle = (105 * Math.PI) / 180;
                hingeGroup.rotation.x = -(maxOpenAngle - settleT * (maxOpenAngle - settleAngle));
            } else {
                hingeGroup.rotation.x = -((105 * Math.PI) / 180);
            }

            // --- C. EXPLODED VIEW: UPPER KEYBOARD DECK (0.35 to 0.55, reassembles 0.75 to 0.90) ---
            if (p < 0.35) {
                deckGroup.position.y = 0.11;
            } else if (p < 0.55) {
                const t = (p - 0.35) / 0.20;
                deckGroup.position.y = 0.11 + t * 1.6;
            } else if (p < 0.75) {
                deckGroup.position.y = 1.71;
            } else if (p < 0.90) {
                const t = (p - 0.75) / 0.15;
                deckGroup.position.y = 1.71 - t * 1.6;
            } else {
                deckGroup.position.y = 0.11;
            }

            // --- D. REPAIR STAGE: HEATSINK LIFTS OFF & THERMAL OVERHAUL (0.55 to 0.75) ---
            if (p < 0.55) {
                heatsinkGroup.position.y = 0.06;
                thermalPaste.scale.set(0.001, 0.001, 0.001);
                probeRing.material.opacity = 0;
                repairBeam.material.opacity = 0;
            } else if (p < 0.65) {
                const t = (p - 0.55) / 0.10;
                heatsinkGroup.position.y = 0.06 + t * 1.6;
                thermalPaste.scale.set(t, t, t);
                probeRing.material.opacity = t * 0.8;
                repairBeam.material.opacity = t * 0.7;
            } else if (p < 0.75) {
                const t = (p - 0.65) / 0.10;
                heatsinkGroup.position.y = 1.66;
                thermalPaste.scale.set(1, 1, 1);
                probeRing.material.opacity = 0.8 - t * 0.4;
                repairBeam.material.opacity = 0.7 - t * 0.35;
                // Pulsing ring scale
                const pulse = 1 + Math.sin(clock * 6) * 0.08;
                probeRing.scale.set(pulse, pulse, 1);
            } else if (p < 0.85) {
                const t = (p - 0.75) / 0.10;
                heatsinkGroup.position.y = 1.66 - t * 1.6;
                probeRing.material.opacity = 0;
                repairBeam.material.opacity = 0;
            } else {
                heatsinkGroup.position.y = 0.06;
                probeRing.material.opacity = 0;
                repairBeam.material.opacity = 0;
            }

            // Fan rotation
            if (p > 0.20) {
                fanHub.rotation.y += 0.12;
            }

            // --- E. UPDATE SCREEN TEXTURE WITHOUT DISPOSING TEXTURES ---
            let activeIdx = 0;
            for (let i = 0; i < STAGES.length; i++) {
                if (p >= STAGES[i].range[0] && p <= STAGES[i].range[1]) {
                    activeIdx = i;
                    break;
                }
            }

            if (activeIdx !== lastStageIdx) {
                lastStageIdx = activeIdx;
                updateScreenCanvas(state.screenCanvas, activeIdx, p);
                state.screenTexture.needsUpdate = true;
            }

            renderer.render(scene, camera);
        };

        animate();

        // 5. CLEANUP
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("scroll", handleScroll);
            observer.disconnect();

            if (threeState.current.animFrameId) {
                cancelAnimationFrame(threeState.current.animFrameId);
            }

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
            style={{ height: "600vh" }}
            id="service-workflow"
        >
            <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between pointer-events-none">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block pointer-events-auto"
                />

                {/* TOP HUD BAR */}
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
                                        Scroll-Driven Timeline
                                    </span>
                                </div>
                                <p className="text-3xs sm:text-2xs text-slate-400 font-sans hidden sm:block">
                                    Putar scroll mouse ke bawah untuk menelusuri proses perbaikan secara berurutan
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
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    {activeStage.badge}
                                </span>
                                <span className="font-mono text-xs text-slate-400">
                                    Timeline: {scrollPct}%
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-mono text-2xs text-slate-500 uppercase tracking-wider">
                                    {activeStage.statusText}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-snug">
                                {activeStage.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                                {activeStage.description}
                            </p>
                        </div>

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
