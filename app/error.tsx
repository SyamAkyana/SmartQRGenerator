"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception in production monitoring systems
    console.error("[Application Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Something went wrong</h1>
          <p className="text-sm text-neutral-600">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-xs text-neutral-400 font-mono">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "w-full border-neutral-300 text-neutral-700 hover:bg-neutral-100 flex items-center justify-center gap-2",
            })}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
