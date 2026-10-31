export default function BrandTicker() {
    const TICKER_ITEMS = [
        "LAPTOP REPAIR",
        "HARDWARE DIAGNOSTICS",
        "MOTHERBOARD RESTORATION",
        "THERMAL OVERHAUL",
        "DATA RECOVERY",
        "PEKAYON BEKASI",
        "YVS COMPUTER",
        "KOMPUTERAWET.COM",
        "ZERO-FEE DIAGNOSIS",
        "DIGITAL WARRANTY PASS",
    ];

    return (
        <aside
            aria-label="Informasi Singkat Layanan YVS Computer"
            className="w-full bg-white border-y border-slate-200 overflow-hidden py-2.5 sm:py-3 select-none"
        >
            <div className="flex w-full overflow-hidden">
                <div className="animate-marquee flex items-center shrink-0">
                    {/* Primary Track */}
                    <div className="flex items-center gap-6 sm:gap-8 px-3 sm:px-4">
                        {TICKER_ITEMS.map((item, idx) => (
                            <span
                                key={`item-${idx}`}
                                className="inline-flex items-center gap-6 sm:gap-8 font-mono text-3xs sm:text-xs font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap"
                            >
                                <span>{item}</span>
                                <span className="w-1 h-1 rounded-full bg-blue-600 shrink-0" />
                            </span>
                        ))}
                    </div>

                    {/* Duplicate Track for Seamless -50% Loop */}
                    <div aria-hidden="true" className="flex items-center gap-6 sm:gap-8 px-3 sm:px-4">
                        {TICKER_ITEMS.map((item, idx) => (
                            <span
                                key={`dup-${idx}`}
                                className="inline-flex items-center gap-6 sm:gap-8 font-mono text-3xs sm:text-xs font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap"
                            >
                                <span>{item}</span>
                                <span className="w-1 h-1 rounded-full bg-blue-600 shrink-0" />
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}

