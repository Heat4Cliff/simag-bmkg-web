const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randomWibTime(dateStr, minHour, minMinute, maxHour, maxMinute) {
  const h = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
  const m = Math.floor(Math.random() * (maxMinute - minMinute + 1)) + minMinute;
  
  // Format as YYYY-MM-DDTHH:mm:00+07:00 (WIB)
  const hourStr = h.toString().padStart(2, '0');
  const minStr = m.toString().padStart(2, '0');
  
  // This constructs a Date object correctly interpreting the time as WIB
  return new Date(`${dateStr}T${hourStr}:${minStr}:00+07:00`);
}

async function main() {
  const user = await prisma.user.findFirst({ where: { username: 'ryuuken' } });
  if (!user) {
    console.error('User ryuuken not found!');
    return;
  }
  
  // Delete existing absensi to replace them
  await prisma.absensi.deleteMany({ where: { userId: user.id } });

  const attendancePlan = [
    { date: '2026-08-06', status: 'HADIR' },
    { date: '2026-08-10', status: 'SAKIT' },
    { date: '2026-08-11', status: 'SAKIT' },
    { date: '2026-08-12', status: 'SAKIT' },
    { date: '2026-08-13', status: 'SAKIT' },
    { date: '2026-08-14', status: 'SAKIT' },
    { date: '2026-08-19', status: 'HADIR' },
    { date: '2026-08-20', status: 'HADIR' },
    { date: '2026-08-21', status: 'HADIR' },
    { date: '2026-08-24', status: 'HADIR' },
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
      const jamMasuk = randomWibTime(entry.date, 6, 45, 6, 59);
      const jamKeluar = randomWibTime(entry.date, 14, 31, 14, 35);
      // Construct date object using WIB offset so 'tanggal' is also aligned correctly with WIB
      const tanggal = new Date(`${entry.date}T00:00:00+07:00`);
      
      await prisma.absensi.create({
        data: {
          userId: user.id,
          tanggal: tanggal,
          jamMasuk: jamMasuk,
          jamPulang: jamKeluar,
          status: 'HADIR',
        }
      });
    } else {
      const tanggal = new Date(`${entry.date}T00:00:00+07:00`);
      await prisma.absensi.create({
        data: {
          userId: user.id,
          tanggal: tanggal,
          status: entry.status,
          keterangan: 'Sakit',
        }
      });
    }
  }
  console.log('Attendance restored with proper WIB timezone.');

}

main().catch(console.error).finally(() => prisma.$disconnect());
