import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMobileAuthUser, buildCorsResponse, corsHeaders } from "@/lib/mobileAuth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// Function to calculate distance (haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export async function POST(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) return buildCorsResponse({ success: false, message: "Unauthorized" }, 401);

    const formData = await request.formData();
    const tipe = formData.get("tipe") as string; // 'masuk', 'pulang', 'izin', 'sakit'
    const keterangan = formData.get("keterangan") as string || "";
    const file = formData.get("file") as File | null;
    const latStr = formData.get("latitude") as string;
    const lngStr = formData.get("longitude") as string;

    const hariIni = new Date();
    const startDate = new Date(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate(), 0, 0, 0);
    const endDate = new Date(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate(), 23, 59, 59);

    let lampiranUrl = null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const namaFile = `absensi-${user.id}-${timestamp}${path.extname(file.name)}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "absensi");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, namaFile);
      await writeFile(filePath, buffer);
      lampiranUrl = `/uploads/absensi/${namaFile}`;
    }

    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        userId: user.id,
        tanggal: { gte: startDate, lte: endDate },
      },
    });

    if (tipe === "izin" || tipe === "sakit") {
      if (absensiHariIni) {
        return buildCorsResponse({ success: false, message: "Anda sudah melakukan absensi hari ini." }, 400);
      }
      const absensiBaru = await prisma.absensi.create({
        data: {
          userId: user.id,
          tanggal: new Date(),
          status: tipe === "izin" ? "IZIN" : "SAKIT",
          keterangan,
          lampiranUrl,
          lokasiValid: true,
        },
      });
      return buildCorsResponse({ success: true, message: `Berhasil mengajukan ${tipe}`, data: absensiBaru });
    }

    // Handle Masuk / Pulang
    if (!latStr || !lngStr) {
      return buildCorsResponse({ success: false, message: "Lokasi tidak ditemukan. Aktifkan GPS Anda." }, 400);
    }
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    const profile = await prisma.mahasiswaProfile.findUnique({
      where: { userId: user.id }
    });
    const tempatMagangId = profile?.tempatMagangId;

    let targetLat = 0;
    let targetLng = 0;
    let radius = 500;

    if (tempatMagangId) {
      const tempat = await prisma.tempatMagang.findUnique({ where: { id: tempatMagangId } });
      if (tempat) {
        targetLat = tempat.latitudeKantor || 0;
        targetLng = tempat.longitudeKantor || 0;
        radius = tempat.radiusAbsensiMeter || 500;
      }
    } else {
      return buildCorsResponse({ success: false, message: "Anda belum ditempatkan di tempat magang manapun, absensi diblokir." }, 403);
    }

    const distance = getDistance(latitude, longitude, targetLat, targetLng);
    if (distance > radius) {
      return buildCorsResponse({ success: false, message: `Anda berada di luar radius kantor (${Math.round(distance)}m > ${radius}m)` }, 400);
    }

    if (tipe === "masuk") {
      if (absensiHariIni) {
        return buildCorsResponse({ success: false, message: "Anda sudah absen masuk hari ini" }, 400);
      }
      const jamMulaiKerja = new Date(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate(), 7, 30, 0);
      const isLate = hariIni > jamMulaiKerja;

      const newAbsen = await prisma.absensi.create({
        data: {
          userId: user.id,
          tanggal: new Date(),
          jamMasuk: new Date(),
          status: isLate ? "TELAT" : "HADIR",
          latitude: latitude,
          longitude: longitude,
          jarakDariKantorMeter: Math.round(distance),
          lokasiValid: true,
          fotoMasuk: lampiranUrl,
          keterangan: keterangan || (isLate ? "Terlambat" : null),
        },
      });
      return buildCorsResponse({ success: true, message: "Berhasil absen masuk", data: newAbsen });
    }

    if (tipe === "pulang") {
      if (!absensiHariIni) {
        return buildCorsResponse({ success: false, message: "Anda belum absen masuk hari ini" }, 400);
      }
      if (absensiHariIni.jamPulang) {
        return buildCorsResponse({ success: false, message: "Anda sudah absen pulang hari ini" }, 400);
      }

      const jamPulangKerja = new Date(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate(), 16, 0, 0);
      let ket = absensiHariIni.keterangan;
      if (hariIni < jamPulangKerja) {
        ket = (ket ? ket + ". " : "") + "Pulang lebih awal";
      }

      const updated = await prisma.absensi.update({
        where: { id: absensiHariIni.id },
        data: {
          jamPulang: new Date(),
          latitude: latitude,
          longitude: longitude,
          jarakDariKantorMeter: Math.round(distance),
          fotoPulang: lampiranUrl || absensiHariIni.fotoPulang,
          keterangan: ket,
        },
      });
      return buildCorsResponse({ success: true, message: "Berhasil absen pulang", data: updated });
    }

    return buildCorsResponse({ success: false, message: "Tipe absensi tidak valid" }, 400);

  } catch (error: any) {
    console.error("Mobile Absensi POST Error:", error);
    return buildCorsResponse({ success: false, message: error.message }, 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
