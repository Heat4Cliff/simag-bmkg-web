import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const riwayat = await prisma.laporanHarian.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        tanggal: 'desc',
      },
      select: {
        id: true,
        tanggal: true,
        judul: true,
        status: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ riwayat });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil riwayat laporan" }, { status: 500 });
  }
}
