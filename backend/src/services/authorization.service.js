const prisma = require("../config/database");
const { expandPermissions } = require("../config/permissions");

async function getAuthorization(userId) {
    const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        select: {
            id: true,
            role: true,
            is_super_admin: true,
            auth_version: true,
            user_roles: {
                select: {
                    role: {
                        select: {
                            id: true, name: true, slug: true,
                            permissions: { select: { permission: { select: { code: true } } } }
                        }
                    }
                }
            }
        }
    });
    if (!user) return null;
    const roles = user.user_roles.map(({ role }) => ({ id: role.id, name: role.name, slug: role.slug }));
    const permissions = expandPermissions(user.user_roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code)));
    return { ...user, roles, permissions };
}

function hasPermission(auth, permissions, requireAll = false) {
    if (!auth) return false;
    if (auth.is_super_admin) return true;
    const required = Array.isArray(permissions) ? permissions : [permissions];
    const granted = expandPermissions(Array.isArray(auth.permissions) ? auth.permissions : []);
    if (!required.length || required.some(permission => typeof permission !== "string" || !permission)) return false;
    return requireAll
        ? required.every(permission => granted.includes(permission))
        : required.some(permission => granted.includes(permission));
}

module.exports = { getAuthorization, hasPermission };
