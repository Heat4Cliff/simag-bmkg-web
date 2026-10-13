import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMobileAuthUser, buildCorsResponse, corsHeaders } from "@/lib/mobileAuth";

export async function GET(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) return buildCorsResponse({ success: false, message: "Unauthorized" }, 401);

    const riwayat = await prisma.absensi.findMany({
      where: { userId: user.id },
      orderBy: { tanggal: "desc" },
      take: 30, // Get last 30 days
    });

    return buildCorsResponse({ success: true, data: riwayat });
  } catch (error: any) {
    console.error("Mobile Riwayat Absensi GET Error:", error);
    return buildCorsResponse({ success: false, message: error.message }, 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
