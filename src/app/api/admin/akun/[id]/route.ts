import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    
    // Jangan hapus diri sendiri
    if (session?.user?.id === resolvedParams.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ message: "Akun berhasil dihapus" });
  } catch (err) {
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const body = await request.json();

    if (session?.user?.id === resolvedParams.id && body.statusAktif === false) {
      return NextResponse.json({ error: "Tidak dapat menonaktifkan akun sendiri" }, { status: 400 });
    }

    const updateData: any = {};
    if (body.statusAktif !== undefined) updateData.statusAktif = body.statusAktif;
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.password) {
      const bcrypt = require("bcryptjs");
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: resolvedParams.id },
        data: updateData
      });

      if (body.role && body.role !== session?.user?.role) { // Just check if role was updated
        if (body.role === "DPL") {
          await tx.dplProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
        } else if (body.role === "MENTOR_INSTANSI") {
          await tx.mentorProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
        } else if (body.role === "MAHASISWA") {
          await tx.mahasiswaProfile.upsert({ 
            where: { userId: user.id }, 
            update: {}, 
            create: { 
              userId: user.id, nim: "-", programStudi: "-", 
              periodeMulai: new Date(), periodeSelesai: new Date() 
            } 
          });
        }
      }
      return user;
    });

    return NextResponse.json({ message: "Data akun diperbarui", user: updatedUser });
  } catch (err) {
    console.error("Patch Error:", err);
    return NextResponse.json({ error: "Gagal memperbarui data" }, { status: 500 });
  }
}
