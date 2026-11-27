import { lazy, Suspense, startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import ErrorBoundary from "../../components/ErrorBoundary";
import ExperimentalTrackingLanding from "../../components/tracking-exp/ExperimentalTrackingLanding";
import TrackingSkeleton from "../../components/tracking-exp/TrackingSkeleton";

const importTrackingResultView = () => import("../../components/tracking-exp/TrackingResultView");

// Lazy-load heavy Tracking Result View & QR Camera Scanner so initial /tracking LCP stays < 2.0s
const TrackingResultView = lazy(importTrackingResultView);
const CameraScannerModal = lazy(() =>
    import("../../components/CameraScannerModal")
);

const RECENT_TRACKING_KEY = "yvs_recent_tracking";

function getRecentSearches() {
    try {
        const stored = localStorage.getItem(RECENT_TRACKING_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch (_) {}
    return [];
}

function saveRecentSearch(type, value) {
    if (!value || !String(value).trim()) return;
    try {
        const clean = String(value).trim();
        const current = getRecentSearches();
        const filtered = current.filter((item) => item.value !== clean);
        const updated = [{ type, value: clean, time: Date.now() }, ...filtered].slice(0, 4);
        localStorage.setItem(RECENT_TRACKING_KEY, JSON.stringify(updated));
    } catch (_) {}
}

function clearRecentSearches() {
    try {
        localStorage.removeItem(RECENT_TRACKING_KEY);
    } catch (_) {}
}

function extractTicketFromScan(text) {
    if (!text) return "";
    const clean = String(text).trim();
    try {
        if (clean.startsWith("http://") || clean.startsWith("https://")) {
            const url = new URL(clean);
            const tParam =
                url.searchParams.get("nomor_tiket") ||
                url.searchParams.get("tiket") ||
                url.searchParams.get("search");
            if (tParam) return tParam.trim();
        }
    } catch (_) {}
    return clean;
}

export default function Tracking() {
    const [searchParams] = useSearchParams();
    const queryTiket = searchParams.get("nomor_tiket") || searchParams.get("tiket") || "";
    const queryPhone =
        searchParams.get("nomor_telepon") ||
        searchParams.get("phone") ||
        searchParams.get("telepon") ||
        "";

    const [trackMethod, setTrackMethod] = useState(queryPhone && !queryTiket ? "telepon" : "tiket");
    const [nomorTelepon, setNomorTelepon] = useState(queryPhone);
    const [nomorTiket, setNomorTiket] = useState(queryTiket);
    const [results, setResults] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(Boolean(queryTiket || queryPhone));
    const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => getRecentSearches());
    const trackingResultHeadingRef = useRef(null);

    // Non-blocking transition helper: never holds keyboard/input frames with flushSync
    const switchViewSmoothly = useCallback((updateFn, onFinished) => {
        startTransition(() => {
            updateFn();
        });
        if (onFinished) {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(onFinished);
            });
        }
    }, []);

    const executeTrack = useCallback(
        async (payload) => {
            setError("");
            setResults(null);
            setSelectedTicket(null);
            setLoading(true);

            try {
                // Warm result module in parallel with API lookup so Suspense resolves immediately
                const [res] = await Promise.all([
                    api.post("/tracking", payload),
                    importTrackingResultView().catch(() => {}),
                ]);
                const data = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
                const applyResult = () => {
                    setResults(data);
                    if (data.length === 1) {
                        setSelectedTicket(data[0]);
                    }
                };
                if (data.length > 0) {
                    switchViewSmoothly(applyResult, () => {
                        window.scrollTo({ top: 0, behavior: "auto" });
                        trackingResultHeadingRef.current?.focus();
                    });
                } else {
                    applyResult();
                }

                if (payload.nomorTiket) {
                    saveRecentSearch("tiket", payload.nomorTiket);
                    setRecentSearches(getRecentSearches());
                } else if (payload.nomorTelepon) {
                    saveRecentSearch("telepon", payload.nomorTelepon);
                    setRecentSearches(getRecentSearches());
                }
            } catch (err) {
                setError(
                    err.response?.data?.message || "Gagal melacak servis. Coba beberapa saat lagi."
                );
            } finally {
                setLoading(false);
            }
        },
        [switchViewSmoothly]
    );

    useEffect(() => {
        if (queryTiket) {
            setTrackMethod("tiket");
            setNomorTiket(queryTiket);
            executeTrack({ nomorTiket: queryTiket });
        } else if (queryPhone) {
            setTrackMethod("telepon");
            setNomorTelepon(queryPhone);
            executeTrack({ nomorTelepon: queryPhone });
        }
    }, [queryTiket, queryPhone, executeTrack]);

    const handleScanReceipt = useCallback(
        (scannedText) => {
            setIsCameraScannerOpen(false);
            const ticketId = extractTicketFromScan(scannedText);
            if (ticketId) {
                setTrackMethod("tiket");
                setNomorTiket(ticketId);
                toast.success(`Nota terdeteksi: ${ticketId}`);
                executeTrack({ nomorTiket: ticketId });
            } else {
                toast.error("Kode QR / Barcode nota tidak dikenali");
            }
        },
        [executeTrack]
    );

    const handleLookupSubmit = useCallback(
        (method, value) => {
            const clean = String(value || "").trim();
            setTrackMethod(method);
            if (method === "telepon") {
                setNomorTelepon(clean);
                executeTrack({ nomorTelepon: clean });
            } else {
                setNomorTiket(clean);
                executeTrack({ nomorTiket: clean });
            }
        },
        [executeTrack]
    );

    const handleQuickSearch = useCallback(
        (item) => {
            setTrackMethod(item.type);
            if (item.type === "tiket") {
                setNomorTiket(item.value);
                executeTrack({ nomorTiket: item.value });
            } else {
                setNomorTelepon(item.value);
                executeTrack({ nomorTelepon: item.value });
            }
        },
        [executeTrack]
    );

    const handleClearRecent = useCallback(() => {
        clearRecentSearches();
        setRecentSearches([]);
    }, []);

    const handleWarmResult = useCallback(() => {
        importTrackingResultView().catch(() => {});
    }, []);

    const handleBackToLanding = useCallback(() => {
        switchViewSmoothly(
            () => {
                setSelectedTicket(null);
                setResults(null);
                setError("");
                if (window.history.pushState) {
                    window.history.pushState({}, "", window.location.pathname);
                }
            },
            () => {
                window.scrollTo({ top: 0, behavior: "auto" });
                document.getElementById("yvs-exp-track-field")?.focus();
            }
        );
    }, [switchViewSmoothly]);

    const isViewingTracking = selectedTicket || (results && results.length > 0);

    // Structured skeleton while loading via deep-link or active lookup
    if (loading && (queryTiket || queryPhone || isViewingTracking)) {
        return <TrackingSkeleton ticketCode={nomorTiket || queryTiket} />;
    }

    // VIEW 1: Redesigned Tracking Result Experience (Lazy-loaded)
    if (isViewingTracking) {
        return (
            <ErrorBoundary>
                <Suspense
                    fallback={
                        <TrackingSkeleton ticketCode={selectedTicket?.nomor_tiket || nomorTiket} />
                    }
                >
                    <TrackingResultView
                        results={results}
                        selectedTicket={selectedTicket}
                        onSelectTicket={(ticket) => setSelectedTicket(ticket)}
                        onBackToLanding={handleBackToLanding}
                        onSearchAnother={handleBackToLanding}
                        headingRef={trackingResultHeadingRef}
                        onUpdateTicket={(updated) => {
                            setSelectedTicket(updated);
                            setResults((prev) =>
                                prev
                                    ? prev.map((item) =>
                                          item.id === updated.id ? { ...item, ...updated } : item
                                      )
                                    : [updated]
                            );
                        }}
                    />
                </Suspense>
            </ErrorBoundary>
        );
    }

    // VIEW 2: Continuous Editorial Landing + Primary Tracking Hero
    return (
        <>
            <ExperimentalTrackingLanding
                initialMethod={trackMethod}
                initialTiket={nomorTiket}
                initialTelepon={nomorTelepon}
                loading={loading}
                error={error}
                results={results}
                recentSearches={recentSearches}
                onLookupSubmit={handleLookupSubmit}
                onQuickSearch={handleQuickSearch}
                onClearRecent={handleClearRecent}
                onWarmResult={handleWarmResult}
                onOpenScanner={() => setIsCameraScannerOpen(true)}
                isScannerOpen={isCameraScannerOpen}
            />

            {isCameraScannerOpen && (
                <Suspense fallback={null}>
                    <CameraScannerModal
                        isOpen={isCameraScannerOpen}
                        onClose={() => setIsCameraScannerOpen(false)}
                        onScan={handleScanReceipt}
                        title="Pindai atau Unggah QR Nota Servis"
                        subtitle="Arahkan kamera ke QR nota atau unggah foto/screenshot QR (diproses lokal sementara)"
                    />
                </Suspense>
            )}
        </>
    );
}
