"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Building,
  Plus,
  Edit2,
  Trash2,
  Search,
  Map as MapIcon,
  Loader2
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

export default function TempatMagangContent() {
  const [data, setData] = useState<TempatMagang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const filteredData = data.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.alamat && item.alamat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-7 h-7 text-[#0f4a25]" />
            Manajemen Tempat Magang
          </h1>
          <p className="text-gray-500 mt-1">Kelola data mitra instansi tempat pelaksanaan magang</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#0f4a25] hover:bg-[#0f4a25]/90 text-white px-5 py-2.5 rounded-xl font-medium transition-colors w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Tambah Instansi
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#0f4a25] focus:border-[#0f4a25] sm:text-sm transition-shadow shadow-sm"
          placeholder="Cari nama instansi atau alamat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Data Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0f4a25]" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak ada tempat magang</h3>
          <p className="text-gray-500 mt-1">Tambahkan data instansi baru untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <Building className="w-6 h-6 text-[#0f4a25]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1" title={item.nama}>{item.nama}</h3>
                    <p className="text-xs text-gray-500 mt-1">Ditambahkan {format(new Date(item.createdAt), "dd MMM yyyy", { locale: id })}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-grow space-y-3 mt-2 text-sm">
                {item.alamat && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                    <span className="line-clamp-2" title={item.alamat}>{item.alamat}</span>
                  </div>
                )}
                
                {(item.latitude && item.longitude) ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
                    <MapIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.latitude}, {item.longitude}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-xs font-medium">
                    <MapIcon className="w-4 h-4 shrink-0" />
                    Koordinat belum diatur
                  </div>
                )}
                
                <div className="text-xs text-gray-500 flex items-center justify-between px-1">
                  <span>Radius Absensi:</span>
                  <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{item.radiusAbsen} meter</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>

            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Building className="h-6 w-6 text-[#0f4a25]" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        {editingId ? "Edit Tempat Magang" : "Tambah Tempat Magang"}
                      </h3>
                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Instansi *</label>
                          <input
                            type="text"
                            required
                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0f4a25] focus:ring-[#0f4a25] sm:text-sm"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                          <textarea
                            rows={3}
                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0f4a25] focus:ring-[#0f4a25] sm:text-sm"
                            value={formData.alamat}
                            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0f4a25] focus:ring-[#0f4a25] sm:text-sm"
                              value={formData.latitude}
                              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                              placeholder="-6.200000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0f4a25] focus:ring-[#0f4a25] sm:text-sm"
                              value={formData.longitude}
                              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                              placeholder="106.816666"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                            Radius Absensi (meter)
                            <span className="text-xs text-emerald-600 font-medium">Bawaan: 50m</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="10"
                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0f4a25] focus:ring-[#0f4a25] sm:text-sm"
                            value={formData.radiusAbsen}
                            onChange={(e) => setFormData({ ...formData, radiusAbsen: parseInt(e.target.value) || 50 })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full justify-center rounded-xl bg-[#0f4a25] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f4a25]/90 sm:ml-3 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-70"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
