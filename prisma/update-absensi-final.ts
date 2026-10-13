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

  const allAbsensi = await prisma.absensi.findMany({
    where: { userId: userId }
  });

  for (const abs of allAbsensi) {
    const d = new Date(abs.tanggal);
    const dateNum = d.getUTCDate();
    const month = d.getUTCMonth(); // 7 is August

    if (month !== 7) continue;

    // Delete August 18
    if (dateNum === 18) {
      console.log("Deleting August 18th (Cuti Bersama)");
      await prisma.absensi.delete({ where: { id: abs.id } });
      continue;
    }

    // Update August 10-14 to SAKIT
    if (dateNum >= 10 && dateNum <= 14) {
      console.log(`Updating August ${dateNum} to SAKIT`);
      await prisma.absensi.update({
        where: { id: abs.id },
        data: {
          jamMasuk: null,
          jamPulang: null,
          status: "SAKIT",
          keterangan: "Sakit"
        }
      });
      continue;
    }

    // Set everything else to Shift 1
    console.log(`Updating August ${dateNum} to Shift 1`);
    const dayStr = dateNum.toString().padStart(2, '0');
    const wMasuk = new Date(`2026-08-${dayStr}T00:00:00.000Z`); // 07:00 WIB
    const wPulang = new Date(`2026-08-${dayStr}T07:30:00.000Z`); // 14:30 WIB

    await prisma.absensi.update({
      where: { id: abs.id },
      data: {
        jamMasuk: wMasuk,
        jamPulang: wPulang,
        status: "HADIR",
        keterangan: "Shift 1 (Pagi)"
      }
    });
  }

  console.log("Final updates complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
