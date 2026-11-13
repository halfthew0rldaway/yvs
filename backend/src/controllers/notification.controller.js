const prisma = require("../config/database");
const { broadcast } = require("../utils/sse");
const { hasPermission } = require("../services/authorization.service");

const sidebarPaths = ["/tiket-servis", "/perangkat", "/customer", "/loaner", "/sparepart", "/rma", "/supplier", "/invoice", "/retensi", "/attendance", "/wiki", "/recruitment", "/users", "/database", "/audit-log", "/dashboard"];

async function getSidebarCounts(req, res) {
    try {
        const unread = await prisma.notification.groupBy({
            by: ["link"],
            where: { is_read: false, ...recipientScope(req), reads: { none: { user_id: req.user.id } }, link: { not: null } },
            _count: { _all: true }
        });
        const counts = {};
        for (const row of unread) {
            if (!row.link?.startsWith("/") || row.link.startsWith("//")) continue;
            const path = sidebarPaths.find(path => row.link === path || row.link.startsWith(`${path}/`) || row.link.startsWith(`${path}?`));
            if (path) counts[path] = (counts[path] || 0) + row._count._all;
        }
        let registrations = 0;
        if (hasPermission(req.authorization, "tickets.intake")) {
            registrations = await prisma.customerRegistration.count({ where: { status: { in: ["pending", "accepted"] }, submitted_at: { not: null }, ticket_id: null } });
            counts["/tiket-servis"] = (counts["/tiket-servis"] || 0) + registrations;
        }
        res.set("Cache-Control", "no-store").json({ counts, registrations });
    } catch (error) {
        console.error("Could not load sidebar counts", error);
        res.status(500).json({ message: "Gagal memuat jumlah notifikasi menu" });
    }
}

function recipientScope(req) {
    const roleSlugs = req.authorization?.roles?.map(role => role.slug) || [];
    return { OR: [
        { user_id: req.user.id },
        { user_id: null, recipient_role: { in: roleSlugs } },
        { user_id: null, recipient_role: null }
    ] };
}

async function getRecipientRoles(req, res) {
    try {
        const roles = await prisma.role.findMany({ select: { name: true, slug: true }, orderBy: { name: "asc" } });
        return res.json(roles);
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat peran penerima" });
    }
}

// Mengambil daftar notifikasi untuk user yang sedang login
async function getNotifications(req, res) {
    try {
        const notifications = await prisma.notification.findMany({
            where: recipientScope(req),
            orderBy: { created_at: "desc" },
            take: 40,
            include: { reads: { where: { user_id: req.user.id }, select: { user_id: true } } }
        });
        const unreadCount = await prisma.notification.count({
            where: { ...recipientScope(req), is_read: false, reads: { none: { user_id: req.user.id } } }
        });

        return res.json({
            notifications: notifications.map(({ reads, ...notification }) => ({
                ...notification,
                is_read: notification.is_read || reads.length > 0
            })),
            unreadCount
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil jumlah notifikasi belum dibaca
async function getUnreadCount(req, res) {
    try {
        const unreadCount = await prisma.notification.count({
            where: {
                is_read: false,
                ...recipientScope(req),
                reads: { none: { user_id: req.user.id } }
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
        const visible = await prisma.notification.findFirst({ where: { id: Number(id), ...recipientScope(req) } });
        if (!visible) return res.status(404).json({ message: "Notifikasi tidak ditemukan" });
        await prisma.notificationRead.createMany({
            data: [{ notification_id: visible.id, user_id: req.user.id }],
            skipDuplicates: true
        });
        const notification = { ...visible, is_read: true };

        broadcast("notification:updated", { id: notification.id, is_read: true });
        return res.json({ message: "Notifikasi telah dibaca", notification });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menandai seluruh notifikasi user sebagai sudah dibaca
async function markAllAsRead(req, res) {
    try {
        const unread = await prisma.notification.findMany({
            where: {
                is_read: false,
                ...recipientScope(req),
                reads: { none: { user_id: req.user.id } }
            },
            select: { id: true }
        });
        if (unread.length) await prisma.notificationRead.createMany({
            data: unread.map(notification => ({ notification_id: notification.id, user_id: req.user.id })),
            skipDuplicates: true
        });

        broadcast("notification:updated", { all: true });
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
        if (!recipient_role && !user_id) return res.status(400).json({ message: "Pilih penerima memo" });
        if (recipient_role && !await prisma.role.findUnique({ where: { slug: recipient_role } })) {
            return res.status(400).json({ message: "Peran penerima tidak ditemukan" });
        }

        const senderNama = req.user.nama;
        const senderId = req.user.id;

        const notif = await prisma.notification.create({
            data: {
                recipient_role: recipient_role || null,
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

        broadcast("notification:new", notif);
        broadcast("dashboard:refresh");

        return res.status(201).json({
            message: "Memo / notifikasi berhasil dikirim",
            notification: notif
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = {
    getSidebarCounts,
    getRecipientRoles,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    sendMemo
};

