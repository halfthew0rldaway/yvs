const prisma = require("../config/database");

/**
 * Service untuk mencatat audit trail aktivitas pengguna (Anti-Fraud & History).
 * Tidak melempar error agar kegagalan logging tidak memutus transaksi utama.
 */
async function recordActivity({ userId, userNama, action, entity = "sistem", req }) {
    try {
        let finalUserId = userId;
        let finalUserNama = userNama;

        if (req && req.user) {
            finalUserId = finalUserId || req.user.id;
            finalUserNama = finalUserNama || req.user.nama || req.user.username;
        }

        finalUserNama = finalUserNama || "Sistem";

        return await prisma.activityLog.create({
            data: {
                user_id: finalUserId ? Number(finalUserId) : null,
                user_nama: String(finalUserNama),
                action: String(action),
                entity: String(entity)
            }
        });
    } catch (err) {
        console.error("Gagal mencatat audit log:", err.message);
        return null;
    }
}

module.exports = {
    recordActivity
};
