import { FileDown, FileText, Download } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import { QrPageShell } from "./qr-page-shell";

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileQrPage({ qr }: { qr: QRCodeRecord }) {
  const data = (qr.data ?? {}) as Record<string, unknown>;
  const fileId = typeof data.fileId === "string" ? data.fileId : null;
  const fileName = typeof data.fileName === "string" ? data.fileName : qr.name;
  const sizeBytes = typeof data.sizeBytes === "number" ? data.sizeBytes : undefined;
  const mimeType = typeof data.mimeType === "string" ? data.mimeType : undefined;

  const downloadUrl = fileId ? `/api/file/${fileId}?qr=${qr.shortCode}` : null;

  return (
    <QrPageShell>
      <div className="space-y-6 text-center">
        <div className="mx-auto p-4 bg-cyan-50 rounded-2xl w-fit border border-cyan-100 shadow-xs">
          <FileDown className="w-10 h-10 text-cyan-600" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-neutral-900 break-words">{qr.name}</h1>
          <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">
            Shared Document / File
          </p>
        </div>

        {downloadUrl ? (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-left space-y-1.5">
              <div className="flex items-center gap-2.5 text-neutral-900 font-medium text-sm">
                <FileText className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="truncate">{fileName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 pl-6">
                {mimeType && <span>{mimeType}</span>}
                {mimeType && sizeBytes && <span>•</span>}
                {sizeBytes && <span>{formatSize(sizeBytes)}</span>}
              </div>
            </div>

            <a
              href={downloadUrl}
              download={fileName}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xl transition-all shadow-xs hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              Download File
            </a>
          </div>
        ) : (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-sm text-neutral-500">
              No file has been attached to this QR code yet.
            </p>
          </div>
        )}
      </div>
    </QrPageShell>
  );
}
