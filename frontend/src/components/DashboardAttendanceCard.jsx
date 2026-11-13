import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import {
    Camera,
    CheckCircle2,
    Clock,
    MapPin,
    AlertCircle,
    ArrowRight,
    LogOut,
    Calendar,
    ShieldCheck
} from "lucide-react";

export default function DashboardAttendanceCard() {
    const { user } = useAuth();
    const isExempt = user?.permissions?.includes("attendance.exempt");
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchTodayStatus() {
            try {
                const res = await api.get("/attendance/today");
                if (isMounted) {
                    setStatusData(res.data);
                }
            } catch (err) {
                // Silently fallback without breaking dashboard
                console.error("Gagal memuat status presensi dashboard:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchTodayStatus();
        return () => {
            isMounted = false;
        };
    }, []);

    // Role Manajerial / Owner (Pimpinan) tidak wajib absen operasional
    if (isExempt) {
        return (
            <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className="p-2 sm:p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug">
                                Akses Manajerial & Owner
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                Bebas Presensi
                            </span>
                        </div>
                        <p className="text-2xs sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                            Pantau kehadiran dan verifikasi izin tim di Monitoring Presensi.
                        </p>
                    </div>
                </div>
                <Link
                    to="/attendance"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                    <span>Monitoring Tim</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs animate-pulse flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 shrink-0"></div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="w-36 sm:w-44 h-3.5 bg-slate-100 rounded"></div>
                        <div className="w-52 sm:w-64 h-3 bg-slate-100 rounded"></div>
                    </div>
                </div>
                <div className="w-full sm:w-28 h-8 bg-slate-100 rounded-xl shrink-0"></div>
            </div>
        );
    }

    if (!statusData) return null;

    const { record, policy, activeLeave } = statusData;

    // Helper formatting
    const formatTime = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    };

    // Case 1: Active Approved Leave / Cuti / Sakit
    if (activeLeave) {
        return (
            <div className="bg-sky-50/70 border border-sky-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className="p-2 sm:p-2.5 bg-sky-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-sky-950 tracking-tight leading-snug">
                                Status Hari Ini: Sedang {activeLeave.tipe?.toUpperCase()}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-sky-200 text-sky-900 border border-sky-300 shrink-0">
                                Disetujui ({activeLeave.jumlah_hari} Hari)
                            </span>
                        </div>
                        <p className="text-2xs sm:text-xs text-sky-800 mt-0.5 leading-relaxed line-clamp-2 break-words">
                            {activeLeave.alasan || "Pengajuan izin karyawan aktif"}
                        </p>
                    </div>
                </div>
                <Link
                    to="/attendance"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                    <span>Pusat Presensi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    // Case 2: Sudah Check-In & Sudah Check-Out (Selesai Hari Ini)
    if (record?.jam_masuk && record?.jam_pulang) {
        const hours = Math.floor((record.durasi_kerja_menit || 0) / 60);
        const mins = (record.durasi_kerja_menit || 0) % 60;

        return (
            <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className="p-2 sm:p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug">
                                Presensi Hari Ini Lengkap
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                Selesai
                            </span>
                        </div>
                        <p className="text-2xs sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                            Masuk: <strong className="text-slate-800">{formatTime(record.jam_masuk)}</strong> • Pulang: <strong className="text-slate-800">{formatTime(record.jam_pulang)}</strong> • Durasi: <strong className="text-slate-800">{hours}j {mins}m</strong>
                        </p>
                    </div>
                </div>
                <Link
                    to="/attendance"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                    <span>Lihat Rekap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    // Case 3: Sudah Check-In tapi Belum Check-Out (Sedang Bekerja)
    if (record?.jam_masuk && !record?.jam_pulang) {
        const isTerlambat = record.status === "terlambat";

        return (
            <div className="bg-blue-50/60 border border-blue-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className="p-2 sm:p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug">
                                Sedang Bekerja (Check-In: {formatTime(record.jam_masuk)} WIB)
                            </span>
                            {isTerlambat ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                    Terlambat {record.menit_keterlambatan}m
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                                    Tepat Waktu
                                </span>
                            )}
                        </div>
                        <p className="text-2xs sm:text-xs text-slate-600 mt-0.5 leading-relaxed flex items-center gap-1 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>Lokasi {Math.round(record.jarak_meter_masuk || 0)}m dari kantor</span>
                            </span>
                            <span className="hidden xs:inline text-slate-400">•</span>
                            <span>Check-out pukul {policy?.jam_pulang || "18:00"} WIB</span>
                        </p>
                    </div>
                </div>
                <Link
                    to="/attendance"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                    title="Lakukan Selfie Check-Out di Presensi"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check-Out Pulang</span>
                </Link>
            </div>
        );
    }

    // Case 4: Belum Check-In Hari Ini (Default Morning Prompt)
    const officeShortName = (policy?.nama_kantor || "Pekayon").replace(/^Workshop\s+/i, "");
    return (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                <div className="p-2 sm:p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0 animate-pulse">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-amber-950 tracking-tight leading-snug break-words">
                            Pengingat: Anda Belum Presensi Hari Ini
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300 shrink-0">
                            Wajib Hadir
                        </span>
                    </div>
                    <div className="text-2xs sm:text-xs text-amber-800 mt-1 leading-snug flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Jam masuk {policy?.jam_masuk || "09:00"} WIB (Toleransi {policy?.toleransi_menit || 15}m)</span>
                        </span>
                        <span className="text-amber-400">•</span>
                        <span className="font-medium">Workshop {officeShortName}</span>
                    </div>
                </div>
            </div>
            <Link
                to="/attendance"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer group"
                title="Buka Kamera dan GPS untuk Check-In"
            >
                <Camera className="w-4 h-4 sm:w-3.5 sm:h-3.5 group-hover:scale-110 transition-transform" />
                <span>Ambil Selfie Check-In</span>
            </Link>
        </div>
    );
}

