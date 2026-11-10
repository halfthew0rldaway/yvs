const { PrismaClient } = require("@prisma/client");

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("🧹 [CLEANUP] Memeriksa akun owner fiktif (H. Bambang Yangversa)...");
        const fictionalOwners = await prisma.user.findMany({
            where: {
                OR: [
                    { username: "owner" },
                    { email: "owner@workshop.com" },
                    { nama: { contains: "Bambang Yangversa" } }
                ]
            }
        });

        if (fictionalOwners.length === 0) {
            console.log("✅ [CLEANUP] Tidak ditemukan akun owner fiktif di database. Database sudah bersih.");
            return;
        }

        for (const fo of fictionalOwners) {
            console.log(`🗑️  [CLEANUP] Menghapus data akun ID ${fo.id} (${fo.nama} / ${fo.username} / ${fo.email})...`);
            await prisma.activityLog.deleteMany({ where: { user_id: fo.id } }).catch(() => {});
            await prisma.notification.deleteMany({ where: { OR: [{ recipient_id: fo.id }, { sender_id: fo.id }] } }).catch(() => {});
            await prisma.attendanceRecord.deleteMany({ where: { user_id: fo.id } }).catch(() => {});
            await prisma.leaveRequest.deleteMany({ where: { user_id: fo.id } }).catch(() => {});
            await prisma.user.delete({ where: { id: fo.id } });
            console.log(`✅ [CLEANUP] Akun '${fo.nama}' berhasil dihapus.`);
        }
    } catch (err) {
        console.error("❌ [CLEANUP] Terjadi kesalahan:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
