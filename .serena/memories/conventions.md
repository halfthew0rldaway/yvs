# Code Conventions & Invariants

- **Backend**:
  - Always use CommonJS syntax (`require`/`module.exports`).
  - Keep controllers lean; sanitize inputs with `express-validator` and custom middleware.
  - Return standardized JSON responses: `{ success: true, data: ... }` or `{ success: false, message: ... }`.
  - Record audit trails via `activityLogger` middleware.

- **Frontend**:
  - Always use ES Modules syntax (`import`/`export`).
  - Network calls must route through `src/services/api.js`.
  - Use `AppConfig.apiBaseUrl` from `src/services/config.js` for base URL resolution.
  - Never register Service Workers inside Capacitor Android WebView.
  - Preserve visual design: Tailwind CSS utility classes, glassmorphic modals (`modal-sheet-enter`, `modal-backdrop`), and brand colors (`#2563eb`, `#1e293b`).
  - Printing must call `DocumentPrintService.printOrShareDocument()`.
- See related details in `mem:architecture`.
