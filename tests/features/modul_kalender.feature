Feature: Modul Praktikum dan Kalender Kegiatan SIMAG BMKG
  Sebagai mahasiswa peserta magang BMKG
  Saya ingin mengakses modul praktikum dan agenda kalender kegiatan
  Agar materi pembelajaran dan agenda kegiatan bimbingan magang dapat diakses dengan mudah

  Scenario: Mahasiswa membuka daftar modul praktikum dan melihat tombol buat modul
    Given pengguna telah login
    When pengguna membuka halaman "/modul-praktikum"
    Then judul atau breadcrumb modul menampilkan "Modul Praktikum"
    And sistem menampilkan tombol "Buat Modul"

  Scenario: Mahasiswa mengakses formulir pembuatan modul praktikum baru
    Given pengguna telah login
    When pengguna membuka halaman "/modul-praktikum/baru"
    Then sistem menampilkan input judul modul
    And sistem menampilkan pilihan kategori modul
    And sistem menampilkan textarea konten modul

  Scenario: Mahasiswa membuka kalender kegiatan magang
    Given pengguna telah login
    When pengguna membuka halaman "/kalender"
    Then sistem menampilkan header kalender dengan navigasi bulan
    And sistem menampilkan tombol "Tambah Agenda"
