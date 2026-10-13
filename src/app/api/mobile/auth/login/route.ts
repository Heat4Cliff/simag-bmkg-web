import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const isEmail = email.includes("@");

    const user = await prisma.user.findFirst({
      where: isEmail ? { email } : { username: email },
      include: {
        mahasiswaProfile: true,
        dplProfile: true,
        mentorProfile: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    if (!user.statusAktif) {
      return NextResponse.json(
        { success: false, message: "Akun Anda dinonaktifkan" },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Prepare payload
    const payload = {
      id: user.id,
      email: user.email,
      name: user.nama,
      role: user.role,
    };

    // Sign Token
    const token = signJwt(payload);

    // Return user data and token
    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.nama,
          email: user.email,
          role: user.role,
          fotoProfil: user.fotoProfil,
          mahasiswaProfile: user.mahasiswaProfile || null,
          dplProfile: user.dplProfile || null,
          mentorProfile: user.mentorProfile || null,
        }
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error("Mobile Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
