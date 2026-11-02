const { spawn } = require("child_process");
const path = require("path");

const rootDir = __dirname;
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

console.log("=========================================");
console.log("   🚀 Menjalankan Serv.io Platform");
console.log("=========================================");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

async function checkAndSeed() {
    try {
        require("dotenv").config({ path: path.join(backendDir, ".env") });
        const { execSync } = require("child_process");
        const { PrismaClient } = require(path.join(backendDir, "node_modules/@prisma/client"));
        const prisma = new PrismaClient();

        // Otomatis push skema jika database/tabel baru
        try {
            execSync("npx prisma db push --skip-generate --accept-data-loss", { cwd: backendDir, stdio: "pipe" });
        } catch (_) {}

        const count = await prisma.user.count();
        if (count === 0) {
            console.log("🌱 Database kosong, menjalankan seed otomatis...");
            require(path.join(backendDir, "seed.js"));
        } else {
            console.log(`✅ Database siap (${count} pengguna terdaftar).`);
        }
        await prisma.$disconnect();
    } catch (e) {
        // Abaikan jika prisma belum terpasang atau error koneksi
    }
}

async function start() {
    await checkAndSeed();

    // 1. Jalankan Backend
    console.log("📦 Menjalankan Backend (Port 5001)...");
    const backend = spawn(npmCmd, ["run", "dev"], {
        cwd: backendDir,
        stdio: "inherit",
        shell: true,
    });

    // 2. Jalankan Frontend
    console.log("💻 Menjalankan Frontend (Port 3000)...");
    const frontend = spawn(npmCmd, ["run", "dev"], {
        cwd: frontendDir,
        stdio: "inherit",
        shell: true,
    });

    console.log("\n✨ Akses Aplikasi:");
    console.log("   - Frontend UI : http://localhost:3000");
    console.log("   - Backend API : http://localhost:5001");
    console.log("   - Public Track: http://localhost:3000/tracking\n");
    console.log("Tekan [Ctrl+C] untuk menghentikan kedua layanan.\n=========================================\n");

    function cleanup() {
        console.log("\n🛑 Menghentikan semua layanan...");
        try {
            if (backend && !backend.killed) backend.kill();
            if (frontend && !frontend.killed) frontend.kill();
        } catch (e) {}
        process.exit(0);
    }

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("exit", cleanup);
}

start();


