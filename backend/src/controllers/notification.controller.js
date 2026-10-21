const prisma = require("../config/database");

// Mengambil daftar notifikasi untuk user yang sedang login
async function getNotifications(req, res) {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { user_id: userId },
                    { recipient_role: userRole },
                    { recipient_role: null }
                ]
            },
            orderBy: { created_at: "desc" },
            take: 40
        });

        const unreadCount = notifications.filter(n => !n.is_read).length;

        return res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil jumlah notifikasi belum dibaca
async function getUnreadCount(req, res) {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        const unreadCount = await prisma.notification.count({
            where: {
                is_read: false,
                OR: [
                    { user_id: userId },
                    { recipient_role: userRole },
                    { recipient_role: null }
                ]
            }
        });

        return res.json({ unreadCount });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menandai satu notifikasi sebagai sudah dibaca
async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: { id: Number(id) },
            data: { is_read: true }
        });

        return res.json({ message: "Notifikasi telah dibaca", notification });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menandai seluruh notifikasi user sebagai sudah dibaca
async function markAllAsRead(req, res) {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        await prisma.notification.updateMany({
            where: {
                is_read: false,
                OR: [
                    { user_id: userId },
                    { recipient_role: userRole },
                    { recipient_role: null }
                ]
            },
            data: { is_read: true }
        });

        return res.json({ message: "Seluruh notifikasi ditandai telah dibaca" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengirimkan notifikasi / memo internal antara Teknisi dan Admin
async function sendMemo(req, res) {
    try {
        const { recipient_role, user_id, judul, pesan, link, tipe } = req.body;

        if (!judul || !pesan) {
            return res.status(400).json({ message: "Judul dan pesan memo wajib diisi" });
        }

        const senderNama = req.user.nama;
        const senderId = req.user.id;

        const notif = await prisma.notification.create({
            data: {
                recipient_role: recipient_role || (req.user.role === "teknisi" ? "admin" : "teknisi"),
                user_id: user_id ? Number(user_id) : null,
                sender_id: senderId,
                sender_nama: senderNama,
                tipe: tipe || "memo",
                judul,
                pesan,
                link: link || null
            }
        });

        await prisma.activityLog.create({
            data: {
                user_id: senderId,
                user_nama: senderNama,
                action: `Memo (${senderNama} -> ${recipient_role || "Semua"}): ${judul}`,
                entity: "notification"
            }
        });

        return res.status(201).json({
            message: "Memo / notifikasi berhasil dikirim",
            notification: notif
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    sendMemo
};

