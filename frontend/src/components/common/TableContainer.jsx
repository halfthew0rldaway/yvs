import React from "react";

/**
 * Standardized Table Container
 *
 * Provides responsive scroll containment, sticky header positioning,
 * and clean layout boundaries for all data tables.
 *
 * @param {React.ReactNode} children - Table element or content
 * @param {React.ReactNode} footer - Standardized Pagination or footer element
 * @param {string} maxHeight - Max vertical height constraint, e.g. "max-h-[620px]" or "max-h-[calc(100vh-270px)]"
 * @param {string} className - Additional CSS classes
 */
export default function TableContainer({
    children,
    footer,
    maxHeight = "max-h-[calc(100vh-280px)]",
    minHeight = "min-h-[280px]",
    className = "",
}) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}>
            {/* Scrollable Table Area with Contained Horizontal & Vertical Scroll */}
            <div className={`w-full overflow-x-auto overflow-y-auto ${minHeight} ${maxHeight} custom-scrollbar relative`}>
                {children}
            </div>

            {/* Sticky/Fixed Footer (e.g. Pagination) outside scroll area so it is always accessible */}
            {footer && <div className="shrink-0">{footer}</div>}
        </div>
    );
}

