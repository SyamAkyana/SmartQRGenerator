"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans text-neutral-900 antialiased">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Application Error</h1>
            <p className="text-sm text-neutral-600">
              A critical error prevented the application from rendering properly.
            </p>
            {error.digest && (
              <p className="text-xs text-neutral-400 font-mono">
                Error Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button
              onClick={() => reset()}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
