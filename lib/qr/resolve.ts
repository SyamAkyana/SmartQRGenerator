// lib/qr/resolve.ts
// Dynamic QR resolution: decides at scan time what /q/:shortCode should do,
// based on the QR's current type + data + status. Pure and framework-agnostic
// (no next/navigation / Response imports) so it is directly unit-testable.

import type { QRCodeRecord } from "./service";

/** The concrete action the public QR page should take for a scan. */
export type ResolveAction =
  | { kind: "redirect"; url: string }
  | {
      kind: "render";
      component: "text" | "contact" | "wifi" | "file" | "multi-link";
    }
  | { kind: "invalid"; reason: string };

/** Structured contact payload (spec §10.5). */
export interface ContactData {
  firstName?: string;
  lastName?: string;
  organization?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// ---------------------------------------------------------------------------
// URL safety
// ---------------------------------------------------------------------------

const ALLOWED_SCHEME = /^(https?|mailto|tel|geo):/i;
const DANGEROUS_SCHEME = /^\s*(javascript|data|vbscript|file):/i;
const ANY_SCHEME = /^\s*[a-z][a-z0-9+.-]*:/i;

/**
 * Guard a redirect destination against dangerous schemes and malformed input.
 * Returns the trimmed target when safe, otherwise null.
 *
 * - Non-strings / empty → null
 * - javascript:, data:, vbscript:, file: (and whitespace-prefixed tricks) → null
 * - Any other non-http(s) / mailto / tel / geo scheme → null
 * - Otherwise the string itself.
 */
export function safeRedirectUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (DANGEROUS_SCHEME.test(trimmed)) return null;
  if (ANY_SCHEME.test(trimmed) && !ALLOWED_SCHEME.test(trimmed)) return null;
  return trimmed;
}

// ---------------------------------------------------------------------------
// vCard builder (spec §10.5)
// ---------------------------------------------------------------------------

/** Escape a vCard field value per RFC 2426 (\, \; and literal newlines). */
function vcardEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Build a vCard 3.0 document from structured contact data. */
export function buildVCard(data: ContactData): string {
  const parts: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  if (fullName) {
    parts.push(`FN:${vcardEscape(fullName)}`);
    if (data.firstName || data.lastName) {
      const n = [data.lastName, data.firstName, "", "", ""].map((x) => vcardEscape(x ?? "")).join(";");
      parts.push(`N:${n}`);
    }
  }
  if (data.organization) parts.push(`ORG:${vcardEscape(data.organization)}`);
  if (data.jobTitle) parts.push(`TITLE:${vcardEscape(data.jobTitle)}`);
  if (data.phone) parts.push(`TEL;TYPE=CELL:${data.phone}`);
  if (data.email) parts.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  if (data.website) parts.push(`URL:${data.website}`);

  const addressParts = [data.street, data.city, data.state, data.postalCode, data.country];
  if (addressParts.some((x) => x)) {
    parts.push(`ADR;TYPE=WORK:;;${addressParts.map((x) => vcardEscape(x ?? "")).join(";")}`);
  }

  parts.push("END:VCARD");
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  return undefined;
}

/** Build a Google Maps query URL from structured coordinates. */
function mapsUrlFromData(data: Record<string, unknown>): string | null {
  const lat = asNumber(data.latitude);
  const lng = asNumber(data.longitude);
  if (lat !== undefined && lng !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const location = asString(data.location);
  if (location) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  const labelAndQuery = [asString(data.label), asString(data.place)];
  const text = labelAndQuery.find(Boolean);
  if (text) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
  return null;
}

/**
 * Resolve a QR code to a concrete action. Never throws — malformed or
 * incomplete data yields `{ kind: "invalid", reason }` so the public page
 * can render a friendly error instead of crashing.
 *
 * Extensible per spec §9.1: adding a QR type means adding a case here (plus a
 * landing-page component), not rewriting the page.
 */
export function resolveQr(qr: QRCodeRecord): ResolveAction {
  const data = qr.data ?? {};

  switch (qr.type) {
    case "URL": {
      const url = safeRedirectUrl(data.url);
      if (!url) return { kind: "invalid", reason: "This QR code has no valid destination." };
      return { kind: "redirect", url };
    }

    case "PHONE": {
      const phone = asString(data.phone);
      if (!phone) return { kind: "invalid", reason: "This QR code has no phone number." };
      return { kind: "redirect", url: `tel:${phone.replace(/[^\d+]/g, "")}` };
    }

    case "EMAIL": {
      const email = asString(data.email);
      if (!email) return { kind: "invalid", reason: "This QR code has no email address." };
      const params = new URLSearchParams();
      const subject = asString(data.subject);
      if (subject) params.set("subject", subject);
      const body = asString(data.body);
      if (body) params.set("body", body);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return { kind: "redirect", url: `mailto:${email}${suffix}` };
    }

    case "WHATSAPP": {
      const phone = asString(data.phone);
      if (!phone) return { kind: "invalid", reason: "This QR code has no WhatsApp number." };
      const digits = phone.replace(/[^\d]/g, "");
      if (!digits) return { kind: "invalid", reason: "This QR code has no WhatsApp number." };
      const message = asString(data.message);
      const url = `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
      return { kind: "redirect", url };
    }

    case "MAP": {
      const url = mapsUrlFromData(data);
      if (!url) return { kind: "invalid", reason: "This QR code has no map location." };
      return { kind: "redirect", url };
    }

    case "TEXT": {
      const text = asString(data.text);
      if (!text) return { kind: "invalid", reason: "This QR code has no text content." };
      return { kind: "render", component: "text" };
    }

    case "WIFI": {
      const ssid = asString(data.ssid);
      if (!ssid) return { kind: "invalid", reason: "This QR code has no Wi-Fi network name." };
      return { kind: "render", component: "wifi" };
    }

    case "CONTACT": {
      const hasName = asString(data.firstName) || asString(data.lastName);
      const hasContact = asString(data.phone) || asString(data.email);
      if (!hasName && !hasContact) return { kind: "invalid", reason: "This QR code has no contact details." };
      return { kind: "render", component: "contact" };
    }

    // Phase 5/6 hook points — landing pages arrive with those phases.
    case "FILE":
      return { kind: "render", component: "file" };
    case "MULTI_LINK":
      return { kind: "render", component: "multi-link" };

    default:
      return { kind: "invalid", reason: "This QR code type is not supported." };
  }
}