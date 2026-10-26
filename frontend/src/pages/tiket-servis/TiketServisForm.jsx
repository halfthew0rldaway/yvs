import toast from 'react-hot-toast';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { 
    ArrowLeft, Save, MonitorSmartphone, User, MessageSquare, Package, Camera, 
    KeyRound, Lock, Eye, EyeOff, ShieldCheck, Shield, AlertTriangle, 
    Sparkles, Smile, History, HardDrive, CheckCircle2, Clock, Zap, Laptop,
    Search, Filter, Plus, Phone, RotateCcw, X, Check, ChevronRight, Printer, Box,
    Tag, CornerDownLeft, UserPlus
} from "lucide-react";
import DefectMapperModal from "../../components/DefectMapperModal";
import { SLA_PENGECEKAN_PACKAGES } from "../../components/SlaBadge";
import PhotoUploadSection from "../../components/PhotoUploadSection";

const POPULAR_BRANDS = ["Asus", "Lenovo", "HP", "Acer", "Dell", "Apple", "MSI", "Toshiba"];
const DEVICE_CATEGORIES = ["Laptop", "Desktop PC", "Printer", "Penyimpanan (HDD/SSD)", "Aksesoris (Mouse/Keyboard)", "Lainnya"];
const ACTIVE_STATUSES = ["diterima", "didiagnosis", "menunggu_persetujuan", "disetujui", "dalam_perbaikan", "selesai"];

function HighlightText({ text, query }) {
    if (!text) return null;
    if (!query || !query.trim()) return <>{text}</>;

    const cleanQ = query.trim().replace(/[\s\-]/g, "");
    const cleanText = String(text).replace(/[\s\-]/g, "");
    const isDigitsOnly = /^[0-9]+$/.test(cleanQ);

    try {
        const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, "gi");
        if (regex.test(text)) {
            const parts = String(text).split(regex);
            return (
                <>
                    {parts.map((part, i) =>
                        regex.test(part) ? (
                            <mark key={i} className="bg-amber-200/90 text-amber-950 font-bold px-0.5 rounded">
                                {part}
                            </mark>
                        ) : (
                            part
                        )
                    )}
                </>
            );
        }

        if (isDigitsOnly && cleanText.includes(cleanQ)) {
            return (
                <mark className="bg-amber-200/90 text-amber-950 font-bold px-0.5 rounded">
                    {text}
                </mark>
            );
        }
    } catch (e) {
        return <>{text}</>;
    }

    return <>{text}</>;
}

function getDeviceIcon(jenis) {
    const j = (jenis || "").toLowerCase();
    if (j.includes("laptop")) return Laptop;
    if (j.includes("desktop") || j.includes("pc")) return MonitorSmartphone;
    if (j.includes("printer")) return Printer;
    if (j.includes("hdd") || j.includes("ssd") || j.includes("penyimpanan")) return HardDrive;
    return Laptop;
}

export default function TiketServisForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const perangkatParam = searchParams.get("perangkat_id");

    const [form, setForm] = useState({ 
        perangkat_id: perangkatParam || "", 
        teknisi_id: "", 
        keluhan: "", 
        kelengkapan: "",
        tipe_kunci: "Tidak Ada",
        password_perangkat: "",
        kondisi_fisik: "Bersih",
        spesifikasi_awal: "",
        prioritas_pelanggan: "Standar",
        izin_bongkar: true,
        izin_akses_os: true,
        izin_backup_mandiri: true,
        batasan_izin: ""
    });
    const [slaPaket, setSlaPaket] = useState("reguler");
    const [defectMap, setDefectMap] = useState({ items: [] });
    const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [fotos, setFotos] = useState([]);
    const [perangkats, setPerangkats] = useState([]);
    const [teknisis, setTeknisis] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [selectedPerangkatDetail, setSelectedPerangkatDetail] = useState(null);
    const [loadingPerangkatDetail, setLoadingPerangkatDetail] = useState(false);

    // Smart Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("Semua");
    const [brandFilter, setBrandFilter] = useState("Semua");
    const searchInputRef = useRef(null);

    // Auto-focus search box saat pertama kali buka atau saat ganti unit
    useEffect(() => {
        if (!form.perangkat_id && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [form.perangkat_id]);

    // Quick Registration Modal State
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickIsExistingCustomer, setQuickIsExistingCustomer] = useState(false);
    const [existingCustomers, setExistingCustomers] = useState([]);
    const [selectedExistingCustId, setSelectedExistingCustId] = useState("");
    const [quickForm, setQuickForm] = useState({
        nama: "",
        nomor_telepon: "",
        tipe_kepribadian: "Netral",
        jenis_perangkat: "Laptop",
        merek: "",
        model: "",
        serial_number: ""
    });
    const [savingQuick, setSavingQuick] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get("/perangkat"), 
            api.get("/dashboard/teknisi-list"),
            api.get("/customer")
        ])
            .then(([perangkatRes, teknisiRes, customerRes]) => {
                setPerangkats(perangkatRes.data || []);
                setTeknisis(teknisiRes.data || []);
                setExistingCustomers(customerRes.data || []);
            })
            .catch(() => toast.error("Gagal memuat data"))
            .finally(() => setFetching(false));
    }, []);

    useEffect(() => {
        if (!form.perangkat_id) {
            setSelectedPerangkatDetail(null);
            return;
        }
        setLoadingPerangkatDetail(true);
        api.get(`/perangkat/${form.perangkat_id}`)
            .then((res) => setSelectedPerangkatDetail(res.data))
            .catch(() => setSelectedPerangkatDetail(null))
            .finally(() => setLoadingPerangkatDetail(false));
    }, [form.perangkat_id]);

    function handleOpenQuickAdd() {
        let prefillPhone = "";
        let prefillName = "";
        const cleanQ = searchQuery.trim();
        if (/^[0-9+\-\s]+$/.test(cleanQ) && cleanQ.length >= 4) {
            prefillPhone = cleanQ.replace(/[\s\-]/g, "");
        } else if (cleanQ.length >= 2) {
            prefillName = cleanQ;
        }

        setQuickForm({
            nama: prefillName,
            nomor_telepon: prefillPhone,
            tipe_kepribadian: "Netral",
            jenis_perangkat: categoryFilter !== "Semua" ? categoryFilter : "Laptop",
            merek: brandFilter !== "Semua" ? brandFilter : "",
            model: "",
            serial_number: ""
        });
        setQuickIsExistingCustomer(false);
        setSelectedExistingCustId("");
        setIsQuickAddOpen(true);
    }

    async function handleQuickRegister(e) {
        e.preventDefault();
        setSavingQuick(true);
        try {
            let customerId = selectedExistingCustId;
            let customerData = null;

            if (!quickIsExistingCustomer || !customerId) {
                if (!quickForm.nama.trim() || !quickForm.nomor_telepon.trim()) {
                    toast.error("Nama dan nomor WhatsApp pelanggan wajib diisi");
                    setSavingQuick(false);
                    return;
                }
                const custRes = await api.post("/customer", {
                    nama: quickForm.nama.trim(),
                    nomor_telepon: quickForm.nomor_telepon.trim(),
                    tipe_kepribadian: quickForm.tipe_kepribadian || "Netral"
                });
                customerId = custRes.data?.data?.id;
                customerData = custRes.data?.data;
                if (customerData) {
                    setExistingCustomers(prev => [customerData, ...prev]);
                }
            } else {
                customerData = existingCustomers.find(c => Number(c.id) === Number(customerId));
            }

            if (!quickForm.merek.trim() || !quickForm.model.trim()) {
                toast.error("Merek dan model perangkat wajib diisi");
                setSavingQuick(false);
                return;
            }

            const devRes = await api.post("/perangkat", {
                customer_id: Number(customerId),
                jenis_perangkat: quickForm.jenis_perangkat || "Laptop",
                merek: quickForm.merek.trim(),
                model: quickForm.model.trim(),
                serial_number: quickForm.serial_number ? quickForm.serial_number.trim() : null
            });

            const newPerangkat = {
                ...devRes.data?.data,
                customer: customerData,
                _count: { tiket_servis: 0 }
            };

            setPerangkats(prev => [newPerangkat, ...prev]);
            setForm(prev => ({ ...prev, perangkat_id: newPerangkat.id }));
            setIsQuickAddOpen(false);
            setSearchQuery("");
            toast.success("Pelanggan & perangkat berhasil didaftarkan dan langsung terpilih!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mendaftarkan perangkat");
        } finally {
            setSavingQuick(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.perangkat_id) {
            toast.error("Silakan pilih atau daftarkan perangkat servis terlebih dahulu");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("perangkat_id", form.perangkat_id);
            if (form.teknisi_id) formData.append("teknisi_id", form.teknisi_id);
            formData.append("keluhan", form.keluhan);
            if (form.kelengkapan) formData.append("kelengkapan", form.kelengkapan);
            formData.append("tipe_kunci", form.tipe_kunci);
            if (form.password_perangkat) formData.append("password_perangkat", form.password_perangkat);
            
            // Protokol Layanan, Fisik & Izin Privasi
            formData.append("kondisi_fisik", form.kondisi_fisik);
            if (form.spesifikasi_awal) formData.append("spesifikasi_awal", form.spesifikasi_awal);
            formData.append("prioritas_pelanggan", form.prioritas_pelanggan);
            formData.append("izin_bongkar", form.izin_bongkar);
            formData.append("izin_akses_os", form.izin_akses_os);
            formData.append("izin_backup_mandiri", form.izin_backup_mandiri);
            if (form.batasan_izin) formData.append("batasan_izin", form.batasan_izin);

            fotos.forEach(foto => {
                formData.append("foto_kondisi", foto);
            });

            // Feature 1: Visual Scratch & Defect Map
            if (defectMap && defectMap.items && defectMap.items.length > 0) {
                formData.append("defect_map", JSON.stringify(defectMap));
            }

            // Feature 7: SLA Express Service Package
            formData.append("sla_paket", slaPaket);

            const res = await api.post("/tiket-servis", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Tiket servis berhasil dibuat!");
            if (res.data?.id) {
                navigate(`/tiket-servis/${res.data.id}`);
            } else {
                navigate("/tiket-servis");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }

    const categoryCounts = useMemo(() => ({
        Semua: perangkats.length,
        Laptop: perangkats.filter(p => (p.jenis_perangkat || "").toLowerCase().includes("laptop")).length,
        "Desktop PC": perangkats.filter(p => {
            const j = (p.jenis_perangkat || "").toLowerCase();
            return j.includes("desktop") || j.includes("pc");
        }).length,
        Printer: perangkats.filter(p => (p.jenis_perangkat || "").toLowerCase().includes("printer")).length,
        Penyimpanan: perangkats.filter(p => {
            const j = (p.jenis_perangkat || "").toLowerCase();
            return j.includes("hdd") || j.includes("ssd") || j.includes("penyimpanan");
        }).length,
        Lainnya: perangkats.filter(p => {
            const j = (p.jenis_perangkat || "").toLowerCase();
            return !j.includes("laptop") && !j.includes("desktop") && !j.includes("pc") && !j.includes("printer") && !j.includes("hdd") && !j.includes("ssd");
        }).length,
    }), [perangkats]);

    // 1. Filter perangkat berdasarkan kategori aktif
    const categoryDevices = useMemo(() => {
        if (categoryFilter === "Semua") return perangkats;
        return perangkats.filter(p => {
            const j = (p.jenis_perangkat || "").toLowerCase();
            if (categoryFilter === "Laptop") return j.includes("laptop");
            if (categoryFilter === "Desktop PC") return j.includes("desktop") || j.includes("pc");
            if (categoryFilter === "Printer") return j.includes("printer");
            if (categoryFilter === "Penyimpanan") return j.includes("hdd") || j.includes("ssd") || j.includes("penyimpanan");
            if (categoryFilter === "Lainnya") {
                return !j.includes("laptop") && !j.includes("desktop") && !j.includes("pc") && !j.includes("printer") && !j.includes("hdd") && !j.includes("ssd");
            }
            return true;
        });
    }, [perangkats, categoryFilter]);

    // 2. Ekstrak merek secara dinamis HANYA dari perangkat yang ada di kategori terpilih
    const { availableBrands, brandCounts } = useMemo(() => {
        const counts = { Semua: categoryDevices.length };
        const rawBrandMap = new Map(); // cleanLower -> Display String

        categoryDevices.forEach(p => {
            const raw = (p.merek || "").trim();
            if (!raw) return;
            const lower = raw.toLowerCase();

            if (!rawBrandMap.has(lower)) {
                if (lower.length <= 3) {
                    rawBrandMap.set(lower, raw.toUpperCase());
                } else {
                    const titleCased = raw.charAt(0).toUpperCase() + raw.slice(1);
                    rawBrandMap.set(lower, titleCased);
                }
            }

            const displayName = rawBrandMap.get(lower);
            counts[displayName] = (counts[displayName] || 0) + 1;
        });

        // Urutkan merek berdasarkan kuantitas terbanyak, lalu alfabetis
        const sortedBrands = Array.from(new Set(rawBrandMap.values())).sort((a, b) => {
            const diff = (counts[b] || 0) - (counts[a] || 0);
            if (diff !== 0) return diff;
            return a.localeCompare(b);
        });

        return {
            availableBrands: ["Semua", ...sortedBrands],
            brandCounts: counts
        };
    }, [categoryDevices]);

    // Auto-reset brand filter jika merek yang dipilih sebelumnya tidak ada di kategori yang baru
    useEffect(() => {
        if (brandFilter !== "Semua" && !availableBrands.includes(brandFilter)) {
            setBrandFilter("Semua");
        }
    }, [availableBrands, brandFilter]);

    // 3. Filter akhir dari categoryDevices dengan brandFilter dan searchQuery
    const filteredPerangkats = useMemo(() => {
        return categoryDevices.filter(p => {
            // Brand Filter
            if (brandFilter !== "Semua") {
                const brand = (p.merek || "").toLowerCase();
                if (!brand.includes(brandFilter.toLowerCase())) return false;
            }

            // Search Query (WhatsApp, Nama, Merek, Model, Serial No)
            if (searchQuery.trim()) {
                const qDigits = searchQuery.replace(/[\s\-]/g, "").toLowerCase();
                const rawQ = searchQuery.toLowerCase().trim();

                const phone = (p.customer?.nomor_telepon || "").replace(/[\s\-]/g, "").toLowerCase();
                const name = (p.customer?.nama || "").toLowerCase();
                const brand = (p.merek || "").toLowerCase();
                const model = (p.model || "").toLowerCase();
                const serial = (p.serial_number || "").toLowerCase();
                const jenis = (p.jenis_perangkat || "").toLowerCase();

                const matchPhone = qDigits.length >= 3 && phone.includes(qDigits);
                const matchName = name.includes(rawQ);
                const matchBrand = brand.includes(rawQ);
                const matchModel = model.includes(rawQ);
                const matchSerial = serial.includes(rawQ);
                const matchJenis = jenis.includes(rawQ);

                return matchPhone || matchName || matchBrand || matchModel || matchSerial || matchJenis;
            }

            return true;
        });
    }, [categoryDevices, brandFilter, searchQuery]);

    // Keyboard navigation: Enter untuk pilih unit teratas atau daftarkan jika baru
    function handleSearchKeyDown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (filteredPerangkats.length > 0) {
                const topItem = filteredPerangkats[0];
                setForm(prev => ({ ...prev, perangkat_id: topItem.id }));
                setSearchQuery("");
                toast.success(`Unit ${topItem.merek} ${topItem.model} (${topItem.customer?.nama}) terpilih!`, { icon: "⚡" });
            } else if (searchQuery.trim().length >= 3) {
                handleOpenQuickAdd();
            }
        } else if (e.key === "Escape") {
            setSearchQuery("");
            setBrandFilter("Semua");
        }
    }

    const selectedPerangkat = perangkats.find(p => Number(p.id) === Number(form.perangkat_id));

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/tiket-servis")}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buat Tiket Servis</h1>
                    <p className="text-sm text-slate-500">Mulai proses perbaikan baru</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <MonitorSmartphone className="w-4 h-4 text-blue-600" />
                            <span>Pilih Unit & Pelanggan</span>
                            <span className="text-red-500">*</span>
                        </label>
                        
                        <button
                            type="button"
                            onClick={handleOpenQuickAdd}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Daftarkan Unit & Pelanggan Baru</span>
                        </button>
                    </div>

                    {/* Hidden input to satisfy form submission check */}
                    <input type="hidden" name="perangkat_id" value={form.perangkat_id} required />

                    {/* State 1: Perangkat Sudah Terpilih (Rich Selected Card) */}
                    {selectedPerangkat ? (
                        <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/90 rounded-2xl shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                                        {(() => {
                                            const IconComp = getDeviceIcon(selectedPerangkat.jenis_perangkat);
                                            return <IconComp className="w-5 h-5" />;
                                        })()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base font-black text-slate-900 tracking-tight">
                                                {selectedPerangkat.merek} {selectedPerangkat.model}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                {selectedPerangkat.jenis_perangkat || "Laptop"}
                                            </span>
                                            {selectedPerangkat.serial_number && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white text-slate-600 border border-slate-200">
                                                    SN: {selectedPerangkat.serial_number}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-1.5 flex-wrap">
                                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                                                <User className="w-3.5 h-3.5 text-slate-500" />
                                                {selectedPerangkat.customer?.nama}
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                                <Phone className="w-3 h-3 text-emerald-600" />
                                                {selectedPerangkat.customer?.nomor_telepon}
                                            </span>
                                            {selectedPerangkat._count?.tiket_servis > 0 && (
                                                <span className="text-[11px] text-slate-500 font-medium">
                                                    &bull; {selectedPerangkat._count.tiket_servis}x Servis Sebelumnya
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, perangkat_id: "" })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all shadow-2xs self-end sm:self-center shrink-0 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Ganti Unit</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* State 2: Cari / Filter Perangkat (Smart Search & Category Picker) */
                        <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl">
                            {/* Search Input Bar */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Cari No. WhatsApp (misal: 0812...), Nama Pelanggan, Merek, Model, atau Serial No..."
                                    className="w-full pl-10 pr-24 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                            title="Bersihkan pencarian (Esc)"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                        <CornerDownLeft className="w-2.5 h-2.5" /> Enter
                                    </span>
                                </div>
                            </div>

                            {/* Deteksi Kilat: Unit / No. HP Belum Terdaftar */}
                            {searchQuery.trim().length >= 3 && filteredPerangkats.length === 0 && (
                                <div 
                                    onClick={handleOpenQuickAdd}
                                    className="p-3 bg-blue-50/90 hover:bg-blue-100/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs group"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 group-hover:scale-105 transition-transform">
                                            <UserPlus className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-blue-900 truncate">
                                                Pelanggan / Unit "{searchQuery.trim()}" Belum Terdaftar
                                            </p>
                                            <p className="text-[11px] text-blue-700">
                                                Tekan <kbd className="px-1 py-0.5 bg-blue-200/90 text-blue-900 rounded font-bold text-[10px]">Enter ↵</kbd> atau klik di sini untuk registrasi kilat
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs shrink-0 flex items-center gap-1">
                                        <span>Daftarkan Kilat</span>
                                        <CornerDownLeft className="w-3 h-3" />
                                    </span>
                                </div>
                            )}

                            {/* Filter Section: Kategori & Merek */}
                            <div className="bg-white/90 border border-slate-200/90 rounded-xl p-2.5 space-y-2.5 shadow-2xs">
                                {/* Baris 1: Kategori Perangkat */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 w-16 shrink-0 uppercase tracking-wider">
                                        <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>Tipe</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar flex-1">
                                        {["Semua", "Laptop", "Desktop PC", "Printer", "Penyimpanan", "Lainnya"].map(cat => {
                                            const count = categoryCounts[cat] || 0;
                                            const isActive = categoryFilter === cat;
                                            const isEmpty = count === 0 && cat !== "Semua";

                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategoryFilter(cat);
                                                        setBrandFilter("Semua");
                                                    }}
                                                    disabled={isEmpty}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                                        isActive 
                                                            ? "bg-blue-600 text-white shadow-2xs" 
                                                            : isEmpty
                                                                ? "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                                                                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                                                    }`}
                                                >
                                                    <span>{cat}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                                        isActive 
                                                            ? "bg-blue-500/80 text-white" 
                                                            : isEmpty
                                                                ? "bg-slate-100 text-slate-300"
                                                                : "bg-slate-100 text-slate-600"
                                                    }`}>
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Baris 2: Merek (Hanya tampil jika ada pilihan merek di kategori ini) */}
                                {availableBrands.length > 1 && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 w-16 shrink-0 uppercase tracking-wider">
                                            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>Merek</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar flex-1">
                                            {availableBrands.map(brand => {
                                                const count = brandCounts[brand] || 0;
                                                const isActive = brandFilter === brand;

                                                return (
                                                    <button
                                                        key={brand}
                                                        type="button"
                                                        onClick={() => setBrandFilter(brandFilter === brand ? "Semua" : brand)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                                            isActive
                                                                ? "bg-slate-800 text-white shadow-2xs"
                                                                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                                                        }`}
                                                    >
                                                        <span>{brand}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                                            isActive 
                                                                ? "bg-slate-700 text-white" 
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}>
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })}

                                            {brandFilter !== "Semua" && (
                                                <button
                                                    type="button"
                                                    onClick={() => setBrandFilter("Semua")}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    <span>Reset Merek</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search Results / Device Selection List */}
                            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar pt-1">
                                {filteredPerangkats.length > 0 ? (
                                    filteredPerangkats.map((p, idx) => {
                                        const DevIcon = getDeviceIcon(p.jenis_perangkat);
                                        const latestTicket = p.tiket_servis?.[0];
                                        const isCurrentlyInService = latestTicket && ACTIVE_STATUSES.includes(latestTicket.status);
                                        const isTopMatch = idx === 0 && searchQuery.trim().length > 0;

                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    setForm({ ...form, perangkat_id: p.id });
                                                    setSearchQuery("");
                                                }}
                                                className={`group p-3 bg-white hover:bg-blue-50/60 border rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                                                    isTopMatch 
                                                        ? "border-blue-400 ring-2 ring-blue-500/15" 
                                                        : "border-slate-200 hover:border-blue-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2.5 rounded-lg transition-colors shrink-0 ${
                                                        isTopMatch 
                                                            ? "bg-blue-100 text-blue-700" 
                                                            : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                                                    }`}>
                                                        <DevIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-900">
                                                                <HighlightText text={p.merek} query={searchQuery} />{" "}
                                                                <HighlightText text={p.model} query={searchQuery} />
                                                            </span>
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                                {p.jenis_perangkat || "Laptop"}
                                                            </span>
                                                            {p.serial_number && (
                                                                <span className="text-[10px] font-mono text-slate-400">
                                                                    SN: <HighlightText text={p.serial_number} query={searchQuery} />
                                                                </span>
                                                            )}
                                                            {isCurrentlyInService ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                                    Sedang Diservis ({latestTicket.nomor_tiket})
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    Siap Diservis
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                                                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                                                                <User className="w-3 h-3 text-slate-400" />
                                                                <HighlightText text={p.customer?.nama} query={searchQuery} />
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                                <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                                                <HighlightText text={p.customer?.nomor_telepon} query={searchQuery} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isTopMatch && (
                                                        <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-100/90 rounded border border-blue-200">
                                                            <CornerDownLeft className="w-2.5 h-2.5" /> Enter
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                                                        {p._count?.tiket_servis ? `${p._count.tiket_servis}x Servis` : "Unit Baru"}
                                                    </span>
                                                    <span className="px-2.5 py-1 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 group-hover:border-blue-600 transition-all flex items-center gap-1">
                                                        <span>Pilih</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                                        <MonitorSmartphone className="w-8 h-8 text-slate-300 mx-auto" />
                                        <p className="text-xs font-bold text-slate-800">
                                            Tidak ditemukan unit yang cocok {searchQuery && `dengan "${searchQuery}"`}
                                        </p>
                                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                                            Pelanggan baru datang atau membawa unit yang belum pernah terdaftar?
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleOpenQuickAdd}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer mt-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Daftarkan Unit & Pelanggan Sekarang</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Kenali Riwayat Pelanggan & Unit Sebelumnya */}
                    {loadingPerangkatDetail ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600"></div>
                            <span>Memeriksa rekam riwayat unit & profil customer...</span>
                        </div>
                    ) : selectedPerangkatDetail && (
                        <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-900 block">
                                            Profil Pelanggan & Rekam Servis
                                        </span>
                                        <span className="text-[11px] text-slate-500 block">
                                            Personalisasi pelayanan dan panduan adaptasi komunikasi
                                        </span>
                                    </div>
                                </div>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                                    (selectedPerangkatDetail.tiket_servis?.length || 0) > 0 
                                        ? "bg-amber-50 text-amber-800 border-amber-200" 
                                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}>
                                    {(selectedPerangkatDetail.tiket_servis?.length || 0) > 0 
                                        ? `${selectedPerangkatDetail.tiket_servis.length}x Servis Sebelumnya` 
                                        : "Pelanggan / Unit Baru"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <span className="text-slate-500 block text-[11px] mb-1">Gaya Komunikasi Pelanggan:</span>
                                        <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1.5">
                                            <Smile className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>{selectedPerangkatDetail.customer?.tipe_kepribadian || "Netral"}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            {selectedPerangkatDetail.customer?.tipe_kepribadian === "Koleris" && "Tegas & to the point. Sampaikan kepastian solusi dan estimasi waktu."}
                                            {selectedPerangkatDetail.customer?.tipe_kepribadian === "Sanguinis" && "Ramah & antusias. Berikan sambutan hangat dan komunikasi apresiatif."}
                                            {selectedPerangkatDetail.customer?.tipe_kepribadian === "Plegmatis" && "Tenang & sabar. Jangan mendesak keputusan dan berikan rasa aman."}
                                            {selectedPerangkatDetail.customer?.tipe_kepribadian === "Melankolis" && "Kritis & teliti. Jelaskan detail teknis dan transparansi biaya."}
                                            {(!selectedPerangkatDetail.customer?.tipe_kepribadian || selectedPerangkatDetail.customer?.tipe_kepribadian === "Netral") && "Pendekatan standar: Salam ramah, mendengarkan aktif, dan tawarkan solusi."}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <span className="text-slate-500 block text-[11px] mb-1">Catatan Khusus Pelanggan:</span>
                                        <p className="text-[11px] text-slate-700 leading-relaxed break-words">
                                            {selectedPerangkatDetail.customer?.catatan_khusus || "Tidak ada catatan khusus untuk pelanggan ini."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedPerangkatDetail.tiket_servis?.some(t => t.warranty_status?.status === "Aktif") && (
                                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Perangkat ini masih memiliki status garansi aktif dari servis sebelumnya!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        Teknisi Penanggung Jawab
                    </label>
                    <select
                        value={form.teknisi_id}
                        onChange={(e) => setForm({ ...form, teknisi_id: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    >
                        <option value="">Belum Ditugaskan</option>
                        {teknisis.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.nama}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            Keluhan <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Min 10 - Max 1000 karakter</span>
                    </div>
                    <textarea
                        value={form.keluhan}
                        onChange={(e) => setForm({ ...form, keluhan: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                        rows={4}
                        placeholder="Deskripsikan keluhan customer secara detail..."
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            Kelengkapan Perangkat
                        </label>
                        <span className="text-[11px] text-slate-400">Maksimal 500 karakter</span>
                    </div>
                    <textarea
                        value={form.kelengkapan}
                        onChange={(e) => setForm({ ...form, kelengkapan: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                        rows={2}
                        placeholder="Contoh: Bawa charger ori, tas laptop hitam, tanpa box..."
                    />
                </div>

                {/* Pengecekan Fisik, Spesifikasi & Prioritas Pelanggan */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-900">Pengecekan Tahap Awal & Prioritas Layanan</h3>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                            Inspeksi Fisik & Penyelarasan Kebutuhan
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Kondisi Fisik Luar
                            </label>
                            <select
                                value={form.kondisi_fisik}
                                onChange={(e) => setForm({ ...form, kondisi_fisik: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                            >
                                <option value="Bersih">Bersih & Mulus (Normal)</option>
                                <option value="Kotor">Kotor / Berdebu / Jamur</option>
                                <option value="Ada yang Rusak">Ada yang Rusak / Baret / Retak Ringan</option>
                                <option value="Pecah">Pecah / Cacat Fisik Parah / Patah</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Spesifikasi Awal Unit
                            </label>
                            <input
                                type="text"
                                value={form.spesifikasi_awal}
                                onChange={(e) => setForm({ ...form, spesifikasi_awal: e.target.value })}
                                placeholder="Contoh: RAM 8GB, SSD 512GB, Intel i5, Win 11"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Feature 1: 2D Visual Defect Map trigger */}
                        <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-200/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                                        <Laptop className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900">Peta Cacat Fisik (2D Defect Map)</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                {defectMap.items.length} Titik Ditandai
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {defectMap.items.length > 0
                                                ? `${defectMap.items.length} titik cacat fisik (baret/penyok/retak) telah ditandai pada blueprint perangkat.`
                                                : "Tandai titik goresan, retak layar, penyok sudut, atau baut hilang sebelum diservis."}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDefectModalOpen(true)}
                                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                                >
                                    <Laptop className="w-3.5 h-3.5" />
                                    <span>{defectMap.items.length > 0 ? "Edit Peta Cacat" : "Buka Blueprint Cacat"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            Prioritas Penanganan Pelanggan
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                                { key: "Standar", label: "Standar", desc: "Reguler & seimbang" },
                                { key: "Data Aman", label: "Data Aman", desc: "Proteksi data pelanggan" },
                                { key: "Cepat Selesai", label: "Cepat Selesai", desc: "Kebutuhan mendesak" },
                                { key: "Biaya Hemat", label: "Biaya Hemat", desc: "Efisiensi anggaran" }
                            ].map((p) => {
                                const isSelected = form.prioritas_pelanggan === p.key;
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setForm({ ...form, prioritas_pelanggan: p.key })}
                                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[76px] ${
                                            isSelected 
                                                ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 text-blue-900 shadow-xs" 
                                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
                                        }`}
                                    >
                                        <div className="font-bold text-xs">{p.label}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 leading-tight">{p.desc}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feature 7: SLA Service Level Agreement Package */}
                    <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Paket Estimasi SLA Pengecekan & Diagnosis
                            </label>
                            <span className="text-[11px] text-slate-500 font-medium">
                                {getPreviewTarget(slaPaket)}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {SLA_PENGECEKAN_PACKAGES.map((pkg) => {
                                const isSelected = slaPaket === pkg.id;
                                const Icon = pkg.icon;
                                return (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSlaPaket(pkg.id)}
                                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                            isSelected 
                                                ? pkg.id === "express"
                                                    ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 text-amber-950 shadow-xs font-semibold"
                                                    : pkg.id === "kompleks"
                                                        ? "bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 text-purple-950 shadow-xs font-semibold"
                                                        : "bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 text-blue-950 shadow-xs font-semibold"
                                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${pkg.badgeBg}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-xs font-bold">{pkg.label}</span>
                                            </div>
                                            {pkg.id === "express" && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                                                    PRIORITAS
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                                            {pkg.desc}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                            * Estimasi SLA pengerjaan servis fisik akan ditentukan bersama pelanggan setelah hasil pemeriksaan awal selesai dirumuskan dan penawaran biaya disetujui (ACC).
                        </p>
                    </div>
                </div>

                {/* Feature 4: Device Credential Vault / PIN & Lock */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-sm font-bold text-slate-900">Keamanan & Kredensial Perangkat (Vault)</h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            Hanya terlihat oleh Teknisi & Admin
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Tipe Penguncian Layar
                            </label>
                            <select
                                value={form.tipe_kunci}
                                onChange={(e) => setForm({ ...form, tipe_kunci: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            >
                                <option value="Tidak Ada">Tidak Ada (Tanpa Kunci/Password)</option>
                                <option value="PIN">PIN Angka</option>
                                <option value="Password">Password / Kata Sandi</option>
                                <option value="Pola Kunci">Pola Gambar (Pattern)</option>
                            </select>
                        </div>

                        {form.tipe_kunci !== "Tidak Ada" && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    {form.tipe_kunci === "PIN" ? "Kode PIN Layar" : form.tipe_kunci === "Password" ? "Password Akun / BIOS" : "Catatan Pola Kunci"}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={form.password_perangkat}
                                        onChange={(e) => setForm({ ...form, password_perangkat: e.target.value })}
                                        placeholder={
                                            form.tipe_kunci === "PIN" 
                                                ? "Contoh: 123456" 
                                                : form.tipe_kunci === "Password" 
                                                    ? "Masukkan password OS / login..." 
                                                    : "Contoh: Pola huruf 'Z' dari kiri atas"
                                        }
                                        className="w-full pl-4 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-mono shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                        title={showPassword ? "Sembunyikan" : "Tampilkan"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                        * PIN/Password dibutuhkan oleh teknisi untuk melakukan pengujian fungsi internal (Keyboard, Audio, Kamera, WiFi, dan QC Akhir).
                    </p>
                </div>

                {/* Protokol Izin & Privasi Pelanggan */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-sm font-bold text-slate-900">Protokol Izin & Batasan Privasi</h3>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                            Persetujuan Formal Intake
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                            form.izin_bongkar 
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold shadow-xs" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                        }`}>
                            <div className="flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={form.izin_bongkar}
                                    onChange={(e) => setForm({ ...form, izin_bongkar: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Izin Bongkar Hardware</p>
                                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">Membuka casing & inspeksi motherboard / komponen internal</p>
                                </div>
                            </div>
                        </label>

                        <label className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                            form.izin_akses_os 
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold shadow-xs" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                        }`}>
                            <div className="flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={form.izin_akses_os}
                                    onChange={(e) => setForm({ ...form, izin_akses_os: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Izin Akses OS</p>
                                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">Login ke Windows/OS untuk pengetesan fungsi hardware & QC</p>
                                </div>
                            </div>
                        </label>

                        <label className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                            form.izin_backup_mandiri 
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold shadow-xs" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                        }`}>
                            <div className="flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={form.izin_backup_mandiri}
                                    onChange={(e) => setForm({ ...form, izin_backup_mandiri: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Izin / Konfirmasi Backup</p>
                                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">Pelanggan memahami status data & backup mandiri / persetujuan teknisi</p>
                                </div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Batasan Izin Khusus Pelanggan (Jika Ada)
                        </label>
                        <input
                            type="text"
                            value={form.batasan_izin}
                            onChange={(e) => setForm({ ...form, batasan_izin: e.target.value })}
                            placeholder="Contoh: Jangan buka partisi D:/Kerja atau folder foto pribadi..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Foto Kondisi Fisik Perangkat (Maks 10) */}
                <PhotoUploadSection
                    label="Foto Fisik Intake Perangkat"
                    sublabel="Dokumentasikan tampak depan, belakang, lecet/retak, dan nomor seri unit (Maksimal 10 foto)."
                    maxPhotos={10}
                    photos={fotos}
                    onChange={setFotos}
                />

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate("/tiket-servis")}
                        className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto text-center"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{loading ? "Menyimpan..." : "Buat Tiket"}</span>
                    </button>
                </div>
            </form>

            {/* Feature 1: 2D Defect Mapper Modal */}
            <DefectMapperModal
                isOpen={isDefectModalOpen}
                onClose={() => setIsDefectModalOpen(false)}
                value={defectMap}
                onChange={setDefectMap}
                title="Tandai Cacat Fisik Perangkat (2D Defect Map)"
            />

            {/* Quick Registration Modal: Pelanggan & Perangkat Baru */}
            {isQuickAddOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Registrasi Kilat Unit & Pelanggan</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Daftarkan pemilik dan perangkat langsung tanpa keluar halaman</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsQuickAddOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleQuickRegister} className="p-6 space-y-4 text-xs">
                            {/* Switch Mode: Pelanggan Baru vs Pelanggan Terdaftar */}
                            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setQuickIsExistingCustomer(false)}
                                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                        !quickIsExistingCustomer ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    + Pelanggan Baru (Walk-In)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickIsExistingCustomer(true)}
                                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                        quickIsExistingCustomer ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Pelanggan Terdaftar
                                </button>
                            </div>

                            {/* Section A: Customer Details */}
                            {!quickIsExistingCustomer ? (
                                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider pb-1 border-b border-slate-200/60">
                                        <User className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Identitas Pelanggan</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                                            <input
                                                type="text"
                                                value={quickForm.nama}
                                                onChange={(e) => setQuickForm({ ...quickForm, nama: e.target.value })}
                                                placeholder="Nama pelanggan..."
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                required={!quickIsExistingCustomer}
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp *</label>
                                            <input
                                                type="text"
                                                value={quickForm.nomor_telepon}
                                                onChange={(e) => setQuickForm({ ...quickForm, nomor_telepon: e.target.value })}
                                                placeholder="Contoh: 081234567890"
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                required={!quickIsExistingCustomer}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Tipe Kepribadian (Gaya Komunikasi)</label>
                                        <select
                                            value={quickForm.tipe_kepribadian}
                                            onChange={(e) => setQuickForm({ ...quickForm, tipe_kepribadian: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 font-medium"
                                        >
                                            <option value="Netral">Netral (Standar Ramah & Terstruktur)</option>
                                            <option value="Koleris">Koleris (Tegas, Lugas, Target Solusi Cepat)</option>
                                            <option value="Sanguinis">Sanguinis (Ekspresif, Ramah, Komunikasi Hangat)</option>
                                            <option value="Plegmatis">Plegmatis (Tenang, Sabar, Mengutamakan Rasa Aman)</option>
                                            <option value="Melankolis">Melankolis (Kritis, Teliti, Penjelasan Teknis Rinci)</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                                    <label className="block font-semibold text-slate-700">Pilih Pelanggan Terdaftar *</label>
                                    <select
                                        value={selectedExistingCustId}
                                        onChange={(e) => setSelectedExistingCustId(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 font-semibold"
                                        required={quickIsExistingCustomer}
                                    >
                                        <option value="">-- Pilih Pelanggan --</option>
                                        {existingCustomers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nama} ({c.nomor_telepon})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Section B: Device Details */}
                            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider pb-1 border-b border-slate-200/60">
                                    <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Data Perangkat Baru</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Kategori Perangkat *</label>
                                        <select
                                            value={quickForm.jenis_perangkat}
                                            onChange={(e) => setQuickForm({ ...quickForm, jenis_perangkat: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 font-semibold"
                                            required
                                        >
                                            {DEVICE_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Merek Perangkat *</label>
                                        <input
                                            type="text"
                                            value={quickForm.merek}
                                            onChange={(e) => setQuickForm({ ...quickForm, merek: e.target.value })}
                                            placeholder="Contoh: Asus, Lenovo, HP..."
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Quick Brand Suggestion Chips */}
                                <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[10px] text-slate-400 font-medium mr-1">Rekomendasi:</span>
                                    {POPULAR_BRANDS.map(brand => (
                                        <button
                                            key={brand}
                                            type="button"
                                            onClick={() => setQuickForm({ ...quickForm, merek: brand })}
                                            className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 transition-colors cursor-pointer"
                                        >
                                            {brand}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Tipe / Model Perangkat *</label>
                                        <input
                                            type="text"
                                            value={quickForm.model}
                                            onChange={(e) => setQuickForm({ ...quickForm, model: e.target.value })}
                                            placeholder="Contoh: Vivobook A1404, TUF F15..."
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Nomor Seri / Serial No (Opsional)</label>
                                        <input
                                            type="text"
                                            value={quickForm.serial_number}
                                            onChange={(e) => setQuickForm({ ...quickForm, serial_number: e.target.value })}
                                            placeholder="Serial number casing..."
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickAddOpen(false)}
                                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingQuick}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{savingQuick ? "Mendaftarkan..." : "Simpan & Pilih Unit Ini"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function getPreviewTarget(paket) {
    const d = new Date();
    const checkHours = paket === "express" ? 4 : paket === "kompleks" ? 48 : 24;
    d.setTime(d.getTime() + checkHours * 60 * 60 * 1000);
    const timeFormatted = d.toLocaleString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }) + " WIB";
    return `Target Cek: ${timeFormatted}`;
}
