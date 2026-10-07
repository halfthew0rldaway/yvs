const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/database");

// Login
async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Email atau password salah" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: "Email atau password salah" });
        }

        const token = jwt.sign(
            { id: user.id, nama: user.nama, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.json({
            message: "Login berhasil",
            token,
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Logout (client-side, token dihapus di frontend)
async function logout(req, res) {
    return res.json({ message: "Logout berhasil" });
}

// Mengambil data user yang sedang login
async function me(req, res) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, nama: true, email: true, role: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}
// Update Profil
async function updateProfile(req, res) {
    try {
        const { nama, email, currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        const dataToUpdate = {};

        // Validasi dan update email jika diubah
        if (email && email !== user.email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) return res.status(400).json({ message: "Email sudah digunakan oleh akun lain" });
            dataToUpdate.email = email;
        }

        if (nama) dataToUpdate.nama = nama;

        // Ubah password jika form diisi
        if (currentPassword && newPassword) {
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) return res.status(400).json({ message: "Password lama tidak sesuai" });
            if (newPassword.length < 6) return res.status(400).json({ message: "Password baru minimal 6 karakter" });
            
            dataToUpdate.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { id: true, nama: true, email: true, role: true }
        });

        return res.json({ message: "Profil berhasil diperbarui", user: updatedUser });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan sistem", error: error.message });
    }
}

module.exports = { login, logout, me, updateProfile };
