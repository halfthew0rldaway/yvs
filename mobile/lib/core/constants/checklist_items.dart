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
  static const List<ChecklistItem> items = [
    ChecklistItem(key: 'touchpad', label: 'Touchpad', icon: Icons.touch_app_outlined),
    ChecklistItem(key: 'software', label: 'Software / Driver', icon: Icons.laptop_chromebook),
    ChecklistItem(key: 'license_office_os', label: 'Lisensi Office + OS', icon: Icons.vpn_key_outlined),
    ChecklistItem(key: 'keyboard', label: 'Keyboard', icon: Icons.keyboard_outlined),
    ChecklistItem(key: 'baterai', label: 'Baterai & Charging', icon: Icons.battery_charging_full_outlined),
    ChecklistItem(key: 'usb_port', label: 'USB Port', icon: Icons.usb_outlined),
    ChecklistItem(key: 'sound', label: 'Sound / Speaker', icon: Icons.volume_up_outlined),
    ChecklistItem(key: 'audio_jack', label: 'Audio Jack 3.5mm', icon: Icons.headphones_outlined),
    ChecklistItem(key: 'wifi_lan', label: 'WiFi / LAN Network', icon: Icons.wifi),
    ChecklistItem(key: 'webcam', label: 'Webcam Kamera', icon: Icons.camera_alt_outlined),
    ChecklistItem(key: 'optical_drive', label: 'Optical Drive (CD/DVD)', icon: Icons.album_outlined),
    ChecklistItem(key: 'kebersihan', label: 'Kondisi Kebersihan', icon: Icons.cleaning_services_outlined),
    ChecklistItem(key: 'program_khusus', label: 'Program Khusus', icon: Icons.memory_outlined),
    ChecklistItem(key: 'os_status', label: 'Kondisi OS (Ringan/Lambat)', icon: Icons.speed_outlined),
    ChecklistItem(key: 'request_customer', label: 'Request dari Customer', icon: Icons.chat_bubble_outline),
  ];
}

