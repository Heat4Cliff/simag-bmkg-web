// seed.js - Versi JavaScript dari seed.ts untuk eksekusi langsung
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:lukluk12@localhost:5432/simag_bmkg',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Mulai seeding database SIMAG BMKG...');

  // Setup instansi settings
  await prisma.instansiSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      namaInstansi: 'BMKG Stasiun Klimatologi Cilacap',
      alamat: 'Jl. Tentara Pelajar No. 1, Cilacap, Jawa Tengah',
      kontak: '(0282) 541440',
      latitudeKantor: -7.7186515,
      longitudeKantor: 109.0118975,
      radiusAbsensiMeter: 500,
    },
  });
  console.log('✅ Instansi setting dibuat.');

  // Kategori modul
  const kategoris = [
    { id: 'obs-meteorologi', nama: 'Observasi Meteorologi' },
    { id: 'obs-klimatologi', nama: 'Observasi Klimatologi' },
    { id: 'pengolahan-data', nama: 'Pengolahan Data' },
    { id: 'pembuatan-sistem', nama: 'Pembuatan Sistem' },
    { id: 'analisis-data', nama: 'Analisis Data' },
    { id: 'dokumentasi', nama: 'Dokumentasi' },
  ];
  for (const k of kategoris) {
    await prisma.kategoriModul.upsert({
      where: { id: k.id },
      update: {},
      create: { id: k.id, namaKategori: k.nama },
    });
  }
  console.log('✅ Kategori modul dibuat.');

  const hashedAdmin = await bcrypt.hash('Admin@1234', 10);
  const hashedMhs = await bcrypt.hash('Magang@1234', 10);

  // Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@bmkg.go.id' },
    update: {},
    create: {
      nama: 'Administrator BMKG',
      email: 'superadmin@bmkg.go.id',
      passwordHash: hashedAdmin,
      role: 'SUPERADMIN',
      statusAktif: true,
    },
  });
  console.log('✅ Superadmin:', superadmin.email);

  // Pembimbing
  const pembimbing = await prisma.user.upsert({
    where: { email: 'pembimbing@bmkg.go.id' },
    update: {},
    create: {
      nama: 'Budi Santoso, S.Met',
      email: 'pembimbing@bmkg.go.id',
      passwordHash: hashedAdmin,
      role: 'PEMBIMBING',
      statusAktif: true,
    },
  });
  const pembimbingProfile = await prisma.pembimbingProfile.upsert({
    where: { userId: pembimbing.id },
    update: {},
    create: { userId: pembimbing.id, divisi: 'Klimatologi', noHp: '081234567890' },
  });
  console.log('✅ Pembimbing:', pembimbing.email);

  // Mahasiswa
  const mahasiswa = await prisma.user.upsert({
    where: { email: 'mahasiswa@demo.com' },
    update: {},
    create: {
      nama: 'Mohammad Alwan Abbas Abdillah',
      email: 'mahasiswa@demo.com',
      passwordHash: hashedMhs,
      role: 'MAHASISWA',
      statusAktif: true,
    },
  });
  await prisma.mahasiswaProfile.upsert({
    where: { userId: mahasiswa.id },
    update: {},
    create: {
      userId: mahasiswa.id,
      nim: '22.01.54.0001',
      institusiAsal: 'Universitas Nahdlatul Ulama Al-Ghazali Cilacap',
      programStudi: 'Teknik Informatika',
      periodeMulai: new Date('2026-07-01'),
      periodeSelesai: new Date('2026-09-30'),
      pembimbingId: pembimbingProfile.id,
      divisi: 'Klimatologi',
    },
  });
  console.log('✅ Mahasiswa:', mahasiswa.email);

  // Contoh laporan harian
  const laporan1 = await prisma.laporanHarian.findFirst({ where: { userId: mahasiswa.id } });
  if (!laporan1) {
    await prisma.laporanHarian.createMany({
      data: [
        {
          userId: mahasiswa.id,
          tanggal: new Date('2026-08-20'),
          judul: 'Observasi Curah Hujan Harian',
          deskripsi: 'Melakukan pengamatan dan pencatatan data curah hujan harian di stasiun klimatologi BMKG Cilacap menggunakan alat penakar hujan manual dan otomatis (AWS).',
          kendala: 'Alat AWS sempat mengalami gangguan koneksi selama 30 menit.',
          status: 'DISETUJUI',
        },
        {
          userId: mahasiswa.id,
          tanggal: new Date('2026-08-21'),
          judul: 'Pengolahan Data Suhu Udara',
          deskripsi: 'Membantu pengolahan data suhu udara harian dari beberapa titik pengamatan menggunakan Microsoft Excel dan MATLAB.',
          status: 'DIREVIEW',
        },
        {
          userId: mahasiswa.id,
          tanggal: new Date('2026-08-22'),
          judul: 'Pembuatan Dashboard Monitoring',
          deskripsi: 'Mulai mengerjakan sistem dashboard monitoring data klimatologi menggunakan Next.js dan PostgreSQL sesuai arahan pembimbing.',
          status: 'TERKIRIM',
        },
      ],
    });
    console.log('✅ Contoh laporan harian dibuat.');
  }

  // Contoh modul
  const modul1 = await prisma.modulPraktikum.findFirst({ where: { userId: mahasiswa.id } });
  if (!modul1) {
    await prisma.modulPraktikum.create({
      data: {
        userId: mahasiswa.id,
        judul: 'Modul Observasi Curah Hujan Manual',
        kategoriId: 'obs-meteorologi',
        konten: '# Observasi Curah Hujan Manual\n\n## Tujuan\nMahasiswa dapat melakukan pengamatan curah hujan menggunakan penakar hujan manual tipe observasi.\n\n## Prosedur\n1. Amati penakar hujan setiap pagi pukul 07.00 WIB\n2. Catat volume air yang terkumpul dalam gelas ukur\n3. Hitung curah hujan dalam satuan mm\n4. Catat pada formulir dan masukkan ke sistem',
        statusReview: 'DISETUJUI',
      },
    });
    console.log('✅ Contoh modul dibuat.');
  }

  // Jadwal kegiatan instansi
  const jadwal1 = await prisma.jadwalKegiatan.findFirst({ where: { userId: superadmin.id } });
  if (!jadwal1) {
    await prisma.jadwalKegiatan.createMany({
      data: [
        {
          userId: superadmin.id,
          judul: 'Evaluasi Mingguan Magang',
          deskripsi: 'Evaluasi progres dan bimbingan mingguan seluruh peserta magang',
          tanggal: new Date('2026-08-25'),
          jam: '09:00',
          tipe: 'INSTANSI',
          visibility: 'PUBLIC',
        },
        {
          userId: pembimbing.id,
          judul: 'Bimbingan Teknis Data Klimatologi',
          deskripsi: 'Bimbingan pengolahan data klimatologi menggunakan software analisis',
          tanggal: new Date('2026-08-26'),
          jam: '10:00',
          tipe: 'BIMBINGAN',
          visibility: 'PUBLIC',
        },
      ],
    });
    console.log('✅ Jadwal kegiatan dibuat.');
  }

  console.log('\n✅ Seeding selesai!\n');
  console.log('📋 Akun yang dibuat:');
  console.log('  👑 Superadmin  | superadmin@bmkg.go.id | Admin@1234');
  console.log('  👨‍🏫 Pembimbing  | pembimbing@bmkg.go.id | Admin@1234');
  console.log('  🎓 Mahasiswa   | mahasiswa@demo.com    | Magang@1234');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
