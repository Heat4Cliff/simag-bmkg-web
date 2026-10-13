export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hitungJarakMeter } from "@/lib/utils";
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

    const infoLibur = cekLibur(new Date());
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

    const finalLat = latitude || 0;
    const finalLon = longitude || 0;

    // Ambil profile mahasiswa untuk cek tempat magang
    const profile = await prisma.mahasiswaProfile.findUnique({
      where: { userId },
      include: { tempatMagang: true }
    });

    let lokasiValid = true;
    let jarak = 0;

    if (profile?.tempatMagang?.latitude && profile?.tempatMagang?.longitude) {
      jarak = hitungJarakMeter(
        finalLat,
        finalLon,
        profile.tempatMagang.latitude,
        profile.tempatMagang.longitude
      );
      if (jarak > profile.tempatMagang.radiusAbsen) {
        lokasiValid = false;
      }
    }

    if (!lokasiValid) {
      return NextResponse.json({ error: `Lokasi Anda berada di luar radius absensi (${Math.round(jarak)}m).` }, { status: 400 });
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
      lokasiValid: true,
      jarak: 0,
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

  const infoLibur = cekLibur(today);

  return NextResponse.json({ absensi: absensiHariIni, isLibur: infoLibur.isLibur, keteranganLibur: infoLibur.keterangan });
}
