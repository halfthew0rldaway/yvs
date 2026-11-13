// Module routes are implemented in code; role names are composed in the UI.
// When a module is added, register its landing page here alongside its route.
const landingRoutes = [
    ["dashboard.view", "/dashboard"],
    ["tickets.view", "/tiket-servis"],
    ["customers.view", "/customer"],
    ["devices.view", "/perangkat"],
    ["inventory.view", "/sparepart"],
    ["invoices.view", "/invoice"],
    ["suppliers.view", "/supplier"],
    ["loaners.view", "/loaner"],
    ["wiki.view", "/wiki"],
    ["crm.view", "/retensi"],
    ["attendance.self", "/attendance"],
    ["attendance.review", "/attendance"],
    ["attendance.adjust", "/attendance"],
    ["attendance.policy", "/attendance"],
    ["recruitment.view", "/recruitment"],
    ["audit.view", "/audit-log"],
    ["system.database", "/database"]
];

export function landingRouteFor(user) {
    if (user?.is_super_admin) return "/dashboard";
    return landingRoutes.find(([permission]) => user?.permissions?.includes(permission))?.[1] || "/profile";
}
