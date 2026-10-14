import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMobileAuthUser, buildCorsResponse } from "@/lib/mobileAuth";

export async function GET(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) return buildCorsResponse({ success: false, message: "Unauthorized" }, 401);

    if (user.role === 'MAHASISWA') {
      return buildCorsResponse({ success: false, message: "Forbidden" }, 403);
    }

    let userIds: string[] = [];
    if (user.role === 'DPL') {
      const dplProfile = await prisma.dplProfile.findUnique({ where: { userId: user.id } });
      if (dplProfile) {
        const mhsIds = await prisma.mahasiswaProfile.findMany({
          where: { dplId: dplProfile.id },
          select: { userId: true },
        });
        userIds = mhsIds.map((m) => m.userId);
      }
    } else if (user.role === 'MENTOR_INSTANSI') {
      const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: user.id } });
      if (mentorProfile) {
        const mhsIds = await prisma.mahasiswaProfile.findMany({
          where: { mentorId: mentorProfile.id },
          select: { userId: true },
        });
        userIds = mhsIds.map((m) => m.userId);
      }
    }

    let laporanQuery: any = { status: "TERKIRIM" };
    let modulQuery: any = { statusReview: "TERKIRIM" };

    if (user.role === 'DPL' || user.role === 'MENTOR_INSTANSI') {
      laporanQuery.userId = { in: userIds };
      modulQuery.userId = { in: userIds };
    }

    const [pendingLaporan, pendingModul] = await Promise.all([
      prisma.laporanHarian.findMany({
        where: laporanQuery,
        include: { user: { select: { nama: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.modulPraktikum.findMany({
        where: modulQuery,
        include: { user: { select: { nama: true } } },
        orderBy: { createdAt: "desc" },
      })
    ]);

    const persetujuanList = [
      ...pendingLaporan.map(l => ({
        id: "l_" + l.id,
        tipe: "LAPORAN",
        judul: l.judul,
        user: l.user.nama,
        tanggal: l.createdAt.toISOString(),
      })),
      ...pendingModul.map(m => ({
        id: "m_" + m.id,
        tipe: "MODUL",
        judul: m.judul || "Modul Praktikum",
        user: m.user.nama,
        tanggal: m.createdAt.toISOString(),
      }))
    ];

    persetujuanList.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return buildCorsResponse({
      success: true,
      data: persetujuanList
    });

  } catch (error: any) {
    console.error("Mobile Persetujuan Error:", error);
    return buildCorsResponse({ success: false, message: error.message }, 500);
  }
}

export async function OPTIONS() {
  return buildCorsResponse({}, 200);
}
