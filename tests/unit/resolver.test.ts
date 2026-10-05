import { describe, it, expect } from "vitest";
import {
  safeRedirectUrl,
  resolveQr,
  buildVCard,
  type ContactData,
} from "@/lib/qr/resolve";
import type { QRCodeRecord } from "@/lib/qr/service";

// ---------------------------------------------------------------------------
// safeRedirectUrl
// ---------------------------------------------------------------------------
describe("safeRedirectUrl", () => {
  it("allows standard https URLs", () => {
    expect(safeRedirectUrl("https://example.com")).toBe("https://example.com");
  });

  it("allows http URLs", () => {
    expect(safeRedirectUrl("http://example.com")).toBe("http://example.com");
  });

  it("allows mailto: links", () => {
    expect(safeRedirectUrl("mailto:user@example.com")).toBe("mailto:user@example.com");
  });

  it("allows tel: links", () => {
    expect(safeRedirectUrl("tel:+15551234567")).toBe("tel:+15551234567");
  });

  it("allows geo: links", () => {
    expect(safeRedirectUrl("geo:40.7128,-74.006")).toBe("geo:40.7128,-74.006");
  });

  it("rejects javascript:", () => {
    expect(safeRedirectUrl("javascript:alert('xss')")).toBeNull();
  });

  it("rejects data: URIs", () => {
    expect(safeRedirectUrl("data:text/html,<script>alert('x')</script>")).toBeNull();
  });

  it("rejects vbscript:", () => {
    expect(safeRedirectUrl("vbscript:MsgBox(1)")).toBeNull();
  });

  it("rejects file: URLs", () => {
    expect(safeRedirectUrl("file:///etc/passwd")).toBeNull();
  });

  it("rejects javascript: with leading whitespace", () => {
    expect(safeRedirectUrl("  \tjavascript:void(0)")).toBeNull();
  });

  it("rejects non-string inputs", () => {
    expect(safeRedirectUrl(null)).toBeNull();
    expect(safeRedirectUrl(undefined)).toBeNull();
    expect(safeRedirectUrl(123)).toBeNull();
    expect(safeRedirectUrl(true)).toBeNull();
    expect(safeRedirectUrl("")).toBeNull();
    expect(safeRedirectUrl("   ")).toBeNull();
  });

  it("rejects arbitrary non-allowed schemes", () => {
    expect(safeRedirectUrl("ftp://example.com")).toBeNull();
    expect(safeRedirectUrl("ssh://host")).toBeNull();
    expect(safeRedirectUrl("blob:http://example.com/123")).toBeNull();
  });

  it("trims whitespace from valid URLs", () => {
    expect(safeRedirectUrl("  https://example.com  ")).toBe("https://example.com");
  });
});

// ---------------------------------------------------------------------------
// resolveQr
// ---------------------------------------------------------------------------
function makeQr(overrides: Partial<QRCodeRecord> = {}): QRCodeRecord {
  return {
    id: "c_test12345678",
    userId: "c_user12345678",
    shortCode: "ABC1234",
    name: "Test QR",
    type: "URL",
    data: {},
    status: "ACTIVE",
    isDynamic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe("resolveQr", () => {
  describe("URL type", () => {
    it("redirects to a valid URL", () => {
      const qr = makeQr({ type: "URL", data: { url: "https://example.com" } });
      expect(resolveQr(qr)).toEqual({ kind: "redirect", url: "https://example.com" });
    });

    it("returns invalid for missing URL", () => {
      const qr = makeQr({ type: "URL", data: {} });
      const action = resolveQr(qr);
      expect(action.kind).toBe("invalid");
    });

    it("returns invalid for javascript: URL", () => {
      const qr = makeQr({ type: "URL", data: { url: "javascript:alert(1)" } });
      const action = resolveQr(qr);
      expect(action.kind).toBe("invalid");
    });
  });

  describe("PHONE type", () => {
    it("redirects to tel: URL", () => {
      const qr = makeQr({ type: "PHONE", data: { phone: "+15551234567" } });
      expect(resolveQr(qr)).toEqual({ kind: "redirect", url: "tel:+15551234567" });
    });

    it("strips non-digit characters from phone", () => {
      const qr = makeQr({ type: "PHONE", data: { phone: "+1 (555) 123-4567" } });
      expect(resolveQr(qr)).toEqual({ kind: "redirect", url: "tel:+15551234567" });
    });

    it("returns invalid for missing phone", () => {
      const qr = makeQr({ type: "PHONE", data: {} });
      expect(resolveQr(qr).kind).toBe("invalid");
    });
  });

  describe("EMAIL type", () => {
    it("redirects to mailto: URL", () => {
      const qr = makeQr({ type: "EMAIL", data: { email: "user@example.com" } });
      expect(resolveQr(qr)).toEqual({ kind: "redirect", url: "mailto:user@example.com" });
    });

    it("includes subject and body when present", () => {
      const qr = makeQr({
        type: "EMAIL",
        data: { email: "user@example.com", subject: "Hello", body: "World" },
      });
      const result = resolveQr(qr);
      expect(result.kind).toBe("redirect");
      if (result.kind === "redirect") {
        expect(result.url).toContain("subject=Hello");
        expect(result.url).toContain("body=World");
      }
    });

    it("returns invalid for missing email", () => {
      const qr = makeQr({ type: "EMAIL", data: {} });
      expect(resolveQr(qr).kind).toBe("invalid");
    });
  });

  describe("WHATSAPP type", () => {
    it("redirects to wa.me URL", () => {
      const qr = makeQr({ type: "WHATSAPP", data: { phone: "+15551234567" } });
      const result = resolveQr(qr);
      expect(result.kind).toBe("redirect");
      if (result.kind === "redirect") expect(result.url).toContain("wa.me/15551234567");
    });

    it("includes encoded message", () => {
      const qr = makeQr({
        type: "WHATSAPP",
        data: { phone: "15551234567", message: "Hello World!" },
      });
      const result = resolveQr(qr);
      if (result.kind === "redirect") expect(result.url).toContain("text=Hello%20World!");
    });

    it("returns invalid for missing phone", () => {
      const qr = makeQr({ type: "WHATSAPP", data: {} });
      expect(resolveQr(qr).kind).toBe("invalid");
    });
  });

  describe("MAP type", () => {
    it("redirects to Google Maps URL from lat/lng", () => {
      const qr = makeQr({
        type: "MAP",
        data: { latitude: 40.7128, longitude: -74.006 },
      });
      const result = resolveQr(qr);
      expect(result.kind).toBe("redirect");
      if (result.kind === "redirect") {
        expect(result.url).toContain("google.com/maps");
        expect(result.url).toContain("40.7128");
      }
    });

    it("redirects from a location string", () => {
      const qr = makeQr({
        type: "MAP",
        data: { location: "New York, NY" },
      });
      const result = resolveQr(qr);
      expect(result.kind).toBe("redirect");
      if (result.kind === "redirect") expect(result.url).toContain("New%20York");
    });

    it("returns invalid for missing data", () => {
      const qr = makeQr({ type: "MAP", data: {} });
      expect(resolveQr(qr).kind).toBe("invalid");
    });
  });

  describe("TEXT type", () => {
    it("renders text component", () => {
      const qr = makeQr({ type: "TEXT", data: { text: "Hello World" } });
      expect(resolveQr(qr)).toEqual({ kind: "render", component: "text" });
    });

    it("returns invalid for missing text", () => {
      const qr = makeQr({ type: "TEXT", data: {} });
      expect(resolveQr(qr).kind).toBe("invalid");
    });
  });

  describe("WIFI type", () => {
    it("renders wifi component", () => {
      const qr = makeQr({ type: "WIFI", data: { ssid: "MyNet" } });
      expect(resolveQr(qr)).toEqual({ kind: "render", component: "wifi" });
    });

    it("returns invalid for missing ssid", () => {
      const qr = makeQr({ type: "WIFI", data: {} });
      expect(resolveQr(qr).kind).toBe("invalid");
    });
  });

  describe("CONTACT type", () => {
    it("renders contact component when name present", () => {
      const qr = makeQr({ type: "CONTACT", data: { firstName: "Alice" } });
      expect(resolveQr(qr)).toEqual({ kind: "render", component: "contact" });
    });

    it("renders contact component when email present", () => {
      const qr = makeQr({ type: "CONTACT", data: { email: "alice@test.com" } });
      expect(resolveQr(qr)).toEqual({ kind: "render", component: "contact" });
    });

    it("returns invalid for empty contact", () => {
      const qr = makeQr({ type: "CONTACT", data: {} });
      expect(resolveQr(qr).kind).toBe("invalid");
    });
  });

  describe("FILE type", () => {
    it("renders file placeholder", () => {
      const qr = makeQr({ type: "FILE", data: {} });
      expect(resolveQr(qr)).toEqual({ kind: "render", component: "file" });
    });
  });

  describe("MULTI_LINK type", () => {
    it("renders multi-link placeholder", () => {
      const qr = makeQr({ type: "MULTI_LINK", data: {} });
      expect(resolveQr(qr)).toEqual({ kind: "render", component: "multi-link" });
    });
  });

  describe("unknown type", () => {
    it("returns invalid for unsupported type", () => {
      const qr = makeQr({ type: "UNKNOWN", data: {} });
      expect(resolveQr(qr).kind).toBe("invalid");
    });
  });
});

// ---------------------------------------------------------------------------
// buildVCard
// ---------------------------------------------------------------------------
describe("buildVCard", () => {
  it("produces valid vCard 3.0", () => {
    const vcf = buildVCard({ firstName: "John", lastName: "Doe", phone: "+15551234567" });
    expect(vcf).toContain("BEGIN:VCARD");
    expect(vcf).toContain("VERSION:3.0");
    expect(vcf).toContain("FN:John Doe");
    expect(vcf).toContain("TEL;TYPE=CELL:+15551234567");
    expect(vcf).toContain("END:VCARD");
  });

  it("escapes semicolons and commas in field values", () => {
    const vcf = buildVCard({ organization: "Acme, Inc.; R&D" });
    expect(vcf).toContain("ORG:Acme\\, Inc.\\; R&D");
  });

  it("handles all fields", () => {
    const data: ContactData = {
      firstName: "Jane",
      lastName: "Smith",
      organization: "TechCorp",
      jobTitle: "CTO",
      phone: "+15559876543",
      email: "jane@techcorp.com",
      website: "https://techcorp.com",
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "US",
    };
    const vcf = buildVCard(data);
    expect(vcf).toContain("FN:Jane Smith");
    expect(vcf).toContain("ORG:TechCorp");
    expect(vcf).toContain("TITLE:CTO");
    expect(vcf).toContain("EMAIL;TYPE=INTERNET:jane@techcorp.com");
    expect(vcf).toContain("URL:https://techcorp.com");
    expect(vcf).toContain("ADR;TYPE=WORK:;;123 Main St;Springfield;IL;62701;US");
  });
});