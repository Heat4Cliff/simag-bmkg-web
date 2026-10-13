"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Shield, Calendar, Building, Phone, Loader2, Save, X, Camera, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ProfilData {
  nama: string;
  email: string;
  username: string;
  role: string;
  noHp: string;
  institusiAsal: string;
  fotoProfil: string | null;
}

export default function ProfilContent() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profil, setProfil] = useState<ProfilData>({
    nama: "", email: "", username: "", role: "", noHp: "", institusiAsal: "-", fotoProfil: null
  });

  const [formData, setFormData] = useState({
    nama: "", email: "", username: "", noHp: "", fotoProfilBase64: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: "", newPassword: "", confirmPassword: ""
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [changingPassword, setChangingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Local preview for UI before saving
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  const fetchProfil = () => {
    setLoading(true);
    fetch("/api/profil")
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setProfil(data);
          setPreviewFoto(data.fotoProfil);
          setFormData({
            nama: data.nama,
            email: data.email,
            username: data.username,
            noHp: data.noHp,
            fotoProfilBase64: ""
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfil();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewFoto(base64);
      setFormData(prev => ({ ...prev, fotoProfilBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
      
      // Sync local state
      const updatedFoto = data.fotoProfil || profil.fotoProfil;
      setProfil(prev => ({ ...prev, ...formData, fotoProfil: updatedFoto }));
      if (data.fotoProfil) {
        setPreviewFoto(data.fotoProfil);
        setFormData(prev => ({ ...prev, fotoProfilBase64: "" }));
      }
      
      updateSession({
        ...session,
        user: { 
          ...session?.user, 
          name: formData.nama, 
          email: formData.email,
          username: formData.username,
          fotoProfil: updatedFoto 
        }
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    
    setChangingPassword(true);
    try {
      const res = await fetch("/api/profil/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Password berhasil diubah!");
      setIsChangingPassword(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  };

  const roleLabel =
    profil.role === "SUPERADMIN" ? "Super Administrator" :
    profil.role === "DPL" ? "Pembimbing Magang" :
    "Mahasiswa/Karyawan Magang";

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Profil</span>
      </div>

      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold text-gray-800">Profil Saya</h1>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="border-2 border-[#1E8A3C] text-[#1E8A3C] font-semibold px-4 py-1.5 rounded-xl text-sm hover:bg-green-50 transition-colors"
          >
            Edit Profil
          </button>
        )}
      </div>

      {/* Avatar Card */}
      <div className="bg-gradient-to-br from-[#1E8A3C] to-[#26A64B] rounded-2xl p-6 text-white mb-4 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold shadow-lg flex-shrink-0 overflow-hidden relative">
            {previewFoto ? (
              <Image src={previewFoto} alt="Foto Profil" fill className="object-cover" />
            ) : (
              profil.nama?.charAt(0)?.toUpperCase() ?? "U"
            )}
          </div>
          {isEditing && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <div className="flex-1 mt-2">
          <p className="text-xl font-bold">{profil.nama}</p>
          <p className="text-green-200 text-sm mt-0.5">{profil.email}</p>
          <span className="inline-block mt-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {roleLabel}
          </span>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
            <input 
              type="text" 
              required
              value={formData.nama}
              onChange={e => setFormData({...formData, nama: e.target.value})}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
              placeholder="Username untuk login"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor HP</label>
            <input 
              type="text" 
              value={formData.noHp}
              onChange={e => setFormData({...formData, noHp: e.target.value})}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => { setIsEditing(false); setFormData({ nama: profil.nama, email: profil.email, username: profil.username, noHp: profil.noHp, fotoProfilBase64: "" }); }}
              className="flex-1 flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              <X className="w-4 h-4" /> Batal
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex-1 flex justify-center items-center gap-2 bg-[#1E8A3C] hover:bg-[#0d5cc5] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
              Simpan
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {[
            { icon: <User className="w-4 h-4" />, label: "Nama Lengkap", value: profil.nama || "-" },
            { icon: <Mail className="w-4 h-4" />, label: "Alamat Email", value: profil.email || "-" },
            { icon: <Shield className="w-4 h-4" />, label: "Username", value: profil.username || "-" },
            { icon: <Shield className="w-4 h-4" />, label: "Role", value: roleLabel },
            { icon: <Building className="w-4 h-4" />, label: "Instansi", value: profil.institusiAsal || "UNUGHA Fakultas Matematika dan Ilmu Komputer" },
            { icon: <Calendar className="w-4 h-4" />, label: "Status", value: "Aktif" },
            { icon: <Phone className="w-4 h-4" />, label: "No. HP", value: profil.noHp || "-" },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i < 6 ? "border-b border-gray-100" : ""}`}>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#1E8A3C] flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change Password Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Keamanan</h3>
            <p className="text-xs text-gray-500">Ubah password akun Anda secara berkala</p>
          </div>
          {!isChangingPassword && (
            <button 
              onClick={() => setIsChangingPassword(true)}
              className="border-2 border-[#1E8A3C] text-[#1E8A3C] font-semibold px-4 py-1.5 rounded-xl text-sm hover:bg-green-50 transition-colors"
            >
              Ganti Password
            </button>
          )}
        </div>
        {isChangingPassword && (
          <form onSubmit={handlePasswordSave} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Lama</label>
              <div className="relative">
                <input 
                  type={showOldPassword ? "text" : "password"} 
                  required
                  value={passwordData.oldPassword}
                  onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  className="w-full px-4 py-2 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Baru</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  required
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className={`w-full px-4 py-2 pr-10 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                    passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword 
                    ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" 
                    : "border-gray-200 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword && (
                <p className="text-red-500 text-xs mt-1 font-medium">Password baru yang dimasukkan tidak cocok.</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => { setIsChangingPassword(false); setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); }}
                className="flex-1 flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                <X className="w-4 h-4" /> Batal
              </button>
              <button 
                type="submit"
                disabled={changingPassword}
                className="flex-1 flex justify-center items-center gap-2 bg-[#1E8A3C] hover:bg-[#0d5cc5] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} 
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
