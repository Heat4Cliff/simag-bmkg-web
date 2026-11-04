export const TEST_USERS = {
  mahasiswa: {
    nama: "Mahasiswa Uji BDD Otomatis",
    email: "qa.automation.mhs@test.simag.local",
    username: "qa_bdd_mahasiswa",
    password: "TestPassword@2026!",
    role: "MAHASISWA" as const,
    nim: "99EO99901",
    programStudi: "Teknik Informatika",
  },
  dpl: {
    nama: "Dosen Pembimbing Uji Integrasi",
    email: "qa.automation.dpl@test.simag.local",
    username: "qa_test_dpl",
    password: "TestPassword@2026!",
    role: "DPL" as const,
    nip: "199001012026011001",
  },
  mentor: {
    nama: "Mentor Instansi Uji Integrasi",
    email: "qa.automation.mentor@test.simag.local",
    username: "qa_test_mentor",
    password: "TestPassword@2026!",
    role: "MENTOR_INSTANSI" as const,
    jabatan: "Observer Meteorologi Senior",
  },
  superadmin: {
    nama: "Superadmin Uji Integrasi",
    email: "qa.automation.admin@test.simag.local",
    username: "qa_test_admin",
    password: "TestPassword@2026!",
    role: "SUPERADMIN" as const,
  },
  nonaktif: {
    nama: "Pengguna Nonaktif Uji",
    email: "qa.automation.inactive@test.simag.local",
    username: "qa_test_inactive",
    password: "TestPassword@2026!",
    role: "MAHASISWA" as const,
  },
};

export const TEST_TEMPAT_MAGANG = {
  id: "test-tempat-bmkg-cilacap",
  namaInstansi: "BMKG Stasiun Meteorologi Tunggul Wulung Cilacap (Test)",
  alamat: "Jl. Gatot Subroto No.20, Cilacap, Jawa Tengah",
  latitudeKantor: -7.718597,
  longitudeKantor: 109.014643,
  radiusAbsensiMeter: 200,
};

export const TEST_KATEGORI_MODUL = {
  id: "test-kategori-observasi-sinoptik",
  namaKategori: "Observasi Meteorologi Sinoptik (Test)",
  deskripsi: "Kategori modul pengujian otomatis SIMAG BMKG",
};

// Minimal valid 1x1 JPEG base64 for attendance photo testing
export const SAMPLE_JPEG_BASE64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
