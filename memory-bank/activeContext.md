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
- Keep Serena MCP configured via stdio with `--context ide --project /run/media/bleu/DATA/dev/yvs` for zero-idle overhead.
- Maintain IndexedDB offline caching with strict staging fallback.
- Retain official YVS brand styling across mobile launcher icons.

## Next Steps
- Verify Serena MCP connectivity in Cline, Roo-Cline, and Antigravity.
- Periodically validate memory referential integrity using `serena memories check`.
