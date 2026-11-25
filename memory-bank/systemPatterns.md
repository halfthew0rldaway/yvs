# System Patterns & Architecture

## System Architecture

```
                       +------------------------------+
                       |   PostgreSQL / MySQL DB      |
                       +--------------+---------------+
                                      |
                                      | Prisma ORM v6
                                      v
                       +------------------------------+
                       |    Express.js REST API       |
                       |  - Rate Limiter & Sanitizer  |
                       |  - Activity Logger & Auth    |
                       +--------------+---------------+
                                      |
              +-----------------------+-----------------------+
              |                                               |
              | HTTPS API (/api/...)                          | Static Media (/uploads/...)
              v                                               v
+-------------------------------+             +-------------------------------+
|   React 18 Web Frontend       |             |  Capacitor Android Native App |
|   - Vite Bundler              |             |  - id.yangversa.servio        |
|   - Tailwind CSS              |             |  - Native AndroidPrinter      |
|   - Axios + IndexedDB Cache   |             |  - Native Geolocation & Cam   |
+-------------------------------+             +-------------------------------+
```

## Key Technical Decisions & Patterns

1. **Strict Staging Target**:
   - Staging Endpoint: `https://staging.101.32.127.55.sslip.io/api`
   - Mobile and Web builds strictly target this endpoint unless explicitly overridden via environment variables.

2. **Capacitor vs PWA Isolation**:
   - PWA Service Workers are disabled inside Capacitor WebView (`injectRegister: null` in `vite.config.js`).
   - On native Android, Service Workers are explicitly unregistered on startup to prevent network call interception and false offline triggers.

3. **Offline-First Data Flow**:
   - **Read Strategy**: Cache-first / Stale-While-Revalidate via `offlineDataStore` (IndexedDB). Successful GET requests update the cache.
   - **Mutation Invalidation**: POST, PUT, PATCH, DELETE operations automatically invalidate matching cache prefixes (e.g. `/tiket-servis`, `/dashboard`).
   - **Connectivity Tracking**: Pure `navigator.onLine` and native window events. If device is online, the connectivity banner returns `null` and is completely invisible.

4. **Universal Document Printing**:
   - `DocumentPrintService` routes printing:
     - On Android Capacitor: calls `window.AndroidPrinter.print(docName)` to open the OS Print Spooler (supports direct thermal/WiFi printers or Save as PDF).
     - On Desktop: calls `window.print()`.
     - Mobile Web Fallback: renders high-res PDF via `html2canvas` + `jsPDF`.

5. **Geofence Calculation**:
   - Pekayon Workshop Coordinates: `-6.26064, 106.98744`.
   - Radius: 500 meters.
   - Haversine formula implemented in both backend controller and frontend validator.

6. **Marketing Promo Concurrency & HPP Protection**:
   - Pure calculation & eligibility rules live in `backend/src/utils/promotionMath.js` (WIB `UTC+7` day boundaries, `jasa`-default scope to protect sparepart HPP, `maksimal_diskon` cap, min transaction, 1x per normalized customer phone).
   - Cashier redemption executes inside `prisma.$transaction` with an atomic optimistic quota lock (`updateMany` with `kuota_terpakai: { lt: kuota_total }`) to eliminate race-condition over-redemption; detaching a promo or cancelling its ticket (`dibatalkan`) restores `kuota_terpakai`.
   - Live cashier endpoints (`/marketing/promotions/active`, `/marketing/promotions/validate`) explicitly bypass IndexedDB stale cache in `frontend/src/services/api.js`.
   - Public `/api/tracking/promotions` returns zero PII and only active offers flagged `tampil_di_tracking: true`.

7. **Desktop Split-Pane Scoped Scroll & Mobile-First Balance**:
   - Full-page asymmetric forms (`RmaForm`, `SparepartForm`, `JobPostingForm`) lock to desktop viewport height (`lg:h-[calc(100dvh-7.25rem)] lg:min-h-[580px] flex flex-col lg:overflow-hidden`) with a pinned header and independently scrollable panes (`lg:overflow-y-auto lg:overscroll-contain custom-scrollbar`).
   - Master-detail / split-workspace panels (`MarketingPage` Outreach, `RetensiCrm`, `Dashboard` Row 3, `AttendancePage` Policy) synchronize left/right heights (`items-stretch` + fixed desktop height) and paginate/bound long customer lists (10/20/50 per page) so whole-page infinite scroll never occurs.
   - Mobile (`< 1024px`) keeps forms in natural 1-column flow while bounding selectable queues and replacing native `<select>` dialogs with `CustomSelect`.
