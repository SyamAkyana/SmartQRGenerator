"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionResult } from "@/app/actions/auth";
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
import { Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    registerAction,
    null
  );

  return (
    <Card className="shadow-lg border-neutral-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold tracking-tight">Create an account</CardTitle>
        <CardDescription>
          Get started with SmartQR for dynamic QR codes and analytics
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
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
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Alex Johnson"
              required
              autoComplete="name"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="alex@example.com"
              required
              autoComplete="email"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-center text-sm text-neutral-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-700"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}