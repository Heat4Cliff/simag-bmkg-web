# Dokumentasi Usability Testing — SIMAG BMKG

**Proyek:** Sistem Informasi Magang (SIMAG) BMKG / UNUGHA  
**File Verifikasi Otomatis:** `tests/e2e/usability-audit.test.ts`  
**Lokasi Bukti Screenshot:** `tests/reports/screenshots/`

---

## 1. Tujuan Usability Testing

Pengujian ketergunaan (*Usability Testing*) pada aplikasi **SIMAG BMKG** bertujuan untuk:
1. Mengevaluasi sejauh mana pengguna (khususnya Mahasiswa Magang, DPL, dan Mentor Instansi BMKG) dapat menyelesaikan tugas-tugas utama secara efektif, efisien, dan tanpa kebingungan.
2. Mengevaluasi 9 aspek kualitas antarmuka pengguna:
   - **Navigasi** (kemudahan berpindah antar-halaman melalui Navbar & Dock).
   - **Konsistensi UI** (keseragaman warna identitas hijau `#1E8A3C`, tipografi, ikon, dan komponen kartu).
   - **Kejelasan Label** (label input formulir, *placeholder*, dan petunjuk pengisian).
   - **Keterbacaan Informasi** (kontras teks, hirarki ukuran huruf, dan kartu ringkasan statistik).
   - **Feedback Interaksi** (notifikasi *toast*, indikator *loading spinner*, penghitung karakter *real-time*).
   - **Error Handling** (pesan kesalahan yang jelas ketika input kosong atau kredensial salah).
   - **Responsive Layout** (tampilan adaptif pada layar desktop `1280x800` dan smartphone `375x667` tanpa *horizontal overflow*).
   - **Accessibility Dasar** (atribut `alt` pada gambar, asosiasi `<label htmlFor>` ke `<input id>`, dan `aria-label` pada tombol ikon).
   - **Kemudahan Penyelesaian Task** (*Task Completion Rate* pada skenario penggunaan utama).

---

## 2. Metode Pengujian & Profil Tester

### 2.1. Metode Pengujian
Pengujian dilakukan menggunakan dua pendekatan yang saling melengkapi:
1. **Automated Usability, Layout & Accessibility Audit (Telah Dieksekusi Aktual):**
   - Menggunakan Playwright (`tests/e2e/usability-audit.test.ts`) pada Chromium *headless* untuk memverifikasi penyelesaian 6 *user tasks*, memeriksa struktur DOM semantik, menguji responsivitas layar *mobile* (`375x667`), dan merekam bukti visual (*screenshots*).
2. **Instrumen Evaluasi Penguji Manusia / Human Usability Testing (Siap Digunakan):**
   - Menyediakan skenario tugas (*task script*), lembar observasi penyelesaian tugas, dan kuesioner *System Usability Scale (SUS)* bagi partisipan manusia tanpa mengarang data fiktif.

### 2.2. Profil Target Partisipan (Tester)
| Kategori Partisipan | Peran pada SIMAG | Karakteristik & Perangkat Utama |
|---------------------|------------------|---------------------------------|
| **Mahasiswa Magang** | `MAHASISWA` | Mahasiswa FMIKOM UNUGHA yang melaksanakan magang di Stasiun Meteorologi BMKG; mengakses SIMAG melalui smartphone (presensi GPS) dan laptop (laporan harian/modul). |
| **Dosen Pembimbing Lapangan** | `DPL` | Dosen pembimbing akademik yang memantau progres, menyetujui laporan harian, dan menilai modul praktikum melalui laptop/desktop. |
| **Mentor Instansi BMKG** | `MENTOR_INSTANSI` | Pembimbing lapangan di kantor BMKG yang memantau kehadiran dan aktivitas harian mahasiswa magang. |

---

## 3. Daftar Task Usability Testing & Hasil Verifikasi Aktual

Berikut adalah 6 *Task* utama yang diuji secara aktual terhadap implementasi SIMAG BMKG melalui `npm run test:e2e`:

| ID Task | Nama Task | Langkah Pengujian | Expected Result | Actual Result (Verifikasi Aktual) | Status |
|---------|-----------|-------------------|-----------------|-----------------------------------|--------|
| **UT-01** | **Login ke Sistem SIMAG & Validasi Kejelasan Form** | 1. Buka halaman `/login`.<br>2. Periksa keberadaan logo, label `Email atau Username`, label `Password`, dan tombol *toggle* visibilitas password.<br>3. Masukkan kredensial dan tekan `Masuk ke Sistem`. | Halaman menampilkan logo ber-atribut `alt`, label form terasosiasi dengan input, tombol *toggle* password memiliki `aria-label`, dan pengguna berhasil diarahkan ke `/dashboard`. | Logo UNUGHA tampil dengan `alt="Logo UNUGHA"`, label `Email atau Username` & `Password` terhubung ke `#login-identifier` & `#login-password`, login berhasil mengarahkan ke `/dashboard`. Bukti: `usability-task1-dashboard-desktop.png`. | **PASS** |
| **UT-02** | **Memahami Ringkasan Informasi pada Dashboard** | 1. Amati halaman `/dashboard` setelah login.<br>2. Identifikasi kartu statistik utama dan indikator progres magang. | Pengguna dapat langsung menemukan kartu `Kehadiran Bulan Ini`, `Laporan Terkirim`, `Modul Dibuat`, `Status Hari Ini`, sapaan nama pengguna, dan bar `Progres Magang`. | Seluruh 4 kartu statistik, kartu sapaan pengguna, kalender kegiatan, dan bar `Progres Magang` tampil jelas dengan kontras tinggi di atas latar `#F7F9FC`. | **PASS** |
| **UT-03** | **Menemukan Menu Utama & Navigasi ke Laporan Harian** | 1. Gunakan navigasi utama atau tombol aksi pada halaman `/laporan-harian`.<br>2. Tekan tombol `Buat Laporan`. | Pengguna dapat menemukan tombol `Buat Laporan` dengan mudah dan diarahkan ke halaman formulir `/laporan-harian/baru`. | Tombol aksi `Buat Laporan` berwarna hijau `#1E8A3C` dengan ikon `+` terlihat menonjol di kanan atas daftar laporan dan langsung mengarahkan ke `/laporan-harian/baru`. | **PASS** |
| **UT-04** | **Menggunakan Fitur Utama (Formulir Laporan Harian & Feedback Interaksi)** | 1. Pada `/laporan-harian/baru`, periksa label input.<br>2. Ketik deskripsi kegiatan pada kolom `Deskripsi Kegiatan`.<br>3. Amati penghitung karakter dan opsi tombol `Simpan Draft` / `Kirim Laporan`. | Setiap input memiliki label jelas dengan tanda `*` untuk kolom wajib, terdapat penghitung jumlah karakter *real-time*, dan tombol `Simpan Draft` serta `Kirim Laporan` dibedakan secara visual. | Label `Tanggal *`, `Judul Laporan *`, `Deskripsi Kegiatan *`, dan `Kendala (opsional)` tampil jelas; penghitung karakter (`56 karakter`) berubah secara *real-time* saat mengetik. Bukti: `usability-task4-form-laporan.png`. | **PASS** |
| **UT-05** | **Evaluasi Responsive Layout pada Layar Smartphone (`375x667`)** | 1. Ubah ukuran layar ke viewport smartphone (`375px x 667px`).<br>2. Buka `/dashboard` dan periksa tata letak kartu serta *floating dock*. | Tata letak menyesuaikan menjadi 1–2 kolom vertikal tanpa terjadi *horizontal scroll/overflow* (`scrollWidth <= innerWidth`). | Halaman menyesuaikan secara responsif pada lebar `375px` tanpa *horizontal overflow* (`scrollWidth === 375`). Bukti: `usability-task5-mobile-responsive.png`. | **PASS** |
| **UT-06** | **Melakukan Navigasi Kembali & Logout dari Sistem** | 1. Klik tombol profil pengguna di pojok kanan atas `Navbar`.<br>2. Pilih menu `Keluar` pada *dropdown*. | Menu *dropdown* menampilkan nama, email, *badge role*, tautan `Profil Saya`, `Pengaturan`, dan tombol `Keluar` berwarna merah; klik `Keluar` mengakhiri sesi dan mengarahkan ke `/login`. | *Dropdown* profil terbuka dengan responsif, tombol `Keluar` mengakhiri sesi NextAuth dan mengarahkan pengguna kembali ke `/login`. | **PASS** |

---

## 4. Evaluasi 9 Aspek Usability & Aksesibilitas

| Aspek Evaluasi | Hasil Evaluasi pada SIMAG BMKG | Status |
|----------------|--------------------------------|--------|
| **1. Navigasi** | Navigasi menggunakan kombinasi *Top Navbar* (untuk profil, notifikasi, pengaturan) dan *Floating Bottom Dock* (`Dashboard`, `Absensi`, `Laporan Harian`, `Modul Praktikum`, `Riwayat Absensi`, `Kalender`, `Profil`). Breadcrumb (`Dashboard / Laporan Harian / Buat Laporan`) memudahkan orientasi posisi halaman. | **Baik (PASS)** |
| **2. Konsistensi UI** | Palet warna konsisten menggunakan hijau identitas `#1E8A3C`, latar belakang abu-abu lembut `#F7F9FC`, sudut membulat (`rounded-2xl`), serta ikonografi `lucide-react` yang seragam di seluruh halaman. | **Baik (PASS)** |
| **3. Kejelasan Label** | Seluruh kolom wajib ditandai dengan asteris (`*`), disertai petunjuk tambahan dalam tanda kurung seperti `(Jelaskan kegiatan yang dilakukan hari ini)` dan *placeholder* kontekstual (`Contoh: Observasi Data Curah Hujan Stasiun A`). | **Baik (PASS)** |
| **4. Keterbacaan Informasi** | Hirarki tipografi jelas: angka statistik ditampilkan tebal (`text-2xl font-bold`), judul bagian menggunakan `text-base/xl font-bold text-gray-800`, dan keterangan sekunder menggunakan `text-xs text-gray-500`. | **Baik (PASS)** |
| **5. Feedback Interaksi** | Setiap aksi (login, simpan draft, kirim laporan, absen) memberikan umpan balik visual berupa *spinner* (`Loader2 animate-spin`) pada tombol yang dinonaktifkan sementara (`disabled={loading}`) serta notifikasi *toast* (`sonner`). | **Baik (PASS)** |
| **6. Error Handling** | Kesalahan login menampilkan *toast* jelas (`Username/Email atau password salah. Silakan coba lagi.`). Validasi form laporan harian mencegah pengiriman jika judul/deskripsi kosong. | **Baik (PASS)** |
| **7. Responsive Layout** | Menggunakan kelas utilitas Tailwind CSS (`grid-cols-2 lg:grid-cols-4`, `hidden md:block`, `overflow-x-hidden`) sehingga tampilan proporsional baik di layar `1280x800` maupun `375x667`. | **Baik (PASS)** |
| **8. Accessibility Dasar** | Telah diperkuat dengan atribut `htmlFor`/`id` pada form `/login` dan `/laporan-harian/baru`, atribut `aria-label` pada tombol ikon di `Navbar` dan `Dock`, serta `alt` pada gambar logo. | **Baik (PASS)** |
| **9. Kemudahan Penyelesaian Task** | Seluruh 6 *task* utama dapat diselesaikan dalam 1–3 klik tanpa hambatan navigasi. | **Baik (PASS)** |

---

## 5. Temuan Usability & Rekomendasi Perbaikan

Selama audit kode dan pengujian otomatis, ditemukan beberapa poin penting yang sebagian telah langsung diperbaiki pada branch ini:

| ID | Temuan | Dampak Usability / Aksesibilitas | Status Tindak Lanjut |
|----|--------|----------------------------------|----------------------|
| **UF-01** | Tombol `"Simpan Draft"` pada halaman `/laporan-harian/baru` mengirimkan `asDraft: true`, namun endpoint `POST /api/laporan-harian` sebelumnya mengabaikan flag tersebut dan selalu menyimpan laporan sebagai `TERKIRIM`. | Pengguna yang ingin menyimpan draf sementara kehilangan kesempatan mengedit laporan karena laporan langsung terkirim ke pembimbing. | **DIPERBAIKI (`FIXED`)** pada `src/app/api/laporan-harian/route.ts` & `src/app/laporan-harian/baru/page.tsx`. |
| **UF-02** | Elemen `<label>` pada halaman `/login` dan `/laporan-harian/baru` sebelumnya belum memiliki atribut `htmlFor` yang terhubung ke `id` elemen `<input>`/`<textarea>`, serta tombol ikon *Floating Dock* belum memiliki `aria-label`. | Pengguna *screen reader* kesulitan mengenali nama kontrol input dan tautan navigasi ikon pada Dock. | **DIPERBAIKI (`FIXED`)** pada `src/app/login/page.tsx`, `src/app/laporan-harian/baru/page.tsx`, `src/components/layout/Navbar.tsx`, dan `src/components/layout/Dock.tsx`. |
| **UF-03** | *Floating Bottom Dock* hanya menampilkan *tooltip* nama menu saat kursor melakukan *hover* (`onMouseEnter`). Pada layar sentuh (*mobile*), pengguna mengandalkan ikon visual tanpa teks label di bawah ikon. | Pengguna baru di perangkat smartphone mungkin memerlukan waktu adaptasi untuk menghafal arti 7 ikon pada Dock. | **Rekomendasi Pengembangan Lanjutan:** Tambahkan label teks berukuran kecil (`text-[10px]`) di bawah ikon aktif pada mode layar mobile (`< 640px`). |
| **UF-04** | Saat pengguna baru masuk ke `/dashboard`, `LocationEnforcerModal` dan `NotificationPromptModal` dapat muncul secara berurutan jika izin GPS dan Notifikasi browser belum diberikan. | Dapat terasa mengganggu (*intrusive*) apabila pengguna hanya ingin melihat jadwal atau mengunduh modul praktikum dari perangkat PC/laptop. | **Rekomendasi Pengembangan Lanjutan:** Tampilkan *banner* peringatan non-modal terlebih dahulu di `/dashboard`, dan tampilkan modal penegakan GPS wajib hanya ketika pengguna membuka halaman `/absensi`. |

---

## 6. Instrumen Pengujian Partisipan Manusia (Siap Digunakan)

> **Catatan Kejujuran Akademik:** Sesuai ketentuan tugas, bagian di bawah ini adalah **instrumen siap pakai** untuk pengujian bersama partisipan manusia (mahasiswa/dosen/mentor) dan tidak diisi dengan angka fiktif. Hasil pengujian otomatis aktual telah dilaporkan secara transparan pada Bagian 3 dan 4 di atas.

### 6.1. Lembar Observasi Penyelesaian Task (Untuk Moderator)

**Nama Partisipan:** `_______________________`  
**Peran:** `[ ] Mahasiswa  [ ] DPL  [ ] Mentor Instansi`  
**Perangkat / Browser:** `_______________________`  
**Tanggal Pengujian:** `_______________________`

| Kode Task | Deskripsi Skenario Tugas untuk Partisipan | Berhasil? (Ya/Tidak) | Waktu Penyelesaian (detik) | Jumlah Kesalahan Klik | Catatan Observasi / Komentar Partisipan |
|-----------|-------------------------------------------|----------------------|----------------------------|-----------------------|-----------------------------------------|
| **T1** | Masuk ke aplikasi SIMAG BMKG menggunakan akun yang diberikan. | `[ ] Ya  [ ] Tidak` | `____ dtk` | `____` | |
| **T2** | Sebutkan berapa jumlah laporan terkirim dan berapa persen progres magang Anda dari halaman Dashboard. | `[ ] Ya  [ ] Tidak` | `____ dtk` | `____` | |
| **T3** | Buka menu Laporan Harian dan buat satu laporan baru sebagai **Draft**. | `[ ] Ya  [ ] Tidak` | `____ dtk` | `____` | |
| **T4** | Gunakan kolom pencarian di halaman Laporan Harian untuk menemukan laporan yang baru saja Anda buat. | `[ ] Ya  [ ] Tidak` | `____ dtk` | `____` | |
| **T5** | Buka halaman Riwayat Absensi dan periksa status kehadiran beserta keterangannya. | `[ ] Ya  [ ] Tidak` | `____ dtk` | `____` | |
| **T6** | Keluar (*Logout*) dari aplikasi SIMAG BMKG melalui menu profil. | `[ ] Ya  [ ] Tidak` | `____ dtk` | `____` | |

---

### 6.2. Kuesioner System Usability Scale (SUS) — Skala Likert 1 s.d. 5
*(1 = Sangat Tidak Setuju, 2 = Tidak Setuju, 3 = Netral, 4 = Setuju, 5 = Sangat Setuju)*

| No | Pernyataan Evaluasi | 1 | 2 | 3 | 4 | 5 |
|----|---------------------|---|---|---|---|---|
| 1 | Saya merasa akan sering menggunakan aplikasi SIMAG BMKG ini selama masa magang. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Saya merasa tampilan aplikasi SIMAG BMKG tidak rumit dan mudah dipahami. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Saya merasa fitur-fitur utama (Absensi, Laporan Harian, Modul) mudah ditemukan. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Saya tidak membutuhkan bantuan teknisi untuk dapat menggunakan aplikasi ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Saya merasa alur navigasi antar-halaman pada SIMAG BMKG terintegrasi dengan baik. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Label formulir dan pesan notifikasi error/sukses pada aplikasi ini jelas dan membantu. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Tampilan aplikasi tetap nyaman digunakan baik di layar HP maupun laptop. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Secara keseluruhan, saya puas dengan kemudahan penggunaan aplikasi SIMAG BMKG. | ☐ | ☐ | ☐ | ☐ | ☐ |
