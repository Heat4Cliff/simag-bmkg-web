import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KalenderContent from "@/components/kalender/KalenderContent";

export default async function KalenderPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <KalenderContent />
    </DashboardLayout>
  );
}
