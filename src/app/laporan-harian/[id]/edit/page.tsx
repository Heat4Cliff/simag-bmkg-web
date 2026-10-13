"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function EditLaporanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [form, setForm] = useState({
    tanggal: "",
    judul: "",
    deskripsi: "",
    kendala: "",
  });

  useEffect(() => {
    fetch(`/api/laporan-harian/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.laporan) {
          setForm({
            tanggal: new Date(data.laporan.tanggal).toISOString().split("T")[0],
            judul: data.laporan.judul,
            deskripsi: data.laporan.deskripsi,
            kendala: data.laporan.kendala || "",
          });
        } else {
          toast.error("Laporan tidak ditemukan");
          router.push("/laporan-harian");
        }
      })
      .catch(() => {
        toast.error("Gagal mengambil data laporan");
        router.push("/laporan-harian");
      })
      .finally(() => setInitialLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!form.judul.trim() || !form.deskripsi.trim()) {
      toast.error("Judul dan deskripsi wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan-harian/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, asDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Laporan berhasil " + (asDraft ? "disimpan sebagai draft!" : "dikirim!"));
      router.push(`/laporan-harian/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengupdate laporan.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <Link href="/laporan-harian" className="hover:text-[#1E8A3C]">Laporan Harian</Link>
        <span>/</span>
        <Link href={`/laporan-harian/${id}`} className="hover:text-[#1E8A3C]">Detail</Link>
        <span>/</span>
        <span className="text-[#1E8A3C] font-medium">Edit</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <Link href={`/laporan-harian/${id}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Edit Laporan Harian</h1>
          <p className="text-sm text-gray-500">Ubah detail laporan kegiatan Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal *</label>
          <input
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Judul Laporan *</label>
          <input
            type="text"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            placeholder="Contoh: Observasi Data Curah Hujan Stasiun A"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Deskripsi Kegiatan *
            <span className="text-xs text-gray-400 font-normal ml-2">(Jelaskan kegiatan yang dilakukan hari ini)</span>
          </label>
          <textarea
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            rows={6}
            placeholder="Tuliskan kegiatan harian Anda secara detail..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C] resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{form.deskripsi.length} karakter</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Kendala
            <span className="text-xs text-gray-400 font-normal ml-2">(opsional)</span>
          </label>
          <textarea
            value={form.kendala}
            onChange={(e) => setForm({ ...form, kendala: e.target.value })}
            rows={3}
            placeholder="Tuliskan kendala yang dihadapi (jika ada)..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Simpan Draft
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#1E8A3C] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#0d5cc5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Perbarui Laporan
          </button>
        </div>
      </form>
    </div>
  );
}
