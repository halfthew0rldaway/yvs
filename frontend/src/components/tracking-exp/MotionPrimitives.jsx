import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

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
 * Smooth scrolling via Lenis synced cleanly into GSAP ScrollTrigger.
 * Automatically disabled under prefers-reduced-motion or on touch devices
 * so native mobile touch inertia remains 100% predictable.
 */
export function useLenisSmoothScroll(enabled = true) {
    const lenisRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (!enabled || reducedMotion || typeof window === "undefined") return;
        const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        if (isCoarsePointer) return;

        const lenis = new Lenis({
            duration: 1.05,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 0.95,
            touchMultiplier: 1.4,
        });

        lenisRef.current = lenis;
        window.__yvsLenis = lenis;

        lenis.on("scroll", ScrollTrigger.update);

        const tick = (time) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(tick);
            lenis.destroy();
            lenisRef.current = null;
            if (window.__yvsLenis === lenis) delete window.__yvsLenis;
        };
    }, [enabled, reducedMotion]);

    return lenisRef;
}

/**
 * Helper to scroll smoothly to a target element or Y offset, respecting Lenis if active.
 */
export function smoothScrollToTarget(target, offset = -72) {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lenis = window.__yvsLenis;

    if (target === 0 || target === "top") {
        if (lenis && !reduced) {
            lenis.scrollTo(0, { duration: 1.0 });
        } else {
            window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        }
        return;
    }

    const el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el) return;

    if (lenis && !reduced) {
        lenis.scrollTo(el, { offset, duration: 1.05 });
    } else {
        const y = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
    }
}

/**
 * Scroll Progress Indicator with native CSS Scroll-Driven Animation
 * plus lightweight JS fallback for browsers without animation-timeline: scroll().
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
 * Subtle magnetic button/link wrapper for fine pointers (desktop).
 * Zero layout impact; strictly transform-only on compositor.
 */
export function MagneticWrap({ children, strength = 0.22, className = "" }) {
    const wrapRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined") return;
        if (!window.matchMedia("(pointer: fine)").matches) return;
        const el = wrapRef.current;
        if (!el) return;

        const onMove = (e) => {
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - (rect.left + rect.width / 2);
            const relY = e.clientY - (rect.top + rect.height / 2);
            gsap.to(el, {
                x: relX * strength,
                y: relY * strength,
                duration: 0.35,
                ease: "power3.out",
                overwrite: "auto",
            });
        };

        const onLeave = () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.65,
                ease: "elastic.out(1, 0.45)",
                overwrite: "auto",
            });
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
            gsap.killTweensOf(el);
        };
    }, [strength, reducedMotion]);

    return (
        <div ref={wrapRef} className={`inline-block will-change-transform ${className}`}>
            {children}
        </div>
    );
}

/**
 * Editorial Masked Typography Reveal.
 * Splits provided lines into overflow-hidden masks and choreographs upward slide.
 * Always keeps final visible state immediately under prefers-reduced-motion.
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

    useEffect(() => {
        if (reducedMotion || !containerRef.current) return;
        const innerLines = containerRef.current.querySelectorAll("[data-mask-line]");
        if (!innerLines.length) return;

        const ctx = gsap.context(() => {
            if (trigger === "mount") {
                gsap.fromTo(
                    innerLines,
                    { yPercent: 108, opacity: 0.001 },
                    {
                        yPercent: 0,
                        opacity: 1,
                        duration: 0.9,
                        stagger: 0.09,
                        delay,
                        ease: "power4.out",
                    }
                );
            } else {
                gsap.fromTo(
                    innerLines,
                    { yPercent: 105, opacity: 0.001 },
                    {
                        yPercent: 0,
                        opacity: 1,
                        duration: 0.85,
                        stagger: 0.08,
                        ease: "power4.out",
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: "top 86%",
                            once: true,
                        },
                    }
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, [reducedMotion, trigger, delay]);

    return (
        <Tag ref={containerRef} className={className}>
            {lines.map((line, idx) => (
                <span key={idx} className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
                    <span
                        data-mask-line
                        className={`block will-change-transform ${lineClassName} ${
                            idx === accentLineIndex ? accentClassName : ""
                        }`}
                    >
                        {line}
                    </span>
                </span>
            ))}
        </Tag>
    );
}
