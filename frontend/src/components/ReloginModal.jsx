import { useState } from "react";
import { Lock, Eye, EyeOff, LogOut, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { isRememberMeActive } from "../utils/authStorage";
import UserAvatar from "./common/UserAvatar";
import toast from "react-hot-toast";

/**
 * Modal Re-login In-App (Non-Destructive Sesi Expiry Dialog)
 * 
 * Muncul saat sesi user terkunci akibat inaktivitas (idle) atau token kedaluwarsa (401).
 * Mengizinkan user mengonfirmasi password akun mereka secara instan tanpa perlu reload
 * atau berpindah halaman sehingga pekerjaan/form yang sedang diedit tidak hilang.
 */
export default function ReloginModal({ isOpen, reason = "idle", onSuccess, onLogout }) {
    const { user, login } = useAuth();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen || !user) return null;

    const isIdle = reason === "idle";

    async function handleUnlock(e) {
        e.preventDefault();
        if (!password) {
            setError("Masukkan kata sandi akun Anda.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const rememberMe = isRememberMeActive();
            const res = await api.post("/auth/login", {
                username: user.username || user.email,
                email: user.email || user.username,
                password,
                rememberMe
            });

            // Update state sesi di AuthContext & Storage
            login(res.data.user, res.data.token, rememberMe);
            setPassword("");
            toast.success("Sesi berhasil dibuka kembali. Selamat melanjutkan pekerjaan!");

            if (onSuccess) {
                onSuccess(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Kata sandi tidak sesuai. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="relogin-title"
        >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
                {/* Header Decoration */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-6 text-white text-center relative">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3">
                        <Lock className="w-7 h-7 text-white" />
                    </div>
                    <h2 id="relogin-title" className="text-xl font-bold tracking-tight">
                        {isIdle ? "Sesi Terkunci Demi Keamanan" : "Sesi Anda Telah Berakhir"}
                    </h2>
                    <p className="text-blue-100 text-xs mt-1 max-w-xs mx-auto">
                        {isIdle 
                            ? "Sistem mendeteksi tidak ada aktivitas selama beberapa saat." 
                            : "Masa berlaku autentikasi akun Anda telah habis."}
                    </p>
                </div>

                {/* Body Content */}
                <div className="p-6">
                    {/* User Profile Card Summary */}
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl mb-5">
                        <UserAvatar 
                            src={user.foto_profile} 
                            nama={user.nama} 
                            size="lg" 
                            className="shadow-sm border border-slate-200" 
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-slate-900 truncate">{user.nama}</p>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-semibold uppercase tracking-wider bg-blue-100 text-blue-700">
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono truncate">@{user.username || (user.email ? user.email.split("@")[0] : "user")}</p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        Masukkan kata sandi Anda untuk melanjutkan bekerja tanpa kehilangan perubahan form atau progres saat ini.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2 animate-in fade-in duration-150">
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="relogin-password">
                                Kata Sandi Akun
                            </label>
                            <div className="relative">
                                <input
                                    id="relogin-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan kata sandi Anda"
                                    autoFocus
                                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Memverifikasi...</span>
                                </>
                            ) : (
                                <>
                                    <span>Buka Kunci Sesi</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-3xs text-slate-400">Bukan akun Anda?</span>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="text-xs font-semibold text-slate-600 hover:text-red-600 flex items-center gap-1.5 transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Ganti Akun / Keluar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

