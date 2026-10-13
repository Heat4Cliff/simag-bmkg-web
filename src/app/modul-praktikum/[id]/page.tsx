import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ModulDetailContent from "@/components/modul/ModulDetailContent";

export default async function ModulDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const resolvedParams = await params;

  return (
    <DashboardLayout>
      <ModulDetailContent id={resolvedParams.id} />
    </DashboardLayout>
  );
}
