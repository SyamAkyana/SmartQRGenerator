import { describe, it, expect } from "vitest";
import {
  formatUrlPayload,
  formatWifiPayload,
  formatVCardPayload,
  formatPhonePayload,
  formatSmsPayload,
  formatEmailPayload,
  formatTextPayload,
} from "@/lib/qr/static-payloads";

describe("static-payloads", () => {
  describe("formatUrlPayload", () => {
    it("should prepend https:// if missing", () => {
      expect(formatUrlPayload("example.com")).toBe("https://example.com");
      expect(formatUrlPayload("smartqr.io/page")).toBe("https://smartqr.io/page");
    });

    it("should preserve existing https:// or http://", () => {
      expect(formatUrlPayload("https://example.com")).toBe("https://example.com");
      expect(formatUrlPayload("http://example.com")).toBe("http://example.com");
    });

    it("should return empty string for empty input", () => {
      expect(formatUrlPayload("   ")).toBe("");
    });
  });

  describe("formatWifiPayload", () => {
    it("should format WPA wifi payload correctly", () => {
      const result = formatWifiPayload({
        ssid: "MyCoffeeShop",
        password: "SecretPassword123",
        encryption: "WPA",
        hidden: false,
      });
      expect(result).toBe("WIFI:S:MyCoffeeShop;T:WPA;P:SecretPassword123;H:false;;");
    });

    it("should format open/nopass wifi payload correctly", () => {
      const result = formatWifiPayload({
        ssid: "OpenGuestWiFi",
        encryption: "nopass",
      });
      expect(result).toBe("WIFI:S:OpenGuestWiFi;T:nopass;H:false;;");
    });

    it("should handle hidden network flag", () => {
      const result = formatWifiPayload({
        ssid: "HiddenOffice",
        password: "pass",
        encryption: "WPA",
        hidden: true,
      });
      expect(result).toBe("WIFI:S:HiddenOffice;T:WPA;P:pass;H:true;;");
    });

    it("should escape special characters in SSID and password", () => {
      const result = formatWifiPayload({
        ssid: "Cafe;Bar:Net",
        password: "pass;word:1,2",
        encryption: "WPA",
      });
      expect(result).toBe("WIFI:S:Cafe\\;Bar\\:Net;T:WPA;P:pass\\;word\\:1\\,2;H:false;;");
    });

    it("should return empty string if SSID is empty", () => {
      expect(formatWifiPayload({ ssid: "" })).toBe("");
    });
  });

  describe("formatVCardPayload", () => {
    it("should format standard vCard 3.0 string", () => {
      const result = formatVCardPayload({
        firstName: "Alex",
        lastName: "Morgan",
        organization: "Acme Corp",
        title: "Product Designer",
        phone: "+15551234567",
        email: "alex@acme.com",
        website: "acme.com",
        address: "742 Evergreen Terrace, Springfield",
        note: "Met at TechConf 2026",
      });

      expect(result).toContain("BEGIN:VCARD");
      expect(result).toContain("VERSION:3.0");
      expect(result).toContain("N:Morgan;Alex;;;");
      expect(result).toContain("FN:Alex Morgan");
      expect(result).toContain("ORG:Acme Corp");
      expect(result).toContain("TITLE:Product Designer");
      expect(result).toContain("TEL;TYPE=CELL,VOICE:+15551234567");
      expect(result).toContain("EMAIL;TYPE=INTERNET,HOME:alex@acme.com");
      expect(result).toContain("URL:https://acme.com");
      expect(result).toContain("ADR;TYPE=HOME:;;742 Evergreen Terrace, Springfield;;;;");
      expect(result).toContain("NOTE:Met at TechConf 2026");
      expect(result).toContain("END:VCARD");
    });

    it("should return empty string if both first and last names are missing", () => {
      expect(formatVCardPayload({ firstName: "", lastName: "" })).toBe("");
    });
  });

  describe("formatPhonePayload", () => {
    it("should format tel: URI", () => {
      expect(formatPhonePayload("+1 (555) 019-2834")).toBe("tel:+1(555)019-2834");
      expect(formatPhonePayload("   ")).toBe("");
    });
  });

  describe("formatSmsPayload", () => {
    it("should format SMSTO: URI without message", () => {
      expect(formatSmsPayload({ phoneNumber: "+15551234" })).toBe("SMSTO:+15551234");
    });

    it("should format SMSTO: URI with message", () => {
      expect(
        formatSmsPayload({ phoneNumber: "+15551234", message: "Hello there!" })
      ).toBe("SMSTO:+15551234:Hello there!");
    });
  });

  describe("formatEmailPayload", () => {
    it("should format mailto: URI with subject and body", () => {
      const result = formatEmailPayload({
        email: "hello@smartqr.io",
        subject: "General Inquiry",
        body: "I would like to learn more.",
      });
      expect(result).toBe("mailto:hello@smartqr.io?subject=General+Inquiry&body=I+would+like+to+learn+more.");
    });

    it("should format simple mailto: URI without query params", () => {
      expect(formatEmailPayload({ email: "hello@smartqr.io" })).toBe("mailto:hello@smartqr.io");
      expect(formatEmailPayload({ email: "" })).toBe("");
    });
  });

  describe("formatTextPayload", () => {
    it("should trim raw text", () => {
      expect(formatTextPayload("  Hello World  ")).toBe("Hello World");
    });
  });
});
