"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, FileText, ChevronRight, ChevronLeft } from "lucide-react";
import ApexChartWrapper from "@/components/ui/ApexChartWrapper";
import Link from "next/link";
import { getStatusLaporanColor, getStatusLabel, formatTanggal } from "@/lib/utils";

interface LaporanRiwayat {
  id: string;
  tanggal: string;
  judul: string;
  status: string;
  createdAt: string;
}

const COLORS: Record<string, string> = {
  DRAFT: "#9CA3AF",      // gray-400
  TERKIRIM: "#3B82F6",   // green-500
  DIREVIEW: "#F59E0B",   // amber-500
  DISETUJUI: "#10B981",  // green-500
  REVISI: "#F97316",     // orange-500
  DITOLAK: "#EF4444",    // red-500
};

export default function RiwayatLaporanContent() {
  const [riwayat, setRiwayat] = useState<LaporanRiwayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    fetch("/api/riwayat/laporan")
      .then((res) => res.json())
      .then((data) => setRiwayat(data.riwayat || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = riwayat.filter(r => {
    const searchLower = search.toLowerCase();
    const dateStr = formatTanggal(new Date(r.tanggal)).toLowerCase();
    return dateStr.includes(searchLower) || r.judul.toLowerCase().includes(searchLower);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Calculate data for Pie Chart
  const statusCounts = riwayat.reduce((acc, curr) => {
    const status = curr.status || "DRAFT";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Riwayat Laporan</span>
      </div>

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Riwayat Laporan Harian</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daftar seluruh laporan kegiatan yang pernah Anda buat.</p>
        </div>
      </div>

      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Statistik Laporan</h2>
          <div className="h-64 w-full flex justify-center items-center">
            <ApexChartWrapper
              options={{
                chart: {
                  type: "donut",
                  fontFamily: "inherit",
                },
                labels: chartData.map(d => d.name),
                colors: chartData.map(d => COLORS[d.name] || COLORS.DRAFT),
                legend: {
                  position: "bottom",
                },
                plotOptions: {
                  pie: {
                    donut: {
                      size: "60%",
                    }
                  }
                },
                dataLabels: {
                  enabled: false
                }
              }}
              series={chartData.map(d => d.value)}
              type="donut"
              width="100%"
              height="100%"
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul atau tanggal laporan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">Belum ada riwayat laporan harian</p>
          </div>
        ) : (
          paginated.map((item) => (
            <Link
              key={item.id}
              href={`/laporan-harian/${item.id}`}
              className="group flex flex-col bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#1E8A3C]/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusLaporanColor(item.status)} ring-1 ring-inset ring-black/5`}>
                  {getStatusLabel(item.status)}
                </span>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                  {formatTanggal(new Date(item.tanggal))}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-[#1E8A3C] transition-colors">{item.judul}</h3>
              
              <div className="mt-auto pt-4 flex items-center justify-between text-[#1E8A3C] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <span className="text-sm font-semibold flex items-center gap-1">Detail Laporan <ChevronRight className="w-4 h-4" /></span>
              </div>
            </Link>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                  currentPage === i + 1 
                    ? "bg-[#1E8A3C] text-white" 
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
