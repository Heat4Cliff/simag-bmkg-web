import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        mahasiswaProfile: true,
        dplProfile: true,
      }
    });
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      nama: user.nama,
      email: user.email,
      username: user.username || "",
      role: user.role,
      noHp: user.mahasiswaProfile?.noHp || user.dplProfile?.noHp || "",
      programStudi: user.mahasiswaProfile?.programStudi || "-",
      institusiAsal: "-",
      periodeMulai: user.mahasiswaProfile?.periodeMulai,
      fotoProfil: user.fotoProfil || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil profil" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nama, email, username, noHp, fotoProfilBase64 } = await request.json();
    const userId = session.user.id;
    const role = (session.user as { role?: string }).role;

    let fotoProfilUrl = undefined;

    // Handle foto profil upload
    if (fotoProfilBase64 && fotoProfilBase64.startsWith("data:image")) {
      const base64Data = fotoProfilBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const timestamp = Date.now();
      const namaFile = `avatar-${userId}-${timestamp}.jpg`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "profil");
      
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, namaFile);
      await writeFile(filePath, buffer);
      
      fotoProfilUrl = `/uploads/profil/${namaFile}`;
    }

    // Cek ketersediaan username jika diubah
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { username, id: { not: userId } }
      });
      if (existingUser) {
        return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
      }
    }

    // Update base user
    await prisma.user.update({
      where: { id: userId },
      data: { 
        nama, 
        email,
        username: username || null,
        ...(fotoProfilUrl && { fotoProfil: fotoProfilUrl })
      }
    });

    // Update profile based on role
    if (role === "MAHASISWA") {
      await prisma.mahasiswaProfile.upsert({
        where: { userId },
        update: { noHp },
        create: { userId, noHp }
      });
    } else if (role === "DPL") {
      await prisma.dplProfile.upsert({
        where: { userId },
        update: { noHp },
        create: { userId, noHp }
      });
    }

    return NextResponse.json({ 
      message: "Profil berhasil diperbarui", 
      fotoProfil: fotoProfilUrl 
    });
  } catch (error) {
    console.error("Profil PATCH Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
