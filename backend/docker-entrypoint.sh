#!/bin/sh
set -e

echo "🚀 [ENTRYPOINT] Memulai inisialisasi kontainer backend Serv.io..."

# Jalankan inisialisasi skema & verifikasi database via node
node scripts/docker-init.js || true

echo "🚀 [ENTRYPOINT] Menjalankan perintah utama: $@"
exec "$@"

