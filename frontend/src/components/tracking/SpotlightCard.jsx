import React, { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

/**
 * SpotlightCard
 * Industrial, Apple/Linear-grade card container with an interactive 1px spotlight border
 * and subtle ambient surface illumination following cursor coordinates.
 * Strictly avoids oversaturated neon/AI-slop gradients.
 */
export default function SpotlightCard({
    children,
    className = "",
    spotlightColor = "rgba(59, 130, 246, 0.14)", // Elegant engineering sapphire
    borderColor = "rgba(59, 130, 246, 0.35)",
    ...props
}) {
    const cardRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    // Mouse coordinates relative to card element
    const mouseX = useMotionValue(-1000);
    const mouseY = useMotionValue(-1000);

    // Spring smoothed positions for velvety responsiveness
    const smoothX = useSpring(mouseX, { stiffness: 400, damping: 35 });
    const smoothY = useSpring(mouseY, { stiffness: 400, damping: 35 });

    // Dynamic Framer Motion templates for 60fps GPU acceleration
    const bgSurface = useMotionTemplate`radial-gradient(520px circle at ${smoothX}px ${smoothY}px, ${spotlightColor}, transparent 75%)`;
    const bgBorder = useMotionTemplate`radial-gradient(340px circle at ${smoothX}px ${smoothY}px, ${borderColor}, transparent 70%) border-box`;

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    }, [mouseX, mouseY]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        mouseX.set(-1000);
        mouseY.set(-1000);
    }, [mouseX, mouseY]);

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative group rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-shadow duration-300 hover:shadow-md overflow-hidden ${className}`}
            {...props}
        >
            {/* 1. Subtle Radial Ambient Spotlight (Surface Fill) */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-500 ease-out z-0"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: bgSurface
                }}
            />

            {/* 2. Interactive 1px Precision Border Glow */}
            <motion.div
                className="pointer-events-none absolute inset-0 rounded-[inherit] z-10 transition-opacity duration-300"
                style={{
                    opacity: isHovered ? 1 : 0,
                    border: "1px solid transparent",
                    background: bgBorder,
                    WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude"
                }}
            />

            {/* Card Content */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}
