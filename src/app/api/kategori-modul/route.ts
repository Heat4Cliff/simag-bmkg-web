import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kategori = await prisma.kategoriModul.findMany({
    orderBy: { namaKategori: "asc" }
  });

  return NextResponse.json({ kategori });
}
