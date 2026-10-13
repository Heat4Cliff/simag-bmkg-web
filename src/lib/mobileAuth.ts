import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { prisma } from "@/lib/db";

export async function getMobileAuthUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);

  if (!decoded || !decoded.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id as string },
  });

  return user;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function buildCorsResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}
