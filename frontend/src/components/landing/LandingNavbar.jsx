import { useState, useEffect } from "react";
import { Search, MessageCircle, Cpu, Menu, X } from "lucide-react";

export default function LandingNavbar({ onSearchClick }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm"
                    : "bg-white border-b border-slate-100 py-4"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Brand Identity */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                        <Cpu className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-900">
                                YVS Computer
                            </span>
                            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />
                            <span className="hidden sm:inline-block text-xs text-slate-400 font-sans">
                                Pusat Reparasi
                            </span>
                        </div>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-sans text-slate-600">
                    <button
                        type="button"
                        onClick={() => scrollToSection("service-workflow")}
                        className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Alur Kerja
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("service-spec")}
                        className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Layanan
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("engineering-standards")}
                        className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Standar
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("workshop-location")}
                        className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Lokasi
                    </button>
                </nav>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={onSearchClick}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-sans font-medium transition-all cursor-pointer shadow-xs"
                    >
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="hidden xs:inline">Lacak Tiket</span>
                    </button>

                    <a
                        href="https://wa.me/6281234567890?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-sans font-medium transition-all shadow-sm"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Konsultasi WA</span>
                    </a>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50 border border-slate-200 cursor-pointer"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1">
                    {[
                        { label: "Alur Kerja 3D", id: "service-workflow" },
                        { label: "Spesifikasi Layanan", id: "service-spec" },
                        { label: "Standar Rekayasa", id: "engineering-standards" },
                        { label: "Lokasi & Jam Kerja", id: "workshop-location" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollToSection(item.id)}
                            className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-sans"
                        >
                            {item.label}
                        </button>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                if (onSearchClick) onSearchClick();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-sans font-medium text-sm transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            Lacak Status Servis
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
