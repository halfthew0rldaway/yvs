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
- [x] **QR Customer Self-Registration**: Reusable poster QR, public customer/device form, protected review queue, staff acceptance/rejection, and linked ticket expectations. Local database/HTTP/browser checks, production build, and Android sync passed.
- [x] **Customer Intake Layout & Serial Ownership**: Expanded the public form across desktop width, added tappable device-category cards, and moved serial-number entry to staff review. Public serial input is ignored server-side; local database check, unit suite, desktop/mobile visual check, web build, and Android sync passed.
- [x] **Fictional Owner Login Cleanup**: Removed H. Bambang from demo quick-fill and backend aliases; verified no matching local account remains and checked the rendered login page.
- [x] **Staging Startup Safety**: Replaced automatic destructive schema sync with a no-data-loss sync, added RBAC seeding after owner bootstrap, stopped forced demo seeding, and preserved existing owner passwords on routine deploys.
- [x] **Mobile Android App (Capacitor 7)**: Android 16 compatibility, native camera, native GPS, native print spooler, official YVS adaptive icons and splash screens.
- [x] **AI Workflow & Context Retention**: Serena semantic symbol index, Cline Memory Bank, root `AGENTS.md`, and agent rules.
- [x] **QA & Test Architecture**: Comprehensive White Box (55 scenarios) and Black Box (50 scenarios) test documentation under `docs/testing/`, and 36 automated unit tests passing across 6 suites under `backend/tests/unit/`.
- [x] **Continuous Form & Half-A4 (A5 Landscape) Redesign**: Redesigned `InvoiceModal`, `InvoiceDetail`, and `BpbsPrintModal` with packed, responsive, high-density layouts optimized for continuous form dot-matrix printers (210mm x 148mm) without vertical white space waste.
- [x] **Mobile PWA & Web UX Normalization**: Fixed quick registration modal scroll lock with `modal-body` & `modal-footer` container architecture, prevented mobile Chrome font boosting via `text-size-adjust: 100%`, normalized custom select dropdowns, and fixed CRM floating bubble z-index layering.
- [x] **Modular RBAC Foundation**: Added Super Admin-managed custom roles, capability catalog, user-role assignments, and ticket-stage permissions for intake, diagnosis, repair, QC, approval, and handover.
- [x] **RBAC Flow Alignment**: Aligned sidebar, page guards, page actions, and domain API routes with live database permissions; added navigation refresh and permission route regressions.
- [x] **Modular RBAC Hardening**: Removed role-name gates from ticket ownership and dashboard data; added ticket scope, claim, report, and attendance exemption capabilities; guarded ticket update fields, notification reads, and realtime events; made RBAC seeding preserve administrator changes.
- [x] **Capability Usability Audit**: Added a correction-only attendance flow without payroll exposure, gated invoice report and creation controls, aligned brand creation with inventory management, and verified custom-role login landing and revocation in a local browser.
- [x] **Mobile PWA RBAC**: PWA launch and Android back navigation use permission-aware landing routes; bottom tabs adapt to custom role grants, and reconnected sessions clear revoked offline caches. Verified in a mobile-sized browser and synced the Capacitor Android project.
- [x] **RBAC Follow-up Audit**: Corrected unclaimed ticket delegation with `tickets.assign`, made exact custom usernames win over legacy login aliases, and separated role notification read state per recipient. Verified against local database and regression tests.
- [x] **Administrator Transfer & Offline Drafts**: Added verified Super Admin designation and demotion with last-admin safety; separated database export and maintenance grants; added explicit local repair-note drafts and stopped automatic replay of legacy queued operations. Local transfer and IndexedDB browser checks passed.

## Known Constraints & Invariants
- Staging backend must remain on `https://staging.101.32.127.55.sslip.io/api`.
- Never register Service Workers inside Capacitor native WebView.
- Do not modify database schema directly without Prisma migrations.
