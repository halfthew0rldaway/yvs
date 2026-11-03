import { 
    MousePointer, 
    Keyboard, 
    BatteryCharging, 
    Usb, 
    Volume2, 
    Wifi, 
    Camera, 
    Sparkles, 
    Cpu, 
    Gauge, 
    MonitorSmartphone,
    Package,
    HardDrive,
    Monitor,
    Printer,
    Smartphone,
    Gamepad2,
    Boxes,
    Laptop,
    Droplet,
    Scan,
    Activity,
    CircuitBoard,
    Sliders,
    Flame,
    FileText,
    CheckCircle2,
    RotateCw,
    Radio
} from "lucide-react";

/**
 * 7 Kategori Perangkat Utama yang Diterima di Workshop (Urutan Prioritas):
 * 1. Laptop
 * 2. Printer
 * 3. PC (Desktop PC / Komputer Rakitan / All-in-One)
 * 4. Smartphone / Tablet (HP / Tab)
 * 5. Disk External / Penyimpanan & Periferal
 * 6. Konsol Game (PlayStation, Switch, Xbox)
 * 7. Perangkat Lainnya (Gadget / IoT / Audio / etc.)
 */
export const DEVICE_CATEGORIES = [
    { 
        id: "laptop", 
        label: "Laptop", 
        alias: ["laptop", "notebook", "ultrabook", "macbook"],
        icon: Laptop, 
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        description: "Laptop, MacBook, Chromebook & Ultrabook"
    },
    { 
        id: "printer", 
        label: "Printer", 
        alias: ["printer", "scanner", "cetak", "plotter", "pos", "inkjet", "laserjet"],
        icon: Printer, 
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description: "Inkjet, Laser, Scanner, POS & Dot Matrix"
    },
    { 
        id: "pc", 
        label: "Desktop PC", 
        alias: ["pc", "desktop", "komputer", "tower", "all-in-one", "aio", "rakitan", "cpu"],
        icon: Monitor, 
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        description: "Desktop PC, Tower Rakitan & All-in-One"
    },
    { 
        id: "smartphone", 
        label: "Smartphone / Tablet", 
        alias: ["smartphone", "hp", "handphone", "tablet", "ipad", "tab", "android", "iphone"],
        icon: Smartphone, 
        badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
        description: "Smartphone Android, iPhone, iPad & Tablet"
    },
    { 
        id: "storage_peripheral", 
        label: "Penyimpanan & Periferal", 
        alias: ["penyimpanan", "hdd", "ssd", "harddisk", "flashdisk", "external", "eksternal", "keyboard", "mouse", "headset", "aksesoris", "periferal"],
        icon: HardDrive, 
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        description: "HDD Eksternal, SSD, Flashdisk & Aksesoris"
    },
    { 
        id: "console", 
        label: "Konsol Game", 
        alias: ["konsol", "console", "ps4", "ps5", "playstation", "nintendo", "xbox", "switch", "handheld"],
        icon: Gamepad2, 
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        description: "PlayStation, Nintendo Switch, Xbox & Konsol Handheld"
    },
    { 
        id: "other", 
        label: "Perangkat Lainnya", 
        alias: ["lainnya", "other", "gadget", "elektronik", "audio", "iot", "proyektor"],
        icon: Boxes, 
        badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
        description: "Gadget Elektronik, Audio, IoT & Lainnya"
    }
];

/**
 * Normalisasi cerdas tipe atau teks nama perangkat ke kategori terstandar
 */
export function getDeviceCategory(jenisPerangkat) {
    if (!jenisPerangkat || typeof jenisPerangkat !== "string") return "laptop";
    const j = jenisPerangkat.toLowerCase().trim();

    if (j.includes("printer") || j.includes("scanner") || j.includes("cetak") || j.includes("plotter") || j.includes("pos") || j.includes("inkjet") || j.includes("laserjet")) {
        return "printer";
    }
    if (j.includes("desktop") || j.includes("pc") || j.includes("komputer") || j.includes("tower") || j.includes("all-in-one") || j.includes("aio") || j.includes("rakitan")) {
        return "pc";
    }
    if (j.includes("laptop") || j.includes("notebook") || j.includes("ultrabook") || j.includes("macbook")) {
        return "laptop";
    }
    if (j.includes("smartphone") || j.includes("hp") || j.includes("handphone") || j.includes("tablet") || j.includes("ipad") || j.includes("tab") || j.includes("android") || j.includes("iphone")) {
        return "smartphone";
    }
    if (j.includes("hdd") || j.includes("ssd") || j.includes("harddisk") || j.includes("penyimpanan") || j.includes("flashdisk") || j.includes("external") || j.includes("eksternal") || j.includes("mouse") || j.includes("aksesoris") || j.includes("periferal")) {
        return "storage_peripheral";
    }
    if (j.includes("konsol") || j.includes("console") || j.includes("playstation") || j.includes("ps3") || j.includes("ps4") || j.includes("ps5") || j.includes("nintendo") || j.includes("xbox") || j.includes("switch")) {
        return "console";
    }
    return "other";
}

/**
 * Ambil komponen ikon Lucide berdasarkan jenis perangkat
 */
export function getDeviceIcon(categoryOrJenis) {
    const category = getDeviceCategory(categoryOrJenis);
    switch (category) {
        case "printer": return Printer;
        case "pc": return Monitor;
        case "smartphone": return Smartphone;
        case "storage_peripheral": return HardDrive;
        case "console": return Gamepad2;
        case "other": return Boxes;
        case "laptop":
        default:
            return Laptop;
    }
}

// =========================================================================
// 1. LAPTOP CHECKLIST ITEMS (15 Item Lengkap)
// =========================================================================
export const LAPTOP_CHECKLIST_ITEMS = [
    { key: "usb", label: "Port USB", shortName: "port USB", hasQty: true, defaultQty: 2, unit: "port", icon: Usb, legacyKey: "usb_port", defaultSolusi: "Perbaikan pin konektor / ganti board port USB" },
    { key: "type_c", label: "Port Type-C", shortName: "type C", hasQty: true, defaultQty: 1, unit: "port", icon: Usb, defaultSolusi: "Ganti atau solder ulang konektor Type-C" },
    { key: "hdmi", label: "Port HDMI", shortName: "HDMI", hasQty: false, icon: MonitorSmartphone, defaultSolusi: "Perbaikan jalur display out HDMI / ganti soket HDMI" },
    { key: "keyboard", label: "Keyboard", shortName: "keyboard", hasQty: false, icon: Keyboard, defaultSolusi: "Penggantian modul keyboard baru" },
    { key: "touchpad", label: "Touchpad", shortName: "touchpad", hasQty: false, icon: MousePointer, defaultSolusi: "Perbaikan fleksibel touchpad / modul klik" },
    { key: "layar", label: "Layar / LCD", shortName: "layar", hasQty: false, icon: MonitorSmartphone, legacyKey: "display_test", defaultSolusi: "Penggantian panel LCD / re-seat fleksibel eDP" },
    { key: "webcam", label: "Webcam Kamera", shortName: "webcam", hasQty: false, icon: Camera, defaultSolusi: "Ganti modul kamera / periksa kabel fleksibel webcam" },
    { key: "mic", label: "Mikrofon (Mic)", shortName: "mic", hasQty: false, icon: Volume2, defaultSolusi: "Periksa modul mic internal / IC codec audio" },
    { key: "speaker", label: "Speaker", shortName: "speaker", hasQty: false, icon: Volume2, legacyKey: "sound", defaultSolusi: "Penggantian sepasang speaker internal" },
    { key: "audio_jack", label: "Audio Jack 3.5mm", shortName: "audio jack", hasQty: false, icon: Volume2, defaultSolusi: "Penggantian soket audio jack 3.5mm" },
    { key: "wifi_bt", label: "WiFi & Bluetooth", shortName: "WiFi", hasQty: false, icon: Wifi, legacyKey: "wifi_lan", defaultSolusi: "Ganti modul WiFi card / install driver certified" },
    { key: "baterai", label: "Baterai & Charging", shortName: "baterai", hasQty: false, icon: BatteryCharging, legacyKey: "power_test", defaultSolusi: "Penggantian baterai baru original / OEM" },
    { key: "ram", label: "Slot RAM", shortName: "RAM", hasQty: true, defaultQty: 1, unit: "slot", icon: Cpu, defaultSolusi: "Ganti atau tambah keping RAM DDR" },
    { key: "storage", label: "SSD / Storage", shortName: "SSD", hasQty: true, defaultQty: 1, unit: "slot", icon: HardDrive, defaultSolusi: "Upgrade / ganti SSD NVMe dan migrasi data" },
    { key: "fan_thermal", label: "Fan & Pendingin", shortName: "fan & pendingin", hasQty: false, icon: Gauge, defaultSolusi: "Deep cleaning fan heatsink & repasta thermal compound" },
];

// =========================================================================
// 2. DESKTOP PC CHECKLIST ITEMS (Motherboard, Bracket Fan, PSU, VGA, dll.)
// Sesuai standar diagnosa workshop nyata (seperti kasus PC Imperion Bu Rini)
// =========================================================================
export const PC_CHECKLIST_ITEMS = [
    { key: "motherboard_socket", label: "Mobo & Bracket Fan CPU", shortName: "motherboard & bracket fan", hasQty: false, icon: CircuitBoard, defaultSolusi: "Ganti bracket fan CPU (AM4/FM2+/LGA) / perbaikan jalur socket motherboard" },
    { key: "cpu_fan", label: "Processor & Fan Heatsink", shortName: "processor & fan heatsink", hasQty: false, icon: Gauge, defaultSolusi: "Pasang fan presisi, repasta thermal compound baru & cek suhu kerja" },
    { key: "ram", label: "RAM / Memory", shortName: "RAM", hasQty: true, defaultQty: 1, unit: "keping", icon: Cpu, defaultSolusi: "Pembersihan pin RAM / ganti modul RAM DDR" },
    { key: "vga_gpu", label: "VGA Card / GPU Discrete", shortName: "VGA / GPU", hasQty: false, icon: Monitor, defaultSolusi: "Servis fan VGA, repasta GPU, atau ganti unit kartu grafis" },
    { key: "storage_ssd", label: "SSD Utama (OS & System)", shortName: "SSD utama", hasQty: true, defaultQty: 1, unit: "drive", icon: HardDrive, defaultSolusi: "Cek health SSD, backup data urgent & ganti SSD baru bebas bad sector" },
    { key: "storage_hdd", label: "HDD Internal / Sekunder", shortName: "HDD sekunder", hasQty: true, defaultQty: 1, unit: "drive", icon: HardDrive, defaultSolusi: "Cek S.M.A.R.T health & isolasi bad sector harddisk internal" },
    { key: "psu", label: "Power Supply Unit (PSU)", shortName: "PSU (power supply)", hasQty: false, icon: BatteryCharging, defaultSolusi: "Cek tegangan 12V/5V/3.3V & ganti PSU bersertifikasi stabil" },
    { key: "front_panel", label: "Port & Tombol Front Panel", shortName: "port frontpanel", hasQty: false, icon: Usb, defaultSolusi: "Perbaikan kabel switch front panel & header konektor USB casing" },
    { key: "back_panel", label: "Port Back Panel I/O", shortName: "port backpanel (I/O)", hasQty: false, icon: Usb, defaultSolusi: "Pembersihan port I/O shield (USB, HDMI, LAN, audio belakang)" },
    { key: "wifi_lan", label: "Jaringan (LAN & USB WiFi)", shortName: "koneksi LAN & WiFi", hasQty: false, icon: Wifi, defaultSolusi: "Install driver LAN certified atau ganti dongle USB WiFi / PCI-e card" },
    { key: "casing_airflow", label: "Casing & Sirkulasi Fan", shortName: "casing & sirkulasi udara", hasQty: false, icon: Flame, defaultSolusi: "Deep cleaning debu casing & perapian cable management airflow" },
    { key: "os_benchmark", label: "Stabilitas OS & Benchmark", shortName: "stabilitas OS & stress test", hasQty: false, icon: Activity, defaultSolusi: "Tuning OS/Office, stress test benchmark 1 jam untuk verifikasi bebas freeze/mati mendadak" },
];

// =========================================================================
// 3. PRINTER CHECKLIST ITEMS (Canon, Epson, HP, Brother)
// Sesuai daftar pemeriksaan workshop nyata (seperti kasus Canon G3010 Bp Yasin)
// =========================================================================
export const PRINTER_CHECKLIST_ITEMS = [
    { key: "print_result", label: "Hasil Cetak (Print Test)", shortName: "hasil cetak (print test)", hasQty: false, icon: FileText, defaultSolusi: "Head cleaning / alignment pola cetak nozzle" },
    { key: "printhead", label: "Kondisi Printhead", shortName: "printhead", hasQty: false, icon: Droplet, defaultSolusi: "Flushing pembersih head ultrasonic / penggantian modul printhead" },
    { key: "cartridge", label: "Cartridge & Rumah Carriage", shortName: "cartridge & carriage", hasQty: false, icon: Package, defaultSolusi: "Bersihkan chip kontak cartridge / rekondisi dudukan carriage" },
    { key: "mekanik_roller", label: "Mekanik & Roller Kertas", shortName: "mekanik & roller penarik kertas", hasQty: false, icon: RotateCw, defaultSolusi: "Servis mekanik satu set & penggantian karet roller ASF pickup kertas" },
    { key: "inkpad_waste", label: "Inkpad / Busa Pembuangan", shortName: "inkpad / busa pembuangan", hasQty: false, icon: Droplet, defaultSolusi: "Cuci/ganti busa inkpad waste & pemasangan jalur pembuangan eksternal" },
    { key: "eeprom_counter", label: "Memory EEPROM & Counter", shortName: "memory EEPROM & counter", hasQty: false, icon: Activity, defaultSolusi: "Reset waste ink counter EEPROM menggunakan software service tools resmi" },
    { key: "tinta_ciss", label: "Tabung Tinta & Selang CISS", shortName: "tabung & selang tinta (CISS)", hasQty: false, icon: Droplet, defaultSolusi: "Refill tinta berkualitas & bleeding sedot udara jalur selang infus" },
    { key: "body_cleanliness", label: "Kebersihan Body & Benda Asing", shortName: "kebersihan body & benda asing", hasQty: false, icon: Sparkles, defaultSolusi: "Bongkar unit dan bersihkan benda asing (klip, staples, sobekan kertas)" },
    { key: "scanner_adf", label: "Scanner & Modul ADF", shortName: "scanner flatbed / ADF", hasQty: false, icon: Scan, defaultSolusi: "Pembersihan kaca optik scanner / perbaikan sensor fleksibel CIS" },
    { key: "port_konektivitas", label: "Port USB & WiFi Printer", shortName: "port USB & koneksi WiFi", hasQty: false, icon: Usb, defaultSolusi: "Ganti kabel data USB printer berkualitas atau konfigurasi ulang WiFi" },
];

// =========================================================================
// 4. SMARTPHONE / TABLET CHECKLIST ITEMS (Android, iPhone, iPad)
// =========================================================================
export const SMARTPHONE_CHECKLIST_ITEMS = [
    { key: "touchscreen_lcd", label: "Layar LCD & Touchscreen", shortName: "layar & touchscreen", hasQty: false, icon: Smartphone, defaultSolusi: "Penggantian modul LCD + touchscreen OEM/Original" },
    { key: "baterai_charging", label: "Baterai & Port Charging", shortName: "baterai & port charging", hasQty: false, icon: BatteryCharging, defaultSolusi: "Penggantian baterai baru / servis konektor port charger" },
    { key: "kamera_depan_belakang", label: "Kamera Depan & Belakang", shortName: "kamera depan & belakang", hasQty: false, icon: Camera, defaultSolusi: "Pembersihan kaca lensa / ganti modul kamera internal" },
    { key: "speaker_earpiece", label: "Speaker Loudspeaker & Earpiece", shortName: "speaker & earpiece", hasQty: false, icon: Volume2, defaultSolusi: "Pembersihan mesh pelindung debu / ganti buzzer speaker" },
    { key: "mikrofon", label: "Mikrofon (Mic)", shortName: "mikrofon", hasQty: false, icon: Volume2, defaultSolusi: "Perbaikan IC audio / ganti board konektor mic bawah" },
    { key: "sinyal_sim_imei", label: "Sinyal Seluler & Slot SIM", shortName: "sinyal seluler & SIM", hasQty: false, icon: Radio, defaultSolusi: "Pembersihan slot SIM tray / perbaikan jalur antena sinyal" },
    { key: "wifi_bluetooth", label: "WiFi & Bluetooth", shortName: "WiFi & Bluetooth", hasQty: false, icon: Wifi, defaultSolusi: "Reset modul konektivitas jaringan atau servis IC WiFi" },
    { key: "tombol_fisik", label: "Tombol Fisik (Power & Vol)", shortName: "tombol power & volume", hasQty: false, icon: Sliders, defaultSolusi: "Penggantian fleksibel switch on/off & volume" },
    { key: "sensor_biometrik", label: "Sensor Fingerprint / Face ID", shortName: "sensor biometrik", hasQty: false, icon: CheckCircle2, defaultSolusi: "Kalibrasi sensor biometrik sidik jari / wajah" },
    { key: "fisik_casing", label: "Frame & Backdoor", shortName: "frame & backdoor", hasQty: false, icon: Sparkles, defaultSolusi: "Pengeleman presisi backdoor & perataan rangka bodi" },
];

// =========================================================================
// 5. STORAGE & PERIPHERAL CHECKLIST ITEMS (HDD Ext, SSD, Aksesoris)
// =========================================================================
export const STORAGE_PERIPHERAL_CHECKLIST_ITEMS = [
    { key: "smart_health", label: "S.M.A.R.T Health & Bad Sector", shortName: "health & bad sector", hasQty: false, icon: HardDrive, defaultSolusi: "Backup data urgent, isolasi bad sector atau penggantian storage" },
    { key: "read_write_speed", label: "Kecepatan Transfer Data", shortName: "kecepatan read/write", hasQty: false, icon: Activity, defaultSolusi: "Format low-level / optimalisasi kontroler media penyimpanan" },
    { key: "port_konektor", label: "Konektor USB / Port Data", shortName: "konektor port data", hasQty: false, icon: Usb, defaultSolusi: "Solder ulang atau ganti konektor port USB/SATA yang longgar" },
    { key: "enclosure_kabel", label: "Kabel Data & Casing Enclosure", shortName: "kabel data & enclosure", hasQty: false, icon: Usb, defaultSolusi: "Ganti kabel data USB shielded / upgrade casing enclosure baru" },
    { key: "indikator_daya", label: "Indikator Daya & Suhu", shortName: "indikator daya & suhu", hasQty: false, icon: Gauge, defaultSolusi: "Pemeriksaan konsumsi arus daya & pasang thermal pad pendingin" },
    { key: "partisi_filesystem", label: "Partisi File System", shortName: "partisi file system", hasQty: false, icon: FileText, defaultSolusi: "Recovery data & perbaikan struktur partisi MBR/GPT" },
];

// =========================================================================
// 6. GAME CONSOLE CHECKLIST ITEMS (PlayStation, Switch, Xbox)
// =========================================================================
export const CONSOLE_CHECKLIST_ITEMS = [
    { key: "display_hdmi", label: "Port HDMI & Output Gambar", shortName: "port HDMI & display", hasQty: false, icon: MonitorSmartphone, defaultSolusi: "Penggantian port HDMI atau servis IC controller video" },
    { key: "optical_drive", label: "Disc Drive / Mekanik Eject", shortName: "disc drive / pembaca kaset", hasQty: false, icon: RotateCw, defaultSolusi: "Pembersihan lensa optik atau ganti motor penarik kaset" },
    { key: "thermal_fan", label: "Sistem Fan & Pendingin Suhu", shortName: "fan & pendingin (thermal)", hasQty: false, icon: Gauge, defaultSolusi: "Deep cleaning heatsink & aplikasi liquid metal / thermal paste baru" },
    { key: "controller_sync", label: "Koneksi USB & Sync Stik", shortName: "koneksi USB & sync stik", hasQty: false, icon: Gamepad2, defaultSolusi: "Perbaikan modul Bluetooth stik / port USB depan konsol" },
    { key: "network_online", label: "Koneksi Internet (LAN/WiFi)", shortName: "koneksi internet (LAN/WiFi)", hasQty: false, icon: Wifi, defaultSolusi: "Pemeriksaan antena nirkabel atau socket LAN RJ45" },
    { key: "storage_internal", label: "Storage Internal & Booting", shortName: "storage internal & boot", hasQty: false, icon: HardDrive, defaultSolusi: "Rebuild database konsol atau upgrade SSD internal baru" },
    { key: "casing_kebersihan", label: "Kebersihan Casing & Ventilasi", shortName: "kebersihan ventilasi bodi", hasQty: false, icon: Sparkles, defaultSolusi: "Pembersihan menyeluruh debu sarang laba-laba pada ventilasi" },
];

// =========================================================================
// 7. OTHER DEVICES CHECKLIST ITEMS (Umum & Elektronik Lainnya)
// =========================================================================
export const OTHER_CHECKLIST_ITEMS = [
    { key: "power_supply", label: "Daya Masuk & Adaptor Power", shortName: "daya & adaptor power", hasQty: false, icon: BatteryCharging, defaultSolusi: "Perbaikan jalur input daya atau penggantian adaptor" },
    { key: "tombol_kontrol", label: "Tombol Kontrol & Indikator LED", shortName: "tombol & indikator LED", hasQty: false, icon: Sliders, defaultSolusi: "Penggantian switch tombol atau perbaikan jalur kontrol" },
    { key: "port_io", label: "Port Konektivitas & Antarmuka", shortName: "port konektivitas I/O", hasQty: false, icon: Usb, defaultSolusi: "Pembersihan soket & penyolderan ulang kaki konektor" },
    { key: "fungsi_utama", label: "Fungsi Operasional Utama", shortName: "fungsi kerja utama", hasQty: false, icon: Activity, defaultSolusi: "Perbaikan modul elektronik inti / kalibrasi mekanik" },
    { key: "fisik_kebersihan", label: "Kondisi Fisik, Baut & Bodi", shortName: "kondisi fisik & kelengkapan baut", hasQty: false, icon: Sparkles, defaultSolusi: "Pembersihan menyeluruh bodi unit & kelengkapan sekrup" },
];

// =========================================================================
// GETTER FUNGSI CHECKLIST SPESIFIK BERDASARKAN KATEGORI PERANGKAT
// =========================================================================
export function getHardwareChecklistForCategory(categoryOrJenis) {
    const cat = getDeviceCategory(categoryOrJenis);
    switch (cat) {
        case "printer":
            return PRINTER_CHECKLIST_ITEMS;
        case "pc":
            return PC_CHECKLIST_ITEMS;
        case "smartphone":
            return SMARTPHONE_CHECKLIST_ITEMS;
        case "storage_peripheral":
            return STORAGE_PERIPHERAL_CHECKLIST_ITEMS;
        case "console":
            return CONSOLE_CHECKLIST_ITEMS;
        case "other":
            return OTHER_CHECKLIST_ITEMS;
        case "laptop":
        default:
            return LAPTOP_CHECKLIST_ITEMS;
    }
}

// =========================================================================
// QC (QUALITY CONTROL) CHECKLIST SPESIFIK PER KATEGORI
// =========================================================================
export function getQcChecklistForCategory(categoryOrJenis) {
    const cat = getDeviceCategory(categoryOrJenis);
    
    if (cat === "printer") {
        return [
            { key: "print_result", label: "Hasil Cetak Sempurna", desc: "Nozzle check solid, teks tajam & blok warna rata tanpa garis", Icon: FileText },
            { key: "printhead", label: "Printhead & Nozzle Bersih", desc: "Semprotan tinta presisi, tidak mampet dan tidak luber", Icon: Droplet },
            { key: "mekanik_roller", label: "Mekanik Penarik Kertas", desc: "Tarik 5 lembar berurutan lancar bebas paper jam & gear halus", Icon: RotateCw },
            { key: "inkpad_waste", label: "Inkpad & Jalur Selang Tinta", desc: "Selang tidak bocor, busa aman & pembuangan terpasang rapat", Icon: Droplet },
            { key: "eeprom_counter", label: "Status Counter & Lampu Indikator", desc: "Bebas error blink / Service Required, lampu tombol siap cetak", Icon: Activity },
            { key: "clean_wow", label: "Pembersihan WOW Service", desc: "Roller karet, rel carriage & bodi dilap bersih bebas noda tinta", Icon: Sparkles },
            { key: "accessories_handover", label: "Verifikasi Kelengkapan", desc: "Kabel power, kabel USB & botol tinta bawaan tersusun rapi", Icon: Package },
        ];
    }

    if (cat === "pc") {
        return [
            { key: "cpu_fan", label: "Pendingin CPU & Bracket Kokoh", desc: "Bracket fan menempel presisi, thermal paste baru & suhu adem", Icon: Gauge },
            { key: "vga_display", label: "Output Display VGA Prima", desc: "Tampilan monitor jernih bebas artefak pada resolusi optimal", Icon: Monitor },
            { key: "storage_os", label: "Booting SSD & Kestabilan OS", desc: "Booting cepat, OS aktif responsif tanpa freeze / not responding", Icon: HardDrive },
            { key: "front_back_io", label: "Port Front & Back Panel", desc: "Tombol power/reset, audio & seluruh port USB terdeteksi normal", Icon: Usb },
            { key: "os_benchmark", label: "Lolos Uji Beban Benchmark", desc: "Uji benchmark/stress test lolos stabil tanpa mati mendadak", Icon: Activity },
            { key: "clean_wow", label: "Pembersihan WOW Service", desc: "Casing disemprot kompresor bebas debu & manajemen kabel rapi", Icon: Sparkles },
            { key: "accessories_handover", label: "Verifikasi Kelengkapan", desc: "Kabel power, baut casing lengkap & part cadangan tersimpan", Icon: Package },
        ];
    }

    if (cat === "smartphone") {
        return [
            { key: "touchscreen_lcd", label: "Layar & Respon Sentuh", desc: "Display jernih, multi-touch responsif di setiap sudut", Icon: Smartphone },
            { key: "baterai_charging", label: "Pengisian Daya & Baterai", desc: "Charging cepat terdeteksi, persentase naik normal", Icon: BatteryCharging },
            { key: "audio_mic", label: "Speaker, Earpiece & Mic", desc: "Panggilan telepon & suara media jelas nyaring tanpa kresek", Icon: Volume2 },
            { key: "kamera_sinyal", label: "Kamera & Sinyal Jaringan", desc: "Kamera depan/belakang fokus & sinyal SIM 4G/5G stabil", Icon: Camera },
            { key: "clean_wow", label: "Pembersihan WOW Service", desc: "Layar & bodi dilap alkohol steril bebas minyak & sidik jari", Icon: Sparkles },
            { key: "accessories_handover", label: "Verifikasi Kelengkapan", desc: "SIM tray terpasang, charger & aksesoris tersimpan rapi", Icon: Package },
        ];
    }

    if (cat === "storage_peripheral") {
        return [
            { key: "smart_health", label: "S.M.A.R.T Health Bebas Bad Sector", desc: "Health 100%, surface test lolos tanpa bad block", Icon: HardDrive },
            { key: "read_write_speed", label: "Kecepatan Transfer Data Normal", desc: "Copy-paste file besar konsisten tanpa putus di tengah jalan", Icon: Activity },
            { key: "port_konektor", label: "Soket Port Presisi & Kokoh", desc: "Konektor tidak goyang saat digerakkan perlahan", Icon: Usb },
            { key: "clean_wow", label: "Pembersihan WOW Service", desc: "Bodi enclosure dilap bersih bebas debu dan noda", Icon: Sparkles },
            { key: "accessories_handover", label: "Verifikasi Kelengkapan", desc: "Kabel data bawaan, pouch & konektor tersimpan rapi", Icon: Package },
        ];
    }

    if (cat === "console") {
        return [
            { key: "display_hdmi", label: "Output Gambar HDMI 60/120fps", desc: "Tampilan jernih bebas blanking atau flicker", Icon: MonitorSmartphone },
            { key: "thermal_fan", label: "Suhu Adem & Kipas Hening", desc: "Kipas berputar stabil bebas peringatan overheating", Icon: Gauge },
            { key: "controller_sync", label: "Pairing Stik & Port USB", desc: "Koneksi stik nirkabel responsif & charging controller normal", Icon: Gamepad2 },
            { key: "game_testing", label: "Uji Coba Game 30 Menit", desc: "Gameplay lancar tanpa crash atau database error", Icon: Activity },
            { key: "clean_wow", label: "Pembersihan WOW Service", desc: "Ventilasi debu dibersihkan tuntas & bodi konsol kinclong", Icon: Sparkles },
            { key: "accessories_handover", label: "Verifikasi Kelengkapan", desc: "Kabel HDMI, kabel power, stik controller tersusun rapi", Icon: Package },
        ];
    }

    if (cat === "other") {
        return [
            { key: "power_supply", label: "Daya Hidup & Voltase Stabil", desc: "Perangkat menyala normal tanpa drop tegangan", Icon: BatteryCharging },
            { key: "fungsi_utama", label: "Fungsi Utama Bekerja Prima", desc: "Fungsi operasional inti unit berjalan sesuai spesifikasi", Icon: Activity },
            { key: "clean_wow", label: "Pembersihan WOW Service", desc: "Bodi unit dilap bersih menyeluruh bebas kotoran", Icon: Sparkles },
            { key: "accessories_handover", label: "Verifikasi Kelengkapan", desc: "Baut lengkap & kelengkapan unit bawaan tersusun rapi", Icon: Package },
        ];
    }

    // Default Laptop QC (17 Poin WOW Service)
    return [
        { key: "usb", label: "Port USB", desc: "Koneksi data flashdisk/mouse terbaca lancar", Icon: Usb, legacyKey: "port_io_connectivity" },
        { key: "type_c", label: "Port Type-C", desc: "Transfer data & pengisian daya Type-C normal", Icon: Usb, legacyKey: "port_io_connectivity" },
        { key: "hdmi", label: "Port HDMI", desc: "Display out ke monitor/proyektor jernih tanpa glitch", Icon: MonitorSmartphone, legacyKey: "port_io_connectivity" },
        { key: "keyboard", label: "Keyboard", desc: "Semua tombol tuts merespons cepat & responsif", Icon: Keyboard, legacyKey: "keyboard_touchpad" },
        { key: "touchpad", label: "Touchpad", desc: "Klik kiri/kanan presisi, multi-touch responsif", Icon: MousePointer, legacyKey: "keyboard_touchpad" },
        { key: "layar", label: "Layar / LCD", desc: "Resolusi jernih, bebas garis/flicker, kecerahan prima", Icon: MonitorSmartphone, legacyKey: "display_test" },
        { key: "webcam", label: "Webcam Kamera", desc: "Kamera jernih & terdeteksi sempurna di sistem", Icon: Camera, legacyKey: "audio_multimedia" },
        { key: "mic", label: "Mikrofon (Mic)", desc: "Perekaman input mic sensitif & jernih", Icon: Volume2, legacyKey: "audio_multimedia" },
        { key: "speaker", label: "Speaker Audio", desc: "Suara jernih stereo, tidak sember / pecah", Icon: Volume2, legacyKey: "audio_multimedia" },
        { key: "audio_jack", label: "Audio Jack 3.5mm", desc: "Soket headset terdeteksi & suara jernih", Icon: Volume2, legacyKey: "port_io_connectivity" },
        { key: "wifi_bt", label: "WiFi & Bluetooth", desc: "Koneksi nirkabel WiFi & Bluetooth lancar stabil", Icon: Wifi, legacyKey: "port_io_connectivity" },
        { key: "baterai", label: "Baterai & Charging", desc: "Power ON stabil, adaptor mengisi, baterai awet", Icon: BatteryCharging, legacyKey: "power_test" },
        { key: "ram", label: "Kapasitas RAM", desc: "RAM terbaca penuh, sistem stabil bebas BSOD", Icon: Cpu },
        { key: "storage", label: "SSD / Storage", desc: "Booting lancar, read/write cepat & health 100%", Icon: HardDrive, legacyKey: "os_thermal_performance" },
        { key: "fan_thermal", label: "Fan & Suhu Kerja", desc: "Putaran fan halus, suhu kerja stabil & adem", Icon: Gauge, legacyKey: "os_thermal_performance" },
        { key: "clean_wow", label: "Pembersihan WOW Service", desc: "Bodi & layar dilap bersih menyeluruh bebas debu", Icon: Sparkles },
        { key: "accessories_handover", label: "Verifikasi Kelengkapan", desc: "Baut casing lengkap, charger/tas tersusun rapi", Icon: Package },
    ];
}

// =========================================================================
// BACKWARDS-COMPATIBLE DEFAULT EXPORTS
// (Agar kode lama yang mengimpor nama ini tetap berjalan 100% mulus)
// =========================================================================
export const HARDWARE_CHECKLIST_ITEMS = LAPTOP_CHECKLIST_ITEMS;

export const CHECKLIST_ITEMS = HARDWARE_CHECKLIST_ITEMS.map(item => ({
    key: item.key,
    label: item.label,
    shortName: item.shortName,
    Icon: item.icon,
    legacyKey: item.legacyKey,
    hasQty: item.hasQty,
    defaultQty: item.defaultQty,
    unit: item.unit,
    defaultSolusi: item.defaultSolusi
}));

export const QC_CHECKLIST_ITEMS = getQcChecklistForCategory("laptop");

/**
 * Resolver nilai checklist tangguh yang mendukung boolean, status objek, dan legacy keys
 */
export function getChecklistValue(obj, key, legacyKey = null) {
    if (!obj || typeof obj !== "object") return false;
    
    let raw = obj[key];
    if (raw === undefined && legacyKey) raw = obj[legacyKey];

    // Dynamic fallbacks
    if (raw === undefined) {
        if (key === "usb" && obj.usb_port !== undefined) raw = obj.usb_port;
        if (key === "speaker" && obj.sound !== undefined) raw = obj.sound;
        if (key === "wifi_bt" && obj.wifi_lan !== undefined) raw = obj.wifi_lan;
        if (key === "baterai" && obj.power_test !== undefined) raw = obj.power_test;
        if (key === "layar" && obj.display_test !== undefined) raw = obj.display_test;
        if (key === "keyboard" && obj.keyboard_touchpad !== undefined) raw = obj.keyboard_touchpad;
        if (key === "touchpad" && obj.keyboard_touchpad !== undefined) raw = obj.keyboard_touchpad;
    }

    if (raw === undefined || raw === null) return false;
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "object" && raw !== null) {
        if (raw.status === "ok") return true;
        if (raw.status === "issue") return false;
    }
    return Boolean(raw);
}
