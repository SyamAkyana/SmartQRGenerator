import { PowerOff } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import { QrPageShell } from "./qr-page-shell";

/** Landing page shown when a QR is DISABLED or EXPIRED (spec §11.4). */
export function InactiveQrPage({ qr }: { qr: QRCodeRecord }) {
  const expired = qr.status === "EXPIRED";
  return (
    <QrPageShell>
      <div className="mx-auto p-3 bg-amber-50 rounded-full w-fit">
        <PowerOff className="w-6 h-6 text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">
        This QR code is {expired ? "expired" : "disabled"}
      </h1>
      <p className="text-sm text-neutral-500">
        <strong className="text-neutral-700">{qr.name}</strong> can no longer be scanned
        {expired ? " because it has expired." : " — the owner has turned it off."}
      </p>
    </QrPageShell>
  );
}