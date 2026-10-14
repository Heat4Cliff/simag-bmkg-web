import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mahasiswa = await prisma.user.findMany({
    where: { role: "MAHASISWA" },
    include: {
      mahasiswaProfile: {
        include: {
          dpl: { include: { user: true } },
          mentor: { include: { user: true } },
          tempatMagang: true,
        },
      },
    },
  });

  const dpls = await prisma.user.findMany({
    where: { role: "DPL" },
    include: { dplProfile: true },
  });

  const mentors = await prisma.user.findMany({
    where: { role: "MENTOR_INSTANSI" },
    include: { mentorProfile: true },
  });

  const tempatMagangs = await prisma.tempatMagang.findMany({
    orderBy: { namaInstansi: "asc" },
  });

  return NextResponse.json({
    mahasiswa: mahasiswa.map((m) => ({
      userId: m.id,
      nama: m.nama,
      email: m.email,
      institusi: "-",
      dplNama: m.mahasiswaProfile?.dpl?.user?.nama || "Belum ada DPL",
      mentorNama: m.mahasiswaProfile?.mentor?.user?.nama || "Belum ada Mentor",
      tempatMagangNama: m.mahasiswaProfile?.tempatMagang?.namaInstansi || "Belum ada Tempat",
      dplId: m.mahasiswaProfile?.dplId || null,
      mentorId: m.mahasiswaProfile?.mentorId || null,
      tempatMagangId: m.mahasiswaProfile?.tempatMagangId || null,
    })),
    dpl: dpls.map((p) => ({
      profileId: p.dplProfile?.id,
      nama: p.nama,
    })).filter(p => p.profileId),
    mentor: mentors.map((p) => ({
      profileId: p.mentorProfile?.id,
      nama: p.nama,
    })).filter(p => p.profileId),
    tempatMagang: tempatMagangs.map((t) => ({
      id: t.id,
      nama: t.namaInstansi,
    })),
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, dplProfileId, mentorProfileId, tempatMagangId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const updateData: any = {};
    if (dplProfileId !== undefined) updateData.dplId = dplProfileId === "" ? null : dplProfileId;
    if (mentorProfileId !== undefined) updateData.mentorId = mentorProfileId === "" ? null : mentorProfileId;
    if (tempatMagangId !== undefined) updateData.tempatMagangId = tempatMagangId === "" ? null : tempatMagangId;

    await prisma.mahasiswaProfile.upsert({
      where: { userId: userId },
      update: updateData,
      create: {
        userId: userId,
        nim: "-",
        programStudi: "-",
        periodeMulai: new Date(),
        periodeSelesai: new Date(),
        ...updateData,
      }
    });

    return NextResponse.json({ message: "Penempatan berhasil diupdate" });
  } catch (error: any) {
    console.error("Penempatan PATCH Error:", error);
    return NextResponse.json({ error: error.message || "Gagal update penempatan" }, { status: 500 });
  }
}
