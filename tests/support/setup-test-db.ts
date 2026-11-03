import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { TEST_USERS, TEST_TEMPAT_MAGANG } from "../fixtures/test-data";

export function getBaseDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    "postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg"
  );
}

export function getTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  const url = new URL(getBaseDatabaseUrl());
  url.pathname = "/simag_bmkg_test";
  return url.toString();
}

const SCHEMA_SQL = `
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'DPL', 'MENTOR_INSTANSI', 'MAHASISWA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusAbsensi" AS ENUM ('HADIR', 'TELAT', 'IZIN', 'SAKIT', 'ALPA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusLaporan" AS ENUM ('DRAFT', 'TERKIRIM', 'DIREVIEW', 'DISETUJUI', 'REVISI', 'DITOLAK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusModul" AS ENUM ('DRAFT', 'TERKIRIM', 'DIREVIEW', 'DISETUJUI', 'REVISI');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TipeJadwal" AS ENUM ('PRIBADI', 'BIMBINGAN', 'INSTANSI');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nama" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "username" TEXT UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'MAHASISWA',
  "foto_profil" TEXT,
  "status_aktif" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tempat_magang" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nama_instansi" TEXT NOT NULL,
  "alamat" TEXT,
  "latitude_kantor" DOUBLE PRECISION,
  "longitude_kantor" DOUBLE PRECISION,
  "radius_absensi_meter" DOUBLE PRECISION DEFAULT 500,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "dpl_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "nip" TEXT,
  "no_hp" TEXT
);

CREATE TABLE IF NOT EXISTS "mentor_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "jabatan" TEXT,
  "no_hp" TEXT
);

CREATE TABLE IF NOT EXISTS "mahasiswa_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "nim" TEXT,
  "program_studi" TEXT,
  "periode_mulai" TIMESTAMP(3),
  "periode_selesai" TIMESTAMP(3),
  "dpl_id" TEXT REFERENCES "dpl_profiles"("id"),
  "mentor_id" TEXT REFERENCES "mentor_profiles"("id"),
  "tempat_magang_id" TEXT REFERENCES "tempat_magang"("id"),
  "no_hp" TEXT
);

CREATE TABLE IF NOT EXISTS "absensi" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tanggal" DATE NOT NULL,
  "jam_masuk" TIMESTAMP(3),
  "jam_pulang" TIMESTAMP(3),
  "foto_masuk" TEXT,
  "foto_pulang" TEXT,
  "verifikasi_biometrik" BOOLEAN NOT NULL DEFAULT false,
  "status" "StatusAbsensi" NOT NULL DEFAULT 'HADIR',
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "jarak_dari_kantor_meter" DOUBLE PRECISION,
  "lokasi_valid" BOOLEAN NOT NULL DEFAULT false,
  "keterangan" TEXT,
  "lampiran_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("user_id", "tanggal")
);

CREATE TABLE IF NOT EXISTS "laporan_harian" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tanggal" DATE NOT NULL,
  "judul" TEXT NOT NULL,
  "deskripsi" TEXT NOT NULL,
  "kendala" TEXT,
  "lampiran" TEXT,
  "status" "StatusLaporan" NOT NULL DEFAULT 'DRAFT',
  "catatan_pembimbing" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "kategori_modul" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nama_kategori" TEXT NOT NULL,
  "deskripsi" TEXT
);

CREATE TABLE IF NOT EXISTS "modul_praktikum" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "judul" TEXT NOT NULL,
  "kategori_id" TEXT NOT NULL REFERENCES "kategori_modul"("id"),
  "konten" TEXT NOT NULL,
  "lampiran" TEXT,
  "status_review" "StatusModul" NOT NULL DEFAULT 'DRAFT',
  "catatan_review" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "jadwal_kegiatan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "judul" TEXT NOT NULL,
  "deskripsi" TEXT,
  "tanggal" DATE NOT NULL,
  "jam" TEXT,
  "tipe" "TipeJadwal" NOT NULL DEFAULT 'PRIBADI',
  "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "notifikasi" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "judul" TEXT NOT NULL,
  "pesan" TEXT NOT NULL,
  "dibaca" BOOLEAN NOT NULL DEFAULT false,
  "link" TEXT,
  "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "endpoint" TEXT NOT NULL UNIQUE,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "aksi" TEXT NOT NULL,
  "entitas" TEXT NOT NULL,
  "waktu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "detail" TEXT
);

CREATE TABLE IF NOT EXISTS "kampus_setting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "logo" TEXT,
  "nama_kampus" TEXT NOT NULL DEFAULT 'Universitas Nahdlatul Ulama Al Ghazali',
  "alamat" TEXT,
  "kontak" TEXT,
  "warna_primary" TEXT NOT NULL DEFAULT '#097a3a',
  "warna_secondary" TEXT NOT NULL DEFAULT '#f1c40f'
);
`;

export async function ensureTestDatabaseExists(): Promise<string> {
  const testDbUrl = getTestDatabaseUrl();
  const parsed = new URL(testDbUrl);
  const dbName = parsed.pathname.replace(/^\//, "") || "simag_bmkg_test";

  // Connect to default postgres database to create simag_bmkg_test if missing
  const adminUrl = new URL(testDbUrl);
  adminUrl.pathname = "/postgres";

  const adminPool = new Pool({ connectionString: adminUrl.toString() });
  try {
    const check = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (check.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await adminPool.end();
  }

  // Initialize schema on test database
  const testPool = new Pool({ connectionString: testDbUrl });
  try {
    await testPool.query(SCHEMA_SQL);
  } finally {
    await testPool.end();
  }

  return testDbUrl;
}

export async function truncateTestDatabase(testDbUrl = getTestDatabaseUrl()): Promise<void> {
  const pool = new Pool({ connectionString: testDbUrl });
  try {
    await pool.query(`
      TRUNCATE TABLE
        "audit_log",
        "push_subscriptions",
        "notifikasi",
        "jadwal_kegiatan",
        "modul_praktikum",
        "kategori_modul",
        "laporan_harian",
        "absensi",
        "mahasiswa_profiles",
        "mentor_profiles",
        "dpl_profiles",
        "tempat_magang",
        "sessions",
        "users",
        "kampus_setting"
      RESTART IDENTITY CASCADE;
    `);
  } finally {
    await pool.end();
  }
}

export async function ensureBddTestUser(connectionString = getBaseDatabaseUrl()) {
  const pool = new Pool({ connectionString });
  try {
    const passwordHash = await bcrypt.hash(TEST_USERS.mahasiswa.password, 10);
    const userId = "bdd-test-user-mahasiswa-001";
    const profileId = "bdd-test-profile-mahasiswa-001";

    // Upsert tempat magang test
    await pool.query(
      `INSERT INTO "tempat_magang" ("id", "nama_instansi", "alamat", "latitude_kantor", "longitude_kantor", "radius_absensi_meter", "updated_at")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT ("id") DO UPDATE SET
         "latitude_kantor" = EXCLUDED."latitude_kantor",
         "longitude_kantor" = EXCLUDED."longitude_kantor",
         "radius_absensi_meter" = EXCLUDED."radius_absensi_meter",
         "updated_at" = NOW()`,
      [
        TEST_TEMPAT_MAGANG.id,
        TEST_TEMPAT_MAGANG.namaInstansi,
        TEST_TEMPAT_MAGANG.alamat,
        TEST_TEMPAT_MAGANG.latitudeKantor,
        TEST_TEMPAT_MAGANG.longitudeKantor,
        TEST_TEMPAT_MAGANG.radiusAbsensiMeter,
      ]
    );

    // Upsert test user
    const userRes = await pool.query(
      `INSERT INTO "users" ("id", "nama", "email", "username", "password_hash", "role", "status_aktif", "updated_at")
       VALUES ($1, $2, $3, $4, $5, 'MAHASISWA', true, NOW())
       ON CONFLICT ("email") DO UPDATE SET
         "nama" = EXCLUDED."nama",
         "username" = EXCLUDED."username",
         "password_hash" = EXCLUDED."password_hash",
         "status_aktif" = true,
         "updated_at" = NOW()
       RETURNING "id"`,
      [
        userId,
        TEST_USERS.mahasiswa.nama,
        TEST_USERS.mahasiswa.email,
        TEST_USERS.mahasiswa.username,
        passwordHash,
      ]
    );

    const actualUserId = userRes.rows[0].id;

    // Upsert mahasiswa profile
    await pool.query(
      `INSERT INTO "mahasiswa_profiles" ("id", "user_id", "nim", "program_studi", "periode_mulai", "periode_selesai", "tempat_magang_id")
       VALUES ($1, $2, $3, $4, '2026-08-01', '2026-11-30', $5)
       ON CONFLICT ("user_id") DO UPDATE SET
         "nim" = EXCLUDED."nim",
         "program_studi" = EXCLUDED."program_studi",
         "tempat_magang_id" = EXCLUDED."tempat_magang_id"`,
      [
        profileId,
        actualUserId,
        TEST_USERS.mahasiswa.nim,
        TEST_USERS.mahasiswa.programStudi,
        TEST_TEMPAT_MAGANG.id,
      ]
    );

    // Clear previous test user laporan & absensi before BDD run
    await pool.query(`DELETE FROM "laporan_harian" WHERE "user_id" = $1`, [actualUserId]);
    await pool.query(`DELETE FROM "absensi" WHERE "user_id" = $1`, [actualUserId]);

    // Insert 1 sample attendance record for the test user so Riwayat Absensi table has data
    await pool.query(
      `INSERT INTO "absensi" ("id", "user_id", "tanggal", "jam_masuk", "jam_pulang", "status", "lokasi_valid", "jarak_dari_kantor_meter", "keterangan")
       VALUES ('bdd-test-absensi-001', $1, '2026-10-28', '2026-10-27T23:55:00.000Z', '2026-10-28T09:05:00.000Z', 'HADIR', true, 12, 'Hadir Tepat Waktu (Fixture BDD)')
       ON CONFLICT ("user_id", "tanggal") DO NOTHING`,
      [actualUserId]
    );

    return actualUserId;
  } finally {
    await pool.end();
  }
}

export async function cleanupBddTestUser(connectionString = getBaseDatabaseUrl()) {
  const pool = new Pool({ connectionString });
  try {
    await pool.query(`DELETE FROM "users" WHERE "email" = $1`, [
      TEST_USERS.mahasiswa.email,
    ]);
    await pool.query(`DELETE FROM "tempat_magang" WHERE "id" = $1`, [
      TEST_TEMPAT_MAGANG.id,
    ]);
  } finally {
    await pool.end();
  }
}
