# Architecture Memory

- **Monorepo Layout**:
  - `backend/`: Node.js Express REST API serving `/api` and static `/uploads`.
  - `frontend/`: React 18 SPA + Capacitor Android application (`id.yangversa.servio`).
  - `companion/`: Dedicated lightweight technician web/mobile portal.
- **Client Deployment**:
  - Web ERP accessed via desktop/tablet browsers.
  - Native Android APK compiled via Capacitor Gradle toolchain (`frontend/android`).
- **Data Synchronization**:
  - Online operations communicate directly with staging server `https://staging.101.32.127.55.sslip.io/api`.
  - Client utilizes IndexedDB `offlineDataStore` for SWR caching of GET requests.
  - Native Android Capacitor app purges PWA service workers on startup to prevent fetch interception.
- See related details in `mem:tech_stack` and `mem:database`.
