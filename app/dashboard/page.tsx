import { auth } from "@/auth";
import { getDashboardStats } from "@/lib/analytics/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCode, HardDrive, BarChart3, CheckCircle2, User, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const stats = userId ? await getDashboardStats(userId) : null;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-sm text-neutral-600">
          Manage your dynamic QR codes, hosted files, and real-time scan analytics.
        </p>
      </div>

      {/* Quick Actions & Status Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-base font-semibold text-neutral-900">
              SmartQR Workspace Active
            </h2>
          </div>
          <p className="text-sm text-neutral-600">
            Create, manage, and customize dynamic QR codes with live redirection and scan analytics.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/qr"
            className="px-3.5 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
          >
            Create QR Code
          </Link>
          <Link
            href="/dashboard/analytics"
            className="px-3.5 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalQrCodes.toLocaleString() ?? 0}</div>
            <p className="text-xs text-neutral-500 mt-1">
              <Link href="/dashboard/qr" className="text-blue-600 hover:underline">Manage QR Codes →</Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active QR Codes</CardTitle>
            <ShieldCheck className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeQrCodes ?? 0}</div>
            <p className="text-xs text-neutral-500 mt-1">
              <Link href="/dashboard/qr" className="text-blue-600 hover:underline">View Active →</Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <BarChart3 className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalScans.toLocaleString() ?? 0}</div>
            <p className="text-xs text-neutral-500 mt-1">
              {stats && stats.last7dScans > 0
                ? `${stats.last7dScans.toLocaleString()} in the last 7 days`
                : "No scans yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Stored</CardTitle>
            <HardDrive className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storedFiles ?? 0}</div>
            <p className="text-xs text-neutral-500 mt-1">
              <Link href="/dashboard/files" className="text-blue-600 hover:underline">Manage Files →</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Info Card */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-neutral-700" />
            Your Account Details
          </CardTitle>
          <CardDescription>
            Account metadata verified against the Aiven PostgreSQL database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-neutral-100 rounded-lg">
              <span className="text-xs text-neutral-500 uppercase font-semibold">User ID</span>
              <p className="font-mono text-neutral-900 text-xs mt-1 break-all">{session?.user?.id}</p>
            </div>
            <div className="p-3 bg-neutral-100 rounded-lg">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Name</span>
              <p className="font-medium text-neutral-900 mt-1">{session?.user?.name}</p>
            </div>
            <div className="p-3 bg-neutral-100 rounded-lg">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Email</span>
              <p className="font-medium text-neutral-900 mt-1">{session?.user?.email}</p>
            </div>
            <div className="p-3 bg-neutral-100 rounded-lg">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Auth Strategy</span>
              <p className="font-medium text-neutral-900 mt-1">Credentials + JWT (Auth.js v5)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}