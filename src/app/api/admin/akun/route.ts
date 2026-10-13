import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      statusAktif: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await auth();
  const sessionRole = (session?.user as { role?: string })?.role;
  if (sessionRole !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nama, email, password, role } = body;

    if (!nama || !email || !password || !role) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Cek email unik
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nama,
          email,
          passwordHash,
          role,
          statusAktif: true,
        },
        select: {
          id: true,
          nama: true,
          email: true,
          role: true,
          statusAktif: true,
        },
      });

      if (role === "DPL") {
        await tx.dplProfile.create({ data: { userId: user.id } });
      } else if (role === "MENTOR_INSTANSI") {
        await tx.mentorProfile.create({ data: { userId: user.id } });
      } else if (role === "MAHASISWA") {
        await tx.mahasiswaProfile.create({ 
          data: { 
            userId: user.id, 
            nim: "-", 
            programStudi: "-",
            periodeMulai: new Date(),
            periodeSelesai: new Date(),
          } 
        });
      }

      return user;
    });

    return NextResponse.json({ message: "Akun berhasil dibuat", user: newUser });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Gagal membuat akun" }, { status: 500 });
  }
}
