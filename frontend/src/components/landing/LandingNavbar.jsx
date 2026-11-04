import { useState, useEffect } from "react";
import { Search, MessageCircle, Cpu, Menu, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingNavbar({ onSearchClick }) {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkVisibility = () => {
            const workflowEl = document.getElementById("service-workflow");
            if (!workflowEl) {
                setVisible(true);
                setScrolled(window.scrollY > 20);
                return;
            }
            const rect = workflowEl.getBoundingClientRect();
            // The 3D scene is active while workflowEl is pinned in view.
            // As soon as the bottom of the 3D track reaches the viewport bottom (it unpins),
            // the user enters the subsequent content (BrandTicker, #track-lookup, etc.).
            const isPast3D = rect.bottom <= window.innerHeight + 60;
            setVisible(isPast3D);
            setScrolled(window.scrollY > 20);

            if (!isPast3D && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener("scroll", checkVisibility, { passive: true });
        window.addEventListener("resize", checkVisibility, { passive: true });
        checkVisibility();

        const timer = setTimeout(checkVisibility, 60);

        return () => {
            window.removeEventListener("scroll", checkVisibility);
            window.removeEventListener("resize", checkVisibility);
            clearTimeout(timer);
        };
    }, [mobileMenuOpen]);

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            if (id === "service-workflow") {
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            const navbarOffset = window.innerWidth >= 640 ? 64 : 56;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
            window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: "smooth"
            });
            return;
        }

        // Fallback: the pre-rendered "Proses Perbaikan" video section is desktop-only,
        // so on mobile it may not exist in the DOM. Scroll to the tracking hub instead.
        if (id === "service-workflow") {
            const fallbackEl = document.getElementById("track-lookup");
            if (fallbackEl) {
                const navbarOffset = window.innerWidth >= 640 ? 64 : 56;
                window.scrollTo({
                    top: Math.max(0, fallbackEl.getBoundingClientRect().top + window.pageYOffset - navbarOffset),
                    behavior: "smooth"
                });
            }
        }
    };

    return (
        <motion.header
            initial={false}
            animate={{
                y: visible ? 0 : -80,
                opacity: visible ? 1 : 0,
            }}
            transition={{
                y: {
                    type: "spring",
                    stiffness: 380,
                    damping: 32,
                    mass: 0.8,
                },
                opacity: {
                    duration: 0.22,
                    ease: "easeOut",
                },
            }}
            className={`fixed top-0 left-0 right-0 z-50 w-full h-14 sm:h-16 font-sans flex items-center bg-white/92 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.07)] will-change-transform transform-gpu ${
                visible ? "pointer-events-auto" : "pointer-events-none"
            }`}
        >
                <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-between gap-2 flex-nowrap">
                {/* Brand Identity */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-nowrap">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs shrink-0">
                        <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
                            <span className="font-display font-extrabold text-sm sm:text-lg tracking-tight text-slate-900 leading-none whitespace-nowrap">
                                YVS Computer
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Buka Setiap Hari 09:00–18:00 WIB" />
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-3xs font-mono font-medium whitespace-nowrap">
                                09:00–18:00
                            </span>
                        </div>
                        <span className="text-3xs font-mono text-slate-400 tracking-wider uppercase truncate hidden xs:block">
                            komputerawet.com
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
                        Keunggulan Kami
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
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-nowrap">
                    <button
                        type="button"
                        onClick={onSearchClick}
                        className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs hover:border-slate-300 shrink-0 whitespace-nowrap"
                        title="Lacak Tiket Servis"
                    >
                        <Search className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="hidden sm:inline whitespace-nowrap">Lacak Tiket</span>
                        <span className="sm:hidden text-xs whitespace-nowrap">Lacak</span>
                    </button>

                    <a
                        href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20laptop/PC%20saya"
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                        title="Chat WhatsApp CS"
                    >
                        <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                        <span className="hidden lg:inline whitespace-nowrap">WhatsApp</span>
                    </a>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden h-9 w-9 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200/90 cursor-pointer shrink-0"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop Scrim */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="md:hidden fixed inset-0 top-14 bg-slate-900/30 backdrop-blur-2xs z-40"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Dropdown Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="md:hidden absolute top-full left-0 right-0 z-50 overflow-hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 px-4 py-4 space-y-1 shadow-xl"
                        >
                            {[
                                { num: "01", label: "Keunggulan Kami", id: "service-workflow" },
                                { num: "02", label: "Layanan Kami", id: "service-spec" },
                                { num: "03", label: "Standar Pemeriksaan", id: "engineering-standards" },
                                { num: "04", label: "Ulasan Google Maps (4.7★)", id: "workshop-reviews" },
                                { num: "05", label: "Lokasi & Jadwal Layanan", id: "workshop-location" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => scrollToSection(item.id)}
                                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-800 hover:text-blue-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <span>{item.label}</span>
                                    <span className="font-mono text-xs font-bold text-slate-400">[{item.num}]</span>
                                </button>
                            ))}

                            <div className="pt-3 border-t border-slate-100 space-y-2">
                                <div className="flex items-center gap-2 px-3.5 py-1 text-xs text-slate-500 font-mono">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Buka Setiap Hari: 09:00 – 18:00 WIB</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        if (onSearchClick) onSearchClick();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-sm transition-colors shadow-xs cursor-pointer min-h-[44px]"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>Lacak Status Servis Sekarang</span>
                                </button>
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20Yangversa%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20laptop/PC%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-semibold text-sm transition-colors shadow-2xs min-h-[44px]"
                                >
                                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                                    <span>Konsultasi WhatsApp CS</span>
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Precision Laser Shimmer Accent Along Bottom Border */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent pointer-events-none" />
        </motion.header>
    );
}
