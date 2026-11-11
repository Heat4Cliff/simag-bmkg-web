# Laporan Fase 5 — Validasi Baseline Aplikasi SIMAG BMKG

Laporan ini mendokumentasikan hasil pengujian dan pengukuran kondisi awal (*baseline validation*) terhadap aplikasi **SIMAG BMKG** ([`D:\Development\simag-bmkg-web`](file:///D:/Development/simag-bmkg-web)) pada commit baseline `59e322ba683179689c8f798e1f9ab3d707ca0088` sebelum dimulainya implementasi kriteria UAS (Unit Testing, Linter, dan SonarQube).

---

## 1. Validasi Integritas Git
- **Branch Aktif**: `main` (sinkron dengan `origin/main`)
- **Baseline Commit**: `59e322ba683179689c8f798e1f9ab3d707ca0088`
- **Remote Origin**: `https://github.com/Heat4Cliff/simag-bmkg-web.git`
- **Working Tree**: Bersih (`clean working tree`). File `.env` terbukti diabaikan oleh `.gitignore` dan tidak terlacak di Git.
- **Status Integritas**: **PASS**

---

## 2. Validasi Konfigurasi Environment & Keamanan
Seluruh environment variable yang disyaratkan terverifikasi ada dan valid secara struktural tanpa menampilkan nilai rahasia:
- `DATABASE_URL`: Terkonfigurasi ke database development `simag_bmkg` pada port 5432.
- `TEST_DATABASE_URL`: Terkonfigurasi ke database testing `simag_bmkg_test` pada port 5432.
- `NEXTAUTH_SECRET`: String aman (panjang 64 karakter).
- `NEXTAUTH_URL`: `http://localhost:3200`
- `TEST_BASE_URL`: `http://localhost:3201`
- `HEADLESS`: `true`
- **Status Keamanan**: **PASS**

---

## 3. Validasi Konektivitas Prisma & Identitas Database
Kueri read-only `SELECT current_database(), current_user` dieksekusi menggunakan Prisma Client resmi dengan driver adapter `@prisma/adapter-pg`:
- **Development Client**: Terhubung ke database `simag_bmkg` sebagai user `simag_local`.
- **Testing Client**: Terhubung ke database `simag_bmkg_test` sebagai user `simag_test`.
- **Isolasi Database**: Akses silang diblokir secara ketat oleh PostgreSQL (`Error 42501: permission denied for database`).
- **Status Konektivitas**: **PASS**

---

## 4. Validasi Baseline TypeScript (`npx tsc --noEmit`)
- **Status**: **FAIL (12 Existing Errors)**
- **Karakteristik**: Seluruh error merupakan kondisi *existing* dari repositori awal (alasan mengapa penulis proyek menyetel `ignoreBuildErrors: true` pada `next.config.ts`).
- **Daftar Temuan Existing**:
  1. `next.config.ts(7,3)`: Properti `swSrc` tidak dikenali pada `PluginOptions` (`@ducanh2912/next-pwa`).
  2. `prisma/seed.ts(69,7)`: Nilai `"PEMBIMBING"` tidak sesuai dengan enum `Role`.
  3. `prisma/seed.ts(73,42)`: Properti `pembimbingProfile` tidak ada pada Prisma Client.
  4. `prisma/seed.ts(98,7)`: Properti `institusiAsal` tidak ada pada model `MahasiswaProfile`.
  5. `src/app/api/admin/tempat-magang/[id]/route.ts(90,47)`: Akses `error.errors` pada `ZodError` (Zod v4 menggunakan `error.issues`).
  6. `src/app/api/admin/tempat-magang/route.ts(66,47)`: Akses `error.errors` pada `ZodError`.
  7. `src/app/api/kalender/[id]/route.ts(35,27)`: Tipe dynamic route params adalah `Promise<{ id: string }>` (Next.js 15/16).
  8. `src/app/api/profil/password/route.ts(17,54)`: Akses `error.errors` pada `ZodError`.
  9. `src/app/pembimbing/mahasiswa/page.tsx(8,17)`: Variabel `session` bertipe `null | Session`.
  10. `src/components/ui/BlurText.tsx(58,22)`: Inkompatibilitas tipe generator animasi pada `framer-motion`.
  11. `src/lib/jwt.ts(6,14)`: Type overload `expiresIn` pada `jsonwebtoken`.
  12. `tests/integration/simag-integration.test.ts(757,28)`: Argumen fungsi tidak sesuai tanda tangan metode.

---

## 5. Validasi Baseline Linter (`npm run lint`)
- **Perintah**: `npm run lint` (`eslint`)
- **Status**: **FAIL (258 Problems — 112 Errors, 146 Warnings)**
- **Analisis Kategori Masalah**:
  1. **File Generated Ter-lint**: File build PWA (`public/workbox-*.js`, `public/sw.js`) ikut diperiksa oleh ESLint karena belum dikecualikan pada `eslint.config.mjs`.
  2. **TypeScript `any`**: Penggunaan `@typescript-eslint/no-explicit-any` pada route handlers dan modul otorisasi.
  3. **React 19 Rule**: Aturan baru `react-hooks/set-state-in-effect` mendeteksi pemanggilan `setState` langsung dalam `useEffect` di komponen profil dan riwayat.
  4. **Unused Variables**: Peringatan `@typescript-eslint/no-unused-vars` pada import yang tidak terpakai.
  5. **CommonJS Require**: Penggunaan `require()` pada `prisma/seed.js`.

---

## 6. Validasi Baseline Unit Test Existing (`npm run test:unit`)
- **Perintah**: `npm run test:unit` (`tsx --test tests/unit/core.test.ts`)
- **Status**: **PASS (100% Lulus)**
- **Rincian**:
  - Total Test Suites: **5**
  - Total Unit Tests: **19 test cases**
  - Passed: **19**
  - Failed: **0**
  - Skipped: **0**
  - Durasi: **1.02 detik**
- **Cakupan Modul**:
  - `hitungJarakMeter` (Formula Haversine geofence presensi 500m)
  - `cekLibur` (Kalender presensi, hari libur nasional, akhir pekan)
  - `cekPeringatan` (Hari peringatan nasional)
  - Validasi Zod (`loginSchema`, `passwordSchema`, `laporanSchema`)
  - `getStatusLabel` (Penerjemah status presensi dan laporan)

---

## 7. Validasi Baseline Build Aplikasi
- **Perintah**: `$env:NEXTAUTH_URL=''; npx next build --webpack`
- **Status**: **PASS (Build Berhasil)**
- **Catatan Sintaks**: Script default `"build": "NEXTAUTH_URL='' next build --webpack"` pada `package.json` mengandung sintaks bash inline env variable yang gagal di Windows cmd (`'NEXTAUTH_URL' is not recognized`). Namun saat dijalankan dengan sintaks environment variable Windows, proses build sukses 100%.
- **Hasil Kompilasi**:
  - Seluruh 31 route aplikasi (halaman admin, mahasiswa, profil, dan route API) berhasil dikompilasi.
  - Halaman statis (31/31) ter-generate dalam 664 ms.
  - Aset PWA dan Service Worker terkompilasi optimal.

---

## 8. Validasi Aplikasi Development & HTTP Smoke Test
- **Perintah**: `npx next dev -p 3200 -H 127.0.0.1 --webpack`
- **Status Port 3200**: Bersih dan berhasil mendengarkan.
- **Smoke Test HTTP**:
  - `GET http://127.0.0.1:3200/` $\rightarrow$ Status **307 Temporary Redirect** mengarah ke `/login` (perilaku middleware otorisasi yang benar).
  - `GET http://127.0.0.1:3200/login` $\rightarrow$ Status **200 OK**, HTML berhasil dirender lengkap dengan form login, input `identifier`, input `password`, serta branding SIMAG.

---

## 9. Rekomendasi Menuju Fase 6 (Kriteria UAS: Unit Testing, Lint, SonarQube)
1. **Unit Testing**:
   Arsitektur `node:test` + `tsx` terbukti sangat cepat (1.02 detik) dan deterministik. Pada Fase 6, kita dapat memperluas cakupan pengujian ke unit-unit fungsional murni seperti helper format tanggal, sanitasi input, dan logika kalkulasi presensi.
2. **ESLint**:
   Memasukkan `public/**` ke dalam `globalIgnores` pada `eslint.config.mjs` akan secara instan memangkas puluhan error dari file PWA/Workbox yang merupakan aset ter-bundle.
3. **SonarQube**:
   Docker Desktop yang sudah aktif siap menjalankan container SonarQube Community untuk analisis statis kode dan integrasi coverage report.
