# Changelog — Yangversa Computer (YVS / Serv.io)

All notable changes to the **YVS Computer ERP, Public Tracking Portal, Web PWA, and Capacitor Android App** are documented in this file.

This project follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):
- **Single Source of Truth for App Version:** `frontend/package.json` (`version`) and `backend/package.json` (`version`).
- **Automated Wiring:**
  - Web / PWA reads `__APP_VERSION__` from `frontend/package.json` at build time (`frontend/vite.config.js`) and displays it on `/download`.
  - Android APK (`frontend/android/app/build.gradle`) reads `versionName` from `frontend/package.json` and `versionCode` from `SERVIO_VERSION_CODE` (CI `github.run_number`).
  - Staging CI (`.github/workflows/deploy-staging.yml`) embeds `version` into `/downloads/servio-staging.json` alongside `commit` and `versionCode`.
- **Rule for Future Developers & AI Agents:** Before pushing a release or staging milestone, bump `version` in both `frontend/package.json` and `backend/package.json` and prepend a dated entry here summarizing added features, fixes, and verification status.

---

## [1.1.1] - 2026-11-27

### Added
- **Field-Ready QR Sticker Labels (`TicketQrModal.jsx`)**:
  - Added customer WhatsApp number (`perangkat.customer.nomor_telepon`) with an interactive **`No. WA: Tampil / Sembunyi`** toggle (default ON) across all 5 thermal sizes (`50x30`, `60x40`, `80x50`, `100x75`, `Struk 58/80 mm`) so workshop staff can contact owners immediately even when scanners or ERP are offline.
  - Added priority badges (`EXP` / `EXPRESS` for express SLA, `KLAIM` for warranty claim), concise deposited accessories summary (`kelengkapan_detail` / `kelengkapan`), and short Serial Number (`SN`) without overflowing or altering physical mm label dimensions.
- **Ephemeral Client-Side QR Media Upload (`CameraScannerModal.jsx`, `Tracking.jsx`)**:
  - Added an **`Unggah Gambar QR`** tab (click gallery/file picker, drag-and-drop, and `Ctrl+V` clipboard paste) plus a 1-click fallback button when camera access is unavailable.
  - Decodes QR/barcodes 100% locally in temporary browser memory (`BarcodeDetector` + `html5-qrcode` `scanFile` with white-backed canvas normalization) and immediately clears temporary canvas/input buffers—**zero server upload and zero disk persistence**.
  - Updated `Tracking.jsx` QR URL parser (`extractTicketFromScan`) to also recognize `?search=` URLs from ERP-mode stickers alongside `?nomor_tiket=` and `?tiket=`.
- **Automated A-to-Z Business Flow E2E Verification (`backend/tests/e2e/business_flow_a2z.test.js`)**:
  - Added reusable `npm --prefix backend run test:flow` suite running real Express controllers end-to-end (Intake -> Diagnosis -> SLA Pause -> Public 4-digit WA ACC -> Atomic Sparepart Deduction -> QC/Loaner/Invoice Interlocks -> HPP-Safe Promo Invoice -> Sign-to-Unlock -> Handover -> Admin/Technician KPI Sync -> Warranty H-3 & 6-Month Recall -> Cancellation Stock/Promo Rollback).
- **Unified Semantic Version Tracking (`CHANGELOG.md`, `/download`, Android APK, Staging CI)**:
  - Exposed semantic version (`v1.1.1`) on `/download` for both Web PWA and downloadable staging APK, wired `build.gradle` `versionName` to `frontend/package.json`, and updated `.github/workflows/deploy-staging.yml` manifest generation.

### Fixed
- **Critical KPI Sync Bug (`tiket-servis.controller.js`)**: Preserved `completed_at` when transitioning normally from `selesai` to `diambil` (previously reset `completed_at = null`, silently dropping handed-over tickets from Admin `rataRataHari`, Technician `rataRataDurasiHari`, and `user.controller.js` `avgRepairHours`).
- **Live CSAT KPI Broadcast (`tracking.controller.js`)**: Broadcast `dashboard:refresh` when a customer submits a technician rating via `/tracking` so live dashboards refresh immediately.
- **Sparepart-to-Invoice Promo Recalculation (`sparepart.controller.js`)**: Recomputed linked promotion discounts via `calculatePromotionDiscount` when spareparts are added/removed on tickets that already have an invoice.
- **PWA APK Download Protection (`frontend/vite.config.js`)**: Added `/^\/downloads\//` to Workbox `navigateFallbackDenylist` so installed PWAs never intercept `/downloads/servio-staging.apk` with `/index.html`.
- **Android PWA Install & APK Delivery (`frontend/nginx.conf`, `frontend/vite.config.js`, `.github/workflows/deploy-staging.yml`)**: Served `/manifest.webmanifest` as `application/manifest+json` (previously `application/octet-stream`), added explicit `id: "/"`, `purpose: "any"`, and `Content-Disposition: attachment` for `.apk` downloads, plus cached `~/.android/debug.keystore` in staging CI for consistent APK upgrade signatures.
- **Mobile Capacitor HTTPS CORS & Login Fallback (`backend/src/app.js`, `auth.controller.js`, `frontend/src/pages/Login.jsx`)**: Allowed `https://localhost`, `https://127.0.0.1`, `ionic://localhost`, and `*.komputerawet.com` origins so Capacitor Android (`androidScheme: "https"`) login/API calls succeed instead of failing preflight with CORS 500, added `siti` -> `siti.admin` login alias + demo button alignment, and separated connection errors from invalid-credential alerts in `Login.jsx`.
- **Syntax Typo Guard (`TicketQrModal.jsx`)**: Removed accidental `DUHimport` prefix on line 1.

---

## [1.1.0] - 2026-11-26

### Added
- **Editorial Public Tracking Portal Redesign (`/tracking`)**:
  - Implemented Swiss-editorial hero with dot grid & hover/focus cobalt border beam, sticky 6-card transparent pricing deck (`TransparentPricingSection.jsx`), borderless GPU-composited 3D vertical review marquee with 16 authentic 5-star Google Maps reviews (`ProofReviewsStrip.jsx`, `VerticalMarquee.jsx`), interactive service catalog spotlight rail, and single-rail monumental footer mast.
  - Optimized 64px navbar logo (`frontend/public/logo-yangversa-64.png`, 866 B).

### Fixed
- **Tracking & Dashboard Performance + Accessibility**:
  - Eliminated `vendor-pdf` root preload, scroll-mount stampede, Lenis wheel hijacking, and idle GPU animation repaints (`99 Performance | 100 Accessibility | 100 Best Practices | 100 SEO` on staging `/tracking`).
  - Deferred `CrmFloatingBubble` (`framer-motion`), disabled blocking Recharts initial animations (`isAnimationActive={false}`), replaced Dashboard loading spinner with structural skeleton, and upgraded low-contrast muted labels to WCAG AA slate tokens.

---

## [1.0.0] - 2026-11-25

### Added
- Baseline Yangversa Computer (YVS / Serv.io) ERP, Workshop Ticket Lifecycle, Geofenced Attendance (500m Pekayon), Modular RBAC, 1-on-1 Staff Direct Chat, HPP-Safe Marketing & Campaign Notes, Maintenance Recall CRM, and Staging APK/PWA auto-deployment.
