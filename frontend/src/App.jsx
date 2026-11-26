import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Tracking from "./pages/tracking/Tracking";
import { lazyWithRetry } from "./utils/lazyWithRetry";

const initialPath = typeof window !== "undefined" ? window.location.pathname.replace(/\/+$/, "") || "/" : "/";

// Pre-kick ErpApp chunk when entering any non-public-tracking route
const preloadedErp = initialPath !== "/tracking" && initialPath !== "/tracking/register" ? import("./ErpApp") : null;

const CustomerRegistration = lazyWithRetry(() => import("./pages/tracking/CustomerRegistration"));
const ErpApp = lazyWithRetry(() => preloadedErp || import("./ErpApp"));

function AppFallback({ isRegistration }) {
    if (isRegistration) {
        return <div className="min-h-screen bg-slate-50" />;
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="relative w-10 h-10">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Memuat Halaman...</p>
        </div>
    );
}

export default function App() {
    const location = useLocation();
    const pathname = location.pathname.replace(/\/+$/, "") || "/";

    if (pathname === "/tracking") {
        return (
            <ErrorBoundary>
                <Tracking />
            </ErrorBoundary>
        );
    }

    const isRegistration = pathname === "/tracking/register";

    return (
        <ErrorBoundary>
            <Suspense fallback={<AppFallback isRegistration={isRegistration} />}>
                {isRegistration ? <CustomerRegistration /> : <ErpApp />}
            </Suspense>
        </ErrorBoundary>
    );
}
