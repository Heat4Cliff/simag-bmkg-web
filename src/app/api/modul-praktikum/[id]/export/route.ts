import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTanggal } from "@/lib/utils";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const modul = await prisma.modulPraktikum.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: {
          include: { mahasiswaProfile: true }
        },
        kategori: true,
      }
    });

    if (!modul) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "MODUL PRAKTIKUM MAGANG",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Nama: ", bold: true }),
                new TextRun(modul.user.nama),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Kategori: ", bold: true }),
                new TextRun(modul.kategori.namaKategori),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Tanggal Dibuat: ", bold: true }),
                new TextRun(formatTanggal(new Date(modul.createdAt))),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Status Review: ", bold: true }),
                new TextRun(modul.statusReview),
              ],
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              text: "Judul Modul",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: modul.judul,
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: "Konten Praktikum",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            ...modul.konten.split('\n').map(line => new Paragraph({ text: line })),

            new Paragraph({
              text: "Catatan Reviewer",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
            }),
            ... (modul.catatanReview ? modul.catatanReview.split('\n').map(line => new Paragraph({ text: line })) : [new Paragraph({ text: "-" })]),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Modul_${modul.judul.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx"`,
      },
    });
  } catch (error) {
    console.error("Export Modul Error:", error);
    return new NextResponse("Gagal membuat dokumen", { status: 500 });
  }
}
