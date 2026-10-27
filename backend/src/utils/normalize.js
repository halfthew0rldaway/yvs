/**
 * Normalization & Standardization Utility
 * Pusat normalisasi data untuk menjamin konsistensi & mencegah redundansi di database.
 */

// Kamus kanonikal merek teknologi & komputer global
const BRAND_CANONICAL_MAP = {
    // All-Caps Acronyms & Brands
    "asus": "ASUS",
    "hp": "HP",
    "msi": "MSI",
    "lg": "LG",
    "ibm": "IBM",
    "nec": "NEC",
    "aoc": "AOC",
    "wd": "WD",
    "ecs": "ECS",
    "palit": "Palit",
    "zotac": "ZOTAC",
    "evga": "EVGA",
    "nzxt": "NZXT",
    "xfx": "XFX",

    // Title-Case PC / Laptop Manufacturers
    "lenovo": "Lenovo",
    "acer": "Acer",
    "dell": "Dell",
    "apple": "Apple",
    "macbook": "Apple",
    "samsung": "Samsung",
    "toshiba": "Toshiba",
    "dynabook": "Dynabook",
    "sony": "Sony",
    "vaio": "VAIO",
    "fujitsu": "Fujitsu",
    "panasonic": "Panasonic",
    "microsoft": "Microsoft",
    "surface": "Microsoft",
    "google": "Google",
    "razer": "Razer",
    "gigabyte": "Gigabyte",
    "aorus": "Gigabyte",
    "alienware": "Alienware",
    "huawei": "Huawei",
    "xiaomi": "Xiaomi",
    "redmibook": "Xiaomi",
    "honor": "Honor",
    "realme": "Realme",

    // Indonesian / Regional Brands
    "zyrex": "Zyrex",
    "axioo": "Axioo",
    "advan": "Advan",
    "avita": "Avita",

    // Printers & Peripherals
    "epson": "Epson",
    "canon": "Canon",
    "brother": "Brother",
    "xerox": "Xerox",
    "fuji xerox": "Fuji Xerox",
    "ricoh": "Ricoh",
    "kyocera": "Kyocera",
    "logitech": "Logitech",
    "corsair": "Corsair",
    "steelseries": "SteelSeries",

    // Storage & Components
    "kingston": "Kingston",
    "seagate": "Seagate",
    "western digital": "Western Digital",
    "sandisk": "SanDisk",
    "adata": "ADATA",
    "v-gen": "V-Gen",
    "vgen": "V-Gen",
    "teamgroup": "TeamGroup",
    "team": "TeamGroup",
    "klevv": "KLEVV",
    "lexar": "Lexar",
    "crucial": "Crucial",
    "transcend": "Transcend",
    "patriot": "Patriot",
    "apacer": "Apacer",
    "pny": "PNY",
    "asrock": "ASRock"
};

// Standarisasi Kategori / Jenis Perangkat
const DEVICE_TYPE_CANONICAL_MAP = {
    "laptop": "Laptop",
    "notebook": "Laptop",
    "netbook": "Laptop",
    "pc": "Desktop PC",
    "pc desktop": "Desktop PC",
    "desktop": "Desktop PC",
    "desktop pc": "Desktop PC",
    "komputer": "Desktop PC",
    "all in one": "Desktop PC (AIO)",
    "aio": "Desktop PC (AIO)",
    "printer": "Printer",
    "scanner": "Scanner",
    "printer/scanner": "Printer",
    "smartphone": "Smartphone",
    "hp": "Smartphone",
    "tablet": "Tablet",
    "ipad": "Tablet",
    "penyimpanan": "Penyimpanan (HDD/SSD)",
    "penyimpanan (hdd/ssd)": "Penyimpanan (HDD/SSD)",
    "hdd": "Penyimpanan (HDD/SSD)",
    "ssd": "Penyimpanan (HDD/SSD)",
    "flashdisk": "Penyimpanan (HDD/SSD)",
    "aksesoris": "Aksesoris (Mouse/Keyboard)",
    "aksesoris (mouse/keyboard)": "Aksesoris (Mouse/Keyboard)",
    "lainnya": "Lainnya"
};

/**
 * Normalisasi nomor telepon standar Indonesia:
 * Input: "+62 812-3456-7890", "6281234567890", "0812 3456 7890", "81234567890"
 * Output: "081234567890"
 */
function normalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== "string") return "";
    
    // Ambil hanya karakter angka
    let digits = rawPhone.replace(/\D/g, "");
    if (!digits) return "";

    // Ubah awalan 62 atau 628 menjadi 08
    if (digits.startsWith("62")) {
        digits = "0" + digits.slice(2);
    } else if (digits.startsWith("8")) {
        digits = "0" + digits;
    }

    return digits;
}

/**
 * Format nomor telepon untuk tautan WhatsApp resmi (wa.me/6281234567890)
 */
function toWhatsAppPhone(phone) {
    const normalized = normalizePhone(phone);
    if (!normalized) return "";
    if (normalized.startsWith("0")) {
        return "62" + normalized.slice(1);
    }
    return normalized;
}

/**
 * Normalisasi nama (menghapus spasi ganda, trim, dan proper Title Case)
 * Input: "  budi   santoso  " -> "Budi Santoso"
 */
function normalizeName(rawName) {
    if (!rawName || typeof rawName !== "string") return "";
    
    // Trim dan collapse multiple spaces
    const cleaned = rawName.trim().replace(/\s+/g, " ");
    if (!cleaned) return "";

    // Title case tiap kata
    return cleaned
        .split(" ")
        .map(word => {
            if (word.length <= 1) return word.toUpperCase();
            return word[0].toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}

/**
 * Normalisasi teks umum (trim dan collapse spasi)
 */
function normalizeText(rawText) {
    if (!rawText || typeof rawText !== "string") return "";
    return rawText.trim().replace(/\s+/g, " ");
}

/**
 * Normalisasi Merek Perangkat (Case-insensitive matching ke kamus kanonikal)
 * Contoh:
 * "asus" / "ASUS" / "Asus" -> "ASUS"
 * "hp" / "HP" / "Hp" -> "HP"
 * "msi" / "MSI" / "Msi" -> "MSI"
 * "lenovo" / "LENOVO" -> "Lenovo"
 * "apple" / "macbook" -> "Apple"
 */
function normalizeBrand(rawBrand) {
    if (!rawBrand || typeof rawBrand !== "string") return "";
    
    const cleaned = rawBrand.trim().replace(/\s+/g, " ");
    if (!cleaned) return "";

    const lower = cleaned.toLowerCase();
    if (BRAND_CANONICAL_MAP[lower]) {
        return BRAND_CANONICAL_MAP[lower];
    }

    // Fallback untuk merek kustom: Title Case setiap kata
    return cleaned
        .split(" ")
        .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
        .join(" ");
}

/**
 * Normalisasi Serial Number
 * - Trim whitespace
 * - Uppercase
 * - Nilai string kosong / strip / "none" / "n/a" diubah menjadi null
 */
function normalizeSerialNumber(rawSN) {
    if (!rawSN || typeof rawSN !== "string") return null;

    const cleaned = rawSN.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleaned || cleaned === "-" || cleaned === "NONE" || cleaned === "N/A" || cleaned === "NULL") {
        return null;
    }

    return cleaned;
}

/**
 * Normalisasi Kategori / Jenis Perangkat
 */
function normalizeDeviceType(rawType) {
    if (!rawType || typeof rawType !== "string") return "Laptop";

    const cleaned = rawType.trim().replace(/\s+/g, " ");
    const lower = cleaned.toLowerCase();

    if (DEVICE_TYPE_CANONICAL_MAP[lower]) {
        return DEVICE_TYPE_CANONICAL_MAP[lower];
    }

    // Default Title Case
    return cleaned[0].toUpperCase() + cleaned.slice(1);
}

/**
 * Normalisasi Email
 */
function normalizeEmail(rawEmail) {
    if (!rawEmail || typeof rawEmail !== "string") return "";
    return rawEmail.trim().toLowerCase();
}

module.exports = {
    BRAND_CANONICAL_MAP,
    DEVICE_TYPE_CANONICAL_MAP,
    normalizePhone,
    toWhatsAppPhone,
    normalizeName,
    normalizeText,
    normalizeBrand,
    normalizeSerialNumber,
    normalizeDeviceType,
    normalizeEmail
};

