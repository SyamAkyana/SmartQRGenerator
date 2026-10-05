import { prisma } from "@/lib/db/prisma";
import { generateShortCode } from "@/lib/qr/shortcode";
import { createQrSchema, updateQrSchema } from "@/lib/qr/types";
import { designSchema, type DesignData } from "@/lib/qr/design";
import type { QRType } from "@/lib/qr/types";
import type { Prisma } from "@prisma/client";

export type { QRType, QRStatus } from "@/lib/qr/types";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type QrResult =
  | { success: true; qr: QRCodeRecord }
  | { success: false; error: { code: string; message: string } };

export interface QRCodeRecord {
  id: string;
  userId: string;
  shortCode: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  status: string;
  isDynamic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  scanCount?: number;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Map Prisma QRCode to QRCodeRecord */
function mapQr(qr: {
  id: string;
  userId: string;
  shortCode: string;
  name: string;
  type: string;
  data: Prisma.JsonValue;
  status: string;
  isDynamic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): QRCodeRecord {
  return {
    ...qr,
    type: qr.type as string,
    status: qr.status as string,
    data: qr.data as Record<string, unknown>,
  };
}

/** Map null → null, or Prisma row → QRCodeRecord */
function mapQrOrNull(
  qr: {
    id: string;
    userId: string;
    shortCode: string;
    name: string;
    type: string;
    data: Prisma.JsonValue;
    status: string;
    isDynamic: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } | null
): QRCodeRecord | null {
  return qr ? mapQr(qr) : null;
}

// ---------------------------------------------------------------------------
// CRUD operations — all enforce userId ownership
// ---------------------------------------------------------------------------

/**
 * Create a new QR code for the given user.
 * Generates a unique shortCode (retry on collision).
 */
export async function createQr(
  userId: string,
  input: {
    name: string;
    type?: string;
    data?: Record<string, unknown>;
    design?: Partial<DesignData>;
  }
): Promise<QrResult> {
  const parsed = createQrSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Validation failed" },
    };
  }

  const { name, type, data } = parsed.data;

  // Generate unique shortCode (handle collision via retry)
  let shortCode = generateShortCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.qRCode.findUnique({ where: { shortCode } });
    if (!existing) break;
    shortCode = generateShortCode();
  }

  const qr = await prisma.qRCode.create({
    data: {
      userId,
      shortCode,
      name,
      type: type as QRType,
      data: data as Prisma.InputJsonValue,
      status: "ACTIVE",
      isDynamic: true,
    },
  });

  // Auto-create an empty MultiLinkPage when type is MULTI_LINK
  if (type === "MULTI_LINK") {
    await prisma.multiLinkPage.create({ data: { qrCodeId: qr.id } });
  }

  // Save design if provided
  if (input.design) {
    const validatedDesign = designSchema.partial().safeParse(input.design);
    if (validatedDesign.success && Object.keys(validatedDesign.data).length > 0) {
      await prisma.qRDesign.upsert({
        where: { qrCodeId: qr.id },
        create: { qrCodeId: qr.id, ...validatedDesign.data },
        update: validatedDesign.data,
      });
    }
  }

  return { success: true, qr: mapQr(qr) };
}

/**
 * Get a single QR code by ID, verifying ownership.
 * Supports both database id (e.g. cmua1ffau...) and shortCode (e.g. xD3DMUU).
 */
export async function getQrById(id: string, userId: string): Promise<QRCodeRecord | null> {
  // Try database id first, then shortCode
  const qr = await prisma.qRCode.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (qr) return mapQr(qr);
  return mapQrOrNull(
    await prisma.qRCode.findFirst({ where: { shortCode: id, userId, deletedAt: null } })
  );
}

/**
 * List all QR codes for a user (excludes soft-deleted).
 */
export async function listQrCodes(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<QRCodeRecord[]> {
  const qrs = await prisma.qRCode.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: options?.limit,
    skip: options?.offset,
  });
  return qrs.map(mapQr);
}

/**
 * Count total QR codes for a user (excludes soft-deleted).
 */
export async function countQrCodes(userId: string): Promise<number> {
  return prisma.qRCode.count({ where: { userId, deletedAt: null } });
}

/**
 * Update a QR code (name, type, data). Ownership enforced.
 */
export async function updateQr(
  id: string,
  userId: string,
  input: { name?: string; type?: string; data?: Record<string, unknown> }
): Promise<QrResult> {
  const parsed = updateQrSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Validation failed" },
    };
  }

  const qr = await prisma.qRCode.findFirst({ where: { id, userId, deletedAt: null } });
  if (!qr) {
    return { success: false, error: { code: "NOT_FOUND", message: "QR code not found" } };
  }

  const { name, type, data } = parsed.data;
  const updated = await prisma.qRCode.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type: type as QRType }),
      ...(data !== undefined && { data: data as Prisma.InputJsonValue }),
    },
  });

  // Auto-create MultiLinkPage when converting to MULTI_LINK
  if (type === "MULTI_LINK") {
    const existing = await prisma.multiLinkPage.findUnique({ where: { qrCodeId: id } });
    if (!existing) {
      await prisma.multiLinkPage.create({ data: { qrCodeId: id } });
    }
  }

  return { success: true, qr: mapQr(updated) };
}

/**
 * Soft-delete a QR code (sets deletedAt + status = DELETED).
 */
export async function deleteQr(id: string, userId: string): Promise<QrResult> {
  const qr = await prisma.qRCode.findFirst({ where: { id, userId, deletedAt: null } });
  if (!qr) {
    return { success: false, error: { code: "NOT_FOUND", message: "QR code not found" } };
  }

  await prisma.qRCode.update({
    where: { id },
    data: { deletedAt: new Date(), status: "DELETED" },
  });

  return { success: true, qr: mapQr({ ...qr, deletedAt: new Date(), status: "DELETED" }) };
}

/**
 * Duplicate a QR code with a new shortCode and "(Copy)" suffix on the name.
 */
export async function duplicateQr(id: string, userId: string): Promise<QrResult> {
  const original = await prisma.qRCode.findFirst({ where: { id, userId, deletedAt: null } });
  if (!original) {
    return { success: false, error: { code: "NOT_FOUND", message: "QR code not found" } };
  }

  let shortCode = generateShortCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.qRCode.findUnique({ where: { shortCode } });
    if (!existing) break;
    shortCode = generateShortCode();
  }

  const copy = await prisma.qRCode.create({
    data: {
      userId,
      shortCode,
      name: `${original.name} (Copy)`,
      type: original.type as QRType,
      data: original.data as Prisma.InputJsonValue,
      status: "ACTIVE",
      isDynamic: original.isDynamic,
    },
  });

  // Duplicate the MultiLinkPage if the original has one
  if (original.type === "MULTI_LINK") {
    const srcPage = await prisma.multiLinkPage.findUnique({ where: { qrCodeId: original.id } });
    if (srcPage) {
      const newPage = await prisma.multiLinkPage.create({ data: { qrCodeId: copy.id } });
      const srcItems = await prisma.multiLinkItem.findMany({ where: { pageId: srcPage.id } });
      if (srcItems.length > 0) {
        await prisma.multiLinkItem.createMany({
          data: srcItems.map((item) => ({
            pageId: newPage.id,
            label: item.label,
            url: item.url,
            icon: item.icon,
            sortOrder: item.sortOrder,
          })),
        });
      }
    }
  }

  return { success: true, qr: mapQr(copy) };
}

/**
 * Enable a QR code (set status to ACTIVE).
 */
export async function enableQr(id: string, userId: string): Promise<QrResult> {
  const qr = await prisma.qRCode.findFirst({ where: { id, userId, deletedAt: null } });
  if (!qr) {
    return { success: false, error: { code: "NOT_FOUND", message: "QR code not found" } };
  }

  const updated = await prisma.qRCode.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  return { success: true, qr: mapQr(updated) };
}

/**
 * Disable a QR code (set status to DISABLED).
 */
export async function disableQr(id: string, userId: string): Promise<QrResult> {
  const qr = await prisma.qRCode.findFirst({ where: { id, userId, deletedAt: null } });
  if (!qr) {
    return { success: false, error: { code: "NOT_FOUND", message: "QR code not found" } };
  }

  const updated = await prisma.qRCode.update({
    where: { id },
    data: { status: "DISABLED" },
  });

  return { success: true, qr: mapQr(updated) };
}