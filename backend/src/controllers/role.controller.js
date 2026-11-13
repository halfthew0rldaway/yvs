const prisma = require("../config/database");
const { PERMISSIONS } = require("../config/permissions");
const { recordActivity } = require("../services/activityLog.service");

function slugify(value) {
    return String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const ALLOWED_ICONS = new Set(["shield", "briefcase", "headset", "wrench", "clipboard", "package", "chart"]);
const AUTO_ICONS = ["briefcase", "headset", "wrench", "clipboard", "package", "chart", "shield"];
function normalizeName(value) { return String(value || "").normalize("NFKC").trim().replace(/\s+/g, " "); }
function normalizePermissionCodes(value) {
    if (!Array.isArray(value)) return null;
    return [...new Set(value.map(code => String(code || "").trim()).filter(Boolean))];
}
async function pickAutoIcon() {
    const roles = await prisma.role.findMany({ select: { icon: true } });
    const count = roles.reduce((all, role) => ({ ...all, [role.icon]: (all[role.icon] || 0) + 1 }), {});
    return AUTO_ICONS.reduce((best, icon) => (count[icon] || 0) < (count[best] || 0) ? icon : best, AUTO_ICONS[0]);
}

async function getCatalog(req, res) {
    const reserved = new Set(["roles.manage", "users.view", "users.manage", "system.settings"]);
    const catalog = PERMISSIONS.filter(([code]) => !reserved.has(code)).map(([code, module, action, label]) => ({ code, module, action, label }));
    return res.json(catalog);
}

async function getAll(req, res) {
    try {
        const roles = await prisma.role.findMany({
            include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
            orderBy: [{ is_system: "desc" }, { name: "asc" }]
        });
        res.json(roles.map(role => ({ ...role, permissions: role.permissions.map(item => item.permission) })));
    } catch (error) { res.status(500).json({ message: "Gagal memuat peran", error: error.message }); }
}

async function create(req, res) {
    try {
        const { name, description, permissionCodes = [], icon } = req.body;
        const cleanName = normalizeName(name);
        const slug = slugify(req.body.slug || cleanName);
        if (!name || !slug) return res.status(400).json({ message: "Nama peran wajib diisi" });
        const normalizedCodes = normalizePermissionCodes(permissionCodes);
        if (!normalizedCodes) return res.status(400).json({ message: "permissionCodes harus berupa array" });
        if (icon !== undefined && !ALLOWED_ICONS.has(icon)) return res.status(400).json({ message: "Ikon peran tidak valid" });
        const existing = await prisma.role.findFirst({ where: { OR: [{ slug }, { name: { equals: cleanName } }] } });
        if (existing) return res.status(409).json({ message: `Peran “${existing.name}” sudah ada. Gunakan nama yang berbeda.` });
        const role = await prisma.$transaction(async tx => {
            const created = await tx.role.create({ data: { name: cleanName, slug, description: normalizeName(description) || null, icon: icon || await pickAutoIcon() } });
            const permissions = await tx.permission.findMany({ where: { code: { in: normalizedCodes } }, select: { id: true, code: true } });
            if (permissions.length !== normalizedCodes.length) {
                const found = new Set(permissions.map(item => item.code));
                const error = new Error(`Permission tidak dikenal: ${normalizedCodes.filter(code => !found.has(code)).join(", ")}`);
                error.status = 400;
                throw error;
            }
            if (permissions.length) await tx.rolePermission.createMany({ data: permissions.map(permission => ({ role_id: created.id, permission_id: permission.id })) });
            return created;
        });
        await recordActivity({ req, action: `Membuat peran akses ${role.name}`, entity: "role" });
        return res.status(201).json({ message: "Peran berhasil dibuat", data: role });
    } catch (error) { return res.status(error.status || 500).json({ message: error.message || "Gagal membuat peran" }); }
}

async function update(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "ID peran tidak valid" });
        const role = await prisma.role.findUnique({ where: { id } });
        if (!role) return res.status(404).json({ message: "Peran tidak ditemukan" });
        const { name, description, permissionCodes, icon } = req.body;
        const normalizedCodes = permissionCodes === undefined ? undefined : normalizePermissionCodes(permissionCodes);
        if (normalizedCodes === null) return res.status(400).json({ message: "permissionCodes harus berupa array" });
        if (icon !== undefined && !ALLOWED_ICONS.has(icon)) return res.status(400).json({ message: "Ikon peran tidak valid" });
        const cleanName = name === undefined ? role.name : normalizeName(name);
        if (!cleanName) return res.status(400).json({ message: "Nama peran wajib diisi" });
        const duplicate = await prisma.role.findFirst({ where: { slug: slugify(cleanName), id: { not: id } } });
        if (duplicate) return res.status(409).json({ message: `Peran “${duplicate.name}” sudah ada. Gunakan nama yang berbeda.` });
        const updated = await prisma.$transaction(async tx => {
            const result = await tx.role.update({ data: { ...(name !== undefined && { name: cleanName }), ...(description !== undefined && { description: normalizeName(description) || null }), ...(icon && { icon }) }, where: { id } });
            if (normalizedCodes !== undefined) {
                const permissions = await tx.permission.findMany({ where: { code: { in: normalizedCodes } }, select: { id: true, code: true } });
                if (permissions.length !== normalizedCodes.length) {
                    const found = new Set(permissions.map(item => item.code));
                    const error = new Error(`Permission tidak dikenal: ${normalizedCodes.filter(code => !found.has(code)).join(", ")}`);
                    error.status = 400;
                    throw error;
                }
                await tx.rolePermission.deleteMany({ where: { role_id: id } });
                if (permissions.length) await tx.rolePermission.createMany({ data: permissions.map(permission => ({ role_id: id, permission_id: permission.id })) });
            }
            return result;
        });
        await prisma.user.updateMany({ where: { user_roles: { some: { role_id: id } } }, data: { auth_version: { increment: 1 } } });
        await recordActivity({ req, action: `Mengubah hak akses peran ${updated.name}`, entity: "role" });
        return res.json({ message: "Peran berhasil diperbarui", data: updated });
    } catch (error) { return res.status(error.status || 500).json({ message: error.message || "Gagal memperbarui peran" }); }
}

async function remove(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "ID peran tidak valid" });
        const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
        if (!role) return res.status(404).json({ message: "Peran tidak ditemukan" });
        if (role.is_system) return res.status(400).json({ message: "Peran bawaan tidak dapat dihapus" });
        if (role._count.users) return res.status(400).json({ message: "Peran masih digunakan oleh pengguna" });
        await prisma.role.delete({ where: { id } });
        await recordActivity({ req, action: `Menghapus peran akses ${role.name}`, entity: "role" });
        return res.json({ message: "Peran berhasil dihapus" });
    } catch (error) { return res.status(500).json({ message: "Gagal menghapus peran", error: error.message }); }
}

module.exports = { getCatalog, getAll, create, update, remove };
