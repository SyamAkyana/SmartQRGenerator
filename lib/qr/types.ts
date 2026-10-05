import { z } from "zod";

/** Valid QR type values matching the Prisma QRType enum */
export const qrTypesSchema = z.enum([
  "URL",
  "MAP",
  "PHONE",
  "EMAIL",
  "CONTACT",
  "WHATSAPP",
  "WIFI",
  "TEXT",
  "FILE",
  "MULTI_LINK",
]);
export type QRType = z.infer<typeof qrTypesSchema>;

export const qrStatusesSchema = z.enum(["ACTIVE", "DISABLED", "EXPIRED", "DELETED"]);
export type QRStatus = z.infer<typeof qrStatusesSchema>;

/**
 * Zod schema for creating a QR code.
 * The `data` field accepts any JSON object — per-type validation is
 * enforced by Phase 3+ schemas in `lib/validation/qr-types.ts`.
 */
export const createQrSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),
  type: qrTypesSchema.default("URL"),
  data: z.record(z.string(), z.unknown()).default({}),
  design: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Zod schema for updating a QR code.
 * All fields are optional — only provided fields are updated.
 */
export const updateQrSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .optional(),
  type: qrTypesSchema.optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  design: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Zod schema for validating a QR ID route parameter (cuid format).
 */
export const qrIdParamSchema = z.object({
  id: z.string().regex(/^c_[A-Za-z0-9]+$/, "Invalid QR ID format"),
});