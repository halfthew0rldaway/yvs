import { lazy, Suspense, useRef } from "react";
import "./TrackingExp.css";
import { ScrollProgressBar, useLenisSmoothScroll, smoothScrollToTarget } from "./MotionPrimitives";
import EditorialNavbar from "./EditorialNavbar";
import HeroTrackingStage from "./HeroTrackingStage";

// Lazy-load below-the-fold sections so the initial tracking hero & form stay instant
const InteractiveDiagnosticBench = lazy(() => import("./InteractiveDiagnosticBench"));
const EditorialPromoStrip = lazy(() => import("./EditorialPromoStrip"));
const ServiceCatalogRail = lazy(() => import("./ServiceCatalogRail"));
const CraftStandardsStack = lazy(() => import("./CraftStandardsStack"));
const ProofReviewsStrip = lazy(() => import("./ProofReviewsStrip"));
const WorkshopVisitSection = lazy(() => import("./WorkshopVisitSection"));

function SectionSkeleton({ dark = false }) {
    return (
        <div
            aria-hidden="true"
            className={`w-full py-24 ${dark ? "bg-[#0B1220]" : "bg-white"}`}
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
        }, 420);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
            {/* Native CSS Scroll-Driven Progress Indicator (with JS fallback) */}
            <ScrollProgressBar />

            {/* 1. Always-Accessible Shrinking Editorial Navbar */}
            <EditorialNavbar onFocusTrack={handleFocusTrack} />

            <main>
                {/* 2. Above-the-Fold Editorial Hero + Immediate Tracking Instrument */}
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

                {/* 3. Active Store Promotions (Auto-hides if none active; Zero PII) */}
                <Suspense fallback={null}>
                    <EditorialPromoStrip />
                </Suspense>

                {/* 4. Signature Visual Identity: Interactive Symptom-to-Motherboard Diagnostic Lab */}
                <Suspense fallback={<SectionSkeleton dark />}>
                    <InteractiveDiagnosticBench />
                </Suspense>

                {/* 5. Interactive Service Catalog Ledger */}
                <Suspense fallback={<SectionSkeleton />}>
                    <ServiceCatalogRail />
                </Suspense>

                {/* 6. Sticky Manifesto + Progressively Stacking Standards Cards */}
                <Suspense fallback={<SectionSkeleton />}>
                    <CraftStandardsStack />
                </Suspense>

                {/* 7. Verified Google Maps Metrics & Pausable Review Stream */}
                <Suspense fallback={<SectionSkeleton />}>
                    <ProofReviewsStrip />
                </Suspense>

                {/* 8. Workshop Visit Guide, Vector Pekayon Locator & Minimal Footer */}
                <Suspense fallback={<SectionSkeleton />}>
                    <WorkshopVisitSection onFocusTrack={handleFocusTrack} />
                </Suspense>
            </main>
        </div>
    );
}
