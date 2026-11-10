# Laporan Rekapitulasi Hasil Eksekusi Uji Coba (Test Execution Recap Report)

> **Sistem:** Yangversa Computer (YVS) Management & ERP System  
> **Tanggal Eksekusi:** 10 November 2026, 10:29:38 WIB  
> **Lingkungan Pengujian:** Linux (Fedora) • Node.js `v22.20.0` Native Test Runner (`node --test`)  
> **Dokumen Terkait:**  
> - [Skenario White Box Test Cases](file:///run/media/bleu/DATA/dev/yvs/docs/testing/white-box-test-cases.md)  
> - [Skenario Black Box Test Cases](file:///run/media/bleu/DATA/dev/yvs/docs/testing/black-box-test-cases.md)  
> - [Test Summary & Strategi](file:///run/media/bleu/DATA/dev/yvs/docs/testing/test-summary.md)

---

## 1. Rangkuman Metrik Eksekusi (High-Level Metrics)

| Parameter | Nilai | Catatan |
|---|:---:|---|
| **Total Test Suites** | **6** | `haversine`, `state_machine`, `sanitization`, `sla_calc`, `auth_rbac`, `financial_math` |
| **Total Tests Dijalankan** | **31** | Berfokus pada logika inti, batas formula, otorisasi, & state machine |
| **Passed (Lulus)** | **31** | **Tingkat Kelulusan: 100.0%** |
| **Failed (Gagal)** | **0** | Tidak ada kegagalan logika pada kode yang diuji |
| **Skipped / Todo** | **0** | Seluruh skenario dieksekusi penuh |
| **Total Waktu Eksekusi** | **~764.86 ms** | Eksekusi instan tanpa overhead dependensi eksternal |
| **Perubahan Kode Sumber** | **0 File** | *Clean execution* sesuai instruksi tanpa modifikasi kode aplikasi |

---

## 2. Tabel Rekapitulasi Rinci Hasil Uji (Detailed Test Results Recap)

Berikut adalah rekapitulasi lengkap dari seluruh **31 pengujian** yang dieksekusi:

| Test ID | Test Suite | Kasus / Skenario Uji | Durasi | Status | Hasil Verifikasi Lapangan |
|:---|:---|:---|:---:|:---:|:---|
| **WB-STA-001** | `state_machine.test.js` | Penolakan transisi status ilegal yang melompati tahapan (`diterima` $\to$ `selesai`) | 7.75 ms | **PASSED** | Mengembalikan status HTTP `400` dengan pesan: `Transisi status tidak valid: diterima → selesai`. |
| **WB-STA-002** | `state_machine.test.js` | Penolakan mutasi status dari terminal state `diambil` | 1.12 ms | **PASSED** | Array transisi kosong `[]` menolak seluruh target status lanjutan dengan HTTP `400`. |
| **WB-STA-003** | `state_machine.test.js` | Penolakan mutasi status dari terminal state `dibatalkan` | 0.71 ms | **PASSED** | Array transisi kosong `[]` menolak mutasi status lanjutan dengan HTTP `400`. |
| **WB-STA-004** | `state_machine.test.js` | Penegakan RBAC Teknisi: Larangan transisi `menunggu_persetujuan` $\to$ `disetujui` | 0.65 ms | **PASSED** | Teknisi diblokir dengan HTTP `403 Forbidden` (`Akses ditolak: Teknisi tidak diizinkan... Tahap ini dikelola oleh Admin`), sedangkan Admin diloloskan dengan HTTP `200`. |
| **WB-STA-005** | `state_machine.test.js` | Proteksi wajib minimal 1 Log Perbaikan fase "Perbaikan" saat transisi ke `selesai` | 0.84 ms | **PASSED** | Ditolak HTTP `400` jika log fase "Perbaikan" nihil, diloloskan jika teknisi telah mencatat tindakan teknis. |
| **WB-STA-006** | `state_machine.test.js` | Proteksi kelulusan QC (`passed_qc: true`) saat penyerahan unit (`diambil`) | 0.89 ms | **PASSED** | Mengembalikan HTTP `400` jika `passed_qc` bernilai false, menjaga kualitas unit yang diserahkan. |
| **WB-STA-007** | `state_machine.test.js` | Proteksi penyerahan unit utama jika masih ada unit pinjaman (`loanerRecord`) aktif | 1.10 ms | **PASSED** | Status `diambil` diblokir HTTP `400` (`Proteksi Unit Pinjaman: Pelanggan masih meminjam unit cadangan...`). |
| **WB-GEO-001** | `haversine.test.js` | Perhitungan jarak titik koordinat yang sama persis terhadap workshop Pekayon | 9.97 ms | **PASSED** | Output formula Haversine tepat `0 meter`. |
| **WB-GEO-002** | `haversine.test.js` | Uji batas dalam radius presensi (`499 meter` dari workshop Pekayon) | 1.37 ms | **PASSED** | Dievaluasi `isInRadius: true` (lolos presensi normal). |
| **WB-GEO-003** | `haversine.test.js` | Uji batas tepat radius presensi (`500 meter` dari workshop Pekayon) | 0.58 ms | **PASSED** | Dievaluasi `isInRadius: true` (memenuhi syarat boundary operator `<=`). |
| **WB-GEO-004** | `haversine.test.js` | Uji batas luar radius presensi (`501+ meter`) tanpa opsi Tugas Luar | 0.68 ms | **PASSED** | Dievaluasi `isInRadius: false`, memicu penolakan HTTP `400` (`Check-In ditolak: Anda berada di luar radius workshop...`). |
| **WB-GEO-005** | `haversine.test.js` | Penambahan buffer toleransi akurasi GPS perangkat (`reportedAccuracy: 75m`) | 0.55 ms | **PASSED** | Radius efektif melebar dari 500m menjadi 575m sesuai ketidakpastian perangkat fisik. |
| **WB-GEO-006** | `haversine.test.js` | Pembatasan plafon toleransi akurasi GPS (Capped at `200 meter`) | 0.52 ms | **PASSED** | Nilai akurasi ekstrem (misal 1500m) dibatasi tepat 200m (radius efektif maks 700m), mencegah spoofing lokasi. |
| **WB-GEO-007** | `haversine.test.js` | Kalkulasi status keterlambatan staf berbasis zona waktu WIB (`Asia/Jakarta`) | 1.49 ms | **PASSED** | Presensi pukul 09:16 WIB terdeteksi `isLate: true` dan `lateMinutes: 1` (batas on-time: 09:00 + 15 menit). |
| **WB-SEC-001** | `sanitization.test.js` | Pembersihan null-bytes (`\0`) dan pemangkasan spasi liar (*trimming*) | 4.91 ms | **PASSED** | String `  Budi Santoso\0  ` dibersihkan sempurna menjadi `Budi Santoso`. |
| **WB-SEC-002** | `sanitization.test.js` | Normalisasi nomor telepon variatif (`+62...`, spasi, tanda hubung) ke standar Indonesia | 1.26 ms | **PASSED** | Seluruh variasi input dikonversi menjadi format seragam `081234567890`. |
| **WB-SEC-003** | `sanitization.test.js` | Pengecualian field password, PIN perangkat, dan token dari normalisasi | 1.25 ms | **PASSED** | Field `password` dan `password_perangkat` tidak mengalami pemotongan karakter atau distorsi. |
| **WB-SEC-004** | `sanitization.test.js` | Transformasi kapital (UPPERCASE) otomatis pada nomor tiket, RMA, dan serial number | 2.29 ms | **PASSED** | Input `pf1abc23` menjadi `PF1ABC23`, `loan-01` menjadi `LOAN-01`, `srv-2026-001` menjadi `SRV-2026-001`. |
| **WB-SLA-001** | `sla_calc.test.js` | Kalkulasi target SLA pengecekan prioritas vs reguler | 12.18 ms | **PASSED** | Paket prioritas menghasilkan timestamp target pengecekan yang lebih cepat dibanding paket reguler. |
| **WB-SLA-002** | `sla_calc.test.js` | Kalkulasi durasi masa garansi (30 Hari, 1 Bulan, 1 Tahun) | 2.26 ms | **PASSED** | Tanggal berakhir garansi dihitung presisi sesuai kalender kalender kabisat dan pergantian tahun. |
| **WB-SLA-003** | `sla_calc.test.js` | Identifikasi status garansi aktif vs kedaluwarsa | 1.77 ms | **PASSED** | Tiket dalam masa tenggang menghasilkan `status: "aktif"` (`isExpired: false`), dan tiket lewat tenggang menghasilkan `status: "kedaluwarsa"` (`isExpired: true`). |
| **WB-SLA-004** | `sla_calc.test.js` | Deteksi status urgensi SLA pengerjaan dan fase jeda (*paused*) | 2.28 ms | **PASSED** | Tiket melewati tenggat menghasilkan `urgency: "danger"`, tiket menunggu persetujuan pelanggan menghasilkan `urgency: "paused"` (timer jeda bebas penalti). |
| **WB-AUT-001** | `auth_rbac.test.js` | Penolakan request tanpa Header Authorization | 4.19 ms | **PASSED** | Mengembalikan HTTP `401 Unauthorized` dengan pesan `Token tidak ditemukan`. |
| **WB-AUT-002** | `auth_rbac.test.js` | Penanganan token JWT yang telah kedaluwarsa (`TokenExpiredError`) | 11.94 ms | **PASSED** | Mengembalikan HTTP `401` dengan kode terstruktur `TOKEN_EXPIRED` untuk memicu modal Re-login in-app. |
| **WB-AUT-003** | `auth_rbac.test.js` | Penolakan token JWT dengan signature tidak sah (*tampered secret*) | 2.16 ms | **PASSED** | Mengembalikan HTTP `401` dengan kode terstruktur `INVALID_TOKEN`. |
| **WB-AUT-004** | `auth_rbac.test.js` | Pewarisan hak akses role kasir/meja depan (`frontman`) oleh Admin dan Pimpinan | 0.54 ms | **PASSED** | Role `admin` dan `pimpinan` otomatis mewarisi akses rute `frontman` tanpa perlu multi-role ganda. |
| **WB-AUT-005** | `auth_rbac.test.js` | Penolakan role tidak berwenang pada middleware `authorize` | 0.83 ms | **PASSED** | Teknisi diblokir dengan HTTP `403 Forbidden` saat mencoba mengakses rute khusus admin. |
| **WB-FIN-001** | `financial_math.test.js` | Agregasi total biaya suku cadang menggunakan fungsi array reducer | 4.42 ms | **PASSED** | Multi-item part (Rp 150rb x 2 + Rp 250rb x 1 + Rp 50rb x 3) terhitung tepat Rp 700.000. |
| **WB-FIN-002** | `financial_math.test.js` | Validasi nilai input biaya jasa non-negatif | 1.82 ms | **PASSED** | Sistem melempar exception: `Biaya jasa harus berupa angka dan tidak boleh negatif` jika nilai jasa < 0. |
| **WB-FIN-003** | `financial_math.test.js` | Kalkulasi total tagihan invoice dengan potongan diskon dan uang muka (DP) | 1.19 ms | **PASSED** | Total Rp 500.000 dengan diskon Rp 50.000 dan DP Rp 150.000 menghasilkan sisa tagihan tepat Rp 300.000. |
| **WB-FIN-004** | `financial_math.test.js` | Pencegahan nilai sisa tagihan negatif saat nilai DP melebihi total biaya | 0.56 ms | **PASSED** | Sisa tagihan dibatasi pada nilai minimal Rp 0 menggunakan `Math.max(0, ...)`. |

---

## 3. Catatan Teknis & Temuan Audit Kode (Engineering Insights)

Selama pengujian internal dijalankan terhadap modul kode yang ada:
1. **Konvensi Status Garansi:** Kolom status garansi kedaluwarsa pada `backend/src/utils/tiket.js` menggunakan string **`"kedaluwarsa"`** (bukan `"habis"`), dengan flag boolean `isExpired: true` dan label resmi `"Garansi Kedaluwarsa"`.
2. **Konvensi Urgensi SLA:** Nilai enum urgensi SLA pada `backend/src/utils/tiket.js` menggunakan nilai **`"danger"`** untuk tiket yang melewati tenggat waktu (bukan `"overdue"`, meskipun flag boolean `is_overdue: true` tetap disertakan), dan **`"paused"`** untuk tiket yang berada pada fase negosiasi biaya dengan pelanggan (`menunggu_persetujuan`).
3. **Penyelarasan Role Kasir:** Arsitektur otorisasi pada `backend/src/middleware/auth.js` mengimplementasikan pewarisan implisit di mana `admin` dan `pimpinan` otomatis mewarisi seluruh kemampuan operasional `frontman`.

---

## 4. Cara Menjalankan Ulang Pengujian (Reproduction Command)

Pengujian dapat dijalankan ulang sewaktu-waktu dari root repositori dengan perintah:

```bash
# Menjalankan seluruh test suite unit secara paralel
node --test backend/tests/unit/*.test.js

# Menjalankan test suite spesifik (misal: state machine saja)
node --test backend/tests/unit/state_machine.test.js
```
