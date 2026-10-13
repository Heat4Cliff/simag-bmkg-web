"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle, Calendar, User, FileText, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getStatusLaporanColor, getStatusLabel, formatTanggal } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function LaporanDetailContent({ id }: { id: string }) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const router = useRouter();

  const [laporan, setLaporan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [komentar, setKomentar] = useState("");

  const fetchLaporan = () => {
    setLoading(true);
    fetch(`/api/laporan-harian/${id}`)
      .then(r => r.json())
      .then(d => {
        setLaporan(d.laporan);
        if (d.laporan?.catatanPembimbing) setKomentar(d.laporan.catatanPembimbing);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLaporan();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/laporan-harian/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, komentar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Status laporan diperbarui");
      router.push("/laporan-harian");
    } catch (err: any) {
      toast.error(err.message || "Gagal update status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan ini?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/laporan-harian/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Laporan berhasil dihapus");
      router.push("/laporan-harian");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus laporan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" /></div>;
  if (!laporan) return <div className="text-center py-20 text-gray-500">Laporan tidak ditemukan</div>;

  const isReviewer = role === "DPL";
  const isMahasiswa = role === "MAHASISWA";
  const isSuperadmin = role === "SUPERADMIN";
  const canEdit = isMahasiswa && ["DRAFT", "TERKIRIM", "REVISI"].includes(laporan.status);
  const canDelete = canEdit || isSuperadmin;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <Link href="/laporan-harian" className="hover:text-[#1E8A3C]">Laporan Harian</Link><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Detail</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <Link href="/laporan-harian" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Detail Laporan</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{laporan.judul}</h2>
              <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1.5 rounded-full ${getStatusLaporanColor(laporan.status)}`}>
                {getStatusLabel(laporan.status)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => router.push(`/laporan-harian/${laporan.id}/edit`)}
                  className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-600 transition-colors whitespace-nowrap"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              )}
              <button
                onClick={() => window.open(`/api/laporan-harian/${laporan.id}/export`, '_blank')}
                className="flex items-center gap-2 bg-[#1E8A3C] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0d5cc5] transition-colors whitespace-nowrap"
              >
                <FileText className="w-4 h-4" /> Export DOCX
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatTanggal(new Date(laporan.tanggal))}</div>
            <div className="flex items-center gap-2"><User className="w-4 h-4" /> {laporan.user?.nama}</div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Deskripsi Kegiatan</h3>
            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
              {laporan.deskripsi}
            </div>
          </div>

          {laporan.kendala && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Kendala / Masalah</h3>
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-orange-800 text-sm whitespace-pre-wrap leading-relaxed flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-orange-500 mt-0.5" />
                <span>{laporan.kendala}</span>
              </div>
            </div>
          )}

          {laporan.lampiran && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Lampiran File</h3>
              <div className="mt-2">
                {laporan.lampiran.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                  <img src={laporan.lampiran} alt="Lampiran" className="max-w-full rounded-xl border border-gray-200" />
                ) : laporan.lampiran.toLowerCase().match(/\.(pdf)$/) != null ? (
                  <iframe src={laporan.lampiran} className="w-full h-[600px] rounded-xl border border-gray-200" />
                ) : (
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-sm text-gray-600">File lampiran tidak dapat dipratinjau di browser.</span>
                    <a href={laporan.lampiran} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#1E8A3C] hover:underline flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Unduh File
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isReviewer && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Review Pembimbing</h3>
          
          <textarea
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            placeholder="Tuliskan catatan atau masukan untuk mahasiswa (opsional)..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C] mb-4 resize-none"
          />

          <div className="flex gap-3">
            <button
              onClick={() => handleUpdateStatus("REVISI")}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" /> Minta Revisi
            </button>
            <button
              onClick={() => handleUpdateStatus("DISETUJUI")}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" /> Setujui Laporan
            </button>
          </div>
        </div>
      )}

      {!isReviewer && laporan.catatanPembimbing && (
        <div className="bg-green-50 border border-green-100 rounded-2xl shadow-sm p-6 mt-6">
          <h3 className="text-sm font-bold text-blue-900 mb-2">Catatan Pembimbing</h3>
          <p className="text-sm text-green-800">{laporan.catatanPembimbing}</p>
        </div>
      )}
    </div>
  );
}
