import React from "react";
import { PenTool, CheckCheck, UserCheck, Pencil } from "lucide-react";
import { DEFAULT_WORKSHOP_SIGNATURE } from "./AdminSignatureSelectorModal";

/**
 * Pure Workshop Staff Digital Signature (Zero Stamp, Pure Authentic Signature)
 * 100% clean - Zero interactive buttons inside the document sheet.
 */
export function WorkshopSignatureStamp({
    isDigital = true,
    role = "Petugas Workshop • Kasir",
    name = "Yangversa Computer",
    signature = null,
    className = ""
}) {
    const activeSignature = signature || DEFAULT_WORKSHOP_SIGNATURE;

    return (
        <div className={`flex flex-col items-center justify-end text-center w-36 sm:w-44 print:w-32 select-none ${className}`}>
            {/* Role Header */}
            <p className="text-slate-600 text-xs print:text-[8.5px] font-semibold mb-1">
                {role}
            </p>

            {/* Pure Signature Space */}
            <div className="h-20 print:h-14 w-full flex items-center justify-center relative">
                {isDigital ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                        <img
                            src={activeSignature}
                            alt={`TTD ${name}`}
                            className="max-h-16 print:max-h-12 max-w-[140px] print:max-w-[105px] object-contain filter"
                        />
                    </div>
                ) : (
                    /* Mode Fisik (Cetak di Kertas) - Kosong untuk tanda tangan basah */
                    <div className="w-full h-full flex items-end justify-center pb-2 border-b border-dashed border-slate-300 print:border-none">
                        <span className="text-3xs print:text-[8px] text-slate-300 print:text-slate-200 italic">
                            [ Tanda Tangan Fisik ]
                        </span>
                    </div>
                )}
            </div>

            {/* Baseline Line */}
            <div className="w-full border-b border-slate-400 mt-1 mb-1"></div>

            {/* Baseline Name */}
            <p className="font-bold text-slate-900 text-xs print:text-[9px] w-full truncate max-w-[160px]">
                {name}
            </p>
            <p className="text-3xs print:text-[7.5px] text-slate-400 mt-0.5">
                Yangversa Computer
            </p>
        </div>
    );
}

/**
 * Top Control Bar Toggle Button (Lives OUTSIDE the invoice in the control toolbar)
 */
export function DigitalSignatureToggleBar({ isDigital, onToggle, onOpenSelector, adminName }) {
    return (
        <div className="inline-flex items-center gap-1.5 select-none">
            <button
                type="button"
                onClick={onToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
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
                    <span className="inline-flex items-center gap-1">
                        Petugas: {adminName || "Pilih"}
                        <Pencil className="w-2.5 h-2.5 text-indigo-500" />
                    </span>
                </button>
            )}
        </div>
    );
}
