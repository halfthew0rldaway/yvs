const prisma = require("../config/database");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { normalizeEmail, normalizeName } = require("../utils/normalize");

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
        if (role) where.user_roles = { some: { role: { slug: role } } };
        if (search) {
            where.OR = [
                { nama: { contains: search } },
                { username: { contains: search } },
                { email: { contains: search } },
            ];
        }

        const select = {
            id: true,
            nama: true,
            username: true,
            email: true,
            role: true,
            is_super_admin: true,
            user_roles: { select: { role: { select: { id: true, name: true, slug: true } } } },
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
            where: { user_roles: { some: { role: { permissions: { some: { permission: { code: "tickets.diagnosis" } } } } } } },
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

// Detail analitik performa seorang teknisi beserta daftar tiket lengkap
async function getSingleTechnicianPerformanceDetail(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID teknisi tidak valid" });
        }

        const teknisi = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nama: true,
                email: true,
                role: true,
                foto_profile: true,
                created_at: true,
                tiket_servis: {
                    include: {
                        perangkat: {
                            include: {
                                customer: {
                                    select: { id: true, nama: true, nomor_telepon: true }
                                }
                            }
                        },
                        invoice: {
                            select: { id: true, total_biaya: true, biaya_jasa: true, biaya_sparepart: true, created_at: true }
                        },
                        penggunaan_sparepart: {
                            select: { id: true, jumlah: true }
                        }
                    },
                    orderBy: { created_at: "desc" }
                }
            }
        });

        if (!teknisi) {
            return res.status(404).json({ message: "Teknisi tidak ditemukan" });
        }

        const allTickets = teknisi.tiket_servis || [];
        const totalAssigned = allTickets.length;
        const completedTikets = allTickets.filter(t => ["selesai", "diambil"].includes(t.status));
        const inProgressTikets = allTickets.filter(t => t.status === "dalam_perbaikan");
        const inDiagnosisTikets = allTickets.filter(t => t.status === "didiagnosis");
        const waitingApprovalTikets = allTickets.filter(t => t.status === "menunggu_persetujuan");
        const approvedTikets = allTickets.filter(t => t.status === "disetujui");
        const cancelledTikets = allTickets.filter(t => t.status === "dibatalkan");

        let totalRevenue = 0;
        let totalHours = 0;
        let validDurationCount = 0;
        let totalRating = 0;
        let ratingCount = 0;

        allTickets.forEach(tk => {
            if (tk.rating_teknisi) {
                totalRating += tk.rating_teknisi;
                ratingCount++;
            }
            if (["selesai", "diambil"].includes(tk.status) && tk.invoice?.total_biaya) {
                totalRevenue += tk.invoice.total_biaya;
            }
            // Durasi hanya dihitung dari tiket yang benar-benar selesai (konsisten dengan getTechnicianPerformance)
            if (["selesai", "diambil"].includes(tk.status) && tk.completed_at && tk.created_at) {
                const hrs = (new Date(tk.completed_at).getTime() - new Date(tk.created_at).getTime()) / (3600 * 1000);
                if (hrs > 0) {
                    totalHours += hrs;
                    validDurationCount++;
                }
            }
        });

        const avgRepairHours = validDurationCount > 0 ? Number((totalHours / validDurationCount).toFixed(1)) : 0;
        const avgRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(1)) : null;
        const completionRate = totalAssigned > 0 ? Math.round((completedTikets.length / totalAssigned) * 100) : 0;

        // Map tickets with structured presentation data
        const mappedTickets = allTickets.map(tk => {
            let durationHours = null;
            if (tk.completed_at && tk.created_at) {
                const hrs = (new Date(tk.completed_at).getTime() - new Date(tk.created_at).getTime()) / (3600 * 1000);
                durationHours = hrs > 0 ? Number(hrs.toFixed(1)) : null;
            }

            return {
                id: tk.id,
                nomor_tiket: tk.nomor_tiket,
                status: tk.status,
                keluhan: tk.keluhan,
                created_at: tk.created_at,
                completed_at: tk.completed_at,
                duration_hours: durationHours,
                rating_teknisi: tk.rating_teknisi,
                is_garansi_claim: tk.is_garansi_claim,
                sla_paket: tk.sla_paket,
                perangkat: tk.perangkat ? {
                    merek: tk.perangkat.merek,
                    model: tk.perangkat.model,
                    jenis_perangkat: tk.perangkat.jenis_perangkat
                } : null,
                customer: tk.perangkat?.customer ? {
                    id: tk.perangkat.customer.id,
                    nama: tk.perangkat.customer.nama,
                    nomor_telepon: tk.perangkat.customer.nomor_telepon
                } : null,
                invoice: tk.invoice ? {
                    id: tk.invoice.id,
                    total_biaya: tk.invoice.total_biaya,
                    biaya_jasa: tk.invoice.biaya_jasa,
                    biaya_sparepart: tk.invoice.biaya_sparepart,
                    created_at: tk.invoice.created_at
                } : null,
                sparepart_count: tk.penggunaan_sparepart?.length || 0
            };
        });

        return res.json({
            teknisi: {
                id: teknisi.id,
                nama: teknisi.nama,
                email: teknisi.email,
                role: teknisi.role,
                foto_profile: teknisi.foto_profile || null,
                created_at: teknisi.created_at
            },
            summary: {
                totalAssigned,
                completedCount: completedTikets.length,
                inProgressCount: inProgressTikets.length,
                inDiagnosisCount: inDiagnosisTikets.length,
                waitingApprovalCount: waitingApprovalTikets.length,
                approvedCount: approvedTikets.length,
                cancelledCount: cancelledTikets.length,
                totalRevenue,
                avgRepairHours,
                avgRating,
                ratingCount,
                completionRate
            },
            tickets: mappedTickets
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat detail performa teknisi", error: error.message });
    }
}

// Menambah user baru (Admin)
async function createUser(req, res) {
    try {
        const { nama, username, email, password, role, roleIds = [] } = req.body;

        if (!nama || !password) {
            return res.status(400).json({ message: "Nama dan password wajib diisi" });
        }

        const cleanEmail = email ? normalizeEmail(email) : `${(username || nama).toLowerCase().replace(/\s+/g, "")}@workshop.local`;
        const cleanNama = normalizeName(nama);
        const cleanRole = role ? role.trim().toLowerCase() : "teknisi";
        const cleanUsername = username 
            ? username.trim().toLowerCase() 
            : (cleanEmail.includes("@") ? cleanEmail.split("@")[0].toLowerCase() : cleanNama.toLowerCase().replace(/\s+/g, ""));

        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: cleanEmail },
                    { username: cleanUsername }
                ]
            }
        });
        if (existing) {
            return res.status(400).json({ message: "Username atau Email sudah terdaftar" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        if (!Array.isArray(roleIds)) {
            return res.status(400).json({ message: "roleIds harus berupa array" });
        }
        const selectedRoles = roleIds.length
            ? await prisma.role.findMany({ where: { id: { in: roleIds.map(Number) } } })
            : await prisma.role.findMany({ where: { slug: cleanRole } });
        if (!selectedRoles.length) {
            return res.status(400).json({ message: "Pilih minimal satu peran yang valid" });
        }
        if (selectedRoles.length !== new Set(roleIds.map(Number)).size && roleIds.length) {
            return res.status(400).json({ message: "Satu atau lebih peran tidak ditemukan" });
        }

        const user = await prisma.user.create({
            data: {
                nama: cleanNama,
                username: cleanUsername,
                email: cleanEmail,
                password: hashedPassword,
                role: selectedRoles[0].slug,
                foto_profile: req.body.foto_profile || null,
                user_roles: { create: selectedRoles.map(selectedRole => ({ role_id: selectedRole.id })) }
            },
            select: {
                id: true,
                nama: true,
                username: true,
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
        const { nama, username, email, password, role, foto_profile, currentPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const cleanEmail = email ? normalizeEmail(email) : undefined;
        const cleanUsername = username ? username.trim().toLowerCase() : undefined;
        const cleanNama = nama ? normalizeName(nama) : undefined;
        const cleanRole = role ? role.trim().toLowerCase() : undefined;

        if (cleanUsername && cleanUsername !== user.username) {
            const existingUsername = await prisma.user.findFirst({ where: { username: cleanUsername } });
            if (existingUsername) {
                return res.status(400).json({ message: "Username sudah digunakan oleh user lain" });
            }
        }

        if (cleanEmail && cleanEmail !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
            if (existing) {
                return res.status(400).json({ message: "Email sudah digunakan oleh user lain" });
            }
        }

        const updateData = {
            nama: cleanNama || user.nama,
            username: cleanUsername || user.username,
            email: cleanEmail || user.email,
            role: user.role,
            ...(foto_profile !== undefined && { foto_profile })
        };

        if (password && password.trim() !== "") {
            if (user.is_super_admin && id !== req.user.id) {
                return res.status(403).json({ message: "Kata sandi Super Admin lain hanya dapat diubah oleh pemilik akun melalui profil" });
            }
            const actor = await prisma.user.findUnique({ where: { id: req.user.id }, select: { password: true } });
            if (!actor || !currentPassword || !await bcrypt.compare(currentPassword, actor.password)) {
                return res.status(403).json({ message: "Konfirmasi kata sandi Super Admin Anda diperlukan" });
            }
            if (password.length < 6) return res.status(400).json({ message: "Password baru minimal 6 karakter" });
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nama: true,
                username: true,
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

async function updateUserRoles(req, res) {
    try {
        const id = Number(req.params.id);
        const { roleIds } = req.body;
        if (!Array.isArray(roleIds) || !roleIds.length) return res.status(400).json({ message: "Pilih minimal satu peran" });
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
        const uniqueRoleIds = [...new Set(roleIds.map(Number))];
        const roles = await prisma.role.findMany({ where: { id: { in: uniqueRoleIds } } });
        if (roles.length !== uniqueRoleIds.length) return res.status(400).json({ message: "Satu atau lebih peran tidak ditemukan" });
        const primaryRole = roles.find(role => role.id === uniqueRoleIds[0]);
        await prisma.$transaction([
            prisma.userRole.deleteMany({ where: { user_id: id } }),
            prisma.userRole.createMany({ data: uniqueRoleIds.map(role_id => ({ user_id: id, role_id })) }),
            prisma.user.update({ where: { id }, data: { role: primaryRole.slug, auth_version: { increment: 1 } } })
        ]);
        return res.json({ message: "Peran pengguna berhasil diperbarui" });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memperbarui peran pengguna", error: error.message });
    }
}

async function setSuperAdmin(req, res) {
    const targetId = Number(req.params.id);
    const { enabled, currentPassword } = req.body || {};
    if (!Number.isInteger(targetId) || targetId < 1 || typeof enabled !== "boolean" || typeof currentPassword !== "string" || !currentPassword) {
        return res.status(400).json({ message: "ID, status Super Admin, dan kata sandi Anda wajib diisi" });
    }
    try {
        const actor = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, nama: true, password: true } });
        if (!actor || !await bcrypt.compare(currentPassword, actor.password)) {
            return res.status(403).json({ message: "Kata sandi Anda tidak sesuai" });
        }

        const result = await prisma.$transaction(async tx => {
            // Serialize changes to the designated administrators so concurrent
            // demotions cannot remove the final Super Admin.
            const administrators = await tx.$queryRaw`SELECT id FROM User WHERE is_super_admin = 1 FOR UPDATE`;
            if (!administrators.some(row => Number(row.id) === actor.id)) {
                const error = new Error("Hak Super Admin Anda telah dicabut"); error.status = 403; throw error;
            }
            const target = await tx.user.findUnique({ where: { id: targetId }, select: { id: true, nama: true, username: true, is_super_admin: true } });
            if (!target) { const error = new Error("User tidak ditemukan"); error.status = 404; throw error; }
            if (target.is_super_admin === enabled) return { target, changed: false };
            if (!enabled && administrators.length <= 1) {
                const error = new Error("Super Admin terakhir tidak dapat dicabut"); error.status = 409; throw error;
            }
            const updated = await tx.user.update({ where: { id: targetId }, data: { is_super_admin: enabled, auth_version: { increment: 1 } }, select: { id: true, nama: true, username: true, is_super_admin: true } });
            await tx.activityLog.create({ data: {
                user_id: actor.id,
                user_nama: actor.nama,
                action: `${enabled ? "Menetapkan" : "Mencabut"} Super Admin untuk ${updated.nama} (@${updated.username || updated.id})`,
                entity: "user"
            } });
            return { target: updated, changed: true };
        });
        return res.json({ message: result.changed ? "Status Super Admin berhasil diperbarui" : "Status Super Admin tidak berubah", data: result.target });
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.status ? error.message : "Gagal memperbarui status Super Admin" });
    }
}

// Menghapus user (Admin)
async function deleteUser(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "ID user tidak valid" });
    if (id === req.user.id) return res.status(400).json({ message: "Anda tidak dapat menghapus akun Anda sendiri" });
    try {
        await prisma.$transaction(async tx => {
            const administrators = await tx.$queryRaw`SELECT id FROM User WHERE is_super_admin = 1 FOR UPDATE`;
            if (!administrators.some(row => Number(row.id) === req.user.id)) {
                const error = new Error("Hak Super Admin Anda telah dicabut"); error.status = 403; throw error;
            }
            const user = await tx.user.findUnique({ where: { id }, select: { id: true, nama: true, is_super_admin: true } });
            if (!user) { const error = new Error("User tidak ditemukan"); error.status = 404; throw error; }
            if (user.is_super_admin && administrators.length <= 1) {
                const error = new Error("Super Admin terakhir tidak dapat dihapus. Tetapkan Super Admin lain terlebih dahulu."); error.status = 409; throw error;
            }
            const activeTicket = await tx.tiketServis.findFirst({
                where: { teknisi_id: id, status: { notIn: ["selesai", "diambil", "dibatalkan"] } },
                select: { id: true }
            });
            if (activeTicket) {
                const error = new Error("Teknisi ini sedang menangani tiket servis aktif. Alihkan tiket ke teknisi lain terlebih dahulu sebelum menghapus akun."); error.status = 409; throw error;
            }
            await tx.user.delete({ where: { id } });
            await tx.activityLog.create({ data: { user_id: req.user.id, user_nama: req.user.nama || req.user.username || "Super Admin", action: `Menghapus akun ${user.nama} (ID ${id})`, entity: "user" } });
        });
        return res.json({ message: "User berhasil dihapus" });
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.status ? error.message : "Terjadi kesalahan", ...(!error.status && { error: error.message }) });
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
            select: { id: true, nama: true, username: true, email: true, role: true, foto_profile: true, created_at: true }
        });

        return res.json({ message: "Foto profil user berhasil diperbarui", data: updated, foto_profile: newAvatarUrl });
    } catch (error) {
        return res.status(500).json({ message: "Gagal mengunggah foto profil", error: error.message });
    }
}

module.exports = {
    getAllUsers,
    getTechnicianPerformance,
    getSingleTechnicianPerformanceDetail,
    createUser,
    updateUser,
    updateUserRoles,
    setSuperAdmin,
    deleteUser,
    uploadUserPhoto
};
