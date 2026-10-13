import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    fotoProfil?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      fotoProfil?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    fotoProfil?: string | null;
  }
}
