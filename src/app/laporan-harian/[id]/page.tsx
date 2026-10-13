import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LaporanDetailContent from "@/components/laporan/LaporanDetailContent";

export default async function LaporanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const resolvedParams = await params;

  return (
    <DashboardLayout>
      <LaporanDetailContent id={resolvedParams.id} />
    </DashboardLayout>
  );
}
