# Laporan Fase 6 — Implementasi Unit Testing SIMAG BMKG

Laporan komprehensif ini mendokumentasikan implementasi peningkatan **Unit Testing** pada repositori **SIMAG BMKG** ([`D:\Development\simag-bmkg-web`](file:///D:/Development/simag-bmkg-web)) untuk memenuhi kriteria Ujian Akhir Semester (UAS).

---

## 1. Status Git Awal
- **Base Commit**: `59e322ba683179689c8f798e1f9ab3d707ca0088` (`main`)
- **Working Branch**: `uas/unit-testing` (dibuat khusus untuk mengisolasi penugasan Unit Testing)
- **Status Repository**: Bersih, tanpa modifikasi pada logika bisnis utama aplikasi.

---

## 2. Penilaian & Audit Unit Test Awal (*Baseline Assessment*)
Pada commit baseline awal, unit test terdiri dari:
- **File Test**: `tests/unit/core.test.ts`
- **Jumlah Suite**: 5 suite
- **Jumlah Test**: 19 test cases
- **Cakupan Pengujian Awal**:
  - `hitungJarakMeter` dasar (4 test)
  - `cekLibur` dasar (5 test)
  - `cekPeringatan` dasar (2 test)
  - `validations.ts` dasar: `loginSchema`, `passwordSchema`, `laporanSchema` (6 test)
  - `getStatusLabel` dasar (2 test)
- **Kesenjangan (Gaps) yang Ditemukan**:
  1. Belum ada pengujian untuk `createUserSchema`, `modulSchema`, `absensiSchema`, dan `jadwalSchema`.
  2. Belum ada pengujian nilai batas toleransi geofence presensi (tepat pada radius 500m) dan koordinat ekstrem/antipodal.
  3. Belum ada pengujian pembeda akhir pekan hari Minggu vs Sabtu pada `cekLibur`.
  4. Belum ada pengujian pewarnaan badge Tailwind (`getStatusLaporanColor`, `getStatusAbsensiColor`) serta utilitas class merging `cn()`.
  5. Belum ada pengujian utilitas pemformatan waktu Indonesia / Asia-Jakarta (`formatTanggal`, `formatTanggalCompact`, `formatWaktu`, `getJakartaDate*`).
  6. Belum ada pengujian cache storage geolokasi offline/dual-stage pada `src/lib/geo.ts`.

---

## 3. Penambahan Pengujian & Justifikasi Teknis
Sebanyak **35 test case baru** ditambahkan ke `tests/unit/core.test.ts`, meningkatkan total pengujian dari **19 menjadi 54 test cases** yang terbagi dalam **7 test suites**:

### Suite 1: Geofence Presensi (`hitungJarakMeter` & Konstanta Koordinat) — 9 Tests
- Nilai nol untuk titik identik.
- Simetri jarak arah bolak-balik ($A \rightarrow B = B \rightarrow A$).
- Pembedaan titik dalam (<500m) dan luar (>500m) radius.
- Jarak satu derajat pada ekuator (~111 km).
- Verifikasi konstanta `KOORDINAT_KANTOR` (-7.7186515, 109.0118975) dan `RADIUS_ABSENSI_METER` (500).
- Jarak titik antipodal (~20.000 km) dan kutub ke kutub.
- Presisi tinggi pada pergeseran mikro (<5 meter).
- Batas toleransi tepat di ambang batas 500 meter.

### Suite 2: Kalender Presensi (`cekLibur`) — 9 Tests
- Libur nasional dari daftar `ID_HOLIDAYS`.
- Pembeda spesifik Sabtu (`Akhir Pekan (Sabtu)`) dan Minggu (`Akhir Pekan (Minggu)`).
- Penonaktifan libur akhir pekan saat opsi `allowWeekend: true`.
- Libur nasional tetap berlaku meskipun `allowWeekend: true`.
- Hari kerja biasa tidak dianggap libur.
- Libur nasional kalender 2024 dan 2025.
- Fleksibilitas tipe parameter (Date object, string ISO, numeric timestamp).

### Suite 3: Kalender Kegiatan (`cekPeringatan`) — 5 Tests
- Hari Sumpah Pemuda (10-28).
- Tanggal reguler tanpa peringatan menghasilkan `null`.
- Hari peringatan BMKG / Meteorologi: Hari Meteorologi Sedunia (03-23) dan Hari Meteorologi, Klimatologi, dan Geofisika (07-21).
- Hari besar nasional (Kartini, Hardiknas, Harkitnas, Pramuka, Kesaktian Pancasila, Hari Pahlawan, Hari Ibu).
- Hari peringatan internasional (Hari Bumi, Lingkungan Hidup, AIDS Sedunia).

### Suite 4: Validasi Skema Input Pengguna & Laporan (`validations.ts`) — 16 Tests
- `loginSchema`: kredensial valid, identifier kosong, password < 6 karakter, ambang batas tepat 6 karakter.
- `passwordSchema`: kecocokan password baru, penolakan password tidak cocok, batas minimum password lama dan baru.
- `createUserSchema`: role valid (`SUPERADMIN`, `DPL`, `MAHASISWA`), penolakan role tidak dikenal, email tidak valid, batas password minimal 8 karakter.
- `laporanSchema`: judul >= 3 karakter, deskripsi >= 10 karakter, field kendala opsional.
- `modulSchema`: judul >= 3 karakter, kategoriId wajib diisi, konten >= 10 karakter.
- `absensiSchema`: tipe `MASUK` dan `PULANG`, koordinat latitude & longitude bertipe number, foto base64, penolakan tipe ilegal (`IZIN`, `SAKIT`).
- `jadwalSchema`: tipe `PRIBADI`, `BIMBINGAN`, `INSTANSI`, judul minimal 2 karakter, deskripsi dan jam opsional.

### Suite 5: Label Status & Pewarnaan Badge (`utils.ts`) — 6 Tests
- Penerjemahan seluruh 11 status operasional SIMAG (`DRAFT`, `TERKIRIM`, `DIREVIEW`, `DISETUJUI`, `REVISI`, `DITOLAK`, `HADIR`, `TELAT`, `IZIN`, `SAKIT`, `ALPA`).
- Fallback status kustom/baru.
- Pemetaan warna badge Tailwind status laporan (`getStatusLaporanColor`).
- Pemetaan warna badge Tailwind status absensi (`getStatusAbsensiColor`).
- Penggabungan kelas Tailwind dan penyelesaian konflik style melalui `cn()`.

### Suite 6: Format & Kalkulasi Tanggal Waktu Jakarta (`utils.ts`) — 7 Tests
- Format tanggal panjang berbahasa Indonesia (`formatTanggal`).
- Format ringkas tanggal `D/M/YYYY` (`formatTanggalCompact`).
- Format jam dan menit zona WIB/Asia-Jakarta (`formatWaktu`).
- Format tanggal ISO hari ini `YYYY-MM-DD` (`getJakartaDate`).
- Objek Date awal hari `00:00:00.000Z` (`getJakartaDateISO`).
- Objek Date awal bulan `00:00:00.000Z` (`getJakartaMonthStartISO`).
- Objek Date akhir bulan `23:59:59.999Z` (`getJakartaMonthEndISO`).

### Suite 7: Geolocation Cache Storage (`geo.ts`) — 2 Tests
- Proteksi pemanggilan di lingkungan non-browser (Node.js/SSR) mengembalikan `null` tanpa throw error.
- Simulasi `sessionStorage`: penyimpanan lokasi, pembacaan cache valid (<10 menit), pembersihan otomatis cache kedaluwarsa (>10 menit), dan toleransi parsing JSON korup.

---

## 4. Metodologi & Hasil Pengukuran Code Coverage
- **Tooling**: Node.js 22 Built-in Native Test Coverage (`node --experimental-test-coverage`).
- **Skrip Eksekusi**: `npm run test:unit:coverage`.
- **Hasil Pengukuran Terverifikasi**:

```text
------------------------------------------------------------------
file             | line % | branch % | funcs % | uncovered lines
------------------------------------------------------------------
src              |        |          |         | 
 lib             |        |          |         | 
  geo.ts         |  63.58 |    82.61 |   83.33 | 25-26 59-110 114
  holidays.ts    | 100.00 |    95.65 |   83.33 | 
  utils.ts       |  98.73 |    90.91 |  100.00 | 91-92
  validations.ts | 100.00 |    94.44 |  100.00 | 
tests            |        |          |         | 
 unit            |        |          |         | 
  core.test.ts   | 100.00 |    94.74 |   97.14 | 
------------------------------------------------------------------
all files        |  94.54 |    92.39 |   95.71 | 
------------------------------------------------------------------
```

- **Pencapaian Target**:
  - Cakupan baris (*Line Coverage*): **94.54%** (Jauh melampaui target minimal 80%).
  - Cakupan percabangan (*Branch Coverage*): **92.39%**.
  - Cakupan fungsi (*Function Coverage*): **95.71%**.
  - Modul bisnis utama `holidays.ts`, `utils.ts`, dan `validations.ts` mencapai **98% – 100%** line coverage.

---

## 5. Bukti Validasi Eksekusi
- **Perintah**: `npm run test:unit`
- **Exit Code**: `0` (Success)
- **Output TAP**:
  ```text
  1..7
  # tests 54
  # suites 7
  # pass 54
  # fail 0
  # cancelled 0
  # skipped 0
  # todo 0
  # duration_ms 474.5673
  ```
- **Durasi Eksekusi**: **~0.47 detik** (sangat cepat, deterministik, dan tanpa dependensi database/jaringan).

---

## 6. Berkas yang Diubah
1. `tests/unit/core.test.ts`: Penambahan 35 test cases (total 54 tests dalam 7 suites).
2. `package.json`: Penambahan skrip `"test:unit:coverage"`.
3. `docs/PHASE_6_UNIT_TEST_REPORT.md`: Laporan teknis implementasi unit test.

---

## 7. Status Git Commit & Instruksi Push
- **Branch**: `uas/unit-testing`
- **Commit SHA**: `ab2869b8d96cd885d0a345ed961abd6cd759c779`
- **Commit Message**: `test(unit): improve SIMAG business logic coverage`
- **Instruksi Push ke GitHub**:
  Karena Git Credential Manager pada Windows memerlukan interaksi autentikasi browser/token dari pengguna, jalankan perintah berikut di PowerShell Anda:
  ```powershell
  cd D:\Development\simag-bmkg-web
  git push -u origin uas/unit-testing
  ```
- **Pull Request / Branch Target**:
  Setelah di-push, branch `uas/unit-testing` siap untuk di-review atau dibuatkan Pull Request ke `main` di GitHub:
  `https://github.com/Heat4Cliff/simag-bmkg-web/tree/uas/unit-testing`

