import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const role = (session.user as { role?: string }).role;

  try {
    const jadwalList = await prisma.jadwalKegiatan.findMany({
      where: {
        OR: [
          { visibility: "PUBLIC" },
          { userId: session.user.id }
        ]
      }
    });

    let jadwalLaporan: any[] = [];
    if (role === "MAHASISWA") {
      const laporan = await prisma.laporanHarian.findMany({
        where: { userId: session.user.id }
      });
      jadwalLaporan = laporan.map(l => ({
        id: l.id,
        title: l.judul,
        date: l.tanggal.toISOString().split('T')[0],
        color: l.status === "DISETUJUI" ? "#1E8A3C" : (l.status === "REVISI" ? "#dc2626" : "#1E8A3C"),
        type: "laporan",
        raw: l
      }));
    }

    const events = jadwalList.map(j => ({
      id: j.id,
      title: j.judul,
      date: j.tanggal.toISOString().split('T')[0],
      color: j.tipe === "BIMBINGAN" ? "#eab308" : (j.tipe === "PRIBADI" ? "#0ea5e9" : "#9333ea"),
      type: "jadwal",
      raw: j
    }));

    return NextResponse.json({ events: [...events, ...jadwalLaporan] });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat kalender" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const { judul, deskripsi, tanggal, jam } = data;
    
    if (!judul || !tanggal) {
      return NextResponse.json({ error: "Judul dan tanggal wajib diisi" }, { status: 400 });
    }

    const role = (session.user as { role?: string }).role;
    
    let tipe = "PRIBADI";
    let visibility = "PRIVATE";

    if (role === "SUPERADMIN") {
      tipe = "INSTANSI";
      visibility = "PUBLIC";
    } else if (role === "DPL") {
      tipe = "BIMBINGAN";
      visibility = "PUBLIC";
    }

    const newAgenda = await prisma.jadwalKegiatan.create({
      data: {
        userId: session.user.id,
        judul,
        deskripsi,
        tanggal: new Date(tanggal),
        jam,
        tipe: tipe as any,
        visibility
      }
    });

    return NextResponse.json({ message: "Agenda berhasil dibuat", agenda: newAgenda });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat agenda" }, { status: 500 });
  }
}
