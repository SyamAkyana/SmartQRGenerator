import { Wifi, Lock, Unlock, EyeOff } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import { QrPageShell } from "./qr-page-shell";

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Landing page for WIFI QR codes. */
export function WifiQrPage({ qr }: { qr: QRCodeRecord }) {
  const d = qr.data ?? {};
  const ssid = asString(d.ssid) ?? "Unknown";
  const authType = asString(d.authType) ?? "WPA";
  const hidden = d.hidden === true;
  const hasPassword = authType !== "nopass" && asString(d.password);

  return (
    <QrPageShell>
      <div className="mx-auto p-3 bg-neutral-100 rounded-full w-fit">
        <Wifi className="w-6 h-6 text-neutral-700" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">{qr.name}</h1>
      <p className="text-xs font-medium text-neutral-600 uppercase tracking-wider">Wi-Fi QR</p>

      <div className="text-left bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs text-neutral-500 font-medium uppercase">Network</p>
          <p className="text-lg font-semibold text-neutral-900">{ssid}</p>
        </div>
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-neutral-500 font-medium uppercase">Security</p>
            <div className="flex items-center gap-1 mt-0.5">
              {hasPassword ? (
                <Lock className="w-3 h-3 text-amber-600" />
              ) : (
                <Unlock className="w-3 h-3 text-emerald-600" />
              )}
              <span className="text-sm text-neutral-700">{authType.toUpperCase()}</span>
            </div>
          </div>
          {hidden && (
            <div>
              <p className="text-xs text-neutral-500 font-medium uppercase">Visibility</p>
              <div className="flex items-center gap-1 mt-0.5">
                <EyeOff className="w-3 h-3 text-neutral-500" />
                <span className="text-sm text-neutral-700">Hidden</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        Open your device&apos;s Wi-Fi settings and scan this QR code to connect automatically.
      </p>
    </QrPageShell>
  );
}