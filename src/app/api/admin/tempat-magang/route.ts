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

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawData = await prisma.tempatMagang.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Map to frontend expected format
    const tempatMagang = rawData.map(t => ({
      id: t.id,
      nama: t.namaInstansi,
      alamat: t.alamat,
      latitude: t.latitudeKantor,
      longitude: t.longitudeKantor,
      radiusAbsen: t.radiusAbsensiMeter,
      createdAt: t.createdAt,
    }));
    
    return NextResponse.json(tempatMagang);
  } catch (error) {
    console.error("Error fetching tempat magang:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = tempatMagangSchema.parse(json);

    const newTempatMagang = await prisma.tempatMagang.create({
      data: {
        namaInstansi: body.nama,
        alamat: body.alamat,
        latitudeKantor: body.latitude || null,
        longitudeKantor: body.longitude || null,
        radiusAbsensiMeter: body.radiusAbsen,
      },
    });

    return NextResponse.json(newTempatMagang, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error creating tempat magang:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
