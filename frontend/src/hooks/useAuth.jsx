import { useState, useEffect, useContext, createContext, useCallback } from "react";
import {
    getAuthToken,
    getStoredUser,
    isRememberMeActive,
    setAuthSession,
    updateStoredUser,
    clearAuthSession
} from "../utils/authStorage";

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
        const merged = updateStoredUser(updatedData);
        if (merged) {
            setUser(merged);
        }
    }, []);

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
        isAdmin: user?.role === "admin",
        isTeknisi: user?.role === "teknisi"
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
            isAdmin: storedUser?.role === "admin",
            isTeknisi: storedUser?.role === "teknisi"
        };
    }
    return context;
}
