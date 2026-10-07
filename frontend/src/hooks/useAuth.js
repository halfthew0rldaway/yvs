import { useState, useEffect } from "react";

export function useAuth() {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });
    
    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || null;
    });
    
    const [loading, setLoading] = useState(false);

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

    return { user, token, loading, login, logout, isAdmin: user?.role === "admin", isTeknisi: user?.role === "teknisi" };
}
