import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataMahasiswaContent from "@/components/pembimbing/DataMahasiswaContent";

export default async function DataMahasiswaPage() {
  const session = await auth();
  const role = (session.user as { role?: string })?.role ?? "";
  if (!["DPL", "MENTOR_INSTANSI", "SUPERADMIN"].includes(role)) redirect("/dashboard");

  return (
    <DashboardLayout>
      <DataMahasiswaContent />
    </DashboardLayout>
  );
}
