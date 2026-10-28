import React from "react";

/**
 * Standardized Table Container
 *
 * Provides responsive scroll containment, sticky header positioning,
 * touch momentum scrolling for mobile, and clean layout boundaries for all data tables.
 *
 * @param {React.ReactNode} children - Table element or content
 * @param {React.ReactNode} footer - Standardized Pagination or footer element
 * @param {string} maxHeight - Max vertical height constraint
 * @param {string} className - Additional CSS classes
 */
export default function TableContainer({
    children,
    footer,
    maxHeight = "max-h-[calc(100dvh-260px)] lg:max-h-[calc(100vh-280px)]",
    minHeight = "min-h-[220px] sm:min-h-[280px]",
    className = "",
}) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full max-w-full ${className}`}>
            {/* Scrollable Table Area with Contained Horizontal & Vertical Momentum Scroll */}
            <div 
                className={`w-full max-w-full overflow-x-auto overflow-y-auto ${minHeight} ${maxHeight} custom-scrollbar relative overscroll-x-contain`}
                style={{ WebkitOverflowScrolling: "touch" }}
            >
                {children}
            </div>

            {/* Sticky/Fixed Footer (e.g. Pagination) outside scroll area so it is always accessible */}
            {footer && <div className="shrink-0 border-t border-slate-100">{footer}</div>}
        </div>
    );
}
