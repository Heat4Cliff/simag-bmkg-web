"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, FileText, Search, Filter, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getStatusLaporanColor, getStatusLabel } from "@/lib/utils";
import { toast } from "sonner";

interface Laporan {
  id: string;
  judul: string;
  tanggal: string;
  status: string;
  deskripsi: string;
}

export default function LaporanContent() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("SEMUA");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    fetch("/api/laporan-harian")
      .then((r) => r.json())
      .then((data) => setLaporan(data.laporan ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadGlobal = async () => {
    try {
      setDownloading(true);
      toast.info("Sedang menyiapkan dokumen logbook lengkap...");
      const res = await fetch("/api/laporan-harian/export-global");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Gagal mengunduh logbook" }));
        toast.error(errorData.error || "Gagal mengunduh logbook");
        return;
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "Logbook_Lengkap_Magang.docx";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Dokumen logbook berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengunduh dokumen");
    } finally {
      setDownloading(false);
    }
  };

  const filtered = laporan.filter((l) => {
    const matchSearch = l.judul.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "SEMUA" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  const STATUS_OPTIONS = ["SEMUA", "DRAFT", "TERKIRIM", "DIREVIEW", "DISETUJUI", "REVISI", "DITOLAK"];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Laporan Harian</span>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Laporan Harian</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {role === "MAHASISWA" ? "Buat dan kelola laporan kegiatan harian Anda." : "Review dan kelola laporan mahasiswa."}
          </p>
        </div>
        {role === "MAHASISWA" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadGlobal}
              disabled={downloading}
              className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm disabled:opacity-50"
              title="Unduh seluruh rekap logbook harian dari hari pertama hingga selesai"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#1E8A3C]" />
              ) : (
                <Download className="w-4 h-4 text-[#1E8A3C]" />
              )}
              <span className="hidden sm:inline">Download Logbook Global</span>
              <span className="sm:hidden">Logbook</span>
            </button>
            <Link
              href="/laporan-harian/baru"
              className="flex items-center gap-2 bg-[#1E8A3C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#166c2f] transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> <span>Buat Laporan</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari laporan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "SEMUA" ? "Semua Status" : getStatusLabel(s)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Daftar Laporan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#1E8A3C]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">Belum ada laporan</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || filterStatus !== "SEMUA" ? "Tidak ada laporan yang sesuai filter." : "Buat laporan harian pertama Anda!"}
            </p>
            {role === "MAHASISWA" && !search && filterStatus === "SEMUA" && (
              <Link
                href="/laporan-harian/baru"
                className="inline-flex items-center gap-2 mt-4 bg-[#1E8A3C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0d5cc5] transition-colors"
              >
                <Plus className="w-4 h-4" /> Buat Laporan Pertama
              </Link>
            )}
          </div>
        ) : (
          paginated.map((l) => (
            <div key={l.id} className="relative group h-full">
              {/* Background stacked card effect */}
              <div className="absolute inset-0 bg-[#e2e8f0] rounded-2xl border border-gray-300 shadow-sm transform rotate-1 translate-x-1.5 translate-y-1.5 group-hover:rotate-2 group-hover:translate-x-2.5 group-hover:translate-y-2.5 transition-all duration-300"></div>
              
              <Link
                href={`/laporan-harian/${l.id}`}
                className="relative flex flex-col bg-white rounded-2xl p-5 border border-gray-200 h-full transition-transform duration-300 overflow-hidden"
              >
                {/* Decorative top gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-50 to-indigo-50 flex items-center justify-center text-[#1E8A3C] group-hover:scale-110 transition-transform duration-300 shadow-sm border border-green-100/50">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusLaporanColor(l.status)} ring-1 ring-inset ring-black/5`}>
                    {getStatusLabel(l.status)}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 text-lg line-clamp-1 mb-1 group-hover:text-[#1E8A3C] transition-colors">{l.judul}</h3>
                <p className="text-xs text-gray-400 font-medium mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  {l.tanggal}
                </p>
                
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">
                  {l.deskripsi || "Tidak ada deskripsi"}
                </p>
                
                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-[#1E8A3C] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <span className="text-sm font-semibold">Lihat Detail</span>
                  <span className="bg-green-50 p-1.5 rounded-lg">&rarr;</span>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => {
              setCurrentPage(p => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
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
            onClick={() => {
              setCurrentPage(p => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
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
