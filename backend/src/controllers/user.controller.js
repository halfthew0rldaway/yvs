const prisma = require("../config/database");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");

function formatUsersWithStats(users) {
    return users.map(user => {
        const totalAssigned = user.tiket_servis.length;
        const completedTikets = user.tiket_servis.filter(t => ["selesai", "diambil"].includes(t.status));
        const activeTikets = user.tiket_servis.filter(t => !["selesai", "diambil", "dibatalkan"].includes(t.status));
        const completionRate = totalAssigned > 0 ? Math.round((completedTikets.length / totalAssigned) * 100) : 0;

        let totalRevenue = 0;
        let totalRepairTimeMs = 0;
        let completedWithDurationCount = 0;

        completedTikets.forEach(t => {
            if (t.invoice?.total_biaya) {
                totalRevenue += t.invoice.total_biaya;
            }
            if (t.completed_at && t.created_at) {
                const duration = new Date(t.completed_at).getTime() - new Date(t.created_at).getTime();
                if (duration > 0) {
                    totalRepairTimeMs += duration;
                    completedWithDurationCount++;
                }
            }
        });

        const avgRepairHours = completedWithDurationCount > 0 
            ? (totalRepairTimeMs / (completedWithDurationCount * 3600 * 1000)).toFixed(1)
            : null;

        const { tiket_servis, ...userInfo } = user;

        return {
            ...userInfo,
            stats: {
                totalAssigned,
                activeCount: activeTikets.length,
                completedCount: completedTikets.length,
                completionRate,
                totalRevenue,
                avgRepairHours: avgRepairHours ? Number(avgRepairHours) : 0
            }
        };
    });
}

// Mengambil seluruh user beserta statistik performa teknisi
async function getAllUsers(req, res) {
    try {
        const { search, role } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);

        const where = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { nama: { contains: search } },
                { email: { contains: search } },
            ];
        }

        const select = {
            id: true,
            nama: true,
            email: true,
            role: true,
            foto_profile: true,
            created_at: true,
            tiket_servis: {
                select: {
                    id: true,
                    status: true,
                    created_at: true,
                    completed_at: true,
                    invoice: {
                        select: {
                            total_biaya: true
                        }
                    }
                }
            }
        };

        const orderBy = [{ created_at: "desc" }, { id: "desc" }];

        if (!isPaginated) {
            const users = await prisma.user.findMany({
                where,
                select,
                orderBy
            });

            return res.json(formatUsersWithStats(users));
        }

        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                select,
                orderBy,
                skip,
                take: limit,
            }),
        ]);

        return res.json(buildPaginationResponse(formatUsersWithStats(users), total, page, limit));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Endpoint performa khusus teknisi
async function getTechnicianPerformance(req, res) {
    try {
        const teknisis = await prisma.user.findMany({
            where: { role: "teknisi" },
            select: {
                id: true,
                nama: true,
                email: true,
                foto_profile: true,
                created_at: true,
                tiket_servis: {
                    include: {
                        invoice: true
                    }
                }
            }
        });

        const metrics = teknisis.map(t => {
            const total = t.tiket_servis.length;
            const completed = t.tiket_servis.filter(tk => ["selesai", "diambil"].includes(tk.status));
            const inProgress = t.tiket_servis.filter(tk => tk.status === "dalam_perbaikan");
            const inDiagnosis = t.tiket_servis.filter(tk => tk.status === "didiagnosis");

            let revenue = 0;
            let totalHours = 0;
            let validDurationCount = 0;
            let totalRating = 0;
            let ratingCount = 0;

            t.tiket_servis.forEach(tk => {
                if (tk.rating_teknisi) {
                    totalRating += tk.rating_teknisi;
                    ratingCount++;
                }
            });

            completed.forEach(tk => {
                if (tk.invoice?.total_biaya) {
                    revenue += tk.invoice.total_biaya;
                }
                if (tk.completed_at && tk.created_at) {
                    const hrs = (new Date(tk.completed_at).getTime() - new Date(tk.created_at).getTime()) / (3600 * 1000);
                    if (hrs > 0) {
                        totalHours += hrs;
                        validDurationCount++;
                    }
                }
            });

            const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : null;

            return {
                id: t.id,
                nama: t.nama,
                email: t.email,
                foto_profile: t.foto_profile || null,
                totalAssigned: total,
                completedCount: completed.length,
                inProgressCount: inProgress.length,
                inDiagnosisCount: inDiagnosis.length,
                completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
                totalRevenue: revenue,
                avgRepairHours: validDurationCount > 0 ? Number((totalHours / validDurationCount).toFixed(1)) : 0,
                avgRating: avgRating ? Number(avgRating) : null,
                ratingCount
            };
        });

        // Sort by completed count descending
        metrics.sort((a, b) => b.completedCount - a.completedCount);

        return res.json(metrics);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menambah user baru (Admin)
async function createUser(req, res) {
    try {
        const { nama, email, password, role } = req.body;

        if (!nama || !email || !password) {
            return res.status(400).json({ message: "Nama, email, dan password wajib diisi" });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                nama,
                email,
                password: hashedPassword,
                role: role || "teknisi",
                foto_profile: req.body.foto_profile || null
            },
            select: {
                id: true,
                nama: true,
                email: true,
                role: true,
                foto_profile: true,
                created_at: true
            }
        });

        return res.status(201).json({ message: "User berhasil ditambahkan", data: user });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui data user (Admin)
async function updateUser(req, res) {
    try {
        const id = Number(req.params.id);
        const { nama, email, password, role, foto_profile } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        if (email && email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return res.status(400).json({ message: "Email sudah digunakan oleh user lain" });
            }
        }

        if (id === req.user.id && role && role !== "admin") {
            return res.status(400).json({ message: "Anda tidak dapat menurunkan hak akses peran akun Anda sendiri" });
        }

        const updateData = {
            nama: nama || user.nama,
            email: email || user.email,
            role: role || user.role,
            ...(foto_profile !== undefined && { foto_profile })
        };

        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nama: true,
                email: true,
                role: true,
                foto_profile: true,
                created_at: true
            }
        });

        return res.json({ message: "User berhasil diperbarui", data: updated });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menghapus user (Admin)
async function deleteUser(req, res) {
    try {
        const id = Number(req.params.id);

        if (id === req.user.id) {
            return res.status(400).json({ message: "Anda tidak dapat menghapus akun Anda sendiri" });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Cek apakah teknisi masih memiliki tiket servis yang sedang aktif ditangani
        const activeTickets = await prisma.tiketServis.findFirst({
            where: {
                teknisi_id: id,
                status: { notIn: ["selesai", "diambil", "dibatalkan"] }
            }
        });
        if (activeTickets) {
            return res.status(400).json({
                message: "Teknisi ini sedang menangani tiket servis aktif. Alihkan tiket ke teknisi lain terlebih dahulu sebelum menghapus akun."
            });
        }

        await prisma.user.delete({ where: { id } });

        return res.json({ message: "User berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Upload foto profil user oleh Admin
async function uploadUserPhoto(req, res) {
    try {
        const id = Number(req.params.id);
        if (!req.file) {
            return res.status(400).json({ message: "Tidak ada file foto yang diunggah" });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        if (user.foto_profile && user.foto_profile.startsWith("/uploads/avatars/")) {
            const oldFilePath = path.join(__dirname, "../../", user.foto_profile);
            if (fs.existsSync(oldFilePath)) {
                try { fs.unlinkSync(oldFilePath); } catch (_) {}
            }
        }

        const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;
        const updated = await prisma.user.update({
            where: { id },
            data: { foto_profile: newAvatarUrl },
            select: { id: true, nama: true, email: true, role: true, foto_profile: true, created_at: true }
        });

        return res.json({ message: "Foto profil user berhasil diperbarui", data: updated, foto_profile: newAvatarUrl });
    } catch (error) {
        return res.status(500).json({ message: "Gagal mengunggah foto profil", error: error.message });
    }
}

module.exports = {
    getAllUsers,
    getTechnicianPerformance,
    createUser,
    updateUser,
    deleteUser,
    uploadUserPhoto
};
