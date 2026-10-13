const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randomTime(dateStr, minHour, minMinute, maxHour, maxMinute) {
  const d = new Date(dateStr);
  const h = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
  const m = Math.floor(Math.random() * (maxMinute - minMinute + 1)) + minMinute;
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@1234', 10);

  // 1. Create Default Accounts
  const accounts = [
    { nama: 'Kaprodi', email: 'kaprodi@unugha.ac.id', username: 'kaprodi', role: 'KAPRODI' },
    { nama: 'Mentor', email: 'mentor@unugha.ac.id', username: 'mentor', role: 'MENTOR_INSTANSI' }
  ];

  for (const acc of accounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {},
      create: {
        nama: acc.nama,
        email: acc.email,
        username: acc.username,
        passwordHash: hashedPassword,
        role: acc.role,
        statusAktif: true
      }
    });
  }
  console.log('Default accounts created.');

  // 2. Restore Absensi
  const user = await prisma.user.findFirst({ where: { username: 'ryuuken' } });
  if (!user) {
    console.error('User ryuuken not found!');
    return;
  }
  
  // Delete existing just in case
  await prisma.absensi.deleteMany({ where: { userId: user.id } });

  const attendancePlan = [
    { date: '2026-08-06', status: 'HADIR' },
    // Aug 7 libur, skip
    { date: '2026-08-10', status: 'SAKIT' },
    { date: '2026-08-11', status: 'SAKIT' },
    { date: '2026-08-12', status: 'SAKIT' },
    { date: '2026-08-13', status: 'SAKIT' },
    { date: '2026-08-14', status: 'SAKIT' },
    // Aug 17-18 libur, skip
    { date: '2026-08-19', status: 'HADIR' },
    { date: '2026-08-20', status: 'HADIR' },
    { date: '2026-08-21', status: 'HADIR' },
    { date: '2026-08-24', status: 'HADIR' },
    // Aug 25 libur, skip
    { date: '2026-08-26', status: 'HADIR' },
    { date: '2026-08-27', status: 'HADIR' },
    { date: '2026-08-28', status: 'HADIR' },
    { date: '2026-08-31', status: 'HADIR' },
    { date: '2026-09-01', status: 'HADIR' },
    { date: '2026-09-02', status: 'HADIR' },
    { date: '2026-09-03', status: 'HADIR' },
    { date: '2026-09-04', status: 'HADIR' },
  ];

  for (const entry of attendancePlan) {
    if (entry.status === 'HADIR') {
      const jamMasuk = randomTime(entry.date, 6, 45, 6, 59);
      const jamKeluar = randomTime(entry.date, 14, 31, 14, 35);
      await prisma.absensi.create({
        data: {
          userId: user.id,
          tanggal: new Date(entry.date),
          jamMasuk: jamMasuk,
          jamPulang: jamKeluar,
          status: 'HADIR',
        }
      });
    } else {
      await prisma.absensi.create({
        data: {
          userId: user.id,
          tanggal: new Date(entry.date),
          status: entry.status,
          keterangan: 'Sakit',
        }
      });
    }
  }
  console.log('Attendance restored.');

}

main().catch(console.error).finally(() => prisma.$disconnect());
