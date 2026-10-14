#!/usr/bin/env bash
# ==============================================================================
# Script Auto-Deploy Cerdas SIMAG UNUGHA (Next.js)
# ==============================================================================
set -euo pipefail

PROJECT_DIR="/srv/simag-bmkg"
LOCK_FILE="/tmp/simag-autodeploy.lock"
LOG_FILE="/srv/simag-bmkg/logs/autodeploy.log"
BRANCH="main"
PM2_APP_NAME="simag-bmkg"

# Pastikan path tools (node, npm, npx, pm2, git, gh) dapat diakses
export PATH="/home/heathcliff/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="/home/heathcliff"

# Fungsi logger
log() {
  local msg="$1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" | tee -a "$LOG_FILE"
}

# 1. Mechanism Lockfile (Cegah overlap jika deploy sebelumnya belum selesai)
if [ -e "$LOCK_FILE" ]; then
  # Cek jika proses lock masih hidup
  PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    # Proses deploy sebelumnya masih aktif, keluar hening
    exit 0
  else
    # Lockfile basi (stale lock), hapus
    rm -f "$LOCK_FILE"
  fi
fi

# Pasang lockfile
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

cd "$PROJECT_DIR"

# 2. Ambil metadata commit remote tanpa merusak working tree
git fetch origin "$BRANCH" --quiet

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")

# 3. Deteksi Hash Git (Jika sama, keluar secara hening)
if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
  exit 0
fi

# 4. Ada update baru terdeteksi! Jalankan proses deployment
log "========================================================"
log "Perubahan baru terdeteksi di GitHub ($BRANCH)!"
log "Commit lokal  : $LOCAL_HASH"
log "Commit remote : $REMOTE_HASH"
log "Memulai proses auto-deployment..."

# a. Bersihkan file runtime sementara sebelum pull agar tidak terjadi conflict
if [ -f "public/sw.js" ]; then
  git checkout -- public/sw.js 2>/dev/null || true
fi

# Catat status package.json lama sebelum pull
OLD_PKG_HASH=$(sha256sum package.json 2>/dev/null | awk '{print $1}')

# Tarik perubahan dari GitHub
log "Menarik perubahan terbaru (git pull origin $BRANCH)..."
git pull origin "$BRANCH" --quiet

# b. Cek jika package.json berubah, jalankan npm install
NEW_PKG_HASH=$(sha256sum package.json 2>/dev/null | awk '{print $1}')
if [ "$OLD_PKG_HASH" != "$NEW_PKG_HASH" ]; then
  log "package.json berubah, menjalankan npm install..."
  npm install
else
  log "package.json tidak berubah, melewati npm install."
fi

# c. Sinkronisasi Prisma
log "Menjalankan npx prisma generate..."
npx prisma generate

# d. Sinkronkan skema database PostgreSQL secara aman (Cegah Data Loss)
if [ -d "prisma/migrations" ]; then
  log "Menjalankan migrasi resmi (npx prisma migrate deploy)..."
  npx prisma migrate deploy
else
  log "Menyinkronkan skema database secara aman (npx prisma db push)..."
  # Menjalankan db push tanpa flag --accept-data-loss untuk melindungi data produksi
  if ! npx prisma db push; then
    log "PERINGATAN KEAMANAN: Terdeteksi perubahan skema yang berpotensi menghilangkan data!"
    log "Deployment database ditahan demi melindungi data produksi."
  fi
fi

# e. Jalankan build produksi Next.js
log "Membangun proyek produksi (npm run build)..."
npm run build

# f. Restart service PM2
log "Me-restart aplikasi PM2 ($PM2_APP_NAME)..."
pm2 restart "$PM2_APP_NAME"

log "Auto-deployment berhasil diselesaikan pada commit: $(git rev-parse --short HEAD)!"
log "========================================================"
