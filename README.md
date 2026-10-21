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

**Status dokumen:** diagram memadukan rancangan final project dengan kode dan bukti pengujian pada workspace lokal. Sebagian perubahan implementasi lokal belum ikut terunggah ke branch `main` GitHub. Uraian role pendukung menunjukkan kondisi dan celah yang ditemukan, bukan klaim bahwa seluruh alurnya telah lulus uji.

### Manajemen role dan otorisasi

Role disimpan sebagai enum pada kolom User.role. Sistem memakai lima nilai: SUPERADMIN, KAPRODI, DPL, MENTOR_INSTANSI, dan MAHASISWA. **Tidak ada pewarisan hak akses otomatis** antarrole: setiap halaman dan API perlu memeriksa role yang diizinkan. Pada proses login, NextAuth memvalidasi identitas, password hash, dan statusAktif, lalu menyimpan id serta role pada sesi JWT. Menu yang terlihat di Sidebar atau Dock hanya navigasi; izin sebenarnya harus ditegakkan kembali di halaman server dan route handler.

Saat SUPERADMIN membuat akun melalui API, data User dan profil yang diperlukan dibuat dalam transaksi. MAHASISWA memperoleh MahasiswaProfile, DPL memperoleh DplProfile, dan MENTOR_INSTANSI memperoleh MentorProfile. KAPRODI dan SUPERADMIN menggunakan User.role tanpa tabel profil khusus. Role akun tidak dapat diganti melalui PATCH setelah dibuat; akun dapat diaktifkan/nonaktifkan, sementara hapus dan nonaktifkan akun sendiri ditolak oleh API akun.

| Role | Alur yang terlihat pada kode | Batas dan status yang perlu dijelaskan saat demo |
|---|---|---|
| SUPERADMIN | CRUD akun/profil peserta, penempatan, tempat magang, rekap global, serta review laporan/modul. | CRUD peserta telah tercatat lulus smoke API; interaksi UI dan hak akses modul lain belum diuji menyeluruh. |
| KAPRODI | API penempatan dan tempat magang mengizinkan role ini; menu juga menampilkan kedua modul dan laporan global. | Middleware memblokir seluruh jalur /admin bagi selain SUPERADMIN. Halaman penempatan dan laporan global serta API laporan global juga masih membatasi SUPERADMIN. Alur web KAPRODI belum selaras. |
| DPL | Dapat mengambil daftar mahasiswa yang terhubung melalui MahasiswaProfile.dplId; endpoint review laporan/modul menerima role DPL. | Endpoint review per ID belum membuktikan bahwa dokumen milik mahasiswa bimbingannya. Pembatasan kepemilikan harus diperbaiki dan diuji. |
| MENTOR_INSTANSI | Profil mentor terhubung lewat MahasiswaProfile.mentorId; pengiriman modul membuat notifikasi bagi mentor terkait. | Review laporan/modul pada API web saat ini hanya mengizinkan DPL dan SUPERADMIN. Alur review khusus mentor belum tersedia/terverifikasi. |
| MAHASISWA | API presensi menegakkan role MAHASISWA; peserta dapat melihat data sendiri serta mengirim laporan dan modul. | Beberapa API laporan/modul baru memeriksa sesi, bukan role MAHASISWA secara khusus. Akses dan pembatasan data lintasrole masih perlu diaudit. |

Pemeriksaan role dilakukan pada tiga lapisan yang perlu konsisten: **navigasi UI**, **middleware/halaman server**, dan **API**. Middleware tidak mencakup jalur /api, sehingga setiap route handler bertanggung jawab sendiri atas otorisasi. Sesi memakai JWT dengan masa berlaku satu jam; perubahan statusAktif diperiksa saat login, sedangkan pencabutan sesi aktif segera setelah akun dinonaktifkan belum ditunjukkan oleh kode.

## 2. Desain Proyek (UML) (20 poin)

Diagram di bawah menjabarkan **alur final project**: presensi mahasiswa dan pengelolaan peserta/lokasi. Lima role akun tetap dicatat agar cakupan sistem jelas. Garis putus-putus pada use case menunjukkan langkah yang menjadi bagian dari use case lain atau fungsi role pendukung yang belum diverifikasi menyeluruh. Diagram use case ditulis sebagai representasi Mermaid agar dapat dibaca langsung di GitHub.


### 2.1 Use case menyeluruh — lima role

Diagram ini menempatkan semua role dalam sistem. Garis penuh berarti jalur atau data terkait ditemukan pada kode; garis putus-putus menunjukkan alur yang masih perlu penyelarasan atau verifikasi. Diagram rinci setelahnya memecah presensi dan administrasi agar tetap terbaca.

```mermaid
flowchart LR
    SA["SUPERADMIN"]
    KP["KAPRODI"]
    DP["DPL"]
    MT["MENTOR_INSTANSI"]
    MH["MAHASISWA"]
    subgraph ADM["Administrasi dan pengawasan"]
        AKUN(["CRUD akun dan profil"])
        TEMPAT(["Kelola tempat dan radius"])
        TEMPATAPI(["Akses API penempatan/tempat"])
        GLOBAL(["Laporan global"])
    end
    subgraph BIM["Bimbingan dan dokumen"]
        BINA(["Lihat mahasiswa bimbingan"])
        REVIEW(["Review laporan dan modul"])
        NOTIF(["Terima notifikasi modul"])
        MENTORREVIEW(["Review mentor pada web"])
    end
    subgraph PESERTA["Aktivitas peserta"]
        ABSEN(["Presensi MASUK/PULANG atau IZIN/SAKIT"])
        DOKUMEN(["Kirim laporan dan modul"])
        STATUS(["Lihat status pribadi"])
    end
    SA --> AKUN
    SA --> TEMPAT
    SA --> GLOBAL
    SA --> REVIEW
    KP --> TEMPATAPI
    KP -. menu admin belum selaras .-> GLOBAL
    DP --> BINA
    DP --> REVIEW
    MT --> NOTIF
    MT -. review web belum tersedia .-> MENTORREVIEW
    MH --> ABSEN
    MH --> DOKUMEN
    MH --> STATUS
```

### 2.2 Use case — presensi mahasiswa

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

### 2.3 Use case — administrasi peserta dan lokasi

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

### 2.4 Sequence diagram — siklus lintas lima role

Sequence ini memperlihatkan interaksi lima role dalam satu siklus magang. Catatan pada lifeline menandai bagian yang belum konsisten; keberadaan langkah di diagram tidak berarti seluruh alur sudah lulus uji.

```mermaid
sequenceDiagram
    autonumber
    actor SA as SUPERADMIN
    actor KP as KAPRODI
    actor MH as MAHASISWA
    actor DP as DPL
    actor MT as MENTOR_INSTANSI
    participant UI as Web SIMAG
    participant Gate as Middleware
    participant API as Next.js API
    participant DB as PostgreSQL
    SA->>UI: Buat akun, tempat magang, dan penempatan
    UI->>API: POST akun dan PATCH penempatan
    API->>DB: Simpan User, profil, dan relasi
    DB-->>API: Data tersimpan
    API-->>UI: Hasil administrasi
    KP->>UI: Buka menu penempatan atau laporan global
    UI->>Gate: GET jalur /admin
    Gate-->>KP: Redirect ke dashboard
    Note over KP,API: API penempatan/tempat menerima KAPRODI, halaman web belum selaras
    MH->>UI: Presensi MASUK atau PULANG
    UI->>API: POST /api/absensi
    API->>DB: Simpan atau perbarui Absensi
    API-->>UI: Hasil presensi
    MH->>UI: Kirim modul praktikum
    UI->>API: POST /api/modul-praktikum
    API->>DB: Simpan modul dan notifikasi pembimbing
    API-->>MT: Notifikasi modul untuk mentor terkait
    API-->>UI: Hasil pengiriman
    DP->>UI: Lihat mahasiswa bimbingan
    UI->>API: GET /api/pembimbing/mahasiswa
    API->>DB: Filter MahasiswaProfile berdasarkan dplId
    DB-->>API: Daftar mahasiswa terkait
    API-->>UI: Data bimbingan
    DP->>API: PATCH review laporan atau modul
    Note over DP,API: Role DPL dicek, kepemilikan dokumen belum dicek per ID
    Note over MT,API: API web belum menyediakan review khusus MENTOR_INSTANSI
```

### 2.5 Sequence diagram — presensi HADIR

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

### 2.6 Sequence diagram — CRUD peserta oleh SUPERADMIN

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

### 2.7 Activity diagram — keputusan berdasarkan role

```mermaid
flowchart TD
    START(["Pengguna masuk"]) --> AUTH{"Sesi dan role valid?"}
    AUTH -- Tidak --> LOGIN["Kembali ke login"]
    AUTH -- Ya --> ROLE{"Role akun"}
    ROLE -- SUPERADMIN --> SA["Kelola akun, profil, tempat, dan penempatan"]
    SA --> GLOBAL["Lihat rekap global atau review dokumen"]
    ROLE -- KAPRODI --> KP["Buka menu pengawasan dan penempatan"]
    KP --> KPGAP{"Jalur /admin diizinkan middleware?"}
    KPGAP -- Tidak --> KPBLOCK["Dialihkan ke dashboard; perlu penyelarasan"]
    ROLE -- DPL --> DP["Ambil mahasiswa dengan dplId terkait"]
    DP --> DPREVIEW["Review laporan atau modul"]
    DPREVIEW --> DPGAP["Pemeriksaan kepemilikan per ID perlu dilengkapi"]
    ROLE -- MENTOR_INSTANSI --> MT["Terima notifikasi modul dari peserta terkait"]
    MT --> MTGAP["Review mentor pada web belum tersedia"]
    ROLE -- MAHASISWA --> MH["Lihat status dan kirim presensi"]
    MH --> DOK["Kirim laporan atau modul"]
    GLOBAL --> END(["Selesai"])
    KPBLOCK --> END
    DPGAP --> END
    MTGAP --> END
    DOK --> END
    LOGIN --> END
```

### 2.8 Activity diagram — keputusan presensi

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
        K["KAPRODI"]
        D["DPL"]
        T["MENTOR_INSTANSI"]
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
            API4["API /api/admin/penempatan"]
            API5["API laporan, modul, pembimbing"]
            RULES["Validasi input, radius, hari libur, urutan"]
            ORM["Prisma ORM"]
        end
        DB[("PostgreSQL 16 - volume simag-postgres")]
        FILES[("Foto/lampiran - volume simag-uploads")]
    end
    M --> UI
    A --> UI
    K -. menu perlu penyelarasan .-> UI
    D --> UI
    T --> UI
    DEVICE -->|"foto dan koordinat"| UI
    UI -->|"localhost:3391 ke 3200"| AUTH
    AUTH --> API1
    AUTH --> API2
    AUTH --> API3
    AUTH --> API4
    AUTH --> API5
    API1 --> RULES
    API2 --> ORM
    API3 --> ORM
    API4 --> ORM
    API5 --> ORM
    API5 -->|"lampiran"| FILES
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

### 3.3 Rincian database, relasi, dan integritas data

PostgreSQL 16 menyimpan data relasional; Prisma 7 memetakan model pada [prisma/schema.prisma](prisma/schema.prisma) ke tabel. User adalah sumber identitas dan role. Profil khusus dipisah agar atribut NIM, NIP, mentor, serta penempatan tidak dicampur ke setiap akun. KAPRODI dan SUPERADMIN tidak memiliki tabel profil khusus; keduanya dibedakan oleh User.role.

| Model / tabel | Kunci dan relasi penting | Fungsi |
|---|---|---|
| User / users | id sebagai PK; email dan username unik; role dan statusAktif | Identitas login untuk semua role. Password disimpan sebagai hash, bukan teks biasa. |
| MahasiswaProfile / mahasiswa_profiles | userId unik ke User; dplId, mentorId, tempatMagangId boleh kosong | Data peserta, NIM, prodi, periode, kontak, pembimbing, dan lokasi magang aktif. |
| DplProfile / dpl_profiles | userId unik ke User | Identitas DPL; satu DPL dapat terhubung ke banyak MahasiswaProfile. |
| MentorProfile / mentor_profiles | userId unik ke User | Identitas mentor instansi; satu mentor dapat membimbing banyak peserta. |
| TempatMagang / tempat_magang | id sebagai PK; direferensikan MahasiswaProfile | Nama/alamat instansi, titik GPS kantor, dan radiusAbsensiMeter. |
| Absensi / absensi | userId ke User; pasangan userId + tanggal unik | Satu catatan harian berisi status, MASUK/PULANG, GPS, jarak, serta path foto/lampiran. |
| LaporanHarian / laporan_harian | userId ke User | Catatan kegiatan dan status review beserta reviewer/waktu review. |
| ModulPraktikum / modul_praktikum | userId ke User; kategoriId ke KategoriModul | Dokumen tugas praktikum, status review, dan lampiran. |
| Notifikasi / notifikasi | userId ke User | Pesan untuk pembimbing/mentor, misalnya saat modul peserta dikirim. |
| Session dan AuditLog | Keduanya terhubung ke User | Struktur untuk sesi/audit tersedia pada skema; sesi web saat ini memakai JWT dan penulisan audit tidak boleh diasumsikan terjadi di semua aksi. |

**Kardinalitas dan alur baca:** User MAHASISWA memiliki paling banyak satu MahasiswaProfile. Profil tersebut menunjuk paling banyak satu tempat magang, satu DPL, dan satu mentor pada suatu waktu; masing-masing pembimbing atau tempat magang dapat menangani banyak peserta. Absensi, LaporanHarian, dan ModulPraktikum mereferensikan User secara langsung. Saat presensi, API mengambil MahasiswaProfile beserta TempatMagang, menghitung jarak GPS terhadap latitudeKantor/longitudeKantor, membandingkannya dengan radiusAbsensiMeter, lalu membaca Absensi untuk tanggal Jakarta sebelum membuat catatan MASUK atau memperbarui PULANG.

**Aturan integritas dan batas model:**

1. Unique constraint pada User.email, User.username, dan setiap profil.userId mencegah duplikasi identitas/profil. Constraint gabungan Absensi(userId, tanggal) mencegah lebih dari satu baris presensi harian per akun.
2. NIM pada MahasiswaProfile bersifat opsional dan **belum diberi unique constraint** pada skema. Validasi NIM unik, bila menjadi aturan kampus, masih perlu dirancang dan diuji.
3. Relasi User ke profil, presensi, laporan, modul, dan beberapa data turunannya memakai onDelete: Cascade. Hapus fisik akun dapat ikut menghapus riwayat terkait; statusAktif menyediakan alternatif menonaktifkan akun tanpa menghapus barisnya.
4. Penempatan saat ini disimpan sebagai foreign key pada MahasiswaProfile. Tidak ada tabel riwayat penempatan terpisah, sehingga perpindahan DPL/mentor/tempat tidak otomatis meninggalkan histori relasi lama.
5. reviewedBy pada laporan/modul adalah kolom String opsional, bukan foreign key Prisma ke User. Pemeriksaan reviewer dan pembatasan mahasiswa bimbingan perlu ditegakkan di aplikasi.
6. Foto presensi dan lampiran disimpan pada volume simag-uploads, sedangkan database hanya menyimpan path file. Backup database saja tidak cukup untuk memulihkan seluruh bukti.
7. Tidak ada @@index tambahan untuk dplId, mentorId, tempatMagangId, atau tanggal laporan pada skema saat ini. Kebutuhan indeks harus dievaluasi dari ukuran data dan pola query sebelum dipakai pada skala lebih besar.

### 3.4 ERD dokumen, review, dan notifikasi

```mermaid
erDiagram
    USER ||--o{ LAPORAN_HARIAN : menulis
    USER ||--o{ MODUL_PRAKTIKUM : mengirim
    USER ||--o{ NOTIFIKASI : menerima
    USER ||--o{ AUDIT_LOG : terkait
    KATEGORI_MODUL ||--o{ MODUL_PRAKTIKUM : mengelompokkan

    USER {
        string id PK
        string email UK
        string role
        boolean statusAktif
    }
    LAPORAN_HARIAN {
        string id PK
        string userId FK
        date tanggal
        string status
        string reviewedBy
        datetime reviewedAt
    }
    KATEGORI_MODUL {
        string id PK
        string namaKategori
    }
    MODUL_PRAKTIKUM {
        string id PK
        string userId FK
        string kategoriId FK
        string statusReview
        string reviewedBy
    }
    NOTIFIKASI {
        string id PK
        string userId FK
        boolean dibaca
        string link
    }
    AUDIT_LOG {
        string id PK
        string userId FK
        string aksi
        string entitas
    }
```

ERD ini memperlihatkan relasi yang didefinisikan pada skema, bukan jaminan bahwa setiap alur review atau audit sudah berjalan. Kolom reviewedBy sengaja tidak digambar sebagai garis relasi karena skema belum mendeklarasikan foreign key untuknya.

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
