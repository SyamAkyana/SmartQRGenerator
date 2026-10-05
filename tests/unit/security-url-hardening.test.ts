import { describe, it, expect } from "vitest";
import { isSafeUrl } from "@/lib/multi-link/service";
import { safeRedirectUrl } from "@/lib/qr/resolve";

describe("URL Hardening & XSS Prevention", () => {
  describe("isSafeUrl (Multi-Link)", () => {
    it("allows standard https URLs", () => {
      expect(isSafeUrl("https://example.com")).toBe(true);
      expect(isSafeUrl("https://example.com/path?query=1")).toBe(true);
    });

    it("allows http URLs", () => {
      expect(isSafeUrl("http://example.com")).toBe(true);
    });

    it("allows mailto: links", () => {
      expect(isSafeUrl("mailto:user@example.com")).toBe(true);
    });

    it("allows tel: links", () => {
      expect(isSafeUrl("tel:+15551234567")).toBe(true);
    });

    it("rejects javascript: scheme", () => {
      expect(isSafeUrl("javascript:alert('xss')")).toBe(false);
      expect(isSafeUrl("JavaScript:void(0)")).toBe(false);
      expect(isSafeUrl("JAVASCRIPT:alert(1)")).toBe(false);
    });

    it("rejects javascript: with whitespace prefix", () => {
      expect(isSafeUrl("  javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("\tjavascript:void(0)")).toBe(false);
      expect(isSafeUrl("\n javascript:alert('xss')")).toBe(false);
    });

    it("rejects data: URIs", () => {
      expect(isSafeUrl("data:text/html,<script>alert('xss')</script>")).toBe(false);
      expect(isSafeUrl("data:image/svg+xml,<svg onload=alert(1)>")).toBe(false);
    });

    it("rejects vbscript: scheme", () => {
      expect(isSafeUrl("vbscript:MsgBox(1)")).toBe(false);
      expect(isSafeUrl("VBScript:Execute()")).toBe(false);
    });

    it("rejects file: URLs", () => {
      expect(isSafeUrl("file:///etc/passwd")).toBe(false);
      expect(isSafeUrl("file://C:/Windows/System32/config")).toBe(false);
    });

    it("rejects URLs with control characters", () => {
      expect(isSafeUrl("https://example.com\x00")).toBe(false);
      expect(isSafeUrl("https://example.com\x01\x02\x03")).toBe(false);
      expect(isSafeUrl("https://example.com\x7F")).toBe(false);
    });

    it("rejects non-string inputs", () => {
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
      expect(isSafeUrl(123)).toBe(false);
      expect(isSafeUrl(true)).toBe(false);
      expect(isSafeUrl({})).toBe(false);
      expect(isSafeUrl([])).toBe(false);
    });

    it("rejects empty or whitespace-only strings", () => {
      expect(isSafeUrl("")).toBe(false);
      expect(isSafeUrl("   ")).toBe(false);
      expect(isSafeUrl("\t\n")).toBe(false);
    });

    it("rejects non-allowed schemes", () => {
      expect(isSafeUrl("ftp://example.com")).toBe(false);
      expect(isSafeUrl("ssh://host")).toBe(false);
      expect(isSafeUrl("blob:http://example.com/123")).toBe(false);
      expect(isSafeUrl("about:blank")).toBe(false);
      expect(isSafeUrl("ws://example.com")).toBe(false);
      expect(isSafeUrl("wss://example.com")).toBe(false);
    });

    it("rejects malformed URLs", () => {
      expect(isSafeUrl("not a url")).toBe(false);
      expect(isSafeUrl("://missing-scheme")).toBe(false);
      expect(isSafeUrl("http://")).toBe(false);
    });

    it("handles URLs with special characters safely", () => {
      expect(isSafeUrl("https://example.com/path?param=<script>")).toBe(true);
      expect(isSafeUrl("https://example.com/path#fragment")).toBe(true);
    });
  });

  describe("safeRedirectUrl (QR Resolver)", () => {
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
      expect(safeRedirectUrl("JavaScript:void(0)")).toBeNull();
    });

    it("rejects javascript: with whitespace", () => {
      expect(safeRedirectUrl("  javascript:alert(1)")).toBeNull();
      expect(safeRedirectUrl("\tJavaScript:void(0)")).toBeNull();
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

    it("rejects non-allowed schemes", () => {
      expect(safeRedirectUrl("ftp://example.com")).toBeNull();
      expect(safeRedirectUrl("ssh://host")).toBeNull();
      expect(safeRedirectUrl("blob:http://example.com/123")).toBeNull();
    });

    it("rejects non-string inputs", () => {
      expect(safeRedirectUrl(null)).toBeNull();
      expect(safeRedirectUrl(undefined)).toBeNull();
      expect(safeRedirectUrl(123)).toBeNull();
      expect(safeRedirectUrl(true)).toBeNull();
    });

    it("rejects empty or whitespace-only strings", () => {
      expect(safeRedirectUrl("")).toBeNull();
      expect(safeRedirectUrl("   ")).toBeNull();
    });

    it("trims whitespace from valid URLs", () => {
      expect(safeRedirectUrl("  https://example.com  ")).toBe("https://example.com");
    });
  });

  describe("XSS Protection Patterns", () => {
    it("blocks common XSS vector patterns", () => {
      const xssVectors = [
        "javascript:alert(document.cookie)",
        "javascript:eval(atob('YWxlcnQoMSk='))",
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        "vbscript:Execute(\"MsgBox 1\")",
        "JaVaScRiPt:alert(1)",
        " \t\n javascript:void(0)",
      ];

      for (const vector of xssVectors) {
        expect(isSafeUrl(vector)).toBe(false);
        expect(safeRedirectUrl(vector)).toBeNull();
      }
    });

    it("allows legitimate URLs that might look suspicious", () => {
      const legitimateUrls = [
        "https://example.com/page?javascript=keyword",
        "https://example.com/data-analytics",
        "https://example.com/file-download",
      ];

      for (const url of legitimateUrls) {
        expect(isSafeUrl(url)).toBe(true);
        expect(safeRedirectUrl(url)).toBe(url);
      }
    });
  });
});
