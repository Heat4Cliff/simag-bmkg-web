"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, MapPin, Building, Phone, Compass, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function PengaturanContent() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const isSuperadmin = role === "SUPERADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    namaInstansi: "",
    alamat: "",
    kontak: "",
    latitudeKantor: "",
    longitudeKantor: "",
    radiusAbsensiMeter: "",
  });

  useEffect(() => {
    fetch("/api/pengaturan")
      .then(res => res.json())
      .then(data => {
        if (data.setting) {
          setForm({
            namaInstansi: data.setting.namaInstansi || "",
            alamat: data.setting.alamat || "",
            kontak: data.setting.kontak || "",
            latitudeKantor: data.setting.latitudeKantor?.toString() || "",
            longitudeKantor: data.setting.longitudeKantor?.toString() || "",
            radiusAbsensiMeter: data.setting.radiusAbsensiMeter?.toString() || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin) return;

    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Pengaturan instansi berhasil disimpan");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Pengaturan</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Pengaturan Sistem</h1>
        <p className="text-sm text-gray-500 mt-0.5">Konfigurasi dasar aplikasi dan profil instansi.</p>
      </div>

      {isSuperadmin ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#1E8A3C]" /> Profil Aplikasi & Default Lokasi Kampus
            </h2>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Aplikasi / Institusi Utama</label>
                <input
                  type="text"
                  required
                  value={form.namaInstansi}
                  onChange={e => setForm({...form, namaInstansi: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kontak / Telepon Utama</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.kontak}
                    onChange={e => setForm({...form, kontak: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Lengkap Kampus Utama</label>
                <textarea
                  rows={2}
                  value={form.alamat}
                  onChange={e => setForm({...form, alamat: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Latitude Kampus Utama / Default</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.latitudeKantor}
                    onChange={e => setForm({...form, latitudeKantor: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Longitude Kampus Utama / Default</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.longitudeKantor}
                    onChange={e => setForm({...form, longitudeKantor: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Radius Absensi (Meter)</label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    value={form.radiusAbsensiMeter}
                    onChange={e => setForm({...form, radiusAbsensiMeter: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#1E8A3C] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0d5cc5] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Pengaturan
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              Menu Pengaturan Mobile
            </h2>
          </div>
          <div className="p-6">
            <Link href="/profil" className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <User className="w-5 h-5 text-[#1E8A3C]" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Profil Saya</p>
                <p className="text-xs text-gray-500">Lihat dan ubah data profil pribadi Anda.</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
