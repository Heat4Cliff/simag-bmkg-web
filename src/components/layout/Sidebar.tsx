"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  BookOpen,
  History,
  Calendar,
  User,
  Settings,
  Users,
  BarChart3,
  Shield,
  Building,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"],
  },
  {
    href: "/absensi",
    label: "Absensi",
    icon: <ClipboardCheck className="w-4 h-4" />,
    roles: ["MAHASISWA"],
  },
  {
    href: "/laporan-harian",
    label: "Laporan Harian",
    icon: <FileText className="w-4 h-4" />,
    roles: ["MAHASISWA", "DPL", "SUPERADMIN"],
  },
  {
    href: "/modul-praktikum",
    label: "Modul Praktikum",
    icon: <BookOpen className="w-4 h-4" />,
    roles: ["MAHASISWA", "DPL", "SUPERADMIN"],
  },
  {
    href: "/riwayat",
    label: "Riwayat",
    icon: <History className="w-4 h-4" />,
    roles: ["MAHASISWA", "DPL", "SUPERADMIN"],
  },
  {
    href: "/kalender",
    label: "Kalender",
    icon: <Calendar className="w-4 h-4" />,
    roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"],
  },
  // Pembimbing only
  {
    href: "/pembimbing/mahasiswa",
    label: "Data Mahasiswa",
    icon: <Users className="w-4 h-4" />,
    roles: ["DPL"],
  },
  {
    href: "/pembimbing/penilaian",
    label: "Penilaian",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["DPL"],
  },
  // Superadmin only
  {
    href: "/admin/akun",
    label: "Manajemen Akun",
    icon: <Users className="w-4 h-4" />,
    roles: ["SUPERADMIN"],
  },
  {
    href: "/admin/penempatan",
    label: "Penempatan",
    icon: <Shield className="w-4 h-4" />,
    roles: ["SUPERADMIN", "KAPRODI"],
  },
  {
    href: "/admin/tempat-magang",
    label: "Tempat Magang",
    icon: <Building className="w-4 h-4" />,
    roles: ["SUPERADMIN", "KAPRODI"],
  },
  {
    href: "/admin/laporan-global",
    label: "Laporan Global",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["SUPERADMIN", "KAPRODI"],
  },
  // Common
  {
    href: "/profil",
    label: "Profil",
    icon: <User className="w-4 h-4" />,
    roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"],
  },
  {
    href: "/pengaturan",
    label: "Pengaturan",
    icon: <Settings className="w-4 h-4" />,
    roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role ?? "MAHASISWA";

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  // Group items
  const mainItems = filteredItems.filter(
    (i) =>
      !i.href.startsWith("/admin") &&
      !i.href.startsWith("/pembimbing") &&
      i.href !== "/profil" &&
      i.href !== "/pengaturan"
  );
  const roleItems = filteredItems.filter(
    (i) => i.href.startsWith("/admin") || i.href.startsWith("/pembimbing")
  );
  const bottomItems = filteredItems.filter(
    (i) => i.href === "/profil" || i.href === "/pengaturan"
  );

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 text-sm transition-all duration-150 group relative",
          isActive
            ? "bg-green-50 text-[#1E8A3C] font-semibold border-l-[3px] border-[#1E8A3C] pl-[13px]"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <span className={cn(isActive ? "text-[#1E8A3C]" : "text-gray-400 group-hover:text-gray-600")}>
          {item.icon}
        </span>
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <span className="min-w-[20px] h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
            {item.badge}
          </span>
        ) : isActive ? (
          <ChevronRight className="w-3 h-3 text-[#1E8A3C]" />
        ) : null}
      </Link>
    );
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 w-60 bg-white border-r border-gray-100 shadow-sm",
          "flex flex-col overflow-y-auto transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Role badge */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">
              {userRole === "SUPERADMIN"
                ? "Super Administrator"
                : userRole === "KAPRODI"
                ? "Kepala Program Studi"
                : userRole === "DPL"
                ? "Dosen Pembimbing Lapangan"
                : userRole === "MENTOR_INSTANSI"
                ? "Mentor Instansi"
                : "Mahasiswa Magang"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {/* Main items */}
          <div className="space-y-0.5">{mainItems.map(renderItem)}</div>

          {/* Role-specific section */}
          {roleItems.length > 0 && (
            <>
              <div className="mx-4 my-3 border-t border-gray-100" />
              <p className="px-6 text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">
                {(userRole === "SUPERADMIN" || userRole === "KAPRODI") ? "Administrasi" : "Bimbingan"}
              </p>
              <div className="space-y-0.5">{roleItems.map(renderItem)}</div>
            </>
          )}
        </nav>

        {/* Bottom items */}
        <div className="border-t border-gray-100 py-2">
          {bottomItems.map(renderItem)}
        </div>
      </aside>
    </>
  );
}
