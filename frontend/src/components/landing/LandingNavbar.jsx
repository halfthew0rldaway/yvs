import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, MessageCircle, Shield, ArrowUpRight, Cpu, Menu, X } from "lucide-react";

export default function LandingNavbar({ onSearchClick }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-[#0c0d10]/95 backdrop-blur-md border-b border-zinc-800 py-3 shadow-lg"
                    : "bg-[#0c0d10] border-b border-zinc-900 py-4"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Brand Identity */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 font-mono font-black text-sm tracking-tight shadow-xs">
                        YVS
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-grotesk font-black text-base sm:text-lg tracking-tight text-white uppercase">
                                YVS Computer
                            </span>
                            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="hidden sm:inline-block font-mono text-3xs uppercase tracking-wider text-zinc-400">
                                Engineering Lab
                            </span>
                        </div>
                        <p className="text-3xs text-zinc-500 font-mono hidden sm:block">
                            Pusat Rekayasa, Diagnostik &amp; Reparasi Komputer
                        </p>
                    </div>
                </div>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
                    <button
                        type="button"
                        onClick={() => scrollToSection("service-workflow")}
                        className="hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                        01 // Alur 3D
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("service-spec")}
                        className="hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                        02 // Spesifikasi Layanan
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("engineering-standards")}
                        className="hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                        03 // Standar YVS
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("workshop-location")}
                        className="hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                        04 // Workshop &amp; Kontak
                    </button>
                </nav>

                {/* Action CTA Buttons */}
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={onSearchClick}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
                    >
                        <Search className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="hidden xs:inline">Lacak Tiket</span>
                    </button>

                    <a
                        href="https://wa.me/6281234567890?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-sm shadow-emerald-900/30"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Konsultasi WA</span>
                    </a>

                    {/* Mobile Menu Toggle */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 border border-zinc-800 cursor-pointer"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-[#0c0d10] border-b border-zinc-800 px-4 py-5 space-y-3 font-mono text-xs">
                    <button
                        type="button"
                        onClick={() => scrollToSection("service-workflow")}
                        className="block w-full text-left py-2 text-zinc-300 hover:text-white border-b border-zinc-900"
                    >
                        01 // Alur Pengerjaan 3D
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("service-spec")}
                        className="block w-full text-left py-2 text-zinc-300 hover:text-white border-b border-zinc-900"
                    >
                        02 // Spesifikasi Layanan
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("engineering-standards")}
                        className="block w-full text-left py-2 text-zinc-300 hover:text-white border-b border-zinc-900"
                    >
                        03 // Standar Rekayasa YVS
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("workshop-location")}
                        className="block w-full text-left py-2 text-zinc-300 hover:text-white border-b border-zinc-900"
                    >
                        04 // Workshop &amp; Kontak
                    </button>
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                if (onSearchClick) onSearchClick();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl font-bold"
                        >
                            <Search className="w-4 h-4" />
                            Lacak Servis Sekarang
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
