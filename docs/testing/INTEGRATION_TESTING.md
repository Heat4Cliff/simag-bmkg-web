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

## 3. Daftar Test Case Integration Testing (23 Kasus Uji — 5 Suite)

### Suite 1: Integrasi Autentikasi, JWT & Otorisasi Bearer Token (6 Kasus Uji)
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-01** | Mengembalikan `400` ketika request login tidak menyertakan email atau password | Validasi input pada `POST /api/mobile/auth/login` | **PASS** |
| **IT-02** | Mengembalikan `401` ketika kredensial password salah | Verifikasi `bcrypt.compare` gagal -> HTTP `401 Unauthorized` | **PASS** |
| **IT-03** | Mengembalikan `403` ketika akun berstatus nonaktif (`statusAktif = false`) | Pengecekan status akun aktif di PostgreSQL -> HTTP `403 Forbidden` | **PASS** |
| **IT-04** | Berhasil login dengan kredensial valid dan mengembalikan token JWT beserta profil mahasiswa | Query relasi `users` + `mahasiswa_profiles` -> JWT `sign` (`200 OK`) | **PASS** |
| **IT-05** | Menolak akses endpoint terproteksi JWT (`/api/mobile/kategori-modul`) tanpa header `Authorization` (`401`) | Middleware `verifyMobileToken` tanpa header Bearer -> HTTP `401` | **PASS** |
| **IT-06** | Mengizinkan akses endpoint terproteksi JWT dengan Bearer token valid dan membaca data dari database (`200`) | Verifikasi signature JWT -> query PostgreSQL `kategori_modul` | **PASS** |

---

### Suite 2: Integrasi Laporan Harian, Persistensi Database & Alur Review Pembimbing (9 Kasus Uji)
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-07** | Menolak request `GET /api/laporan-harian` ketika pengguna belum login (`401`) | Proteksi sesi `auth()` pada *Route Handler* | **PASS** |
| **IT-08** | Menolak `POST /api/laporan-harian` ketika field wajib tidak lengkap (`400`) | Validasi Zod `laporanHarianSchema` -> *zero persistence* di DB | **PASS** |
| **IT-09** | Menyimpan laporan harian sebagai `DRAFT` ketika `asDraft=true` *(Regression Test Bug Fix)* | Payload `asDraft: true` -> `POST /api/laporan-harian` -> kolom `status = 'DRAFT'` di DB (`201`) | **PASS** |
| **IT-10** | Menyimpan laporan harian dengan status `TERKIRIM` ketika `asDraft=false` | Persistensi `TERKIRIM` + pencatatan `audit_log` & `notifikasi` di DB (`201`) | **PASS** |
| **IT-11** | Mengembalikan daftar laporan harian sesuai kontrak frontend pada `GET /api/laporan-harian` | Query daftar laporan mahasiswa dari PostgreSQL (`200`) | **PASS** |
| **IT-12** | Menolak review laporan (`PATCH /api/laporan-harian/[id]`) apabila dilakukan oleh role `MAHASISWA` (`401`) | Penegakan RBAC: mahasiswa tidak dapat me-review laporannya sendiri | **PASS** |
| **IT-13** | Mengizinkan DPL pembimbing menyetujui laporan mahasiswa bimbingannya dan menyimpan catatan review (`200`) | Otorisasi `DPL` pada `PATCH /api/laporan-harian/[id]` -> status `DISETUJUI` di DB | **PASS** |
| **IT-14** | Menolak penghapusan (`DELETE`) laporan yang sudah `DISETUJUI` oleh mahasiswa (`400`) | Proteksi integritas data laporan yang telah disetujui pembimbing | **PASS** |
| **IT-15** | Mengizinkan mahasiswa mengubah laporan berstatus `DRAFT` menjadi `TERKIRIM` melalui `PUT` (`200`) | Transisi state `DRAFT` -> `TERKIRIM` pada `PUT /api/laporan-harian/[id]` | **PASS** |

---

### Suite 3: Integrasi Presensi Geofence & Riwayat Absensi (2 Kasus Uji)
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-16** | Menolak presensi `HADIR` apabila koordinat GPS berada di luar radius kantor tempat magang (`400`) | Query koordinat `tempat_magang` -> kalkulasi jarak Haversine -> HTTP `400` | **PASS** |
| **IT-17** | Menyimpan pengajuan `IZIN` ke database dan dapat dibaca kembali pada `/api/riwayat/absensi` (`200`) | `POST /api/absensi` -> persistensi `absensi` -> `GET /api/riwayat/absensi` | **PASS** |

---

### Suite 4: Integrasi Kalender Kegiatan & Pengaturan Sistem RBAC (2 Kasus Uji)
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-18** | Membuat agenda kalender oleh `SUPERADMIN` sebagai `INSTANSI` `PUBLIC` dan dapat dibaca oleh `MAHASISWA` | `POST /api/kalender` (`201`) -> `GET /api/kalender` (`200`) lintas role | **PASS** |
| **IT-19** | Menolak perubahan pengaturan instansi oleh selain `SUPERADMIN` (`401`) dan mengizinkan `SUPERADMIN` mengubah pengaturan (`200`) | RBAC `PATCH /api/pengaturan` (`401` vs `200`) -> verifikasi `GET /api/pengaturan` | **PASS** |

---

### Suite 5: Hardening & Keamanan Isolasi Database Pengujian — Regression Tests (4 Kasus Uji)
| ID | Nama Test Case | Integrasi yang Diverifikasi | Status |
|----|----------------|-----------------------------|--------|
| **IT-20** | Menolak koneksi database utama/production (`simag_bmkg` & `postgres`) pada `assertSafeTestDatabaseUrl` | Guard keamanan database pengujian wajib berakhiran `_test` (`SECURITY VIOLATION`) | **PASS** |
| **IT-21** | Menolak eksekusi `ensureBddTestUser`, `cleanupBddTestUser`, dan `truncateTestDatabase` pada database non-test | Pencegahan mutasi/penghapusan tidak sengaja terhadap database utama | **PASS** |
| **IT-22** | `cleanupBddTestUser` hanya menghapus data milik fixture mahasiswa dan menjaga data pengguna lain tetap utuh | *Scoped transactional cleanup* berdasarkan ID/email fixture tanpa merusak record user lain | **PASS** |
| **IT-23** | Menonaktifkan override `SIMAG_TEST_SESSION` apabila `SIMAG_ALLOW_TEST_AUTH` tidak bernilai `true` | Proteksi *defense-in-depth* pada `src/lib/auth.ts` agar hook sesi uji tidak aktif di mode produksi | **PASS** |

---

## 4. Cara Menjalankan Integration Testing

```bash
npm run test:integration
```

---

## 5. Hasil Eksekusi Aktual & Keterbatasan

- **Hasil Aktual:** **5 Test Suites / 23 Test Cases — 100% PASS (0 FAIL)** dalam waktu `~21.45 detik` pada database terisolasi `simag_bmkg_test`.
- **Keterbatasan (Limitations):**
  1. Pada lingkungan pengujian integrasi berbasis Node.js, *Route Handlers* dipanggil secara langsung dengan objek `Request` standar dan sesi pengguna disimulasikan secara terkontrol melalui `SIMAG_TEST_SESSION` (yang dikunci dengan `NODE_ENV !== "production"` dan `SIMAG_ALLOW_TEST_AUTH === "true"` pada `src/lib/auth.ts`). Pengujian aliran *cookie* HTTP secara menyeluruh diuji melalui **BDD Automation Testing** dan **E2E Usability Testing** di atas server terisolasi (`http://localhost:3201`).
  2. Seluruh operasi database pengujian dilindungi oleh `assertSafeTestDatabaseUrl()` yang secara otomatis menolak eksekusi apabila nama database tidak berakhiran `_test`.
