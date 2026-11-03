Feature: Authentication SIMAG
  Sebagai pengguna aplikasi SIMAG BMKG
  Saya ingin dapat melakukan autentikasi secara aman
  Agar hanya pengguna terotorisasi yang dapat mengakses sistem informasi magang

  Scenario: Pengguna berhasil login
    Given pengguna membuka halaman login SIMAG
    When pengguna memasukkan kredensial yang valid
    And menekan tombol login
    Then pengguna berhasil masuk
    And dashboard ditampilkan

  Scenario: Pengguna gagal login
    Given pengguna membuka halaman login SIMAG
    When pengguna memasukkan kredensial yang tidak valid
    And menekan tombol login
    Then sistem menolak login
    And menampilkan pesan error yang sesuai

  Scenario: Pengguna mengakses halaman protected tanpa login
    Given pengguna belum login
    When pengguna mengakses halaman protected secara langsung
    Then sistem menolak akses atau mengarahkan pengguna ke halaman login

  Scenario: Pengguna logout
    Given pengguna telah login
    When pengguna melakukan logout
    Then session pengguna berakhir
    And pengguna kembali ke halaman login
