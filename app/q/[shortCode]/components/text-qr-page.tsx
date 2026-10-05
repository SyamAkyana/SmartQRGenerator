import { FileText } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import { QrPageShell } from "./qr-page-shell";

/** Landing page for TEXT QR codes. */
export function TextQrPage({ qr }: { qr: QRCodeRecord }) {
  const text = typeof qr.data?.text === "string" ? qr.data.text : "";
  return (
    <QrPageShell>
      <div className="mx-auto p-3 bg-orange-50 rounded-full w-fit">
        <FileText className="w-6 h-6 text-orange-600" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">{qr.name}</h1>
      <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Text QR</p>
      <p className="whitespace-pre-wrap break-words text-left bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm text-neutral-800 leading-relaxed">
        {text || "No text content available."}
      </p>
    </QrPageShell>
  );
}