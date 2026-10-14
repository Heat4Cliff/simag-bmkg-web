export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hitungJarakMeter, KOORDINAT_KANTOR, RADIUS_ABSENSI_METER } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { startOfDay, endOfDay } from "date-fns";
import { cekLibur } from "@/lib/holidays";

import { getJakartaDateISO } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { jenisAbsensi = "HADIR", tipe, latitude, longitude, foto, keterangan, lampiranBase64, lampiranExt } = body;

    const infoLibur = cekLibur(new Date(), { allowWeekend: true });
    if (infoLibur.isLibur) {
      return NextResponse.json({ error: `Hari ini libur: ${infoLibur.keterangan}. Anda tidak bisa absen.` }, { status: 403 });
    }

    if (jenisAbsensi === "HADIR") {
      if (!tipe || !foto) {
        return NextResponse.json({ error: "Data tipe dan foto wajib diisi untuk kehadiran" }, { status: 400 });
      }
    } else if (jenisAbsensi === "IZIN" || jenisAbsensi === "SAKIT") {
      if (!keterangan && !lampiranBase64) {
        return NextResponse.json({ error: "Keterangan atau file lampiran wajib disertakan" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Jenis absensi tidak valid" }, { status: 400 });
    }

    const finalLat = typeof latitude === "number" ? latitude : parseFloat(latitude) || 0;
    const finalLon = typeof longitude === "number" ? longitude : parseFloat(longitude) || 0;

    if (jenisAbsensi === "HADIR" && (finalLat === 0 || finalLon === 0)) {
      return NextResponse.json(
        { error: "Koordinat lokasi GPS tidak terdeteksi. Silakan aktifkan GPS di perangkat Anda dan coba lagi." },
        { status: 400 }
      );
    }

    // Ambil profile mahasiswa untuk cek tempat magang
    const profile = await prisma.mahasiswaProfile.findUnique({
      where: { userId },
      include: { tempatMagang: true }
    });

    let lokasiValid = true;
    let jarak = 0;

    const kantorLat = profile?.tempatMagang?.latitudeKantor ?? KOORDINAT_KANTOR.latitude;
    const kantorLon = profile?.tempatMagang?.longitudeKantor ?? KOORDINAT_KANTOR.longitude;
    const maxRadius = profile?.tempatMagang?.radiusAbsensiMeter ?? RADIUS_ABSENSI_METER;

    if (kantorLat !== null && kantorLon !== null && finalLat !== 0 && finalLon !== 0) {
      jarak = hitungJarakMeter(
        finalLat,
        finalLon,
        kantorLat,
        kantorLon
      );
      if (jarak > maxRadius) {
        lokasiValid = false;
      }
    }

    if (!lokasiValid) {
      return NextResponse.json({
        error: `Lokasi Anda berada di luar radius absensi (${Math.round(jarak)}m dari kantor, batas radius ${maxRadius}m). Pastikan Anda berada di lingkungan kantor tempat magang.`
      }, { status: 400 });
    }

    // 3. Simpan foto ke storage lokal jika ada
    let fotoUrl = null;
    if (foto) {
      const base64Data = foto.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const timestamp = Date.now();
      const namaFile = `absensi-${userId}-${timestamp}.jpg`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "absensi");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, namaFile);
      await writeFile(filePath, buffer);
      fotoUrl = `/uploads/absensi/${namaFile}`;
    }

    // Simpan lampiran (surat izin/sakit) jika ada
    let lampiranUrl = null;
    if (lampiranBase64 && lampiranExt) {
      const base64Data = lampiranBase64.replace(/^data:.*?;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const timestamp = Date.now();
      const namaFile = `lampiran-${userId}-${timestamp}.${lampiranExt}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "lampiran");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, namaFile);
      await writeFile(filePath, buffer);
      lampiranUrl = `/uploads/lampiran/${namaFile}`;
    }

    // 4. Cek absensi hari ini (berdasarkan waktu Jakarta)
    const tanggalAbsensiISO = getJakartaDateISO();

    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        userId,
        tanggal: tanggalAbsensiISO,
      },
    });

    const jamSekarang = new Date();
    
    if (jenisAbsensi === "HADIR") {
      let statusAbsensi: "HADIR" | "TELAT" = "HADIR";

      if (tipe === "MASUK") {
        if (absensiHariIni) {
          return NextResponse.json(
            { error: "Anda sudah absen hari ini" },
            { status: 400 }
          );
        }
        await prisma.absensi.create({
          data: {
            userId,
            tanggal: tanggalAbsensiISO,
            jamMasuk: jamSekarang,
            fotoMasuk: fotoUrl,
            latitude: finalLat,
            longitude: finalLon,
            jarakDariKantorMeter: Math.round(jarak),
            lokasiValid: lokasiValid,
            status: statusAbsensi,
            keterangan: keterangan || null,
          },
        });
      } else if (tipe === "PULANG") {
        if (!absensiHariIni) {
          return NextResponse.json(
            { error: "Anda belum absen masuk hari ini" },
            { status: 400 }
          );
        }
        if (absensiHariIni.jamPulang) {
          return NextResponse.json(
            { error: "Anda sudah absen pulang hari ini" },
            { status: 400 }
          );
        }
        await prisma.absensi.update({
          where: { id: absensiHariIni.id },
          data: {
            jamPulang: jamSekarang,
            fotoPulang: fotoUrl,
          },
        });
      }
    } else {
      // IZIN or SAKIT
      if (absensiHariIni) {
        return NextResponse.json(
          { error: "Anda sudah melakukan absensi hari ini" },
          { status: 400 }
        );
      }
      await prisma.absensi.create({
        data: {
          userId,
          tanggal: tanggalAbsensiISO,
          status: jenisAbsensi as "IZIN" | "SAKIT",
          keterangan: keterangan || null,
          lampiranUrl: lampiranUrl,
          lokasiValid: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      lokasiValid: lokasiValid,
      jarak: Math.round(jarak),
      pesan: `Absensi berhasil dicatat!`,
    });
  } catch (error) {
    console.error("Absensi error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const absensiHariIni = await prisma.absensi.findFirst({
    where: {
      userId: session.user.id,
      tanggal: getJakartaDateISO(),
    },
  });

  const infoLibur = cekLibur(today, { allowWeekend: true });

  const profile = await prisma.mahasiswaProfile.findUnique({
    where: { userId: session.user.id },
    include: { tempatMagang: true },
  });

  const kantor = {
    nama: profile?.tempatMagang?.namaInstansi || "Kantor BMKG",
    alamat: profile?.tempatMagang?.alamat || "Stasiun Meteorologi / Kantor BMKG",
    latitude: profile?.tempatMagang?.latitudeKantor ?? KOORDINAT_KANTOR.latitude,
    longitude: profile?.tempatMagang?.longitudeKantor ?? KOORDINAT_KANTOR.longitude,
    radius: profile?.tempatMagang?.radiusAbsensiMeter ?? RADIUS_ABSENSI_METER,
  };

  return NextResponse.json({
    absensi: absensiHariIni,
    isLibur: infoLibur.isLibur,
    keteranganLibur: infoLibur.keterangan,
    kantor,
  });
}
