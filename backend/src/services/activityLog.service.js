const prisma = require("../config/database");

/**
 * Service untuk mencatat audit trail aktivitas pengguna (Anti-Fraud & History).
 * Tangguh terhadap foreign key mismatch dan tidak melempar error agar kegagalan
 * logging tidak memutus transaksi utama.
 */
async function recordActivity({ userId, userNama, action, entity = "sistem", req }) {
    let finalUserId = userId;
    let finalUserNama = userNama;

    if (req && req.user) {
        finalUserId = finalUserId || req.user.id;
        finalUserNama = finalUserNama || req.user.nama || req.user.username;
    }

    finalUserNama = finalUserNama || "Sistem";
    const normalizedEntity = String(entity || "sistem").toLowerCase();
    const finalAction = String(action || "Melakukan aktivitas di sistem");

    try {
        return await prisma.activityLog.create({
            data: {
                user_id: finalUserId ? Number(finalUserId) : null,
                user_nama: String(finalUserNama),
                action: finalAction,
                entity: normalizedEntity
            }
        });
    } catch (err) {
        // Foreign key constraint failure fallback (e.g. user_id was re-seeded or invalidated)
        if (err.code === "P2003" || err.message?.includes("foreign key")) {
            try {
                return await prisma.activityLog.create({
                    data: {
                        user_id: null,
                        user_nama: String(finalUserNama),
                        action: finalAction,
                        entity: normalizedEntity
                    }
                });
            } catch (retryErr) {
                console.error("Gagal mencatat audit log (retry fallback):", retryErr.message);
                return null;
            }
        }
        console.error("Gagal mencatat audit log:", err.message);
        return null;
    }
}

module.exports = {
    recordActivity
};
