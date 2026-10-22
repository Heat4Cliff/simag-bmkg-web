import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTanggal } from "@/lib/utils";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
} from "docx";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("userId") || searchParams.get("mahasiswaId");
  const currentRole = (session.user as { role?: string })?.role;
  const currentUserId = session.user.id;

  let targetUserId = currentUserId;

  if (currentRole === "MAHASISWA") {
    // Mahasiswa selalu mengekspor laporannya sendiri
    targetUserId = currentUserId;
  } else if (["DPL", "MENTOR_INSTANSI", "SUPERADMIN"].includes(currentRole || "")) {
    if (!requestedUserId) {
      return NextResponse.json(
        { error: "Parameter userId wajib disertakan untuk peran pembimbing / admin." },
        { status: 400 }
      );
    }

    if (currentRole === "DPL") {
      const dplProfile = await prisma.dplProfile.findUnique({ where: { userId: currentUserId } });
      const isAssigned = await prisma.mahasiswaProfile.findFirst({
        where: { userId: requestedUserId, dplId: dplProfile?.id },
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "Mahasiswa ini tidak berada di bawah bimbingan Anda." }, { status: 403 });
      }
    } else if (currentRole === "MENTOR_INSTANSI") {
      const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: currentUserId } });
      const isAssigned = await prisma.mahasiswaProfile.findFirst({
        where: { userId: requestedUserId, mentorId: mentorProfile?.id },
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "Mahasiswa ini tidak berada di bawah bimbingan Anda." }, { status: 403 });
      }
    }

    targetUserId = requestedUserId;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        mahasiswaProfile: {
          include: {
            tempatMagang: true,
            dpl: {
              include: {
                user: { select: { nama: true } },
              },
            },
            mentor: {
              include: {
                user: { select: { nama: true } },
              },
            },
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Data mahasiswa tidak ditemukan." }, { status: 404 });
    }

    // Ambil seluruh laporan harian secara global (urut dari hari pertama hingga selesai)
    const laporanList = await prisma.laporanHarian.findMany({
      where: { userId: targetUserId },
      orderBy: { tanggal: "asc" },
    });

    if (laporanList.length === 0) {
      return NextResponse.json(
        { error: "Belum ada laporan harian yang dibuat untuk diekspor." },
        { status: 400 }
      );
    }

    const profile = targetUser.mahasiswaProfile;
    const tempatMagang = profile?.tempatMagang;
    const dpl = profile?.dpl;
    const mentor = profile?.mentor;

    const periodeStr =
      profile?.periodeMulai && profile?.periodeSelesai
        ? `${formatTanggal(profile.periodeMulai)} s/d ${formatTanggal(profile.periodeSelesai)}`
        : laporanList.length > 0
        ? `${formatTanggal(laporanList[0].tanggal)} s/d ${formatTanggal(laporanList[laporanList.length - 1].tanggal)}`
        : "-";

    const borderNone = {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    };

    const borderLight = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    };

    // Tabel Informasi Mahasiswa & Tempat Magang
    const infoRows = [
      ["Nama Mahasiswa", `: ${targetUser.nama}`],
      ["NIM", `: ${profile?.nim || "-"}`],
      ["Program Studi", `: ${profile?.programStudi || "-"}`],
      ["Tempat / Instansi Magang", `: ${tempatMagang?.namaInstansi || "Kantor BMKG"}`],
      ["Alamat Instansi", `: ${tempatMagang?.alamat || "-"}`],
      ["Dosen Pembimbing Lapangan", `: ${dpl?.user?.nama || "-"} ${dpl?.nip ? `(NIP. ${dpl.nip})` : ""}`],
      ["Pembimbing / Mentor Instansi", `: ${mentor?.user?.nama || "-"} ${mentor?.jabatan ? `(${mentor.jabatan})` : ""}`],
      ["Periode Magang", `: ${periodeStr}`],
      ["Total Logbook Tercatat", `: ${laporanList.length} Hari Kegiatan`],
    ].map(
      ([label, val]) =>
        new TableRow({
          children: [
            new TableCell({
              borders: borderNone,
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true, size: 20 })],
                  spacing: { before: 40, after: 40 },
                }),
              ],
            }),
            new TableCell({
              borders: borderNone,
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: val, size: 20 })],
                  spacing: { before: 40, after: 40 },
                }),
              ],
            }),
          ],
        })
    );

    const infoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderNone,
      rows: infoRows,
    });

    // Header tabel logbook
    const tableHeaderRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          shading: { fill: "1E8A3C" },
          borders: borderLight,
          width: { size: 5, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "NO", bold: true, color: "FFFFFF", size: 19 })],
            }),
          ],
        }),
        new TableCell({
          shading: { fill: "1E8A3C" },
          borders: borderLight,
          width: { size: 18, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "HARI / TANGGAL", bold: true, color: "FFFFFF", size: 19 })],
            }),
          ],
        }),
        new TableCell({
          shading: { fill: "1E8A3C" },
          borders: borderLight,
          width: { size: 45, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "URAIAN KEGIATAN", bold: true, color: "FFFFFF", size: 19 })],
            }),
          ],
        }),
        new TableCell({
          shading: { fill: "1E8A3C" },
          borders: borderLight,
          width: { size: 16, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "KENDALA", bold: true, color: "FFFFFF", size: 19 })],
            }),
          ],
        }),
        new TableCell({
          shading: { fill: "1E8A3C" },
          borders: borderLight,
          width: { size: 16, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "STATUS & CATATAN", bold: true, color: "FFFFFF", size: 19 })],
            }),
          ],
        }),
      ],
    });

    // Baris isi tabel logbook
    const logbookDataRows = laporanList.map((item, idx) => {
      const isZebra = idx % 2 === 1;
      const rowFill = isZebra ? "F8FAFC" : "FFFFFF";

      const uraianParagraphs: Paragraph[] = [
        new Paragraph({
          children: [new TextRun({ text: item.judul, bold: true, size: 20, color: "0F172A" })],
          spacing: { after: 60 },
        }),
      ];

      const deskripsiLines = item.deskripsi.split("\n").filter((l) => l.trim() !== "");
      if (deskripsiLines.length === 0) {
        uraianParagraphs.push(new Paragraph({ children: [new TextRun({ text: "-", size: 19 })] }));
      } else {
        deskripsiLines.forEach((line) => {
          uraianParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line, size: 19, color: "334155" })],
              spacing: { after: 40 },
            })
          );
        });
      }

      const kendalaParagraphs: Paragraph[] = [];
      if (item.kendala && item.kendala.trim() !== "") {
        item.kendala
          .split("\n")
          .filter((l) => l.trim() !== "")
          .forEach((line) => {
            kendalaParagraphs.push(
              new Paragraph({
                children: [new TextRun({ text: line, size: 19, color: "B91C1C" })],
                spacing: { after: 40 },
              })
            );
          });
      } else {
        kendalaParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: "-", size: 19, color: "94A3B8" })],
          })
        );
      }

      const statusParagraphs: Paragraph[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: `[${item.status}]`,
              bold: true,
              size: 19,
              color: item.status === "DISETUJUI" ? "15803D" : item.status === "REVISI" ? "C2410C" : "475569",
            }),
          ],
          spacing: { after: 40 },
        }),
      ];

      if (item.catatanPembimbing && item.catatanPembimbing.trim() !== "") {
        statusParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Catatan: ${item.catatanPembimbing}`,
                italics: true,
                size: 18,
                color: "475569",
              }),
            ],
          })
        );
      }

      return new TableRow({
        children: [
          new TableCell({
            shading: { fill: rowFill },
            borders: borderLight,
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(idx + 1), size: 19 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: rowFill },
            borders: borderLight,
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: formatTanggal(item.tanggal), bold: true, size: 19 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: rowFill },
            borders: borderLight,
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: uraianParagraphs,
          }),
          new TableCell({
            shading: { fill: rowFill },
            borders: borderLight,
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: kendalaParagraphs,
          }),
          new TableCell({
            shading: { fill: rowFill },
            borders: borderLight,
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: statusParagraphs,
          }),
        ],
      });
    });

    const logbookTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderLight,
      rows: [tableHeaderRow, ...logbookDataRows],
    });

    // Tabel Lembar Pengesahan / Tanda Tangan
    const ttdTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderNone,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: borderNone,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Mengetahui,", size: 20 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: "Dosen Pembimbing Lapangan (DPL),", bold: true, size: 20 })],
                  spacing: { after: 1200 }, // Spasi tanda tangan
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: dpl?.user?.nama ? `(${dpl.user.nama})` : "(....................................................)",
                      bold: true,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: dpl?.nip ? `NIP. ${dpl.nip}` : "NIP. ....................................................",
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: borderNone,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Menyetujui,", size: 20 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: "Pembimbing Lapangan / Mentor,", bold: true, size: 20 })],
                  spacing: { after: 1200 }, // Spasi tanda tangan
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: mentor?.user?.nama ? `(${mentor.user.nama})` : "(....................................................)",
                      bold: true,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: mentor?.jabatan ? `Jabatan: ${mentor.jabatan}` : "NIP/Jabatan: .......................................",
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
            },
          },
          children: [
            new Paragraph({
              text: "LOGBOOK HARIAN MAGANG",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "SISTEM INFORMASI MANAJEMEN MAGANG (SIMAG) BMKG",
                  bold: true,
                  size: 20,
                  color: "1E8A3C",
                }),
              ],
              spacing: { after: 400 },
            }),

            new Paragraph({
              text: "I. IDENTITAS MAHASISWA & TEMPAT MAGANG",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 150 },
            }),
            infoTable,

            new Paragraph({
              text: "II. REKAPITULASI LOGBOOK HARIAN",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 150 },
            }),
            logbookTable,

            new Paragraph({
              text: "Demikian laporan logbook harian ini disusun secara berkala dan sebenar-benarnya sebagai dokumentasi pelaksanaan program magang.",
              spacing: { before: 400, after: 400 },
            }),

            ttdTable,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const sanitizedNama = targetUser.nama.replace(/[^a-zA-Z0-9]/g, "_");
    const sanitizedNim = (profile?.nim || "mhs").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Logbook_Magang_${sanitizedNama}_${sanitizedNim}.docx`;

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export Global Logbook Error:", error);
    return NextResponse.json({ error: "Gagal memproses dokumen logbook." }, { status: 500 });
  }
}
