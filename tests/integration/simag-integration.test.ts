import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import bcrypt from "bcryptjs";
import {
  ensureTestDatabaseExists,
  truncateTestDatabase,
} from "../support/setup-test-db";
import {
  TEST_USERS,
  TEST_TEMPAT_MAGANG,
  TEST_KATEGORI_MODUL,
} from "../fixtures/test-data";

// Ensure isolated test database URL is configured before loading Prisma / Route Handlers
const testDbUrl = process.env.TEST_DATABASE_URL || (() => {
  const base = process.env.DATABASE_URL || "postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg";
  const u = new URL(base);
  u.pathname = "/simag_bmkg_test";
  return u.toString();
})();
process.env.DATABASE_URL = testDbUrl;

function setMockSession(user: {
  id: string;
  name: string;
  email: string;
  role: string;
} | null) {
  if (!user) {
    process.env.SIMAG_TEST_SESSION = "";
  } else {
    process.env.SIMAG_TEST_SESSION = JSON.stringify({
      user,
      expires: new Date(Date.now() + 3600_000).toISOString(),
    });
  }
}

describe("SIMAG BMKG — Integration Testing (API, Auth, Validation & PostgreSQL Persistence)", () => {
  let prisma: typeof import("../../src/lib/db").prisma;
  let mobileLoginPost: typeof import("../../src/app/api/mobile/auth/login/route").POST;
  let mobileKategoriGet: typeof import("../../src/app/api/mobile/kategori-modul/route").GET;
  let laporanGet: typeof import("../../src/app/api/laporan-harian/route").GET;
  let laporanPost: typeof import("../../src/app/api/laporan-harian/route").POST;
  let laporanByIdGet: typeof import("../../src/app/api/laporan-harian/[id]/route").GET;
  let laporanByIdPatch: typeof import("../../src/app/api/laporan-harian/[id]/route").PATCH;
  let laporanByIdPut: typeof import("../../src/app/api/laporan-harian/[id]/route").PUT;
  let laporanByIdDelete: typeof import("../../src/app/api/laporan-harian/[id]/route").DELETE;
  let absensiPost: typeof import("../../src/app/api/absensi/route").POST;
  let riwayatAbsensiGet: typeof import("../../src/app/api/riwayat/absensi/route").GET;
  let kalenderGet: typeof import("../../src/app/api/kalender/route").GET;
  let kalenderPost: typeof import("../../src/app/api/kalender/route").POST;
  let pengaturanGet: typeof import("../../src/app/api/pengaturan/route").GET;
  let pengaturanPatch: typeof import("../../src/app/api/pengaturan/route").PATCH;

  const seededIds = {
    mahasiswaUserId: "int-user-mhs-001",
    dplUserId: "int-user-dpl-001",
    mentorUserId: "int-user-mentor-001",
    adminUserId: "int-user-admin-001",
    inactiveUserId: "int-user-inactive-001",
    dplProfileId: "int-profile-dpl-001",
    mentorProfileId: "int-profile-mentor-001",
    mhsProfileId: "int-profile-mhs-001",
  };

  before(async () => {
    const activeTestUrl = await ensureTestDatabaseExists();
    process.env.DATABASE_URL = activeTestUrl;
    await truncateTestDatabase(activeTestUrl);

    const dbMod = await import("../../src/lib/db");
    prisma = dbMod.prisma;

    mobileLoginPost = (await import("../../src/app/api/mobile/auth/login/route")).POST;
    mobileKategoriGet = (await import("../../src/app/api/mobile/kategori-modul/route")).GET;
    const laporanRoute = await import("../../src/app/api/laporan-harian/route");
    laporanGet = laporanRoute.GET;
    laporanPost = laporanRoute.POST;

    const laporanIdRoute = await import("../../src/app/api/laporan-harian/[id]/route");
    laporanByIdGet = laporanIdRoute.GET;
    laporanByIdPatch = laporanIdRoute.PATCH;
    laporanByIdPut = laporanIdRoute.PUT;
    laporanByIdDelete = laporanIdRoute.DELETE;

    absensiPost = (await import("../../src/app/api/absensi/route")).POST;
    riwayatAbsensiGet = (await import("../../src/app/api/riwayat/absensi/route")).GET;

    const kalenderRoute = await import("../../src/app/api/kalender/route");
    kalenderGet = kalenderRoute.GET;
    kalenderPost = kalenderRoute.POST;

    const pengaturanRoute = await import("../../src/app/api/pengaturan/route");
    pengaturanGet = pengaturanRoute.GET;
    pengaturanPatch = pengaturanRoute.PATCH;

    // Seed isolated test records into simag_bmkg_test
    const passwordHash = await bcrypt.hash(TEST_USERS.mahasiswa.password, 10);

    await prisma.tempatMagang.create({
      data: {
        id: TEST_TEMPAT_MAGANG.id,
        namaInstansi: TEST_TEMPAT_MAGANG.namaInstansi,
        alamat: TEST_TEMPAT_MAGANG.alamat,
        latitudeKantor: TEST_TEMPAT_MAGANG.latitudeKantor,
        longitudeKantor: TEST_TEMPAT_MAGANG.longitudeKantor,
        radiusAbsensiMeter: TEST_TEMPAT_MAGANG.radiusAbsensiMeter,
      },
    });

    await prisma.kategoriModul.create({
      data: {
        id: TEST_KATEGORI_MODUL.id,
        namaKategori: TEST_KATEGORI_MODUL.namaKategori,
        deskripsi: TEST_KATEGORI_MODUL.deskripsi,
      },
    });

    await prisma.user.create({
      data: {
        id: seededIds.dplUserId,
        nama: TEST_USERS.dpl.nama,
        email: TEST_USERS.dpl.email,
        username: TEST_USERS.dpl.username,
        passwordHash,
        role: "DPL",
        statusAktif: true,
        dplProfile: {
          create: {
            id: seededIds.dplProfileId,
            nip: TEST_USERS.dpl.nip,
          },
        },
      },
    });

    await prisma.user.create({
      data: {
        id: seededIds.mentorUserId,
        nama: TEST_USERS.mentor.nama,
        email: TEST_USERS.mentor.email,
        username: TEST_USERS.mentor.username,
        passwordHash,
        role: "MENTOR_INSTANSI",
        statusAktif: true,
        mentorProfile: {
          create: {
            id: seededIds.mentorProfileId,
            jabatan: TEST_USERS.mentor.jabatan,
          },
        },
      },
    });

    await prisma.user.create({
      data: {
        id: seededIds.mahasiswaUserId,
        nama: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        username: TEST_USERS.mahasiswa.username,
        passwordHash,
        role: "MAHASISWA",
        statusAktif: true,
        mahasiswaProfile: {
          create: {
            id: seededIds.mhsProfileId,
            nim: TEST_USERS.mahasiswa.nim,
            programStudi: TEST_USERS.mahasiswa.programStudi,
            dplId: seededIds.dplProfileId,
            mentorId: seededIds.mentorProfileId,
            tempatMagangId: TEST_TEMPAT_MAGANG.id,
          },
        },
      },
    });

    await prisma.user.create({
      data: {
        id: seededIds.adminUserId,
        nama: TEST_USERS.superadmin.nama,
        email: TEST_USERS.superadmin.email,
        username: TEST_USERS.superadmin.username,
        passwordHash,
        role: "SUPERADMIN",
        statusAktif: true,
      },
    });

    await prisma.user.create({
      data: {
        id: seededIds.inactiveUserId,
        nama: TEST_USERS.nonaktif.nama,
        email: TEST_USERS.nonaktif.email,
        username: TEST_USERS.nonaktif.username,
        passwordHash,
        role: "MAHASISWA",
        statusAktif: false,
      },
    });
  });

  after(async () => {
    delete process.env.SIMAG_TEST_SESSION;
    await truncateTestDatabase(testDbUrl);
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe("1. Integrasi Autentikasi, JWT & Otorisasi Bearer Token", () => {
    let validJwtToken = "";

    it("mengembalikan 400 ketika request login tidak menyertakan email atau password", async () => {
      const req = new Request("http://localhost:3200/api/mobile/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", password: "" }),
      });
      const res = await mobileLoginPost(req);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /wajib diisi/i);
    });

    it("mengembalikan 401 ketika kredensial password salah", async () => {
      const req = new Request("http://localhost:3200/api/mobile/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_USERS.mahasiswa.email,
          password: "PasswordSalah123!",
        }),
      });
      const res = await mobileLoginPost(req);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
    });

    it("mengembalikan 403 ketika akun berstatus nonaktif", async () => {
      const req = new Request("http://localhost:3200/api/mobile/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_USERS.nonaktif.email,
          password: TEST_USERS.nonaktif.password,
        }),
      });
      const res = await mobileLoginPost(req);
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /dinonaktifkan/i);
    });

    it("berhasil login dengan kredensial valid dan mengembalikan token JWT beserta profil mahasiswa", async () => {
      const req = new Request("http://localhost:3200/api/mobile/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_USERS.mahasiswa.email,
          password: TEST_USERS.mahasiswa.password,
        }),
      });
      const res = await mobileLoginPost(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.token);
      assert.equal(body.data.user.email, TEST_USERS.mahasiswa.email);
      assert.equal(body.data.user.role, "MAHASISWA");
      assert.equal(body.data.user.mahasiswaProfile.nim, TEST_USERS.mahasiswa.nim);
      validJwtToken = body.data.token;
    });

    it("menolak akses endpoint terproteksi JWT tanpa header Authorization (401)", async () => {
      const req = new Request("http://localhost:3200/api/mobile/kategori-modul", {
        method: "GET",
      });
      const res = await mobileKategoriGet(req);
      assert.equal(res.status, 401);
    });

    it("mengizinkan akses endpoint terproteksi JWT dengan Bearer token valid dan membaca data dari database", async () => {
      const req = new Request("http://localhost:3200/api/mobile/kategori-modul", {
        method: "GET",
        headers: { Authorization: `Bearer ${validJwtToken}` },
      });
      const res = await mobileKategoriGet(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(Array.isArray(body.data), true);
      assert.equal(body.data[0].namaKategori, TEST_KATEGORI_MODUL.namaKategori);
    });
  });

  describe("2. Integrasi Laporan Harian, Persistensi Database & Alur Review Pembimbing", () => {
    let createdDraftId = "";
    let createdSubmittedId = "";

    it("menolak request GET /api/laporan-harian ketika pengguna belum login (401)", async () => {
      setMockSession(null);
      const res = await laporanGet();
      assert.equal(res.status, 401);
    });

    it("menolak POST /api/laporan-harian ketika field wajib tidak lengkap (400)", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const req = new Request("http://localhost:3200/api/laporan-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: "2026-10-28",
          judul: "",
          deskripsi: "",
        }),
      });
      const res = await laporanPost(req);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /Data tidak lengkap/i);
    });

    it("menyimpan laporan harian sebagai DRAFT ketika asDraft=true (Regression Test Bug Fix)", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const req = new Request("http://localhost:3200/api/laporan-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: "2026-10-28",
          judul: "Draft Pengamatan Tekanan Udara QFE/QFF",
          deskripsi: "Mencatat hasil pembacaan barometer digital pada stasiun meteorologi.",
          kendala: "Tidak ada kendala",
          asDraft: true,
        }),
      });

      const res = await laporanPost(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.laporan.status, "DRAFT");
      assert.match(body.message, /draft/i);
      createdDraftId = body.laporan.id;

      // Verifikasi langsung ke PostgreSQL test database
      const persisted = await prisma.laporanHarian.findUnique({
        where: { id: createdDraftId },
      });
      assert.ok(persisted);
      assert.equal(persisted.status, "DRAFT");
      assert.equal(persisted.judul, "Draft Pengamatan Tekanan Udara QFE/QFF");
    });

    it("menyimpan laporan harian dengan status TERKIRIM ketika asDraft=false", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const req = new Request("http://localhost:3200/api/laporan-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: "2026-10-29",
          judul: "Verifikasi Radiosonde Lapisan Atas",
          deskripsi: "Melaksanakan persiapan peluncuran balon radiosonde dan akuisisi data profil atmosfer.",
          kendala: "Angin permukaan cukup kencang",
          asDraft: false,
        }),
      });

      const res = await laporanPost(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.laporan.status, "TERKIRIM");
      createdSubmittedId = body.laporan.id;
    });

    it("mengembalikan daftar laporan harian sesuai kontrak frontend pada GET /api/laporan-harian", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const res = await laporanGet();
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(Array.isArray(body.laporan), true);
      assert.equal(body.laporan.length, 2);
      assert.ok(body.laporan.some((l: { id: string; status: string }) => l.id === createdDraftId && l.status === "DRAFT"));
      assert.ok(body.laporan.some((l: { id: string; status: string }) => l.id === createdSubmittedId && l.status === "TERKIRIM"));
    });

    it("menolak review laporan (PATCH) apabila dilakukan oleh role MAHASISWA (401)", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const req = new Request(`http://localhost:3200/api/laporan-harian/${createdSubmittedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISETUJUI", komentar: "Self approve attempt" }),
      });

      const res = await laporanByIdPatch(req, { params: Promise.resolve({ id: createdSubmittedId }) });
      assert.equal(res.status, 401);
    });

    it("mengizinkan DPL pembimbing menyetujui laporan mahasiswa bimbingannya dan menyimpan catatan review", async () => {
      setMockSession({
        id: seededIds.dplUserId,
        name: TEST_USERS.dpl.nama,
        email: TEST_USERS.dpl.email,
        role: "DPL",
      });

      const req = new Request(`http://localhost:3200/api/laporan-harian/${createdSubmittedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DISETUJUI",
          komentar: "Laporan sangat detail dan sesuai prosedur operasional BMKG.",
        }),
      });

      const res = await laporanByIdPatch(req, { params: Promise.resolve({ id: createdSubmittedId }) });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.laporan.status, "DISETUJUI");
      assert.equal(
        body.laporan.catatanPembimbing,
        "Laporan sangat detail dan sesuai prosedur operasional BMKG."
      );
      assert.equal(body.laporan.reviewedBy, seededIds.dplUserId);

      // Pastikan data yang tersimpan dapat dibaca kembali melalui GET /api/laporan-harian/[id]
      const detailRes = await laporanByIdGet(
        new Request(`http://localhost:3200/api/laporan-harian/${createdSubmittedId}`),
        { params: Promise.resolve({ id: createdSubmittedId }) }
      );
      assert.equal(detailRes.status, 200);
      const detailBody = await detailRes.json();
      assert.equal(detailBody.laporan.status, "DISETUJUI");
    });

    it("menolak penghapusan laporan yang sudah DISETUJUI oleh mahasiswa (400)", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const req = new Request(`http://localhost:3200/api/laporan-harian/${createdSubmittedId}`, {
        method: "DELETE",
      });
      const res = await laporanByIdDelete(req, { params: Promise.resolve({ id: createdSubmittedId }) });
      assert.equal(res.status, 400);
    });

    it("mengizinkan mahasiswa mengubah laporan berstatus DRAFT menjadi TERKIRIM melalui PUT", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const req = new Request(`http://localhost:3200/api/laporan-harian/${createdDraftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: "2026-10-28",
          judul: "Laporan Pengamatan Tekanan Udara QFE/QFF (Final)",
          deskripsi: "Mencatat dan memvalidasi hasil pembacaan barometer digital pada stasiun meteorologi.",
          kendala: "Tidak ada kendala",
          asDraft: false,
        }),
      });

      const res = await laporanByIdPut(req, { params: Promise.resolve({ id: createdDraftId }) });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.laporan.status, "TERKIRIM");
      assert.equal(body.laporan.judul, "Laporan Pengamatan Tekanan Udara QFE/QFF (Final)");
    });
  });

  describe("3. Integrasi Presensi Geofence & Riwayat Absensi (/api/absensi & /api/riwayat/absensi)", () => {
    it("menolak presensi HADIR apabila koordinat GPS berada di luar radius kantor tempat magang (400)", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      // Koordinat ~2.5 km dari kantor BMKG Cilacap (batas radius 200m)
      const req = new Request("http://localhost:3200/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenisAbsensi: "HADIR",
          tipe: "MASUK",
          latitude: -7.74,
          longitude: 109.03,
          foto: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        }),
      });

      const res = await absensiPost(req);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /di luar radius absensi/i);
    });

    it("menyimpan pengajuan IZIN ke database dan dapat dibaca kembali pada riwayat absensi", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const req = new Request("http://localhost:3200/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenisAbsensi: "IZIN",
          keterangan: "Mengikuti seminar akademik fakultas",
        }),
      });

      const res = await absensiPost(req);
      assert.equal(res.status, 200);

      const riwayatRes = await riwayatAbsensiGet();
      assert.equal(riwayatRes.status, 200);
      const riwayatBody = await riwayatRes.json();
      assert.equal(Array.isArray(riwayatBody.riwayat), true);
      assert.equal(riwayatBody.riwayat.length, 1);
      assert.equal(riwayatBody.riwayat[0].status, "IZIN");
      assert.equal(riwayatBody.riwayat[0].keterangan, "Mengikuti seminar akademik fakultas");
    });
  });

  describe("4. Integrasi Kalender Kegiatan & Pengaturan Sistem RBAC (/api/kalender & /api/pengaturan)", () => {
    it("membuat agenda kalender oleh SUPERADMIN sebagai INSTANSI PUBLIC dan dapat dibaca oleh MAHASISWA", async () => {
      setMockSession({
        id: seededIds.adminUserId,
        name: TEST_USERS.superadmin.nama,
        email: TEST_USERS.superadmin.email,
        role: "SUPERADMIN",
      });

      const postReq = new Request("http://localhost:3200/api/kalender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: "Evaluasi Bulanan Peserta Magang BMKG",
          deskripsi: "Pemaparan progres observasi dan sistem informasi",
          tanggal: "2026-11-05",
          jam: "09:00",
        }),
      });

      const postRes = await kalenderPost(postReq);
      assert.equal(postRes.status, 200);
      const postBody = await postRes.json();
      assert.equal(postBody.agenda.tipe, "INSTANSI");
      assert.equal(postBody.agenda.visibility, "PUBLIC");

      // Mahasiswa membaca kalender dan melihat agenda PUBLIC dari Superadmin + laporan miliknya
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const getRes = await kalenderGet();
      assert.equal(getRes.status, 200);
      const getBody = await getRes.json();
      assert.ok(
        getBody.events.some(
          (e: { title: string; type: string }) =>
            e.title === "Evaluasi Bulanan Peserta Magang BMKG" && e.type === "jadwal"
        )
      );
    });

    it("menolak perubahan pengaturan instansi oleh selain SUPERADMIN (401) dan mengizinkan SUPERADMIN mengubah pengaturan", async () => {
      setMockSession({
        id: seededIds.mahasiswaUserId,
        name: TEST_USERS.mahasiswa.nama,
        email: TEST_USERS.mahasiswa.email,
        role: "MAHASISWA",
      });

      const forbiddenReq = new Request("http://localhost:3200/api/pengaturan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaInstansi: "Unauthorised Update" }),
      });
      const forbiddenRes = await pengaturanPatch(forbiddenReq);
      assert.equal(forbiddenRes.status, 401);

      setMockSession({
        id: seededIds.adminUserId,
        name: TEST_USERS.superadmin.nama,
        email: TEST_USERS.superadmin.email,
        role: "SUPERADMIN",
      });

      const adminReq = new Request("http://localhost:3200/api/pengaturan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaInstansi: "UNUGHA Cilacap - Mitra BMKG",
          alamat: "Jl. Kemerdekaan Barat No.12, Cilacap",
          kontak: "0282-555123",
          latitudeKantor: -7.718597,
          longitudeKantor: 109.014643,
          radiusAbsensiMeter: 250,
        }),
      });
      const adminRes = await pengaturanPatch(adminReq);
      assert.equal(adminRes.status, 200);

      const getRes = await pengaturanGet();
      assert.equal(getRes.status, 200);
      const getBody = await getRes.json();
      assert.equal(getBody.setting.namaInstansi, "UNUGHA Cilacap - Mitra BMKG");
      assert.equal(getBody.setting.radiusAbsensiMeter, 250);
    });
  });
});
