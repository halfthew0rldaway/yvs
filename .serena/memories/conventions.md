# Code Conventions & Invariants

- **Backend**:
  - Always use CommonJS syntax (`require`/`module.exports`).
  - Keep controllers lean; sanitize inputs with `express-validator` and custom middleware (`sanitizeRequest.js` uppercases ticket numbers, serial numbers, and `kode_promo`).
  - Record audit trails via `activityLogger` middleware.
  - Enforce modular RBAC permissions (`requirePermission`) on every route and SSE event (`backend/src/utils/sse.js`); run `backend/scripts/seed-rbac.js` after adding new capability codes.
  - Active `Customer` queries must filter `{ is_active: true, deleted_at: null }` (never `is_archived`).
  - Run unit tests via `npm --prefix backend test` (89/89 passing across 9 suites).

- **Frontend**:
  - Always use ES Modules syntax (`import`/`export`).
  - Network calls must route through `src/services/api.js`; live cashier validation endpoints (`/marketing/promotions/active`, `/marketing/promotions/validate`) bypass IndexedDB stale cache.
  - Use `AppConfig.apiBaseUrl` from `src/services/config.js` for base URL resolution.
  - Never register Service Workers inside Capacitor Android WebView.
  - Preserve visual design: Tailwind CSS utility classes, `.modal-shell`/`.modal-panel` with pinned header/footer + `overflow-y-auto` body, `CustomSelect` for dropdowns, and brand colors (`#2563eb`, `#1e293b`). Avoid non-existent Tailwind tokens (`w-4.5`/`h-4.5`) and avoid `text-3xs` in new UI.
  - **Ethical Invoice Wording**: Never use `"Alasan"` on invoice discount notes/receipts; always use `"Keterangan Potongan / Apresiasi"` / `"Penyesuaian Harga / Apresiasi"`, and keep discounts on the separate `Invoice.diskon` line.
  - **Desktop Split-Pane Scoped Scroll**: Asymmetric 2-column desktop layouts (`RmaForm`, `SparepartForm`, `JobPostingForm`, `MarketingPage` Outreach, `RetensiCrm`, `AttendancePage` Policy, `Dashboard` Row 3) must align column heights and scroll only inside the taller pane (`lg:overflow-y-auto lg:overscroll-contain custom-scrollbar`), never causing whole-page infinite scroll.
  - Printing must call `DocumentPrintService.printOrShareDocument()`.
- See related details in `mem:architecture`.
