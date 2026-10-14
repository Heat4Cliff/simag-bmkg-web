"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Users, MoreVertical, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserAccount {
  id: string;
  nama: string;
  email: string;
  role: string;
  statusAktif: boolean;
}

export default function AkunContent() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    role: "MAHASISWA",
  });

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/akun")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => toast.error("Gagal memuat data akun"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId ? `/api/admin/akun/${editingId}` : "/api/admin/akun";
      const method = editingId ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success(editingId ? "Akun berhasil diperbarui!" : "Akun berhasil dibuat!");
      setShowModal(false);
      setEditingId(null);
      setForm({ nama: "", email: "", password: "", role: "MAHASISWA" });
      fetchUsers();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan akun");
    } finally {
      setSubmitting(false);
    }
  };

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // The dropdown logic is now handled by the full screen fixed transparent overlay instead of document events

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun ini?")) return;
    
    try {
      const res = await fetch(`/api/admin/akun/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Akun berhasil dihapus");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus akun");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/akun/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusAktif: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Status akun diperbarui");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui status");
    }
  };

  const filtered = users.filter((u) => 
    u.nama.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span>Administrasi</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Manajemen Akun</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Manajemen Akun</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola akses sistem untuk seluruh pengguna.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ nama: "", email: "", password: "", role: "MAHASISWA" });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#1E8A3C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0d5cc5] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Akun Baru
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="overflow-visible min-h-[300px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
              <tr>
                <th className="px-5 py-3">Nama Lengkap</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1E8A3C] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">Tidak ada akun ditemukan</p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${openDropdownId === user.id ? 'relative z-50' : 'relative z-0'}`}>
                    <td className="px-5 py-3.5 font-medium">{user.nama}</td>
                    <td className="px-5 py-3.5">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {user.statusAktif ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className={`px-5 py-3.5 text-right relative ${openDropdownId === user.id ? 'z-50' : ''}`}>
                      <button 
                        onClick={() => {
                          setOpenDropdownId(openDropdownId === user.id ? null : user.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors relative"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {openDropdownId === user.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setOpenDropdownId(null)}
                          />
                          <div className="absolute right-8 top-10 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                setEditingId(user.id);
                                setForm({
                                  nama: user.nama,
                                  email: user.email,
                                  password: "",
                                  role: user.role,
                                });
                                setShowModal(true);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Edit Akun
                            </button>
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                handleToggleStatus(user.id, user.statusAktif);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              {user.statusAktif ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                            </button>
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                handleDelete(user.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Hapus Akun
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Akun */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">{editingId ? "Edit Akun" : "Tambah Akun Baru"}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password {editingId && <span className="text-gray-400 font-normal">(Kosongkan jika tidak diubah)</span>} {!editingId && "*"}
                </label>
                <input
                  type="text"
                  required={!editingId}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role Pengguna *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
                >
                  <option value="MAHASISWA">Mahasiswa / Magang</option>
                  <option value="DPL">DPL / Pembimbing Kampus</option>
                  <option value="MENTOR_INSTANSI">Mentor Instansi</option>
                  <option value="SUPERADMIN">Superadmin</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#1E8A3C] text-white font-semibold rounded-xl text-sm hover:bg-[#0d5cc5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
