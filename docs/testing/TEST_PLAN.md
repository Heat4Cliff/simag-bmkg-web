# Test Plan — Sistem Informasi Magang (SIMAG) BMKG

**Mata Kuliah:** Analisis dan Pengujian Sistem (IF7AB) — Pertemuan 11  
**Proyek:** Sistem Informasi Magang (SIMAG) BMKG / UNUGHA  
**Repository:** `https://github.com/Heat4Cliff/simag-bmkg-web.git`  
**Branch Pengujian:** `feat/simag-testing-automation`

---

## 1. Tim Pengembang & Penguji (Kelompok 3)

| No | Nama Mahasiswa | NIM | Peran |
|----|----------------|-----|-------|
| 1 | Fattatunnida Amalia Rahma | `23EO10010` | QA Analyst & Usability Tester |
| 2 | IAN ALFIAN FADILAH | `23EO10039` | Test Automation Engineer (BDD) |
| 3 | MUHAMMAD ARIF RIVANDI | `23EO10005` | Backend & Integration Test Engineer |
| 4 | Mohammad Alwan Abbas Abdillah | `23EO10030` | Lead Software Engineer & DevOps CI/CD |
| 5 | ZAINUL MUTAWAKKIL | `23EO10003` | QA Documentation & Reporting |

---

## 2. Tujuan Pengujian

Dokumen **Test Plan** ini disusun sebagai acuan komprehensif dalam pelaksanaan pengujian perangkat lunak pada aplikasi web **SIMAG BMKG**. Tujuan utama pengujian meliputi:

1. **Verifikasi Perilaku Sistem Berbasis Skenario Bisnis (BDD Automation Testing):** Memastikan alur utama pengguna (*Authentication*, *Dashboard*, *Laporan Harian*, *Riwayat Absensi*, dan *Profil*) berjalan sesuai spesifikasi kebutuhan pengguna menggunakan notasi Gherkin (`Given-When-Then`).
2. **Validasi Integrasi Antar-Komponen (Integration Testing):** Memastikan integrasi nyata antara *Route Handlers* Next.js, validasi skema Zod, *Authentication/Authorization* (NextAuth v5 & JWT Mobile API), logika bisnis (*Geofencing* Haversine, perhitungan keterlambatan absensi `> 07:00 WIB`, RBAC), dan persistensi database PostgreSQL melalui Prisma ORM berjalan akurat.
3. **Evaluasi Ketergunaan & Aksesibilitas (Usability Testing):** Mengukur kemudahan penggunaan antarmuka, kejelasan label, umpan balik interaksi, tata letak responsif (*desktop* & *mobile*), serta kepatuhan aksesibilitas dasar.
4. **Deteksi Dini & Pencegahan Regresi:** Menemukan cacat (*bug*) pada kode sumber, memperbaikinya secara minimal dan aman, serta mengunci perbaikan tersebut dengan *regression test* otomatis yang terintegrasi ke dalam GitHub Actions CI.

---

## 3. Ruang Lingkup Pengujian (Scope)

### 3.1. Dalam Ruang Lingkup (In-Scope)
- **Modul Autentikasi & Otorisasi:**
  - Login Web berbasis NextAuth v5 Credentials (`email` atau `username`).
  - Login Mobile berbasis REST API (`POST /api/mobile/auth/login`) dan proteksi Bearer JWT (`GET /api/mobile/auth/me`).
  - Proteksi *route* melalui Middleware (`src/middleware.ts`) dan RBAC (*Role-Based Access Control*) untuk *role* `MAHASISWA`, `DPL`, `MENTOR_INSTANSI`, dan `SUPERADMIN`.
- **Modul Dashboard Mahasiswa:**
  - Kartu statistik kehadiran, laporan terkirim, modul praktikum, status absensi harian, progres magang, dan navigasi cepat.
- **Modul Laporan Harian (Logbook):**
  - Pembuatan laporan harian sebagai `DRAFT` maupun `TERKIRIM` (`POST /api/laporan-harian`).
  - Pencarian/filter laporan harian (`GET /api/laporan-harian`).
  - Penilaian/revisi laporan harian oleh DPL (`PATCH /api/laporan-harian/[id]`).
- **Modul Absensi & Geofencing BMKG:**
  - Validasi koordinat GPS menggunakan rumus Haversine terhadap radius kantor BMKG (`POST /api/absensi`).
  - Penentuan status `HADIR` vs `TELAT` (`keterangan: "Terlambat"` jika melewati batas jam masuk `07:00 WIB`).
  - Pengajuan izin ketidakhadiran (`status: IZIN`) dan tampilan tabel riwayat absensi (`/riwayat-absensi`).
- **Modul Kalender & Pengaturan Sistem:**
  - Manajemen jadwal kegiatan pribadi dan global (`POST /api/kalender`, `GET /api/kalender`).
  - Pembatasan hak akses perubahan pengaturan sistem hanya untuk `SUPERADMIN` (`PUT /api/pengaturan`).

### 3.2. Di Luar Ruang Lingkup (Out-of-Scope)
- Pengujian beban ekstrim (*Load/Stress Testing* ribuan pengguna konkuren).
- Pengujian pengiriman *Web Push Notification* ke layanan pihak ketiga FCM/APNs eksternal.
- Pengujian aplikasi *native* Android (`.apk`) secara langsung di perangkat fisik (namun kontrak *endpoint* `/api/mobile/*` tetap diuji pada *Integration Testing*).

---

## 4. Jenis Pengujian & Tools

| Jenis Pengujian | Framework / Tools | Target Pengujian | Command Eksekusi |
|-----------------|-------------------|------------------|------------------|
| **Unit Testing** | Node.js Test Runner (`node:test`) + `tsx` + `assert/strict` | Fungsi utilitas murni (`src/lib/utils.ts`) dan skema validasi Zod (`src/lib/validations.ts`) | `npm run test:unit` |
| **Integration Testing** | Node.js Test Runner + Prisma 7 (`@prisma/adapter-pg`) + PostgreSQL Test DB | Integrasi nyata Next.js API Route Handlers dengan PostgreSQL terisolasi (`simag_bmkg_test`) | `npm run test:integration` |
| **BDD Automation Testing** | `@cucumber/cucumber` (Cucumber.js) + `playwright` (Chromium Headless) | Alur pengguna *end-to-end* berbasis fitur Gherkin (`.feature`) pada browser nyata | `npm run test:bdd` |
| **Usability & Responsive Audit** | `playwright` + Instrumen Evaluasi Usability | Verifikasi 5+ *user tasks*, responsivitas *viewport mobile* (`375x667`), dan atribut aksesibilitas (`aria-label`, `label[for]`, `alt`) | `npm run test:e2e` |
| **Test Reporting** | Custom Report Aggregator + Cucumber HTML/JSON Formatter | Agregasi statistik pengujian aktual ke JSON & HTML beserta tangkapan layar (*screenshots*) | `npm run test:report` |

---

## 5. Lingkungan Pengujian (Test Environment)

- **Sistem Operasi:** Linux (`ubuntu-latest` pada CI / Debian-based Server pada lokal)
- **Runtime Node.js:** Node.js `v20.19.2` (lokal) & `v22.x` (GitHub Actions CI)
- **Framework Aplikasi:** Next.js `16.3.2` (App Router), React `19.2.8`, TypeScript `5.x`
- **Database Pengujian:**
  - **Integration Test:** Database PostgreSQL terisolasi bernama `simag_bmkg_test` (`postgresql://postgres:***@127.0.0.1:5432/simag_bmkg_test`). Dibuat dan dibersihkan otomatis melalui `tests/support/setup-test-db.ts` tanpa menyentuh data produksi.
  - **BDD & E2E Test:** Menggunakan *synthetic test fixture user* khusus (`qa.automation.mhs@test.simag.local` / `username: qa_bdd_mahasiswa`) yang dibuat sebelum skenario berjalan dan dihapus beserta seluruh data turunannya pada *hook* `AfterAll`.
- **Browser Engine:** Headless Chromium / Google Chrome (`1280x800` untuk desktop dan `375x667` untuk pengujian responsif mobile).

---

## 6. Strategi Pengujian (Test Strategy)

1. **Isolasi Data (Zero Production Contamination):**
   - Seluruh pengujian integrasi diarahkan secara paksa ke database `simag_bmkg_test` melalui variabel lingkungan `DATABASE_URL` sebelum modul Prisma diimpor.
   - Setiap *test suite* menjalankan `truncateTestDatabase()` dan *seeding* data sintetis dari `tests/fixtures/test-data.ts`.
2. **Selector Stabil & Tanpa Hardcoded Wait:**
   - Skenario BDD dan E2E menggunakan *semantic locators* Playwright (`getByRole`, `getByText`, `locator('input[...]')`) serta *explicit state waiting* (`waitFor({ state: "visible" })`, `waitForURL`).
3. **Penanganan Izin Browser (Geolocation & Notification):**
   - Karena SIMAG BMKG menerapkan `LocationEnforcerModal` (wajib GPS untuk mahasiswa) dan `NotificationPromptModal`, *browser context* pada Playwright dikonfigurasi dengan izin `permissions: ["geolocation", "notifications"]` serta koordinat sintetis Stasiun Meteorologi BMKG Cilacap (`-7.7219129, 109.0131919`).
4. **Bukti Eksekusi Otomatis:**
   - *Hook* `After` pada Cucumber secara otomatis menyimpan tangkapan layar ke `tests/reports/screenshots/` apabila terdapat skenario yang gagal, serta melampirkannya ke dalam laporan `tests/reports/cucumber-report.html`.

---

## 7. Risiko dan Keterbatasan (Risks & Limitations)

1. **Ketergantungan Layanan Geolocation & Koneksi Jaringan:**
   - Pada perangkat nyata di dalam ruangan (*indoors*), akurasi GPS dapat menurun. Pada pengujian otomatis, koordinat GPS disimulasikan melalui API Geolocation Playwright.
2. **Perbedaan Lingkungan Session NextAuth vs API Route:**
   - Fungsi `auth()` dari NextAuth v5 pada lingkungan browser membaca *encrypted cookie* `__Secure-authjs.session-token`, sedangkan pada pengujian integrasi Node.js digunakan injeksi sesi uji terkontrol (`SIMAG_TEST_SESSION`) agar *Route Handlers* dapat diuji langsung tanpa harus menjalankan server HTTP penuh untuk setiap kasus uji API.
3. **Keterbatasan Otomasi Usability:**
   - Pengujian otomatis dengan Playwright dapat memverifikasi keterbacaan elemen DOM, tidak adanya *horizontal overflow*, kontras/visibilitas elemen, dan atribut ARIA, namun **tidak menggantikan** persepsi kognitif penguji manusia. Oleh karena itu, instrumen kuesioner dan tabel observasi manusia disediakan secara lengkap pada `docs/testing/USABILITY_TESTING.md`.
