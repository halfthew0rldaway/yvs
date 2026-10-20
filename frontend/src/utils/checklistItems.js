import { 
    MousePointer, 
    AppWindow, 
    KeyRound, 
    Keyboard, 
    BatteryCharging, 
    Usb, 
    Volume2, 
    Headphones, 
    Wifi, 
    Camera, 
    Disc, 
    Sparkles, 
    Cpu, 
    Gauge, 
    MessageSquare,
    MonitorSmartphone,
    Package
} from "lucide-react";

export const CHECKLIST_ITEMS = [
    { key: "touchpad", label: "Touchpad", Icon: MousePointer },
    { key: "software", label: "Software / Driver", Icon: AppWindow },
    { key: "license_office_os", label: "Lisensi Office + OS", Icon: KeyRound },
    { key: "keyboard", label: "Keyboard", Icon: Keyboard },
    { key: "baterai", label: "Baterai & Charging", Icon: BatteryCharging },
    { key: "usb_port", label: "USB Port", Icon: Usb },
    { key: "sound", label: "Sound / Speaker", Icon: Volume2 },
    { key: "audio_jack", label: "Audio Jack 3.5mm", Icon: Headphones },
    { key: "wifi_lan", label: "WiFi / LAN Network", Icon: Wifi },
    { key: "webcam", label: "Webcam Kamera", Icon: Camera },
    { key: "optical_drive", label: "Optical Drive (CD/DVD)", Icon: Disc },
    { key: "kebersihan", label: "Kondisi Kebersihan", Icon: Sparkles },
    { key: "program_khusus", label: "Program Khusus", Icon: Cpu },
    { key: "os_status", label: "Kondisi OS (Ringan/Lambat)", Icon: Gauge },
    { key: "request_customer", label: "Request dari Customer", Icon: MessageSquare },
];

export const QC_CHECKLIST_ITEMS = [
    { 
        key: "power_test", 
        label: "Daya & Pengisian Baterai", 
        desc: "Power ON stabil, adaptor charger mengisi, baterai berfungsi normal", 
        Icon: BatteryCharging 
    },
    { 
        key: "display_test", 
        label: "Tampilan Layar & GPU", 
        desc: "Resolusi jernih, bebas garis/artefak, kecerahan & engsel normal", 
        Icon: MonitorSmartphone 
    },
    { 
        key: "keyboard_touchpad", 
        label: "Keyboard & Touchpad", 
        desc: "Semua tuts merespons responsif, klik kiri/kanan touchpad presisi", 
        Icon: Keyboard 
    },
    { 
        key: "audio_multimedia", 
        label: "Speaker, Mic & Webcam", 
        desc: "Suara speaker jernih tidak pecah, input mikrofon & kamera aktif", 
        Icon: Volume2 
    },
    { 
        key: "port_io_connectivity", 
        label: "Port I/O & Konektivitas", 
        desc: "Port USB/HDMI/Audio normal, WiFi & Bluetooth terhubung lancar", 
        Icon: Usb 
    },
    { 
        key: "os_thermal_performance", 
        label: "Stabilitas OS & Suhu", 
        desc: "Booting lancar tanpa crash, putaran fan halus, suhu kerja stabil", 
        Icon: Gauge 
    },
    { 
        key: "clean_wow", 
        label: "Pembersihan WOW Service", 
        desc: "Unit dilap bersih menyeluruh, bebas sidik jari/debu, layar kinclong", 
        Icon: Sparkles 
    },
    { 
        key: "accessories_handover", 
        label: "Verifikasi Kelengkapan Aksesori", 
        desc: "Baut casing lengkap rapi, charger/tas/kelengkapan sesuai data intake", 
        Icon: Package 
    },
];

