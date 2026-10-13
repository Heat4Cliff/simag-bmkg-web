"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, User, FileText, BookOpen, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatTanggal } from "@/lib/utils";
import Swal from 'sweetalert2';

export default function ModulDetailContent({ id }: { id: string }) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const router = useRouter();

  const [modul, setModul] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [catatan, setCatatan] = useState("");

  const fetchModul = () => {
    setLoading(true);
    fetch(`/api/modul-praktikum/${id}`)
      .then(r => r.json())
      .then(d => {
        setModul(d.modul);
        if (d.modul?.catatanReview) setCatatan(d.modul.catatanReview);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchModul();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/modul-praktikum/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusReview: status, catatanReview: catatan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Status modul diperbarui");
      router.push("/modul-praktikum");
    } catch (err: any) {
      toast.error(err.message || "Gagal update status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Modul praktikum yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-5 py-2.5 font-semibold',
        cancelButton: 'rounded-xl px-5 py-2.5 font-semibold',
      }
    });

    if (!result.isConfirmed) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/modul-praktikum/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      await Swal.fire({
        title: 'Terhapus!',
        text: 'Modul praktikum berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#1E8A3C',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-5 py-2.5 font-semibold',
        }
      });
      
      router.push("/modul-praktikum");
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.message || "Gagal menghapus modul",
        icon: 'error',
        confirmButtonColor: '#1E8A3C',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-5 py-2.5 font-semibold',
        }
      });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" /></div>;
  if (!modul) return <div className="text-center py-20 text-gray-500">Modul tidak ditemukan</div>;

  const isReviewer = role === "DPL";
  const isSuperadmin = role === "SUPERADMIN";
  const isOwner = role === "MAHASISWA" && session?.user?.id === modul.userId;
  const canDelete = isOwner || isSuperadmin;

  const getStatusColor = (s: string) => {
    if (s === "DISETUJUI") return "bg-green-100 text-green-700";
    if (s === "REVISI") return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <Link href="/modul-praktikum" className="hover:text-[#1E8A3C]">Modul Praktikum</Link><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Detail</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <Link href="/modul-praktikum" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Detail Modul</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">{modul.kategori?.namaKategori || "-"}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{modul.judul}</h2>
              <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1.5 rounded-full ${getStatusColor(modul.statusReview)}`}>
                {modul.statusReview}
              </span>
            </div>
            
            <div className="flex gap-2">
              {modul.lampiran && (
                <button
                  onClick={() => window.open(modul.lampiran, '_blank')}
                  className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-200 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" /> Unduh Lampiran
                </button>
              )}
              <button
                onClick={() => window.open(`/api/modul-praktikum/${modul.id}/export`, '_blank')}
                className="flex items-center gap-2 bg-[#1E8A3C] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0d5cc5] transition-colors whitespace-nowrap"
              >
                <FileText className="w-4 h-4" /> Export DOCX
              </button>
              {isOwner && ["DRAFT", "TERKIRIM", "REVISI"].includes(modul.statusReview) && (
                <Link
                  href={`/modul-praktikum/${modul.id}/edit`}
                  className="flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-100 transition-colors whitespace-nowrap"
                >
                  Edit
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">Dibuat pada {formatTanggal(new Date(modul.createdAt))}</div>
            <div className="flex items-center gap-2"><User className="w-4 h-4" /> {modul.user?.nama}</div>
          </div>
        </div>

        <div className="p-8">
          <h3 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2">Konten Praktikum</h3>
          <div className="prose max-w-none text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
            {modul.konten}
          </div>

          {modul.lampiran && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2">Lampiran Praktikum</h3>
              <div className="mt-2">
                {modul.lampiran.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                  <img src={modul.lampiran} alt="Lampiran" className="max-w-full rounded-xl border border-gray-200" />
                ) : modul.lampiran.toLowerCase().match(/\.(pdf)$/) != null ? (
                  <iframe src={modul.lampiran} className="w-full h-[600px] rounded-xl border border-gray-200" />
                ) : (
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-sm text-gray-600">File lampiran tidak dapat dipratinjau di browser.</span>
                    <a href={modul.lampiran} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#1E8A3C] hover:underline flex items-center gap-2">
                      <Download className="w-4 h-4" /> Unduh File
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
          <h3 className="text-sm font-bold text-gray-800 mb-3">Review Modul Praktikum</h3>
          
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tuliskan catatan revisi atau saran perbaikan (opsional)..."
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
              <CheckCircle2 className="w-5 h-5" /> Setujui Modul
            </button>
          </div>
        </div>
      )}

      {!isReviewer && modul.catatanReview && (
        <div className="bg-green-50 border border-green-100 rounded-2xl shadow-sm p-6 mt-6">
          <h3 className="text-sm font-bold text-blue-900 mb-2">Catatan Reviewer</h3>
          <p className="text-sm text-green-800">{modul.catatanReview}</p>
        </div>
      )}
    </div>
  );
}
