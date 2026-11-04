# Dokumentasi BDD Automation Testing — SIMAG BMKG

**Framework:** Cucumber.js (`@cucumber/cucumber@10.9.0`) + Playwright (`playwright@1.52.0`)  
**Bahasa Spesifikasi:** Gherkin (Bahasa Indonesia)  
**Lokasi Direktori:** `tests/features/`, `tests/step-definitions/`, `tests/support/`

---

## 1. Konsep & Alasan Pemilihan Tools

**Behavior-Driven Development (BDD)** adalah pendekatan pengujian perangkat lunak yang menjembatani komunikasi antara pemangku kepentingan non-teknis dan tim pengembang melalui skenario berbasis perilaku nyata pengguna dengan format **Given – When – Then**.

### Alasan Pemilihan Playwright + Cucumber.js:
1. **Kesesuaian dengan Arsitektur Next.js 16 App Router:** SIMAG BMKG menggunakan *Server Components*, *Middleware* autentikasi NextAuth v5, serta *Client Components* interaktif. Playwright mampu mengeksekusi Chromium asli sehingga aliran *cookie* `__Secure-authjs.session-token`, *redirect* middleware, dan *hydration* React dapat diuji secara nyata.
2. **Integrasi Gherkin Bahasa Indonesia:** Cucumber.js mendukung penulisan skenario menggunakan bahasa domain SIMAG BMKG yang mudah dipahami oleh dosen pembimbing, mentor instansi BMKG, maupun mahasiswa.
3. **Reproduksibilitas & Pelaporan:** Menghasilkan laporan terstruktur dalam format JSON (`tests/reports/cucumber-report.json`) dan HTML (`tests/reports/cucumber-report.html`) lengkap dengan tangkapan layar otomatis jika terjadi kegagalan.

---

## 2. Struktur Direktori BDD

```text
tests/
├── features/
│   ├── authentication.feature     # Skenario Login, Gagal Login, Protected Route, & Logout
│   ├── dashboard.feature          # Skenario Kartu Statistik, Sapaan/Progres, & Navigasi Cepat
│   └── simag_features.feature     # Skenario Buat Draft Laporan, Filter Laporan, Riwayat Absensi, & Profil
├── step-definitions/
│   ├── authentication.steps.ts    # Implementasi step Given/When/Then untuk autentikasi
│   ├── dashboard.steps.ts         # Implementasi step Given/When/Then untuk dashboard
│   └── simag_features.steps.ts    # Implementasi step Given/When/Then untuk fitur utama SIMAG
├── support/
│   ├── world.ts                   # Konfigurasi SimagWorld, Playwright BrowserContext, & Geolocation
│   ├── hooks.ts                   # Lifecycle BeforeAll, AfterAll, Before, After (Screenshot on failure)
│   ├── setup-test-db.ts           # Penyediaan & pembersihan akun fixture BDD non-produksi
│   └── generate-report.ts         # Generator ringkasan hasil test aktual
├── fixtures/
│   └── test-data.ts               # Data uji sintetis aman (non-produksi)
└── reports/
    ├── cucumber-report.html       # Laporan visual HTML Cucumber
    ├── cucumber-report.json       # Laporan mentah JSON Cucumber
    ├── test-summary.json          # Ringkasan metrik eksekusi
    └── screenshots/               # Bukti screenshot pengujian
```

---

## 3. Daftar Feature & Skenario BDD yang Diimplementasikan

### 3.1. `tests/features/authentication.feature`
Menguji siklus hidup autentikasi dan proteksi halaman pada SIMAG BMKG (4 skenario):

1. **Scenario: Pengguna berhasil login**
   - `Given` pengguna membuka halaman login SIMAG
   - `When` pengguna memasukkan kredensial yang valid
   - `And` menekan tombol login
   - `Then` pengguna berhasil masuk
   - `And` dashboard ditampilkan
2. **Scenario: Pengguna gagal login**
   - `Given` pengguna membuka halaman login SIMAG
   - `When` pengguna memasukkan kredensial yang tidak valid
   - `And` menekan tombol login
   - `Then` sistem menolak login
   - `And` menampilkan pesan error yang sesuai (`Username/Email atau password salah. Silakan coba lagi.`)
3. **Scenario: Pengguna mengakses halaman protected tanpa login**
   - `Given` pengguna belum login
   - `When` pengguna mengakses halaman protected secara langsung (`/dashboard`)
   - `Then` sistem menolak akses atau mengarahkan pengguna ke halaman login (`/login`)
4. **Scenario: Pengguna logout**
   - `Given` pengguna telah login
   - `When` pengguna melakukan logout (melalui menu profil Navbar -> tombol `Keluar`)
   - `Then` session pengguna berakhir (cookie session dihapus & `/api/auth/session` bernilai `null`)
   - `And` pengguna kembali ke halaman login

---

### 3.2. `tests/features/dashboard.feature`
Menguji informasi dan navigasi pada halaman utama Dashboard Mahasiswa (3 skenario):

5. **Scenario: Menampilkan ringkasan kartu statistik pada dashboard mahasiswa**
   - Memastikan 4 kartu utama (`Kehadiran Bulan Ini`, `Laporan Terkirim`, `Modul Dibuat`, `Status Hari Ini`) tampil secara utuh.
6. **Scenario: Menampilkan informasi sapaan pengguna dan progres magang**
   - Memastikan sapaan `Selamat datang,` menampilkan nama pengguna yang sedang login beserta indikator `Progres Magang` dan tautan `Lihat profil`.
7. **Scenario: Navigasi dari kartu statistik dashboard menuju halaman laporan harian**
   - Memastikan klik pada kartu `Laporan Terkirim` mengarahkan pengguna ke `/laporan-harian` dan menampilkan judul halaman `Laporan Harian`.

---

### 3.3. `tests/features/simag_features.feature`
Menguji fitur inti operasional SIMAG BMKG yang digunakan mahasiswa sehari-hari (4 skenario):

8. **Scenario: Mahasiswa membuat draft laporan harian baru**
   - Mengisi form `/laporan-harian/baru` (judul, deskripsi kegiatan, kendala) dan menekan tombol `Simpan Draft`, lalu memverifikasi redirect ke `/laporan-harian` dan kemunculan laporan berstatus `Draft`.
9. **Scenario: Mahasiswa mencari laporan harian menggunakan fitur filter pencarian**
   - Mengetik kata kunci pada kolom pencarian laporan di `/laporan-harian` dan memastikan daftar laporan memfilter item sesuai kata kunci.
10. **Scenario: Mahasiswa melihat halaman riwayat absensi**
    - Membuka `/riwayat-absensi` dan memverifikasi tabel menampilkan kolom `Tanggal`, `Masuk`, `Pulang`, `Status`, dan `Keterangan`.
11. **Scenario: Mahasiswa melihat halaman profil dan informasi magang**
    - Membuka `/profil` dan memverifikasi bagian `Informasi Akun` serta `Informasi Magang`.

---

## 4. Keamanan Fixture & Isolasi Data

- Skenario BDD **tidak menggunakan akun pengguna produksi**.
- Sebelum seluruh skenario berjalan (`BeforeAll`), fungsi `ensureBddTestUser()` pada `tests/support/setup-test-db.ts` membuat akun sintetis:
  - **Email:** `qa.automation.mhs@test.simag.local`
  - **Username:** `qa_bdd_mahasiswa`
  - **Nama:** `Mahasiswa Uji BDD Otomatis`
  - **Role:** `MAHASISWA`
- Setelah seluruh skenario selesai (`AfterAll`), fungsi `cleanupBddTestUser()` menghapus seluruh laporan harian, absensi, profil mahasiswa, dan akun uji tersebut sehingga database tetap bersih.

---

## 5. Cara Menjalankan BDD Automation Testing

Pastikan server aplikasi SIMAG BMKG sedang berjalan (misalnya pada port `3200`), lalu jalankan perintah berikut dari *root directory* proyek:

```bash
# Menjalankan seluruh skenario BDD Cucumber + Playwright
npm run test:bdd

# Menghasilkan ringkasan laporan pengujian
npm run test:report
```

Laporan hasil pengujian dapat dilihat pada:
- **HTML Report:** `tests/reports/cucumber-report.html`
- **JSON Report:** `tests/reports/cucumber-report.json`
- **Summary Report:** `tests/reports/test-summary.json`

---

## 6. Hasil Eksekusi Aktual

| Metrik | Jumlah | Status |
|--------|--------|--------|
| **Total Feature Files** | 3 (`authentication`, `dashboard`, `simag_features`) | **PASS** |
| **Total Scenarios** | 11 Skenario | **11 PASS, 0 FAIL** |
| **Total Steps** | 52 Steps | **52 PASS, 0 FAIL, 0 SKIPPED** |
