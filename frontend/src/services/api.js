import axios from "axios";
import { getAuthToken, updateLastActive } from "../utils/authStorage";

const api = axios.create({
    baseURL: "/api",
});

// Sertakan token di setiap request & catat aktivitas
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Setiap request API autentikasi menandakan user sedang aktif
        updateLastActive();
    }
    return config;
});

// Handle response error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || "";

        // Jangan tangani 401 jika request sengaja ditujukan ke endpoint login
        const isLoginRequest = url.includes("/auth/login");

        if (status === 401 && !isLoginRequest) {
            const errorCode = error.response?.data?.code || "UNAUTHORIZED";
            const errorMessage = error.response?.data?.message || "Sesi login Anda telah berakhir.";

            // Pancarkan event global agar Re-login Modal in-app terbuka tanpa reload paksa
            if (typeof window !== "undefined") {
                const isAuthPage = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/tracking");
                if (!isAuthPage) {
                    window.dispatchEvent(
                        new CustomEvent("yvs:session-expired", {
                            detail: {
                                code: errorCode,
                                message: errorMessage,
                                url
                            }
                        })
                    );
                }
            }
        }

        // Tangkap error validasi dari backend dan format pesannya agar UI bisa langsung menampilkannya di Toast
        if (status === 400 && error.response?.data?.errors) {
            const errorList = error.response.data.errors.map((e) => e.message).join("\n• ");
            error.response.data.message = `Data tidak sesuai:\n• ${errorList}`;
        }

        return Promise.reject(error);
    }
);

export default api;
