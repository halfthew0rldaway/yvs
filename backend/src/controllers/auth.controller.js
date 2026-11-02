const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const prisma = require("../config/database");
const { recordActivity } = require("../services/activityLog.service");
const { normalizeEmail, normalizeName } = require("../utils/normalize");

// Login
async function login(req, res) {
    try {
        const { email, password, rememberMe } = req.body;
        const cleanEmail = normalizeEmail(email);

        const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) {
            return res.status(401).json({ message: "Email atau password salah" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: "Email atau password salah" });
        }

        // Ingat Saya: 30 hari vs 1 hari (atau JWT_EXPIRES_IN)
        const expiresIn = rememberMe ? "30d" : (process.env.JWT_EXPIRES_IN || "1d");

        const token = jwt.sign(
            { id: user.id, nama: user.nama, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        // Catat aktivitas login ke Audit Log
        await recordActivity({
            userId: user.id,
            userNama: user.nama,
            action: `Masuk ke dalam sistem (Login)${rememberMe ? " [Ingat Saya: Aktif]" : ""}`,
            entity: "user"
        });

        return res.json({
            message: "Login berhasil",
            token,
            rememberMe: Boolean(rememberMe),
            expiresIn,
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                role: user.role,
                foto_profile: user.foto_profile || null
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Refresh token / perpanjang masa aktif sesi
async function refreshSession(req, res) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, nama: true, email: true, role: true, foto_profile: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const rememberMe = req.body?.rememberMe ?? false;
        const expiresIn = rememberMe ? "30d" : (process.env.JWT_EXPIRES_IN || "1d");

        const token = jwt.sign(
            { id: user.id, nama: user.nama, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        return res.json({
            message: "Sesi berhasil diperbarui",
            token,
            rememberMe: Boolean(rememberMe),
            expiresIn,
            user,
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memperbarui sesi", error: error.message });
    }
}

// Logout (client-side, token dihapus di frontend)
async function logout(req, res) {
    if (req.user) {
        await recordActivity({
            userId: req.user.id,
            userNama: req.user.nama || req.user.username || "Staff",
            action: "Keluar dari sistem (Logout)",
            entity: "user"
        });
    }
    return res.json({ message: "Logout berhasil" });
}

// Mengambil data user yang sedang login
async function me(req, res) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, nama: true, email: true, role: true, foto_profile: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Update Profil (Nama, Email, Password, Foto Profile)
async function updateProfile(req, res) {
    try {
        const { nama, email, currentPassword, newPassword, foto_profile } = req.body;
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        const dataToUpdate = {};

        // Validasi dan update email jika diubah
        const cleanEmail = email ? normalizeEmail(email) : undefined;
        if (cleanEmail && cleanEmail !== user.email) {
            const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
            if (existingUser) return res.status(400).json({ message: "Email sudah digunakan oleh akun lain" });
            dataToUpdate.email = cleanEmail;
        }

        if (nama) dataToUpdate.nama = normalizeName(nama);
        if (foto_profile !== undefined) dataToUpdate.foto_profile = foto_profile;

        // Ubah password jika form diisi
        if (newPassword && !currentPassword) {
            return res.status(400).json({ message: "Password lama wajib diisi untuk mengubah password" });
        }
        if (currentPassword && !newPassword) {
            return res.status(400).json({ message: "Password baru wajib diisi" });
        }
        if (currentPassword && newPassword) {
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) return res.status(400).json({ message: "Password lama tidak sesuai" });
            if (newPassword.length < 6) return res.status(400).json({ message: "Password baru minimal 6 karakter" });
            
            dataToUpdate.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { id: true, nama: true, email: true, role: true, foto_profile: true }
        });

        await recordActivity({
            userId: req.user.id,
            userNama: updatedUser.nama,
            action: `Memperbarui profil akun (Nama: ${updatedUser.nama}, Email: ${updatedUser.email})`,
            entity: "user"
        });

        return res.json({ message: "Profil berhasil diperbarui", user: updatedUser });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan sistem", error: error.message });
    }
}

// Upload & update foto profil user aktif
async function uploadProfilePhoto(req, res) {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ message: "Tidak ada file foto yang diunggah" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        // Hapus avatar lama jika ada dan file berada di local uploads/avatars/
        if (user.foto_profile && user.foto_profile.startsWith("/uploads/avatars/")) {
            const oldFilePath = path.join(__dirname, "../../", user.foto_profile);
            if (fs.existsSync(oldFilePath)) {
                try { fs.unlinkSync(oldFilePath); } catch (_) {}
            }
        }

        const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { foto_profile: newAvatarUrl },
            select: { id: true, nama: true, email: true, role: true, foto_profile: true }
        });

        await recordActivity({
            userId: req.user.id,
            userNama: updatedUser.nama,
            action: "Memperbarui foto profil akun",
            entity: "user"
        });

        return res.json({
            message: "Foto profil berhasil diperbarui",
            foto_profile: newAvatarUrl,
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal mengunggah foto profil", error: error.message });
    }
}

// Hapus foto profil user aktif (kembali ke avatar inisial)
async function removeProfilePhoto(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        if (user.foto_profile && user.foto_profile.startsWith("/uploads/avatars/")) {
            const oldFilePath = path.join(__dirname, "../../", user.foto_profile);
            if (fs.existsSync(oldFilePath)) {
                try { fs.unlinkSync(oldFilePath); } catch (_) {}
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { foto_profile: null },
            select: { id: true, nama: true, email: true, role: true, foto_profile: true }
        });

        await recordActivity({
            userId: req.user.id,
            userNama: updatedUser.nama,
            action: "Menghapus foto profil akun",
            entity: "user"
        });

        return res.json({
            message: "Foto profil berhasil dihapus",
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menghapus foto profil", error: error.message });
    }
}

module.exports = { login, logout, refreshSession, me, updateProfile, uploadProfilePhoto, removeProfilePhoto };
