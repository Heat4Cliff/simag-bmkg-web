"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  X,
  Crosshair,
  Navigation,
  ExternalLink,
  Radar,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type TempatMagang = {
  id: string;
  nama: string;
  alamat: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusAbsen: number;
  createdAt: string;
};

const inputClass =
  "block w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#0f4a25] focus:bg-white focus:ring-4 focus:ring-[#0f4a25]/10";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

export default function TempatMagangContent() {
  const [data, setData] = useState<TempatMagang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    latitude: "",
    longitude: "",
    radiusAbsen: 50,
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/tempat-magang");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data tempat magang");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close modal with Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, isSubmitting]);

  const handleOpenModal = (item?: TempatMagang) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nama: item.nama,
        alamat: item.alamat || "",
        latitude: item.latitude?.toString() || "",
        longitude: item.longitude?.toString() || "",
        radiusAbsen: item.radiusAbsen || 50,
      });
    } else {
      setEditingId(null);
      setFormData({
        nama: "",
        alamat: "",
        latitude: "",
        longitude: "",
        radiusAbsen: 50,
      });
    }
    setIsModalOpen(true);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolokasi");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
        setIsLocating(false);
        toast.success("Koordinat lokasi berhasil diambil");
      },
      () => {
        setIsLocating(false);
        toast.error("Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        radiusAbsen: parseInt(formData.radiusAbsen.toString()) || 50,
      };

      const url = editingId ? `/api/admin/tempat-magang/${editingId}` : "/api/admin/tempat-magang";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan data");
      }

      toast.success(editingId ? "Tempat magang berhasil diupdate" : "Tempat magang berhasil ditambahkan");
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tempat magang ini? Data yang terkait mungkin akan kehilangan referensi lokasinya.")) return;

    try {
      const res = await fetch(`/api/admin/tempat-magang/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus data");

      toast.success("Tempat magang berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.alamat && item.alamat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalWithCoords = data.filter((d) => d.latitude && d.longitude).length;
  const avgRadius = data.length
    ? Math.round(data.reduce((acc, d) => acc + (d.radiusAbsen || 0), 0) / data.length)
    : 0;

  const stats = [
    { label: "Total Instansi", value: data.length, icon: Building2, tone: "bg-emerald-50 text-[#0f4a25]" },
    { label: "Koordinat Terpasang", value: totalWithCoords, icon: MapPin, tone: "bg-sky-50 text-sky-700" },
    { label: "Rata-rata Radius", value: `${avgRadius} m`, icon: Radar, tone: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f4a25] via-[#14612f] to-[#1d7a3e] p-6 text-white shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Manajemen Tempat Magang</h1>
              <p className="mt-1 text-sm text-emerald-50/80 md:text-base">
                Kelola data mitra instansi dan titik lokasi presensi mahasiswa
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0f4a25] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg md:w-auto"
          >
            <Plus className="h-5 w-5" />
            Tambah Instansi
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.tone}`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
              <p className="mt-0.5 text-2xl font-bold text-gray-900">{isLoading ? "—" : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-[#0f4a25] focus:ring-4 focus:ring-[#0f4a25]/10"
            placeholder="Cari nama instansi atau alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!isLoading && (
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-semibold text-gray-800">{filteredData.length}</span> dari{" "}
            <span className="font-semibold text-gray-800">{data.length}</span> instansi
          </p>
        )}
      </div>

      {/* Data Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-5/6 rounded bg-gray-100" />
                <div className="h-10 w-full rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Building2 className="h-8 w-8 text-[#0f4a25]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {searchTerm ? "Instansi tidak ditemukan" : "Belum ada tempat magang"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Coba kata kunci lain." : "Tambahkan data instansi baru untuk memulai."}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenModal()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0f4a25] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4a25]/90"
            >
              <Plus className="h-4 w-4" /> Tambah Instansi
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredData.map((item) => {
            const hasCoords = !!(item.latitude && item.longitude);
            return (
              <div
                key={item.id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-xl"
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-[#0f4a25] to-emerald-400" />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0f4a25] transition group-hover:bg-[#0f4a25] group-hover:text-white">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900" title={item.nama}>
                        {item.nama}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Ditambahkan {format(new Date(item.createdAt), "dd MMM yyyy", { locale: id })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex-1 space-y-3 text-sm">
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <span className="line-clamp-2" title={item.alamat || ""}>
                        {item.alamat || <span className="italic text-gray-400">Alamat belum diisi</span>}
                      </span>
                    </div>

                    {hasCoords ? (
                      <a
                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Navigation className="h-4 w-4 shrink-0" />
                          <span className="truncate font-mono text-xs">
                            {item.latitude}, {item.longitude}
                          </span>
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Koordinat belum diatur
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-xs text-gray-500">
                        <Radar className="h-4 w-4 text-gray-400" />
                        Radius Absensi
                      </span>
                      <span className="rounded-full bg-[#0f4a25]/10 px-2.5 py-0.5 text-xs font-bold text-[#0f4a25]">
                        {item.radiusAbsen} meter
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f4a25] text-white shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingId ? "Edit Tempat Magang" : "Tambah Tempat Magang"}
                  </h3>
                  <p className="text-xs text-gray-500">Lengkapi informasi instansi mitra di bawah ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <div>
                  <label className={labelClass}>
                    Nama Instansi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    className={inputClass}
                    placeholder="Contoh: BMKG Stasiun Meteorologi Cilacap"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>Alamat Lengkap</label>
                  <textarea
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Jalan, kelurahan, kecamatan, kota..."
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <MapPin className="h-4 w-4 text-[#0f4a25]" />
                      Titik Koordinat
                    </span>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={isLocating}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0f4a25] shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-50 disabled:opacity-60"
                    >
                      {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
                      Lokasi Saya
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        className={`${inputClass} bg-white font-mono`}
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="-7.7186515"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        className={`${inputClass} bg-white font-mono`}
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="109.0118975"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Tip: Klik kanan lokasi di Google Maps untuk menyalin koordinat.
                  </p>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Radius Absensi <span className="text-red-500">*</span>
                    </label>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Bawaan: 50 m
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10}
                      max={1000}
                      step={10}
                      value={formData.radiusAbsen}
                      onChange={(e) => setFormData({ ...formData, radiusAbsen: parseInt(e.target.value) })}
                      className="h-2 flex-1 cursor-pointer accent-[#0f4a25]"
                    />
                    <div className="relative w-28">
                      <input
                        type="number"
                        required
                        min={10}
                        className={`${inputClass} pr-8 text-right font-semibold`}
                        value={formData.radiusAbsen}
                        onChange={(e) => setFormData({ ...formData, radiusAbsen: parseInt(e.target.value) || 50 })}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">m</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    Mahasiswa hanya dapat presensi jika berada dalam radius ini dari titik koordinat.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-70"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#0f4a25] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f4a25]/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Data"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
