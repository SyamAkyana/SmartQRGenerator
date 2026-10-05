import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check, AlertCircle } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import { getQrContent } from "@/lib/qr/generate";
import { QrPreview, toDotStyle, toCornerStyle, toEyeStyle, type DesignOptions } from "./qr-preview";
import { getExportFilename, RESOLUTION_OPTIONS, type ExportFormat, type ExportResolution } from "@/lib/qr/export-utils";
import { getBuiltinIconDataUri, isBuiltinIcon } from "@/lib/qr/icons";
import QRCodeStyling from "qr-code-styling";

interface DownloadQrDialogProps {
  qr: QRCodeRecord | null;
  design?: DesignOptions;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_DESIGN: DesignOptions = {
  foregroundColor: "#000000",
  backgroundColor: "#ffffff",
  dotStyle: "square",
  cornerStyle: "square",
  eyeStyle: "square",
  frameStyle: "none",
  frameText: null,
  logoFileId: null,
  errorCorrectionLevel: "M",
};

/** Convert any logo (builtin icon or uploaded file) into a clean base64 data URI for safe export. */
export async function resolveLogoDataUri(logoFileId?: string | null): Promise<string | undefined> {
  if (!logoFileId) return undefined;
  if (isBuiltinIcon(logoFileId)) {
    return getBuiltinIconDataUri(logoFileId);
  }
  try {
    const res = await fetch(`/api/file/${logoFileId}?publicLogo=1`);
    const targetRes = res.ok ? res : await fetch(`/api/file/${logoFileId}`);
    if (!targetRes.ok) return undefined;
    const blob = await targetRes.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DownloadQrDialog({ qr, design: initialDesign, onOpenChange }: DownloadQrDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [resolution, setResolution] = useState<ExportResolution>(512);
  const [design, setDesign] = useState<DesignOptions>(initialDesign ?? DEFAULT_DESIGN);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const open = qr !== null;

  useEffect(() => {
    if (!qr) return;
    setDownloaded(false);
    setErrorMessage(null);
    if (initialDesign) {
      setDesign({ ...DEFAULT_DESIGN, ...initialDesign });
      return;
    }
    fetch(`/api/qr/${qr.id}/design`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.design) {
          setDesign((prev) => ({
            ...prev,
            ...data.data.design,
          }));
        }
      })
      .catch(() => {});
  }, [qr, initialDesign]);

  async function handleDownload() {
    if (!qr) return;
    setDownloading(true);
    setErrorMessage(null);

    try {
      const content = getQrContent(qr) || "https://smartqr.example";
      const filename = getExportFilename(qr.name, format);
      const cleanName = filename.replace(/\.(png|svg)$/i, "");

      // Resolve logo to Data URI to prevent canvas tainting and CORS blocking
      const logoDataUri = await resolveLogoDataUri(design.logoFileId);
      const ecLevel = (design.errorCorrectionLevel as "L" | "M" | "Q" | "H") || (logoDataUri ? "H" : "M");

      const qrOptions = {
        width: resolution,
        height: resolution,
        data: content,
        margin: Math.max(8, Math.round(resolution * 0.04)),
        qrOptions: {
          errorCorrectionLevel: ecLevel,
        },
        dotsOptions: {
          color: design.foregroundColor || "#000000",
          type: toDotStyle(design.dotStyle || "square"),
        },
        backgroundOptions: { color: design.backgroundColor || "#ffffff" },
        cornersSquareOptions: {
          color: design.foregroundColor || "#000000",
          type: toCornerStyle(design.cornerStyle || "square"),
        },
        cornersDotOptions: {
          color: design.foregroundColor || "#000000",
          type: toEyeStyle(design.eyeStyle || "square"),
        },
        ...(logoDataUri
          ? {
              image: logoDataUri,
              imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.28,
                margin: 4,
              },
            }
          : {}),
      };

      if (format === "svg") {
        const svgInstance = new QRCodeStyling({
          ...qrOptions,
          type: "svg",
        });

        const svgBlob = (await svgInstance.getRawData("svg")) as Blob | null;
        if (svgBlob && svgBlob instanceof Blob) {
          triggerBlobDownload(svgBlob, `${cleanName}.svg`);
        } else {
          await svgInstance.download({ name: cleanName, extension: "svg" });
        }
      } else {
        // PNG export
        let exported = false;

        // Strategy 1: canvas getRawData
        try {
          const canvasInstance = new QRCodeStyling({
            ...qrOptions,
            type: "canvas",
          });

          const pngBlob = await Promise.race([
            canvasInstance.getRawData("png") as Promise<Blob | null>,
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000)),
          ]);

          if (pngBlob && pngBlob instanceof Blob && pngBlob.size > 100) {
            triggerBlobDownload(pngBlob, `${cleanName}.png`);
            exported = true;
          }
        } catch {
          // Fallback to Strategy 2
        }

        // Strategy 2: Render SVG to offscreen canvas
        if (!exported) {
          const svgInstance = new QRCodeStyling({
            ...qrOptions,
            type: "svg",
          });
          const rawSvgBlob = (await svgInstance.getRawData("svg")) as Blob | null;

          if (rawSvgBlob && rawSvgBlob instanceof Blob) {
            const svgText = await rawSvgBlob.text();
            const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

            await new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = resolution;
                  canvas.height = resolution;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return reject(new Error("Canvas context failed"));
                  ctx.fillStyle = design.backgroundColor || "#ffffff";
                  ctx.fillRect(0, 0, resolution, resolution);
                  ctx.drawImage(img, 0, 0, resolution, resolution);
                  canvas.toBlob((blob) => {
                    if (blob) {
                      triggerBlobDownload(blob, `${cleanName}.png`);
                      exported = true;
                      resolve();
                    } else {
                      reject(new Error("toBlob failed"));
                    }
                  }, "image/png");
                } catch (e) {
                  reject(e);
                }
              };
              img.onerror = () => reject(new Error("SVG Image rasterization failed"));
              img.src = svgDataUrl;
            });
          }
        }

        // Strategy 3: Built-in download method
        if (!exported) {
          const fallbackInstance = new QRCodeStyling({
            ...qrOptions,
            type: "canvas",
          });
          await fallbackInstance.download({ name: cleanName, extension: "png" });
        }
      }

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to download QR code. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const previewContent = qr ? getQrContent(qr) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Export QR Code
          </DialogTitle>
          <DialogDescription>
            Download <strong className="text-neutral-900">{qr?.name}</strong> in your chosen format and resolution.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid gap-6 py-4 md:grid-cols-[200px_1fr] items-center">
          {/* Live visual preview */}
          <div className="flex flex-col items-center justify-center p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
            <QrPreview content={previewContent} design={design} size={160} />
            <span className="text-[11px] font-mono text-neutral-500 mt-2">
              {format.toUpperCase()} &#x00B7; {format === "svg" ? "Vector" : `${resolution}x${resolution}px`}
            </span>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="format-png"
                  onClick={() => setFormat("png")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    format === "png"
                      ? "border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500 font-medium"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  <div className="font-semibold text-sm">PNG</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Raster image (web, apps, print)</div>
                </button>
                <button
                  type="button"
                  data-testid="format-svg"
                  onClick={() => setFormat("svg")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    format === "svg"
                      ? "border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500 font-medium"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  <div className="font-semibold text-sm">SVG</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Infinite vector resolution</div>
                </button>
              </div>
            </div>

            {/* Resolution Selection (PNG only) */}
            {format === "png" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Resolution
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTION_OPTIONS.map((res) => (
                    <button
                      key={res.value}
                      type="button"
                      onClick={() => setResolution(res.value)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        resolution === res.value
                          ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
                          : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <div className="font-medium">{res.label}</div>
                      <div className="text-[10px] text-neutral-500">{res.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            data-testid="download-submit-btn"
            onClick={handleDownload}
            disabled={downloading}
            className="gap-2 min-w-36 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
