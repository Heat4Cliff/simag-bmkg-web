# Laporan Pemeriksaan Pra-Fase 4: Validasi Infrastruktur Windows

Laporan audit infrastruktur ini disusun pasca-instalasi manual oleh pengguna pada sistem operasi Windows, sebelum melanjutkan ke tahapan pembuatan database dan sinkronisasi skema Prisma pada **Fase 4**.

- **Repository**: [`D:\Development\simag-bmkg-web`](file:///D:/Development/simag-bmkg-web)
- **Commit Baseline**: `59e322ba683179689c8f798e1f9ab3d707ca0088` (`main`)
- **Tanggal Audit**: 10 November 2026

---

## 1. Status Proses Instalasi Lama
Pemeriksaan dilakukan terhadap proses instalasi background atau installer Windows:
- `winget`: **Tidak berjalan** (tidak ada proses aktif).
- `msiexec`: **Tidak berjalan**.
- PostgreSQL Installer / EDB Setup: **Tidak berjalan**.
- Docker Installer: **Tidak berjalan**.
- **Kesimpulan**: Seluruh proses installer sebelumnya telah selesai atau dihentikan dengan aman. Tidak ada proses installer yang menggantung (*stuck*).

---

## 2. Status & Inventarisasi PostgreSQL Native Windows
- **Versi Server**: `PostgreSQL 18.6`
- **Versi Client (`psql`)**: `psql (PostgreSQL) 18.6`
- **Lokasi Instalasi**: `C:\Program Files\PostgreSQL\18\bin`
- **Direktori Data / Cluster**: `C:\Program Files\PostgreSQL\18\data`
- **Nama Windows Service**: `postgresql-x64-18`
- **Display Name**: `postgresql-x64-18`
- **Status Service**: **Running** (Startup Type: `Auto`)
- **Port Listening**: Port `5432` terikat pada alamat `0.0.0.0` dan `::` oleh PID `23304` (`postgres.exe`).
- **Status Koneksi (`pg_isready`)**: `127.0.0.1:5432 - accepting connections` (Koneksi lokal aktif dan siap menerima query).
- **Catatan PATH**: Folder `C:\Program Files\PostgreSQL\18\bin` belum terdaftar di User/System Environment PATH, sehingga CLI `psql` dapat dipanggil menggunakan path lengkap atau ditambahkan ke session PATH saat operasional.

---

## 3. Status & Inventarisasi Docker Windows
- **Docker Desktop**: Terpasang dan aktif (`Version 29.9.3, build 5457199`).
- **Docker Engine / Daemon**: Berjalan normal (`ServerVersion: 29.9.3`, OS: `Docker Desktop`, OSType: `linux`, Arch: `x86_64`).
- **Docker Compose**: Terpasang (`Docker Compose version v5.7.0`).
- **Container Aktif/Berhenti (`docker ps -a`)**: **0 container** (kondisi bersih, belum ada container yang berjalan).
- **Volume Docker (`docker volume ls`)**: **0 volume** (bersih).

---

## 4. Pemetaan Port & Analisis Potensi Konflik

| Instance | Jenis | Versi | Port | PID / Container ID | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Native** | Windows Service (`postgresql-x64-18`) | 18.6 | `5432` | PID `23304` | **Running & Accepting Connections** |
| **PostgreSQL Docker** | Container | - | - | - | Tidak ada container (Belum dibuat) |

- **Analisis Port 5432**: Digunakan secara eksklusif oleh PostgreSQL Native 18.6.
- **Analisis Port 5433**: Bebas / tidak ada proses yang mendengarkan.
- **Konflik Binding**: **NIHIL (Tidak ada konflik port)**.

---

## 5. Validasi Integritas Workspace & Dependencies

Pemeriksaan status repositori pada [`D:\Development\simag-bmkg-web`](file:///D:/Development/simag-bmkg-web):
- **Branch Aktif**: `main` (up to date dengan `origin/main`).
- **Commit Terakhir**: `59e322b feat(absensi): lock attendance and set 100% progress when internship period completes`.
- **Remote Origin**: `https://github.com/Heat4Cliff/simag-bmkg-web.git`.
- **Working Tree**: Bersih, hanya memuat file dokumentasi yang dibuat pada fase audit sebelumnya:
  - `docs/BASELINE_ENVIRONMENT_REPORT.md`
  - `docs/PHASE_3_DEPENDENCY_RECOVERY_REPORT.md`
- **Node.js & npm**: `Node v22.23.4`, `npm 10.9.9`.
- **Dependencies (`node_modules`)**: 1002 paket terpasang utuh via `npm ci`.
- **Prisma CLI & Client**: Prisma `7.9.1` terverifikasi di `.\node_modules\.bin\prisma.cmd` dan `@prisma/client`.
- **Playwright & Browser**: Playwright `1.52.0` terpasang di `.\node_modules\.bin\playwright.cmd`. Cache browser Chromium (`chromium-1169`, `ffmpeg-1011`, dll.) tersedia di `%LOCALAPPDATA%\ms-playwright`.
- **Integritas Kode**: `package.json`, `package-lock.json`, serta seluruh source code (`src/`) **tidak ada yang berubah**.

---

## 6. Audit Environment Variables & Git Ignore
- File `.env`: **Belum ada** (belum dibuat).
- File `.env.example`: Tidak tersedia di repositori.
- Proteksi `.gitignore`: Baris ke-34 pada `.gitignore` memuat `.env*`.
- Verifikasi Git Check-Ignore:
  ```text
  git check-ignore -v .env       -> .gitignore:34:.env*   .env
  git check-ignore -v .env.local -> .gitignore:34:.env*   .env.local
  ```
- **Kesimpulan Keamanan**: File `.env` lokal 100% aman dibuat karena diabaikan oleh Git dan tidak akan pernah ter-commit atau bocor ke repositori.

---

## 7. Rekomendasi Arsitektur

Berdasarkan hasil inventarisasi di atas, kami merekomendasikan **Pendekatan C**:

> **Pendekatan C: Menggunakan PostgreSQL Native sebagai Database Utama (Development & Testing) dan Docker Desktop untuk Layanan Tambahan (SonarQube).**

### Justifikasi Komparatif:
1. **Performa & Resource**:
   PostgreSQL 18.6 Native sudah terpasang rapi sebagai Windows Service, aktif di port default `5432`, dan hanya menggunakan ~20 MB RAM tanpa beban virtualisasi WSL2/Docker container.
2. **Kesesuaian Konfigurasi Prisma**:
   Prisma 7 dan route handlers SIMAG BMKG secara default dikonfigurasi untuk terhubung ke `127.0.0.1:5432`, sehingga tidak memerlukan mapping port non-standar.
3. **Isolasi Database Terjamin**:
   Database development (`simag_bmkg`) dan testing (`simag_bmkg_test`) dibuat terpisah di instance native PostgreSQL dengan proteksi `assertSafeTestDatabaseUrl` bawaan proyek.
4. **Peran Docker Desktop**:
   Docker Desktop yang sudah berjalan sangat ideal dialokasikan untuk kebutuhan **SonarQube Server** (Fase 6), sehingga kita tidak perlu memasang server SonarQube bare-metal yang membutuhkan konfigurasi database dan Elasticsearch internal yang berat di Windows host.

---

## 8. Langkah Terjadwal Menuju Fase 4 (Setup Database)
Setelah laporan ini disetujui, langkah berikutnya pada Fase 4 adalah:
1. Memverifikasi kredensial superuser `postgres` lokal atau membuat user proyek `simag_local`.
2. Membuat database `simag_bmkg` (development) dan `simag_bmkg_test` (testing).
3. Mengonfigurasi file `.env` lokal dengan `DATABASE_URL` dan `TEST_DATABASE_URL`.
4. Menjalankan `npx prisma db push` ke masing-masing database secara terisolasi.
5. Memvalidasi koneksi menggunakan Prisma adapter tanpa menjalankan seeding atau testing.
