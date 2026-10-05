import { prisma } from "@/lib/db/prisma";
import { getDesign } from "@/lib/qr/design";
import type { QRCodeRecord } from "@/lib/qr/service";

export interface PublicQrDesign {
  foregroundColor: string;
  backgroundColor: string;
  dotStyle: string;
  cornerStyle: string;
  eyeStyle: string;
  frameStyle: string;
  frameText: string | null;
  errorCorrectionLevel: string;
}

export type PublicLookup =
  | { status: "missing" }
  | { status: "inactive"; qr: QRCodeRecord } // DISABLED / EXPIRED
  | { status: "active"; qr: QRCodeRecord; design: PublicQrDesign };

/**
 * Look up a public QR code by shortCode (no auth required).
 * Distinguishes "not found / soft-deleted" from "exists but inactive" so the
 * public page can render a 404 vs an unavailable page (spec §11.4).
 */
export async function getPublicQr(shortCode: string): Promise<PublicLookup> {
  const qr = await prisma.qRCode.findFirst({
    where: {
      shortCode,
      deletedAt: null,
    },
  });

  if (!qr) return { status: "missing" };

  const record: QRCodeRecord = {
    id: qr.id,
    userId: qr.userId,
    shortCode: qr.shortCode,
    name: qr.name,
    type: qr.type as string,
    data: qr.data as Record<string, unknown>,
    status: qr.status as string,
    isDynamic: qr.isDynamic,
    createdAt: qr.createdAt,
    updatedAt: qr.updatedAt,
    deletedAt: qr.deletedAt,
  };

  if (qr.status !== "ACTIVE") {
    return { status: "inactive", qr: record };
  }

  const design = await getDesign(qr.id);

  return {
    status: "active",
    qr: record,
    design: {
      foregroundColor: design.foregroundColor ?? "#000000",
      backgroundColor: design.backgroundColor ?? "#ffffff",
      dotStyle: design.dotStyle ?? "square",
      cornerStyle: design.cornerStyle ?? "square",
      eyeStyle: design.eyeStyle ?? "square",
      frameStyle: design.frameStyle ?? "none",
      frameText: design.frameText ?? null,
      errorCorrectionLevel: design.errorCorrectionLevel ?? "M",
    },
  };
}