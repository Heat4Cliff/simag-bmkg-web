"use client";

import { useState, useEffect } from "react";
import { Search, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Mahasiswa {
  userId: string;
  nama: string;
  email: string;
  institusi: string;
  dplNama: string;
  mentorNama: string;
  tempatMagangNama: string;
  dplId: string | null;
  mentorId: string | null;
  tempatMagangId: string | null;
}

interface Profil {
  profileId: string;
  nama: string;
}

interface TempatMagang {
  id: string;
  nama: string;
}

export default function PenempatanContent() {
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [dpl, setDpl] = useState<Profil[]>([]);
  const [mentor, setMentor] = useState<Profil[]>([]);
  const [tempatMagang, setTempatMagang] = useState<TempatMagang[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/penempatan")
      .then(res => res.json())
      .then(data => {
        setMahasiswa(data.mahasiswa || []);
        setDpl(data.dpl || []);
        setMentor(data.mentor || []);
        setTempatMagang(data.tempatMagang || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (
    userId: string, 
    type: "dplProfileId" | "mentorProfileId" | "tempatMagangId", 
    value: string
  ) => {
    setSaving(userId);
    try {
      const res = await fetch("/api/admin/penempatan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, [type]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Penempatan berhasil diperbarui");
      fetchData(); // Refresh data
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal memperbarui penempatan");
    } finally {
      setSaving(null);
    }
  };

  const filtered = mahasiswa.filter((m) => 
    m.nama.toLowerCase().includes(search.toLowerCase()) || 
    m.dplNama.toLowerCase().includes(search.toLowerCase()) ||
    m.tempatMagangNama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span>Administrasi</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Penempatan</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Plotting Penempatan Magang</h1>
        <p className="text-sm text-gray-500 mt-0.5">Atur tempat magang, DPL, dan Mentor Instansi untuk mahasiswa.</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari mahasiswa, tempat magang, atau DPL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
              <tr>
                <th className="px-5 py-3">Mahasiswa</th>
                <th className="px-5 py-3">Status Saat Ini</th>
                <th className="px-5 py-3">Tempat Magang</th>
                <th className="px-5 py-3">DPL Kampus</th>
                <th className="px-5 py-3">Mentor Instansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#1E8A3C] mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-500">Tidak ada mahasiswa.</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.userId} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800">{m.nama}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </td>
                    <td className="px-5 py-3.5 space-y-1 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold w-max ${m.tempatMagangId ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          <LinkIcon className="w-2.5 h-2.5" /> Tempat: {m.tempatMagangNama}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold w-max ${m.dplId ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          <LinkIcon className="w-2.5 h-2.5" /> DPL: {m.dplNama}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold w-max ${m.mentorId ? 'bg-purple-50 text-purple-700' : 'bg-red-50 text-red-600'}`}>
                          <LinkIcon className="w-2.5 h-2.5" /> Mentor: {m.mentorNama}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-5 py-3.5">
                      <select
                        className="w-40 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-[#1E8A3C] disabled:opacity-50"
                        value={m.tempatMagangId || ""}
                        onChange={(e) => handleAssign(m.userId, "tempatMagangId", e.target.value)}
                        disabled={saving === m.userId}
                      >
                        <option value="">-- Pilih Tempat --</option>
                        {tempatMagang.map(t => (
                          <option key={t.id} value={t.id}>{t.nama}</option>
                        ))}
                      </select>
                    </td>
                    
                    <td className="px-5 py-3.5">
                      <select
                        className="w-40 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-[#1E8A3C] disabled:opacity-50"
                        value={m.dplId || ""}
                        onChange={(e) => handleAssign(m.userId, "dplProfileId", e.target.value)}
                        disabled={saving === m.userId}
                      >
                        <option value="">-- Pilih DPL --</option>
                        {dpl.map(p => (
                          <option key={p.profileId} value={p.profileId}>{p.nama}</option>
                        ))}
                      </select>
                    </td>
                    
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <select
                          className="w-40 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-[#1E8A3C] disabled:opacity-50"
                          value={m.mentorId || ""}
                          onChange={(e) => handleAssign(m.userId, "mentorProfileId", e.target.value)}
                          disabled={saving === m.userId}
                        >
                          <option value="">-- Pilih Mentor --</option>
                          {mentor.map(p => (
                            <option key={p.profileId} value={p.profileId}>{p.nama}</option>
                          ))}
                        </select>
                        {saving === m.userId && <Loader2 className="w-4 h-4 animate-spin text-[#1E8A3C] shrink-0" />}
                      </div>
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
