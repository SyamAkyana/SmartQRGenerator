"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction, type ActionResult } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    resetPasswordAction,
    null
  );

  if (!token) {
    return (
      <Card className="shadow-lg border-neutral-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-tight text-red-700">
            Invalid Reset Link
          </CardTitle>
          <CardDescription>
            This password reset link is missing a valid token. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            href="/forgot-password"
            className={buttonVariants({ className: "w-full bg-neutral-900 hover:bg-neutral-800 text-white" })}
          >
            Request new link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-neutral-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold tracking-tight">
          Set new password
        </CardTitle>
        <CardDescription>
          Enter a strong new password for your SmartQR account
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="token" value={token} />

        <CardContent className="space-y-4">
          {state && state.success && (
            <div
              role="alert"
              className="p-3 text-sm rounded-md bg-green-50 border border-green-200 text-green-800 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{state.message}</p>
                <Link
                  href="/login"
                  className="mt-2 inline-block font-medium underline text-green-900 hover:text-green-950"
                >
                  Proceed to sign in →
                </Link>
              </div>
            </div>
          )}

          {state && !state.success && (
            <div
              role="alert"
              className="p-3 text-sm rounded-md bg-red-50 border border-red-200 text-red-700 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {!state?.success && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={isPending}
                />
                <p className="text-xs text-neutral-500">
                  Min 8 characters, uppercase, lowercase, and a number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={isPending}
                />
              </div>
            </>
          )}
        </CardContent>

        {!state?.success && (
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>

            <Link
              href="/login"
              className="text-center text-sm text-neutral-600 hover:text-neutral-900"
            >
              Back to sign in
            </Link>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="shadow-lg border-neutral-200 p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-600" />
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}