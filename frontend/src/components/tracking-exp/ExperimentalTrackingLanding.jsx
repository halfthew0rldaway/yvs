import { lazy, Suspense, useRef } from "react";
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

// Lazy-load below-the-fold sections so the initial hero & tracking form stay instant (LCP < 2.0s)
const EditorialPromoStrip = lazy(() => import("./EditorialPromoStrip"));
const ServiceJourneyTimeline = lazy(() => import("./ServiceJourneyTimeline"));
const ServiceCatalogRail = lazy(() => import("./ServiceCatalogRail"));
const ProofReviewsStrip = lazy(() => import("./ProofReviewsStrip"));
const TransparentPricingSection = lazy(() => import("./TransparentPricingSection"));
const WorkshopVisitSection = lazy(() => import("./WorkshopVisitSection"));

function SectionSkeleton({ dark = false }) {
    return (
        <div
            aria-hidden="true"
            className={`w-full py-20 ${dark ? "bg-[#0B162C]" : "bg-white"}`}
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

    // Pause Lenis while QR camera modal is open so modal scroll/focus behaves natively
    useLenisSmoothScroll(!isScannerOpen);

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
                <Suspense fallback={null}>
                    <EditorialPromoStrip />
                </Suspense>

                {/* 2. Pinned Scroll-Scrubbed 5-Stage Process (Shared language with Tracking Result) */}
                <Suspense fallback={<SectionSkeleton />}>
                    <ServiceJourneyTimeline />
                </Suspense>

                {/* 3. Editorial Services Ledger */}
                <Suspense fallback={<SectionSkeleton />}>
                    <ServiceCatalogRail />
                </Suspense>

                {/* 4. Proof: Before/After Drag Slider, Verified Counters, Warranty Terms & Velocity Marquee */}
                <Suspense fallback={<SectionSkeleton />}>
                    <ProofReviewsStrip />
                </Suspense>

                {/* 5. Transparent Pricing ("Mulai dari" ranges on Deep Navy contrast section) */}
                <Suspense fallback={<SectionSkeleton dark />}>
                    <TransparentPricingSection />
                </Suspense>
            </main>

            {/* 6. Large Editorial Footer, Map, Hours & Magnetic CTAs */}
            <Suspense fallback={<SectionSkeleton />}>
                <WorkshopVisitSection onFocusTrack={handleFocusTrack} />
            </Suspense>
        </div>
    );
}
