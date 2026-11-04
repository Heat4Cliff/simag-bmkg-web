# Dokumentasi Integration Testing — SIMAG BMKG

**File Pengujian:** `tests/integration/simag-integration.test.ts`  
**Setup & Teardown Database:** `tests/support/setup-test-db.ts`  
**Database Pengujian Terisolasi:** PostgreSQL `simag_bmkg_test` (`127.0.0.1:5432`)

---

## 1. Tujuan & Ruang Lingkup Integration Testing

**Integration Testing** pada SIMAG BMKG bertujuan memverifikasi interaksi nyata antar-komponen sistem tanpa melakukan *mocking* pada database maupun *controller/route handler*. Komponen yang diintegrasikan secara langsung meliputi:

1. **Next.js App Router API Route Handlers (`src/app/api/**`):**
   - `POST /api/mobile/auth/login` & `GET /api/mobile/auth/me`
   - `GET /api/laporan-harian`, `POST /api/laporan-harian`, & `PATCH /api/laporan-harian/[id]`
   - `POST /api/absensi` & `GET /api/absensi`
   - `POST /api/kalender`, `GET /api/kalender`, `GET /api/pengaturan`, & `PUT /api/pengaturan`
2. **Validasi Skema Input (`src/lib/validations.ts`):**
   - Validasi Zod untuk kredensial login, panjang deskripsi laporan harian (minimal 20 karakter), format tanggal, serta koordinat GPS.
3. **Autentikasi, Otorisasi & RBAC (`src/lib/auth.ts`, `src/lib/mobile-auth.ts`):**
   - Penerbitan dan verifikasi token JWT Bearer (`verifyMobileToken`), resolusi sesi pengguna (`auth()`), dan pembatasan hak akses berbasis peran (`MAHASISWA`, `DPL`, `MENTOR_INSTANSI`, `SUPERADMIN`).
4. **Logika Bisnis Inti (`src/lib/utils.ts`):**
   - Perhitungan jarak *Geofencing* Haversine (`calculateDistance`) terhadap koordinat dan radius kantor BMKG yang tersimpan di tabel `pengaturan`.
5. **Persistensi Database PostgreSQL (`src/lib/db.ts`):**
   - Operasi *Create, Read, Update* dan pembuatan otomatis *Audit Log* / *Notifikasi* menggunakan Prisma 7 (`@prisma/adapter-pg`) pada database terisolasi `simag_bmkg_test`.

---

## 2. Isolasi Lingkungan & Setup/Teardown Database

Untuk menjamin **keamanan data produksi (`simag_bmkg`)**:

- Sebelum modul aplikasi diimpor, variabel `process.env.DATABASE_URL` diarahkan secara eksplisit ke `postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg_test`.
- Fungsi `ensureTestDatabaseInitialized()` pada `tests/support/setup-test-db.ts` memeriksa apakah database `simag_bmkg_test` sudah ada, membuatnya jika belum ada, dan menerapkan seluruh skema tabel serta tipe `ENUM` PostgreSQL (`Role`, `StatusAbsensi`, `StatusLaporan`, `StatusModul`, `JenisNotifikasi`, `ActionLog`).
- Pada blok `before()` setiap *test suite*, fungsi `truncateTestDatabase()` mengosongkan seluruh tabel menggunakan `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` dan mengisi data awal (*seed*) untuk 4 peran pengguna sintetis (`MAHASISWA`, `DPL`, `MENTOR_INSTANSI`, `SUPERADMIN`).
- Pada blok `after()`, tabel kembali dibersihkan dan koneksi pool PostgreSQL ditutup (`prisma.$disconnect()`).

---

## 3. Daftar Test Case Integration Testing (18 Kasus Uji)

### Suite 1: Integrasi Autentikasi Mobile JWT & Proteksi Endpoint
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-01** | `POST /api/mobile/auth/login` menerima kredensial valid (email) dan mengembalikan JWT token beserta profil mahasiswa | Request JSON -> Zod `loginSchema` -> Prisma `user.findFirst` + `bcrypt.compare` -> JWT `sign` | **PASS** |
| **IT-02** | `POST /api/mobile/auth/login` mendukung login menggunakan `username` | Resolusi `identifier` non-email pada database -> kontrak response `{ token, user }` | **PASS** |
| **IT-03** | `POST /api/mobile/auth/login` menolak password yang salah dengan HTTP `401` | Validasi `bcrypt.compare` gagal -> HTTP `401 Unauthorized` | **PASS** |
| **IT-04** | `POST /api/mobile/auth/login` menolak payload invalid (password kosong) dengan HTTP `400` | Validasi Zod gagal -> HTTP `400 Bad Request` | **PASS** |
| **IT-05** | `GET /api/mobile/auth/me` menolak request tanpa header `Authorization` dengan HTTP `401` | Middleware `verifyMobileToken` tanpa header Bearer -> HTTP `401` | **PASS** |
| **IT-06** | `GET /api/mobile/auth/me` menolak token JWT palsu/expired dengan HTTP `401` | Verifikasi signature JWT gagal -> HTTP `401` | **PASS** |
| **IT-07** | `GET /api/mobile/auth/me` mengembalikan profil lengkap dari database ketika diberi Bearer token valid | Verifikasi JWT -> query relasi `mahasiswaProfile`, `tempatMagang`, `dpl` di PostgreSQL | **PASS** |

---

### Suite 2: Integrasi Laporan Harian (CRUD, Validasi, Draft Persistence & Review DPL)
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-08** | Menolak pembuatan laporan harian jika pengguna belum terautentikasi (`401`) | Proteksi `auth()` pada `POST /api/laporan-harian` | **PASS** |
| **IT-09** | Menolak laporan harian dengan deskripsi kurang dari 20 karakter (`400`) dan memastikan tidak tersimpan ke DB | Validasi Zod `laporanHarianSchema` -> *zero persistence* di tabel `laporan_harian` | **PASS** |
| **IT-10** | Menyimpan laporan harian dengan `asDraft: true` sebagai status `DRAFT` di database *(Regression Test)* | Payload `asDraft: true` -> `POST /api/laporan-harian` -> kolom `status = 'DRAFT'` di DB | **PASS** |
| **IT-11** | Menyimpan laporan harian dengan `asDraft: false` sebagai status `TERKIRIM` dan dapat dibaca kembali via `GET /api/laporan-harian` | Persistensi `TERKIRIM` + pembaruan progres magang + filter pencarian `GET /api/laporan-harian` | **PASS** |
| **IT-12** | Mengizinkan DPL menyetujui (`DISETUJUI`) laporan mahasiswa dan otomatis mencatat notifikasi di database | Otorisasi `DPL` pada `PATCH /api/laporan-harian/[id]` -> update status + insert `notifikasi` | **PASS** |
| **IT-13** | Menolak akses `PATCH /api/laporan-harian/[id]` jika diakses oleh role `MAHASISWA` (`401`) | Penegakan RBAC: mahasiswa tidak dapat menyetujui laporannya sendiri | **PASS** |

---

### Suite 3: Integrasi Absensi Geofencing BMKG & Persistensi Database
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-14** | Menolak absensi `HADIR` apabila koordinat berada di luar radius kantor BMKG (> 250m) | Query pengaturan koordinat kantor -> `calculateDistance` Haversine (~5.3 km) -> HTTP `400` | **PASS** |
| **IT-15** | Menyimpan absensi `IZIN` ke database dan mengembalikan data tersebut melalui `GET /api/absensi` | `POST /api/absensi` -> insert `absensi` + `audit_logs` -> `GET /api/absensi` | **PASS** |
| **IT-16** | Menolak absensi ganda pada hari yang sama (`400` Sudah melakukan absen masuk) | Pengecekan constraint `mahasiswaId_tanggal` sebelum insert duplikat | **PASS** |

---

### Suite 4: Integrasi Kalender Kegiatan & RBAC Pengaturan Sistem
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-17** | Mahasiswa dapat menambahkan jadwal kegiatan pribadi dan membacanya kembali dari `GET /api/kalender` | `POST /api/kalender` (`isGlobal: false`) -> `GET /api/kalender` | **PASS** |
| **IT-18** | Menolak perubahan pengaturan sistem oleh `MAHASISWA` (`403`) dan mengizinkan perubahan oleh `SUPERADMIN` (`200`) | RBAC `PUT /api/pengaturan` (`403 Forbidden` vs `200 OK`) -> verifikasi `GET /api/pengaturan` | **PASS** |

---

## 4. Cara Menjalankan Integration Testing

```bash
npm run test:integration
```

---

## 5. Hasil Eksekusi Aktual & Keterbatasan

- **Hasil Aktual:** **4 Test Suites / 18 Test Cases — 100% PASS (0 FAIL)** dalam waktu `~1.66 detik`.
- **Keterbatasan (Limitations):**
  1. Pada lingkungan pengujian integrasi berbasis Node.js, *Route Handlers* dipanggil secara langsung dengan objek `NextRequest` standar dan sesi pengguna disimulasikan melalui variabel `SIMAG_TEST_SESSION` pada helper `src/lib/auth.ts`. Pengujian aliran *cookie* terenkripsi dari form login ke *Route Handlers* melalui jaringan HTTP diuji secara penuh pada **BDD Automation Testing**.
  2. Waktu sistem saat pengujian (`new Date()`) mengikuti zona waktu server (`Asia/Jakarta`), sehingga pengujian absensi pada *integration test* memfokuskan pada validasi *Geofencing* Haversine, duplikasi harian, dan persistensi izin, sedangkan logika batas waktu `> 07:00 WIB` (`TELAT` & `keterangan: "Terlambat"`) diuji secara deterministik pada *Unit Testing* (`tests/unit/core.test.ts`).
