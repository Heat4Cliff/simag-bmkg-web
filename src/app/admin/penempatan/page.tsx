import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PenempatanContent from "@/components/admin/PenempatanContent";

export default async function PenempatanPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "SUPERADMIN") redirect("/dashboard");

  return (
    <DashboardLayout>
      <PenempatanContent />
    </DashboardLayout>
  );
}
