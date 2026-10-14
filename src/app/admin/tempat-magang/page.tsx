import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TempatMagangContent from "@/components/admin/TempatMagangContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Tempat Magang | SIMAG",
  description: "Kelola data tempat magang/mitra instansi beserta lokasinya",
};

export default async function TempatMagangPage() {
  const session = await auth();

  // Hanya Superadmin yang bisa akses
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <TempatMagangContent />
    </DashboardLayout>
  );
}
