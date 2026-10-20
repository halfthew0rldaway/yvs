import { useState, useContext, createContext } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || null;
    });

    const [loading] = useState(false);

    function login(userData, userToken) {
        localStorage.setItem("token", userToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAdmin: user?.role === "admin",
        isTeknisi: user?.role === "teknisi"
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        // Fallback for isolated usages before context mounted
        try {
            const storedUser = localStorage.getItem("user");
            const parsedUser = storedUser ? JSON.parse(storedUser) : null;
            const storedToken = localStorage.getItem("token") || null;
            return {
                user: parsedUser,
                token: storedToken,
                loading: false,
                login: () => {},
                logout: () => {},
                isAdmin: parsedUser?.role === "admin",
                isTeknisi: parsedUser?.role === "teknisi"
            };
        } catch {
            return {
                user: null,
                token: null,
                loading: false,
                login: () => {},
                logout: () => {},
                isAdmin: false,
                isTeknisi: false
            };
        }
    }
    return context;
}
