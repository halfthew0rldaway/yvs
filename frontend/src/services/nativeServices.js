import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { App as CapApp } from "@capacitor/app";
import { Share } from "@capacitor/share";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import toast from "react-hot-toast";
import { getStoredUser } from "../utils/authStorage";
import { landingRouteFor } from "../utils/landingRoute";

export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Service GPS / Geolocation
 * Native Capacitor Geolocation with HTML5 Geolocation browser fallback.
 */
export const LocationService = {
    async getCurrentPosition(options = {}) {
        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds for clean satellite / FusedLocation fix
            maximumAge: 0 // Fresh GPS fix - never use stale cached positions
        };
        const finalOptions = { ...defaultOptions, ...options };
        try {
            if (isNativePlatform()) {
                let perm = await Geolocation.checkPermissions();
                if (perm.location !== "granted") {
                    perm = await Geolocation.requestPermissions();
                    if (perm.location !== "granted") {
                        throw new Error("Izin akses lokasi (GPS) ditolak oleh pengguna.");
                    }
                }

                try {
                    // 1. High-accuracy real-time GPS
                    const pos = await Geolocation.getCurrentPosition(finalOptions);
                    return {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        altitude: pos.coords.altitude,
                        speed: pos.coords.speed,
                        timestamp: pos.timestamp
                    };
                } catch (gpsErr) {
                    // 2. Indoor / network triangulation fallback with fresh reading
                    console.warn("[LocationService] GPS high-accuracy timed out, falling back to network triangulation:", gpsErr);
                    const fallbackPos = await Geolocation.getCurrentPosition({
                        enableHighAccuracy: false,
                        timeout: 7000,
                        maximumAge: 10000
                    });
                    return {
                        latitude: fallbackPos.coords.latitude,
                        longitude: fallbackPos.coords.longitude,
                        accuracy: fallbackPos.coords.accuracy,
                        altitude: fallbackPos.coords.altitude,
                        speed: fallbackPos.coords.speed,
                        timestamp: fallbackPos.timestamp
                    };
                }
            } else {
                if (!navigator.geolocation) {
                    throw new Error("Fitur Geolocation tidak didukung oleh browser ini.");
                }

                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            resolve({
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude,
                                accuracy: pos.coords.accuracy,
                                altitude: pos.coords.altitude,
                                speed: pos.coords.speed,
                                timestamp: pos.timestamp
                            });
                        },
                        (err) => {
                            let msg = "Gagal mengambil sinyal GPS.";
                            if (err.code === 1) msg = "Izin lokasi ditolak oleh browser.";
                            else if (err.code === 2) msg = "Posisi tidak tersedia. Pastikan modul GPS aktif.";
                            else if (err.code === 3) msg = "Waktu pencarian GPS habis (timeout).";
                            reject(new Error(msg));
                        },
                        finalOptions
                    );
                });
            }
        } catch (err) {
            console.error("[LocationService] Error:", err);
            throw err;
        }
    },

    /**
     * Hitung jarak Haversine antara dua koordinat (dalam Meter)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371e3; // Radius bumi dalam meter
        const toRad = (deg) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }
};

/**
 * Service Kamera & Media
 * Native Capacitor Camera (Kamera HP & Galeri Foto) dengan Web Fallback.
 */
export const CameraService = {
    async requestCameraPermission() {
        if (isNativePlatform()) {
            try {
                let status = await Camera.checkPermissions();
                if (status.camera !== "granted" || status.photos !== "granted") {
                    status = await Camera.requestPermissions();
                }
                return status.camera === "granted" || status.photos === "granted";
            } catch (e) {
                console.warn("[CameraService] Permission check error:", e);
                return true;
            }
        }
        return true;
    },

    /**
     * Mengambil foto dari kamera native atau memilih dari galeri.
     * Mengembalikan objek File dan Base64 yang siap digunakan form upload.
     * 
     * @param {Object} options
     * @param {'CAMERA'|'PHOTOS'} options.source
     * @param {number} options.quality (1 - 100)
     * @param {boolean} options.allowEditing
     * @returns {Promise<{ file: File, blob: Blob, dataUrl: string, name: string }>}
     */
    async capturePhoto(options = { source: "CAMERA", quality: 90, allowEditing: false }) {
        const isPhotos = options.source === "PHOTOS";
        const source = isPhotos ? CameraSource.Photos : CameraSource.Camera;

        if (isNativePlatform()) {
            try {
                await this.requestCameraPermission();

                const image = await Camera.getPhoto({
                    quality: options.quality || 90,
                    allowEditing: options.allowEditing || false,
                    resultType: CameraResultType.Base64,
                    source: source,
                    correctOrientation: true,
                    promptLabelHeader: isPhotos ? "Pilih Foto dari Galeri" : "Ambil Foto dengan Kamera",
                    promptLabelCancel: "Batal",
                    promptLabelPhoto: "Dari Galeri",
                    promptLabelPicture: "Gunakan Kamera"
                });

                const format = image.format || "jpeg";
                const mimeType = `image/${format === "jpg" ? "jpeg" : format}`;
                const byteCharacters = atob(image.base64String);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                const fileName = `capture_${Date.now()}.${format}`;
                const file = new File([blob], fileName, { type: mimeType });
                const dataUrl = `data:${mimeType};base64,${image.base64String}`;

                return { file, blob, dataUrl, name: fileName };
            } catch (err) {
                if (err.message && err.message.includes("User cancelled")) {
                    throw new Error("Pengambilan foto dibatalkan.");
                }
                console.error("[CameraService] Native capture error:", err);
                throw err;
            }
        } else {
            // Web browser file picker fallback
            return new Promise((resolve, reject) => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                if (!isPhotos) {
                    input.capture = "environment";
                }
                input.onchange = (e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                        reject(new Error("Pengambilan foto dibatalkan."));
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve({
                            file,
                            blob: file,
                            dataUrl: reader.result,
                            name: file.name
                        });
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(file);
                };
                input.click();
            });
        }
    }
};

/**
 * Service Bluetooth LE & Hardware Scanner
 * Capacitor Bluetooth LE Native & Web Bluetooth fallback.
 */
export const BluetoothService = {
    initialized: false,

    async init() {
        if (this.initialized) return;
        try {
            if (isNativePlatform()) {
                await BleClient.initialize();
            }
            this.initialized = true;
        } catch (e) {
            console.warn("[BluetoothService] BleClient initialization warning:", e);
        }
    },

    /**
     * Cek apakah bluetooth aktif di ponsel / browser
     */
    async isEnabled() {
        try {
            await this.init();
            if (isNativePlatform()) {
                return await BleClient.isEnabled();
            } else if (navigator.bluetooth) {
                return await navigator.bluetooth.getAvailability();
            }
            return false;
        } catch (e) {
            console.warn("[BluetoothService] isEnabled check failed:", e);
            return false;
        }
    },

    /**
     * Minta pengguna mengaktifkan bluetooth
     */
    async requestEnable() {
        try {
            await this.init();
            if (isNativePlatform()) {
                await BleClient.requestEnable();
                return true;
            }
            return false;
        } catch (e) {
            console.warn("[BluetoothService] requestEnable failed:", e);
            return false;
        }
    },

    /**
     * Pindai perangkat Bluetooth LE terdekat
     * @param {number} timeoutMs Durasi pemindaian (ms)
     */
    async scanDevices(timeoutMs = 6000) {
        await this.init();
        const discovered = new Map();

        if (isNativePlatform()) {
            try {
                const enabled = await BleClient.isEnabled();
                if (!enabled) {
                    await BleClient.requestEnable();
                }

                await BleClient.requestLEScan({}, (result) => {
                    const id = result.device?.deviceId || result.localName || `dev_${Math.random()}`;
                    discovered.set(id, {
                        deviceId: result.device?.deviceId || id,
                        name: result.localName || result.device?.name || "Perangkat Tanpa Nama",
                        rssi: result.rssi ?? null,
                        uuids: result.uuids || []
                    });
                });

                await new Promise((resolve) => setTimeout(resolve, timeoutMs));
                await BleClient.stopLEScan();

                return Array.from(discovered.values());
            } catch (err) {
                try {
                    await BleClient.stopLEScan();
                } catch (_) {}
                throw err;
            }
        } else if (navigator.bluetooth) {
            try {
                const device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true
                });
                return [
                    {
                        deviceId: device.id,
                        name: device.name || "Perangkat Bluetooth",
                        rssi: null,
                        uuids: []
                    }
                ];
            } catch (err) {
                if (err.name === "NotFoundError") {
                    return [];
                }
                throw err;
            }
        } else {
            throw new Error("Bluetooth API tidak didukung pada browser/platform ini.");
        }
    },

    /**
     * Hubungkan ke perangkat Bluetooth
     */
    async connect(deviceId, onDisconnect) {
        await this.init();
        if (isNativePlatform()) {
            await BleClient.connect(deviceId, onDisconnect);
            return true;
        }
        return false;
    },

    /**
     * Putuskan koneksi Bluetooth
     */
    async disconnect(deviceId) {
        await this.init();
        if (isNativePlatform()) {
            await BleClient.disconnect(deviceId);
            return true;
        }
        return false;
    }
};

/**
 * Service Device & System Navigation (Status Bar, Keyboard, Hardware Back Button)
 */
export const DeviceService = {
    lastBackPressTime: 0,

    init() {
        if (!isNativePlatform()) return;

        // 1. Status Bar Setup: Prevent overlapping WebView and keep icons crisp dark on light theme
        try {
            StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
            StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
            StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => {});
        } catch (e) {
            console.warn("[DeviceService] StatusBar setup warning:", e);
        }

        // 2. Keyboard Setup: Prevent layout clipping
        try {
            Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
        } catch (e) {
            console.warn("[DeviceService] Keyboard setup warning:", e);
        }

        // 3. Hardware Back Button Handling
        try {
            CapApp.addListener("backButton", ({ canGoBack }) => {
                // Check if any modal is currently visible on the screen
                const modal = document.querySelector(".modal-shell, [role='dialog'], [data-modal='true']");
                if (modal) {
                    // Trigger close on the modal's close button if available
                    const closeBtn = modal.querySelector("button[aria-label='Close'], button.modal-close, button[title*='Tutup']");
                    if (closeBtn) {
                        closeBtn.click();
                        return;
                    }
                }

                // If browser history has items, navigate back
                const landingPath = landingRouteFor(getStoredUser());
                if (canGoBack && window.location.pathname !== landingPath && window.location.pathname !== "/login") {
                    window.history.back();
                    return;
                }

                // Double tap to exit when at root
                const now = Date.now();
                if (now - this.lastBackPressTime < 2000) {
                    CapApp.exitApp();
                } else {
                    this.lastBackPressTime = now;
                    toast("Tekan sekali lagi untuk keluar dari aplikasi", {
                        id: "back-exit-toast",
                        duration: 2000,
                        icon: "📱"
                    });
                }
            }).catch(() => {});
        } catch (e) {
            console.warn("[DeviceService] BackButton listener warning:", e);
        }
    },

    /**
     * Trigger tactile haptic feedback
     */
    async triggerHaptic(style = ImpactStyle.Light) {
        if (isNativePlatform()) {
            try {
                await Haptics.impact({ style });
            } catch (_) {}
        }
    },

    /**
     * Native Share Dialog
     */
    async shareContent(title, text, url) {
        if (isNativePlatform()) {
            try {
                await Share.share({ title, text, url });
                return true;
            } catch (err) {
                if (err.message && err.message.includes("cancelled")) return false;
                throw err;
            }
        } else if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return true;
            } catch (_) {
                return false;
            }
        }
        return false;
    }
};

export default {
    LocationService,
    CameraService,
    BluetoothService,
    DeviceService,
    isNativePlatform
};
