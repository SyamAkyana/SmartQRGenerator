// lib/qr/generate.ts
// Build a QR payload string from a QR code record + type-specific data.

import type { QRDesignRecord } from "./design";
import type { QRCodeRecord } from "./service";

const QR_TYPE_DEFAULTS: Record<string, string> = {
  URL: "https://example.com",
  MAP: "geo:0,0?q=New York",
  PHONE: "tel:+1234567890",
  EMAIL: "mailto:hello@example.com",
  TEXT: "Hello, World!",
  WIFI: "WIFI:T:WPA;S:MyNetwork;P:password;;",
  WHATSAPP: "https://wa.me/1234567890",
  CONTACT: "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD",
  FILE: "https://example.com/file.pdf",
  MULTI_LINK: "MULTI_LINK",
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Resolve the concrete scan-ready content string for a QR code record.
 * For dynamic QR codes with missing data, falls back to the public redirect URL
 * so downloaded QR codes always encode a working URL that resolves via the
 * redirect system.
 */
export function getQrContent(qr: QRCodeRecord): string {
  const data = qr.data ?? {};

  // For dynamic QR codes, construct the public URL fallback
  const publicUrl = qr.isDynamic
    ? getPublicUrl(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", qr.shortCode)
    : null;

  switch (qr.type) {
    case "URL":
      return asString(data.url) ?? publicUrl ?? QR_TYPE_DEFAULTS.URL;
    case "TEXT":
      return asString(data.text) ?? publicUrl ?? QR_TYPE_DEFAULTS.TEXT;
    case "PHONE":
      return asString(data.phone) ?? publicUrl ?? QR_TYPE_DEFAULTS.PHONE;
    case "EMAIL":
      return asString(data.email) ?? publicUrl ?? QR_TYPE_DEFAULTS.EMAIL;
    case "MAP":
      return asString(data.location) ?? publicUrl ?? QR_TYPE_DEFAULTS.MAP;
    case "WIFI": {
      const ssid = asString(data.ssid);
      const pass = asString(data.password);
      const auth = asString(data.authType) ?? "WPA";
      if (!ssid) return publicUrl ?? QR_TYPE_DEFAULTS.WIFI;
      return `WIFI:T:${auth};S:${ssid};P:${pass ?? ""};;`;
    }
    case "WHATSAPP":
      return asString(data.phone) ? `https://wa.me/${data.phone}` : publicUrl ?? QR_TYPE_DEFAULTS.WHATSAPP;
    case "CONTACT":
      return publicUrl ?? QR_TYPE_DEFAULTS.CONTACT;
    case "FILE":
      // Phase 5: if fileId is set, point to the download endpoint; otherwise public URL fallback
      return asString(data.fileId)
        ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/file/${data.fileId}`
        : publicUrl ?? QR_TYPE_DEFAULTS.FILE;
    case "MULTI_LINK":
      // MULTI_LINK items are stored in multiLinkPage table, so always use public URL
      return publicUrl ?? QR_TYPE_DEFAULTS.MULTI_LINK;
    default:
      return qrContentFromRaw(data);
  }
}

/** Generic fallback: grab the first non-empty string field, or the raw JSON. */
function qrContentFromRaw(data: Record<string, unknown>): string {
  for (const value of Object.values(data)) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  try {
    return JSON.stringify(data);
  } catch {
    return "";
  }
}

/** Build the options object for qr-code-styling from a design record. */
export function buildQrOptions(design: Partial<QRDesignRecord> | null) {
  return {
    width: 220,
    height: 220,
    type: "svg" as const,
    margin: 8,
    qrOptions: { errorCorrectionLevel: design?.errorCorrectionLevel ?? "M" },
    dotsOptions: {
      color: design?.foregroundColor ?? "#000000",
      type: (design?.dotStyle ?? "square") as "square" | "circle" | "diamond" | "star" | "fluid",
    },
    backgroundOptions: { color: design?.backgroundColor ?? "#ffffff" },
    cornersSquareOptions: {
      color: design?.foregroundColor ?? "#000000",
      type: (design?.cornerStyle ?? "square") as "square" | "circle" | "extra-rounded",
    },
    cornersDotOptions: {
      color: design?.foregroundColor ?? "#000000",
      type: (design?.eyeStyle ?? "square") as "square" | "circle" | "asteroid",
    },
  };
}

/** Compute the public scan URL for a QR code. */
export function getPublicUrl(baseUrl: string, shortCode: string): string {
  return `${baseUrl}/q/${shortCode}`;
}
