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
    ExternalLink,
    Zap,
    AlertTriangle,
    ShieldAlert,
    Edit3,
    Loader2
} from "lucide-react";
import WebcamSelfieModal from "./WebcamSelfieModal";
import { LocationService, isNativePlatform } from "../../services/nativeServices";

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
const WORKSHOP_REAL_LAT = -6.26064;
const WORKSHOP_REAL_LON = 106.98744;

// Cache in-memory hasil reverse geocode agar instan (<1ms) saat koordinat berdekatan
const geoAddressCache = new Map();

// Reverse geocode koordinat GPS menjadi nama jalan dan wilayah detail (seperti watermark kamera HP)
async function fetchRealLocationAddress(lat, lon, isInRadius) {
    if (isInRadius) {
        return WORKSHOP_DEFAULT_ADDRESS;
    }
    if (!lat || !lon) {
        return "Lokasi tidak diketahui";
    }

    // Jika dalam radius 2.5km dari workshop Pekayon (misal Jl. H. Makri, Pekayon Jaya, Naga Swalayan),
    // selalu deteksi sebagai Pekayon Jaya, Kota Bekasi (bukan Jakasetia).
    const distToWorkshop = calculateDistanceMeters(lat, lon, WORKSHOP_REAL_LAT, WORKSHOP_REAL_LON);
    if (distToWorkshop <= 600) {
        return WORKSHOP_DEFAULT_ADDRESS;
    }

    // Cache key dibulatkan ke ~100m untuk instant lookups
    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (geoAddressCache.has(cacheKey)) {
        return geoAddressCache.get(cacheKey);
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
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
            let road = addr.road || addr.street || addr.pedestrian || addr.path || "";
            const houseNumber = addr.house_number ? `No.${addr.house_number}` : "";
            const streetLine = [road, houseNumber].filter(Boolean).join(" ");
            let village = addr.village || addr.suburb || addr.neighbourhood || addr.quarter || "";
            let district = addr.city_district || addr.district || addr.subdistrict || "";
            const city = addr.city || addr.town || addr.municipality || addr.county || "";
            const state = addr.state || "";
            const postcode = addr.postcode || "";

            // Koreksi nama wilayah jika berada di sekitar Pekayon namun OSM salah menandai sebagai Jakasetia
            if (distToWorkshop <= 3000) {
                if (village.toLowerCase().includes("jakasetia")) {
                    village = "Pekayon Jaya";
                }
                if (!district || district.toLowerCase().includes("jakasetia")) {
                    district = "Bekasi Selatan";
                }
            }

            const parts = [
                streetLine,
                village,
                district ? `Kec. ${district}` : "",
                city,
                state,
                postcode
            ].filter(Boolean);

            let result = parts.length > 0 ? parts.join(", ") : (data.display_name || `Pekayon Jaya, Kota Bekasi (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
            if (distToWorkshop <= 3000 && result.toLowerCase().includes("jakasetia")) {
                result = result.replace(/Jakasetia/gi, "Pekayon Jaya");
            }
            geoAddressCache.set(cacheKey, result);
            return result;
        }
    } catch {
        // Fallback jika koneksi lambat atau offline
    }

    const fallbackAddr = distToWorkshop <= 3000 
        ? `Jl. Raya Pekayon, Pekayon Jaya, Kec. Bekasi Selatan, Kota Bekasi (${lat.toFixed(5)}, ${lon.toFixed(5)})`
        : `Area Sekitar (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
    geoAddressCache.set(cacheKey, fallbackAddr);
    return fallbackAddr;
}

export default function AttendancePage() {
    const { user, isAdmin, isPimpinan, isPimpinanOrAdmin } = useAuth();

    // Active View Tab: 'today' | 'history' | 'leaves' | 'monitoring' | 'policy'
    const [activeTab, setActiveTab] = useState(user?.role === "pimpinan" ? "monitoring" : "today");

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
    const [cameraModalType, setCameraModalType] = useState("check-in"); // "check-in" | "check-out" | "tugas-luar"

    // Early Check-Out Modal State (Wajib Review Owner)
    const [earlyCheckOutModalOpen, setEarlyCheckOutModalOpen] = useState(false);
    const [earlyCheckOutReason, setEarlyCheckOutReason] = useState("");

    // Custom Action Review Prompt Modal State (Replaces native browser prompt)
    const [actionPromptModal, setActionPromptModal] = useState({
        isOpen: false,
        title: "",
        subtitle: "",
        inputLabel: "",
        inputValue: "",
        placeholder: "",
        confirmText: "Konfirmasi",
        cancelText: "Batal",
        variant: "primary",
        isSubmitting: false,
        onConfirm: null
    });

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
    const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        record_id: null,
        user_id: null,
        userName: "",
        userRole: "",
        tanggal: "",
        jam_masuk: "",
        jam_pulang: "",
        status: "hadir",
        alasan_adjustment: ""
    });

    // Quick Action Double Confirmation Modal State
    const [quickActionModal, setQuickActionModal] = useState({
        isOpen: false,
        step: 1, // 1: initial review & reason, 2: final anti-fraud confirmation
        user: null,
        attendanceId: null,
        tanggal: "",
        targetStatus: "hadir", // "hadir" | "izin" | "sakit" | "alfa"
        jam_masuk: "09:00",
        jam_pulang: "18:00",
        reason: "",
        isSubmitting: false
    });

    // Bulk Attendance Selection & Quick Action State
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [bulkAdjustModal, setBulkAdjustModal] = useState({
        isOpen: false,
        step: 1, // 1: edit & review, 2: double confirmation anti-fraud
        tanggal: "",
        status: "hadir", // "hadir" | "izin" | "sakit" | "alfa"
        jam_masuk: "09:00",
        jam_pulang: "18:00",
        reason: "",
        selectedUsers: [],
        isSubmitting: false
    });

    // Policy Settings Form State
    const [policyForm, setPolicyForm] = useState({
        nama_kantor: "Workshop Utama Pekayon",
        latitude: -6.26064,
        longitude: 106.98744,
        radius_meter: 500,
        jam_masuk: "09:00",
        toleransi_menit: 15,
        jam_pulang: "18:00",
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

    // 2. Browser Geolocation Tracker (With Mobile Indoor Retry & High-Accuracy Fallback)
    const fetchLocation = useCallback(() => {
        setLocationData(prev => ({ ...prev, loading: true, error: null }));

        const handleSuccess = async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const acc = position.coords.accuracy;

            // Koordinat resmi workshop Pekayon: Jl. Raya Pekayon No. 25 (-6.26064, 106.98744)
            const workshopLat = (policy?.latitude && policy.latitude > -6.265 && policy.latitude < -6.255) ? policy.latitude : WORKSHOP_REAL_LAT;
            const workshopLon = (policy?.longitude && policy.longitude > 106.980 && policy.longitude < 106.995) ? policy.longitude : WORKSHOP_REAL_LON;
            const radius = policy?.radius_meter || 500;

            const dist = calculateDistanceMeters(lat, lon, workshopLat, workshopLon);
            // Toleransi akurasi GPS: jika akurasi GPS agak renggang (misal indoor ±20m), sertakan margin akurasi hingga 50m
            const accuracyMargin = Math.min(Math.round(acc || 0), 50);
            const inRadius = dist <= (radius + accuracyMargin);

            const preliminaryAddress = inRadius ? WORKSHOP_DEFAULT_ADDRESS : "Mencari detail alamat real-time...";

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

            // Lakukan reverse geocoding asynchronous agar nama jalan & kecamatan detail
            const realAddress = await fetchRealLocationAddress(lat, lon, inRadius);
            setLocationData(prev => ({
                ...prev,
                addressName: realAddress
            }));
        };

        const handleFinalError = (error) => {
            let msg = "Gagal mendapatkan lokasi GPS.";
            if (error?.code === 1 || error?.code === error?.PERMISSION_DENIED) {
                msg = "Izin akses lokasi ditolak oleh browser/sistem. Harap izinkan akses lokasi di pengaturan ponsel.";
            } else if (error?.code === 2 || error?.code === error?.POSITION_UNAVAILABLE) {
                msg = "Sinyal GPS tidak terdeteksi. Pastikan Lokasi/GPS aktif di pengaturan ponsel Anda.";
            } else if (error?.code === 3 || error?.code === error?.TIMEOUT) {
                msg = "Waktu pencarian satelit GPS habis (Timeout). Pastikan GPS ponsel aktif dan coba lagi.";
            } else if (error?.message) {
                msg = error.message;
            }
            setLocationData(prev => ({
                ...prev,
                loading: false,
                addressName: WORKSHOP_DEFAULT_ADDRESS,
                error: msg
            }));
        };

        if (isNativePlatform()) {
            LocationService.getCurrentPosition()
                .then(pos => {
                    handleSuccess({ coords: pos });
                })
                .catch(err => {
                    handleFinalError({ code: 2, message: err.message });
                });
            return;
        }

        if (typeof window !== "undefined" && window.isSecureContext === false && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
            setLocationData(prev => ({
                ...prev,
                loading: false,
                addressName: WORKSHOP_DEFAULT_ADDRESS,
                error: "Browser mobile mewajibkan koneksi aman (HTTPS) untuk mengizinkan GPS. Silakan buka aplikasi melalui protokol HTTPS atau atur flag insecure origin di browser."
            }));
            return;
        }

        if (!navigator.geolocation) {
            setLocationData(prev => ({
                ...prev,
                loading: false,
                addressName: WORKSHOP_DEFAULT_ADDRESS,
                error: "Browser Anda tidak mendukung layanan Geolocation GPS."
            }));
            return;
        }

        // Attempt 1: High Accuracy with 60-second cached location tolerance
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (error) => {
                // If timed out or satellite unavailable (e.g. inside building/workshop roof),
                // fall back to network/cell tower triangulation (instant & indoor-friendly)
                if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
                    console.warn("High-accuracy GPS timed out/unavailable. Falling back to standard network triangulation...");
                    navigator.geolocation.getCurrentPosition(
                        handleSuccess,
                        handleFinalError,
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
                    );
                } else {
                    handleFinalError(error);
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    }, [policy]);

    // 3. Load Today Status & Policy
    const loadTodayStatus = useCallback(async () => {
        setLoadingToday(true);
        try {
            const res = await api.get("/attendance/today");
            const rawPolicy = res.data.policy;
            const normalizedPolicy = rawPolicy ? {
                ...rawPolicy,
                nama_kantor: rawPolicy.nama_kantor || "Workshop Utama Pekayon",
                latitude: (rawPolicy.latitude && rawPolicy.latitude > -6.265 && rawPolicy.latitude < -6.255) ? rawPolicy.latitude : WORKSHOP_REAL_LAT,
                longitude: (rawPolicy.longitude && rawPolicy.longitude > 106.980 && rawPolicy.longitude < 106.995) ? rawPolicy.longitude : WORKSHOP_REAL_LON,
                radius_meter: rawPolicy.radius_meter || 500,
                is_geofence_active: rawPolicy.is_geofence_active !== undefined ? rawPolicy.is_geofence_active : true
            } : null;

            setPolicy(normalizedPolicy);
            setTodayRecord(res.data.record);
            setActiveLeave(res.data.activeLeave);

            if (normalizedPolicy) {
                setPolicyForm({
                    nama_kantor: normalizedPolicy.nama_kantor,
                    latitude: normalizedPolicy.latitude,
                    longitude: normalizedPolicy.longitude,
                    radius_meter: normalizedPolicy.radius_meter,
                    jam_masuk: normalizedPolicy.jam_masuk,
                    toleransi_menit: normalizedPolicy.toleransi_menit,
                    jam_pulang: normalizedPolicy.jam_pulang,
                    is_geofence_active: normalizedPolicy.is_geofence_active,
                    is_selfie_required: normalizedPolicy.is_selfie_required
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
    const handleReviewAttendance = (id, statusReview) => {
        if (statusReview === "ditolak") {
            setActionPromptModal({
                isOpen: true,
                title: "Tolak Presensi Tugas Luar",
                subtitle: "Berikan alasan penolakan presensi tugas luar ini agar tercatat transparan di audit log sistem.",
                inputLabel: "Alasan Penolakan",
                placeholder: "Contoh: Di luar jadwal / penugasan resmi workshop...",
                inputValue: "Di luar jadwal/penugasan resmi",
                confirmText: "Tolak Presensi",
                cancelText: "Batal",
                variant: "danger",
                isSubmitting: false,
                onConfirm: async (note) => {
                    setActionPromptModal(prev => ({ ...prev, isSubmitting: true }));
                    try {
                        const res = await api.put(`/attendance/${id}/review`, {
                            status_review: "ditolak",
                            catatan_review: note
                        });
                        toast.success(res.data.message || "Presensi berhasil ditolak");
                        setActionPromptModal(prev => ({ ...prev, isOpen: false, isSubmitting: false }));
                        loadPendingReviews();
                        loadTodayStatus();
                    } catch (err) {
                        toast.error(err.response?.data?.message || "Gagal memproses review presensi");
                        setActionPromptModal(prev => ({ ...prev, isSubmitting: false }));
                    }
                }
            });
        } else {
            setActionPromptModal({
                isOpen: true,
                title: "Setujui Presensi Tugas Luar",
                subtitle: "Apakah Anda yakin ingin menyetujui presensi tugas luar ini sebagai presensi valid?",
                inputLabel: "Catatan Verifikator (Opsional)",
                placeholder: "Contoh: Sesuai surat penugasan resmi...",
                inputValue: "Tugas luar terverifikasi valid",
                confirmText: "Setujui (Valid)",
                cancelText: "Batal",
                variant: "emerald",
                isSubmitting: false,
                onConfirm: async (note) => {
                    setActionPromptModal(prev => ({ ...prev, isSubmitting: true }));
                    try {
                        const res = await api.put(`/attendance/${id}/review`, {
                            status_review: "valid",
                            catatan_review: note
                        });
                        toast.success(res.data.message || "Presensi berhasil disetujui");
                        setActionPromptModal(prev => ({ ...prev, isOpen: false, isSubmitting: false }));
                        loadPendingReviews();
                        loadTodayStatus();
                    } catch (err) {
                        toast.error(err.response?.data?.message || "Gagal memproses review presensi");
                        setActionPromptModal(prev => ({ ...prev, isSubmitting: false }));
                    }
                }
            });
        }
    };

    // Check-In Submit via Webcam
    const handleCheckInCapture = async (fileBlob, extraData = {}) => {
        // Resolve most accurate real-time GPS coordinate available
        let activeLat = locationData.latitude;
        let activeLon = locationData.longitude;
        let activeAcc = locationData.accuracy;

        if (activeLat === null || activeLon === null) {
            try {
                const freshPos = await LocationService.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
                if (freshPos) {
                    activeLat = freshPos.latitude;
                    activeLon = freshPos.longitude;
                    activeAcc = freshPos.accuracy;
                }
            } catch (_) {}
        }

        const formData = new FormData();
        formData.append("foto", fileBlob);
        if (activeLat !== null && activeLat !== undefined) formData.append("latitude", activeLat);
        if (activeLon !== null && activeLon !== undefined) formData.append("longitude", activeLon);
        if (activeAcc !== null && activeAcc !== undefined) formData.append("accuracy", Math.round(activeAcc));
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

    // Deteksi apakah saat ini lebih awal dari jam pulang workshop
    const checkIsEarly = useCallback(() => {
        if (!policy?.jam_pulang) return false;
        const [targetHour, targetMinute] = policy.jam_pulang.split(":").map(Number);
        const targetMinutes = targetHour * 60 + targetMinute;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        return currentMinutes < targetMinutes;
    }, [policy]);

    const handleTriggerCheckOut = () => {
        if (checkIsEarly()) {
            setEarlyCheckOutReason("");
            setEarlyCheckOutModalOpen(true);
        } else {
            setEarlyCheckOutReason("");
            setCameraModalType("check-out");
            setCameraModalOpen(true);
        }
    };

    // Check-Out Submit via Webcam
    const handleCheckOutCapture = async (fileBlob) => {
        // Resolve most accurate real-time GPS coordinate available
        let activeLat = locationData.latitude;
        let activeLon = locationData.longitude;
        let activeAcc = locationData.accuracy;

        if (activeLat === null || activeLon === null) {
            try {
                const freshPos = await LocationService.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
                if (freshPos) {
                    activeLat = freshPos.latitude;
                    activeLon = freshPos.longitude;
                    activeAcc = freshPos.accuracy;
                }
            } catch (_) {}
        }

        const formData = new FormData();
        formData.append("foto", fileBlob);
        if (activeLat !== null && activeLat !== undefined) formData.append("latitude", activeLat);
        if (activeLon !== null && activeLon !== undefined) formData.append("longitude", activeLon);
        if (activeAcc !== null && activeAcc !== undefined) formData.append("accuracy", Math.round(activeAcc));
        formData.append("device_info", navigator.userAgent);
        if (earlyCheckOutReason.trim()) {
            formData.append("alasan_pulang_cepat", earlyCheckOutReason.trim());
        }
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
            setEarlyCheckOutReason("");
            if (isPimpinanOrAdmin) {
                loadPendingReviews();
            }
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
    const handleReviewLeave = (id, status) => {
        const isApprove = status === "disetujui";
        setActionPromptModal({
            isOpen: true,
            title: isApprove ? "Setujui Permohonan Izin" : "Tolak Permohonan Izin",
            subtitle: isApprove 
                ? "Konfirmasi persetujuan permohonan izin karyawan ini." 
                : "Berikan alasan penolakan permohonan izin karyawan ini.",
            inputLabel: isApprove ? "Catatan Persetujuan (Opsional)" : "Alasan Penolakan",
            placeholder: isApprove ? "Disetujui oleh admin" : "Tidak memenuhi syarat",
            inputValue: isApprove ? "Disetujui oleh admin" : "Tidak memenuhi syarat",
            confirmText: isApprove ? "Setujui Izin" : "Tolak Izin",
            cancelText: "Batal",
            variant: isApprove ? "emerald" : "danger",
            isSubmitting: false,
            onConfirm: async (note) => {
                setActionPromptModal(prev => ({ ...prev, isSubmitting: true }));
                try {
                    const res = await api.put(`/attendance/leaves/${id}/review`, {
                        status,
                        catatan_approver: note
                    });
                    toast.success(res.data.message || "Permohonan izin berhasil diproses");
                    setActionPromptModal(prev => ({ ...prev, isOpen: false, isSubmitting: false }));
                    loadLeaves();
                } catch (err) {
                    toast.error(err.response?.data?.message || "Gagal memproses persetujuan");
                    setActionPromptModal(prev => ({ ...prev, isSubmitting: false }));
                }
            }
        });
    };

    // Helper: Terapkan Template Preset Koreksi Cepat
    const applyAdjustPreset = (presetKey) => {
        switch (presetKey) {
            case "hadir_normal":
                setAdjustForm(prev => ({
                    ...prev,
                    status: "hadir",
                    jam_masuk: "09:00",
                    jam_pulang: "18:00",
                    alasan_adjustment: "Koreksi kehadiran penuh tepat waktu (09:00 - 18:00) oleh admin"
                }));
                break;
            case "terlambat":
                setAdjustForm(prev => ({
                    ...prev,
                    status: "terlambat",
                    jam_masuk: "09:30",
                    jam_pulang: "18:00",
                    alasan_adjustment: "Koreksi presensi keterlambatan oleh admin"
                }));
                break;
            case "pulang_cepat":
                setAdjustForm(prev => ({
                    ...prev,
                    status: "pulang_cepat",
                    jam_masuk: "09:00",
                    jam_pulang: "14:00",
                    alasan_adjustment: "Koreksi izin pulang lebih awal oleh admin"
                }));
                break;
            case "izin":
                setAdjustForm(prev => ({
                    ...prev,
                    status: "izin",
                    jam_masuk: "",
                    jam_pulang: "",
                    alasan_adjustment: "Koreksi izin resmi disetujui admin"
                }));
                break;
            case "sakit":
                setAdjustForm(prev => ({
                    ...prev,
                    status: "sakit",
                    jam_masuk: "",
                    jam_pulang: "",
                    alasan_adjustment: "Koreksi izin sakit karyawan oleh admin"
                }));
                break;
            case "alfa":
                setAdjustForm(prev => ({
                    ...prev,
                    status: "alfa",
                    jam_masuk: "",
                    jam_pulang: "",
                    alasan_adjustment: "Koreksi absensi alfa / tidak hadir tanpa keterangan"
                }));
                break;
            default:
                break;
        }
    };

    // Submit Manual Adjustment (Admin)
    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        if (!adjustForm.alasan_adjustment.trim()) {
            toast.error("Alasan koreksi absensi wajib diisi sebagai rekam jejak audit!");
            return;
        }
        setIsSubmittingAdjust(true);
        try {
            const payload = {
                ...adjustForm,
                jam_masuk: adjustForm.jam_masuk ? `${adjustForm.tanggal}T${adjustForm.jam_masuk}:00` : null,
                jam_pulang: adjustForm.jam_pulang ? `${adjustForm.tanggal}T${adjustForm.jam_pulang}:00` : null
            };
            const res = await api.post("/attendance/adjust", payload);
            toast.success(res.data.message || "Presensi berhasil dikoreksi");
            setAdjustModalOpen(false);
            loadDailyAll();
            if (activeTab === "recap") loadMonthlyRecap();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengoreksi presensi");
        } finally {
            setIsSubmittingAdjust(false);
        }
    };

    // Quick Action Trigger (Membuka Dialog Double Konfirmasi)
    const startQuickAction = (row, targetStatus) => {
        let defaultMasuk = "09:00";
        let defaultPulang = "18:00";
        let defaultReason = "";

        if (targetStatus === "hadir") {
            defaultReason = `Quick Action: Koreksi kehadiran tepat waktu (${row.user.nama})`;
        } else if (targetStatus === "izin") {
            defaultMasuk = "";
            defaultPulang = "";
            defaultReason = `Quick Action: Koreksi status izin karyawan (${row.user.nama})`;
        } else if (targetStatus === "sakit") {
            defaultMasuk = "";
            defaultPulang = "";
            defaultReason = `Quick Action: Koreksi status sakit karyawan (${row.user.nama})`;
        } else if (targetStatus === "alfa") {
            defaultMasuk = "";
            defaultPulang = "";
            defaultReason = `Quick Action: Koreksi status alfa (${row.user.nama})`;
        }

        setQuickActionModal({
            isOpen: true,
            step: 1, // Step 1: verify status & reason
            user: row.user,
            attendanceId: row.attendance?.id || null,
            tanggal: filterDailyDate,
            targetStatus,
            jam_masuk: defaultMasuk,
            jam_pulang: defaultPulang,
            reason: defaultReason,
            isSubmitting: false
        });
    };

    // Quick Action Execution (Setelah lolos Step 2 Double Konfirmasi)
    const handleExecuteQuickAction = async () => {
        if (!quickActionModal.reason.trim()) {
            toast.error("Alasan koreksi wajib diisi!");
            return;
        }

        setQuickActionModal(prev => ({ ...prev, isSubmitting: true }));
        try {
            const payload = {
                record_id: quickActionModal.attendanceId,
                user_id: quickActionModal.user.id,
                tanggal: quickActionModal.tanggal,
                jam_masuk: quickActionModal.jam_masuk ? `${quickActionModal.tanggal}T${quickActionModal.jam_masuk}:00` : null,
                jam_pulang: quickActionModal.jam_pulang ? `${quickActionModal.tanggal}T${quickActionModal.jam_pulang}:00` : null,
                status: quickActionModal.targetStatus,
                alasan_adjustment: quickActionModal.reason
            };
            const res = await api.post("/attendance/adjust", payload);
            toast.success(res.data.message || `Quick action berhasil: ${quickActionModal.user.nama} diubah ke ${quickActionModal.targetStatus.toUpperCase()}`);
            setQuickActionModal(prev => ({ ...prev, isOpen: false, isSubmitting: false }));
            loadDailyAll();
            if (activeTab === "recap") loadMonthlyRecap();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memproses quick action");
            setQuickActionModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    // Bulk Select Handlers & Quick Action Execution
    const handleToggleSelectUser = (userId) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleToggleSelectAll = () => {
        const allUserIds = dailyData.list?.map(row => row.user.id) || [];
        if (selectedUserIds.length === allUserIds.length && allUserIds.length > 0) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(allUserIds);
        }
    };

    const handleClearSelection = () => {
        setSelectedUserIds([]);
    };

    const startBulkAction = (targetStatus = "hadir") => {
        if (!dailyData.list || dailyData.list.length === 0) return;
        const selectedUsers = dailyData.list
            .filter(row => selectedUserIds.includes(row.user.id))
            .map(row => ({
                id: row.user.id,
                nama: row.user.nama,
                role: row.user.role,
                email: row.user.email,
                currentStatus: row.statusDisplay
            }));

        if (selectedUsers.length === 0) {
            toast.error("Pilih minimal satu karyawan untuk koreksi massal");
            return;
        }

        let defaultMasuk = "09:00";
        let defaultPulang = "18:00";
        if (targetStatus === "izin" || targetStatus === "sakit" || targetStatus === "alfa") {
            defaultMasuk = "";
            defaultPulang = "";
        }

        setBulkAdjustModal({
            isOpen: true,
            step: 1,
            tanggal: filterDailyDate,
            status: targetStatus,
            jam_masuk: defaultMasuk,
            jam_pulang: defaultPulang,
            reason: `Koreksi massal status ${targetStatus.toUpperCase()} (${selectedUsers.length} karyawan)`,
            selectedUsers,
            isSubmitting: false
        });
    };

    const handleRemoveUserFromBulk = (userId) => {
        setBulkAdjustModal(prev => {
            const nextUsers = prev.selectedUsers.filter(u => u.id !== userId);
            if (nextUsers.length === 0) {
                return { ...prev, isOpen: false, selectedUsers: [] };
            }
            return {
                ...prev,
                selectedUsers: nextUsers,
                reason: `Koreksi massal status ${prev.status.toUpperCase()} (${nextUsers.length} karyawan)`
            };
        });
        setSelectedUserIds(prev => prev.filter(id => id !== userId));
    };

    const handleExecuteBulkAdjust = async () => {
        if (!bulkAdjustModal.reason.trim()) {
            toast.error("Alasan koreksi presensi massal wajib diisi!");
            return;
        }
        if (bulkAdjustModal.selectedUsers.length === 0) {
            toast.error("Daftar karyawan terpilih kosong!");
            return;
        }

        setBulkAdjustModal(prev => ({ ...prev, isSubmitting: true }));
        try {
            const user_ids = bulkAdjustModal.selectedUsers.map(u => u.id);
            const payload = {
                user_ids,
                tanggal: bulkAdjustModal.tanggal,
                jam_masuk: bulkAdjustModal.jam_masuk ? `${bulkAdjustModal.tanggal}T${bulkAdjustModal.jam_masuk}:00` : null,
                jam_pulang: bulkAdjustModal.jam_pulang ? `${bulkAdjustModal.tanggal}T${bulkAdjustModal.jam_pulang}:00` : null,
                status: bulkAdjustModal.status,
                alasan_adjustment: bulkAdjustModal.reason.trim()
            };

            const res = await api.post("/attendance/adjust-bulk", payload);
            toast.success(res.data.message || `Berhasil mengoreksi presensi ${user_ids.length} karyawan secara massal!`);
            setBulkAdjustModal(prev => ({ ...prev, isOpen: false, isSubmitting: false }));
            setSelectedUserIds([]);
            loadDailyAll();
            if (activeTab === "recap") loadMonthlyRecap();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal melakukan koreksi presensi massal");
            setBulkAdjustModal(prev => ({ ...prev, isSubmitting: false }));
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
                    {/* Role Manajerial / Owner Exemption Banner */}
                    {isPimpinan && (
                        <div className="lg:col-span-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-slate-900">Akses Manajerial & Owner (Bebas Presensi)</h4>
                                        <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Fleksibel
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Sebagai pimpinan/owner, kehadiran Anda tidak dipantau dalam daftar alfa atau potongan payroll.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab("monitoring")}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                            >
                                Pantau Presensi Tim &rarr;
                            </button>
                        </div>
                    )}
                    {/* Left: GPS Status Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span>Lokasi & Presensi GPS Real-time</span>
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
                                    <span className="font-bold text-slate-800 block">{policy?.nama_kantor || "Workshop Utama Pekayon"}</span>
                                    <span className="text-3xs text-slate-500 block leading-tight mt-0.5">{WORKSHOP_DEFAULT_ADDRESS}</span>
                                </div>
                            </div>
                            <div className="flex items-start justify-between text-xs gap-2 pt-1 border-t border-slate-200/60">
                                <span className="text-slate-500 font-semibold shrink-0">Lokasi Real Anda:</span>
                                <span className="font-bold text-slate-800 text-right text-3xs sm:text-2xs max-w-[210px] leading-tight">
                                    {locationData.loading ? "Mencari detail lokasi real-time..." : (locationData.addressName || "-")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                                <span className="text-slate-500 font-semibold">Batas Radius:</span>
                                <span className="font-bold text-slate-800">{policy?.radius_meter || 500} Meter</span>
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

                        {/* Status Verification Alert Banner */}
                        {locationData.error ? (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-800">
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold">Kendala Izin / Sinyal Lokasi</p>
                                        <p className="text-2xs text-rose-700 mt-0.5 leading-relaxed">{locationData.error}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
                                    <button
                                        type="button"
                                        onClick={fetchLocation}
                                        disabled={locationData.loading}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-2xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${locationData.loading ? "animate-spin" : ""}`} />
                                        <span>Coba Deteksi Lokasi Lagi</span>
                                    </button>
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
                                        <p className="text-2xs mt-0.5 leading-relaxed">
                                            {locationData.isInRadius
                                                ? `Anda terdeteksi di lokasi workshop (${locationData.distance}m <= ${policy?.radius_meter || 500}m).`
                                                : `Jarak Anda (${locationData.distance}m) melebihi batas geofence (${policy?.radius_meter || 500}m). Anda wajib menggunakan opsi Check-In Tugas Luar.`}
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
                                <strong className="text-slate-800">{policy?.jam_masuk || "09:00"} WIB (Toleransi {policy?.toleransi_menit || 15}m)</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Jam Pulang:</span>
                                <strong className="text-slate-800">{policy?.jam_pulang || "18:00"} WIB</strong>
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
                                            <p className="text-3xs text-slate-400 mt-0.5">Batas waktu {policy?.jam_masuk || "09:00"} WIB</p>
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
                                            <p className="text-3xs text-slate-400 mt-0.5">Selesai jam {policy?.jam_pulang || "18:00"} WIB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Review Status Banner (Tugas Luar & Pulang Lebih Awal) */}
                            {(todayRecord?.is_tugas_luar || todayRecord?.status === "pulang_cepat" || todayRecord?.status_review === "menunggu_review") && (
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
                                                {todayRecord.status === "pulang_cepat"
                                                    ? todayRecord.status_review === "valid"
                                                        ? "Izin Pulang Lebih Awal Disetujui Superadmin/Owner"
                                                        : todayRecord.status_review === "ditolak"
                                                            ? "Kepulangan Lebih Awal Ditolak"
                                                            : `Pulang Lebih Awal Sebelum ${policy?.jam_pulang || "18:00"} WIB (Menunggu Verifikasi Owner)`
                                                    : todayRecord.status_review === "valid"
                                                        ? "Presensi Tugas Luar Disetujui Superadmin/Owner"
                                                        : todayRecord.status_review === "ditolak"
                                                            ? "Presensi Tugas Luar Ditolak"
                                                            : "Kategori Tugas Luar (Menunggu Verifikasi Owner)"}
                                            </span>
                                            {todayRecord.alasan_tugas_luar && (
                                                <p className="text-2xs opacity-90 mt-0.5">Alasan: {todayRecord.alasan_tugas_luar}</p>
                                            )}
                                            {todayRecord.catatan && todayRecord.status === "pulang_cepat" && (
                                                <p className="text-2xs opacity-90 mt-0.5">{todayRecord.catatan}</p>
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
                                !locationData.isInRadius ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCameraModalType("tugas-luar");
                                            setCameraModalOpen(true);
                                        }}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-500/20 active:scale-[0.98]"
                                    >
                                        <MapPin className="w-4 h-4 stroke-[2.5]" />
                                        <span>Check-In Tugas Luar (Di Luar Kantor)</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCameraModalType("check-in");
                                            setCameraModalOpen(true);
                                        }}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/20 active:scale-[0.98]"
                                    >
                                        <Camera className="w-4 h-4 stroke-[2.5]" />
                                        <span>Check In Masuk Sekarang</span>
                                    </button>
                                )
                            ) : !todayRecord?.jam_pulang ? (
                                <button
                                    type="button"
                                    onClick={handleTriggerCheckOut}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-500/20 active:scale-[0.98]"
                                >
                                    <LogOut className="w-4 h-4 stroke-[2.5]" />
                                    <span>Presensi Pulang Sekarang</span>
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
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {/* Tombol Cepat Pemicu Bulk Action Massal */}
                            {dailyData.list?.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedUserIds.length === dailyData.list.length) {
                                            setSelectedUserIds([]);
                                        } else {
                                            setSelectedUserIds(dailyData.list.map(r => r.user.id));
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                        selectedUserIds.length > 0
                                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                                    }`}
                                    title="Pilih seluruh staf operasional untuk aksi bulk koreksi status sekaligus"
                                >
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${selectedUserIds.length > 0 ? "text-blue-600" : "text-slate-500"}`} />
                                    <span>
                                        {selectedUserIds.length > 0
                                            ? `${selectedUserIds.length} Terpilih (Batalkan)`
                                            : "Pilih Semua (Bulk Koreksi)"}
                                    </span>
                                </button>
                            )}

                            <input
                                type="date"
                                value={filterDailyDate}
                                onChange={(e) => {
                                    setFilterDailyDate(e.target.value);
                                    setSelectedUserIds([]);
                                }}
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

                    {/* Bulk Selection Quick Action Floating Toolbar */}
                    {selectedUserIds.length > 0 && (
                        <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-xs shrink-0 shadow-2xs">
                                    {selectedUserIds.length}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                                        <span>{selectedUserIds.length} Karyawan Terpilih</span>
                                        <span className="text-3xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                            {filterDailyDate}
                                        </span>
                                    </p>
                                    <p className="text-3xs sm:text-xs text-slate-500 mt-0.5">
                                        Pilih status untuk koreksi massal hari ini, atau buka formulir koreksi rinci.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => startBulkAction("hadir")}
                                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-2xs sm:text-xs font-semibold transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1.5"
                                    title="Koreksi Massal Hadir (09:00 - 18:00)"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Set Hadir</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => startBulkAction("izin")}
                                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-2xs sm:text-xs font-semibold transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1.5"
                                    title="Koreksi Massal Izin Resmi"
                                >
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Set Izin</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => startBulkAction("sakit")}
                                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-2xs sm:text-xs font-semibold transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1.5"
                                    title="Koreksi Massal Sakit"
                                >
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Set Sakit</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => startBulkAction("alfa")}
                                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-2xs sm:text-xs font-semibold transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1.5"
                                    title="Koreksi Massal Alfa"
                                >
                                    <X className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Set Alfa</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => startBulkAction("hadir")}
                                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-2xs sm:text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                                    title="Formulir Koreksi Rinci Massal"
                                >
                                    <Sliders className="w-3.5 h-3.5 text-slate-300" />
                                    <span>Koreksi Rinci</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearSelection}
                                    className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-2xs sm:text-xs font-medium transition-all cursor-pointer border border-transparent hover:border-slate-200 text-center"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Table of Employees Today */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
                        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 text-xs">Daftar Status Presensi Hari Terpilih</h3>
                                <span className="text-3xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                                    Mendukung Bulk & Quick Action
                                </span>
                            </div>
                            <span className="text-3xs text-slate-500 font-semibold">
                                Centang kotak di samping nama staf untuk memunculkan toolbar aksi massal
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-3xs font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="py-3 px-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                checked={dailyData.list?.length > 0 && selectedUserIds.length === dailyData.list?.length}
                                                onChange={handleToggleSelectAll}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                title="Pilih / Batal Pilih Semua Karyawan"
                                            />
                                        </th>
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
                                            <td colSpan="9" className="py-8 text-center text-slate-400 font-semibold">
                                                Memuat status kehadiran harian...
                                            </td>
                                        </tr>
                                    ) : dailyData.list?.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="py-8 text-center text-slate-400 font-semibold">
                                                Tidak ada data karyawan ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        dailyData.list?.map(row => (
                                            <tr key={row.user.id} className={`hover:bg-slate-50/70 transition-colors ${selectedUserIds.includes(row.user.id) ? "bg-blue-50/30" : ""}`}>
                                                <td className="py-3 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.includes(row.user.id)}
                                                        onChange={() => handleToggleSelectUser(row.user.id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
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
                                                    <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                                                        {/* Quick Action 1: Auto Hadir */}
                                                        <button
                                                            type="button"
                                                            onClick={() => startQuickAction(row, "hadir")}
                                                            className="px-2 py-1 text-3xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                                                            title="Quick Action: Auto Hadir (09:00 - 18:00)"
                                                        >
                                                            + Hadir
                                                        </button>

                                                        {/* Quick Action 2: Auto Izin */}
                                                        <button
                                                            type="button"
                                                            onClick={() => startQuickAction(row, "izin")}
                                                            className="px-2 py-1 text-3xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                                                            title="Quick Action: Auto Izin"
                                                        >
                                                            + Izin
                                                        </button>

                                                        {/* Quick Action 3: Auto Sakit */}
                                                        <button
                                                            type="button"
                                                            onClick={() => startQuickAction(row, "sakit")}
                                                            className="px-2 py-1 text-3xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                                                            title="Quick Action: Auto Sakit"
                                                        >
                                                            + Sakit
                                                        </button>

                                                        {/* Quick Action 4: Auto Alfa */}
                                                        <button
                                                            type="button"
                                                            onClick={() => startQuickAction(row, "alfa")}
                                                            className="px-2 py-1 text-3xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                                                            title="Quick Action: Auto Alfa"
                                                        >
                                                            + Alfa
                                                        </button>

                                                        {/* Manual Detail Koreksi Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAdjustForm({
                                                                    record_id: row.attendance?.id || null,
                                                                    user_id: row.user.id,
                                                                    userName: row.user.nama,
                                                                    userRole: row.user.role,
                                                                    tanggal: filterDailyDate,
                                                                    jam_masuk: row.attendance?.jam_masuk ? new Date(row.attendance.jam_masuk).toISOString().slice(11, 16) : "09:00",
                                                                    jam_pulang: row.attendance?.jam_pulang ? new Date(row.attendance.jam_pulang).toISOString().slice(11, 16) : "18:00",
                                                                    status: row.attendance?.status || "hadir",
                                                                    alasan_adjustment: ""
                                                                });
                                                                setAdjustModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                                            title="Buka Formulir Koreksi Presensi Lengkap"
                                                        >
                                                            <Sliders className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
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
                                <p className="text-2xs text-slate-500">
                                    Akumulasi jam kerja, potongan keterlambatan, dan hari izin seluruh staf. Koreksi kehadiran per tanggal (satuan maupun massal) dilakukan pada tabel harian di atas.
                                </p>
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
                                                    {item.status === "pulang_cepat" ? (
                                                        <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                                            Pulang Lebih Awal
                                                        </span>
                                                    ) : item.is_tugas_luar ? (
                                                        <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                                                            Tugas Luar
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="text-2xs text-slate-500 mt-0.5">
                                                    {item.user?.email || "-"} •{" "}
                                                    {new Date(item.tanggal).toLocaleDateString("id-ID", {
                                                        weekday: "short",
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}{" "}
                                                    (Masuk:{" "}
                                                    {item.jam_masuk
                                                        ? new Date(item.jam_masuk).toLocaleTimeString("id-ID", {
                                                              hour: "2-digit",
                                                              minute: "2-digit"
                                                          }) + " WIB"
                                                        : "-"}{" "}
                                                    {item.jam_pulang
                                                        ? `• Pulang: ${new Date(item.jam_pulang).toLocaleTimeString("id-ID", {
                                                              hour: "2-digit",
                                                              minute: "2-digit"
                                                          })} WIB`
                                                        : ""}
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
                                                    {item.status === "pulang_cepat"
                                                        ? "Alasan Kepulangan Lebih Awal:"
                                                        : "Alasan / Penugasan Luar Karyawan:"}
                                                </span>
                                                <p className="text-xs font-medium text-slate-800 leading-relaxed italic">
                                                    "{item.catatan || item.alasan_tugas_luar || "Tidak ada keterangan tertulis"}"
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
                                                        {item.jarak_meter_pulang !== null && item.jarak_meter_pulang !== undefined
                                                            ? `${item.jarak_meter_pulang} meter`
                                                            : item.jarak_meter_masuk !== null && item.jarak_meter_masuk !== undefined
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
                                            {item.foto_pulang || item.foto_masuk ? (
                                                <div
                                                    onClick={() => setPreviewPhotoUrl(item.foto_pulang || item.foto_masuk)}
                                                    className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group cursor-pointer shadow-2xs hover:ring-2 hover:ring-blue-500/30 transition-all"
                                                >
                                                    <img
                                                        src={item.foto_pulang || item.foto_masuk}
                                                        alt="Selfie Bukti Presensi"
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

            {/* MODAL 0: EARLY CHECK-OUT CONFIRMATION (PULANG LEBIH AWAL - WAJIB REVIEW) */}
            {earlyCheckOutModalOpen && (
                <div className="modal-shell bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="modal-panel max-w-md">
                    <div className="modal-grabber" />
                        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-amber-200/80 bg-amber-50/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-amber-600 text-white">
                                    <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                                        Konfirmasi Pulang Lebih Awal
                                    </h3>
                                    <p className="text-2xs text-amber-900 font-medium">
                                        Terdeteksi Check-Out sebelum pukul {policy?.jam_pulang || "18:00"} WIB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEarlyCheckOutModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Jam Pulang Normal: {policy?.jam_pulang || "18:00"} WIB</span>
                                </p>
                                <p className="text-2xs leading-relaxed text-amber-800">
                                    Anda sedang melakukan presensi pulang sebelum jam operasional berakhir. Sesuai SOP workshop, kepulangan lebih awal wajib menyertakan alasan yang jelas dan masuk ke daftar <strong>Wajib Review Superadmin / Owner</strong>.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Alasan Kepulangan Lebih Awal <span className="text-rose-500">* (Wajib Diisi)</span>
                                </label>
                                <textarea
                                    value={earlyCheckOutReason}
                                    onChange={(e) => setEarlyCheckOutReason(e.target.value)}
                                    rows={3}
                                    placeholder="Contoh: Keperluan keluarga mendadak / Kondisi badan kurang sehat / Mengantar unit servis mendesak..."
                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    required
                                />
                            </div>

                            <div>
                                <span className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Pilihan Cepat Alasan:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        "Urusan Keluarga Mendadak",
                                        "Kondisi Kesehatan / Sakit",
                                        "Tugas Luar / Antar Unit Pelanggan",
                                        "Izin Khusus Pimpinan / Owner"
                                    ].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setEarlyCheckOutReason(preset)}
                                            className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg text-3xs font-semibold transition-colors cursor-pointer"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2 sm:gap-2.5 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setEarlyCheckOutModalOpen(false)}
                                className="w-full xs:w-auto px-4 py-2.5 xs:py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!earlyCheckOutReason.trim()) {
                                        toast.error("Alasan pulang lebih awal wajib diisi!");
                                        return;
                                    }
                                    setEarlyCheckOutModalOpen(false);
                                    setCameraModalType("check-out");
                                    setCameraModalOpen(true);
                                }}
                                className="w-full xs:w-auto px-5 py-2.5 xs:py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ring-2 ring-amber-500/20"
                            >
                                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Lanjut Ambil Selfie Pulang</span>
                            </button>
                        </div>
                    </div>
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
                isEarlyCheckOut={Boolean(earlyCheckOutReason)}
            />

            {/* MODAL 2: AJUKAN IZIN / CUTI */}
            {leaveModalOpen && (
                <div className="modal-shell bg-slate-900/60 backdrop-blur-xs">
                    <div className="modal-panel max-w-md border-slate-100 animate-fadeIn">
                        <div className="modal-grabber" />
                        <div className="modal-body-tight">
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
                </div>
            )}

            {/* MODAL 3: KOREKSI PRESENSI MANUAL & PRESET (ADMIN ONLY) */}
            {adjustModalOpen && (
                <div 
                    className="modal-shell bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in"
                    onClick={() => !isSubmittingAdjust && setAdjustModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                                    <Sliders className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Koreksi Presensi Manual</h3>
                                    <p className="text-xs text-slate-500">
                                        Karyawan: <strong className="text-slate-800">{adjustForm.userName}</strong> • {adjustForm.tanggal}
                                    </p>
                                </div>
                            </div>
                            {!isSubmittingAdjust && (
                                <button 
                                    type="button"
                                    onClick={() => setAdjustModalOpen(false)} 
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Quick Presets Bar */}
                        <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span>Pilihan Cepat Preset Koreksi (1-Klik Isi Otomatis)</span>
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => applyAdjustPreset("hadir_normal")}
                                    className="px-2 py-1.5 rounded-lg border text-2xs font-bold transition-all cursor-pointer bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200"
                                >
                                    Hadir Normal (09:00)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyAdjustPreset("terlambat")}
                                    className="px-2 py-1.5 rounded-lg border text-2xs font-bold transition-all cursor-pointer bg-white hover:bg-amber-50 text-amber-800 border-amber-200"
                                >
                                    Terlambat (09:30)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyAdjustPreset("pulang_cepat")}
                                    className="px-2 py-1.5 rounded-lg border text-2xs font-bold transition-all cursor-pointer bg-white hover:bg-indigo-50 text-indigo-800 border-indigo-200"
                                >
                                    Pulang Cepat (14:00)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyAdjustPreset("izin")}
                                    className="px-2 py-1.5 rounded-lg border text-2xs font-bold transition-all cursor-pointer bg-white hover:bg-blue-50 text-blue-800 border-blue-200"
                                >
                                    Izin Resmi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyAdjustPreset("sakit")}
                                    className="px-2 py-1.5 rounded-lg border text-2xs font-bold transition-all cursor-pointer bg-white hover:bg-amber-50 text-amber-800 border-amber-200"
                                >
                                    Sakit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyAdjustPreset("alfa")}
                                    className="px-2 py-1.5 rounded-lg border text-2xs font-bold transition-all cursor-pointer bg-white hover:bg-rose-50 text-rose-800 border-rose-200"
                                >
                                    Alfa (Tanpa Ket.)
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status Kehadiran</label>
                                <select
                                    value={adjustForm.status}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="hadir">Hadir (Tepat Waktu)</option>
                                    <option value="terlambat">Terlambat</option>
                                    <option value="pulang_cepat">Pulang Cepat</option>
                                    <option value="izin">Izin</option>
                                    <option value="sakit">Sakit</option>
                                    <option value="alfa">Alfa (Tanpa Keterangan)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Masuk</label>
                                    <input
                                        type="time"
                                        value={adjustForm.jam_masuk}
                                        disabled={adjustForm.status === "izin" || adjustForm.status === "sakit" || adjustForm.status === "alfa"}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, jam_masuk: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Pulang</label>
                                    <input
                                        type="time"
                                        value={adjustForm.jam_pulang}
                                        disabled={adjustForm.status === "izin" || adjustForm.status === "sakit" || adjustForm.status === "alfa"}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, jam_pulang: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                                    />
                                </div>
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
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-2xs">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span>Perubahan ini dicatat permanen dalam Audit Log Sistem Serv.io dengan identitas admin yang sedang login.</span>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    disabled={isSubmittingAdjust}
                                    onClick={() => setAdjustModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingAdjust}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSubmittingAdjust && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Simpan Koreksi</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3B: QUICK ACTION DENGAN DOUBLE KONFIRMASI */}
            {quickActionModal.isOpen && (
                <div 
                    className="modal-shell bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in"
                    onClick={() => !quickActionModal.isSubmitting && setQuickActionModal(prev => ({ ...prev, isOpen: false }))}
                >
                    <div 
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* STEP 1: INITIAL VERIFICATION & REASON INPUT */}
                        {quickActionModal.step === 1 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">Quick Action Koreksi Presensi</h3>
                                            <p className="text-3xs font-semibold text-slate-400">Langkah 1 dari 2: Verifikasi Awal</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setQuickActionModal(prev => ({ ...prev, isOpen: false }))} 
                                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Employee & Target Status Summary Card */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Karyawan:</span>
                                        <span className="text-xs font-bold text-slate-900">{quickActionModal.user?.nama}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Tanggal Presensi:</span>
                                        <span className="text-xs font-mono font-bold text-slate-700">{quickActionModal.tanggal}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                        <span className="text-xs text-slate-500">Target Status:</span>
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border uppercase ${
                                            quickActionModal.targetStatus === "hadir" 
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : quickActionModal.targetStatus === "izin"
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : quickActionModal.targetStatus === "sakit"
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}>
                                            {quickActionModal.targetStatus === "hadir" ? "HADIR (09:00 - 18:00)" : quickActionModal.targetStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* Editable Audit Reason */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Alasan Koreksi <span className="text-rose-500">* (Audit Log)</span>
                                    </label>
                                    <textarea
                                        value={quickActionModal.reason}
                                        onChange={(e) => setQuickActionModal(prev => ({ ...prev, reason: e.target.value }))}
                                        rows="2"
                                        placeholder="Tulis alasan koreksi..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuickActionModal(prev => ({ ...prev, isOpen: false }))}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!quickActionModal.reason.trim()}
                                        onClick={() => setQuickActionModal(prev => ({ ...prev, step: 2 }))}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Lanjut ke Konfirmasi Final →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: DOUBLE CONFIRMATION FINAL AUTHORIZATION */}
                        {quickActionModal.step === 2 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Final Otorisasi</h3>
                                            <p className="text-3xs font-semibold text-rose-600">Langkah 2 dari 2: Verifikasi Eksekusi</p>
                                        </div>
                                    </div>
                                    {!quickActionModal.isSubmitting && (
                                        <button 
                                            type="button"
                                            onClick={() => setQuickActionModal(prev => ({ ...prev, isOpen: false }))} 
                                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Prominent Anti-Fraud Warning Box */}
                                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-rose-950 space-y-2">
                                    <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                                        <span>Peringatan Audit Anti-Fraud</span>
                                    </div>
                                    <p className="text-xs text-rose-900 leading-relaxed text-justify">
                                        Apakah Anda yakin 100% ingin menerapkan koreksi presensi ini? Tindakan ini akan <strong>langsung menimpa data absensi riil</strong> dan dicatat permanen dalam rekam jejak audit bengkel atas nama akun Anda.
                                    </p>
                                </div>

                                {/* Review Data Verification */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-2xs space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Target Karyawan:</span>
                                        <span className="font-bold text-slate-800">{quickActionModal.user?.nama}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Status Baru:</span>
                                        <span className="font-bold text-slate-800 uppercase">{quickActionModal.targetStatus}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Alasan Audit:</span>
                                        <span className="font-medium text-slate-700 italic truncate max-w-[200px]">{quickActionModal.reason}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        disabled={quickActionModal.isSubmitting}
                                        onClick={() => setQuickActionModal(prev => ({ ...prev, step: 1 }))}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        ← Kembali
                                    </button>
                                    <button
                                        type="button"
                                        disabled={quickActionModal.isSubmitting}
                                        onClick={handleExecuteQuickAction}
                                        className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {quickActionModal.isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Terapkan Koreksi (Final)</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 3C: BULK ADJUSTMENT DENGAN PRESET, EDITABLE INPUT, & DOUBLE KONFIRMASI */}
            {bulkAdjustModal.isOpen && (
                <div 
                    className="modal-shell bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in"
                    onClick={() => !bulkAdjustModal.isSubmitting && setBulkAdjustModal(prev => ({ ...prev, isOpen: false }))}
                >
                    <div 
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* STEP 1: EDIT & REVIEW BULK ADJUSTMENT */}
                        {bulkAdjustModal.step === 1 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 text-base">Koreksi Presensi Massal (Bulk)</h3>
                                                <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-blue-100 text-blue-700">
                                                    Editable
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Langkah 1 dari 2: Sesuaikan status, jam & catatan audit
                                            </p>
                                        </div>
                                    </div>
                                    {!bulkAdjustModal.isSubmitting && (
                                        <button 
                                            type="button"
                                            onClick={() => setBulkAdjustModal(prev => ({ ...prev, isOpen: false }))} 
                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Selected Employees Chips with Remove Feature */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Karyawan Terpilih ({bulkAdjustModal.selectedUsers.length})</span>
                                        </label>
                                        <span className="text-3xs text-slate-400">Klik tanda silang (x) untuk batal memilih</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/80 custom-scrollbar">
                                        {bulkAdjustModal.selectedUsers.map(u => (
                                            <span 
                                                key={u.id}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                                            >
                                                <span>{u.nama}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveUserFromBulk(u.id)}
                                                    className="w-3.5 h-3.5 rounded-full hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                                                    title={`Keluarkan ${u.nama} dari koreksi massal`}
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Status Selector Buttons */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">Pilih Status Presensi Massal</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                        {[
                                            { id: "hadir", label: "Hadir", desc: "09:00 - 18:00", color: "emerald" },
                                            { id: "izin", label: "Izin", desc: "Resmi", color: "blue" },
                                            { id: "sakit", label: "Sakit", desc: "Surat Dokter", color: "amber" },
                                            { id: "alfa", label: "Alfa", desc: "Tanpa Ket.", color: "rose" }
                                        ].map(item => {
                                            const isSelected = bulkAdjustModal.status === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const defaultMasuk = item.id === "hadir" ? "09:00" : "";
                                                        const defaultPulang = item.id === "hadir" ? "18:00" : "";
                                                        setBulkAdjustModal(prev => ({
                                                            ...prev,
                                                            status: item.id,
                                                            jam_masuk: defaultMasuk,
                                                            jam_pulang: defaultPulang,
                                                            reason: `Koreksi massal status ${item.label.toUpperCase()} (${prev.selectedUsers.length} karyawan)`
                                                        }));
                                                    }}
                                                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                                        isSelected
                                                            ? item.color === "emerald"
                                                                ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                                                                : item.color === "blue"
                                                                ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20"
                                                                : item.color === "amber"
                                                                ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                                                                : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                                                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                                                    }`}
                                                >
                                                    <p className="text-xs font-bold leading-none">{item.label}</p>
                                                    <span className="text-3xs text-slate-500 mt-1 block truncate">{item.desc}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Editable Hours (Disabled if Izin/Sakit/Alfa, but custom editable for Hadir/Custom) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Jam Masuk Massal
                                        </label>
                                        <input
                                            type="time"
                                            value={bulkAdjustModal.jam_masuk}
                                            disabled={bulkAdjustModal.status === "izin" || bulkAdjustModal.status === "sakit" || bulkAdjustModal.status === "alfa"}
                                            onChange={(e) => setBulkAdjustModal(prev => ({ ...prev, jam_masuk: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Jam Pulang Massal
                                        </label>
                                        <input
                                            type="time"
                                            value={bulkAdjustModal.jam_pulang}
                                            disabled={bulkAdjustModal.status === "izin" || bulkAdjustModal.status === "sakit" || bulkAdjustModal.status === "alfa"}
                                            onChange={(e) => setBulkAdjustModal(prev => ({ ...prev, jam_pulang: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Editable Audit Reason */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Alasan Koreksi Massal <span className="text-rose-500">* (Audit Log Anti-Fraud)</span>
                                    </label>
                                    <textarea
                                        value={bulkAdjustModal.reason}
                                        onChange={(e) => setBulkAdjustModal(prev => ({ ...prev, reason: e.target.value }))}
                                        rows="2"
                                        placeholder="Contoh: Koreksi massal kehadiran workshop hari libur nasional / event khusus..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setBulkAdjustModal(prev => ({ ...prev, isOpen: false }))}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!bulkAdjustModal.reason.trim() || bulkAdjustModal.selectedUsers.length === 0}
                                        onClick={() => setBulkAdjustModal(prev => ({ ...prev, step: 2 }))}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Lanjut ke Double Konfirmasi →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: FINAL DOUBLE CONFIRMATION ANTI-FRAUD */}
                        {bulkAdjustModal.step === 2 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Final Koreksi Massal</h3>
                                            <p className="text-3xs font-semibold text-rose-600">Langkah 2 dari 2: Verifikasi & Otorisasi</p>
                                        </div>
                                    </div>
                                    {!bulkAdjustModal.isSubmitting && (
                                        <button 
                                            type="button"
                                            onClick={() => setBulkAdjustModal(prev => ({ ...prev, isOpen: false }))} 
                                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Prominent Anti-Fraud Warning Box */}
                                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-rose-950 space-y-2">
                                    <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                                        <span>PERINGATAN AUDIT: Aksi Massal Permanen</span>
                                    </div>
                                    <p className="text-xs text-rose-900 leading-relaxed text-justify">
                                        Anda akan mengubah status presensi <strong>{bulkAdjustModal.selectedUsers.length} karyawan sekaligus</strong> menjadi status <strong className="uppercase">{bulkAdjustModal.status}</strong> pada tanggal <strong>{bulkAdjustModal.tanggal}</strong>. Tindakan ini akan tercatat dalam log audit resmi bengkel.
                                    </p>
                                </div>

                                {/* Review Summary */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-2xs space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Jumlah Karyawan:</span>
                                        <span className="font-bold text-slate-800">{bulkAdjustModal.selectedUsers.length} Orang</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Status Baru:</span>
                                        <span className="font-bold text-slate-800 uppercase">{bulkAdjustModal.status}</span>
                                    </div>
                                    {bulkAdjustModal.status === "hadir" && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Jam Masuk / Pulang:</span>
                                            <span className="font-mono font-bold text-slate-800">{bulkAdjustModal.jam_masuk || "-"} s/d {bulkAdjustModal.jam_pulang || "-"}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Alasan Audit:</span>
                                        <span className="font-medium text-slate-700 italic truncate max-w-[200px]">{bulkAdjustModal.reason}</span>
                                    </div>
                                    <div className="pt-1 border-t border-slate-200 text-slate-600">
                                        <span className="font-semibold text-slate-700">Daftar Karyawan: </span>
                                        {bulkAdjustModal.selectedUsers.map(u => u.nama).join(", ")}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        disabled={bulkAdjustModal.isSubmitting}
                                        onClick={() => setBulkAdjustModal(prev => ({ ...prev, step: 1 }))}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        ← Kembali Edit
                                    </button>
                                    <button
                                        type="button"
                                        disabled={bulkAdjustModal.isSubmitting}
                                        onClick={handleExecuteBulkAdjust}
                                        className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {bulkAdjustModal.isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Ya, Terapkan ({bulkAdjustModal.selectedUsers.length})</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 4: PREVIEW FOTO SELFIE WATERMARKED */}
            {previewPhotoUrl && (
                <div className="modal-shell bg-slate-900/80 backdrop-blur-xs">
                    <div className="modal-panel max-w-md bg-slate-900 border-slate-700 text-slate-100">
                    <div className="modal-grabber" />
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

            {/* MODAL 5: CUSTOM ACTION REVIEW / PROMPT MODAL (REPLACES BROWSER PROMPTS) */}
            {actionPromptModal.isOpen && (
                <div 
                    className="modal-shell bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in"
                    onClick={() => !actionPromptModal.isSubmitting && setActionPromptModal(prev => ({ ...prev, isOpen: false }))}
                >
                    <div 
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-900 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                {actionPromptModal.title}
                            </h3>
                            {!actionPromptModal.isSubmitting && (
                                <button
                                    type="button"
                                    onClick={() => setActionPromptModal(prev => ({ ...prev, isOpen: false }))}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {actionPromptModal.subtitle && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                                {actionPromptModal.subtitle}
                            </p>
                        )}

                        {actionPromptModal.inputLabel && (
                            <div className="space-y-1.5 mb-5">
                                <label className="block text-xs font-bold text-slate-700">
                                    {actionPromptModal.inputLabel}
                                </label>
                                <textarea
                                    value={actionPromptModal.inputValue}
                                    onChange={(e) => setActionPromptModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                    placeholder={actionPromptModal.placeholder}
                                    rows="3"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                disabled={actionPromptModal.isSubmitting}
                                onClick={() => setActionPromptModal(prev => ({ ...prev, isOpen: false }))}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border border-slate-200 disabled:opacity-50"
                            >
                                {actionPromptModal.cancelText || "Batal"}
                            </button>
                            <button
                                type="button"
                                disabled={actionPromptModal.isSubmitting}
                                onClick={() => actionPromptModal.onConfirm?.(actionPromptModal.inputValue)}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                                    actionPromptModal.variant === "danger"
                                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                                        : actionPromptModal.variant === "emerald"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                                }`}
                            >
                                <span>{actionPromptModal.confirmText}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

