import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const notifications = await prisma.notifikasi.findMany({
      where: { userId: session.user.id },
      orderBy: { dibuatPada: "desc" },
      take: 50
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.notifikasi.updateMany({
      where: { userId: session.user.id, dibaca: false },
      data: { dibaca: true }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
