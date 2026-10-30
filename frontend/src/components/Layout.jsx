import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useRealtimeEvent from "../hooks/useRealtime";
import { useDevice } from "../hooks/useDevice";
import {
    LayoutDashboard,
    Users,
    UserCheck,
    UserPlus,
    MonitorSmartphone,
    Ticket,
    Wrench,
    FileText,
    LogOut,
    Menu,
    X,
    Settings,
    User as UserIcon,
    BookOpen,
    Plus,
    HeartHandshake,
    Laptop,
    RotateCcw,
    Database,
    Building2,
    ChevronDown,
    ChevronRight,
    QrCode,
    ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import SopModal from "./SopModal";
import api from "../services/api";
import CrmFloatingBubble from "./CrmFloatingBubble";
import MaintenanceRecallModal from "./MaintenanceRecallModal";
import NotificationBell from "./NotificationBell";
import CameraScannerModal from "./CameraScannerModal";

// Menu Groups untuk Admin (Struktur Navigasi Collapsible Terorganisir)
const adminNavGroups = [
    {
        id: "overview",
        label: "Ringkasan",
        items: [
            { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
        ]
    },
    {
        id: "operasional",
        label: "Operasional Servis",
        icon: Ticket,
        items: [
            { path: "/tiket-servis", label: "Tiket Servis", icon: Ticket },
            { path: "/perangkat", label: "Perangkat Pelanggan", icon: MonitorSmartphone },
            { path: "/customer", label: "Data Pelanggan", icon: Users },
            { path: "/loaner", label: "Unit Pinjaman (Loaner)", icon: Laptop },
        ]
    },
    {
        id: "logistik",
        label: "Suku Cadang & Logistik",
        icon: Wrench,
        items: [
            { path: "/sparepart", label: "Katalog Sparepart", icon: Wrench },
            { path: "/rma", label: "Klaim RMA Supplier", icon: RotateCcw },
            { path: "/supplier", label: "Direktori Supplier", icon: Building2 },
        ]
    },
    {
        id: "transaksi",
        label: "Kasir & CRM",
        icon: FileText,
        items: [
            { path: "/invoice", label: "Invoice & Kasir", icon: FileText },
            { path: "/retensi", label: "Retensi & CRM Pelanggan", icon: HeartHandshake },
        ]
    },
    {
        id: "knowledge",
        label: "Knowledge & SDM",
        icon: BookOpen,
        items: [
            { path: "/wiki", label: "Pusat SOP & Wiki Teknis", icon: BookOpen },
            { path: "/recruitment", label: "Rekrutmen Tim (HR)", icon: UserPlus },
        ]
    },
    {
        id: "sistem",
        label: "Pengaturan & Sistem",
        icon: Settings,
        items: [
            { path: "/users", label: "User & Performa Tim", icon: UserCheck },
            { path: "/database", label: "Cadangan Database", icon: Database },
            { path: "/audit-log", label: "Log Audit Aktivitas", icon: ShieldAlert },
        ]
    }
];

// Menu Groups untuk Teknisi
const teknisiNavGroups = [
    {
        id: "overview",
        label: "Ringkasan",
        items: [
            { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
        ]
    },
    {
        id: "operasional",
        label: "Operasional Servis",
        icon: Ticket,
        items: [
            { path: "/tiket-servis", label: "Tiket Servis", icon: Ticket },
            { path: "/loaner", label: "Unit Pinjaman (Loaner)", icon: Laptop },
        ]
    },
    {
        id: "logistik",
        label: "Suku Cadang & Logistik",
        icon: Wrench,
        items: [
            { path: "/sparepart", label: "Katalog Sparepart", icon: Wrench },
            { path: "/rma", label: "Klaim RMA Supplier", icon: RotateCcw },
            { path: "/supplier", label: "Direktori Supplier", icon: Building2 },
        ]
    },
    {
        id: "knowledge",
        label: "Knowledge & SOP",
        icon: BookOpen,
        items: [
            { path: "/wiki", label: "Pusat SOP & Wiki Teknis", icon: BookOpen },
        ]
    }
];

export default function Layout({ children }) {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Responsive sidebar state: open by default on desktop (>=1024px), closed on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [isSopModalOpen, setIsSopModalOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [maintenanceDueData, setMaintenanceDueData] = useState({ items: [], total_due: 0, urgent_count: 0 });
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    function handleGlobalScan(decodedText) {
        setIsScannerOpen(false);
        const code = decodedText.trim();
        toast.success(`Berhasil memindai: ${code}`);

        // Extract clean code if scanned text was a direct tracking or ticket URL
        let cleanCode = code;
        if (cleanCode.includes("/tracking/")) {
            cleanCode = cleanCode.split("/tracking/")[1].split("?")[0].split("/")[0];
        } else if (cleanCode.includes("/tiket-servis/")) {
            cleanCode = cleanCode.split("/tiket-servis/")[1].split("?")[0].split("/")[0];
        }

        // Smart route heuristics
        if (location.pathname.startsWith("/sparepart") || cleanCode.startsWith("PRT-") || cleanCode.startsWith("SP-") || cleanCode.startsWith("SKU-")) {
            navigate(`/sparepart?search=${encodeURIComponent(cleanCode)}`);
        } else {
            navigate(`/tiket-servis?search=${encodeURIComponent(cleanCode)}`);
        }
    }

    // Periodic maintenance recall fetch across the app (Hanya untuk Admin / Front Office)
    const fetchMaintenance = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get("/tiket-servis/maintenance/due");
            if (res.data) {
                setMaintenanceDueData(res.data);
            }
        } catch (_) {}
    }, [isAdmin]);

    useEffect(() => {
        fetchMaintenance();
        // Slow fallback (180s)
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchMaintenance();
            }
        }, 180000);

        return () => clearInterval(interval);
    }, [fetchMaintenance]);

    // Real-Time SSE: Segera perbarui status perawatan jika tiket diperbarui
    useRealtimeEvent(["tiket:updated", "tiket:created"], () => {
        fetchMaintenance();
    });

    // Live ticking timer every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const dayName = currentTime.toLocaleDateString("id-ID", { weekday: "long" });
    const dateFormatted = currentTime.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const hours = String(currentTime.getHours()).padStart(2, "0");
    const minutes = String(currentTime.getMinutes()).padStart(2, "0");
    const seconds = String(currentTime.getSeconds()).padStart(2, "0");
    
    // Close mobile menu on route change, but retain desktop state
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    // Handle resize adjustments
    useEffect(() => {
        function handleResize() {
            if (window.innerWidth < 1024 && isSidebarOpen) {
                // If transitioning to small screen, close overlay drawer
                setIsSidebarOpen(false);
            }
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isSidebarOpen]);

    const navGroups = isAdmin ? adminNavGroups : teknisiNavGroups;

    // Collapsible Groups state: open by default for core daily groups
    const [openGroups, setOpenGroups] = useState({
        operasional: true,
        logistik: true,
        transaksi: true,
        knowledge: false,
        sistem: false
    });

    const toggleGroup = (groupId) => {
        setOpenGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Auto-expand group if current route is within it
    useEffect(() => {
        navGroups.forEach(group => {
            if (group.id !== "overview" && group.items) {
                const hasActive = group.items.some(item => location.pathname.startsWith(item.path));
                if (hasActive) {
                    setOpenGroups(prev => ({ ...prev, [group.id]: true }));
                }
            }
        });
    }, [location.pathname, navGroups]);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <div className="flex h-screen print:h-auto bg-slate-50 overflow-hidden print:overflow-visible font-sans">
            {/* Mobile / Tablet backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Fully Toggleable on Desktop & Mobile) */}
            <aside 
                className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out print:hidden ${
                    isSidebarOpen 
                        ? "w-72 translate-x-0 shadow-lg lg:shadow-none" 
                        : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden"
                }`}
            >
                {/* Sidebar Brand Header */}
                <div className="flex items-center justify-between p-5 h-16 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl">
                            <Settings className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900 tracking-tight leading-tight font-display">Serv.io</div>
                            <p className="text-2xs text-slate-400 font-medium tracking-wide">Workshop Platform</p>
                        </div>
                    </div>
                    {/* Toggle button to close sidebar */}
                    <button 
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                        title="Tutup Menu Sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sidebar Nav (Collapsible Navigation Grouping) */}
                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
                    {navGroups.map((group) => {
                        // Overview standalone items (e.g. Dashboard)
                        if (group.id === "overview") {
                            return group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all mb-2 ${
                                            isActive
                                                ? "bg-blue-600 text-white shadow-xs"
                                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            });
                        }

                        // Collapsible Group
                        const GroupIcon = group.icon;
                        const isOpen = openGroups[group.id] !== false;
                        const hasActiveChild = group.items.some(item => location.pathname.startsWith(item.path));

                        return (
                            <div key={group.id} className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.id)}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wider transition-colors cursor-pointer group ${
                                        hasActiveChild 
                                            ? "text-blue-600 hover:bg-blue-50/60" 
                                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/60"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <GroupIcon className={`w-3.5 h-3.5 ${hasActiveChild ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                        <span>{group.label}</span>
                                    </div>
                                    <div className="text-slate-400 group-hover:text-slate-600 transition-transform">
                                        {isOpen ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        )}
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="space-y-0.5 mt-1 pl-2.5 ml-2 border-l border-slate-200/90 accordion-surface">
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = location.pathname.startsWith(item.path);
                                            return (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                        isActive
                                                            ? "bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs"
                                                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                                                    }`}
                                                >
                                                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                                                    <span className="truncate">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Quick SOP / Guidance pocket book */}
                <div className="px-4 py-2 border-t border-slate-100 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsSopModalOpen(true)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 transition-colors shadow-2xs group"
                    >
                        <div className="flex items-center gap-2.5">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-800">Panduan Standar Layanan</span>
                        </div>
                        <span className="text-3xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                            WOW
                        </span>
                    </button>
                </div>

                {/* User Info & Profile card */}
                <div className="p-4 border-t border-slate-100 shrink-0">
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                {user?.nama?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate">{user?.nama}</p>
                                <p className="text-2xs text-slate-500 capitalize truncate">{user?.role}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                to="/profile"
                                className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span>Profil</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-500" />
                                <span>Keluar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 print:bg-white print:overflow-visible">
                {/* Global Top Navbar */}
                <header className="flex items-center justify-between h-16 px-3.5 sm:px-6 bg-white border-b border-slate-200 shrink-0 print:hidden z-10 gap-2 sm:gap-4">
                    {/* Left: Sidebar Toggle & Page Title */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
                        <button 
                            type="button"
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shrink-0 cursor-pointer"
                            onClick={() => setIsSidebarOpen(prev => !prev)}
                            title={isSidebarOpen ? "Tutup Sidebar Menu" : "Buka Sidebar Menu"}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Mobile Title View */}
                        <div className="flex md:hidden items-center gap-1.5 min-w-0">
                            <span className="text-sm font-bold text-slate-900 tracking-tight truncate">
                                {location.pathname.startsWith("/dashboard") && "Dashboard"}
                                {location.pathname.startsWith("/customer") && "Pelanggan"}
                                {location.pathname.startsWith("/perangkat") && "Perangkat"}
                                {location.pathname === "/tiket-servis/tambah" && "Tiket Baru"}
                                {location.pathname.startsWith("/tiket-servis") && location.pathname !== "/tiket-servis/tambah" && "Tiket Servis"}
                                {location.pathname.startsWith("/loaner") && "Unit Pinjaman"}
                                {location.pathname.startsWith("/retensi") && "Retensi CRM"}
                                {location.pathname.startsWith("/sparepart") && "Sparepart"}
                                {location.pathname.startsWith("/rma") && "Klaim RMA"}
                                {location.pathname.startsWith("/supplier") && "Supplier"}
                                {location.pathname.startsWith("/invoice") && "Invoice"}
                                {location.pathname.startsWith("/wiki") && "SOP & Wiki"}
                                {location.pathname.startsWith("/recruitment") && "Rekrutmen"}
                                {location.pathname.startsWith("/users") && "User"}
                                {location.pathname.startsWith("/database") && "Database"}
                                {location.pathname.startsWith("/audit-log") && "Audit Log"}
                                {location.pathname.startsWith("/profile") && "Profil"}
                                {!["/dashboard", "/customer", "/perangkat", "/tiket-servis", "/loaner", "/retensi", "/sparepart", "/rma", "/supplier", "/invoice", "/wiki", "/recruitment", "/users", "/database", "/audit-log", "/profile"].some(p => location.pathname.startsWith(p)) && "Serv.io"}
                            </span>
                        </div>

                        {/* Desktop Breadcrumbs */}
                        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 min-w-0 overflow-hidden">
                            <span className="text-slate-500 uppercase tracking-wider text-2xs font-bold shrink-0">Workshop</span>
                            <span className="text-slate-300 shrink-0">/</span>
                            <span className="text-slate-800 text-xs sm:text-sm font-bold tracking-tight truncate">
                                {location.pathname.startsWith("/dashboard") && "Dashboard"}
                                {location.pathname.startsWith("/customer") && "Data Pelanggan"}
                                {location.pathname.startsWith("/perangkat") && "Data Perangkat"}
                                {location.pathname.startsWith("/tiket-servis") && "Tiket Servis"}
                                {location.pathname.startsWith("/loaner") && "Unit Pinjaman"}
                                {location.pathname.startsWith("/retensi") && "Retensi & CRM Pelanggan"}
                                {location.pathname.startsWith("/sparepart") && "Katalog Sparepart"}
                                {location.pathname.startsWith("/rma") && "Klaim RMA Supplier"}
                                {location.pathname.startsWith("/supplier") && "Direktori Supplier"}
                                {location.pathname.startsWith("/invoice") && "Faktur & Pembayaran"}
                                {location.pathname.startsWith("/wiki") && "Pusat SOP & Knowledge Base"}
                                {location.pathname.startsWith("/recruitment") && "Pusat Rekrutmen Tim"}
                                {location.pathname.startsWith("/users") && "User & Performa"}
                                {location.pathname.startsWith("/database") && "Cadangan Database"}
                                {location.pathname.startsWith("/audit-log") && "Log Audit Aktivitas (Anti-Fraud)"}
                                {location.pathname.startsWith("/profile") && "Profil Akun"}
                                {!["/dashboard", "/customer", "/perangkat", "/tiket-servis", "/loaner", "/retensi", "/sparepart", "/rma", "/supplier", "/invoice", "/wiki", "/recruitment", "/users", "/database", "/audit-log", "/profile"].some(p => location.pathname.startsWith(p)) && "Serv.io"}
                            </span>
                        </div>
                    </div>

                    {/* Center: Live Clock (Optimized for Mobile) */}
                    <div className="flex items-center justify-center gap-2 select-none shrink-0 px-1">
                        <span className="font-mono tabular-nums text-xs sm:text-base lg:text-lg font-semibold text-slate-800 tracking-tight">
                            {hours}<span className="text-slate-300">:</span>{minutes}<span className="hidden sm:inline"><span className="text-slate-300">:</span>{seconds}</span>
                        </span>
                        <span className="hidden xl:block w-px h-4 bg-slate-200"></span>
                        <span className="hidden xl:inline text-xs text-slate-500 font-medium whitespace-nowrap">
                            {dayName}, {dateFormatted}
                        </span>
                    </div>

                    {/* Right: Quick Action Button & Notification Bell */}
                    <div className="flex items-center justify-end gap-2 shrink-0">
                        {/* Quick Camera QR / Barcode Scanner */}
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
                            title="Pindai QR Tiket atau Barcode Sparepart dengan Kamera"
                        >
                            <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="hidden sm:inline">Scan QR</span>
                        </button>

                        <NotificationBell />
                        {isAdmin && (
                            <Link
                                to="/tiket-servis/tambah"
                                className="hidden sm:inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0 whitespace-nowrap"
                                title="Buat Tiket Servis Baru"
                            >
                                <Plus className="w-3.5 h-3.5 shrink-0" />
                                <span>Tiket Baru</span>
                            </Link>
                        )}
                    </div>
                </header>

                {/* Page Content Scroll Container (Added pb-24 for mobile bottom navigation clearance) */}
                <div className="flex-1 overflow-auto p-3.5 sm:p-6 pb-24 lg:pb-6 print:p-0 print:overflow-visible custom-scrollbar">
                    <div className="w-full space-y-6 print:space-y-0">
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar (Screens < 1024px) */}
            <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-30 lg:hidden safe-bottom-nav shadow-[0_-4px_20px_rgba(0,0,0,0.04)] print:hidden">
                <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
                    {/* Home / Dashboard */}
                    <Link
                        to="/dashboard"
                        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                            location.pathname === "/dashboard" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
                        }`}
                    >
                        <LayoutDashboard className="w-5 h-5 mb-0.5" />
                        <span className="text-3xs tracking-tight">Home</span>
                    </Link>

                    {/* Tiket Servis */}
                    <Link
                        to="/tiket-servis"
                        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                            location.pathname.startsWith("/tiket-servis") && location.pathname !== "/tiket-servis/tambah"
                                ? "text-blue-600 font-bold"
                                : "text-slate-500 hover:text-slate-900 font-medium"
                        }`}
                    >
                        <Ticket className="w-5 h-5 mb-0.5" />
                        <span className="text-3xs tracking-tight">Tiket</span>
                    </Link>

                    {/* Center Action: + Tiket Baru (Admin) or Sparepart (Teknisi) */}
                    {isAdmin ? (
                        <Link
                            to="/tiket-servis/tambah"
                            className="flex flex-col items-center justify-center -mt-5 group"
                            title="Buat Tiket Baru"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-500/35 border-3 border-white transition-all">
                                <Plus className="w-6 h-6 stroke-[2.5]" />
                            </div>
                            <span className="text-3xs font-bold text-blue-600 mt-0.5">Baru</span>
                        </Link>
                    ) : (
                        <Link
                            to="/sparepart"
                            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                                location.pathname.startsWith("/sparepart") ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
                            }`}
                        >
                            <Wrench className="w-5 h-5 mb-0.5" />
                            <span className="text-3xs tracking-tight">Sparepart</span>
                        </Link>
                    )}

                    {/* Invoice / Kasir */}
                    <Link
                        to="/invoice"
                        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                            location.pathname.startsWith("/invoice") ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
                        }`}
                    >
                        <FileText className="w-5 h-5 mb-0.5" />
                        <span className="text-3xs tracking-tight">Invoice</span>
                    </Link>

                    {/* Menu Drawer Toggle */}
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(true)}
                        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
                            isSidebarOpen ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
                        }`}
                    >
                        <Menu className="w-5 h-5 mb-0.5" />
                        <span className="text-3xs tracking-tight">Menu</span>
                    </button>
                </div>
            </nav>

            {/* In-App SOP Pocket Book Modal */}
            <SopModal isOpen={isSopModalOpen} onClose={() => setIsSopModalOpen(false)} />

            {/* In-Browser Camera QR & Barcode Scanner Modal */}
            <CameraScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleGlobalScan}
                title="Pindai Kamera Langsung"
                subtitle="Arahkan kamera ke QR tiket servis atau barcode fisik suku cadang"
            />

            {/* Maintenance Recall Modal & Floating CRM Bot (Khusus Admin / Front Office) */}
            {isAdmin && (
                <>
                    <MaintenanceRecallModal
                        isOpen={isMaintenanceModalOpen}
                        onClose={() => setIsMaintenanceModalOpen(false)}
                    />
                    <CrmFloatingBubble 
                        maintenanceDueData={maintenanceDueData}
                        onOpenRecallModal={() => setIsMaintenanceModalOpen(true)}
                    />
                </>
            )}
        </div>
    );
}
