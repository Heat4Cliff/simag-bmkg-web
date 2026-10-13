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
    const laporan = await prisma.laporanHarian.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: {
          include: {
            mahasiswaProfile: true
          }
        },
      }
    });

    if (!laporan) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "LAPORAN HARIAN MAGANG",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Nama: ", bold: true }),
                new TextRun(laporan.user.nama),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun("-"),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Tanggal: ", bold: true }),
                new TextRun(formatTanggal(new Date(laporan.tanggal))),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Status: ", bold: true }),
                new TextRun(laporan.status),
              ],
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              text: "Judul Kegiatan",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: laporan.judul,
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: "Deskripsi Kegiatan",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            ...laporan.deskripsi.split('\n').map(line => new Paragraph({ text: line })),
            
            new Paragraph({
              text: "Kendala / Masalah",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
            }),
            ... (laporan.kendala ? laporan.kendala.split('\n').map(line => new Paragraph({ text: line })) : [new Paragraph({ text: "-" })]),

            new Paragraph({
              text: "Catatan Pembimbing",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
            }),
            ... (laporan.catatanPembimbing ? laporan.catatanPembimbing.split('\n').map(line => new Paragraph({ text: line })) : [new Paragraph({ text: "-" })]),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Laporan_${laporan.judul.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx"`,
      },
    });
  } catch (error) {
    console.error("Export Laporan Error:", error);
    return new NextResponse("Gagal membuat dokumen", { status: 500 });
  }
}
