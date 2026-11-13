require("dotenv").config();
const prisma = require("../src/config/database");
const { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } = require("../src/config/permissions");

async function main() {
    const newPermissionCodes = new Set();
    for (const [code, module, action, label] of PERMISSIONS) {
        if (!await prisma.permission.findUnique({ where: { code } })) newPermissionCodes.add(code);
        await prisma.permission.upsert({ where: { code }, update: { module, action, label }, create: { code, module, action, label } });
    }
    const permissionRows = await prisma.permission.findMany({ select: { id: true, code: true } });
    const permissionId = new Map(permissionRows.map(item => [item.code, item.id]));

    for (const [slug, codes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        const existing = await prisma.role.findUnique({ where: { slug } });
        const role = existing || await prisma.role.create({
            data: { slug, name: slug === "teknisi" ? "Teknisi" : slug.charAt(0).toUpperCase() + slug.slice(1), is_system: true }
        });
        // Seed defaults only when a role is first created. Subsequent runs must
        // preserve the permissions chosen by Super Admin, including revocations.
        if (!existing) {
            await prisma.rolePermission.createMany({ data: codes.map(code => ({ role_id: role.id, permission_id: permissionId.get(code) })).filter(item => item.permission_id), skipDuplicates: true });
        } else {
            // A newly introduced capability may be added to existing defaults
            // once, without ever restoring a permission that was revoked later.
            const additions = codes.filter(code => newPermissionCodes.has(code) && permissionId.has(code));
            if (additions.length) await prisma.rolePermission.createMany({
                data: additions.map(code => ({ role_id: role.id, permission_id: permissionId.get(code) })),
                skipDuplicates: true
            });
        }
    }

    const roles = await prisma.role.findMany({ select: { id: true, slug: true } });
    const roleId = new Map(roles.map(item => [item.slug, item.id]));
    const users = await prisma.user.findMany({ select: { id: true, role: true, username: true, email: true } });
    for (const user of users) {
        const slug = roleId.has(user.role) ? user.role : "teknisi";
        const assignedRoles = await prisma.userRole.count({ where: { user_id: user.id } });
        if (!assignedRoles) await prisma.userRole.create({ data: { user_id: user.id, role_id: roleId.get(slug) } });
    }
    if (!await prisma.user.count({ where: { is_super_admin: true } })) {
        if (!process.env.SUPER_ADMIN_EMAIL) throw new Error("Set SUPER_ADMIN_EMAIL for the initial Super Admin bootstrap");
        const designated = await prisma.user.findUnique({ where: { email: process.env.SUPER_ADMIN_EMAIL } });
        if (!designated) throw new Error("SUPER_ADMIN_EMAIL does not match an existing user");
        await prisma.user.update({ where: { id: designated.id }, data: { is_super_admin: true } });
    }
    console.log("RBAC seed complete. Existing role permissions and Super Admin assignments were preserved.");
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
