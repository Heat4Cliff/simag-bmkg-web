"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from "lucide-react";

interface NavbarProps {
  notifCount?: number;
}

export default function Navbar({ notifCount = 0 }: NavbarProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = session?.user;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#1E8A3C] shadow-lg">
      <div className="flex items-center justify-between h-full px-6 lg:px-12">
        {/* Logo + Nama Instansi */}
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/unugha-logo.png"
              alt="Logo UNUGHA"
              fill
              className="object-contain rounded-full bg-white p-0.5"
              priority
            />
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-[11px] text-green-200 font-normal leading-tight">
              Sistem Informasi Magang
            </p>
            <p className="text-sm font-bold text-white leading-tight truncate max-w-[280px]">
              Fakultas Matematika dan Ilmu Komputer
            </p>
          </div>
        </Link>

        {/* Kanan: Notif + Grid + Avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tombol Notifikasi */}
          <Link
            href="/notifikasi"
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5 text-white" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </Link>

          {/* Avatar + Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {user?.fotoProfil ? (
                  <Image
                    src={user.fotoProfil}
                    alt={user.name ?? "User"}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-sm text-white font-medium max-w-[120px] truncate">
                {user?.name ?? "User"}
              </span>
              <ChevronDown className="w-4 h-4 text-white/70" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                      {user?.role === "SUPERADMIN"
                        ? "Super Admin"
                        : user?.role === "DPL"
                        ? "DPL"
                        : user?.role === "MENTOR_INSTANSI"
                        ? "Mentor"
                        : "Mahasiswa"}
                    </span>
                  </div>
                  <Link
                    href="/profil"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profil Saya
                  </Link>
                  <Link
                    href="/pengaturan"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Pengaturan
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
