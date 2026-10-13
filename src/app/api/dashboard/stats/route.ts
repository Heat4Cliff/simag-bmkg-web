export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, eachDayOfInterval, format } from "date-fns";
import { id } from "date-fns/locale";
import { formatTanggalCompact, getJakartaMonthStartISO, getJakartaMonthEndISO, getJakartaDateISO } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role;
  const today = new Date();
  const monthStart = getJakartaMonthStartISO();
  const monthEnd = getJakartaMonthEndISO();
  const todayStart = getJakartaDateISO(); // UTC midnight based on Jakarta date
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1); // 23:59:59.999

  let stats = { kehadiran: 0, laporan: 0, modul: 0, statusHariIni: "Belum Absen", totalAbsensiDiisi: 0 };
  let laporanTerbaru: {id: string; judul: string; tanggal: string; status: string; penulis?: string; tipe?: string}[] = [];
  let jadwalTerdekat: {id: string; judul: string; tanggal: string; jam?: string; tipe: string}[] = [];
  
  // Custom Analytics Data
  let trenAktivitas: { hari: string; laporan: number; modul: number }[] = [];
  let distribusiAkun: { role: string; count: number }[] = [];
  let distribusiDokumen: { status: string; count: number }[] = [];
  let aktivitasGlobal: { id: string; user: string; judul: string; tipe: string; waktu: string }[] = [];
  
  let trenKehadiran: { hari: string; hadir: number; telat: number }[] = [];
  let kalenderEvents: number[] = [];
  let statusAbsensiList = { hadir: 0, telat: 0, izin: 0, alpa: 0 };
  let periodeMagang = null;

  if (role === "MAHASISWA") {
    // Kehadiran bulan ini
    const kehadiran = await prisma.absensi.count({
      where: { userId, tanggal: { gte: monthStart, lte: monthEnd }, status: "HADIR" },
    });

    // Total laporan
    const laporan = await prisma.laporanHarian.count({ where: { userId } });

    // Total modul
    const modul = await prisma.modulPraktikum.count({ where: { userId } });

    // Status absensi hari ini
    const absenHariIni = await prisma.absensi.findFirst({
      where: { userId, tanggal: { gte: todayStart, lte: todayEnd } },
    });
    const statusHariIni = absenHariIni ? absenHariIni.status : "Belum Absen";

    // Total seluruh absensi yang diisi
    const totalAbsensiDiisi = await prisma.absensi.count({
      where: { userId }
    });

    stats = { kehadiran, laporan, modul, statusHariIni, totalAbsensiDiisi };

    // Laporan terbaru
    const laporan5 = await prisma.laporanHarian.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    laporanTerbaru = laporan5.map((l) => ({
      id: l.id,
      judul: l.judul,
      tanggal: formatTanggalCompact(l.tanggal),
      status: l.status,
    }));

    // Data tambahan untuk grafik & progres (Khusus Mahasiswa)
    const fourWeeksAgo = subDays(today, 28);
    const absensi4Weeks = await prisma.absensi.findMany({
      where: { userId, tanggal: { gte: fourWeeksAgo, lte: today } }
    });

    trenKehadiran = eachDayOfInterval({ start: fourWeeksAgo, end: today })
      .filter(d => d.getDay() >= 1 && d.getDay() <= 5) // Senin - Jumat
      .map(d => {
        const dFormat = format(d, "yyyy-MM-dd");
        const abs = absensi4Weeks.find(a => format(a.tanggal, "yyyy-MM-dd") === dFormat);
        // format lokal id: "Sen 1"
        const hariStr = format(d, "E d", { locale: id });
        return {
          hari: hariStr,
          hadir: abs?.status === "HADIR" ? 1 : 0,
          telat: abs?.status === "TELAT" ? 1 : 0
        };
      });

    const absensiBulanIni = await prisma.absensi.findMany({
      where: { userId, tanggal: { gte: monthStart, lte: monthEnd } },
      select: { status: true }
    });
    statusAbsensiList = {
      hadir: absensiBulanIni.filter(a => a.status === "HADIR").length,
      telat: absensiBulanIni.filter(a => a.status === "TELAT").length,
      izin: absensiBulanIni.filter(a => a.status === "IZIN").length,
      alpa: absensiBulanIni.filter(a => a.status === "ALPA").length,
    };

    const mhsProfile = await prisma.mahasiswaProfile.findUnique({
      where: { userId },
      select: { periodeMulai: true, periodeSelesai: true }
    });
    if (mhsProfile && mhsProfile.periodeMulai && mhsProfile.periodeSelesai) {
      periodeMagang = {
        mulai: mhsProfile.periodeMulai.toISOString(),
        selesai: mhsProfile.periodeSelesai.toISOString()
      };
    }
  } else if (role === "DPL") {
    const dplProfile = await prisma.dplProfile.findUnique({ where: { userId } });
    const totalMhs = await prisma.mahasiswaProfile.count({
      where: { dplId: dplProfile?.id },
    });
    const mhsIds = await prisma.mahasiswaProfile.findMany({
      where: { dplId: dplProfile?.id },
      select: { userId: true },
    });
    const userIds = mhsIds.map((m) => m.userId);

    const pendingLaporan = await prisma.laporanHarian.count({
      where: { userId: { in: userIds }, status: "TERKIRIM" },
    });
    const pendingModul = await prisma.modulPraktikum.count({
      where: { userId: { in: userIds }, statusReview: "TERKIRIM" },
    });

    const absenHariIni = await prisma.absensi.count({
      where: { userId: { in: userIds }, tanggal: { gte: todayStart, lte: todayEnd }, status: "HADIR" },
    });
    const absenTelat = await prisma.absensi.count({
      where: { userId: { in: userIds }, tanggal: { gte: todayStart, lte: todayEnd }, status: "TELAT" },
    });
    const absenIzin = await prisma.absensi.count({
      where: { userId: { in: userIds }, tanggal: { gte: todayStart, lte: todayEnd }, status: "IZIN" },
    });
    const absenSakit = await prisma.absensi.count({
      where: { userId: { in: userIds }, tanggal: { gte: todayStart, lte: todayEnd }, status: "SAKIT" },
    });
    const absenAlpa = await prisma.absensi.count({
      where: { userId: { in: userIds }, tanggal: { gte: todayStart, lte: todayEnd }, status: "ALPA" },
    });

    const persen = totalMhs > 0 ? Math.round(((absenHariIni + absenTelat) / totalMhs) * 100) : 0;

    stats = { kehadiran: totalMhs, laporan: pendingLaporan, modul: pendingModul, statusHariIni: String(persen), totalAbsensiDiisi: 0 };

    statusAbsensiList = {
      hadir: absenHariIni,
      telat: absenTelat,
      izin: absenIzin,
      alpa: absenAlpa,
      // @ts-ignore
      sakit: absenSakit
    };

    // Distribusi Dokumen
    const allLaporan = await prisma.laporanHarian.findMany({ where: { userId: { in: userIds } }, select: { status: true } });
    const allModul = await prisma.modulPraktikum.findMany({ where: { userId: { in: userIds } }, select: { statusReview: true } });
    
    const countDisetujui = allLaporan.filter(l => l.status === "DISETUJUI").length + allModul.filter(m => m.statusReview === "DISETUJUI").length;
    const countRevisi = allLaporan.filter(l => l.status === "REVISI").length + allModul.filter(m => m.statusReview === "REVISI").length;
    const countTerkirim = allLaporan.filter(l => l.status === "TERKIRIM").length + allModul.filter(m => m.statusReview === "TERKIRIM").length;

    distribusiDokumen = [
      { status: "Disetujui", count: countDisetujui },
      { status: "Revisi", count: countRevisi },
      { status: "Menunggu Review", count: countTerkirim }
    ];

    // Tren Aktivitas (7 Hari Terakhir)
    const sevenDaysAgo = subDays(today, 6);
    const laporan7Days = await prisma.laporanHarian.findMany({
      where: { userId: { in: userIds }, createdAt: { gte: startOfDay(sevenDaysAgo) } },
      select: { createdAt: true }
    });
    const modul7Days = await prisma.modulPraktikum.findMany({
      where: { userId: { in: userIds }, createdAt: { gte: startOfDay(sevenDaysAgo) } },
      select: { createdAt: true }
    });

    trenAktivitas = eachDayOfInterval({ start: sevenDaysAgo, end: today }).map(d => {
      const dFormat = format(d, "yyyy-MM-dd");
      const dFormatId = format(d, "E d", { locale: id });
      const jmlLaporan = laporan7Days.filter(l => format(l.createdAt, "yyyy-MM-dd") === dFormat).length;
      const jmlModul = modul7Days.filter(m => format(m.createdAt, "yyyy-MM-dd") === dFormat).length;
      return {
        hari: dFormatId,
        laporan: jmlLaporan,
        modul: jmlModul
      };
    });

    // Aktivitas Global Terkini
    const lapRecent = await prisma.laporanHarian.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { nama: true } } }
    });
    const modRecent = await prisma.modulPraktikum.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { nama: true } } }
    });

    const combinedActivities = [
      ...lapRecent.map(l => ({
        id: "l_" + l.id,
        user: l.user?.nama || "Unknown",
        judul: l.judul || "Laporan Harian",
        tipe: "Laporan",
        waktu: l.createdAt.toISOString(),
        timeObj: l.createdAt
      })),
      ...modRecent.map(m => ({
        id: "m_" + m.id,
        user: m.user?.nama || "Unknown",
        judul: m.judulTopik || "Modul Praktikum",
        tipe: "Modul",
        waktu: m.createdAt.toISOString(),
        timeObj: m.createdAt
      }))
    ];
    
    combinedActivities.sort((a, b) => b.timeObj.getTime() - a.timeObj.getTime());
    aktivitasGlobal = combinedActivities.slice(0, 7).map(({ timeObj, ...rest }) => rest);
  } else if (role === "SUPERADMIN") {
    const totalMhs = await prisma.mahasiswaProfile.count();
    const pembimbing = await prisma.dplProfile.count();
    const adminCount = await prisma.user.count({ where: { role: "SUPERADMIN" } });
    
    // Overview Stats
    const laporanHariIni = await prisma.laporanHarian.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    });
    const absenHariIni = await prisma.absensi.count({
      where: { tanggal: { gte: todayStart, lte: todayEnd }, status: "HADIR" },
    });
    const absenTelat = await prisma.absensi.count({
      where: { tanggal: { gte: todayStart, lte: todayEnd }, status: "TELAT" },
    });
    const absenIzin = await prisma.absensi.count({
      where: { tanggal: { gte: todayStart, lte: todayEnd }, status: "IZIN" },
    });
    const absenSakit = await prisma.absensi.count({
      where: { tanggal: { gte: todayStart, lte: todayEnd }, status: "SAKIT" },
    });
    const absenAlpa = await prisma.absensi.count({
      where: { tanggal: { gte: todayStart, lte: todayEnd }, status: "ALPA" },
    });

    const persen = totalMhs > 0 ? Math.round(((absenHariIni + absenTelat) / totalMhs) * 100) : 0;
    
    // Using stats object for main cards
    stats = { 
      kehadiran: totalMhs, // Digunakan untuk Total Mahasiswa
      modul: pembimbing,   // Digunakan untuk Total Pembimbing
      laporan: await prisma.laporanHarian.count(), // Total Laporan Global
      statusHariIni: String(persen), 
      totalAbsensiDiisi: 0 
    };

    statusAbsensiList = {
      hadir: absenHariIni,
      telat: absenTelat,
      izin: absenIzin,
      alpa: absenAlpa,
      // @ts-ignore
      sakit: absenSakit
    };

    distribusiAkun = [
      { role: "Mahasiswa", count: totalMhs },
      { role: "Pembimbing", count: pembimbing },
      { role: "Admin", count: adminCount }
    ];

    // Tren Aktivitas (7 Hari Terakhir)
    const sevenDaysAgo = subDays(today, 6);
    const laporan7Days = await prisma.laporanHarian.findMany({
      where: { createdAt: { gte: startOfDay(sevenDaysAgo) } },
      select: { createdAt: true }
    });
    const modul7Days = await prisma.modulPraktikum.findMany({
      where: { createdAt: { gte: startOfDay(sevenDaysAgo) } },
      select: { createdAt: true }
    });

    trenAktivitas = eachDayOfInterval({ start: sevenDaysAgo, end: today }).map(d => {
      const dFormat = format(d, "yyyy-MM-dd");
      const dFormatId = format(d, "E d", { locale: id });
      const jmlLaporan = laporan7Days.filter(l => format(l.createdAt, "yyyy-MM-dd") === dFormat).length;
      const jmlModul = modul7Days.filter(m => format(m.createdAt, "yyyy-MM-dd") === dFormat).length;
      return {
        hari: dFormatId,
        laporan: jmlLaporan,
        modul: jmlModul
      };
    });

    // Aktivitas Global Terkini
    const lapRecent = await prisma.laporanHarian.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { nama: true } } }
    });
    const modRecent = await prisma.modulPraktikum.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { nama: true } } }
    });

    const combinedActivities = [
      ...lapRecent.map(l => ({
        id: "l_" + l.id,
        user: l.user?.nama || "Unknown",
        judul: l.judul || "Laporan Harian",
        tipe: "Laporan",
        waktu: l.createdAt.toISOString(),
        timeObj: l.createdAt
      })),
      ...modRecent.map(m => ({
        id: "m_" + m.id,
        user: m.user?.nama || "Unknown",
        judul: m.judulTopik || "Modul Praktikum",
        tipe: "Modul",
        waktu: m.createdAt.toISOString(),
        timeObj: m.createdAt
      }))
    ];
    
    combinedActivities.sort((a, b) => b.timeObj.getTime() - a.timeObj.getTime());
    aktivitasGlobal = combinedActivities.slice(0, 7).map(({ timeObj, ...rest }) => rest);
  }

  // Jadwal terdekat
  const jadwal = await prisma.jadwalKegiatan.findMany({
    where: {
      OR: [{ userId }, { tipe: "INSTANSI" }],
      tanggal: { gte: todayStart },
    },
    orderBy: { tanggal: "asc" },
    take: 5,
  });
  jadwalTerdekat = jadwal.map((j) => ({
    id: j.id,
    judul: j.judul,
    tanggal: formatTanggalCompact(j.tanggal),
    jam: j.jam ?? undefined,
    tipe: j.tipe,
  }));

  // Kalender events (semua event bulan ini)
  const jadwalBulanIni = await prisma.jadwalKegiatan.findMany({
    where: { 
      OR: [{ userId }, { tipe: "INSTANSI" }],
      tanggal: { gte: monthStart, lte: monthEnd }
    },
    select: { tanggal: true }
  });
  kalenderEvents = Array.from(new Set(jadwalBulanIni.map(j => j.tanggal.getDate())));

  return NextResponse.json({ 
    stats, 
    laporanTerbaru, 
    jadwalTerdekat,
    trenKehadiran,
    trenAktivitas,
    distribusiAkun,
    distribusiDokumen,
    aktivitasGlobal,
    kalenderEvents,
    statusAbsensiList,
    periodeMagang
  });
}
