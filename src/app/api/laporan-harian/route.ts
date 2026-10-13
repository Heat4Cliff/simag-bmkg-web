import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { formatTanggalCompact } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const role = (session.user as { role?: string }).role;

  let where = {};
  if (role === "MAHASISWA") {
    where = { userId };
  } else if (role === "DPL") {
    const profile = await prisma.dplProfile.findUnique({ where: { userId } });
    const mhsProfiles = await prisma.mahasiswaProfile.findMany({ where: { dplId: profile?.id }, select: { userId: true } });
    where = { userId: { in: mhsProfiles.map((m) => m.userId) } };
  }
  // SUPERADMIN: semua laporan

  const laporan = await prisma.laporanHarian.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { nama: true } } },
  });

  return NextResponse.json({
    laporan: laporan.map((l) => ({
      id: l.id,
      judul: l.judul,
      tanggal: formatTanggalCompact(l.tanggal),
      status: l.status,
      deskripsi: l.deskripsi.substring(0, 150),
      user: l.user.nama,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { tanggal, judul, deskripsi, kendala } = body;

  if (!tanggal || !judul || !deskripsi) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const laporan = await prisma.laporanHarian.create({
    data: {
      userId: session.user.id,
      tanggal: new Date(tanggal),
      judul,
      deskripsi,
      kendala: kendala || null,
      status: "TERKIRIM",
    },
  });

  return NextResponse.json({ laporan, message: "Laporan berhasil dikirim!" });
}
