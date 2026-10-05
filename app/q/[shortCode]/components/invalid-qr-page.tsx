import { AlertTriangle } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import { QrPageShell } from "./qr-page-shell";

/** Page shown when the QR's data is malformed or the target is unsafe. */
export function InvalidQrPage({ qr, reason }: { qr: QRCodeRecord; reason: string }) {
  return (
    <QrPageShell>
      <div className="mx-auto p-3 bg-red-50 rounded-full w-fit">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">This QR code is not configured</h1>
      <p className="text-sm text-neutral-500">
        <strong className="text-neutral-700">{qr.name}</strong> exists but cannot be resolved.
      </p>
      <p className="text-xs text-neutral-400">{reason}</p>
    </QrPageShell>
  );
}