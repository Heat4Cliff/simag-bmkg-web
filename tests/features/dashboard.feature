Feature: Dashboard SIMAG BMKG
  Sebagai mahasiswa peserta magang BMKG
  Saya ingin melihat ringkasan aktivitas dan progres magang di halaman dashboard
  Agar saya dapat memantau kehadiran, laporan harian, dan modul praktikum secara cepat

  Scenario: Menampilkan ringkasan kartu statistik pada dashboard mahasiswa
    Given pengguna telah login
    When pengguna berada di halaman dashboard
    Then pengguna melihat kartu statistik "Kehadiran Bulan Ini"
    And pengguna melihat kartu statistik "Laporan Terkirim"
    And pengguna melihat kartu statistik "Modul Dibuat"
    And pengguna melihat kartu statistik "Status Hari Ini"

  Scenario: Menampilkan informasi sapaan pengguna dan progres magang
    Given pengguna telah login
    When pengguna berada di halaman dashboard
    Then sistem menampilkan sapaan "Selamat datang," beserta nama pengguna
    And sistem menampilkan indikator "Progres Magang" beserta tautan "Lihat profil"

  Scenario: Navigasi dari kartu ringkasan dashboard ke halaman fitur terkait
    Given pengguna telah login
    When pengguna menekan kartu statistik "Laporan Terkirim" di dashboard
    Then pengguna diarahkan ke halaman "/laporan-harian"
    And judul halaman menampilkan "Laporan Harian"
