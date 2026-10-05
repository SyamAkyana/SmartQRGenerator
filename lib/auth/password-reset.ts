import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/security/password";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validation/auth";

const TOKEN_EXPIRY_HOURS = 1;

/**
 * Hash raw token with SHA-256 for secure storage.
 * The raw token is sent to the user (via email link); the database only stores the hash.
 */
export function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generate a cryptographically secure random reset token.
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export type RequestPasswordResetResult =
  | { success: true; message: string; debugToken?: string }
  | { success: false; error: { code: string; message: string } };

/**
 * Requests a password reset.
 * Always returns a generic success message to prevent user enumeration.
 * In development, returns the raw token in `debugToken` for testing.
 */
export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<RequestPasswordResetResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message || "Invalid email",
      },
    };
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // Always return success even if user not found (security requirement: no user enumeration)
  if (!user) {
    return {
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    };
  }

  // Invalidate any existing unused reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // In a production system, dispatch email here.
  // In development, log the link to stdout.
  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📧 [DEV EMAIL] Password reset requested for ${email}`);
    console.log(`   Reset URL: ${resetUrl}\n`);
  }

  return {
    success: true,
    message: "If an account exists with that email, a password reset link has been sent.",
    debugToken: process.env.NODE_ENV !== "production" ? rawToken : undefined,
  };
}

export type ResetPasswordResult =
  | { success: true; message: string }
  | { success: false; error: { code: string; message: string } };

/**
 * Resets a password using a valid, unexpired token.
 */
export async function resetPasswordWithToken(
  input: ResetPasswordInput
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message || "Validation failed",
      },
    };
  }

  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!tokenRecord) {
    return {
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired password reset link.",
      },
    };
  }

  if (tokenRecord.usedAt !== null) {
    return {
      success: false,
      error: {
        code: "TOKEN_ALREADY_USED",
        message: "This password reset link has already been used.",
      },
    };
  }

  if (tokenRecord.expiresAt < new Date()) {
    return {
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "This password reset link has expired. Please request a new one.",
      },
    };
  }

  const newPasswordHash = await hashPassword(password);

  // Atomically update the user password and mark the token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    success: true,
    message: "Your password has been successfully reset. You can now log in.",
  };
}