import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function RiwayatPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <span>Dashboard</span><span>/</span>
          <span className="text-[#1E8A3C] font-medium">Riwayat</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-3">Riwayat</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { href: "/riwayat/absensi", icon: "📋", title: "Riwayat Absensi", desc: "Lihat rekap kehadiran, status, dan jam kerja Anda." },
            { href: "/riwayat/laporan", icon: "📄", title: "Riwayat Laporan", desc: "Semua laporan harian yang sudah dibuat." },
          ].map((item) => (
            <a key={item.href} href={item.href} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-100 transition-all card-hover">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
