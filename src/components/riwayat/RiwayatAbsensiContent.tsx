"use client";
import { useState, useEffect } from "react";
import { Loader2, Calendar, Clock, MapPin, Search } from "lucide-react";
import ApexChartWrapper from "@/components/ui/ApexChartWrapper";
import { formatTanggal, formatWaktu } from "@/lib/utils";

interface Absensi {
  id: string;
  tanggal: string;
  jamMasuk: string | null;
  jamPulang: string | null;
  status: string;
  keterangan: string | null;
  lampiranUrl: string | null;
}

const COLORS: Record<string, string> = {
  HADIR: "#10B981", // green-500
  TELAT: "#F59E0B", // amber-500
  IZIN: "#3B82F6",  // green-500
  SAKIT: "#8B5CF6", // purple-500
  ALPA: "#EF4444"   // red-500
};

export default function RiwayatAbsensiContent() {
  const [riwayat, setRiwayat] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/riwayat/absensi")
      .then((res) => res.json())
      .then((data) => setRiwayat(data.riwayat || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HADIR": return "bg-green-100 text-green-700";
      case "TELAT": return "bg-orange-100 text-orange-700";
      case "IZIN": return "bg-green-100 text-green-700";
      case "SAKIT": return "bg-purple-100 text-purple-700";
      default: return "bg-red-100 text-red-700"; // ALPA
    }
  };

  const filtered = riwayat.filter(r => {
    const dateStr = formatTanggal(new Date(r.tanggal)).toLowerCase();
    return dateStr.includes(search.toLowerCase());
  });

  // Calculate data for Pie Chart
  const statusCounts = riwayat.reduce((acc, curr) => {
    const status = curr.status || "ALPA";
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
        <span className="text-[#1E8A3C] font-medium">Riwayat Absensi</span>
      </div>

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Riwayat Kehadiran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rekam jejak absensi Anda selama magang.</p>
        </div>
      </div>



      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Statistik Kehadiran</h2>
          <div className="h-64 w-full flex justify-center items-center">
            <ApexChartWrapper
              options={{
                chart: {
                  type: "donut",
                  fontFamily: "inherit",
                },
                labels: chartData.map(d => d.name),
                colors: chartData.map(d => COLORS[d.name] || COLORS.ALPA),
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

      {!loading && riwayat.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-[11px] text-green-500 font-bold uppercase tracking-wider mb-1">Total Kehadiran</span>
            <span className="text-2xl font-bold text-gray-800">{(statusCounts["HADIR"] || 0) + (statusCounts["TELAT"] || 0)} <span className="text-sm text-gray-400 font-medium">hari</span></span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-[11px] text-green-500 font-bold uppercase tracking-wider mb-1">Total Izin</span>
            <span className="text-2xl font-bold text-gray-800">{statusCounts["IZIN"] || 0} <span className="text-sm text-gray-400 font-medium">hari</span></span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-[11px] text-purple-500 font-bold uppercase tracking-wider mb-1">Total Sakit</span>
            <span className="text-2xl font-bold text-gray-800">{statusCounts["SAKIT"] || 0} <span className="text-sm text-gray-400 font-medium">hari</span></span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-[11px] text-red-500 font-bold uppercase tracking-wider mb-1">Total Alpa</span>
            <span className="text-2xl font-bold text-gray-800">{statusCounts["ALPA"] || 0} <span className="text-sm text-gray-400 font-medium">hari</span></span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari tanggal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Tanggal</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Jam Masuk</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Jam Pulang</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Keterangan</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1E8A3C] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Belum ada riwayat absensi
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                      {formatTanggal(new Date(item.tanggal))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {item.jamMasuk ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-green-500" />
                          {formatWaktu(new Date(item.jamMasuk))}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {item.jamPulang ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-green-500" />
                          {formatWaktu(new Date(item.jamPulang))}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs capitalize max-w-[200px]">
                      <div className="flex flex-col gap-1">
                        <span className="truncate" title={item.keterangan || ""}>{item.keterangan?.includes("Shift") ? "Hadir" : (item.keterangan || (item.status === "HADIR" ? "Hadir" : "-"))}</span>
                        {item.lampiranUrl && (
                          <a href={item.lampiranUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            Lihat Surat
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
