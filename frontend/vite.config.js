import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            injectRegister: null,
            registerType: "autoUpdate",
            includeAssets: [
                "favicon.ico",
                "logo-yangversa.png",
                "icons/Icon-192.png",
                "icons/Icon-512.png",
                "icons/Icon-maskable-192.png",
                "icons/Icon-maskable-512.png"
            ],
            manifest: {
                name: "YVS Computer • Serv.io Workshop",
                short_name: "YVS Computer",
                description: "Pusat Reparasi & Rekayasa Komputer - Sistem Manajemen Workshop & Servis",
                theme_color: "#2563eb",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait",
                scope: "/",
                start_url: "/dashboard",
                icons: [
                    {
                        src: "/icons/Icon-192.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "/icons/Icon-512.png",
                        sizes: "512x512",
                        type: "image/png"
                    },
                    {
                        src: "/icons/Icon-maskable-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "maskable"
                    },
                    {
                        src: "/icons/Icon-maskable-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ]
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                navigateFallback: "/index.html",
                navigateFallbackDenylist: [/^\/api\//, /^https:\/\/staging\.101\.32\.127\.55\.sslip\.io\/api\//],
                runtimeCaching: [
                    {
                        // Cache uploaded media (photos, avatars, documents) for offline view
                        urlPattern: /\/uploads\/.*\.(?:png|jpg|jpeg|webp|svg|gif)$/i,
                        handler: "StaleWhileRevalidate",
                        options: {
                            cacheName: "yvs-uploads-cache",
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // Cache Google Fonts stylesheets & webfonts
                        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                        handler: "StaleWhileRevalidate",
                        options: {
                            cacheName: "google-fonts-cache",
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            }
                        }
                    }
                ]
            }
        })
    ],
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
                        if (id.includes("recharts") || id.includes("d3-")) {
                            return "vendor-charts";
                        }
                        if (id.includes("html5-qrcode")) {
                            return "vendor-scanner";
                        }
                        if (id.includes("jspdf") || id.includes("html2canvas")) {
                            return "vendor-pdf";
                        }
                        if (id.includes("@capacitor")) {
                            return "vendor-capacitor";
                        }
                    }
                },
            },
        },
    },
});
