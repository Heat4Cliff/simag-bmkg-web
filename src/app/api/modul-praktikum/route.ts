import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTanggalCompact } from "@/lib/utils";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { sendPushNotification } from "@/lib/push";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const role = (session.user as { role?: string }).role;

  let where = {};
  if (role === "MAHASISWA") where = { userId };

  const modul = await prisma.modulPraktikum.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { kategori: true },
  });

  return NextResponse.json({
    modul: modul.map((m) => ({
      id: m.id,
      judul: m.judul,
      kategori: m.kategori.namaKategori,
      tanggal: formatTanggalCompact(m.createdAt),
      statusReview: m.statusReview,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const judul = formData.get("judul") as string;
    const kategoriId = formData.get("kategoriId") as string;
    const konten = formData.get("konten") as string;
    const file = formData.get("file") as File | null;

    if (!judul || !kategoriId || !konten) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    let lampiranUrl = null;
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

    const modul = await prisma.modulPraktikum.create({
      data: {
        userId: session.user.id,
        judul,
        kategoriId,
        konten,
        lampiran: lampiranUrl,
        statusReview: "TERKIRIM",
      },
    });

    // Create Notification for DPL & Mentor
    const mahasiswaProfile = await prisma.mahasiswaProfile.findUnique({
      where: { userId: session.user.id },
      include: { dpl: true, mentor: true }
    });

    const supervisors = [mahasiswaProfile?.dpl?.userId, mahasiswaProfile?.mentor?.userId].filter(Boolean);
    
    for (const supervisorId of supervisors) {
      if (!supervisorId) continue;
      await prisma.notifikasi.create({
        data: {
          userId: supervisorId,
          judul: "Modul Praktikum Baru",
          pesan: `Mahasiswa ${session.user.name || 'Bimbingan Anda'} telah mengirimkan modul praktikum baru: ${judul}`,
          link: `/modul-praktikum/${modul.id}`,
        }
      });

      // Trigger Web Push Notification
      await sendPushNotification(
        supervisorId,
        "Modul Praktikum Baru",
        `Mahasiswa ${session.user.name || 'Bimbingan Anda'} telah mengirimkan modul praktikum baru: ${judul}`,
        `/modul-praktikum/${modul.id}`
      );
    }

    return NextResponse.json({ modul, message: "Modul berhasil dikirim!" });
  } catch (error) {
    console.error("Modul POST error:", error);
    return NextResponse.json({ error: "Gagal membuat modul" }, { status: 500 });
  }
}
