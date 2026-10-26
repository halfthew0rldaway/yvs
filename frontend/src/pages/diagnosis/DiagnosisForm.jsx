import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
    ArrowLeft, Save, AlertTriangle, Lightbulb, DollarSign, Send, CheckCircle2,
    BatteryCharging, MonitorSmartphone, Keyboard, MousePointer, Usb, Volume2, 
    Camera, Wifi, HardDrive, Cpu, Gauge, Sparkles, Check, X, RotateCcw, 
    Info, Wand2, ListChecks, ShieldAlert
} from "lucide-react";
import PhotoUploadSection from "../../components/PhotoUploadSection";

const MAX_TEXT_LIMIT = 5000;

// Daftar Modul Inspeksi Hardware Diagnosa
const HARDWARE_CHECKLIST_ITEMS = [
    { key: "power", label: "Daya & Pengisian Baterai", icon: BatteryCharging, defaultSolusi: "Periksa sirkuit charging, adaptor, atau ganti baterai baru" },
    { key: "display", label: "Layar & GPU Tampilan", icon: MonitorSmartphone, defaultSolusi: "Penggantian panel LCD / re-seat fleksibel eDP / reball GPU" },
    { key: "keyboard", label: "Keyboard", icon: Keyboard, defaultSolusi: "Penggantian modul keyboard baru / pembersihan jalur tuts" },
    { key: "touchpad", label: "Touchpad & Klik", icon: MousePointer, defaultSolusi: "Kalibrasi sensor touchpad / perbaikan kabel fleksibel" },
    { key: "usb_port", label: "Port USB & I/O", icon: Usb, defaultSolusi: "Solder ulang pin konektor / penggantian board port USB" },
    { key: "audio", label: "Speaker, Mic & Audio Jack", icon: Volume2, defaultSolusi: "Penggantian modul speaker / perbaikan IC audio codec" },
    { key: "webcam", label: "Kamera / Webcam", icon: Camera, defaultSolusi: "Periksa modul kamera & jalur kabel fleksibel kamera" },
    { key: "wifi_lan", label: "WiFi & Bluetooth / LAN", icon: Wifi, defaultSolusi: "Penggantian WiFi card / instalasi driver certified" },
    { key: "storage", label: "Penyimpanan (SSD / HDD)", icon: HardDrive, defaultSolusi: "Upgrade / ganti SSD NVMe/SATA baru & backup data" },
    { key: "ram", label: "RAM / Memori", icon: Cpu, defaultSolusi: "Ganti atau tambah keping RAM DDR" },
    { key: "thermal", label: "Fan & Pendingin (Thermal)", icon: Gauge, defaultSolusi: "Deep cleaning heatsink fan & repasta thermal compound premium" },
    { key: "motherboard", label: "Motherboard & IC Power", icon: ShieldAlert, defaultSolusi: "Tracing skematik jalur tegangan, reball / ganti komponen short" },
];

function getStats(text = "") {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    return { chars, words };
}

function buildChecklistSummary(statusMap) {
    const checkedKeys = Object.keys(statusMap).filter(k => statusMap[k] === "ok" || statusMap[k] === "issue");
    if (checkedKeys.length === 0) return "";

    const lines = checkedKeys.map(k => {
        const item = HARDWARE_CHECKLIST_ITEMS.find(i => i.key === k);
        const isOk = statusMap[k] === "ok";
        const statusText = isOk ? "Normal (OK)" : "Bermasalah / Perlu Penanganan";
        const symbol = isOk ? "[✓]" : "[✗]";
        return `${symbol} ${item?.label || k}: ${statusText}`;
    });

    return `--- Hasil Pemeriksaan Hardware ---\n${lines.join("\n")}\n----------------------------------`;
}

function syncChecklistToMasalah(statusMap, currentMasalahText) {
    const summary = buildChecklistSummary(statusMap);
    const regex = /--- Hasil Pemeriksaan Hardware ---[\s\S]*?----------------------------------/;

    if (!summary) {
        return currentMasalahText.replace(regex, "").trim();
    }

    if (regex.test(currentMasalahText)) {
        return currentMasalahText.replace(regex, summary).trim();
    } else {
        if (currentMasalahText.trim()) {
            return `${currentMasalahText.trim()}\n\n${summary}`;
        } else {
            return summary;
        }
    }
}

function parseChecklistFromText(text = "") {
    if (!text) return {};
    const parsed = {};
    HARDWARE_CHECKLIST_ITEMS.forEach(item => {
        if (text.includes(`[✓] ${item.label}`)) {
            parsed[item.key] = "ok";
        } else if (text.includes(`[✗] ${item.label}`)) {
            parsed[item.key] = "issue";
        }
    });
    return parsed;
}

export default function DiagnosisForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ masalah: "", solusi: "", estimasi_biaya: "" });
    const [fotos, setFotos] = useState([]);
    const [diagnosisId, setDiagnosisId] = useState(null);
    const [tiket, setTiket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Auto-Type Checklist State
    const [checklistStatus, setChecklistStatus] = useState({});
    const [autoSync, setAutoSync] = useState(true);

    useEffect(() => {
        async function fetchExisting() {
            try {
                const res = await api.get(`/tiket-servis/${id}`);
                setTiket(res.data);
                if (res.data?.diagnosis) {
                    const loadedMasalah = res.data.diagnosis.masalah || "";
                    setForm({
                        masalah: loadedMasalah,
                        solusi: res.data.diagnosis.solusi || "",
                        estimasi_biaya: res.data.diagnosis.estimasi_biaya ?? "",
                    });
                    setDiagnosisId(res.data.diagnosis.id);
                    setChecklistStatus(parseChecklistFromText(loadedMasalah));
                }

                let loadedPhotos = [];
                const rawFotos = res.data?.diagnosis?.foto_diagnosis || res.data?.foto_diagnosis;
                if (rawFotos) {
                    try {
                        loadedPhotos = typeof rawFotos === "string" ? JSON.parse(rawFotos) : rawFotos;
                    } catch (e) {
                        loadedPhotos = [];
                    }
                }
                setFotos(loadedPhotos || []);
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        }
        fetchExisting();
    }, [id]);

    // Handle single item status change
    function handleToggleItem(key, newStatus) {
        setChecklistStatus(prev => {
            const updated = { ...prev };
            if (updated[key] === newStatus) {
                delete updated[key]; // toggle off
            } else {
                updated[key] = newStatus;
            }

            if (autoSync) {
                setForm(f => ({
                    ...f,
                    masalah: syncChecklistToMasalah(updated, f.masalah)
                }));
            }

            return updated;
        });
    }

    // Quick Action: Set Semua Normal
    function handleSetAllOk() {
        const updated = {};
        HARDWARE_CHECKLIST_ITEMS.forEach(item => {
            updated[item.key] = "ok";
        });
        setChecklistStatus(updated);
        if (autoSync) {
            setForm(f => ({
                ...f,
                masalah: syncChecklistToMasalah(updated, f.masalah)
            }));
        }
        toast.success("Semua 12 komponen ditandai Normal (OK)!");
    }

    // Quick Action: Reset Checklist
    function handleResetChecklist() {
        setChecklistStatus({});
        if (autoSync) {
            setForm(f => ({
                ...f,
                masalah: syncChecklistToMasalah({}, f.masalah)
            }));
        }
        toast.success("Checklist pemeriksaan telah direset.");
    }

    // Quick Action: Rekomendasikan Solusi untuk Part Bermasalah
    function handleSuggestSolutions() {
        const issueKeys = Object.keys(checklistStatus).filter(k => checklistStatus[k] === "issue");
        if (issueKeys.length === 0) {
            toast("Tidak ada komponen yang ditandai bermasalah.", { icon: "ℹ️" });
            return;
        }

        const solutionLines = issueKeys.map(k => {
            const item = HARDWARE_CHECKLIST_ITEMS.find(i => i.key === k);
            return `• ${item?.label}: ${item?.defaultSolusi || "Perbaikan atau penggantian komponen"}`;
        });

        const newBlock = `Rencana Solusi Komponen Bermasalah:\n${solutionLines.join("\n")}`;

        setForm(f => {
            const existing = f.solusi.trim();
            const updated = existing ? `${existing}\n\n${newBlock}` : newBlock;
            return { ...f, solusi: updated };
        });

        toast.success(`${issueKeys.length} rekomendasi solusi berhasil disisipkan!`);
    }

    // Manual Sync button jika autoSync dimatikan
    function handleManualSync() {
        setForm(f => ({
            ...f,
            masalah: syncChecklistToMasalah(checklistStatus, f.masalah)
        }));
        toast.success("Hasil checklist berhasil disinkronkan ke kotak deskripsi!");
    }

    async function handleSave(advanceToApproval = false) {
        if (!form.masalah.trim() || !form.solusi.trim() || form.estimasi_biaya === "") {
            toast.error("Harap lengkapi semua field diagnosis dan estimasi biaya.");
            return;
        }

        if (form.masalah.length > MAX_TEXT_LIMIT) {
            toast.error(`Deskripsi masalah melebihi batas maksimal ${MAX_TEXT_LIMIT.toLocaleString()} karakter!`);
            return;
        }

        if (form.solusi.length > MAX_TEXT_LIMIT) {
            toast.error(`Solusi melebihi batas maksimal ${MAX_TEXT_LIMIT.toLocaleString()} karakter!`);
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("tiket_id", String(id));
            formData.append("masalah", form.masalah);
            formData.append("solusi", form.solusi);
            formData.append("estimasi_biaya", String(form.estimasi_biaya));

            const existingUrls = [];
            fotos.forEach((f) => {
                if (f instanceof File) {
                    formData.append("foto_diagnosis", f);
                } else if (typeof f === "string") {
                    existingUrls.push(f);
                }
            });
            formData.append("existing_foto_diagnosis", JSON.stringify(existingUrls));

            if (diagnosisId) {
                await api.put(`/diagnosis/${diagnosisId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            } else {
                await api.post("/diagnosis", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            if (advanceToApproval) {
                await api.put(`/tiket-servis/${id}`, { status: "menunggu_persetujuan" });
                toast.success("Diagnosis disimpan & tiket dinaikkan ke tahap Penawaran (Menunggu Persetujuan Admin)!");
            } else {
                toast.success("Diagnosis berhasil disimpan!");
            }
            navigate(`/tiket-servis/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan diagnosis");
        } finally {
            setLoading(false);
        }
    }

    const masalahStats = useMemo(() => getStats(form.masalah), [form.masalah]);
    const solusiStats = useMemo(() => getStats(form.solusi), [form.solusi]);

    const checkedCount = Object.keys(checklistStatus).filter(k => checklistStatus[k] === "ok" || checklistStatus[k] === "issue").length;
    const issueCount = Object.keys(checklistStatus).filter(k => checklistStatus[k] === "issue").length;

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const canAdvance = tiket?.status === "didiagnosis";

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/tiket-servis/${id}`)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm cursor-pointer"
                        title="Kembali ke Detail Tiket"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {diagnosisId ? "Edit Hasil Diagnosis" : "Input Hasil Diagnosis"}
                            </h1>
                            {tiket?.nomor_tiket && (
                                <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                                    {tiket.nomor_tiket}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Catat temuan masalah teknis, inspeksi komponen, rekomendasi solusi, dan estimasi biaya perbaikan
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-6">
                
                {/* 1. Checklist Inspeksi Hardware & Auto-Type Generator */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-blue-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Checklist Pengecekan Cepat (Auto-Type)
                                </h2>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {checkedCount}/{HARDWARE_CHECKLIST_ITEMS.length} Diperiksa
                                </span>
                                {issueCount > 0 && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                        {issueCount} Bermasalah
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Klik status komponen di bawah. Teks otomatis terketik di kotak deskripsi temuan masalah secara real-time.
                            </p>
                        </div>

                        {/* Quick Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={autoSync}
                                    onChange={(e) => setAutoSync(e.target.checked)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <span>Auto-Sync ke Textbox</span>
                            </label>

                            {!autoSync && (
                                <button
                                    type="button"
                                    onClick={handleManualSync}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 text-xs font-semibold transition-all cursor-pointer"
                                >
                                    <Wand2 className="w-3.5 h-3.5" />
                                    <span>Salin ke Textbox</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleSetAllOk}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 text-xs font-semibold transition-all cursor-pointer"
                                title="Tandai semua 12 komponen normal"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>Semua Normal (OK)</span>
                            </button>

                            {issueCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSuggestSolutions}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 text-xs font-semibold transition-all cursor-pointer"
                                    title="Salin rekomendasi perbaikan untuk komponen bermasalah ke kotak Solusi"
                                >
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Rekomendasikan Solusi ({issueCount})</span>
                                </button>
                            )}

                            {checkedCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleResetChecklist}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 text-xs transition-all cursor-pointer"
                                    title="Reset semua checklist"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grid Hardware Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {HARDWARE_CHECKLIST_ITEMS.map((item) => {
                            const ItemIcon = item.icon;
                            const currentStatus = checklistStatus[item.key];
                            const isOk = currentStatus === "ok";
                            const isIssue = currentStatus === "issue";

                            return (
                                <div
                                    key={item.key}
                                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                                        isOk 
                                            ? "bg-emerald-50/50 border-emerald-200 shadow-2xs" 
                                            : isIssue 
                                                ? "bg-rose-50/60 border-rose-200 shadow-2xs" 
                                                : "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                            isOk 
                                                ? "bg-emerald-100 text-emerald-700" 
                                                : isIssue 
                                                    ? "bg-rose-100 text-rose-700" 
                                                    : "bg-white text-slate-500 border border-slate-200"
                                        }`}>
                                            <ItemIcon className="w-4 h-4" />
                                        </div>
                                        <span className={`text-xs font-semibold leading-tight truncate ${
                                            isOk ? "text-emerald-950" : isIssue ? "text-rose-950 font-bold" : "text-slate-700"
                                        }`}>
                                            {item.label}
                                        </span>
                                    </div>

                                    {/* Action Chips */}
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleItem(item.key, "ok")}
                                            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                                isOk
                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                    : "bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200"
                                            }`}
                                        >
                                            <Check className="w-3 h-3" />
                                            <span>OK</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleItem(item.key, "issue")}
                                            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                                isIssue
                                                    ? "bg-rose-600 text-white shadow-xs"
                                                    : "bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200"
                                            }`}
                                        >
                                            <X className="w-3 h-3" />
                                            <span>Cacat / Rusak</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Textarea Masalah & Solusi */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                    
                    {/* Masalah yang Ditemukan */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Masalah yang Ditemukan (Hasil Pengecekan) <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs text-slate-400 font-mono">
                                Max {MAX_TEXT_LIMIT.toLocaleString()} Karakter
                            </span>
                        </div>

                        <textarea
                            value={form.masalah}
                            onChange={(e) => setForm({ ...form, masalah: e.target.value })}
                            maxLength={MAX_TEXT_LIMIT}
                            rows={6}
                            placeholder="Tuliskan temuan masalah teknis, pengukuran voltase, gejala kerusakan, atau gunakan checklist di atas untuk auto-type..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-y min-h-[140px] text-sm text-slate-900 leading-relaxed font-sans placeholder:text-slate-400"
                            required
                        />

                        {/* Note & Real-time Counter */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mt-2 text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                Catat temuan komponen secara detail. Maksimal {MAX_TEXT_LIMIT.toLocaleString()} karakter (~750 kata).
                            </span>
                            <span className={`font-mono font-medium shrink-0 ${
                                masalahStats.chars > 4750 
                                    ? "text-red-600 font-bold" 
                                    : masalahStats.chars > 4000 
                                        ? "text-amber-600 font-semibold" 
                                        : "text-slate-500"
                            }`}>
                                {masalahStats.words} kata | {masalahStats.chars} / {MAX_TEXT_LIMIT.toLocaleString()} karakter
                            </span>
                        </div>
                    </div>

                    {/* Solusi yang Direkomendasikan */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-emerald-500" />
                                Solusi yang Direkomendasikan <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs text-slate-400 font-mono">
                                Max {MAX_TEXT_LIMIT.toLocaleString()} Karakter
                            </span>
                        </div>

                        <textarea
                            value={form.solusi}
                            onChange={(e) => setForm({ ...form, solusi: e.target.value })}
                            maxLength={MAX_TEXT_LIMIT}
                            rows={5}
                            placeholder="Rincikan tindakan teknis, langkah perbaikan, part yang perlu diganti, atau estimasi waktu pengerjaan..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-y min-h-[130px] text-sm text-slate-900 leading-relaxed font-sans placeholder:text-slate-400"
                            required
                        />

                        {/* Note & Real-time Counter */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mt-2 text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                Tuliskan solusi yang jelas agar mudah dipahami customer saat penawaran harga.
                            </span>
                            <span className={`font-mono font-medium shrink-0 ${
                                solusiStats.chars > 4750 
                                    ? "text-red-600 font-bold" 
                                    : solusiStats.chars > 4000 
                                        ? "text-amber-600 font-semibold" 
                                        : "text-slate-500"
                            }`}>
                                {solusiStats.words} kata | {solusiStats.chars} / {MAX_TEXT_LIMIT.toLocaleString()} karakter
                            </span>
                        </div>
                    </div>

                    {/* Estimasi Biaya */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            Estimasi Biaya Jasa & Part (Rp) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">
                                Rp
                            </span>
                            <input
                                type="number"
                                value={form.estimasi_biaya}
                                onChange={(e) => setForm({ ...form, estimasi_biaya: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-semibold text-slate-900"
                                placeholder="Contoh: 150000"
                                min="0"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Biaya ini adalah perkiraan awal dan akan diajukan ke pelanggan untuk disetujui (ACC).
                        </p>
                    </div>

                    {/* Foto Temuan & Hasil Diagnosis (Maks 25) */}
                    <PhotoUploadSection
                        label="Foto Temuan & Hasil Diagnosis"
                        sublabel="Dokumentasikan bukti kerusakan IC, korosi, komponen terbakar, atau hasil pengukuran teknis (Maksimal 25 foto)."
                        maxPhotos={25}
                        photos={fotos}
                        onChange={setFotos}
                    />

                    {/* Form Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100 mt-8">
                        <button
                            type="button"
                            onClick={() => navigate(`/tiket-servis/${id}`)}
                            className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto text-center cursor-pointer"
                        >
                            Batal
                        </button>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleSave(false)}
                                disabled={loading}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                <span>Simpan Saja (Draft)</span>
                            </button>

                            {canAdvance ? (
                                <button
                                    type="button"
                                    onClick={() => handleSave(true)}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    <span>Simpan & Naikkan ke Penawaran</span>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                    )}
                                    <span>Simpan Perubahan</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
