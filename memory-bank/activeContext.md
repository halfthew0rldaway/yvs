# Active Context: Yangversa Computer (YVS)

## Current Focus & Status
- **Recent Milestones Completed**:
  1. Attendance GPS Location & Geofence Accuracy resolved (500m Pekayon radius with high-accuracy position acquisition).
  2. Offline Banner Bug Fixed: Service Worker interception in Capacitor resolved, banner layout converted to in-flow, completely hidden when online.
  3. Universal Invoice & Document Printing: Native `AndroidPrinter` bridge implemented with Android Print Spooler and FileProvider PDF sharing.
  4. App Branding: Official Yangversa logo (`logo-yangversa.png`) deployed across all Android adaptive icon densities, legacy icons, splash screens, and PWA manifests.
  5. AI Workflow Setup: Integration of Serena MCP, Cline Memory Bank, and root `AGENTS.md` for symbol navigation and persistent project context.
  6. QA & Test Architecture: Authored comprehensive White Box (45 scenarios) and Black Box (60 scenarios) test documentation and test summary under `docs/testing/`.
  7. Continuous Form & Half-A4 Horizontal Layout: Redesigned Invoice (`InvoiceModal`, `InvoiceDetail`) and BPBS (`BpbsPrintModal`) into packed, high-density landscape A5/half-A4 continuous form formats.

## Active Decisions
- Keep Serena MCP configured via stdio with `--context ide --project /run/media/bleu/DATA/dev/yvs` for zero-idle overhead.
- Maintain IndexedDB offline caching with strict staging fallback.
- Retain official YVS brand styling across mobile launcher icons.

## Next Steps
- Verify Serena MCP connectivity in Cline, Roo-Cline, and Antigravity.
- Periodically validate memory referential integrity using `serena memories check`.
