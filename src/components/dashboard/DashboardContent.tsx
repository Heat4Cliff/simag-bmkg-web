"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  FileText,
  BookOpen,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { formatTanggal, getStatusLaporanColor, getStatusLabel } from "@/lib/utils";
import MiniKalender from "./MiniKalender";
import { BlurText } from "@/components/ui/BlurText";
import dynamic from "next/dynamic";
const GrafikKehadiran = dynamic(() => import("./GrafikKehadiran"), { ssr: false });
const GrafikTrenAktivitas = dynamic(() => import("./GrafikTrenAktivitas"), { ssr: false });
const GrafikDistribusiAkun = dynamic(() => import("./GrafikDistribusiAkun"), { ssr: false });
const GrafikDistribusiDokumen = dynamic(() => import("./GrafikDistribusiDokumen"), { ssr: false });
const GrafikStatusAbsensi = dynamic(() => import("./GrafikStatusAbsensi"), { ssr: false });

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  href: string;
}

interface LaporanItem {
  id: string;
  judul: string;
  tanggal: string;
  status: string;
}

interface JadwalItem {
  id: string;
  judul: string;
  tanggal: string;
  jam?: string;
  tipe: string;
}

export default function DashboardContent() {
  const { data: session } = useSession();
  const user = session?.user;
  const role = (user as { role?: string })?.role ?? "MAHASISWA";

  const [laporanTerbaru, setLaporanTerbaru] = useState<LaporanItem[]>([]);
  const [jadwalTerdekat, setJadwalTerdekat] = useState<JadwalItem[]>([]);
  const [trenKehadiran, setTrenKehadiran] = useState<{ hari: string; hadir: number; telat: number }[]>([]);
  const [kalenderEvents, setKalenderEvents] = useState<number[]>([]);
  const [statusAbsensiList, setStatusAbsensiList] = useState({ hadir: 0, telat: 0, izin: 0, alpa: 0 });
  const [periodeMagang, setPeriodeMagang] = useState<{ mulai: string; selesai: string } | null>(null);
  const [trenAktivitas, setTrenAktivitas] = useState<{ hari: string; laporan: number; modul: number }[]>([]);
  const [distribusiAkun, setDistribusiAkun] = useState<{ role: string; count: number }[]>([]);
  const [distribusiDokumen, setDistribusiDokumen] = useState<{ status: string; count: number }[]>([]);
  const [aktivitasGlobal, setAktivitasGlobal] = useState<{ id: string; user: string; judul: string; tipe: string; waktu: string }[]>([]);
  
  const [stats, setStats] = useState({
    kehadiran: 0,
    laporan: 0,
    modul: 0,
    statusHariIni: "0",
  });

  const today = new Date();

  useEffect(() => {
    // Fetch dashboard data
    fetch("/api/dashboard/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats ?? stats);
        setLaporanTerbaru(data.laporanTerbaru ?? []);
        setJadwalTerdekat(data.jadwalTerdekat ?? []);
        setTrenKehadiran(data.trenKehadiran ?? []);
        setKalenderEvents(data.kalenderEvents ?? []);
        setStatusAbsensiList(data.statusAbsensiList ?? { hadir: 0, telat: 0, izin: 0, alpa: 0 });
        setPeriodeMagang(data.periodeMagang ?? null);
        setTrenAktivitas(data.trenAktivitas ?? []);
        setDistribusiAkun(data.distribusiAkun ?? []);
        setDistribusiDokumen(data.distribusiDokumen ?? []);
        setAktivitasGlobal(data.aktivitasGlobal ?? []);
      })
      .catch(() => {});
  }, []);

  // Stat cards berdasarkan role
  const statCards: StatCard[] =
    role === "MAHASISWA"
      ? [
          {
            label: "Kehadiran Bulan Ini",
            value: `${stats.kehadiran} Hari`,
            sub: "Hadir tepat waktu",
            icon: <CalendarCheck className="w-5 h-5" />,
            color: "text-green-700",
            bgColor: "bg-green-50",
            href: "/riwayat/absensi",
          },
          {
            label: "Laporan Terkirim",
            value: stats.laporan,
            sub: "Total laporan harian",
            icon: <FileText className="w-5 h-5" />,
            color: "text-green-700",
            bgColor: "bg-green-50",
            href: "/laporan-harian",
          },
          {
            label: "Modul Dibuat",
            value: stats.modul,
            sub: "Total modul praktikum",
            icon: <BookOpen className="w-5 h-5" />,
            color: "text-purple-700",
            bgColor: "bg-purple-50",
            href: "/modul-praktikum",
          },
          {
            label: "Status Hari Ini",
            value: stats.statusHariIni,
            sub: <span suppressHydrationWarning>{formatTanggal(today)}</span>,
            icon: <Clock className="w-5 h-5" />,
            color:
              stats.statusHariIni === "Hadir"
                ? "text-green-700"
                : stats.statusHariIni === "Belum Absen"
                ? "text-yellow-700"
                : "text-red-700",
            bgColor:
              stats.statusHariIni === "Hadir"
                ? "bg-green-50"
                : stats.statusHariIni === "Belum Absen"
                ? "bg-yellow-50"
                : "bg-red-50",
            href: "/absensi",
          },
        ]
      : role === "DPL"
      ? [
          {
            label: "Mahasiswa Bimbingan",
            value: stats.kehadiran,
            sub: "Aktif",
            icon: <CalendarCheck className="w-5 h-5" />,
            color: "text-green-700",
            bgColor: "bg-green-50",
            href: "/pembimbing/mahasiswa",
          },
          {
            label: "Laporan Pending",
            value: stats.laporan,
            sub: "Menunggu review",
            icon: <FileText className="w-5 h-5" />,
            color: "text-yellow-700",
            bgColor: "bg-yellow-50",
            href: "/laporan-harian",
          },
          {
            label: "Modul Pending",
            value: stats.modul,
            sub: "Menunggu review",
            icon: <BookOpen className="w-5 h-5" />,
            color: "text-purple-700",
            bgColor: "bg-purple-50",
            href: "/modul-praktikum",
          },
          {
            label: "Tingkat Kehadiran",
            value: `${stats.statusHariIni}%`,
            sub: "Rata-rata bimbingan",
            icon: <TrendingUp className="w-5 h-5" />,
            color: "text-green-700",
            bgColor: "bg-green-50",
            href: "/riwayat",
          },
        ]
      : [
          {
            label: "Peserta Aktif",
            value: stats.kehadiran,
            sub: "Total mahasiswa magang",
            icon: <CalendarCheck className="w-5 h-5" />,
            color: "text-green-700",
            bgColor: "bg-green-50",
            href: "/admin/akun",
          },
          {
            label: "Laporan Masuk Hari Ini",
            value: stats.laporan,
            sub: "Perlu ditindaklanjuti",
            icon: <FileText className="w-5 h-5" />,
            color: "text-green-700",
            bgColor: "bg-green-50",
            href: "/laporan-harian",
          },
          {
            label: "Total Pembimbing",
            value: stats.modul,
            sub: "Pembimbing aktif",
            icon: <BookOpen className="w-5 h-5" />,
            color: "text-purple-700",
            bgColor: "bg-purple-50",
            href: "/admin/akun",
          },
          {
            label: "Kehadiran Hari Ini",
            value: `${stats.statusHariIni}%`,
            sub: "Dari total peserta",
            icon: <TrendingUp className="w-5 h-5" />,
            color: "text-orange-700",
            bgColor: "bg-orange-50",
            href: "/riwayat",
          },
        ];

  let hariMagang = (stats as any).totalAbsensiDiisi || 0;
  let totalHariMagang = 90;
  let persentase = 0;
  
  if (periodeMagang?.mulai) {
    const start = new Date(periodeMagang.mulai);
    const end = periodeMagang.selesai 
      ? new Date(periodeMagang.selesai) 
      : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    // Total hari kalender magang (atau bisa total workdays, tapi kita asumsikan 90 hari total target)
    totalHariMagang = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (totalHariMagang <= 0) totalHariMagang = 90;
    
    // Asumsi rata-rata hari kerja adalah 5 hari per minggu (22 hari/bulan)
    // Jadi totalHariKerja ~ totalHariMagang * (5/7)
    let totalHariKerja = Math.round(totalHariMagang * (5 / 7));
    if (totalHariKerja <= 0) totalHariKerja = 64; // fallback

    persentase = Math.min(100, Math.round((hariMagang / totalHariKerja) * 100));
  }

  const sapaanCard = (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-[#1E8A3C] flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow">
          {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">Selamat datang,</p>
          <p className="text-sm font-bold text-gray-800 truncate">
            {user?.name ?? "Pengguna"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {role === "MAHASISWA"
              ? `Hari ke-${Math.max(1, hariMagang)} magang`
              : role === "DPL"
              ? "Pembimbing Magang"
              : "Administrator Sistem"}
          </p>
        </div>
      </div>
      {role === "MAHASISWA" && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Progres Magang</span>
            <span className="font-semibold text-[#1E8A3C]">
              {persentase}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1E8A3C] to-[#26A64B] rounded-full transition-all"
              style={{ width: `${persentase}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Periode magang {totalHariMagang} hari
          </p>
        </div>
      )}
      <Link
        href="/profil"
        className="flex items-center gap-1 text-xs text-[#1E8A3C] hover:underline mt-3"
      >
        Lihat profil <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span className="text-[#1E8A3C] font-medium">Dashboard</span>
      </div>

      {/* Main Grid: Konten Utama (kiri) + Panel Ringkasan (kanan) */}
      {(role === "SUPERADMIN" || role === "DPL") ? (
        <div className="space-y-6">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <Link key={i} href={card.href} className="card-hover">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">{card.label}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center ${card.color}`}>
                      {card.icon}
                    </div>
                  </div>
                  {card.sub && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      {card.sub}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Charts Row 1: Line Chart & Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <GrafikTrenAktivitas data={trenAktivitas} />
            {role === "SUPERADMIN" ? (
              <GrafikDistribusiAkun data={distribusiAkun} />
            ) : (
              <GrafikDistribusiDokumen data={distribusiDokumen} />
            )}
          </div>

          {/* Charts Row 2: Bar Chart & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
            <GrafikStatusAbsensi data={statusAbsensiList as any} />
            
            {/* Tabel Aktivitas Terkini */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-[380px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">Aktivitas Terkini</h3>
                  <p className="text-xs text-gray-500">Laporan dan modul praktikum yang baru masuk</p>
                </div>
              </div>
              <div className="flex-1 overflow-auto -mx-5 px-5">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">Pengguna</th>
                      <th className="px-4 py-3 font-medium">Judul</th>
                      <th className="px-4 py-3 font-medium">Tipe</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {aktivitasGlobal.length > 0 ? aktivitasGlobal.map((act) => (
                      <tr key={act.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{act.user}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={act.judul}>{act.judul}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${act.tipe === 'Laporan' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                            {act.tipe}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatTanggal(new Date(act.waktu))}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Belum ada aktivitas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        {/* ─── KOLOM KIRI ─── */}
        <div className={`min-w-0 space-y-5 ${role !== "MAHASISWA" ? "order-2 xl:order-1" : "order-1"}`}>

          {/* Quick Action - Absen (hanya Mahasiswa) */}
          {role === "MAHASISWA" && (
            <div className="bg-gradient-to-r from-[#1E8A3C] to-[#26A64B] rounded-2xl p-5 text-white flex items-center justify-between shadow-lg">
              <div>
                <p suppressHydrationWarning className="text-green-200 text-xs font-medium mb-1">
                  {formatTanggal(today)}
                </p>
                <BlurText 
                  text="Sudah Absen Hari Ini?"
                  delay={0.05}
                  className="text-lg font-bold mb-1 justify-start"
                />
                <p className="text-green-200 text-sm">
                  {stats.statusHariIni === "Hadir"
                    ? "✅ Absensi Anda sudah tercatat."
                    : "Jangan lupa absen masuk sebelum jam kerja!"}
                </p>
              </div>
              <Link
                href="/absensi"
                className="flex items-center gap-2 bg-white text-[#1E8A3C] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors flex-shrink-0 shadow"
              >
                <Zap className="w-4 h-4" />
                Absen Sekarang
              </Link>
            </div>
          )}

          {/* Kartu Sapaan Khusus Mahasiswa (Mobile) */}
          {role === "MAHASISWA" && (
            <div className="xl:hidden">
              {sapaanCard}
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <Link key={i} href={card.href} className="card-hover">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-full">
                  <div
                    className={`w-9 h-9 rounded-xl ${card.bgColor} flex items-center justify-center mb-3 ${card.color}`}
                  >
                    {card.icon}
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</p>
                  {card.sub && (
                    <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Grafik Kehadiran */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Tren Kehadiran
                </h3>
                <p className="text-xs text-gray-400">4 minggu terakhir</p>
              </div>
              <Link
                href="/riwayat/absensi"
                className="text-xs text-[#1E8A3C] hover:underline flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <GrafikKehadiran data={trenKehadiran} />
          </div>

          {/* Laporan Terbaru */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Laporan Terbaru
                </h3>
                <p className="text-xs text-gray-400">5 laporan terakhir</p>
              </div>
              <Link
                href="/laporan-harian"
                className="text-xs text-[#1E8A3C] hover:underline flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {laporanTerbaru.length === 0 ? (
              <EmptyState
                title="Belum ada laporan"
                desc="Buat laporan harian pertama Anda sekarang!"
                icon={<FileText className="w-10 h-10 text-gray-300" />}
              />
            ) : (
              <div className="space-y-2">
                {laporanTerbaru.map((l) => (
                  <Link
                    key={l.id}
                    href={`/laporan-harian/${l.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#1E8A3C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#1E8A3C] transition-colors">
                        {l.judul}
                      </p>
                      <p className="text-xs text-gray-400">{l.tanggal}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${getStatusLaporanColor(l.status)}`}
                    >
                      {getStatusLabel(l.status)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── KOLOM KANAN ─── */}
        <div className={`min-w-0 space-y-4 ${role !== "MAHASISWA" ? "order-1 xl:order-2" : "order-2"}`}>
          {/* Kartu Sapaan */}
          {role === "MAHASISWA" ? (
            <div className="hidden xl:block">
              {sapaanCard}
            </div>
          ) : (
            sapaanCard
          )}

          {/* Mini Kalender */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📅</span> Kalender Kegiatan
            </h3>
            <MiniKalender tanggalEvent={kalenderEvents} />
          </div>

          {/* Jadwal Terdekat */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">
                Jadwal Terdekat
              </h3>
              <Link
                href="/kalender"
                className="text-xs text-[#1E8A3C] hover:underline"
              >
                Lihat Semua
              </Link>
            </div>

            {jadwalTerdekat.length === 0 ? (
              <EmptyState
                title="Tidak ada jadwal"
                desc="Tambahkan kegiatan di kalender"
                icon={<CheckCircle2 className="w-8 h-8 text-gray-300" />}
                small
              />
            ) : (
              <div className="space-y-2">
                {jadwalTerdekat.map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-green-50/50 border border-green-100"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#1E8A3C] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {j.judul}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {j.tanggal}
                        {j.jam ? ` • ${j.jam}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Absensi (hanya Mahasiswa) */}
          {role === "MAHASISWA" && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-3">
                Status Absensi
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Hadir", count: statusAbsensiList.hadir, color: "bg-green-500" },
                  { label: "Izin", count: statusAbsensiList.izin, color: "bg-green-500" },
                  { label: "Alpa", count: statusAbsensiList.alpa, color: "bg-red-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-gray-600 flex-1">{item.label}</span>
                    <span className="text-xs font-bold text-gray-800">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-100">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                <p className="text-[10px] text-yellow-700">
                  Jam masuk: 07:00 – Jam pulang: 14:30
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  desc,
  icon,
  small = false,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${small ? "py-4" : "py-8"}`}>
      <div className="mb-2">{icon}</div>
      <p className={`font-semibold text-gray-500 ${small ? "text-xs" : "text-sm"}`}>
        {title}
      </p>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );
}
