import { useState, useEffect } from "react";
import { Menu, X, Search, MessageCircle, ArrowUpRight } from "lucide-react";
import { MagneticWrap, smoothScrollToTarget } from "./MotionPrimitives";

const NAV_LINKS = [
    { id: "alur-servis", label: "Alur Servis" },
    { id: "layanan", label: "Layanan" },
    { id: "ulasan", label: "Bukti & Ulasan" },
    { id: "estimasi-biaya", label: "Estimasi Biaya" },
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
            { rootMargin: "-28% 0px -55% 0px", threshold: [0.1, 0.35] }
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
        <>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:text-sm focus:font-semibold"
            >
                Lewati ke konten utama
            </a>

            <header
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/95 lg:backdrop-blur-md border-b border-slate-200 h-16 shadow-[0_1px_12px_rgba(11,22,44,0.06)]"
                        : "bg-white/95 border-b border-slate-200/80 h-16 sm:h-[4.5rem]"
                }`}
            >
                <div className="w-full max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-10 xl:px-14 flex items-center justify-between gap-3">
                    {/* Brand Wordmark */}
                    <button
                        type="button"
                        onClick={() => smoothScrollToTarget("top")}
                        className="min-h-[44px] flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer min-w-0 shrink-0 rounded-lg"
                    >
                        <img
                            src="/logo-yangversa.png"
                            alt="Logo YVS Computer"
                            width="36"
                            height="36"
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                            <span className="font-display font-bold text-sm sm:text-base tracking-tight text-slate-950 block leading-none">
                                YVS Computer
                            </span>
                            <span className="text-xs font-mono text-slate-600 hidden sm:inline-flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
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
                                    className={`relative min-h-[44px] px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
                                        isActive
                                            ? "text-slate-950 font-semibold"
                                            : "text-slate-600 hover:text-slate-950"
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    <span
                                        aria-hidden="true"
                                        className={`absolute left-3.5 right-3.5 bottom-1.5 h-[2px] bg-blue-600 transition-transform duration-300 origin-left ${
                                            isActive ? "scale-x-100" : "scale-x-0"
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </nav>

                    {/* Primary Actions (all >= 44px tap targets) */}
                    <div className="flex items-center gap-2 shrink-0">
                        <MagneticWrap strength={0.18}>
                            <button
                                type="button"
                                data-cursor="Lacak"
                                onClick={() => {
                                    setMobileOpen(false);
                                    if (onFocusTrack) onFocusTrack();
                                    else smoothScrollToTarget("track-lookup", -80);
                                }}
                                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                                <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>Cek Servis</span>
                            </button>
                        </MagneticWrap>

                        <a
                            href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20soal%20perbaikan%20perangkat%20saya"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white hover:border-blue-600 hover:text-blue-700 text-slate-800 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                            <MessageCircle className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                            <span>WhatsApp</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
                        </a>

                        <button
                            type="button"
                            onClick={() => setMobileOpen((prev) => !prev)}
                            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                            aria-expanded={mobileOpen}
                            className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 hover:text-slate-950 flex items-center justify-center cursor-pointer"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer (Pure CSS transitions — zero framer-motion on critical path) */}
                {mobileOpen && (
                    <>
                        <div
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden fixed inset-0 top-16 bg-[#0B162C]/35 z-40"
                            aria-hidden="true"
                        />
                        <nav
                            aria-label="Navigasi seluler"
                            className="lg:hidden absolute top-full inset-x-0 z-50 bg-white border-b border-slate-200 px-4 py-4 shadow-xl space-y-1 animate-fade-in"
                        >
                            {NAV_LINKS.map((item, index) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleNavClick(item.id)}
                                    className="w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                                >
                                    <span>{item.label}</span>
                                    <span className="font-mono text-xs font-semibold text-slate-600">
                                        0{index + 1}
                                    </span>
                                </button>
                            ))}

                            <div className="pt-3 mt-2 border-t border-slate-200">
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20soal%20perbaikan%20perangkat%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-[#0B162C] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                                    <span>Tanya via WhatsApp</span>
                                </a>
                            </div>
                        </nav>
                    </>
                )}
            </header>
        </>
    );
}
