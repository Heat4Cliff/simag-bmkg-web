import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMobileAuthUser, buildCorsResponse, corsHeaders } from "@/lib/mobileAuth";

export async function GET(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) return buildCorsResponse({ success: false, message: "Unauthorized" }, 401);

    const kategori = await prisma.kategoriModul.findMany({
      orderBy: { namaKategori: "asc" }
    });

    return buildCorsResponse({ success: true, data: kategori });
  } catch (error: any) {
    return buildCorsResponse({ success: false, message: error.message }, 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
