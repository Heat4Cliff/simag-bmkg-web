import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataMahasiswaContent from "@/components/pembimbing/DataMahasiswaContent";

export default async function DataMahasiswaPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "DPL") redirect("/dashboard");

  return (
    <DashboardLayout>
      <DataMahasiswaContent />
    </DashboardLayout>
  );
}
