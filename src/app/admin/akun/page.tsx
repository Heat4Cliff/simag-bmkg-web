import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AkunContent from "@/components/admin/AkunContent";

export default async function AkunPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "SUPERADMIN") redirect("/dashboard");

  return (
    <DashboardLayout>
      <AkunContent />
    </DashboardLayout>
  );
}
