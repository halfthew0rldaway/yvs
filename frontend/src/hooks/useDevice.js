import { useState, useEffect } from "react";

/**
 * Robust, high-performance Device & Mobile Detection Hook
 *
 * Detects:
 * - isMobile: screen width <= 768px OR mobile User-Agent / touch-first form factor
 * - isTablet: screen width > 768px && <= 1024px
 * - isDesktop: screen width > 1024px
 * - isTouch: touch-capable display (phones, tablets, touch laptops)
 * - isIOS: iPad, iPhone, iPod detection
 * - isAndroid: Android browser detection
 * - orientation: 'portrait' | 'landscape'
 * - screenWidth & screenHeight: live dimensions
 */
export function useDevice() {
    const [deviceState, setDeviceState] = useState(() => {
        if (typeof window === "undefined") {
            return {
                isMobile: false,
                isTablet: false,
                isDesktop: true,
                isTouch: false,
                isIOS: false,
                isAndroid: false,
                orientation: "landscape",
                width: 1200,
                height: 800,
                deviceType: "desktop",
            };
        }

        const ua = navigator.userAgent || navigator.vendor || window.opera || "";
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        const isAndroid = /Android/.test(ua);
        const isTouch = 
            "ontouchstart" in window || 
            navigator.maxTouchPoints > 0 || 
            (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobileByWidth = width <= 768;
        const isTabletByWidth = width > 768 && width <= 1024;
        const isDesktopByWidth = width > 1024;

        // Mobile is true if screen is <= 768px OR explicitly a mobile UA on portrait/landscape
        const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isMobile = isMobileByWidth || (isMobileUA && width <= 850);
        const isTablet = !isMobile && (isTabletByWidth || /iPad|Tablet/i.test(ua));
        const isDesktop = !isMobile && !isTablet && isDesktopByWidth;

        let deviceType = "desktop";
        if (isMobile) deviceType = "mobile";
        else if (isTablet) deviceType = "tablet";

        return {
            isMobile,
            isTablet,
            isDesktop,
            isTouch,
            isIOS,
            isAndroid,
            orientation: height >= width ? "portrait" : "landscape",
            width,
            height,
            deviceType,
        };
    });

    useEffect(() => {
        if (typeof window === "undefined") return;

        let timeoutId = null;

        const updateDevice = () => {
            const ua = navigator.userAgent || navigator.vendor || window.opera || "";
            const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
            const isAndroid = /Android/.test(ua);
            const isTouch =
                "ontouchstart" in window ||
                navigator.maxTouchPoints > 0 ||
                (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

            const width = window.innerWidth;
            const height = window.innerHeight;
            const isMobileByWidth = width <= 768;
            const isTabletByWidth = width > 768 && width <= 1024;
            const isDesktopByWidth = width > 1024;

            const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            const isMobile = isMobileByWidth || (isMobileUA && width <= 850);
            const isTablet = !isMobile && (isTabletByWidth || /iPad|Tablet/i.test(ua));
            const isDesktop = !isMobile && !isTablet && isDesktopByWidth;

            let deviceType = "desktop";
            if (isMobile) deviceType = "mobile";
            else if (isTablet) deviceType = "tablet";

            // Mark document element with data-device for CSS selectors
            document.documentElement.setAttribute("data-device", deviceType);
            if (isMobile) {
                document.documentElement.classList.add("is-mobile");
                document.documentElement.classList.remove("is-desktop");
            } else {
                document.documentElement.classList.add("is-desktop");
                document.documentElement.classList.remove("is-mobile");
            }

            setDeviceState({
                isMobile,
                isTablet,
                isDesktop,
                isTouch,
                isIOS,
                isAndroid,
                orientation: height >= width ? "portrait" : "landscape",
                width,
                height,
                deviceType,
            });
        };

        // Debounced resize listener for performance
        const handleResize = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                window.requestAnimationFrame(updateDevice);
            }, 100);
        };

        // Initial tag
        updateDevice();

        window.addEventListener("resize", handleResize, { passive: true });
        window.addEventListener("orientationchange", handleResize, { passive: true });

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);
        };
    }, []);

    return deviceState;
}

/**
 * Convenient shorthand hook to check if user is on mobile
 * @returns {boolean}
 */
export function useIsMobile() {
    const { isMobile } = useDevice();
    return isMobile;
}

export default useDevice;

