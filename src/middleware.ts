import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const role = (session?.user as { role?: string })?.role;
  const sessionIp = (session?.user as { ip?: string })?.ip;
  // Get IP from Cloudflare or X-Forwarded-For
  const currentIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(',')[0].trim() || req.ip || "unknown";

  const isInvalidIp = sessionIp && sessionIp !== "unknown" && currentIp !== "unknown" && sessionIp !== currentIp;

  // Rute publik (tidak perlu auth)
  const publicRoutes = ["/login"];
  if (publicRoutes.includes(pathname)) {
    // Jika sudah login dan IP valid, redirect ke dashboard
    if (session && !isInvalidIp) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Jika IP invalid tapi ada session, biarkan di halaman login tapi force delete cookies
    if (session && isInvalidIp) {
      const response = NextResponse.next();
      response.cookies.delete("authjs.session-token");
      response.cookies.delete("__Secure-authjs.session-token");
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }
    return NextResponse.next();
  }

  // Jika belum login, redirect ke login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // IP Check: Jika IP saat ini tidak sama dengan IP di sesi, paksa login ulang
  if (isInvalidIp) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "InvalidIP");
    
    const response = NextResponse.redirect(loginUrl);
    // Hapus cookies session secara paksa agar terlogout
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return response;
  }

  // Route protection berdasarkan role
  if (pathname.startsWith("/admin") && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/pembimbing") && !["SUPERADMIN", "DPL"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|unugha-logo.png|.*\\.apk$).*)",
  ],
};
