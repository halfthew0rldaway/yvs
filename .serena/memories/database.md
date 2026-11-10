# Database Schema & Data Models

Defined in `backend/prisma/schema.prisma`.

## Core Entities
- **User**: System staff (`admin`, `teknisi`, `pimpinan`). Relates to tickets, activity logs, notifications, attendance.
- **Customer**: Client directory with `nomor_telepon`, `tipe_kepribadian` (Netral, Koleris, Sanguinis, Plegmatis, Melankolis), `custom_badges`. Has many `Perangkat`.
- **Perangkat**: Hardware unit with `jenis_perangkat`, `merek`, `model`, `serial_number`. Belongs to `Customer`.
- **TiketServis**: Service ticket lifecycle entity.
  - Status progression: `diterima` -> `didiagnosis` -> `menunggu_persetujuan` -> `disetujui` -> `dalam_perbaikan` -> `selesai` -> `diambil` -> `dibatalkan`.
  - Photo JSON fields: `foto_kondisi` (max 10), `foto_diagnosis` (max 25), `foto_selesai` (max 15), `foto_handover` (max 5).
  - Accessories checklist JSON: `kelengkapan_detail`.
  - Relations: `Diagnosis`, `LogPerbaikan`, `PenggunaanSparepart`, `Invoice`.
- **Sparepart & PenggunaanSparepart**: Inventory catalog with SKU, cost/selling price, stock. Assigning a part to a ticket decrements stock.
- **Invoice**: Service billing with subtotal, discount, DP, payment method, tax, warranty duration.
- **AttendanceRecord**: Geofenced staff presensi records, selfie photo, GPS coordinates, external duty flag.
- See related details in `mem:workflows`.
