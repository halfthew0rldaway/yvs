import { useState, useEffect } from "react";
import { Menu, X, Search, MessageCircle, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { MagneticWrap, smoothScrollToTarget } from "./MotionPrimitives";

const NAV_LINKS = [
    { id: "alur-servis", label: "Alur Servis" },
    { id: "layanan", label: "Layanan" },
    { id: "standar", label: "Prinsip Kerja" },
    { id: "ulasan", label: "Ulasan" },
    { id: "lokasi", label: "Lokasi" },
];

export default function EditorialNavbar({ onFocusTrack }) {
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 28);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible?.target?.id) {
                    setActiveSection(visible.target.id);
                }
            },
            { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.4] }
        );

        NAV_LINKS.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });

        return () => {
            window.removeEventListener("scroll", onScroll);
            observer.disconnect();
        };
    }, []);

    const handleNavClick = (id) => {
        setMobileOpen(false);
        smoothScrollToTarget(id, -72);
    };

    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-white/95 lg:backdrop-blur-md border-b border-slate-200/90 h-14 sm:h-16 shadow-[0_1px_12px_rgba(15,23,42,0.05)]"
                    : "bg-slate-50/90 lg:backdrop-blur-sm border-b border-slate-200/60 h-16 sm:h-[4.5rem]"
            }`}
        >
            <div className="w-full max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-10 xl:px-14 flex items-center justify-between gap-4">
                {/* Brand Wordmark */}
                <button
                    type="button"
                    onClick={() => smoothScrollToTarget("top")}
                    className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer min-w-0 shrink-0"
                >
                    <img
                        src="/logo-yangversa.png"
                        alt="YVS Computer"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain bg-white border border-slate-200/90 p-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                        <span className="font-display font-bold text-sm sm:text-base tracking-tight text-slate-900 block leading-none">
                            YVS Computer
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 hidden xs:inline-flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                            <span>Buka 09.00–18.00 WIB</span>
                        </span>
                    </div>
                </button>

                {/* Desktop Editorial Links */}
                <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-1">
                    {NAV_LINKS.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleNavClick(item.id)}
                                className={`relative px-3.5 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                                    isActive
                                        ? "text-slate-950 font-semibold"
                                        : "text-slate-600 hover:text-slate-950"
                                }`}
                            >
                                <span>{item.label}</span>
                                {isActive && (
                                    <motion.span
                                        layoutId="yvs-nav-indicator"
                                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                        className="absolute left-3.5 right-3.5 bottom-1 h-[2px] bg-blue-600"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Primary Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <MagneticWrap strength={0.18}>
                        <button
                            type="button"
                            onClick={() => {
                                setMobileOpen(false);
                                if (onFocusTrack) onFocusTrack();
                                else smoothScrollToTarget("track-lookup", -80);
                            }}
                            className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                            <Search className="w-3.5 h-3.5 shrink-0" />
                            <span>Lacak Servis</span>
                        </button>
                    </MagneticWrap>

                    <a
                        href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20soal%20perbaikan%20perangkat%20saya"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden sm:inline-flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-lg border border-slate-300 bg-white hover:border-emerald-500 hover:text-emerald-700 text-slate-800 text-xs sm:text-[13px] font-semibold transition-colors whitespace-nowrap"
                    >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>WhatsApp</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>

                    <button
                        type="button"
                        onClick={() => setMobileOpen((prev) => !prev)}
                        aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                        aria-expanded={mobileOpen}
                        className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-950 flex items-center justify-center cursor-pointer"
                    >
                        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.16 }}
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden fixed inset-0 top-14 bg-slate-950/30 z-40"
                            aria-hidden="true"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="lg:hidden absolute top-full inset-x-0 z-50 bg-white border-b border-slate-200 px-4 py-4 shadow-xl space-y-1"
                        >
                            {NAV_LINKS.map((item, index) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleNavClick(item.id)}
                                    className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                    <span>{item.label}</span>
                                    <span className="font-mono text-xs text-slate-400">0{index + 1}</span>
                                </button>
                            ))}

                            <div className="pt-3 mt-2 border-t border-slate-100 grid grid-cols-1 gap-2">
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20soal%20perbaikan%20perangkat%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Tanya via WhatsApp</span>
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
