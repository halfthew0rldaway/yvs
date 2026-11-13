const jwt = require("jsonwebtoken");
const { getAuthorization, hasPermission } = require("../services/authorization.service");

// Permissions are looked up on every request so revoked access takes effect immediately.
async function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const authorization = await getAuthorization(decoded.id);
        if (!authorization) {
            return res.status(401).json({ message: "User tidak ditemukan", code: "USER_NOT_FOUND" });
        }
        req.authorization = authorization;
        req.user = {
            ...decoded,
            role: authorization.role,
            is_super_admin: authorization.is_super_admin,
            roles: authorization.roles,
            permissions: authorization.permissions
        };
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                message: "Sesi login Anda telah berakhir. Silakan login kembali.", 
                code: "TOKEN_EXPIRED" 
            });
        }
        if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
            return res.status(401).json({ message: "Token tidak valid", code: "INVALID_TOKEN" });
        }
        console.error("Authorization lookup failed:", error);
        return res.status(503).json({ message: "Layanan otorisasi tidak tersedia", code: "AUTH_UNAVAILABLE" });
    }
}

function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.authorization) {
            return res.status(401).json({ message: "Tidak terautentikasi" });
        }
        if (!hasPermission(req.authorization, permissions)) {
            return res.status(403).json({
                message: "Tidak memiliki hak akses untuk tindakan ini",
                code: "PERMISSION_DENIED",
                requiredPermissions: permissions
            });
        }
        next();
    };
}

function requireSuperAdmin(req, res, next) {
    if (!req.authorization?.is_super_admin) {
        return res.status(403).json({ message: "Khusus Super Admin", code: "SUPER_ADMIN_REQUIRED" });
    }
    next();
}

function requireTicketMutation(req, res, next) {
    if (!req.authorization) return res.status(401).json({ message: "Tidak terautentikasi" });
    const statusPermission = {
        didiagnosis: "tickets.diagnosis",
        menunggu_persetujuan: "tickets.diagnosis",
        disetujui: "tickets.approval",
        dalam_perbaikan: "tickets.repair",
        selesai: "tickets.qc",
        diambil: "tickets.handover",
        dibatalkan: "tickets.cancel"
    };
    const required = [];
    const fieldPermissions = {
        keluhan: ["tickets.intake"], checklist_intake: ["tickets.intake"],
        kelengkapan_detail: ["tickets.intake"], tipe_kunci: ["tickets.intake"],
        password_perangkat: ["tickets.intake"], izin_bongkar: ["tickets.intake"],
        izin_akses_os: ["tickets.intake"], izin_backup_mandiri: ["tickets.intake"],
        batasan_izin: ["tickets.intake"], kondisi_fisik: ["tickets.intake"],
        spesifikasi_awal: ["tickets.intake"], prioritas_pelanggan: ["tickets.intake"],
        defect_map: ["tickets.intake", "tickets.repair"],
        checklist_qc: ["tickets.qc"], foto_selesai: ["tickets.qc"],
        foto_diagnosis: ["tickets.diagnosis"], foto_handover: ["tickets.handover"],
        status_part_bekas: ["tickets.repair"], catatan_part_bekas: ["tickets.repair"],
        catatan_admin: ["tickets.approval"], sla_paket: ["tickets.approval"],
        target_pengecekan_at: ["tickets.approval"], target_selesai_at: ["tickets.approval"],
        disetujui_at: ["tickets.approval"],
        kategori_perbaikan: ["tickets.handover"], durasi_garansi: ["tickets.handover"],
        tips_perawatan: ["tickets.handover"],
        alasan_batal: ["tickets.cancel"], catatan_batal: ["tickets.cancel"],
        biaya_pembatalan: ["tickets.cancel"]
    };
    if (req.body?.teknisi_id !== undefined) {
        const assigningSelf = Number(req.body.teknisi_id) === Number(req.user?.id) && req.body.teknisi_id !== null && req.body.teknisi_id !== "";
        if (!hasPermission(req.authorization, "tickets.assign") && !(assigningSelf && hasPermission(req.authorization, "tickets.claim"))) {
            return res.status(403).json({ message: "Tidak memiliki hak untuk menugaskan tiket", code: "PERMISSION_DENIED", requiredPermissions: ["tickets.assign", "tickets.claim"] });
        }
    }
    if (req.body?.status !== undefined) required.push(statusPermission[req.body.status] || "tickets.intake");
    for (const [field, options] of Object.entries(fieldPermissions)) {
        if (req.body?.[field] !== undefined && !hasPermission(req.authorization, options)) {
            return res.status(403).json({ message: `Tidak memiliki hak untuk mengubah ${field}`, code: "PERMISSION_DENIED", requiredPermissions: options });
        }
    }
    if (!required.length && !Object.keys(fieldPermissions).some(field => req.body?.[field] !== undefined) && req.body?.teknisi_id === undefined) required.push("tickets.intake");
    if (required.length && !hasPermission(req.authorization, required, true)) {
        return res.status(403).json({ message: "Tidak memiliki hak akses untuk tindakan ini", code: "PERMISSION_DENIED", requiredPermissions: required });
    }
    next();
}

module.exports = { authenticate, requirePermission, requireSuperAdmin, requireTicketMutation };
