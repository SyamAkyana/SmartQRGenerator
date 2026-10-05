// lib/qr/export-utils.ts
// Filename sanitization and helpers for QR code exports (Spec §21).

import { sanitizeFilename } from "@/lib/file/sanitize";

export type ExportFormat = "png" | "svg";
export type ExportResolution = 256 | 512 | 1024 | 2048;

export const RESOLUTION_OPTIONS: Array<{ value: ExportResolution; label: string; description: string }> = [
  { value: 256, label: "Small (256px)", description: "Web and avatars" },
  { value: 512, label: "Medium (512px)", description: "Standard screen and digital docs" },
  { value: 1024, label: "Large (1024px)", description: "High-DPI displays and flyers" },
  { value: 2048, label: "Print (2048px)", description: "High-resolution print and posters" },
];

/**
 * Generate a clean, sanitized download filename for a QR code.
 * Example: `getExportFilename("Menu 2026!", "png")` -> `"menu_2026_-qr.png"`
 */
export function getExportFilename(qrName: string, format: ExportFormat): string {
  const base = sanitizeFilename(qrName.trim() || "qrcode");
  // Remove any trailing extension if present in the base name
  const cleanBase = base.replace(/\.(png|svg|jpg|jpeg|webp|pdf)$/i, "");
  return `${cleanBase}-qr.${format}`;
}
