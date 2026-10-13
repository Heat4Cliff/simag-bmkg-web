import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AbsensiContent from "@/components/absensi/AbsensiContent";

export default async function AbsensiPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "MAHASISWA") redirect("/dashboard");

  return (
    <DashboardLayout>
      <AbsensiContent />
    </DashboardLayout>
  );
}
