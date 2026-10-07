const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function resetPassword() {
    console.log("======================================");
    console.log("🔐 SERV.IO - FORCE PASSWORD RESET 🔐");
    console.log("======================================\n");

    rl.question("Masukkan Email Akun: ", async (email) => {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log("\n❌ ERROR: User dengan email tersebut tidak ditemukan!");
            rl.close();
            await prisma.$disconnect();
            return;
        }

        console.log(`\n✅ User Ditemukan: ${user.nama} (${user.role})`);

        rl.question("Masukkan Password Baru: ", async (newPassword) => {
            if (newPassword.length < 6) {
                console.log("\n❌ ERROR: Password minimal harus 6 karakter!");
                rl.close();
                await prisma.$disconnect();
                return;
            }

            try {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                
                await prisma.user.update({
                    where: { email },
                    data: { password: hashedPassword }
                });

                console.log(`\n🎉 SUKSES! Password untuk ${email} berhasil direset.`);
                console.log(`Silakan login dengan password baru: ${newPassword}\n`);
            } catch (err) {
                console.error("\n❌ ERROR: Gagal mereset password.", err);
            } finally {
                rl.close();
                await prisma.$disconnect();
            }
        });
    });
}

resetPassword();
