// app/api/file/[id]/route.ts
// GET  /api/file/[id]             — download a file (auth + ownership check or active FILE QR check)
// GET  /api/file/[id]?publicLogo=1 — serve logo image for QR landing pages (no auth, ownership via QR)
// DELETE /api/file/[id]             — delete a file (auth + ownership check)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteFile } from "@/lib/file/service";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/** Check if a file is used as a logo on any QR (MULTI_LINK pages or QRDesign). */
async function isLogoOwnedByQr(fileId: string): Promise<boolean> {
  const page = await prisma.multiLinkPage.findFirst({
    where: { logoFileId: fileId },
  });
  if (page) return true;

  const design = await prisma.qRDesign.findFirst({
    where: { logoFileId: fileId },
  });
  if (design) return true;

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

/** GET /api/file/[id] — serve file for download / display */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const isPublicLogo = req.nextUrl.searchParams.get("publicLogo") === "1";
  const qrParam = req.nextUrl.searchParams.get("qr");

  // 1. Fetch file record from database
  const storedFile = await prisma.storedFile.findUnique({ where: { id } });
  if (!storedFile) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "File not found" } },
      { status: 404 },
    );
  }

  // 2. Authorization check
  const isOwner = session?.user?.id && session.user.id === storedFile.userId;
  let isAuthorized = false;
  let cacheHeader = "private, max-age=3600";

  if (isOwner) {
    isAuthorized = true;
  } else if (isPublicLogo) {
    const isLinkedToQr = await isLogoOwnedByQr(id);
    if (isLinkedToQr) {
      isAuthorized = true;
      cacheHeader = "public, max-age=86400, stale-while-revalidate=604800";
    }
  } else {
    const isPublicFile = await isFileAttachedToActiveQr(id, qrParam);
    if (isPublicFile) {
      isAuthorized = true;
      cacheHeader = "public, max-age=3600";
    }
  }

  if (!isAuthorized) {
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "File access forbidden" } },
      { status: 403 },
    );
  }

  // 3. Retrieve binary payload (Database first for Serverless/Vercel, Local storage fallback)
  let fileBuffer: Buffer | Uint8Array | null = storedFile.fileData;
  if (!fileBuffer) {
    fileBuffer = await storage.retrieve(storedFile.storageKey);
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "File missing from storage" } },
      { status: 404 },
    );
  }

  // 4. Return binary response with appropriate headers
  const isImage = storedFile.mimeType.startsWith("image/");
  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": storedFile.mimeType,
      "Content-Disposition": isImage
        ? `inline; filename="${storedFile.originalName}"`
        : `attachment; filename="${storedFile.originalName}"`,
      "Content-Length": String(storedFile.sizeBytes),
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": cacheHeader,
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
