import axios from "axios";

const api = axios.create({
    baseURL: "/api",
});

// Sertakan token di setiap request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }

        // Tangkap error validasi dari backend dan format pesannya agar UI bisa langsung menampilkannya di Toast
        if (error.response?.status === 400 && error.response.data?.errors) {
            const errorList = error.response.data.errors.map((e) => e.message).join("\n• ");
            error.response.data.message = `Data tidak sesuai:\n• ${errorList}`;
        }

        return Promise.reject(error);
    }
);

export default api;
