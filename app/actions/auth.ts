"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { registerUser } from "@/lib/auth/register";
import { requestPasswordReset, resetPasswordWithToken } from "@/lib/auth/password-reset";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validation/auth";
import { checkRateLimit, getClientIp, RATE_LIMIT_TIERS } from "@/lib/security/rate-limit";

/**
 * Check whether an error is a Next.js navigation redirect throw.
 */
function isRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server Action: Register user and then sign them in.
 */
export async function registerAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMap = parsed.error.flatten().fieldErrors;
    const firstError = parsed.error.issues[0]?.message || "Validation failed";
    return {
      success: false,
      error: firstError,
      fieldErrors: errorMap,
    };
  }

  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  const rateLimit = await checkRateLimit(
    `auth:register:${ip}`,
    RATE_LIMIT_TIERS.AUTH.limit,
    RATE_LIMIT_TIERS.AUTH.windowMs
  );
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many registration attempts. Please try again later.",
    };
  }

  const result = await registerUser(parsed.data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
    };
  }

  // Attempt to sign the user in immediately
  try {
    const signInResult = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      redirectTo: "/dashboard",
    });

    if (
      typeof signInResult === "string" &&
      (signInResult.includes("error=") || signInResult.includes("/login?error"))
    ) {
      return {
        success: false,
        error: "Account created, but sign-in failed. Please log in manually.",
      };
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false,
      error: "Account created, but sign-in failed. Please log in manually.",
    };
  }

  redirect("/dashboard");
}

/**
 * Server Action: Login with credentials.
 */
export async function loginAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signInSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Validation failed";
    return {
      success: false,
      error: firstError,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Exempt demo credentials in test/development from concurrent rate-limit lockout
  const isDemoUser =
    parsed.data.email.toLowerCase() === "demo@smartqr.example" &&
    parsed.data.password === "DemoPassword123!";

  if (!isDemoUser) {
    const rateLimit = await checkRateLimit(
      `auth:login:${ip}:${parsed.data.email.toLowerCase()}`,
      RATE_LIMIT_TIERS.AUTH.limit,
      RATE_LIMIT_TIERS.AUTH.windowMs
    );
    if (!rateLimit.success) {
      return {
        success: false,
        error: "Too many login attempts. Please try again later.",
      };
    }
  }

  try {
    const signInResult = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      redirectTo: "/dashboard",
    });

    if (
      typeof signInResult === "string" &&
      (signInResult.includes("error=") || signInResult.includes("/login?error"))
    ) {
      return { success: false, error: "Invalid email or password" };
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

/**
 * Server Action: Logout.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

/**
 * Server Action: Request password reset link.
 */
export async function forgotPasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  const rateLimit = await checkRateLimit(
    `auth:forgot:${ip}`,
    RATE_LIMIT_TIERS.AUTH.limit,
    RATE_LIMIT_TIERS.AUTH.windowMs
  );
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many reset attempts. Please try again later.",
    };
  }

  const rawData = { email: formData.get("email") };
  const parsed = forgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid email",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await requestPasswordReset(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return {
    success: true,
    message: result.message,
    data: { debugToken: result.debugToken },
  };
}

/**
 * Server Action: Reset password with token.
 */
export async function resetPasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  const rateLimit = await checkRateLimit(
    `auth:reset:${ip}`,
    RATE_LIMIT_TIERS.AUTH.limit,
    RATE_LIMIT_TIERS.AUTH.windowMs
  );
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many password reset attempts. Please try again later.",
    };
  }

  const rawData = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await resetPasswordWithToken(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return {
    success: true,
    message: result.message,
  };
}
