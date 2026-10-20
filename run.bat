@echo off
chcp 65001 >nul
title Serv.io Platform (Backend + Frontend)

echo =========================================
echo    🚀 Menjalankan Serv.io Platform
echo =========================================

set ROOT_DIR=%~dp0

echo 📦 Menjalankan Backend (Port 5001)...
start "Serv.io Backend" cmd /k "cd /d %ROOT_DIR%backend && npm run dev"

echo 💻 Menjalankan Frontend (Port 3000)...
start "Serv.io Frontend" cmd /k "cd /d %ROOT_DIR%frontend && npm run dev"

echo.
echo ✨ Serv.io berjalan di jendela baru:
echo    - Frontend UI : http://localhost:3000
echo    - Backend API : http://localhost:5001
echo    - Public Track: http://localhost:3000/tracking
echo.
echo =========================================
pause

