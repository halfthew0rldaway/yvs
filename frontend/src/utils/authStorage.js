/**
 * Centralized Authentication Storage Manager
 * 
 * Mengelola penyimpanan kredensial autentikasi (token, profil user, & status "Ingat Saya")
 * dengan pemisahan penyimpanan yang aman & terstandarisasi:
 * - Ingat Saya AKTIF: Disimpan di localStorage (awet antar sesi/restart browser, masa aktif JWT panjang)
 * - Ingat Saya NON-AKTIF: Disimpan di sessionStorage (otomatis terhapus saat tab/browser ditutup)
 */

const TOKEN_KEY = "token";
const USER_KEY = "user";
const REMEMBER_ME_KEY = "yvs_remember_me";
const REMEMBERED_USERNAME_KEY = "yvs_remembered_username";
const REMEMBERED_EMAIL_KEY = "yvs_remembered_email";
const LAST_ACTIVE_KEY = "yvs_last_active";

/**
 * Mengambil token autentikasi (cek localStorage terlebih dahulu, lalu sessionStorage)
 */
export function getAuthToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
    } catch {
        return null;
    }
}

/**
 * Mengambil data profil user tersimpan
 */
export function getStoredUser() {
    try {
        const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Cek apakah mode "Ingat Saya" aktif untuk sesi saat ini
 */
export function isRememberMeActive() {
    try {
        const isPersistent = localStorage.getItem(REMEMBER_ME_KEY) === "true";
        if (isPersistent) return true;
        // Jika token ada di localStorage tapi kunci belum ada (migrasi backward compatibility)
        if (localStorage.getItem(TOKEN_KEY)) return true;
        return false;
    } catch {
        return false;
    }
}

/**
 * Ambil username yang diingat untuk autofill form login
 * (Secara otomatis mengonversi email lama di browser user menjadi username murni)
 */
export function getRememberedUsername() {
    try {
        const stored = localStorage.getItem(REMEMBERED_USERNAME_KEY) || localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
        if (!stored) return "";
        // Jika masih format email lama (cth: admin@workshop.com), otomatis migrasi ke username (admin)
        if (stored.includes("@")) {
            const converted = stored.split("@")[0].trim().toLowerCase();
            localStorage.setItem(REMEMBERED_USERNAME_KEY, converted);
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            return converted;
        }
        return stored;
    } catch {
        return "";
    }
}
export const getRememberedEmail = getRememberedUsername;

/**
 * Simpan atau hapus username yang diingat
 */
export function setRememberedUsername(username) {
    try {
        if (username && username.trim()) {
            let clean = username.trim().toLowerCase();
            if (clean.includes("@")) {
                clean = clean.split("@")[0];
            }
            localStorage.setItem(REMEMBERED_USERNAME_KEY, clean);
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        } else {
            localStorage.removeItem(REMEMBERED_USERNAME_KEY);
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
    } catch {
        // Abaikan error kuota/privasi storage
    }
}
export const setRememberedEmail = setRememberedUsername;

/**
 * Menyimpan sesi login baru
 * @param {object} userData Data profil user
 * @param {string} token JWT token
 * @param {boolean} rememberMe Status centang "Ingat Saya"
 */
export function setAuthSession(userData, token, rememberMe = false) {
    try {
        if (rememberMe) {
            // Mode Persisten (localStorage)
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            localStorage.setItem(REMEMBER_ME_KEY, "true");

            // Bersihkan sisa sesi sementara di sessionStorage
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);
            sessionStorage.removeItem(REMEMBER_ME_KEY);
        } else {
            // Mode Sesi Sementara (sessionStorage: hilang saat browser/tab ditutup)
            sessionStorage.setItem(TOKEN_KEY, token);
            sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
            sessionStorage.setItem(REMEMBER_ME_KEY, "false");

            // Bersihkan sisa sesi persisten di localStorage
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(REMEMBER_ME_KEY);
        }

        updateLastActive();
    } catch (err) {
        console.error("Gagal menyimpan sesi autentikasi ke storage:", err);
    }
}

/**
 * Memperbarui data profil user yang tersimpan tanpa mengubah token / storage type
 */
export function updateStoredUser(updatedData) {
    try {
        const currentUser = getStoredUser() || {};
        const merged = { ...currentUser, ...updatedData };

        if (localStorage.getItem(TOKEN_KEY)) {
            localStorage.setItem(USER_KEY, JSON.stringify(merged));
        }
        if (sessionStorage.getItem(TOKEN_KEY)) {
            sessionStorage.setItem(USER_KEY, JSON.stringify(merged));
        }
        return merged;
    } catch {
        return null;
    }
}

/**
 * Memperbarui token autentikasi (misal setelah refresh sesi atau re-login)
 */
export function updateAuthToken(newToken) {
    try {
        if (localStorage.getItem(TOKEN_KEY)) {
            localStorage.setItem(TOKEN_KEY, newToken);
        }
        if (sessionStorage.getItem(TOKEN_KEY)) {
            sessionStorage.setItem(TOKEN_KEY, newToken);
        }
        updateLastActive();
    } catch {
        // Abaikan
    }
}

/**
 * Menghapus seluruh sesi autentikasi dari localStorage & sessionStorage
 * (Mempertahankan email yang diingat untuk kemudahan login berikutnya jika ada)
 */
export function clearAuthSession() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(LAST_ACTIVE_KEY);

        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(REMEMBER_ME_KEY);
    } catch {
        // Abaikan
    }
}

/**
 * Mengambil timestamp waktu aktivitas terakhir
 */
export function getLastActive() {
    try {
        const val = localStorage.getItem(LAST_ACTIVE_KEY);
        return val ? parseInt(val, 10) : Date.now();
    } catch {
        return Date.now();
    }
}

/**
 * Memperbarui timestamp waktu aktivitas terakhir (disimpan di localStorage agar tersinkron antar tab)
 */
export function updateLastActive() {
    try {
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    } catch {
        // Abaikan
    }
}

