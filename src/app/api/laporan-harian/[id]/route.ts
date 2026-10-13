import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const laporan = await prisma.laporanHarian.findUnique({
    where: { id: resolvedParams.id },
    include: { user: { select: { nama: true } } }
  });

  if (!laporan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    laporan: {
      ...laporan,
      tanggal: laporan.tanggal.toISOString(),
      createdAt: laporan.createdAt.toISOString(),
    }
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  
  if (role !== "DPL" && role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { status, komentar } = await request.json();
    
    if (!status) return NextResponse.json({ error: "Status required" }, { status: 400 });

    const updated = await prisma.laporanHarian.update({
      where: { id: resolvedParams.id },
      data: { 
        status, 
        catatanPembimbing: komentar || null,
        reviewedBy: session?.user?.id,
        reviewedAt: new Date(),
      }
    });

    return NextResponse.json({ message: "Status diperbarui", laporan: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolvedParams = await params;
    const laporanId = resolvedParams.id;
    const { tanggal, judul, deskripsi, kendala, asDraft } = await request.json();

    const existing = await prisma.laporanHarian.findUnique({ where: { id: laporanId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!["DRAFT", "TERKIRIM", "REVISI"].includes(existing.status)) {
      return NextResponse.json({ error: "Laporan ini tidak dapat diubah" }, { status: 400 });
    }

    const updated = await prisma.laporanHarian.update({
      where: { id: laporanId },
      data: {
        tanggal: new Date(tanggal),
        judul,
        deskripsi,
        kendala: kendala || null,
        status: asDraft ? "DRAFT" : "TERKIRIM",
      }
    });

    return NextResponse.json({ message: "Laporan berhasil diubah", laporan: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal update laporan" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolvedParams = await params;
    const laporanId = resolvedParams.id;
    
    const existing = await prisma.laporanHarian.findUnique({ where: { id: laporanId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // @ts-ignore
    const role = session.user?.role;
    
    if (role !== "SUPERADMIN") {
      if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      if (!["DRAFT", "TERKIRIM", "REVISI"].includes(existing.status)) {
        return NextResponse.json({ error: "Laporan ini tidak dapat dihapus" }, { status: 400 });
      }
    }

    await prisma.laporanHarian.delete({ where: { id: laporanId } });

    return NextResponse.json({ message: "Laporan berhasil dihapus" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus laporan" }, { status: 500 });
  }
}

