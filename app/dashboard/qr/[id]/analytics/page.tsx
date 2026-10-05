import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getQrById } from "@/lib/qr/service";
import { getScanStats, getScanBreakdown, getRecentScans } from "@/lib/qr/analytics";
import { ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}

function BreakdownBar({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-700">{label}</span>
        <span className="text-neutral-500">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AnalyticsPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { days: daysStr } = await searchParams;
  const days = Math.min(Math.max(parseInt(daysStr ?? "30", 10) || 30, 1), 90);

  const qr = await getQrById(id, session.user.id);
  if (!qr) redirect("/dashboard/qr");

  const [stats, recentScans] = await Promise.all([getScanStats(qr.id, days), getRecentScans(qr.id, 20)]);
  const [deviceBreakdown, browserBreakdown, osBreakdown] = await Promise.all([
    getScanBreakdown(qr.id, "deviceType"),
    getScanBreakdown(qr.id, "browser"),
    getScanBreakdown(qr.id, "os"),
  ]);

  const totalScans = stats.total;
  const timeSeries = stats.timeSeries;
  const maxCount = Math.max(...timeSeries.map((s) => Number(s.count)), 1);
  const maxBarH = 100;

  function barH(count: bigint | number) {
    return Math.max(4, Math.round((Number(count) / maxCount) * maxBarH));
  }

  const deviceTotal = deviceBreakdown.reduce((s, d) => s + Number(d.count), 0);
  const browserTotal = browserBreakdown.reduce((s, d) => s + Number(d.count), 0);
  const osTotal = osBreakdown.reduce((s, d) => s + Number(d.count), 0);

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
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/dashboard/qr">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-neutral-900">{qr.name} &#x2014; Analytics</h1>
            <p className="text-sm text-neutral-500">{qr.shortCode} &#x00B7; {qr.type}</p>
          </div>
          <div className="flex gap-1">
            {daysOptions.map((d) => (
              <Link key={d} href={`/dashboard/qr/${id}/analytics?days=${d}`}>
                <Button variant={days === d ? "default" : "outline"} size="sm">{d}d</Button>
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-neutral-500">Total Scans</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-neutral-900">{totalScans.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-neutral-500">Period</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-neutral-900">{days} days</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-neutral-500">Avg / Day</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-neutral-900">{days > 0 ? (totalScans / days).toFixed(1) : "0"}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" /> Scan History &#x2014; last {days} days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeries.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-neutral-400">No scan data yet</div>
            ) : (
              <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ height: `${maxBarH + 24}px` }}>
                {timeSeries.map((s, i) => {
                  const d = new Date(s.date);
                  const label = i % Math.ceil(timeSeries.length / 7) === 0 ? `${d.getMonth() + 1}/${d.getDate()}` : "";
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-neutral-400">{String(Number(s.count))}</span>
                      <div
                        className="w-6 bg-blue-500 rounded-sm transition-all hover:bg-blue-600"
                        style={{ height: `${barH(s.count)}px`, minHeight: "4px" }}
                      />
                      <span className="text-xs text-neutral-400">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Device Type", data: deviceBreakdown, total: deviceTotal },
            { title: "Browser", data: browserBreakdown, total: browserTotal },
            { title: "Operating System", data: osBreakdown, total: osTotal },
          ].map(({ title, data, total }) => (
            <Card key={title}>
              <CardHeader><CardTitle className="text-sm font-medium text-neutral-500">{title}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.length === 0 ? (
                  <p className="text-sm text-neutral-400">No data</p>
                ) : (
                  data.slice(0, 8).map((d) => (
                    <BreakdownBar
                      key={d.value as string}
                      label={title === "Device Type" ? deviceLabel(d.value as string) : ((d.value as string) || "Unknown")}
                      value={Number(d.count)}
                      pct={total > 0 ? Math.round((Number(d.count) / total) * 100) : 0}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Scans</CardTitle></CardHeader>
          <CardContent>
            {recentScans.length === 0 ? (
              <p className="text-sm text-neutral-400 py-8 text-center">No scans recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left">
                      <th className="pb-2 font-medium text-neutral-500">Time</th>
                      <th className="pb-2 font-medium text-neutral-500">Device</th>
                      <th className="pb-2 font-medium text-neutral-500">Browser</th>
                      <th className="pb-2 font-medium text-neutral-500">OS</th>
                      <th className="pb-2 font-medium text-neutral-500">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {recentScans.map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-50">
                        <td className="py-2 text-neutral-500">{formatScanTime(s.scannedAt)}</td>
                        <td className="py-2 text-neutral-700">{deviceLabel(s.deviceType ?? "")}</td>
                        <td className="py-2 text-neutral-700">{s.browser ?? "—"}</td>
                        <td className="py-2 text-neutral-700">{s.os ?? "—"}</td>
                        <td className="py-2 font-mono text-xs text-neutral-500">{s.ipAddress ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
