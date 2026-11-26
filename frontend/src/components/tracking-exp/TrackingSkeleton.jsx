export default function TrackingSkeleton({ ticketCode }) {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="Memuat data pelacakan servis"
            className="min-h-screen bg-slate-50 font-sans"
        >
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
                    <div className="h-9 w-28 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="h-9 w-36 rounded-xl bg-slate-200 animate-pulse" />
                </div>
            </header>

            <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" aria-hidden="true" />
                    <span>
                        {ticketCode
                            ? `Mengambil data servis ${ticketCode}...`
                            : "Mengambil data pelacakan servis..."}
                    </span>
                </div>

                {/* Summary Hero Skeleton */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                        <div className="space-y-2.5">
                            <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                            <div className="h-7 w-64 max-w-full rounded bg-slate-200 animate-pulse" />
                        </div>
                        <div className="h-8 w-36 rounded-full bg-blue-100 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                        <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                        <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                </div>

                {/* Vertical Progress + Detail Split Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="flex items-start gap-3.5">
                                <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
                                    <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                        <div className="h-5 w-48 rounded bg-slate-200 animate-pulse" />
                        <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
                            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
