import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "application/octet-stream";
  }
}

export async function GET(request: Request, props: { params: Promise<{ folder: string, filename: string }> }) {
  const params = await props.params;
  const { folder, filename } = params;
  
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", folder, filename);
    const fileBuffer = await readFile(filePath);
    
    const contentType = getContentType(filename);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("File not found", { status: 404 });
  }
}
