#!/usr/bin/env bash
# ==============================================================================
# Serv.io / YVS - Automated VPS Setup Script (Dual Environment: Staging + Prod)
# Menyiapkan 1 VPS untuk menjalankan Staging & Production secara terisolasi
# ==============================================================================

set -e

REPO_URL="https://github.com/halfthew0rldaway/yvs.git"
GATEWAY_DIR="$HOME/yvs-gateway"
PROD_DIR="$HOME/yvs-production"
STAGING_DIR="$HOME/yvs-staging"

PROD_DOMAIN="komputerawet.com"
STAGING_DOMAIN="staging.komputerawet.com"

echo ""
echo "=================================================================="
echo "  🚀 Serv.io Dual-Environment VPS Setup Wizard"
echo "  Staging : https://$STAGING_DOMAIN (R&D / Testing)"
echo "  Prod    : https://$PROD_DOMAIN (Bengkel Live)"
echo "=================================================================="
echo ""

# 1. Verifikasi dependensi sistem
echo "🔍 [1/6] Memeriksa dependensi sistem..."
for cmd in docker git openssl; do
  if ! command -v $cmd &> /dev/null; then
    echo "❌ Perintah '$cmd' belum terinstal. Silakan pasang terlebih dahulu."
    exit 1
  fi
done

if ! docker compose version &> /dev/null; then
  echo "❌ 'docker compose' plugin belum terinstal."
  exit 1
fi
echo "✅ Dependensi siap (docker, docker compose, git, openssl)."

# 2. Hentikan kontainer lama jika ada (mencegah bentrok port 80/443)
echo ""
echo "🛑 [2/6] Memeriksa & menghentikan kontainer lama..."
if [ -d "$HOME/servio" ]; then
  echo "📦 Menemukan instalasi lama di ~/servio, menghentikan layanannya..."
  (cd "$HOME/servio" && docker compose down 2>/dev/null || true)
  if [ ! -d "$PROD_DIR" ]; then
    echo "📦 Memindahkan ~/servio ke $PROD_DIR..."
    mv "$HOME/servio" "$PROD_DIR"
  fi
fi

# 3. Buat External Docker Gateway Network
echo ""
echo "🌐 [3/6] Mempersiapkan Docker Network bersama (yvs_gateway_net)..."
if ! docker network inspect yvs_gateway_net >/dev/null 2>&1; then
  docker network create yvs_gateway_net
  echo "✅ Docker network 'yvs_gateway_net' berhasil dibuat."
else
  echo "✅ Docker network 'yvs_gateway_net' sudah aktif."
fi

# 4. Setup Central Caddy Gateway (Auto HTTPS port 80/443)
echo ""
echo "🛡️  [4/6] Mengonfigurasi Central Caddy Gateway..."
mkdir -p "$GATEWAY_DIR"

cat << 'EOF' > "$GATEWAY_DIR/Caddyfile"
# ==========================================
# 1. PRODUCTION DOMAIN & MAGIC SSLIP
# ==========================================
{$PROD_DOMAIN:komputerawet.com}, prod.101.32.127.55.sslip.io {
    encode zstd gzip

    @api path /api /api/*
    handle @api {
        reverse_proxy yvs-prod-backend:5000
    }

    @uploads path /uploads /uploads/*
    handle @uploads {
        reverse_proxy yvs-prod-backend:5000
    }

    handle {
        reverse_proxy yvs-prod-frontend:80
    }
}

# ==========================================
# 2. STAGING DOMAIN & MAGIC SSLIP
# ==========================================
{$STAGING_DOMAIN:staging.komputerawet.com}, staging.101.32.127.55.sslip.io {
    encode zstd gzip

    @api path /api /api/*
    handle @api {
        reverse_proxy yvs-staging-backend:5000
    }

    @uploads path /uploads /uploads/*
    handle @uploads {
        reverse_proxy yvs-staging-backend:5000
    }

    handle {
        reverse_proxy yvs-staging-frontend:80
    }
}

# ==========================================
# 3. DIRECT IP PORT 80 (Production Live)
# ==========================================
:80 {
    encode zstd gzip

    @api path /api /api/*
    handle @api {
        reverse_proxy yvs-prod-backend:5000
    }

    @uploads path /uploads /uploads/*
    handle @uploads {
        reverse_proxy yvs-prod-backend:5000
    }

    handle {
        reverse_proxy yvs-prod-frontend:80
    }
}

# ==========================================
# 4. DIRECT IP PORT 8080 (Staging Preview)
# ==========================================
:8080 {
    encode zstd gzip

    @api path /api /api/*
    handle @api {
        reverse_proxy yvs-staging-backend:5000
    }

    @uploads path /uploads /uploads/*
    handle @uploads {
        reverse_proxy yvs-staging-backend:5000
    }

    handle {
        reverse_proxy yvs-staging-frontend:80
    }
}
EOF

cat << 'EOF' > "$GATEWAY_DIR/compose.yaml"
name: yvs-gateway

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy-gateway
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    environment:
      PROD_DOMAIN: ${PROD_DOMAIN:-komputerawet.com}
      STAGING_DOMAIN: ${STAGING_DOMAIN:-staging.komputerawet.com}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - yvs_gateway_net
    mem_limit: 128m

networks:
  yvs_gateway_net:
    external: true

volumes:
  caddy_data:
  caddy_config:
EOF

echo "🚀 Menjalankan Caddy Gateway..."
cd "$GATEWAY_DIR"
docker compose up -d
echo "✅ Caddy Gateway aktif mengawal port 80 & 443."

# 5. Setup Production Environment (~/yvs-production)
echo ""
echo "🏭 [5/7] Menyiapkan Lingkungan Production..."
if [ ! -d "$PROD_DIR" ]; then
  echo "📥 Cloning repository ke $PROD_DIR (branch main)..."
  git clone -b main "$REPO_URL" "$PROD_DIR"
fi

cd "$PROD_DIR"
git fetch origin main
git checkout main
git reset --hard origin/main

if [ ! -f .env.production ]; then
  echo "🔑 Membuat file .env.production dengan kredensial aman..."
  PROD_DB_PASS=$(openssl rand -hex 16)
  PROD_ROOT_PASS=$(openssl rand -hex 16)
  PROD_JWT_SEC=$(openssl rand -hex 32)
  cat << EOF > .env.production
APP_ENV=production
PROD_DOMAIN=$PROD_DOMAIN
MYSQL_DATABASE=yvs_production
MYSQL_USER=yvs_prod
MYSQL_PASSWORD=$PROD_DB_PASS
MYSQL_ROOT_PASSWORD=$PROD_ROOT_PASS
MYSQL_HOST_PORT=3306
JWT_SECRET=$PROD_JWT_SEC
EOF
fi

echo "🐳 Membangun & menjalankan Production Stack..."
docker compose -f compose.prod.yaml --env-file .env.production up -d --build
echo "✅ Production Stack berhasil berjalan!"

# 6. Setup Staging Environment (~/yvs-staging)
echo ""
echo "🧪 [6/7] Menyiapkan Lingkungan Staging..."
if [ ! -d "$STAGING_DIR" ]; then
  echo "📥 Cloning repository ke $STAGING_DIR (branch staging)..."
  git clone -b staging "$REPO_URL" "$STAGING_DIR" || git clone -b main "$REPO_URL" "$STAGING_DIR"
fi

cd "$STAGING_DIR"
git fetch origin staging || true
git checkout staging 2>/dev/null || git checkout -b staging
git reset --hard origin/staging 2>/dev/null || true

if [ ! -f .env.staging ]; then
  echo "🔑 Membuat file .env.staging dengan kredensial terisolasi..."
  STAGING_DB_PASS=$(openssl rand -hex 16)
  STAGING_ROOT_PASS=$(openssl rand -hex 16)
  STAGING_JWT_SEC=$(openssl rand -hex 32)
  cat << EOF > .env.staging
APP_ENV=staging
STAGING_DOMAIN=$STAGING_DOMAIN
MYSQL_DATABASE=yvs_staging
MYSQL_USER=yvs_staging
MYSQL_PASSWORD=$STAGING_DB_PASS
MYSQL_ROOT_PASSWORD=$STAGING_ROOT_PASS
MYSQL_HOST_PORT=3307
JWT_SECRET=$STAGING_JWT_SEC
EOF
fi

echo "🐳 Membangun & menjalankan Staging Stack..."
docker compose -f compose.staging.yaml --env-file .env.staging up -d --build
echo "✅ Staging Stack berhasil berjalan!"

# 7. Reload Caddy & Verifikasi
echo ""
echo "🔄 [7/7] Melakukan sinkronisasi akhir reverse-proxy..."
docker exec caddy-gateway caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true

echo ""
echo "=================================================================="
echo "🎉 SETUP BERHASIL DILAKUKAN SECARA LENGKAP!"
echo "=================================================================="
echo "Status Kontainer Aktif:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📌 Rincian Alamat & Akses:"
echo "   1. Production (Live Bengkel) : https://$PROD_DOMAIN"
echo "      Folder di VPS             : $PROD_DIR"
echo "      Database MySQL            : yvs_production (Port host 3306)"
echo ""
echo "   2. Staging (R&D / Test)      : https://$STAGING_DOMAIN"
echo "      Folder di VPS             : $STAGING_DIR"
echo "      Database MySQL            : yvs_staging (Port host 3307)"
echo ""
echo "👉 Pastikan DNS domain Anda di Cloudflare / registrar mengarah ke IP VPS ini:"
echo "   - A Record: $PROD_DOMAIN         -> [IP VPS ANDA]"
echo "   - A Record: $STAGING_DOMAIN -> [IP VPS ANDA]"
echo "=================================================================="
