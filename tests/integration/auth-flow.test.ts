import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { registerUser } from "@/lib/auth/register";
import { requestPasswordReset, resetPasswordWithToken } from "@/lib/auth/password-reset";
import { verifyPassword } from "@/lib/security/password";

describe("Authentication Integration Flow (Aiven PostgreSQL)", () => {
  const testEmail = `test-user-${Date.now()}@example.com`;
  const initialPassword = "TestPassword123!";
  const newPassword = "UpdatedPassword456!";
  let createdUserId = "";

  afterAll(async () => {
    // Clean up test data
    if (createdUserId) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });

  it("registers a new user with hashed password in database", async () => {
    const result = await registerUser({
      name: "Integration Test User",
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      createdUserId = result.user.id;
      expect(result.user.email).toBe(testEmail);

      // Verify DB record
      const dbUser = await prisma.user.findUnique({ where: { id: createdUserId } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).not.toBe(initialPassword);

      const isValid = await verifyPassword(initialPassword, dbUser!.passwordHash);
      expect(isValid).toBe(true);
    }
  });

  it("prevents duplicate registration with the same email", async () => {
    const result = await registerUser({
      name: "Duplicate User",
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("EMAIL_ALREADY_EXISTS");
    }
  });

  it("executes password reset flow: request -> verify -> reset -> login with new password", async () => {
    // 1. Request reset
    const reqResult = await requestPasswordReset({ email: testEmail });
    expect(reqResult.success).toBe(true);
    if (!reqResult.success) return;

    expect(reqResult.debugToken).toBeDefined();
    const rawToken = reqResult.debugToken!;

    // 2. Perform reset
    const resetResult = await resetPasswordWithToken({
      token: rawToken,
      password: newPassword,
      confirmPassword: newPassword,
    });
    expect(resetResult.success).toBe(true);

    // 3. Verify user's new password in DB
    const dbUser = await prisma.user.findUnique({ where: { id: createdUserId } });
    expect(await verifyPassword(newPassword, dbUser!.passwordHash)).toBe(true);
    expect(await verifyPassword(initialPassword, dbUser!.passwordHash)).toBe(false);

    // 4. Token cannot be reused (single-use enforcement)
    const reuseResult = await resetPasswordWithToken({
      token: rawToken,
      password: "AnotherPassword789!",
      confirmPassword: "AnotherPassword789!",
    });
    expect(reuseResult.success).toBe(false);
    if (!reuseResult.success) {
      expect(reuseResult.error.code).toBe("TOKEN_ALREADY_USED");
    }
  });
});