"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { BlurText } from "@/components/ui/BlurText";
import { ShinyText } from "@/components/ui/ShinyText";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "CredentialsSignin") {
      toast.error("Username/Email atau password salah. Silakan coba lagi.");
    } else if (error === "InvalidIP") {
      toast.error("Sesi berakhir karena perubahan IP jaringan. Silakan login kembali.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn("credentials", {
        identifier,
        password,
        redirectTo: "/dashboard",
      });
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh relative overflow-hidden bg-gradient-to-br from-[#1E8A3C] via-[#0d5cc5] to-[#26A64B] flex items-center justify-center p-4">
      {/* Background decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header biru */}
          <div className="bg-[#1E8A3C] px-8 pt-8 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg p-1 overflow-hidden">
                <Image
                  src="/unugha-logo.png"
                  alt="Logo UNUGHA"
                  width={72}
                  height={72}
                  className="object-contain rounded-full"
                  priority
                />
              </div>
            </div>
            <ShinyText 
              text="SISTEM INFORMASI MAGANG"
              className="text-green-200 text-xs font-medium tracking-widest uppercase mb-1" 
              speed={4}
            />
            <BlurText 
              text="SIMAG UNUGHA"
              delay={0.1}
              className="text-white text-xl font-bold leading-tight justify-center" 
            />
            <p className="text-green-200 text-sm mt-1">
              Fakultas Matematika dan Ilmu Komputer
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <BlurText 
              text="Selamat Datang! 👋" 
              delay={0.05}
              className="text-gray-800 text-lg font-bold mb-1 justify-start"
            />
            <p className="text-gray-500 text-sm mb-6">
              Masuk dengan akun yang diberikan oleh administrator sistem.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email atau Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="nama@unugha.go.id atau username"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E8A3C] hover:bg-[#0d5cc5] text-white font-semibold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk ke Sistem"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Belum punya akun?{" "}
              <span className="text-[#1E8A3C] font-medium">
                Hubungi administrator sistem.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-6">
          © 2026 UNUGHA Fakultas Matematika dan Ilmu Komputer. All rights reserved.
        </p>
      </div>
    </div>
  );
}
