import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
    Clock,
    Camera,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Users,
    Settings,
    FileSpreadsheet,
    ShieldCheck,
    LogOut,
    LogIn,
    RefreshCw,
    FileText,
    Plus,
    Check,
    X,
    Eye,
    Sliders,
    HelpCircle,
    ExternalLink
} from "lucide-react";
import WebcamSelfieModal from "./WebcamSelfieModal";

// Haversine formula client-side for immediate feedback
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3;
    const phi1 = (Number(lat1) * Math.PI) / 180;
    const phi2 = (Number(lat2) * Math.PI) / 180;
    const deltaPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
    const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

// Alamat fisik resmi workshop Pekayon
const WORKSHOP_DEFAULT_ADDRESS = "Jl. Raya Pekayon No.25, RT.004/RW.001, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi, Jawa Barat 17148";

// Reverse geocode koordinat GPS menjadi nama jalan dan wilayah detail (seperti watermark kamera HP)
async function fetchRealLocationAddress(lat, lon, isInRadius) {
    if (isInRadius) {
        return WORKSHOP_DEFAULT_ADDRESS;
    }
    if (!lat || !lon) {
        return "Lokasi tidak diketahui";
    }
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
                signal: controller.signal,
                headers: { "Accept-Language": "id,en" }
            }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.street || addr.pedestrian || addr.path || "";
            const houseNumber = addr.house_number ? `No.${addr.house_number}` : "";
            const streetLine = [road, houseNumber].filter(Boolean).join(" ");
            const village = addr.village || addr.suburb || addr.neighbourhood || addr.quarter || "";
            const district = addr.city_district || addr.district || addr.subdistrict || "";
            const city = addr.city || addr.town || addr.municipality || addr.county || "";
            const state = addr.state || "";
            const postcode = addr.postcode || "";

            const parts = [
                streetLine,
                village,
                district ? `Kec. ${district}` : "",
                city,
                state,
                postcode
            ].filter(Boolean);

            if (parts.length > 0) {
                return parts.join(", ");
            }
            if (data.display_name) {
                return data.display_name;
            }
        }
    } catch {
        // Fallback jika koneksi lambat atau offline
    }

    return `Area Koordinat ${lat.toFixed(5)}, ${lon.toFixed(5)}, Bekasi, Jawa Barat`;
}

export default function AttendancePage() {
    const { user, isAdmin } = useAuth();
    const isPimpinanOrAdmin = isAdmin || user?.role === "pimpinan";

    // Active View Tab: 'today' | 'history' | 'leaves' | 'monitoring' | 'policy'
    const [activeTab, setActiveTab] = useState("today");

    // Live Clock State
    const [currentTime, setCurrentTime] = useState(new Date());

    // Policy & Today Record State
    const [policy, setPolicy] = useState(null);
    const [todayRecord, setTodayRecord] = useState(null);
    const [activeLeave, setActiveLeave] = useState(null);
    const [loadingToday, setLoadingToday] = useState(true);

    // Geolocation state
    const [locationData, setLocationData] = useState({
        latitude: null,
        longitude: null,
        accuracy: null,
        distance: null,
        isInRadius: true,
        addressName: "Memuat alamat lokasi...",
        loading: true,
        error: null
    });

    // Webcam Modal State
    const [cameraModalOpen, setCameraModalOpen] = useState(false);
    const [cameraModalType, setCameraModalType] = useState("check-in"); // "check-in" | "check-out"

    // Personal History State
    const [myHistory, setMyHistory] = useState([]);
    const [myStats, setMyStats] = useState({ totalHadir: 0, totalTerlambat: 0, totalMenitTerlambat: 0, totalJamKerja: 0 });
    const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
    const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Leaves State
    const [leaves, setLeaves] = useState([]);
    const [loadingLeaves, setLoadingLeaves] = useState(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaveForm, setLeaveForm] = useState({
        tipe: "izin",
        tgl_mulai: new Date().toISOString().split("T")[0],
        tgl_selesai: new Date().toISOString().split("T")[0],
        alasan: ""
    });
    const [leaveFile, setLeaveFile] = useState(null);

    // Admin Daily Monitoring State
    const [dailyData, setDailyData] = useState({ list: [], stats: {}, tanggal: new Date() });
    const [filterDailyDate, setFilterDailyDate] = useState(new Date().toISOString().split("T")[0]);
    const [loadingDaily, setLoadingDaily] = useState(false);

    // Admin Monthly Recap State
    const [recapData, setRecapData] = useState([]);
    const [recapMonth, setRecapMonth] = useState(new Date().getMonth() + 1);
    const [recapYear, setRecapYear] = useState(new Date().getFullYear());
    const [loadingRecap, setLoadingRecap] = useState(false);

    // Admin Adjustment Modal State
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        record_id: null,
        user_id: null,
        userName: "",
        tanggal: "",
        jam_masuk: "",
        jam_pulang: "",
        status: "hadir",
        alasan_adjustment: ""
    });

    // Policy Settings Form State
    const [policyForm, setPolicyForm] = useState({
        nama_kantor: "Workshop Utama Pekayon",
        latitude: -6.274323,
        longitude: 106.977425,
        radius_meter: 100,
        jam_masuk: "08:30",
        toleransi_menit: 15,
        jam_pulang: "17:00",
        is_geofence_active: true,
        is_selfie_required: true
    });
    const [savingPolicy, setSavingPolicy] = useState(false);

    // Superadmin / Owner: Review Presensi Tugas Luar
    const [pendingReviews, setPendingReviews] = useState([]);
    const [pendingReviewCount, setPendingReviewCount] = useState(0);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [reviewFilter, setReviewFilter] = useState("menunggu_review"); // 'menunggu_review' | 'all' | 'valid' | 'ditolak'

    // Preview Photo Modal State
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

    // 1. Live Clock Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Browser Geolocation Tracker
    const fetchLocation = useCallback(() => {
        setLocationData(prev => ({ ...prev, loading: true, error: null }));
        if (!navigator.geolocation) {
            setLocationData(prev => ({
                ...prev,
                loading: false,
                addressName: WORKSHOP_DEFAULT_ADDRESS,
                error: "Browser Anda tidak mendukung layanan Geolocation GPS."
            }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const acc = position.coords.accuracy;

                let dist = null;
                let inRadius = true;

                if (policy?.latitude && policy?.longitude) {
                    dist = calculateDistanceMeters(lat, lon, policy.latitude, policy.longitude);
                    inRadius = dist <= policy.radius_meter;
                }

                const preliminaryAddress = inRadius ? WORKSHOP_DEFAULT_ADDRESS : "Mencari alamat lokasi real...";

                setLocationData({
                    latitude: lat,
                    longitude: lon,
                    accuracy: acc,
                    distance: dist,
                    isInRadius: inRadius,
                    addressName: preliminaryAddress,
                    loading: false,
                    error: null
                });

                // Jika di luar radius, lakukan reverse geocoding asynchronous agar nama jalan & kecamatan detail
                if (!inRadius) {
                    const realAddress = await fetchRealLocationAddress(lat, lon, false);
                    setLocationData(prev => ({
                        ...prev,
                        addressName: realAddress
                    }));
                }
            },
            (error) => {
                let msg = "Gagal mendapatkan lokasi GPS.";
                if (error.code === error.PERMISSION_DENIED) {
                    msg = "Izin akses lokasi ditolak oleh browser. Harap izinkan akses lokasi untuk presensi.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    msg = "Sinyal GPS tidak tersedia atau perangkat sedang offline.";
                } else if (error.code === error.TIMEOUT) {
                    msg = "Waktu pencarian sinyal lokasi GPS habis (Timeout).";
                }
                setLocationData(prev => ({
                    ...prev,
                    loading: false,
                    addressName: WORKSHOP_DEFAULT_ADDRESS,
                    error: msg
                }));
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }, [policy]);

    // 3. Load Today Status & Policy
    const loadTodayStatus = useCallback(async () => {
        setLoadingToday(true);
        try {
            const res = await api.get("/attendance/today");
            setPolicy(res.data.policy);
            setTodayRecord(res.data.record);
            setActiveLeave(res.data.activeLeave);

            if (res.data.policy) {
                setPolicyForm({
                    nama_kantor: res.data.policy.nama_kantor || "Workshop Utama",
                    latitude: res.data.policy.latitude,
                    longitude: res.data.policy.longitude,
                    radius_meter: res.data.policy.radius_meter,
                    jam_masuk: res.data.policy.jam_masuk,
                    toleransi_menit: res.data.policy.toleransi_menit,
                    jam_pulang: res.data.policy.jam_pulang,
                    is_geofence_active: res.data.policy.is_geofence_active,
                    is_selfie_required: res.data.policy.is_selfie_required
                });
            }
        } catch (err) {
            console.error("Failed to load today attendance:", err);
            toast.error("Gagal memuat status presensi hari ini.");
        } finally {
            setLoadingToday(false);
        }
    }, []);

    useEffect(() => {
        loadTodayStatus();
    }, [loadTodayStatus]);

    useEffect(() => {
        if (policy) {
            fetchLocation();
        }
    }, [policy, fetchLocation]);

    // 4. Load Personal History
    const loadMyHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await api.get(`/attendance/my-history?bulan=${historyMonth}&tahun=${historyYear}`);
            setMyHistory(res.data.records || []);
            setMyStats(res.data.stats || { totalHadir: 0, totalTerlambat: 0, totalMenitTerlambat: 0, totalJamKerja: 0 });
        } catch (err) {
            toast.error("Gagal memuat riwayat presensi");
        } finally {
            setLoadingHistory(false);
        }
    }, [historyMonth, historyYear]);

    useEffect(() => {
        if (activeTab === "history") {
            loadMyHistory();
        }
    }, [activeTab, loadMyHistory]);

    // 5. Load Leaves
    const loadLeaves = useCallback(async () => {
        setLoadingLeaves(true);
        try {
            const res = await api.get("/attendance/leaves");
            setLeaves(res.data || []);
        } catch (err) {
            toast.error("Gagal memuat daftar pengajuan izin");
        } finally {
            setLoadingLeaves(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "leaves") {
            loadLeaves();
        }
    }, [activeTab, loadLeaves]);

    // 6. Load Daily All (Admin)
    const loadDailyAll = useCallback(async () => {
        setLoadingDaily(true);
        try {
            const res = await api.get(`/attendance/daily-all?tanggal=${filterDailyDate}`);
            setDailyData(res.data || { list: [], stats: {} });
        } catch (err) {
            toast.error("Gagal memuat rekap presensi harian tim");
        } finally {
            setLoadingDaily(false);
        }
    }, [filterDailyDate]);

    useEffect(() => {
        if (activeTab === "monitoring" && isPimpinanOrAdmin) {
            loadDailyAll();
        }
    }, [activeTab, filterDailyDate, isPimpinanOrAdmin, loadDailyAll]);

    // 7. Load Monthly Recap (Admin)
    const loadMonthlyRecap = useCallback(async () => {
        setLoadingRecap(true);
        try {
            const res = await api.get(`/attendance/recap?bulan=${recapMonth}&tahun=${recapYear}`);
            setRecapData(res.data.recap || []);
        } catch (err) {
            toast.error("Gagal memuat rekapitulasi payroll");
        } finally {
            setLoadingRecap(false);
        }
    }, [recapMonth, recapYear]);

    // 8. Load Pending Reviews (Admin / Superadmin / Owner)
    const loadPendingReviews = useCallback(async () => {
        if (!isPimpinanOrAdmin) return;
        setLoadingReviews(true);
        try {
            const res = await api.get(`/attendance/pending-reviews?status_filter=${reviewFilter}`);
            setPendingReviews(res.data.list || []);
            setPendingReviewCount(res.data.pendingCount || 0);
        } catch (err) {
            console.error("Gagal memuat daftar review presensi tugas luar:", err);
        } finally {
            setLoadingReviews(false);
        }
    }, [isPimpinanOrAdmin, reviewFilter]);

    useEffect(() => {
        if (isPimpinanOrAdmin) {
            loadPendingReviews();
        }
    }, [isPimpinanOrAdmin, loadPendingReviews]);

    // Handle Review Action (Valid / Tolak)
    const handleReviewAttendance = async (id, statusReview) => {
        let note = "";
        if (statusReview === "ditolak") {
            const input = prompt("Masukkan alasan penolakan presensi tugas luar:", "Di luar jadwal/penugasan resmi");
            if (input === null) return;
            note = input;
        }

        try {
            const res = await api.put(`/attendance/${id}/review`, {
                status_review: statusReview,
                catatan_review: note
            });
            toast.success(res.data.message || `Presensi berhasil ${statusReview === "valid" ? "disetujui" : "ditolak"}`);
            loadPendingReviews();
            loadTodayStatus();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses review presensi");
        }
    };

    // Check-In Submit via Webcam
    const handleCheckInCapture = async (fileBlob, extraData = {}) => {
        const formData = new FormData();
        formData.append("foto", fileBlob);
        if (locationData.latitude !== null) formData.append("latitude", locationData.latitude);
        if (locationData.longitude !== null) formData.append("longitude", locationData.longitude);
        formData.append("device_info", navigator.userAgent);
        if (locationData.addressName) {
            formData.append("catatan", `Alamat Lokasi: ${locationData.addressName}`);
        }
        if (extraData?.is_tugas_luar || cameraModalType === "tugas-luar") {
            formData.append("is_tugas_luar", "true");
            if (extraData?.alasan_tugas_luar) {
                formData.append("alasan_tugas_luar", extraData.alasan_tugas_luar);
            }
        }

        try {
            const res = await api.post("/attendance/check-in", formData);
            toast.success(res.data.message || "Check-In berhasil!");
            loadTodayStatus();
            if (isPimpinanOrAdmin) {
                loadPendingReviews();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal melakukan Check-In");
            throw err;
        }
    };

    // Check-Out Submit via Webcam
    const handleCheckOutCapture = async (fileBlob) => {
        const formData = new FormData();
        formData.append("foto", fileBlob);
        if (locationData.latitude !== null) formData.append("latitude", locationData.latitude);
        if (locationData.longitude !== null) formData.append("longitude", locationData.longitude);
        formData.append("device_info", navigator.userAgent);
        if (locationData.addressName) {
            formData.append("catatan", `Alamat Pulang: ${locationData.addressName}`);
        }
        if (todayRecord?.is_tugas_luar) {
            formData.append("is_tugas_luar", "true");
        }

        try {
            const res = await api.post("/attendance/check-out", formData);
            toast.success(res.data.message || "Check-Out berhasil!");
            loadTodayStatus();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal melakukan Check-Out");
            throw err;
        }
    };

    // Submit Leave Request
    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("tipe", leaveForm.tipe);
        formData.append("tgl_mulai", leaveForm.tgl_mulai);
        formData.append("tgl_selesai", leaveForm.tgl_selesai);
        formData.append("alasan", leaveForm.alasan);
        if (leaveFile) formData.append("lampiran", leaveFile);

        try {
            const res = await api.post("/attendance/leaves", formData);
            toast.success(res.data.message || "Pengajuan izin berhasil dikirim!");
            setLeaveModalOpen(false);
            setLeaveForm({
                tipe: "izin",
                tgl_mulai: new Date().toISOString().split("T")[0],
                tgl_selesai: new Date().toISOString().split("T")[0],
                alasan: ""
            });
            setLeaveFile(null);
            loadLeaves();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengajukan izin");
        }
    };

    // Review Leave (Admin)
    const handleReviewLeave = async (id, status) => {
        const note = prompt(`Catatan persetujuan (${status}):`, status === "disetujui" ? "Disetujui oleh admin" : "Tidak memenuhi syarat");
        if (note === null) return;

        try {
            const res = await api.put(`/attendance/leaves/${id}/review`, {
                status,
                catatan_approver: note
            });
            toast.success(res.data.message);
            loadLeaves();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses persetujuan");
        }
    };

    // Submit Adjustment (Admin)
    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/attendance/adjust", adjustForm);
            toast.success(res.data.message || "Presensi berhasil dikoreksi");
            setAdjustModalOpen(false);
            loadDailyAll();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengoreksi presensi");
        }
    };

    // Save Policy Settings
    const handleSavePolicy = async (e) => {
        e.preventDefault();
        setSavingPolicy(true);
        try {
            const res = await api.put("/attendance/policy", policyForm);
            toast.success(res.data.message || "Pengaturan berhasil diperbarui");
            setPolicy(res.data.policy);
            fetchLocation();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui pengaturan");
        } finally {
            setSavingPolicy(false);
        }
    };

    // Grab current location for policy setting
    const handleUseCurrentLocationForPolicy = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation tidak didukung browser ini");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPolicyForm(prev => ({
                    ...prev,
                    latitude: Number(pos.coords.latitude.toFixed(6)),
                    longitude: Number(pos.coords.longitude.toFixed(6))
                }));
                toast.success("Koordinat saat ini berhasil diterapkan ke form pengaturan!");
            },
            () => toast.error("Gagal mengambil koordinat saat ini.")
        );
    };

    // Export Recap to Excel (XLSX)
    const exportRecapExcel = () => {
        if (!recapData || recapData.length === 0) {
            toast.error("Tidak ada data rekap untuk diekspor");
            return;
        }

        const formatted = recapData.map((item, idx) => ({
            "No": idx + 1,
            "Nama Karyawan": item.user?.nama,
            "Email": item.user?.email,
            "Role": item.user?.role?.toUpperCase(),
            "Total Hadir (Hari)": item.hadir,
            "Total Terlambat (Hari)": item.terlambat,
            "Total Menit Terlambat": item.menitKeterlambatan,
            "Total Jam Kerja": item.jamKerja,
            "Cuti (Hari)": item.cuti,
            "Sakit (Hari)": item.sakit,
            "Izin (Hari)": item.izin,
            "Total Entri": item.totalRecords
        }));

        const ws = XLSX.utils.json_to_sheet(formatted);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi");
        XLSX.writeFile(wb, `Rekap_Presensi_Workshop_${recapMonth}_${recapYear}.xlsx`);
        toast.success("File Excel Rekap Presensi berhasil diunduh!");
    };

    // Status Helper
    const getStatusBadge = (status) => {
        switch (status) {
            case "hadir":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Tepat Waktu</span>
                    </span>
                );
            case "terlambat":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Terlambat</span>
                    </span>
                );
            case "pulang_cepat":
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Pulang Cepat</span>;
            case "cuti":
            case "izin":
            case "sakit":
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">{status.toUpperCase()}</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-4.5 w-full pb-10">
            {/* Top Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Clock className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Presensi & Kehadiran Tim</h1>
                            <p className="text-xs text-slate-500 font-medium">
                                Sistem absensi berbasis webcam live selfie, GPS geofencing radius, dan rekapitulasi payroll.
                            </p>
                        </div>
                    </div>

                    {/* Live Digital Clock Badge */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                            <div className="text-xs font-black text-slate-800 tabular-nums">
                                {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
                            </div>
                            <div className="text-3xs text-slate-400 font-semibold">
                                {currentTime.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation Navigation Pill */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-4 mt-2 border-t border-slate-100">
                    <button
                        onClick={() => setActiveTab("today")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === "today"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                    >
                        <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Presensi Hari Ini</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === "history"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Riwayat Saya</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("leaves")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === "leaves"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Pengajuan Izin & Cuti</span>
                    </button>

                    {isPimpinanOrAdmin && (
                        <>
                            <button
                                onClick={() => setActiveTab("reviews")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap relative ${
                                    activeTab === "reviews"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                }`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Review Tugas Luar</span>
                                {pendingReviewCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-3xs font-extrabold bg-amber-500 text-white leading-none animate-pulse">
                                        {pendingReviewCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab("monitoring")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === "monitoring"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                }`}
                            >
                                <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Monitoring Tim (Payroll)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("policy")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === "policy"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                }`}
                            >
                                <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Kebijakan & Lokasi</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* TAB 1: PRESENSI HARI INI */}
            {activeTab === "today" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {/* Left: GPS Geofence Status Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span>Geofencing & Lokasi GPS</span>
                            </h2>
                            <button
                                onClick={fetchLocation}
                                disabled={locationData.loading}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Segarkan Koordinat GPS"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${locationData.loading ? "animate-spin text-blue-600" : ""}`} />
                            </button>
                        </div>

                        {/* Location Details Box */}
                        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
                            <div className="flex items-start justify-between text-xs gap-2">
                                <span className="text-slate-500 font-semibold shrink-0">Workshop:</span>
                                <div className="text-right">
                                    <span className="font-bold text-slate-800 block">{policy?.nama_kantor || "Workshop Utama"}</span>
                                    <span className="text-3xs text-slate-500 block leading-tight mt-0.5">{WORKSHOP_DEFAULT_ADDRESS}</span>
                                </div>
                            </div>
                            <div className="flex items-start justify-between text-xs gap-2 pt-1 border-t border-slate-200/60">
                                <span className="text-slate-500 font-semibold shrink-0">Lokasi Real Anda:</span>
                                <span className="font-bold text-slate-800 text-right text-3xs sm:text-2xs max-w-[210px] leading-tight">
                                    {locationData.loading ? "Mencari detail lokasi..." : (locationData.addressName || "-")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                                <span className="text-slate-500 font-semibold">Batas Radius:</span>
                                <span className="font-bold text-slate-800">{policy?.radius_meter || 100} Meter</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-semibold">Jarak Anda:</span>
                                <span className="font-bold text-slate-800">
                                    {locationData.loading 
                                        ? "Mengukur jarak..." 
                                        : locationData.distance !== null 
                                            ? `${locationData.distance} Meter` 
                                            : "-"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-semibold">Koordinat & Akurasi:</span>
                                <span className="font-medium text-slate-600 text-3xs">
                                    {locationData.latitude 
                                        ? `${locationData.latitude.toFixed(5)}, ${locationData.longitude.toFixed(5)} (±${Math.round(locationData.accuracy || 0)}m)` 
                                        : "-"}
                                </span>
                            </div>
                        </div>

                        {/* Radius Verification Alert Banner */}
                        {locationData.error ? (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Akses Lokasi Diblokir</p>
                                    <p className="text-2xs text-rose-700 mt-0.5">{locationData.error}</p>
                                </div>
                            </div>
                        ) : locationData.distance !== null && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-2 text-xs ${
                                locationData.isInRadius 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                                    : "bg-amber-50 border-amber-200 text-amber-900"
                            }`}>
                                <div className="flex items-start gap-2.5">
                                    {locationData.isInRadius ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="font-bold">
                                            {locationData.isInRadius 
                                                ? "Lokasi Valid: Dalam Radius Workshop" 
                                                : "Di Luar Radius Workshop (Pekayon)"}
                                        </p>
                                        <p className="text-2xs mt-0.5">
                                            {locationData.isInRadius
                                                ? `Anda terdeteksi di lokasi workshop (${locationData.distance}m <= ${policy?.radius_meter}m).`
                                                : `Jarak Anda (${locationData.distance}m) melebihi batas geofence (${policy?.radius_meter}m). Anda dapat menggunakan opsi Check-In Tugas Luar.`}
                                        </p>
                                    </div>
                                </div>
                                {!locationData.isInRadius && !todayRecord?.jam_masuk && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCameraModalType("tugas-luar");
                                            setCameraModalOpen(true);
                                        }}
                                        className="self-end px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-2xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                        <MapPin className="w-3 h-3" />
                                        <span>Check-In Tugas Luar</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Policy Hours Info */}
                        <div className="text-xs text-slate-500 space-y-1.5 pt-1">
                            <div className="flex justify-between">
                                <span>Jam Masuk:</span>
                                <strong className="text-slate-800">{policy?.jam_masuk || "08:30"} WIB (Toleransi {policy?.toleransi_menit || 15}m)</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Jam Pulang:</span>
                                <strong className="text-slate-800">{policy?.jam_pulang || "17:00"} WIB</strong>
                            </div>
                        </div>
                    </div>

                    {/* Middle & Right: Check-In & Check-Out Card */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-5">
                        <div>
                            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Status Kehadiran Hari Ini</h2>
                                    <p className="text-2xs text-slate-500">
                                        {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                </div>
                                {todayRecord && getStatusBadge(todayRecord.status)}
                            </div>

                            {activeLeave && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span>Hari ini Anda tercatat memiliki izin <strong>{activeLeave.tipe.toUpperCase()}</strong>: {activeLeave.alasan}</span>
                                </div>
                            )}

                            {/* Dual Slot: Check-In vs Check-Out Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                                {/* Slot Masuk */}
                                <div className={`p-4 rounded-xl border transition-all ${
                                    todayRecord?.jam_masuk 
                                        ? "bg-emerald-50/60 border-emerald-200" 
                                        : "bg-slate-50 border-slate-200"
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Presensi Masuk</span>
                                        </span>
                                        {todayRecord?.jam_masuk && (
                                            <span className="text-3xs font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                                Tercatat
                                            </span>
                                        )}
                                    </div>

                                    {todayRecord?.jam_masuk ? (
                                        <div className="space-y-2">
                                            <div className="text-xl font-extrabold text-slate-800 tabular-nums">
                                                {new Date(todayRecord.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                            </div>
                                            <p className="text-2xs text-slate-600">
                                                Jarak: {todayRecord.jarak_meter_masuk !== null ? `${todayRecord.jarak_meter_masuk}m` : "-"} • {todayRecord.is_in_radius_masuk ? "Di Lokasi" : "Luar Radius"}
                                            </p>
                                            {todayRecord.foto_masuk && (
                                                <button
                                                    onClick={() => setPreviewPhotoUrl(todayRecord.foto_masuk)}
                                                    className="text-2xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 cursor-pointer"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    <span>Lihat Foto Selfie Masuk</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-3 text-center sm:text-left">
                                            <p className="text-xs text-slate-400 font-medium">Belum Check-In</p>
                                            <p className="text-3xs text-slate-400 mt-0.5">Batas waktu {policy?.jam_masuk || "08:30"} WIB</p>
                                        </div>
                                    )}
                                </div>

                                {/* Slot Pulang */}
                                <div className={`p-4 rounded-xl border transition-all ${
                                    todayRecord?.jam_pulang 
                                        ? "bg-amber-50/60 border-amber-200" 
                                        : "bg-slate-50 border-slate-200"
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <LogOut className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Presensi Pulang</span>
                                        </span>
                                        {todayRecord?.jam_pulang && (
                                            <span className="text-3xs font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                                Selesai
                                            </span>
                                        )}
                                    </div>

                                    {todayRecord?.jam_pulang ? (
                                        <div className="space-y-2">
                                            <div className="text-xl font-extrabold text-slate-800 tabular-nums">
                                                {new Date(todayRecord.jam_pulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                            </div>
                                            <p className="text-2xs text-slate-600">
                                                Durasi: {Math.floor(todayRecord.durasi_kerja_menit / 60)} Jam {todayRecord.durasi_kerja_menit % 60} Menit
                                            </p>
                                            {todayRecord.foto_pulang && (
                                                <button
                                                    onClick={() => setPreviewPhotoUrl(todayRecord.foto_pulang)}
                                                    className="text-2xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 cursor-pointer"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    <span>Lihat Foto Selfie Pulang</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-3 text-center sm:text-left">
                                            <p className="text-xs text-slate-400 font-medium">Belum Check-Out</p>
                                            <p className="text-3xs text-slate-400 mt-0.5">Selesai jam {policy?.jam_pulang || "17:00"} WIB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* External Duty / Tugas Luar Review Status Banner */}
                            {todayRecord?.is_tugas_luar && (
                                <div className={`mt-3.5 p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                    todayRecord.status_review === "valid"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                        : todayRecord.status_review === "ditolak"
                                            ? "bg-rose-50 border-rose-200 text-rose-900"
                                            : "bg-amber-50 border-amber-200 text-amber-900"
                                }`}>
                                    <div className="flex items-start sm:items-center gap-2">
                                        <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
                                            todayRecord.status_review === "valid" 
                                                ? "text-emerald-600" 
                                                : todayRecord.status_review === "ditolak" 
                                                    ? "text-rose-600" 
                                                    : "text-amber-600"
                                        }`} />
                                        <div>
                                            <span className="font-bold">
                                                {todayRecord.status_review === "valid"
                                                    ? "Presensi Tugas Luar Disetujui Superadmin/Owner"
                                                    : todayRecord.status_review === "ditolak"
                                                        ? "Presensi Tugas Luar Ditolak"
                                                        : "Kategori Tugas Luar (Menunggu Verifikasi Owner)"}
                                            </span>
                                            {todayRecord.alasan_tugas_luar && (
                                                <p className="text-2xs opacity-90 mt-0.5">Alasan: {todayRecord.alasan_tugas_luar}</p>
                                            )}
                                            {todayRecord.catatan_review && (
                                                <p className="text-2xs opacity-90 mt-0.5">Catatan Review: {todayRecord.catatan_review}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase shrink-0 self-start sm:self-auto ${
                                        todayRecord.status_review === "valid"
                                            ? "bg-emerald-200 text-emerald-800"
                                            : todayRecord.status_review === "ditolak"
                                                ? "bg-rose-200 text-rose-800"
                                                : "bg-amber-200 text-amber-800 animate-pulse"
                                    }`}>
                                        {todayRecord.status_review === "valid" ? (
                                            <>
                                                <Check className="w-3 h-3 stroke-[3]" />
                                                <span>Disetujui</span>
                                            </>
                                        ) : todayRecord.status_review === "ditolak" ? (
                                            <>
                                                <X className="w-3 h-3 stroke-[3]" />
                                                <span>Ditolak</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-3 h-3 stroke-[2.5]" />
                                                <span>Menunggu</span>
                                            </>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons Section */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                            {!todayRecord?.jam_masuk ? (
                                policy?.is_geofence_active && (!locationData.isInRadius || locationData.loading) ? (
                                    <button
                                        onClick={() => {
                                            setCameraModalType("tugas-luar");
                                            setCameraModalOpen(true);
                                        }}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-500/20"
                                    >
                                        <MapPin className="w-4 h-4 stroke-[2.5]" />
                                        <span>Check-In Tugas Luar (Di Luar Kantor)</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setCameraModalType("check-in");
                                            setCameraModalOpen(true);
                                        }}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/20"
                                    >
                                        <Camera className="w-4 h-4 stroke-[2.5]" />
                                        <span>Check In Masuk Sekarang</span>
                                    </button>
                                )
                            ) : !todayRecord?.jam_pulang ? (
                                <button
                                    onClick={() => {
                                        setCameraModalType("check-out");
                                        setCameraModalOpen(true);
                                    }}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-500/20"
                                >
                                    <LogOut className="w-4 h-4 stroke-[2.5]" />
                                    <span>Check Out Pulang Sekarang</span>
                                </button>
                            ) : (
                                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Presensi hari ini telah lengkap. Terima kasih atas kerja keras Anda!</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: RIWAYAT SAYA */}
            {activeTab === "history" && (
                <div className="space-y-4">
                    {/* Month/Year Filter Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-slate-800">Filter Periode Presensi Pribadi</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={historyMonth}
                                onChange={(e) => setHistoryMonth(Number(e.target.value))}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                            >
                                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={historyYear}
                                onChange={(e) => setHistoryYear(Number(e.target.value))}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                            >
                                {[2025, 2026, 2027].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stats Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                            <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Hadir</p>
                            <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{myStats.totalHadir} Hari</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                            <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Terlambat</p>
                            <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{myStats.totalTerlambat} Kali</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                            <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Total Menit Telat</p>
                            <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{myStats.totalMenitTerlambat} Mnt</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                            <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Total Jam Kerja</p>
                            <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{myStats.totalJamKerja} Jam</p>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-3xs font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="py-3 px-4">Tanggal</th>
                                        <th className="py-3 px-4">Jam Masuk</th>
                                        <th className="py-3 px-4">Jam Pulang</th>
                                        <th className="py-3 px-4">Durasi Kerja</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Keterlambatan</th>
                                        <th className="py-3 px-4 text-center">Foto Bukti</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {loadingHistory ? (
                                        <tr>
                                            <td colSpan="7" className="py-8 text-center text-slate-400 font-semibold">
                                                Memuat riwayat presensi...
                                            </td>
                                        </tr>
                                    ) : myHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-8 text-center text-slate-400 font-semibold">
                                                Belum ada catatan presensi pada periode ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        myHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-4 font-bold text-slate-800">
                                                    {new Date(item.tanggal).toLocaleDateString("id-ID", {
                                                        weekday: "short",
                                                        day: "numeric",
                                                        month: "short"
                                                    })}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-700 tabular-nums">
                                                    {item.jam_masuk ? new Date(item.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" : "-"}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-700 tabular-nums">
                                                    {item.jam_pulang ? new Date(item.jam_pulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" : "-"}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-slate-600">
                                                    {item.durasi_kerja_menit ? `${Math.floor(item.durasi_kerja_menit / 60)}j ${item.durasi_kerja_menit % 60}m` : "-"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {item.menit_keterlambatan > 0 ? (
                                                        <span className="text-rose-600 font-bold">+{item.menit_keterlambatan} mnt</span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {item.foto_masuk && (
                                                            <button
                                                                onClick={() => setPreviewPhotoUrl(item.foto_masuk)}
                                                                className="p-1 hover:bg-slate-100 rounded text-blue-600 cursor-pointer"
                                                                title="Lihat Foto Masuk"
                                                            >
                                                                <Camera className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {item.foto_pulang && (
                                                            <button
                                                                onClick={() => setPreviewPhotoUrl(item.foto_pulang)}
                                                                className="p-1 hover:bg-slate-100 rounded text-amber-600 cursor-pointer"
                                                                title="Lihat Foto Pulang"
                                                            >
                                                                <LogOut className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: PENGAJUAN IZIN & CUTI */}
            {activeTab === "leaves" && (
                <div className="space-y-4">
                    {/* Header + Add Button */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Pengajuan Izin, Cuti, & Sakit</h2>
                            <p className="text-2xs text-slate-500">Form pengajuan dispensasi ketidakhadiran kerja dengan bukti pendukung</p>
                        </div>
                        <button
                            onClick={() => setLeaveModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Ajukan Permohonan</span>
                        </button>
                    </div>

                    {/* Table of Leaves */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-3xs font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="py-3 px-4">Karyawan</th>
                                        <th className="py-3 px-4">Tipe Izin</th>
                                        <th className="py-3 px-4">Rentang Tanggal</th>
                                        <th className="py-3 px-4">Durasi</th>
                                        <th className="py-3 px-4">Alasan</th>
                                        <th className="py-3 px-4">Lampiran</th>
                                        <th className="py-3 px-4">Status Approval</th>
                                        {isPimpinanOrAdmin && <th className="py-3 px-4 text-center">Aksi Admin</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {loadingLeaves ? (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">
                                                Memuat data permohonan izin...
                                            </td>
                                        </tr>
                                    ) : leaves.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">
                                                Belum ada pengajuan izin atau cuti yang tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.map(l => (
                                            <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-4 font-bold text-slate-800">
                                                    {l.user?.nama}
                                                    <span className="block text-3xs font-normal text-slate-400">{l.user?.role}</span>
                                                </td>
                                                <td className="py-3 px-4 font-bold uppercase text-blue-600">
                                                    {l.tipe}
                                                </td>
                                                <td className="py-3 px-4 text-slate-700">
                                                    {new Date(l.tgl_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} s.d{" "}
                                                    {new Date(l.tgl_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-800">
                                                    {l.jumlah_hari} Hari
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={l.alasan}>
                                                    {l.alasan}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {l.lampiran_url ? (
                                                        <a
                                                            href={l.lampiran_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-2xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            <span>Lihat Bukti</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 text-2xs">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {l.status === "disetujui" ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-100 text-emerald-800">Disetujui</span>
                                                    ) : l.status === "ditolak" ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-rose-100 text-rose-800">Ditolak</span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-800">Menunggu Review</span>
                                                    )}
                                                </td>
                                                {isPimpinanOrAdmin && (
                                                    <td className="py-3 px-4 text-center">
                                                        {l.status === "menunggu" ? (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleReviewLeave(l.id, "disetujui")}
                                                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                                                                    title="Setujui Izin"
                                                                >
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReviewLeave(l.id, "ditolak")}
                                                                    className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition-colors cursor-pointer"
                                                                    title="Tolak Izin"
                                                                >
                                                                    <X className="w-3.5 h-3.5 stroke-[3]" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-3xs text-slate-400">Diproses oleh {l.approved_by?.nama || "Admin"}</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: MONITORING TIM & REKAP PAYROLL (ADMIN) */}
            {activeTab === "monitoring" && isPimpinanOrAdmin && (
                <div className="space-y-4">
                    {/* Header Toolbar: Date Selector + Monthly Recap Toggle */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-slate-800">Monitoring Presensi Harian Seluruh Tim</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={filterDailyDate}
                                onChange={(e) => setFilterDailyDate(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                            />
                            <button
                                onClick={loadDailyAll}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingDaily ? "animate-spin text-blue-600" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* Daily Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs">
                            <span className="text-3xs font-bold text-slate-400 uppercase">Total Karyawan</span>
                            <p className="text-xl font-extrabold text-slate-800 mt-1">{dailyData.stats?.totalKaryawan || 0}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs">
                            <span className="text-3xs font-bold text-emerald-600 uppercase">Hadir Tepat Waktu</span>
                            <p className="text-xl font-extrabold text-emerald-600 mt-1">
                                {(dailyData.stats?.hadir || 0) - (dailyData.stats?.terlambat || 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs">
                            <span className="text-3xs font-bold text-rose-600 uppercase">Terlambat</span>
                            <p className="text-xl font-extrabold text-rose-600 mt-1">{dailyData.stats?.terlambat || 0}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs">
                            <span className="text-3xs font-bold text-blue-600 uppercase">Cuti / Izin</span>
                            <p className="text-xl font-extrabold text-blue-600 mt-1">{dailyData.stats?.izin || 0}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs col-span-2 sm:col-span-1">
                            <span className="text-3xs font-bold text-slate-500 uppercase">Belum Absen</span>
                            <p className="text-xl font-extrabold text-slate-500 mt-1">{dailyData.stats?.belumAbsen || 0}</p>
                        </div>
                    </div>

                    {/* Table of Employees Today */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-xs">Daftar Status Presensi Hari Terpilih</h3>
                            <span className="text-3xs text-slate-400 font-semibold">Metode: Web Live Selfie + GPS</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-3xs font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="py-3 px-4">Karyawan</th>
                                        <th className="py-3 px-4">Jabatan</th>
                                        <th className="py-3 px-4">Jam Masuk</th>
                                        <th className="py-3 px-4">Jam Pulang</th>
                                        <th className="py-3 px-4">Jarak GPS</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Foto Selfie</th>
                                        <th className="py-3 px-4 text-center">Aksi Koreksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {loadingDaily ? (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">
                                                Memuat status kehadiran harian...
                                            </td>
                                        </tr>
                                    ) : dailyData.list?.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">
                                                Tidak ada data karyawan ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        dailyData.list?.map(row => (
                                            <tr key={row.user.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-4 font-bold text-slate-800">
                                                    {row.user.nama}
                                                    <span className="block text-3xs font-normal text-slate-400">{row.user.email}</span>
                                                </td>
                                                <td className="py-3 px-4 font-semibold capitalize text-slate-600">
                                                    {row.user.role}
                                                </td>
                                                <td className="py-3 px-4 tabular-nums font-bold text-slate-700">
                                                    {row.attendance?.jam_masuk 
                                                        ? new Date(row.attendance.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" 
                                                        : "-"}
                                                </td>
                                                <td className="py-3 px-4 tabular-nums font-bold text-slate-700">
                                                    {row.attendance?.jam_pulang 
                                                        ? new Date(row.attendance.jam_pulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" 
                                                        : "-"}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-slate-600">
                                                    {row.attendance?.jarak_meter_masuk !== null && row.attendance?.jarak_meter_masuk !== undefined
                                                        ? `${row.attendance.jarak_meter_masuk}m`
                                                        : "-"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getStatusBadge(row.statusDisplay)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {row.attendance?.foto_masuk && (
                                                            <button
                                                                onClick={() => setPreviewPhotoUrl(row.attendance.foto_masuk)}
                                                                className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
                                                                title="Foto Selfie Masuk"
                                                            >
                                                                <img src={row.attendance.foto_masuk} alt="Masuk" className="w-full h-full object-cover" />
                                                            </button>
                                                        )}
                                                        {row.attendance?.foto_pulang && (
                                                            <button
                                                                onClick={() => setPreviewPhotoUrl(row.attendance.foto_pulang)}
                                                                className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer"
                                                                title="Foto Selfie Pulang"
                                                            >
                                                                <img src={row.attendance.foto_pulang} alt="Pulang" className="w-full h-full object-cover" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setAdjustForm({
                                                                record_id: row.attendance?.id || null,
                                                                user_id: row.user.id,
                                                                userName: row.user.nama,
                                                                tanggal: filterDailyDate,
                                                                jam_masuk: row.attendance?.jam_masuk ? new Date(row.attendance.jam_masuk).toISOString().slice(11, 16) : "08:30",
                                                                jam_pulang: row.attendance?.jam_pulang ? new Date(row.attendance.jam_pulang).toISOString().slice(11, 16) : "17:00",
                                                                status: row.attendance?.status || "hadir",
                                                                alasan_adjustment: ""
                                                            });
                                                            setAdjustModalOpen(true);
                                                        }}
                                                        className="px-2.5 py-1 text-2xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        Koreksi
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION: Rekapitulasi Bulanan Karyawan untuk Payroll */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    <span>Rekapitulasi Bulanan Tim (Ekspor Payroll)</span>
                                </h3>
                                <p className="text-2xs text-slate-500">Akumulasi jam kerja, potongan keterlambatan, dan hari izin seluruh staf</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={recapMonth}
                                    onChange={(e) => setRecapMonth(Number(e.target.value))}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                                >
                                    {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={recapYear}
                                    onChange={(e) => setRecapYear(Number(e.target.value))}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                                >
                                    {[2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={loadMonthlyRecap}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Tampilkan
                                </button>

                                <button
                                    onClick={exportRecapExcel}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Ekspor Excel</span>
                                </button>
                            </div>
                        </div>

                        {/* Recap Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-3xs font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="py-2.5 px-3">Karyawan</th>
                                        <th className="py-2.5 px-3">Role</th>
                                        <th className="py-2.5 px-3 text-center">Hadir</th>
                                        <th className="py-2.5 px-3 text-center">Terlambat</th>
                                        <th className="py-2.5 px-3 text-center">Total Telat (Mnt)</th>
                                        <th className="py-2.5 px-3 text-center">Total Jam Kerja</th>
                                        <th className="py-2.5 px-3 text-center">Cuti / Sakit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {loadingRecap ? (
                                        <tr>
                                            <td colSpan="7" className="py-6 text-center text-slate-400 font-semibold">
                                                Memuat rekap bulanan...
                                            </td>
                                        </tr>
                                    ) : recapData.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-6 text-center text-slate-400 font-semibold">
                                                Klik "Tampilkan" untuk memuat rekap periode ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        recapData.map(r => (
                                            <tr key={r.user.id} className="hover:bg-slate-50/70">
                                                <td className="py-2.5 px-3 font-bold text-slate-800">{r.user.nama}</td>
                                                <td className="py-2.5 px-3 capitalize text-slate-600">{r.user.role}</td>
                                                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{r.hadir} Hari</td>
                                                <td className="py-2.5 px-3 text-center font-bold text-rose-600">{r.terlambat} Kali</td>
                                                <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{r.menitKeterlambatan} mnt</td>
                                                <td className="py-2.5 px-3 text-center font-bold text-blue-600">{r.jamKerja} Jam</td>
                                                <td className="py-2.5 px-3 text-center text-slate-600">{r.cuti + r.sakit + r.izin} Hari</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: KEBIJAKAN & PENGATURAN GEOFENCE (ADMIN) */}
            {activeTab === "policy" && isPimpinanOrAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* Left: Main Configuration Form (8 cols) */}
                    <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-blue-600" />
                                <span>Konfigurasi Geofencing & Jam Operasional Workshop</span>
                            </h2>
                            <p className="text-2xs text-slate-500">Atur parameter verifikasi lokasi dan jam kerja standar untuk seluruh staf</p>
                        </div>

                        <form onSubmit={handleSavePolicy} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kantor / Cabang Workshop</label>
                                <input
                                    type="text"
                                    value={policyForm.nama_kantor}
                                    onChange={(e) => setPolicyForm({ ...policyForm, nama_kantor: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Coordinates with Auto-Locate Button */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Latitude Workshop</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={policyForm.latitude}
                                        onChange={(e) => setPolicyForm({ ...policyForm, latitude: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Longitude Workshop</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={policyForm.longitude}
                                        onChange={(e) => setPolicyForm({ ...policyForm, longitude: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleUseCurrentLocationForPolicy}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2"
                            >
                                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                <span>Gunakan Titik Koordinat GPS Saya Saat Ini</span>
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Radius Geofence (Meter)</label>
                                    <input
                                        type="number"
                                        value={policyForm.radius_meter}
                                        onChange={(e) => setPolicyForm({ ...policyForm, radius_meter: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                        required
                                        min="20"
                                        max="5000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Masuk</label>
                                    <input
                                        type="time"
                                        value={policyForm.jam_masuk}
                                        onChange={(e) => setPolicyForm({ ...policyForm, jam_masuk: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Toleransi Terlambat (Mnt)</label>
                                    <input
                                        type="number"
                                        value={policyForm.toleransi_menit}
                                        onChange={(e) => setPolicyForm({ ...policyForm, toleransi_menit: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                        required
                                        min="0"
                                        max="120"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Pulang Standar</label>
                                <input
                                    type="time"
                                    value={policyForm.jam_pulang}
                                    onChange={(e) => setPolicyForm({ ...policyForm, jam_pulang: e.target.value })}
                                    className="w-full sm:w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Toggles */}
                            <div className="pt-2 space-y-2.5">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={policyForm.is_geofence_active}
                                        onChange={(e) => setPolicyForm({ ...policyForm, is_geofence_active: e.target.checked })}
                                        className="w-4 h-4 rounded text-blue-600"
                                    />
                                    <span>Wajibkan berada di dalam radius geofence untuk Check-In / Out</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={policyForm.is_selfie_required}
                                        onChange={(e) => setPolicyForm({ ...policyForm, is_selfie_required: e.target.checked })}
                                        className="w-4 h-4 rounded text-blue-600"
                                    />
                                    <span>Wajibkan foto selfie webcam langsung saat Check-In</span>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={savingPolicy}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                                >
                                    {savingPolicy ? "Menyimpan..." : "Simpan Perubahan Kebijakan"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right: Live Geofence Summary & Security Guide (4 cols) */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    <span>Titik Koordinat Workshop</span>
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-3xs font-bold ${
                                    policyForm.is_geofence_active 
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                        : "bg-slate-100 text-slate-600"
                                }`}>
                                    {policyForm.is_geofence_active ? "Geofence Aktif" : "Geofence Bebas"}
                                </span>
                            </div>

                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">Cabang:</span>
                                    <span className="font-bold text-slate-800">{policyForm.nama_kantor || "Workshop Utama"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">Latitude:</span>
                                    <span className="font-mono font-semibold text-slate-700">{policyForm.latitude || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">Longitude:</span>
                                    <span className="font-mono font-semibold text-slate-700">{policyForm.longitude || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">Batas Radius:</span>
                                    <span className="font-bold text-blue-600">{policyForm.radius_meter || 100} Meter</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-slate-200/60">
                                    <span className="text-slate-500 font-semibold">Jarak Anda Saat Ini:</span>
                                    <span className="font-bold text-slate-800">
                                        {locationData.distance !== null ? `${locationData.distance} Meter` : "-"}
                                    </span>
                                </div>
                            </div>

                            {policyForm.latitude && policyForm.longitude && (
                                <a
                                    href={`https://www.google.com/maps?q=${policyForm.latitude},${policyForm.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Buka Lokasi di Google Maps</span>
                                </a>
                            )}
                        </div>

                        {/* Security Feature Highlights Card */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Lapisan Keamanan Anti-Fraud</span>
                            </h4>
                            <ul className="text-2xs text-slate-600 space-y-2 leading-relaxed">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span><strong>Geofence Radius:</strong> Sistem menolak absensi otomatis bila koordinat GPS perangkat berada di luar radius meter yang ditetapkan.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span><strong>Live Webcam Watermark:</strong> Foto selfie dibubuhi stempel waktu jam detik, koordinat GPS aktual, dan identitas staf secara otomatis di canvas.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span><strong>Audit Logging:</strong> Setiap check-in, check-out, revisi, dan perubahan kebijakan tercatat di pusat Log Audit Anti-Fraud.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: REVIEW TUGAS LUAR (ADMIN & OWNER / PIMPINAN) */}
            {activeTab === "reviews" && isPimpinanOrAdmin && (
                <div className="space-y-4">
                    {/* Header Card & Filter Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-slate-800">
                                        Review Presensi Tugas Luar & Lapangan
                                    </h2>
                                    <p className="text-2xs sm:text-xs text-slate-500 font-medium">
                                        Persetujuan dan audit presensi karyawan yang berada di luar radius kantor Pekayon (antar unit, jemput sparepart, servis luar).
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={loadPendingReviews}
                                disabled={loadingReviews}
                                className="self-start sm:self-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingReviews ? "animate-spin text-blue-600" : ""}`} />
                                <span>Segarkan Data</span>
                            </button>
                        </div>

                        {/* Filter Status Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
                            {[
                                { key: "menunggu_review", label: "Menunggu Review", count: pendingReviewCount },
                                { key: "valid", label: "Disetujui (Valid)" },
                                { key: "ditolak", label: "Ditolak" },
                                { key: "all", label: "Semua Riwayat" }
                            ].map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => setReviewFilter(f.key)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                        reviewFilter === f.key
                                            ? "bg-slate-900 text-white shadow-xs"
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                                    }`}
                                >
                                    <span>{f.label}</span>
                                    {f.count !== undefined && f.count > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-amber-500 text-white leading-none">
                                            {f.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Cards List */}
                    {loadingReviews ? (
                        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
                            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs font-semibold text-slate-500">Memuat data review presensi tugas luar...</p>
                        </div>
                    ) : pendingReviews.length === 0 ? (
                        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">
                                {reviewFilter === "menunggu_review"
                                    ? "Semua Presensi Tugas Luar Bersih!"
                                    : "Tidak Ada Data Ditemukan"}
                            </h3>
                            <p className="text-2xs text-slate-500 max-w-sm mx-auto">
                                {reviewFilter === "menunggu_review"
                                    ? "Tidak ada presensi karyawan di luar radius workshop yang menunggu verifikasi saat ini."
                                    : "Tidak ada catatan presensi tugas luar pada filter status ini."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {pendingReviews.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-4"
                                >
                                    {/* Card Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-sm shrink-0 overflow-hidden">
                                                {item.user?.foto_profile ? (
                                                    <img
                                                        src={item.user.foto_profile}
                                                        alt={item.user.nama}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    item.user?.nama?.charAt(0).toUpperCase() || "U"
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {item.user?.nama || "Karyawan"}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                                        {item.user?.role || "Staff"}
                                                    </span>
                                                </div>
                                                <p className="text-2xs text-slate-500 mt-0.5">
                                                    {item.user?.email || "-"} •{" "}
                                                    {new Date(item.tanggal).toLocaleDateString("id-ID", {
                                                        weekday: "short",
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}{" "}
                                                    (Check-In:{" "}
                                                    {item.jam_masuk
                                                        ? new Date(item.jam_masuk).toLocaleTimeString("id-ID", {
                                                              hour: "2-digit",
                                                              minute: "2-digit"
                                                          }) + " WIB"
                                                        : "-"}
                                                    )
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            {item.status_review === "valid" ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Disetujui (Valid)</span>
                                                </span>
                                            ) : item.status_review === "ditolak" ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Ditolak</span>
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 animate-pulse">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Menunggu Review Owner</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Content Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        {/* Left 2 cols: Reason, GPS, Review note */}
                                        <div className="md:col-span-2 space-y-3">
                                            {/* Reason Box */}
                                            <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-1">
                                                <span className="text-3xs font-extrabold text-amber-900 uppercase tracking-wider">
                                                    Alasan / Penugasan Luar Karyawan:
                                                </span>
                                                <p className="text-xs font-medium text-slate-800 leading-relaxed italic">
                                                    "{item.alasan_tugas_luar || "Tidak ada keterangan tertulis"}"
                                                </p>
                                            </div>

                                            {/* Location & GPS Info */}
                                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>Jarak dari Workshop Pekayon:</span>
                                                    </span>
                                                    <span className="font-bold text-slate-800">
                                                        {item.jarak_meter_masuk !== null
                                                            ? `${item.jarak_meter_masuk} meter`
                                                            : "Tidak terdeteksi"}
                                                    </span>
                                                </div>

                                                {item.latitude_masuk !== null && item.longitude_masuk !== null && (
                                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                                        <span className="text-slate-500 font-semibold">Koordinat GPS:</span>
                                                        <a
                                                            href={`https://www.google.com/maps?q=${item.latitude_masuk},${item.longitude_masuk}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                                                        >
                                                            <span>{item.latitude_masuk.toFixed(6)}, {item.longitude_masuk.toFixed(6)}</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Reviewer Note (if reviewed) */}
                                            {item.reviewed_by && (
                                                <div className="p-2.5 bg-slate-100 rounded-xl text-2xs text-slate-600 space-y-0.5">
                                                    <p>
                                                        <strong>Ditinjau oleh:</strong> {item.reviewed_by.nama}{" "}
                                                        {item.reviewed_at
                                                            ? `• ${new Date(item.reviewed_at).toLocaleDateString("id-ID", {
                                                                  day: "numeric",
                                                                  month: "short",
                                                                  year: "numeric"
                                                              })} ${new Date(item.reviewed_at).toLocaleTimeString("id-ID", {
                                                                  hour: "2-digit",
                                                                  minute: "2-digit"
                                                              })} WIB`
                                                            : ""}
                                                    </p>
                                                    {item.catatan_review && (
                                                        <p><strong>Catatan Review:</strong> {item.catatan_review}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right col: Selfie Photo Proof */}
                                        <div className="space-y-1.5">
                                            <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider">
                                                Foto Selfie Fisik:
                                            </span>
                                            {item.foto_masuk ? (
                                                <div
                                                    onClick={() => setPreviewPhotoUrl(item.foto_masuk)}
                                                    className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group cursor-pointer shadow-2xs hover:ring-2 hover:ring-blue-500/30 transition-all"
                                                >
                                                    <img
                                                        src={item.foto_masuk}
                                                        alt="Selfie Bukti Tugas Luar"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs">
                                                        <Eye className="w-4 h-4" />
                                                        <span>Lihat Detail</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-slate-100 rounded-xl text-center text-xs text-slate-400">
                                                    Tidak ada lampiran foto
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons (Only when Menunggu Review) */}
                                    {item.status_review === "menunggu_review" && (
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => handleReviewAttendance(item.id, "ditolak")}
                                                className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                <span>Tolak Presensi</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReviewAttendance(item.id, "valid")}
                                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ring-2 ring-emerald-500/20"
                                            >
                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                <span>Setujui (Valid)</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: LIVE WEBCAM SELFIE */}
            <WebcamSelfieModal
                isOpen={cameraModalOpen}
                onClose={() => setCameraModalOpen(false)}
                onCapture={cameraModalType === "check-out" ? handleCheckOutCapture : handleCheckInCapture}
                type={cameraModalType}
                isTugasLuar={cameraModalType === "tugas-luar"}
                user={user}
                locationData={locationData}
                policy={policy}
            />

            {/* MODAL 2: AJUKAN IZIN / CUTI */}
            {leaveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-100 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-bold text-slate-800 text-sm">Permohonan Izin / Cuti</h3>
                            <button onClick={() => setLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleLeaveSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Izin</label>
                                <select
                                    value={leaveForm.tipe}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, tipe: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                >
                                    <option value="izin">Izin Tidak Masuk</option>
                                    <option value="sakit">Sakit</option>
                                    <option value="cuti">Cuti Tahunan</option>
                                    <option value="dinas_luar">Tugas Luar / Servis Lapangan</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        value={leaveForm.tgl_mulai}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, tgl_mulai: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                                    <input
                                        type="date"
                                        value={leaveForm.tgl_selesai}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, tgl_selesai: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Permohonan</label>
                                <textarea
                                    value={leaveForm.alasan}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, alasan: e.target.value })}
                                    rows="3"
                                    placeholder="Jelaskan keperluan atau keterangan sakit..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Lampiran Foto Bukti (Opsional)</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setLeaveFile(e.target.files[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                                />
                                <p className="text-3xs text-slate-400 mt-0.5">Surat dokter, bukti undangan, atau memo izin resmi.</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLeaveModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Kirim Pengajuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: KOREKSI PRESENSI MANUAL (ADMIN ONLY) */}
            {adjustModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-100 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Koreksi Presensi Manual</h3>
                                <p className="text-2xs text-slate-500">Karyawan: <strong>{adjustForm.userName}</strong> ({adjustForm.tanggal})</p>
                            </div>
                            <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Masuk</label>
                                    <input
                                        type="time"
                                        value={adjustForm.jam_masuk}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, jam_masuk: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Pulang</label>
                                    <input
                                        type="time"
                                        value={adjustForm.jam_pulang}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, jam_pulang: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status Kehadiran</label>
                                <select
                                    value={adjustForm.status}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                >
                                    <option value="hadir">Hadir (Tepat Waktu)</option>
                                    <option value="terlambat">Terlambat</option>
                                    <option value="pulang_cepat">Pulang Cepat</option>
                                    <option value="izin">Izin</option>
                                    <option value="sakit">Sakit</option>
                                    <option value="alfa">Alfa (Tanpa Keterangan)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Alasan Koreksi <span className="text-rose-500">* (Audit Log Anti-Fraud)</span>
                                </label>
                                <textarea
                                    value={adjustForm.alasan_adjustment}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, alasan_adjustment: e.target.value })}
                                    rows="2"
                                    placeholder="Contoh: Lupa check-out saat lembur mendadak servis client..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                                    required
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAdjustModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Simpan Koreksi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: PREVIEW FOTO SELFIE WATERMARKED */}
            {previewPhotoUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
                    <div className="bg-slate-900 rounded-2xl overflow-hidden max-w-md w-full border border-slate-700 shadow-2xl flex flex-col">
                        <div className="p-3 bg-slate-800/80 flex items-center justify-between text-white border-b border-slate-700">
                            <span className="text-xs font-bold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>Verifikasi Foto Selfie Terstempel GPS</span>
                            </span>
                            <button onClick={() => setPreviewPhotoUrl(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-2 flex items-center justify-center bg-black">
                            <img src={previewPhotoUrl} alt="Bukti Selfie" className="max-h-[75vh] w-auto object-contain rounded-lg" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

