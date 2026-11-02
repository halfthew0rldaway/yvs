/**
 * Normalization & Standardization Utility
 * Pusat normalisasi data komprehensif untuk menjamin konsistensi & mencegah redundansi di seluruh backend & database.
 * 
 * Prinsip:
 * 1. Mencegah variasi case seperti "ASUS", "asus", "Asus" -> Selalu menjadi "ASUS"
 * 2. Mencegah variasi jenis perangkat seperti "PC", "pc", "desktop", "komputer" -> Selalu menjadi "Desktop PC"
 * 3. Mencegah nomor telepon berbeda format -> Selalu standard "08..." (dan "628..." untuk WhatsApp)
 * 4. Mencegah email tidak standar -> Selalu lowercase dan trimmed
 * 5. Mencegah serial number kotor/placeholder -> Selalu UPPERCASE atau null jika dummy/kosong
 */

// Kamus kanonikal merek teknologi, komputer, dan periferal
const BRAND_CANONICAL_MAP = {
    // All-Caps Acronyms & Brands
    "asus": "ASUS",
    "rog": "ASUS",
    "asus rog": "ASUS",
    "tuf": "ASUS",
    "asus tuf": "ASUS",
    "hp": "HP",
    "hewlett packard": "HP",
    "hewlett-packard": "HP",
    "compaq": "HP",
    "msi": "MSI",
    "lg": "LG",
    "ibm": "IBM",
    "nec": "NEC",
    "aoc": "AOC",
    "wd": "Western Digital",
    "western digital": "Western Digital",
    "ecs": "ECS",
    "palit": "Palit",
    "zotac": "ZOTAC",
    "evga": "EVGA",
    "nzxt": "NZXT",
    "xfx": "XFX",
    "pny": "PNY",
    "adata": "ADATA",
    "asrock": "ASRock",
    "klevv": "KLEVV",

    // Title-Case PC / Laptop Manufacturers
    "lenovo": "Lenovo",
    "thinkpad": "Lenovo",
    "ideapad": "Lenovo",
    "legion": "Lenovo",
    "yoga": "Lenovo",
    "acer": "Acer",
    "predator": "Acer",
    "nitro": "Acer",
    "dell": "Dell",
    "alienware": "Alienware",
    "vostro": "Dell",
    "inspiron": "Dell",
    "latitude": "Dell",
    "apple": "Apple",
    "macbook": "Apple",
    "imac": "Apple",
    "mac": "Apple",
    "mac mini": "Apple",
    "samsung": "Samsung",
    "toshiba": "Toshiba",
    "dynabook": "Toshiba",
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
    "huawei": "Huawei",
    "matebook": "Huawei",
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

    // Storage, Memory & Components
    "kingston": "Kingston",
    "seagate": "Seagate",
    "sandisk": "SanDisk",
    "v-gen": "V-Gen",
    "vgen": "V-Gen",
    "v gen": "V-Gen",
    "teamgroup": "TeamGroup",
    "team": "TeamGroup",
    "lexar": "Lexar",
    "crucial": "Crucial",
    "transcend": "Transcend",
    "patriot": "Patriot",
    "apacer": "Apacer",
    "colorful": "Colorful",
    "galax": "GALAX",
    "inno3d": "Inno3D",
    "be quiet": "be quiet!",
    "be quiet!": "be quiet!",
    "seasonic": "Seasonic",
    "thermaltake": "Thermaltake",
    "cooler master": "Cooler Master",
    "deepcool": "DeepCool"
};

// Standarisasi Kategori / Jenis Perangkat Utama
const DEVICE_TYPE_CANONICAL_MAP = {
    "laptop": "Laptop",
    "notebook": "Laptop",
    "netbook": "Laptop",
    "ultrabook": "Laptop",
    "macbook": "Laptop",
    "pc": "Desktop PC",
    "pc desktop": "Desktop PC",
    "desktop": "Desktop PC",
    "desktop pc": "Desktop PC",
    "komputer": "Desktop PC",
    "tower": "Desktop PC",
    "mini pc": "Desktop PC",
    "dekstop": "Desktop PC",
    "all in one": "Desktop PC",
    "all-in-one": "Desktop PC",
    "aio": "Desktop PC",
    "printer": "Printer",
    "scanner": "Printer",
    "printer/scanner": "Printer",
    "printer / scanner": "Printer",
    "smartphone": "Smartphone",
    "hp": "Smartphone",
    "handphone": "Smartphone",
    "android": "Smartphone",
    "iphone": "Smartphone",
    "tablet": "Tablet",
    "ipad": "Tablet",
    "penyimpanan": "Penyimpanan (HDD/SSD)",
    "penyimpanan (hdd/ssd)": "Penyimpanan (HDD/SSD)",
    "hdd": "Penyimpanan (HDD/SSD)",
    "ssd": "Penyimpanan (HDD/SSD)",
    "harddisk": "Penyimpanan (HDD/SSD)",
    "hard disk": "Penyimpanan (HDD/SSD)",
    "flashdisk": "Penyimpanan (HDD/SSD)",
    "nvme": "Penyimpanan (HDD/SSD)",
    "aksesoris": "Aksesoris (Mouse/Keyboard)",
    "aksesoris (mouse/keyboard)": "Aksesoris (Mouse/Keyboard)",
    "mouse": "Aksesoris (Mouse/Keyboard)",
    "keyboard": "Aksesoris (Mouse/Keyboard)",
    "headset": "Aksesoris (Mouse/Keyboard)",
    "speaker": "Aksesoris (Mouse/Keyboard)",
    "lainnya": "Lainnya",
    "other": "Lainnya",
    "-": "Lainnya"
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
 * Normalisasi nama orang/entitas (menghapus spasi ganda, trim, dan proper Title Case)
 * Input: "  budi   santoso  " -> "Budi Santoso"
 * Input: "BUDI SANTOSO" -> "Budi Santoso"
 */
function normalizeName(rawName) {
    if (!rawName || typeof rawName !== "string") return "";
    
    const cleaned = rawName.trim().replace(/\s+/g, " ");
    if (!cleaned) return "";

    return cleaned
        .split(" ")
        .map(word => {
            if (word.length <= 1) return word.toUpperCase();
            return word[0].toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}

/**
 * Normalisasi teks umum (trim dan collapse multiple spasi)
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

    // Fallback untuk merek yang belum terdaftar: Title Case setiap kata
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
    if (
        !cleaned || 
        cleaned === "-" || 
        cleaned === "NONE" || 
        cleaned === "N/A" || 
        cleaned === "NULL" ||
        cleaned === "KOSONG" ||
        cleaned === "TIDAKADA" ||
        cleaned === "TDKADA" ||
        cleaned === "TIDAK_ADA"
    ) {
        return null;
    }

    return cleaned;
}

/**
 * Normalisasi Kategori / Jenis Perangkat
 * Contoh:
 * "pc" / "PC" / "Pc" / "desktop" / "Desktop" -> "Desktop PC"
 * "laptop" / "Laptop" / "LAPTOP" -> "Laptop"
 * "aio" / "all in one" -> "Desktop PC"
 * "printer" -> "Printer"
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
 * Normalisasi Kategori Suku Cadang / Sparepart
 * Menangani single kategori atau multi kategori comma-separated:
 * "laptop, pc" -> "Laptop, Desktop"
 * "pc" -> "Desktop"
 */
function normalizeSparepartCategory(rawCat) {
    if (!rawCat || typeof rawCat !== "string") return "Umum";

    const tokens = rawCat
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

    if (tokens.length === 0) return "Umum";

    const tokenMap = {
        "laptop": "Laptop",
        "notebook": "Laptop",
        "desktop": "Desktop",
        "pc": "Desktop",
        "komputer": "Desktop",
        "aio": "AIO",
        "all in one": "AIO",
        "printer": "Printer",
        "aksesoris": "Aksesoris",
        "periferal": "Aksesoris",
        "lainnya": "Lainnya",
        "umum": "Umum"
    };

    const normalizedTokens = [];
    for (const t of tokens) {
        const lower = t.toLowerCase();
        const mapped = tokenMap[lower] || (t[0].toUpperCase() + t.slice(1));
        if (!normalizedTokens.includes(mapped)) {
            normalizedTokens.push(mapped);
        }
    }

    // Jika ada kategori spesifik bersamaan dengan "Umum", hilangkan "Umum"
    if (normalizedTokens.length > 1 && normalizedTokens.includes("Umum")) {
        const filtered = normalizedTokens.filter(t => t !== "Umum");
        return filtered.join(", ");
    }

    return normalizedTokens.join(", ") || "Umum";
}

/**
 * Normalisasi Kategori Unit Pinjaman (Loaner Device)
 * "pc" / "PC" -> "Desktop PC"
 * "laptop" -> "Laptop"
 * "smartphone" -> "Smartphone"
 * "tablet" -> "Tablet"
 */
function normalizeLoanerCategory(rawCat) {
    if (!rawCat || typeof rawCat !== "string") return "Laptop";
    const lower = rawCat.trim().toLowerCase();
    if (lower === "pc" || lower === "desktop" || lower === "desktop pc") return "Desktop PC";
    if (lower === "laptop" || lower === "notebook") return "Laptop";
    if (lower === "smartphone" || lower === "hp") return "Smartphone";
    if (lower === "tablet" || lower === "ipad") return "Tablet";
    return rawCat.trim();
}

/**
 * Normalisasi Kategori Repair Wiki
 */
function normalizeWikiCategory(rawCat) {
    if (!rawCat || typeof rawCat !== "string") return "Motherboard / Power";
    const lower = rawCat.trim().toLowerCase();
    if (lower.includes("motherboard") || lower.includes("power") || lower.includes("mobo") || lower.includes("mati")) {
        return "Motherboard / Power";
    }
    if (lower.includes("layar") || lower.includes("display") || lower.includes("lcd") || lower.includes("led")) {
        return "Layar / Display";
    }
    if (lower.includes("keyboard") || lower.includes("touchpad") || lower.includes("trackpad")) {
        return "Keyboard & Touchpad";
    }
    if (lower.includes("kipas") || lower.includes("fan") || lower.includes("thermal") || lower.includes("overheat")) {
        return "Kipas & Thermal";
    }
    if (lower.includes("storage") || lower.includes("os") || lower.includes("penyimpanan") || lower.includes("windows") || lower.includes("ssd") || lower.includes("hdd")) {
        return "Storage & OS";
    }
    return "Lainnya";
}

/**
 * Normalisasi Kategori Distributor / Supplier
 */
function normalizeSupplierCategory(rawCat) {
    if (!rawCat || typeof rawCat !== "string") return "Distributor Resmi";
    const lower = rawCat.trim().toLowerCase();
    if (lower.includes("resmi")) return "Distributor Resmi";
    if (lower.includes("paralel")) return "Distributor Paralel";
    if (lower.includes("online") || lower.includes("marketplace") || lower.includes("tokopedia") || lower.includes("shopee")) {
        return "Toko Online / Marketplace";
    }
    if (lower.includes("komponen") || lower.includes("part")) return "Supplier Komponen";
    return rawCat.trim();
}

/**
 * Normalisasi Nama Ekspedisi Kurir RMA
 */
function normalizeCourier(rawCourier) {
    if (!rawCourier || typeof rawCourier !== "string") return null;
    const lower = rawCourier.trim().toLowerCase();
    if (lower === "jne") return "JNE";
    if (lower === "jnt" || lower === "j&t") return "J&T";
    if (lower === "sicepat" || lower === "si cepat") return "SiCepat";
    if (lower.includes("pos")) return "Pos Indonesia";
    if (lower === "tiki") return "TIKI";
    if (lower === "anteraja" || lower === "anter aja") return "AnterAja";
    if (lower === "wahana") return "Wahana";
    if (lower.includes("lion")) return "Lion Parcel";
    if (lower.includes("ninja")) return "Ninja Xpress";
    if (lower.includes("gosend") || lower.includes("gojek")) return "GoSend";
    if (lower.includes("grab")) return "GrabExpress";
    return normalizeText(rawCourier);
}

/**
 * Normalisasi Sumber Lamaran Rekrutmen
 */
function normalizeApplicantSource(rawSource) {
    if (!rawSource || typeof rawSource !== "string") return "Walk-in";
    const lower = rawSource.trim().toLowerCase();
    if (lower.includes("walk")) return "Walk-in";
    if (lower.includes("insta") || lower === "ig") return "Instagram";
    if (lower.includes("jobstreet")) return "JobStreet";
    if (lower.includes("linkedin")) return "LinkedIn";
    if (lower.includes("glints")) return "Glints";
    if (lower.includes("kitalulus")) return "KitaLulus";
    if (lower.includes("whatsapp") || lower === "wa") return "WhatsApp";
    if (lower.includes("rekomendasi") || lower.includes("referral")) return "Rekomendasi";
    if (lower.includes("web")) return "Website";
    return "Lainnya";
}

/**
 * Normalisasi Email (lowercase & trimmed)
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
    normalizeSparepartCategory,
    normalizeLoanerCategory,
    normalizeWikiCategory,
    normalizeSupplierCategory,
    normalizeCourier,
    normalizeApplicantSource,
    normalizeEmail
};
