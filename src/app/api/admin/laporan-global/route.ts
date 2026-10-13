import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    const totalMahasiswa = await prisma.user.count({ where: { role: "MAHASISWA" } });

    // Rekap absensi bulan ini
    const absensiStats = await prisma.absensi.groupBy({
      by: ['status'],
      where: {
        tanggal: { gte: startOfMonth, lte: endOfMonth }
      },
      _count: { status: true }
    });

    const rekapAbsen = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    absensiStats.forEach(stat => {
      rekapAbsen[stat.status as keyof typeof rekapAbsen] = stat._count.status;
    });

    // Laporan harian terbaru (Global)
    const recentLaporan = await prisma.laporanHarian.findMany({
      take: 10,
      orderBy: { tanggal: 'desc' },
      include: {
        user: { select: { nama: true } }
      }
    });

    return NextResponse.json({
      stats: {
        totalMahasiswa,
        ...rekapAbsen
      },
      recentLaporan: recentLaporan.map(l => ({
        id: l.id,
        nama: l.user.nama,
        tanggal: l.tanggal,
        judul: l.judul,
        status: l.status
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data laporan global" }, { status: 500 });
  }
}
