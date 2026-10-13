import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import NotifikasiContent from "@/components/notifikasi/NotifikasiContent";

export default async function NotifikasiPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <DashboardLayout>
      <NotifikasiContent />
    </DashboardLayout>
  );
}
