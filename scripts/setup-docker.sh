#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== [1/5] Memeriksa Docker Daemon ==="
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon belum berjalan. Mencoba menyalakan docker.service..."
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start docker
  else
    echo "ERROR: Docker daemon tidak aktif. Jalankan: sudo systemctl start docker"
    exit 1
  fi
fi
echo "Docker daemon aktif."

echo "=== [2/5] Menyiapkan Docker Volumes ==="
for vol in simag_pgdata sonarqube_data sonarqube_extensions sonarqube_logs; do
  docker volume create "$vol" >/dev/null
done

echo "=== [3/5] Menyiapkan Container PostgreSQL (simag-postgres) ==="
if docker ps -a --format '{{.Names}}' | grep -Eq '^simag-postgres$'; then
  echo "Menyalakan container simag-postgres yang sudah ada..."
  docker start simag-postgres >/dev/null
else
  echo "Membuat dan menyalakan container simag-postgres (postgres:16-alpine)..."
  docker run -d \
    --name simag-postgres \
    -p 127.0.0.1:5432:5432 \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=postgres \
    -v simag_pgdata:/var/lib/postgresql/data \
    -v "$ROOT_DIR/scripts/init-postgres.sql:/docker-entrypoint-initdb.d/init-postgres.sql:ro" \
    --restart unless-stopped \
    postgres:16-alpine >/dev/null
fi

echo "Menunggu PostgreSQL siap menerima koneksi..."
for i in {1..30}; do
  if docker exec simag-postgres pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Menjalankan inisialisasi role & database (simag_bmkg & simag_bmkg_test)..."
docker exec -i simag-postgres psql -v ON_ERROR_STOP=1 -U postgres -d postgres < "$ROOT_DIR/scripts/init-postgres.sql" >/dev/null

echo "Sinkronisasi skema Prisma ke simag_bmkg & simag_bmkg_test..."
npx prisma generate >/dev/null
DATABASE_URL="postgresql://simag_local:simag_local_pass@127.0.0.1:5432/simag_bmkg" npx prisma db push >/dev/null
DATABASE_URL="postgresql://simag_test:simag_test_pass@127.0.0.1:5432/simag_bmkg_test" npx prisma db push >/dev/null
echo "PostgreSQL siap (simag_bmkg & simag_bmkg_test tersinkronisasi)."

echo "=== [4/5] Menyiapkan Container SonarQube (simag-sonarqube) ==="
if docker ps -a --format '{{.Names}}' | grep -Eq '^simag-sonarqube$'; then
  echo "Menyalakan container simag-sonarqube yang sudah ada..."
  docker start simag-sonarqube >/dev/null
else
  echo "Membuat dan menyalakan container simag-sonarqube (sonarqube:10.7-community)..."
  docker run -d \
    --name simag-sonarqube \
    -p 127.0.0.1:9000:9000 \
    -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
    -v sonarqube_data:/opt/sonarqube/data \
    -v sonarqube_extensions:/opt/sonarqube/extensions \
    -v sonarqube_logs:/opt/sonarqube/logs \
    --restart unless-stopped \
    sonarqube:10.7-community >/dev/null
fi

echo "=== [5/5] Memeriksa Status SonarQube & Token (.sonar-token.local) ==="
echo "Menunggu SonarQube di http://127.0.0.1:9000 berstatus UP (bisa memakan waktu 30-90 detik)..."
for i in {1..60}; do
  STATUS="$(curl -fsS http://127.0.0.1:9000/api/system/status 2>/dev/null || true)"
  if echo "$STATUS" | grep -q '"status":"UP"'; then
    echo "SonarQube UP!"
    break
  fi
  sleep 2
done

if [ ! -f "$ROOT_DIR/.sonar-token.local" ]; then
  echo "Mencoba membuat token analisis SonarQube otomatis..."
  TOKEN_NAME="simag-cli-$(date +%s)"
  TOKEN_RESP="$(curl -fsS -u admin:admin -X POST "http://127.0.0.1:9000/api/user_tokens/generate?name=${TOKEN_NAME}" 2>/dev/null || true)"
  TOKEN="$(echo "$TOKEN_RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
  if [ -n "$TOKEN" ]; then
    echo "$TOKEN" > "$ROOT_DIR/.sonar-token.local"
    chmod 600 "$ROOT_DIR/.sonar-token.local"
    echo "Token SonarQube berhasil disimpan ke .sonar-token.local"
  else
    echo "CATATAN: Jika password admin SonarQube sudah diganti, buat token di http://127.0.0.1:9000 lalu simpan ke .sonar-token.local"
  fi
fi

echo ""
echo "Selesai! Container yang sedang berjalan:"
docker ps --filter "name=simag-"
