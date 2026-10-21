# Serv.io Technician Mobile App (Flutter)

Aplikasi mobile khusus teknisi bengkel servis (Workbench) untuk mengelola tiket pengerjaan servis, scan QR barcode tiket fisik, checklist diagnosis, dan alokasi sparepart.

## Dokumentasi Desain UI/UX & Google Stitch

Spesifikasi lengkap desain antarmuka (Design System, Tokens, Wireframe Prompt, Zero-Overflow Rules, Zero Emojis) untuk **Google Stitch** dan implementasi Flutter tersedia di:
- [Spesifikasi Desain UI/UX & Google Stitch Prompt Guide](README_STITCH_UI_UX.md)

## Arsitektur & Struktur Folder

```
mobile/
├── android/              # Konfigurasi Native Android (Camera & Internet permissions)
├── assets/               # Asset statis, ikon, dan resource
├── lib/
│   ├── core/
│   │   ├── constants/    # Konfigurasi endpoint backend (api_constants.dart)
│   │   ├── network/      # HTTP Client Dio & Auth Interceptors (api_client.dart)
│   │   └── theme/        # Solid Design System Serv.io (app_theme.dart)
│   ├── features/
│   │   ├── auth/         # Login Teknisi (login_screen.dart)
│   │   ├── dashboard/    # Meja Servis Teknisi (dashboard_screen.dart)
│   │   ├── scanner/      # Scanner Barcode/QR Tiket (qr_scanner_screen.dart)
│   │   ├── tickets/      # Pengerjaan Tiket & Checklist
│   │   └── sparepart/    # Alokasi Sparepart
│   └── main.dart         # Entry point aplikasi
└── pubspec.yaml          # Dependencies Flutter
```

## Menjalankan Aplikasi di Development

1. Pastikan Flutter SDK sudah terpasang di sistem (`flutter --version`).
2. Masuk ke direktori:
   ```bash
   cd mobile
   flutter pub get
   ```
3. Konfigurasi IP Backend:
   - Buka `lib/core/constants/api_constants.dart`.
   - Jika dijalankan di **Android Emulator**, gunakan: `http://10.0.2.2:5001/api`.
   - Jika dijalankan di **Perangkat Fisik (HP)** via Wi-Fi, gunakan IP LAN komputer Anda, contoh: `http://192.168.1.x:5001/api`.
4. Jalankan aplikasi:
   ```bash
   flutter run
   ```

