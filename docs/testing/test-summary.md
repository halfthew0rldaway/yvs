# Rangkuman Eksekutif & Strategi Pengujian ERP Yangversa Computer (YVS)

> **Lokasi Repositori:** `/run/media/bleu/DATA/dev/yvs`  
> **Tanggal Rilis Dokumen:** 10 November 2026  
> **Dokumen Terkait:**  
> - [Skenario Pengujian Black Box](file:///run/media/bleu/DATA/dev/yvs/docs/testing/black-box-test-cases.md)  
> - [Skenario Pengujian White Box](file:///run/media/bleu/DATA/dev/yvs/docs/testing/white-box-test-cases.md)

---

## 1. Modul yang Dicakup (Modules Covered)

Pengujian White Box dan Black Box ini mencakup 16 domain fungsional dan teknis yang menyusun ekosistem Yangversa Computer ERP:

1. **Autentikasi & Manajemen Sesi (`AUTH`)**: Multi-identifier login (email, username, alias fallback seperti `owner`/`pimpinan`), remember-me persistence, token JWT 30 hari, penanganan masa kedaluwarsa sesi (in-app Re-Login modal).
2. **Otorisasi Berbasis Peran (`RBAC`)**: Pemisahan hak akses antara `admin`, `teknisi`, dan `pimpinan`. Pewarisan hak akses kasir (`frontman`), pembatasan antrean umum dan penyembunyian harga beli/HPP suku cadang bagi teknisi.
3. **Manajemen Pelanggan & CRM (`CUST`)**: Pendaftaran pelanggan, validasi nomor WhatsApp standar Indonesia (`08...`), pencegahan duplikasi nomor (409 Conflict vs Quick-Register `allow_existing`), sistem lencana visual (`badges`), tipe kepribadian, serta mekanisme soft-delete dan restore.
4. **Registrasi Perangkat Keras (`DEV`)**: Manajemen kategori hardware (Laptop, PC Desktop, Printer), normalisasi merek dan serial number, pencarian cepat serial number, dan proteksi perangkat aktif (*ongoing service protection*).
5. **Penerimaan Servis & Dokumen Tanda Terima (`INTAKE` / BPBS)**: Form intake lengkap, checklist kelengkapan fisik, peta cacat fisik visual (*Defect Map*), upload dokumentasi foto kondisi awal (maks 10 file), pemilihan paket SLA (`reguler` vs `prioritas`), dan pencetakan Bukti Penerimaan Barang Servis (BPBS) ke printer kasir/thermal 80mm dan PDF A4.
6. **Diagnosis & Penawaran Biaya (`DIAG`)**: Pengambilan tiket oleh teknisi, pencatatan temuan teknis, estimasi suku cadang & jasa, upload foto kerusakan komponen, pengajuan estimasi biaya (*status: menunggu_persetujuan*), jeda (*pause*) durasi SLA, serta persetujuan pelanggan (ACC) atau pembatalan servis beserta biaya cek batal.
7. **Pengerjaan & Inventaris Suku Cadang (`REPAIR`)**: Pencatatan log perbaikan berkala, alokasi suku cadang dari inventaris gudang langsung ke tiket servis, pemotongan stok otomatis via transaksi atomik, pencegahan alokasi saat stok tidak mencukupi, dan pengembalian stok saat pembatalan suku cadang.
8. **Pengendalian Mutu & Penyelesaian Unit (`QC`)**: Protokol verifikasi 10-point checklist QC pra-penyerahan (display, keyboard, audio, port USB, suhu, charging), upload foto unit selesai (maks 15 foto), proteksi wajib memiliki minimal satu Log Perbaikan sebelum dapat menyelesaikan unit, serta penguncian modifikasi teknis (*data locking*) pasca selesai.
9. **Penagihan, Pembayaran & Serah Terima (`INV-HO`)**: Penerbitan invoice otomatis (jasa + suku cadang), pemotongan uang muka (DP) dan diskon, pencetakan nota resmi via Bluetooth Thermal Printer Android (`AndroidPrinter`) atau web print / jsPDF, foto serah terima (*handover*), tanda tangan digital pelanggan di layar canvas, aktivasi tanggal garansi servis, serta proteksi penyerahan unit jika unit pinjaman belum dikembalikan.
10. **Klaim Garansi & Retur Servis (`WARR`)**: Pembuatan tiket klaim garansi yang tertaut ke tiket induk, validasi keaktifan masa garansi (`tgl_diambil + durasi_garansi`), dan biaya awal Rp 0 untuk perbaikan ulang dalam masa garansi.
11. **Kolam Unit Pinjaman Cadangan (`LOAN`)**: Peminjaman laptop pengganti sementara untuk pelanggan prioritas, status pelacakan unit pinjaman (`tersedia` vs `dipinjam`), dan blokir penyerahan unit utama jika unit pinjaman belum selesai dikembalikan.
12. **Retur Komponen Rusak ke Distributor (`RMA`)**: Pencatatan suku cadang cacat pabrik (DOA), nomor resi ekspedisi dan kurir pengiriman ke vendor, pelacakan proses RMA, serta resolusi ganti unit baru atau nota kredit / refund.
13. **Presensi Staf Geofenced 500 Meter Pekayon (`ATTEND`)**: Verifikasi lokasi akurat berbasis Formula Haversine terhadap koordinat workshop Pekayon (`-6.26064, 106.98744`), radius 500 meter dengan buffer toleransi akurasi GPS perangkat (maks 200m), verifikasi foto selfie kamera langsung, perhitungan keterlambatan (toleransi 15 menit dari jam 09:00 WIB), alur Check-In Tugas Luar (wajib keterangan), dan Check-Out pulang sore (18:00 WIB).
14. **Pencarian, Filter, Paginasi & Dashboard (`SEARCH-DASH`)**: Pencarian multi-parameter bebas lag, filter status antrean dan urgensi SLA, navigasi paginasi data, serta pembaruan metrik analitik dashboard secara realtime melalui Server-Sent Events (SSE).
15. **Perilaku Mode Offline & Sinkronisasi Jaringan (`OFFLINE`)**: Navigasi data tanpa internet memanfaatkan SWR IndexedDB (`offlineDataStore`), indikator visual badge kuning *Mode Offline*, auto-invalidation cache saat terjadi mutasi data (POST/PUT/PATCH/DELETE), dan deteksi transisi jaringan secara mulus.
16. **Responsivitas & Usabilitas Mobile Capacitor (`MOBILE`)**: Penyesuaian safe area insets terhadap status bar jam dan notch kamera punch-hole pada perangkat Android fisik, bottom navigation bar, floating action buttons, dan integrasi kamera native via Capacitor Camera Plugin.

---

## 2. Total Skenario Pengujian (Test Metrics)

| Kategori Pengujian | Total Skenario | Critical | High | Medium | Low |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Black Box Testing** | **60** | 22 | 31 | 7 | 0 |
| **White Box Testing** | **45** | 24 | 19 | 2 | 0 |
| **Total Keseluruhan** | **105** | **46** | **50** | **9** | **0** |

### Hasil Eksekusi Uji Otomasi Langsung (Automated Test Execution Results)
Pada tanggal **10 November 2026**, sebanyak **31 skenario White Box** telah berhasil dieksekusi secara otomatis menggunakan Node.js v22 Native Test Runner (`node --test backend/tests/unit/*.test.js`) **tanpa melakukan perubahan/modifikasi pada kode sumber aplikasi**.

- **Total Test Suites**: 6 Suites
- **Total Tests Executed**: 31 Tests
- **Passed**: 31 (100% Pass Rate)
- **Failed**: 0
- **Duration**: ~764 ms

#### Rincian Hasil Eksekusi per Suite:
1. `backend/tests/unit/state_machine.test.js` (7 Tests — **ALL PASSED**):
   - `WB-STA-001`: Penolakan transisi ilegal (`diterima` -> `selesai`) mengembalikan status 400.
   - `WB-STA-002`: State terminal `diambil` menolak seluruh perubahan status lanjutan.
   - `WB-STA-003`: State terminal `dibatalkan` menolak seluruh perubahan status lanjutan.
   - `WB-STA-004`: Larangan teknisi menyetujui estimasi harga (`menunggu_persetujuan` -> `disetujui`) mengembalikan status 403 Forbidden.
   - `WB-STA-005`: Larangan penyelesaian servis tanpa Log Perbaikan fase "Perbaikan" mengembalikan status 400.
   - `WB-STA-006`: Penyerahan unit (`diambil`) wajib lolos QC (`passed_qc: true`).
   - `WB-STA-007`: Pemblokiran penyerahan unit jika ada unit pinjaman (`loanerRecord`) yang masih berstatus `aktif`.
2. `backend/tests/unit/haversine.test.js` (7 Tests — **ALL PASSED**):
   - `WB-GEO-001`: Jarak koordinat yang sama bernilai tepat 0 meter.
   - `WB-GEO-002`: Jarak 499m (batas dalam) diizinkan presensi normal.
   - `WB-GEO-003`: Jarak 500m (batas tepat) diizinkan presensi normal.
   - `WB-GEO-004`: Jarak 501m+ (batas luar) ditolak presensi tanpa tugas luar.
   - `WB-GEO-005`: Buffer toleransi akurasi GPS melebarkan batas efektif hingga nilai akurasi perangkat.
   - `WB-GEO-006`: Buffer akurasi GPS dibatasi secara ketat maksimal 200m untuk mencegah spoofing lokasi.
   - `WB-GEO-007`: Deteksi keterlambatan terpicu pada 09:16 WIB (1 menit terlambat setelah toleransi 15 menit dari jam 09:00).
3. `backend/tests/unit/sanitization.test.js` (4 Tests — **ALL PASSED**):
   - `WB-SEC-001`: Pembersihan null-bytes (`\0`) dan pemangkasan whitespace berfungsi sempurna.
   - `WB-SEC-002`: Normalisasi nomor telepon variatif (+62, spasi, dash) menjadi format standar `08...`.
   - `WB-SEC-003`: Pengecualian field password, PIN perangkat, dan token dari perubahan whitespace.
   - `WB-SEC-004`: Transformasi kapital (UPPERCASE) pada nomor tiket, RMA, dan serial number.
4. `backend/tests/unit/sla_calc.test.js` (4 Tests — **ALL PASSED**):
   - `WB-SLA-001`: Kalkulasi target SLA pengecekan prioritas terhitung lebih cepat dari reguler.
   - `WB-SLA-002`: Perhitungan masa garansi 30 hari, 1 bulan, dan 1 tahun terhitung akurat.
   - `WB-SLA-003`: Verifikasi status garansi aktif (`status: "aktif"`, `isExpired: false`) vs kedaluwarsa (`status: "kedaluwarsa"`, `isExpired: true`).
   - `WB-SLA-004`: Deteksi status SLA mendeteksi `urgency: "danger"` saat melewati tenggat dan `urgency: "paused"` saat menunggu konfirmasi penawaran biaya.
5. `backend/tests/unit/auth_rbac.test.js` (5 Tests — **ALL PASSED**):
   - `WB-AUT-001`: Rejection request tanpa header Authorization (HTTP 401).
   - `WB-AUT-002`: Rejection token kedaluwarsa dengan kode `TOKEN_EXPIRED` (HTTP 401).
   - `WB-AUT-003`: Rejection token dengan signature tidak valid `INVALID_TOKEN` (HTTP 401).
   - `WB-AUT-004`: Pewarisan hak akses role `frontman` oleh `admin` dan `pimpinan`.
   - `WB-AUT-005`: Penolakan role tidak berwenang dengan HTTP 403 Forbidden.
6. `backend/tests/unit/financial_math.test.js` (4 Tests — **ALL PASSED**):
   - `WB-FIN-001`: Agregasi reducer biaya multi-item suku cadang terhitung tepat.
   - `WB-FIN-002`: Error dilempar jika biaya jasa bernilai negatif.
   - `WB-FIN-003`: Kalkulasi total invoice, diskon, dan pengurangan uang muka (DP).
   - `WB-FIN-004`: Pencegahan sisa tagihan bernilai negatif saat DP melebihi total biaya.

### Distribusi per Modul
- **Tiket Servis, Intake & State Machine**: 32 skenario (BB: 19, WB: 13)
- **Inventaris Suku Cadang & Transaksi Stok**: 14 skenario (BB: 7, WB: 7)
- **Presensi GPS Geofence & Kepegawaian**: 14 skenario (BB: 7, WB: 7)
- **Autentikasi, Sesi & RBAC**: 15 skenario (BB: 9, WB: 6)
- **Penagihan, Invoice & Finansial**: 10 skenario (BB: 6, WB: 4)
- **Manajemen Pelanggan (CRM) & Perangkat**: 11 skenario (BB: 7, WB: 4)
- **Unit Pinjaman (Loaner) & Supplier RMA**: 9 skenario (BB: 6, WB: 3)
- **Offline Sync, Interceptor & Mobile Native**: 10 skenario (BB: 6, WB: 4)

---

## 3. Skenario Uji Sangat Kritis (Critical Test Scenarios)

Skenario-skenario berikut memiliki dampak operasional atau finansial tertinggi dan wajib lolos 100% tanpa kompromi sebelum sistem digunakan melayani operasional harian:

1. **`BB-AUTH-001` & `WB-AUT-001` — Keamanan & Validasi Token JWT**: Menjamin autentikasi tidak dapat ditembus tanpa token sah, dan token kedaluwarsa/palsu langsung ditolak demi keamanan data workshop.
2. **`BB-RBAC-002` & `BB-RBAC-003` — Isolasi Akses Teknisi & Penyembunyian HPP**: Menjamin teknisi tidak dapat mengakses master data sensitif, melihat modal/HPP suku cadang, atau mengubah setting sistem.
3. **`BB-INT-001` & `WB-REL-001` — Integritas Intake & Proteksi Ongoing Unit**: Mencegah suatu laptop/PC fisik memiliki dua tiket servis yang berjalan aktif secara bersamaan, mencegah kekacauan data tracking.
4. **`WB-STA-001` s/d `WB-STA-004` — Penegakan State Machine Tiket**: Memastikan status tiket tidak dapat melompati alur wajib (misal dari *diterima* langsung loncat ke *selesai* atau *diambil*), serta melarang teknisi mengubah status persetujuan harga secara sepihak.
5. **`WB-TX-001` & `WB-TX-003` — Transaksi Atomik & Penanganan Concurrency Stok**: Memastikan pemotongan stok sparepart terbungkus dalam `prisma.$transaction`. Jika stok tersisa 1 dan dua teknisi mengklaim bersamaan, satu request harus gagal secara aman tanpa menyebabkan stok menjadi minus di database.
6. **`BB-QC-002` & `WB-STA-005` — Proteksi Verifikasi QC & Log Perbaikan**: Mencegah tiket dinyatakan selesai tanpa teknisi mendokumentasikan log perbaikan fisik dan tanpa lolos uji checklist 10 titik kontrol mutu.
7. **`BB-INV-006` & `WB-STA-007` — Proteksi Unit Pinjaman (Loaner)**: Sistem wajib memblokir penyerahan unit utama pelanggan jika unit pinjaman cadangan milik workshop belum dikembalikan.
8. **`BB-ATT-001` & `WB-GEO-002`/`WB-GEO-004` — Integritas Geofence Presensi 500 Meter**: Menjamin staf hanya dapat melakukan presensi hadir jika benar-benar berada dalam radius maksimal 500 meter dari workshop Pekayon (`-6.26064, 106.98744`).

---

## 4. Temuan Celah Implementasi & Catatan Edge Case (Identified Implementation Gaps)

Dari analisis mendalam terhadap kode sumber dan arsitektur database, ditemukan beberapa area potensial yang perlu diantisipasi:

1. **Optimistic vs Pessimistic Concurrency pada Suku Cadang**:
   - *Kondisi Saat Ini:* `sparepart.controller.js` telah menggunakan `prisma.$transaction` dan mengecek `stok < qty` di dalam transaksi. Ini bekerja baik pada volume normal.
   - *Celah/Edge Case:* Pada beban concurrency tinggi, jika database MySQL tidak menggunakan isolasi level `SERIALIZABLE` atau query `SELECT ... FOR UPDATE`, terdapat peluang tipis dua transaksi membaca nilai stok yang sama sebelum mutasi `decrement` dieksekusi.
   - *Rekomendasi:* Pertimbangkan penambahan klausa raw query locking jika volume transaksi suku cadang meningkat pesat.
2. **Offline Mutation Conflict Resolution**:
   - *Kondisi Saat Ini:* Frontend memiliki `offlineDataStore` berbasis IndexedDB yang sangat baik untuk pembacaan data GET saat offline (SWR pattern) dan auto-invalidation saat online.
   - *Celah/Edge Case:* Mutasi kritis (seperti check-in presensi atau perubahan status tiket ke diambil) memerlukan server validation langsung. Jika form mutasi dibuka saat offline, request akan gagal di level Axios interceptor.
   - *Rekomendasi:* Berikan dialog konfirmasi visual yang ramah kepada pengguna bahwa aksi mutasi memerlukan koneksi data seluler/WiFi.
3. **Format Serial Number Perangkat Rakitan**:
   - *Kondisi Saat Ini:* Kolom `serial_number` bersifat opsional (`optional({ checkFalsy: true })`) untuk mengakomodasi PC rakitan atau unit yang stiker SN-nya telah hilang/rusak.
   - *Celah/Edge Case:* Pencarian unit berdasarkan SN tidak akan menemukan unit rakitan tanpa SN.
   - *Rekomendasi:* Pertahankan fallback pencarian berdasarkan nama customer dan nomor telepon sebagaimana yang telah diakomodasi pada filter `customer.nama` dan `customer.nomor_telepon`.

---

## 5. Matriks Rekomendasi: Pengujian Manual Rekan Kerja vs Otomasi

Dengan tim operasional sekitar 7 rekan kerja yang menangani volume servis harian dinamis, pengujian dibagi menjadi dua kuadran strategis:

### A. Skenario yang Terbaik Dijalankan Secara Manual oleh Rekan Kerja (Coworker Manual Testing)

Skenario-skenario ini melibatkan perangkat keras fisik, penginderaan lapangan, sensor perangkat seluler, dan interaksi manusia nyata yang tidak dapat direplikasi sempurna oleh script pengujian otomatis:

| Modul | Skenario Pengujian | Alasan Pelaksanaan Manual |
|:---|:---|:---|
| **Presensi GPS** | `BB-ATT-001`, `BB-ATT-002`, `BB-ATT-003` | Memerlukan pergerakan fisik staf nyata di dalam workshop Pekayon (jarak < 500m) dan uji coba di luar area (jarak > 500m) dengan GPS HP Android fisik serta pengambilan selfie kamera langsung. |
| **Pencetakan Nota** | `BB-INT-002`, `BB-INV-003` | Melibatkan koneksi Bluetooth native ke printer thermal 80mm fisik di meja kasir (`AndroidPrinter` bridge) untuk memastikan feed kertas, layout font nota, barcode/QR-code, dan pemotong kertas berfungsi rapi. |
| **Kamera & Dokumentasi** | `BB-INT-006`, `BB-MOB-003`, `BB-INV-004` | Pengambilan foto fisik laptop, casing tergores, dan komponen motherboard menggunakan kamera HP Android fisik untuk memverifikasi kompresi dan ketajaman gambar. |
| **Tanda Tangan Digital** | `BB-INV-004` | Penggoresan tanda tangan langsung di atas layar sentuh smartphone/tablet pelanggan saat serah terima barang. |
| **UX Mobile & Notch** | `BB-MOB-001`, `BB-MOB-002` | Verifikasi visual langsung pada berbagai jenis smartphone Android staf untuk memastikan status bar jam, notch kamera, dan bottom navigation tidak saling tumpang-tindih. |
| **Mode Offline Lapangan** | `BB-OFF-001`, `BB-OFF-002` | Mematikan WiFi/Data seluler di HP fisik (Mode Pesawat) saat sedang membuka daftar servis, lalu menyalakan kembali untuk memeriksa kehalusan transisi offline-to-online. |

### B. Skenario yang Direkomendasikan untuk Diotomasi (Automated Testing)

Skenario-skenario ini memiliki aturan bisnis terstruktur, perhitungan matematis, validasi skema API, dan kondisi batas yang sangat cepat dieksekusi menggunakan test runner:

| Modul / Komponen | Tool yang Direkomendasikan | Skenario yang Dicakup |
|:---|:---|:---|
| **API Endpoints & Controllers** | **Jest + Supertest** | Seluruh skenario White Box API (`WB-AUT-001` s/d `WB-AUT-005`, `WB-SEC-001` s/d `WB-SEC-004`, `WB-FIN-001` s/d `WB-FIN-004`). Menguji return HTTP status, skema JSON, dan middleware secara instan tanpa perlu browser. |
| **State Machine & RBAC Logic** | **Jest Unit Tests** | `WB-STA-001` s/d `WB-STA-008`. Menguji setiap permutasi status tiket servis dan penolakan transisi ilegal untuk memastikan tidak ada celah logika. |
| **Formula Geofence Haversine** | **Jest Unit Tests** | `WB-GEO-001` s/d `WB-GEO-006`. Menguji perhitungan jarak koordinat pada batas 499m, 500m, 501m, serta batas buffer toleransi akurasi GPS 200m secara matematis presisi. |
| **Database Transaction & Stock** | **Integration Test DB** | `WB-TX-001` s/d `WB-TX-003`. Menjalankan pengujian paralel simulasi dua request pemotongan stok pada saat bersamaan untuk membuktikan keandalan rollback. |
| **E2E Web Intake & Invoicing** | **Playwright / Cypress** | Alur lengkap pengisian form intake servis dari pembuatan customer, pemilihan perangkat, pembuatan estimasi biaya, hingga pembentukan invoice. |

---

## 6. Daftar Periksa Uji Regresi Berkala (Regression Testing Checklist)

Setiap kali ada pembaruan kode, deploy versi baru di staging/production, atau pembaruan build APK Android, jalankan **Sanity & Regression Checklist** berikut sebelum sistem dipakai aktif:

- [ ] **1. Smoke Test Login & Token**:
  - [ ] Login sebagai Admin berhasil.
  - [ ] Login sebagai Teknisi berhasil, pastikan menu pengguna dan HPP sparepart tersembunyi.
- [ ] **2. Alur Utama Tiket Servis (Happy Path)**:
  - [ ] Buat 1 tiket servis baru dengan customer dan perangkat baru.
  - [ ] Cetak dokumen BPBS awal (verifikasi nomor tiket `YVS-YYMMDD-XXX` terbit rapi).
  - [ ] Teknisi klaim tiket (`diterima` -> `didiagnosis`).
  - [ ] Masukkan diagnosis dan estimasi biaya (`didiagnosis` -> `menunggu_persetujuan`).
  - [ ] Admin lakukan ACC (`menunggu_persetujuan` -> `disetujui`).
  - [ ] Teknisi mulai pengerjaan (`disetujui` -> `dalam_perbaikan`).
  - [ ] Tambahkan 1 log perbaikan dan alokasikan 1 sparepart (pastikan stok berkurang).
  - [ ] Centang seluruh checklist QC dan selesaikan tiket (`dalam_perbaikan` -> `selesai`).
  - [ ] Terbitkan invoice tagihan (pastikan subtotal jasa + part tepat).
  - [ ] Lakukan penyerahan unit (`selesai` -> `diambil`) dengan foto handover dan tanda tangan digital.
  - [ ] Verifikasi status tiket menjadi `diambil` dan durasi garansi aktif terhitung.
- [ ] **3. Uji Keamanan Batas (Negative Test)**:
  - [ ] Coba ubah tiket berstatus `diambil` menjadi `didiagnosis` (harus ditolak HTTP 400).
  - [ ] Coba selesaikan tiket tanpa ada Log Perbaikan (harus ditolak HTTP 400).
  - [ ] Coba buat tiket baru untuk perangkat yang sedang memiliki tiket aktif (harus ditolak HTTP 400).
- [ ] **4. Uji Presensi Workshop**:
  - [ ] Staf di workshop melakukan Check-in selfie (pastikan status valid dan jam masuk tercatat).
- [ ] **5. Uji Mobile APK & Layout**:
  - [ ] Buka aplikasi Android APK di perangkat fisik, pastikan navbar atas tidak menabrak status bar baterai/jam.
  - [ ] Tes cetak nota via tombol print dokumen.
