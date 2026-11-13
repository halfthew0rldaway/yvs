import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { getRememberedUsername, setRememberedUsername } from "../utils/authStorage";
import { landingRouteFor } from "../utils/landingRoute";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { Eye, EyeOff, Lock, User, Wrench, Shield, CheckCircle2, ArrowRight, ShieldCheck, Clock, AlertCircle, Download } from "lucide-react";
import AppConfig from "../services/config";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Check query params for session expiration & redirect path
    const isExpired = searchParams.get("expired") === "true";
    const expireReason = searchParams.get("reason");
    const requestedRedirect = searchParams.get("redirect");
    const redirectUrl = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//") ? requestedRedirect : null;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [lottieData, setLottieData] = useState(null);

    // Load saved username on mount
    useEffect(() => {
        const savedUsername = getRememberedUsername();
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    // Fetch Lottie animation data on mount
    useEffect(() => {
        fetch("https://assets2.lottiefiles.com/packages/lf20_ucbyrun5.json")
            .then((res) => res.json())
            .then((data) => setLottieData(data))
            .catch((err) => console.error("Failed to load Lottie animation", err));
    }, []);

    if (user) {
        return <Navigate to={redirectUrl || landingRouteFor(user)} replace />;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const cleanUser = username.trim();
            const res = await api.post("/auth/login", { 
                username: cleanUser, 
                password, 
                rememberMe 
            });

            // Simpan / perbarui preferensi remembered username
            if (rememberMe) {
                setRememberedUsername(username.trim());
            } else {
                setRememberedUsername("");
            }

            // Simpan sesi autentikasi dengan preferensi "Ingat Saya"
            login(res.data.user, res.data.token, rememberMe);
            navigate(redirectUrl || landingRouteFor(res.data.user), { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Kredensial tidak valid. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    // Fungsi bantu cepat isi akun demo
    function handleSelectDemoAccount(demoUsername, customPassword) {
        setUsername(demoUsername);
        setPassword(customPassword || "password123");
        setError("");
    }

    // Framer Motion Variants for staggered entry
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen flex w-full bg-white overflow-hidden font-sans">
            
            {/* Left Column - Form */}
            <div className="w-full lg:w-[50%] xl:w-[45%] flex flex-col justify-between px-5 sm:px-16 md:px-24 py-8 sm:py-12 z-10 relative bg-white border-r border-slate-100 shadow-[10px_0_40px_rgba(0,0,0,0.02)] min-h-screen">
                
                {/* Logo Area */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 block leading-none">Serv.io</span>
                        <span className="text-2xs font-medium text-slate-500 uppercase tracking-wider">Management System</span>
                    </div>
                </motion.div>

                {/* Form Area */}
                <motion.div 
                    className="w-full max-w-[400px] mx-auto my-auto py-10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="mb-6">
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">
                            Selamat Datang
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Masukkan kredensial Anda untuk masuk ke sistem.
                        </p>
                    </motion.div>

                    {/* Banner Pemberitahuan Sesi Kedaluwarsa / Timeout */}
                    {(isExpired || expireReason) && (
                        <motion.div 
                            variants={itemVariants}
                            className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-xs"
                        >
                            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-800">
                                    {expireReason === "idle" ? "Sesi Berakhir Karena Tidak Ada Aktivitas" : "Sesi Telah Berakhir"}
                                </p>
                                <p className="text-amber-700 mt-0.5 leading-relaxed">
                                    Demi keamanan sistem & data servis, silakan masuk kembali untuk melanjutkan.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-3 overflow-hidden shadow-xs"
                        >
                            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <motion.div variants={itemVariants}>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="username">
                                Username
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <User className="h-4 w-4" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Username atau email kerja"
                                    required
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck="false"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">
                                Kata Sandi
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-blue-600 transition-colors"
                                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </motion.div>

                        {/* Remember Me Checkbox (Interaktif & Best-Practice) */}
                        <motion.div variants={itemVariants} className="pt-1">
                            <label htmlFor="rememberMe" className="flex items-start gap-2.5 cursor-pointer group select-none">
                                <div className="relative flex items-center justify-center mt-0.5">
                                    <input 
                                        id="rememberMe"
                                        type="checkbox" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="peer sr-only" 
                                    />
                                    <div className="w-4 h-4 border border-slate-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/30 transition-all"></div>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white absolute inset-0 m-auto opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors block">
                                        Ingat saya di perangkat ini
                                    </span>
                                    <span className="text-3xs text-slate-400 block mt-0.5">
                                        Simpan sesi hingga 30 hari. Jangan centang jika di komputer umum/bersama.
                                    </span>
                                </div>
                            </label>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-[3px] focus:ring-blue-500/30 outline-none mt-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Masuk ke Sistem</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Akun Demo Cepat Klik */}
                    <motion.div variants={itemVariants} className="mt-7 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600"/> Akun Demo (Klik untuk Isi Cepat)
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleSelectDemoAccount("arni", "ownerArni2026!")}
                                className="text-left px-2 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors group cursor-pointer"
                            >
                                <span className="block text-3xs font-semibold text-slate-700 group-hover:text-blue-700">Owner Staging (Ibu Arni)</span>
                                <span className="block text-3xs font-semibold text-slate-700 group-hover:text-blue-700">Owner (Ibu Arni)</span>
                                <span className="block font-mono text-3xs text-blue-600 truncate">arni</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectDemoAccount("vivero", "ownerVivero2026!")}
                                className="text-left px-2 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors group cursor-pointer"
                            >
                                <span className="block text-3xs font-semibold text-slate-700 group-hover:text-blue-700">Owner Staging (Bpk. Vivero)</span>
                                <span className="block text-3xs font-semibold text-slate-700 group-hover:text-blue-700">Owner (Bpk. Vivero)</span>
                                <span className="block font-mono text-3xs text-blue-600 truncate">vivero</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectDemoAccount("admin")}
                                className="text-left px-2 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors group cursor-pointer"
                            >
                                <span className="block text-3xs font-semibold text-slate-700 group-hover:text-blue-700">Admin Operasional</span>
                                <span className="block font-mono text-3xs text-slate-400 truncate">admin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectDemoAccount("siti")}
                                className="text-left px-2 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors group cursor-pointer"
                            >
                                <span className="block text-3xs font-semibold text-slate-700 group-hover:text-blue-700">Service Advisor (Siti)</span>
                                <span className="block font-mono text-3xs text-slate-400 truncate">siti</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectDemoAccount("teknisi1")}
                                className="text-left px-2 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors group cursor-pointer"
                            >
                                <span className="block text-3xs font-semibold text-slate-700 group-hover:text-blue-700">Teknisi 1 (Budi)</span>
                                <span className="block font-mono text-3xs text-slate-400 truncate">teknisi1</span>
                            </button>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/70 text-3xs text-slate-400">
                            Kata sandi default: <span className="font-mono text-slate-600 font-semibold">password123</span>
                        </div>
                    </motion.div>
                    {!AppConfig.isNative && (
                        <motion.div variants={itemVariants} className="mt-4 text-center">
                            <Link to="/download" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700">
                                <Download size={14} /> Unduh aplikasi Android / pasang PWA
                            </Link>
                        </motion.div>
                    )}
                </motion.div>

                {/* Footer text */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-xs text-slate-400 font-medium"
                >
                    &copy; {new Date().getFullYear()} Serv.io v1.0.0. Hak Cipta Dilindungi.
                </motion.div>
            </div>

            {/* Right Column - Illustration / Hero */}
            <div className="hidden lg:flex w-[50%] xl:w-[55%] relative bg-slate-50 items-center justify-center p-12 overflow-hidden">
                
                {/* Subtle Grid Background */}
                <div 
                    className="absolute inset-0 z-0 opacity-[0.03]"
                    style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
                    }}
                />
                
                <div className="absolute inset-0 bg-slate-50 z-0" />

                {/* Content */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 w-full max-w-lg flex flex-col items-center text-center"
                >
                    <div className="w-[80%] max-w-[420px] aspect-square mb-8 relative flex items-center justify-center">
                        {lottieData ? (
                            <Lottie 
                                animationData={lottieData} 
                                loop={true}
                                className="w-full h-full opacity-90"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center rounded-2xl animate-pulse bg-slate-200/30">
                                <Shield className="w-16 h-16 text-slate-300 mb-4" />
                                <span className="text-sm text-slate-400">Menyiapkan koneksi aman...</span>
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
                        Manajemen Servis Profesional
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-[400px]">
                        Optimalkan alur kerja servis, kelola inventaris sparepart, dan pantau hasil diagnosis secara terpusat dan aman.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
