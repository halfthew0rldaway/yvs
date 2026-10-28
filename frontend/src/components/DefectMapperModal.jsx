import { useState, useRef } from "react";
import { 
    X, 
    Trash2, 
    Eye, 
    AlertCircle, 
    Check, 
    Laptop, 
    Layers, 
    Sparkles,
    RotateCcw
} from "lucide-react";

export const DEFECT_TYPES = [
    { id: "baret", label: "Goresan / Scratch", color: "#f59e0b", bg: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-400" },
    { id: "penyok", label: "Penyok / Dent", color: "#ef4444", bg: "bg-rose-500", text: "text-rose-700", ring: "ring-rose-400" },
    { id: "retak", label: "Retak / Pecah", color: "#8b5cf6", bg: "bg-purple-500", text: "text-purple-700", ring: "ring-purple-400" },
    { id: "baut_hilang", label: "Baut Hilang / Lepas", color: "#0ea5e9", bg: "bg-sky-500", text: "text-sky-700", ring: "ring-sky-400" },
    { id: "kotor", label: "Noda / Korosi", color: "#64748b", bg: "bg-slate-500", text: "text-slate-700", ring: "ring-slate-400" },
];

export const VIEWS = [
    { id: "top_lid", label: "Cover Atas (Lid)", desc: "Bagian luar punggung layar" },
    { id: "screen_keyboard", label: "Layar & Keyboard", desc: "Tampak depan saat laptop terbuka" },
    { id: "bottom_base", label: "Bagian Bawah", desc: "Alas bawah, baut & ventilasi" },
];

export default function DefectMapperModal({
    isOpen,
    onClose,
    value,
    onChange,
    readOnly = false,
    title = "Peta Cacat Fisik Perangkat (2D Defect Map)"
}) {
    const [currentView, setCurrentView] = useState("top_lid");
    const [selectedType, setSelectedType] = useState("baret");
    const [activePinId, setActivePinId] = useState(null);
    const canvasRef = useRef(null);

    if (!isOpen) return null;

    // Normalisasi value
    const defectData = value && typeof value === "object" ? value : { items: [] };
    const items = Array.isArray(defectData.items) ? defectData.items : [];

    // Filter items untuk tampilan view yang sedang aktif
    const currentViewItems = items.filter(item => (item.view || "top_lid") === currentView);

    function handleCanvasClick(e) {
        if (readOnly) return;
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        // Hitung koordinat persentase (0% - 100%)
        const x = Math.round(((clientX - rect.left) / rect.width) * 1000) / 10;
        const y = Math.round(((clientY - rect.top) / rect.height) * 1000) / 10;

        if (x < 4 || x > 96 || y < 4 || y > 96) return;

        const newItem = {
            id: Date.now() + Math.random(),
            view: currentView,
            x,
            y,
            type: selectedType,
            note: ""
        };

        const updated = {
            version: 1,
            items: [...items, newItem]
        };

        onChange(updated);
        setActivePinId(newItem.id);
    }

    function handleRemoveItem(id) {
        if (readOnly) return;
        const updated = {
            version: 1,
            items: items.filter(i => i.id !== id)
        };
        onChange(updated);
        if (activePinId === id) setActivePinId(null);
    }

    function handleUpdateNote(id, note) {
        if (readOnly) return;
        const updated = {
            version: 1,
            items: items.map(i => i.id === id ? { ...i, note } : i)
        };
        onChange(updated);
    }

    function handleClearView() {
        if (readOnly) return;
        if (!confirm(`Hapus semua titik cacat pada tampilan ${VIEWS.find(v => v.id === currentView)?.label}?`)) return;
        const updated = {
            version: 1,
            items: items.filter(i => (i.view || "top_lid") !== currentView)
        };
        onChange(updated);
    }

    const currentDefectMeta = DEFECT_TYPES.find(d => d.id === selectedType) || DEFECT_TYPES[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/80 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                            <Laptop className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">{title}</h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                    {items.length} Cacat
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                                {readOnly 
                                    ? "Visualisasi titik goresan dan kecacatan fisik perangkat saat diterima."
                                    : "Ketuk pada skema perangkat untuk menandai lokasi baret, retak, penyok, atau baut hilang."
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-white border-b border-slate-100">
                    <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                        {VIEWS.map(v => {
                            const count = items.filter(i => (i.view || "top_lid") === v.id).length;
                            const isActive = currentView === v.id;
                            return (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setCurrentView(v.id)}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        isActive 
                                            ? "bg-white text-slate-800 shadow-xs border border-slate-200/80 font-semibold" 
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    <span>{v.label}</span>
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {!readOnly && (
                        <div className="flex items-center gap-1.5">
                            {currentViewItems.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearView}
                                    className="text-xs text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 font-medium"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset View Ini</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Content Area: Canvas + Sidebar */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col lg:flex-row gap-5">
                    
                    {/* Canvas Container */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div 
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                            className={`relative w-full max-w-xl aspect-[16/10] bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-inner select-none transition-all ${
                                !readOnly ? "cursor-crosshair ring-2 ring-slate-800 hover:ring-indigo-500/40" : "cursor-default"
                            }`}
                        >
                            {/* SVG Laptop Blueprint based on currentView */}
                            {currentView === "top_lid" && (
                                <svg viewBox="0 0 500 320" className="w-full h-full text-slate-700 fill-slate-800/80 stroke-slate-600">
                                    {/* Outer Clamshell Lid */}
                                    <rect x="20" y="20" width="460" height="280" rx="18" strokeWidth="2.5" fill="#1e293b" />
                                    {/* Inner edge bevel */}
                                    <rect x="28" y="28" width="444" height="264" rx="14" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.4" />
                                    {/* Center Logo Placeholder */}
                                    <circle cx="250" cy="160" r="28" strokeWidth="1.5" fill="#334155" opacity="0.6" />
                                    <path d="M242 160 L258 160 M250 152 L250 168" strokeWidth="1.5" stroke="#94a3b8" />
                                    {/* Hinge Bottom Area */}
                                    <rect x="150" y="295" width="200" height="8" rx="3" fill="#0f172a" strokeWidth="1" />
                                    {/* Corner Rubber Bumpers */}
                                    <circle cx="34" cy="34" r="3" fill="#475569" stroke="none" />
                                    <circle cx="466" cy="34" r="3" fill="#475569" stroke="none" />
                                    <circle cx="34" cy="286" r="3" fill="#475569" stroke="none" />
                                    <circle cx="466" cy="286" r="3" fill="#475569" stroke="none" />
                                    {/* Label text */}
                                    <text x="250" y="225" fill="#64748b" fontSize="11" textAnchor="middle" letterSpacing="2" fontFamily="sans-serif">COVER ATAS (TOP LID)</text>
                                </svg>
                            )}

                            {currentView === "screen_keyboard" && (
                                <svg viewBox="0 0 500 320" className="w-full h-full text-slate-700 fill-slate-800/80 stroke-slate-600">
                                    {/* Laptop Base */}
                                    <rect x="20" y="20" width="460" height="280" rx="14" strokeWidth="2.5" fill="#1e293b" />
                                    {/* Screen Bezel Split Line (Upper Clamshell representation) */}
                                    <rect x="35" y="32" width="430" height="70" rx="6" fill="#0f172a" strokeWidth="1.5" />
                                    {/* Screen Display Area */}
                                    <rect x="42" y="38" width="416" height="58" rx="3" fill="#020617" strokeWidth="0.8" />
                                    {/* Webcam dot */}
                                    <circle cx="250" cy="35" r="2" fill="#38bdf8" />
                                    <text x="250" y="72" fill="#475569" fontSize="10" textAnchor="middle" letterSpacing="1">AREA LAYAR (DISPLAY BEZEL)</text>

                                    {/* Keyboard Area */}
                                    <rect x="40" y="115" width="420" height="105" rx="8" fill="#0f172a" strokeWidth="1.2" />
                                    {/* Keyboard Grid lines */}
                                    <g stroke="#334155" strokeWidth="0.8">
                                        <line x1="45" y1="135" x2="455" y2="135" />
                                        <line x1="45" y1="155" x2="455" y2="155" />
                                        <line x1="45" y1="175" x2="455" y2="175" />
                                        <line x1="45" y1="195" x2="455" y2="195" />
                                    </g>
                                    <text x="250" y="168" fill="#64748b" fontSize="10" textAnchor="middle" letterSpacing="2">KEYBOARD & PALMREST</text>

                                    {/* Trackpad */}
                                    <rect x="200" y="230" width="100" height="60" rx="6" fill="#0f172a" strokeWidth="1.5" />
                                    <line x1="250" y1="270" x2="250" y2="290" stroke="#334155" strokeWidth="1" />
                                    <text x="250" y="258" fill="#475569" fontSize="9" textAnchor="middle">TOUCHPAD</text>

                                    {/* Power button */}
                                    <circle cx="445" cy="125" r="4" fill="#334155" stroke="#64748b" strokeWidth="1" />
                                </svg>
                            )}

                            {currentView === "bottom_base" && (
                                <svg viewBox="0 0 500 320" className="w-full h-full text-slate-700 fill-slate-800/80 stroke-slate-600">
                                    {/* Outer Bottom Base */}
                                    <rect x="20" y="20" width="460" height="280" rx="18" strokeWidth="2.5" fill="#1e293b" />
                                    {/* 4 Rubber Feet */}
                                    <rect x="36" y="34" width="30" height="10" rx="4" fill="#475569" stroke="none" />
                                    <rect x="434" y="34" width="30" height="10" rx="4" fill="#475569" stroke="none" />
                                    <rect x="36" y="276" width="30" height="10" rx="4" fill="#475569" stroke="none" />
                                    <rect x="434" y="276" width="30" height="10" rx="4" fill="#475569" stroke="none" />

                                    {/* Air Vents Intake Grill */}
                                    <rect x="120" y="45" width="260" height="40" rx="6" fill="#0f172a" strokeWidth="1" />
                                    <g stroke="#334155" strokeWidth="1">
                                        <line x1="130" y1="55" x2="370" y2="55" strokeDasharray="4 3" />
                                        <line x1="130" y1="65" x2="370" y2="65" strokeDasharray="4 3" />
                                        <line x1="130" y1="75" x2="370" y2="75" strokeDasharray="4 3" />
                                    </g>
                                    <text x="250" y="38" fill="#64748b" fontSize="9" textAnchor="middle">VENTILASI UDARA (AIR INTAKE)</text>

                                    {/* Center Service Tag Plate */}
                                    <rect x="190" y="140" width="120" height="45" rx="4" fill="#0f172a" strokeWidth="1" />
                                    <text x="250" y="165" fill="#64748b" fontSize="9" textAnchor="middle" letterSpacing="1">SERIAL & MODEL TAG</text>

                                    {/* Screw Positions */}
                                    <g fill="#020617" stroke="#64748b" strokeWidth="1">
                                        <circle cx="32" cy="150" r="3.5" />
                                        <circle cx="468" cy="150" r="3.5" />
                                        <circle cx="100" cy="285" r="3.5" />
                                        <circle cx="250" cy="285" r="3.5" />
                                        <circle cx="400" cy="285" r="3.5" />
                                        <circle cx="100" cy="30" r="3.5" />
                                        <circle cx="400" cy="30" r="3.5" />
                                    </g>
                                    <text x="250" y="235" fill="#64748b" fontSize="11" textAnchor="middle" letterSpacing="2" fontFamily="sans-serif">BAGIAN BAWAH (BOTTOM CHASSIS)</text>
                                </svg>
                            )}

                            {/* Defect Pins Overlay */}
                            {currentViewItems.map((item, idx) => {
                                const typeMeta = DEFECT_TYPES.find(d => d.id === item.type) || DEFECT_TYPES[0];
                                const isActive = activePinId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActivePinId(item.id);
                                        }}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
                                    >
                                        {/* Pin Marker */}
                                        <div className={`relative flex items-center justify-center w-6 h-6 rounded-full shadow-lg text-white text-[11px] font-bold transition-transform ${
                                            isActive ? "scale-125 ring-4 ring-white" : "hover:scale-110"
                                        } ${typeMeta.bg}`}>
                                            {idx + 1}
                                            {/* Pulsing ring */}
                                            <span 
                                                className={`absolute -inset-1 rounded-full animate-ping opacity-40 ${typeMeta.bg}`}
                                                style={{ animationDuration: "2s" }}
                                            />
                                        </div>

                                        {/* Tooltip on Hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                                            <div className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
                                                <span className="font-semibold text-amber-400">#{idx + 1} {typeMeta.label}</span>
                                                {item.note && <span className="block text-[10px] text-slate-300 max-w-[160px] truncate">{item.note}</span>}
                                            </div>
                                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Visual Helper Legend */}
                        <div className="mt-3 text-center">
                            <span className="text-[11px] text-slate-400 font-medium inline-flex items-center justify-center gap-1">
                                {!readOnly ? (
                                    <>
                                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                        <span><strong>Tip:</strong> Klik tepat pada posisi fisik goresan atau kerusakan pada gambar di atas</span>
                                    </>
                                ) : (
                                    "Titik bertanda menunjukkan lokasi cacat fisik pada unit."
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Right Control Panel: Tools & Pin List */}
                    <div className="w-full lg:w-80 flex flex-col gap-4">
                        
                        {/* Tool Selector (When not read-only) */}
                        {!readOnly && (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                    Pilih Jenis Cacat Fisik:
                                </label>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {DEFECT_TYPES.map(d => {
                                        const isSelected = selectedType === d.id;
                                        return (
                                            <button
                                                key={d.id}
                                                type="button"
                                                onClick={() => setSelectedType(d.id)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                                    isSelected 
                                                        ? "bg-white text-slate-800 shadow-xs border border-slate-300 font-semibold ring-1 ring-slate-300"
                                                        : "text-slate-600 hover:bg-white/60 hover:text-slate-900 border border-transparent"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-3 h-3 rounded-full ${d.bg}`} />
                                                    <span>{d.label}</span>
                                                </div>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pins List for Current View */}
                        <div className="flex-1 flex flex-col p-3.5 bg-slate-50 rounded-xl border border-slate-200 min-h-[220px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Daftar Titik ({currentViewItems.length})
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {VIEWS.find(v => v.id === currentView)?.label}
                                </span>
                            </div>

                            {currentViewItems.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                                    <Sparkles className="w-6 h-6 mb-1 text-slate-300" />
                                    <p className="text-xs font-medium">Belum ada titik cacat di tampilan ini.</p>
                                    {!readOnly && (
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Klik area blueprint untuk menambahkan.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-2 max-h-[260px] pr-1">
                                    {currentViewItems.map((item, idx) => {
                                        const typeMeta = DEFECT_TYPES.find(d => d.id === item.type) || DEFECT_TYPES[0];
                                        const isSelected = activePinId === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setActivePinId(item.id)}
                                                className={`p-2.5 rounded-lg border text-xs transition-all ${
                                                    isSelected 
                                                        ? "bg-white border-indigo-300 shadow-xs ring-1 ring-indigo-200" 
                                                        : "bg-white border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-5 h-5 rounded-full ${typeMeta.bg} text-white font-bold flex items-center justify-center text-[10px]`}>
                                                            {idx + 1}
                                                        </span>
                                                        <span className="font-semibold text-slate-800">{typeMeta.label}</span>
                                                    </div>
                                                    {!readOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveItem(item.id);
                                                            }}
                                                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                                            title="Hapus titik ini"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {!readOnly ? (
                                                    <input
                                                        type="text"
                                                        placeholder="Catatan (e.g. gores halus 2cm)..."
                                                        value={item.note || ""}
                                                        onChange={(e) => handleUpdateNote(item.id, e.target.value)}
                                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                ) : (
                                                    item.note ? (
                                                        <p className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                            {item.note}
                                                        </p>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">Tanpa catatan tambahan</span>
                                                    )
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                        <span>Data cacat tersimpan otomatis dan dicantumkan pada SPK tanda terima & link lacak pelanggan.</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                    >
                        Selesai
                    </button>
                </div>

            </div>
        </div>
    );
}

// Mini preview badge / trigger for list or details
export function DefectMapBadge({ value, onClick, readOnly = false }) {
    const defectData = value && typeof value === "object" ? value : { items: [] };
    const count = Array.isArray(defectData.items) ? defectData.items.length : 0;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                count > 0 
                    ? "bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100" 
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
        >
            <Laptop className="w-3.5 h-3.5 text-slate-500" />
            <span>Peta Cacat Fisik</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                count > 0 ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"
            }`}>
                {count} Titik
            </span>
        </button>
    );
}

