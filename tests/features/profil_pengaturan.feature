Feature: Profil Pengguna dan Pengaturan Sistem SIMAG BMKG
  Sebagai peserta magang atau pengguna SIMAG BMKG
  Saya ingin mengakses profil akun dan halaman pengaturan
  Agar dapat memverifikasi informasi identitas peserta magang dan konfigurasi sistem

  Scenario: Mahasiswa melihat informasi profil peserta magang
    Given pengguna telah login
    When pengguna membuka halaman "/profil"
    Then sistem menampilkan judul "Profil Saya"
    And formulir profil menampilkan nama pengguna yang sesuai
    And formulir profil menampilkan email pengguna yang sesuai

  Scenario: Mahasiswa melihat tombol ubah profil dan ubah kata sandi
    Given pengguna telah login
    When pengguna membuka halaman "/profil"
    Then sistem menampilkan tombol "Edit Profil"
    And sistem menampilkan tombol "Ganti Password"

  Scenario: Mahasiswa membuka halaman pengaturan instansi
    Given pengguna telah login
    When pengguna membuka halaman "/pengaturan"
    Then halaman pengaturan menampilkan informasi instansi
