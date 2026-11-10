# Technical Context: Yangversa Computer (YVS)

## Technology Stack

### Backend
- **Node.js**: v18+ (tested on v24.x and Linux x86_64)
- **Express.js**: `^4.21.2`
- **Prisma ORM**: `^6.6.0` (MySQL connector)
- **Database**: MySQL 8.0 / MariaDB
- **Authentication**: JWT with Bearer tokens stored in browser local storage / Capacitor Preferences
- **Key Modules**: `bcrypt`, `cors`, `helmet`, `compression`, `morgan`, `multer`, `express-rate-limit`, `express-validator`

### Frontend & Mobile
- **React**: 18.3.1
- **Vite**: 6.4.3
- **Tailwind CSS**: 3.4.17
- **Routing**: `react-router-dom` 6.28.0
- **Icons**: `lucide-react` 1.17.0
- **Charts**: `recharts` 3.8.1
- **Printing**: `jspdf` 4.2.1, `html2canvas` 1.4.1
- **Capacitor**: 7.6.10
  - App: `@capacitor/app`
  - Camera: `@capacitor/camera`
  - Geolocation: `@capacitor/geolocation`
  - Bluetooth: `@capacitor-community/bluetooth-le`
  - Haptics: `@capacitor/haptics`
  - Keyboard: `@capacitor/keyboard`
  - Share: `@capacitor/share`
  - StatusBar: `@capacitor/status-bar`

## Local Development & Commands

```bash
# Backend
cd backend
npm install
npm run dev        # Starts Express on http://localhost:5000 with node --watch

# Frontend
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
npm run build      # Compiles production distribution to frontend/dist

# Capacitor Android
cd frontend
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# Generated APK: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## Hardware & Android 16 Invariants
- Android Inset Padding: `MainActivity.java` dynamically applies WindowInsets listeners to prevent WebView content from clipping into system status bars, navigation bars, or display cutouts.
- High-Accuracy GPS: Requires `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` in AndroidManifest.xml.
