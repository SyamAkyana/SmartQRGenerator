/**
 * Static QR Code Payload Generators
 * Pure client-side formatting functions for standard QR payload protocols.
 */

export interface WifiPayloadOptions {
  ssid: string;
  password?: string;
  encryption?: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export interface VCardPayloadOptions {
  firstName: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  note?: string;
}

export interface SmsPayloadOptions {
  phoneNumber: string;
  message?: string;
}

export interface EmailPayloadOptions {
  email: string;
  subject?: string;
  body?: string;
}

/**
 * Normalizes a website or URL destination.
 * Automatically adds https:// if no protocol is present.
 */
export function formatUrlPayload(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Formats a standard Wi-Fi network configuration string.
 * Protocol: WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<Password>;H:<true|false>;;
 */
export function formatWifiPayload(options: WifiPayloadOptions): string {
  const ssid = (options.ssid || "").trim();
  if (!ssid) return "";

  const encryption = options.encryption || "WPA";
  const password = options.password || "";
  const hidden = options.hidden ? "true" : "false";

  // Escape special characters in SSID and password: \ , ; : "
  const escapeWifi = (val: string) =>
    val.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/,/g, "\\,");

  if (encryption === "nopass" || !password) {
    return `WIFI:S:${escapeWifi(ssid)};T:nopass;H:${hidden};;`;
  }

  return `WIFI:S:${escapeWifi(ssid)};T:${encryption};P:${escapeWifi(password)};H:${hidden};;`;
}

/**
 * Formats a standard vCard 3.0 string for contacts.
 */
export function formatVCardPayload(options: VCardPayloadOptions): string {
  const firstName = (options.firstName || "").trim();
  const lastName = (options.lastName || "").trim();
  if (!firstName && !lastName) return "";

  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  // N:LastName;FirstName;;;
  lines.push(`N:${lastName};${firstName};;;`);
  // FN:FirstName LastName
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  lines.push(`FN:${fullName}`);

  if (options.organization?.trim()) {
    lines.push(`ORG:${options.organization.trim()}`);
  }
  if (options.title?.trim()) {
    lines.push(`TITLE:${options.title.trim()}`);
  }
  if (options.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE:${options.phone.trim()}`);
  }
  if (options.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET,HOME:${options.email.trim()}`);
  }
  if (options.website?.trim()) {
    const web = formatUrlPayload(options.website);
    if (web) lines.push(`URL:${web}`);
  }
  if (options.address?.trim()) {
    lines.push(`ADR;TYPE=HOME:;;${options.address.trim()};;;;`);
  }
  if (options.note?.trim()) {
    lines.push(`NOTE:${options.note.trim()}`);
  }

  lines.push("END:VCARD");
  return lines.join("\n");
}

/**
 * Formats an instant click-to-call telephone string.
 * Protocol: tel:+1234567890
 */
export function formatPhonePayload(phoneNumber: string): string {
  const cleaned = phoneNumber.trim().replace(/\s+/g, "");
  if (!cleaned) return "";
  return `tel:${cleaned}`;
}

/**
 * Formats a mobile SMS string with optional pre-filled message.
 * Protocol: SMSTO:<number>:<message>
 */
export function formatSmsPayload(options: SmsPayloadOptions): string {
  const number = (options.phoneNumber || "").trim().replace(/\s+/g, "");
  if (!number) return "";
  const message = (options.message || "").trim();
  if (!message) return `SMSTO:${number}`;
  return `SMSTO:${number}:${message}`;
}

/**
 * Formats an email string with optional subject and body.
 * Protocol: mailto:<email>?subject=<subject>&body=<body>
 */
export function formatEmailPayload(options: EmailPayloadOptions): string {
  const email = (options.email || "").trim();
  if (!email) return "";

  const params = new URLSearchParams();
  if (options.subject?.trim()) params.set("subject", options.subject.trim());
  if (options.body?.trim()) params.set("body", options.body.trim());

  const queryString = params.toString();
  return queryString ? `mailto:${email}?${queryString}` : `mailto:${email}`;
}

/**
 * Formats plain text or custom note.
 */
export function formatTextPayload(text: string): string {
  return (text || "").trim();
}
