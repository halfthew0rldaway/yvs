const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

async function main() {
    console.log("🚀 [INIT] Memulai inisialisasi database backend Serv.io...");
    const prisma = new PrismaClient();

    // 1. Tunggu database siap
    let connected = false;
    for (let i = 1; i <= 30; i++) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            connected = true;
            console.log(`✅ [INIT] Database terhubung (percobaan ${i}).`);
            break;
        } catch (e) {
            console.log(`⏳ [INIT] Menunggu MySQL siap (${i}/30)...`);
            await new Promise((r) => setTimeout(r, 2000));
        }
    }

    if (!connected) {
        console.error("❌ [INIT] Gagal terhubung ke database setelah 30 percobaan.");
        process.exit(1);
    }

    // 2. Otomatis sinkronkan skema Prisma (tambah kolom/tabel baru tanpa intervensi manual)
    console.log("📦 [INIT] Sinkronisasi skema database (prisma db push)...");
    try {
        execSync("npx prisma db push --accept-data-loss --skip-generate", { stdio: "inherit" });
        console.log("✅ [INIT] Skema database berhasil disinkronkan.");
    } catch (err) {
        console.error("⚠️ [INIT] Peringatan: Prisma db push mengalami kendala:", err.message);
    }

    // 2b. Verifikasi & pastikan kolom custom_badges & is_revisi_acc tersedia
    try {
        for (const tbl of ["Customer", "customer"]) {
            await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS custom_badges JSON NULL;`).catch(async () => {
                await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN custom_badges JSON NULL;`).catch(() => {});
            });
        }
        for (const tbl of ["TiketServis", "tiket_servis", "tiketservis"]) {
            await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS is_revisi_acc TINYINT(1) DEFAULT 0;`).catch(async () => {
                await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN is_revisi_acc TINYINT(1) DEFAULT 0;`).catch(() => {});
            });
            await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS jml_revisi_acc INT DEFAULT 0;`).catch(async () => {
                await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN jml_revisi_acc INT DEFAULT 0;`).catch(() => {});
            });
            await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS alasan_revisi_acc TEXT NULL;`).catch(async () => {
                await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN alasan_revisi_acc TEXT NULL;`).catch(() => {});
            });
            await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS tgl_revisi_acc DATETIME NULL;`).catch(async () => {
                await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN tgl_revisi_acc DATETIME NULL;`).catch(() => {});
            });
        }
        for (const tbl of ["Applicant", "applicant"]) {
            await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS sumber_lamaran VARCHAR(100) DEFAULT 'Walk-in';`).catch(async () => {
                await prisma.$executeRawUnsafe(`ALTER TABLE ${tbl} ADD COLUMN sumber_lamaran VARCHAR(100) DEFAULT 'Walk-in';`).catch(() => {});
            });
        }
    } catch (e) {
        // Kolom sudah ada atau variasi casing diabaikan
    }

    // 3. Cek apakah database kosong
    try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            console.log("🌱 [INIT] Database masih kosong (0 user). Menjalankan inisialisasi awal (seed)...");
            execSync("node seed.js", { stdio: "inherit", env: { ...process.env, FORCE_SEED: "true" } });
            console.log("✅ [INIT] Seeding inisial selesai.");
        } else {
            console.log(`✅ [INIT] Data aman (${userCount} staf/pengguna ditemukan). Seeding dilewati.`);
        }
    } catch (err) {
        console.warn("⚠️ [INIT] Pengecekan data pengguna dilewati:", err.message);
    } finally {
        await prisma.$disconnect();
    }

    console.log("🎉 [INIT] Inisialisasi database selesai.");
}

main().catch((err) => {
    console.error("❌ [INIT] Terjadi kesalahan fatal:", err);
    process.exit(0); // Jangan crash container agar express tetap bisa menyajikan error atau logs
});

