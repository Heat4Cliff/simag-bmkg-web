import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMobileAuthUser, buildCorsResponse, corsHeaders } from "@/lib/mobileAuth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { sendPushNotification } from "@/lib/push";

export async function GET(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) return buildCorsResponse({ success: false, message: "Unauthorized" }, 401);

    const modul = await prisma.modulPraktikum.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { kategori: true },
    });

    return buildCorsResponse({ success: true, data: modul });
  } catch (error: any) {
    return buildCorsResponse({ success: false, message: error.message }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) return buildCorsResponse({ success: false, message: "Unauthorized" }, 401);

    const formData = await request.formData();
    const judul = formData.get("judul") as string;
    const kategoriId = formData.get("kategoriId") as string;
    const konten = formData.get("konten") as string;
    const file = formData.get("file") as File | null;

    if (!judul || !kategoriId || !konten) {
      return buildCorsResponse({ success: false, message: "Data tidak lengkap" }, 400);
    }

    let lampiranUrl = null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const namaFile = `modul-${user.id}-${timestamp}${path.extname(file.name)}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "modul");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, namaFile);
      await writeFile(filePath, buffer);
      lampiranUrl = `/uploads/modul/${namaFile}`;
    }

    const modul = await prisma.modulPraktikum.create({
      data: {
        userId: user.id,
        judul,
        kategoriId,
        konten,
        lampiran: lampiranUrl,
        statusReview: "TERKIRIM",
      },
    });

    const mahasiswaProfile = await prisma.mahasiswaProfile.findUnique({
      where: { userId: user.id },
      include: { dpl: true, mentor: true }
    });

    const supervisors = [mahasiswaProfile?.dpl?.userId, mahasiswaProfile?.mentor?.userId].filter(Boolean);
    for (const supervisorId of supervisors) {
      if (!supervisorId) continue;
      await prisma.notifikasi.create({
        data: {
          userId: supervisorId,
          judul: "Modul Praktikum Baru",
          pesan: `Mahasiswa ${user.nama || 'Bimbingan Anda'} telah mengirim modul baru dari Mobile: ${judul}`,
          link: `/modul-praktikum/${modul.id}`,
        }
      });
      await sendPushNotification(supervisorId, "Modul Praktikum Baru", `Mahasiswa telah mengirim modul: ${judul}`, `/modul-praktikum/${modul.id}`);
    }

    return buildCorsResponse({ success: true, message: "Modul berhasil dikirim", data: modul });
  } catch (error: any) {
    console.error("Mobile Modul POST Error:", error);
    return buildCorsResponse({ success: false, message: error.message }, 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
