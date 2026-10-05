import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const DESIGN_FIELDS = [
  "foregroundColor",
  "backgroundColor",
  "dotStyle",
  "cornerStyle",
  "eyeStyle",
  "frameStyle",
  "frameText",
  "logoFileId",
  "errorCorrectionLevel",
] as const;

export const designSchema = z.object({
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  dotStyle: z
    .enum(["square", "circle", "diamond", "star", "fluid"])
    .optional()
    .nullable(),
  cornerStyle: z
    .enum(["square", "circle", "extra-rounded"])
    .optional()
    .nullable(),
  eyeStyle: z
    .enum(["square", "circle", "asteroid"])
    .optional()
    .nullable(),
  frameStyle: z
    .enum(["none", "box", "banner", "pointed", "rounded"])
    .optional()
    .nullable(),
  frameText: z.string().max(50).optional().nullable(),
  logoFileId: z.string().optional().nullable(),
  errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional().nullable(),
});

export type DesignData = z.infer<typeof designSchema>;
export type QRDesignRecord = {
  id: string;
  qrCodeId: string;
  foregroundColor: string | null;
  backgroundColor: string | null;
  dotStyle: string | null;
  cornerStyle: string | null;
  eyeStyle: string | null;
  frameStyle: string | null;
  frameText: string | null;
  logoFileId: string | null;
  errorCorrectionLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const DESIGN_DEFAULTS: QRDesignRecord = {
  id: "",
  qrCodeId: "",
  foregroundColor: "#000000",
  backgroundColor: "#ffffff",
  dotStyle: "square",
  cornerStyle: "square",
  eyeStyle: "square",
  frameStyle: "none",
  frameText: null,
  logoFileId: null,
  errorCorrectionLevel: "M",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function getDesign(qrCodeIdOrShortCode: string): Promise<QRDesignRecord> {
  let targetQrId = qrCodeIdOrShortCode;
  const qr = await prisma.qRCode.findFirst({
    where: {
      OR: [{ id: qrCodeIdOrShortCode }, { shortCode: qrCodeIdOrShortCode }],
    },
    select: { id: true },
  });
  if (qr) {
    targetQrId = qr.id;
  }

  const design = await prisma.qRDesign.findUnique({ where: { qrCodeId: targetQrId } });
  if (!design) return { ...DESIGN_DEFAULTS, qrCodeId: targetQrId };
  return {
    id: design.id,
    qrCodeId: design.qrCodeId,
    foregroundColor: design.foregroundColor ?? "#000000",
    backgroundColor: design.backgroundColor ?? "#ffffff",
    dotStyle: design.dotStyle ?? "square",
    cornerStyle: design.cornerStyle ?? "square",
    eyeStyle: design.eyeStyle ?? "square",
    frameStyle: design.frameStyle ?? "none",
    frameText: design.frameText ?? null,
    logoFileId: design.logoFileId ?? null,
    errorCorrectionLevel: design.errorCorrectionLevel ?? "M",
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,
  };
}

export async function upsertDesign(
  qrCodeIdOrShortCode: string,
  userId: string,
  data: Partial<DesignData>
): Promise<{ success: true; design: QRDesignRecord } | { success: false; error: { code: string; message: string } }> {
  // Verify ownership and resolve actual database id
  const qr = await prisma.qRCode.findFirst({
    where: {
      OR: [{ id: qrCodeIdOrShortCode }, { shortCode: qrCodeIdOrShortCode }],
      userId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!qr) return { success: false, error: { code: "NOT_FOUND", message: "QR code not found" } };

  const validated = designSchema.partial().safeParse(data);
  if (!validated.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid design options" } };
  }

  const cleanData: Record<string, any> = {};
  if (validated.data.foregroundColor !== undefined) cleanData.foregroundColor = validated.data.foregroundColor;
  if (validated.data.backgroundColor !== undefined) cleanData.backgroundColor = validated.data.backgroundColor;
  if (validated.data.dotStyle !== undefined) cleanData.dotStyle = validated.data.dotStyle;
  if (validated.data.cornerStyle !== undefined) cleanData.cornerStyle = validated.data.cornerStyle;
  if (validated.data.eyeStyle !== undefined) cleanData.eyeStyle = validated.data.eyeStyle;
  if (validated.data.frameStyle !== undefined) cleanData.frameStyle = validated.data.frameStyle;
  if (validated.data.frameText !== undefined) cleanData.frameText = validated.data.frameText;
  if (validated.data.logoFileId !== undefined) cleanData.logoFileId = validated.data.logoFileId;
  if (validated.data.errorCorrectionLevel !== undefined) cleanData.errorCorrectionLevel = validated.data.errorCorrectionLevel;

  const design = await prisma.qRDesign.upsert({
    where: { qrCodeId: qr.id },
    create: { qrCodeId: qr.id, ...cleanData },
    update: cleanData,
  });

  return {
    success: true,
    design: {
      id: design.id,
      qrCodeId: design.qrCodeId,
      foregroundColor: design.foregroundColor ?? "#000000",
      backgroundColor: design.backgroundColor ?? "#ffffff",
      dotStyle: design.dotStyle ?? "square",
      cornerStyle: design.cornerStyle ?? "square",
      eyeStyle: design.eyeStyle ?? "square",
      frameStyle: design.frameStyle ?? "none",
      frameText: design.frameText ?? null,
      logoFileId: design.logoFileId ?? null,
      errorCorrectionLevel: design.errorCorrectionLevel ?? "M",
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    },
  };
}

export { DESIGN_DEFAULTS };