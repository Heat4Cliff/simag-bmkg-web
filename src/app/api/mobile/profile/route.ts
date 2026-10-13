import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getMobileAuthUser, buildCorsResponse } from "@/lib/mobileAuth";

export async function PUT(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) {
      return buildCorsResponse({ success: false, message: "Unauthorized" }, 401);
    }

    const body = await request.json();
    const { nama, email, username, passwordLama, passwordBaru } = body;

    const dataToUpdate: any = {};
    if (nama) dataToUpdate.nama = nama;
    if (email) dataToUpdate.email = email;
    if (username) dataToUpdate.username = username;

    if (passwordBaru) {
      if (!passwordLama) {
        return buildCorsResponse({ success: false, message: "Password lama wajib diisi" }, 400);
      }
      
      const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!currentUser) {
        return buildCorsResponse({ success: false, message: "User tidak ditemukan" }, 404);
      }

      const passwordMatch = await bcrypt.compare(passwordLama, currentUser.passwordHash);
      if (!passwordMatch) {
        return buildCorsResponse({ success: false, message: "Password lama salah" }, 400);
      }

      dataToUpdate.passwordHash = await bcrypt.hash(passwordBaru, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        nama: true,
        email: true,
        username: true,
        role: true,
        fotoProfil: true,
        mahasiswaProfile: true,
        dplProfile: true,
        mentorProfile: true,
      }
    });

    return buildCorsResponse({
      success: true,
      message: "Profil berhasil diperbarui",
      data: updatedUser
    });

  } catch (error: any) {
    console.error("Mobile Edit Profile Error:", error);
    return buildCorsResponse({ success: false, message: error.message }, 500);
  }
}

export async function OPTIONS() {
  return buildCorsResponse({}, 200);
}
