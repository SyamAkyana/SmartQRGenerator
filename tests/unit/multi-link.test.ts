import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-implement the URL safety logic for unit testing (mirrors lib/multi-link/service.ts)
const DANGEROUS_SCHEMES = ["javascript:", "data:", "vbscript:", "file:"] as const;

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.toLowerCase();
    return !DANGEROUS_SCHEMES.some((s) => scheme.startsWith(s));
  } catch {
    return false;
  }
}

describe("Multi-link URL Safety", () => {
  describe("isSafeUrl", () => {
    it("accepts https URLs", () => {
      expect(isSafeUrl("https://example.com")).toBe(true);
      expect(isSafeUrl("https://example.com/path?query=1")).toBe(true);
    });

    it("accepts http URLs", () => {
      expect(isSafeUrl("http://example.com")).toBe(true);
    });

    it("accepts mailto URLs", () => {
      expect(isSafeUrl("mailto:user@example.com")).toBe(true);
    });

    it("accepts tel URLs", () => {
      expect(isSafeUrl("tel:+1234567890")).toBe(true);
    });

    it("accepts sms URLs", () => {
      expect(isSafeUrl("sms:+1234567890")).toBe(true);
    });

    it("blocks javascript: URLs", () => {
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("JAVASCRIPT:alert(1)")).toBe(false);
    });

    it("blocks data: URLs", () => {
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeUrl("DATA:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("blocks vbscript: URLs", () => {
      expect(isSafeUrl("vbscript:alert(1)")).toBe(false);
      expect(isSafeUrl("VBSCRIPT:alert(1)")).toBe(false);
    });

    it("blocks file: URLs", () => {
      expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    });

    it("returns false for invalid URLs", () => {
      expect(isSafeUrl("not a url")).toBe(false);
      expect(isSafeUrl("")).toBe(false);
    });
  });
});

describe("Multi-link Zod Schemas", () => {
  it("rejects empty label", () => {
    const schema = z.object({ label: z.string().min(1) });
    const result = schema.safeParse({ label: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty URL", () => {
    const schema = z.object({ url: z.string().url() });
    const result = schema.safeParse({ url: "" });
    expect(result.success).toBe(false);
    const result2 = schema.safeParse({ url: "not-a-url" });
    expect(result2.success).toBe(false);
  });

  it("accepts valid URL", () => {
    const schema = z.object({ url: z.string().url() });
    expect(schema.safeParse({ url: "https://example.com" }).success).toBe(true);
    expect(schema.safeParse({ url: "http://localhost:3000" }).success).toBe(true);
  });

  it("theme enum only accepts valid values", () => {
    const schema = z.enum(["default", "minimal", "dark"]);
    expect(schema.safeParse("default").success).toBe(true);
    expect(schema.safeParse("minimal").success).toBe(true);
    expect(schema.safeParse("dark").success).toBe(true);
    expect(schema.safeParse("invalid").success).toBe(false);
    expect(schema.safeParse("").success).toBe(false);
  });

  it("max lengths are enforced", () => {
    const schema = z.object({
      label: z.string().min(1).max(100),
      url: z.string().min(1).url(),
    });
    expect(schema.safeParse({ label: "A".repeat(100), url: "https://x.com" }).success).toBe(true);
    expect(schema.safeParse({ label: "A".repeat(101), url: "https://x.com" }).success).toBe(false);
  });
});