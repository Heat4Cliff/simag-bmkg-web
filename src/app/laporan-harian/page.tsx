import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LaporanContent from "@/components/laporan/LaporanContent";

export default async function LaporanHarianPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <DashboardLayout>
      <LaporanContent />
    </DashboardLayout>
  );
}
