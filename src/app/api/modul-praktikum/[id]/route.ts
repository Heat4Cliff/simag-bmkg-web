import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolvedParams = await params;
    const modul = await prisma.modulPraktikum.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { nama: true } },
        kategori: true,
      }
    });

    if (!modul) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ modul });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch modul" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolvedParams = await params;
    const modulId = resolvedParams.id;
    
    const existing = await prisma.modulPraktikum.findUnique({ where: { id: modulId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // @ts-ignore
    const role = session.user?.role;
    if (role !== "SUPERADMIN" && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["DRAFT", "TERKIRIM", "REVISI"].includes(existing.statusReview)) {
      return NextResponse.json({ error: "Modul ini tidak dapat diedit karena sudah disetujui" }, { status: 400 });
    }

    const formData = await request.formData();
    const judul = formData.get("judul") as string;
    const kategoriId = formData.get("kategoriId") as string;
    const konten = formData.get("konten") as string;
    const asDraft = formData.get("asDraft") === "true";
    const file = formData.get("file") as File | null;

    if (!judul || !kategoriId || !konten) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    let lampiranUrl = existing.lampiran;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const namaFile = `modul-${session.user.id}-${timestamp}${path.extname(file.name)}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "modul");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, namaFile);
      await writeFile(filePath, buffer);
      lampiranUrl = `/uploads/modul/${namaFile}`;
    }

    const updated = await prisma.modulPraktikum.update({
      where: { id: modulId },
      data: {
        judul,
        kategoriId,
        konten,
        lampiran: lampiranUrl,
        statusReview: asDraft ? "DRAFT" : "TERKIRIM",
      }
    });

    return NextResponse.json({ message: "Modul berhasil diubah", modul: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal update modul" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "DPL" && role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { statusReview, catatanReview } = await request.json();

    const updated = await prisma.modulPraktikum.update({
      where: { id: resolvedParams.id },
      data: {
        statusReview,
        catatanReview,
        reviewedBy: session?.user?.id,
        reviewedAt: new Date(),
      }
    });

    // Create Notification for Mahasiswa
    let statusText = statusReview;
    if (statusReview === "DISETUJUI") statusText = "telah disetujui";
    if (statusReview === "REVISI") statusText = "perlu direvisi";
    if (statusReview === "DITOLAK") statusText = "telah ditolak";

    await prisma.notifikasi.create({
      data: {
        userId: updated.userId,
        judul: "Status Modul Diperbarui",
        pesan: `Modul praktikum Anda '${updated.judul}' ${statusText} oleh pembimbing.`,
        link: `/modul-praktikum/${updated.id}`,
      }
    });

    // Trigger Web Push Notification
    await sendPushNotification(
      updated.userId,
      "Status Modul Diperbarui",
      `Modul praktikum Anda '${updated.judul}' ${statusText} oleh pembimbing.`,
      `/modul-praktikum/${updated.id}`
    );

    return NextResponse.json({ message: "Status diperbarui", modul: updated });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolvedParams = await params;
    const modul = await prisma.modulPraktikum.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!modul) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // @ts-ignore
    const role = session.user?.role;
    if (role !== "SUPERADMIN") {
      if (modul.userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.modulPraktikum.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: "Modul berhasil dihapus" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete modul" }, { status: 500 });
  }
}
