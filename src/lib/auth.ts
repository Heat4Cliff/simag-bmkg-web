import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email atau Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;

        // Cek apakah identifier adalah email atau username
        const isEmail = identifier.includes("@");

        const user = await prisma.user.findFirst({
          where: isEmail ? { email: identifier } : { username: identifier },
          include: {
            mahasiswaProfile: true,
            dplProfile: true,
            mentorProfile: true,
          },
        });

        if (!user || !user.statusAktif) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        // Ambil IP
        let ip = "unknown";
        if (req instanceof Request) {
          ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        }

        return {
          id: user.id,
          name: user.nama,
          email: user.email,
          username: user.username,
          role: user.role,
          fotoProfil: user.fotoProfil,
          mahasiswaProfileId: user.mahasiswaProfile?.id ?? null,
          dplProfileId: user.dplProfile?.id ?? null,
          mentorProfileId: user.mentorProfile?.id ?? null,
          ip,
        };
      },
    }),
  ],
});

