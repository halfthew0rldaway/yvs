# Database Schema & Data Models

Defined in `backend/prisma/schema.prisma`.

## Core Entities
- **User / Role / Permission / UserRole**: System staff with modular RBAC (`module.action` grants); `User.role` is legacy display slug. Super Admin manages roles/permissions.
- **Customer**: Client directory with `nomor_telepon`, `tipe_kepribadian` (Netral, Koleris, Sanguinis, Plegmatis, Melankolis), `custom_badges`, soft-delete flags (`is_active: Boolean`, `deleted_at: DateTime?` — **never** `is_archived`). Has many `Perangkat`.
- **Perangkat**: Hardware unit with `jenis_perangkat`, `merek`, `model`, `serial_number`. Belongs to `Customer`.
- **CustomerRegistration**: Public QR self-registration queue awaiting staff review (`tickets.intake`) before creating/linking canonical `Customer` & `Perangkat`.
- **TiketServis**: Service ticket lifecycle entity.
  - Status progression: `diterima` -> `didiagnosis` -> `menunggu_persetujuan` -> `disetujui` -> `dalam_perbaikan` -> `selesai` -> `diambil` -> `dibatalkan`.
  - Photo JSON fields: `foto_kondisi` (max 10), `foto_diagnosis` (max 25), `foto_selesai` (max 15), `foto_handover` (max 5).
  - Accessories checklist JSON: `kelengkapan_detail`.
  - Relations: `Diagnosis`, `LogPerbaikan`, `PenggunaanSparepart`, `Invoice`.
- **Sparepart & PenggunaanSparepart**: Inventory catalog with SKU, cost/selling price, stock. Assigning a part to a ticket decrements stock.
- **Invoice**: Service billing with subtotal, `diskon` (separate deduction line), optional `promotion_id` (`Promotion`), `keterangan_diskon` (ethical appreciation note), DP, payment method, tax, warranty duration.
- **Promotion**: Official store promo offers (`kode_promo` unique uppercase, `nama_promo`, `tipe_diskon` `persen`/`nominal`, HPP-safe `cakupan_diskon` `jasa`/`sparepart`/`total`, `maksimal_diskon`, `minimal_transaksi`, `kategori_perangkat`, `tipe_tiket`, WIB `tanggal_mulai`/`tanggal_selesai`, `kuota_total`/`kuota_terpakai`, `satu_kali_per_pelanggan`, `tampil_di_tracking`, `is_active`). Linked to `Invoice[]` and `CampaignNote[]`.
- **CampaignNote**: Marketing campaign publication log (`promotion_id` optional for general campaigns, `judul`, `saluran`, `tanggal_publikasi`, `catatan`, `tautan_referensi`).
- **Chat / ChatMember / ChatMessage**: 1-on-1 staff direct chat with canonical user pairs, per-user read state, and entity reference tokens (`[[ticket:ID]]`, etc.).
- **Notification & NotificationRead**: Per-user read isolation for role/global notifications.
- **AttendanceRecord**: Geofenced staff presensi records, selfie photo, GPS coordinates, external duty flag.
- See related details in `mem:workflows`.
