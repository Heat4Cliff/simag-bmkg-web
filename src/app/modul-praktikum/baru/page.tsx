"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, Save, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

interface Kategori {
  id: string;
  namaKategori: string;
}

export default function BuatModulPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [form, setForm] = useState({
    judul: "",
    kategoriId: "",
    konten: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Ambil daftar kategori
    fetch("/api/kategori-modul")
      .then((res) => res.json())
      .then((data) => {
        if (data.kategori) {
          setKategoriList(data.kategori);
        }
      })
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!form.judul.trim() || !form.kategoriId || !form.konten.trim()) {
      toast.error("Judul, Kategori, dan Konten wajib diisi.");
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("judul", form.judul);
      formData.append("kategoriId", form.kategoriId);
      formData.append("konten", form.konten);
      formData.append("statusReview", asDraft ? "DRAFT" : "TERKIRIM");
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/modul-praktikum", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Modul berhasil " + (asDraft ? "disimpan sebagai draft!" : "dikirim untuk direview!"));
      router.push("/modul-praktikum");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal membuat modul.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <Link href="/modul-praktikum" className="hover:text-[#1E8A3C]">Modul Praktikum</Link>
        <span>/</span>
        <span className="text-[#1E8A3C] font-medium">Buat Modul</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <Link href="/modul-praktikum" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Buat Modul Praktikum</h1>
          <p className="text-sm text-gray-500">Buat modul pembelajaran atau praktikum baru.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Judul Modul *</label>
          <input
            type="text"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            placeholder="Contoh: Modul Pengenalan Alat Penakar Hujan"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori Modul *</label>
          <select
            value={form.kategoriId}
            onChange={(e) => setForm({ ...form, kategoriId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C] bg-white"
          >
            <option value="" disabled>Pilih Kategori...</option>
            {kategoriList.map((kat) => (
              <option key={kat.id} value={kat.id}>
                {kat.namaKategori}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Konten Modul *
            <span className="text-xs text-gray-400 font-normal ml-2">(Materi praktikum lengkap)</span>
          </label>
          <textarea
            value={form.konten}
            onChange={(e) => setForm({ ...form, konten: e.target.value })}
            rows={10}
            placeholder="Tuliskan materi dan instruksi modul praktikum di sini..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C] resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Lampiran File (Opsional)
            <span className="text-xs text-gray-400 font-normal ml-2">(Maksimal 10MB. Format: PDF, Word, Excel, PPT)</span>
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              } else {
                setFile(null);
              }
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#1E8A3C] hover:file:bg-green-100"
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
            Kirim Modul
          </button>
        </div>
      </form>
    </div>
  );
}
