import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RiwayatAbsensiContent from "@/components/riwayat/RiwayatAbsensiContent";

export default async function RiwayatAbsensiPage() {
  const session = await auth();
  if (!session) redirect("/login");
  
  return (
    <DashboardLayout>
      <RiwayatAbsensiContent />
    </DashboardLayout>
  );
}
