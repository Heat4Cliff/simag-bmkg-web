import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = (session?.user as { role?: string })?.role;
  
  if (!userId || (role !== "DPL" && role !== "MENTOR_INSTANSI" && role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let whereClause: any = {};

  if (role === "DPL") {
    const pembimbing = await prisma.dplProfile.findUnique({
      where: { userId }
    });
    if (!pembimbing) {
      return NextResponse.json({ mahasiswa: [] });
    }
    whereClause = { dplId: pembimbing.id };
  } else if (role === "MENTOR_INSTANSI") {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId }
    });
    if (!mentor) {
      return NextResponse.json({ mahasiswa: [] });
    }
    whereClause = { mentorId: mentor.id };
  } else if (role === "SUPERADMIN") {
    whereClause = {};
  }

  // Cari mahasiswa bimbingan
  const mahasiswa = await prisma.mahasiswaProfile.findMany({
    where: whereClause,
    include: {
      tempatMagang: true,
      user: {
        select: {
          nama: true,
          email: true,
          absensi: {
            orderBy: { tanggal: 'desc' },
            take: 1,
            select: { status: true, tanggal: true }
          },
          laporanHarian: {
            where: { status: "TERKIRIM" },
            select: { id: true }
          }
        }
      }
    }
  });

  return NextResponse.json({
    mahasiswa: mahasiswa.map(m => ({
      id: m.userId,
      nama: m.user.nama,
      institusi: m.tempatMagang?.namaInstansi || "-",
      periodeSelesai: m.periodeSelesai,
      lastAbsen: (m.user as any)?.absensi?.[0] || null,
      pendingLaporan: (m.user as any)?.laporanHarian?.length || 0,
    }))
  });
}
