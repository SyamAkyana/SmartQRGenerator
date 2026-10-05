import Link from "next/link";
import { QrCode } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-neutral-50 to-neutral-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-neutral-900 hover:text-neutral-700 transition-colors"
          >
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <QrCode className="w-6 h-6" />
            </div>
            <span>SmartQR</span>
          </Link>
          <p className="text-sm text-neutral-600">
            One QR. Everything connected.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}