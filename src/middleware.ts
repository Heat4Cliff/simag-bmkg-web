import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const role = (session?.user as { role?: string })?.role;

  // Rute publik (tidak perlu auth)
  const publicRoutes = ["/login"];
  if (publicRoutes.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Jika belum login, redirect ke login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Route protection berdasarkan role
  if (pathname.startsWith("/admin") && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/pembimbing") && !["SUPERADMIN", "DPL", "MENTOR_INSTANSI"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|unugha-logo.png|.*\\.apk$).*)",
  ],
};
