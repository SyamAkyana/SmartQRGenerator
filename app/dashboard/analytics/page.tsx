import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getUserScanStats,
  getUserScanBreakdown,
  getUserRecentScans,
  getUserTopQrs,
} from "@/lib/qr/analytics";
import { BarChart3, Activity, QrCode, Smartphone, Globe, Laptop, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  searchParams: Promise<{ days?: string }>;
}

function BreakdownBar({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-700 font-medium">{label}</span>
        <span className="text-neutral-500 tabular-nums">
          {value.toLocaleString()} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function GlobalAnalyticsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { days: daysStr } = await searchParams;
  const days = Math.min(Math.max(parseInt(daysStr ?? "30", 10) || 30, 1), 90);

  const [stats, recentScans, topQrs] = await Promise.all([
    getUserScanStats(session.user.id, days),
    getUserRecentScans(session.user.id, 15),
    getUserTopQrs(session.user.id, 5),
  ]);

  const [deviceBreakdown, browserBreakdown, osBreakdown] = await Promise.all([
    getUserScanBreakdown(session.user.id, "deviceType"),
    getUserScanBreakdown(session.user.id, "browser"),
    getUserScanBreakdown(session.user.id, "os"),
  ]);

  const totalScans = stats.total;
  const timeSeries = stats.timeSeries;
  const maxCount = Math.max(...timeSeries.map((s) => s.count), 1);
  const maxBarH = 120;

  function barH(count: number) {
    return Math.max(4, Math.round((count / maxCount) * maxBarH));
  }

  const deviceTotal = deviceBreakdown.reduce((s, d) => s + d.count, 0);
  const browserTotal = browserBreakdown.reduce((s, d) => s + d.count, 0);
  const osTotal = osBreakdown.reduce((s, d) => s + d.count, 0);

  function deviceLabel(raw: string) {
    const d = raw.toLowerCase();
    if (d === "mobile") return "Mobile";
    if (d === "tablet") return "Tablet";
    if (d === "desktop") return "Desktop";
    if (d === "bot") return "Bot";
    return raw || "Unknown";
  }

  function formatScanTime(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const daysOptions = [7, 30, 60, 90];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Analytics Overview
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Aggregated scan metrics, device breakdowns, and performance across all your QR codes.
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 rounded-lg border border-neutral-200">
          <span className="text-xs text-neutral-400 font-medium px-2">Timeframe:</span>
          {daysOptions.map((d) => (
            <Link key={d} href={`/dashboard/analytics?days=${d}`}>
              <Button
                variant={days === d ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs font-medium"
              >
                {d}d
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Scans (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{totalScans.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-1">Across all created QR codes</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Last {days} Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.last30d.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-1">Recent active scans</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{stats.last7d.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-1">Weekly momentum</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">
              {days > 0 ? (stats.last30d / days).toFixed(1) : "0"}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Scans per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Scan History (Past {days} Days)
          </CardTitle>
          <CardDescription>
            Daily aggregate scan volume across all published QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-neutral-400 gap-2 border border-dashed border-neutral-200 rounded-lg">
              <QrCode className="w-8 h-8 opacity-40" />
              <p className="text-sm">No scan events recorded in this timeframe yet.</p>
            </div>
          ) : (
            <div
              className="flex items-end gap-1.5 overflow-x-auto pb-2 pt-4"
              style={{ height: `${maxBarH + 40}px` }}
            >
              {timeSeries.map((s, i) => {
                const d = new Date(s.date);
                const label =
                  i % Math.max(1, Math.ceil(timeSeries.length / 10)) === 0
                    ? `${d.getMonth() + 1}/${d.getDate()}`
                    : "";
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[24px]">
                    <span className="text-[10px] font-medium text-neutral-500 tabular-nums">
                      {s.count > 0 ? s.count : ""}
                    </span>
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 rounded-xs transition-all cursor-pointer"
                      title={`${d.toLocaleDateString()}: ${s.count} scans`}
                      style={{ height: `${barH(s.count)}px`, minHeight: "4px" }}
                    />
                    <span className="text-[10px] text-neutral-400 truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top QR Codes & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top QR codes */}
        <Card className="border-neutral-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900 flex items-center justify-between">
              <span>Top QR Codes</span>
              <Link href="/dashboard/qr" className="text-xs text-blue-600 font-normal hover:underline flex items-center gap-0.5">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </CardTitle>
            <CardDescription>Most scanned destinations</CardDescription>
          </CardHeader>
          <CardContent>
            {topQrs.length === 0 ? (
              <p className="text-sm text-neutral-400 py-6 text-center">No QR codes created yet</p>
            ) : (
              <div className="space-y-3">
                {topQrs.map((qr) => (
                  <div
                    key={qr.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-100"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <Link
                        href={`/dashboard/qr/${qr.id}`}
                        className="text-sm font-medium text-neutral-900 hover:text-blue-600 truncate block"
                      >
                        {qr.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                          {qr.type}
                        </Badge>
                        <span className="font-mono text-[10px] text-neutral-400">{qr.shortCode}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-neutral-900 tabular-nums">
                        {qr.scans.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">scans</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device & Browser Breakdowns */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-neutral-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-neutral-500" />
                Device Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deviceBreakdown.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">No device data</p>
              ) : (
                deviceBreakdown.map((d) => (
                  <BreakdownBar
                    key={d.value}
                    label={deviceLabel(d.value)}
                    value={d.count}
                    pct={d.percentage}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <Globe className="w-4 h-4 text-neutral-500" />
                Browser Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {browserBreakdown.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">No browser data</p>
              ) : (
                browserBreakdown.slice(0, 5).map((d) => (
                  <BreakdownBar
                    key={d.value}
                    label={d.value}
                    value={d.count}
                    pct={d.percentage}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-neutral-200 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-neutral-500" />
                Operating System Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {osBreakdown.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center col-span-2">No OS data</p>
              ) : (
                osBreakdown.slice(0, 6).map((d) => (
                  <BreakdownBar
                    key={d.value}
                    label={d.value}
                    value={d.count}
                    pct={d.percentage}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Scans Table */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">
            Live Scan Activity Stream
          </CardTitle>
          <CardDescription>Most recent scans across your dynamic QR network</CardDescription>
        </CardHeader>
        <CardContent>
          {recentScans.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">
              No scans recorded yet. Share your QR codes to start receiving live telemetry.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left">
                    <th className="pb-2.5 font-medium text-neutral-500">Time</th>
                    <th className="pb-2.5 font-medium text-neutral-500">QR Code</th>
                    <th className="pb-2.5 font-medium text-neutral-500">Device</th>
                    <th className="pb-2.5 font-medium text-neutral-500">Browser / OS</th>
                    <th className="pb-2.5 font-medium text-neutral-500">Anonymized IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {recentScans.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50">
                      <td className="py-2.5 text-neutral-500">{formatScanTime(s.scannedAt)}</td>
                      <td className="py-2.5 font-medium text-neutral-900">
                        <Link
                          href={`/dashboard/qr/${s.qrCodeId}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {s.qrName}
                        </Link>
                      </td>
                      <td className="py-2.5 text-neutral-700">{deviceLabel(s.deviceType ?? "")}</td>
                      <td className="py-2.5 text-neutral-700">
                        {s.browser ?? "—"} / {s.os ?? "—"}
                      </td>
                      <td className="py-2.5 font-mono text-xs text-neutral-500">
                        {s.ipAddress ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
