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
- [x] **Staging App Distribution**: Added `/download`, login entry point, staged APK file serving, and a CI build from the same source commit as the PWA. Android builds currently use temporary debug signatures and require reinstall between deployments.
- [x] **Sidebar Action Badges & QR Queue Layout**: Added route-aware unread-notification badges, intake registration counts and direct QR link, realtime count refresh, and paginated mobile-first QR review cards.
- [x] **Mobile UI Consistency Audit**: Checked 24 authenticated routes at 320px, 390px, and short landscape widths with isolated demo data; corrected hidden-sidebar badge visibility, header crowding, list breakpoints, notification/memo layering, modal landscape bounds, attendance tabs, and mobile CRM bubble sizing.
- [x] **Mobile Form Typography Balance**: Unified shared labels, controls, hints, buttons, and custom selectors; stacked long hints below labels on narrow screens. Rechecked authenticated form routes at 320px and 390px without horizontal overflow.
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
- [x] **YVS Computer Branding & PWA Cleanup (2026-11-24)**: Finalized YVS Computer branding across frontend/backend/PWA manifests & icons, and moved `backend/migrate_brands.js` to `backend/scripts/migrate_brands.js`.
- [x] **Marketing & Promosi Module (2026-11-25)**:
  - Prisma schema models `Promotion` (with `tampil_di_tracking`), `CampaignNote`, and `Invoice` (`promotion_id`, `keterangan_diskon`); modular RBAC (`marketing.view`, `marketing.manage`, `marketing.report`) + SSE gating.
  - HPP-safe promo engine (`backend/src/utils/promotionMath.js`) with WIB date boundaries, scope (`jasa`/`sparepart`/`total`), caps, min transaction, device/ticket rules, quota limits, and 1x-per-phone guard.
  - Cashier 3-mode discount selector (`Tanpa Diskon` | `Promo Toko` | `Manual`) in `InvoiceForm` & `InvoiceDetail` with atomic `$transaction` optimistic quota locking, quota restoration on promo detachment or ticket cancellation, offline fallback, HPP warning, and ethical `"Keterangan Potongan / Apresiasi"` wording.
  - Dedicated `CampaignNote` tab & modal (`CampaignNoteModal.jsx`) with optional reference URL/placeholder, plus zero-PII public `/tracking` promo banner (`PromoShowcase.jsx` + `GET /api/tracking/promotions`).
  - 3-step guided Customer Outreach workflow (`MarketingPage.jsx`: Step 1 pick promo & filter -> Step 2 bounded internal-scroll paginated customer picker -> Step 3 personalized WA composer appears after picking a customer) and comparison report (`GET /api/marketing/report`).
  - Added `backend/tests/unit/marketing.test.js` (8 tests) and manual local demo seeder (`backend/scripts/seed-marketing-dummy.js`); **89/89 automated unit tests passing** across 9 suites.
- [x] **Split-Pane Layout & Scoped Scroll Audit (2026-11-25)**: Aligned heights and added pane-scoped scrolling on desktop across `RmaForm`, `SparepartForm`, `JobPostingForm`, `MarketingPage` (Outreach), `RetensiCrm`, `AttendancePage` (Policy), and `Dashboard` (Row 3), plus `/marketing` header breadcrumbs in `Layout.jsx`. Pushed to `origin/staging` (`2428f38`).

## Known Constraints & Invariants
- Staging backend must remain on `https://staging.101.32.127.55.sslip.io/api`.
- Never register Service Workers inside Capacitor native WebView.
- Do not modify database schema directly without Prisma schema sync/migrations (`docker-init.js` runs no-data-loss `prisma db push --skip-generate` + `seed-rbac.js` on staging startup).
- Ethical invoice wording: never use `"Alasan"` on discount notes/receipts; always use `"Keterangan Potongan / Apresiasi"`.
- `Customer` active/soft-delete fields are `is_active` and `deleted_at` (never `is_archived`).
- Desktop asymmetric 2-column layouts must scope vertical scrolling to the taller pane so both columns stay flush top-to-bottom without whole-page infinite scroll.
# Direct chat (2026-11-17)
- Added one-to-one staff chat with per-user read state, paginated history, recipient-scoped realtime refresh, and participant TXT/JSON transcript exports with Android/Capacitor native share support.
- Replaced manual `[[ticket:123]]` workflow with interactive `InsertReferenceModal` to search & link tickets, devices, spare parts, and staff members with real-time permission access checks.
- Rendered rich entity chips/badges in message history, auto-scroll to bottom, scroll retention on older message prepending, and Enter-to-send shortcut.
- Added deletion guard preventing deletion of staff accounts with active chat retention history.
- Added comprehensive unit test suite in `backend/tests/unit/direct_chat.test.js` (81/81 unit tests passing).
- Added safety caps (`take: 100`) on unpaginated customer/invoice endpoints and tightened CORS origins in `backend/src/app.js`.
- Fixed "Tiket tidak ditemukan" on chat mention click: synced missing `Invoice` columns (`diskon`, `nominal_dp`, `status_pembayaran`, `metode_pembayaran`, `catatan`) in MySQL database, eliminated invalid `mode: "insensitive"` in Prisma MySQL queries, and upgraded reference tokens to support both numeric ID and alphanumeric ticket codes with optional display labels (e.g. `[[ticket:1127|SRV-2026-005]]`). Added `useSearchParams` URL search synchronization to `PerangkatList`.
- Upgraded Chat Layout & UI/UX (2026-11-18): Expanded layout to wide-to-edge (`w-full`), modernized bubble shapes (`rounded-2xl rounded-br-xs` vs `rounded-2xl rounded-bl-xs`), formatted snippet tokens (`🎫 Tiket ...`), added date cluster separators, integrated Web Audio chime and realtime system toast notifications, and integrated unread chat counters into the main sidebar badges.
- Centered & Responsive Navbar Live Clock (2026-11-18): Positioned `LiveClock` at exact horizontal/vertical center via `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`, encased in a modern slate capsule, and added multi-tier responsive date formatting (full format on desktop, abbreviated on tablet, compact date on mobile) without text clipping.
- Thermal Label Printing & Universal Offline QR Upgrade (2026-11-22):
  - Fixed 4-page overflow and browser header/footer clutter bug in `TicketQrModal` by portaling modal to `document.body` via `createPortal`, isolating the print DOM tree with `#root { display: none !important; }`, and dynamically configuring `@page { size: ...; margin: 0mm !important; }` to guarantee exact 1-page prints.
  - Added comprehensive thermal label size selector: `50 x 30 mm` (Mini/Aksesoris/Charger), `60 x 40 mm` (Kompak), `80 x 50 mm` (Standar Servis - Rekomendasi), `100 x 75 mm` (Besar/Box/Casing), and `roll` (Continuous Roll 58/80 mm) with real-time physical aspect ratio preview, zero clipping, and copy multiplier (1x-5x).
  - Replaced external third-party QR generation (`api.qrserver.com`) across `TicketQrModal`, `SparepartQrModal`, `BpbsPrintModal`, and `Tracking` with 100% offline-ready local generation via the `qrcode` library (`QRCode.toDataURL`), supporting custom-dimension PDF export (`DocumentPrintService.downloadPdf`), PNG download, and direct thermal printing.
  - Upgraded `CrmFloatingBubble` with dual notification badges (CRM Left / Blue, Chat Right / Red), optimized vector 3D mascot rendering, and responsive section tabs.

