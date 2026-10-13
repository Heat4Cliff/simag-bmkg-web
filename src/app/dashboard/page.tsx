import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
