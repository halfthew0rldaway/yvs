import { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { Eye, EyeOff, Lock, Mail, Wrench, Shield, CheckCircle2, ArrowRight, ShieldCheck, Server } from "lucide-react";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [lottieData, setLottieData] = useState(null);

    // Fetch Lottie animation data on mount
    useEffect(() => {
        fetch("https://assets2.lottiefiles.com/packages/lf20_ucbyrun5.json")
            .then((res) => res.json())
            .then((data) => setLottieData(data))
            .catch((err) => console.error("Failed to load Lottie animation", err));
    }, []);

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("/auth/login", { email, password });
            login(res.data.user, res.data.token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Kredensial tidak valid. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    // Framer Motion Variants for staggered entry
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen flex w-full bg-white overflow-hidden font-sans">
            
            {/* Left Column - Form */}
            <div className="w-full lg:w-[50%] xl:w-[45%] flex flex-col justify-between px-8 sm:px-16 md:px-24 py-12 z-10 relative bg-white border-r border-slate-100 shadow-[10px_0_40px_rgba(0,0,0,0.02)]">
                
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
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Management System</span>
                    </div>
                </motion.div>

                {/* Form Area */}
                <motion.div 
                    className="w-full max-w-[400px] mx-auto my-auto py-12"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">
                            Selamat Datang
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Masukkan kredensial Anda untuk masuk ke sistem.
                        </p>
                    </motion.div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                            className="bg-red-50/80 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-3 overflow-hidden"
                        >
                            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                                Alamat Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="admin@workshop.com"
                                    required
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">
                                Kata Sandi
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
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

                        <motion.div variants={itemVariants} className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer sr-only" />
                                    <div className="w-4 h-4 border border-slate-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                                    <CheckCircle2 className="w-3 h-3 text-white absolute left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                </div>
                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Ingat saya</span>
                            </label>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-[3px] focus:ring-blue-500/30 outline-none"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Masuk <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <motion.div variants={itemVariants} className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500">
                        <p className="font-medium text-slate-700 mb-1.5 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3"/> Akun Demo</p>
                        <div className="flex flex-col gap-1.5">
                            <span className="flex justify-between items-center"><span>Admin:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">admin@workshop.com</span></span>
                            <span className="flex justify-between items-center"><span>Teknisi 1:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">teknisi1@workshop.com</span></span>
                            <span className="flex justify-between items-center"><span>Teknisi 2:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">teknisi2@workshop.com</span></span>
                            <span className="flex justify-between items-center"><span>Teknisi 3:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">teknisi3@workshop.com</span></span>
                            <div className="h-px bg-slate-200 my-0.5"></div>
                            <span className="text-[10px] text-slate-400 font-medium">Password untuk semua akun: <span className="text-slate-600 font-mono">password123</span></span>
                        </div>
                    </motion.div>
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
                
                {/* Radial Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-slate-100/50 to-slate-200/20 z-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] z-0 pointer-events-none" />

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
                                className="w-full h-full drop-shadow-2xl opacity-90"
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
                    <p className="text-slate-600 text-[15px] leading-relaxed max-w-[400px]">
                        Optimalkan alur kerja servis, kelola inventaris sparepart, dan pantau hasil diagnosis secara terpusat dan aman.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
