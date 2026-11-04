Feature: Fitur Utama SIMAG BMKG
  Sebagai mahasiswa peserta magang BMKG
  Saya ingin menggunakan fitur Laporan Harian, Riwayat Absensi, dan Kalender Kegiatan
  Agar seluruh aktivitas magang saya tercatat dan terpantau dengan baik

  Scenario: Mahasiswa membuat draft laporan harian baru
    Given pengguna telah login
    When pengguna membuka halaman "/laporan-harian/baru"
    And pengguna mengisi judul laporan "Observasi Sinoptik Stasiun Meteorologi"
    And pengguna mengisi deskripsi kegiatan "Melakukan pengamatan suhu udara, kelembaban, tekanan udara, dan curah hujan harian pada taman alat meteorologi."
    And pengguna mengisi kendala laporan "Tidak ada kendala teknis pada instrumen pengamatan."
    And pengguna menekan tombol "Simpan Draft"
    Then pengguna diarahkan kembali ke halaman "/laporan-harian"
    And daftar laporan menampilkan judul "Observasi Sinoptik Stasiun Meteorologi" dengan status "Draft"

  Scenario: Mahasiswa memfilter daftar laporan harian berdasarkan pencarian
    Given pengguna telah login
    And terdapat laporan harian "Observasi Sinoptik Stasiun Meteorologi" pada sistem
    When pengguna membuka halaman "/laporan-harian"
    And pengguna mengetik "Observasi Sinoptik" pada kolom pencarian laporan
    Then daftar laporan tetap menampilkan "Observasi Sinoptik Stasiun Meteorologi"

  Scenario: Mahasiswa melihat halaman riwayat kehadiran dan tabel presensi
    Given pengguna telah login
    When pengguna membuka halaman "/riwayat/absensi"
    Then judul halaman menampilkan "Riwayat Kehadiran"
    And tabel riwayat absensi menampilkan kolom "Tanggal", "Jam Masuk", "Jam Pulang", "Keterangan", dan "Status"

  Scenario: Mahasiswa mengakses halaman absensi harian
    Given pengguna telah login
    When pengguna membuka halaman "/absensi"
    Then judul halaman menampilkan "Absensi Harian"
    And sistem menampilkan bagian "Status Hari Ini"
