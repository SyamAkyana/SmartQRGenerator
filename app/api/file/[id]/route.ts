// app/api/file/[id]/route.ts
// GET  /api/file/[id]             — download a file (auth + ownership check or active FILE QR check)
// GET  /api/file/[id]?publicLogo=1 — serve logo image for QR landing pages (no auth, ownership via QR)
// DELETE /api/file/[id]             — delete a file (auth + ownership check)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFile, deleteFile } from "@/lib/file/service";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/db/prisma";
import fs from "node:fs";

/** Check if a file is used as a logo on any QR (MULTI_LINK pages or QRDesign). */
async function isLogoOwnedByQr(fileId: string, requestingUserId?: string): Promise<boolean> {
  const page = await prisma.multiLinkPage.findFirst({
    where: { logoFileId: fileId },
    include: { qrCode: { select: { userId: true } } },
  });
  if (page) {
    return !requestingUserId || page.qrCode.userId === requestingUserId;
  }

  const design = await prisma.qRDesign.findFirst({
    where: { logoFileId: fileId },
    include: { qrCode: { select: { userId: true } } },
  });
  if (design) {
    return !requestingUserId || design.qrCode.userId === requestingUserId;
  }

  return false;
}

/** Check if a file is linked to an active FILE type QR code for public access. */
async function isFileAttachedToActiveQr(fileId: string, shortCode?: string | null): Promise<boolean> {
  if (shortCode) {
    const qr = await prisma.qRCode.findUnique({
      where: { shortCode },
      select: { status: true, type: true, data: true },
    });
    if (qr && qr.status === "ACTIVE" && qr.type === "FILE") {
      const data = qr.data as Record<string, unknown> | null;
      if (data?.fileId === fileId) return true;
    }
  }

  const activeFileQrs = await prisma.qRCode.findMany({
    where: {
      type: "FILE",
      status: "ACTIVE",
      deletedAt: null,
    },
    select: { data: true },
  });

  return activeFileQrs.some((qr) => {
    const data = qr.data as Record<string, unknown> | null;
    return data?.fileId === fileId;
  });
}

/** GET /api/file/[id] — serve file for download */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const isPublicLogo = req.nextUrl.searchParams.get("publicLogo") === "1";
  const qrParam = req.nextUrl.searchParams.get("qr");

  // Public logo mode: no auth required, but must be a logo on a QR page
  if (isPublicLogo) {
    const isAllowed = await isLogoOwnedByQr(id, session?.user?.id);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Logo not accessible" } },
        { status: 403 },
      );
    }

    const storedFile = await prisma.storedFile.findUnique({ where: { id } });
    if (!storedFile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "File not found" } },
        { status: 404 },
      );
    }

    const filePath = storage.getPath(storedFile.storageKey);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "File missing from storage" } },
        { status: 404 },
      );
    }

    const fileBuffer = await storage.retrieve(storedFile.storageKey);
    if (!fileBuffer) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "File missing from storage" } },
        { status: 404 },
      );
    }

    const isImage = storedFile.mimeType.startsWith("image/");
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": storedFile.mimeType,
        "Content-Disposition": isImage ? "inline" : `attachment; filename="${storedFile.originalName}"`,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Public file mode for active FILE QR codes: no user session required
  const isPublicFile = await isFileAttachedToActiveQr(id, qrParam);
  if (!session?.user?.id && isPublicFile) {
    const storedFile = await prisma.storedFile.findUnique({ where: { id } });
    if (!storedFile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "File not found" } },
        { status: 404 },
      );
    }

    const filePath = storage.getPath(storedFile.storageKey);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "File missing from storage" } },
        { status: 404 },
      );
    }

    const fileBuffer = await storage.retrieve(storedFile.storageKey);
    if (!fileBuffer) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "File missing from storage" } },
        { status: 404 },
      );
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": storedFile.mimeType,
        "Content-Disposition": `attachment; filename="${storedFile.originalName}"`,
        "Content-Length": String(storedFile.sizeBytes),
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Authenticated mode: must own the file
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const record = await getFile(id, session.user.id);
  if (!record) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "File not found" } },
      { status: 404 },
    );
  }

  const authFilePath = storage.getPath(record.storageKey);
  if (!fs.existsSync(authFilePath)) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "File missing from storage" } },
      { status: 404 },
    );
  }

  const authFileBuffer = await storage.retrieve(record.storageKey);
  if (!authFileBuffer) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "File missing from storage" } },
      { status: 404 },
    );
  }

  const isImage = record.mimeType.startsWith("image/");
  return new NextResponse(new Uint8Array(authFileBuffer), {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Disposition": isImage ? `inline; filename="${record.originalName}"` : `attachment; filename="${record.originalName}"`,
      "Content-Length": String(record.sizeBytes),
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "private, no-cache",
    },
  });
}

/** DELETE /api/file/[id] — delete a file */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const result = await deleteFile(id, session.user.id);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.error.code === "NOT_FOUND" ? 404 : 400 },
    );
  }

  return NextResponse.json({ success: true });
}
