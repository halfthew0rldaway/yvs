import React, { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";

/**
 * HolographicTiltCard
 * Apple Card / Stripe Press physical certificate specimen card with 3D spring tilt,
 * authentic pearl-silver specular glare, subtle holographic security thread, and optional
 * ticket perforation notches. Strictly free of cheap oversaturated neon/AI-slop.
 */
export default function HolographicTiltCard({
    children,
    className = "",
    isPerforated = false,
    perforationPosition = "35%", // Position of the tear-line notches
    maxTilt = 7, // Max degrees of tilt
    elevation = 16, // Z-axis lift in pixels for parallax
    foilType = "silver", // "silver" | "emerald" | "amber" | "slate"
    ...props
}) {
    const cardRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    // Normalized mouse position (0.0 to 1.0)
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Spring physics configuration (snappy yet smooth)
    const springConfig = { stiffness: 320, damping: 28, mass: 0.8 };

    // 3D Rotation angles
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [maxTilt, -maxTilt]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [0, 1], [-maxTilt, maxTilt]), springConfig);

    // Specular Glare Coordinates in percentages
    const glareX = useTransform(mouseX, [0, 1], [0, 100]);
    const glareY = useTransform(mouseY, [0, 1], [0, 100]);

    // Dynamic Framer Motion templates for authentic specular light reflection
    const silverGlare = useMotionTemplate`radial-gradient(circle 380px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.35) 0%, rgba(241, 245, 249, 0.08) 40%, transparent 70%)`;
    const emeraldGlare = useMotionTemplate`radial-gradient(circle 380px at ${glareX}% ${glareY}%, rgba(167, 243, 208, 0.30) 0%, rgba(255, 255, 255, 0.12) 35%, transparent 70%)`;
    const amberGlare = useMotionTemplate`radial-gradient(circle 380px at ${glareX}% ${glareY}%, rgba(254, 215, 170, 0.30) 0%, rgba(255, 255, 255, 0.12) 35%, transparent 70%)`;
    const slateGlare = useMotionTemplate`radial-gradient(circle 380px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.22) 0%, rgba(203, 213, 225, 0.06) 45%, transparent 70%)`;

    const glareBackground = foilType === "emerald" 
        ? emeraldGlare 
        : foilType === "amber" 
        ? amberGlare 
        : foilType === "slate" 
        ? slateGlare 
        : silverGlare;

    // Handle mouse move
    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const normalizedX = Math.min(Math.max(clientX / rect.width, 0), 1);
        const normalizedY = Math.min(Math.max(clientY / rect.height, 0), 1);

        mouseX.set(normalizedX);
        mouseY.set(normalizedY);
    }, [mouseX, mouseY]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        mouseX.set(0.5);
        mouseY.set(0.5);
    }, [mouseX, mouseY]);

    return (
        <div style={{ perspective: 1200 }} className="w-full">
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                }}
                className={`relative rounded-3xl border border-slate-200/90 bg-white shadow-md transition-shadow duration-300 hover:shadow-2xl overflow-hidden will-change-transform ${className}`}
                {...props}
            >
                {/* Micro-guilloché Security Watermark Pattern (Genuine physical certificate accent) */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] select-none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="guilloche-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path
                                d="M0 20 Q 10 0, 20 20 T 40 20 M20 0 Q 0 10, 20 20 T 20 40"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.75"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#guilloche-grid)" className="text-slate-900" />
                </svg>

                {/* Perforated Boarding Pass Notches (Ticket Tear-Strip Cutouts) */}
                {isPerforated && (
                    <>
                        <div 
                            className="absolute -left-3.5 w-7 h-7 rounded-full bg-slate-50 border border-slate-200/90 z-20 shadow-inner" 
                            style={{ top: perforationPosition }}
                        />
                        <div 
                            className="absolute -right-3.5 w-7 h-7 rounded-full bg-slate-50 border border-slate-200/90 z-20 shadow-inner" 
                            style={{ top: perforationPosition }}
                        />
                        <div 
                            className="absolute left-4 right-4 border-b border-dashed border-slate-200 z-10 pointer-events-none" 
                            style={{ top: `calc(${perforationPosition} + 13px)` }}
                        />
                    </>
                )}

                {/* Specular Glare & Anisotropic Light Sheen (Follows cursor angle) */}
                <motion.div
                    className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-opacity duration-300 mix-blend-soft-light"
                    style={{
                        opacity: isHovered ? 1 : 0.25,
                        background: glareBackground
                    }}
                />

                {/* Floating 3D Parallax Surface */}
                <div
                    style={{
                        transform: `translateZ(${elevation}px)`,
                        transformStyle: "preserve-3d"
                    }}
                    className="relative z-10 w-full h-full"
                >
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
