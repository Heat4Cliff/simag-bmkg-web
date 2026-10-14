import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const data = await req.json();
    const { judul, deskripsi, tanggal, jam } = data;
    
    if (!judul || !tanggal) {
      return NextResponse.json({ error: "Judul dan tanggal wajib diisi" }, { status: 400 });
    }

    const agenda = await prisma.jadwalKegiatan.findUnique({
      where: { id }
    });

    if (!agenda) {
      return NextResponse.json({ error: "Agenda tidak ditemukan" }, { status: 404 });
    }

    const role = (session.user as { role?: string }).role;

    // Hanya pembuat atau superadmin yang boleh edit
    if (agenda.userId !== session.user.id && role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const updatedAgenda = await prisma.jadwalKegiatan.update({
      where: { id: params.id },
      data: {
        judul,
        deskripsi,
        tanggal: new Date(tanggal),
        jam
      }
    });

    return NextResponse.json({ message: "Agenda berhasil diperbarui", agenda: updatedAgenda });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memperbarui agenda" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const agenda = await prisma.jadwalKegiatan.findUnique({
      where: { id }
    });

    if (!agenda) {
      return NextResponse.json({ error: "Agenda tidak ditemukan" }, { status: 404 });
    }

    const role = (session.user as { role?: string }).role;

    // Hanya pembuat atau superadmin yang boleh delete
    if (agenda.userId !== session.user.id && role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    await prisma.jadwalKegiatan.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Agenda berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus agenda" }, { status: 500 });
  }
}
