import { useState } from "react";
import { 
    X, 
    Share2, 
    Copy, 
    Check, 
    ExternalLink, 
    Sparkles, 
    MessageCircle, 
    Globe, 
    Briefcase,
    Link2
} from "lucide-react";
import toast from "react-hot-toast";
import { generateBroadcastText } from "./jobPresets";

const DEFAULT_PLATFORMS = [
    { name: "Glints", url: "https://employers.glints.id" },
    { name: "Jobstreet", url: "https://www.jobstreet.co.id/employers/" },
    { name: "LinkedIn", url: "https://www.linkedin.com/talent/post-a-job" },
    { name: "KitaLulus", url: "https://bisnis.kitalulus.com" },
    { name: "WhatsApp", url: "https://web.whatsapp.com" }
];

export default function ShareJobModal({ isOpen, onClose, job }) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !job) return null;

    const broadcastText = job.iklan_template || generateBroadcastText(job, "KomputerAwet / Yangversa Computer", job.nomor_kontak || "");

    const handleCopy = () => {
        navigator.clipboard.writeText(broadcastText);
        setCopied(true);
        toast.success("Teks iklan loker disalin! Siap dipaste ke platform cari kerja / WA");
        setTimeout(() => setCopied(false), 2500);
    };

    // Parse external links stored on the job
    let savedLinks = [];
    if (Array.isArray(job.external_links)) {
        savedLinks = job.external_links.filter(l => l.url && l.url.trim() !== "");
    } else if (typeof job.external_links === "string") {
        try {
            savedLinks = JSON.parse(job.external_links);
        } catch {
            savedLinks = [];
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* 60fps Hardware-Accelerated Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs modal-backdrop" 
                onClick={onClose} 
            />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] modal-surface z-10">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                Teks Iklan Loker Siap Sebar (Copas Ready)
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Format promosi lowongan untuk WhatsApp, Glints, Jobstreet, LinkedIn & Medsos
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-5">
                    
                    {/* Shortcut Buttons to Open External Platforms */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Shortcut Platform Cari Kerja:
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Buka tab baru & langsung paste
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Saved custom URLs on this job */}
                            {savedLinks.length > 0 ? (
                                savedLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all shadow-2xs"
                                    >
                                        <Link2 className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Buka {link.platform || "Listing Loker"}</span>
                                        <ExternalLink className="w-3 h-3 ml-0.5 text-blue-400" />
                                    </a>
                                ))
                            ) : null}

                            {/* Generic Platform Shortcuts */}
                            {DEFAULT_PLATFORMS.map((plat, idx) => (
                                <a
                                    key={idx}
                                    href={plat.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
                                >
                                    <Globe className="w-3 h-3 text-slate-400" />
                                    <span>{plat.name}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Preview Box with 1-Click Copy */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <span>Format Teks Siap Copas:</span>
                            </div>

                            <button
                                type="button"
                                onClick={handleCopy}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                    copied
                                        ? "bg-emerald-600 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? "Tersalin ke Clipboard!" : "Salin Teks (1-Click)"}</span>
                            </button>
                        </div>

                        <div className="relative">
                            <textarea
                                readOnly
                                rows={12}
                                value={broadcastText}
                                onClick={(e) => e.target.select()}
                                className="w-full p-4 bg-slate-50 text-slate-800 font-mono text-xs rounded-2xl border border-slate-200 leading-relaxed shadow-xs select-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                        Tips: Bagikan ke grup WhatsApp alumni SMK/kampus atau feed media sosial toko.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>

            </div>
        </div>
    );
}

