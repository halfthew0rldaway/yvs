import { useState } from "react";

/**
 * Reusable UserAvatar component for Admin & Teknisi with automatic image error fallback
 */
export default function UserAvatar({ 
    user, 
    size = "w-9 h-9", 
    textSize = "text-xs", 
    rounded = "rounded-xl",
    className = "" 
}) {
    const [imgError, setImgError] = useState(false);
    const hasPhoto = Boolean(user?.foto_profile) && !imgError;
    const photoUrl = user?.foto_profile?.startsWith("http")
        ? user.foto_profile
        : user?.foto_profile
            ? `/${user.foto_profile.replace(/^\/+/, "")}`
            : "";

    if (hasPhoto) {
        return (
            <img
                src={photoUrl}
                alt={user?.nama || "User"}
                onError={() => setImgError(true)}
                className={`${size} ${rounded} object-cover border border-slate-200/90 shadow-2xs shrink-0 ${className}`}
            />
        );
    }

    const initial = (user?.nama?.trim()?.charAt(0) || "U").toUpperCase();
    const isAdmin = user?.role === "admin";

    return (
        <div 
            className={`${size} ${rounded} ${
                isAdmin ? "bg-indigo-600 text-white" : "bg-blue-600 text-white"
            } flex items-center justify-center font-bold ${textSize} shadow-2xs shrink-0 select-none ${className}`}
        >
            {initial}
        </div>
    );
}

