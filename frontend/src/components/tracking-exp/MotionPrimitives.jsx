import { useEffect, useRef, useState } from "react";
import { loadGsapRuntime } from "./motionTokens";

/**
 * Detect prefers-reduced-motion reactively.
 */
export function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = (e) => setReduced(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return reduced;
}

/**
 * Native compositor smooth-scroll helper (respects `prefers-reduced-motion`).
 * Uses browser-native hardware vsync scrolling instead of JS wheel interception
 * so scroll input stays instant even while lazy sections hydrate.
 */
export function smoothScrollToTarget(target, offset = -72) {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (target === 0 || target === "top") {
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        return;
    }

    const el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
}

/**
 * Scroll Progress Indicator with native CSS Scroll-Driven Animation
 * plus lightweight JS fallback.
 */
export function ScrollProgressBar() {
    const barRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined") return;
        const supportsNative =
            typeof CSS !== "undefined" &&
            typeof CSS.supports === "function" &&
            CSS.supports("animation-timeline", "scroll()");
        if (supportsNative) return;

        let rafId = null;
        const update = () => {
            rafId = null;
            const el = barRef.current;
            if (!el) return;
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
            el.style.transform = `scaleX(${ratio})`;
        };

        const onScroll = () => {
            if (!rafId) rafId = window.requestAnimationFrame(update);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        update();

        return () => {
            window.removeEventListener("scroll", onScroll);
            if (rafId) window.cancelAnimationFrame(rafId);
        };
    }, [reducedMotion]);

    if (reducedMotion) return null;
    return <div ref={barRef} className="yvs-exp-progress-bar" aria-hidden="true" />;
}

/**
 * Short intentional intro accent (< 0.8s, skipped on repeat visit via sessionStorage).
 * Never obscures or delays hero LCP paint.
 */
export function IntroReveal() {
    const reducedMotion = usePrefersReducedMotion();
    const [active, setActive] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            if (window.sessionStorage.getItem("yvs_intro_seen") === "1") return false;
        } catch (_) {}
        return true;
    });

    useEffect(() => {
        if (!active || reducedMotion) {
            setActive(false);
            return;
        }
        try {
            window.sessionStorage.setItem("yvs_intro_seen", "1");
        } catch (_) {}
        const timer = window.setTimeout(() => setActive(false), 780);
        return () => window.clearTimeout(timer);
    }, [active, reducedMotion]);

    if (!active || reducedMotion) return null;

    return (
        <div
            aria-hidden="true"
            className="yvs-exp-intro-sweep fixed top-0 inset-x-0 z-[80] pointer-events-none"
        >
            <div className="h-[3px] w-full bg-blue-600 origin-left yvs-exp-intro-bar" />
        </div>
    );
}

/**
 * Subtle magnetic button/link wrapper for fine pointers (desktop).
 * Caches rect on pointerenter and reuses GSAP quickTo setters for zero layout
 * reads and zero tween GC allocations during mouse movement.
 */
export function MagneticWrap({ children, strength = 0.2, className = "" }) {
    const wrapRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined") return;
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        const el = wrapRef.current;
        if (!el) return;

        let gsapRef = null;
        let quickX = null;
        let quickY = null;
        let cachedRect = null;
        let loading = false;
        let cancelled = false;

        const ensureGsap = () => {
            cachedRect = el.getBoundingClientRect();
            if (gsapRef || loading) return;
            loading = true;
            loadGsapRuntime().then(({ gsap }) => {
                if (cancelled) return;
                gsapRef = gsap;
                quickX = gsap.quickTo(el, "x", { duration: 0.28, ease: "power3.out" });
                quickY = gsap.quickTo(el, "y", { duration: 0.28, ease: "power3.out" });
            });
        };

        const onMove = (e) => {
            if (!quickX || !quickY) return;
            if (!cachedRect) cachedRect = el.getBoundingClientRect();
            const relX = e.clientX - (cachedRect.left + cachedRect.width / 2);
            const relY = e.clientY - (cachedRect.top + cachedRect.height / 2);
            quickX(relX * strength);
            quickY(relY * strength);
        };

        const onLeave = () => {
            cachedRect = null;
            if (!gsapRef) return;
            gsapRef.to(el, {
                x: 0,
                y: 0,
                duration: 0.55,
                ease: "elastic.out(1, 0.45)",
                overwrite: "auto",
            });
        };

        el.addEventListener("pointerenter", ensureGsap, { passive: true });
        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave, { passive: true });
        return () => {
            cancelled = true;
            el.removeEventListener("pointerenter", ensureGsap);
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
            if (gsapRef) gsapRef.killTweensOf(el);
        };
    }, [strength, reducedMotion]);

    return (
        <div ref={wrapRef} className={`inline-block ${className}`}>
            {children}
        </div>
    );
}

/**
 * Editorial Masked Typography Reveal powered purely by IntersectionObserver + CSS compositor transitions.
 * Zero DOM node tearing (SplitText removed), zero mid-scroll layout reflow, 120fps smooth.
 */
export function MaskedLines({
    lines = [],
    as: Tag = "h2",
    className = "",
    trigger = "scroll",
    delay = 0,
    lineClassName = "",
    accentLineIndex = -1,
    accentClassName = "text-blue-600",
}) {
    const containerRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    const [revealed, setRevealed] = useState(() => trigger === "mount" || reducedMotion);

    useEffect(() => {
        if (reducedMotion || trigger === "mount") {
            setRevealed(true);
            return;
        }
        if (revealed || !containerRef.current) return;

        const el = containerRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setRevealed(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
        );
        observer.observe(el);

        return () => observer.disconnect();
    }, [reducedMotion, trigger, revealed]);

    return (
        <Tag ref={containerRef} className={className}>
            {lines.map((line, idx) => (
                <span
                    key={idx}
                    className="block overflow-hidden pt-[0.1em] -mt-[0.1em] pb-[0.14em] -mb-[0.14em]"
                >
                    <span
                        data-mask-line
                        style={
                            !reducedMotion
                                ? {
                                      transitionDelay: `${idx * 65 + Math.round(delay * 1000)}ms`,
                                  }
                                : undefined
                        }
                        className={`block ${
                            trigger === "mount"
                                ? !reducedMotion
                                    ? "yvs-exp-hero-line"
                                    : ""
                                : !reducedMotion
                                  ? `yvs-exp-scroll-line ${revealed ? "is-revealed" : ""}`
                                  : ""
                        } ${lineClassName} ${idx === accentLineIndex ? accentClassName : ""}`}
                    >
                        {line}
                    </span>
                </span>
            ))}
        </Tag>
    );
}
