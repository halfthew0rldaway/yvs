import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:5001",
                changeOrigin: true,
            },
            "/uploads": {
                target: "http://localhost:5001",
                changeOrigin: true,
            },
        },
    },
    build: {
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        if (id.includes("xlsx")) {
                            return "vendor-xlsx";
                        }
                        if (id.includes("react-dom") || id.includes("react-router-dom") || id.includes("react/")) {
                            return "vendor-react";
                        }
                        if (id.includes("lucide-react")) {
                            return "vendor-icons";
                        }
                    }
                },
            },
        },
    },
});
