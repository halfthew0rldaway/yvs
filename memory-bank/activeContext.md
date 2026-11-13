# Active Context: Yangversa Computer (YVS)

## Current Focus & Status
- **Recent Milestones Completed**:
  1. Attendance GPS Location & Geofence Accuracy resolved (500m Pekayon radius with high-accuracy position acquisition).
  2. Offline Banner Bug Fixed: Service Worker interception in Capacitor resolved, banner layout converted to in-flow, completely hidden when online.
  3. Universal Invoice & Document Printing: Native `AndroidPrinter` bridge implemented with Android Print Spooler and FileProvider PDF sharing.
  4. App Branding: Official Yangversa logo (`logo-yangversa.png`) deployed across all Android adaptive icon densities, legacy icons, splash screens, and PWA manifests.
  5. AI Workflow Setup: Integration of Serena MCP, Cline Memory Bank, and root `AGENTS.md` for symbol navigation and persistent project context.
  6. QA & Test Architecture: Authored comprehensive White Box (55 scenarios) and Black Box (50 scenarios) test documentation under `docs/testing/`, and built 36 passing unit tests under `backend/tests/unit/`.
  7. Continuous Form & Half-A4 Horizontal Layout: Redesigned Invoice (`InvoiceModal`, `InvoiceDetail`) and BPBS (`BpbsPrintModal`) into packed, high-density landscape A5/half-A4 continuous form formats.
  8. Mobile PWA & Web UX Fixes: Fixed quick registration modal scroll lock via `modal-body` & `modal-footer` refactoring, resolved Chrome mobile font boosting with `text-size-adjust: 100%`, normalized custom select dropdowns, and fixed CRM floating bubble z-index layering.

## Active Decisions
- Customer self-registration uses one reusable poster QR pointing to `/tracking/register`. Public submissions enter a review queue, with rate limiting, honeypot, field validation, and one pending record per normalized phone. Staff with `tickets.intake` accepts or rejects; acceptance atomically creates or links Customer/Perangkat and makes the complaint/expectation available for ticket intake. No public form action creates canonical customer/device or ticket data.
- The public intake form spans the available width on desktop and uses tappable device-category cards. Serial number is never accepted from the public form; staff can enter it during review before acceptance creates or reuses a device.
- Intake form loads the technician picker only with `tickets.assign`; the backend independently rejects assignment on create without that grant. The QR URL uses the public staging origin in Capacitor, and the web origin in a browser.
- RBAC navigation and API checks now use permission codes rather than legacy role names. `/auth/me` refreshes the page guard; manage permissions derive the read grants needed for their forms. Super Admin alone manages users and roles.
- Ticket ownership uses `tickets.view_all`; self-claiming uses `tickets.claim`; dashboard financial data uses `dashboard.report`. Ticket update fields and status changes are checked separately. Attendance exemptions use `attendance.exempt` role grants.
- The RBAC seed preserves edited permissions and user assignments on subsequent runs. Realtime events require authentication and fresh database authorization, and memo targets are loaded from the role table.
- Login and unknown-route navigation select the first permitted module page. New module implementations add their landing route and sidebar item once; Super Admin then creates roles without role-specific code.
- Removed the fictional H. Bambang quick-fill credential from Login and its legacy alias from authentication. Local database inspection found no matching account; exact logins remain unchanged, while leadership aliases use Arni then Vivero.
- Staging deployment runs through a push to the `staging` branch. Backend startup now refuses schema changes that require data loss, seeds modular RBAC after owner bootstrap, and preserves existing owner passwords during routine deploys.
- The correction-only attendance role now has its own staff picker and modal, while payroll remains gated by `attendance.review`. Invoice report and create controls require their own grants; brand creation follows `inventory.manage`.
- PWA launch resolves a fresh permitted landing page from `/`; Capacitor back uses the same landing page. Mobile bottom tabs are selected from granted modules. Offline route access uses last validated grants with an unexpired JWT, and reconnected sessions refresh grants and purge user data caches after revocation.
- RBAC audit fixed assignment of unclaimed tickets by `tickets.assign` without `tickets.view_all` and made exact login identities take precedence over legacy aliases. Notifications now track reads per user through `NotificationRead`; the local migration and two-recipient check passed.
- Super Admin transfer now has password reconfirmation, typed target confirmation, transactional audit, and last-admin locks; another admin's password cannot be reset in User Management. Database export and maintenance are separate grants, with demo seeding Super Admin only. Repair notes have user/ticket-scoped local drafts for manual submission after reconnect; legacy queued writes are not replayed automatically.
- Keep Serena MCP configured via stdio with `--context ide --project /run/media/bleu/DATA/dev/yvs` for zero-idle overhead.
- Maintain IndexedDB offline caching with strict staging fallback.
- Retain official YVS brand styling across mobile launcher icons.

## Next Steps
- Apply the modular RBAC Prisma migration and run `npm run seed:rbac` in each environment before deploying the permission-aware backend.
- Periodically validate memory referential integrity using `serena memories check`.
