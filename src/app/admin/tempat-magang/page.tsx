import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TempatMagangContent from "@/components/admin/TempatMagangContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Tempat Magang | SIMAG",
  description: "Kelola data tempat magang/mitra instansi beserta lokasinya",
};

export default async function TempatMagangPage() {
  const session = await auth();

  // Hanya Superadmin dan Kaprodi yang bisa akses
  if (!session || !["SUPERADMIN", "KAPRODI"].includes((session.user as any).role)) {
    redirect("/dashboard");
  }

  return <TempatMagangContent />;
}
