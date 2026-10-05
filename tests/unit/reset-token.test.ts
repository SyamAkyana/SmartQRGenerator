import { describe, it, expect } from "vitest";
import { generateResetToken, hashResetToken } from "@/lib/auth/password-reset";

describe("Reset Token Utilities", () => {
  it("generates 64-character hex strings with 256 bits entropy", () => {
    const t1 = generateResetToken();
    const t2 = generateResetToken();

    expect(t1).toHaveLength(64);
    expect(t2).toHaveLength(64);
    expect(t1).not.toBe(t2);
  });

  it("produces deterministic SHA-256 hashes", () => {
    const raw = "my-secret-reset-token";
    const h1 = hashResetToken(raw);
    const h2 = hashResetToken(raw);

    expect(h1).toHaveLength(64);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(raw);
  });
});