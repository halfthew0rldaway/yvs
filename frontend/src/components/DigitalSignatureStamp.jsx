import React from "react";
import { PenTool, CheckCheck, UserCheck } from "lucide-react";
import { DEFAULT_WORKSHOP_SIGNATURE } from "./AdminSignatureSelectorModal";

/**
 * Pure Workshop Staff Digital Signature (Zero Stamp / Pure Signature)
 */
export function WorkshopSignatureStamp({
    isDigital = true,
    onToggle,
    role = "Petugas Workshop • Kasir",
    name = "Yangversa Computer",
    signature = null,
    onOpenSelector,
    className = "",
    showToggleAtSpot = true
}) {
    const activeSignature = signature || DEFAULT_WORKSHOP_SIGNATURE;

    return (
        <div className={`flex flex-col items-center justify-end text-center min-w-[150px] print:min-w-[120px] group relative ${className}`}>
            {/* Spot Action Buttons (Screen Only, Hidden in Print) */}
            <div className="print:hidden mb-1 flex items-center gap-1.5 select-none">
                {showToggleAtSpot && onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                            isDigital
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Klik untuk beralih antara TTD Digital dan TTD Fisik (Cetak)"
                    >
                        <PenTool className="w-2.5 h-2.5 text-blue-600" />
                        <span>{isDigital ? "Digital: ON" : "Fisik"}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${isDigital ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    </button>
                )}

                {isDigital && onOpenSelector && (
                    <button
                        type="button"
                        onClick={onOpenSelector}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer shadow-2xs"
                        title="Pilih atau ganti tanda tangan staf yang bertugas"
                    >
                        <UserCheck className="w-2.5 h-2.5 text-indigo-600" />
                        <span>Pilih Petugas</span>
                    </button>
                )}
            </div>

            <p className="text-slate-500 text-[11px] print:text-[8.5px] font-medium mb-1">
                {role}
            </p>

            {/* Pure Signature Space (No Round Stamp) */}
            <div 
                onClick={isDigital && onOpenSelector ? onOpenSelector : undefined}
                className={`relative h-20 print:h-16 w-full flex items-center justify-center ${
                    isDigital && onOpenSelector ? "cursor-pointer" : ""
                }`}
                title={isDigital && onOpenSelector ? "Klik untuk ganti tanda tangan staf" : undefined}
            >
                {isDigital ? (
                    <div className="relative flex items-center justify-center w-full h-full select-none">
                        {/* Pure Signature Image */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center p-1">
                            <img
                                src={activeSignature}
                                alt={`TTD ${name}`}
                                className="max-h-16 print:max-h-12 max-w-[130px] print:max-w-[110px] object-contain filter"
                            />
                        </div>

                        {/* Verified Pill Badge */}
                        <div className="absolute -bottom-1 z-20 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-blue-50/95 text-blue-700 border border-blue-200 text-[8.5px] print:text-[7.5px] font-bold shadow-2xs">
                            <CheckCheck className="w-2.5 h-2.5 text-blue-600 print:w-2 print:h-2" />
                            <span>Digital Verified</span>
                        </div>
                    </div>
                ) : (
                    /* Mode Fisik (Cetak di Kertas) - Kosong untuk tanda tangan basah */
                    <div className="w-full h-full flex items-end justify-center pb-1 border-b border-dashed border-slate-300 print:border-none">
                        <span className="text-[10px] print:text-[8px] text-slate-300 print:text-slate-200 italic select-none">
                            [ Tanda Tangan Petugas ]
                        </span>
                    </div>
                )}
            </div>

            {/* Baseline Name */}
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 mt-1 text-xs print:text-[9px] w-full truncate max-w-[160px]">
                {name}
            </p>
        </div>
    );
}

/**
 * Top Control Bar Toggle Button (Screen Only)
 */
export function DigitalSignatureToggleBar({ isDigital, onToggle, onOpenSelector, adminName }) {
    return (
        <div className="inline-flex items-center gap-1.5 select-none">
            <button
                type="button"
                onClick={onToggle}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                    isDigital 
                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold" 
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
                title="Aktifkan untuk nota/garansi bertanda tangan digital resmi toko, matikan jika akan dicetak untuk paraf fisik manual"
            >
                <PenTool className={`w-3.5 h-3.5 ${isDigital ? "text-blue-600" : "text-slate-400"}`} />
                <span>TTD Toko: <strong>{isDigital ? "ON (Digital)" : "OFF (Fisik)"}</strong></span>
                <span className={`w-2 h-2 rounded-full ${isDigital ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            </button>

            {isDigital && onOpenSelector && (
                <button
                    type="button"
                    onClick={onOpenSelector}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer shadow-2xs"
                    title="Pilih petugas yang menandatangani dokumen ini"
                >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Petugas: {adminName || "Pilih"}</span>
                </button>
            )}
        </div>
    );
}
