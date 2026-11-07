/**
 * staging-owner-users.js
 * 
 * Script idempoten khusus staging untuk membuat / memperbaiki akun Owner (Arni & Vivero).
 * Menggunakan role "pimpinan" (Owner / Manajerial di arsitektur Serv.io)
 * agar memiliki akses penuh dan self-service ubah kata sandi di Web & Mobile.
 * 
 * Mendukung override password via environment variable:
 * - STAGING_OWNER_ARNI_PASSWORD (default: "ownerArni2026!")
 * - STAGING_OWNER_VIVERO_PASSWORD (default: "ownerVivero2026!")
 * atau STAGING_OWNER_PASSWORD sebagai fallback global.
 */

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function syncOwnerUsers() {
    console.log("👑 [STAGING-OWNER] Memulai sinkronisasi / perbaikan akun Owner staging...");

    const defaultFallbackPassword = process.env.STAGING_OWNER_PASSWORD || "password123";
    const arniPasswordRaw = process.env.STAGING_OWNER_ARNI_PASSWORD || defaultFallbackPassword;
    const viveroPasswordRaw = process.env.STAGING_OWNER_VIVERO_PASSWORD || defaultFallbackPassword;

    const owners = [
        {
            username: "arni",
            nama: "Ibu Arni (Owner / Pimpinan)",
            email: "arni@workshop.com",
            role: "pimpinan",
            rawPassword: arniPasswordRaw
        },
        {
            username: "vivero",
            nama: "Bpk. Vivero (Owner / Pimpinan)",
            email: "vivero@workshop.com",
            role: "pimpinan",
            rawPassword: viveroPasswordRaw
        }
    ];

    for (const owner of owners) {
        try {
            // Cari user yang sudah ada berdasarkan username atau email
            const existing = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: owner.username },
                        { email: owner.email }
                    ]
                }
            });

            const hashedPassword = await bcrypt.hash(owner.rawPassword, 10);

            if (existing) {
                // Update / perbaiki username, role, nama jika belum sesuai
                const updated = await prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        username: owner.username,
                        email: owner.email,
                        nama: existing.nama || owner.nama,
                        role: "pimpinan", // pastikan role pimpinan
                        // Jika ada override khusus via env, update passwordnya
                        ...(process.env.STAGING_OWNER_ARNI_PASSWORD || process.env.STAGING_OWNER_VIVERO_PASSWORD || process.env.STAGING_OWNER_PASSWORD
                            ? { password: hashedPassword }
                            : {})
                    }
                });
                console.log(`✅ [STAGING-OWNER] Akun '${owner.username}' (${updated.email}) telah diverifikasi / diperbarui (Role: ${updated.role}).`);
            } else {
                // Buat akun baru jika belum ada
                const created = await prisma.user.create({
                    data: {
                        username: owner.username,
                        nama: owner.nama,
                        email: owner.email,
                        password: hashedPassword,
                        role: owner.role
                    }
                });
                console.log(`✨ [STAGING-OWNER] Akun '${owner.username}' (${created.email}) berhasil dibuat (Role: ${created.role}).`);
            }
        } catch (err) {
            console.error(`⚠️ [STAGING-OWNER] Gagal menyinkronkan akun '${owner.username}':`, err.message);
        }
    }

    console.log("👑 [STAGING-OWNER] Sinkronisasi akun Owner staging selesai.\n");
}

if (require.main === module) {
    syncOwnerUsers()
        .catch((err) => {
            console.error("❌ [STAGING-OWNER] Kesalahan fatal saat sinkronisasi:", err);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

module.exports = { syncOwnerUsers };
