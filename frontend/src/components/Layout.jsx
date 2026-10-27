import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useRealtimeEvent from "../hooks/useRealtime";
import {
    LayoutDashboard,
    Users,
    UserCheck,
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
    Database
} from "lucide-react";
import SopModal from "./SopModal";
import api from "../services/api";
import CrmFloatingBubble from "./CrmFloatingBubble";
import MaintenanceRecallModal from "./MaintenanceRecallModal";
import NotificationBell from "./NotificationBell";

const adminMenu = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/customer", label: "Customer", icon: Users },
    { path: "/perangkat", label: "Perangkat", icon: MonitorSmartphone },
    { path: "/tiket-servis", label: "Tiket Servis", icon: Ticket },
    { path: "/loaner", label: "Unit Pinjaman", icon: Laptop },
    { path: "/retensi", label: "Retensi & CRM", icon: HeartHandshake },
    { path: "/sparepart", label: "Sparepart", icon: Wrench },
    { path: "/rma", label: "Klaim RMA Supplier", icon: RotateCcw },
    { path: "/invoice", label: "Invoice", icon: FileText },
    { path: "/wiki", label: "Pustaka Wiki", icon: BookOpen },
    { path: "/users", label: "User & Performa", icon: UserCheck },
    { path: "/database", label: "Cadangan Database", icon: Database },
];

const teknisiMenu = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/tiket-servis", label: "Tiket Servis", icon: Ticket },
    { path: "/loaner", label: "Unit Pinjaman", icon: Laptop },
    { path: "/sparepart", label: "Sparepart", icon: Wrench },
    { path: "/rma", label: "Klaim RMA Supplier", icon: RotateCcw },
    { path: "/wiki", label: "Pustaka Wiki", icon: BookOpen },
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

    const menu = isAdmin ? adminMenu : teknisiMenu;

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
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Serv.io</h1>
                            <p className="text-[10px] text-slate-400 font-medium">Workshop Platform</p>
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

                {/* Sidebar Nav */}
                <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-1 custom-scrollbar">
                    <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</p>
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                    isActive
                                        ? "bg-blue-50 text-blue-600 font-semibold border border-blue-100 shadow-2xs"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                                <span>{item.label}</span>
                            </Link>
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
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
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
                                <p className="text-[11px] text-slate-500 capitalize truncate">{user?.role}</p>
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
                <header className="grid grid-cols-[1fr_auto_1fr] items-center h-16 px-4 sm:px-6 bg-white border-b border-slate-200 shrink-0 print:hidden z-10 gap-2 sm:gap-4">
                    {/* Left: Sidebar Toggle & Page Title */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button 
                            type="button"
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shrink-0"
                            onClick={() => setIsSidebarOpen(prev => !prev)}
                            title={isSidebarOpen ? "Tutup Sidebar Menu" : "Buka Sidebar Menu"}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 min-w-0 overflow-hidden">
                            <span className="text-slate-500 uppercase tracking-wider text-[11px] shrink-0">Workshop</span>
                            <span className="text-slate-300 shrink-0">/</span>
                            <span className="text-slate-800 text-xs sm:text-sm font-bold tracking-tight truncate">
                                {location.pathname.startsWith("/dashboard") && "Dashboard"}
                                {location.pathname.startsWith("/customer") && "Data Pelanggan"}
                                {location.pathname.startsWith("/perangkat") && "Data Perangkat"}
                                {location.pathname.startsWith("/tiket-servis") && "Tiket Servis"}
                                {location.pathname.startsWith("/retensi") && "Retensi & CRM Pelanggan"}
                                {location.pathname.startsWith("/sparepart") && "Katalog Sparepart"}
                                {location.pathname.startsWith("/invoice") && "Faktur & Pembayaran"}
                                {location.pathname.startsWith("/users") && "User & Performa"}
                                {location.pathname.startsWith("/profile") && "Profil Akun"}
                                {!["/dashboard", "/customer", "/perangkat", "/tiket-servis", "/retensi", "/sparepart", "/invoice", "/users", "/profile"].some(p => location.pathname.startsWith(p)) && "Serv.io"}
                            </span>
                        </div>
                    </div>

                    {/* Center: Live Clock & Date */}
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5 select-none shrink-0 px-1 sm:px-2">
                        <span className="font-mono tabular-nums text-sm sm:text-base lg:text-lg font-semibold text-slate-800 tracking-tight">
                            {hours}<span className="text-slate-300">:</span>{minutes}<span className="text-slate-300">:</span>{seconds}
                        </span>
                        <span className="hidden xl:block w-px h-4 bg-slate-200"></span>
                        <span className="hidden xl:inline text-xs text-slate-500 font-medium whitespace-nowrap">
                            {dayName}, {dateFormatted}
                        </span>
                    </div>

                    {/* Right: Quick Action Button & Notification Bell */}
                    <div className="flex items-center justify-end gap-2 min-w-0">
                        <NotificationBell />
                        {isAdmin && (
                            <Link
                                to="/tiket-servis/tambah"
                                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0 whitespace-nowrap"
                                title="Buat Tiket Servis Baru"
                            >
                                <Plus className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden sm:inline">Tiket Baru</span>
                            </Link>
                        )}
                    </div>
                </header>

                {/* Page Content Scroll Container */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 print:p-0 print:overflow-visible custom-scrollbar">
                    <div className="w-full space-y-6 print:space-y-0">
                        {children}
                    </div>
                </div>
            </main>

            {/* In-App SOP Pocket Book Modal */}
            <SopModal isOpen={isSopModalOpen} onClose={() => setIsSopModalOpen(false)} />

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
