import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const tempatMagangSchema = z.object({
  nama: z.string().min(1, "Nama tempat magang harus diisi"),
  alamat: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  radiusAbsen: z.number().min(10, "Radius minimal 10 meter").default(50),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !["SUPERADMIN", "KAPRODI"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawData = await prisma.tempatMagang.findUnique({
      where: { id: params.id },
    });

    if (!rawData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const tempatMagang = {
      id: rawData.id,
      nama: rawData.namaInstansi,
      alamat: rawData.alamat,
      latitude: rawData.latitudeKantor,
      longitude: rawData.longitudeKantor,
      radiusAbsen: rawData.radiusAbsensiMeter,
      createdAt: rawData.createdAt,
    };

    return NextResponse.json(tempatMagang);
  } catch (error) {
    console.error("Error fetching tempat magang:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !["SUPERADMIN", "KAPRODI"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = tempatMagangSchema.parse(json);

    const rawData = await prisma.tempatMagang.update({
      where: { id: params.id },
      data: {
        namaInstansi: body.nama,
        alamat: body.alamat,
        latitudeKantor: body.latitude || null,
        longitudeKantor: body.longitude || null,
        radiusAbsensiMeter: body.radiusAbsen,
      },
    });

    const updated = {
      id: rawData.id,
      nama: rawData.namaInstansi,
      alamat: rawData.alamat,
      latitude: rawData.latitudeKantor,
      longitude: rawData.longitudeKantor,
      radiusAbsen: rawData.radiusAbsensiMeter,
      createdAt: rawData.createdAt,
    };

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error updating tempat magang:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !["SUPERADMIN", "KAPRODI"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.tempatMagang.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting tempat magang:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
