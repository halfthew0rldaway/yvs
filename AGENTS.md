# AGENTS.md — Developer & AI Agent Context Guide

> **Yangversa Computer (YVS) Management & ERP System**  
> **Repository Root:** `/run/media/bleu/DATA/dev/yvs`  
> **Last Updated:** 2026-11-10  
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
├── backend/                     <-- Express.js API & Prisma
│   ├── prisma/
│   │   └── schema.prisma        <-- 25+ models database schema
│   ├── scripts/                 <-- Database normalization, seeding & maintenance
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

---

## 5. Core Database Models & Relationships

Key entities defined in `backend/prisma/schema.prisma`:

| Model | Purpose | Key Relations & Invariants |
| :--- | :--- | :--- |
| **`User`** | System staff & technicians | Roles: `admin`, `teknisi`, `pimpinan`. Links to tickets, attendances, leave requests. |
| **`Customer`** | Client directory & CRM | Phone (`nomor_telepon`), personality type (`tipe_kepribadian`), custom badges. Has many `Perangkat`. |
| **`Perangkat`** | Customer physical hardware | Category (`jenis_perangkat`), brand, model, serial number. Belongs to `Customer`, has many `TiketServis`. |
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
