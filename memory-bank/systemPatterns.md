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
