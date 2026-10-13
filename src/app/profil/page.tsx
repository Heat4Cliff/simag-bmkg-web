import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfilContent from "@/components/profil/ProfilContent";

export default async function ProfilPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <DashboardLayout>
      <ProfilContent />
    </DashboardLayout>
  );
}
