import { prisma } from "../src/lib/db";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "mahasiswa@demo.com" }
  });

  if (!user) {
    console.error("User not found");
    return;
  }

  const userId = user.id;

  // Let's first re-create the Mondays that were accidentally deleted: Aug 10 and Aug 24
  const mondaysToFix = [10, 24];
  for (const day of mondaysToFix) {
    const dateStr = `2026-08-${day.toString().padStart(2, '0')}T00:00:00.000Z`;
    const dateObj = new Date(dateStr);
    
    // We'll set Shift 1 for both Mondays just to be safe
    const wMasuk = new Date(`2026-08-${day.toString().padStart(2, '0')}T00:00:00.000Z`); // 07:00 WIB
    const wPulang = new Date(`2026-08-${day.toString().padStart(2, '0')}T07:30:00.000Z`); // 14:30 WIB

    const existing = await prisma.absensi.findFirst({
        where: { userId: userId, tanggal: dateObj }
    });

    if (!existing) {
        await prisma.absensi.create({
            data: {
              userId: userId,
              tanggal: dateObj,
              jamMasuk: wMasuk,
              jamPulang: wPulang,
              status: "HADIR",
              keterangan: "Shift 1 (Pagi)",
              fotoMasuk: "https://via.placeholder.com/300x400?text=Foto+Masuk",
              fotoPulang: "https://via.placeholder.com/300x400?text=Foto+Pulang",
              lokasiValid: true,
              jarakDariKantorMeter: 10
            }
        });
        console.log(`Re-created ${dateStr} as Shift 1`);
    } else {
        await prisma.absensi.update({
            where: { id: existing.id },
            data: { jamMasuk: wMasuk, jamPulang: wPulang, keterangan: "Shift 1 (Pagi)" }
        });
        console.log(`Updated ${dateStr} as Shift 1`);
    }
  }

  // Get all absensi for this user to properly delete weekends
  const allAbsensi = await prisma.absensi.findMany({
    where: { userId: userId }
  });

  for (const abs of allAbsensi) {
    const d = new Date(abs.tanggal);
    const day = d.getUTCDay(); // 0 is Sunday, 6 is Saturday
    const dateNum = d.getUTCDate();
    const month = d.getUTCMonth(); // 7 is August (0-indexed)

    // Delete if it's August 7th
    if (month === 7 && dateNum === 7) {
      console.log(`Deleting August 7th`);
      await prisma.absensi.delete({ where: { id: abs.id } });
      continue;
    }

    // Delete if it's Saturday or Sunday
    if (day === 0 || day === 6) {
      console.log(`Deleting weekend date: ${d.toISOString()}`);
      await prisma.absensi.delete({ where: { id: abs.id } });
      continue;
    }
  }

  console.log("Cleanup complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
