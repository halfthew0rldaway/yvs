import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { User, Mail, Lock, CheckCircle2, Shield } from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
    const { user, login } = useAuth(); // We can reuse login(user, token) to update context state if we keep token

    const [formData, setFormData] = useState({
        nama: user?.nama || "",
        email: user?.email || "",
        currentPassword: "",
        newPassword: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword && !formData.currentPassword) {
            return toast.error("Masukkan password lama Anda untuk mengubah password.");
        }

        setLoading(true);
        try {
            const res = await api.put("/auth/profile", formData);
            
            // Perbarui state global user. Token dari localStorage masih sama.
            const token = localStorage.getItem("token");
            if (token) {
                login(res.data.user, token);
            }
            
            toast.success("Profil berhasil diperbarui!");
            setFormData({ ...formData, currentPassword: "", newPassword: "" }); // Reset kolom password
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui profil.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Profil</h1>
                <p className="text-sm text-slate-500 mt-1">Sesuaikan informasi dasar dan keamanan akun Anda.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="md:flex">
                    {/* Sidebar Profile Info */}
                    <div className="md:w-1/3 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 ring-4 ring-white shadow-sm">
                            <span className="text-3xl font-bold">{user?.nama?.charAt(0).toUpperCase()}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 text-center">{user?.nama}</h2>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded-full bg-slate-200 text-xs font-semibold text-slate-700 capitalize">
                            <Shield className="w-3.5 h-3.5" /> {user?.role}
                        </div>
                    </div>

                    {/* Form Edit */}
                    <div className="md:w-2/3 p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Informasi Dasar */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Informasi Dasar</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="nama">
                                            Nama Lengkap
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <input
                                                id="nama"
                                                name="nama"
                                                type="text"
                                                required
                                                value={formData.nama}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                                            Alamat Email
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Keamanan */}
                            <div className="pt-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Ganti Password (Opsional)</h3>
                                <p className="text-xs text-slate-500 mb-4 -mt-2">Kosongkan bagian ini jika Anda tidak ingin mengubah password.</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="currentPassword">
                                            Password Lama
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <input
                                                id="currentPassword"
                                                name="currentPassword"
                                                type="password"
                                                value={formData.currentPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="newPassword">
                                            Password Baru
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <input
                                                id="newPassword"
                                                name="newPassword"
                                                type="password"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                placeholder="Minimal 6 karakter"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </button>
                            </div>
                            
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
