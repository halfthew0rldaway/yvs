/**
 * Code-owned permission catalogue. Super Admins compose roles from these
 * capabilities; they cannot create typo-prone permission strings in the UI.
 */
const PERMISSIONS = [
    ["dashboard.view", "dashboard", "view", "Melihat dashboard"],
    ["dashboard.report", "dashboard", "report", "Melihat dashboard bisnis dan laporan"],
    ["customers.view", "customers", "view", "Melihat pelanggan"],
    ["customers.manage", "customers", "manage", "Mengelola pelanggan"],
    ["devices.view", "devices", "view", "Melihat perangkat"],
    ["devices.manage", "devices", "manage", "Mengelola perangkat"],
    ["tickets.view", "tickets", "view", "Melihat tiket servis"],
    ["tickets.view_all", "tickets", "view_all", "Melihat semua tiket servis"],
    ["tickets.intake", "tickets", "intake", "Membuat dan mengubah intake tiket"],
    ["tickets.assign", "tickets", "assign", "Menetapkan teknisi"],
    ["tickets.claim", "tickets", "claim", "Mengambil tiket yang belum ditugaskan"],
    ["tickets.diagnosis", "tickets", "diagnosis", "Melakukan diagnosis tiket"],
    ["tickets.repair", "tickets", "repair", "Mencatat pengerjaan servis"],
    ["tickets.qc", "tickets", "qc", "Menyelesaikan QC tiket"],
    ["tickets.approval", "tickets", "approval", "Mengelola persetujuan pelanggan"],
    ["tickets.handover", "tickets", "handover", "Menyerahkan perangkat"],
    ["tickets.cancel", "tickets", "cancel", "Membatalkan atau memulihkan tiket"],
    ["inventory.view", "inventory", "view", "Melihat inventaris"],
    ["inventory.manage", "inventory", "manage", "Mengelola inventaris dan restock"],
    ["inventory.use", "inventory", "use", "Menggunakan sparepart pada tiket"],
    ["invoices.view", "invoices", "view", "Melihat invoice"],
    ["invoices.manage", "invoices", "manage", "Membuat dan mengubah invoice"],
    ["invoices.report", "invoices", "report", "Melihat laporan invoice"],
    ["suppliers.view", "suppliers", "view", "Melihat supplier dan RMA"],
    ["suppliers.manage", "suppliers", "manage", "Mengelola supplier dan RMA"],
    ["loaners.view", "loaners", "view", "Melihat perangkat pinjaman"],
    ["loaners.manage", "loaners", "manage", "Mengelola perangkat pinjaman"],
    ["wiki.view", "wiki", "view", "Melihat knowledge base"],
    ["wiki.manage", "wiki", "manage", "Mengelola knowledge base"],
    ["attendance.self", "attendance", "self", "Melakukan presensi pribadi"],
    ["attendance.exempt", "attendance", "exempt", "Dikecualikan dari kewajiban presensi"],
    ["attendance.review", "attendance", "review", "Melihat dan meninjau presensi"],
    ["attendance.adjust", "attendance", "adjust", "Mengoreksi presensi"],
    ["attendance.policy", "attendance", "policy", "Mengubah kebijakan presensi"],
    ["recruitment.view", "recruitment", "view", "Melihat rekrutmen"],
    ["recruitment.manage", "recruitment", "manage", "Mengelola rekrutmen"],
    ["audit.view", "audit", "view", "Melihat audit log"],
    ["crm.view", "crm", "view", "Melihat CRM dan retensi"],
    ["users.view", "users", "view", "Melihat pengguna"],
    ["users.manage", "users", "manage", "Mengelola pengguna"],
    ["roles.manage", "roles", "manage", "Mengelola peran dan hak akses"],
    ["system.database", "system", "database", "Melihat statistik dan mengekspor database"],
    ["system.database_maintain", "system", "database_maintain", "Menormalisasi data dan membersihkan log lama"],
    ["system.settings", "system", "settings", "Mengubah pengaturan sistem"],
];

const DEFAULT_ROLE_PERMISSIONS = {
    admin: PERMISSIONS.map(([code]) => code).filter(code => !["roles.manage", "attendance.exempt"].includes(code)),
    pimpinan: ["dashboard.view", "dashboard.report", "tickets.view", "tickets.view_all", "invoices.view", "invoices.report", "suppliers.view", "loaners.view", "wiki.view", "attendance.self", "attendance.exempt", "attendance.review", "recruitment.view", "audit.view", "crm.view", "users.view"],
    frontman: ["dashboard.view", "customers.view", "customers.manage", "devices.view", "devices.manage", "tickets.view", "tickets.view_all", "tickets.intake", "tickets.approval", "tickets.handover", "invoices.view", "invoices.manage", "loaners.view", "loaners.manage", "attendance.self"],
    teknisi: ["dashboard.view", "customers.view", "devices.view", "tickets.view", "tickets.claim", "tickets.diagnosis", "tickets.repair", "tickets.qc", "inventory.view", "inventory.use", "invoices.view", "suppliers.view", "wiki.view", "wiki.manage", "attendance.self", "loaners.view"],
};

const VIEW_IMPLICATIONS = {
    dashboard: "dashboard.view",
    customers: "customers.view", devices: "devices.view", tickets: "tickets.view",
    inventory: "inventory.view", invoices: "invoices.view", suppliers: "suppliers.view",
    loaners: "loaners.view", wiki: "wiki.view", recruitment: "recruitment.view"
};
// Forms need read access to their linked records. These are derived grants,
// removed as soon as the corresponding action permission is revoked.
const FORM_DEPENDENCIES = {
    "devices.manage": ["customers.view"],
    "tickets.intake": ["customers.view", "devices.view"],
    "invoices.manage": ["tickets.view"],
    "suppliers.manage": ["inventory.view", "tickets.view"],
    "loaners.manage": ["tickets.view"],
    "system.database_maintain": ["system.database"]
};

function expandPermissions(codes = []) {
    const expanded = new Set(codes);
    for (const code of codes) {
        const module = typeof code === "string" ? code.split(".")[0] : "";
        if (VIEW_IMPLICATIONS[module]) expanded.add(VIEW_IMPLICATIONS[module]);
        for (const dependency of FORM_DEPENDENCIES[code] || []) expanded.add(dependency);
    }
    return [...expanded];
}

module.exports = { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, expandPermissions };
