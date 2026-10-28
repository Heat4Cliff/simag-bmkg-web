import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cekLibur, cekPeringatan } from "../../src/lib/holidays";
import { hitungJarakMeter, getStatusLabel } from "../../src/lib/utils";
import { loginSchema, passwordSchema, laporanSchema } from "../../src/lib/validations";

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
});

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

  it("mengizinkan akhir pekan ketika allowWeekend aktif", () => {
    assert.deepEqual(cekLibur(new Date(2026, 9, 24, 12), { allowWeekend: true }), {
      isLibur: false,
      keterangan: "",
    });
  });

  it("tetap menandai libur nasional ketika allowWeekend aktif", () => {
    assert.equal(cekLibur(new Date(2025, 4, 1, 12), { allowWeekend: true }).isLibur, true);
  });

  it("tidak menganggap hari kerja biasa sebagai libur", () => {
    assert.deepEqual(cekLibur(new Date(2026, 9, 26, 12)), {
      isLibur: false,
      keterangan: "",
    });
  });
});

describe("kalender kegiatan: cekPeringatan", () => {
  it("mengembalikan nama peringatan yang dikenal", () => {
    assert.equal(cekPeringatan(new Date(2026, 9, 28, 12)), "Hari Sumpah Pemuda");
  });

  it("mengembalikan null untuk tanggal tanpa peringatan", () => {
    assert.equal(cekPeringatan(new Date(2026, 9, 27, 12)), null);
  });
});

describe("validasi input pengguna dan laporan", () => {
  it("menerima kredensial login yang memenuhi batas minimum", () => {
    assert.equal(loginSchema.safeParse({ identifier: "alwan", password: "123456" }).success, true);
  });

  it("menolak identifier kosong dan password terlalu pendek", () => {
    assert.equal(loginSchema.safeParse({ identifier: "", password: "12345" }).success, false);
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

  it("menolak laporan harian dengan deskripsi kurang dari 10 karakter", () => {
    assert.equal(laporanSchema.safeParse({
      tanggal: "2026-10-28",
      judul: "Kegiatan magang",
      deskripsi: "Singkat",
    }).success, false);
  });

  it("menerima laporan harian yang lengkap", () => {
    assert.equal(laporanSchema.safeParse({
      tanggal: "2026-10-28",
      judul: "Kegiatan magang",
      deskripsi: "Melakukan pengamatan cuaca harian.",
    }).success, true);
  });
});

describe("label status", () => {
  it("menerjemahkan status presensi dan laporan", () => {
    assert.equal(getStatusLabel("HADIR"), "Hadir");
    assert.equal(getStatusLabel("REVISI"), "Perlu Revisi");
  });

  it("mempertahankan status baru yang belum memiliki label", () => {
    assert.equal(getStatusLabel("STATUS_BARU"), "STATUS_BARU");
  });
});
