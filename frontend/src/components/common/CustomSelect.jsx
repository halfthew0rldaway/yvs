import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";

/**
 * CustomSelect - Universal PWA Dropdown & Mobile Bottom-Sheet Picker
 * 
 * Replaces ugly native Android select dialogs with a high-polish,
 * fluid PWA bottom-sheet on phones, and a clean popover on tablets/desktop.
 * 
 * Accepts either:
 * 1. `options` prop: Array of `{ value, label, sublabel, icon }` or strings
 * 2. `children`: Standard `<option value="...">Label</option>` elements
 */
export default function CustomSelect({
    value,
    onChange,
    options,
    children,
    placeholder = "-- Pilih Opsi --",
    label,
    name,
    disabled = false,
    required = false,
    className = "",
    searchable,
    icon: TriggerIcon
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const triggerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Normalize options from either `options` prop or child `<option>` elements
    const normalizedOptions = useMemo(() => {
        if (Array.isArray(options) && options.length > 0) {
            return options.map(opt => {
                if (typeof opt === "object" && opt !== null) {
                    return {
                        value: opt.value ?? "",
                        label: opt.label ?? String(opt.value ?? ""),
                        sublabel: opt.sublabel,
                        disabled: Boolean(opt.disabled)
                    };
                }
                return {
                    value: String(opt),
                    label: String(opt),
                    disabled: false
                };
            });
        }

        if (children) {
            const list = [];
            const childArray = Array.isArray(children) ? children : [children];
            childArray.flat().forEach(child => {
                if (child && child.type === "option") {
                    list.push({
                        value: child.props.value ?? "",
                        label: child.props.children ?? String(child.props.value ?? ""),
                        disabled: Boolean(child.props.disabled)
                    });
                }
            });
            if (list.length > 0) return list;
        }

        return [];
    }, [options, children]);

    // Find currently active option label
    const selectedOption = useMemo(() => {
        return normalizedOptions.find(opt => String(opt.value) === String(value));
    }, [normalizedOptions, value]);

    // Auto-enable search if items count >= 6 unless explicitly specified
    const isSearchable = searchable ?? (normalizedOptions.length >= 6);

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return normalizedOptions;
        const q = searchQuery.toLowerCase();
        return normalizedOptions.filter(opt => 
            String(opt.label).toLowerCase().includes(q) || 
            (opt.sublabel && String(opt.sublabel).toLowerCase().includes(q))
        );
    }, [normalizedOptions, searchQuery]);

    const handleSelect = (opt) => {
        if (opt.disabled) return;
        setIsOpen(false);
        setSearchQuery("");

        if (typeof onChange === "function") {
            // Emulate synthetic event for standard form handlers
            const syntheticEvent = {
                target: { value: opt.value, name: name || "" },
                currentTarget: { value: opt.value, name: name || "" }
            };
            onChange(syntheticEvent);
        }
    };

    // Close on escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // Focus search input when sheet opens
    useEffect(() => {
        if (isOpen && isSearchable) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isSearchable]);

    return (
        <div className="relative w-full">
            {/* Custom Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(prev => !prev)}
                className={`w-full min-h-10 px-3 py-2 bg-white border rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                    disabled 
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200" 
                        : isOpen 
                        ? "border-blue-500 ring-2 ring-blue-500/20" 
                        : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                } ${className}`}
                style={{ fontSize: "0.8125rem", lineHeight: "1.25rem" }}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {TriggerIcon && <TriggerIcon className="w-4 h-4 text-slate-400 shrink-0" />}
                    {selectedOption && selectedOption.value !== "" ? (
                        <span className="truncate text-slate-900 font-medium">
                            {selectedOption.label}
                        </span>
                    ) : (
                        <span className="truncate text-slate-400">
                            {placeholder}
                        </span>
                    )}
                </div>

                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
            </button>

            {/* Hidden native input to preserve HTML5 required validation if needed */}
            {required && (
                <input
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ opacity: 0, height: 0, position: "absolute", pointerEvents: "none" }}
                    value={value || ""}
                    onChange={() => {}}
                    required={required}
                />
            )}

            {/* PWA Sheet / Modal Picker Portal */}
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 select-none animate-in fade-in duration-150">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                        onClick={() => {
                            setIsOpen(false);
                            setSearchQuery("");
                        }}
                    />

                    {/* Bottom Sheet on Mobile / Centered Panel on Desktop */}
                    <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[82dvh] sm:max-h-[70vh] overflow-hidden z-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                        {/* Mobile Drag Handle */}
                        <div className="pt-2.5 pb-1 sm:hidden flex justify-center shrink-0">
                            <div className="w-10 h-1 rounded-full bg-slate-300" />
                        </div>

                        {/* Sheet Header */}
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {label || placeholder.replace(/^-+\s*|\s*-+$/g, "") || "Pilih Opsi"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setSearchQuery("");
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search Input Bar */}
                        {isSearchable && (
                            <div className="p-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
                                <div className="relative flex items-center">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari opsi..."
                                        className="w-full h-8.5 pl-8 pr-8 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Options Scroll List */}
                        <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 divide-y divide-slate-50">
                            {filteredOptions.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    Tidak ada opsi yang sesuai
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = String(opt.value) === String(value);
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={opt.disabled}
                                            onClick={() => handleSelect(opt)}
                                            className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer text-[13px] sm:text-sm active:bg-blue-50 ${
                                                opt.disabled
                                                    ? "opacity-40 cursor-not-allowed bg-slate-50"
                                                    : isSelected
                                                    ? "bg-blue-50 text-blue-700 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50 font-medium"
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate">{opt.label}</div>
                                                {opt.sublabel && (
                                                    <div className="text-3xs text-slate-400 font-normal truncate mt-0.5">
                                                        {opt.sublabel}
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Bottom Safe Area Padding for Phones */}
                        <div className="h-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:hidden shrink-0" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
