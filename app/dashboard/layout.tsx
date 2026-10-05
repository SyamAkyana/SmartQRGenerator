import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { QrCode, LayoutDashboard, FolderArchive, BarChart3 } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Acceptance criteria: Unauthenticated user cannot access dashboard
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-neutral-900">
              <div className="p-1.5 bg-neutral-900 text-white rounded-lg">
                <QrCode className="w-5 h-5" />
              </div>
              <span>SmartQR</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium bg-neutral-100 text-neutral-900 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/qr"
                className="px-3 py-2 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                QR Codes
              </Link>
              <Link
                href="/dashboard/files"
                className="px-3 py-2 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2 transition-colors"
              >
                <FolderArchive className="w-4 h-4" />
                Files
              </Link>
              <Link
                href="/dashboard/analytics"
                className="px-3 py-2 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-neutral-900">{session.user.name}</span>
              <span className="text-xs text-neutral-500">{session.user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        SmartQR MVP — One QR. Everything connected.
      </footer>
    </div>
  );
}