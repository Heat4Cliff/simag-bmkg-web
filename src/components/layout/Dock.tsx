"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useSession } from "next-auth/react";

interface DockItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  mouseX: any;
  hideOnMobile?: boolean;
}

function DockItem({ href, icon, label, mouseX, hideOnMobile }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href={href} className={cn("relative group", hideOnMobile ? "hidden sm:block" : "block")}>
      <motion.div
        ref={ref}
        style={{ width: isMobile ? 44 : width, height: isMobile ? 44 : width }}
        className={cn(
          "rounded-full flex items-center justify-center relative",
          "bg-white shadow-lg border border-gray-100",
          "hover:bg-green-50 transition-colors duration-200",
          isActive ? "ring-2 ring-[#1E8A3C] bg-green-50" : ""
        )}
      >
        <div className={cn("text-gray-500 group-hover:text-[#1E8A3C]", isActive ? "text-[#1E8A3C]" : "")}>
          {icon}
        </div>
        
        {/* Tooltip */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
          {label}
        </div>
      </motion.div>
    </Link>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  hideOnMobile?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"] },
  { href: "/absensi", label: "Absensi", icon: <ClipboardCheck className="w-5 h-5" />, roles: ["MAHASISWA"] },
  { href: "/laporan-harian", label: "Laporan", icon: <FileText className="w-5 h-5" />, roles: ["MAHASISWA", "DPL", "SUPERADMIN", "KAPRODI", "MENTOR_INSTANSI"] },
  { href: "/modul-praktikum", label: "Modul", icon: <BookOpen className="w-5 h-5" />, roles: ["MAHASISWA", "DPL", "SUPERADMIN", "KAPRODI", "MENTOR_INSTANSI"] },
  { href: "/riwayat", label: "Riwayat", icon: <History className="w-5 h-5" />, roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"], hideOnMobile: true },
  { href: "/kalender", label: "Kalender", icon: <Calendar className="w-5 h-5" />, roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"] },
  { href: "/pembimbing/mahasiswa", label: "Mahasiswa", icon: <Users className="w-5 h-5" />, roles: ["DPL"] },
  { href: "/admin/akun", label: "Akun", icon: <Users className="w-5 h-5" />, roles: ["SUPERADMIN"] },
  { href: "/admin/penempatan", label: "Penempatan", icon: <Shield className="w-5 h-5" />, roles: ["SUPERADMIN", "KAPRODI"] },
  { href: "/admin/tempat-magang", label: "Tempat Magang", icon: <Building className="w-5 h-5" />, roles: ["SUPERADMIN", "KAPRODI"] },
  { href: "/admin/laporan-global", label: "Lap. Global", icon: <BarChart3 className="w-5 h-5" />, roles: ["SUPERADMIN", "KAPRODI"] },
  { href: "/profil", label: "Profil", icon: <User className="w-5 h-5" />, roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"], hideOnMobile: true },
  { href: "/pengaturan", label: "Pengaturan", icon: <Settings className="w-5 h-5" />, roles: ["SUPERADMIN", "KAPRODI", "DPL", "MENTOR_INSTANSI", "MAHASISWA"] },
];

export function Dock() {
  const mouseX = useMotionValue(Infinity);
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role ?? "MAHASISWA";
  
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-0 sm:left-1/2 sm:-translate-x-1/2 z-50 flex justify-center w-full sm:max-w-fit">
      {/* Background layer without shadow */}
      <div className="absolute bottom-0 left-4 right-4 sm:left-0 sm:right-0 h-14 sm:h-16 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl sm:rounded-3xl pointer-events-none -z-10" />
      
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="relative flex items-center sm:items-end h-[60px] sm:h-[140px] gap-3 sm:gap-3 px-3 sm:px-4 pb-0 sm:pb-2 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-max max-w-full mx-auto"
      >
        {filteredItems.map((item) => (
          <DockItem key={item.href} {...item} mouseX={mouseX} />
        ))}
      </motion.div>
    </div>
  );
}
