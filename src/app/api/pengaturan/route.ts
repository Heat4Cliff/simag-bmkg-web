import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.kampusSetting.findFirst();
  return NextResponse.json({ setting });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { namaInstansi, alamat, kontak, latitudeKantor, longitudeKantor, radiusAbsensiMeter } = await request.json();
    
    let setting = await prisma.kampusSetting.findFirst();
    if (setting) {
      setting = await prisma.kampusSetting.update({
        where: { id: setting.id },
        data: {
          namaInstansi,
          alamat,
          kontak,
          latitudeKantor: parseFloat(latitudeKantor),
          longitudeKantor: parseFloat(longitudeKantor),
          radiusAbsensiMeter: parseFloat(radiusAbsensiMeter),
        }
      });
    }

    return NextResponse.json({ message: "Pengaturan disimpan", setting });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
