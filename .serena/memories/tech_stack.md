# Tech Stack & Runtime Constraints

- **Backend Stack**:
  - Node.js with CommonJS module system (`require` / `module.exports`).
  - Express.js `^4.21.2` with Helmet, CORS, Morgan, Compression, and express-rate-limit.
  - Prisma Client `^6.6.0` connecting to MySQL/MariaDB datasource.
  - Authentication via JWT (`jsonwebtoken`) and passwords hashed with `bcrypt`.
- **Frontend Stack**:
  - React 18 with ES Modules (`import` / `export`).
  - Vite `^6.4.3` bundler with `@vitejs/plugin-react` and `vite-plugin-pwa` (`injectRegister: null`).
  - Tailwind CSS 3.4 for styling, `lucide-react` for icons, `framer-motion` for transitions.
  - Axios with custom request/response interceptors for auth headers and SWR caching.
- **Mobile Stack (Android Capacitor)**:
  - Capacitor 7 with native plugins (`@capacitor/camera`, `@capacitor/geolocation`, etc.).
  - Custom Java Bridge: `AndroidPrinter` JavascriptInterface in `MainActivity.java` hooking into Android Print Spooler.
  - Launch icon: Official YVS logo configured in `mipmap-*/ic_launcher*` with safe-zone ratio 0.62.
- See related details in `mem:conventions`.
