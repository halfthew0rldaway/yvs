#!/usr/bin/env bash

# Script untuk menjalankan backend dan frontend Serv.io secara bersamaan
# Penggunaan: ./run.sh atau bash run.sh

echo "========================================="
echo "   🚀 Menjalankan Serv.io Platform"
echo "========================================="

# Direktori proyek root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Fungsi untuk mematikan kedua proses saat Ctrl+C ditekan
cleanup() {
    echo ""
    echo "🛑 Menghentikan backend dan frontend..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    wait "$BACKEND_PID" 2>/dev/null
    wait "$FRONTEND_PID" 2>/dev/null
    echo "✅ Semua proses berhasil dihentikan."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 0. Pastikan database terisi (auto-seed jika kosong)
echo "🔍 Memeriksa status database..."
cd "$DIR/backend" || exit 1
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => {
    if (count === 0) {
      console.log('🌱 Database kosong, menjalankan seed otomatis...');
      require('./seed.js');
    } else {
      console.log('✅ Database siap (' + count + ' pengguna terdaftar).');
      process.exit(0);
    }
  })
  .catch(err => {
    console.log('⚠️ Peringatan koneksi DB:', err.message);
    process.exit(0);
  });
" 2>/dev/null

echo "📦 Menjalankan Backend (Port 5001)..."
cd "$DIR/backend" || exit 1
npm run dev &
BACKEND_PID=$!

# 2. Jalankan Frontend
echo "💻 Menjalankan Frontend (Port 3000)..."
cd "$DIR/frontend" || exit 1
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✨ Backend & Frontend sedang berjalan:"
echo "   - Frontend UI : http://localhost:3000"
echo "   - Backend API : http://localhost:5001"
echo "   - Public Track: http://localhost:3000/tracking"
echo ""
echo "Tekan [Ctrl+C] untuk menghentikan kedua server."
echo "========================================="

# Tunggu hingga salah satu proses berhenti atau dihentikan user
wait

