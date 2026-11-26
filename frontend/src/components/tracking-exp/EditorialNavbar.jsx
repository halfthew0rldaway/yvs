import { useState, useEffect } from "react";
import { Menu, X, Search } from "lucide-react";
import { MagneticWrap, smoothScrollToTarget } from "./MotionPrimitives";

const NAV_LINKS = [
    { id: "alur-servis", label: "Alur servis" },
    { id: "layanan", label: "Layanan" },
    { id: "ulasan", label: "Bukti & ulasan" },
    { id: "estimasi-biaya", label: "Kisaran biaya" },
    { id: "lokasi", label: "Lokasi" },
];

export default function EditorialNavbar({ onFocusTrack }) {
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        let observer = null;
        let observerAttached = false;

        const attachSectionObserver = () => {
            if (observerAttached) return;
            observerAttached = true;
            observer = new IntersectionObserver(
                (entries) => {
                    const visible = entries
                        .filter((e) => e.isIntersecting)
                        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                    if (visible?.target?.id) setActiveSection(visible.target.id);
                },
                { rootMargin: "-25% 0px -55% 0px", threshold: [0.1, 0.35] }
            );
            NAV_LINKS.forEach((item) => {
                const el = document.getElementById(item.id);
                if (el) observer.observe(el);
            });
        };

        const onScroll = () => {
            const next = window.scrollY > 36;
            setScrolled((prev) => (prev === next ? prev : next));
            if (window.scrollY > 12) attachSectionObserver();
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (observer) observer.disconnect();
        };
    }, []);

    const handleNavClick = (id) => {
        setMobileOpen(false);
        window.dispatchEvent(new Event("yvs:arm-sections"));
        window.requestAnimationFrame(() => {
            smoothScrollToTarget(id, -68);
        });
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
                className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
                    scrolled
                        ? "bg-[var(--yvs-paper)] border-b border-[var(--yvs-rule)] h-16"
                        : "bg-[var(--yvs-paper)] h-20"
                }`}
            >
                <div className="w-full max-w-[1440px] mx-auto h-full px-5 sm:px-8 lg:px-12 flex items-center justify-between gap-4">
                    {/* Edge-Aligned Wordmark */}
                    <button
                        type="button"
                        onClick={() => smoothScrollToTarget("top")}
                        className="min-h-[44px] inline-flex items-center gap-2.5 text-left cursor-pointer shrink-0 rounded-lg"
                    >
                        <img
                            src="/logo-yangversa.png"
                            alt="YVS Computer"
                            width="32"
                            height="32"
                            className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-[var(--yvs-rule)] shrink-0"
                        />
                        <span className="font-display font-bold text-base tracking-[-0.02em] text-[var(--yvs-ink)]">
                            YVS Computer
                        </span>
                    </button>

                    {/* Quiet Sentence-Case Editorial Links */}
                    <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-1">
                        {NAV_LINKS.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleNavClick(item.id)}
                                    className={`relative min-h-[44px] px-4 py-2 text-sm transition-colors cursor-pointer rounded-lg whitespace-nowrap ${
                                        isActive
                                            ? "text-[var(--yvs-ink)] font-semibold"
                                            : "text-[var(--yvs-muted)] hover:text-[var(--yvs-ink)] font-medium"
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    <span
                                        aria-hidden="true"
                                        className={`absolute left-4 right-4 bottom-1.5 h-[1.5px] bg-[var(--yvs-accent)] motion-safe:transition-transform duration-200 origin-left ${
                                            isActive ? "scale-x-100" : "scale-x-0"
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </nav>

                    {/* Quiet Secondary Nav Action (Hero owns the filled blue primary CTA) */}
                    <div className="flex items-center gap-2 shrink-0">
                        <MagneticWrap strength={0.14}>
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileOpen(false);
                                    if (onFocusTrack) onFocusTrack();
                                    else smoothScrollToTarget("track-lookup", -72);
                                }}
                                className="inline-flex items-center gap-2 min-h-[44px] px-4 sm:px-5 rounded-xl bg-[var(--yvs-paper-2)] hover:bg-blue-50 border border-[var(--yvs-rule)] hover:border-blue-300 text-[var(--yvs-ink)] hover:text-[var(--yvs-accent)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                                <Search className="w-3.5 h-3.5 text-[var(--yvs-accent)] shrink-0" aria-hidden="true" />
                                <span>Lacak servis</span>
                            </button>
                        </MagneticWrap>

                        <button
                            type="button"
                            onClick={() => setMobileOpen((prev) => !prev)}
                            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                            aria-expanded={mobileOpen}
                            className="lg:hidden min-w-[44px] min-h-[44px] rounded-full border border-[var(--yvs-rule)] bg-white text-[var(--yvs-ink)] flex items-center justify-center cursor-pointer"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer */}
                {mobileOpen && (
                    <>
                        <div
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden fixed inset-0 top-16 bg-slate-950/35 z-40"
                            aria-hidden="true"
                        />
                        <nav
                            aria-label="Navigasi seluler"
                            className="lg:hidden absolute top-full inset-x-0 z-50 bg-white border-b border-[var(--yvs-rule)] px-5 py-5 shadow-2xl space-y-1 animate-fade-in"
                        >
                            {NAV_LINKS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleNavClick(item.id)}
                                    className="w-full min-h-[48px] flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-semibold text-[var(--yvs-ink)] hover:bg-[var(--yvs-paper-2)] transition-colors cursor-pointer"
                                >
                                    <span>{item.label}</span>
                                </button>
                            ))}

                            <div className="pt-3 mt-2 border-t border-[var(--yvs-rule)]">
                                <a
                                    href="https://wa.me/628121034212?text=Halo%20YVS%20Computer,%20saya%20ingin%20tanya%20soal%20perbaikan%20perangkat%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full min-h-[48px] flex items-center justify-center rounded-xl bg-[var(--yvs-accent)] hover:bg-[var(--yvs-accent-hover)] text-[var(--yvs-accent-ink)] text-sm font-semibold transition-colors"
                                >
                                    Tanya lewat WhatsApp
                                </a>
                            </div>
                        </nav>
                    </>
                )}
            </header>
        </>
    );
}
