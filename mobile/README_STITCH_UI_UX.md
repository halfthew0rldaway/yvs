# Serv.io Technician Mobile App - UI/UX Design System & Google Stitch Specification

> **Catatan Arsitektur Desain**: Dokumen ini merupakan spesifikasi antarmuka resmi untuk aplikasi mobile **Serv.io Technician Workbench (Flutter)** yang diturunkan **100% konsisten dari Serv.io Workshop Platform (Web App ERP)**. Seluruh komponen, palet warna, tipografi, kartu metrik, hingga alur kerja disesuaikan secara presisi dengan versi Web modern (Clean Light Mode, Enterprise SaaS, Zero-Slop, High-Contrast). **Dilarang keras menggunakan kontainer/header hitam, background gelap pekat, atau meniru desain mobile legacy yang lama.**

Dokumen ini dirancang sebagai panduan instruksi dan prompt siap pakai untuk **Google Stitch (Google AI UI/UX Design Generator)**, Figma design system, serta referensi implementasi tim frontend Flutter.

---

## 1. Prinsip Desain & Filosofi Visual Serv.io

Aplikasi mobile Serv.io mengadopsi standar visual **Modern Enterprise Workshop SaaS** (setara Linear, Stripe, dan Vercel) yang dioptimalkan untuk meja kerja teknisi reparasi laptop/komputer.

### 1.1 Persona Pengguna & Ergonomi Meja Kerja
* **Pengguna Utama**: Teknisi Servis Laptop/PC, Teknisi Lapangan, dan Kepala Bengkel (Workshop Lead).
* **Lingkungan Kerja**:
  * Penggunaan **satu tangan (one-handed thumb zone)** saat memegang obeng, multimeter, atau alat servis di tangan lainnya.
  * Tangan sering mengenakan sarung tangan antistatis (ESD gloves) atau berdebu perbaikan: memerlukan **target sentuh besar (minimal 48x48 dp)**.
  * Meja servis diterangi lampu servis LED terang (anti-glare, membutuhkan kontras tinggi pada background putih/terang, bukan gelap redup).
  * Kebutuhan akses cepat ke pemindaian QR tiket fisik, kredensial password unit pelanggan, katalog stok sparepart riil, dan panduan troubleshooting (Wiki).

### 1.2 Aturan Desain Inti (Non-Negotiable Design Rules)
1. **Light & Airy Aesthetic (Bebas Warna Hitam Pekat)**:
   * **Tidak ada header hitam, tidak ada hero card hitam, dan tidak ada pill chip hitam.**
   * Seluruh scaffold menggunakan kanvas **Slate-50 (`#F8FAFC`)** dengan kartu permukaan **Pure White (`#FFFFFF`)**.
   * Brand utama adalah **Royal Blue (`#2563EB`)** yang dipadukan dengan aksen lembut **Soft Blue Tint (`#EFF6FF`)** dan garis batas tipis **Slate-200 (`#E2E8F0`)**.
2. **Zero Emojis**: Dilarang menggunakan karakter unicode emoji (seperti 🔧, 💻, ⚠️, 🚀) pada UI, badge, tombol, maupun placeholder. Gunakan ikon vektor berstandar industri (**Lucide Icons** atau **Material Symbols Outlined**).
3. **Solid Contrast & Readable Typography**: Warna teks utama adalah **Deep Slate-900 (`#0F172A`)** dan keterangan sekunder **Slate-500 (`#64748B`)**. Slate-900 **hanya digunakan untuk teks**, bukan sebagai latar belakang kontainer!
4. **Anti-Overflow & Responsive Best Practice**: Seluruh layar wajib menggunakan scrolling layout, `Expanded`/`Flexible` untuk teks dinamis, dan keyboard avoidance padding (`viewInsets`) agar terbebas dari bug layout `RenderFlex overflowed`.

---

## 2. Design Tokens & Visual Foundation (Berdasarkan Serv.io Web App)

### 2.1 Palet Warna Resmi (Hex Codes)

| Kategori Token | Nama Token | Nilai Hex | Penggunaan UI |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | `primary` | `#2563EB` (Blue 600) | Tombol CTA utama, ikon aktif, tab bar aktif, floating button |
| **Brand Hover/Pressed**| `primaryHover` | `#1D4ED8` (Blue 700) | State tombol saat ditekan |
| **Brand Soft / Tint** | `primaryLight` | `#EFF6FF` (Blue 50) | Background chip filter aktif, container ikon aktif, sidebar highlight |
| **Brand Border** | `primaryBorder`| `#DBEAFE` (Blue 100) | Garis tepi chip aktif, ring fokus input |
| **Canvas Background** | `background` | `#F8FAFC` (Slate 50) | Background seluruh scaffold layar aplikasi |
| **Surface (Card/Modal)**| `surface` | `#FFFFFF` (Pure White) | Kartu tiket, modal sheet, popover, dialog |
| **Card Border** | `border` | `#E2E8F0` (Slate 200) | Garis batas kartu, pemisah list, border text field |
| **Subtle Divider** | `borderLight` | `#F1F5F9` (Slate 100) | Garis pemisah baris data internal |
| **Text Primary** | `textPrimary` | `#0F172A` (Slate 900) | Judul utama, angka metrik besar, label tebal |
| **Text Secondary** | `textSecondary`| `#475569` (Slate 600) | Deskripsi keluhan, isi teks kartu, label input |
| **Text Muted** | `textMuted` | `#94A3B8` (Slate 400) | Placeholder text field, timestamp, nomor seri sekunder |
| **Success / QC Pass** | `success` | `#10B981` (Emerald 500)| Indikator selesai, QC passed, garansi aktif |
| **Success Soft Surface**| `successBg` | `#ECFDF5` (Emerald 50) | Latar badge selesai / disetujui |
| **Success Border** | `successBorder`| `#A7F3D0` (Emerald 200)| Border badge selesai / disetujui |
| **Success Text** | `successText` | `#047857` (Emerald 700)| Teks status selesai / disetujui |
| **Warning / Queue** | `warning` | `#F59E0B` (Amber 500) | Status menunggu persetujuan (ACC), antrean baru |
| **Warning Soft Surface**| `warningBg` | `#FFFBEB` (Amber 50) | Latar badge antrean / prioritas express |
| **Warning Border** | `warningBorder`| `#FDE68A` (Amber 200)| Border badge warning |
| **Warning Text** | `warningText` | `#B45309` (Amber 700)| Teks status antrean / prioritas express |
| **Danger / Overdue** | `danger` | `#EF4444` (Red 500) | SLA melewati batas waktu (Overdue), stok habis, tombol hapus/keluar |
| **Danger Soft Surface** | `dangerBg` | `#FEF2F2` (Red 50) | Latar peringatan tiket overdue |
| **Danger Border** | `dangerBorder` | `#FECACA` (Red 200) | Border peringatan tiket overdue |
| **Danger Text** | `dangerText` | `#B91C1C` (Red 700) | Teks peringatan tiket overdue |
| **Repair / In Progress**| `indigo` | `#6366F1` (Indigo 500)| Status unit sedang dalam pengerjaan teknisi |
| **Repair Soft Surface** | `indigoBg` | `#EEF2FF` (Indigo 50) | Latar badge unit dalam pengerjaan |
| **Repair Border** | `indigoBorder` | `#C7D2FE` (Indigo 200)| Border badge dalam pengerjaan |
| **Repair Text** | `indigoText` | `#4338CA` (Indigo 700)| Teks status dalam pengerjaan |
| **Diagnosis** | `sky` | `#0284C7` (Sky 600) | Status fase diagnosis / investigasi awal |
| **Diagnosis Soft** | `skyBg` | `#F0F9FF` (Sky 50) | Latar badge diagnosis |
| **Picked Up / Handover**| `teal` | `#0D9488` (Teal 600) | Status unit telah diambil pelanggan |
| **Picked Up Soft** | `tealBg` | `#F0FDFA` (Teal 50) | Latar badge unit telah diambil |

---

### 2.2 Hierarki Tipografi (Typography Scale)

* **Font Utama**: `Inter` atau `Plus Jakarta Sans`
* **Font Monospace (Kode Tiket, SKU, Serial Number)**: `JetBrains Mono`

| Level Tipografi | Ukuran (sp) | Berat (Weight) | Tracking | Warna Baku | Penggunaan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Metric**| 24sp | Bold (700) | -0.6px | `#0F172A` | Angka besar ringkasan KPI tiket aktif |
| **Heading 1 (H1)** | 20sp | Bold (700) | -0.4px | `#0F172A` | Judul layar utama, header meja servis |
| **Heading 2 (H2)** | 16sp | SemiBold (600) | -0.2px | `#0F172A` | Nomor tiket `#TKT-...`, nama modul kartu |
| **Heading 3 (H3)** | 14sp | SemiBold (600) | -0.1px | `#0F172A` | Sub-judul section, nama sparepart |
| **Body Regular** | 13sp / 14sp | Regular (400) | 0.0px | `#475569` | Keluhan customer, deskripsi perbaikan |
| **Body SemiBold** | 13sp / 14sp | SemiBold (600) | 0.0px | `#0F172A` | Nama customer, nominal biaya rupiah |
| **Caption / Meta** | 11sp / 12sp | Medium (500) | +0.1px | `#64748B` | Waktu timestamp, tanggal masuk, SN |
| **Badge / Tag** | 10sp / 11sp | Bold (700) | +0.5px (UPPER) | Sesuai status | Label status tiket, chip filter |

---

### 2.3 Sistem Dimensi, Radius, & Grid (8-pt Spatial System)

* **Corner Radius**:
  * `radius-pill`: 9999px (Chip status, tag prioritas, toggle switcher)
  * `radius-lg`: 14px - 16px (Kartu tiket, kartu metrik, container input)
  * `radius-md`: 10px - 12px (Tombol aksi, input field, modal container)
  * `radius-sm`: 6px - 8px (Badge status internal, thumbnail foto)
  * `radius-sheet`: 24px (Border atas Bottom Sheet Modal)
* **Shadows & Elevation**:
  * `shadow-card`: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)` (Sangat halus, bersih, tidak kotor/blur berlebihan)
  * `shadow-button`: `0 2px 4px -1px rgba(37, 99, 235, 0.15)`
* **Touch Targets**:
  * Tinggi tombol utama (Primary CTA): **48px - 50px**.
  * Input field text: **48px** dengan padding horizontal **14px**.
  * Icon button minimum: **44x44 dp**.

---

## 3. Arsitektur Informasi & Pemetaan Modul Serv.io

Aplikasi mobile dirancang untuk menyediakan fungsi workbench komprehensif bagi teknisi dengan alur modular yang langsung sinkron ke backend Serv.io:

```
                                [Serv.io Mobile Workbench]
                                            │
    ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
    ▼                   ▼                   ▼                   ▼                   ▼
[1. Dashboard]     [2. Tiket Servis]   [3. Detail Tiket]   [4. Pustaka Wiki]   [5. Profil & KPI]
 • KPI Donut SLA    • Search & Filter   • Multi-step Status • Search Solusi     • Skor CSAT
 • Alert Overdue    • Chip Filter Soft  • Unit Credentials  • SOP Perbaikan     • Tiket Selesai
 • Alert Express    • Quick WhatsApp    • 15-Point Intake   • Skematik/BIOS     • Status Online
 • Quick Action     • Take-over Antrean • Diagnosis & Biaya • Kode Error        • Tombol SOP WOW
 • Stok Menipis                         • Alokasi Sparepart
 • Recent Log                           • Bukti Foto Kerja
                                        • 8-Point WOW QC
                                        • WhatsApp Quoter
```

### 12 Modul & Layar Esensial yang Dibutuhkan:
1. **Screen 1: Authentication & Biometric Login** (Login bersih tanpa warna hitam).
2. **Screen 2: Workbench Dashboard (Meja Kerja Teknisi)** (Statistik KPI SLA Donut, alert overdue, aksi cepat, stok menipis).
3. **Screen 3: Tiket Servis Queue & Filter Hub** (Daftar tiket dengan chip filter soft-blue).
4. **Screen 4: Tiket Servis Detail & Digital Workbench** (Pusat pengerjaan lengkap, timeline, dan action bar).
5. **Screen 5: Modal Input Diagnosis & Kalkulator Biaya** (Analisis teknis, biaya jasa, estimasi part).
6. **Screen 6: Katalog Suku Cadang & Gudang (Sparepart Hub)** (Cek ketersediaan stok, harga, dan alokasi ke tiket).
7. **Screen 7: Pustaka Wiki & Panduan Troubleshooting** (Solusi kerusakan laptop, skematik, dan SOP bengkel).
8. **Screen 8: Scanner Barcode / QR Tiket Fisik & OCR SN** (Kamera scanner label tiket cepat).
9. **Screen 9: Retensi & Maintenance Recall (CRM Pasca Servis)** (Pengingat servis berkala 3-6 bulan via WhatsApp).
10. **Screen 10: Rekam Medis Perangkat & Riwayat Servis** (Histori perbaikan berdasarkan Serial Number).
11. **Screen 11: Inspeksi 15-Point Intake & 8-Point WOW Quality Control (QC)** (Verifikasi wajib sebelum serah terima).
12. **Screen 12: Profil Teknisi & Scorecard KPI Performa** (Metrik kerja, kepuasan pelanggan, dan panduan WOW).

---

## 4. Spesifikasi Layar & Prompt Siap-Pakai Google Stitch

Setiap prompt Google Stitch di bawah ini dirancang dengan standar kualitas tinggi (**Fancy, Clean, Enterprise SaaS, Zero-Slop, Pure Light Theme**). Dapat langsung disalin ke input prompt **Google Stitch**.

---

### Screen 1: Otentikasi & Login Teknisi (Authentication Screen)

* **Tujuan**: Autentikasi aman teknisi bengkel dengan desain modern yang bersih, terang, dan profesional.
* **Elemen UI**:
  * Background: Pure White (`#FFFFFF`) / Slate-50 (`#F8FAFC`).
  * Brand Header: Ikon Wrench warna putih di dalam rounded box Blue-600 (`#2563EB`, ukuran 40x40 dp), teks judul **"Serv.io"** (22sp Bold `#0F172A`) dan sub-label **"Workshop Platform • Meja Kerja Teknisi"** (12sp Slate-500).
  * Kartu Login: Kontainer putih dengan border tipis Slate-200 (`#E2E8F0`), padding 20px, rounded 16px.
  * Input Form: Email dan Password dengan prefix icon Lucide (`Mail`, `Lock`), show/hide password toggle, dan focus border Blue-600.
  * Tombol Masuk: Full-width elevated button warna Blue-600 (`#2563EB`), tinggi 48px, teks bold putih "Masuk ke Meja Servis".
  * Quick Biometric Access: Opsi Fingerprint / Face ID unlock untuk teknisi yang sudah terdaftar.

```stitch
PROMPT GOOGLE STITCH - SCREEN 1: LOGIN & AUTHENTICATION
Role: High-End Enterprise Mobile UI Designer.
Platform: Flutter Mobile (iOS & Android).
Theme: Pure Light Mode, Ultra-clean, SaaS Best Practice (Inspired by Serv.io Web App). No dark/black containers.

Layout & Structure:
- Scaffold Background: Solid Slate-50 (#F8FAFC). Safe area enabled.
- Centered Content Container with SingleChildScrollView (prevents keyboard layout overflow).
- Header Branding:
  - Blue-600 (#2563EB) rounded square icon container (44x44 dp, 12px radius) containing a clean white wrench/settings icon.
  - App Name: "Serv.io" (22px Bold, Deep Slate-900 #0F172A).
  - Subtitle: "Workshop Platform • Meja Kerja Teknisi" (12px, Slate-500 #64748B).
- Form Card:
  - Surface: Pure White (#FFFFFF) card with 1px border (#E2E8F0) and 16px corner radius.
  - Title: "Masuk ke Akun Anda" (16px SemiBold, #0F172A) with subtext "Gunakan akun teknisi yang terdaftar di bengkel" (12px, #64748B).
  - Email Field: Outline input, 48px height, rounded 10px, prefix mail icon, placeholder "teknisi@servio.id", border #E2E8F0, focus ring Blue-600.
  - Password Field: Outline input, 48px height, rounded 10px, prefix lock icon, suffix eye-toggle icon, placeholder "••••••••".
  - Remember Me Row: Checkbox with label "Ingat akun di perangkat ini" + link "Bantuan Admin".
  - Submit Button: Full-width Blue-600 (#2563EB) button, height 48px, rounded 10px, white bold text "Masuk ke Meja Servis", subtle drop shadow (0 2px 4px rgba(37,99,235,0.15)).
  - Biometric Button: Outlined button with fingerprint icon and text "Masuk Cepat dengan Biometrik".
- Footer:
  - Centered note: "Serv.io Workshop Platform v2.4 • Keamanan Kredensial Terenkripsi" (11px, Slate-400).
Constraints: Zero emojis, zero dark containers, strict 8pt grid, clean micro-interactions.
```

---

### Screen 2: Meja Kerja Utama (Workbench Dashboard)

* **Tujuan**: Pusat monitoring harian teknisi servis yang mengadopsi tampilan dashboard web app: metrik SLA Donut, kartu alert tiket kritis, aksi cepat, dan stok suku cadang menipis.
* **Elemen UI**:
  1. **Top Bar**:
     * Salam & Waktu: "Halo, Budi Santoso" (16sp Bold `#0F172A`), tanggal dan live clock "15:42 • Selasa, 20 Oktober 2026" (12sp Slate-500).
     * Switch Status: Toggle pill "Online / On Duty" (Emerald-50 bg, Emerald-700 text).
     * Quick Action Scanner: Tombol ikon scan QR (`#2563EB`) di pojok kanan atas.
  2. **Card SLA Donut & Ringkasan Tiket Aktif**:
     * Lingkaran Donut Chart di sisi kiri: Menampilkan total **"27 Tiket Aktif"** dengan arc persentase warna-warni (Hijau Sesuai Estimasi, Kuning ACC, Merah Overdue).
     * Keterangan Legend di bawah donut: On Track, Warning (<12j), Overdue, Pause (ACC).
  3. **Alert Cards Row (Kartu Peringatan Kritis)**:
     * Card 1: **"Melewati Estimasi (22)"** (Background Red-50 `#FEF2F2`, border Red-200 `#FECACA`, teks Red-700 `#B91C1C`, chevron icon panah kanan).
     * Card 2: **"Prioritas Express (5)"** (Background Amber-50 `#FFFBEB`, border Amber-200 `#FDE68A`, teks Amber-700 `#B45309`, ikon petir/zap).
     * Card 3: **"Menunggu Persetujuan (5)"** (Background White, border Slate-200, ikon jam).
  4. **Quick Action Shortcut Bar**:
     * 4 Tombol cepat bersusun horizontal: `[Scan QR Tiket]`, `[+ Tiket Cepat]`, `[Cek Stok Part]`, `[Pustaka Wiki]`.
  5. **Widget Suku Cadang Menipis (Stok Kritis)**:
     * Mengadopsi tabel web: List suku cadang dengan stok menipis (misal: "Corsair DDR4 16GB - Sisa 0 unit", "Baterai Dell Inspiron 14 - Sisa 1 unit") dengan badge sisa stok berwarna merah/kuning.
  6. **Section Tiket Dalam Pengerjaan Aktif**:
     * List kartu tiket yang sedang dikerjakan dengan badge "DALAM PERBAIKAN", nama customer, tipe laptop, dan hitungan mundur estimasi selesai.

```stitch
PROMPT GOOGLE STITCH - SCREEN 2: WORKBENCH DASHBOARD
Role: Lead Product Designer for Workshop Platform.
Platform: Flutter Mobile (Clean Light SaaS).
Theme: Bright White & Slate-50 background, Blue-600 accents. Matches Serv.io Web ERP exactly. Zero black backgrounds.

Top Bar:
- White surface (#FFFFFF), 1px border-bottom (#E2E8F0), 16px horizontal padding.
- Left: Technician greeting "Halo, Budi Santoso" (16px Bold, #0F172A) + live clock "15:42 WIB • Selasa, 20 Oktober" (11px, #64748B).
- Right: "On Duty" pill badge (Green Emerald-50 bg, Emerald-700 text, 6px radius) + QR Scan icon button in Blue-50 container with Blue-600 icon.

Body (Scrollable, Slate-50 #F8FAFC):
- SLA Donut Summary Card:
  - Pure white card, 14px radius, 1px border (#E2E8F0), padding 16px.
  - Donut ring visual showing "27" in 24px Bold, sublabel "TIKET AKTIF". Ring colored in Emerald-500, Amber-500, and Red-500 segments.
  - Horizontal legend tags below: "On Track: 0", "Warning: 0", "Overdue: 22", "Pause (ACC): 5".
- Urgent Alerts Row (2 side-by-side alert cards):
  - Card A: Soft Red (#FEF2F2 bg, #FECACA border), alert-triangle icon, label "Melewati Estimasi", big number "22" in Red-700, arrow-right icon.
  - Card B: Soft Amber (#FFFBEB bg, #FDE68A border), zap icon, label "Prioritas Express", big number "5" in Amber-700, arrow-right icon.
- Quick Actions Bar (Horizontal 4-grid):
  - 4 clean white shortcut cards with soft borders and 10px radius:
    1. Scan QR Tiket (Blue-50 bg icon)
    2. + Tiket Cepat (Indigo-50 bg icon)
    3. Cek Stok Part (Amber-50 bg icon)
    4. Pustaka Wiki (Emerald-50 bg icon)
- Section "Stok Menipis (Gudang Part)" directly from Web:
  - Header: Alert icon + "Stok Suku Cadang Kritis" with "Katalog →" link.
  - 3 Dense list rows with 1px border-bottom:
    - "Corsair Vengeance DDR4 16GB" -> Red pill "0 unit"
    - "Universal USB-C 65W Fast Charger" -> Red pill "0 unit"
    - "Baterai Dell Inspiron 14 5400" -> Amber pill "1 unit"
- Section "Tiket Sedang Dikerjakan":
  - Card: Ticket #TKT-202410-0089. Status badge: "DALAM PERBAIKAN" (Indigo-50 bg, Indigo-700 text). Unit: "Lenovo Legion 5 15ACH6". Customer: "Hendra Wijaya (0812-9876-5432)". Issue: "Thermal throttle & short VCore". SLA countdown: "Sisa 3 jam".
Bottom Navigation Bar: White surface with 4 items: Dashboard, Tiket, Sparepart, Pustaka Wiki, Profil.
Constraints: 0 emojis, strict vector icons, crisp borders, WCAG AA contrast.
```

---

### Screen 3: Antrean & Filter Tiket Servis (Ticket Queue Hub)

* **Tujuan**: Memungkinkan teknisi memfilter, mencari, dan meninjau antrean servis masuk dari kasir atau unit yang ditugaskan kepada mereka.
* **Elemen UI**:
  1. **Search Bar**: Input pencarian dengan background putih, 44px height, placeholder "Cari nomor tiket, customer, model laptop, SN...".
  2. **Filter Chips Horizontal (Soft Blue Active State)**:
     * Kumpulan chip: `Semua`, `Diterima`, `Didiagnosis`, `Menunggu ACC`, `Disetujui`, `Dalam Perbaikan`, `Selesai`, `Diambil`, `Overdue`, `Express`.
     * **Aturan Chip Aktif**: Background Soft Blue `#EFF6FF`, border `#BFDBFE`, teks Blue-600 `#2563EB` font-semibold. (TIDAK BOLEH HITAM!).
     * **Aturan Chip Non-Aktif**: Background White `#FFFFFF`, border Slate-200 `#E2E8F0`, teks Slate-600 `#475569`.
  3. **Switch Mode Penugasan**:
     * Segmented control tab bersih: `[Tiket Tugas Saya (4)]` vs `[Semua Antrean Bengkel (27)]`.
  4. **Item Kartu Tiket (`TicketCard`)**:
     * Header Baris: Nomor Tiket (`#TKT-202410-0089` monospace bold), Badge Status solid soft-tint, dan Badge Prioritas jika Express.
     * Baris Perangkat: Ikon Laptop + Nama Model (misal: "Asus ROG Zephyrus G14") + Nomor Seri "SN: J4N0CV02...".
     * Baris Pelanggan: Nama Pelanggan + Tombol ikon WhatsApp hijau mini untuk direct chat cepat.
     * Baris Keluhan: Ringkasan gejala keluhan kerusakan (maksimal 2 baris).
     * Footer Baris: Tanggal penerimaan + Label teknisi penanggung jawab (atau badge kuning "Belum Ada Teknisi - Ambil Alih").

```stitch
PROMPT GOOGLE STITCH - SCREEN 3: TICKET QUEUE & FILTER HUB
Role: Enterprise Mobile UX Architect.
Platform: Flutter Mobile (Light Theme).
Theme: Slate-50 Scaffold, Pure White Cards, Blue-600 Highlights. Absolutely NO black chips or dark bars.

Header Section:
- White App Bar: Title "Daftar Tiket Servis" (17px Bold, #0F172A). Action: Filter button with badge indicator.
- Search Input: Height 44px, white background, 1px border (#E2E8F0), rounded 10px, prefix search icon, placeholder "Cari tiket, customer, laptop, SN...".
- Assignment Segmented Switch (2 tabs):
  - Left tab: "Tiket Saya (4)" (Selected: Blue-600 text, Blue-50 bg, Blue-200 border, rounded 8px).
  - Right tab: "Semua Antrean (27)" (Unselected: Slate-600 text, transparent bg).
- Horizontal Scrollable Filter Chips:
  - Selected Chip: Soft Blue-50 background (#EFF6FF), Blue-200 border (#BFDBFE), Blue-600 bold text (#2563EB), rounded-full pill.
  - Unselected Chips: White background (#FFFFFF), Slate-200 border (#E2E8F0), Slate-600 text (#475569).
  - Chip Options: "Semua", "Diterima", "Didiagnosis", "Menunggu ACC", "Perbaikan", "Selesai", "Overdue (22)", "Express (5)".

Ticket Card List (Vertical Scrollable, 12px gap):
- Card Item 1 (Overdue / In Progress):
  - White surface, 1px border (#E2E8F0), 12px corner radius, padding 14px.
  - Top Row: Monospace text "#TKT-202410-0089" (14px Bold) + Status pill "DALAM PERBAIKAN" (Indigo-50 bg, Indigo-700 text, 6px radius) + Red pill "OVERDUE 2h" (Red-50 bg, Red-700 text).
  - Device Row: Laptop icon + "Lenovo Legion 5 15ACH6" (14px SemiBold, #0F172A) • "SN: PF2X9K1L" (12px, #64748B).
  - Customer Row: "Hendra Wijaya" (13px, #475569) + WhatsApp icon button (Emerald-50 bg, Emerald-600 icon).
  - Issue: "Mati total saat render, tercium bau gosong di area kipas kiri" (12px, #64748B, 2 lines max).
  - Footer: "Masuk: 14 Okt 2024" • "Teknisi: Budi Santoso" • Arrow Right.
- Card Item 2 (Unassigned Queue / Express):
  - Top Row: "#TKT-202410-0094" + Status "DITERIMA" (Sky-50 bg, Sky-700 text) + Amber pill "EXPRESS" (Amber-50 bg, Amber-700 text, zap icon).
  - Device: "MacBook Pro M1 13-inch 2020" • "SN: C02F8..."
  - Unassigned Warning Banner: Light Amber container (#FFFBEB), border #FDE68A, text "Belum ada teknisi penanggung jawab" + Action Button "Ambil Alih" (Amber-600 text).
Floating Action Button: Blue-600 button with QR scanner icon, bottom-right.
Constraints: Zero emojis, responsive text overflow (ellipsis), 48px touch targets.
```

---

### Screen 4: Detail Meja Pengerjaan Servis (Ticket Digital Workbench)

* **Tujuan**: Layar terlengkap dan paling vital bagi teknisi untuk memeriksa fisik, membaca kredensial password laptop pelanggan, mendiagnosis, mengalokasikan suku cadang, dan menjalankan status pengerjaan.
* **Elemen UI**:
  1. **Status Progress Stepper Visual**:
     * 6 Tahapan horizontal yang merefleksikan siklus servis Serv.io:
       `Diterima` ──► `Diagnosis` ──► `Persetujuan (ACC)` ──► `Perbaikan` ──► `Quality Control` ──► `Selesai / Diambil`.
     * Tahap aktif ditandai lingkaran Blue-600 dengan garis konektor progres.
  2. **Card Kredensial Unit (Device Password Vault)**:
     * Kontainer Soft Indigo (`#EEF2FF`) dengan ikon gembok:
       * Tipe: `PIN Angka`, `Password Windows/Mac`, atau `Pola`.
       * Nilai password tersensor: `••••••••` dengan tombol toggle unmask dan tombol copy to clipboard.
       * Tombol "Perbarui Kredensial" jika ada update dari pelanggan.
  3. **Strip Galeri Foto Fisik Masuk**:
     * Horizontal thumbnail scrollable (80x80 dp, rounded 8px) menampilkan foto fisik saat unit diterima di kasir. Klik untuk zoom fullscreen.
  4. **Ringkasan Checklist Intake 15-Titik**:
     * Tag ringkas kondisi unit masuk: Keyboard [Normal], Baterai [Drop], Layar [Normal], Engsel [Patah], dsb.
  5. **Tabbed Sub-Workspaces**:
     * **Tab Diagnosis & Biaya**: Masalah yang ditemukan teknisi, rekomendasi tindakan, estimasi biaya jasa dan sparepart, tombol kirim penawaran ke WhatsApp.
     * **Tab Sparepart Terpakai**: Daftar suku cadang yang dialokasikan, status persetujuan pelanggan, dan tombol `+ Tambah Part`.
     * **Tab Foto Bukti & Dokumentasi**: Upload foto sebelum perbaikan, proses solder/pengerjaan, dan kondisi sesudah perbaikan.
     * **Tab Log Aktivitas & Timeline**: Catatan kronologis update teknisi.
     * **Tab 8-Point WOW Quality Control (QC)**: Checklist verifikasi akhir sebelum status dapat diubah ke selesai.
  6. **Sticky Contextual Bottom Action Bar**:
     * Tombol aksi cerdas sesuai status: "Input Diagnosis", "Kirim Penawaran ke WhatsApp", "Mulai Pengerjaan", atau tombol hijau besar "Lulus QC & Selesaikan Servis".

```stitch
PROMPT GOOGLE STITCH - SCREEN 4: TICKET DIGITAL WORKBENCH
Role: Senior Staff Mobile Product Designer.
Platform: Flutter Mobile (Clean Light Theme).
Theme: Slate-50 Scaffold, Pure White Containers, Blue-600 primary, Soft Indigo & Emerald accents. No black containers.

Top App Bar:
- White surface, border-bottom #E2E8F0.
- Title: "Tiket #TKT-202410-0089" (16px Bold) + Subtitle "Lenovo Legion 5 15ACH6" (12px, #64748B).
- Right Action: Share / Print receipt icon button.

Scrollable Body (Padding 16px, Slate-50 #F8FAFC):
- Service Lifecycle Stepper:
  - Horizontal 5-step progress line: Diterima (done) -> Diagnosis (done) -> Persetujuan (done) -> Perbaikan (ACTIVE, Blue-600 dot) -> QC & Selesai (pending).
- Customer & WhatsApp Direct Card:
  - White card, 12px radius, border #E2E8F0, padding 14px.
  - Customer: "Hendra Wijaya" (14px Bold) • "0812-9876-5432".
  - Action button: Full-width Emerald-50 button (#ECFDF5) with Emerald-600 WhatsApp icon and text "Chat WhatsApp Langsung (Update Progres)".
- Device Password & Credentials Vault:
  - Soft Indigo container (#EEF2FF), border #C7D2FE, 12px radius, padding 14px.
  - Header: Lock icon + "Kredensial Akses Perangkat (PIN/Password)".
  - Obscured password display: "••••••••" (16px Mono) with unmask eye icon button, Copy icon button, and "Edit" button.
- Intake Physical Photos Strip:
  - Section title: "Foto Fisik Saat Masuk (4 Foto)" with camera icon.
  - Horizontal list of 80x80 dp photo thumbnails with rounded 8px corners.
- Intake 15-Point Summary:
  - Wrap container with mini pills: "Layar: Normal (Green)", "Baterai: Drop (Red)", "Keyboard: Normal (Green)", "Casing: Lecet Pemakaian (Slate)".
- Tabbed Information Area (Segmented Tabs: Diagnosis, Sparepart, Foto Kerja, Log, QC):
  - Active Tab: Blue-600 indicator.
  - Tab Content Preview (Diagnosis):
    - Problem description: "Short circuit kapasitor bypass jalur 19V VCore dan fan pendingin macet debu tebal."
    - Action plan: "Penggantian kapasitor SMD 10uF 25V + pembersihan fan & repaste Honeywell PTM7950."
    - Cost Summary: Jasa Servis: Rp 350.000 + Part: Rp 270.000 = Total Rp 620.000.
    - Sparepart allocated list: "Thermal Paste Honeywell (1 pcs)", "Kapasitor SMD (2 pcs)".
- Sticky Bottom Action Bar (Pinned above navigation):
  - White container with top shadow, height 70px, padding 12px 16px.
  - Action Button: Full-width Emerald-600 (#10B981) button, height 48px, rounded 10px, bold white text "Lanjut ke Verifikasi QC & Selesai", check-circle icon.
Constraints: Zero emojis, anti-overflow safe wrapping, 48px touch targets, zero black styling.
```

---

### Screen 5: Modal Input Diagnosis & Kalkulator Biaya (Diagnosis Modal Sheet)

* **Tujuan**: Bottom sheet modal bagi teknisi untuk mencatat temuan kerusakan, merekomendasikan solusi, dan menghitung estimasi biaya secara terstruktur.
* **Elemen UI**:
  * Shape: Top rounded 24px, Pure White background (`#FFFFFF`).
  * Top Indicator: Drag handle pill abu-abu (36x4 dp).
  * Header: Judul "Input Hasil Diagnosis & Estimasi" (16sp SemiBold `#0F172A`) dengan tombol tutup (X).
  * Field Masalah / Kerusakan: Textarea multi-line (3-4 baris), placeholder "Uraikan bagian komponen/jalur PCB yang rusak...".
  * Field Solusi & Tindakan: Textarea multi-line, placeholder "Contoh: Reballing IC VGA, penggantian kapasitor...".
  * Kalkulator Biaya:
    * Input Biaya Jasa Teknisi (format rupiah otomatis).
    * Subtotal Estimasi Sparepart (terhitung otomatis dari part terpilih).
    * Total Estimasi Akhir (Teks besar tebal Blue-600).
  * Opsi Notifikasi: Checkbox "Kirim draf rincian penawaran ke WhatsApp pelanggan otomatis".
  * Tombol Submit: Elevated button warna Blue-600 (`#2563EB`), tinggi 48px, teks "Simpan & Lanjutkan ke Persetujuan (ACC)".

```stitch
PROMPT GOOGLE STITCH - SCREEN 5: DIAGNOSIS & COST ESTIMATION SHEET
Role: Enterprise Mobile UX Designer.
Platform: Flutter Mobile Bottom Sheet.
Theme: Pure White (#FFFFFF), Slate-50 elements, Blue-600 buttons. Zero dark containers.

Modal Sheet Container:
- Shape: Top corner radius 24px, pure white surface (#FFFFFF), 1px border-top (#E2E8F0).
- Top Center: Rounded drag handle pill (36x4 dp, Slate-300 #CBD5E1).
- Header: Row with title "Input Hasil Diagnosis & Estimasi" (16px SemiBold, #0F172A) + close X icon button.

Form Body (Scrollable with keyboard viewInsets padding):
- Field 1 (Analisis Kerusakan):
  - Label: "Analisis Kerusakan & Komponen Rusak" (13px Medium, #475569).
  - Input: Multi-line outline field (3 lines), rounded 10px, border #E2E8F0, placeholder "Contoh: Short pada jalur rail 3.3V always on akibat korosi...".
- Field 2 (Rekomendasi Tindakan):
  - Label: "Rekomendasi Tindakan Perbaikan" (13px Medium, #475569).
  - Input: Multi-line outline field (3 lines), rounded 10px, border #E2E8F0, placeholder "Contoh: Penggantian MOSFET power step-down dan pembersihan jalur ultrasonik...".
- Cost Breakdown Card (Slate-50 bg, border #E2E8F0, rounded 12px, padding 14px):
  - Row 1: "Biaya Jasa Servis" -> Number input with "Rp" prefix, value "350.000".
  - Row 2: "Estimasi Biaya Sparepart" -> Auto-calculated subtotal "Rp 270.000".
  - Divider line (1px, #E2E8F0).
  - Row 3: "Total Estimasi ke Pelanggan" -> "Rp 620.000" (16px Bold, Blue-600 #2563EB).
- WhatsApp Dispatch Toggle:
  - Container Soft Emerald (#ECFDF5), border #A7F3D0, rounded 10px, padding 10px.
  - Checkbox checked + text "Kirimkan draf persetujuan harga ke nomor WhatsApp pelanggan secara otomatis".
- Submit CTA Button:
  - Full-width Blue-600 button, height 48px, rounded 10px, bold white text "Simpan Diagnosis & Ajukan ACC", send icon.
Constraints: Zero emojis, responsive keyboard push-up, strictly clean light mode.
```

---

### Screen 6: Katalog Suku Cadang & Stok Gudang (Sparepart Hub)

* **Tujuan**: Memungkinkan teknisi mengecek ketersediaan suku cadang di gudang secara real-time, mengetahui lokasi rak penyimpanan, dan mengalokasikan part ke tiket servis.
* **Elemen UI**:
  1. **Header & Search Bar**: Search input cepat dengan scan barcode scanner icon untuk mencari part via barcode fisik.
  2. **Filter Kategori Suku Cadang**: Chip scrollable: `Semua`, `RAM`, `SSD/Storage`, `Baterai`, `Keyboard`, `LCD/Layar`, `Thermal & Fan`, `IC & Komponen PCB`.
  3. **Item Kartu Sparepart**:
     * Nama Part & Merk (misal: "SSD NVMe M.2 512GB Kingston NV2").
     * Kode SKU & Lokasi Rak (misal: `SKU-SSD-512` • Rak: `B-03`).
     * Indikator Sisa Stok:
       * Stok > 5: Badge Hijau (`#ECFDF5`, teks Emerald-700 "Stok: 12 unit").
       * Stok <= 3: Badge Kuning (`#FFFBEB`, teks Amber-700 "Sisa 2 unit").
       * Stok 0: Badge Merah (`#FEF2F2`, teks Red-700 "Habis").
     * Harga Teknisi / Modal vs Harga Pasang.
     * Tombol Stepper Kuantitas `[-] [ 1 ] [+]` dan tombol `Pasang ke Tiket`.

```stitch
PROMPT GOOGLE STITCH - SCREEN 6: SPAREPART INVENTORY & ALLOCATION
Role: Inventory & Workshop UX Specialist.
Platform: Flutter Mobile (Light Theme).
Theme: White cards, Slate-50 background, Blue-600 primary, Emerald/Amber/Red stock pills. No black cards.

Header:
- Title: "Katalog Suku Cadang Bengkel" (17px Bold, #0F172A).
- Search Row: 44px text input "Cari nama suku cadang, SKU, atau merk..." + Barcode Scanner icon button for scanning part labels.
- Horizontal Category Chips:
  - Active: "Semua" (Blue-50 bg, Blue-600 text, Blue-200 border).
  - Inactive: "RAM SODIMM", "SSD NVMe", "Baterai Laptop", "Keyboard", "Thermal & Fan", "IC Power".

Sparepart List (Vertical, 10px spacing):
- Card 1:
  - White container, 1px border (#E2E8F0), 12px radius, padding 14px.
  - Top Row: "SSD NVMe 512GB Kingston NV2 Gen4" (14px SemiBold, #0F172A) + Stock pill "Stok: 8 unit" (Emerald-50 bg, Emerald-700 text).
  - Meta Row: SKU "SKU-NV2-512G" • Lokasi Rak "Bin C-04" (12px, #64748B).
  - Price & Action Row:
    - Price: "Rp 520.000" (14px Bold, #0F172A).
    - Stepper & Requisition: Quantity selector [-] [ 1 ] [+] + Button "Pasang ke Tiket" (Blue-600, height 36px, 8px radius, white text).
- Card 2 (Low Stock Warning):
  - Part: "Baterai Dell Inspiron 14 5400 / 5410 Original"
  - Stock pill: Amber pill "Sisa 1 unit" (Amber-50 bg, Amber-700 text).
  - Meta: SKU "BAT-DELL-5400" • Lokasi Rak "Bin A-02".
  - Price: "Rp 450.000".
- Card 3 (Out of Stock):
  - Part: "Thermal Paste Honeywell PTM7950 40x80mm"
  - Stock pill: Red pill "Stok Habis" (Red-50 bg, Red-700 text).
  - Action: Outlined button "Request Restok ke Admin".
Constraints: Zero emojis, precise inventory tags, responsive thumb reach.
```

---

### Screen 7: Pustaka Wiki & Solusi Troubleshooting (Repair Knowledge Base)

* **Tujuan**: Mengintegrasikan fitur **Pustaka Wiki** dari web app ke mobile: teknisi dapat mencari panduan perbaikan, solusi kasus serupa, SOP pengerjaan, dan skematik laptop langsung dari meja servis.
* **Elemen UI**:
  1. **Search Bar Wiki**: "Cari gejala, kode error, tipe laptop (misal: Asus TUF mati total)...".
  2. **Kategori Kerusakan**: Chip filter: `Semua`, `Mati Total (No Power)`, `Layar & Display`, `Overheating`, `BIOS & Firmware`, `Short Circuit`.
  3. **Item Kartu Panduan Wiki**:
     * Judul Solusi: (misal: "SOP Perbaikan Asus TUF Gaming FX505 Short Jalur 19V").
     * Model Perangkat Terkait: Tag pill abu-abu `Asus TUF Series`.
     * Langkah Cepat: Cuplikan ringkas poin solusi 1-2 baris.
     * Lampiran: Badge ikon PDF/Skematik jika tersedia file panduan.
     * Author & Rating: "Dibuat oleh: Tim Serv.io • 42x Berhasil Digunakan".

```stitch
PROMPT GOOGLE STITCH - SCREEN 7: REPAIR WIKI & KNOWLEDGE BASE
Role: Technical Knowledge Base UX Designer.
Platform: Flutter Mobile (Light Theme).
Theme: Slate-50 Scaffold, Pure White Cards, Blue-600 primary, Emerald verification badges. No black elements.

Header:
- Title: "Pustaka Wiki Servis" (17px Bold, #0F172A).
- Subtitle: "Basis data solusi & panduan troubleshooting bengkel" (12px, #64748B).
- Search Bar: Height 44px, white surface, border #E2E8F0, prefix book/search icon, placeholder "Cari gejala, tipe motherboard, kode error...".
- Category Tags: Scrollable chips ("Semua", "Power & Charging", "Display & GPU", "BIOS Repair", "Audio & Network").

Wiki Articles List:
- Card Item 1:
  - White surface, 12px radius, 1px border (#E2E8F0), padding 14px.
  - Tag Row: Pill "POWER / SHORT" (Sky-50 bg, Sky-700 text) + Pill "Asus Series" (Slate-100 bg, Slate-700 text).
  - Title: "Mengatasi Short Circuit Jalur 19V pada Asus TUF Gaming FX505" (15px Bold, #0F172A).
  - Summary: "Penyebab utama sering kali kapasitor keramik PC401 di dekat MOSFET input bocor. Ganti dengan kapasitor 10uF 25V." (12px, #475569).
  - Footer Row: Verified badge "Telah Teruji (98% Sukses)" in Emerald-50 bg + Attachment pill "Skematik Boardview (.pdf)" + Arrow right.
- Card Item 2:
  - Title: "SOP Penggantian Thermal Paste PTM7950 & Pembersihan Fan Laptop Gaming"
  - Tag: "MAINTENANCE / SOP" (Emerald-50 bg, Emerald-700 text).
  - Step counter: "5 Langkah Prosedur Kerja Terstandarisasi".
Constraints: Zero emojis, clean typography, bookmark action, fast search filtering.
```

---

### Screen 8: Scanner Kamera Barcode & QR Tiket Fisik (Camera Scanner)

* **Tujuan**: Pemindaian instan label tiket fisik pada casing laptop dengan tampilan laser viewfinder modern, tombol senter, dan fallback input manual.
* **Elemen UI**:
  * Viewport Kamera Fullscreen dengan overlay semi-transparan.
  * Frame Kotak Viewfinder (260x260 dp) dengan sudut beraksen **Electric Blue (`#2563EB`)** dan animasi garis laser biru halus.
  * Controls Atas: Tombol kembali, toggle Flashlight Torch (On/Off), dan switch kamera depan/belakang.
  * Bottom Sheet Input Manual: Kontainer putih di bagian bawah dengan text field input manual nomor tiket jika barcode rusak/kotor.

```stitch
PROMPT GOOGLE STITCH - SCREEN 8: CAMERA QR & BARCODE SCANNER
Role: Mobile Camera Interface Specialist.
Platform: Flutter Mobile (Clean Modern Tech Viewport).
Theme: Clean camera viewfinder with high-contrast Blue-600 guides and white bottom input card.

Overlay Controls:
- Top Bar: Semi-transparent header with back icon, flashlight torch icon button (yellow highlight when active), and auto-focus indicator.
- Center Viewfinder Box:
  - 260x260 dp square frame with 4 bold corner bracket accents in Blue-600 (#2563EB, 4px stroke, 18px length).
  - Smooth animated horizontal laser scanning line in Blue-500 (#3B82F6).
  - Helper label below box: "Arahkan kamera ke QR Code atau Barcode Tiket Fisik" (13px, white, medium weight with text shadow).
- Bottom Manual Search Card (White surface, 20px top radius, padding 16px):
  - Label: "Barcode tidak terbaca? Masukkan kode tiket manual:" (12px, #64748B).
  - Input Row: Text field placeholder "Contoh: TKT-202410-0089" + Submit button "Cari Tiket" in Blue-600 (#2563EB, height 44px, white text).
  - Format support hint: "Mendukung cetak barcode thermal dan QR tanda terima Serv.io".
Constraints: Zero emojis, clean laser animation, zero clipping across aspect ratios.
```

---

### Screen 9: Retensi & Maintenance Recall (CRM Pasca Servis)

* **Tujuan**: Mengadopsi fitur **Retensi & CRM / Maintenance Recall** dari web app: memantau pelanggan yang unitnya telah diservis 3-6 bulan lalu untuk dijadwalkan servis pembersihan berkala dan pergantian thermal paste via WhatsApp.
* **Elemen UI**:
  1. Header Metrik: Total unit yang jatuh tempo servis berkala bulan ini (misal: "15 Unit Butuh Recall").
  2. Filter Interval: Chip filter: `Semua`, `3 Bulan (Pembersihan Ringan)`, `6 Bulan (Ganti Paste & Thermal)`, `12 Bulan (Overhaul)`.
  3. Kartu Pelanggan Recall:
     * Nama Customer & Nomor WhatsApp.
     * Merek Laptop & Tanggal Servis Terakhir.
     * Status Garansi: "Garansi Selesai • Waktu Perawatan Berkala".
     * Tombol Direct WhatsApp: "Kirim Pesan Pengingat Servis" dengan template pesan ramah yang sudah terisi otomatis.

```stitch
PROMPT GOOGLE STITCH - SCREEN 9: MAINTENANCE RECALL & CRM
Role: CRM & Customer Retention UX Designer.
Platform: Flutter Mobile (Light Theme).
Theme: Slate-50 Scaffold, White Cards, Blue-600 primary, Emerald WhatsApp actions. No dark cards.

Header:
- Title: "Retensi & Maintenance Recall" (17px Bold, #0F172A).
- Subtitle: "Jadwal perawatan berkala pelanggan pasca servis" (12px, #64748B).
- Summary Banner:
  - Soft Blue container (#EFF6FF), border #BFDBFE, 12px radius, padding 14px.
  - Heart-handshake icon + "15 Pelanggan Masuk Periode Perawatan Berkala (3-6 Bulan)".

Filter Row:
- Horizontal chips: "Semua Due (15)", "3 Bulan (8)", "6 Bulan (5)", "1 Tahun (2)".

Customer Recall List:
- Card 1:
  - White surface, 1px border (#E2E8F0), 12px radius, padding 14px.
  - Top Row: "Dimas Pratama" (14px Bold) • "0813-2233-4455" + Pill "DUE 6 BULAN" (Amber-50 bg, Amber-700 text).
  - Device: "Asus ROG Strix G15" • Servis Terakhir: "20 April 2026 (Ganti IC Power)".
  - Recommended Service: "Pembersihan debu heatsink & pergantian thermal paste PTM7950".
  - Action Button: Full-width Emerald-600 (#10B981) button, height 40px, rounded 8px, white text "Kirim Pengingat Servis via WhatsApp", WhatsApp icon.
Constraints: Zero emojis, clean customer typography, 1-tap WhatsApp deep link.
```

---

### Screen 10: Rekam Medis Perangkat & Riwayat Servis (Device History)

* **Tujuan**: Memungkinkan teknisi memeriksa "rekam medis" lengkap sebuah laptop berdasarkan Serial Number: melihat riwayat kerusakan masa lalu, suku cadang yang pernah diganti, teknisi sebelumnya, dan status garansi aktif.
* **Elemen UI**:
  1. Input Pencarian Serial Number atau scan barcode unit.
  2. Kartu Profil Perangkat: Foto jenis perangkat, merk/model, spesifikasi bawaan (CPU, RAM, GPU), dan tanggal pertama kali masuk bengkel.
  3. Timeline Riwayat Servis Kronologis:
     * Servis 1 (Aktif saat ini): `#TKT-202410-0089` - Dalam Perbaikan.
     * Servis 2 (3 bulan lalu): `#TKT-202407-0032` - Ganti Keyboard & Fan - Selesai.
     * Servis 3 (1 tahun lalu): `#TKT-202310-0011` - Upgrade SSD 512GB - Selesai.
  4. Komponen Terpasang: Riwayat part yang pernah dipasang pada laptop ini.

```stitch
PROMPT GOOGLE STITCH - SCREEN 10: DEVICE MEDICAL RECORD & HISTORY
Role: Hardware Diagnostics UX Specialist.
Platform: Flutter Mobile (Light Theme).
Theme: Slate-50 Scaffold, White Cards, Blue-600 accents. Zero black styling.

Header:
- Title: "Rekam Medis Perangkat" (17px Bold, #0F172A).
- Search Bar: "Ketik Serial Number (SN) perangkat atau scan barcode casing...".

Device Overview Card:
- White surface, 1px border (#E2E8F0), 12px radius, padding 16px.
- Row: Laptop icon in Blue-50 container + Model "Lenovo Legion 5 15ACH6" (16px Bold) • SN "PF2X9K1L" (12px Mono, #64748B).
- Specs Row: "Ryzen 7 5800H • RTX 3060 • 16GB RAM • 512GB SSD".
- Customer Owner: "Hendra Wijaya (0812-9876-5432)" with history tag "3x Servis di Serv.io".

Chronological Service Timeline:
- Vertical timeline with connected dots:
  - Node 1 (Current): Tiket #TKT-202410-0089 (Status: Dalam Perbaikan, Blue-600 dot). Kerusakan: Short VCore.
  - Node 2 (3 bulan lalu): Tiket #TKT-202407-0032 (Status: Selesai, Emerald-500 dot). Tindakan: Penggantian keyboard backlit & pembersihan pasta. Garansi: Expired.
  - Node 3 (1 tahun lalu): Tiket #TKT-202310-0011 (Status: Selesai). Tindakan: Upgrade RAM 16GB Kingston.
Constraints: Zero emojis, clear timeline connectors, high data density without clutter.
```

---

### Screen 11: 8-Point WOW Quality Control (QC Inspection System)

* **Tujuan**: Menstandarkan prosedur pengujian kualitas sebelum laptop diserahkan kepada pelanggan (sesuai SOP WOW Serv.io di web app).
* **Elemen UI**:
  1. Header Inspeksi: Ikon verified hijau, judul "Inspeksi Kualitas (Quality Control)", dan badge status "LULUS QC" jika seluruh 8 poin terpenuhi.
  2. Checklist 8 Titik Uji Fungsi:
     1. `Display & Visual`: Bebas dead pixel, refresh rate normal, backlight stabil.
     2. `Keyboard & Touchpad`: 100% tombol responsif, multi-touch gesture lancar.
     3. `Audio & Speaker`: Suara stereo jernih tanpa kresek pada volume 100%.
     4. `Baterai & Pengisian`: Indikator charging normal, kapasitas baterai terisi stabil.
     5. `Port & Konektivitas`: Seluruh port USB/Type-C, audio jack, HDMI terdeteksi.
     6. `WiFi & Bluetooth`: Koneksi sinyal kuat dan deteksi perangkat nirkabel lancar.
     7. `Uji Suhu & Stress Test`: Pengujian FurMark / AIDA64 stabil tanpa throttling berlebih.
     8. `Kebersihan Fisik & Baut`: Casing bersih dari bekas sidik jari, seluruh baut terpasang presisi.
  3. Golden Approval Checkbox: "Quality Control PASSED (Final Approval)".
  4. Tombol Cetak / Simpan Sertifikat QC.

```stitch
PROMPT GOOGLE STITCH - SCREEN 11: QUALITY CONTROL (8-POINT WOW QC)
Role: QA & Workshop Compliance UX Designer.
Platform: Flutter Mobile (Light Theme).
Theme: White cards, Emerald-500 accents for passed items, Blue-600 primary button. Zero black backgrounds.

Header:
- Title: "8-Point Quality Control (SOP WOW)" (17px Bold, #0F172A).
- Subtitle: "Verifikasi standar kualitas akhir sebelum unit siap diserahkan" (12px, #64748B).
- Status Indicator: Large pill badge "STATUS: 8/8 VERIFIED (LULUS QC)" (Emerald-50 bg, Emerald-700 text, verified icon).

QC Interactive Checklist (8 White Card Rows, 8px gap):
- Item 1: Display & Visual -> Checkbox checked, monitor icon, subtext "Layar bebas garis, dead pixel, flicker".
- Item 2: Keyboard & Touchpad -> Checkbox checked, keyboard icon, subtext "Semua tombol berfungsi 100%".
- Item 3: Audio & Mic -> Checkbox checked, volume icon, subtext "Speaker kiri & kanan jernih, mic aktif".
- Item 4: Battery & Charging -> Checkbox checked, battery icon, subtext "Charging stabil, siklus baterai sehat".
- Item 5: Port & Connectivity -> Checkbox checked, usb icon, subtext "Semua port USB, Type-C, audio jack normal".
- Item 6: WiFi & Bluetooth -> Checkbox checked, wifi icon, subtext "Koneksi internet cepat & stabil".
- Item 7: Suhu & Thermal Stress -> Checkbox checked, thermometer icon, subtext "Uji stress test stabil pada suhu wajar".
- Item 8: Kebersihan & Baut Lengkap -> Checkbox checked, check icon, subtext "Casing bersih mengkilap, baut utuh presisi".

Final Approval Banner:
- Soft Emerald Card (#ECFDF5), border #A7F3D0, rounded 12px, padding 14px.
- Verified seal icon + "Unit ini telah memenuhi seluruh standar pengerjaan bengkel Serv.io".
- Action Button: Full-width Emerald-600 button (#10B981), height 48px, rounded 10px, bold white text "Sahkan QC & Siap Diambil Pelanggan".
Constraints: Zero emojis, strict QA guidelines, instant checkbox responsiveness.
```

---

### Screen 12: Profil Teknisi & Scorecard Performa (Technician Profile)

* **Tujuan**: Menampilkan metrik performa pribadi teknisi (diadopsi dari modul `User & Performa` web app), rating kepuasan pelanggan, buku saku SOP WOW, dan pengaturan keamanan akun.
* **Elemen UI**:
  1. Profil Header Card: Avatar inisial teknisi (lingkaran Blue-600 dengan huruf putih besar), nama teknisi "Budi Santoso", email, dan badge role `TEKNISI SENIOR` (latar Blue-50 border Blue-200).
  2. Scorecard Kinerja Servis:
     * **Total Tiket Selesai**: Angka "142 Unit" (Ikon check-circle, Emerald-600).
     * **Rata-rata Waktu Servis**: Angka "3.8 Hari" (Sesuai metrik web dashboard).
     * **Rating CSAT Kepuasan**: Angka "4.9 / 5.0" (Ikon bintang kuning).
  3. Tombol Akses Cepat Buku Panduan:
     * Tombol "Panduan Standar Layanan (WOW SOP)" dengan badge `WOW` persis seperti pada sidebar web app.
  4. Pengaturan Akun & Keamanan: Form ubah nama, ganti password, dan toggle biometrik.
  5. Tombol Keluar (Logout): Outlined button warna Red-500 (`#EF4444`) dengan dialog konfirmasi keluar.

```stitch
PROMPT GOOGLE STITCH - SCREEN 12: TECHNICIAN PROFILE & SCORECARD
Role: Mobile App Design Lead.
Platform: Flutter Mobile (Clean Light Theme).
Theme: Slate-50 Scaffold, Pure White Cards, Blue-600 highlights. No black cards.

Header:
- Title: "Profil & Kinerja Teknisi" (17px Bold, #0F172A).

Profile Overview Card:
- White surface, 1px border (#E2E8F0), 16px radius, padding 16px.
- Row: Circle avatar (Blue-600 bg, 56px, bold white initial "B") + Name "Budi Santoso" (16px Bold, #0F172A) + Email "budi.teknisi@servio.id" (12px, #64748B) + Role pill "TEKNISI SENIOR" (Blue-50 bg, Blue-700 text, Blue-200 border).

Performance Scorecard (Grid 3 Metrics):
- Metric 1: Value "142" in 20px Bold, label "Tiket Selesai" (Emerald-500 icon).
- Metric 2: Value "3.8 Hari" in 20px Bold, label "Rata-rata Servis" (Clock icon, Blue-600).
- Metric 3: Value "4.9 / 5.0" in 20px Bold, label "Rating Kepuasan" (Star icon, Amber-500).

Workshop SOP Quick Access (Ported directly from Web App Sidebar):
- White card button with 1px border (#E2E8F0), rounded 12px, padding 14px.
- Left: Book-open icon in Blue-50 container + "Panduan Standar Layanan Bengkel".
- Right: Pill badge "WOW" in Blue-50 bg with Blue-700 bold text + Chevron right.

Account Settings Section:
- Form row: "Ubah Kata Sandi" -> Chevron right.
- Switch row: "Aktifkan Biometrik (Fingerprint / Face ID)" -> Active Blue-600 switch.

Danger Zone:
- Outlined Red-500 button (#EF4444), height 48px, rounded 10px, red logout icon, text "Keluar dari Akun Teknisi".
Constraints: Zero emojis, clean metric typography, WCAG AA compliance.
```

---

## 5. Panduan Anti-Overflow & Responsivitas Antarmuka (Flutter Best Practice)

Agar seluruh visual yang di-generate dari Google Stitch dapat diimplementasikan ke Flutter secara mulus tanpa error `RenderFlex overflowed`:

### 5.1 Safe Text Wrapping
Seluruh teks dinamis dari backend (nama customer, merek/model perangkat, nomor seri, keluhan) **wajib** menggunakan:
```dart
Expanded(
  child: Text(
    value,
    maxLines: 1, // atau 2 untuk keluhan kerusakan
    overflow: TextOverflow.ellipsis,
    style: AppTypography.bodyRegular,
  ),
)
```

### 5.2 Form & Bottom Sheet Keyboard Avoidance
Seluruh form input dalam Bottom Sheet modal **wajib** menyertakan padding `viewInsets`:
```dart
showModalBottomSheet(
  context: context,
  isScrollControlled: true,
  backgroundColor: Colors.transparent,
  builder: (ctx) => Container(
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    padding: EdgeInsets.only(
      left: 16,
      right: 16,
      top: 16,
      bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
    ),
    child: SingleChildScrollView(child: formContent),
  ),
);
```

### 5.3 Filter Chips dengan SingleChildScrollView
Dilarang menaruh deretan filter chip dalam `Row` biasa. Wajib menggunakan `SingleChildScrollView(scrollDirection: Axis.horizontal)` dengan jarak antar chip `8px`.

---

## 6. Daftar Periksa Kualitas (QA Checklist) Sebelum Rilis UI

Gunakan checklist ini saat mengevaluasi output Google Stitch dan implementasi Flutter:

- [ ] **Zero Black Elements**: Tidak ada background hitam, header gelap pekat, atau chip hitam. Tema 100% Light Mode (Slate-50 & Pure White).
- [ ] **Brand Consistency**: Aksen warna utama adalah Blue-600 (`#2563EB`) dengan status pill yang persis dengan Web ERP Serv.io.
- [ ] **Zero Emojis**: Tidak ada karakter emoji unicode pada tombol, status, judul, atau input.
- [ ] **Ukuran Target Sentuh**: Seluruh tombol aksi memiliki tinggi minimal **48px** dan area klik minimal **48x48 dp**.
- [ ] **Keamanan Kredensial**: Password laptop customer disensor default (`••••••••`) dengan tombol unmask dan copy.
- [ ] **Bebas Layout Overflow**: Tidak ada banner error kuning-hitam `RenderFlex overflowed` saat orientasi layar diputar atau saat keyboard dibuka.
- [ ] **Aksesibilitas Satu Tangan**: Tombol aksi utama (Scan Barcode, Input Diagnosis, Lulus QC) berada di paruh bawah layar yang mudah dijangkau ibu jari teknisi.
