"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
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
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    forgotPasswordAction,
    null
  );

  return (
    <Card className="shadow-lg border-neutral-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold tracking-tight">
          Forgot your password?
        </CardTitle>
        <CardDescription>
          Enter your email address and we will send you a reset link
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state && state.success && (
            <div
              role="alert"
              className="p-3 text-sm rounded-md bg-green-50 border border-green-200 text-green-800 space-y-2"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{state.message}</span>
              </div>
              {(state.data as { debugToken?: string } | undefined)?.debugToken && (
                <div className="pt-2 border-t border-green-200 text-xs text-neutral-600">
                  <p className="font-semibold text-neutral-800">[DEV MODE] Reset Link:</p>
                  <Link
                    href={`/reset-password?token=${(state.data as { debugToken: string }).debugToken}`}
                    className="underline text-blue-600 hover:text-blue-800 break-all"
                  >
                    /reset-password?token={(state.data as { debugToken: string }).debugToken}
                  </Link>
                </div>
              )}
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}