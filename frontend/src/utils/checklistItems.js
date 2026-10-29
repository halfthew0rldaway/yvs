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
    HardDrive
} from "lucide-react";

/**
 * 15 Standardized Hardware Checklist Components aligned with DiagnosisForm
 */
export const HARDWARE_CHECKLIST_ITEMS = [
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

/**
 * Standard Intake / Diagnosis checklist items (Mapped from HARDWARE_CHECKLIST_ITEMS)
 */
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

/**
 * Standard Quality Control (QC) Checklist after service:
 * Exactly aligns with the 15 hardware items tested in diagnosis, plus 2 WOW Service finishing checks.
 */
export const QC_CHECKLIST_ITEMS = [
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

/**
 * Robust value resolver supporting both new standard keys and legacy ticket schema
 */
export function getChecklistValue(obj, key, legacyKey = null) {
    if (!obj || typeof obj !== "object") return false;
    if (obj[key] !== undefined) return Boolean(obj[key]);
    if (legacyKey && obj[legacyKey] !== undefined) return Boolean(obj[legacyKey]);

    // Additional dynamic fallbacks
    if (key === "usb" && obj.usb_port !== undefined) return Boolean(obj.usb_port);
    if (key === "speaker" && obj.sound !== undefined) return Boolean(obj.sound);
    if (key === "wifi_bt" && obj.wifi_lan !== undefined) return Boolean(obj.wifi_lan);
    if (key === "baterai" && obj.power_test !== undefined) return Boolean(obj.power_test);
    if (key === "layar" && obj.display_test !== undefined) return Boolean(obj.display_test);
    if (key === "keyboard" && obj.keyboard_touchpad !== undefined) return Boolean(obj.keyboard_touchpad);
    if (key === "touchpad" && obj.keyboard_touchpad !== undefined) return Boolean(obj.keyboard_touchpad);
    return false;
}
