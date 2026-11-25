# Core Business Workflows

## 1. Service Ticket Processing
- Intake (`diterima`): Frontman captures device details, physical defect map, deposited accessories, and initial condition photos. Generates printable BPBS.
- Technical Diagnosis (`didiagnosis`): Technician records technical faults, internal photos, cost estimate, and required parts.
- Customer Confirmation (`menunggu_persetujuan` -> `disetujui`): Quotation approved.
- Repair (`dalam_perbaikan`): Technician performs hardware servicing, records used spare parts, logs actions in `LogPerbaikan`.
- Quality Control (`selesai`): 10-point hardware check (screen, ports, audio, keyboard, temperature), completion photos.
- Billing & Pickup (`diambil`): Invoice generated with digital stamp/signature, printed via `AndroidPrinter` or exported as high-res PDF.

## 2. Attendance & Geofencing
- Workshop Location: Jl. Raya Pekayon No. 25, Bekasi Selatan (`-6.26064, 106.98744`).
- Radius: Exact 500 meters.
- Distance calculation uses Haversine formula with high-accuracy GPS acquisition.
- If distance <= 500m: On-site attendance with selfie photo capture.
- If distance > 500m: External task reporting mandatory (activity reason + selfie).

## 3. CRM & Retention Recall
- Automatic identification of devices serviced 180 to 365+ days ago.
- Pre-filled WhatsApp templates for maintenance service (dust cleaning, thermal paste replacement).

## 4. Marketing & Promosi (`/marketing`)
- RBAC capabilities: `marketing.view`, `marketing.manage`, `marketing.report` (SSE `marketing:*` gated).
- HPP-safe rules in `backend/src/utils/promotionMath.js`: default `jasa`-only scope, WIB (`UTC+7`) start/end date boundaries, optional caps/min transaction/device/ticket filters, quota limits, and 1x-per-normalized-phone guard.
- Cashier integration (`InvoiceForm.jsx`, `InvoiceDetail.jsx`, `invoice.controller.js`): 3 modes (`Tanpa Diskon` | `Promo Toko` | `Manual`), ACID `$transaction` with atomic optimistic quota lock (`kuota_terpakai < kuota_total`), quota restoration on promo detachment or ticket cancellation (`dibatalkan`), offline fallback, and ethical `"Keterangan Potongan / Apresiasi"` wording (never `"Alasan"`).
- Dedicated `CampaignNote` tab tracks multi-wave campaign channels/dates/URLs (linked to a promo or general brand awareness).
- Public `/tracking` mounts `PromoShowcase.jsx` (`GET /api/tracking/promotions`, zero PII) for active promos with `tampil_di_tracking: true`.
- 3-Step Guided Outreach (`MarketingPage.jsx`): Step 1 select promo + filters -> Step 2 bounded internal-scroll paginated customer picker (`10`/`20`/`50`) -> Step 3 personalized WA composer opens only after picking a customer (editable, Reset Teks, Copy, Send WA, session "Terkirim" badge).

## 5. Direct Staff Chat & QR Self-Registration
- `/chat`: 1-on-1 staff conversations with `InsertReferenceModal` entity chips, paginated history, WIB TXT/JSON export, and account deletion retention guard.
- `/tracking/register`: Reusable walk-in QR self-registration enters `CustomerRegistration` review queue (`tickets.intake`); staff accepts to atomically link/create `Customer` & `Perangkat`.
- See related details in `mem:database`.
