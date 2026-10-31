import { useState, useEffect } from "react";
import { Search, MessageCircle, Cpu, Menu, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
            className={`sticky top-0 z-50 transition-all duration-300 font-sans ${
                scrolled
                    ? "bg-white/95 backdrop-blur-md border-b border-slate-200 py-2.5 sm:py-3 shadow-xs"
                    : "bg-white border-b border-slate-100 py-3 sm:py-4"
            }`}
        >
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-between">
                {/* Brand Identity */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs shrink-0">
                        <Cpu className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-display font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-tight">
                                YVS Computer
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-3xs font-mono font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Buka 09:00–18:00
                            </span>
                        </div>
                        <span className="text-3xs font-mono text-slate-400 tracking-wider uppercase">
                            Yangversa · komputerawet.com
                        </span>
                    </div>
                </div>

                {/* Desktop Navigation - Professional & Balanced */}
                <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs sm:text-sm font-sans font-medium text-slate-600">
                    <button
                        type="button"
                        onClick={() => scrollToSection("service-workflow")}
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        Proses Perbaikan
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("service-spec")}
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        Layanan Kami
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("engineering-standards")}
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        Standar Pemeriksaan
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("workshop-reviews")}
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        Ulasan Pelanggan (4.7★)
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("workshop-location")}
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        Lokasi & Kontak
                    </button>
                </nav>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <button
                        type="button"
                        onClick={onSearchClick}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                    >
                        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                        <span>Lacak Tiket</span>
                    </button>

                    <a
                        href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20laptop/PC%20saya"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                    >
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200 cursor-pointer"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="md:hidden overflow-hidden bg-white/98 backdrop-blur-lg border-b border-slate-200 px-4 py-4 space-y-1 shadow-md"
                    >
                        {[
                            { label: "Proses Perbaikan", id: "service-workflow" },
                            { label: "Layanan Kami", id: "service-spec" },
                            { label: "Standar Pemeriksaan", id: "engineering-standards" },
                            { label: "Ulasan Pelanggan (4.7★)", id: "workshop-reviews" },
                            { label: "Lokasi & Jadwal Layanan", id: "workshop-location" },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => scrollToSection(item.id)}
                                className="block w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}

                        <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-500 font-mono">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Buka Setiap Hari: 09:00 – 18:00 WIB</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    if (onSearchClick) onSearchClick();
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-sm transition-colors shadow-xs cursor-pointer"
                            >
                                <Search className="w-4 h-4" />
                                Lacak Status Servis Sekarang
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
