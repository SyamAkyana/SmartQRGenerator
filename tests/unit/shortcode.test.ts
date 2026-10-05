import { describe, it, expect } from "vitest";
import { generateShortCode } from "@/lib/qr/shortcode";

describe("Short Code Generation", () => {
  it("generates a code with 7 alphanumeric characters", () => {
    const code = generateShortCode();
    expect(code).toMatch(/^[A-Za-z0-9]{7}$/);
  });

  it("generates unique codes across multiple calls", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateShortCode()));
    // With nanoid(7) and 36^7 ≈ 78B possibilities, collisions are astronomically unlikely
    expect(codes.size).toBe(100);
  });

  it("generates only URL-safe characters (no padding or special chars)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateShortCode();
      expect(code).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it("uses a consistent length that fits in short URLs", () => {
    const code = generateShortCode();
    expect(code.length).toBeLessThanOrEqual(10);
  });
});