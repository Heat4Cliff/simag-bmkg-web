import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RiwayatLaporanContent from "@/components/riwayat/RiwayatLaporanContent";

export default async function RiwayatLaporanPage() {
  const session = await auth();
  if (!session) redirect("/login");
  
  return (
    <DashboardLayout>
      <RiwayatLaporanContent />
    </DashboardLayout>
  );
}
