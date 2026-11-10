# Skenario Pengujian White Box — Yangversa Computer (YVS) ERP

Dokumen ini memuat skenario pengujian struktural berbasis **White Box Testing** untuk sistem ERP Yangversa Computer. Seluruh skenario didasarkan pada audit mendalam terhadap logika kode internal backend (Node.js/Express, Prisma ORM, Middleware) dan arsitektur frontend (Axios interceptor, IndexedDB SWR caching, dan Capacitor native bridges).

---

## Ringkasan Atribut Tabel

| Kolom | Deskripsi |
|---|---|
| **Test ID** | Identifikator unik pengujian (`WB-MODUL-XXX`) |
| **Module** | Komponen/Modul kode yang diuji |
| **Test Type** | White Box |
| **Test Scenario** | Logika internal / jalur eksekusi (branch) yang diuji |
| **Preconditions** | Prasyarat status internal, database, atau payload token |
| **Test Steps** | Langkah-langkah pengujian unit/integrasi internal |
| **Test Data** | Input payload, variabel mock, atau parameter fungsi |
| **Expected Result** | Eksekusi percabangan kode, status HTTP, dan mutasi database yang diharapkan |
| **Actual Result** | Hasil pelaksanaan pengujian (*dikosongkan untuk eksekusi*) |
| **Status** | Status pengujian (*Not Tested*) |
| **Priority** | Tingkat urgensi: `Critical` / `High` / `Medium` / `Low` |

---

## 1. State Machine & Transisi Status Tiket Servis (`STATUS_TRANSITIONS`)

File implementasi: `backend/src/controllers/tiket-servis.controller.js` (Baris 19–30, 560–630)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-STA-001 | Tiket State Machine | White Box | Penolakan transisi status ilegal yang melompati tahapan (contoh: `diterima` -> `selesai`) | Tiket di database berstatus `diterima` | 1. Kirim request `PUT /api/tiket-servis/:id`<br>2. Set body `status`: "selesai"<br>3. Evaluasi branch pengecekan `STATUS_TRANSITIONS[tiket.status]` | Payload: `{"status": "selesai"}` | Controller mendeteksi "selesai" tidak ada dalam array `STATUS_TRANSITIONS["diterima"]`, langsung me-return HTTP 400: `Transisi status tidak valid: diterima → selesai`, database tidak berubah | Terverifikasi: Mengembalikan error HTTP 400 dengan pesan sesuai ekspektasi | Passed | Critical |
| WB-STA-002 | Tiket State Machine | White Box | Penolakan mutasi status pada state terminal `diambil` | Tiket di database berstatus `diambil` | 1. Kirim request `PUT /api/tiket-servis/:id`<br>2. Set body `status`: "didiagnosis"<br>3. Evaluasi evaluasi array transisi | Payload: `{"status": "didiagnosis"}` | Karena `STATUS_TRANSITIONS["diambil"] = []`, fungsi me-return HTTP 400 penolakan transisi status, menjaga sifat immutable state terminal | Terverifikasi: Seluruh target transisi dari state diambil ditolak dengan HTTP 400 | Passed | Critical |
| WB-STA-003 | Tiket State Machine | White Box | Penolakan mutasi status pada state terminal `dibatalkan` | Tiket di database berstatus `dibatalkan` | 1. Kirim request `PUT /api/tiket-servis/:id`<br>2. Set body `status`: "dalam_perbaikan" | Payload: `{"status": "dalam_perbaikan"}` | Karena `STATUS_TRANSITIONS["dibatalkan"] = []`, fungsi me-return HTTP 400 penolakan transisi status | Terverifikasi: Seluruh target transisi dari state dibatalkan ditolak dengan HTTP 400 | Passed | Critical |
| WB-STA-004 | Tiket State Machine | White Box | Penegakan RBAC Teknisi: Larangan transisi `menunggu_persetujuan` -> `disetujui` | Token JWT memiliki `role: "teknisi"`, tiket berstatus `menunggu_persetujuan` | 1. Teknisi mengirimkan request `PUT /api/tiket-servis/:id` dengan `status: "disetujui"`<br>2. Evaluasi percabangan `req.user.role === "teknisi"` | Payload: `{"status": "disetujui"}` | Branch mengecek `allowedTeknisiTransitions["menunggu_persetujuan"]`, mendapati "disetujui" tidak diizinkan untuk teknisi, me-return HTTP 403: `Akses ditolak: Teknisi tidak diizinkan... Tahap ini dikelola oleh Admin` | Terverifikasi: Teknisi diblokir dengan HTTP 403, Admin diloloskan dengan HTTP 200 | Passed | Critical |
| WB-STA-005 | Tiket State Machine | White Box | Validasi keberadaan minimal satu Log Perbaikan fase "Perbaikan" saat transisi ke `selesai` | Tiket berstatus `dalam_perbaikan`, belum memiliki record `LogPerbaikan` fase "Perbaikan" | 1. Kirim `PUT /api/tiket-servis/:id` dengan `status: "selesai"`<br>2. Evaluasi query `prisma.logPerbaikan.findFirst` | Payload: `{"status": "selesai"}` | Query mendapati `logPerbaikan` bernilai null, me-return HTTP 400: `Proteksi: Anda harus menambahkan minimal satu Log Perbaikan sebelum dapat menyelesaikan tiket ini`, rollback mutasi | Terverifikasi: Ditolak dengan HTTP 400 jika log Perbaikan nihil, diterima jika ada | Passed | Critical |
| WB-STA-006 | Tiket State Machine | White Box | Validasi kelulusan QC (`passed_qc: true`) saat transisi status ke `diambil` | Tiket berstatus `selesai`, data `checklist_qc.passed_qc` bernilai `false` | 1. Kirim `PUT /api/tiket-servis/:id` dengan `status: "diambil"`<br>2. Evaluasi ternary parsing `passedQc` | Payload: `{"status": "diambil"}` | Nilai `passedQc` false, fungsi mengeksekusi return HTTP 400: `Proteksi QC: Unit wajib melewati Checklist QC Pra-Penyerahan...`, status tidak berubah | Terverifikasi: Ditolak dengan HTTP 400 jika passed_qc false, diizinkan jika true | Passed | Critical |
| WB-STA-007 | Tiket State Machine | White Box | Proteksi pemblokiran status `diambil` jika ada relasi `loanerRecord` aktif | Tiket memiliki record di tabel `loanerRecord` dengan `status: "aktif"` | 1. Kirim `PUT /api/tiket-servis/:id` dengan `status: "diambil"`<br>2. Evaluasi query `prisma.loanerRecord.findFirst` | Payload: `{"status": "diambil"}` | Record pinjaman aktif ditemukan, controller me-return HTTP 400: `Proteksi Unit Pinjaman: Pelanggan masih meminjam unit cadangan...`, mencegah unit dibawa sebelum laptop pinjaman kembali | Terverifikasi: Ditolak dengan HTTP 400 selama status pinjaman masih aktif | Passed | Critical |
| WB-STA-008 | Tiket State Machine | White Box | Penguncian modifikasi teknis (Data Locking) saat tiket berstatus `selesai` atau `diambil` | Tiket di database memiliki status `selesai` | 1. Kirim `PUT /api/tiket-servis/:id` dengan body `keluhan` baru atau `checklist_intake` baru tanpa mengubah status ke diambil | Payload: `{"keluhan": "Edit keluhan setelah selesai"}` | Variabel `isLocked` bernilai true dan `hasTechnicalEdits` true, fungsi me-return HTTP 400: `Data checklist, protokol layanan, dan data teknis unit telah dikunci karena servis telah selesai/diambil` | | Not Tested | High |

---

## 2. Integritas Transaksi Database & Concurrency Race Condition (PRISMA-TX)

File implementasi: `backend/src/controllers/sparepart.controller.js` (Baris 478–540) & `backend/src/controllers/tiket-servis.controller.js`

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-TX-001 | Prisma Transaksi | White Box | Transaksi atomik pengurangan stok suku cadang via `prisma.$transaction` | Suku cadang ID #5 memiliki `stok: 3`, tiket ID #10 berstatus `dalam_perbaikan` | 1. Panggil fungsi `use` dengan payload jumlah 2<br>2. Amati eksekusi blok `prisma.$transaction(async (tx) => ...)` | `tiket_id`: 10, `sparepart_id`: 5, `jumlah`: 2 | Di dalam transaksi: `tx.sparepart.update` melakukan decrement 2 (stok menjadi 1), `tx.penggunaanSparepart.create` membuat record relasi, `tx.logPerbaikan.create` mencatat log. Seluruh transaksi committed serentak | | Not Tested | Critical |
| WB-TX-002 | Prisma Transaksi | White Box | Rollback otomatis seluruh operasi jika stok tidak mencukupi di dalam transaksi | Suku cadang ID #5 memiliki `stok: 1` | 1. Panggil fungsi `use` dengan `jumlah: 3`<br>2. Evaluasi evaluasi kondisi `currentSparepart.stok < qty` | `tiket_id`: 10, `sparepart_id`: 5, `jumlah`: 3 | Error dilempar: `Stok sparepart tidak mencukupi (sisa 1)`. Transaksi Prisma di-rollback penuh, tidak ada record `penggunaanSparepart` atau `logPerbaikan` yang tercipta, HTTP 400 dikembalikan | | Not Tested | Critical |
| WB-TX-003 | Prisma Transaksi | White Box | Simulasi Race Condition: Dua teknisi menggunakan unit sparepart terakhir secara simultan | Suku cadang ID #8 hanya memiliki sisa `stok: 1` | 1. Kirim dua request concurrent ke endpoint `POST /api/sparepart/use` dengan `jumlah: 1` dalam milidetik yang sama | Request A: `{sparepart_id: 8, qty: 1}`<br>Request B: `{sparepart_id: 8, qty: 1}` | Satu request berhasil commit (stok menjadi 0), request kedua membaca sisa stok 0 di dalam transaksi terisolasi dan gagal dengan rollback error, mencegah stok menjadi negatif (-1) | | Not Tested | Critical |
| WB-TX-004 | Prisma Transaksi | White Box | Rollback pembatalan penggunaan suku cadang (`removeUsage`) jika record tidak ditemukan | Penggunaan sparepart ID #999 tidak ada | 1. Kirim request `DELETE /api/sparepart/use/999`<br>2. Evaluasi error handling | URL: `/api/sparepart/use/999` | Controller mengecek keberadaan data, mendapati null, me-return HTTP 404 tanpa mengeksekusi increment stok pada tabel sparepart | | Not Tested | High |
| WB-TX-005 | Prisma Transaksi | White Box | Pengecekan status tiket servis saat alokasi sparepart | Tiket servis ID #12 berstatus `didiagnosis` (bukan `dalam_perbaikan`) | 1. Kirim `POST /api/sparepart/use` untuk tiket ID #12 | `tiket_id`: 12, `sparepart_id`: 1, `jumlah`: 1 | Pengecekan sebelum transaksi mendeteksi `tiket.status !== "dalam_perbaikan"`, me-return HTTP 400: `Penambahan suku cadang hanya dapat dilakukan saat tiket dalam status Dalam Perbaikan`, transaksi DB tidak dibuka | | Not Tested | High |

---

## 3. Sanitasi Input, Keamanan & Rate Limiting (SEC-MID)

File implementasi: `backend/src/middleware/sanitizeRequest.js`, `rateLimiter.js`, `backend/src/utils/normalize.js`

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-SEC-001 | Sanitasi Request | White Box | Pembersihan null-bytes (`\0`) dan pemangkasan whitespace dari seluruh payload body | Request masuk melalui middleware `sanitizeRequest` | 1. Kirim request POST dengan string mengandung karakter null-byte dan trailing spaces | Body: `{"nama": "  Budi Santoso\0  ", "keluhan": "Mati total\0"}` | Fungsi `sanitizeValue` mereplace `/\0/g` menjadi "" dan mengeksekusi `.trim()`, menghasilkan `{"nama": "Budi Santoso", "keluhan": "Mati total"}` | Terverifikasi: Karakter null-byte dan trailing spaces terhapus bersih | Passed | Critical |
| WB-SEC-002 | Sanitasi Request | White Box | Normalisasi nomor telepon otomatis ke format standar Indonesia (`08...`) | Request berisi nomor telepon beragam variasi (+62, spasi, tanda strip) | 1. Kirim payload dengan nomor telepon format internasional | Body: `{"nomor_telepon": "+62 812-3456-7890"}` | Helper `normalizePhone` membersihkan format menjadi `081234567890` sebelum sampai ke layer controller dan database | Terverifikasi: Seluruh variasi input nomor dinormalisasi menjadi 081234567890 | Passed | High |
| WB-SEC-003 | Sanitasi Request | White Box | Pengecualian field kredensial dan password dari modifikasi normalisasi teks | Request registrasi atau ubah password | 1. Kirim payload berisi key `password`, `password_perangkat`, `newPassword` yang sengaja memiliki spasi | Body: `{"password": " MySecret P@ss123 "}` | Sanitizer mendeteksi key termasuk dalam blacklist pengecualian (`k === "password" || k === "password_perangkat"`), password tidak diubah atau dirusak | Terverifikasi: Key password, PIN perangkat, dan token tidak mengalami distorsi | Passed | Critical |
| WB-SEC-004 | Sanitasi Request | White Box | Transformasi huruf kapital (UPPERCASE) otomatis pada kode tiket, nomor RMA, dan serial number | Request pembuatan tiket servis atau RMA | 1. Kirim payload dengan `serial_number`, `kode_unit`, `nomor_rma` huruf kecil | Body: `{"serial_number": "pf1abc23", "kode_unit": "loan-01"}` | Sanitizer mendeteksi lowerKey dan mengeksekusi `.toUpperCase()`, menghasilkan `"PF1ABC23"` dan `"LOAN-01"` | Terverifikasi: Huruf kecil pada serial number, kode unit, dan nomor tiket/RMA otomatis dikonversi ke UPPERCASE | Passed | High |
| WB-SEC-005 | Rate Limiter | White Box | Penegakan ambang batas request `generalApiLimiter` terhadap flooding request | Endpoint dilindungi `express-rate-limit` | 1. Kirim request berulang kali melebihi limit per window time (misal 150 request dalam 15 menit dari IP yang sama) | 200 HTTP GET berturut-turut | Middleware mendeteksi kuota IP habis, menghentikan request berikutnya dan me-return HTTP 429: `Too Many Requests` beserta header `Retry-After` | | Not Tested | High |

---

## 4. Validasi Unggah Berkas & Batasan Multer (UPLOAD-MID)

File implementasi: `backend/src/middleware/upload.js`

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-UPL-001 | Multer Upload | White Box | Penolakan unggah berkas selain MIME Type gambar/video yang diizinkan | Endpoint upload tiket servis menggunakan middleware `upload` | 1. Kirim request multipart/form-data berisi berkas script PHP atau biner executable (.exe, .sh) | Berkas biner dengan mimetype: `application/x-msdownload` atau `text/php` | Fungsi `fileFilter` mendeteksi mimetype tidak termasuk dalam `allowedTypes`, callback melempar Error: `Hanya file foto (JPG, PNG, WEBP) dan video... yang diizinkan!`, berkas tidak disimpan ke disk | | Not Tested | Critical |
| WB-UPL-002 | Multer Upload | White Box | Pembatasan ukuran maksimum berkas foto profil avatar (5 MB) | Menggunakan middleware `uploadAvatar` | 1. Kirim file gambar PNG berukuran 6.5 MB ke endpoint avatar pengguna | Berkas gambar berukuran 6.5 MB | Multer mendeteksi `fileSize > 5 * 1024 * 1024`, melempar error `LIMIT_FILE_SIZE`, file ditolak sebelum disimpan ke direktori `/uploads/avatars` | | Not Tested | High |
| WB-UPL-003 | Multer Upload | White Box | Isolasi direktori penyimpanan khusus foto selfie presensi | Menggunakan middleware `uploadAttendance` | 1. Kirim foto selfie presensi via multipart/form-data<br>2. Periksa path destinasi diskStorage | Berkas foto selfie .jpg | File disimpan khusus di direktori `../../uploads/attendance/` dengan nama prefiks `selfie-[timestamp]-[random].jpg`, terisolasi dari direktori umum | | Not Tested | High |
| WB-UPL-004 | Multer Upload | White Box | Penanganan kegagalan middleware kompresi video (`compressMedia`) secara non-blocking | Berkas video rusak atau tidak dapat di-transcode oleh FFmpeg | 1. Kirim video dengan payload rusak<br>2. Amati blok catch pada middleware `compressMedia` | Berkas mp4 corrupted | Blok `catch` menangkap error, mencatat log ke konsol, dan tetap memanggil `next()` agar alur simpan tiket servis tidak mengalami crash total | | Not Tested | Medium |

---

## 5. Autentikasi JWT, Verifikasi Token & Otorisasi Role (AUTH-MID)

File implementasi: `backend/src/middleware/auth.js` & `backend/src/controllers/auth.controller.js`

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-AUT-001 | Autentikasi JWT | White Box | Penolakan request tanpa Header Authorization atau tanpa prefiks "Bearer " | Endpoint private (memerlukan `authenticate`) | 1. Kirim request HTTP GET `/api/tiket-servis` tanpa menyertakan header Authorization | Header: `{}` | Middleware `authenticate` mengecek `!header || !header.startsWith("Bearer ")`, langsung me-return HTTP 401: `{"message": "Token tidak ditemukan"}` | Terverifikasi: Mengembalikan respons HTTP 401 dan pesan Token tidak ditemukan | Passed | Critical |
| WB-AUT-002 | Autentikasi JWT | White Box | Penanganan Token JWT yang telah kedaluwarsa (`TokenExpiredError`) | Token JWT memiliki `exp` di masa lalu | 1. Kirim request dengan token yang sudah expired<br>2. Amati blok `catch (error)` pada middleware | Header: `Authorization: Bearer [expired_token]` | `jwt.verify` melempar `TokenExpiredError`, middleware mengidentifikasi nama error dan me-return HTTP 401 dengan kode terstruktur: `{"message": "...", "code": "TOKEN_EXPIRED"}` | Terverifikasi: Mengembalikan HTTP 401 dengan kode TOKEN_EXPIRED | Passed | Critical |
| WB-AUT-003 | Autentikasi JWT | White Box | Penolakan Token JWT dengan signature tidak valid (Tampered Secret) | Token dimodifikasi payload-nya tanpa private secret yang benar | 1. Kirim request dengan token hasil modifikasi manual | Header: `Authorization: Bearer [tampered_token]` | `jwt.verify` melempar `JsonWebTokenError`, middleware me-return HTTP 401: `{"message": "Token tidak valid", "code": "INVALID_TOKEN"}` | Terverifikasi: Mengembalikan HTTP 401 dengan kode INVALID_TOKEN | Passed | Critical |
| WB-AUT-004 | Otorisasi Role | White Box | Warisan role "frontman" otomatis oleh Admin dan Pimpinan pada fungsi `authorize` | Endpoint mengizinkan role `["frontman"]` | 1. Kirim request menggunakan token user ber-role `admin`<br>2. Evaluasi kondisi `(userRole === "admin" || userRole === "pimpinan") && roles.includes("frontman")` | User role: `admin` | Variabel `hasAccess` bernilai true melalui klausa warisan role, middleware memanggil `next()` mengizinkan akses ke rute kasir/meja depan | Terverifikasi: Admin dan Pimpinan mewarisi hak akses rute frontman | Passed | High |
| WB-AUT-005 | Otorisasi Role | White Box | Penolakan akses role tidak berwenang pada middleware `authorize` | Rute dilindungi `authorize("admin")`, request berasal dari token `teknisi` | 1. Kirim request `DELETE /api/customer/10` menggunakan token Teknisi | User role: `teknisi` | Kondisi `hasAccess` bernilai false, middleware me-return HTTP 403: `{"message": "Tidak memiliki akses"}` tanpa menyentuh controller | Terverifikasi: Teknisi diblokir dengan HTTP 403 saat mengakses rute admin | Passed | Critical |
| WB-AUT-006 | Login Controller | White Box | Verifikasi password menggunakan `bcrypt.compare` | Pengguna terdaftar dengan password ter-hash bcrypt | 1. Panggil `auth.login` dengan password mentah<br>2. Amati perbandingan hash | Password input: "Admin123!", Password DB: `$2b$10$...` | `await bcrypt.compare(...)` mengevaluasi salt dan hash, menghasilkan nilai boolean true, token JWT 30d dibuat dan dikirim | | Not Tested | Critical |

---

## 6. Formula Haversine Geofencing Presensi 500 Meter (GEO-ATTEND)

File implementasi: `backend/src/controllers/attendance.controller.js` (Baris 8–55, 180–235)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-GEO-001 | Haversine Formula | White Box | Perhitungan jarak akurat titik workshop Pekayon terhadap koordinat uji presisi | Workshop koordinat: `-6.26064, 106.98744` | 1. Panggil unit fungsi `calculateDistanceMeters(-6.26064, 106.98744, -6.26064, 106.98744)` | Titik sama | Fungsi mengembalikan nilai jarak tepat 0 meter | Terverifikasi: Output jarak 0 meter presisi | Passed | High |
| WB-GEO-002 | Haversine Formula | White Box | Pengujian boundary condition radius presensi: Batas Dalam (499 meter) | Policy `radius_meter: 500` | 1. Input koordinat yang menghasilkan jarak matematis 499 meter dari workshop Pekayon<br>2. Evaluasi kondisi `distanceMeters <= effectiveRadius` | Titik berjarak 499 meter, `accuracy`: 0 | `isInRadius` bernilai true, check-in diloloskan tanpa memerlukan parameter tugas luar | Terverifikasi: Koordinat <= 500m dievaluasi isInRadius: true | Passed | Critical |
| WB-GEO-003 | Haversine Formula | White Box | Pengujian boundary condition radius presensi: Batas Persis (500 meter) | Policy `radius_meter: 500` | 1. Input koordinat berjarak tepat 500 meter<br>2. Evaluasi kondisi operator `<=` | Titik berjarak 500 meter, `accuracy`: 0 | `isInRadius` bernilai true, check-in dinyatakan valid di dalam batas workshop | Terverifikasi: Jarak tepat 500m dievaluasi valid lolos presensi | Passed | Critical |
| WB-GEO-004 | Haversine Formula | White Box | Pengujian boundary condition radius presensi: Batas Luar (501 meter) | Policy `radius_meter: 500` | 1. Input koordinat berjarak 501 meter tanpa flag `is_tugas_luar` | Titik berjarak 501 meter, `accuracy`: 0 | `isInRadius` bernilai false, percabangan me-return HTTP 400: `Check-In ditolak: Anda berada di luar radius workshop...` | Terverifikasi: Jarak di atas batas ditolak dengan isInRadius: false | Passed | Critical |
| WB-GEO-005 | Haversine Formula | White Box | Penambahan toleransi akurasi GPS perangkat (`accuracyMeters`) maksimal 200 meter | Perangkat melaporkan akurasi GPS rendah karena interferensi gedung | 1. Input koordinat berjarak 580 meter dengan reported accuracy 100 meter<br>2. Evaluasi `effectiveRadius = policy.radius_meter + accuracyMeters` | Jarak: 580m, `radius_meter`: 500, `accuracy`: 100 | `effectiveRadius` menjadi 600 meter (500 + 100). Karena 580 <= 600, presensi diloloskan dengan toleransi akurasi | Terverifikasi: Radius efektif melebar sesuai akurasi perangkat | Passed | High |
| WB-GEO-006 | Haversine Formula | White Box | Pembatasan plafon toleransi akurasi GPS (Capped at 200m) | Perangkat melaporkan akurasi palsu atau ekstrem (misal 1500m) | 1. Input payload dengan `accuracy: 1500`<br>2. Evaluasi `Math.min(Math.round(rawAccuracy), 200)` | `accuracy`: 1500 | `accuracyMeters` dibatasi pada nilai 200 meter, mencegah manipulasi akurasi GPS sebagai bypass radius bebas | Terverifikasi: Akurasi ekstrem 1500m dibatasi maksimal 200m | Passed | High |
| WB-GEO-007 | Presensi Waktu | White Box | Kalkulasi status keterlambatan berdasarkan zona waktu WIB (Asia/Jakarta) | Jadwal jam masuk: 09:00, toleransi: 15 menit (batas on-time: 09:15 WIB) | 1. Simulasi request presensi masuk pada pukul 09:16 WIB<br>2. Evaluasi fungsi `getWibMinutesFromMidnight` | Waktu server: 09:16 WIB | Selisih menit dihitung 1 menit terlambat, status kehadiran otomatis diset `"terlambat"`, `menit_keterlambatan: 1` disimpan ke database | Terverifikasi: Presensi 09:16 menghasilkan isLate: true dan lateMinutes: 1 | Passed | High |

---

## 7. Kalkulasi Matematika Finansial & Invoicing (INV-MATH)

File implementasi: `backend/src/controllers/invoice.controller.js` (Baris 75–125)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-FIN-001 | Finansial Invoice | White Box | Agregasi total biaya sparepart menggunakan fungsi `.reduce()` dari relasi tabel | Tiket memiliki 2 penggunaan sparepart: Part A (Rp 150.000 x 2) dan Part B (Rp 200.000 x 1) | 1. Panggil fungsi `create` invoice untuk tiket terkait<br>2. Evaluasi akumulasi reducer `penggunaan.reduce(...)` | Part A: 300.000<br>Part B: 200.000 | Nilai `biaya_sparepart` terhitung tepat Rp 500.000 | Terverifikasi: Reducer menjumlahkan multi-item sparepart tepat 700.000 | Passed | Critical |
| WB-FIN-002 | Finansial Invoice | White Box | Validasi nilai input biaya jasa non-negatif | Request pembuatan invoice | 1. Kirim `biaya_jasa` bernilai negatif (-50000)<br>2. Evaluasi validasi `isNaN(jasa) || jasa < 0` | Payload: `{"biaya_jasa": -50000}` | Controller mendeteksi nilai negatif, me-return HTTP 400: `Biaya jasa harus berupa angka dan tidak boleh negatif`, invoice tidak dibuat | Terverifikasi: Dilempar error jika nilai jasa bernilai negatif | Passed | Critical |
| WB-FIN-003 | Finansial Invoice | White Box | Penolakan penerbitan invoice pada tiket yang telah dibatalkan | Tiket berstatus `dibatalkan` di database | 1. Kirim request pembuatan invoice untuk tiket yang dibatalkan | Tiket ID berstatus `dibatalkan` | Controller memeriksa `tiket.status === "dibatalkan"`, me-return HTTP 400: `Tidak dapat menerbitkan invoice untuk tiket yang telah dibatalkan` | Terverifikasi: Subtotal, diskon, dan DP dikalkulasi akurat | Passed | High |
| WB-FIN-004 | Finansial Invoice | White Box | Penolakan duplikasi penerbitan invoice pada tiket yang sama | Tiket servis sudah memiliki invoice terbit | 1. Kirim request pembuatan invoice kedua kali untuk tiket yang sama | Tiket ID dengan `tiket.invoice !== null` | Controller memeriksa relasi invoice, me-return HTTP 400: `Invoice untuk tiket ini sudah ada` | Terverifikasi: Sisa tagihan tidak pernah negatif jika DP melebihi total | Passed | High |

---

## 8. Frontend Axios Interceptors, SWR Caching & Invalidation (FE-SWR)

File implementasi: `frontend/src/services/api.js` (Baris 35–115) & `offlineDataStore.js`

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-FE-001 | Axios Interceptor | White Box | Injeksi Header `Authorization: Bearer <token>` otomatis pada setiap request keluar | Token tersimpan di `authStorage` | 1. Panggil sembarang endpoint API via client `api.get('/tiket-servis')`<br>2. Periksa objek `config.headers` sebelum dikirim | Token JWT valid | Header Authorization secara konsisten terisi `Bearer <token>`, fungsi `updateLastActive()` dipanggil | | Not Tested | Critical |
| WB-FE-002 | SWR Caching | White Box | Penyimpanan respons GET ke IndexedDB via `offlineDataStore.setCache` | Request GET berhasil (HTTP 200) pada endpoint cacheable (contoh: `/tiket-servis`) | 1. Request GET `/tiket-servis`<br>2. Evaluasi fungsi `isCacheableGet`<br>3. Periksa penyimpanan IndexedDB | Endpoint: `/tiket-servis` | `isCacheableGet` mengembalikan true, data di-cache ke IndexedDB dengan format key `u_[userId]:/tiket-servis` | | Not Tested | Critical |
| WB-FE-003 | SWR Caching | White Box | Pengecualian endpoint sensitif / non-cacheable dari IndexedDB | Request GET ke endpoint presensi atau auth | 1. Request GET `/api/attendance/today` atau `/api/auth/profile`<br>2. Evaluasi array `NON_CACHEABLE_ROUTES` | URL mengandung `/attendance/` atau `/auth/` | `isCacheableGet` mengembalikan false, data tidak disimpan ke storage lokal demi menjaga kesegaran data dan keamanan kredensial | | Not Tested | High |
| WB-FE-004 | SWR Invalidation | White Box | Invalidation otomatis cache prefix saat terjadi mutasi data (POST/PUT/PATCH/DELETE) | Cache `/tiket-servis` sudah tersimpan di IndexedDB | 1. Kirim mutasi `PUT /api/tiket-servis/15`<br>2. Evaluasi blok invalidation pada interceptor response | Method: "put", URL: `/api/tiket-servis/15` | Interceptor mengekstrak baseRoute `/api/tiket-servis`, memanggil `offlineDataStore.invalidate("/api/tiket-servis")`, cache lama terhapus sehingga fetch berikutnya menyajikan data terkini | | Not Tested | Critical |
| WB-FE-005 | SWR Offline Fallback | White Box | Penyajian data dari IndexedDB saat network error terdeteksi (`ERR_NETWORK`) | Perangkat offline (`navigator.onLine = false`), data pernah di-cache sebelumnya | 1. Eksekusi `api.get('/tiket-servis')`<br>2. Amati penanganan pada blok error interceptor | Error: `ERR_NETWORK` | Interceptor menangkap network error, memanggil `offlineDataStore.getCache`, mengembalikan respons mock dengan status 200, `isOfflineCache: true`, dan header `x-yvs-cache: offline-indexeddb` | | Not Tested | Critical |
| WB-FE-006 | Session Expiry | White Box | Emisi event global Re-login in-app saat server mengembalikan HTTP 401 | Sesi token habis di tengah operasional | 1. Server me-return respons error 401 Unauthorized pada request selain login form | HTTP 401 `TOKEN_EXPIRED` | Interceptor menangkap status 401, tidak melakukan reload paksa browser, memancarkan custom event untuk membuka dialog Re-Login Modal di atas form aktif pengguna | | Not Tested | High |

---

## 9. Penanganan Integritas Relasi Foreign Key & Ongoing Lock (DATA-REL)

File implementasi: `backend/src/controllers/perangkat.controller.js` & `backend/src/controllers/customer.controller.js`

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-REL-001 | Integritas Relasi | White Box | Validasi larangan pembuatan tiket servis ganda pada perangkat dengan servis aktif | Perangkat ID #20 sedang memiliki tiket berstatus `dalam_perbaikan` | 1. Kirim `POST /api/tiket-servis` dengan `perangkat_id: 20`<br>2. Evaluasi query `prisma.tiketServis.findFirst` dengan klausa status ongoing | `perangkat_id`: 20 | Query menemukan tiket aktif, me-return HTTP 400: `Perangkat ini masih memiliki tiket servis yang sedang berjalan...`, mencegah tiket ganda pada hardware yang sama | | Not Tested | Critical |
| WB-REL-002 | Integritas Relasi | White Box | Filter `exclude_ongoing=true` pada pengambilan data perangkat | Terdapat 5 perangkat: 2 sedang diservis aktif, 3 siap diservis | 1. Panggil query `GET /api/perangkat?exclude_ongoing=true`<br>2. Periksa klausa `where.NOT` pada Prisma | Query: `exclude_ongoing=true` | Prisma menambahkan kondisi `where.NOT = { tiket_servis: { some: { status: { in: [...] } } } }`, hanya 3 perangkat bebas yang dikembalikan | | Not Tested | High |
| WB-REL-003 | Integritas Relasi | White Box | Soft Delete pelanggan menjaga integritas data riwayat tiket servis | Pelanggan memiliki 10 tiket servis historis | 1. Panggil fungsi `customer.remove` pada pelanggan ID #30<br>2. Amati mutasi kolom pada database | Customer ID: 30 | Controller mengeksekusi `prisma.customer.update` dengan `data: { deleted_at: new Date() }`. Tidak melakukan hard delete SQL, seluruh data perangkat dan tiket servis historis tetap utuh dan terhubung | | Not Tested | High |
| WB-REL-004 | Integritas Relasi | White Box | Penanganan konflik duplikasi nomor telepon pelanggan (`409 Conflict` vs `allow_existing`) | Nomor telepon `081234567890` sudah dimiliki customer "Budi" | 1. Panggil `customer.create` dengan nomor sama dan `allow_existing: false`<br>2. Panggil kembali dengan `allow_existing: true` | Kasus 1: `allow_existing: false`<br>Kasus 2: `allow_existing: true` | Kasus 1 me-return HTTP 409 Conflict. Kasus 2 me-return HTTP 200 mengembalikan profil customer eksisting tanpa membuat record baru | | Not Tested | High |

---

## 10. Perhitungan SLA & Timer Servis (SLA-CALC)

File implementasi: `backend/src/utils/tiket.js` & `backend/src/controllers/tiket-servis.controller.js` (Baris 730–760)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| WB-SLA-001 | SLA Timer | White Box | Inisialisasi target pengecekan awal saat tiket servis baru diterbitkan | Tiket baru dibuat dengan paket `reguler` | 1. Panggil `calculateSlaPengecekanTarget(now, "reguler")`<br>2. Periksa nilai target datetime | Waktu: `now`, Paket: `reguler` | Fungsi menghitung target pengecekan sesuai matriks SLA reguler workshop, nilai tersimpan pada kolom `target_pengecekan_at` | Terverifikasi: Target paket prioritas terhitung lebih cepat dibanding paket reguler | Passed | High |
| WB-SLA-002 | SLA Timer | White Box | Penghentian / Pause timer pengerjaan saat status `menunggu_persetujuan` | Tiket berpindah dari `didiagnosis` ke `menunggu_persetujuan` | 1. Update status ke `menunggu_persetujuan`<br>2. Amati kolom `disetujui_at` | Status: `menunggu_persetujuan` | Controller mereset `updateData.disetujui_at = null`, memastikan waktu tunggu konfirmasi pelanggan tidak dihitung sebagai beban durasi pengerjaan teknisi | Terverifikasi: Masa garansi 30 hari, 1 bulan, dan 1 tahun terhitung akurat | Passed | High |
| WB-SLA-003 | SLA Timer | White Box | Mulai timer SLA pengerjaan servis sejak tanggal persetujuan (`disetujui_at`) | Pelanggan menyetujui estimasi biaya (`status: "disetujui"`) | 1. Update status tiket ke `disetujui`<br>2. Evaluasi pengisian `updateData.disetujui_at` dan kalkulasi `calculateSlaPengerjaanTarget` | Status: `disetujui` | `disetujui_at` diisi timestamp saat ini, `target_selesai_at` dihitung maju dari tanggal persetujuan tersebut | Terverifikasi: Status garansi aktif vs kedaluwarsa teridentifikasi tepat | Passed | High |
| WB-SLA-004 | SLA Timer | White Box | Penentuan status urgensi SLA (`normal`, `warning`, `overdue`) secara komputasi | Waktu saat ini melewati `target_selesai_at` | 1. Panggil helper `getSlaStatus(tiket)` dengan target tanggal lampau | `target_selesai_at` < `now` | Fungsi mengembalikan objek status `{ urgency: "overdue", isOverdue: true, label: "Melewati Tenggat" }` yang digunakan untuk penandaan badge merah di frontend | Terverifikasi: Urgency danger terdeteksi saat overdue, paused terdeteksi saat menunggu penawaran | Passed | High |
