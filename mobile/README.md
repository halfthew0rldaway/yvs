# Serv.io Companion Mobile App (Flutter)

Aplikasi pendamping operasional mobile workshop komputer & gadget (**Serv.io Companion**) yang dirancang untuk mendukung kelincahan kerja **Teknisi** di meja servis dan **Frontman / Kasir** di meja depan.

---

## 🚀 Fitur Unggulan Serv.io Companion

### 1. Role: Frontman / Kasir (Front Desk & Handover)
- **Serah Terima Unit Cepat (Fast Handover)**:
  - Pelanggan datang mengambil unit $\rightarrow$ Frontman scan QR Tiket fisik/WhatsApp.
  - Tampilan ringkasan unit, keluhan yang diselesaikan, dan rincian total pelunasan invoice.
  - **Tanda Tangan Digital Touchscreen Langsung**: Pelanggan membubuhkan tanda tangan digital menggunakan jari di layar HP/tablet.
  - Sekali ketuk, status tiket otomatis diperbarui menjadi `diambil` dan tautan Kartu Garansi Digital dapat langsung dikirim via WhatsApp.
- **Pencarian Tiket Kilat**: Cari status servis berdasarkan nomor tiket, nomor telepon, nama pelanggan, atau tipe unit tanpa harus bolak-balik ke meja kasir.
- **Katalog Sparepart Konsumen**: Menampilkan stok unit dan harga jual resmi toko (harga modal kulakan HPP disembunyikan demi kerahasiaan bisnis).
- **Presensi Selfie + GPS**: Check-in dan check-out harian mandiri dari HP.

### 2. Role: Teknisi (Workbench & Pengerjaan Unit)
- **Meja Kerja Servis (Workbench)**: Pantau tiket ditugaskan, antrean tersedia, dan metrik SLA kepatuhan.
- **Checklist Diagnosis & QC**: Checklist multi-point inspeksi unit pra-pengerjaan dan pra-penyerahan.
- **Alokasi Sparepart**: Catat suku cadang yang digunakan pada tiket secara presisi.
- **Dokumentasi Visual Kamera**: Ambil foto/video kondisi kerusakan komponen fisik langsung dari kamera HP.
- **Buku Saku SOP Wiki**: Akses cepat ke pustaka panduan perbaikan hardware/software.

### 3. Kemampuan Offline-First (Offline Capability & Sync)
- **Cache-First Architecture**: Setiap data tiket, sparepart, dan profil yang berhasil diambil otomatis disimpan di penyimpanan lokal (`SharedPreferences`).
- **Resiliensi Jaringan**: Jika Wi-Fi workshop terputus atau sinyal seluler drop, aplikasi tetap menampilkan data terakhir yang tersimpan dengan penanda `OfflineBanner`.
- **Tarik untuk Sinkronisasi (Pull-to-Refresh)**: Staf dapat menarik layar ke bawah kapan saja untuk menyinkronkan data terbaru dengan server pusat ERP.

---

## 📂 Arsitektur Folder Flutter

```
mobile/
├── android/                  # Konfigurasi Native Android (Camera & GPS permissions)
├── assets/                   # Asset statis, ikon, dan resource
├── lib/
│   ├── core/
│   │   ├── constants/        # Endpoint API & konfigurasi server (api_constants.dart)
│   │   ├── network/          # HTTP Client Dio dengan Cache-First (api_client.dart)
│   │   ├── services/         # Offline Cache Service (offline_cache_service.dart)
│   │   ├── theme/            # Solid Clean Design System (app_theme.dart)
│   │   ├── utils/            # Helper mata uang, status, dan WhatsApp
│   │   └── widgets/          # Signature Pad, Offline Banner, Status Badge
│   ├── data/
│   │   ├── models/           # Tiket, Sparepart, User, Wiki, Invoice Models
│   │   └── providers/        # State management Riverpod
│   ├── features/
│   │   ├── attendance/       # Presensi Selfie & Geofencing GPS (attendance_screen.dart)
│   │   ├── auth/             # Login Companion (login_screen.dart)
│   │   ├── dashboard/        # Meja Kerja & Shortcut Cepat (dashboard_screen.dart)
│   │   ├── handover/         # Serah Terima Unit & TTD Digital (handover_screen.dart)
│   │   ├── navigation/       # Role-Aware Navigation Bar (main_navigation_screen.dart)
│   │   ├── scanner/          # Laser Barcode/QR Scanner (qr_scanner_screen.dart)
│   │   ├── sparepart/        # Katalog Stok & Harga Eceran (sparepart_list_screen.dart)
│   │   ├── tickets/          # Manajemen Tiket & Diagnosis
│   │   └── wiki/             # SOP Buku Saku Meja Kerja
│   └── main.dart             # Entry point aplikasi Serv.io Companion
└── pubspec.yaml              # Konfigurasi dependensi Flutter
```

---

## 🛠️ Menjalankan Aplikasi di Development

1. Masuk ke direktori `mobile`:
   ```bash
   cd mobile
   ```
2. Jalankan dependensi:
   ```bash
   flutter pub get
   ```
3. Konfigurasi alamat server ERP di `lib/core/constants/api_constants.dart`:
   - Production VPS: `https://101.32.127.55.nip.io/api`
   - Android Emulator: `http://10.0.2.2:5001/api`
   - HP Fisik via Wi-Fi: `http://<IP_LAN_KOMPUTER>:5001/api`
4. Jalankan aplikasi:
   ```bash
   flutter run
   ```
