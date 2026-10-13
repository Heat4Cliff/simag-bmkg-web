import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { formatTanggalCompact, formatWaktu } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const absensiData = await prisma.absensi.findMany({
      orderBy: { tanggal: 'desc' },
      include: { user: { select: { nama: true } } }
    });

    let csvContent = "Tanggal,Nama Mahasiswa,Status,Jam Masuk,Jam Pulang,Jarak (Meter)\n";

    absensiData.forEach(row => {
      const tanggal = formatTanggalCompact(new Date(row.tanggal));
      const jamMasuk = row.jamMasuk ? formatWaktu(new Date(row.jamMasuk)) : "-";
      const jamPulang = row.jamPulang ? formatWaktu(new Date(row.jamPulang)) : "-";
      const jarak = row.jarakDariKantorMeter ? Math.round(row.jarakDariKantorMeter) : "-";
      
      csvContent += `${tanggal},"${row.user.nama}",${row.status},${jamMasuk},${jamPulang},${jarak}\n`;
    });

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="rekap_absensi_global.csv"'
      }
    });
  } catch (error) {
    return new NextResponse("Gagal export data", { status: 500 });
  }
}
