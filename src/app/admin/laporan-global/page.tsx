import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LaporanGlobalContent from "@/components/admin/LaporanGlobalContent";

export default async function LaporanGlobalPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "SUPERADMIN") redirect("/dashboard");

  return (
    <DashboardLayout>
      <LaporanGlobalContent />
    </DashboardLayout>
  );
}
