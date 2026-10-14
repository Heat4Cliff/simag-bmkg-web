import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let setting = await prisma.kampusSetting.findFirst();
  if (!setting) {
    setting = await prisma.kampusSetting.create({
      data: {
        namaKampus: "Universitas Nahdlatul Ulama Al Ghazali",
        alamat: "Jl. Trunojoyo No. 43, Kebonpedes",
        kontak: "081234567890",
      }
    });
  }

  const defaultTempat = await prisma.tempatMagang.findFirst({
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({
    setting: {
      namaInstansi: setting.namaKampus,
      alamat: setting.alamat || "",
      kontak: setting.kontak || "",
      latitudeKantor: defaultTempat?.latitudeKantor ?? -7.7123,
      longitudeKantor: defaultTempat?.longitudeKantor ?? 109.0123,
      radiusAbsensiMeter: defaultTempat?.radiusAbsensiMeter ?? 500,
    }
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { namaInstansi, alamat, kontak, latitudeKantor, longitudeKantor, radiusAbsensiMeter } = await request.json();
    
    let setting = await prisma.kampusSetting.findFirst();
    if (!setting) {
      setting = await prisma.kampusSetting.create({
        data: {
          namaKampus: namaInstansi || "Universitas Nahdlatul Ulama Al Ghazali",
          alamat: alamat || null,
          kontak: kontak || null,
        }
      });
    } else {
      setting = await prisma.kampusSetting.update({
        where: { id: setting.id },
        data: {
          namaKampus: namaInstansi || setting.namaKampus,
          alamat: alamat || null,
          kontak: kontak || null,
        }
      });
    }

    if (latitudeKantor !== undefined && longitudeKantor !== undefined) {
      const defaultTempat = await prisma.tempatMagang.findFirst({
        orderBy: { createdAt: "asc" }
      });
      if (defaultTempat) {
        await prisma.tempatMagang.update({
          where: { id: defaultTempat.id },
          data: {
            latitudeKantor: parseFloat(latitudeKantor) || null,
            longitudeKantor: parseFloat(longitudeKantor) || null,
            radiusAbsensiMeter: parseFloat(radiusAbsensiMeter) || 500,
          }
        });
      }
    }

    return NextResponse.json({
      message: "Pengaturan disimpan",
      setting: {
        namaInstansi: setting.namaKampus,
        alamat: setting.alamat,
        kontak: setting.kontak,
        latitudeKantor,
        longitudeKantor,
        radiusAbsensiMeter,
      }
    });
  } catch (error) {
    console.error("Pengaturan save error:", error);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
