import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/security/password";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

export type RegisterResult =
  | { success: true; user: { id: string; email: string; name: string } }
  | { success: false; error: { code: string; message: string } };

/**
 * Registers a new user.
 * Validates input, verifies email uniqueness, hashes password, and creates the user record.
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Validation failed";
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: firstError },
    };
  }

  const { email, name, password } = parsed.data;

  // Check if email is already registered (case-insensitive check)
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "An account with this email address already exists",
      },
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return {
    success: true,
    user: newUser,
  };
}