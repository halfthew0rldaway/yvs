import { useState, useEffect, useContext, createContext, useCallback } from "react";
import {
    getAuthToken,
    getStoredUser,
    isRememberMeActive,
    setAuthSession,
    updateStoredUser,
    clearAuthSession
} from "../utils/authStorage";
import api from "../services/api";
import { offlineDataStore } from "../services/offlineDataStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => getStoredUser());
    const [token, setToken] = useState(() => getAuthToken());
    const [rememberMe, setRememberMe] = useState(() => isRememberMeActive());
    const [loading] = useState(false);

    // State untuk Lockscreen / Re-login Modal in-app
    const [isSessionLocked, setIsSessionLocked] = useState(false);
    const [lockReason, setLockReason] = useState("idle"); // "idle" | "expired" | "unauthorized"

    const lockSession = useCallback((reason = "idle") => {
        setLockReason(reason);
        setIsSessionLocked(true);
    }, []);

    const unlockSession = useCallback(() => {
        setIsSessionLocked(false);
    }, []);

    const login = useCallback((userData, userToken, remember = false) => {
        setAuthSession(userData, userToken, remember);
        setToken(userToken);
        setUser(userData);
        setRememberMe(remember);
        setIsSessionLocked(false);
    }, []);

    const logout = useCallback(() => {
        clearAuthSession();
        setToken(null);
        setUser(null);
        setIsSessionLocked(false);
    }, []);

    const updateUser = useCallback((updatedData) => {
        const previous = getStoredUser();
        const merged = updateStoredUser(updatedData);
        if (merged) {
            const revoked = previous?.id === merged.id && (
                (previous.is_super_admin && !merged.is_super_admin) ||
                (Array.isArray(previous.permissions) && previous.permissions.some(permission => !merged.permissions?.includes(permission)))
            );
            if (revoked) {
                api.clearMemoryCache();
                offlineDataStore.clearUserCache(merged.id).catch(() => {});
            }
            setUser(merged);
        }
    }, []);

    useEffect(() => {
        if (!token) return;
        let active = true;
        const refreshAccess = async () => {
            if (document.visibilityState !== "visible") return;
            try {
                const response = await api.get("/auth/me", { skipCache: true });
                if (active) updateUser(response.data);
            } catch (_) { /* API interceptor handles expired sessions; route guard fails closed. */ }
        };
        window.addEventListener("focus", refreshAccess);
        window.addEventListener("yvs:online", refreshAccess);
        document.addEventListener("visibilitychange", refreshAccess);
        const interval = window.setInterval(refreshAccess, 60000);
        return () => {
            active = false;
            window.removeEventListener("focus", refreshAccess);
            window.removeEventListener("yvs:online", refreshAccess);
            document.removeEventListener("visibilitychange", refreshAccess);
            window.clearInterval(interval);
        };
    }, [token, updateUser]);

    // Sinkronisasi status login/logout antar-tab browser via Storage Event
    useEffect(() => {
        function handleStorageChange(e) {
            if (e.key === "token" || e.key === "user") {
                const currentToken = getAuthToken();
                const currentUser = getStoredUser();

                setToken(currentToken);
                setUser(currentUser);

                if (!currentToken) {
                    setIsSessionLocked(false);
                }
            }
        }

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Tangkap custom event kedaluwarsa sesi dari interceptor axios API
    useEffect(() => {
        function handleSessionExpired(e) {
            const code = e.detail?.code;
            const reason = code === "TOKEN_EXPIRED" ? "expired" : "unauthorized";
            lockSession(reason);
        }

        window.addEventListener("yvs:session-expired", handleSessionExpired);
        return () => window.removeEventListener("yvs:session-expired", handleSessionExpired);
    }, [lockSession]);

    const value = {
        user,
        token,
        loading,
        rememberMe,
        login,
        logout,
        updateUser,
        isSessionLocked,
        lockReason,
        lockSession,
        unlockSession,
        hasPermission: (permission) => Boolean(user?.is_super_admin || user?.permissions?.includes(permission))
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        // Fallback jika dipanggil sebelum provider mount
        const storedUser = getStoredUser();
        const storedToken = getAuthToken();
        return {
            user: storedUser,
            token: storedToken,
            loading: false,
            rememberMe: isRememberMeActive(),
            login: () => {},
            logout: () => {},
            updateUser: () => {},
            isSessionLocked: false,
            lockReason: "idle",
            lockSession: () => {},
            unlockSession: () => {},
            hasPermission: (permission) => Boolean(storedUser?.is_super_admin || storedUser?.permissions?.includes(permission))
        };
    }
    return context;
}
