# Baseline Environment & Configuration Report — SIMAG BMKG

Laporan audit komprehensif ini disusun pada tahap **Fase 2 (Analisis Konfigurasi Proyek)** secara *read-only* terhadap kondisi nyata repositori SIMAG BMKG pada commit baseline `59e322ba683179689c8f798e1f9ab3d707ca0088`.

---

## 1. Ringkasan Eksekutif & Stack Teknologi

| Komponen | Spesifikasi / Library | Keterangan |
| :--- | :--- | :--- |
| **Framework Utama** | Next.js `16.3.2` (App Router) | Menggunakan Turbopack / Webpack fallback (`--webpack`) |
| **UI Library** | React `19.2.8`, React DOM `19.2.8` | Versi React 19 modern |
| **Bahasa Pemrograman** | TypeScript `^5` | Strict mode diaktifkan di `tsconfig.json` |
| **Database ORM** | Prisma `^7.9.1` (`@prisma/client`, `@prisma/adapter-pg`) | Prisma 7 dengan driver adapter PostgreSQL (`pg`) |
| **Database Engine** | PostgreSQL (Relational) | Membutuhkan dua database lokal: `simag_bmkg` dan `simag_bmkg_test` |
| **Autentikasi** | NextAuth `^5.0.0-beta.32` (`@auth/prisma-adapter`) | Berbasis Session & JWT |
| **Linter** | ESLint `^9` (`eslint-config-next`) | Flat config format (`eslint.config.mjs`) |
| **Testing Engine** | Node.js Test Runner (`node:test`, `node:assert/strict`) | Eksekusi via `tsx --test` dan `node --import tsx` |
| **BDD Testing** | Cucumber.js `@cucumber/cucumber` `^10.9.0` | Gherkin features di `tests/features/` |
| **E2E / Browser Test**| Playwright `@playwright/test` `^1.52.0` | Mengontrol browser Chromium |
| **Mobile / PWA** | `@ducanh2912/next-pwa` `^10.2.9` | Service Worker custom di `public/sw.js` |

---

## 2. Analisis `package.json` & Scripts

### 2.1 Dependencies & devDependencies Kunci
- **Core**: `next@16.3.2`, `react@19.2.8`, `react-dom@19.2.8`, `zod@^4.4.3`, `zustand@^5.0.15`
- **Database**: `prisma@^7.9.1`, `@prisma/client@^7.9.1`, `@prisma/adapter-pg@^7.9.1`, `pg@^8.23.0`
- **Security & Auth**: `next-auth@^5.0.0-beta.32`, `bcryptjs@^3.0.3`, `jsonwebtoken@^9.0.3`
- **Testing**: `tsx@^4.23.15`, `@cucumber/cucumber@^10.9.0`, `@playwright/test@^1.52.0`, `playwright@^1.52.0`

### 2.2 Scripts yang Tersedia
- `dev`: `next dev -p 3200 -H ::`
- `build`: `NEXTAUTH_URL='' next build --webpack`
- `start`: `next start -p 3200 -H ::`
- `lint`: `eslint`
- `test:unit`: `tsx --test tests/unit/core.test.ts`
- `test:integration`: `node --env-file-if-exists=.env --import tsx --test tests/integration/simag-integration.test.ts`
- `test:bdd`: `node --env-file-if-exists=.env --import tsx ./node_modules/.bin/cucumber-js`
- `test:e2e`: `node --env-file-if-exists=.env --import tsx --test tests/e2e/usability-audit.test.ts`
- `test:report`: `node --env-file-if-exists=.env --import tsx tests/support/generate-report.ts`
- `db:push`: `prisma db push`
- `db:seed`: `prisma db seed` (`ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts`)
- `db:studio`: `prisma studio`
- `db:generate`: `prisma generate`

---

## 3. Analisis Database & Konfigurasi Prisma

### 3.1 Model & Relasi (`prisma/schema.prisma`)
Terdapat **15 Model** dan **5 Enum**:
1. **Enum**: `Role` (`SUPERADMIN`, `DPL`, `MENTOR_INSTANSI`, `MAHASISWA`), `StatusAbsensi`, `StatusLaporan`, `StatusModul`, `TipeJadwal`.
2. **Model Akun & Pengguna**: `User`, `Session`, `MahasiswaProfile`, `DplProfile`, `MentorProfile`.
3. **Model Operasional Magang**: `TempatMagang`, `Absensi`, `LaporanHarian`, `KategoriModul`, `ModulPraktikum`, `JadwalKegiatan`.
4. **Model Sistem & Pendukung**: `Notifikasi`, `PushSubscription`, `AuditLog`, `KampusSetting`.

### 3.2 Migrasi & Seeding
- **Tidak ada direktori `prisma/migrations`**: Repositori menggunakan `prisma db push` untuk sinkronisasi skema ke database.
- **Catatan Sinkronisasi Seeding**: Pada `prisma/seed.ts` dan `prisma/seed.js`, ditemukan referensi lama ke model `pembimbingProfile` dan role `PEMBIMBING`, sementara `schema.prisma` telah diperbarui ke `DplProfile` dan `MentorProfile`. Ini perlu diperhatikan saat eksekusi seed agar tidak terjadi error.

---

## 4. Analisis Testing Architecture

| Tipe Pengujian | Lokasi File | Framework / Runner | Jumlah Test / Skenario | Kebutuhan Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Test** | `tests/unit/core.test.ts` | Node.js Test Runner (`node:test`) | 19 test cases | Mandiri (tanpa DB & tanpa jaringan) |
| **Integration Test** | `tests/integration/simag-integration.test.ts` | Node.js Test Runner (`node:test`) | 24 test cases | PostgreSQL `simag_bmkg_test` |
| **BDD (Cucumber)** | `tests/features/*.feature` (3 files)<br>`tests/step-definitions/*.ts` | Cucumber.js + Playwright | 11 scenarios | Chromium + Next.js test server + DB test |
| **E2E Usability** | `tests/e2e/usability-audit.test.ts` | Playwright + `node:test` | 5 test cases | Chromium + Next.js test server + DB test |
| **Total** | | | **59 Test Cases / Scenarios** | |

### Fitur Keamanan Database Pengujian
Dalam `tests/support/setup-test-db.ts`, terdapat mekanisme guard `assertSafeTestDatabaseUrl()` yang secara tegas menolak eksekusi test jika nama database tidak berakhiran `_test`. Hal ini menjamin database development `simag_bmkg` tidak akan tertimpa atau terhapus saat pengujian berjalan.

---

## 5. Analisis ESLint & SonarQube

- **ESLint**:
  - Konfigurasi: `eslint.config.mjs` (Flat config format).
  - Ruleset: `@next/core-web-vitals` dan `typescript`.
  - Status: Script `npm run lint` telah tersedia.
- **SonarQube**:
  - `sonar-project.properties`: **Belum tersedia**.
  - Script SonarQube di `package.json`: **Belum tersedia**.
  - Pipeline SonarQube di `.github/workflows/`: **Belum tersedia** (hanya ada `unit-tests.yml` untuk unit test).
  - Code Coverage Tooling (LCOV): **Belum dikonfigurasi** (Node.js test runner mendukung `--experimental-test-coverage`, atau `c8`).

---

## 6. Analisis Environment Variables

Berdasarkan pemindaian kode sumber (`src`, `tests`, `prisma`), berikut adalah environment variable yang digunakan:

| Variabel | Lingkungan | Deskripsi | Nilai Default / Rekomendasi |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Development & Build | Koneksi PostgreSQL development | `postgresql://postgres:postgres@127.0.0.1:5432/simag_bmkg` |
| `TEST_DATABASE_URL` | Testing (Wajib akhiran `_test`) | Koneksi PostgreSQL isolasi test | `postgresql://postgres:postgres@127.0.0.1:5432/simag_bmkg_test` |
| `NEXTAUTH_SECRET` | Auth (Dev & Test) | Secret hashing token NextAuth | String acak min. 32 karakter |
| `NEXTAUTH_URL` | Web Server Auth | Host URL NextAuth | `http://localhost:3200` |
| `TEST_BASE_URL` | Test Server | URL port server uji otomatis | `http://localhost:3201` |
| `HEADLESS` | E2E & BDD | Mode headless Playwright | `true` |
| `SIMAG_ALLOW_TEST_AUTH`| Integration Test | Mock otorisasi pengujian | `true` (otomatis di-set saat test) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`| Web Push | Kunci publik VAPID | Opsional (mock/string) |
| `VAPID_PRIVATE_KEY` | Web Push | Kunci privat VAPID | Opsional (mock/string) |
| `VAPID_SUBJECT` | Web Push | Email/URL subject VAPID | Opsional |

---

## 7. Analisis Risiko Environment Windows & Rekomendasi

1. **Inline Bash Syntax di Script `build`**:
   - Di `package.json`, script build tertulis `NEXTAUTH_URL='' next build --webpack`.
   - Pada Windows PowerShell / CMD, sintaks `VAR=val command` adalah bash-only. Perlu diperhatikan saat eksekusi build di Windows lokal.
2. **PostgreSQL Service Lokal**:
   - Belum ada instance PostgreSQL yang aktif di Windows lokal.
   - Diperlukan instalasi PostgreSQL 16/17 (atau via Docker/portable) untuk menyediakan database `simag_bmkg` dan `simag_bmkg_test`.
3. **Playwright Chromium**:
   - Belum terpasang di `%LOCALAPPDATA%\ms-playwright`.
   - Diperlukan perintah `npx playwright install chromium` setelah `npm ci`.
4. **Lockfile Deterministik**:
   - `package-lock.json` v3 lengkap dan valid sehingga `npm ci` dapat dijalankan dengan aman tanpa merusak dependency tree.

---

## 8. Langkah Terjadwal (Fase 3 & Fase 4)

- **Fase 3**: Eksekusi `npm ci` untuk memulihkan seluruh dependencies persis sesuai `package-lock.json`, dilanjutkan pengunduhan browser Chromium Playwright.
- **Fase 4**: Penyiapan PostgreSQL Windows lokal, konfigurasi file `.env`, pembuatan database `simag_bmkg` dan `simag_bmkg_test`, serta sinkronisasi skema Prisma.
