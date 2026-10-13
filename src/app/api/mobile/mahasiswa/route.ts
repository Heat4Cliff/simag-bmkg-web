import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMobileAuthUser, buildCorsResponse } from "@/lib/mobileAuth";

export async function GET(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) return buildCorsResponse({ success: false, message: "Unauthorized" }, 401);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    let whereClause: any = {};
    if (search) {
      whereClause.user = {
        nama: { contains: search, mode: 'insensitive' }
      };
    }

    if (user.role === 'DPL') {
      const dplProfile = await prisma.dplProfile.findUnique({ where: { userId: user.id } });
      if (dplProfile) {
        whereClause.dplId = dplProfile.id;
      }
    } else if (user.role !== 'SUPERADMIN') {
      return buildCorsResponse({ success: false, message: "Forbidden" }, 403);
    }

    const mahasiswa = await prisma.mahasiswaProfile.findMany({
      where: whereClause,
      include: {
        user: { select: { nama: true, email: true, username: true } },
        tempatMagang: { select: { namaPerusahaan: true } }
      },
      orderBy: { user: { nama: 'asc' } }
    });

    const data = mahasiswa.map(m => ({
      id: m.id,
      userId: m.userId,
      nama: m.user.nama,
      nim: m.nim,
      universitas: m.universitas,
      tempatMagang: m.tempatMagang?.namaPerusahaan || 'Belum ditempatkan',
      status: m.statusMagang
    }));

    return buildCorsResponse({
      success: true,
      data
    });

  } catch (error: any) {
    console.error("Mobile Mahasiswa List Error:", error);
    return buildCorsResponse({ success: false, message: error.message }, 500);
  }
}

export async function OPTIONS() {
  return buildCorsResponse({}, 200);
}
