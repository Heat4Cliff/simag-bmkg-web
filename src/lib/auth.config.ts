import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 jam
  },
  providers: [], // Diisi nanti di auth.ts (karena middleware tidak mendukung pg/bcrypt)
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.fotoProfil = (user as { fotoProfil?: string | null }).fotoProfil ?? null;
        token.name = user.name;
        token.username = (user as { username?: string | null }).username ?? null;
        token.ip = (user as { ip?: string }).ip ?? "unknown";
      }
      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.email) token.email = session.user.email;
        if (session.user.fotoProfil !== undefined) token.fotoProfil = session.user.fotoProfil;
        if (session.user.username !== undefined) token.username = session.user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.fotoProfil = (token.fotoProfil as string | null) ?? null;
        if (token.name) session.user.name = token.name as string;
        (session.user as any).username = (token.username as string | null) ?? null;
        (session.user as any).ip = token.ip as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
