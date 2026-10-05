import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/security/password";

describe("Password Security (bcryptjs)", () => {
  it("hashes password and verifies successfully with correct plaintext", async () => {
    const plain = "SuperSecretPassword123!";
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isMatch = await verifyPassword(plain, hash);
    expect(isMatch).toBe(true);
  });

  it("fails verification with incorrect plaintext", async () => {
    const plain = "CorrectPassword123!";
    const wrong = "WrongPassword123!";
    const hash = await hashPassword(plain);

    const isMatch = await verifyPassword(wrong, hash);
    expect(isMatch).toBe(false);
  });

  it("returns false gracefully on empty inputs", async () => {
    expect(await verifyPassword("", "")).toBe(false);
    expect(await verifyPassword("foo", "")).toBe(false);
  });
});