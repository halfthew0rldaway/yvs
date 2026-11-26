import { useEffect, useRef, useState } from "react";
import { MOTION_TOKENS, loadGsapRuntime } from "./motionTokens";

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
 * Smooth scrolling via dynamically imported Lenis synced cleanly into GSAP ticker.
 * Boots on first wheel/scroll interaction on desktop fine pointers so initial
 * mobile/desktop load incurs zero TBT/LCP overhead.
 */
export function useLenisSmoothScroll(enabled = true) {
    const lenisRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (!enabled || reducedMotion || typeof window === "undefined") return;
        if (window.matchMedia("(pointer: coarse)").matches) return;

        let cancelled = false;
        let booted = false;
        let cleanupFn = null;

        const boot = async () => {
            if (booted || cancelled) return;
            booted = true;
            const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([
                import("lenis"),
                loadGsapRuntime(),
            ]);
            if (cancelled) return;

            const lenis = new Lenis({
                duration: 1.0,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: "vertical",
                gestureOrientation: "vertical",
                smoothWheel: true,
                wheelMultiplier: 0.95,
            });

            lenisRef.current = lenis;
            window.__yvsLenis = lenis;
            window.__yvsScrollVelocity = 0;

            lenis.on("scroll", (e) => {
                window.__yvsScrollVelocity = e?.velocity || 0;
                ScrollTrigger.update();
            });

            const tick = (time) => {
                lenis.raf(time * 1000);
            };
            gsap.ticker.add(tick);
            gsap.ticker.lagSmoothing(0);

            let resizeTimer = null;
            const onResize = () => {
                if (resizeTimer) window.clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(() => {
                    ScrollTrigger.refresh();
                }, 180);
            };
            window.addEventListener("resize", onResize, { passive: true });

            cleanupFn = () => {
                window.removeEventListener("resize", onResize);
                if (resizeTimer) window.clearTimeout(resizeTimer);
                gsap.ticker.remove(tick);
                lenis.destroy();
                lenisRef.current = null;
                if (window.__yvsLenis === lenis) delete window.__yvsLenis;
                window.__yvsScrollVelocity = 0;
            };
        };

        const onIntent = () => {
            boot().catch(() => {});
        };

        window.addEventListener("wheel", onIntent, { passive: true, once: true });
        window.addEventListener("scroll", onIntent, { passive: true, once: true });

        return () => {
            cancelled = true;
            window.removeEventListener("wheel", onIntent);
            window.removeEventListener("scroll", onIntent);
            if (cleanupFn) cleanupFn();
        };
    }, [enabled, reducedMotion]);

    return lenisRef;
}

/**
 * Scroll smoothly to a target element or Y offset, respecting Lenis & reduced motion.
 */
export function smoothScrollToTarget(target, offset = -72) {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lenis = window.__yvsLenis;

    if (target === 0 || target === "top") {
        if (lenis && !reduced) {
            lenis.scrollTo(0, { duration: 0.95 });
        } else {
            window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        }
        return;
    }

    const el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el) return;

    if (lenis && !reduced) {
        lenis.scrollTo(el, { offset, duration: 1.0 });
    } else {
        const y = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
    }
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
 * Subtle custom cursor strictly for desktop fine pointer devices.
 * Loads GSAP lazily on first pointer move so mobile and cold loads pay zero cost.
 */
export function EditorialCursor() {
    const dotRef = useRef(null);
    const labelRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (reducedMotion || typeof window === "undefined") return;
        const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
        if (!mq.matches) return;
        setEnabled(true);

        let cancelled = false;
        let booted = false;
        let cleanup = null;

        const bootWithFirstEvent = (firstEvent) => {
            if (booted || cancelled) return;
            booted = true;
            loadGsapRuntime().then(({ gsap }) => {
                if (cancelled || !dotRef.current || !labelRef.current) return;
                const dot = dotRef.current;
                const badge = labelRef.current;

                const xTo = gsap.quickTo(dot, "x", { duration: 0.22, ease: "power3.out" });
                const yTo = gsap.quickTo(dot, "y", { duration: 0.22, ease: "power3.out" });

                const onMove = (e) => {
                    dot.style.opacity = "1";
                    xTo(e.clientX);
                    yTo(e.clientY);

                    const target = e.target?.closest?.("[data-cursor]");
                    const cursorText = target?.getAttribute("data-cursor") || "";
                    if (cursorText) {
                        badge.textContent = cursorText;
                        dot.dataset.state = "label";
                    } else if (e.target?.closest?.("a, button, input, [role='tab'], [role='slider']")) {
                        badge.textContent = "";
                        dot.dataset.state = "interactive";
                    } else {
                        badge.textContent = "";
                        dot.dataset.state = "default";
                    }
                };

                const onLeave = () => {
                    dot.style.opacity = "0";
                };

                onMove(firstEvent);
                window.addEventListener("pointermove", onMove, { passive: true });
                document.addEventListener("pointerleave", onLeave);

                cleanup = () => {
                    window.removeEventListener("pointermove", onMove);
                    document.removeEventListener("pointerleave", onLeave);
                };
            });
        };

        window.addEventListener("pointermove", bootWithFirstEvent, { passive: true, once: true });

        return () => {
            cancelled = true;
            window.removeEventListener("pointermove", bootWithFirstEvent);
            if (cleanup) cleanup();
        };
    }, [reducedMotion]);

    if (!enabled || reducedMotion) return null;

    return (
        <div
            ref={dotRef}
            data-state="default"
            aria-hidden="true"
            className="yvs-exp-cursor fixed top-0 left-0 z-[90] pointer-events-none opacity-0"
        >
            <span ref={labelRef} className="yvs-exp-cursor-label" />
        </div>
    );
}

/**
 * Subtle magnetic button/link wrapper for fine pointers (desktop).
 * Loads GSAP lazily only on pointerenter so initial page load has zero GSAP cost.
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
        let loading = false;
        let cancelled = false;

        const ensureGsap = () => {
            if (gsapRef || loading) return;
            loading = true;
            loadGsapRuntime().then(({ gsap }) => {
                if (!cancelled) gsapRef = gsap;
            });
        };

        const onMove = (e) => {
            ensureGsap();
            if (!gsapRef) return;
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - (rect.left + rect.width / 2);
            const relY = e.clientY - (rect.top + rect.height / 2);
            gsapRef.to(el, {
                x: relX * strength,
                y: relY * strength,
                duration: 0.32,
                ease: "power3.out",
                overwrite: "auto",
            });
        };

        const onLeave = () => {
            if (!gsapRef) return;
            gsapRef.to(el, {
                x: 0,
                y: 0,
                duration: 0.58,
                ease: "elastic.out(1, 0.45)",
                overwrite: "auto",
            });
        };

        el.addEventListener("pointerenter", ensureGsap, { passive: true, once: true });
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
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
 * Editorial Masked Typography Reveal powered by GSAP SplitText + CustomEase.
 * - Hero `trigger="mount"` stays visible immediately at opacity 1 for instant LCP.
 * - Below-the-fold `trigger="scroll"` activates via IntersectionObserver so GSAP
 *   never runs during initial load, and passes `aria: "none"` to SplitText so ARIA
 *   audits score 100/100.
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
        if (reducedMotion || !containerRef.current || trigger === "mount") return;

        let cancelled = false;
        let ctx = null;
        let splitInstances = [];
        const el = containerRef.current;

        const runReveal = () => {
            loadGsapRuntime().then(({ gsap, SplitText }) => {
                if (cancelled || !containerRef.current) return;
                const innerLines = containerRef.current.querySelectorAll("[data-mask-line]");
                if (!innerLines.length) return;

                ctx = gsap.context(() => {
                    const targets = [];
                    innerLines.forEach((lineEl) => {
                        try {
                            const split = new SplitText(lineEl, { type: "words", aria: "none" });
                            splitInstances.push(split);
                            if (split.words?.length) {
                                targets.push(...split.words);
                                return;
                            }
                        } catch (_) {}
                        targets.push(lineEl);
                    });

                    gsap.fromTo(
                        targets,
                        { yPercent: 105, opacity: 0.001 },
                        {
                            yPercent: 0,
                            opacity: 1,
                            duration: MOTION_TOKENS.duration.slow,
                            stagger: MOTION_TOKENS.stagger.tight,
                            delay,
                            ease: MOTION_TOKENS.ease.gsapEditorial,
                            clearProps: "transform",
                        }
                    );
                }, containerRef);
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    observer.disconnect();
                    runReveal();
                }
            },
            { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
        );

        observer.observe(el);

        return () => {
            cancelled = true;
            observer.disconnect();
            splitInstances.forEach((s) => {
                try {
                    s.revert();
                } catch (_) {}
            });
            if (ctx) ctx.revert();
        };
    }, [reducedMotion, trigger, delay]);

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
                            trigger === "mount" && !reducedMotion
                                ? { animationDelay: `${idx * 65 + delay * 1000}ms` }
                                : undefined
                        }
                        className={`block ${
                            trigger === "mount" && !reducedMotion ? "yvs-exp-hero-line" : ""
                        } ${lineClassName} ${idx === accentLineIndex ? accentClassName : ""}`}
                    >
                        {line}
                    </span>
                </span>
            ))}
        </Tag>
    );
}
