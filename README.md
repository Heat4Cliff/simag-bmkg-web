# SIMAG — Analisis dan Pengujian Sistem IF7A

**Topik:** Modul Presensi Magang Berbasis Geolokasi dan Bukti Foto pada Sistem Informasi Manajemen Magang (SIMAG)

| Identitas | Keterangan |
|---|---|
| Mata kuliah | Analisis dan Pengujian Sistem |
| Kelas | IF7A |
| Ketua kelompok | Muhammad Arif Rivandi — NIM: **23EO10005** |
| Anggota | Mohammad Alwan Abbas Abdillah — NIM: **23EO10030** |
| Anggota | Ian Alfian — NIM: **23EO1039** |
| Anggota | Fattatunnida Amalia Rahma — NIM: **23EO10010** |
| Anggota | Zainul Mutawakkil — NIM: **23EO10003** |

## 1. Deskripsi Proyek (20 poin)

Repositori ini berisi kode dan rancangan SIMAG untuk mengelola kegiatan magang. Ruang lingkup final project pada mata kuliah ini adalah **presensi mahasiswa berbasis lokasi dan foto**, serta **pengelolaan data peserta dan tempat magang oleh Admin**. Masalah yang ditangani adalah pencatatan masuk/pulang, pembuktian lokasi dalam radius tempat magang, pengajuan izin/sakit, dan pencegahan data presensi yang tidak lengkap atau ganda.

SIMAG bukan program sederhana; sistem ini memiliki autentikasi, beberapa role, API, penyimpanan PostgreSQL, dan modul administrasi. Fokus pengujian tetap dibatasi pada alur presensi dan CRUD peserta. Lima role pada skema adalah `SUPERADMIN`, `KAPRODI`, `DPL`, `MENTOR_INSTANSI`, dan `MAHASISWA`. Dua aktor utama untuk alur yang dibahas adalah **Mahasiswa** dan **SUPERADMIN**; kemampuan role lain belum seluruhnya diverifikasi.

## 2. Desain Proyek (UML) (20 poin)

Diagram di bawah menjabarkan **alur final project**: presensi mahasiswa dan pengelolaan peserta/lokasi. Lima role akun tetap dicatat agar cakupan sistem jelas. Garis putus-putus pada use case menunjukkan langkah yang menjadi bagian dari use case lain atau fungsi role pendukung yang belum diverifikasi menyeluruh. Diagram use case ditulis sebagai representasi Mermaid agar dapat dibaca langsung di GitHub.

| Role akun | Hubungan dengan ruang lingkup tugas |
|---|---|
| MAHASISWA | Aktor utama: melihat status, presensi MASUK/PULANG, serta mengajukan IZIN/SAKIT. |
| SUPERADMIN | Aktor utama: CRUD akun/profil peserta, penempatan, dan tempat magang. |
| KAPRODI | Role pengawasan akademik; API tempat magang mengenali role ini, tetapi keselarasan menu dan izin halaman masih perlu diuji. |
| DPL | Pembimbing mahasiswa; alur bimbingan/laporan berada di luar fokus pengujian presensi ini. |
| MENTOR_INSTANSI | Pembimbing instansi; alur review khusus mentor belum diverifikasi pada web. |

### 2.1 Use case — presensi mahasiswa

```mermaid
flowchart LR
    M["MAHASISWA"]
    subgraph P["Batas sistem: modul presensi"]
        LOGIN(["UC-01 Login"])
        STATUS(["UC-02 Lihat status harian"])
        MASUK(["UC-03 Presensi MASUK"])
        PULANG(["UC-04 Presensi PULANG"])
        IZIN(["UC-05 Ajukan IZIN / SAKIT"])
        FOTO(["Ambil foto JPEG"])
        GPS(["Kirim koordinat GPS"])
        RADIUS(["Validasi radius tempat magang"])
        URUTAN(["Cek urutan dan duplikasi"])
        KET(["Isi keterangan atau lampiran"])
        LIBUR(["Cek hari libur"])
    end
    M --> LOGIN
    M --> STATUS
    M --> MASUK
    M --> PULANG
    M --> IZIN
    MASUK -. wajib .-> FOTO
    MASUK -. wajib .-> GPS
    PULANG -. wajib .-> FOTO
    PULANG -. wajib .-> GPS
    GPS -. diproses server .-> RADIUS
    MASUK -. validasi .-> URUTAN
    PULANG -. validasi .-> URUTAN
    IZIN -. wajib .-> KET
    MASUK -. validasi .-> LIBUR
    PULANG -. validasi .-> LIBUR
    IZIN -. validasi .-> LIBUR
```

Untuk HADIR, foto dan GPS wajib. Server menghitung jarak terhadap lokasi tempat magang yang tersimpan pada profil peserta. Presensi PULANG hanya dapat dilakukan sesudah MASUK dan sebelum PULANG lain tercatat pada hari yang sama. IZIN/SAKIT memerlukan keterangan **atau** lampiran; GPS tidak diwajibkan oleh API untuk kedua jenis itu.

### 2.2 Use case — administrasi peserta dan lokasi

```mermaid
flowchart LR
    A["SUPERADMIN"]
    K["KAPRODI"]
    subgraph ADM["Batas sistem: administrasi"]
        DAFTAR(["UC-06 Lihat daftar peserta"])
        CARI(["UC-07 Cari peserta"])
        TAMBAH(["UC-08 Tambah akun dan profil"])
        UBAH(["UC-09 Ubah data peserta"])
        NONAKTIF(["UC-10 Aktifkan / nonaktifkan akun"])
        HAPUS(["UC-11 Hapus peserta"])
        TEMPAT(["UC-12 Kelola tempat magang"])
        PENEMPATAN(["UC-13 Atur penempatan"])
        VALIDASI(["Validasi email, periode, dan relasi"])
        DIRI(["Cegah hapus / nonaktifkan diri sendiri"])
        RADIUS(["Atur titik GPS dan radius"])
    end
    A --> DAFTAR
    A --> CARI
    A --> TAMBAH
    A --> UBAH
    A --> NONAKTIF
    A --> HAPUS
    A --> TEMPAT
    A --> PENEMPATAN
    DAFTAR -. mendukung .-> CARI
    TAMBAH -. wajib .-> VALIDASI
    UBAH -. wajib .-> VALIDASI
    NONAKTIF -. wajib .-> DIRI
    HAPUS -. wajib .-> DIRI
    TEMPAT -. mencakup .-> RADIUS
    K -. API tempat magang perlu uji UI .-> TEMPAT
```

Endpoint akun membatasi operasi CRUD kepada SUPERADMIN. Endpoint tempat magang mengizinkan SUPERADMIN dan KAPRODI; akses KAPRODI pada halaman web belum dinyatakan lulus uji. Perubahan role akun setelah dibuat ditolak agar profil terkait tetap konsisten.

### 2.3 Sequence diagram — presensi HADIR

```mermaid
sequenceDiagram
    autonumber
    actor M as Mahasiswa
    participant UI as Browser SIMAG
    participant API as API Absensi
    participant Auth as NextAuth
    participant DB as Prisma dan PostgreSQL
    participant FS as Volume uploads
    M->>UI: Pilih MASUK atau PULANG
    UI->>UI: Minta izin GPS dan kamera
    UI->>API: POST jenis HADIR, tipe, GPS, foto JPEG
    API->>Auth: Baca sesi dan role
    Auth-->>API: Identitas pengguna
    alt Sesi tidak ada atau role bukan MAHASISWA
        API-->>UI: Tolak 401 atau 403
    else Mahasiswa terautentikasi
        API->>API: Cek hari libur, tipe, format dan ukuran foto
        API->>DB: Ambil profil dan tempat magang
        DB-->>API: Koordinat kantor dan radius
        API->>API: Validasi GPS dan hitung jarak di server
        API->>DB: Cari presensi pengguna hari ini
        DB-->>API: Catatan MASUK/PULANG jika ada
        alt Data, radius, atau urutan tidak valid
            API-->>UI: Tolak dengan alasan validasi
        else Semua aturan terpenuhi
            API->>FS: Simpan foto presensi
            alt Tipe MASUK
                API->>DB: Buat catatan Absensi
            else Tipe PULANG
                API->>DB: Perbarui jamPulang dan fotoPulang
            end
            DB-->>API: Catatan tersimpan
            API-->>UI: Hasil sukses dan jarak
        end
    end
    UI-->>M: Tampilkan hasil atau alasan penolakan
```

File foto saat ini ditulis sebelum operasi database. Jika penyimpanan database gagal setelah file berhasil ditulis, pembersihan file yatim masih perlu ditangani; diagram menunjukkan urutan kode saat ini, bukan transaksi file dan database yang atomik.

### 2.4 Sequence diagram — CRUD peserta oleh SUPERADMIN

```mermaid
sequenceDiagram
    autonumber
    actor A as SUPERADMIN
    participant UI as Halaman Manajemen Akun
    participant API as API Admin Akun
    participant Auth as NextAuth
    participant DB as Prisma dan PostgreSQL
    A->>UI: Pilih lihat, tambah, ubah, atau hapus
    UI->>API: GET / POST / PATCH / DELETE
    API->>Auth: Periksa sesi dan role
    Auth-->>API: Identitas SUPERADMIN
    alt Bukan SUPERADMIN
        API-->>UI: 401 Unauthorized
    else SUPERADMIN
        alt GET daftar
            API->>DB: Baca akun dan profil peserta
            DB-->>API: Data akun dan profil
            API-->>UI: Tampilkan daftar untuk pencarian di UI
        else POST tambah
            API->>API: Validasi input, periode, tempat, email unik
            API->>DB: Transaksi buat User dan profil sesuai role
            DB-->>API: Akun baru
            API-->>UI: Hasil tambah
        else PATCH ubah atau aktif/nonaktif
            API->>API: Cegah nonaktif diri, perubahan role, dan email ganda
            API->>DB: Transaksi ubah User dan profil mahasiswa
            DB-->>API: Data terbaru
            API-->>UI: Hasil ubah
        else DELETE hapus
            API->>API: Cegah hapus akun sendiri
            API->>DB: Hapus User berdasarkan ID
            DB-->>API: Hasil hapus
            API-->>UI: Perbarui daftar
        end
    end
    UI-->>A: Tampilkan data atau pesan kesalahan
```

Pencarian peserta berlangsung pada daftar yang diterima UI; endpoint GET membaca daftar akun. Validasi gagal menghasilkan respons kesalahan dan tidak boleh ditafsirkan sebagai operasi berhasil.

### 2.5 Activity diagram — keputusan presensi

```mermaid
flowchart TD
    START(["Mulai"]) --> LOGIN["Mahasiswa login dan membuka presensi"]
    LOGIN --> LIBUR{"Hari libur?"}
    LIBUR -- Ya --> TOLAK["Tampilkan alasan penolakan"]
    LIBUR -- Tidak --> JENIS{"Jenis absensi?"}
    JENIS -- HADIR --> TIPE{"MASUK atau PULANG?"}
    TIPE --> FOTO["Ambil foto JPEG dan GPS"]
    FOTO --> BUKTI{"Format, ukuran, dan koordinat valid?"}
    BUKTI -- Tidak --> TOLAK
    BUKTI -- Ya --> PROFIL["Ambil profil dan tempat magang"]
    PROFIL --> KONFIG{"Titik kantor dan radius tersedia?"}
    KONFIG -- Tidak --> TOLAK
    KONFIG -- Ya --> JARAK["Hitung jarak di server"]
    JARAK --> DALAM{"Dalam radius?"}
    DALAM -- Tidak --> TOLAK
    DALAM -- Ya --> CATATAN["Baca catatan presensi hari ini"]
    CATATAN --> MASUK{"Tipe MASUK?"}
    MASUK -- Ya --> BARU{"Belum ada absensi hari ini?"}
    BARU -- Tidak --> TOLAK
    BARU -- Ya --> SIMPANFOTO["Simpan foto ke volume uploads"]
    MASUK -- Tidak --> URUT{"Sudah MASUK dan belum PULANG?"}
    URUT -- Tidak --> TOLAK
    URUT -- Ya --> SIMPANFOTO
    SIMPANFOTO --> SIMPANDB["Buat atau perbarui Absensi di PostgreSQL"]
    JENIS -- IZIN/SAKIT --> ALASAN["Isi keterangan atau lampiran"]
    ALASAN --> LENGKAP{"Bukti atau keterangan tersedia?"}
    LENGKAP -- Tidak --> TOLAK
    LENGKAP -- Ya --> SUDAH{"Sudah ada absensi hari ini?"}
    SUDAH -- Ya --> TOLAK
    SUDAH -- Tidak --> LAMPIRAN["Simpan lampiran jika ada"]
    LAMPIRAN --> SIMPANDB
    JENIS -- Selain itu --> TOLAK
    SIMPANDB --> HASIL["Tampilkan hasil berhasil"]
    HASIL --> END(["Selesai"])
    TOLAK --> END
```

**Status pengujian:** alur ini menggambarkan aturan pada implementasi lokal. Penolakan tanpa GPS dan di luar radius sudah tercatat dalam smoke test. Alur berhasil dengan GPS/kamera perangkat nyata, interaksi UI Admin, serta hak akses seluruh role masih perlu diuji tersendiri.

## 3. Arsitektur Proyek (20 poin)

### 3.1 Komponen dan jalur data

```mermaid
flowchart LR
    subgraph AKTOR["Pengguna"]
        M["Mahasiswa"]
        A["SUPERADMIN"]
        R["KAPRODI / DPL / Mentor"]
    end
    subgraph CLIENT["Browser"]
        UI["Next.js UI"]
        DEVICE["GPS dan kamera"]
    end
    subgraph DOCKER["Docker Compose lokal"]
        subgraph APP["Container app - port 3200"]
            AUTH["NextAuth dan pemeriksaan role"]
            API1["API /api/absensi"]
            API2["API /api/admin/akun"]
            API3["API /api/admin/tempat-magang"]
            RULES["Validasi input, radius, hari libur, urutan"]
            ORM["Prisma ORM"]
        end
        DB[("PostgreSQL 16 - volume simag-postgres")]
        FILES[("Foto/lampiran - volume simag-uploads")]
    end
    M --> UI
    A --> UI
    R -. sesuai izin role .-> UI
    DEVICE -->|"foto dan koordinat"| UI
    UI -->|"localhost:3391 ke 3200"| AUTH
    AUTH --> API1
    AUTH --> API2
    AUTH --> API3
    API1 --> RULES
    API2 --> ORM
    API3 --> ORM
    RULES --> ORM
    RULES -->|"file bukti"| FILES
    ORM -->|"metadata dan transaksi"| DB
```

Browser meminta izin lokasi dan kamera. API memeriksa sesi dan role, lalu memvalidasi data sebelum Prisma mengakses PostgreSQL. Foto dan lampiran disimpan di volume terpisah; database menyimpan path serta metadata. Port **3391** hanya terikat ke host lokal dalam konfigurasi Docker Compose pengembangan.

### 3.2 Model data inti untuk final project

```mermaid
erDiagram
    USER ||--o| MAHASISWA_PROFILE : memiliki
    USER ||--o| DPL_PROFILE : memiliki
    USER ||--o| MENTOR_PROFILE : memiliki
    USER ||--o{ ABSENSI : mencatat
    TEMPAT_MAGANG o|--o{ MAHASISWA_PROFILE : menampung
    DPL_PROFILE o|--o{ MAHASISWA_PROFILE : membimbing
    MENTOR_PROFILE o|--o{ MAHASISWA_PROFILE : membimbing

    USER {
        string id PK
        string email UK
        string role
        boolean statusAktif
    }
    MAHASISWA_PROFILE {
        string id PK
        string userId FK
        string nim
        string tempatMagangId FK
        string dplId FK
        string mentorId FK
    }
    TEMPAT_MAGANG {
        string id PK
        string namaInstansi
        float latitudeKantor
        float longitudeKantor
        float radiusAbsensiMeter
    }
    ABSENSI {
        string id PK
        string userId FK
        date tanggal
        datetime jamMasuk
        datetime jamPulang
        string fotoMasuk
        string fotoPulang
        string status
        float jarakDariKantorMeter
    }
    DPL_PROFILE {
        string id PK
        string userId FK
    }
    MENTOR_PROFILE {
        string id PK
        string userId FK
    }
```

Satu pengguna dapat memiliki profil sesuai role. Satu peserta ditempatkan pada paling banyak satu tempat magang aktif dalam model ini. Tabel Absensi memiliki batas unik untuk pasangan pengguna dan tanggal, sehingga satu catatan harian dapat memuat jam MASUK dan PULANG.

## 4. Tech Stack (20 poin)

| Lapisan | Teknologi yang dipakai |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend/API | Next.js App Router dan Route Handlers, NextAuth untuk sesi web |
| Database | PostgreSQL 16, Prisma ORM 7 |
| Penyimpanan bukti | Volume file lokal pada Docker untuk foto/lampiran |
| Pengembangan | Node.js 22 pada image Docker, Docker Compose, Git/GitHub |

Contoh Flutter, Go, MongoDB, dan Supabase pada template tugas **bukan** stack proyek ini.

## 5. Repositori, Pengujian, dan Demo UTS (20 poin)

- Repositori: [Heat4Cliff/simag-bmkg-web](https://github.com/Heat4Cliff/simag-bmkg-web).
- Ketua kelompok bertanggung jawab mengunggah versi yang disepakati dan memimpin demonstrasi UTS.
- Bukti lokal yang telah dicatat: **8/8 unit test** dan **9/9 pemeriksaan smoke API** lulus. Smoke test mencakup CRUD peserta, penolakan presensi tanpa GPS, dan penolakan lokasi di luar radius.
- Pemeriksaan yang masih diperlukan: presensi di dalam radius dengan GPS dan kamera nyata, interaksi UI Admin, serta hak akses seluruh lima role.

Alur demo: jalankan aplikasi melalui Docker di `http://localhost:3391`, tampilkan role dan data dummy, jelaskan diagram, demonstrasikan CRUD peserta serta validasi presensi yang sudah teruji, lalu tunjukkan hasil uji dan batasnya. Status **PASS** pada pengujian lokal tidak berarti seluruh fitur SIMAG telah lulus uji.
