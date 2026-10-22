"use client";

import { useState, useEffect } from "react";
import { Search, GraduationCap, AlertCircle, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { formatTanggalCompact } from "@/lib/utils";

interface MahasiswaData {
  id: string;
  nama: string;
  institusi: string;
  periodeSelesai: string;
  pendingLaporan: number;
  lastAbsen: { status: string; tanggal: string } | null;
}

export default function DataMahasiswaContent() {
  const [mahasiswa, setMahasiswa] = useState<MahasiswaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/pembimbing/mahasiswa")
      .then(res => res.json())
      .then(data => setMahasiswa(data.mahasiswa || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = mahasiswa.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span>Bimbingan</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Data Mahasiswa</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Mahasiswa Bimbingan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Daftar mahasiswa magang yang berada di bawah bimbingan Anda.</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari mahasiswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#1E8A3C]" /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            <GraduationCap className="w-10 h-10 mx-auto text-gray-200 mb-2" />
            <p>Tidak ada data mahasiswa ditemukan.</p>
          </div>
        ) : (
          filtered.map(m => (
            <div key={m.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-50 text-[#1E8A3C] flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {m.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 leading-tight">{m.nama}</h3>
                  <p className="text-xs text-gray-500 mt-1">{m.institusi}</p>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Laporan Menunggu Review</span>
                  {m.pendingLaporan > 0 ? (
                    <span className="inline-flex items-center gap-1 font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs">
                      <AlertCircle className="w-3 h-3" /> {m.pendingLaporan}
                    </span>
                  ) : (
                    <span className="font-bold text-gray-800">0</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Selesai Magang</span>
                  <span className="font-semibold text-gray-800">
                    {formatTanggalCompact(new Date(m.periodeSelesai))}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link 
                  href={`/laporan-harian?search=${m.nama}`}
                  className="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-[#1E8A3C] font-semibold py-2 rounded-xl text-sm transition-colors flex items-center justify-center"
                >
                  Lihat Laporan
                </Link>
                <a
                  href={`/api/laporan-harian/export-global?userId=${m.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Unduh Rekap Logbook Lengkap (DOCX)"
                  className="px-3 py-2 bg-green-50 hover:bg-green-100 text-[#1E8A3C] rounded-xl flex items-center justify-center transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
