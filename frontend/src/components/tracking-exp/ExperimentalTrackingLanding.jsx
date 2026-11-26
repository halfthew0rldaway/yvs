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

// Lazy-load below-the-fold sections on scroll proximity so initial load only mounts Hero + Navbar
const EditorialPromoStrip = lazy(() => import("./EditorialPromoStrip"));
const ServiceJourneyTimeline = lazy(() => import("./ServiceJourneyTimeline"));
const ServiceCatalogRail = lazy(() => import("./ServiceCatalogRail"));
const ProofReviewsStrip = lazy(() => import("./ProofReviewsStrip"));
const TransparentPricingSection = lazy(() => import("./TransparentPricingSection"));
const WorkshopVisitSection = lazy(() => import("./WorkshopVisitSection"));

/**
 * Defers mounting heavy below-the-fold sections until they approach the viewport
 * (or when the user clicks a navbar anchor / scrolls), eliminating initial TBT spikes
 * while keeping CLS at 0 via stable placeholder height.
 */
function DeferredSection({ id, minHeight = 520, dark = false, forceMount = false, children }) {
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
                    <div
                        id={id}
                        aria-hidden="true"
                        style={{ minHeight }}
                        className={dark ? "w-full bg-[#0B162C]" : "w-full bg-white"}
                    />
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
            style={{ minHeight, contentVisibility: "auto", containIntrinsicSize: `auto ${minHeight}px` }}
            className={dark ? "w-full bg-[#0B162C]" : "w-full bg-white"}
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

    // Pause Lenis while QR camera modal is open so modal scroll/focus behaves natively
    useLenisSmoothScroll(!isScannerOpen);

    // Mount remaining sections immediately on first scroll or nav click so anchor scrolling is instant
    useEffect(() => {
        if (mountAll) return;
        const onScroll = () => {
            if (window.scrollY > 40) setMountAll(true);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [mountAll]);

    const handleFocusTrack = () => {
        smoothScrollToTarget("track-lookup", -72);
        window.setTimeout(() => {
            trackInputRef.current?.focus({ preventScroll: true });
        }, 380);
    };

    return (
        <div className="yvs-exp-scope min-h-screen bg-white text-slate-950 font-sans selection:bg-blue-600 selection:text-white">
            {/* Short Non-Blocking Intro Accent (< 0.8s, skipped on repeat visit) */}
            <IntroReveal />

            {/* Desktop Fine-Pointer Custom Cursor */}
            <EditorialCursor />

            {/* Scroll Progress Indicator */}
            <ScrollProgressBar />

            {/* Shrinking Editorial Navbar + Skip Link */}
            <EditorialNavbar onFocusTrack={handleFocusTrack} />

            <main id="main-content">
                {/* 1. Editorial Hero + Primary Tracking CTA + Scroll-Scrubbed Visual */}
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

                {/* Active Store Promotions (Auto-hides if none active) */}
                <DeferredSection id="promo-aktif" minHeight={0} forceMount={mountAll}>
                    <EditorialPromoStrip />
                </DeferredSection>

                {/* 2. Pinned Scroll-Scrubbed 5-Stage Process (Shared language with Tracking Result) */}
                <DeferredSection id="alur-servis" minHeight={640} forceMount={mountAll}>
                    <ServiceJourneyTimeline />
                </DeferredSection>

                {/* 3. Editorial Services Ledger */}
                <DeferredSection id="layanan" minHeight={680} forceMount={mountAll}>
                    <ServiceCatalogRail />
                </DeferredSection>

                {/* 4. Proof: Before/After Drag Slider, Verified Counters, Warranty Terms & Velocity Marquee */}
                <DeferredSection id="ulasan" minHeight={720} forceMount={mountAll}>
                    <ProofReviewsStrip />
                </DeferredSection>

                {/* 5. Transparent Pricing ("Mulai dari" ranges on Deep Navy contrast section) */}
                <DeferredSection id="estimasi-biaya" minHeight={640} dark forceMount={mountAll}>
                    <TransparentPricingSection />
                </DeferredSection>
            </main>

            {/* 6. Large Editorial Footer, Map, Hours & Magnetic CTAs */}
            <DeferredSection id="lokasi" minHeight={580} forceMount={mountAll}>
                <WorkshopVisitSection onFocusTrack={handleFocusTrack} />
            </DeferredSection>
        </div>
    );
}
