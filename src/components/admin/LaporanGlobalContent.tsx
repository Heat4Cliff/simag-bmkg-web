"use client";

import { useState, useEffect } from "react";
import { Download, Users, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";
import { getStatusLaporanColor, getStatusLabel, formatTanggalCompact } from "@/lib/utils";
import Link from "next/link";

interface GlobalStats {
  totalMahasiswa: number;
  HADIR: number;
  IZIN: number;
  SAKIT: number;
  ALPA: number;
}

interface RecentLaporan {
  id: string;
  nama: string;
  judul: string;
  tanggal: string;
  status: string;
}

export default function LaporanGlobalContent() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [recentLaporan, setRecentLaporan] = useState<RecentLaporan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/laporan-global")
      .then(res => res.json())
      .then(data => {
        setStats(data.stats);
        setRecentLaporan(data.recentLaporan);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    window.open("/api/admin/laporan-global/export", "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span>Administrasi</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Laporan Global</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Laporan Global</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analitik dan rekapitulasi data dari seluruh mahasiswa.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Absensi
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" /></div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Users className="w-4 h-4" /> <span className="text-sm font-medium">Mahasiswa</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.totalMahasiswa}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm bg-green-50/30">
              <div className="text-green-600 text-sm font-semibold mb-2">Total Hadir</div>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.HADIR}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm bg-orange-50/30">
              <div className="text-orange-600 text-sm font-semibold mb-2">Total Izin</div>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.IZIN}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm bg-yellow-50/30">
              <div className="text-yellow-600 text-sm font-semibold mb-2">Total Sakit</div>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.SAKIT}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm bg-red-50/30">
              <div className="text-red-600 text-sm font-semibold mb-2">Total Alpa</div>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.ALPA}</h3>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1E8A3C]" /> Laporan Harian Terbaru
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Nama Mahasiswa</th>
                    <th className="px-6 py-3">Judul Kegiatan</th>
                    <th className="px-6 py-3">Tanggal</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentLaporan.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">Belum ada laporan harian.</td>
                    </tr>
                  ) : (
                    recentLaporan.map(laporan => (
                      <tr key={laporan.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3.5 font-medium text-gray-800">{laporan.nama}</td>
                        <td className="px-6 py-3.5 text-gray-600">{laporan.judul}</td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {formatTanggalCompact(new Date(laporan.tanggal))}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusLaporanColor(laporan.status)}`}>
                            {getStatusLabel(laporan.status)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <Link href={`/laporan-harian/${laporan.id}`} className="text-[#1E8A3C] hover:underline font-medium text-sm">
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
