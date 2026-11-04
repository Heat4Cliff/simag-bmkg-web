# Test Execution Report — SIMAG BMKG

**Mata Kuliah:** Analisis dan Pengujian Sistem (IF7AB) — Pertemuan 11  
**Aplikasi:** Sistem Informasi Magang (SIMAG) BMKG / UNUGHA  
**Repository:** `https://github.com/Heat4Cliff/simag-bmkg-web.git`  
**Branch:** `feat/simag-testing-automation`  
**Tanggal Eksekusi:** 3 November 2026

---

## 1. Ringkasan Eksekutif Hasil Pengujian (Actual Test Execution Metrics)

Seluruh statistik di bawah ini berasal langsung dari eksekusi aktual pada repository **SIMAG BMKG**:

| Kategori Pengujian | Command | Total Test / Skenario | PASS | FAIL | SKIPPED | Durasi Eksekusi Aktual |
|--------------------|---------|-----------------------|------|------|---------|------------------------|
| **1. Unit Testing** | `npm run test:unit` | **19 Test Cases** (5 Suites) | **19** | **0** | **0** | `3.35s` |
| **2. Integration Testing** | `npm run test:integration` | **23 Test Cases** (5 Suites) | **23** | **0** | **0** | `21.45s` |
| **3. BDD Automation Testing** | `npm run test:bdd` | **11 Scenarios** (52 Steps, 3 Features) | **11** (52 Steps) | **0** | **0** | `1m 44.11s` |
| **4. E2E Usability & Responsive Audit** | `npm run test:e2e` | **5 Test Suites / 6 User Tasks** | **5** | **0** | **0** | `41.91s` |
| **TOTAL KESELURUHAN** | Semua Suite | **58 Kasus Uji / Skenario** | **58 (100%)** | **0** | **0** | **`2m 50.82s`** |

---

## 2. Lingkungan Pengujian (Test Environment & Database Isolation)

- **Operating System:** Linux (`x86_64`)
- **Node.js Runtime:** `v20.19.2` (Local Server) & `v22.x` (GitHub Actions Runner)
- **Framework Aplikasi:** Next.js `16.3.2` (App Router), React `19.2.8`, TypeScript `5.x`
- **Database Pengujian Terisolasi (100% Terpisah dari Production):**
  - PostgreSQL `16` dengan Prisma ORM `7.9.1` (`@prisma/adapter-pg`)
  - Database Pengujian (Integration, BDD, dan E2E): `simag_bmkg_test` (`127.0.0.1:5432`)
  - Guard Keamanan: `assertSafeTestDatabaseUrl()` di `tests/support/setup-test-db.ts` menolak keras segala koneksi pengujian ke database utama (`simag_bmkg` / `postgres`) dan mewajibkan nama database berakhiran `_test`.
  - Server Aplikasi Pengujian (BDD & E2E): `startIsolatedTestServer()` menyalakan instance Next.js khusus pengujian pada `http://localhost:3201` yang terhubung eksklusif ke `simag_bmkg_test`.
  - Fixture Akun BDD/E2E: `qa.automation.mhs@test.simag.local` (dibuat pada `simag_bmkg_test` saat *setup* dan dibersihkan secara *scoped transactional* saat *teardown*).
- **Browser Automation:** Playwright `1.52.0` + Headless Chromium / Google Chrome (`150.0.7871.24`)
- **BDD Framework:** Cucumber.js `@cucumber/cucumber@10.9.0`

---

## 3. Rincian Hasil per Kategori Pengujian

### 3.1. Hasil Unit Testing (`tests/unit/core.test.ts`)
- `geofence presensi: hitungJarakMeter` (4 PASS)
- `kalender presensi: cekLibur` (5 PASS)
- `kalender kegiatan: cekPeringatan` (2 PASS)
- `validasi input pengguna dan laporan` (6 PASS)
- `label status` (2 PASS)
- **Total:** **19 PASS, 0 FAIL**

### 3.2. Hasil Integration Testing (`tests/integration/simag-integration.test.ts`)
- **Suite 1 — Integrasi Autentikasi, JWT & Otorisasi Bearer Token (6 PASS):**
  - Validasi payload login kosong (`400`), password salah (`401`), akun nonaktif (`403`), login valid menghasilkan JWT + profil (`200`), penolakan endpoint terproteksi tanpa token (`401`), serta pembacaan kategori modul dari database dengan Bearer token valid (`200`).
- **Suite 2 — Integrasi Laporan Harian, Persistensi Database & Alur Review Pembimbing (9 PASS):**
  - Proteksi akses tanpa sesi (`401`), validasi field wajib (`400`), penyimpanan sebagai `DRAFT` saat `asDraft=true` (*Regression Test*), penyimpanan sebagai `TERKIRIM` saat `asDraft=false`, pembacaan kontrak `GET /api/laporan-harian`, penolakan review `PATCH` oleh mahasiswa (`401`), persetujuan laporan oleh DPL (`DISETUJUI`), penolakan penghapusan laporan yang telah disetujui (`400`), serta pembaruan `DRAFT` menjadi `TERKIRIM` (`PUT`).
- **Suite 3 — Integrasi Presensi Geofence & Riwayat Absensi (2 PASS):**
  - Penolakan presensi `HADIR` di luar radius kantor BMKG (`400`) dan persistensi pengajuan `IZIN` beserta pembacaan kembali pada `/api/riwayat/absensi` (`200`).
- **Suite 4 — Integrasi Kalender Kegiatan & Pengaturan Sistem RBAC (2 PASS):**
  - Pembuatan agenda kalender instansi publik oleh `SUPERADMIN` yang terbaca oleh `MAHASISWA`, serta penegakan RBAC pada `PATCH /api/pengaturan` (`401` untuk selain `SUPERADMIN`, `200` untuk `SUPERADMIN`).
- **Suite 5 — Hardening & Keamanan Isolasi Database Pengujian / Regression Tests (4 PASS):**
  - Penolakan database utama/production (`simag_bmkg` & `postgres`) oleh `assertSafeTestDatabaseUrl`, penolakan eksekusi `ensureBddTestUser` / `cleanupBddTestUser` / `truncateTestDatabase` pada database non-test, jaminan *scoped cleanup* `cleanupBddTestUser` yang hanya menghapus data fixture tanpa menyentuh user lain, serta penonaktifan `SIMAG_TEST_SESSION` apabila `SIMAG_ALLOW_TEST_AUTH !== "true"`.
- **Total:** **23 PASS, 0 FAIL**

### 3.3. Hasil BDD Automation Testing (`tests/features/*.feature`)
1. **`authentication.feature` (4 Scenarios — 4 PASS):**
   - `Scenario: Pengguna berhasil login` — **PASS**
   - `Scenario: Pengguna gagal login` — **PASS**
   - `Scenario: Pengguna mengakses halaman protected tanpa login` — **PASS**
   - `Scenario: Pengguna logout` — **PASS**
2. **`dashboard.feature` (3 Scenarios — 3 PASS):**
   - `Scenario: Menampilkan ringkasan kartu statistik pada dashboard mahasiswa` — **PASS**
   - `Scenario: Menampilkan informasi sapaan pengguna dan progres magang` — **PASS**
   - `Scenario: Navigasi dari kartu statistik dashboard menuju halaman laporan harian` — **PASS**
3. **`simag_features.feature` (4 Scenarios — 4 PASS):**
   - `Scenario: Mahasiswa membuat draft laporan harian baru` — **PASS**
   - `Scenario: Mahasiswa mencari laporan harian menggunakan fitur filter pencarian` — **PASS**
   - `Scenario: Mahasiswa melihat halaman riwayat absensi` — **PASS**
   - `Scenario: Mahasiswa melihat halaman profil dan informasi magang` — **PASS**
- **Total:** **11 Scenarios (52 Steps) — 11 PASS, 0 FAIL, 0 SKIPPED**

### 3.4. Hasil Usability & Responsive E2E Audit (`tests/e2e/usability-audit.test.ts`)
- `Task 1 (Login & Error Feedback)` — **PASS**
- `Task 2 (Dashboard Comprehension)` — **PASS**
- `Task 3 & 4 (Navigasi Menu Utama & Penggunaan Fitur Laporan Harian)` — **PASS**
- `Task 5 (Responsive Mobile Viewport 375x667)` — **PASS**
- `Task 6 (Navigasi Kembali & Logout)` — **PASS**
- **Total:** **5 Suites / 6 Tasks — 100% PASS**

---

## 4. Bug yang Ditemukan & Diperbaiki Selama Pengujian

### Bug #1: Fitur "Simpan Draft" Laporan Harian Selalu Menyimpan Status `TERKIRIM`
- **Lokasi File:** `src/app/api/laporan-harian/route.ts` & `src/app/laporan-harian/baru/page.tsx`
- **Akar Masalah (Root Cause):**
  - Pada halaman frontend `src/app/laporan-harian/baru/page.tsx`, tombol **Simpan Draft** mengirimkan body JSON `{ ...form, asDraft: true }` ke endpoint `POST /api/laporan-harian`.
  - Namun pada `src/app/api/laporan-harian/route.ts` (baris 86), properti `asDraft` tidak dibaca dari request body dan nilai status di-*hardcode* menjadi `status: "TERKIRIM"`. Selain itu, pembaruan state form pada `src/app/laporan-harian/baru/page.tsx` menggunakan objek non-fungsional `setForm({ ...form, ... })` dan menginisialisasi `tanggal: ""` sebelum `useEffect` selesai, sehingga rentan mereset input saat hidrasi awal.
- **Perbaikan yang Dilakukan:**
  1. Memperbarui `src/app/api/laporan-harian/route.ts` untuk mengekstrak `const asDraft = Boolean(body.asDraft)` dan menyimpan `status: asDraft ? "DRAFT" : "TERKIRIM"`.
  2. Memperbarui `src/app/laporan-harian/baru/page.tsx` agar menginisialisasi `tanggal` sejak awal dan menggunakan *functional state update* `setForm((f) => ({ ...f, ... }))`.
- **Verifikasi Regression Test:**
  - Ditambahkan kasus uji integrasi `menyimpan laporan harian sebagai DRAFT ketika asDraft=true (Regression Test Bug Fix)` pada `tests/integration/simag-integration.test.ts` (**PASS**).
  - Ditambahkan skenario BDD `Scenario: Mahasiswa membuat draft laporan harian baru` pada `tests/features/simag_features.feature` (**PASS**).

### Bug #2: Atribut Aksesibilitas Form (`htmlFor`/`id`) dan Label Tombol Navigasi (`aria-label`) Belum Lengkap
- **Lokasi File:** `src/app/login/page.tsx`, `src/app/laporan-harian/baru/page.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Dock.tsx`
- **Akar Masalah (Root Cause):**
  - Elemen `<label>` pada form login dan form laporan harian belum dihubungkan secara eksplisit menggunakan `htmlFor` dan `id` pada kontrol `<input>`/`<textarea>`, serta tombol ikon pada `Navbar` dan `Dock` belum memiliki `aria-label`.
- **Perbaikan yang Dilakukan:**
  - Menambahkan pasangan atribut `htmlFor` dan `id` pada seluruh field input `/login` dan `/laporan-harian/baru`, serta menambahkan `aria-label` pada tombol menu profil, toggle visibilitas password, dan item navigasi `Dock`.

---

## 5. Bukti Hasil Pengujian & Artefak

Seluruh artefak laporan dan tangkapan layar tersimpan pada direktori `tests/reports/`:

1. **Laporan HTML Cucumber BDD:** `tests/reports/cucumber-report.html`
2. **Laporan JSON Cucumber BDD:** `tests/reports/cucumber-report.json`
3. **Ringkasan Statistik Pengujian JSON:** `tests/reports/test-summary.json`
4. **Tangkapan Layar Visual (Screenshots):**
   - `tests/reports/screenshots/usability-task1-dashboard-desktop.png` (Tampilan Dashboard Desktop `1280x800`)
   - `tests/reports/screenshots/usability-task4-form-laporan.png` (Tampilan Formulir Buat Laporan Harian & Indikator Karakter)
   - `tests/reports/screenshots/usability-task5-mobile-responsive.png` (Tampilan Responsif Smartphone `375x667` tanpa *overflow*)

---

## 6. Kesimpulan & Keterbatasan (Limitations)

### Kesimpulan
Seluruh rangkaian pengujian (**Unit Testing**, **Integration Testing**, **BDD Automation Testing**, dan **Usability & Responsive Testing**) beserta **Post-Merge Hardening Audit** telah berhasil diimplementasikan dan dieksekusi langsung terhadap kode sumber **SIMAG BMKG** dengan tingkat keberhasilan **100% (58/58 PASS, 0 FAIL)**. Seluruh pengujian (baik Integration, BDD, maupun E2E) kini terisolasi penuh pada database `simag_bmkg_test` yang dilindungi oleh `assertSafeTestDatabaseUrl()` dan server pengujian terisolasi (`http://localhost:3201`) sehingga tidak pernah menyentuh database utama/production (`simag_bmkg`).

### Keterbatasan (Limitations)
1. Pengujian integrasi memanggil *Route Handlers* Next.js secara langsung dalam proses Node.js terhadap database PostgreSQL terisolasi (`simag_bmkg_test`) menggunakan injeksi sesi terkontrol (`SIMAG_TEST_SESSION` yang dikunci oleh `NODE_ENV !== "production"` dan `SIMAG_ALLOW_TEST_AUTH === "true"`), sedangkan siklus *cookie* HTTP diuji penuh melalui Playwright pada lapisan BDD dan E2E di atas server terisolasi (`http://localhost:3201`).
2. Evaluasi *Usability Testing* otomatis memverifikasi penyelesaian tugas, struktur semantik, dan responsivitas layar secara terprogram, serta dilengkapi instrumen observasi dan kuesioner SUS siap pakai untuk pengujian partisipan manusia.
