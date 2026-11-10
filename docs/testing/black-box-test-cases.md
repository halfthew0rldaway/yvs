# Skenario Pengujian Black Box — Yangversa Computer (YVS) ERP

Dokumen ini memuat seluruh skenario pengujian fungsional berbasis **Black Box Testing** untuk sistem ERP Yangversa Computer (Web ERP & Aplikasi Mobile Capacitor). Seluruh pengujian ditinjau dari perspektif pengguna akhir (Frontman, Teknisi, Admin, Pimpinan/Owner) tanpa mengacu langsung pada kode internal sistem.

---

## Ringkasan Atribut Tabel

| Kolom | Deskripsi |
|---|---|
| **Test ID** | Identifikator unik skenario pengujian (`BB-MODUL-XXX`) |
| **Module** | Modul fungsional ERP terkait |
| **Test Type** | Black Box |
| **Test Scenario** | Kasus uji yang diverifikasi |
| **Preconditions** | Kondisi prasyarat sebelum pengujian dijalankan |
| **Test Steps** | Langkah-langkah operasional pengujian |
| **Test Data** | Sampel data input pengujian |
| **Expected Result** | Respons/perilaku sistem yang diharapkan |
| **Actual Result** | Hasil pelaksanaan pengujian lapangan (*dikosongkan untuk eksekusi*) |
| **Status** | Status pengujian (*Not Tested*) |
| **Priority** | Tingkat urgensi: `Critical` / `High` / `Medium` / `Low` |

---

## 1. Modul Autentikasi & Manajemen Sesi (AUTH)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-AUTH-001 | Autentikasi | Black Box | Login sukses menggunakan kombinasi email dan password valid | User terdaftar dan berstatus aktif | 1. Buka halaman login<br>2. Masukkan email terdaftar<br>3. Masukkan password valid<br>4. Klik tombol "Masuk" | `identifier`: "admin@yangversa.com"<br>`password`: "Admin123!" | Sistem berhasil memvalidasi kredensial, menyimpan token JWT di storage, dan mengarahkan pengguna ke Dashboard sesuai role | | Not Tested | Critical |
| BB-AUTH-002 | Autentikasi | Black Box | Login sukses menggunakan username terdaftar | User memiliki username unik pada database | 1. Buka halaman login<br>2. Masukkan username pada kolom identitas<br>3. Masukkan password yang sesuai<br>4. Klik tombol "Masuk" | `identifier`: "teknisi1"<br>`password`: "Teknisi123!" | Sistem berhasil login, menampilkan nama teknisi pada navbar atas, dan mengarahkan ke dashboard antrean servis | | Not Tested | Critical |
| BB-AUTH-003 | Autentikasi | Black Box | Login sukses menggunakan alias fallback role (misal: "owner", "pimpinan", "bambang") | Fitur alias auto-mapping aktif pada sistem | 1. Masukkan alias username valid pada kolom identifier<br>2. Masukkan password akun utama terkait<br>3. Klik "Masuk" | `identifier`: "owner"<br>`password`: "OwnerSecure2026" | Sistem secara otomatis mengenali alias dan mengarahkan ke profil Pimpinan/Owner tanpa error | | Not Tested | High |
| BB-AUTH-004 | Autentikasi | Black Box | Login gagal dengan password salah | User terdaftar pada sistem | 1. Masukkan identifier valid<br>2. Masukkan password yang salah/keliru<br>3. Klik tombol "Masuk" | `identifier`: "admin@yangversa.com"<br>`password`: "SalahPassword" | Muncul pesan error "Identitas atau password salah", form password dikosongkan, sesi tidak terbentuk | | Not Tested | Critical |
| BB-AUTH-005 | Autentikasi | Black Box | Login gagal dengan identitas yang belum terdaftar | Identitas tidak ada di database | 1. Masukkan identifier acak yang tidak ada di sistem<br>2. Masukkan password acak<br>3. Klik "Masuk" | `identifier`: "bukanuser@yangversa.com"<br>`password`: "Password123" | Muncul notifikasi error "Identitas atau password salah", token tidak digenerate | | Not Tested | High |
| BB-AUTH-006 | Autentikasi | Black Box | Validasi form login pada saat kolom input kosong | Berada di form login | 1. Kosongkan kolom identifier dan password<br>2. Klik tombol "Masuk" | `identifier`: ""<br>`password`: "" | Muncul pesan validasi form bahwa identitas dan password wajib diisi, tombol masuk dicegah memproses request | | Not Tested | Medium |
| BB-AUTH-007 | Autentikasi | Black Box | Verifikasi opsi "Ingat Saya" (Remember Me) | Berada di form login | 1. Masukkan kredensial valid<br>2. Centang checkbox "Ingat Saya"<br>3. Klik tombol "Masuk"<br>4. Tutup tab/browser lalu buka kembali URL aplikasi | `identifier`: "admin@yangversa.com"<br>`rememberMe`: true | Sesi autentikasi tetap bertahan (token tersimpan pada localStorage permanen), user langsung masuk ke Dashboard tanpa login ulang | | Not Tested | High |
| BB-AUTH-008 | Autentikasi | Black Box | Logout akun pengguna secara aman | User dalam posisi login aktif | 1. Klik avatar/menu pengguna di sudut kanan atas<br>2. Klik menu "Keluar / Logout"<br>3. Konfirmasi modal logout | Dialog konfirmasi logout | Token JWT dihapus dari local/session storage, cache memori sesi dibersihkan, pengguna dialihkan ke `/login` | | Not Tested | High |
| BB-AUTH-009 | Autentikasi | Black Box | Penanganan sesi kedaluwarsa (Token Expired) dengan Re-Login Modal | Token JWT telah kedaluwarsa atau dimanipulasi | 1. Berada di halaman aplikasi setelah waktu token habis<br>2. Lakukan navigasi atau aksi interaktif | Aksi trigger API GET/POST | Muncul modal Re-login in-app tanpa me-reload paksa halaman, user dapat memasukkan password kembali untuk memperpanjang sesi | | Not Tested | High |

---

## 2. Hak Akses & Role-Based Access Control (RBAC)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-RBAC-001 | RBAC | Black Box | Akses penuh pengguna ber-role "Admin" | Akun login ber-role `admin` | 1. Navigasi ke menu Pengguna (Users)<br>2. Navigasi ke Pengaturan Sistem & Presensi<br>3. Navigasi ke Hapus Pelanggan & Hapus Tiket | Role: `admin` | Admin dapat mengakses seluruh menu, membuat user baru, mengedit master data, menghapus record, dan melihat HPP sparepart | | Not Tested | Critical |
| BB-RBAC-002 | RBAC | Black Box | Restriksi pengguna ber-role "Teknisi" terhadap menu Pengguna & Keuangan | Akun login ber-role `teknisi` | 1. Login sebagai teknisi<br>2. Coba akses menu Manajemen Pengguna melalui URL langsung `/users`<br>3. Coba akses menu Pengaturan Absensi `/attendance/settings` | Role: `teknisi` | Sistem memblokir akses, menampilkan pesan "Akses ditolak" atau me-redirect kembali ke dashboard antrean servis teknisi | | Not Tested | Critical |
| BB-RBAC-003 | RBAC | Black Box | Restriksi visibilitas HPP (Harga Beli) Suku Cadang bagi Teknisi | Akun login ber-role `teknisi` | 1. Buka modul Data Sparepart<br>2. Periksa kolom tabel dan detail modal sparepart | Role: `teknisi` | Kolom "Harga Beli / HPP" disembunyikan dari tabel dan detail. Teknisi hanya dapat melihat Stok dan Harga Jual | | Not Tested | High |
| BB-RBAC-004 | RBAC | Black Box | Pembatasan antrean tiket servis bagi Teknisi | Akun login ber-role `teknisi` | 1. Masuk ke halaman Tiket Servis tanpa mengisi filter pencarian | Role: `teknisi` | Teknisi hanya melihat tiket yang di-assign ke dirinya dan tiket baru berstatus 'diterima' yang belum diambil siapapun | | Not Tested | High |
| BB-RBAC-005 | RBAC | Black Box | Akses supervisi dan audit manajerial bagi "Pimpinan" | Akun login ber-role `pimpinan` | 1. Akses menu Laporan & Rekapitulasi Servis<br>2. Akses menu Audit Log Aktivitas<br>3. Akses persetujuan cuti & izin karyawan | Role: `pimpinan` | Pimpinan dapat melihat rekap performa, omzet, menyetujui izin/tugas luar, serta meninjau log aktivitas staf | | Not Tested | High |

---

## 3. Manajemen Pelanggan / CRM (CUST)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-CUST-001 | Pelanggan | Black Box | Pendaftaran pelanggan baru dengan nomor WhatsApp valid | User login sebagai Frontman/Admin | 1. Masuk menu Pelanggan > Tambah Pelanggan<br>2. Isi nama lengkap, nomor WhatsApp, alamat<br>3. Pilih tipe kepribadian dan catatan khusus<br>4. Klik "Simpan" | `nama`: "Budi Santoso"<br>`nomor_telepon`: "081234567890"<br>`alamat`: "Jl. Kemang Pratama No. 12"<br>`tipe_kepribadian`: "Analitis" | Data pelanggan tersimpan, nomor dinormalisasi otomatis, sistem menampilkan toast sukses dan profil pelanggan | | Not Tested | Critical |
| BB-CUST-002 | Pelanggan | Black Box | Proteksi duplikasi nomor WhatsApp pada registrasi manual | Nomor telepon sudah terdaftar pada pelanggan lain | 1. Buka form Tambah Pelanggan<br>2. Masukkan nama berbeda namun nomor telepon yang sudah ada di database<br>3. Klik "Simpan" | `nama`: "Budi Baru"<br>`nomor_telepon`: "081234567890" | Sistem menolak dengan pesan konflik 409: "Nomor WhatsApp sudah terdaftar atas nama Budi Santoso", mencegah duplikasi data | | Not Tested | Critical |
| BB-CUST-003 | Pelanggan | Black Box | Validasi format nomor telepon yang tidak sesuai standar Indonesia | Form pendaftaran pelanggan terbuka | 1. Masukkan nomor telepon acak atau terlalu pendek<br>2. Klik "Simpan" | `nomor_telepon`: "12345" atau "abcd890" | Form menampilkan error validasi: "Nomor telepon tidak valid (contoh: 081234567890)", request tidak dikirim | | Not Tested | High |
| BB-CUST-004 | Pelanggan | Black Box | Validasi panjang karakter nama pelanggan | Form pendaftaran pelanggan terbuka | 1. Masukkan nama hanya 2 huruf<br>2. Klik "Simpan" | `nama`: "Al" | Muncul pesan validasi error: "Nama harus 3-100 karakter" | | Not Tested | Medium |
| BB-CUST-005 | Pelanggan | Black Box | Pemberian dan pembaruan Lencana Khusus (Badges) Pelanggan | Pelanggan terdaftar | 1. Buka detail profil pelanggan<br>2. Klik kelola lencana<br>3. Pilih lencana (misal: "VIP Pelanggan Tetap", "Prioritas Khusus")<br>4. Simpan perubahan | `badges`: ["VIP", "Prioritas"] | Lencana berhasil disematkan dan tampil sebagai badge visual berwarna pada profil serta intake tiket servis berikutnya | | Not Tested | Medium |
| BB-CUST-006 | Pelanggan | Black Box | Pencarian data pelanggan berdasarkan Nama atau Nomor Telepon | Terdapat banyak data pelanggan | 1. Masuk tabel pelanggan<br>2. Ketik nama atau potongan nomor telepon di bar pencarian | `search`: "08123" atau "Santoso" | Tabel menampilkan baris data yang cocok secara instan dengan debounce yang responsif | | Not Tested | High |
| BB-CUST-007 | Pelanggan | Black Box | Penonaktifan (Soft Delete) dan Pemulihan (Restore) Pelanggan oleh Admin | Login sebagai Admin | 1. Klik menu opsi pada salah satu pelanggan > Hapus<br>2. Konfirmasi penghapusan<br>3. Filter tabel pelanggan terhapus<br>4. Klik "Pulihkan / Restore" | ID Pelanggan uji | Pelanggan disembunyikan dari pencarian aktif saat dihapus, dan kembali aktif normal saat di-restore tanpa kehilangan riwayat servis | | Not Tested | High |

---

## 4. Manajemen Perangkat Fisik (DEV)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-DEV-001 | Perangkat | Black Box | Registrasi perangkat Laptop dengan spesifikasi lengkap | Pelanggan telah terdaftar di sistem | 1. Masuk detail pelanggan > Tambah Perangkat<br>2. Pilih kategori "Laptop"<br>3. Isi Merek, Model, Serial Number<br>4. Klik "Simpan Perangkat" | `jenis_perangkat`: "Laptop"<br>`merek`: "Lenovo"<br>`model`: "ThinkPad T480"<br>`serial_number`: "PF1ABC23" | Perangkat tersimpan, merek dinormalisasi (Title Case), nomor seri disimpan dalam huruf kapital (UPPERCASE) | | Not Tested | Critical |
| BB-DEV-002 | Perangkat | Black Box | Registrasi perangkat PC Desktop / All-in-One | Pelanggan terdaftar | 1. Tambah Perangkat > Pilih kategori "PC Desktop"<br>2. Masukkan Merek "Custom Rig", Model "Tower Core i7 RTX 3060"<br>3. Simpan | `jenis_perangkat`: "PC Desktop"<br>`merek`: "Custom Rig"<br>`model`: "Tower Core i7" | Perangkat tersimpan sukses dan dapat dipilih saat intake tiket servis | | Not Tested | High |
| BB-DEV-003 | Perangkat | Black Box | Registrasi perangkat Printer | Pelanggan terdaftar | 1. Tambah Perangkat > Pilih kategori "Printer"<br>2. Masukkan Merek "Epson", Model "L3110", SN "Q2W3E4R5"<br>3. Simpan | `jenis_perangkat`: "Printer"<br>`merek`: "Epson"<br>`model`: "L3110" | Perangkat tersimpan sukses dengan kategori Printer | | Not Tested | High |
| BB-DEV-004 | Perangkat | Black Box | Filter perangkat yang sedang memiliki tiket servis aktif (Ongoing Protection) | Perangkat sedang dalam status servis aktif (`dalam_perbaikan`) | 1. Buka form intake tiket baru<br>2. Pilih pelanggan pemilik unit<br>3. Periksa daftar perangkat yang tersedia untuk dipilih | ID Perangkat yang sedang diservis | Perangkat yang sedang berjalan tidak muncul pada pilihan tiket baru, mencegah tiket ganda pada unit yang sama | | Not Tested | Critical |
| BB-DEV-005 | Perangkat | Black Box | Pencarian cepat unit berdasarkan Serial Number (SN) | Perangkat terdaftar dengan SN valid | 1. Masuk menu Perangkat<br>2. Ketik Serial Number pada search bar | `search`: "PF1ABC23" | Sistem langsung menyaring unit yang sesuai beserta nama pemilik dan riwayat servis terkait | | Not Tested | High |

---

## 5. Penerimaan Servis Baru & Intake Receipt / BPBS (INTAKE)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-INT-001 | Intake Servis | Black Box | Intake tiket servis standar dengan kelengkapan unit lengkap | Customer dan Perangkat telah siap | 1. Masuk Tiket Servis > Buat Tiket Baru<br>2. Pilih Customer & Perangkat<br>3. Isi keluhan kerusakan awal<br>4. Centang checklist kelengkapan (Adaptor, Tas, Kabel Power)<br>5. Masukkan PIN/Password unit<br>6. Unggah foto kondisi fisik awal<br>7. Klik "Terbitkan Tiket Servis" | `keluhan`: "Mati total setelah kena petir"<br>`kelengkapan_detail`: {"charger": true, "tas": true}<br>`tipe_kunci`: "PIN"<br>`password_perangkat`: "123456"<br>`sla_paket`: "reguler"<br>`foto_kondisi`: [foto1.jpg, foto2.jpg] | Tiket berhasil dibuat dengan nomor tiket berformat `YVS-YYMMDD-XXX`, status awal otomatis `diterima`, SLA target pengecekan dihitung otomatis | | Not Tested | Critical |
| BB-INT-002 | Intake Servis | Black Box | Cetak Bukti Penerimaan Barang Servis (BPBS) ke Thermal Printer / PDF | Tiket servis baru berhasil diterbitkan | 1. Klik tombol "Cetak BPBS"<br>2. Pilih mode cetak (Thermal 80mm atau Standar A4 PDF) | Nomor Tiket valid | Dokumen BPBS ter-render sempurna memuat QR-code tiket, data pelanggan, keluhan, kelengkapan, dan klausul persetujuan servis | | Not Tested | Critical |
| BB-INT-003 | Intake Servis | Black Box | Penandaan Cacat Fisik Awal pada Peta Unit (Defect Map) | Intake tiket servis terbuka | 1. Buka canvas Defect Map (tampak depan/belakang/samping)<br>2. Klik pada area layar/casing untuk menandai goresan/dent<br>3. Beri label cacat (misal: "Lecet pemakaian casing sudut kanan")<br>4. Simpan intake | Titik koordinat x,y dan label cacat fisik | Peta cacat fisik tersimpan dan tercetak pada lampiran BPBS untuk menghindari komplain fisik oleh pelanggan saat pengambilan | | Not Tested | High |
| BB-INT-004 | Intake Servis | Black Box | Quick-Register Customer saat Intake Tiket Servis | Pelanggan datang langsung ke meja depan belum terdaftar | 1. Pada dropdown pelanggan di intake form, ketik nama/nomor baru<br>2. Pilih opsi "Tambah Pelanggan Cepat"<br>3. Masukkan data nomor dan simpan form | `nama`: "Dewi Lestari"<br>`nomor_telepon`: "085712349988"<br>`allow_existing`: true | Pelanggan otomatis tersimpan, ter-select di form intake tanpa harus berpindah halaman | | Not Tested | High |
| BB-INT-005 | Intake Servis | Black Box | Pemilihan SLA Servis Paket Prioritas / Ekspres | Intake tiket baru | 1. Pada pilihan Paket SLA, pilih "Prioritas / Urgent"<br>2. Periksa kalkulasi target waktu pengecekan | `sla_paket`: "prioritas" | Target pengecekan otomatis diset 1x24 jam lebih cepat dibanding paket reguler, badge "Prioritas" tampil mencolok pada antrean | | Not Tested | High |
| BB-INT-006 | Intake Servis | Black Box | Validasi upload file gambar kondisi awal (Maksimal 10 Foto) | Intake tiket baru | 1. Coba upload lebih dari 10 file foto kondisi fisik unit | 11 file gambar .jpg | Sistem menolak upload dengan peringatan jumlah foto maksimal 10 untuk foto kondisi awal | | Not Tested | Medium |

---

## 6. Diagnosis, Estimasi Biaya & Persetujuan Pelanggan (DIAG)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-DIA-001 | Diagnosis | Black Box | Klaim tiket oleh Teknisi (`diterima` -> `didiagnosis`) | Tiket berstatus `diterima` tanpa teknisi | 1. Login sebagai Teknisi<br>2. Buka tiket berstatus `diterima`<br>3. Klik "Ambil Servis Ini / Mulai Pengecekan" | User Teknisi ID | Status tiket berubah menjadi `didiagnosis`, teknisi_id otomatis terisi nama teknisi yang mengklaim | | Not Tested | Critical |
| BB-DIA-002 | Diagnosis | Black Box | Pengisian hasil diagnosis dan estimasi biaya perbaikan | Tiket dalam status `didiagnosis` | 1. Masuk tab Diagnosis<br>2. Tulis temuan kerusakan teknis<br>3. Input estimasi biaya jasa dan estimasi suku cadang<br>4. Unggah foto bukti motherboard/komponen rusak<br>5. Klik "Ajukan Penawaran ke Admin / Pelanggan" | `hasil_diagnosis`: "Kapasitor VCORE short circuit pada rail 19V"<br>`estimasi_biaya`: 450000<br>`estimasi_hari`: 2<br>`foto_diagnosis`: [short.jpg] | Status tiket berubah menjadi `menunggu_persetujuan`. SLA Pengerjaan di-pause saat menunggu konfirmasi pelanggan | | Not Tested | Critical |
| BB-DIA-003 | Diagnosis | Black Box | Pelanggan Menyetujui Penawaran Biaya (Approval: `disetujui`) | Tiket berstatus `menunggu_persetujuan` | 1. Login sebagai Admin/Frontman<br>2. Hubungi pelanggan dan dapatkan persetujuan harga<br>3. Klik tombol "Setujui Estimasi (ACC Pelanggan)"<br>4. Konfirmasi dialog ACC | Aksi: Setujui Estimasi | Status tiket berubah menjadi `disetujui`, SLA target pengerjaan mulai berjalan dihitung dari tanggal persetujuan ini | | Not Tested | Critical |
| BB-DIA-004 | Diagnosis | Black Box | Pelanggan Menolak / Batal Servis (`dibatalkan`) | Tiket berstatus `menunggu_persetujuan` | 1. Klik "Batalkan Servis (Pelanggan Menolak)"<br>2. Pilih alasan pembatalan (misal: "Biaya terlalu mahal / unit tidak ekonomis")<br>3. Masukkan biaya cek batal jika berlaku<br>4. Simpan | `alasan_batal`: "Biaya part mahal"<br>`biaya_pembatalan`: 50000 | Status tiket berubah menjadi `dibatalkan`, tercatat di log pembatalan, unit siap dikembalikan ke pelanggan | | Not Tested | High |
| BB-DIA-005 | Diagnosis | Black Box | Penolakan aksi ubah status oleh Teknisi pada tahap ACC | Login sebagai Teknisi, tiket status `menunggu_persetujuan` | 1. Coba klik tombol untuk mengubah status langsung ke `disetujui` | Role: `teknisi` | Sistem menolak dengan notifikasi: "Akses ditolak: Teknisi tidak diizinkan mengubah status persetujuan, tahap ini dikelola oleh Admin" | | Not Tested | High |

---

## 7. Eksekusi Perbaikan, Log Progres & Suku Cadang (REPAIR)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-REP-001 | Perbaikan | Black Box | Mulai pengerjaan unit (`disetujui` -> `dalam_perbaikan`) | Tiket berstatus `disetujui` | 1. Teknisi membuka tiket servis miliknya<br>2. Klik tombol "Mulai Pengerjaan Unit" | Status transition | Status tiket berubah menjadi `dalam_perbaikan`. Timer SLA aktif berjalan | | Not Tested | Critical |
| BB-REP-002 | Perbaikan | Black Box | Menambahkan catatan Log Perbaikan berkala | Tiket dalam status `dalam_perbaikan` | 1. Buka tab Log Perbaikan<br>2. Masukkan catatan tindakan teknis<br>3. Pilih fase "Perbaikan"<br>4. Klik "Kirim Log" | `catatan`: "Mengganti IC PWM RT8206B dan membersihkan jalur korosi", `fase`: "Perbaikan" | Log perbaikan bertambah pada timeline secara real-time, dapat dilihat oleh admin dan pelanggan via status tracking | | Not Tested | High |
| BB-REP-003 | Perbaikan | Black Box | Alokasi suku cadang dari stok inventaris ke tiket servis | Tiket berstatus `dalam_perbaikan`, stok sparepart tersedia | 1. Buka tab Suku Cadang pada tiket<br>2. Klik "Gunakan Sparepart"<br>3. Pilih sparepart "SSD NVMe 512GB Kingston" (stok awal: 10)<br>4. Masukkan jumlah 1 unit<br>5. Klik Simpan | `sparepart_id`: ID SSD<br>`jumlah`: 1 | Sparepart terhubung ke tiket servis, stok di gudang otomatis terpotong menjadi 9 unit, tercatat otomatis pada log perbaikan | | Not Tested | Critical |
| BB-REP-004 | Perbaikan | Black Box | Percobaan alokasi sparepart melebihi sisa stok di inventaris | Stok sparepart di sistem tersisa 2 unit | 1. Buka tab suku cadang tiket<br>2. Masukkan jumlah alokasi 5 unit<br>3. Klik Simpan | `sparepart_id`: ID part<br>`jumlah`: 5 (stok sisa 2) | Sistem menolak dengan pesan error: "Stok sparepart tidak mencukupi (sisa 2)", transaksi digagalkan | | Not Tested | Critical |
| BB-REP-005 | Perbaikan | Black Box | Percobaan alokasi sparepart saat status tiket bukan `dalam_perbaikan` | Tiket masih berstatus `diterima` atau `selesai` | 1. Coba tambahkan suku cadang ke tiket | Status tiket selain `dalam_perbaikan` | Sistem menolak: "Penambahan suku cadang hanya dapat dilakukan saat tiket dalam status Dalam Perbaikan" | | Not Tested | High |
| BB-REP-006 | Perbaikan | Black Box | Pembatalan / Retur alokasi sparepart pada tiket servis | Suku cadang sudah dialokasikan ke tiket | 1. Pada baris suku cadang tiket, klik tombol "Hapus / Kembalikan ke Stok"<br>2. Konfirmasi pembatalan | ID Penggunaan Sparepart | Item terhapus dari tagihan tiket, stok sparepart di master inventaris bertambah kembali secara otomatis | | Not Tested | High |

---

## 8. Verifikasi Uji Kualitas (QC) & Penyelesaian Unit (QC)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-QC-001 | QC & Selesai | Black Box | Penyelesaian tiket dengan verifikasi checklist QC lengkap (`dalam_perbaikan` -> `selesai`) | Tiket `dalam_perbaikan` dan minimal ada 1 Log Perbaikan | 1. Masuk tab Uji QC & Selesai<br>2. Centang seluruh item checklist: Layar Display, Keyboard, Audio, Port USB, Suhu/Sirkulasi Udara, Tes Baterai/Charging<br>3. Set `passed_qc`: true<br>4. Unggah foto unit setelah perbaikan<br>5. Klik "Selesaikan Servis & Verifikasi QC" | Checklist QC lengkap = true<br>`passed_qc`: true<br>`foto_selesai`: [unit_selesai.jpg] | Status tiket berubah menjadi `selesai`, tanggal `completed_at` tercatat otomatis, notifikasi siap diambil siap diteruskan ke pelanggan | | Not Tested | Critical |
| BB-QC-002 | QC & Selesai | Black Box | Proteksi penyelesaian tiket tanpa ada Log Perbaikan | Tiket `dalam_perbaikan`, teknisi belum pernah menambah Log Perbaikan | 1. Teknisi langsung mencoba klik tombol "Selesaikan Servis" | Tanpa log perbaikan fase "Perbaikan" | Sistem memblokir dengan pesan: "Proteksi: Anda harus menambahkan minimal satu Log Perbaikan sebelum dapat menyelesaikan tiket ini" | | Not Tested | Critical |
| BB-QC-003 | QC & Selesai | Black Box | Kunci data teknis (Data Lock Enforcement) setelah status `selesai` | Tiket berstatus `selesai` | 1. Coba ubah checklist intake, keluhan awal, atau defect map | Modifikasi teknis pada tiket `selesai` | Sistem menolak perubahan dengan notifikasi bahwa data teknis telah dikunci karena servis telah berstatus selesai | | Not Tested | High |

---

## 9. Penagihan (Invoice), Pembayaran & Penyerahan Unit / Handover (INV-HO)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-INV-001 | Invoice & HO | Black Box | Penerbitan Invoice tagihan otomatis dari kalkulasi Jasa dan Suku Cadang | Tiket berstatus `selesai` dengan penggunaan sparepart | 1. Masuk tab Penagihan & Invoice<br>2. Masukkan biaya jasa servis<br>3. Periksa kalkulasi otomatis biaya sparepart<br>4. Klik "Terbitkan Invoice" | `biaya_jasa`: 200000<br>`biaya_sparepart`: 350000 (dari part) | Invoice terbentuk dengan total biaya Rp 550.000, nomor invoice unik terbit, status invoice tercatat | | Not Tested | Critical |
| BB-INV-002 | Invoice & HO | Black Box | Penerapan Uang Muka (DP) dan Diskon pada Invoice | Tiket memiliki DP saat intake | 1. Masukkan nilai diskon dan pastikan nilai DP terpotong<br>2. Verifikasi sisa tagihan yang harus dibayar | Total: Rp 500.000, Diskon: Rp 50.000, DP: Rp 150.000 | Sisa pembayaran terhitung tepat Rp 300.000 | | Not Tested | High |
| BB-INV-003 | Invoice & HO | Black Box | Cetak Invoice resmi via Android Bluetooth Thermal Printer / PDF | Invoice telah terbit | 1. Klik tombol "Cetak Invoice"<br>2. Pilih printer kasir / thermal receipt | Dokumen Invoice | Di aplikasi Android APK: mencetak via `AndroidPrinter` bridge; Di Web Desktop: membuka dialog print browser / generate jsPDF dengan layout nota resmi | | Not Tested | Critical |
| BB-INV-004 | Invoice & HO | Black Box | Penyerahan unit ke pelanggan (`selesai` -> `diambil`) dengan Foto Handover & Tanda Tangan | Tiket `selesai`, QC lulus, invoice lunas | 1. Masuk form Penyerahan Unit (Handover)<br>2. Masukkan nama penerima fisik<br>3. Ambil/unggah foto penyerahan unit ke pelanggan<br>4. Mintakan tanda tangan digital pelanggan pada layar canvas<br>5. Tentukan durasi garansi (misal: 30 hari)<br>6. Klik "Konfirmasi Penyerahan Unit" | `nama_penerima`: "Budi Santoso"<br>`durasi_garansi`: 30<br>`foto_handover`: [serah_terima.jpg] | Status tiket berubah ke status terminal `diambil`. Tanggal garansi berakhir dihitung otomatis (`tgl_diambil + 30 hari`), data terkunci final | | Not Tested | Critical |
| BB-INV-005 | Invoice & HO | Black Box | Proteksi Handover jika unit belum lulus QC (`passed_qc`: false) | Tiket belum dicentang lolos QC | 1. Coba lakukan penyerahan unit / ubah status ke `diambil` | `passed_qc`: false | Sistem menolak: "Proteksi QC: Unit wajib melewati Checklist QC Pra-Penyerahan sebelum status dapat diubah menjadi diambil" | | Not Tested | Critical |
| BB-INV-006 | Invoice & HO | Black Box | Proteksi Handover jika pelanggan masih memegang Unit Pinjaman (Loaner Protection) | Pelanggan masih meminjam laptop pengganti sementara | 1. Status tiket `selesai`<br>2. Coba klik "Konfirmasi Penyerahan Unit" | Record pinjaman aktif: true | Sistem memblokir dengan pesan: "Proteksi Unit Pinjaman: Pelanggan masih meminjam unit cadangan [LOAN-01]. Harap proses pengembalian unit pinjaman di menu Pinjaman sebelum menyerahkan unit utama" | | Not Tested | Critical |

---

## 10. Klaim Garansi & Retur Servis (WARR)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-WAR-001 | Garansi | Black Box | Registrasi Tiket Klaim Garansi dalam Masa Garansi Aktif | Tiket induk berstatus `diambil` dan tanggal hari ini <= `garansi_berakhir_at` | 1. Buka detail tiket lama / cari nomor tiket induk<br>2. Klik opsi "Ajukan Klaim Garansi"<br>3. Masukkan keluhan lanjutan pelanggan<br>4. Simpan klaim | `keluhan`: "Layar bergaris kembali setelah pemakaian 5 hari"<br>`is_garansi_claim`: true | Terbit tiket klaim baru yang tertaut langsung ke nomor tiket induk, durasi garansi tercatat klaim garansi, biaya awal diset Rp 0 | | Not Tested | Critical |
| BB-WAR-002 | Garansi | Black Box | Penolakan Klaim Garansi otomatis jika Masa Garansi telah Kedaluwarsa | Tiket induk telah melewati tanggal `garansi_berakhir_at` | 1. Buka tiket lama yang garansinya sudah habis<br>2. Periksa status badge garansi dan opsi klaim | Tanggal hari ini > `garansi_berakhir_at` | Badge garansi menampilkan "Garansi Habis", sistem memperingatkan bahwa klaim gratis tidak berlaku dan diarahkan sebagai tiket servis reguler baru | | Not Tested | High |

---

## 11. Unit Pinjaman Pengganti Sementara / Loaner Pool (LOAN)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-LOA-001 | Unit Pinjaman | Black Box | Peminjaman laptop cadangan workshop kepada pelanggan servis | Tiket servis berstatus `dalam_perbaikan`, unit pinjaman berstatus `tersedia` | 1. Masuk menu Pinjaman Unit > Pinjamkan Unit<br>2. Pilih unit cadangan [LOAN-01 Lenovo ThinkPad]<br>3. Pilih nomor tiket servis pelanggan<br>4. Masukkan kondisi fisik unit pinjaman & kelengkapan<br>5. Simpan transaksi | `loaner_id`: ID LOAN-01<br>`tiket_id`: ID Tiket Servis | Status unit pinjaman berubah menjadi `dipinjam`, record peminjaman berstatus `aktif` terikat ke tiket servis tersebut | | Not Tested | High |
| BB-LOA-002 | Unit Pinjaman | Black Box | Pengembalian unit pinjaman saat servis utama siap diserahkan | Record pinjaman berstatus `aktif` | 1. Buka menu Pinjaman Unit > Kembalikan Unit<br>2. Periksa kondisi unit kembali (layar, charger, keyboard)<br>3. Masukkan catatan pengembalian<br>4. Klik "Proses Pengembalian" | `status`: "kembali" | Status unit pinjaman kembali menjadi `tersedia`, record pinjaman ditutup, blokir penyerahan unit utama terbuka | | Not Tested | High |
| BB-LOA-003 | Unit Pinjaman | Black Box | Pencegahan peminjaman ganda pada unit pinjaman yang sedang keluar | Unit pinjaman sedang berstatus `dipinjam` | 1. Coba pilih unit yang sama untuk pelanggan lain | Unit `dipinjam` | Unit tidak muncul di daftar unit yang siap dipinjamkan, mencegah peminjaman ganda | | Not Tested | High |

---

## 12. Retur Komponen Rusak ke Distributor / Supplier RMA (RMA)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-RMA-001 | Supplier RMA | Black Box | Pembuatan klaim RMA baru untuk sparepart cacat pabrik | Suku cadang teridentifikasi cacat/DOA, login Admin/Teknisi | 1. Masuk menu Supplier RMA > Tambah RMA<br>2. Pilih Supplier penyedia<br>3. Masukkan nama komponen, Serial Number lama, dan alasan cacat<br>4. Simpan klaim RMA | `supplier_id`: ID Supplier<br>`nama_barang`: "Motherboard Asus H610"<br>`serial_number_lama`: "SN123456"<br>`alasan_rusak`: "No display out of the box" | Terbentuk nomor tiket RMA unik, status awal otomatis `diajukan`, tanggal klaim tercatat | | Not Tested | High |
| BB-RMA-002 | Supplier RMA | Black Box | Update pengiriman unit ke distributor (`diajukan` -> `dikirim`) | Tiket RMA berstatus `diajukan` | 1. Masukkan nomor resi ekspedisi dan kurir pengiriman<br>2. Ubah status menjadi "Dikirim ke Supplier" | `kurir`: "JNE"<br>`no_resi`: "JNE123456789" | Status RMA berubah menjadi `dikirim`, resi terlacak pada riwayat tracking RMA | | Not Tested | Medium |
| BB-RMA-003 | Supplier RMA | Black Box | Penyelesaian RMA: Penerimaan unit ganti baru atau Refund | Tiket RMA berstatus `dikirim` | 1. Pilih jenis resolusi (Unit Baru / Nota Kredit Refund)<br>2. Masukkan Serial Number unit baru pengganti<br>3. Klik "Selesaikan RMA" | `serial_number_baru`: "SN998877"<br>`resolusi`: "ganti_unit" | Status RMA menjadi `selesai`, stok unit pengganti otomatis terdata siap pakai di inventaris | | Not Tested | Medium |

---

## 13. Presensi Staf Geofenced 500 Meter Pekayon (ATTEND)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-ATT-001 | Presensi | Black Box | Check-in Hadir normal di dalam radius workshop (<= 500m) dengan Selfie | User berada di lokasi Pekayon (jarak <= 500m dari `-6.26064, 106.98744`), GPS aktif | 1. Buka menu Presensi GPS<br>2. Izinkan akses lokasi browser/aplikasi<br>3. Verifikasi jarak koordinat muncul di layar (misal: 45 meter dari workshop)<br>4. Ambil foto selfie langsung via kamera<br>5. Klik "Kirim Presensi Masuk" | Koordinat: `-6.26070, 106.98750`<br>Foto selfie valid | Check-in diterima sukses, status review "valid", jam masuk tercatat waktu WIB, status kehadiran "hadir" (atau "terlambat" jika > 09:15 WIB) | | Not Tested | Critical |
| BB-ATT-002 | Presensi | Black Box | Penolakan Check-in di luar radius workshop (> 500m) tanpa izin tugas luar | User berada di luar area workshop (> 500m) | 1. Buka Presensi GPS<br>2. Klik "Kirim Presensi Masuk" tanpa mencentang opsi Tugas Luar | Koordinat: `-6.28000, 106.99000` (jarak ~2.2 km) | Sistem menolak check-in dengan dialog: "Check-In ditolak: Anda berada di luar radius workshop (2.200 meter dari workshop, batas maksimal 500 meter). Silakan gunakan opsi Tugas Luar jika sedang bertugas." | | Not Tested | Critical |
| BB-ATT-003 | Presensi | Black Box | Check-in Tugas Luar di luar radius dengan keterangan penugasan wajib | User ditugaskan servis luar / belanja sparepart | 1. Aktifkan opsi "Check-In Tugas Luar"<br>2. Masukkan alasan tugas luar secara rinci<br>3. Ambil foto selfie bukti lokasi tugas luar<br>4. Kirim presensi | `is_tugas_luar`: true<br>`alasan_tugas_luar`: "Antar unit PC klien PT Makmur Sentosa di Cikarang" | Check-in berhasil dikirim dengan status review `menunggu_review`, menanti persetujuan verifikasi oleh Pimpinan | | Not Tested | High |
| BB-ATT-004 | Presensi | Black Box | Validasi form Check-in Tugas Luar jika alasan dikosongkan | Berada di luar radius, centang Tugas Luar | 1. Centang "Tugas Luar"<br>2. Kosongkan kolom alasan tugas luar<br>3. Klik "Kirim Presensi" | `is_tugas_luar`: true<br>`alasan_tugas_luar`: "" | Form menampilkan error: "Alasan atau keterangan penugasan tugas luar wajib diisi saat melakukan presensi di luar radius workshop" | | Not Tested | High |
| BB-ATT-005 | Presensi | Black Box | Proteksi duplikasi Check-in pada tanggal yang sama | User sudah berhasil Check-in pada hari ini | 1. Buka halaman presensi kembali pada hari yang sama<br>2. Coba klik tombol Check-in | User ID sama, tanggal sama | Sistem menolak: "Anda sudah melakukan Check-In hari ini pada pukul 08:45 WIB", tombol berubah menjadi "Check-Out Pulang" | | Not Tested | High |
| BB-ATT-006 | Presensi | Black Box | Check-Out Pulang staf pada akhir jam kerja | User telah Check-in sebelumnya | 1. Masuk menu Presensi pada sore hari<br>2. Klik tombol "Presensi Pulang (Check-Out)"<br>3. Konfirmasi | Jam: 18:05 WIB | Jam pulang tercatat, total jam kerja hari ini dihitung otomatis | | Not Tested | High |
| BB-ATT-007 | Presensi | Black Box | Penanganan izin akses GPS dinonaktifkan oleh pengguna | User menolak izin akses lokasi pada browser/perangkat | 1. Buka form presensi dengan lokasi dimatikan<br>2. Coba kirim presensi | Geolocation permission = denied | Muncul instruksi error: "Akses GPS wajib diaktifkan untuk melakukan presensi. Silakan izinkan akses lokasi pada pengaturan browser/aplikasi" | | Not Tested | High |

---

## 14. Pencarian, Filter, Pagiansi & Dashboard (SEARCH-DASH)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-SEA-001 | Pencarian | Black Box | Pencarian tiket servis multi-parameter (No Tiket, Nama, Serial Number) | Terdapat banyak data tiket di sistem | 1. Masuk menu Antrean Tiket Servis<br>2. Ketik nomor tiket lengkap atau potongan nomor telepon customer<br>3. Periksa hasil tabel | `search`: "YVS-2611" atau "08123" | Daftar tiket terfilter secara akurat dalam waktu kurang dari 500ms | | Not Tested | High |
| BB-SEA-002 | Pencarian | Black Box | Filter tiket berdasarkan Tab Status dan SLA Urgency | Tiket dengan berbagai status tersedia | 1. Klik tab filter "Dalam Perbaikan"<br>2. Klik filter SLA "Mendekati Tenggat (Warning)" | Filter: `status=dalam_perbaikan`, `sla_urgency=warning` | Tabel hanya menampilkan unit yang sedang dikerjakan yang mendekati batas waktu pengerjaan | | Not Tested | High |
| BB-SEA-003 | Pencarian | Black Box | Navigasi Paginasi data (Next, Previous, Limit per Halaman) | Total record > 25 data | 1. Ubah limit data per halaman menjadi 10<br>2. Klik tombol halaman ke-2<br>3. Periksa informasi rangkuman | `page`: 2, `limit`: 10 | Data halaman ke-2 tampil dengan nomor urut yang konsisten, label menampilkan "Menampilkan 11-20 dari X data" | | Not Tested | Medium |
| BB-DSH-001 | Dashboard | Black Box | Pembaruan metrik analitik omzet dan antrean servis secara Realtime | Login sebagai Admin/Pimpinan | 1. Amati widget "Unit Sedang Dikerjakan" dan "Pendapatan Bulan Ini"<br>2. Di tab/browser lain lakukan penyelesaian servis atau pembayaran invoice | Transaksi pembayaran baru | Angka counter pada dashboard ter-update secara otomatis tanpa perlu refresh manual melalui event SSE / state sync | | Not Tested | High |

---

## 15. Perilaku Mode Offline & Transisi Jaringan (OFFLINE)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-OFF-001 | Offline Sync | Black Box | Navigasi dan pembacaan data tiket servis saat koneksi internet terputus | Data tiket sudah pernah dibuka sebelumnya saat online | 1. Matikan koneksi WiFi/Data (Mode Pesawat)<br>2. Buka daftar tiket servis dan klik salah satu detail tiket | Device offline (navigator.onLine = false) | Sistem menyajikan data dari IndexedDB offlineDataStore, muncul pill peringatan kuning di navbar: "Mode Offline • Data Tersimpan Lokal", aplikasi tidak crash | | Not Tested | Critical |
| BB-OFF-002 | Offline Sync | Black Box | Pemulihan otomatis (Auto-Recovery) saat koneksi internet kembali aktif | Perangkat sebelumnya berada pada mode offline | 1. Aktifkan kembali koneksi internet WiFi/Data<br>2. Lakukan navigasi atau tunggu beberapa detik | Koneksi pulih (online) | Pill kuning offline otomatis menghilang, banner konektivitas hijau muncul sekejap, aplikasi menyinkronkan data terbaru dari server staging | | Not Tested | High |
| BB-OFF-003 | Offline Sync | Black Box | Penanganan mutasi data krusial saat koneksi offline | Perangkat sedang dalam mode offline | 1. Buka form mutasi (misal: Check-in Presensi GPS atau Hapus Pelanggan)<br>2. Coba klik kirim data | Aksi POST saat offline | Sistem menampilkan notifikasi informatif bahwa aksi mutasi/presensi memerlukan koneksi online langsung ke server demi integritas data | | Not Tested | High |

---

## 16. Responsivitas Layar & Usabilitas Mobile Capacitor (MOBILE)

| Test ID | Module | Test Type | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| BB-MOB-001 | Mobile UX | Black Box | Penyesuaian Window Insets & Notch Kamera pada status bar Android | Aplikasi Android APK terpasang di HP fisik | 1. Buka aplikasi YVS Computer di HP Android dengan notch/punch-hole kamera<br>2. Periksa header dan banner notifikasi | Layar HP Android fisik | Konten header dan navbar tidak tertutup oleh status bar jam atau notch kamera, safe padding diterapkan dengan rapi | | Not Tested | High |
| BB-MOB-002 | Mobile UX | Black Box | Interaksi Bottom Navigation Bar pada layar smartphone | Tampilan layar mobile (viewport width <= 640px) | 1. Sentuh menu-menu pada bottom nav bar (Tiket, Presensi, Sparepart, Profil)<br>2. Perhatikan transisi tampilan | Touch gestures | Navigasi berpindah lancar dengan active indicator yang jelas, floating action button (FAB) tidak menutupi item data terbawah | | Not Tested | High |
| BB-MOB-003 | Mobile UX | Black Box | Pengambilan foto langsung dari kamera HP via Capacitor Camera Plugin | Menggunakan form upload foto (Intake / QC / Handover) di APK | 1. Klik ikon "Buka Kamera"<br>2. Izinkan akses izin kamera Android<br>3. Jepret foto unit dan klik centang simpan | Foto kamera perangkat fisik | Foto berhasil diambil, dikompresi ke dimensi optimal web, dan ditampilkan sebagai thumbnail preview instan di form | | Not Tested | Critical |
