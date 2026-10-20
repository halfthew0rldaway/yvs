import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Standardized Pagination Component across all tables in the application.
 *
 * @param {number} currentPage - Active page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total count of records matching current filters
 * @param {number} pageSize - Number of items displayed per page
 * @param {function} onPageChange - Callback when page changes (newPage) => void
 * @param {function} onPageSizeChange - Callback when page size changes (newSize) => void
 * @param {string} unitLabel - Label for records, e.g. "pelanggan", "tiket", "perangkat"
 * @param {boolean} disabled - Disable all controls while fetching
 * @param {number[]} pageSizeOptions - Array of available page size options [10, 25, 50, 100]
 */
export default function Pagination({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    unitLabel = "entri",
    disabled = false,
    pageSizeOptions = [10, 25, 50, 100],
}) {
    if (totalItems === 0) return null;

    const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
    const startIndex = Math.min((safeCurrentPage - 1) * pageSize + 1, totalItems);
    const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

    // Calculate smart page number array with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxVisibleButtons = 5;

        if (totalPages <= maxVisibleButtons + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (safeCurrentPage > 3) pages.push("...");

            const start = Math.max(2, safeCurrentPage - 1);
            const end = Math.min(totalPages - 1, safeCurrentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (safeCurrentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 select-none">
            {/* Left: Total Records & Page Size Selector */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                <div>
                    Menampilkan <span className="font-semibold text-slate-900">{startIndex}</span> -{" "}
                    <span className="font-semibold text-slate-900">{endIndex}</span> dari{" "}
                    <span className="font-semibold text-slate-900">{totalItems}</span> {unitLabel}
                </div>

                {onPageSizeChange && (
                    <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-300">
                        <label htmlFor="page-size-select" className="text-slate-500 whitespace-nowrap">
                            Per hal:
                        </label>
                        <select
                            id="page-size-select"
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            disabled={disabled}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right: Navigation Controls */}
            <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
                {/* First Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={disabled || safeCurrentPage <= 1}
                    aria-label="Halaman Pertama"
                    title="Halaman Pertama"
                    className="hidden sm:inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                    disabled={disabled || safeCurrentPage <= 1}
                    aria-label="Halaman Sebelumnya"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                {/* Mobile Current Page Indicator */}
                <div className="sm:hidden px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                    {safeCurrentPage} / {totalPages}
                </div>

                {/* Desktop Page Numbers */}
                <div className="hidden sm:flex items-center gap-1">
                    {pages.map((p, idx) => {
                        if (p === "...") {
                            return (
                                <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 select-none">
                                    …
                                </span>
                            );
                        }
                        const isCurrent = p === safeCurrentPage;
                        return (
                            <button
                                key={`page-${p}`}
                                type="button"
                                onClick={() => onPageChange(p)}
                                disabled={disabled || isCurrent}
                                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                                    isCurrent
                                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 pointer-events-none"
                                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600"
                                }`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                {/* Next Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                    disabled={disabled || safeCurrentPage >= totalPages}
                    aria-label="Halaman Selanjutnya"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={disabled || safeCurrentPage >= totalPages}
                    aria-label="Halaman Terakhir"
                    title="Halaman Terakhir"
                    className="hidden sm:inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

