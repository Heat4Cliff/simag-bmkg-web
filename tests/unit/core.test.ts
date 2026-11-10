import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cekLibur,
  cekPeringatan,
  ID_HOLIDAYS,
  COMMEMORATIVE_DAYS,
} from "../../src/lib/holidays";
import {
  cn,
  hitungJarakMeter,
  formatTanggal,
  formatTanggalCompact,
  formatWaktu,
  getStatusLabel,
  getStatusLaporanColor,
  getStatusAbsensiColor,
  getJakartaDate,
  getJakartaDateISO,
  getJakartaMonthStartISO,
  getJakartaMonthEndISO,
  KOORDINAT_KANTOR,
  RADIUS_ABSENSI_METER,
} from "../../src/lib/utils";
import {
  loginSchema,
  passwordSchema,
  createUserSchema,
  laporanSchema,
  modulSchema,
  absensiSchema,
  jadwalSchema,
} from "../../src/lib/validations";
import {
  saveLastKnownLocation,
  getLastKnownLocation,
  GeoCoordinate,
} from "../../src/lib/geo";

// ============================================================================
// 1. GEOFENCE PRESENSI: hitungJarakMeter & Koordinat Kantor
// ============================================================================
describe("geofence presensi: hitungJarakMeter", () => {
  const kantor = { lat: -7.7186515, lon: 109.0118975 };

  it("menghasilkan nol untuk titik yang sama", () => {
    assert.equal(hitungJarakMeter(kantor.lat, kantor.lon, kantor.lat, kantor.lon), 0);
  });

  it("menghasilkan jarak yang simetris", () => {
    const dariMahasiswa = hitungJarakMeter(-7.715, 109.012, kantor.lat, kantor.lon);
    const dariKantor = hitungJarakMeter(kantor.lat, kantor.lon, -7.715, 109.012);
    assert.ok(Math.abs(dariMahasiswa - dariKantor) < 0.001);
  });

  it("membedakan titik di dalam dan di luar radius 500 meter", () => {
    const diDalam = hitungJarakMeter(kantor.lat + 0.003, kantor.lon, kantor.lat, kantor.lon);
    const diLuar = hitungJarakMeter(kantor.lat + 0.006, kantor.lon, kantor.lat, kantor.lon);
    assert.ok(diDalam < 500, `jarak ${diDalam} m seharusnya di dalam radius`);
    assert.ok(diLuar > 500, `jarak ${diLuar} m seharusnya di luar radius`);
  });

  it("mendekati jarak satu derajat lintang pada ekuator", () => {
    const jarak = hitungJarakMeter(0, 0, 1, 0);
    assert.ok(Math.abs(jarak - 111_195) < 200);
  });

  it("memverifikasi nilai konstanta koordinat kantor dan batas radius absensi", () => {
    assert.equal(KOORDINAT_KANTOR.latitude, -7.7186515);
    assert.equal(KOORDINAT_KANTOR.longitude, 109.0118975);
    assert.equal(RADIUS_ABSENSI_METER, 500);
  });

  it("menghitung jarak pada titik antipodal (~20.000 km)", () => {
    const jarak = hitungJarakMeter(0, 0, 0, 180);
    const jarakExpected = Math.PI * 6371000;
    assert.ok(Math.abs(jarak - jarakExpected) < 100);
  });

  it("menghitung jarak kutub ke kutub (~20.000 km)", () => {
    const jarak = hitungJarakMeter(90, 0, -90, 0);
    const jarakExpected = Math.PI * 6371000;
    assert.ok(Math.abs(jarak - jarakExpected) < 100);
  });

  it("menghitung presisi tinggi pada pergeseran mikro (jarak < 5 meter)", () => {
    const jarakMikro = hitungJarakMeter(kantor.lat, kantor.lon, kantor.lat + 0.00003, kantor.lon);
    assert.ok(jarakMikro > 0 && jarakMikro < 5, `jarak mikro harus < 5m, aktual ${jarakMikro}m`);
  });

  it("menguji batas toleransi tepat di ambang batas 500 meter", () => {
    // 0.0045 derajat lintang kira-kira 500 meter
    const dLat = 500 / 111195;
    const jarakAmbang = hitungJarakMeter(kantor.lat, kantor.lon, kantor.lat + dLat, kantor.lon);
    assert.ok(Math.abs(jarakAmbang - 500) < 5);
  });
});

// ============================================================================
// 2. KALENDER PRESENSI: cekLibur
// ============================================================================
describe("kalender presensi: cekLibur", () => {
  it("menandai tanggal libur nasional dari daftar", () => {
    const hasil = cekLibur(new Date(2025, 4, 1, 12));
    assert.deepEqual(hasil, { isLibur: true, keterangan: "Hari Buruh Internasional" });
  });

  it("menandai Sabtu sebagai akhir pekan", () => {
    assert.deepEqual(cekLibur(new Date(2026, 9, 24, 12)), {
      isLibur: true,
      keterangan: "Akhir Pekan (Sabtu)",
    });
  });

  it("menandai Minggu sebagai akhir pekan", () => {
    assert.deepEqual(cekLibur(new Date(2026, 9, 25, 12)), {
      isLibur: true,
      keterangan: "Akhir Pekan (Minggu)",
    });
  });

  it("mengizinkan akhir pekan ketika allowWeekend aktif", () => {
    assert.deepEqual(cekLibur(new Date(2026, 9, 24, 12), { allowWeekend: true }), {
      isLibur: false,
      keterangan: "",
    });
    assert.deepEqual(cekLibur(new Date(2026, 9, 25, 12), { allowWeekend: true }), {
      isLibur: false,
      keterangan: "",
    });
  });

  it("tetap menandai libur nasional ketika allowWeekend aktif", () => {
    assert.equal(cekLibur(new Date(2025, 4, 1, 12), { allowWeekend: true }).isLibur, true);
    assert.equal(cekLibur("2024-08-17", { allowWeekend: true }).isLibur, true);
  });

  it("tidak menganggap hari kerja biasa sebagai libur", () => {
    assert.deepEqual(cekLibur(new Date(2026, 9, 26, 12)), {
      isLibur: false,
      keterangan: "",
    });
  });

  it("mengenali berbagai hari libur nasional 2024 dari tabel ID_HOLIDAYS", () => {
    assert.equal(cekLibur("2024-01-01").keterangan, "Tahun Baru Masehi");
    assert.equal(cekLibur("2024-08-17").keterangan, "Hari Kemerdekaan Republik Indonesia");
    assert.equal(cekLibur("2024-12-25").keterangan, "Hari Raya Natal");
    assert.equal(cekLibur("2024-02-09").keterangan, "Cuti Bersama Tahun Baru Imlek");
  });

  it("mengenali berbagai hari libur nasional 2025 dari tabel ID_HOLIDAYS", () => {
    assert.equal(cekLibur("2025-01-01").keterangan, "Tahun Baru Masehi");
    assert.equal(cekLibur("2025-06-01").keterangan, "Hari Lahir Pancasila");
    assert.equal(cekLibur("2025-12-25").keterangan, "Hari Raya Natal");
  });

  it("menerima parameter berupa format string ISO dan numeric timestamp", () => {
    const timestamp = new Date("2024-01-01T00:00:00Z").getTime();
    assert.equal(cekLibur(timestamp).isLibur, true);
    assert.equal(cekLibur("2024-01-01").isLibur, true);
  });

  it("memverifikasi tabel ID_HOLIDAYS memuat daftar hari libur nasional", () => {
    assert.ok(Object.keys(ID_HOLIDAYS).length > 20);
    assert.ok("2024-01-01" in ID_HOLIDAYS);
  });
});

// ============================================================================
// 3. KALENDER KEGIATAN: cekPeringatan
// ============================================================================
describe("kalender kegiatan: cekPeringatan", () => {
  it("mengembalikan nama peringatan yang dikenal", () => {
    assert.equal(cekPeringatan(new Date(2026, 9, 28, 12)), "Hari Sumpah Pemuda");
  });

  it("mengembalikan null untuk tanggal tanpa peringatan", () => {
    assert.equal(cekPeringatan(new Date(2026, 9, 27, 12)), null);
  });

  it("mengenali hari peringatan BMKG dan meteorologi", () => {
    assert.equal(cekPeringatan("2026-03-23"), "Hari Meteorologi Sedunia");
    assert.equal(cekPeringatan("2026-07-21"), "Hari Meteorologi, Klimatologi, dan Geofisika (HMKG)");
  });

  it("mengenali hari besar nasional lainnya", () => {
    assert.equal(cekPeringatan("2026-04-21"), "Hari Kartini");
    assert.equal(cekPeringatan("2026-05-02"), "Hari Pendidikan Nasional");
    assert.equal(cekPeringatan("2026-05-20"), "Hari Kebangkitan Nasional");
    assert.equal(cekPeringatan("2026-08-14"), "Hari Pramuka");
    assert.equal(cekPeringatan("2026-10-01"), "Hari Kesaktian Pancasila");
    assert.equal(cekPeringatan("2026-11-10"), "Hari Pahlawan");
    assert.equal(cekPeringatan("2026-12-22"), "Hari Ibu");
  });

  it("mengenali hari peringatan internasional", () => {
    assert.equal(cekPeringatan("2026-04-22"), "Hari Bumi");
    assert.equal(cekPeringatan("2026-06-05"), "Hari Lingkungan Hidup Sedunia");
    assert.equal(cekPeringatan("2026-12-01"), "Hari AIDS Sedunia");
  });

  it("memverifikasi tabel COMMEMORATIVE_DAYS memuat hari peringatan penting", () => {
    assert.ok(Object.keys(COMMEMORATIVE_DAYS).length > 5);
    assert.ok("10-28" in COMMEMORATIVE_DAYS);
  });
});

// ============================================================================
// 4. VALIDASI INPUT PENGGUNA & LAPORAN: validations.ts
// ============================================================================
describe("validasi input pengguna dan laporan", () => {
  it("menerima kredensial login yang memenuhi batas minimum", () => {
    assert.equal(loginSchema.safeParse({ identifier: "alwan", password: "123456" }).success, true);
  });

  it("menolak identifier kosong dan password terlalu pendek", () => {
    assert.equal(loginSchema.safeParse({ identifier: "", password: "12345" }).success, false);
    assert.equal(loginSchema.safeParse({ identifier: "alwan", password: "1234" }).success, false);
  });

  it("menerima password pada batas ambang minimum tepat 6 karakter", () => {
    assert.equal(loginSchema.safeParse({ identifier: "admin", password: "123456" }).success, true);
  });

  it("menolak konfirmasi password yang berbeda", () => {
    const hasil = passwordSchema.safeParse({
      oldPassword: "lama123",
      newPassword: "baru123",
      confirmPassword: "lain123",
    });
    assert.equal(hasil.success, false);
    if (!hasil.success) {
      assert.ok(hasil.error.issues.some((issue) => issue.path.join(".") === "confirmPassword"));
    }
  });

  it("menerima password baru ketika konfirmasi cocok", () => {
    assert.equal(passwordSchema.safeParse({
      oldPassword: "lama123",
      newPassword: "baru123",
      confirmPassword: "baru123",
    }).success, true);
  });

  it("menolak password baru yang kurang dari 6 karakter", () => {
    const hasil = passwordSchema.safeParse({
      oldPassword: "lama123",
      newPassword: "12345",
      confirmPassword: "12345",
    });
    assert.equal(hasil.success, false);
  });

  it("menolak oldPassword yang kurang dari 6 karakter", () => {
    const hasil = passwordSchema.safeParse({
      oldPassword: "12345",
      newPassword: "baru123",
      confirmPassword: "baru123",
    });
    assert.equal(hasil.success, false);
  });

  it("memvalidasi createUserSchema untuk role SUPERADMIN, DPL, dan MAHASISWA", () => {
    const validMhs = {
      nama: "Budi Santoso",
      email: "budi@unugha.ac.id",
      password: "password123",
      role: "MAHASISWA",
      nim: "2201540001",
      programStudi: "Teknik Informatika",
    };
    assert.equal(createUserSchema.safeParse(validMhs).success, true);

    const validDpl = {
      nama: "Dr. Ahmad",
      email: "ahmad@unugha.ac.id",
      password: "password123",
      role: "DPL",
    };
    assert.equal(createUserSchema.safeParse(validDpl).success, true);

    const validAdmin = {
      nama: "Super Administrator",
      email: "admin@bmkg.go.id",
      password: "password123",
      role: "SUPERADMIN",
    };
    assert.equal(createUserSchema.safeParse(validAdmin).success, true);
  });

  it("menolak createUserSchema dengan email tidak valid atau role tidak dikenal", () => {
    assert.equal(createUserSchema.safeParse({
      nama: "User Test",
      email: "bukan-email",
      password: "password123",
      role: "MAHASISWA",
    }).success, false);

    assert.equal(createUserSchema.safeParse({
      nama: "User Test",
      email: "test@domain.com",
      password: "password123",
      role: "GUEST",
    }).success, false);
  });

  it("menolak createUserSchema dengan password kurang dari 8 karakter", () => {
    assert.equal(createUserSchema.safeParse({
      nama: "User Test",
      email: "test@domain.com",
      password: "1234567", // 7 karakter
      role: "MAHASISWA",
    }).success, false);

    // Tepat 8 karakter diizinkan
    assert.equal(createUserSchema.safeParse({
      nama: "User Test",
      email: "test@domain.com",
      password: "12345678", // 8 karakter
      role: "MAHASISWA",
    }).success, true);
  });

  it("menolak laporan harian dengan deskripsi kurang dari 10 karakter", () => {
    assert.equal(laporanSchema.safeParse({
      tanggal: "2026-10-28",
      judul: "Kegiatan magang",
      deskripsi: "Singkat",
    }).success, false);
  });

  it("menolak laporan harian dengan judul kurang dari 3 karakter", () => {
    assert.equal(laporanSchema.safeParse({
      tanggal: "2026-10-28",
      judul: "Ok",
      deskripsi: "Deskripsi kegiatan sudah cukup panjang.",
    }).success, false);
  });

  it("menerima laporan harian yang lengkap dan memiliki kendala opsional", () => {
    assert.equal(laporanSchema.safeParse({
      tanggal: "2026-10-28",
      judul: "Kegiatan magang",
      deskripsi: "Melakukan pengamatan cuaca harian.",
      kendala: "Jaringan sensor sempat terputus.",
    }).success, true);
  });

  it("memvalidasi modulSchema praktikum", () => {
    const validModul = {
      judul: "Modul 01: Pengamatan Sinoptik",
      kategoriId: "obs-meteorologi",
      konten: "Panduan teknis pengamatan sinoptik dan pelaporan data cuaca.",
    };
    assert.equal(modulSchema.safeParse(validModul).success, true);

    // Judul terlalu pendek
    assert.equal(modulSchema.safeParse({ ...validModul, judul: "AB" }).success, false);
    // Kategori kosong
    assert.equal(modulSchema.safeParse({ ...validModul, kategoriId: "" }).success, false);
    // Konten terlalu pendek
    assert.equal(modulSchema.safeParse({ ...validModul, konten: "Pendek" }).success, false);
  });

  it("memvalidasi absensiSchema untuk tipe MASUK dan PULANG", () => {
    const validMasuk = {
      tipe: "MASUK",
      latitude: -7.71865,
      longitude: 109.01189,
      foto: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    };
    assert.equal(absensiSchema.safeParse(validMasuk).success, true);

    const validPulang = {
      tipe: "PULANG",
      latitude: -7.71865,
      longitude: 109.01189,
      foto: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    };
    assert.equal(absensiSchema.safeParse(validPulang).success, true);

    // Tipe tidak valid (misal: IZIN, SAKIT)
    assert.equal(absensiSchema.safeParse({ ...validMasuk, tipe: "IZIN" }).success, false);
    // Latitude non-number
    assert.equal(absensiSchema.safeParse({ ...validMasuk, latitude: "bukan-angka" }).success, false);
  });

  it("memvalidasi jadwalSchema kegiatan", () => {
    const validJadwal = {
      judul: "Bimbingan Mingguan",
      tanggal: "2026-11-15",
      tipe: "BIMBINGAN",
      deskripsi: "Konsultasi laporan progres bab 3",
      jam: "09:00",
    };
    assert.equal(jadwalSchema.safeParse(validJadwal).success, true);

    // Tipe valid lainnya: PRIBADI, INSTANSI
    assert.equal(jadwalSchema.safeParse({ ...validJadwal, tipe: "PRIBADI" }).success, true);
    assert.equal(jadwalSchema.safeParse({ ...validJadwal, tipe: "INSTANSI" }).success, true);

    // Tipe tidak valid
    assert.equal(jadwalSchema.safeParse({ ...validJadwal, tipe: "UMUM" }).success, false);
    // Judul terlalu pendek
    assert.equal(jadwalSchema.safeParse({ ...validJadwal, judul: "X" }).success, false);
  });
});

// ============================================================================
// 5. STATUS LABEL & COLOR BADGE: utils.ts
// ============================================================================
describe("label status dan pewarnaan badge", () => {
  it("menerjemahkan status presensi dan laporan", () => {
    assert.equal(getStatusLabel("HADIR"), "Hadir");
    assert.equal(getStatusLabel("TELAT"), "Terlambat");
    assert.equal(getStatusLabel("REVISI"), "Perlu Revisi");
  });

  it("menerjemahkan seluruh kemungkinan status operasional SIMAG", () => {
    assert.equal(getStatusLabel("DRAFT"), "Draft");
    assert.equal(getStatusLabel("TERKIRIM"), "Terkirim");
    assert.equal(getStatusLabel("DIREVIEW"), "Direview");
    assert.equal(getStatusLabel("DISETUJUI"), "Disetujui");
    assert.equal(getStatusLabel("DITOLAK"), "Ditolak");
    assert.equal(getStatusLabel("IZIN"), "Izin");
    assert.equal(getStatusLabel("SAKIT"), "Sakit");
    assert.equal(getStatusLabel("ALPA"), "Alpa");
  });

  it("mempertahankan status baru yang belum memiliki label", () => {
    assert.equal(getStatusLabel("STATUS_BARU"), "STATUS_BARU");
    assert.equal(getStatusLabel("CUSTOM_STATE"), "CUSTOM_STATE");
  });

  it("mengembalikan kelas badge Tailwind yang sesuai untuk status laporan", () => {
    assert.equal(getStatusLaporanColor("DRAFT"), "bg-gray-100 text-gray-700");
    assert.equal(getStatusLaporanColor("TERKIRIM"), "bg-green-100 text-green-700");
    assert.equal(getStatusLaporanColor("DIREVIEW"), "bg-yellow-100 text-yellow-700");
    assert.equal(getStatusLaporanColor("DISETUJUI"), "bg-green-100 text-green-700");
    assert.equal(getStatusLaporanColor("REVISI"), "bg-orange-100 text-orange-700");
    assert.equal(getStatusLaporanColor("DITOLAK"), "bg-red-100 text-red-700");
    // Fallback status tidak dikenal
    assert.equal(getStatusLaporanColor("UNKNOWN_STATUS"), "bg-gray-100 text-gray-700");
  });

  it("mengembalikan kelas badge Tailwind yang sesuai untuk status absensi", () => {
    assert.equal(getStatusAbsensiColor("HADIR"), "bg-green-100 text-green-700");
    assert.equal(getStatusAbsensiColor("TELAT"), "bg-amber-100 text-amber-700");
    assert.equal(getStatusAbsensiColor("IZIN"), "bg-blue-100 text-blue-700");
    assert.equal(getStatusAbsensiColor("SAKIT"), "bg-purple-100 text-purple-700");
    assert.equal(getStatusAbsensiColor("ALPA"), "bg-red-100 text-red-700");
    // Fallback status tidak dikenal
    assert.equal(getStatusAbsensiColor("UNKNOWN_STATUS"), "bg-gray-100 text-gray-700");
  });

  it("menggabungkan class string Tailwind dengan benar menggunakan helper cn()", () => {
    assert.equal(cn("px-2 py-1", "bg-red-500"), "px-2 py-1 bg-red-500");
    // Konflik padding diselesaikan oleh tailwind-merge (px-4 mengesampingkan px-2)
    assert.equal(cn("px-2", "px-4"), "px-4");
    // Falsy value diabaikan
    assert.equal(cn("base-class", false && "ignored", null, undefined, "active-class"), "base-class active-class");
  });
});

// ============================================================================
// 6. FORMAT & KALKULASI TANGGAL / WAKTU JAKARTA: utils.ts
// ============================================================================
describe("format dan kalkulasi tanggal waktu Jakarta", () => {
  it("memformat tanggal ke bahasa Indonesia panjang (formatTanggal)", () => {
    const formatted = formatTanggal("2026-11-10T08:30:00Z");
    assert.ok(formatted.includes("2026"), "harus memuat tahun 2026");
    assert.ok(formatted.includes("November") || formatted.includes("Nov"), "harus memuat bulan November");
  });

  it("memformat tanggal ke format ringkas (formatTanggalCompact)", () => {
    const formatted = formatTanggalCompact(new Date("2026-11-10T12:00:00Z"));
    // Format DD/MM/YYYY atau D/M/YYYY
    assert.ok(formatted.includes("10") && formatted.includes("2026"), "harus memuat tanggal dan tahun");
  });

  it("memformat waktu ke jam:menit zona Asia/Jakarta (formatWaktu)", () => {
    // 00:00 UTC = 07:00 WIB
    const formatted = formatWaktu("2026-11-10T00:00:00Z");
    assert.ok(formatted.includes("07"), `harus memuat jam 07 WIB, aktual: ${formatted}`);
  });

  it("menghasilkan tanggal Jakarta hari ini format YYYY-MM-DD (getJakartaDate)", () => {
    const dateStr = getJakartaDate();
    assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("menghasilkan objek Date awal hari (getJakartaDateISO)", () => {
    const d = getJakartaDateISO();
    assert.ok(d instanceof Date);
    assert.equal(d.toISOString().slice(11), "00:00:00.000Z");
  });

  it("menghasilkan awal bulan Jakarta (getJakartaMonthStartISO)", () => {
    const d = getJakartaMonthStartISO();
    assert.ok(d instanceof Date);
    assert.equal(d.toISOString().slice(8, 10), "01");
    assert.equal(d.toISOString().slice(11), "00:00:00.000Z");
  });

  it("menghasilkan akhir bulan Jakarta dengan jam 23:59:59.999Z (getJakartaMonthEndISO)", () => {
    const d = getJakartaMonthEndISO();
    assert.ok(d instanceof Date);
    const day = d.getUTCDate();
    assert.ok([28, 29, 30, 31].includes(day), "hari akhir bulan harus 28, 29, 30, atau 31");
    assert.equal(d.toISOString().slice(11), "23:59:59.999Z");
  });
});

// ============================================================================
// 7. GEOLOCATION STORAGE & CACHE HELPER: geo.ts
// ============================================================================
describe("geolocation cache storage", () => {
  it("mengembalikan null jika dipanggil di luar browser (SSR / Node.js)", () => {
    const loc = getLastKnownLocation();
    assert.equal(loc, null);
  });

  it("menyimpan dan membaca lokasi jika window dan sessionStorage disimulasikan", () => {
    const storage = new Map<string, string>();
    const mockSessionStorage = {
      setItem: (k: string, v: string) => storage.set(k, v),
      getItem: (k: string) => storage.get(k) || null,
      removeItem: (k: string) => storage.delete(k),
    };

    type WindowMockScope = typeof globalThis & {
      window?: unknown;
      sessionStorage?: typeof mockSessionStorage;
    };
    const scope = globalThis as WindowMockScope;

    // Pasang mock window
    const originalWindow = scope.window;
    const originalSessionStorage = scope.sessionStorage;
    scope.window = globalThis;
    scope.sessionStorage = mockSessionStorage;

    try {
      const coord: GeoCoordinate = {
        lat: -7.71865,
        lon: 109.01189,
        accuracy: 15,
        timestamp: Date.now(),
      };

      saveLastKnownLocation(coord);
      const retrieved = getLastKnownLocation();
      assert.deepEqual(retrieved, coord);

      // Lokasi kedaluwarsa (> 10 menit) harus mengembalikan null
      const expiredCoord: GeoCoordinate = {
        ...coord,
        timestamp: Date.now() - 11 * 60 * 1000, // 11 menit lalu
      };
      saveLastKnownLocation(expiredCoord);
      assert.equal(getLastKnownLocation(), null);

      // JSON rusak dalam storage tidak menyebabkan crash dan mengembalikan null
      storage.set("simag_last_known_geo", "{corrupt_json");
      assert.equal(getLastKnownLocation(), null);
    } finally {
      // Kembalikan ke state asli
      if (originalWindow !== undefined) {
        scope.window = originalWindow;
      } else {
        delete scope.window;
      }
      if (originalSessionStorage !== undefined) {
        scope.sessionStorage = originalSessionStorage;
      } else {
        delete scope.sessionStorage;
      }
    }
  });
});
