# LAPORAN FASE 10 — INTEGRASI STATIC CODE ANALYSIS SONARQUBE
**Sistem Informasi Manajemen Magang (SIMAG) BMKG**

---

## 1. INFORMASI EKSEKUSI & GIT STATE

- **Repository**: `D:\Development\simag-bmkg-web`
- **Remote Git**: `https://github.com/Heat4Cliff/simag-bmkg-web`
- **Base Branch**: `uas/bdd-playwright` (commit `ca524341033bd5ce47ff5fd6a1736eb0ebd482b9`)
- **Active Branch**: `uas/sonarqube`
- **Lingkungan**: Windows 11 x64, Node.js v22.23.4, npm v10.9.9, Docker Desktop v29.9.3, PostgreSQL 18.6 Native
- **Production Boundary**: Debian Server (`simag.alwanabbas.my.id`) dan database production sama sekali tidak disentuh.

---

## 2. INFRASTRUKTUR & SETUP SONARQUBE SERVER

### 2.1. Docker Compose SonarQube
SonarQube dijalankan secara lokal pada host Windows menggunakan container resmi SonarQube Community Edition melalui `docker-compose.sonarqube.yml`:
- **Image**: `sonarqube:10.7-community`
- **Container Name**: `simag-sonarqube`
- **Port Mapping**: `127.0.0.1:9000:9000`
- **Volume Mounts**:
  - `sonarqube_data:/opt/sonarqube/data`
  - `sonarqube_extensions:/opt/sonarqube/extensions`
  - `sonarqube_logs:/opt/sonarqube/logs`
- **Health Check & Status**: Server UP, Version 10.7.0.96327 (Server ID: `147B411E-AaHH6tMA4tDN_dZcpt42`).

### 2.2. Otentikasi & Keamanan Kredensial
- Password default administrator (`admin:admin`) telah diubah ke kredensial khusus administrator lokal.
- Global User Analysis Token digenerate untuk scanner CLI.
- Token analisis disimpan pada file lokal `.sonar-token.local` yang diproteksi dan dikecualikan secara ketat pada `.gitignore` (`.sonar/`, `.scannerwork/`, `*.local`). Tidak ada token atau password yang masuk ke staging git.

---

## 3. KONFIGURASI SCANNER & LCOV CODE COVERAGE

### 3.1. Pengaturan Scanner (`sonar-project.properties`)
File konfigurasi SonarQube scanner mendefinisikan batasan analisis proyek:
- `sonar.projectKey=simag-bmkg-web`
- `sonar.projectName=SIMAG BMKG Web`
- `sonar.sources=src`
- `sonar.tests=tests`
- `sonar.inclusions=src/**/*.ts,src/**/*.tsx,src/**/*.js`
- `sonar.test.inclusions=tests/**/*.ts,tests/**/*.tsx,tests/**/*.js`
- `sonar.exclusions=**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/public/**,**/coverage/**,**/*.config.ts,**/*.config.mjs,**/scripts/**,**/prisma/**,tests/**/*.ts,tests/**/*.tsx,tests/**/*.js`
- `sonar.javascript.lcov.reportPaths=coverage/lcov.info`
- `sonar.cpd.exclusions=tests/**,src/app/**/page.tsx,src/app/api/**`

### 3.2. Integrasi Cakupan Kode (Code Coverage via c8)
- Paket `c8` ditambahkan ke devDependencies untuk menghasilkan laporan LCOV dari eksekusi Unit Test dan Integration Test.
- Script baru pada `package.json`:
  - `"test:coverage:lcov"`: Menjalankan `c8 --reporter=lcov --reporter=text node ...` yang menggabungkan seluruh suite test backend dan helper logic ke file `coverage/lcov.info`.
  - `"sonar:scan"`: Menjalankan eksekusi `node scripts/run-sonar-scan.js` dengan SonarScanner for NPM (`@sonar/scan` v5.1.0).

---

## 4. PERBAIKAN ISU & PEMBERSIHAN KODE (CLEANUP)

Sebelum analisis final, pemindaian SonarQube mendeteksi sejumlah temuan awal:
1. **Security Vulnerability (Blocker - `secrets:S6698`)**:
   - Ditemukan string fallback koneksi basis data dengan plaintext password pada `src/lib/db.ts`.
   - **Tindakan Perbaikan**: Menghapus string hardcoded fallback dan memberlakukan `process.env.DATABASE_URL ?? ""` yang wajib disediakan oleh environment variable. Status di SonarQube: `FIXED` (0 Vulnerabilities).
2. **Reliability Accessibility Bugs (Minor - `typescript:S1082` & `S6819`)**:
   - Ditemukan elemen `div` dengan listener `onClick` tanpa keyboard event listener pada backdrop modal / dropdown (`TempatMagangContent.tsx`, `AkunContent.tsx`, `Navbar.tsx`), kalender (`KalenderContent.tsx`), dan upload avatar profil (`ProfilContent.tsx`).
   - **Tindakan Perbaikan**:
     - Menambahkan atribut semantik `aria-hidden="true"` pada backdrop click-away overlay.
     - Menambahkan event handler keyboard `onKeyDown` pada sel kalender.
     - Mengubah elemen tombol non-semantik menjadi semantic HTML button `<button type="button">` pada badge acara kalender dan tombol kamera profil.
   - **Hasil**: Jumlah bugs turun dari 6 menjadi **0 (Bugs = 0, Reliability Rating = A / 1.0)**.
3. **Security Hotspots (`typescript:S5600`)**:
   - Ditemukan 4 hotspot geolokasi browser pada `AbsensiContent.tsx`, `TempatMagangContent.tsx`, dan `geo.ts`.
   - **Review**: Diperiksa dan dikonfirmasi bahwa penggunaan Geolocation API merupakan kebutuhan esensial dan sah untuk validasi radius geofencing presensi magang BMKG.
   - Status di SonarQube: Ditetapkan sebagai **`REVIEWED - SAFE`** (Unreviewed Hotspots = 0).

---

## 5. METRIK KUALITAS & AUDIT QUALITY GATE

Hasil metrik aktual proyek SIMAG BMKG yang dilaporkan oleh SonarQube Server 10.7 API (`/api/measures/component`):

| Metrik SonarQube | Nilai Aktual | Target UAS | Status Evaluasi |
| :--- | :---: | :---: | :---: |
| **Reliability Rating** | **1.0 (A)** | A | **TERCAPAI (0 Bugs)** |
| **Security Rating** | **1.0 (A)** | A | **TERCAPAI (0 Vulnerabilities)** |
| **Maintainability Rating (SQALE)** | **1.0 (A)** | A | **TERCAPAI (265 Smells, Debt Rendah)** |
| **Bugs** | **0** | 0 | **TERCAPAI** |
| **Vulnerabilities** | **0** | 0 | **TERCAPAI** |
| **Security Hotspots Unreviewed** | **0** | 0 | **TERCAPAI (4 Hotspots Reviewed Safe)** |
| **Duplicated Lines Density** | **3.4%** | < 5% | **TERCAPAI** |
| **New Code Violations** | **0** | 0 | **TERCAPAI (0 Violations)** |
| **New Code Duplications** | **0.0%** | < 3% | **TERCAPAI** |
| **Code Coverage (Overall)** | **39.5%** | >= 80% | **BELUM TERCAPAI (Lihat Catatan)** |
| **Quality Gate Status** | **ERROR** | OK | **Gated by Coverage (Coverage < 80%)** |

### Catatan Transparansi Mengenai Metrik Cakupan (Coverage)
- Sesuai prinsip kejujuran akademik dan integritas dokumentasi, cakupan kode total tercatat sebesar **39.5%** (55.6% pada new code).
- Seluruh modul logika murni dan validasi backend pada `src/lib/` (misalnya `geo.ts`, `date.ts`, `status.ts`, `validasi.ts`) telah mencapai cakupan **80% hingga 100%**.
- Namun, komponen visual frontend React (halaman dashboard dan form pada `src/app/` dan `src/components/`) tidak diuji dengan DOM headless runner (seperti React Testing Library) karena pengujian UI tersebut diakomodasi melalui browser testing (BDD Playwright).
- Pengecualian palsu tidak dimanipulasi hanya demi meloloskan Quality Gate secara artifisial.

---

## 6. VALIDASI REGRESI PENGUJIAN LINTAS FASE

Untuk memastikan implementasi SonarQube dan perbaikan accessibility tidak merusak fungsionalitas yang telah diselesaikan pada fase-fase sebelumnya, seluruh suite pengujian dijalankan ulang:

1. **Unit Testing (`npm run test:unit`)**:
   - **56 / 56 tests PASSED** (0 gagal, durasi ~508 ms).
2. **Integration Testing (`npm run test:integration`)**:
   - **37 / 37 tests PASSED** (0 gagal, durasi ~12.6 s).
3. **BDD Automation Testing (`npm run test:bdd`)**:
   - **17 / 17 scenarios PASSED**, 77 / 77 steps PASSED (durasi ~16.2 s).
4. **Linter Check (`npm run lint`)**:
   - **0 errors** (147 informational baseline warnings, status exit code 0).

---

## 7. KESIMPULAN

Fase 10 (SonarQube Static Code Analysis) berhasil diimplementasikan secara komprehensif pada branch `uas/sonarqube`:
- Server SonarQube 10.7 Community berjalan stabil pada Docker Desktop lokal Windows.
- Scanner dan LCOV coverage terhubung secara otomatis ke SonarQube Server.
- Perolehan peringkat kualitas **Reliability A (0 bugs), Security A (0 vulnerabilities), Maintainability A**.
- Seluruh pengujian sebelumnya (Unit, Integration, BDD, Linter) berjalan 100% lulus tanpa ada regresi.
