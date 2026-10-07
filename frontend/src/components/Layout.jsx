import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
    LayoutDashboard,
    Users,
    MonitorSmartphone,
    Ticket,
    Wrench,
    FileText,
    MapPin,
    LogOut,
    Menu,
    X,
    Settings,
    User as UserIcon
} from "lucide-react";

const adminMenu = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/customer", label: "Customer", icon: Users },
    { path: "/perangkat", label: "Perangkat", icon: MonitorSmartphone },
    { path: "/tiket-servis", label: "Tiket Servis", icon: Ticket },
    { path: "/sparepart", label: "Sparepart", icon: Wrench },
    { path: "/invoice", label: "Invoice", icon: FileText },
];

const teknisiMenu = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/tiket-servis", label: "Tiket Servis", icon: Ticket },
    { path: "/sparepart", label: "Sparepart", icon: Wrench },
];

export default function Layout({ children }) {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const menu = isAdmin ? adminMenu : teknisiMenu;

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <div className="flex h-screen print:h-auto bg-slate-50 overflow-hidden print:overflow-visible font-sans">
            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out print:hidden ${
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}
            >
                <div className="flex items-center justify-between p-6 h-20 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl">
                            <Settings className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Serv.io</h1>
                        </div>
                    </div>
                    <button 
                        className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu Utama</p>
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? "bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                {user?.nama?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-sm truncate">{user?.nama}</p>
                                <p className="text-xs text-slate-500 capitalize truncate">{user?.role}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                to="/profile"
                                className="flex items-center justify-center gap-2 w-full py-2 px-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium transition-colors shadow-sm"
                            >
                                <UserIcon className="w-4 h-4" />
                                <span>Profil</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full py-2 px-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-sm font-medium transition-colors shadow-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Keluar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 print:bg-white print:overflow-visible">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 shrink-0 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 border border-blue-100 p-1.5 rounded-lg">
                            <Settings className="w-5 h-5 text-blue-600" />
                        </div>
                        <h1 className="text-lg font-bold text-slate-900">Serv.io</h1>
                    </div>
                    <button 
                        className="p-2 -mr-2 text-slate-600 hover:text-slate-900"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible">
                    <div className="w-full space-y-6 print:space-y-0">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
