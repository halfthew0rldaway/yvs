import { useMemo } from "react";

/**
 * Lightweight, Tailwind v3 & OKLCH-compatible vertical/CSS marquee primitive
 * adapted for YVS editorial review walls. Runs purely on the GPU compositor thread
 * via `.yvs-marquee-lane` in `TrackingExp.css` with zero RAF/layout overhead.
 */
export function VerticalMarquee({
    children,
    reverse = false,
    paused = false,
    pauseOnHover = true,
    repeat = 3,
    duration = "38s",
    gap = "1rem",
    className = "",
    ariaLabel,
}) {
    const copies = useMemo(
        () =>
            Array.from({ length: repeat }, (_, copyIdx) => (
                <div
                    key={copyIdx}
                    aria-hidden={copyIdx > 0 ? "true" : undefined}
                    className="yvs-marquee-lane flex shrink-0 flex-col justify-around [gap:var(--yvs-marquee-gap)]"
                    data-reverse={reverse ? "true" : "false"}
                >
                    {children}
                </div>
            )),
        [repeat, reverse, children]
    );

    return (
        <div
            data-slot="marquee"
            data-paused={paused ? "true" : "false"}
            aria-label={ariaLabel}
            style={{
                "--yvs-marquee-duration": duration,
                "--yvs-marquee-gap": gap,
            }}
            className={`${pauseOnHover ? "yvs-marquee-group " : ""}flex flex-col overflow-hidden p-1.5 [gap:var(--yvs-marquee-gap)] ${className}`}
        >
            {copies}
        </div>
    );
}

export default VerticalMarquee;
