import Link from "next/link";
import { QrCode, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-2xl flex items-center justify-center mx-auto">
          <QrCode className="w-8 h-8 text-neutral-700" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">404</h1>
          <h2 className="text-lg font-semibold text-neutral-800">Page Not Found</h2>
          <p className="text-sm text-neutral-600">
            The page or QR destination you are looking for does not exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className={buttonVariants({
              variant: "default",
              className: "w-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2",
            })}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "outline",
              className: "w-full border-neutral-300 text-neutral-700 hover:bg-neutral-100",
            })}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
