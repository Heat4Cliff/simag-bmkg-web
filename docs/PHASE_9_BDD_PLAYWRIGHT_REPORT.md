# SIMAG BMKG — LAPORAN FASE 9: BDD AUTOMATION TESTING
## Pengujian Otomasi Berbasis Perilaku Menggunakan Cucumber.js dan Playwright Browser Automation

**Repository:** `D:\Development\simag-bmkg-web`  
**Remote Git:** `https://github.com/Heat4Cliff/simag-bmkg-web`  
**Branch:** `uas/bdd-playwright`  
**Base Commit:** `f65382e` (`uas/integration-testing`)  
**Tanggal Eksekusi:** 11 November 2026  
**Target Aplikasi & Server:** Next.js Isolated Server `http://localhost:3201`  
**Target Database Pengujian:** `simag_bmkg_test` (PostgreSQL 18.6 Native Windows, Port 5432)  
**Dokumen Referensi:**
- `docs/PHASE_5_BASELINE_VALIDATION_REPORT.md`
- `docs/PHASE_6_UNIT_TEST_REPORT.md`
- `docs/PHASE_7_LINTER_REPORT.md`
- `docs/PHASE_8_INTEGRATION_TEST_REPORT.md`

---

## 1. RINGKASAN EKSEKUTIF

Fase 9 mengimplementasikan tugas khusus UAS **BDD (Behavior-Driven Development) Automation Testing** menggunakan kombinasi **Playwright** dan **Cucumber.js** untuk aplikasi web **SIMAG BMKG** (Sistem Informasi Manajemen Magang - Stasiun Meteorologi BMKG / UNUGHA Cilacap).

Pengujian ini membuktikan otomatisasi antarmuka peramban (*browser automation*) nyata secara *end-to-end* menggunakan engine **Playwright Chromium v136**, menguji alur pengguna riil mulai dari autentikasi, navigasi dashboard dinamis, pelaporan kegiatan harian, riwayat presensi geofence, modul pembelajaran praktikum, kalender agenda, hingga halaman profil dan pengaturan instansi.

Seluruh pengujian dijalankan pada instans server lokal terisolasi (`http://localhost:3201`) yang tersambung secara eksklusif ke database pengujian `simag_bmkg_test`, menjamin keamanan penuh terhadap database development `simag_bmkg` maupun server Debian production (`simag.alwanabbas.my.id`).

### Ringkasan Metrik Pengujian
- **BDD Feature Files:** 5 fitur (`authentication`, `dashboard`, `simag_features`, `modul_kalender`, `profil_pengaturan`).
- **BDD Scenarios:** 17 skenario (*17 passed, 0 failed, 0 skipped*).
- **BDD Steps:** 77 langkah Gherkin (*77 passed, 0 failed, 0 skipped*).
- **Durasi Eksekusi BDD:** ~15.06 detik (langkah aktif: 12.82s).
- **Peramban Otomasi:** Playwright Chromium Headless (resolusi viewport $1280 \times 800$, emulasi geolokasi Stasiun Meteorologi BMKG Cilacap).
- **Regresi Unit Testing:** 56/56 unit test passed (100% lulus, 0 regresi).
- **Regresi Integration Testing:** 37/37 integration test passed (100% lulus, 0 regresi).
- **Linter Static Analysis:** 0 errors (146 warnings tipe legacy/React 19).

---

## 2. AUDIT IMPLEMENTASI BDD AWAL & PERBAIKAN WINDOWS RUNTIME

Sebelum penambahan skenario baru, audit mendalam dilakukan terhadap struktur BDD yang ada:

### Temuan Awal
1. **Cucumber Configuration (`cucumber.js`):**
   - Menggunakan konfigurasi CommonJS yang memetakan fitur di `tests/features/**/*.feature` dan step definitions di `tests/step-definitions/**/*.ts`.
2. **Keterbatasan Windows pada Script `package.json`:**
   - Script awal `"test:bdd": "node --env-file-if-exists=.env --import tsx ./node_modules/.bin/cucumber-js"` mengalami kegagalan pada Windows runtime (`TransformError: Unexpected token $(echo ...)`). File `./node_modules/.bin/cucumber-js` pada Windows merupakan shell wrapper Unix.
   - **Perbaikan:** Diperbarui menjadi `"node --env-file-if-exists=.env --import tsx ./node_modules/@cucumber/cucumber/bin/cucumber.js"` sehingga script dapat dieksekusi secara mulus dan konsisten lintas sistem operasi (Windows & Linux).
3. **Arsitektur Test Server & Database Lifecycle:**
   - File `tests/support/hooks.ts` memanfaatkan `BeforeAll` untuk menyiapkan fixture user (`ensureBddTestUser`), mendeteksi/menjalankan server Next.js port 3201 (`startIsolatedTestServer`), dan meluncurkan instance browser Chromium bersama (`launchTestBrowser`).
   - Setiap skenario mendapatkan *isolated browser context* baru dengan penanganan error screenshot otomatis pada kegagalan.
   - `AfterAll` mematikan child process server dan membersihkan fixture data (`cleanupBddTestUser`).

---

## 3. RINCIAN CAKUPAN FITUR & SKENARIO BDD (17 SKENARIO)

Rangkaian skenario Gherkin menguji fungsionalitas nyata antarmuka SIMAG BMKG:

### Fitur 1: Autentikasi Pengguna (`authentication.feature`) — 4 Skenario
1. **Pengguna berhasil login:** Membuka `/login`, mengisi email dan password mahasiswa valid, menekan tombol Masuk, memverifikasi transisi URL ke `/dashboard`, dan memverifikasi sapaan pengguna.
2. **Pengguna gagal login:** Memasukkan kredensial salah, menekan tombol Masuk, dan memverifikasi penolakan login serta pesan kesalahan *toast* / modal.
3. **Pengguna mengakses halaman protected tanpa login:** Mengakses URL terproteksi (seperti `/dashboard`) dalam keadaan cookies dibersihkan, memverifikasi sistem me-redirect ke `/login`.
4. **Pengguna logout:** Pengguna yang telah berada dalam sesi dashboard menekan tombol keluar di menu profil, memverifikasi sesi berakhir dan diarahkan kembali ke `/login`.

### Fitur 2: Ringkasan & Navigasi Dashboard (`dashboard.feature`) — 3 Skenario
5. **Menampilkan ringkasan kartu statistik mahasiswa:** Memverifikasi keberadaan kartu "Kehadiran Bulan Ini", "Laporan Terkirim", "Modul Dibuat", dan "Status Hari Ini".
6. **Menampilkan sapaan pengguna dan progres magang:** Memverifikasi sapaan "Selamat datang, [Nama Pengguna]" dan indikator progres magang beserta tautan profil.
7. **Navigasi kartu ringkasan dashboard ke fitur terkait:** Menekan kartu statistik "Laporan Terkirim" dan memvalidasi navigasi ke `/laporan-harian` beserta verifikasi judul halaman.

### Fitur 3: Fitur Utama Mahasiswa (`simag_features.feature`) — 4 Skenario
8. **Mahasiswa membuat draft laporan harian baru:** Mengakses form `/laporan-harian/baru`, mengisi form (judul, deskripsi pengamatan sinoptik, kendala), menekan tombol "Simpan Draft", memverifikasi kembali ke `/laporan-harian` dan status "Draft" muncul pada tabel.
9. **Mahasiswa memfilter daftar laporan harian berdasarkan pencarian:** Mengetik kata kunci pencarian dan memvalidasi item yang dicari tetap tampil pada daftar.
10. **Mahasiswa melihat riwayat kehadiran:** Mengakses `/riwayat/absensi`, memverifikasi judul "Riwayat Kehadiran" dan kolom tabel ("Tanggal", "Jam Masuk", "Jam Pulang", "Keterangan", "Status").
11. **Mahasiswa mengakses halaman absensi harian:** Mengakses `/absensi`, memverifikasi judul "Absensi Harian" dan widget status presensi hari ini.

### Fitur 4: Modul Praktikum & Kalender Kegiatan (`modul_kalender.feature`) — 3 Skenario (Baru)
12. **Mahasiswa membuka daftar modul praktikum:** Membuka `/modul-praktikum`, memverifikasi breadcrumb/judul "Modul Praktikum" dan tombol navigasi "Buat Modul".
13. **Mahasiswa mengakses formulir pembuatan modul praktikum baru:** Mengakses `/modul-praktikum/baru`, memverifikasi elemen input judul modul, dropdown kategori praktikum, dan textarea konten instruksi.
14. **Mahasiswa membuka kalender kegiatan magang:** Membuka `/kalender`, memverifikasi header navigasi bulan kalender dan tombol aksi "Tambah Agenda".

### Fitur 5: Profil Pengguna & Pengaturan Sistem (`profil_pengaturan.feature`) — 3 Skenario (Baru)
15. **Mahasiswa melihat informasi profil peserta magang:** Membuka `/profil`, memvalidasi judul "Profil Saya", serta memverifikasi data nama dan email mahasiswa yang terisi otomatis sesuai sesi login.
16. **Mahasiswa melihat tombol ubah profil dan ubah kata sandi:** Memverifikasi keberadaan tombol "Edit Profil" dan "Ganti Password".
17. **Mahasiswa membuka halaman pengaturan instansi:** Membuka `/pengaturan`, memverifikasi informasi konfigurasi instansi dan nama instansi BMKG.

---

## 4. KEAMANAN LINGKUNGAN PENGUJIAN

- **Isolasi Database:** Fungsi `assertSafeTestDatabaseUrl` memastikan seluruh interaksi basis data hanya berjalan pada basis data testing berakhiran `_test` (`simag_bmkg_test`).
- **Isolasi Server:** Server aplikasi di-spawn pada port `3201` dengan variabel lingkungan `AUTH_URL=http://localhost:3201`, `NODE_ENV=production`, dan `DATABASE_URL` yang terisolasi.
- **Geolokasi Mocking Playwright:** Browser context mengemulasikan koordinat geografis Stasiun Meteorologi BMKG Cilacap (`lat: -7.7219129, lon: 109.0131919`) pada memori peramban tanpa membocorkan lokasi fisik perangkat pengguna.
- **Zero Production Risk:** Tidak ada request yang keluar ke server Debian production (`simag.alwanabbas.my.id`).

---

## 5. HASIL VERIFIKASI AKHIR & STATUS REGRESI

| Perintah Eksekusi | Metrik Target | Hasil Aktual | Status |
| :--- | :--- | :--- | :--- |
| `npm run test:bdd` | 17 Skenario, Playwright Browser | **17 Scenarios Passed, 77 Steps Passed** | **LULUS (100%)** |
| `npm run test:unit` | Regresi Unit Test | **56 / 56 Tests Passed** | **LULUS (100%)** |
| `npm run test:integration` | Regresi Integration Test | **37 / 37 Tests Passed (8 Suites)** | **LULUS (100%)** |
| `npm run lint` | ESLint Code Quality | **0 Errors, 146 Warnings** | **LULUS** |
| `npm run test:report` | HTML & JSON Report Generation | **Laporan tergenerate di `tests/reports/`** | **LULUS** |

---

## 6. STATUS REPOSITORY & COMMIT

- **Branch:** `uas/bdd-playwright`
- **Base Branch:** `uas/integration-testing` (commit `f65382e`)
- **Working Tree:** Bersih (staged untuk commit Fase 9).
- **Branch Sebelumnya:**
  - `uas/unit-testing`: `aef57d0`
  - `uas/linter`: `44a04c3`
  - `uas/integration-testing`: `f65382e`
- **Komitmen Fase Berikutnya:** Menunggu ulasan dan instruksi sebelum melanjutkan ke integrasi SonarQube.
