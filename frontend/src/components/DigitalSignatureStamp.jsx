import React from "react";
import { PenTool, CheckCheck } from "lucide-react";

/**
 * Official Workshop Seal & Calligraphy Signature
 */
export function WorkshopSignatureStamp({
    isDigital = true,
    onToggle,
    role = "Kasir • Admin Teknis",
    name = "Yangversa Computer",
    className = "",
    showToggleAtSpot = true
}) {
    return (
        <div className={`flex flex-col items-center justify-end text-center min-w-[150px] print:min-w-[120px] ${className}`}>
            {/* Direct spot toggle button (Screen Only, hidden in print) */}
            {showToggleAtSpot && onToggle && (
                <div className="print:hidden mb-1.5 select-none">
                    <button
                        type="button"
                        onClick={onToggle}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                            isDigital
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Klik untuk beralih antara TTD Digital dan TTD Fisik (Cetak)"
                    >
                        <PenTool className="w-2.5 h-2.5 text-blue-600" />
                        <span>{isDigital ? "TTD Digital: ON" : "TTD Fisik (Cetak)"}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${isDigital ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    </button>
                </div>
            )}

            <p className="text-slate-500 text-[11px] print:text-[8.5px] font-medium mb-1">
                {role}
            </p>

            {/* Signature & Stamp Space */}
            <div className="relative h-20 print:h-16 w-full flex items-center justify-center">
                {isDigital ? (
                    <div className="relative flex items-center justify-center w-full h-full select-none">
                        {/* Official Workshop Seal Stamp (Navy Ink) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg 
                                viewBox="0 0 140 140" 
                                className="w-20 h-20 print:w-16 print:h-16 text-blue-800/85 -rotate-6"
                            >
                                <circle cx="70" cy="70" r="64" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 1.5" />
                                <circle cx="70" cy="70" r="58" fill="none" stroke="currentColor" strokeWidth="1.2" />
                                
                                <path id="wsUpperRing" d="M 22,70 A 48,48 0 0,1 118,70" fill="none" />
                                <text className="text-[9px] font-black uppercase tracking-wider fill-current">
                                    <textPath href="#wsUpperRing" startOffset="50%" textAnchor="middle">
                                        YANGVERSA COMPUTER
                                    </textPath>
                                </text>
                                
                                <path id="wsLowerRing" d="M 118,70 A 48,48 0 0,1 22,70" fill="none" />
                                <text className="text-[8px] font-bold tracking-widest fill-current">
                                    <textPath href="#wsLowerRing" startOffset="50%" textAnchor="middle">
                                        ★ KOMPUTERAWET.COM ★
                                    </textPath>
                                </text>

                                <rect x="24" y="56" width="92" height="28" rx="4" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.2" />
                                <text x="70" y="68" textAnchor="middle" className="text-[8.5px] font-black fill-current uppercase tracking-wider">
                                    RESMI & SAH
                                </text>
                                <text x="70" y="78" textAnchor="middle" className="text-[7px] font-bold fill-current tracking-wider">
                                    VERIFIED WORKSHOP
                                </text>
                            </svg>
                        </div>

                        {/* Authorized Signature Stroke */}
                        <div className="relative z-10 -ml-2">
                            <svg 
                                viewBox="0 0 160 60" 
                                className="w-28 h-12 print:w-24 print:h-10 text-blue-900"
                            >
                                <path
                                    d="M 12,38 Q 35,10 50,30 T 75,25 Q 90,5 105,35 Q 120,45 145,20 Q 155,10 135,35 Q 110,50 85,45 Q 60,40 142,42"
                                    fill="none"
                                    stroke="#1d4ed8"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        {/* Verified Pill Badge */}
                        <div className="absolute -bottom-1 z-20 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-blue-50/95 text-blue-700 border border-blue-200 text-[8.5px] font-bold shadow-2xs">
                            <CheckCheck className="w-2.5 h-2.5 text-blue-600" />
                            <span>Digital Verified</span>
                        </div>
                    </div>
                ) : (
                    /* Mode Fisik (Cetak di Kertas) - Kosong untuk tanda tangan basah & stempel manual */
                    <div className="w-full h-full flex items-end justify-center pb-1 border-b border-dashed border-slate-300 print:border-none">
                        <span className="text-[10px] print:text-[8px] text-slate-300 print:text-slate-200 italic select-none">
                            [ Cap & Paraf Toko ]
                        </span>
                    </div>
                )}
            </div>

            {/* Baseline Name */}
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 mt-1 text-xs print:text-[9px] w-full">
                {name}
            </p>
        </div>
    );
}

/**
 * Top Control Bar Toggle Button (Screen Only)
 */
export function DigitalSignatureToggleBar({ isDigital, onToggle }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs select-none ${
                isDigital 
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title="Aktifkan untuk nota/garansi bertanda tangan digital resmi toko, matikan jika akan dicetak untuk stempel & paraf fisik manual"
        >
            <PenTool className={`w-3.5 h-3.5 ${isDigital ? "text-blue-600" : "text-slate-400"}`} />
            <span>TTD Digital Toko: <strong>{isDigital ? "ON" : "OFF (Cetak Fisik)"}</strong></span>
            <span className={`w-2 h-2 rounded-full ${isDigital ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
        </button>
    );
}

