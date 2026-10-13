"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Search, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Modul {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  statusReview: string;
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  TERKIRIM: "bg-green-100 text-green-700",
  DIREVIEW: "bg-yellow-100 text-yellow-700",
  DISETUJUI: "bg-green-100 text-green-700",
  REVISI: "bg-orange-100 text-orange-700",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", TERKIRIM: "Terkirim", DIREVIEW: "Direview",
  DISETUJUI: "Disetujui", REVISI: "Revisi",
};

export default function ModulContent() {
  const [modul, setModul] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    fetch("/api/modul-praktikum")
      .then((r) => r.json())
      .then((d) => setModul(d.modul ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = modul.filter((m) =>
    m.judul.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Modul Praktikum</span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Modul Praktikum</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola dokumen modul praktikum Anda.</p>
        </div>
        <Link
          href="/modul-praktikum/baru"
          className="flex items-center gap-2 bg-[#1E8A3C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0d5cc5] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Buat Modul
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari modul..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1E8A3C]" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Belum ada modul</p>
          <p className="text-sm text-gray-400 mt-1">Buat modul praktikum pertama Anda!</p>
          <Link
            href="/modul-praktikum/baru"
            className="inline-flex items-center gap-2 mt-4 bg-[#1E8A3C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0d5cc5]"
          >
            <Plus className="w-4 h-4" /> Buat Modul
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((m) => (
            <div key={m.id} className="relative group h-full">
              {/* Background stacked card effect */}
              <div className="absolute inset-0 bg-[#e2e8f0] rounded-2xl border border-gray-300 shadow-sm transform rotate-1 translate-x-1.5 translate-y-1.5 group-hover:rotate-2 group-hover:translate-x-2.5 group-hover:translate-y-2.5 transition-all duration-300"></div>
              
              <Link
                href={`/modul-praktikum/${m.id}`}
                className="relative flex flex-col bg-white rounded-2xl p-5 border border-gray-200 h-full transition-transform duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-purple-100/50">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_COLOR[m.statusReview] ?? "bg-gray-100 text-gray-600"} ring-1 ring-inset ring-black/5`}>
                    {STATUS_LABEL[m.statusReview] ?? m.statusReview}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 text-lg line-clamp-2 mb-2 group-hover:text-purple-700 transition-colors">{m.judul}</h3>
                <p className="text-xs text-gray-400 font-medium mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  {m.kategori} • {m.tanggal}
                </p>
                
                <div className="mt-auto pt-4 flex items-center justify-between text-purple-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <span className="text-sm font-semibold flex items-center gap-1">Detail Modul <ChevronRight className="w-4 h-4" /></span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

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
