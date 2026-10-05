import { describe, it, expect } from "vitest";
import {
  registerSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

describe("Auth Validation Schemas", () => {
  describe("registerSchema", () => {
    it("accepts valid registration input", () => {
      const valid = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const invalid = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "StrongPassword123!",
        confirmPassword: "DifferentPassword123!",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Passwords do not match");
      }
    });

    it("rejects weak passwords missing uppercase/numbers", () => {
      const weak = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "weakpassword",
        confirmPassword: "weakpassword",
      };
      const result = registerSchema.safeParse(weak);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email formats", () => {
      const badEmail = {
        name: "Jane Doe",
        email: "not-an-email",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      };
      const result = registerSchema.safeParse(badEmail);
      expect(result.success).toBe(false);
    });
  });

  describe("signInSchema", () => {
    it("accepts valid sign in input", () => {
      const valid = {
        email: "user@example.com",
        password: "any-password",
      };
      const result = signInSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const invalid = {
        email: "user@example.com",
        password: "",
      };
      const result = signInSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("accepts valid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "user@example.com" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "bad-email" });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts valid token and matching strong password", () => {
      const result = resetPasswordSchema.safeParse({
        token: "random-token-string",
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing token", () => {
      const result = resetPasswordSchema.safeParse({
        token: "",
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });
      expect(result.success).toBe(false);
    });
  });
});