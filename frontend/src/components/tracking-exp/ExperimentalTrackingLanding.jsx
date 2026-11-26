import { lazy, Suspense, useEffect, useRef, useState } from "react";
import "./TrackingExp.css";
import {
    ScrollProgressBar,
    IntroReveal,
    EditorialCursor,
    useLenisSmoothScroll,
    smoothScrollToTarget,
} from "./MotionPrimitives";
import EditorialNavbar from "./EditorialNavbar";
import HeroTrackingStage from "./HeroTrackingStage";

// Lazy-load below-the-fold chapters on scroll proximity so Hero LCP stays < 2.2s
const ServiceJourneyTimeline = lazy(() => import("./ServiceJourneyTimeline"));
const ServiceCatalogRail = lazy(() => import("./ServiceCatalogRail"));
const ProofReviewsStrip = lazy(() => import("./ProofReviewsStrip"));
const EditorialPromoStrip = lazy(() => import("./EditorialPromoStrip"));
const TransparentPricingSection = lazy(() => import("./TransparentPricingSection"));
const WorkshopVisitSection = lazy(() => import("./WorkshopVisitSection"));

function DeferredSection({ id, minHeight = 560, bgClass = "bg-white", forceMount = false, children }) {
    const hostRef = useRef(null);
    const [mounted, setMounted] = useState(forceMount);

    useEffect(() => {
        if (forceMount) {
            setMounted(true);
            return;
        }
        if (mounted || !hostRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setMounted(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "420px 0px" }
        );
        observer.observe(hostRef.current);
        return () => observer.disconnect();
    }, [mounted, forceMount]);

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
    trackMethod,
    setTrackMethod,
    nomorTiket,
    setNomorTiket,
    nomorTelepon,
    setNomorTelepon,
    loading,
    error,
    results,
    recentSearches,
    onSubmit,
    onQuickSearch,
    onClearRecent,
    onOpenScanner,
    isScannerOpen,
}) {
    const trackInputRef = useRef(null);
    const [mountAll, setMountAll] = useState(false);

    useLenisSmoothScroll(!isScannerOpen);

    useEffect(() => {
        if (mountAll) return;
        const onScroll = () => {
            if (window.scrollY > 36) setMountAll(true);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [mountAll]);

    const handleFocusTrack = () => {
        smoothScrollToTarget("track-lookup", -72);
        window.setTimeout(() => {
            trackInputRef.current?.focus({ preventScroll: true });
        }, 360);
    };

    return (
        <div className="yvs-exp-scope min-h-screen yvs-studio-canvas text-[#071124] font-sans selection:bg-[#2563EB] selection:text-white">
            <IntroReveal />
            <EditorialCursor />
            <ScrollProgressBar />
            <EditorialNavbar onFocusTrack={handleFocusTrack} />

            <main id="main-content">
                {/* ACT I — Seamless Studio Hero + Primary Tracking Command Bar */}
                <HeroTrackingStage
                    trackMethod={trackMethod}
                    setTrackMethod={setTrackMethod}
                    nomorTiket={nomorTiket}
                    setNomorTiket={setNomorTiket}
                    nomorTelepon={nomorTelepon}
                    setNomorTelepon={setNomorTelepon}
                    loading={loading}
                    error={error}
                    results={results}
                    recentSearches={recentSearches}
                    onSubmit={onSubmit}
                    onQuickSearch={onQuickSearch}
                    onClearRecent={onClearRecent}
                    onOpenScanner={onOpenScanner}
                    inputRef={trackInputRef}
                />

                {/* ACT II — Pinned Full-Screen Disassembly Process (Seamless #EFEFEF continuation) */}
                <DeferredSection id="alur-servis" minHeight={720} bgClass="yvs-studio-canvas" forceMount={mountAll}>
                    <ServiceJourneyTimeline />
                </DeferredSection>

                {/* ACT III — Horizontal Scroll Editorial Services Showcase */}
                <DeferredSection id="layanan" minHeight={680} bgClass="bg-white" forceMount={mountAll}>
                    <ServiceCatalogRail />
                </DeferredSection>

                {/* ACT IV — Full-Bleed Obsidian Navy Proof, Real Visual Comparison & Velocity Reviews */}
                <DeferredSection id="ulasan" minHeight={760} bgClass="bg-[#071124]" forceMount={mountAll}>
                    <ProofReviewsStrip />
                </DeferredSection>

                {/* Active Promotions (Auto-hides if none active) */}
                <DeferredSection id="promo-aktif" minHeight={0} bgClass="bg-white" forceMount={mountAll}>
                    <EditorialPromoStrip />
                </DeferredSection>

                {/* ACT V — Swiss Editorial Pricing Ledger */}
                <DeferredSection id="estimasi-biaya" minHeight={620} bgClass="bg-white" forceMount={mountAll}>
                    <TransparentPricingSection />
                </DeferredSection>
            </main>

            {/* ACT VI — Monumental Obsidian Navy Footer */}
            <DeferredSection id="lokasi" minHeight={620} bgClass="bg-[#071124]" forceMount={mountAll}>
                <WorkshopVisitSection onFocusTrack={handleFocusTrack} />
            </DeferredSection>
        </div>
    );
}
