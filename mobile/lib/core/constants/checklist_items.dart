import 'package:flutter/material.dart';

class ChecklistItem {
  final String key;
  final String label;
  final IconData icon;

  const ChecklistItem({
    required this.key,
    required this.label,
    required this.icon,
  });
}

class ChecklistData {
  // 1. Laptop Checklist Items
  static const List<ChecklistItem> laptopItems = [
    ChecklistItem(key: 'usb', label: 'Port USB', icon: Icons.usb_outlined),
    ChecklistItem(key: 'type_c', label: 'Port Type-C', icon: Icons.usb_outlined),
    ChecklistItem(key: 'hdmi', label: 'Port HDMI / Display', icon: Icons.monitor_outlined),
    ChecklistItem(key: 'keyboard', label: 'Keyboard', icon: Icons.keyboard_outlined),
    ChecklistItem(key: 'touchpad', label: 'Touchpad', icon: Icons.touch_app_outlined),
    ChecklistItem(key: 'layar', label: 'Layar / LCD', icon: Icons.laptop_chromebook),
    ChecklistItem(key: 'webcam', label: 'Webcam Kamera', icon: Icons.camera_alt_outlined),
    ChecklistItem(key: 'mic', label: 'Mikrofon (Mic)', icon: Icons.mic_outlined),
    ChecklistItem(key: 'speaker', label: 'Speaker Audio', icon: Icons.volume_up_outlined),
    ChecklistItem(key: 'audio_jack', label: 'Audio Jack 3.5mm', icon: Icons.headphones_outlined),
    ChecklistItem(key: 'wifi_bt', label: 'WiFi & Bluetooth', icon: Icons.wifi),
    ChecklistItem(key: 'baterai', label: 'Baterai & Charging', icon: Icons.battery_charging_full_outlined),
    ChecklistItem(key: 'ram', label: 'Slot RAM', icon: Icons.memory_outlined),
    ChecklistItem(key: 'storage', label: 'SSD / Storage', icon: Icons.storage_outlined),
    ChecklistItem(key: 'fan_thermal', label: 'Fan & Pendingin', icon: Icons.mode_fan_off_outlined),
  ];

  // 2. PC / Desktop PC Checklist Items (Motherboard, Bracket Fan, GPU, PSU, dll.)
  static const List<ChecklistItem> pcItems = [
    ChecklistItem(key: 'motherboard_socket', label: 'Mobo & Bracket Fan CPU', icon: Icons.developer_board_outlined),
    ChecklistItem(key: 'cpu_fan', label: 'Processor & Fan Heatsink', icon: Icons.speed_outlined),
    ChecklistItem(key: 'ram', label: 'RAM / Memory', icon: Icons.memory_outlined),
    ChecklistItem(key: 'vga_gpu', label: 'VGA Card / Discrete GPU', icon: Icons.monitor_outlined),
    ChecklistItem(key: 'storage_ssd', label: 'SSD Utama (Health/OS)', icon: Icons.storage_outlined),
    ChecklistItem(key: 'storage_hdd', label: 'HDD Internal / Sekunder', icon: Icons.storage_outlined),
    ChecklistItem(key: 'psu', label: 'Power Supply Unit (PSU)', icon: Icons.power_outlined),
    ChecklistItem(key: 'front_panel', label: 'Port & Tombol Front Panel', icon: Icons.settings_input_component_outlined),
    ChecklistItem(key: 'back_panel', label: 'Port Back Panel I/O', icon: Icons.usb_outlined),
    ChecklistItem(key: 'wifi_lan', label: 'Jaringan (LAN & USB WiFi)', icon: Icons.wifi),
    ChecklistItem(key: 'casing_airflow', label: 'Casing & Sirkulasi Fan', icon: Icons.air_outlined),
    ChecklistItem(key: 'os_benchmark', label: 'Stabilitas OS & Benchmark', icon: Icons.assessment_outlined),
  ];

  // 3. Printer Checklist Items (Hasil cetak, printhead, cartridge, mekanik roller, inkpad, eeprom)
  static const List<ChecklistItem> printerItems = [
    ChecklistItem(key: 'print_result', label: 'Hasil Cetak (Print Test)', icon: Icons.description_outlined),
    ChecklistItem(key: 'printhead', label: 'Kondisi Printhead & Nozzle', icon: Icons.water_drop_outlined),
    ChecklistItem(key: 'cartridge', label: 'Cartridge & Rumah Carriage', icon: Icons.inventory_2_outlined),
    ChecklistItem(key: 'mekanik_roller', label: 'Mekanik & Roller Kertas', icon: Icons.sync_outlined),
    ChecklistItem(key: 'inkpad_waste', label: 'Inkpad / Busa Pembuangan', icon: Icons.delete_outline),
    ChecklistItem(key: 'eeprom_counter', label: 'Memory EEPROM & Counter', icon: Icons.track_changes_outlined),
    ChecklistItem(key: 'tinta_ciss', label: 'Tabung Tinta & Selang CISS', icon: Icons.opacity_outlined),
    ChecklistItem(key: 'body_cleanliness', label: 'Kebersihan Body & Benda Asing', icon: Icons.cleaning_services_outlined),
    ChecklistItem(key: 'scanner_adf', label: 'Scanner & Modul ADF', icon: Icons.document_scanner_outlined),
    ChecklistItem(key: 'port_konektivitas', label: 'Port USB & WiFi Printer', icon: Icons.usb_outlined),
  ];

  // 4. Smartphone / Tablet Checklist Items
  static const List<ChecklistItem> smartphoneItems = [
    ChecklistItem(key: 'touchscreen_lcd', label: 'Layar LCD & Touchscreen', icon: Icons.phone_android_outlined),
    ChecklistItem(key: 'baterai_charging', label: 'Baterai & Port Charging', icon: Icons.battery_charging_full_outlined),
    ChecklistItem(key: 'kamera_depan_belakang', label: 'Kamera Depan & Belakang', icon: Icons.camera_alt_outlined),
    ChecklistItem(key: 'speaker_earpiece', label: 'Speaker & Earpiece Suara', icon: Icons.volume_up_outlined),
    ChecklistItem(key: 'mikrofon', label: 'Mikrofon (Mic)', icon: Icons.mic_outlined),
    ChecklistItem(key: 'sinyal_sim_imei', label: 'Sinyal Seluler & Slot SIM', icon: Icons.cell_tower_outlined),
    ChecklistItem(key: 'wifi_bluetooth', label: 'WiFi & Bluetooth', icon: Icons.wifi),
    ChecklistItem(key: 'tombol_fisik', label: 'Tombol Fisik (Power & Vol)', icon: Icons.smart_button_outlined),
    ChecklistItem(key: 'sensor_biometrik', label: 'Sensor Fingerprint / Face ID', icon: Icons.fingerprint_outlined),
    ChecklistItem(key: 'fisik_casing', label: 'Frame & Backdoor', icon: Icons.check_box_outline_blank_outlined),
  ];

  // 5. Perangkat Lainnya / Aksesoris / Storage
  static const List<ChecklistItem> otherItems = [
    ChecklistItem(key: 'power_supply', label: 'Daya Masuk & Adaptor Power', icon: Icons.power_outlined),
    ChecklistItem(key: 'tombol_kontrol', label: 'Tombol & Indikator LED', icon: Icons.smart_button_outlined),
    ChecklistItem(key: 'port_io', label: 'Port Konektivitas I/O', icon: Icons.usb_outlined),
    ChecklistItem(key: 'fungsi_utama', label: 'Fungsi Operasional Utama', icon: Icons.check_circle_outline),
    ChecklistItem(key: 'fisik_kebersihan', label: 'Kondisi Fisik & Kelengkapan', icon: Icons.cleaning_services_outlined),
  ];

  // Default items untuk backward compatibility
  static const List<ChecklistItem> items = laptopItems;

  /// Peta seluruh label checklist yang dikenal aplikasi (key -> item).
  /// Dipakai sebagai KAMUS LABEL saja — bukan sumber data kebenaran.
  static final Map<String, ChecklistItem> _labelDictionary = {
    for (final item in [
      ...laptopItems,
      ...pcItems,
      ...printerItems,
      ...smartphoneItems,
      ...otherItems,
    ])
      item.key: item,
  };

  /// Bangun daftar checklist yang MENGIKUTI DATA STAGING.
  ///
  /// Urutan sumber:
  ///   1. Key yang benar-benar tersimpan pada `checklist_intake` / `checklist_qc`
  ///      milik tiket (data asli dari database staging) — hanya key ini yang
  ///      ditampilkan, sehingga aplikasi tidak pernah menampilkan item yang
  ///      tidak ada di tiket.
  ///   2. Jika tiket belum punya checklist sama sekali, pakai template lokal
  ///      sesuai jenis perangkat sebagai fallback tampilan awal.
  ///
  /// Label & ikon diambil dari kamus lokal; key tak dikenal tetap ditampilkan
  /// memakai key tersebut sebagai label agar tidak ada data yang hilang.
  static List<ChecklistItem> resolveForTicket(
    String? jenisPerangkat,
    Map<String, dynamic>? storedChecklist,
  ) {
    final storedKeys = storedChecklist?.keys.where((k) => k.trim().isNotEmpty).toList() ?? const <String>[];
    if (storedKeys.isEmpty) {
      return getItemsForDevice(jenisPerangkat);
    }

    return storedKeys.map((key) {
      final known = _labelDictionary[key];
      if (known != null) return known;
      return ChecklistItem(
        key: key,
        label: key.replaceAll('_', ' ').trim(),
        icon: Icons.check_circle_outline,
      );
    }).toList();
  }

  /// Resolusi checklist spesifik berdasarkan jenis perangkat tiket
  static List<ChecklistItem> getItemsForDevice(String? jenisPerangkat) {
    if (jenisPerangkat == null || jenisPerangkat.isEmpty) return laptopItems;
    final j = jenisPerangkat.toLowerCase().trim();

    if (j.contains('printer') || j.contains('scanner') || j.contains('cetak') || j.contains('plotter') || j.contains('pos')) {
      return printerItems;
    }
    if (j.contains('desktop') || j.contains('pc') || j.contains('komputer') || j.contains('tower') || j.contains('all-in-one') || j.contains('aio') || j.contains('rakitan')) {
      return pcItems;
    }
    if (j.contains('smartphone') || j.contains('hp') || j.contains('handphone') || j.contains('tablet') || j.contains('ipad') || j.contains('tab') || j.contains('android') || j.contains('iphone')) {
      return smartphoneItems;
    }
    if (j.contains('laptop') || j.contains('notebook') || j.contains('ultrabook') || j.contains('macbook')) {
      return laptopItems;
    }
    return otherItems;
  }
}
