import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { ArrowLeft, Edit, Save, Trash2, CheckCircle2, XCircle, AlertCircle, Phone, MapPin, Search, Plus, Filter, MonitorSmartphone, User, Info, FileText, Wrench, ClipboardList, Send, Package, Camera, ExternalLink, MessageCircle, CheckCircle, ArrowRight, PenTool, FileCheck, AlertTriangle, ShieldCheck, Award, KeyRound, Lock, Eye, EyeOff, History, Calendar, Clock, Copy, Check, ChevronDown, ChevronUp, Shield, Sparkles, Smile, HardDrive, Target, BookOpen, Zap, ShieldAlert, Play, QrCode, Printer, Laptop, RotateCcw, Layers } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";
import SopWaModal from "../../components/SopWaModal";
import WarrantyCertificateModal from "../../components/WarrantyCertificateModal";
import TicketQrModal from "../../components/TicketQrModal";
import BpbsPrintModal from "../../components/BpbsPrintModal";
import { CHECKLIST_ITEMS, QC_CHECKLIST_ITEMS } from "../../utils/checklistItems";
import SlaBadge, { SlaCountdownCard, SLA_PENGERJAAN_PACKAGES } from "../../components/SlaBadge";
import DefectMapperModal, { DefectMapBadge } from "../../components/DefectMapperModal";
import RepairWikiDetailModal from "../wiki/RepairWikiDetailModal";
import PhotoUploadSection from "../../components/PhotoUploadSection";


const STATUS_LABELS = {
    diterima: { label: "Diterima", color: "bg-blue-50 text-blue-700 border-blue-200" },
    didiagnosis: { label: "Didiagnosis", color: "bg-purple-50 text-purple-700 border-purple-200" },
    menunggu_persetujuan: { label: "Menunggu Persetujuan", color: "bg-amber-50 text-amber-700 border-amber-200" },
    disetujui: { label: "Disetujui", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    dalam_perbaikan: { label: "Dalam Perbaikan", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    selesai: { label: "Selesai", color: "bg-green-50 text-green-700 border-green-200" },
    diambil: { label: "Diambil", color: "bg-slate-50 text-slate-700 border-slate-200" },
    dibatalkan: { label: "Dibatalkan", color: "bg-red-50 text-red-600 border-red-200" },
};

const STATUS_TRANSITIONS = {
    diterima: ["didiagnosis", "dibatalkan"],
    didiagnosis: ["menunggu_persetujuan", "dibatalkan"],
    menunggu_persetujuan: ["disetujui", "dibatalkan"],
    disetujui: ["dalam_perbaikan", "dibatalkan"],
    dalam_perbaikan: ["selesai"],
    selesai: ["diambil"],
    diambil: [],
    dibatalkan: [],
};

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

function generateWaLink(tiket) {
    if (!tiket || !tiket.perangkat?.customer) return "#";
    const customer = tiket.perangkat.customer;
    let phone = (customer.nomor_telepon || "").replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    
    let text = "";

    if (tiket.status === "menunggu_persetujuan") {
        text = `Halo kak ${customer.nama},

Terkait perangkat *${tiket.perangkat.merek} ${tiket.perangkat.model}* dengan nomor tiket *${tiket.nomor_tiket}*, teknisi kami telah selesai melakukan pengecekan.

*Hasil Diagnosis:*
Masalah: ${tiket.diagnosis?.masalah || "Telah kami periksa (Mohon hubungi admin untuk detail)"}
Solusi: ${tiket.diagnosis?.solusi || "Menunggu konfirmasi tindakan lebih lanjut"}

*Estimasi Biaya:* ${formatRupiah(tiket.diagnosis?.estimasi_biaya || 0)}

Apakah perbaikan ingin dilanjutkan? Mohon konfirmasinya ya kak. Terima kasih!`;
    } else if (tiket.status === "selesai") {
        const tagihanInfo = tiket.invoice ? `\n*Total Tagihan:* ${formatRupiah(tiket.invoice.total_biaya)}\n` : "";
        text = `Halo kak ${customer.nama},

Kabar gembira! Perbaikan perangkat *${tiket.perangkat.merek} ${tiket.perangkat.model}* milik kakak dengan nomor tiket *${tiket.nomor_tiket}* telah selesai dikerjakan oleh teknisi kami.
${tagihanInfo}
Perangkat sudah bisa diambil di toko pada jam operasional kami. Mohon tunjukkan nomor tiket ini saat pengambilan.

Terima kasih telah mempercayakan perbaikan perangkat Anda kepada kami!`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

const MAINTENANCE_TIPS = {
    "Baterai": [
        "Hindari menggunakan laptop di atas kasur/bantal agar sirkulasi udara tidak tersumbat.",
        "Cobalah untuk tidak mengisi daya terus-menerus saat baterai sudah 100%.",
        "Jangan biarkan baterai habis total (0%) terlalu sering."
    ],
    "SSD / Storage": [
        "Sisakan kapasitas penyimpanan minimal 15-20% agar kecepatan SSD tetap optimal.",
        "Hindari mematikan perangkat secara paksa (shutdown via tombol power) saat proses simpan data.",
        "Lakukan backup berkala untuk data-data penting Anda."
    ],
    "Layar / LCD": [
        "Bersihkan layar menggunakan kain microfiber halus (hindari cairan berbahan alkohol keras).",
        "Hindari menutup layar laptop dengan benda keras (pulpen/headset) di atas keyboard.",
        "Buka dan tutup engsel layar dari bagian tengah, bukan dari pojok."
    ],
    "Pembersihan & Thermal Paste": [
        "Bersihkan debu ventilasi udara secara berkala.",
        "Disarankan melakukan repaste dan servis pembersihan berkala setiap 6-12 bulan.",
        "Pastikan kipas pendingin berputar lancar saat perangkat digunakan."
    ],
    "Software / OS": [
        "Rutin lakukan update sistem operasi dan antivirus.",
        "Hindari mengunduh file atau software dari sumber yang tidak terpercaya.",
        "Bersihkan file temporary/cache secara berkala."
    ],
    "Umum": [
        "Gunakan charger original atau berkualitas tinggi sesuai spesifikasi perangkat.",
        "Simpan perangkat di tempat kering dan terhindar dari paparan matahari langsung.",
        "Gunakan tas laptop bermaterial tebal saat bepergian."
    ]
};

function generateWarrantyWaLink(tiket) {
    if (!tiket || !tiket.perangkat?.customer) return "#";
    const customer = tiket.perangkat.customer;
    let phone = (customer.nomor_telepon || "").replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    
    const kategori = tiket.kategori_perbaikan || "Umum";
    const durasi = tiket.durasi_garansi || "1 Bulan";
    const tipsList = MAINTENANCE_TIPS[kategori] || MAINTENANCE_TIPS["Umum"];
    const tipsText = tipsList.map((tip, idx) => `${idx + 1}. ${tip}`).join("\n");
    
    let expiredInfo = "";
    if (tiket.garansi_berakhir_at) {
        const expDateStr = new Date(tiket.garansi_berakhir_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
        expiredInfo = `\nGaransi Berlaku Hingga: *${expDateStr}*`;
    }

    let text = `Halo kak ${customer.nama},

Terima kasih telah melakukan perbaikan perangkat *${tiket.perangkat.merek} ${tiket.perangkat.model}* (No. Tiket: *${tiket.nomor_tiket}*) di YVS Computer.

*Info Garansi Perbaikan:*
Durasi Garansi: *${durasi}*${expiredInfo}
*(Garansi berlaku untuk perbaikan / sparepart yang diganti)*

*Tips Perawatan Perangkat (${kategori}):*
${tipsText}

Jika ada kendala selama masa garansi, jangan ragu untuk menghubungi kami atau membawa kembali unit ke toko. Semoga perangkatnya awet dan lancar selalu ya kak!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function generateReminderWaLink(tiket, months) {
    if (!tiket || !tiket.perangkat?.customer) return "#";
    const customer = tiket.perangkat.customer;
    let phone = customer.nomor_telepon || "";
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    
    let text = `Halo kak ${customer.nama},

Kami dari YVS Computer ingin mengingatkan kembali terkait perangkat *${tiket.perangkat.merek} ${tiket.perangkat.model}* milik kakak dengan nomor tiket *${tiket.nomor_tiket}*.

Perangkat kakak telah selesai diperbaiki sejak ${months} bulan yang lalu dan saat ini masih berada di toko kami. Mohon kesediaannya untuk segera mengambil perangkat tersebut pada jam operasional toko kami.

Apabila ada kendala dalam pengambilan, mohon konfirmasikan kepada kami. Terima kasih!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function TiketServisDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin, isTeknisi, user } = useAuth();
    const [tiket, setTiket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [catatanAdmin, setCatatanAdmin] = useState("");
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [kategoriPerbaikan, setKategoriPerbaikan] = useState("Umum");
    const [durasiGaransi, setDurasiGaransi] = useState("1 Bulan");
    const [isSavingWarrantyConfig, setIsSavingWarrantyConfig] = useState(false);

    // Feature 4: Device Credential Vault State
    const [showVaultPassword, setShowVaultPassword] = useState(false);
    const [isEditingVault, setIsEditingVault] = useState(false);
    const [vaultTipeKunci, setVaultTipeKunci] = useState("Tidak Ada");
    const [vaultPassword, setVaultPassword] = useState("");
    const [isSavingVault, setIsSavingVault] = useState(false);
    const [copiedVault, setCopiedVault] = useState(false);

    // Service Protocols & Permissions State
    const [isSopWaModalOpen, setIsSopWaModalOpen] = useState(false);
    const [sopWaInitialScenario, setSopWaInitialScenario] = useState("");
    const [isEditingSopPermissions, setIsEditingSopPermissions] = useState(false);
    const [sopIzinBongkar, setSopIzinBongkar] = useState(true);
    const [sopIzinAksesOs, setSopIzinAksesOs] = useState(true);
    const [sopIzinBackupMandiri, setSopIzinBackupMandiri] = useState(true);
    const [sopBatasanIzin, setSopBatasanIzin] = useState("");
    const [sopPrioritasPelanggan, setSopPrioritasPelanggan] = useState("Standar");
    const [sopKondisiFisik, setSopKondisiFisik] = useState("Bersih");
    const [sopSpesifikasiAwal, setSopSpesifikasiAwal] = useState("");
    const [isSavingSopPermissions, setIsSavingSopPermissions] = useState(false);

    // Feature 2.1: Handover QC Inspection Modal State
    const [isQcModalOpen, setIsQcModalOpen] = useState(false);
    const [isSavingQc, setIsSavingQc] = useState(false);
    const [qcModalData, setQcModalData] = useState({
        power_test: false,
        display_test: false,
        keyboard_touchpad: false,
        audio_multimedia: false,
        port_io_connectivity: false,
        os_thermal_performance: false,
        clean_wow: false,
        accessories_handover: false,
        passed_qc: false,
        catatan_qc: ""
    });
    const [qcPhotos, setQcPhotos] = useState([]);

    // Dual-Phase SLA: ACC & Estimasi SLA Pengerjaan Modal State
    const [isAccModalOpen, setIsAccModalOpen] = useState(false);
    const [accTargetStatus, setAccTargetStatus] = useState("disetujui");
    const [accSlaPaket, setAccSlaPaket] = useState("reguler");
    const [accUseCustomDate, setAccUseCustomDate] = useState(false);
    const [accCustomTargetDate, setAccCustomTargetDate] = useState("");
    const [isSubmittingAcc, setIsSubmittingAcc] = useState(false);

    // Collapsible Drawers & Accordions State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSopOpen, setIsSopOpen] = useState(false);
    const [isQcOpen, setIsQcOpen] = useState(false);
    const [isWikiOpen, setIsWikiOpen] = useState(false);
    const [isIntakeChecklistOpen, setIsIntakeChecklistOpen] = useState(false);
    
    // Digital Warranty Certificate Modal
    const [isWarrantyCertModalOpen, setIsWarrantyCertModalOpen] = useState(false);

    // Feature 1: Defect Mapper State
    const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
    const [isSavingDefectMap, setIsSavingDefectMap] = useState(false);

    // Feature 6: Internal Repair Wiki State
    const [wikiSuggestions, setWikiSuggestions] = useState([]);
    const [loadingWikiSuggestions, setLoadingWikiSuggestions] = useState(false);
    const [activeWikiModal, setActiveWikiModal] = useState(null);
    const [isSavingToWiki, setIsSavingToWiki] = useState(false);

    async function handleSaveDefectMap(newMap) {
        try {
            setIsSavingDefectMap(true);
            await api.patch(`/tiket-servis/${id}/defect-map`, { defect_map: newMap });
            setTiket(prev => ({ ...prev, defect_map: newMap }));
            toast.success("Peta cacat fisik berhasil disimpan!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan peta cacat fisik");
        } finally {
            setIsSavingDefectMap(false);
        }
    }

    async function fetchWikiSuggestions(merek, model, keluhan) {
        try {
            setLoadingWikiSuggestions(true);
            const res = await api.get("/repair-wiki/suggestions", {
                params: { merek, model, keluhan }
            });
            setWikiSuggestions(res.data || []);
        } catch (err) {
            console.error("Gagal memuat saran wiki", err);
        } finally {
            setLoadingWikiSuggestions(false);
        }
    }

    async function handleSaveToWiki() {
        try {
            setIsSavingToWiki(true);
            const res = await api.post(`/repair-wiki/from-tiket/${id}`);
            toast.success(res.data?.message || "Solusi tiket berhasil disalin ke Pustaka Wiki Toko!");
            if (tiket?.perangkat) {
                fetchWikiSuggestions(tiket.perangkat.merek, tiket.perangkat.model, tiket.keluhan);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan ke wiki");
        } finally {
            setIsSavingToWiki(false);
        }
    }

    // Modals state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTakeOverModalOpen, setIsTakeOverModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isBpbsModalOpen, setIsBpbsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [batalForm, setBatalForm] = useState({
        alasan_batal: "Biaya melebihi budget pelanggan",
        catatan_batal: "",
        biaya_pembatalan: 0
    });
    const [isSubmittingBatal, setIsSubmittingBatal] = useState(false);
    const [partBekasStatus, setPartBekasStatus] = useState("belum_diserahkan");
    const [partBekasCatatan, setPartBekasCatatan] = useState("");
    const [isSavingPartBekas, setIsSavingPartBekas] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Sparepart use form
    const [spareparts, setSpareparts] = useState([]);
    const [sparepartForm, setSparepartForm] = useState({ sparepart_id: "", jumlah: 1 });
    const [sparepartSearchQuery, setSparepartSearchQuery] = useState("");
    const [sparepartCategoryFilter, setSparepartCategoryFilter] = useState("");
    const [useSparepartLoading, setUseSparepartLoading] = useState(false);

    useEffect(() => {
        fetchTiket();
        api.get("/sparepart").then((res) => setSpareparts(res.data)).catch(() => { });
    }, [id]);

    async function fetchTiket() {
        try {
            const res = await api.get(`/tiket-servis/${id}`);
            setTiket(res.data);
            setSelectedStatus("");
            setKategoriPerbaikan(res.data.kategori_perbaikan || "Umum");
            setDurasiGaransi(res.data.durasi_garansi || "1 Bulan");
            setVaultTipeKunci(res.data.tipe_kunci || "Tidak Ada");
            setVaultPassword(res.data.password_perangkat || "");
            
            // SOP protocol & permission fields
            setSopIzinBongkar(res.data.izin_bongkar ?? true);
            setSopIzinAksesOs(res.data.izin_akses_os ?? true);
            setSopIzinBackupMandiri(res.data.izin_backup_mandiri ?? true);
            setSopBatasanIzin(res.data.batasan_izin || "");
            setSopPrioritasPelanggan(res.data.prioritas_pelanggan || "Standar");
            setSopKondisiFisik(res.data.kondisi_fisik || "Bersih");
            setSopSpesifikasiAwal(res.data.spesifikasi_awal || "");
            setPartBekasStatus(res.data.status_part_bekas || "belum_diserahkan");
            setPartBekasCatatan(res.data.catatan_part_bekas || "");
            if (res.data.alasan_batal) {
                setBatalForm({
                    alasan_batal: res.data.alasan_batal || "Biaya melebihi budget pelanggan",
                    catatan_batal: res.data.catatan_batal || "",
                    biaya_pembatalan: res.data.biaya_pembatalan || 0
                });
            }

            // Fetch Wiki hardware suggestions
            if (res.data?.perangkat) {
                fetchWikiSuggestions(res.data.perangkat.merek, res.data.perangkat.model, res.data.keluhan);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleOpenAccModal(targetStatus = "disetujui") {
        setAccTargetStatus(targetStatus);
        setAccSlaPaket(tiket?.sla_paket || "reguler");
        if (tiket?.target_selesai_at) {
            setAccUseCustomDate(true);
            const d = new Date(tiket.target_selesai_at);
            const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setAccCustomTargetDate(localIso);
        } else {
            setAccUseCustomDate(false);
            setAccCustomTargetDate("");
        }
        setIsAccModalOpen(true);
    }

    async function handleConfirmAcc() {
        setIsSubmittingAcc(true);
        try {
            const payload = {
                status: accTargetStatus || "disetujui",
                sla_paket: accSlaPaket,
                kategori_perbaikan: kategoriPerbaikan,
                durasi_garansi: durasiGaransi,
            };

            // Jika belum memiliki disetujui_at, set ke timestamp sekarang
            if (!tiket.disetujui_at) {
                payload.disetujui_at = new Date().toISOString();
            }

            if (accUseCustomDate && accCustomTargetDate) {
                payload.target_selesai_at = new Date(accCustomTargetDate).toISOString();
            } else {
                const approvalDate = tiket.disetujui_at ? new Date(tiket.disetujui_at) : new Date();
                const pkg = SLA_PENGERJAAN_PACKAGES.find(p => p.id === accSlaPaket) || SLA_PENGERJAAN_PACKAGES[1];
                const target = new Date(approvalDate.getTime() + (pkg.hours * 60 * 60 * 1000));
                payload.target_selesai_at = target.toISOString();
            }

            if (catatanAdmin && isAdmin) {
                payload.catatan_admin = catatanAdmin;
            }

            await api.put(`/tiket-servis/${id}`, payload);
            toast.success(`Estimasi SLA Pengerjaan (${accSlaPaket.toUpperCase()}) berhasil diaktifkan!`);
            setIsAccModalOpen(false);
            setCatatanAdmin("");
            setSelectedStatus("");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan estimasi SLA persetujuan");
        } finally {
            setIsSubmittingAcc(false);
        }
    }

    function handleOpenStatusModal(targetStatus) {
        setSelectedStatus(targetStatus);

        // Intercept jika status dibatalkan
        if (targetStatus === "dibatalkan") {
            setIsCancelModalOpen(true);
            return;
        }

        // Intercept jika transisi ke disetujui atau dalam_perbaikan dan belum di-ACC pelanggan (khusus Admin)
        if ((targetStatus === "disetujui" || targetStatus === "dalam_perbaikan") && !tiket.disetujui_at && isAdmin) {
            handleOpenAccModal(targetStatus);
            return;
        }

        // Feature 2.1: Intercept status transition to selesai or diambil if QC not passed
        if ((targetStatus === "selesai" || targetStatus === "diambil") && !tiket.checklist_qc?.passed_qc) {
            const currentQc = tiket.checklist_qc || {};
            setQcModalData({
                power_test: Boolean(currentQc.power_test ?? currentQc.baterai),
                display_test: Boolean(currentQc.display_test),
                keyboard_touchpad: Boolean(currentQc.keyboard_touchpad ?? (currentQc.keyboard && currentQc.touchpad)),
                audio_multimedia: Boolean(currentQc.audio_multimedia ?? (currentQc.sound || currentQc.webcam)),
                port_io_connectivity: Boolean(currentQc.port_io_connectivity ?? (currentQc.usb_port || currentQc.wifi_lan)),
                os_thermal_performance: Boolean(currentQc.os_thermal_performance ?? (currentQc.os_status || currentQc.software)),
                clean_wow: Boolean(currentQc.clean_wow ?? currentQc.cleaning_done ?? currentQc.kebersihan),
                accessories_handover: Boolean(currentQc.accessories_handover),
                passed_qc: false,
                catatan_qc: currentQc.catatan_qc || ""
            });
            let existingSelesaiPhotos = [];
            if (tiket?.foto_selesai) {
                try {
                    existingSelesaiPhotos = typeof tiket.foto_selesai === "string" ? JSON.parse(tiket.foto_selesai) : tiket.foto_selesai;
                } catch (e) { existingSelesaiPhotos = []; }
            }
            setQcPhotos(existingSelesaiPhotos || []);
            setIsQcModalOpen(true);
            return;
        }

        setIsUpdatingStatus(true);
    }

    async function handleExecuteCancel(e) {
        e.preventDefault();
        setIsSubmittingBatal(true);
        try {
            await api.put(`/tiket-servis/${id}`, {
                status: "dibatalkan",
                alasan_batal: batalForm.alasan_batal,
                catatan_batal: batalForm.catatan_batal,
                biaya_pembatalan: Number(batalForm.biaya_pembatalan || 0)
            });
            toast.success("Tiket servis berhasil dibatalkan.");
            setIsCancelModalOpen(false);
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal membatalkan tiket");
        } finally {
            setIsSubmittingBatal(false);
        }
    }

    async function handleSavePartBekas() {
        setIsSavingPartBekas(true);
        try {
            await api.put(`/tiket-servis/${id}`, {
                status_part_bekas: partBekasStatus,
                catatan_part_bekas: partBekasCatatan
            });
            toast.success("Status serah terima part bekas berhasil diperbarui.");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui status part bekas");
        } finally {
            setIsSavingPartBekas(false);
        }
    }

    function handleStatusChangeClick() {
        if (!selectedStatus) return;
        handleOpenStatusModal(selectedStatus);
    }

    async function executeStatusChange() {
        setIsUpdatingStatus(false);
        try {
            const payload = { 
                status: selectedStatus,
                kategori_perbaikan: kategoriPerbaikan,
                durasi_garansi: durasiGaransi
            };
            if (catatanAdmin && isAdmin) {
                payload.catatan_admin = catatanAdmin;
            }
            await api.put(`/tiket-servis/${id}`, payload);
            toast.success(`Status tiket berhasil diubah menjadi "${STATUS_LABELS[selectedStatus]?.label || selectedStatus}"`);
            setCatatanAdmin("");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengubah status");
        }
    }

    async function handleTakeOver() {
        if (!user) return;
        try {
            await api.put(`/tiket-servis/${id}`, { 
                teknisi_id: user.id,
                status: "didiagnosis"
            });
            toast.success("Berhasil mengambil alih tiket! Status tiket kini: Didiagnosis");
            setIsTakeOverModalOpen(false);
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengambil alih tiket");
        }
    }

    function getReminderDue(tiket) {
        if (tiket.status !== "selesai" || !tiket.completed_at) return null;
        
        const completedDate = new Date(tiket.completed_at);
        const now = new Date();
        
        const diffTime = Math.abs(now - completedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 90 && tiket.last_reminder_sent < 3) return 3;
        if (diffDays >= 60 && tiket.last_reminder_sent < 2) return 2;
        if (diffDays >= 30 && tiket.last_reminder_sent < 1) return 1;
        
        return null;
    }

    async function handleSendReminder(months) {
        setIsSendingReminder(true);
        try {
            await api.put(`/tiket-servis/${id}/reminder`, { last_reminder_sent: months });
            toast.success(`Status pengingat ${months} bulan berhasil disimpan!`);
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui status pengingat");
        } finally {
            setIsSendingReminder(false);
        }
    }

    async function handleSaveWarrantyConfig() {
        setIsSavingWarrantyConfig(true);
        try {
            await api.put(`/tiket-servis/${id}`, {
                kategori_perbaikan: kategoriPerbaikan,
                durasi_garansi: durasiGaransi
            });
            toast.success("Pengaturan garansi & tips berhasil disimpan!");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan pengaturan garansi");
        } finally {
            setIsSavingWarrantyConfig(false);
        }
    }

    async function handleSaveVault() {
        setIsSavingVault(true);
        try {
            await api.put(`/tiket-servis/${id}`, {
                tipe_kunci: vaultTipeKunci,
                password_perangkat: vaultTipeKunci === "Tidak Ada" ? "" : vaultPassword
            });
            toast.success("Kredensial perangkat berhasil diperbarui!");
            setIsEditingVault(false);
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui kredensial");
        } finally {
            setIsSavingVault(false);
        }
    }

    async function handleSaveSopPermissions() {
        setIsSavingSopPermissions(true);
        try {
            await api.put(`/tiket-servis/${id}`, {
                izin_bongkar: sopIzinBongkar,
                izin_akses_os: sopIzinAksesOs,
                izin_backup_mandiri: sopIzinBackupMandiri,
                batasan_izin: sopBatasanIzin,
                prioritas_pelanggan: sopPrioritasPelanggan,
                kondisi_fisik: sopKondisiFisik,
                spesifikasi_awal: sopSpesifikasiAwal
            });
            toast.success("Protokol & izin standar layanan berhasil diperbarui!");
            setIsEditingSopPermissions(false);
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui izin standar layanan");
        } finally {
            setIsSavingSopPermissions(false);
        }
    }

    function handleCopyVault(text) {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedVault(true);
        setTimeout(() => setCopiedVault(false), 2000);
        toast.success("Kredensial disalin ke clipboard!");
    }

    async function handleCreateWarrantyClaim() {
        const warranty = tiket?.warranty_status;
        const confirmMsg = warranty?.isExpired 
            ? `PERHATIAN: Masa garansi unit ini telah KEDALUWARSA (berakhir pada ${warranty.garansi_berakhir_at ? new Date(warranty.garansi_berakhir_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}).\n\nApakah Anda tetap ingin menerbitkan klaim garansi retur perbaikan sebagai kebijakan toko?`
            : `Masa garansi unit ini masih AKTIF (sisa ${warranty?.sisaHari || 0} hari).\n\nTerbitkan tiket klaim garansi retur perbaikan untuk tiket #${tiket?.nomor_tiket}?`;
            
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await api.post(`/tiket-servis/${id}/claim-garansi`, { alasan: "Klaim garansi retur perbaikan." });
            toast.success(res.data.message || "Tiket klaim garansi berhasil diterbitkan!");
            navigate(`/tiket-servis/${res.data.data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menerbitkan klaim garansi");
        }
    }

    async function handleToggleQCChecklist(key, value) {
        const currentQC = tiket.checklist_qc || {};
        const updatedQC = {
            ...currentQC,
            [key]: value
        };
        if (key === "passed_qc" && value) {
            updatedQC.qc_by = user?.nama || "Teknisi / Admin";
            updatedQC.qc_at = new Date().toISOString();
        }

        try {
            await api.put(`/tiket-servis/${id}`, { checklist_qc: updatedQC });
            toast.success("Checklist Quality Control diperbarui");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui QC");
        }
    }

    async function handleApproveAllQC() {
        const finalQc = {
            power_test: true,
            display_test: true,
            keyboard_touchpad: true,
            audio_multimedia: true,
            port_io_connectivity: true,
            os_thermal_performance: true,
            clean_wow: true,
            accessories_handover: true,
            passed_qc: true,
            qc_by: user?.nama || "Teknisi / Admin",
            qc_at: new Date().toISOString(),
            catatan_qc: tiket.checklist_qc?.catatan_qc || "Lulus uji kelayakan 8 poin kendali mutu & pembersihan menyeluruh standar WOW Service."
        };

        try {
            await api.put(`/tiket-servis/${id}`, { checklist_qc: finalQc });
            toast.success("Seluruh 8 poin QC (Standar WOW) berhasil diluluskan!");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal meluluskan QC");
        }
    }

    async function handleSaveQcAndChangeStatus() {
        setIsSavingQc(true);
        try {
            const finalQc = {
                ...qcModalData,
                passed_qc: true,
                qc_by: user?.nama || "Teknisi / Admin",
                qc_at: new Date().toISOString()
            };

            const payload = { 
                status: selectedStatus,
                kategori_perbaikan: kategoriPerbaikan,
                durasi_garansi: durasiGaransi,
                checklist_qc: finalQc
            };
            if (catatanAdmin && isAdmin) {
                payload.catatan_admin = catatanAdmin;
            }

            // Simpan / unggah foto selesai servis jika ada
            if (qcPhotos && qcPhotos.length > 0) {
                const formData = new FormData();
                const existingUrls = [];
                qcPhotos.forEach(p => {
                    if (p instanceof File) {
                        formData.append("foto_selesai", p);
                    } else if (typeof p === "string") {
                        existingUrls.push(p);
                    }
                });
                formData.append("replace", "true");
                const hasNewFiles = qcPhotos.some(p => p instanceof File);
                if (hasNewFiles) {
                    try {
                        const uploadRes = await api.post(`/tiket-servis/${id}/foto-selesai`, formData, {
                            headers: { "Content-Type": "multipart/form-data" }
                        });
                        if (uploadRes.data?.foto_selesai) {
                            payload.foto_selesai = uploadRes.data.foto_selesai;
                        }
                    } catch (uploadErr) {
                        console.error("Gagal upload foto selesai:", uploadErr);
                    }
                } else {
                    payload.foto_selesai = existingUrls;
                }
            }

            await api.put(`/tiket-servis/${id}`, payload);
            toast.success(`QC berhasil diverifikasi & status diubah menjadi "${STATUS_LABELS[selectedStatus]?.label}"!`);
            setIsQcModalOpen(false);
            setCatatanAdmin("");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses QC dan status");
        } finally {
            setIsSavingQc(false);
        }
    }

    async function handleUseSparepart(e) {
        e.preventDefault();
        setUseSparepartLoading(true);

        try {
            await api.post("/sparepart/use", {
                tiket_id: Number(id),
                sparepart_id: Number(sparepartForm.sparepart_id),
                jumlah: Number(sparepartForm.jumlah),
            });
            setSparepartForm({ sparepart_id: "", jumlah: 1 });
            fetchTiket();
            // Refresh sparepart list
            const res = await api.get("/sparepart");
            setSpareparts(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menggunakan sparepart");
        } finally {
            setUseSparepartLoading(false);
        }
    }

    async function handleRemoveSparepartUsage(usageId) {
        if (!window.confirm("Apakah Anda yakin ingin membatalkan penggunaan sparepart ini? Stok akan dikembalikan ke inventaris.")) return;
        try {
            await api.delete(`/sparepart/use/${usageId}`);
            toast.success("Penggunaan sparepart berhasil dibatalkan dan stok dikembalikan!");
            fetchTiket();
            // Refresh sparepart list
            const res = await api.get("/sparepart");
            setSpareparts(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal membatalkan penggunaan sparepart");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!tiket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <FileText className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-900">Tiket tidak ditemukan</p>
                <Link to="/tiket-servis" className="mt-4 text-blue-600 hover:underline">Kembali ke Daftar Tiket</Link>
            </div>
        );
    }

    const allowedTransitions = STATUS_TRANSITIONS[tiket.status] || [];
    
    // Admin bisa mengubah semua status kapan saja.
    // Teknisi hanya bisa mengubah status JIKA tiket tersebut sudah di-assign kepadanya atau belum di-assign.
    const isAssignedToMe = isTeknisi && (
        Number(tiket.teknisi?.id) === Number(user?.id) || 
        Number(tiket.teknisi_id) === Number(user?.id) ||
        !tiket.teknisi_id
    );
    const canUpdateStatus = isAdmin || isAssignedToMe;

    // Hak Akses Staging Teknisi:
    // 1. Diterima -> Didiagnosis (via Ambil Alih)
    // 2. Didiagnosis -> Menunggu Persetujuan (selesaikan diagnosa & teruskan penawaran ke admin)
    // 3. Disetujui -> Dalam Perbaikan (teknisi mulai eksekusi setelah di-ACC)
    // 4. Dalam Perbaikan -> Selesai (teknisi verifikasi QC & selesaikan perbaikan)
    let filteredTransitions = allowedTransitions;
    if (isTeknisi && !isAdmin) {
        const teknisiAllowedTransitions = {
            diterima: ["didiagnosis"],
            didiagnosis: ["menunggu_persetujuan"],
            disetujui: ["dalam_perbaikan"],
            dalam_perbaikan: ["selesai"],
        };
        const allowedCurrent = teknisiAllowedTransitions[tiket.status] || [];
        filteredTransitions = allowedTransitions.filter(s => allowedCurrent.includes(s));
    }

    const activeLoan = tiket.peminjaman_loaner?.find(p => p.status === "aktif");

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link 
                        to="/tiket-servis" 
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">{tiket.nomor_tiket}</h1>
                            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_LABELS[tiket.status]?.color}`}>
                                {STATUS_LABELS[tiket.status]?.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Dibuat pada {new Date(tiket.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                        title="Lihat & Cetak QR Code Label Unit"
                    >
                        <QrCode className="w-4 h-4 text-blue-600" />
                        <span>QR Tiket</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsBpbsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                        title="Cetak Surat Tanda Terima Masuk (BPBS)"
                    >
                        <Printer className="w-4 h-4 text-emerald-600" />
                        <span>Cetak BPBS</span>
                    </button>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setIsSopWaModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                        </button>
                    )}

                    {isAdmin && ["diterima", "didiagnosis", "menunggu_persetujuan", "disetujui"].includes(tiket.status) && (
                        <button
                            type="button"
                            onClick={() => setIsCancelModalOpen(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
                            title="Batalkan Tiket Servis Ini"
                        >
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span className="hidden sm:inline">Batalkan Tiket</span>
                        </button>
                    )}

                    {/* Stage Action: Diterima (Claim) */}
                    {isTeknisi && !tiket.teknisi && tiket.status === "diterima" && (
                        <button
                            type="button"
                            onClick={() => setIsTakeOverModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-amber-600/20 shrink-0 cursor-pointer"
                        >
                            <Wrench className="w-4 h-4" />
                            <span>Klaim & Mulai Diagnosis</span>
                        </button>
                    )}

                    {/* Stage Action: Didiagnosis -> Penawaran */}
                    {tiket.status === "didiagnosis" && (isAdmin || isAssignedToMe) && (
                        tiket.diagnosis ? (
                            <button
                                type="button"
                                onClick={() => handleOpenStatusModal("menunggu_persetujuan")}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-blue-600/25 shrink-0 cursor-pointer"
                            >
                                <Send className="w-4 h-4" />
                                <span>Selesaikan Diagnosa & Naikkan ke Penawaran</span>
                            </button>
                        ) : (
                            <Link
                                to={`/tiket-servis/${id}/diagnosis`}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-blue-600/25 shrink-0"
                            >
                                <Search className="w-4 h-4" />
                                <span>Input Hasil Diagnosis & Estimasi</span>
                            </Link>
                        )
                    )}

                    {/* Stage Info: Menunggu Persetujuan (Teknisi) */}
                    {tiket.status === "menunggu_persetujuan" && isTeknisi && (
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold shrink-0">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Tahap Admin: Penawaran (Menunggu ACC)</span>
                        </div>
                    )}

                    {/* Stage Action: Menunggu Persetujuan (Admin ACC) */}
                    {tiket.status === "menunggu_persetujuan" && isAdmin && (
                        <button
                            type="button"
                            onClick={() => handleOpenAccModal("disetujui")}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Konfirmasi ACC Pelanggan</span>
                        </button>
                    )}

                    {/* Stage Action: Disetujui (Mulai Perbaikan) */}
                    {tiket.status === "disetujui" && (isAdmin || isAssignedToMe) && (
                        <button
                            type="button"
                            onClick={() => handleOpenStatusModal("dalam_perbaikan")}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
                        >
                            <Play className="w-4 h-4" />
                            <span>Mulai Perbaikan Unit</span>
                        </button>
                    )}

                    {/* Stage Action: Dalam Perbaikan (Selesaikan / QC) */}
                    {tiket.status === "dalam_perbaikan" && (isAdmin || isAssignedToMe) && (
                        <button
                            type="button"
                            onClick={() => handleOpenStatusModal("selesai")}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/20 shrink-0 cursor-pointer"
                        >
                            <Award className="w-4 h-4" />
                            <span>Verifikasi QC & Selesaikan Servis</span>
                        </button>
                    )}

                    {/* Stage Info: Selesai */}
                    {tiket.status === "selesai" && (
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Tahap Kasir / Admin: Siap Diambil</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Feature 7: SLA Express Queue & Countdown Alert */}
            <SlaCountdownCard 
                tiket={tiket} 
                onAccClick={isAdmin ? () => handleOpenAccModal("disetujui") : undefined}
                onEditSla={isAdmin && ["disetujui", "dalam_perbaikan"].includes(tiket?.status) ? () => handleOpenAccModal(tiket?.status) : undefined}
            />

            {/* Safety Alert: Unit Pinjaman Cadangan Belum Dikembalikan */}
            {activeLoan && ["selesai", "diambil"].includes(tiket.status) && (
                <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
                            <AlertTriangle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-sm font-extrabold text-amber-950">
                                Perhatian: Unit Pinjaman Cadangan Belum Dikembalikan!
                            </h4>
                            <p className="text-xs text-amber-900 mt-0.5">
                                Pelanggan ini meminjam unit <span className="font-bold font-mono">[{activeLoan.loaner_device?.kode_unit}] {activeLoan.loaner_device?.nama}</span>.
                                Pastikan unit cadangan telah diperiksa dan diterima kembali di rak sebelum menyerahkan perangkat utama kepada pelanggan.
                            </p>
                        </div>
                    </div>
                    <Link
                        to={`/loaner?tab=records&q=${encodeURIComponent(activeLoan?.nomor_peminjaman || '')}`}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 whitespace-nowrap"
                    >
                        Buka Menu Pinjaman →
                    </Link>
                </div>
            )}

            {/* Status Dibatalkan Alert Banner */}
            {tiket.status === "dibatalkan" && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-900 border border-rose-300">
                                    Tiket Dibatalkan
                                </span>
                                {tiket.biaya_pembatalan > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                        Biaya Cek Batal: {formatRupiah(tiket.biaya_pembatalan)}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-sm sm:text-base font-extrabold text-rose-950">
                                Alasan Pembatalan: {tiket.alasan_batal || "Tidak disebutkan"}
                            </h4>
                            {tiket.catatan_batal && (
                                <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
                                    {tiket.catatan_batal}
                                </p>
                            )}
                            <p className="text-[11px] text-rose-700/80 mt-1.5 italic">
                                * Unit dapat diserahkan kembali kepada pemilik di meja penyerahan toko.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                        <MonitorSmartphone className="w-5 h-5 text-blue-500" />
                        <h2 className="text-base font-bold text-slate-900">Informasi Perangkat</h2>
                    </div>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Customer</p>
                                <p className="font-medium text-slate-900">{tiket.perangkat?.customer?.nama}</p>
                                <p className="text-slate-500">{tiket.perangkat?.customer?.nomor_telepon}</p>

                                {tiket.perangkat?.customer && (
                                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                Profil & Gaya Komunikasi
                                            </span>
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                {tiket.perangkat.customer.tipe_kepribadian || "Netral"}
                                            </span>
                                        </div>
                                        {tiket.perangkat.customer.catatan_khusus && (
                                            <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                                <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">Catatan Khusus:</span>
                                                {tiket.perangkat.customer.catatan_khusus}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Detail Perangkat</p>
                                <p className="font-medium text-slate-900">{tiket.perangkat?.merek} {tiket.perangkat?.model}</p>
                                <p className="text-slate-600">{tiket.perangkat?.jenis_perangkat} • SN: {tiket.perangkat?.serial_number || "-"}</p>
                            </div>
                        </div>
                        {tiket.kelengkapan && (
                            <div className="flex items-start gap-3">
                                <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Kelengkapan Perangkat</p>
                                    <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">{tiket.kelengkapan}</p>
                                </div>
                            </div>
                        )}

                        {/* Feature 1: 2D Visual Scratch & Defect Mapper */}
                        <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                            <PenTool className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Peta Cacat Fisik (2D Defect Map)</p>
                                    <DefectMapBadge 
                                        value={tiket.defect_map} 
                                        onClick={() => setIsDefectModalOpen(true)} 
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                    <p className="text-slate-600">
                                        {Array.isArray(tiket.defect_map?.items) && tiket.defect_map.items.length > 0
                                            ? `${tiket.defect_map.items.length} cacat fisik terpetakan pada casing.`
                                            : "Belum ada cacat fisik yang ditandai pada blueprint 2D."}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsDefectModalOpen(true)}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                                    >
                                        {(isAdmin || isAssignedToMe) ? "Buka / Edit Peta" : "Lihat Blueprint"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Feature 4: Device Credential Vault / PIN & Lock */}
                        <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                            <KeyRound className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Kredensial / PIN Unit</p>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            {tiket.tipe_kunci || "Tidak Ada"}
                                        </span>
                                    </div>
                                    {(isAdmin || isAssignedToMe) && !isEditingVault && (
                                        <button 
                                            onClick={() => {
                                                setVaultTipeKunci(tiket.tipe_kunci || "Tidak Ada");
                                                setVaultPassword(tiket.password_perangkat || "");
                                                setIsEditingVault(true);
                                            }}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                                        >
                                            <Edit className="w-3 h-3" /> Edit
                                        </button>
                                    )}
                                </div>

                                {isEditingVault ? (
                                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-3 mt-1">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipe Kunci</label>
                                            <select
                                                value={vaultTipeKunci}
                                                onChange={(e) => setVaultTipeKunci(e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            >
                                                <option value="Tidak Ada">Tidak Ada (Tanpa Kunci/Password)</option>
                                                <option value="PIN">PIN Angka</option>
                                                <option value="Password">Password / Kata Sandi</option>
                                                <option value="Pola Kunci">Pola Gambar (Pattern)</option>
                                            </select>
                                        </div>

                                        {vaultTipeKunci !== "Tidak Ada" && (
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    {vaultTipeKunci === "PIN" ? "Kode PIN" : vaultTipeKunci === "Password" ? "Password Akun" : "Catatan Pola"}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={vaultPassword}
                                                    onChange={(e) => setVaultPassword(e.target.value)}
                                                    placeholder="Masukkan kredensial..."
                                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingVault(false)}
                                                className="px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveVault}
                                                disabled={isSavingVault}
                                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                                            >
                                                {isSavingVault ? "Menyimpan..." : "Simpan"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 flex items-center justify-between">
                                        {tiket.tipe_kunci === "Tidak Ada" || !tiket.tipe_kunci ? (
                                            <span className="text-slate-500 text-xs italic">Perangkat tanpa kunci/password</span>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="font-mono text-sm font-bold text-slate-800">
                                                        {showVaultPassword ? (tiket.password_perangkat || "(Kosong)") : "••••••••"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowVaultPassword(!showVaultPassword)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                                                        title={showVaultPassword ? "Sembunyikan" : "Tampilkan"}
                                                    >
                                                        {showVaultPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                    {tiket.password_perangkat && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyVault(tiket.password_perangkat)}
                                                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                                                            title="Salin ke Clipboard"
                                                        >
                                                            {copiedVault ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Feature 6: Unit Pinjaman (Loaner / Backup Device) */}
                        <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                            <Laptop className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Unit Pinjaman (Backup)</p>
                                    {activeLoan ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            Sedang Dipinjam
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                            Tidak Ada
                                        </span>
                                    )}
                                </div>
                                {activeLoan ? (
                                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900 font-mono">[{activeLoan.loaner_device?.kode_unit}] {activeLoan.loaner_device?.nama}</span>
                                            <Link 
                                                to={`/loaner?tab=records&q=${encodeURIComponent(activeLoan.nomor_peminjaman || '')}`} 
                                                className="text-blue-600 font-bold hover:underline text-[11px]"
                                            >
                                                Kelola Pinjaman →
                                            </Link>
                                        </div>
                                        <p className="text-slate-600 text-[11px]">
                                            Dipinjam sejak: {new Date(activeLoan.tanggal_pinjam).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                            {activeLoan.estimasi_kembali ? ` • Batas: ${new Date(activeLoan.estimasi_kembali).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : ""}
                                        </p>
                                        {activeLoan.deposit_uang > 0 && (
                                            <p className="text-slate-500 text-[10px]">
                                                Jaminan: {formatRupiah(activeLoan.deposit_uang)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                        <span className="text-slate-500 text-xs">Pelanggan belum meminjam unit cadangan.</span>
                                        <Link
                                            to={`/loaner?action=new&tiket_id=${tiket.id}`}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                                        >
                                            + Pinjamkan Unit
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                        <FileText className="w-5 h-5 text-purple-500" />
                        <h2 className="text-base font-bold text-slate-900">Detail Tiket</h2>
                    </div>
                    <div className="space-y-4 text-sm">
                        {/* QR Code Quick Card */}
                        <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                            <div className="flex items-center gap-3">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=1&data=${encodeURIComponent(tiket.nomor_tiket)}`}
                                    alt={`QR Code ${tiket.nomor_tiket}`}
                                    className="w-12 h-12 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => setIsQrModalOpen(true)}
                                    title="Klik untuk perbesar & cetak label stiker unit"
                                />
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-800">QR Code Unit</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-mono font-semibold">Label</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{tiket.nomor_tiket}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsQrModalOpen(true)}
                                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    title="Cetak Stiker Label Thermal 100mm"
                                >
                                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Label</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsBpbsModalOpen(true)}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    title="Cetak Surat Tanda Terima Masuk (BPBS A5/A4)"
                                >
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    <span>BPBS</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Wrench className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Teknisi Penanggung Jawab</p>
                                <p className="font-medium text-slate-900">{tiket.teknisi?.nama || <span className="text-amber-600 italic">Belum ditugaskan</span>}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <ClipboardList className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Keluhan Pelanggan</p>
                                <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 whitespace-pre-line">{tiket.keluhan}</p>
                            </div>
                        </div>
                        {tiket.foto_kondisi && JSON.parse(tiket.foto_kondisi).length > 0 && (
                            <div className="flex items-start gap-3">
                                <Camera className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div className="w-full">
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Foto Kondisi Awal</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {JSON.parse(tiket.foto_kondisi).map((foto, idx) => {
                                            const imageUrl = foto.startsWith('http')
    ? foto
    : `/${foto.replace(/^\/+/, '')}`;
                                            return (
                                                <button 
                                                    key={idx} 
                                                    onClick={() => setSelectedImage(imageUrl)}
                                                    className="relative shrink-0 group outline-none focus:ring-4 focus:ring-blue-500/20 rounded-xl"
                                                >
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={`Kondisi ${idx+1}`} 
                                                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm transition-transform group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                        <Search className="w-4 h-4 text-white" />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Foto Selesai Servis & QC (Maksimal 15) */}
                        {tiket.foto_selesai && (
                            (() => {
                                let selesaiPhotos = [];
                                try {
                                    selesaiPhotos = typeof tiket.foto_selesai === 'string' ? JSON.parse(tiket.foto_selesai) : tiket.foto_selesai;
                                } catch(e) { selesaiPhotos = []; }
                                if (!selesaiPhotos || selesaiPhotos.length === 0) return null;
                                return (
                                    <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                        <div className="w-full">
                                            <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                                                Foto Selesai Servis & QC ({selesaiPhotos.length})
                                            </p>
                                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                                {selesaiPhotos.map((foto, idx) => {
                                                    const imageUrl = foto.startsWith('http') ? foto : `/${foto.replace(/^\/+/, '')}`;
                                                    return (
                                                        <button 
                                                            key={idx} 
                                                            onClick={() => setSelectedImage(imageUrl)}
                                                            className="relative shrink-0 group outline-none focus:ring-4 focus:ring-emerald-500/20 rounded-xl cursor-pointer"
                                                        >
                                                            <img 
                                                                src={imageUrl} 
                                                                alt={`Selesai Servis ${idx+1}`} 
                                                                className="w-16 h-16 object-cover rounded-xl border border-emerald-200 shadow-sm transition-transform group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                                <Search className="w-4 h-4 text-white" />
                                                            </div>
                                                            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-mono px-1 rounded">
                                                                #{idx + 1}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                        {/* Intake Inspection Checklist Display */}
                        {tiket.checklist_intake && (
                            <div className="pt-3 border-t border-slate-100">
                                <div 
                                    onClick={() => setIsIntakeChecklistOpen(!isIntakeChecklistOpen)}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span className="text-xs font-semibold text-slate-800">Checklist Fisik Awal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            CHECKLIST_ITEMS.filter(i => tiket.checklist_intake[i.key]).length === CHECKLIST_ITEMS.length
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-amber-50 text-amber-800 border-amber-300"
                                        }`}>
                                            {CHECKLIST_ITEMS.filter(i => tiket.checklist_intake[i.key]).length}/{CHECKLIST_ITEMS.length} Normal
                                        </span>
                                        {isIntakeChecklistOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </div>

                                {isIntakeChecklistOpen && (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200 text-xs mt-2 transition-all">
                                        {CHECKLIST_ITEMS.map(item => {
                                            const val = tiket.checklist_intake[item.key];
                                            const ItemIcon = item.Icon;
                                            return (
                                                <div key={item.key} className={`flex items-center gap-2 p-1.5 rounded-lg border ${val ? "bg-white text-emerald-800 border-emerald-200" : "bg-white text-rose-600 border-rose-200"}`}>
                                                    <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="shrink-0">
                                                        {val ? <Check className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-500" />}
                                                    </span>
                                                    <span className={val ? "text-slate-700 font-medium truncate" : "text-slate-400 line-through truncate"}>{item.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 1. Hasil Diagnosis & Solusi */}
            {tiket.diagnosis && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-amber-500" />
                            <h2 className="text-base font-bold text-slate-900">Hasil Diagnosis</h2>
                        </div>
                        {(isAdmin || isAssignedToMe) && ["diterima", "didiagnosis", "menunggu_persetujuan"].includes(tiket.status) && (
                            <Link
                                to={`/tiket-servis/${id}/diagnosis`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit Diagnosis</span>
                            </Link>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Masalah Ditemukan</p>
                            <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 h-[calc(100%-1.5rem)]">{tiket.diagnosis.masalah}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Solusi yang Ditawarkan</p>
                            <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 h-[calc(100%-1.5rem)]">{tiket.diagnosis.solusi}</p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div>
                            <p className="text-blue-800 font-semibold text-sm">Estimasi Biaya Perbaikan</p>
                            <p className="text-blue-900 font-bold text-xl">{formatRupiah(tiket.diagnosis.estimasi_biaya)}</p>
                        </div>
                    </div>

                    {/* Foto Temuan & Bukti Diagnosis (Maks 25) */}
                    {(() => {
                        let diagPhotos = [];
                        const raw = tiket.diagnosis?.foto_diagnosis || tiket.foto_diagnosis;
                        if (raw) {
                            try { diagPhotos = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch(e) { diagPhotos = []; }
                        }
                        if (!diagPhotos || diagPhotos.length === 0) return null;
                        return (
                            <div className="mt-5 pt-5 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Camera className="w-4 h-4 text-blue-600" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Foto Temuan & Bukti Diagnosis ({diagPhotos.length})
                                    </h4>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                    {diagPhotos.map((foto, idx) => {
                                        const imageUrl = foto.startsWith('http') ? foto : `/${foto.replace(/^\/+/, '')}`;
                                        return (
                                            <button 
                                                key={idx} 
                                                type="button"
                                                onClick={() => setSelectedImage(imageUrl)}
                                                className="relative shrink-0 group outline-none rounded-xl cursor-pointer"
                                            >
                                                <img 
                                                    src={imageUrl} 
                                                    alt={`Bukti Diagnosis ${idx + 1}`} 
                                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                    <Search className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-mono px-1 rounded">
                                                    #{idx + 1}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Diagnosis Form Action */}
            {(isAdmin || (isTeknisi && isAssignedToMe)) && ["diterima", "didiagnosis"].includes(tiket.status) && !tiket.diagnosis && (
                <Link
                    to={`/tiket-servis/${id}/diagnosis`}
                    className="flex flex-col items-center justify-center p-8 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-2xl text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all group mb-6"
                >
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Search className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="font-bold text-lg">Mulai Diagnosis</span>
                    <span className="text-amber-600/70 text-sm mt-1">Periksa perangkat dan catat masalah yang ditemukan</span>
                </Link>
            )}

            {/* 2. Workbench Utama: Log Perbaikan & Penggunaan Sparepart / Invoice */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[650px] mb-6">
                {/* Log Perbaikan */}
                <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <PenTool className="w-5 h-5 text-slate-700" />
                            <h2 className="text-base font-bold text-slate-900">Log Perbaikan</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {(isAdmin || isAssignedToMe) && (tiket.status === "dalam_perbaikan" || tiket.status === "diterima" || tiket.status === "didiagnosis") && (
                                <Link to={`/tiket-servis/${id}/log`} className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 hover:underline flex items-center gap-1">
                                    <PenTool className="w-4 h-4" />
                                    Tambah Log
                                </Link>
                            )}
                            <Link to={`/tiket-servis/${id}/log`} className="text-blue-600 text-sm font-semibold hover:text-blue-700 hover:underline">
                                Lihat Semua
                            </Link>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                        {tiket.log_perbaikan?.length > 0 ? (
                            <div className="space-y-4">
                                {tiket.log_perbaikan.map((log, index) => {
                                    let dotColor = "bg-blue-500";
                                    let badgeColor = "bg-blue-100 text-blue-700";
                                    let label = "Perbaikan";

                                    if (log.fase === "Diagnosis") {
                                        dotColor = "bg-amber-500";
                                        badgeColor = "bg-amber-100 text-amber-700";
                                        label = "Diagnosis";
                                    } else if (log.fase === "Catatan Admin") {
                                        dotColor = "bg-purple-500";
                                        badgeColor = "bg-purple-100 text-purple-700";
                                        label = "Admin";
                                    }

                                    return (
                                        <div key={log.id} className="relative pl-6 pb-4 last:pb-0">
                                            {/* Timeline line */}
                                            {index !== tiket.log_perbaikan.length - 1 && (
                                                <div className="absolute left-[7px] top-6 bottom-[-8px] w-px bg-slate-200"></div>
                                            )}
                                            {/* Timeline dot */}
                                            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${dotColor}`}></div>
                                            
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm text-sm">
                                                <div className="mb-2">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>{label}</span>
                                                </div>
                                                <p className="text-slate-800 mb-2 whitespace-pre-line">{log.catatan}</p>
                                            {log.foto_url && (
                                                <div className="mb-3">
                                                    <a href={log.foto_url} target="_blank" rel="noreferrer" className="block w-fit">
                                                        <img 
                                                            src={log.foto_url} 
                                                            alt="Dokumentasi Perbaikan" 
                                                            className="h-20 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                            <p className="text-xs font-medium text-slate-400 mt-2">
                                                {new Date(log.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                                <ClipboardList className="w-10 h-10 text-slate-200 mb-3" />
                                <p className="text-sm font-medium text-slate-900">Belum ada log</p>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Catatan perbaikan akan muncul di sini</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                    {/* Penggunaan Sparepart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                            <Package className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-bold text-slate-900">Penggunaan Sparepart</h2>
                        </div>

                        {tiket.penggunaan_sparepart?.length > 0 ? (
                            <div className="flex-1 overflow-auto mb-6 custom-scrollbar min-h-0">
                                <table className="w-full text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                                            <th className="py-3 px-4 font-semibold rounded-tl-lg">Sparepart</th>
                                            <th className="py-3 px-4 font-semibold text-center">Jumlah</th>
                                            <th className="py-3 px-4 font-semibold text-right">Harga Satuan</th>
                                            <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
                                            <th className="py-3 px-4 font-semibold text-center rounded-tr-lg w-24">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tiket.penggunaan_sparepart.map((ps) => (
                                            <tr key={ps.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-900">{(ps.sparepart?.brand?.nama && ps.sparepart.brand.nama.toLowerCase() !== "lainnya" ? ps.sparepart.brand.nama + " " : "") + ps.sparepart?.nama}</td>
                                                <td className="py-3 px-4 text-center text-slate-600">{ps.jumlah}</td>
                                                <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(ps.sparepart?.harga)}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatRupiah(ps.sparepart?.harga * ps.jumlah)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            to={`/rma?action=new&sparepart_id=${ps.sparepart_id}&tiket_id=${tiket.id}`}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center justify-center"
                                                            title="Klaim Retur Garansi Distributor (RMA)"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </Link>
                                                        {(isTeknisi || isAdmin) && tiket.status === "dalam_perbaikan" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSparepartUsage(ps.id)}
                                                                title="Batalkan penggunaan sparepart (kembalikan ke stok)"
                                                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-slate-200 font-semibold bg-slate-50/50">
                                        <tr>
                                            <td colSpan="3" className="py-3 px-4 text-right text-slate-700">Total Sparepart:</td>
                                            <td className="py-3 px-4 text-right text-slate-900">
                                                {formatRupiah(tiket.penggunaan_sparepart.reduce((acc, ps) => acc + (ps.sparepart?.harga * ps.jumlah), 0))}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 mb-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <Package className="w-10 h-10 text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-900">Tidak ada sparepart</p>
                                <p className="text-xs text-slate-500 mt-1">Belum ada suku cadang yang digunakan untuk perbaikan ini.</p>
                            </div>
                        )}

                        {/* Feature 5: Pengembalian Sparepart Bekas / Copotan (SOP Yangversa) */}
                        {tiket.penggunaan_sparepart?.length > 0 && (
                            <div className="mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                        <RotateCcw className="w-4 h-4 text-indigo-600" />
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Status Serah Terima Sparepart Bekas (SOP Yangversa)
                                        </span>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                        (partBekasStatus || tiket.status_part_bekas) === "diserahkan_ke_pelanggan"
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                            : (partBekasStatus || tiket.status_part_bekas) === "titip_buang_ewaste"
                                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                : "bg-slate-200 text-slate-700"
                                    }`}>
                                        {(partBekasStatus || tiket.status_part_bekas) === "diserahkan_ke_pelanggan"
                                            ? "✓ Diserahkan ke Pelanggan"
                                            : (partBekasStatus || tiket.status_part_bekas) === "titip_buang_ewaste"
                                                ? "♻ Titip Buang Bengkel (E-Waste)"
                                                : "Belum Diserahkan"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mb-3">
                                    SOP Transparansi Toko: Seluruh komponen lama yang diganti wajib ditunjukkan dan diserahkan kembali kepada pelanggan saat serah terima unit, kecuali jika pelanggan menitipkannya untuk dibuang.
                                </p>
                                {(isAdmin || isAssignedToMe) && ["dalam_perbaikan", "selesai", "diambil"].includes(tiket.status) && (
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
                                        <select
                                            value={partBekasStatus}
                                            onChange={(e) => setPartBekasStatus(e.target.value)}
                                            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="belum_diserahkan">Belum Diserahkan</option>
                                            <option value="diserahkan_ke_pelanggan">Diserahkan ke Pelanggan</option>
                                            <option value="titip_buang_ewaste">Titip Buang Bengkel (E-Waste)</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={partBekasCatatan}
                                            onChange={(e) => setPartBekasCatatan(e.target.value)}
                                            placeholder="Catatan (misal: LCD lama & baterai ditaruh di box unit)"
                                            className="w-full sm:flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSavePartBekas}
                                            disabled={isSavingPartBekas}
                                            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                                        >
                                            {isSavingPartBekas ? "Menyimpan..." : "Simpan Status Part"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Form tambah sparepart */}
                        {(isTeknisi || isAdmin) && tiket.status === "dalam_perbaikan" && (
                            <div className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-100 shrink-0 mt-auto">
                                <h3 className="text-sm font-bold text-indigo-900 mb-3">Tambah Penggunaan Suku Cadang</h3>
                                <form onSubmit={handleUseSparepart} className="flex flex-col sm:flex-row gap-3 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Pilih Sparepart</label>
                                        
                                        {/* Filter Controls */}
                                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 text-indigo-400" />
                                                </div>
                                                <input 
                                                    type="text"
                                                    placeholder="Ketik untuk mencari sparepart..."
                                                    value={sparepartSearchQuery}
                                                    onChange={(e) => setSparepartSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-white/60 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                            <select
                                                value={sparepartCategoryFilter}
                                                onChange={(e) => setSparepartCategoryFilter(e.target.value)}
                                                className="sm:w-1/3 px-3 py-2 bg-white/60 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-600"
                                            >
                                                <option value="">Semua Kategori</option>
                                                {[...new Set(spareparts.flatMap(s => (s.kategori || "").split(",").map(k => k.trim())))].filter(Boolean).sort().map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <select
                                            value={sparepartForm.sparepart_id}
                                            onChange={(e) => setSparepartForm({ ...sparepartForm, sparepart_id: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                            required
                                        >
                                            <option value="">-- Hasil Pencarian ({
                                                spareparts
                                                    .filter((s) => s.stok > 0)
                                                    .filter((s) => !sparepartCategoryFilter || (s.kategori && s.kategori.includes(sparepartCategoryFilter)))
                                                    .filter((s) => ((s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "") + s.nama).toLowerCase().includes(sparepartSearchQuery.toLowerCase()) || (s.kategori && s.kategori.toLowerCase().includes(sparepartSearchQuery.toLowerCase())))
                                                    .length
                                            }) --</option>
                                            {spareparts
                                                .filter((s) => s.stok > 0)
                                                .filter((s) => !sparepartCategoryFilter || (s.kategori && s.kategori.includes(sparepartCategoryFilter)))
                                                .filter((s) => ((s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "") + s.nama).toLowerCase().includes(sparepartSearchQuery.toLowerCase()) || (s.kategori && s.kategori.toLowerCase().includes(sparepartSearchQuery.toLowerCase())))
                                                .sort((a, b) => ((a.brand?.nama && a.brand.nama.toLowerCase() !== "lainnya" ? a.brand.nama + " " : "") + a.nama).localeCompare((b.brand?.nama && b.brand.nama.toLowerCase() !== "lainnya" ? b.brand.nama + " " : "") + b.nama))
                                                .map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {(s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "") + s.nama} (Sisa stok: {s.stok}) - {formatRupiah(s.harga)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-full sm:w-28 shrink-0">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={sparepartForm.jumlah}
                                            onChange={(e) => setSparepartForm({ ...sparepartForm, jumlah: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-center"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={useSparepartLoading}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm shrink-0 whitespace-nowrap"
                                    >
                                        {useSparepartLoading ? "Memproses..." : "Tambahkan"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Invoice */}
                    {tiket.invoice && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 shrink-0">
                            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                                <FileCheck className="w-5 h-5 text-emerald-500" />
                                <h2 className="text-base font-bold text-slate-900">Tagihan Pembayaran</h2>
                            </div>
                            
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Biaya Jasa Teknisi</span>
                                    <span className="text-slate-900 font-medium">{formatRupiah(tiket.invoice.biaya_jasa)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Biaya Suku Cadang</span>
                                    <span className="text-slate-900 font-medium">{formatRupiah(tiket.invoice.biaya_sparepart)}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-slate-800 font-bold uppercase tracking-wider text-sm">Total Tagihan</span>
                                    <span className="text-emerald-700 font-bold text-xl">{formatRupiah(tiket.invoice.total_biaya)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Status Actions */}
            {canUpdateStatus && filteredTransitions.length > 0 && (
                <div className="bg-blue-50/50 rounded-2xl p-6 shadow-sm border border-blue-100 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <h2 className="text-base font-bold text-blue-900">Perbarui Status Tiket</h2>
                    </div>
                    <p className="text-sm text-blue-700/80 mb-5">
                        Pilih status dari daftar di bawah ini untuk memperbarui progres perbaikan tiket.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full sm:w-auto flex-1 px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                        >
                            <option value="" disabled>Pilih Status Selanjutnya...</option>
                            {filteredTransitions.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]?.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleStatusChangeClick}
                            disabled={!selectedStatus}
                            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Simpan Status</span>
                        </button>
                    </div>

                    {isAdmin && (selectedStatus === "dalam_perbaikan" || selectedStatus === "disetujui") && (
                        <div className="mt-4 pt-4 border-t border-blue-100">
                            <label className="block text-sm font-semibold text-blue-900 mb-2">
                                Catatan Khusus untuk Teknisi (Opsional)
                            </label>
                            <textarea
                                value={catatanAdmin}
                                onChange={(e) => setCatatanAdmin(e.target.value)}
                                placeholder="Misal: Customer minta tolong sekalian install aplikasi X..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 4. Contextual Actions & Alerts */}
            {/* Unassigned Warning for Admin */}
            {isAdmin && !tiket.teknisi && tiket.status !== "selesai" && tiket.status !== "diambil" && tiket.status !== "dibatalkan" && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h2 className="text-base font-bold text-amber-900">Perhatian: Tiket Belum Ditugaskan!</h2>
                    </div>
                    <p className="text-sm text-amber-700/80">
                        Tiket ini belum memiliki teknisi penanggung jawab sehingga proses diagnosis dan perbaikan tidak bisa dimulai. Silakan pilih teknisi pada menu di panel "Informasi Tiket" di sebelah kanan.
                    </p>
                </div>
            )}

            {/* Reminder Section */}
            {isAdmin && tiket.status === "selesai" && getReminderDue(tiket) && (
                <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h2 className="text-base font-bold text-red-900">Pengingat Pengambilan (Due)</h2>
                    </div>
                    <p className="text-sm text-red-700/80 mb-5">
                        Tiket ini sudah selesai lebih dari {getReminderDue(tiket)} bulan tetapi belum diambil. Kirim pesan pengingat kepada customer.
                    </p>
                    <div className="flex items-center gap-3">
                        <a
                            href={generateReminderWaLink(tiket, getReminderDue(tiket))}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => handleSendReminder(getReminderDue(tiket))}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Kirim Pengingat {getReminderDue(tiket)} Bulan</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Feature 2.2: CRM & Notifikasi Pengingat Garansi (H-3 Expiry Follow-up) */}
            {tiket.status === "diambil" && tiket.warranty_status?.status === "aktif" && tiket.warranty_status?.sisaHari <= 7 && tiket.warranty_status?.sisaHari >= 0 && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
                                <Clock className="w-5 h-5 text-amber-700" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-amber-950">CRM: Pengingat Garansi Hampir Habis (H-{tiket.warranty_status.sisaHari})</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                                        Proaktif
                                    </span>
                                </div>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    Garansi berakhir pada {tiket.warranty_status.garansi_berakhir_at ? new Date(tiket.warranty_status.garansi_berakhir_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"} (Tersisa {tiket.warranty_status.sisaHari} hari)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-amber-800">Gaya:</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-slate-800 border border-amber-200 shadow-2xs">
                                {tiket.perangkat?.customer?.tipe_kepribadian || "Netral"}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-amber-900/90 my-3 leading-relaxed">
                        Standar Layanan Service Excellent merekomendasikan follow-up pelanggan proaktif pada H-3 s/d H-7 sebelum masa garansi berakhir untuk memastikan unit tetap beroperasi normal, menunjukkan kepedulian purnajual, dan menjaga loyalitas pelanggan (Transparent, Trusted, WOW).
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="text-xs text-amber-800">
                            {tiket.log_perbaikan?.some(l => l.fase === "Follow-Up Garansi") ? (
                                <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Follow-up CRM garansi telah dicatat pada sistem
                                </span>
                            ) : (
                                <span className="italic text-amber-700">Belum ada follow-up CRM garansi yang dikirim untuk tiket ini.</span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsWarrantyCertModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all"
                            >
                                <Award className="w-3.5 h-3.5 text-blue-600" />
                                <span>Cetak Kartu Garansi Digital</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSopWaInitialScenario("pengingat_garansi");
                                    setIsSopWaModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Kirim Follow-Up Garansi (WhatsApp)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feature 9: Real-time Warranty Countdown & Expiry Tracker */}
            {tiket.status === "diambil" && (
                <div className={`rounded-2xl p-6 shadow-sm border mb-6 transition-all ${
                    tiket.warranty_status?.isExpired 
                        ? "bg-rose-50/60 border-rose-200" 
                        : "bg-emerald-50/60 border-emerald-200"
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck className={`w-6 h-6 ${tiket.warranty_status?.isExpired ? "text-rose-600" : "text-emerald-600"}`} />
                            <div>
                                <h2 className={`text-base font-bold ${tiket.warranty_status?.isExpired ? "text-rose-950" : "text-emerald-950"}`}>
                                    Status Garansi Servis (Real-time Tracker)
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Dihitung sejak unit diambil pada {tiket.tgl_diambil ? new Date(tiket.tgl_diambil).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                </p>
                            </div>
                        </div>

                        {/* Real-time Status Badge */}
                        <div className="flex items-center gap-2">
                            {tiket.warranty_status?.isExpired ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                                    Kedaluwarsa ({tiket.warranty_status?.lewatHari || 0} hari lalu)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <Clock className="w-4 h-4 text-emerald-600" />
                                    Garansi Aktif (Sisa {tiket.warranty_status?.sisaHari || 0} hari)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expiry Details Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durasi Garansi</p>
                            <p className="text-base font-bold text-slate-800 mt-0.5">{tiket.durasi_garansi || "1 Bulan"}</p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tanggal Diambil</p>
                            <p className="text-sm font-bold text-slate-800 mt-0.5">
                                {tiket.tgl_diambil ? new Date(tiket.tgl_diambil).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                            </p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Batas Garansi Berakhir</p>
                            <p className={`text-sm font-bold mt-0.5 ${tiket.warranty_status?.isExpired ? "text-rose-600" : "text-emerald-700"}`}>
                                {tiket.warranty_status?.garansi_berakhir_at 
                                    ? new Date(tiket.warranty_status.garansi_berakhir_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) 
                                    : (tiket.garansi_berakhir_at ? new Date(tiket.garansi_berakhir_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-")}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 pt-3 border-t border-slate-200/50">
                        <div>
                            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                                Kategori Perbaikan / Tips
                            </label>
                            <select
                                value={kategoriPerbaikan}
                                onChange={(e) => setKategoriPerbaikan(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                            >
                                {Object.keys(MAINTENANCE_TIPS).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                                Sesuaikan Durasi Garansi
                            </label>
                            <input
                                type="text"
                                value={durasiGaransi}
                                onChange={(e) => setDurasiGaransi(e.target.value)}
                                placeholder="Misal: 1 Bulan / 3 Bulan / 14 Hari"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/50">
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {isAdmin && (
                                <button
                                    onClick={handleSaveWarrantyConfig}
                                    disabled={isSavingWarrantyConfig}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSavingWarrantyConfig ? "Menyimpan..." : "Simpan Garansi"}</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsWarrantyCertModalOpen(true)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Award className="w-4 h-4 text-blue-600" />
                                <span>Cetak Kartu Garansi</span>
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                            <a
                                href={generateWarrantyWaLink(tiket)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-2 shrink-0"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Kirim Info Garansi (WA)</span>
                            </a>

                            <button
                                onClick={handleCreateWarrantyClaim}
                                className={`w-full sm:w-auto px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 ${
                                    tiket.warranty_status?.isExpired 
                                        ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" 
                                        : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Klaim Garansi</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Panel Kepatuhan & Informasi Pendukung (Accordion Drawers) */}
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Informasi Pendukung & Kepatuhan Layanan
                    </h3>
                    <span className="text-[11px] text-slate-400">
                        Klik panel untuk melihat detail
                    </span>
                </div>

                {/* Accordion 1: Protokol Layanan & Izin Unit (SOP) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                    <div
                        onClick={() => setIsSopOpen(!isSopOpen)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                    >
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shrink-0">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-sm font-bold text-slate-900">Protokol Layanan & Izin Unit</h2>
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                        Standar Servis
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Verifikasi fisik intake, prioritas layanan, dan batas wewenang teknisi
                                </p>
                            </div>
                        </div>

                        {/* Summary Badges & Quick Action */}
                        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                tiket.prioritas_pelanggan === "Data Aman"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : tiket.prioritas_pelanggan === "Cepat Selesai"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : tiket.prioritas_pelanggan === "Biaya Hemat"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                                <Target className="w-3 h-3" />
                                <span>{tiket.prioritas_pelanggan || "Standar"}</span>
                            </span>

                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                tiket.izin_bongkar !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                                Bongkar: {tiket.izin_bongkar !== false ? "Diizinkan" : "Ditolak"}
                            </span>

                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                tiket.izin_akses_os !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                                OS: {tiket.izin_akses_os !== false ? "Diizinkan" : "Ditolak"}
                            </span>

                            {tiket.batasan_izin && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Ada Batasan Khusus</span>
                                </span>
                            )}

                            {(isAdmin || isAssignedToMe) && !isEditingSopPermissions && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSopOpen(true);
                                        setIsEditingSopPermissions(true);
                                    }}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                                >
                                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit</span>
                                </button>
                            )}

                            <div className="p-1 text-slate-400 hover:text-slate-600 transition-colors ml-1">
                                {isSopOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>

                    {isSopOpen && (
                        <div className="p-5 pt-0 border-t border-slate-100">
                            {isEditingSopPermissions ? (
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 mt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Prioritas Pelanggan
                                            </label>
                                            <select
                                                value={sopPrioritasPelanggan}
                                                onChange={(e) => setSopPrioritasPelanggan(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
                                            >
                                                <option value="Standar">Standar (Reguler)</option>
                                                <option value="Data Aman">Data Aman (Proteksi Data)</option>
                                                <option value="Cepat Selesai">Cepat Selesai (Mendesak)</option>
                                                <option value="Biaya Hemat">Biaya Hemat (Ekonomis)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Kondisi Fisik Luar
                                            </label>
                                            <select
                                                value={sopKondisiFisik}
                                                onChange={(e) => setSopKondisiFisik(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
                                            >
                                                <option value="Bersih">Bersih</option>
                                                <option value="Kotor">Kotor</option>
                                                <option value="Ada yang Rusak">Ada yang Rusak</option>
                                                <option value="Pecah">Pecah</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Spesifikasi Awal
                                            </label>
                                            <input
                                                type="text"
                                                value={sopSpesifikasiAwal}
                                                onChange={(e) => setSopSpesifikasiAwal(e.target.value)}
                                                placeholder="RAM, SSD, OS..."
                                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 shadow-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                        <label className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                            sopIzinBongkar 
                                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold" 
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}>
                                            <input
                                                type="checkbox"
                                                checked={sopIzinBongkar}
                                                onChange={(e) => setSopIzinBongkar(e.target.checked)}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span>Izin Bongkar Hardware</span>
                                        </label>
                                        <label className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                            sopIzinAksesOs 
                                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold" 
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}>
                                            <input
                                                type="checkbox"
                                                checked={sopIzinAksesOs}
                                                onChange={(e) => setSopIzinAksesOs(e.target.checked)}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span>Izin Akses OS / Test</span>
                                        </label>
                                        <label className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                            sopIzinBackupMandiri 
                                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold" 
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}>
                                            <input
                                                type="checkbox"
                                                checked={sopIzinBackupMandiri}
                                                onChange={(e) => setSopIzinBackupMandiri(e.target.checked)}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span>Konfirmasi Backup</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Batasan Izin Khusus
                                        </label>
                                        <input
                                            type="text"
                                            value={sopBatasanIzin}
                                            onChange={(e) => setSopBatasanIzin(e.target.value)}
                                            placeholder="Batasan akses yang diminta pelanggan (opsional)..."
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 shadow-xs"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingSopPermissions(false)}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveSopPermissions}
                                            disabled={isSavingSopPermissions}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition-colors"
                                        >
                                            {isSavingSopPermissions ? "Menyimpan..." : "Simpan Perubahan"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    {/* Column 1: Intake & Specs */}
                                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/60 mb-3">
                                                <HardDrive className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                                    Pengecekan Fisik Awal
                                                </span>
                                            </div>
                                            <div className="space-y-3 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-slate-500">Kondisi Fisik:</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                        tiket.kondisi_fisik === "Pecah" 
                                                            ? "bg-red-50 text-red-700 border-red-200" 
                                                            : tiket.kondisi_fisik === "Ada yang Rusak" 
                                                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    }`}>
                                                        {tiket.kondisi_fisik || "Bersih"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block mb-1">Spesifikasi Awal:</span>
                                                    <div className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 break-words leading-relaxed min-h-[52px]">
                                                        {tiket.spesifikasi_awal || "Tidak dicatat / Standar pabrik"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Customer Priority */}
                                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/60 mb-3">
                                                <Target className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                                    Prioritas Pelanggan
                                                </span>
                                            </div>
                                            <div className="space-y-3 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-slate-500">Fokus Penanganan:</span>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                        tiket.prioritas_pelanggan === "Data Aman"
                                                            ? "bg-purple-50 text-purple-700 border-purple-200"
                                                            : tiket.prioritas_pelanggan === "Cepat Selesai"
                                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                : tiket.prioritas_pelanggan === "Biaya Hemat"
                                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                                    }`}>
                                                        {tiket.prioritas_pelanggan || "Standar"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block mb-1">Panduan Layanan:</span>
                                                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed min-h-[52px]">
                                                        {tiket.prioritas_pelanggan === "Data Aman" && "Prioritas proteksi data pelanggan: Wajib izin sebelum tindakan storage atau OS."}
                                                        {tiket.prioritas_pelanggan === "Cepat Selesai" && "Prioritas waktu pengerjaan: Pelanggan membutuhkan unit segera selesai."}
                                                        {tiket.prioritas_pelanggan === "Biaya Hemat" && "Prioritas efisiensi biaya: Utamakan solusi ekonomis dan estimasi terjangkau."}
                                                        {(!tiket.prioritas_pelanggan || tiket.prioritas_pelanggan === "Standar") && "Standar pengerjaan workshop yang seimbang antara kualitas dan durasi."}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Privacy & Permissions */}
                                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/60 mb-3">
                                                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                                    Izin & Batasan Akses
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center justify-between gap-2 py-0.5">
                                                    <span className="text-slate-600">Bongkar Hardware:</span>
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                        tiket.izin_bongkar !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                                                    }`}>
                                                        {tiket.izin_bongkar !== false ? "Diizinkan" : "Ditolak"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 py-0.5">
                                                    <span className="text-slate-600">Akses OS / Testing:</span>
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                        tiket.izin_akses_os !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                                                    }`}>
                                                        {tiket.izin_akses_os !== false ? "Diizinkan" : "Ditolak"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 py-0.5">
                                                    <span className="text-slate-600">Konfirmasi Backup:</span>
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                        tiket.izin_backup_mandiri !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}>
                                                        {tiket.izin_backup_mandiri !== false ? "Disepakati" : "Belum Konfirmasi"}
                                                    </span>
                                                </div>
                                                {tiket.batasan_izin && (
                                                    <div className="mt-2 pt-2 border-t border-slate-200/80">
                                                        <span className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">Batasan Khusus:</span>
                                                        <p className="text-[11px] text-slate-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200 leading-relaxed">
                                                            {tiket.batasan_izin}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Accordion 2: Rekam Medis & Riwayat Servis Unit Ini */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                    <div 
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-sm font-bold text-slate-900">Rekam Medis & Riwayat Servis Unit Ini</h2>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                        (tiket.perangkat?.tiket_servis?.length || 0) > 0 
                                            ? "bg-amber-50 text-amber-800 border-amber-200" 
                                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    }`}>
                                        {(tiket.perangkat?.tiket_servis?.length || 0) > 0 
                                            ? `${tiket.perangkat.tiket_servis.length}x Servis Sebelumnya` 
                                            : "Kunjungan Pertama"}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Riwayat kerusakan dan tindakan masa lalu untuk {tiket.perangkat?.merek} {tiket.perangkat?.model} (SN: {tiket.perangkat?.serial_number || "-"})
                                </p>
                            </div>
                        </div>
                        <div className="p-1 text-slate-400 hover:text-slate-600 transition-colors self-end sm:self-auto">
                            {isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>

                    {isHistoryOpen && (
                        <div className="p-5 pt-0 border-t border-slate-100">
                            {tiket.perangkat?.tiket_servis && tiket.perangkat.tiket_servis.length > 0 ? (
                                <div className="space-y-3 mt-4">
                                    {tiket.perangkat.tiket_servis.map((hist) => (
                                        <div key={hist.id} className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link 
                                                        to={`/tiket-servis/${hist.id}`}
                                                        className="font-mono font-bold text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                                    >
                                                        {hist.nomor_tiket}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_LABELS[hist.status]?.color || "bg-slate-100 text-slate-700"}`}>
                                                        {STATUS_LABELS[hist.status]?.label || hist.status}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(hist.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-700 font-medium">
                                                    <span className="text-slate-500">Keluhan: </span>{hist.keluhan}
                                                </p>
                                                {hist.diagnosis && (
                                                    <p className="text-xs text-slate-600">
                                                        <span className="text-slate-500">Diagnosis: </span>{hist.diagnosis.masalah} &bull; <span className="text-emerald-700 font-semibold">{hist.diagnosis.solusi}</span>
                                                    </p>
                                                )}
                                                {hist.penggunaan_sparepart && hist.penggunaan_sparepart.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                        <span className="text-[11px] text-slate-400">Sparepart diganti:</span>
                                                        {hist.penggunaan_sparepart.map(ps => (
                                                            <span key={ps.id} className="bg-white px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-700 border border-slate-200">
                                                                {ps.sparepart?.nama} ({ps.jumlah}x)
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
                                                <p className="text-[11px] text-slate-400">Teknisi</p>
                                                <p className="text-xs font-bold text-slate-800">{hist.teknisi?.nama || "Tidak tercatat"}</p>
                                                {hist.invoice && (
                                                    <p className="text-xs font-semibold text-emerald-600 mt-1">{formatRupiah(hist.invoice.total_biaya)}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-3 text-emerald-800 text-xs mt-4">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="font-bold">Tidak ada riwayat perbaikan terdahulu untuk unit ini.</p>
                                        <p className="text-emerald-700/80">Ini adalah kali pertama perangkat tercatat masuk ke pusat servis Serv.io.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Accordion 3: Pustaka Solusi Wiki Toko */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                    <div
                        onClick={() => setIsWikiOpen(!isWikiOpen)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                    >
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 shrink-0">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-sm font-bold text-slate-900">Pustaka Solusi Wiki Toko</h2>
                                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        Hardware Knowledge Base
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                        {wikiSuggestions?.length || 0} Solusi
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Panduan hardware internal & solusi teruji untuk <span className="font-semibold text-slate-700">{tiket.perangkat?.merek} {tiket.perangkat?.model}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                            {tiket.diagnosis && (isAdmin || isAssignedToMe) && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveToWiki();
                                    }}
                                    disabled={isSavingToWiki}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                                    title="Simpan hasil diagnosis & solusi tiket ini sebagai artikel di Wiki Toko"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{isSavingToWiki ? "Menyimpan..." : "Simpan Solusi ke Wiki"}</span>
                                </button>
                            )}
                            <Link
                                to="/wiki"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka Wiki</span>
                            </Link>
                            <div className="p-1 text-slate-400 hover:text-slate-600 transition-colors ml-1">
                                {isWikiOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>

                    {isWikiOpen && (
                        <div className="p-5 pt-0 border-t border-slate-100">
                            {loadingWikiSuggestions ? (
                                <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                                    <span>Mencari panduan yang relevan...</span>
                                </div>
                            ) : wikiSuggestions && wikiSuggestions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                                    {wikiSuggestions.map((wiki) => (
                                        <div
                                            key={wiki.id}
                                            onClick={() => setActiveWikiModal(wiki)}
                                            className="p-3.5 bg-slate-50/80 hover:bg-indigo-50/30 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer group flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                                                        {wiki.kategori}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-indigo-600 group-hover:underline flex items-center gap-0.5">
                                                        Baca <ArrowRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-950 line-clamp-1 mb-1">
                                                    {wiki.judul}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                                    {wiki.gejala || wiki.solusi_langkah}
                                                </p>
                                            </div>
                                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                                                <span>{wiki.brand?.nama || "Semua Merek"}</span>
                                                <span>{wiki.view_count || 0}x dibaca</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-5 text-center text-xs text-slate-500 mt-2">
                                    Belum ada panduan perbaikan yang spesifik untuk model/keluhan ini. Tekan <span className="font-semibold text-slate-700">"Simpan Solusi ke Wiki"</span> di atas setelah perbaikan selesai agar teknisi lain dapat menggunakannya sebagai acuan!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Accordion 4: Inspeksi Kendali Mutu (QC Pra-Penyerahan WOW) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                    <div
                        onClick={() => setIsQcOpen(!isQcOpen)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                    >
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-sm font-bold text-slate-900">Inspeksi Kendali Mutu (QC Pra-Penyerahan Unit)</h2>
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        8 Poin WOW Service
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {tiket.checklist_qc?.passed_qc && tiket.checklist_qc?.qc_by ? (
                                        <span>
                                            Diinspeksi oleh <strong className="text-slate-700">{tiket.checklist_qc.qc_by}</strong> pada {tiket.checklist_qc.qc_at ? new Date(tiket.checklist_qc.qc_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "tahap akhir"}
                                        </span>
                                    ) : (
                                        "Pengujian wajib sebelum serah terima unit kepada pelanggan atau mengubah status ke Selesai / Diambil."
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                            {tiket.checklist_qc?.passed_qc ? (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full border border-emerald-300">
                                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Lulus QC</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 font-bold text-xs px-3 py-1 rounded-full border border-amber-200">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Menunggu QC</span>
                                </span>
                            )}

                            {(isAdmin || isAssignedToMe) && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleApproveAllQC();
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Luluskan Semua</span>
                                </button>
                            )}

                            <div className="p-1 text-slate-400 hover:text-slate-600 transition-colors ml-1">
                                {isQcOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>

                    {isQcOpen && (
                        <div className="p-5 pt-0 border-t border-slate-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs my-4">
                                {QC_CHECKLIST_ITEMS.map(item => {
                                    const isChecked = Boolean(
                                        tiket.checklist_qc?.[item.key] ?? 
                                        (item.key === "power_test" ? tiket.checklist_qc?.baterai : false) ??
                                        (item.key === "clean_wow" ? tiket.checklist_qc?.cleaning_done : false)
                                    );
                                    const ItemIcon = item.Icon;
                                    return (
                                        <label key={item.key} className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                            isChecked ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70"
                                        }`}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => handleToggleQCChecklist(item.key, e.target.checked)}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5 shrink-0"
                                            />
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? "text-emerald-600" : "text-slate-400"}`} />
                                                    <span className="font-bold text-slate-900 truncate">{item.label}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-tight font-normal">{item.desc}</p>
                                            </div>
                                        </label>
                                    );
                                })}

                                {/* Final QC Passed Toggle */}
                                <label className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none col-span-full ${
                                    Boolean(tiket.checklist_qc?.passed_qc) ? "bg-emerald-100/90 border-emerald-400 text-emerald-950 font-bold" : "bg-amber-50/80 border-amber-300 text-amber-900"
                                }`}>
                                    <div className="flex items-center gap-2.5">
                                        <Award className={`w-5 h-5 shrink-0 ${Boolean(tiket.checklist_qc?.passed_qc) ? "text-emerald-700" : "text-amber-600"}`} />
                                        <div>
                                            <span className="text-sm">Quality Control PASSED (Final Approval Pra-Penyerahan)</span>
                                            <p className="text-xs font-normal opacity-85">
                                                Menyatakan perangkat telah memenuhi standar uji fungsional dan siap diserahkan kepada pelanggan.
                                            </p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(tiket.checklist_qc?.passed_qc)}
                                        onChange={(e) => handleToggleQCChecklist("passed_qc", e.target.checked)}
                                        className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                                    />
                                </label>
                            </div>

                            {tiket.checklist_qc?.catatan_qc && (
                                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                                    <span className="font-bold text-slate-800 block mb-0.5">Catatan QC:</span>
                                    {tiket.checklist_qc.catatan_qc}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isUpdatingStatus}
                title="Konfirmasi Perubahan Status"
                message={`Apakah Anda yakin ingin mengubah status perbaikan menjadi "${STATUS_LABELS[selectedStatus]?.label}"?`}
                onConfirm={executeStatusChange}
                onCancel={() => setIsUpdatingStatus(false)}
                confirmText="Ya, Ubah Status"
            />
            
            <ConfirmModal
                isOpen={isTakeOverModalOpen}
                onCancel={() => setIsTakeOverModalOpen(false)}
                onConfirm={handleTakeOver}
                title="Ambil Alih Tiket"
                message="Anda yakin ingin mengambil alih tiket ini? Status tiket akan berubah menjadi Didiagnosis dan Anda akan menjadi teknisi penanggung jawab."
                confirmText="Ya, Ambil Alih"
                confirmColor="amber"
                icon={<Wrench className="w-6 h-6 text-amber-600" />}
            />

            {/* Image Preview Modal (Lightbox) */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
                    <button 
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                    >
                        <XCircle className="w-8 h-8" />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            {/* Feature 2.1: Handover QC Inspection Modal (Standar WOW Service) */}
            {isQcModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-slate-900">Checklist QC Pra-Penyerahan Unit</h2>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                            Target: {STATUS_LABELS[selectedStatus]?.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Pengujian 8 poin kendali mutu & pembersihan menyeluruh (Standar WOW Service)
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsQcModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                            {/* Info Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-500">Inspektor:</span>
                                    <span className="font-semibold text-slate-800">{user?.nama || "Teknisi / Admin"}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQcModalData({
                                            power_test: true,
                                            display_test: true,
                                            keyboard_touchpad: true,
                                            audio_multimedia: true,
                                            port_io_connectivity: true,
                                            os_thermal_performance: true,
                                            clean_wow: true,
                                            accessories_handover: true,
                                            passed_qc: true,
                                            catatan_qc: qcModalData.catatan_qc || "Unit telah lulus uji kelayakan 8 poin kendali mutu dan dibersihkan menyeluruh."
                                        });
                                        toast.success("Semua 8 poin QC ditandai lulus!");
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Luluskan Semua (Standar WOW)</span>
                                </button>
                            </div>

                            {/* 8 Checkpoints Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {QC_CHECKLIST_ITEMS.map((item) => {
                                    const isChecked = Boolean(qcModalData[item.key]);
                                    const ItemIcon = item.Icon;
                                    return (
                                        <label
                                            key={item.key}
                                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                                isChecked
                                                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => setQcModalData({ ...qcModalData, [item.key]: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5 shrink-0"
                                            />
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? "text-emerald-600" : "text-slate-400"}`} />
                                                    <span className="text-xs font-bold text-slate-900 truncate">{item.label}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* Catatan Tambahan QC */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Catatan Pengujian & Kondisi Fisik (Opsional)
                                </label>
                                <textarea
                                    value={qcModalData.catatan_qc}
                                    onChange={(e) => setQcModalData({ ...qcModalData, catatan_qc: e.target.value })}
                                    placeholder="Contoh: Unit dites streaming 15 menit suhu normal 60°C, adaptor charger bawaan disertakan rapi..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-2xs"
                                />
                            </div>

                            {/* Foto Selesai Servis & Hasil Akhir QC (Maksimal 15) */}
                            <PhotoUploadSection
                                label="Foto Selesai Servis & Hasil Akhir (QC)"
                                sublabel="Dokumentasikan kondisi fisik setelah servis selesai, segel workshop, dan kelengkapan (Maksimal 15 foto)."
                                maxPhotos={15}
                                photos={qcPhotos}
                                onChange={setQcPhotos}
                            />

                            {/* Approval Banner */}
                            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                                qcModalData.passed_qc ? "bg-emerald-100 border-emerald-300 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"
                            }`}>
                                <div className="flex items-center gap-2">
                                    <Award className={`w-5 h-5 shrink-0 ${qcModalData.passed_qc ? "text-emerald-700" : "text-amber-600"}`} />
                                    <div>
                                        <p className="text-xs font-bold">Persetujuan Kendali Mutu (Final Approval)</p>
                                        <p className="text-[11px] opacity-80">
                                            {qcModalData.passed_qc ? "Perangkat siap diserahkan kepada pelanggan" : "Centang persetujuan setelah seluruh pengujian diverifikasi"}
                                        </p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={qcModalData.passed_qc}
                                        onChange={(e) => setQcModalData({ ...qcModalData, passed_qc: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span>Lulus QC</span>
                                </label>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setIsQcModalOpen(false)}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveQcAndChangeStatus}
                                disabled={isSavingQc}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{isSavingQc ? "Menyimpan QC..." : `Simpan QC & Ubah ke ${STATUS_LABELS[selectedStatus]?.label}`}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SOP WhatsApp Template Modal */}
            <SopWaModal
                isOpen={isSopWaModalOpen}
                onClose={() => {
                    setIsSopWaModalOpen(false);
                    setSopWaInitialScenario("");
                }}
                tiket={tiket}
                initialScenario={sopWaInitialScenario}
            />

            {/* Digital Warranty Certificate Modal */}
            <WarrantyCertificateModal
                isOpen={isWarrantyCertModalOpen}
                onClose={() => setIsWarrantyCertModalOpen(false)}
                tiket={tiket}
                customer={tiket?.perangkat?.customer}
                perangkat={tiket?.perangkat}
                invoice={tiket?.invoice}
            />

            {/* Feature 1: 2D Visual Defect Mapper Modal */}
            <DefectMapperModal
                isOpen={isDefectModalOpen}
                onClose={() => setIsDefectModalOpen(false)}
                value={tiket?.defect_map}
                onChange={handleSaveDefectMap}
                readOnly={!(isAdmin || isAssignedToMe)}
                title={`Peta Cacat Fisik: ${tiket?.perangkat?.merek || ""} ${tiket?.perangkat?.model || ""}`}
            />

            {/* Feature 6: Internal Repair Wiki Reader Modal */}
            <RepairWikiDetailModal
                isOpen={Boolean(activeWikiModal)}
                onClose={() => setActiveWikiModal(null)}
                wiki={activeWikiModal}
            />

            {/* Modal Konfirmasi Persetujuan Pelanggan & Estimasi SLA Pengerjaan Servis */}
            {isAccModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Konfirmasi Persetujuan Pelanggan & Estimasi SLA
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Pelanggan telah menyetujui penawaran biaya. Tentukan target estimasi SLA pengerjaan servis fisik.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAccModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            {/* Ringkasan Penawaran */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-slate-500">Nomor Tiket:</span>
                                    <span className="font-bold text-slate-800">#{tiket.nomor_tiket}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-slate-500">Perangkat:</span>
                                    <span className="font-semibold text-slate-800">{tiket.perangkat?.merek} {tiket.perangkat?.model}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-slate-500">Pelanggan:</span>
                                    <span className="font-medium text-slate-800">{tiket.perangkat?.customer?.nama}</span>
                                </div>
                                {tiket.diagnosis && (
                                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                                        <span className="text-slate-600 font-semibold">Estimasi Biaya Disetujui:</span>
                                        <span className="font-bold text-emerald-700 text-sm">{formatRupiah(tiket.diagnosis.estimasi_biaya || 0)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Pilihan Status Selanjutnya */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                    Status Tiket Selanjutnya
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAccTargetStatus("disetujui")}
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                            accTargetStatus === "disetujui"
                                                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                                                : "bg-white border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs text-slate-900">Disetujui (ACC)</span>
                                            {accTargetStatus === "disetujui" && <Check className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Antrean pengerjaan teknisi dibuka
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAccTargetStatus("dalam_perbaikan")}
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                            accTargetStatus === "dalam_perbaikan"
                                                ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20"
                                                : "bg-white border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs text-slate-900">Dalam Perbaikan</span>
                                            {accTargetStatus === "dalam_perbaikan" && <Check className="w-4 h-4 text-indigo-600" />}
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Teknisi langsung mulai membongkar/servis
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Pilihan Paket Estimasi SLA Pengerjaan Servis */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Paket Estimasi SLA Pengerjaan Servis
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        Timer dihitung sejak persetujuan pelanggan
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {SLA_PENGERJAAN_PACKAGES.map((pkg) => {
                                        const PkgIcon = pkg.icon;
                                        const isSelected = accSlaPaket === pkg.id && !accUseCustomDate;
                                        return (
                                            <div
                                                key={pkg.id}
                                                onClick={() => {
                                                    setAccSlaPaket(pkg.id);
                                                    setAccUseCustomDate(false);
                                                }}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? `${pkg.badgeBg} ring-2 ring-blue-500/20 shadow-xs`
                                                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <PkgIcon className="w-4 h-4" />
                                                        <span className="text-xs font-bold">{pkg.label}</span>
                                                        {pkg.id === "express" && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                                                                Prioritas Meja
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                        isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                                                    }`}>
                                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                                                    {pkg.desc}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Opsi Target Estimasi Selesai Khusus */}
                            <div className="pt-2 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={accUseCustomDate}
                                        onChange={(e) => setAccUseCustomDate(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span>Tentukan Target Estimasi Selesai Khusus (Tanggal & Jam Manual)</span>
                                </label>

                                {accUseCustomDate && (
                                    <div className="pl-6 space-y-1">
                                        <input
                                            type="datetime-local"
                                            value={accCustomTargetDate}
                                            onChange={(e) => setAccCustomTargetDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Cocok untuk servis yang memerlukan pemesanan sparepart khusus (part indent).
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Catatan Khusus untuk Teknisi */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Catatan Khusus untuk Teknisi (Opsional)
                                </label>
                                <textarea
                                    value={catatanAdmin}
                                    onChange={(e) => setCatatanAdmin(e.target.value)}
                                    placeholder="Contoh: Customer menyetujui penggantian baterai & kipas saja, install ulang tidak perlu..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-2xs"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAccModalOpen(false)}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmAcc}
                                disabled={isSubmittingAcc}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{isSubmittingAcc ? "Menyimpan Estimasi..." : "Konfirmasi & Mulai Estimasi Servis"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ticket QR Code & Label Modal */}
            <TicketQrModal 
                isOpen={isQrModalOpen} 
                onClose={() => setIsQrModalOpen(false)} 
                tiket={tiket} 
            />

            {/* Feature 3: Surat Tanda Terima Masuk (BPBS) Modal */}
            <BpbsPrintModal
                isOpen={isBpbsModalOpen}
                onClose={() => setIsBpbsModalOpen(false)}
                tiket={tiket}
            />

            {/* Feature 2.2: Modal Pembatalan Tiket Servis */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                                    <XCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Batalkan Tiket Servis</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Catat alasan pembatalan pengerjaan unit</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCancelModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleExecuteCancel} className="p-6 space-y-4 text-xs sm:text-sm">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Alasan Utama Pembatalan:
                                </label>
                                <select
                                    value={batalForm.alasan_batal}
                                    onChange={(e) => setBatalForm({ ...batalForm, alasan_batal: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                >
                                    <option value="Biaya melebihi budget pelanggan">Biaya melebihi budget pelanggan</option>
                                    <option value="Sparepart langka / discontinue / tidak tersedia">Sparepart langka / discontinue / tidak tersedia</option>
                                    <option value="Kerusakan motherboard / PCB terlalu parah (Mati total tidak tertolong)">Kerusakan motherboard / PCB terlalu parah (Mati total tidak tertolong)</option>
                                    <option value="Pelanggan membatalkan servis (ingin ganti unit baru)">Pelanggan membatalkan servis (ingin ganti unit baru)</option>
                                    <option value="Risiko pengerjaan terlalu tinggi">Risiko pengerjaan terlalu tinggi</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Catatan / Kronologi Pembatalan:
                                </label>
                                <textarea
                                    value={batalForm.catatan_batal}
                                    onChange={(e) => setBatalForm({ ...batalForm, catatan_batal: e.target.value })}
                                    placeholder="Jelaskan detail alasan atau instruksi pengembalian unit..."
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Biaya Pengecekan / Biaya Batal (Opsional):
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400 text-xs">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={batalForm.biaya_pembatalan}
                                        onChange={(e) => setBatalForm({ ...batalForm, biaya_pembatalan: e.target.value })}
                                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        placeholder="0 jika bebas biaya cek"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Isi 0 jika toko menerapkan kebijakan gratis biaya pengecekan untuk unit batal.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCancelModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingBatal}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingBatal ? "Membatalkan..." : "Konfirmasi Batalkan Tiket"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

