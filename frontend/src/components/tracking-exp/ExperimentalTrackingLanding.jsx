import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import "./TrackingExp.css";
import {
    ScrollProgressBar,
    IntroReveal,
    useLenisSmoothScroll,
    smoothScrollToTarget,
} from "./MotionPrimitives";
import EditorialNavbar from "./EditorialNavbar";
import HeroTrackingStage from "./HeroTrackingStage";

// Lazy-load below-the-fold chapters on scroll proximity so Hero LCP & keyboard INP stay ultra-fast
const ServiceJourneyTimeline = lazy(() => import("./ServiceJourneyTimeline"));
const ServiceCatalogRail = lazy(() => import("./ServiceCatalogRail"));
const ProofReviewsStrip = lazy(() => import("./ProofReviewsStrip"));
const EditorialPromoStrip = lazy(() => import("./EditorialPromoStrip"));
const TransparentPricingSection = lazy(() => import("./TransparentPricingSection"));
const WorkshopVisitSection = lazy(() => import("./WorkshopVisitSection"));

function DeferredSection({ id, minHeight = 560, bgClass = "bg-white", armed = false, forceMount = false, children }) {
    const hostRef = useRef(null);
    const [mounted, setMounted] = useState(forceMount);

    useEffect(() => {
        if (forceMount) {
            setMounted(true);
            return;
        }
        if (mounted || !armed || !hostRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setMounted(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px 0px" }
        );
        observer.observe(hostRef.current);
        return () => observer.disconnect();
    }, [mounted, armed, forceMount]);

    if (mounted) {
        return (
            <Suspense
                fallback={
                    <div id={id} aria-hidden="true" style={{ minHeight }} className={`w-full ${bgClass}`} />
                }
            >
                {children}
            </Suspense>
        );
    }

    return (
        <div
            ref={hostRef}
            id={id}
            style={{ minHeight }}
            className={`w-full ${bgClass}`}
        />
    );
}

export default function ExperimentalTrackingLanding({
    initialMethod,
    initialTiket,
    initialTelepon,
    loading,
    error,
    results,
    recentSearches,
    onLookupSubmit,
    onQuickSearch,
    onClearRecent,
    onWarmResult,
    onOpenScanner,
    isScannerOpen,
}) {
    const trackInputRef = useRef(null);
    const [armed, setArmed] = useState(false);
    const [mountAll, setMountAll] = useState(false);

    useLenisSmoothScroll(!isScannerOpen);

    // Arm below-the-fold sections strictly on real scroll/wheel/touch/nav intent
    // so initial cold LCP never wastes network/CPU on offscreen chunks or /frames/.
    useEffect(() => {
        if (mountAll) return;
        const armNow = () => {
            setArmed(true);
            if (window.scrollY > 40) setMountAll(true);
        };
        const armAndMount = () => {
            setArmed(true);
            setMountAll(true);
        };
        const onKeyScroll = (e) => {
            if (["ArrowDown", "PageDown", "End", " "].includes(e.key)) {
                armNow();
            }
        };

        window.addEventListener("scroll", armNow, { passive: true });
        window.addEventListener("wheel", armNow, { passive: true, once: true });
        window.addEventListener("touchmove", armNow, { passive: true, once: true });
        window.addEventListener("keydown", onKeyScroll, { passive: true });
        window.addEventListener("yvs:arm-sections", armAndMount);

        return () => {
            window.removeEventListener("scroll", armNow);
            window.removeEventListener("wheel", armNow);
            window.removeEventListener("touchmove", armNow);
            window.removeEventListener("keydown", onKeyScroll);
            window.removeEventListener("yvs:arm-sections", armAndMount);
        };
    }, [mountAll]);

    const handleFocusTrack = useCallback(() => {
        smoothScrollToTarget("track-lookup", -72);
        window.setTimeout(() => {
            trackInputRef.current?.focus({ preventScroll: true });
        }, 360);
    }, []);

    return (
        <div className="yvs-exp-scope min-h-screen bg-[var(--yvs-paper)] text-[var(--yvs-ink)] font-sans">
            <IntroReveal />
            <ScrollProgressBar />
            <EditorialNavbar onFocusTrack={handleFocusTrack} />

            <main id="main-content">
                {/* ACT I — Seamless Studio Hero + Primary Tracking Command Bar */}
                <HeroTrackingStage
                    initialMethod={initialMethod}
                    initialTiket={initialTiket}
                    initialTelepon={initialTelepon}
                    loading={loading}
                    error={error}
                    results={results}
                    recentSearches={recentSearches}
                    onLookupSubmit={onLookupSubmit}
                    onQuickSearch={onQuickSearch}
                    onClearRecent={onClearRecent}
                    onWarmResult={onWarmResult}
                    onOpenScanner={onOpenScanner}
                    inputRef={trackInputRef}
                />

                {/* ACT II — Viewport-Gated Disassembly Process */}
                <DeferredSection id="alur-servis" minHeight={720} bgClass="yvs-studio-canvas" armed={armed} forceMount={mountAll}>
                    <ServiceJourneyTimeline />
                </DeferredSection>

                {/* ACT III — Horizontal Scroll Editorial Services Showcase */}
                <DeferredSection id="layanan" minHeight={680} bgClass="bg-white" armed={armed} forceMount={mountAll}>
                    <ServiceCatalogRail />
                </DeferredSection>

                {/* ACT IV — Full-Bleed Obsidian Navy Proof & Velocity Reviews */}
                <div className="yvs-cv-auto">
                    <DeferredSection id="ulasan" minHeight={760} bgClass="bg-[var(--yvs-obsidian)]" armed={armed} forceMount={mountAll}>
                        <ProofReviewsStrip />
                    </DeferredSection>
                </div>

                {/* Active Promotions (Auto-hides if none active) */}
                <div className="yvs-cv-auto" style={{ containIntrinsicSize: "auto 0px" }}>
                    <DeferredSection id="promo-aktif" minHeight={0} bgClass="bg-white" armed={armed} forceMount={mountAll}>
                        <EditorialPromoStrip />
                    </DeferredSection>
                </div>

                {/* ACT V — Swiss Editorial Pricing Ledger */}
                <DeferredSection id="estimasi-biaya" minHeight={620} bgClass="bg-white" armed={armed} forceMount={mountAll}>
                    <TransparentPricingSection />
                </DeferredSection>
            </main>

            {/* ACT VI — Monumental Obsidian Navy Footer */}
            <div className="yvs-cv-auto" style={{ containIntrinsicSize: "auto 620px" }}>
                <DeferredSection id="lokasi" minHeight={620} bgClass="bg-[var(--yvs-obsidian)]" armed={armed} forceMount={mountAll}>
                    <WorkshopVisitSection onFocusTrack={handleFocusTrack} />
                </DeferredSection>
            </div>
        </div>
    );
}
