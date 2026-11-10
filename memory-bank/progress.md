# Project Progress: Yangversa Computer (YVS)

## What Works
- [x] **Authentication & Role Authorization**: Multi-role access control (`admin`, `teknisi`, `pimpinan`) with JWT token storage.
- [x] **Customer & Device Management**: Directory, personality classification, custom risk/VIP badges, device history tracking.
- [x] **Service Ticket Management**: Multi-stage ticket intake, physical defect mapper, accessories checklist, diagnostic reporting, technician assignment, QC verification.
- [x] **Inventory & Spare Parts**: Stock tracking, cost/selling price calculation, SKU/barcode generation, restock logs.
- [x] **Supplier & RMA Management**: Supplier database, component return authorizations, tracking numbers.
- [x] **Billing & Invoicing**: Multi-item invoices, DP deductions, discounts, digital staff stamps & signatures, universal printing.
- [x] **HR Attendance & Presensi**: GPS geofencing (500m radius Pekayon workshop), live camera selfie verification, leave request management.
- [x] **Client Public Tracking**: Phone number and ticket number tracking portal.
- [x] **Mobile Android App (Capacitor 7)**: Android 16 compatibility, native camera, native GPS, native print spooler, official YVS adaptive icons and splash screens.
- [x] **AI Workflow & Context Retention**: Serena semantic symbol index, Cline Memory Bank, root `AGENTS.md`, and agent rules.
- [x] **QA & Test Architecture**: Comprehensive White Box (55 scenarios) and Black Box (50 scenarios) test documentation under `docs/testing/`, and 36 automated unit tests passing across 6 suites under `backend/tests/unit/`.
- [x] **Continuous Form & Half-A4 (A5 Landscape) Redesign**: Redesigned `InvoiceModal`, `InvoiceDetail`, and `BpbsPrintModal` with packed, responsive, high-density layouts optimized for continuous form dot-matrix printers (210mm x 148mm) without vertical white space waste.
- [x] **Mobile PWA & Web UX Normalization**: Fixed quick registration modal scroll lock with `modal-body` & `modal-footer` container architecture, prevented mobile Chrome font boosting via `text-size-adjust: 100%`, normalized custom select dropdowns, and fixed CRM floating bubble z-index layering.

## Known Constraints & Invariants
- Staging backend must remain on `https://staging.101.32.127.55.sslip.io/api`.
- Never register Service Workers inside Capacitor native WebView.
- Do not modify database schema directly without Prisma migrations.
