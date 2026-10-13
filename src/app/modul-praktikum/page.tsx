import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ModulContent from "@/components/modul/ModulContent";

export default async function ModulPraktikumPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <DashboardLayout>
      <ModulContent />
    </DashboardLayout>
  );
}
