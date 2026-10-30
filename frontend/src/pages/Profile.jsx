import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { 
    User, 
    Mail, 
    Lock, 
    CheckCircle2, 
    Shield, 
    Camera, 
    Trash2, 
    Upload, 
    RefreshCw,
    Wrench,
    ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import UserAvatar from "../components/common/UserAvatar";

export default function Profile() {
    const { user, updateUser, login } = useAuth();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        nama: user?.nama || "",
        email: user?.email || "",
        currentPassword: "",
        newPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [removingPhoto, setRemovingPhoto] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Format file harus berupa gambar JPG, PNG, atau WEBP.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran foto maksimal adalah 5 MB.");
            return;
        }

        const data = new FormData();
        data.append("foto_profile", file);

        setUploadingPhoto(true);
        try {
            const res = await api.post("/auth/profile/photo", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data?.user) {
                updateUser(res.data.user);
            }
            toast.success("Foto profil berhasil diperbarui!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengunggah foto profil.");
        } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemovePhoto = async () => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus foto profil dan kembali ke avatar inisial?")) return;

        setRemovingPhoto(true);
        try {
            const res = await api.delete("/auth/profile/photo");
            if (res.data?.user) {
                updateUser(res.data.user);
            }
            toast.success("Foto profil berhasil dihapus.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus foto profil.");
        } finally {
            setRemovingPhoto(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword && !formData.currentPassword) {
            return toast.error("Masukkan password lama Anda untuk mengubah password.");
        }
        if (formData.currentPassword && !formData.newPassword) {
            return toast.error("Masukkan password baru Anda.");
        }

        setLoading(true);
        try {
            const res = await api.put("/auth/profile", formData);
            
            // Perbarui state global user
            const token = localStorage.getItem("token");
            if (token && res.data?.user) {
                login(res.data.user, token);
            }
            
            toast.success("Profil berhasil diperbarui!");
            setFormData({ ...formData, currentPassword: "", newPassword: "" });
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui profil.");
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = user?.role === "admin";

    return (
        <div className="w-full space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Profil</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Sesuaikan identitas diri, foto profil, dan keamanan kredensial akun Anda di Serv.io.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="md:flex">
                    
                    {/* Sidebar Profile Card & Avatar Uploader */}
                    <div className="md:w-80 bg-slate-50/80 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col items-center justify-center text-center">
                        
                        {/* Interactive Avatar Wrapper */}
                        <div className="relative group mb-4">
                            <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-md bg-white flex items-center justify-center">
                                {uploadingPhoto ? (
                                    <div className="w-full h-full bg-slate-900/60 flex flex-col items-center justify-center text-white gap-1.5">
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span className="text-3xs font-semibold">Mengunggah...</span>
                                    </div>
                                ) : (
                                    <UserAvatar 
                                        user={user} 
                                        size="w-28 h-28" 
                                        textSize="text-4xl" 
                                        rounded="rounded-full" 
                                    />
                                )}
                            </div>

                            {/* Camera overlay button on hover */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto || removingPhoto}
                                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-md border-2 border-white transition-all cursor-pointer"
                                title="Ubah Foto Profil"
                            >
                                <Camera className="w-4 h-4" />
                            </button>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handlePhotoSelect}
                            />
                        </div>

                        {/* Action buttons for Avatar */}
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto || removingPhoto}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                                <Upload className="w-3.5 h-3.5 text-blue-600" />
                                <span>Ganti Foto</span>
                            </button>

                            {user?.foto_profile && (
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    disabled={uploadingPhoto || removingPhoto}
                                    className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                    title="Hapus Foto Profil"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <p className="text-3xs text-slate-400 max-w-[200px] mb-4">
                            Format JPG, PNG, atau WEBP. Maksimal 5 MB.
                        </p>

                        <h2 className="text-base sm:text-lg font-bold text-slate-900 break-words max-w-full">
                            {user?.nama}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mt-0.5 break-all">
                            {user?.email}
                        </p>

                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full text-xs font-semibold border ${
                            isAdmin 
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                                : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                            <span className="capitalize">{user?.role}</span>
                        </div>
                    </div>

                    {/* Form Edit */}
                    <div className="flex-1 p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Informasi Dasar */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                    Informasi Dasar
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="nama">
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
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">
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
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Keamanan Password */}
                            <div className="pt-2">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                                    Ganti Password (Opsional)
                                </h3>
                                <p className="text-2xs text-slate-500 mb-4">
                                    Kosongkan bagian ini jika Anda tidak ingin mengubah password masuk akun.
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="currentPassword">
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
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="newPassword">
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
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Simpan Perubahan</span>
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
