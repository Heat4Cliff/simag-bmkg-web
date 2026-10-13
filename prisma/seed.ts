import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Mulai seeding database SIMAG BMKG...");

  // Setup kampus settings
  await prisma.kampusSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      namaKampus: "Universitas Nahdlatul Ulama Al Ghazali",
      alamat: "Jl. Kemerdekaan No. 1, Cilacap, Jawa Tengah",
      kontak: "(0282) 123456",
    },
  });

  // Kategori modul
  const kategoris = [
    "Observasi Meteorologi",
    "Observasi Klimatologi",
    "Pengolahan Data",
    "Pembuatan Sistem",
    "Analisis Data",
    "Dokumentasi",
  ];
  for (const nama of kategoris) {
    await prisma.kategoriModul.upsert({
      where: { id: nama.toLowerCase().replace(/\s/g, "-") },
      update: {},
      create: { id: nama.toLowerCase().replace(/\s/g, "-"), namaKategori: nama },
    });
  }

  const hashedPassword = await bcrypt.hash("Admin@1234", 10);
  const hashedPasswordMhs = await bcrypt.hash("Magang@1234", 10);

  // Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@bmkg.go.id" },
    update: {},
    create: {
      nama: "Administrator BMKG",
      email: "superadmin@bmkg.go.id",
      passwordHash: hashedPassword,
      role: "SUPERADMIN",
      statusAktif: true,
    },
  });
  console.log("✅ Superadmin:", superadmin.email);

  // Pembimbing
  const pembimbing = await prisma.user.upsert({
    where: { email: "pembimbing@bmkg.go.id" },
    update: {},
    create: {
      nama: "Budi Santoso, S.Met",
      email: "pembimbing@bmkg.go.id",
      passwordHash: hashedPassword,
      role: "PEMBIMBING",
      statusAktif: true,
    },
  });
  const pembimbingProfile = await prisma.pembimbingProfile.upsert({
    where: { userId: pembimbing.id },
    update: {},
    create: { userId: pembimbing.id, divisi: "Klimatologi", noHp: "081234567890" },
  });
  console.log("✅ Pembimbing:", pembimbing.email);

  // Mahasiswa
  const mahasiswa = await prisma.user.upsert({
    where: { email: "mahasiswa@demo.com" },
    update: {},
    create: {
      nama: "Mohammad Alwan Abbas Abdillah",
      email: "mahasiswa@demo.com",
      passwordHash: hashedPasswordMhs,
      role: "MAHASISWA",
      statusAktif: true,
    },
  });
  await prisma.mahasiswaProfile.upsert({
    where: { userId: mahasiswa.id },
    update: {},
    create: {
      userId: mahasiswa.id,
      nim: "22.01.54.0001",
      institusiAsal: "Universitas Nahdlatul Ulama Al-Ghazali Cilacap",
      programStudi: "Teknik Informatika",
      periodeMulai: new Date("2026-07-01"),
      periodeSelesai: new Date("2026-09-30"),
      pembimbingId: pembimbingProfile.id,
      divisi: "Klimatologi",
    },
  });
  console.log("✅ Mahasiswa:", mahasiswa.email);

  // Data dummy (laporan harian, modul praktikum, jadwal kegiatan) telah dihapus sesuai permintaan.

  console.log("\n✅ Seeding selesai!");
  console.log("\n📋 Akun yang dibuat:");
  console.log("  👑 Superadmin  | superadmin@bmkg.go.id | Admin@1234");
  console.log("  👨‍🏫 Pembimbing  | pembimbing@bmkg.go.id | Admin@1234");
  console.log("  🎓 Mahasiswa   | mahasiswa@demo.com    | Magang@1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
