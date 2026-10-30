import toast from 'react-hot-toast';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
    ArrowLeft, Save, AlertTriangle, Lightbulb, DollarSign, Send, CheckCircle2,
    Check, X, RotateCcw, 
    Info, Wand2, ListChecks, ShieldAlert, Plus, Minus, AlignLeft, List
} from "lucide-react";
import PhotoUploadSection from "../../components/PhotoUploadSection";
import MediaProcessingModal from "../../components/MediaProcessingModal";
import { HARDWARE_CHECKLIST_ITEMS as HARDWARE_ITEMS } from "../../utils/checklistItems";

const MAX_TEXT_LIMIT = 5000;

function getStats(text = "") {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    return { chars, words };
}

// Generate teks laporan pengecekan: natural, simpel & unpretentious
function buildChecklistText(statusMap, formatMode = "paragraph") {
    const checkedKeys = Object.keys(statusMap).filter(
        k => statusMap[k]?.status === "ok" || statusMap[k]?.status === "issue"
    );
    if (checkedKeys.length === 0) return "";

    const okItems = [];
    const issueItems = [];

    checkedKeys.forEach(k => {
        const itemDef = HARDWARE_ITEMS.find(i => i.key === k);
        const data = statusMap[k];
        const qty = itemDef?.hasQty ? (data.qty || itemDef.defaultQty) : null;
        const qtyStr = qty && qty > 1 ? ` (${qty} ${itemDef.unit})` : "";
        const name = `${itemDef?.shortName || k}${qtyStr}`;
        const note = (data.note || "").trim();

        if (data.status === "ok") {
            okItems.push({ name, note });
        } else if (data.status === "issue") {
            issueItems.push({ name, note });
        }
    });

    if (formatMode === "paragraph") {
        const parts = [];

        // 1. Gabungkan item-item yang OK (cth: "fungsi keyboard, mic, port USB (2 port), speaker, baterai ok.")
        if (okItems.length > 0) {
            const okNames = okItems.map(item => item.note ? `${item.name} (${item.note})` : item.name);
            parts.push(`fungsi ${okNames.join(", ")} ok.`);
        }

        // 2. Tuliskan item-item yang bermasalah secara wajar/natural
        if (issueItems.length > 0) {
            const issueSentences = issueItems.map(item => {
                if (item.note) {
                    const lower = item.note.toLowerCase();
                    if (
                        lower.startsWith("tidak") || 
                        lower.startsWith("rusak") || 
                        lower.startsWith("mati") || 
                        lower.startsWith("ada") || 
                        lower.startsWith("kurang") ||
                        lower.startsWith("belum")
                    ) {
                        return `${item.name} ${item.note}.`;
                    }
                    return `${item.name} bermasalah (${item.note}).`;
                }
                return `${item.name} tidak fungsi.`;
            });
            parts.push(...issueSentences);
        }

        return parts.join(" ");
    } else {
        // Bullet mode (Poin per baris bersih tanpa dekorasi berlebihan)
        const lines = [];
        okItems.forEach(item => {
            lines.push(item.note ? `• ${item.name} ok (${item.note})` : `• ${item.name} ok`);
        });
        issueItems.forEach(item => {
            if (item.note) {
                const lower = item.note.toLowerCase();
                if (lower.startsWith("tidak") || lower.startsWith("rusak") || lower.startsWith("mati") || lower.startsWith("ada")) {
                    lines.push(`• ${item.name} ${item.note}`);
                } else {
                    lines.push(`• ${item.name} bermasalah (${item.note})`);
                }
            } else {
                lines.push(`• ${item.name} tidak fungsi`);
            }
        });
        return lines.join("\n");
    }
}

export default function DiagnosisForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ masalah: "", solusi: "", estimasi_biaya: "" });
    const [fotos, setFotos] = useState([]);
    const [diagnosisId, setDiagnosisId] = useState(null);
    const [tiket, setTiket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadModal, setUploadModal] = useState({
        isOpen: false,
        stage: "uploading",
        title: "",
        subtitle: "",
        progressPercent: 0,
        uploadedBytes: 0,
        totalBytes: 0
    });
    const [fetching, setFetching] = useState(true);

    // Checklist state: { [key]: { status: "ok"|"issue"|null, qty: number, note: string } }
    const [checklistStatus, setChecklistStatus] = useState({});
    const [autoSync, setAutoSync] = useState(true);
    const [formatMode, setFormatMode] = useState("paragraph"); // "paragraph" | "bullet"

    // Ref untuk melacak string kalimat terakhir yang di-generate agar penggantiannya mulus
    const lastGeneratedRef = useRef("");

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

                // Restore checklist status from ticket intake if already recorded
                if (res.data?.checklist_intake) {
                    try {
                        const intake = typeof res.data.checklist_intake === "string" 
                            ? JSON.parse(res.data.checklist_intake) 
                            : res.data.checklist_intake;
                        const initialStatus = {};
                        HARDWARE_ITEMS.forEach(item => {
                            const val = intake[item.key] !== undefined ? intake[item.key] : (item.legacyKey ? intake[item.legacyKey] : undefined);
                            if (val === true) {
                                initialStatus[item.key] = { status: "ok", qty: item.defaultQty || 1, note: "" };
                            } else if (val === false) {
                                initialStatus[item.key] = { status: "issue", qty: item.defaultQty || 1, note: "" };
                            }
                        });
                        if (Object.keys(initialStatus).length > 0) {
                            setChecklistStatus(initialStatus);
                        }
                    } catch (_) {}
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        }
        fetchExisting();
    }, [id]);

    // Sinkronisasi teks hasil generate ke kotak form.masalah tanpa menghapus catatan teknisi lainnya
    function applySyncToMasalah(newText, currentMasalah) {
        const prev = lastGeneratedRef.current;
        lastGeneratedRef.current = newText;

        if (!prev) {
            if (!newText) return currentMasalah;
            if (!currentMasalah.trim()) return newText;
            return `${currentMasalah.trim()}\n\n${newText}`;
        }

        if (currentMasalah.includes(prev)) {
            if (!newText) {
                return currentMasalah.replace(prev, "").trim();
            }
            return currentMasalah.replace(prev, newText);
        } else {
            if (!newText) return currentMasalah;
            if (!currentMasalah.trim()) return newText;
            return `${currentMasalah.trim()}\n\n${newText}`;
        }
    }

    // Toggle status OK / Bermasalah pada komponen
    function handleToggleStatus(key, targetStatus) {
        setChecklistStatus(prev => {
            const itemDef = HARDWARE_ITEMS.find(i => i.key === key);
            const currentData = prev[key] || { status: null, qty: itemDef?.defaultQty || 1, note: "" };
            
            const nextStatus = currentData.status === targetStatus ? null : targetStatus;
            const updated = {
                ...prev,
                [key]: { ...currentData, status: nextStatus }
            };

            if (autoSync) {
                const newGenerated = buildChecklistText(updated, formatMode);
                setForm(f => ({ ...f, masalah: applySyncToMasalah(newGenerated, f.masalah) }));
            }

            return updated;
        });
    }

    // Ubah jumlah slot/port (misal: 2 port, 3 port)
    function handleQtyChange(key, delta) {
        setChecklistStatus(prev => {
            const itemDef = HARDWARE_ITEMS.find(i => i.key === key);
            const currentData = prev[key] || { status: null, qty: itemDef?.defaultQty || 1, note: "" };
            const currentQty = currentData.qty || itemDef?.defaultQty || 1;
            const newQty = Math.max(1, Math.min(8, currentQty + delta));

            const updated = {
                ...prev,
                [key]: { ...currentData, qty: newQty }
            };

            if (autoSync && currentData.status) {
                const newGenerated = buildChecklistText(updated, formatMode);
                setForm(f => ({ ...f, masalah: applySyncToMasalah(newGenerated, f.masalah) }));
            }

            return updated;
        });
    }

    // Ubah catatan spesifik komponen (misal: "ada 2 garis vertikal", "klik bawah macet")
    function handleNoteChange(key, noteText) {
        setChecklistStatus(prev => {
            const itemDef = HARDWARE_ITEMS.find(i => i.key === key);
            const currentData = prev[key] || { status: "ok", qty: itemDef?.defaultQty || 1, note: "" };
            const updated = {
                ...prev,
                [key]: { ...currentData, note: noteText }
            };

            if (autoSync && currentData.status) {
                const newGenerated = buildChecklistText(updated, formatMode);
                setForm(f => ({ ...f, masalah: applySyncToMasalah(newGenerated, f.masalah) }));
            }

            return updated;
        });
    }

    // Ubah mode format (paragraf vs bullet)
    function handleFormatModeChange(newMode) {
        setFormatMode(newMode);
        if (autoSync) {
            const newGenerated = buildChecklistText(checklistStatus, newMode);
            setForm(f => ({ ...f, masalah: applySyncToMasalah(newGenerated, f.masalah) }));
        }
    }

    // 1-Klik: Set semua komponen menjadi OK
    function handleSetAllOk() {
        const updated = {};
        HARDWARE_ITEMS.forEach(item => {
            const existing = checklistStatus[item.key] || {};
            updated[item.key] = {
                status: "ok",
                qty: existing.qty || item.defaultQty || 1,
                note: existing.note || ""
            };
        });
        setChecklistStatus(updated);
        if (autoSync) {
            const newGenerated = buildChecklistText(updated, formatMode);
            setForm(f => ({ ...f, masalah: applySyncToMasalah(newGenerated, f.masalah) }));
        }
        toast.success("Semua komponen ditandai OK!");
    }

    // Reset Checklist
    function handleResetChecklist() {
        setChecklistStatus({});
        if (autoSync) {
            setForm(f => ({ ...f, masalah: applySyncToMasalah("", f.masalah) }));
        }
        toast.success("Checklist telah direset.");
    }

    // Rekomendasikan solusi otomatis untuk komponen yang bermasalah
    function handleSuggestSolutions() {
        const issueKeys = Object.keys(checklistStatus).filter(k => checklistStatus[k]?.status === "issue");
        if (issueKeys.length === 0) {
            toast("Tidak ada komponen yang ditandai bermasalah.", { icon: "ℹ️" });
            return;
        }

        const solutionLines = issueKeys.map(k => {
            const item = HARDWARE_ITEMS.find(i => i.key === k);
            const note = checklistStatus[k]?.note ? ` (${checklistStatus[k].note})` : "";
            return `• ${item?.label}${note}: ${item?.defaultSolusi || "Pengecekan dan perbaikan teknis"}`;
        });

        const newBlock = `Rekomendasi Tindakan:\n${solutionLines.join("\n")}`;

        setForm(f => {
            const existing = f.solusi.trim();
            const updated = existing ? `${existing}\n\n${newBlock}` : newBlock;
            return { ...f, solusi: updated };
        });

        toast.success(`${issueKeys.length} rekomendasi solusi berhasil disisipkan!`);
    }

    // Manual Sync jika autoSync dimatikan
    function handleManualSync() {
        const newGenerated = buildChecklistText(checklistStatus, formatMode);
        setForm(f => ({ ...f, masalah: applySyncToMasalah(newGenerated, f.masalah) }));
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

        const newMediaFiles = fotos.filter(f => f instanceof File);
        if (newMediaFiles.length > 0) {
            setUploadModal({
                isOpen: true,
                stage: "uploading",
                title: "Mengunggah Dokumentasi Diagnosa...",
                subtitle: `Mentransfer ${newMediaFiles.length} berkas foto diagnosa teknisi ke server.`,
                progressPercent: 5,
                uploadedBytes: 0,
                totalBytes: 0
            });
        }

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

            const uploadConfig = {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                        setUploadModal(prev => ({
                            ...prev,
                            progressPercent: percent,
                            uploadedBytes: progressEvent.loaded,
                            totalBytes: progressEvent.total
                        }));
                    }
                }
            };

            if (diagnosisId) {
                await api.put(`/diagnosis/${diagnosisId}`, formData, uploadConfig);
            } else {
                await api.post("/diagnosis", formData, uploadConfig);
            }

            if (newMediaFiles.length > 0) {
                setUploadModal(prev => ({
                    ...prev,
                    progressPercent: 100,
                    stage: "done",
                    title: "Dokumentasi Diagnosa Berhasil Disimpan!",
                    subtitle: "Memperbarui status tiket..."
                }));
                await new Promise(r => setTimeout(r, 450));
            }

            // Synchronize hardware checklist directly into ticket's checklist_intake
            const intakeData = {};
            HARDWARE_ITEMS.forEach(item => {
                const st = checklistStatus[item.key]?.status;
                if (st === "ok") {
                    intakeData[item.key] = true;
                } else if (st === "issue") {
                    intakeData[item.key] = false;
                }
            });

            const ticketPayload = {};
            if (Object.keys(intakeData).length > 0) {
                ticketPayload.checklist_intake = intakeData;
            }
            if (advanceToApproval) {
                ticketPayload.status = "menunggu_persetujuan";
            }
            if (Object.keys(ticketPayload).length > 0) {
                await api.put(`/tiket-servis/${id}`, ticketPayload);
            }

            if (advanceToApproval) {
                toast.success("Diagnosis disimpan & tiket dinaikkan ke tahap Penawaran (Menunggu Persetujuan Admin)!");
            } else {
                toast.success("Diagnosis & checklist fisik berhasil disimpan!");
            }
            navigate(`/tiket-servis/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan diagnosis");
        } finally {
            setLoading(false);
            setUploadModal(prev => ({ ...prev, isOpen: false }));
        }
    }

    const masalahStats = useMemo(() => getStats(form.masalah), [form.masalah]);
    const solusiStats = useMemo(() => getStats(form.solusi), [form.solusi]);

    const checkedCount = Object.keys(checklistStatus).filter(
        k => checklistStatus[k]?.status === "ok" || checklistStatus[k]?.status === "issue"
    ).length;
    const issueCount = Object.keys(checklistStatus).filter(
        k => checklistStatus[k]?.status === "issue"
    ).length;

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
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                {diagnosisId ? "Edit Hasil Diagnosis" : "Input Hasil Diagnosis"}
                            </h1>
                            {tiket?.nomor_tiket && (
                                <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                                    {tiket.nomor_tiket}
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Catat temuan masalah teknis, cek fungsi komponen, dan ajukan estimasi penawaran servis
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-6">
                
                {/* 1. Checklist Cek Fungsi Komponen & Auto-Type */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-blue-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Cek Fungsi Komponen (Auto-Type Laporan)
                                </h2>
                                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {checkedCount}/{HARDWARE_ITEMS.length} Dicek
                                </span>
                                {issueCount > 0 && (
                                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                        {issueCount} Bermasalah
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Klik OK / Bermasalah pada komponen. Format teks laporan otomatis tersusun di kotak temuan masalah secara natural.
                            </p>
                        </div>

                        {/* Controls & Quick Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Toggle Format: Paragraf vs Bullet */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleFormatModeChange("paragraph")}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                        formatMode === "paragraph"
                                            ? "bg-white text-blue-700 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                    title="Format kalimat mengalir santai (cth: fungsi port USB, keyboard, baterai ok)"
                                >
                                    <AlignLeft className="w-3.5 h-3.5" />
                                    <span>Paragraf</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleFormatModeChange("bullet")}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                        formatMode === "bullet"
                                            ? "bg-white text-blue-700 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                    title="Format poin per baris (cth: • port USB ok)"
                                >
                                    <List className="w-3.5 h-3.5" />
                                    <span>Poin List</span>
                                </button>
                            </div>

                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={autoSync}
                                    onChange={(e) => setAutoSync(e.target.checked)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <span>Auto-Sync</span>
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
                                title="Tandai semua komponen OK"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>Semua OK</span>
                            </button>

                            {issueCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSuggestSolutions}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 text-xs font-semibold transition-all cursor-pointer"
                                    title="Salin rekomendasi perbaikan untuk komponen bermasalah ke kotak Solusi"
                                >
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Solusi Part Rusak ({issueCount})</span>
                                </button>
                            )}

                            {checkedCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleResetChecklist}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 text-xs transition-all cursor-pointer"
                                    title="Reset checklist"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grid Hardware Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {HARDWARE_ITEMS.map((item) => {
                            const ItemIcon = item.icon;
                            const itemData = checklistStatus[item.key] || {};
                            const isOk = itemData.status === "ok";
                            const isIssue = itemData.status === "issue";
                            const qty = itemData.qty || item.defaultQty || 1;
                            const note = itemData.note || "";

                            return (
                                <div
                                    key={item.key}
                                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                                        isOk 
                                            ? "bg-emerald-50/40 border-emerald-300 shadow-2xs" 
                                            : isIssue 
                                                ? "bg-rose-50/50 border-rose-300 shadow-2xs" 
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    {/* Header Komponen & Qty Stepper */}
                                    <div className="flex items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <ItemIcon className={`w-4 h-4 shrink-0 ${
                                                isOk ? "text-emerald-600" : isIssue ? "text-rose-600" : "text-slate-400"
                                            }`} />
                                            <span className="text-xs font-bold text-slate-800 truncate">
                                                {item.label}
                                            </span>
                                        </div>

                                        {item.hasQty && (
                                            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0 select-none">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQtyChange(item.key, -1)}
                                                    className="w-4 h-4 flex items-center justify-center text-slate-600 hover:bg-white rounded cursor-pointer"
                                                    title="Kurangi slot/port"
                                                >
                                                    <Minus className="w-2.5 h-2.5" />
                                                </button>
                                                <span className="text-3xs font-bold px-1 text-slate-700">
                                                    {qty} {item.unit}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQtyChange(item.key, 1)}
                                                    className="w-4 h-4 flex items-center justify-center text-slate-600 hover:bg-white rounded cursor-pointer"
                                                    title="Tambah slot/port"
                                                >
                                                    <Plus className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons: OK vs Bermasalah */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(item.key, "ok")}
                                            className={`py-1 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                                isOk
                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                    : "bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200"
                                            }`}
                                        >
                                            <Check className="w-3 h-3" />
                                            <span>OK</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(item.key, "issue")}
                                            className={`py-1 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                                isIssue
                                                    ? "bg-rose-600 text-white shadow-xs"
                                                    : "bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200"
                                            }`}
                                        >
                                            <X className="w-3 h-3" />
                                            <span>Bermasalah</span>
                                        </button>
                                    </div>

                                    {/* Input Catatan Spesifik (cth: ada 2 garis vertikal, klik tidak fungsi, dll.) */}
                                    <input
                                        type="text"
                                        value={note}
                                        onChange={(e) => handleNoteChange(item.key, e.target.value)}
                                        placeholder="Catatan (cth: 2 garis vertikal)"
                                        className={`w-full px-2 py-1 text-2xs rounded-lg border outline-none transition-all placeholder:text-slate-400 ${
                                            isIssue 
                                                ? "bg-white border-rose-200 text-rose-900 focus:border-rose-500" 
                                                : isOk && note
                                                    ? "bg-white border-emerald-200 text-emerald-900 focus:border-emerald-500"
                                                    : "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500"
                                        }`}
                                    />
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
                            placeholder="Tuliskan spesifikasi unit, kronologi, atau gunakan checklist di atas untuk menyusun laporan pengecekan otomatis..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-y min-h-[140px] text-sm text-slate-900 leading-relaxed font-sans placeholder:text-slate-400"
                            required
                        />

                        {/* Note & Real-time Counter */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mt-2 text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                Tuliskan rincian hasil pengecekan. Maksimal {MAX_TEXT_LIMIT.toLocaleString()} karakter (~750 kata).
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
                            placeholder="Rincikan tindakan servis, part yang perlu diganti (misal: cleaning pasta, aktivasi Office, ganti LCD)..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-y min-h-[130px] text-sm text-slate-900 leading-relaxed font-sans placeholder:text-slate-400"
                            required
                        />

                        {/* Note & Real-time Counter */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mt-2 text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                Solusi ini akan dijadikan acuan penawaran ke pelanggan saat disetujui.
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

                    {/* Dokumentasi Temuan & Bukti Diagnosis (Foto & Video) */}
                    <PhotoUploadSection
                        label="Dokumentasi Temuan & Bukti Diagnosis"
                        sublabel="Foto atau rekam video bukti kerusakan (layar flicker, korslet, komponen terbakar, dll). Otomatis dikompresi ke format streaming."
                        maxPhotos={25}
                        photos={fotos}
                        onChange={setFotos}
                        allowVideo={true}
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

            {/* Network Media Upload Loading Modal */}
            <MediaProcessingModal {...uploadModal} />
        </div>
    );
}
