# AGENTS.md — Developer & AI Agent Context Guide

> **Yangversa Computer (YVS) Management & ERP System**  
> **Repository Root:** `/run/media/bleu/DATA/dev/yvs`  
> **Last Updated:** 2026-11-13
> **Purpose:** Authoritative reference for autonomous and AI-assisted development (Antigravity, Cline, Roo-Cline, Cursor, etc.). All information in this document is derived strictly from the actual codebase.

---

## 1. Project Overview & Architecture

Yangversa Computer (YVS) is an integrated ERP, service workshop management, CRM, and HR attendance system designed for computer and electronics repair operations.

The system is organized as a high-cohesion, multi-tier application:

```
[ Client Layer ]
  ├── Web ERP (Desktop / Tablet)   ──> React 18 + Vite + Tailwind CSS
  ├── Mobile App (Android APK)     ──> Capacitor 7 (id.yangversa.servio) + Native Bridges
  └── Mobile Companion (Technician)──> React 18 + Tailwind CSS / Capacitor

[ API & Gateway Layer ]
  └── Express.js REST API (port 5000)
        ├── Helmet & Rate Limiting
        ├── Activity Logger & Request Sanitizer
        ├── JWT Authentication & Role Authorization (admin, teknisi, pimpinan)
        └── Static Media Engine (/uploads)

[ Persistence Layer ]
  ├── MySQL / MariaDB via Prisma ORM v6
  └── Client-Side Offline Engine: IndexedDB (offlineDataStore) & Offline Queue Manager
```

### Key Technical Environments & URLs
- **Staging API Endpoint:** `https://staging.101.32.127.55.sslip.io/api`
- **Staging Web App:** `https://staging.101.32.127.55.sslip.io/dashboard`
- **Capacitor Mobile Package ID:** `id.yangversa.servio`
- **Database Engine:** MySQL via Prisma (`backend/prisma/schema.prisma`)

---

## 2. Tech Stack Reference

### Backend (`/backend`)
- **Runtime:** Node.js (CommonJS modules: `require` / `module.exports`)
- **Web Framework:** Express.js `^4.21.2`
- **ORM / Database:** Prisma `^6.6.0` with MySQL provider
- **Authentication:** `jsonwebtoken` (JWT, 30d expiry), `bcrypt` password hashing
- **Security & Networking:** `helmet`, `cors`, `compression`, `express-rate-limit`, `express-validator`
- **File Uploads:** `multer` storing into `backend/uploads/`
- **PDF & Formatting:** Dynamic HTML-to-Canvas / Print Spooling adapters
- **Testing Engine:** Node.js native test runner (`node --test`), fast in-memory execution, zero heavy dependencies

### Frontend (`/frontend`)
- **Runtime & Bundler:** Vite `^6.4.3` (ES Modules: `import` / `export`)
- **Framework:** React 18 (`react`, `react-dom`, `react-router-dom` v6)
- **Styling:** Tailwind CSS + custom glassmorphism & modal utility classes in `index.css`
- **Icons & Motion:** `lucide-react`, `framer-motion`, `lottie-react`
- **Printing & Export:** `jspdf`, `html2canvas`, native `AndroidPrinter` JavascriptInterface
- **State & Data:** Axios client with custom interceptors (`src/services/api.js`), SWR IndexedDB caching (`src/services/offlineDataStore.js`), offline synchronization (`src/services/offlineSyncManager.js`)
- **Mobile Runtime:** Capacitor 7 (`@capacitor/core`, `@capacitor/android`, `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/bluetooth-le`, `@capacitor/share`, `@capacitor/status-bar`)

---

## 3. Directory & Folder Structure

```
/run/media/bleu/DATA/dev/yvs
├── AGENTS.md                    <-- This file (authoritative project guide)
├── .clinerules                  <-- Instructions for Cline / Roo-Cline agents
├── memory-bank/                 <-- Persistent memory bank for Cline / Roo-Cline
├── .serena/                     <-- Serena MCP configuration, cache & project memories
│   ├── project.yml              <-- Project definition (LSP TypeScript enabled)
│   └── memories/                <-- Semantic project knowledge graph (mem:core, etc.)
│
├── docs/                        <-- Quality assurance & system documentation
│   └── testing/                 <-- Test suites, test scenarios & verification reports
│       ├── black-box-test-cases.md
│       ├── white-box-test-cases.md
│       ├── test-summary.md
│       └── test-execution-report.md
│
├── backend/                     <-- Express.js API & Prisma
│   ├── prisma/
│   │   └── schema.prisma        <-- 25+ models database schema
│   ├── scripts/                 <-- Database normalization, seeding & maintenance
│   ├── tests/                   <-- Automated unit test suites (node --test)
│   │   └── unit/                <-- 36 automated unit tests across 6 domain suites
│   ├── src/
│   │   ├── app.js               <-- Express entrypoint & middleware pipeline
│   │   ├── config/              <-- Database & system configuration
│   │   ├── controllers/         <-- 22 controllers handling business domains
│   │   ├── middleware/          <-- Auth, roles, rateLimiter, sanitizeRequest, activityLogger
│   │   ├── routes/              <-- Express router definitions
│   │   ├── services/            <-- Realtime SSE & background helper routines
│   │   └── utils/               <-- Standard response helpers, formatters
│   └── uploads/                 <-- Media, photos, tickets, diagnosis attachments
│
├── frontend/                    <-- Main React ERP Web & Capacitor App
│   ├── android/                 <-- Android Studio / Gradle project for APK
│   │   └── app/src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/.../MainActivity.java <-- Native AndroidPrinter & window inset handling
│   │       └── res/             <-- Launcher icons & splash screens
│   ├── public/                  <-- Favicon, logo-yangversa.png, PWA icons
│   ├── src/
│   │   ├── components/          <-- Shared UI, Modals, PrintModals, ConnectivityBanner
│   │   ├── hooks/               <-- useAuth, useConnectivity, useDevice, useRealtime, useIdleTimer
│   │   ├── pages/               <-- 20+ feature pages (tiket-servis, diagnosis, invoice, attendance, etc.)
│   │   ├── services/            <-- api.js, config.js, connectivity.js, documentPrintService.js, offlineDataStore.js
│   │   └── utils/               <-- authStorage.js, checklistItems.js, mediaUtils.js
│   ├── vite.config.js           <-- Vite bundler config with custom chunking & PWA setup
│   └── capacitor.config.json    <-- Capacitor mobile bridge configuration
│
└── companion/                   <-- Technician companion mobile/web interface
    └── src/                     <-- Focused lightweight technician portal
```

---

## 4. Coding Conventions & Invariants

1. **Module Systems**:
   - Backend: strictly **CommonJS** (`require` / `module.exports`).
   - Frontend & Companion: strictly **ES Modules** (`import` / `export`).

2. **API Communication**:
   - All frontend network requests must go through `src/services/api.js`.
   - Never hardcode IP addresses or API URLs in components; use `AppConfig.apiBaseUrl` from `src/services/config.js`.
   - GET requests are automatically cached into IndexedDB (`offlineDataStore`) for offline browsing, and mutations (POST/PUT/PATCH/DELETE) automatically invalidate associated cache tags.

3. **Capacitor & Android Native Safety**:
   - Never register PWA Service Workers inside native Android Capacitor WebView. Service workers inside Capacitor hijack native fetch calls and return `no-response` network errors.
   - PWA Service Workers are strictly gated for standard browser mode (`!Capacitor.isNativePlatform()`).
   - Android printing must use `DocumentPrintService.printOrShareDocument()`, which delegates to `window.AndroidPrinter` on Android or `window.print()` / jsPDF on desktop.

4. **UI & Theme Rules**:
   - Primary Brand Color: `#2563eb` (Tailwind `blue-600`)
   - Dark Slate Neutral: `#1e293b` (Tailwind `slate-800` / `slate-900`)
   - Accent Warning: `#f59e0b` / Amber
   - Maintain consistent border styling (`border-slate-200`, `rounded-xl`, `shadow-2xs`).
   - Never degrade, break, or unnecessarily alter existing UI layouts, modal transitions, or responsive behavior.

5. **Modal Architecture & Mobile Responsiveness Invariants**:
   - **Modal Shell & Stacking**: All modals must use `.modal-shell` with `z-[100]`. Critical security modals (e.g. `ReloginModal`, `SessionWarningModal`) use `z-[9998]` / `z-[9999]`.
   - **Scrollable Form Rule**: Any modal containing forms must be structured with:
     1. Pinned header: `<div className="modal-header shrink-0 ...">`
     2. Form shell: `<form className="flex flex-col flex-1 min-h-0 overflow-hidden">`
     3. Scrollable body: `<div className="modal-body overflow-y-auto flex-1 custom-scrollbar">`
     4. Pinned footer: `<div className="modal-footer shrink-0 ...">`
     Never place bare unconstrained forms inside `.modal-panel` without `overflow-y-auto`, or fields will get clipped on mobile viewports.
   - **Z-Index Layering Hierarchy**:
     - System Modals / Overlays: `z-[100]` to `z-[9999]`
     - Floating CRM Bot: `z-[35]`
     - Mobile Bottom Navigation: `z-30`
     - Global Header / App Bar: `z-10`
   - **Mobile Web Typography & Select Normalization**:
     - `-webkit-text-size-adjust: 100%` and `text-size-adjust: 100%` on `html`, `body`, inputs, and buttons to prevent mobile Chrome's text auto-inflation (font boosting) from bloating UI elements.
     - Standard inputs: `0.8125rem` (13px) on mobile, `0.875rem` (14px) on desktop.
     - Standard buttons: `.btn-base`, `.btn-primary`, `.btn-secondary`, `.btn-danger` set to `h-8.5 sm:h-9 px-3 sm:px-3.5 text-xs` to stay proportional with 13px inputs.
     - **PWA Custom Dropdown (`CustomSelect`)**: Replaces native Android OS-level `<select>` radio dialogs with a modern Bottom Sheet Picker on mobile (< 640px) and animated popover on desktop, featuring live search and active indicators.

6. **Continuous Form & Dot Matrix Printing Standards**:
   - Official invoice layouts are packed horizontally (`80mm` / half A4 continuous form format) for fast dot matrix continuous feeding without excessive white space.
   - BPBS intake receipts are designed for horizontal A5 format.

---

## 5. Core Database Models & Relationships

Key entities defined in `backend/prisma/schema.prisma`:

| Model | Purpose | Key Relations & Invariants |
| :--- | :--- | :--- |
| **`User`** | System staff & technicians | `User.role` is a legacy display/default slug; effective access comes from assigned `UserRole` records and permission grants. Links to tickets, attendances, leave requests. |
| **`Role` / `Permission`** | Modular RBAC | Super Admin composes custom roles from code-owned action permissions; users may hold multiple roles through `UserRole`. |
| **`Customer`** | Client directory & CRM | Phone (`nomor_telepon`), personality type (`tipe_kepribadian`), custom badges. Has many `Perangkat`. |
| **`Perangkat`** | Customer physical hardware | Category (`jenis_perangkat`), brand, model, serial number. Belongs to `Customer`, has many `TiketServis`. |
| **`CustomerRegistration`** | Public customer intake queue | Stores customer/device details and visit complaint/expectation until staff accepts or rejects. Accepted submissions link to canonical Customer, Perangkat, and optionally a ticket. Legacy invite fields are retained for migration safety but are no longer used by the form. |
| **`TiketServis`** | Service ticket intake & lifecycle | Status: `diterima` -> `didiagnosis` -> `menunggu_persetujuan` -> `disetujui` -> `dalam_perbaikan` -> `selesai` -> `diambil` -> `dibatalkan`. Contains photo JSON arrays (`foto_kondisi`, `foto_diagnosis`, `foto_selesai`, `foto_handover`). |
| **`Diagnosis`** | Technical assessment | Belongs to `TiketServis`. Stores findings, estimated cost, parts needed. |
| **`LogPerbaikan`** | Action timeline of repair | Technicians log actions taken, tests performed. |
| **`Sparepart`** | Inventory & replacement parts | SKU, part name, stock, cost price, selling price, supplier links, minimum stock alert. |
| **`PenggunaanSparepart`**| Parts billed to ticket | Links `TiketServis` and `Sparepart`, auto-deducts inventory upon dispatch. |
| **`Invoice`** | Customer billing & warranty | Belongs to `TiketServis`. Subtotal, discount, DP, payment method, tax, warranty duration. |
| **`StaffSignature`** | Digital signatures & stamps | Vector/base64 signature stamps for official invoices and BPBS. |
| **`AttendanceRecord`** | Staff GPS Presensi & Geofence | Pekayon workshop coordinates (`-6.26064, 106.98744`), 500m radius validation, selfie photo verification, external duty reason. |
| **`SupplierRma`** | Defective component return | Manages parts returned to vendor/supplier with tracking and replacement status. |
| **`RepairWiki`** | Knowledge base | Solved repair procedures, symptom patterns, schematic notes. |

---

## 6. Critical Business Workflows

### Customer Self-Registration Before Intake
The reusable poster QR points to `/tracking/register` and can serve every walk-in customer; the page is not linked from the tracking landing page. The QR URL itself is public and shareable, so abuse protection comes from public submission rate limiting, a honeypot, one pending submission per normalized phone, strict validation, and staff review. Submissions first enter `CustomerRegistration`; they do not create Customer, Perangkat, or a ticket. Staff with `tickets.intake` reviews the details in the new-ticket page and accepts or rejects. Accepting atomically links an existing phone or creates a Customer, then reuses a matching serial-numbered device or creates a Perangkat. Staff then completes ticket intake; the expectation is copied to `TiketServis.harapan_pelanggan`.
The customer form uses a wide responsive layout with device-category cards. Customers do not enter serial numbers; intake staff record a serial number during review before the device is saved.
The technician picker is available only with `tickets.assign`; an intake-only role can still load customers/devices and create an unassigned ticket.

### 1. Service Ticket Lifecycle (`TiketServis`)
1. **Intake (`diterima`)**: Frontman/Admin registers customer, device (`Perangkat`), complaints (`keluhan`), accessories checklist (`kelengkapan_detail`), and intake photos (`foto_kondisi`). System generates unique `nomor_tiket` and printable intake receipt (BPBS).
2. **Diagnosis (`didiagnosis`)**: Assigned technician inspects hardware, takes technical photos (`foto_diagnosis`), records diagnostic results and cost estimates.
3. **Approval (`menunggu_persetujuan` -> `disetujui`)**: Customer confirms quotation.
4. **Repair & Parts (`dalam_perbaikan`)**: Technician works on unit, records parts used (`PenggunaanSparepart` which deducts from `Sparepart` stock), and logs progress in `LogPerbaikan`.
5. **Quality Control (`selesai`)**: Technician performs rigorous hardware checklist (display, ports, keyboard, audio, temps), attaches completion photos (`foto_selesai`), and marks ticket complete.
6. **Invoicing & Handover (`diambil`)**: System generates `Invoice`, calculates discounts/DP, applies digital stamp & signature, prints official invoice via `AndroidPrinter` / jsPDF, and takes handover photo (`foto_handover`).

### 2. Geofenced Staff Attendance
- **Registered Workshop Location**: Jl. Raya Pekayon No. 25, RT.004/RW.001, Pekayon Jaya, Bekasi Selatan (`-6.26064, 106.98744`).
- **Geofence Radius**: Exact **500 meters**.
- **On-Site Flow**: User within 500m takes live selfie -> attendance accepted normally.
- **External Flow**: User outside 500m must supply specific external task reason (e.g. part procurement, on-site client visit).
- **Validation**: Strict high-accuracy GPS with freshness check to prevent false out-of-bounds readings.

### 3. CRM & Maintenance Recall
- Automated retention engine monitors devices 180 to 365+ days after completion.
- Provides direct WhatsApp templates tailored for maintenance checks (thermal paste replacement, internal dust cleaning, fan servicing).

### 4. Modular Access Control
- Authorization is permission-based (`module.action`) and is enforced server-side; hiding an interface item is not authorization.
- Super Admin alone manages users, roles, and permission assignments. Keep at least one designated Super Admin to prevent lockout.
- Ticket capability is stage-specific: `tickets.intake`, `tickets.assign`, `tickets.diagnosis`, `tickets.repair`, `tickets.qc`, `tickets.approval`, and `tickets.handover`. Ticket workflow validation remains mandatory.
- The web PWA and Capacitor Android app use the same permission-aware routes and navigation. PWA launch enters `/` and resolves a fresh permitted landing page; Android back treats that page as the app root. Mobile tabs select from granted modules, with the drawer retaining the complete permitted menu.
- Offline browsing uses the last validated grants only while the browser reports offline and the JWT is unexpired. When connectivity returns, refresh grants and clear user-scoped cached data after revocation. Queued writes remain subject to backend authorization and are discarded on 401/403.
- `tickets.assign` permits delegation of an unclaimed ticket without requiring `tickets.view_all`; reassignment of a ticket outside the user's visible scope remains blocked. Login resolves an exact username or email before legacy account aliases.
- The fictional H. Bambang demo login and `bambang` legacy alias are removed. Leadership aliases fall back to Arni or Vivero; exact staff usernames and emails still take precedence.
- Role and global notifications use `NotificationRead` records keyed by user and notification, so one recipient's read action does not clear another recipient's unread state. The legacy `Notification.is_read` flag remains for historical read records.
- Super Admin designation changes require the acting Super Admin's password and a typed target username. Promotion and demotion are audited in the same transaction, and administrator row locks protect the final Super Admin from concurrent removal. Other Super Admins cannot reset each other's passwords through User Management.
- `system.database` permits statistics and export; `system.database_maintain` permits normalization and old-log cleanup and derives export access. Demo-data seeding requires Super Admin. Run the RBAC seed after deploying a new capability.
- Offline repair notes are seven-day text drafts scoped to the signed-in user and ticket. They require explicit online submission, current server permission, and an open assigned ticket. Photos, ticket state changes, invoice/payment actions, and other privileged writes are never replayed automatically. Local drafts and any legacy queue entries are cleared on logout or permission revocation.
- Sidebar, page routes, and API routes use the same permission codes. Protected pages refresh `/auth/me` on navigation; the backend resolves grants from the database on every request. Selected manage/action permissions imply their module's view permission, and form dependencies are derived in `backend/src/config/permissions.js`.
- User and role administration remains Super Admin only; its reserved permission codes are not offered in the assignable role catalog.
- Ticket visibility is explicit: `tickets.view_all` opens all tickets; without it, `tickets.view` is limited to the user's assignments and unassigned active tickets. `tickets.claim` permits claiming an unassigned ticket for oneself, while `tickets.assign` permits assignment to another user. Ticket update fields and status transitions each require their corresponding capabilities.
- `dashboard.report` protects business and revenue data separately from `dashboard.view`. `attendance.exempt` is an explicit role grant for staff excluded from attendance monitoring; Super Admin bypass alone does not grant an exemption.
- `attendance.adjust` opens a narrow correction screen and staff-name picker without `attendance.review`; payroll monitoring still requires the separate review grant. `invoices.report` controls the financial report widgets and API, while `invoices.manage` controls invoice creation.
- Brand creation is an inventory management action (`inventory.manage`). The legacy `system.settings` capability is hidden from the role editor until a dedicated settings feature exists.
- New roles are created and assigned by Super Admin in the UI. To add a new module such as Marketing, implement its pages and API routes, register its action codes in `backend/src/config/permissions.js`, enforce them on the server and page routes, then Super Admin can compose Marketing roles without code changes for role names.
- Register each new module's first accessible page in `frontend/src/utils/landingRoute.js` and its sidebar entry in `frontend/src/components/Layout.jsx`; users without dashboard access then land on a page they can actually open after login.
- Run `backend/scripts/seed-rbac.js` after registering new capability codes. It adds newly introduced defaults once and preserves later Super Admin edits, revocations, user-role assignments, and Super Admin designations. The initial designation requires `SUPER_ADMIN_EMAIL` when none exists.
- Staging startup uses a no-data-loss Prisma schema sync because its database predates migration history, then seeds RBAC after owner bootstrap. Startup fails if schema sync or RBAC bootstrap fails. Routine staging deploys preserve existing owner passwords; rotation requires `ROTATE_STAGING_OWNER_PASSWORDS=true`.
- The realtime stream requires authentication and checks current database grants before delivering each event. Notification recipients use assigned role slugs or a user ID, and memo recipients come from the role table.

---

## 7. Guidelines for AI Agents

To maximize speed, maintain context, and avoid breaking production code:

1. **Read First, Scan Never**:
   - Always consult `AGENTS.md` and the `memory-bank/` before scanning files.
   - Do **NOT** run full-repository recursive file searches or read massive directories repeatedly.
2. **Use Serena for Semantic Code Navigation**:
   - Use Serena MCP tools (`find_symbol`, `find_referencing_symbols`, `get_symbols_overview`, `read_memory`) to jump directly to exact functions, controllers, or classes without opening irrelevant files.
3. **Preserve Architecture & UI/UX**:
   - Never replace or simplify existing UI components with generic placeholders.
   - Respect established mobile Capacitor patterns and web styling conventions.
4. **Synchronize Documentation**:
   - When introducing or altering business models, routes, or workflows, update `AGENTS.md`, `memory-bank/activeContext.md`, and `memory-bank/progress.md`.

---

## 8. Testing & Quality Assurance

The codebase includes comprehensive White Box & Black Box test coverage designed for rapid manual and automated execution:

### Automated Unit Test Suites (`backend/tests/unit/`)
Tests run using the native Node.js test runner with zero extra dependencies:
```bash
# Run all unit tests
cd backend && node --test tests/unit/*.test.js
```

Covered Domain Test Suites (36/36 passing):
1. **`WB-AUT`**: JWT authentication validation, expiry codes, tampered signatures, and permission-based authorization independent of role names.
2. **`WB-DIA`**: Technician diagnosis input sanitization, non-negative cost enforcement, and error-free `LogPerbaikan` note formatting.
3. **`WB-FIN`**: Multi-item sparepart summation, negative service fee prevention, DP / discount calculations, and remaining balance clamps.
4. **`WB-GEO`**: Haversine distance math, exact 500m geofence checks, anti-spoofing accuracy buffers (capped at 200m), and late check-in detection at 09:16 WIB.
5. **`WB-SEC`**: Null-byte stripping, whitespace trimming, Indonesian phone normalization (`+62` -> `08...`), and uppercase formatting for ticket numbers.
6. **`WB-SLA`**: Priority vs regular SLA target scheduling, warranty period math (30d, 1m, 1y), and overdue / paused status detection.
7. **`WB-STA`**: Ticket service state machine transitions, role gatekeeping, QC prerequisites for handover, and active loaner blocking.

### Specification & Planning Deliverables (`docs/testing/`)
- **`white-box-test-cases.md`**: 55 white-box test specifications covering backend controllers, services, middleware, and business logic.
- **`black-box-test-cases.md`**: 50 black-box scenarios covering customer journey, device intake, diagnosis, repair, invoicing, offline mode, and usability.
- **`test-summary.md`**: High-level module coverage, critical paths, risk analysis, and regression checklists.
- **`test-execution-report.md`**: Detailed execution log, pass/fail results, and verification benchmarks.
