# Serv.io Technician Mobile App - UI/UX Design System & Google Stitch Specification

> **Spesifikasi Resmi Meja Kerja Teknisi (Workbench)**: Dokumen ini disusun **100% konsisten dengan Serv.io Workshop Platform (Web App)** khusus untuk peran **Teknisi Servis**. Fitur di luar tanggung jawab teknisi (seperti Retensi CRM, Pembukuan Kasir, Faktur Invoice Keuangan, dan Manajemen Gaji) sengaja ditiadakan agar aplikasi mobile tetap ramping, cepat, dan fokus pada produktivitas meja kerja reparasi.

Dokumen ini adalah acuan spesifikasi desain dan pustaka prompt siap pakai untuk **Google Stitch**, Figma, maupun tim developer Flutter.

---

## 1. Prinsip Desain & Persona Meja Kerja Teknisi

### 1.1 Karakteristik Kerja Teknisi (Workbench Ergonomics)
* **Penggunaan Satu Tangan (One-Handed Thumb Zone)**: Teknisi sering memegang alat servis (obeng, multimeter, probe) di satu tangan; tombol aksi penting wajib berada di jangkauan ibu jari bagian bawah.
* **Lingkungan Kerja Terang**: Meja servis diterangi lampu sorot LED (anti-glare) sehingga membutuhkan antarmuka **Clean Light Mode** berdaya kontras tinggi.
* **Target Sentuh Ramah Sarung Tangan**: Minimal target klik **48x48 dp** agar mudah ditekan saat mengenakan sarung tangan antistatis (ESD).
* **Akses Cepat Data Vital**: Kredensial password/PIN unit laptop, galeri foto fisik masuk, rekam medis kerusakan masa lalu, dan checklist kendali mutu (QC).

### 1.2 Aturan Desain Inti (Strict Design Rules)
1. **100% Light Mode (Bebas Elemen Hitam Pekat)**:
   * **Tidak ada header hitam, hero container hitam, atau chip filter hitam.**
   * Menggunakan kanvas **Slate-50 (`#F8FAFC`)** dan kartu **Pure White (`#FFFFFF`)** bergaris tepi halus **Slate-200 (`#E2E8F0`)**.
   * Aksen utama adalah **Royal Blue (`#2563EB`)** dengan sentuhan aktif **Soft Blue Tint (`#EFF6FF`)**.
   * Warna `Slate-900` (`#0F172A`) **hanya digunakan untuk teks**, bukan background!
2. **Zero Emojis**: Dilarang keras menggunakan emoji unicode grafis. Gunakan ikon vektor berstandar industri (**Lucide Icons** atau **Google Material Symbols Outlined**).
3. **Anti-Overflow & Responsive**: Terapkan text wrapping (`Expanded` + `TextOverflow.ellipsis`) dan keyboard insets padding (`viewInsets`) di seluruh bottom sheet.

---

## 2. Design Tokens & Visual Foundation (Sesuai Web App Serv.io)

### 2.1 Palet Warna Resmi (Hex Codes)

| Kategori Token | Nama Token | Nilai Hex | Penggunaan UI |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | `primary` | `#2563EB` (Blue 600) | Tombol CTA utama, ikon aktif, indikator tab, floating action button |
| **Brand Hover/Pressed**| `primaryHover` | `#1D4ED8` (Blue 700) | State tombol saat ditekan |
| **Brand Soft / Tint** | `primaryLight` | `#EFF6FF` (Blue 50) | Background chip aktif, container ikon aktif, highlight terpilih |
| **Brand Border** | `primaryBorder`| `#DBEAFE` (Blue 100) | Garis tepi chip aktif, ring fokus input |
| **Canvas Background** | `background` | `#F8FAFC` (Slate 50) | Latar belakang seluruh scaffold aplikasi |
| **Surface (Card/Modal)**| `surface` | `#FFFFFF` (Pure White) | Kartu tiket, modal bottom sheet, dialog |
| **Card Border** | `border` | `#E2E8F0` (Slate 200) | Garis batas kartu, pemisah list, border input form |
| **Subtle Divider** | `borderLight` | `#F1F5F9` (Slate 100) | Garis pemisah baris data internal |
| **Text Primary** | `textPrimary` | `#0F172A` (Slate 900) | Judul halaman, angka metrik, teks tebal |
| **Text Secondary** | `textSecondary`| `#475569` (Slate 600) | Deskripsi keluhan, isi teks kartu, label input |
| **Text Muted** | `textMuted` | `#94A3B8` (Slate 400) | Placeholder input teks, nomor seri sekunder |
| **Success / QC Pass** | `success` | `#10B981` (Emerald 500)| Indikator selesai, lulus uji QC 8-poin, garansi aktif |
| **Success Soft Surface**| `successBg` | `#ECFDF5` (Emerald 50) | Latar badge selesai / disetujui |
| **Success Border** | `successBorder`| `#A7F3D0` (Emerald 200)| Border badge selesai / disetujui |
| **Success Text** | `successText` | `#047857` (Emerald 700)| Teks status selesai / disetujui |
| **Warning / Queue** | `warning` | `#F59E0B` (Amber 500) | Menunggu persetujuan (ACC), prioritas express |
| **Warning Soft Surface**| `warningBg` | `#FFFBEB` (Amber 50) | Latar badge antrean / express |
| **Warning Border** | `warningBorder`| `#FDE68A` (Amber 200)| Border badge warning |
| **Warning Text** | `warningText` | `#B45309` (Amber 700)| Teks status warning / express |
| **Danger / Overdue** | `danger` | `#EF4444` (Red 500) | Melewati batas waktu (Overdue SLA), stok habis |
| **Danger Soft Surface** | `dangerBg` | `#FEF2F2` (Red 50) | Latar peringatan tiket overdue |
| **Danger Border** | `dangerBorder` | `#FECACA` (Red 200) | Border peringatan tiket overdue |
| **Danger Text** | `dangerText` | `#B91C1C` (Red 700) | Teks peringatan tiket overdue |
| **Repair / In Progress**| `indigo` | `#6366F1` (Indigo 500)| Status unit sedang dalam pengerjaan |
| **Repair Soft Surface** | `indigoBg` | `#EEF2FF` (Indigo 50) | Latar badge pengerjaan unit |
| **Repair Border** | `indigoBorder` | `#C7D2FE` (Indigo 200)| Border badge pengerjaan |
| **Repair Text** | `indigoText` | `#4338CA` (Indigo 700)| Teks status pengerjaan |
| **Diagnosis** | `sky` | `#0284C7` (Sky 600) | Status fase investigasi diagnosis |
| **Diagnosis Soft** | `skyBg` | `#F0F9FF` (Sky 50) | Latar badge diagnosis |

---

### 2.2 Hierarki Tipografi

* **Font Utama**: `Inter` atau `Plus Jakarta Sans`
* **Font Monospace (Kode Tiket, SKU, Serial Number)**: `JetBrains Mono`

| Level | Ukuran | Weight | Tracking | Warna | Penggunaan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Metric**| 24sp | Bold (700) | -0.6px | `#0F172A` | Angka besar KPI Donut tiket aktif |
| **Heading 1 (H1)** | 20sp | Bold (700) | -0.4px | `#0F172A` | Judul layar utama meja servis |
| **Heading 2 (H2)** | 16sp | SemiBold (600) | -0.2px | `#0F172A` | Nomor tiket `#TKT-...`, nama modul kartu |
| **Heading 3 (H3)** | 14sp | SemiBold (600) | -0.1px | `#0F172A` | Sub-judul accordion, nama sparepart |
| **Body Regular** | 13sp / 14sp | Regular (400) | 0.0px | `#475569` | Keluhan customer, instruksi SOP |
| **Body SemiBold** | 13sp / 14sp | SemiBold (600) | 0.0px | `#0F172A` | Nama customer, harga suku cadang |
| **Caption / Meta** | 11sp / 12sp | Medium (500) | +0.1px | `#64748B` | Waktu timestamp, tanggal masuk, SN |
| **Badge / Tag** | 10sp / 11sp | Bold (700) | +0.5px (UPPER) | Status | Label status tiket, chip filter |

---

## 3. Arsitektur Informasi & Alur Meja Kerja Teknisi (100% Mengikuti Web)

Sesuai dengan menu teknisi di web (`teknisiMenu: Dashboard, Tiket Servis, Sparepart, Pustaka Wiki`), aplikasi mobile difokuskan secara presisi:

```
                          [Serv.io Technician Workbench]
                                        │
    ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
    ▼                   ▼                               ▼                   ▼
[1. Dashboard]     [2. Tiket Servis]               [3. Sparepart]      [4. Pustaka Wiki]
 • Jam Workshop     • Antrean Bengkel               • Cek Stok Gudang   • SOP Kerusakan
 • Donut KPI SLA    • Search & Filter Chip          • Lokasi Rak/Bin    • Skematik/BIOS
 • Alert Overdue    • Ambil Alih Tiket              • Request Part      • Hardware Tips
 • Alert Express    • Quick WhatsApp                    │
 • Stok Menipis         │                               ▼
 • Scan QR Cepat        ▼                     [5. Scanner Barcode/QR]
            [DETAIL MEJA PENGERJAAN]           • Scan Stiker Tiket Fisik
             ├─ Stepper Progres Servis         • Scan Serial Number Unit
             ├─ Password/PIN Unit (Vault)
             ├─ Foto Fisik Masuk (Intake)
             ├─ Rekam Medis Servis Terdahulu (Riwayat unit ini di Serv.io)
             ├─ Solusi Wiki Terkait Unit
             ├─ Sheet Input Diagnosis & Biaya
             ├─ Sheet Alokasi Suku Cadang
             ├─ Sheet Log & Foto Bukti Kerja
             └─ Modal Verifikasi QC 8-Point WOW (Sebelum Selesai)
```

### 10 Layar & Komponen Esensial Scope Teknisi:
1. **Screen 1: Authentication & Biometric Login** (Login teknisi bersih tanpa warna hitam).
2. **Screen 2: Workbench Dashboard (Meja Kerja Utama)** (Donut KPI SLA tiket aktif, alert overdue, shortcut aksi cepat, stok suku cadang menipis).
3. **Screen 3: Antrean Tiket Servis & Filter Hub** (Pencarian tiket, tab filter soft-blue, ambil alih pengerjaan).
4. **Screen 4: Detail Meja Pengerjaan (Ticket Digital Workbench)** (Stepper status, password vault, foto masuk, rekam medis terdahulu, wiki terkait).
5. **Screen 5: Modal Input Diagnosis & Kalkulator Biaya** (Analisis teknis, biaya jasa, kalkulator part, quoter WhatsApp).
6. **Screen 6: Katalog Suku Cadang & Alokasi Part** (Cek stok gudang real-time, lokasi rak/bin, stepper alokasi ke tiket).
7. **Screen 7: Pustaka Wiki Solusi Servis** (Basis data solusi hardware, SOP motherboard, boardview, dan BIOS dump).
8. **Screen 8: Scanner Barcode / QR Tiket Fisik & SN** (Kamera scanner label tiket unit kerja).
9. **Screen 9: Modal Verifikasi Quality Control (QC 8-Point WOW)** (Checklist wajib sebelum unit disahkan selesai).
10. **Screen 10: Profil & Scorecard Kinerja Teknisi** (Statistik tiket selesai, rating kepuasan, rata-rata waktu pengerjaan 3.8 hari, tombol panduan SOP WOW).

---

## 4. Spesifikasi Layar & Prompt Siap-Pakai Google Stitch

Setiap prompt di bawah ini disusun khusus untuk **Google Stitch** dengan standar **Clean Light Theme, Best Practice, Zero Emojis, dan Zero Black Containers**.

---

### Screen 1: Otentikasi & Login Teknisi (Authentication)

* **Tujuan**: Login aman untuk teknisi dengan tampilan modern dan bersih.
* **Elemen UI**:
  * Scaffold Background: Slate-50 (`#F8FAFC`).
  * Branding: Rounded square box Blue-600 (`#2563EB`) dengan ikon wrench putih, judul "Serv.io", sub-judul "Workshop Platform • Meja Kerja Teknisi".
  * Form Card: Pure White (`#FFFFFF`) dengan border Slate-200 (`#E2E8F0`).
  * Input Form: Email dan Password dengan prefix icon Lucide, show/hide password toggle.
  * Tombol Masuk: Blue-600 button, tinggi 48px, teks bold putih "Masuk ke Meja Servis".
  * Biometric Quick Login: Tombol fingerprint / Face ID.

```stitch
PROMPT GOOGLE STITCH - SCREEN 1: TECHNICIAN AUTHENTICATION
Role: Senior Mobile UI/UX Designer.
Platform: Flutter Mobile (Clean Light Theme).
Theme: Pure White and Slate-50 (#F8FAFC), Blue-600 (#2563EB) accents. Strictly NO black/dark containers.

Layout:
- Background: Solid Slate-50 (#F8FAFC), SingleChildScrollView (keyboard avoidance).
- Header Branding:
  - Blue-600 container (44x44 dp, 12px rounded radius) with white wrench icon.
  - App Title: "Serv.io" (22px Bold, Deep Slate-900 #0F172A).
  - Subtitle: "Workshop Platform • Meja Kerja Teknisi" (12px, #64748B).
- Form Card (Pure White #FFFFFF, 1px border #E2E8F0, 16px radius, padding 20px):
  - Card Title: "Masuk ke Meja Servis" (16px SemiBold, #0F172A) + subtext "Akses akun teknisi bengkel Anda" (12px, #64748B).
  - Email Field: 48px height, rounded 10px, prefix mail icon, placeholder "teknisi@servio.id", border #E2E8F0.
  - Password Field: 48px height, rounded 10px, prefix lock icon, suffix eye-toggle, placeholder "••••••••".
  - Remember Me Row: Checkbox "Ingat saya di perangkat ini".
  - Submit Button: Full-width Blue-600 button, height 48px, rounded 10px, white bold text "Masuk ke Meja Servis".
  - Biometric Option: Outlined button with fingerprint icon "Masuk Cepat dengan Biometrik".
- Footer Note: "Serv.io Workshop Platform v2.4" (11px, Slate-400).
Constraints: Zero emojis, strict 8pt grid, WCAG AA contrast.
```

---

### Screen 2: Dashboard Meja Kerja Utama (Workbench Dashboard)

* **Tujuan**: Pusat kendali harian teknisi memantau beban kerja pribadi dan antrean bengkel (mengadopsi KPI dashboard web).
* **Elemen UI**:
  1. Top Bar: Salam "Halo, Budi Santoso", live clock bengkel "15:42 WIB • Selasa, 20 Oktober", pill status "On Duty" (Emerald-50), tombol scan QR.
  2. Donut KPI Tiket Aktif: Total "27 Tiket Aktif" dengan rincian On Track, Warning, Overdue, dan Pause ACC.
  3. Kartu Alert Kritis:
     * Card 1: "Melewati Estimasi (22)" (Soft Red `#FEF2F2`, border `#FECACA`, teks `#B91C1C`).
     * Card 2: "Prioritas Express (5)" (Soft Amber `#FFFBEB`, border `#FDE68A`, teks `#B45309`).
  4. Quick Actions (4 Grid): `[Scan QR Tiket]`, `[Tiket Saya]`, `[Cek Stok Part]`, `[Pustaka Wiki]`.
  5. Widget Suku Cadang Menipis (Stok Gudang): Menampilkan sparepart dengan stok kritis (0 - 2 unit).
  6. Section Tiket Dalam Pengerjaan Aktif: Tiket yang sedang ditangani teknisi dengan sisa estimasi waktu.

```stitch
PROMPT GOOGLE STITCH - SCREEN 2: WORKBENCH DASHBOARD
Role: Lead Product Designer.
Platform: Flutter Mobile (Clean Light SaaS).
Theme: White surface (#FFFFFF), Slate-50 canvas (#F8FAFC), Blue-600 accents. Matches Serv.io Web App. Zero black styling.

Top Header:
- White surface, 1px border-bottom (#E2E8F0), padding 16px.
- Left: "Halo, Budi Santoso" (16px Bold, #0F172A) + Workshop Clock "15:42 WIB • Selasa, 20 Oktober" (11px, #64748B).
- Right: "On Duty" status pill (Emerald-50 bg, Emerald-700 text) + QR Scan icon button in Blue-50 container with Blue-600 icon.

Body (Scrollable, Slate-50):
- SLA Donut Summary Card:
  - White card, 14px radius, 1px border (#E2E8F0), padding 16px.
  - Donut ring visual showing big number "27" (24px Bold, #0F172A), sublabel "TIKET AKTIF". Ring colored in Emerald-500, Amber-500, and Red-500 arcs.
  - Legend tags below: "On Track: 0", "Warning: 0", "Overdue: 22", "Pause (ACC): 5".
- Urgent Alerts Row (2 cards side-by-side):
  - Left Card: Soft Red (#FEF2F2 bg, #FECACA border), alert-triangle icon, label "Melewati Estimasi", big number "22" in Red-700, arrow right.
  - Right Card: Soft Amber (#FFFBEB bg, #FDE68A border), zap icon, label "Prioritas Express", big number "5" in Amber-700, arrow right.
- Quick Actions Bar (4 clean white cards):
  - 1. Scan QR Tiket (Blue-50 bg icon)
  - 2. Tiket Saya (Indigo-50 bg icon)
  - 3. Cek Stok Part (Amber-50 bg icon)
  - 4. Pustaka Wiki (Emerald-50 bg icon)
- Section "Stok Suku Cadang Kritis":
  - Title: Alert icon + "Stok Menipis di Gudang" with "Katalog Part →" link.
  - Dense list rows:
    - "Corsair Vengeance DDR4 16GB" -> Red pill "0 unit"
    - "Universal USB-C 65W GaN Charger" -> Red pill "0 unit"
    - "Baterai Dell Inspiron 14 5400" -> Amber pill "1 unit"
- Section "Tiket Sedang Dikerjakan":
  - Card: Ticket #TKT-202410-0089. Status: "DALAM PERBAIKAN" (Indigo-50 bg, Indigo-700 text). Unit: "Lenovo Legion 5 15ACH6". Customer: "Hendra Wijaya". Issue: "Thermal throttle & short VCore". SLA timer: "Sisa 3 jam".
Bottom Navigation: 4 tabs (Dashboard, Tiket Servis, Sparepart, Profil).
Constraints: Zero emojis, clear vector icons, 48px touch targets.
```

---

### Screen 3: Antrean Tiket Servis & Filter Status (Ticket Queue Hub)

* **Tujuan**: Memungkinkan teknisi menelusuri tiket, memfilter status servis, dan mengambil alih unit dari antrean umum bengkel.
* **Elemen UI**:
  1. Search Bar: Input pencarian nomor tiket, customer, model laptop, atau serial number.
  2. Segmented Switch: `[Tiket Saya (4)]` vs `[Semua Antrean Bengkel (27)]`.
  3. Filter Chips Horizontal: `Semua`, `Diterima`, `Didiagnosis`, `Menunggu ACC`, `Disetujui`, `Perbaikan`, `Selesai`, `Overdue`, `Express`.
     * **Chip Aktif**: Background Soft Blue `#EFF6FF`, border `#BFDBFE`, teks Blue-600 `#2563EB` font-semibold. (Tanpa chip hitam!).
  4. Ticket Cards: Nomor tiket monospace, status pill, prioritas express, nama model laptop, nama customer dengan tombol direct chat WhatsApp, dan keluhan.

```stitch
PROMPT GOOGLE STITCH - SCREEN 3: TICKET QUEUE & FILTER HUB
Role: Enterprise Mobile UX Architect.
Platform: Flutter Mobile (Light Theme).
Theme: Slate-50 Scaffold, Pure White Cards, Blue-600 Highlights. Strictly NO black chips.

Header:
- White App Bar: Title "Daftar Tiket Servis" (17px Bold, #0F172A).
- Search Bar: Height 44px, white background, 1px border (#E2E8F0), rounded 10px, prefix search icon, placeholder "Cari nomor tiket, customer, laptop, SN...".
- Assignment Segmented Switch (2 tabs):
  - Left tab: "Tiket Tugas Saya (4)" (Selected: Blue-600 text, Blue-50 bg, Blue-200 border, rounded 8px).
  - Right tab: "Semua Antrean (27)" (Unselected: Slate-600 text, transparent bg).
- Horizontal Scrollable Filter Chips:
  - Selected Chip: Soft Blue-50 background (#EFF6FF), Blue-200 border (#BFDBFE), Blue-600 bold text (#2563EB), rounded-full pill.
  - Unselected Chips: White background (#FFFFFF), Slate-200 border (#E2E8F0), Slate-600 text (#475569).
  - Chips: "Semua", "Diterima", "Didiagnosis", "Menunggu ACC", "Perbaikan", "Selesai", "Overdue (22)", "Express (5)".

Ticket List View (Vertical Scrollable, 12px gap):
- Card 1 (In Progress / Overdue):
  - White surface, 1px border (#E2E8F0), 12px radius, padding 14px.
  - Top Row: Monospace "#TKT-202410-0089" (14px Bold) + Status pill "DALAM PERBAIKAN" (Indigo-50 bg, Indigo-700 text) + Red pill "OVERDUE 2h" (Red-50 bg, Red-700 text).
  - Device: Laptop icon + "Lenovo Legion 5 15ACH6" (14px SemiBold) • "SN: PF2X9K1L" (12px, #64748B).
  - Customer: "Hendra Wijaya" (13px) + Emerald WhatsApp icon button.
  - Complaint: "Mati total saat render 3D, tercium bau gosong di ventilasi kiri" (12px, #64748B, 2 lines max).
  - Footer: "Masuk: 14 Okt 2024" • "Teknisi: Budi Santoso" • Arrow Right.
- Card 2 (Unassigned Queue / Express):
  - Top Row: "#TKT-202410-0094" + Status "DITERIMA" (Sky-50 bg, Sky-700 text) + Amber pill "EXPRESS" (Amber-50 bg, Amber-700 text, zap icon).
  - Device: "MacBook Pro M1 13-inch 2020" • "SN: C02F8..."
  - Unassigned Banner: Light Amber container (#FFFBEB), border #FDE68A, text "Belum ada teknisi penanggung jawab" + Action Button "Ambil Alih Pengerjaan" (Amber-600 text, bold).
Floating Action Button: Blue-600 round button with QR scanner icon at bottom-right.
Constraints: Zero emojis, responsive text ellipsis, 48px touch targets.
```

---

### Screen 4: Detail Meja Pengerjaan Servis (Ticket Digital Workbench)

* **Tujuan**: Layar sentral kerja teknisi membongkar dan memperbaiki unit: membaca kredensial password laptop, melihat foto intake kasir, memeriksa rekam medis riwayat servis masa lalu unit ini, melihat rekomendasi wiki, dan mengeksekusi tahapan pengerjaan.
* **Elemen UI**:
  1. Stepper Siklus Servis: `Diterima` ──► `Diagnosis` ──► `ACC Pelanggan` ──► `Perbaikan` ──► `QC & Selesai`.
  2. Device Credentials Vault: Kotak Soft Indigo (`#EEF2FF`) berisi sandi PIN/Password laptop tersensor dengan tombol unmask dan tombol copy.
  3. Strip Foto Fisik Masuk: Thumbnail horizontal foto fisik laptop saat pertama kali diterima di kasir.
  4. Accordion Rekam Medis Unit Terdahulu (Persis seperti Web App):
     * Menampilkan riwayat servis terdahulu dari laptop dengan Serial Number yang sama di Serv.io (misal: "3 bulan lalu: Ganti Fan & Repaste").
     * Jika unit baru: Banner hijau *"Tidak ada riwayat perbaikan terdahulu untuk unit ini. Ini adalah kali pertama unit tercatat di Serv.io."*
  5. Accordion Solusi Wiki Terkait: Saran panduan troubleshooting hardware internal Serv.io khusus tipe laptop tersebut.
  6. Tabbed Workspace Meja Servis:
     * Tab 1: **Diagnosis & Biaya**: Analisis temuan teknisi, rencana tindakan, estimasi jasa + sparepart.
     * Tab 2: **Suku Cadang Terpakai**: Daftar part yang dialokasikan, stok ketersediaan, status ACC.
     * Tab 3: **Foto Bukti Pengerjaan**: Upload foto komponen rusak, proses solder, dan hasil tes akhir.
     * Tab 4: **Log Progres Kerja**: Catatan kronologis tahapan teknisi.
  7. Sticky Bottom Action Bar: Tombol dinamis sesuai fase (e.g. "Input Diagnosis", "Kirim Estimasi via WhatsApp", "Lanjut ke Verifikasi QC & Selesai").

```stitch
PROMPT GOOGLE STITCH - SCREEN 4: TICKET DIGITAL WORKBENCH
Role: Senior Staff Mobile Product Designer.
Platform: Flutter Mobile (Clean Light Theme).
Theme: Slate-50 Scaffold (#F8FAFC), Pure White Containers (#FFFFFF), Blue-600 Primary. Strictly NO black styling.

Top App Bar:
- White surface, border-bottom #E2E8F0.
- Title: "Tiket #TKT-202410-0089" (16px Bold) + Subtitle "Lenovo Legion 5 15ACH6" (12px, #64748B).
- Action: Direct WhatsApp customer icon button (Emerald-50 bg, Emerald-600 icon).

Scrollable Body (Padding 16px, Slate-50):
- Lifecycle Stepper (Horizontal):
  - 5-step progress: Diterima (done) -> Diagnosis (done) -> Persetujuan ACC (done) -> Perbaikan (ACTIVE, Blue-600 circle) -> QC & Selesai (pending).
- Device Credentials Vault:
  - Soft Indigo container (#EEF2FF), border #C7D2FE, 12px radius, padding 14px.
  - Header: Lock icon + "Kredensial Akses Perangkat (PIN / Password Unit)".
  - Password display: "••••••••" (16px Mono) with toggle unmask eye icon and copy-to-clipboard button.
- Intake Photos Strip:
  - Header: Camera icon + "Foto Kondisi Fisik Saat Masuk (4 Foto)".
  - Horizontal scroll of 80x80 dp square photo thumbnails, rounded 8px.
- Section "Rekam Medis Unit Terdahulu" (Direct from Web App Accordion):
  - White container with border #E2E8F0, rounded 12px, padding 14px.
  - Header: History icon + "Rekam Medis Perangkat Ini di Serv.io" + Badge "1x Servis Sebelumnya".
  - Timeline item: "12 Juli 2024 (Tiket #TKT-202407-0032) - Ganti Kipas Pendingin Kiri & Thermal Paste - Teknisi: Budi Santoso - Status: Selesai / Garansi Expired".
- Section "Pustaka Solusi Wiki Terkait Unit":
  - Header: Book-open icon + "Pustaka Solusi Wiki Toko" + Badge "Hardware Knowledge Base".
  - Tip card: "SOP Perbaikan Lenovo Legion 5 Short Circuit VCore 19V (3 Langkah Solusi Teruji)".
- Tabbed Information Area (Tabs: Diagnosis & Biaya, Sparepart, Foto Kerja, Log):
  - Active Tab: Blue-600 highlight.
  - Content Preview (Diagnosis):
    - Problem: "Short circuit kapasitor bypass jalur 19V VCore dan kipas pendingin tersumbat debu padat."
    - Action: "Penggantian kapasitor SMD 10uF 25V + pembersihan fan & repaste Honeywell PTM7950."
    - Cost: Jasa Rp 350.000 + Part Rp 270.000 = Total Rp 620.000.
- Sticky Bottom Action Bar:
  - White container with top shadow, height 68px, padding 10px 16px.
  - Primary Button: Full-width Emerald-600 (#10B981) button, height 48px, rounded 10px, bold white text "Lanjut ke Verifikasi QC & Selesai", check-circle icon.
Constraints: Zero emojis, anti-overflow safe wrapping, 48px touch targets.
```

---

### Screen 5: Modal Input Diagnosis & Kalkulator Biaya (Diagnosis Sheet)

* **Tujuan**: Bottom sheet modal bagi teknisi untuk mencatat kerusakan teknis, merekomendasikan solusi, dan menghitung estimasi biaya (jasa + sparepart) untuk diajukan ke customer.
* **Elemen UI**:
  * Shape: Top rounded 24px, Pure White (`#FFFFFF`).
  * Drag Handle pill (36x4 dp).
  * Field Analisis Kerusakan: Textarea multi-line (3 baris).
  * Field Rekomendasi Solusi: Textarea multi-line (3 baris).
  * Kalkulator Biaya: Input Biaya Jasa Servis + Subtotal Sparepart (terhitung otomatis) = Total Estimasi Biaya (Teks tebal Blue-600).
  * Toggle Quoter WhatsApp: Checkbox "Kirimkan draf rincian penawaran ke WhatsApp pelanggan secara otomatis".
  * Submit Button: Blue-600 elevated button "Simpan Diagnosis & Ajukan ACC", tinggi 48px.

```stitch
PROMPT GOOGLE STITCH - SCREEN 5: DIAGNOSIS & COST ESTIMATION SHEET
Role: Enterprise Mobile UX Designer.
Platform: Flutter Mobile Bottom Sheet.
Theme: Pure White surface (#FFFFFF), Slate-50 cards, Blue-600 primary button. Zero dark containers.

Modal Sheet Container:
- Shape: Top rounded radius 24px, pure white surface (#FFFFFF), 1px border-top (#E2E8F0).
- Top Center: Rounded drag handle pill (36x4 dp, Slate-300).
- Header: Row with title "Input Hasil Diagnosis & Estimasi" (16px SemiBold, #0F172A) + close X button.

Form Body (Scrollable with keyboard viewInsets padding):
- Field 1 (Analisis Kerusakan):
  - Label: "Analisis Kerusakan & Komponen Rusak" (13px Medium, #475569).
  - Input: Multi-line outline field (3 lines), rounded 10px, border #E2E8F0, placeholder "Uraikan bagian komponen/jalur PCB yang rusak...".
- Field 2 (Rekomendasi Tindakan):
  - Label: "Rekomendasi Tindakan Perbaikan" (13px Medium, #475569).
  - Input: Multi-line outline field (3 lines), rounded 10px, border #E2E8F0, placeholder "Contoh: Penggantian MOSFET power step-down...".
- Cost Breakdown Card (Slate-50 bg, border #E2E8F0, rounded 12px, padding 14px):
  - Row 1: "Biaya Jasa Servis" -> Number input with "Rp" prefix, value "350.000".
  - Row 2: "Estimasi Biaya Sparepart" -> Auto-calculated subtotal "Rp 270.000".
  - Divider (1px, #E2E8F0).
  - Row 3: "Total Estimasi ke Pelanggan" -> "Rp 620.000" (16px Bold, Blue-600 #2563EB).
- WhatsApp Dispatch Toggle:
  - Soft Emerald container (#ECFDF5), border #A7F3D0, rounded 10px, padding 10px.
  - Checkbox checked + text "Kirimkan draf persetujuan harga ke nomor WhatsApp pelanggan secara otomatis".
- Submit CTA:
  - Full-width Blue-600 button, height 48px, rounded 10px, bold white text "Simpan Diagnosis & Ajukan ACC".
Constraints: Zero emojis, responsive keyboard push-up, strictly clean light mode.
```

---

### Screen 6: Katalog Suku Cadang & Alokasi Part (Sparepart Hub)

* **Tujuan**: Memungkinkan teknisi mengecek stok suku cadang gudang secara real-time, mengetahui lokasi rak penyimpanan di bengkel, dan mengalokasikan part ke tiket yang sedang dikerjakan.
* **Elemen UI**:
  1. Header: Search bar nama part/SKU + barcode scanner icon untuk scan stiker part.
  2. Filter Kategori Suku Cadang: Chip scrollable: `Semua`, `RAM`, `SSD`, `Baterai`, `Keyboard`, `Layar LCD`, `Thermal Paste & Fan`, `IC Power`.
  3. Kartu Sparepart:
     * Nama Part & Merk (misal: "SSD NVMe 512GB Kingston NV2").
     * Kode SKU & Lokasi Rak Gudang (misal: `SKU-NV2-512` • `Rak Bin C-04`).
     * Indikator Stok: Badge Hijau jika stok aman (>5 unit), Kuning jika menipis (<=3 unit), Merah jika habis.
     * Harga Satuan Teknisi.
     * Stepper Kuantitas `[-] [ 1 ] [+]` dan tombol `Pasang ke Tiket`.

```stitch
PROMPT GOOGLE STITCH - SCREEN 6: SPAREPART INVENTORY & ALLOCATION
Role: Inventory & Workshop UX Specialist.
Platform: Flutter Mobile (Light Theme).
Theme: White cards, Slate-50 background, Blue-600 primary, Emerald/Amber/Red stock pills. No black cards.

Header:
- Title: "Katalog Suku Cadang Bengkel" (17px Bold, #0F172A).
- Search Row: 44px text input "Cari nama part, kode SKU, atau merk..." + Barcode Scanner icon button.
- Horizontal Category Chips:
  - Active: "Semua" (Blue-50 bg, Blue-600 text, Blue-200 border).
  - Inactive: "RAM SODIMM", "SSD NVMe", "Baterai Laptop", "Keyboard", "Thermal & Fan", "IC Power".

Sparepart List:
- Card 1 (Ready Stock):
  - White surface, 1px border (#E2E8F0), 12px radius, padding 14px.
  - Top Row: "SSD NVMe 512GB Kingston NV2 Gen4" (14px SemiBold) + Stock pill "Stok: 8 unit" (Emerald-50 bg, Emerald-700 text).
  - Meta: SKU "SKU-NV2-512G" • Lokasi Rak "Bin C-04" (12px, #64748B).
  - Price & Action: Price "Rp 520.000" + Stepper [-] [ 1 ] [+] + Button "Pasang ke Tiket" (Blue-600, height 36px, white text).
- Card 2 (Low Stock Alert):
  - Part: "Baterai Dell Inspiron 14 5400 / 5410 Original"
  - Stock pill: Amber pill "Sisa 1 unit" (Amber-50 bg, Amber-700 text).
  - Meta: SKU "BAT-DELL-5400" • Lokasi Rak "Bin A-02".
  - Price: "Rp 450.000".
- Card 3 (Out of Stock):
  - Part: "Thermal Paste Honeywell PTM7950"
  - Stock pill: Red pill "Stok Habis" (Red-50 bg, Red-700 text).
  - Action: Outlined button "Request Restok ke Gudang".
Constraints: Zero emojis, precise inventory tags, responsive thumb reach.
```

---

### Screen 7: Pustaka Wiki Solusi Servis (Repair Knowledge Base)

* **Tujuan**: Mengintegrasikan fitur Pustaka Wiki Serv.io agar teknisi di meja kerja dapat mencari panduan perbaikan, solusi teruji kasus serupa, kode error motherboard, dan skematik laptop.
* **Elemen UI**:
  1. Search Bar Wiki: "Cari gejala, kode error, tipe laptop (misal: Asus TUF no display)...".
  2. Kategori Kerusakan: Chip filter: `Semua`, `Mati Total`, `Layar & GPU`, `Overheating`, `BIOS & Firmware`, `Short Circuit`.
  3. Kartu Panduan Wiki:
     * Judul Solusi Teknis.
     * Model Perangkat Terkait (Tag pill).
     * Cuplikan ringkas langkah perbaikan (1-2 baris).
     * Lampiran: Ikon Skematik / Boardview jika tersedia file pendukung.
     * Metrik Keberhasilan: Badge "Telah Teruji (98% Sukses)".

```stitch
PROMPT GOOGLE STITCH - SCREEN 7: REPAIR WIKI & KNOWLEDGE BASE
Role: Technical Knowledge Base UX Designer.
Platform: Flutter Mobile (Light Theme).
Theme: Slate-50 Scaffold, Pure White Cards, Blue-600 primary, Emerald verification badges. No black elements.

Header:
- Title: "Pustaka Wiki Servis" (17px Bold, #0F172A).
- Subtitle: "Basis data solusi & panduan troubleshooting bengkel" (12px, #64748B).
- Search Bar: Height 44px, white surface, border #E2E8F0, prefix book icon, placeholder "Cari gejala, motherboard, kode error...".
- Category Tags: Scrollable chips ("Semua", "Power & Short", "Display & GPU", "BIOS Repair", "Thermal & Fan").

Wiki Articles List:
- Card 1:
  - White surface, 12px radius, 1px border (#E2E8F0), padding 14px.
  - Tag Row: Pill "POWER / SHORT" (Sky-50 bg, Sky-700 text) + Pill "Asus Series" (Slate-100 bg, Slate-700 text).
  - Title: "Mengatasi Short Circuit Jalur 19V pada Asus TUF Gaming FX505" (15px Bold, #0F172A).
  - Summary: "Kapasitor keramik PC401 di dekat MOSFET input sering bocor. Ganti dengan kapasitor 10uF 25V." (12px, #475569).
  - Footer: Verified badge "Telah Teruji (98% Sukses)" in Emerald-50 bg + Attachment pill "Skematik Boardview (.pdf)" + Arrow right.
- Card 2:
  - Title: "SOP Penggantian Thermal Paste PTM7950 & Pembersihan Fan Laptop Gaming"
  - Tag: "MAINTENANCE / SOP" (Emerald-50 bg, Emerald-700 text).
  - Step counter: "5 Langkah Prosedur Kerja Terstandarisasi".
Constraints: Zero emojis, clean typography, bookmark action.
```

---

### Screen 8: Scanner Barcode & QR Tiket Fisik (Camera Scanner)

* **Tujuan**: Pemindaian instan label tiket fisik pada casing laptop untuk langsung membuka Detail Meja Kerja unit tersebut.
* **Elemen UI**:
  * Viewport Kamera Fullscreen dengan overlay semi-transparan.
  * Frame Viewfinder Kotak (260x260 dp) dengan sudut beraksen **Electric Blue (`#2563EB`)** dan laser scan bar horizontal biru animasi halus.
  * Top Overlay Controls: Tombol kembali, toggle Flashlight Torch (On/Off), dan switch kamera.
  * Bottom Manual Input Sheet: Kontainer putih di bagian bawah dengan text field input manual nomor tiket jika barcode rusak.

```stitch
PROMPT GOOGLE STITCH - SCREEN 8: CAMERA QR & BARCODE SCANNER
Role: Mobile Camera Interface Specialist.
Platform: Flutter Mobile (Clean Tech Viewport).
Theme: Clean camera viewfinder with high-contrast Blue-600 guides and white bottom input card.

Overlay Controls:
- Top Bar: Semi-transparent header with back icon, flashlight torch icon button (yellow highlight when active), and auto-focus indicator.
- Center Viewfinder Box:
  - 260x260 dp square frame with 4 bold corner bracket accents in Blue-600 (#2563EB, 4px stroke, 18px length).
  - Smooth animated horizontal laser scanning line in Blue-500 (#3B82F6).
  - Helper label below box: "Arahkan kamera ke Barcode / QR Tiket Fisik" (13px, white, medium weight with text shadow).
- Bottom Manual Search Card (White surface, 20px top radius, padding 16px):
  - Label: "Barcode tidak terbaca? Masukkan kode tiket manual:" (12px, #64748B).
  - Input Row: Text field placeholder "Contoh: TKT-202410-0089" + Submit button "Cari Tiket" in Blue-600 (#2563EB, height 44px, white text).
  - Format hint: "Mendukung cetak barcode thermal dan QR tanda terima Serv.io".
Constraints: Zero emojis, clean laser animation, zero layout clipping.
```

---

### Screen 9: Modal Verifikasi Quality Control (QC 8-Point WOW Modal)

* **Tujuan**: Modal verifikasi kendali mutu wajib (persis seperti dialog QC di Web App saat status diubah ke `selesai`) untuk menjamin seluruh fungsi unit telah diuji sebelum laptop diserahkan kepada pelanggan.
* **Elemen UI**:
  * Shape: Top rounded 24px, White surface.
  * Header: Verified icon hijau + Judul "Kendali Mutu (8-Point WOW QC)" + Subtext "Verifikasi seluruh titik uji fungsi berikut sebelum unit dinyatakan selesai:".
  * Checklist 8 Titik Uji Fungsi:
     1. `Display & Visual` (Layar jernih bebas dead pixel/flicker)
     2. `Keyboard & Touchpad` (Seluruh tombol & clicker responsif 100%)
     3. `Audio & Speaker` (Output suara jernih tanpa kresek)
     4. `Baterai & Pengisian` (Charging cycle normal hingga penuh)
     5. `Port & Konektivitas` (Port USB, Type-C, audio jack terdeteksi)
     6. `WiFi & Bluetooth` (Koneksi jaringan nirkabel stabil)
     7. `Uji Suhu & Stress Test` (Suhu stabil saat stress test)
     8. `Kebersihan Fisik & Baut Lengkap` (Casing bersih, baut presisi)
  * Catatan Tambahan QC: Textarea catatan hasil uji teknisi.
  * Tombol Sahkan QC: Tombol Emerald-600 (#10B981) "Sahkan Lulus QC & Tandai Selesai", tinggi 48px.

```stitch
PROMPT GOOGLE STITCH - SCREEN 9: QUALITY CONTROL (8-POINT WOW QC MODAL)
Role: QA & Workshop Compliance UX Designer.
Platform: Flutter Mobile Bottom Sheet Modal.
Theme: Pure White surface (#FFFFFF), Emerald-500 accents for verified items, Emerald-600 primary button. Zero dark styling.

Header:
- Shape: Rounded top 24px, 1px border-top (#E2E8F0).
- Drag handle pill (36x4 dp).
- Title: "Kendali Mutu (8-Point WOW QC)" (16px Bold, #0F172A).
- Subtitle: "Verifikasi standar kualitas akhir sebelum unit siap diserahkan" (12px, #64748B).
- Status Pill: "STATUS: 8/8 VERIFIED (LULUS QC)" (Emerald-50 bg, Emerald-700 text).

Interactive Checklist (8 Dense Card Rows, 8px gap):
- Item 1: Display & Visual -> Checkbox checked, monitor icon, subtext "Layar bebas garis, dead pixel, flicker".
- Item 2: Keyboard & Touchpad -> Checkbox checked, keyboard icon, subtext "Semua tombol berfungsi 100%".
- Item 3: Audio & Mic -> Checkbox checked, volume icon, subtext "Speaker kiri & kanan jernih, mic aktif".
- Item 4: Battery & Charging -> Checkbox checked, battery icon, subtext "Charging stabil, siklus baterai sehat".
- Item 5: Port & Connectivity -> Checkbox checked, usb icon, subtext "Semua port USB, Type-C, audio jack normal".
- Item 6: WiFi & Bluetooth -> Checkbox checked, wifi icon, subtext "Koneksi internet cepat & stabil".
- Item 7: Suhu & Thermal Stress -> Checkbox checked, thermometer icon, subtext "Uji stress test stabil pada suhu wajar".
- Item 8: Kebersihan & Baut Lengkap -> Checkbox checked, check icon, subtext "Casing bersih mengkilap, baut utuh presisi".

Catatan QC Field:
- Outline textarea (2 lines), label "Catatan Tambahan Kendali Mutu", value "Lulus uji kelayakan 8 poin kendali mutu & pembersihan menyeluruh standar WOW Service."

Final Submit Action:
- Full-width Emerald-600 button (#10B981), height 48px, rounded 10px, bold white text "Sahkan Lulus QC & Tandai Selesai", verified icon.
Constraints: Zero emojis, instant checkbox toggle, strict QA standards.
```

---

### Screen 10: Profil & Scorecard Kinerja Teknisi (Technician Profile)

* **Tujuan**: Menampilkan kartu pencapaian kinerja pribadi teknisi (diadopsi langsung dari modul User & Performa web app), akses panduan SOP WOW, dan pengaturan akun.
* **Elemen UI**:
  1. Profile Header Card: Avatar inisial teknisi (Blue-600, huruf putih besar), nama "Budi Santoso", email teknisi, dan badge role `TEKNISI SENIOR` (Blue-50).
  2. Scorecard Kinerja Servis (3 Grid Metrik):
     * **Total Tiket Selesai**: Angka "142 Unit" (Ikon check-circle, Emerald-600).
     * **Rata-rata Waktu Servis**: Angka "3.8 Hari" (Sesuai metrik dashboard web).
     * **Rating CSAT Kepuasan**: Angka "4.9 / 5.0" (Ikon bintang kuning).
  3. Tombol Buku Saku SOP Layanan:
     * Card button "Panduan Standar Layanan (WOW SOP)" dengan badge `WOW` (persis tombol di sidebar web app).
  4. Pengaturan Akun: Ganti kata sandi dan toggle login biometrik.
  5. Tombol Keluar (Logout): Outlined Red-500 button (#EF4444) dengan dialog konfirmasi keluar.

```stitch
PROMPT GOOGLE STITCH - SCREEN 10: TECHNICIAN PROFILE & SCORECARD
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

1. **Safe Text Wrapping**: Seluruh teks dinamis backend wajib dibungkus `Expanded` dengan `TextOverflow.ellipsis`:
   ```dart
   Expanded(
     child: Text(
       value,
       maxLines: 1, // atau 2 untuk keluhan
       overflow: TextOverflow.ellipsis,
       style: AppTypography.bodyRegular,
     ),
   )
   ```
2. **Keyboard Avoidance Modal**: Seluruh Bottom Sheet wajib menggunakan `isScrollControlled: true` dan padding `viewInsets`:
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
3. **Filter Chips Scrollable**: Gunakan `SingleChildScrollView(scrollDirection: Axis.horizontal)` dengan jarak chip `8px`.

---

## 6. Daftar Periksa Kualitas (QA Checklist) Sebelum Rilis UI

- [ ] **100% Sesuai Scope Teknisi**: Tidak ada fitur kasir/faktur/CRM retensi yang keluar jalur.
- [ ] **Zero Black Elements**: Tema 100% Light Mode (Slate-50 & Pure White), tidak ada hero atau chip hitam.
- [ ] **Rekam Medis & QC Terintegrasi**: Rekam medis tampil di Detail Tiket dan modal QC 8-Point muncul saat status diubah ke Selesai (persis Web App).
- [ ] **Zero Emojis**: Bebas karakter unicode emoji, hanya menggunakan ikon vektor SVG/Material Outlined.
- [ ] **Target Sentuh 48dp**: Seluruh tombol ramah penggunaan sarung tangan dan satu tangan.
- [ ] **Bebas Layout Overflow**: Tidak ada error garis kuning-hitam `RenderFlex overflowed`.
