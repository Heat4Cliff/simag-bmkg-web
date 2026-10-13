import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PengaturanContent from "@/components/pengaturan/PengaturanContent";

export default async function PengaturanPage() {
  const session = await auth();
  if (!session) redirect("/login");
  
  return (
    <DashboardLayout>
      <PengaturanContent />
    </DashboardLayout>
  );
}
