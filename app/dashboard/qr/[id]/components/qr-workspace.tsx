"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Globe,
  Palette,
  Download,
  Copy,
  Check,
  BarChart3,
  ExternalLink,
  Loader2,
  Save,
  Eye,
  Settings2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { QRCodeRecord } from "@/lib/qr/service";
import { getQrContent } from "@/lib/qr/generate";
import { QrPreview, type DesignOptions } from "../../components/qr-preview";
import { DesignPicker } from "../../components/design-picker";
import { DownloadQrDialog } from "../../components/download-qr-dialog";
import { QrTypeFields } from "../../components/qr-type-fields";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QrWorkspaceProps {
  initialQr: QRCodeRecord;
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

export function QrWorkspace({ initialQr }: QrWorkspaceProps) {
  const router = useRouter();
  const [qr, setQr] = useState<QRCodeRecord>(initialQr);
  const [name, setName] = useState(initialQr.name);
  const [qrData, setQrData] = useState<Record<string, any>>((initialQr.data as Record<string, any>) || {});
  const [design, setDesign] = useState<DesignOptions>(DEFAULT_DESIGN);
  const [activeTab, setActiveTab] = useState<"content" | "design">("content");

  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [savingDesign, setSavingDesign] = useState(false);
  const [designSaved, setDesignSaved] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);
  const [designLoaded, setDesignLoaded] = useState(false);

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/q/${qr.shortCode}`
    : `/q/${qr.shortCode}`;

  // Load design on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/qr/${qr.id}/design`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.data?.design) {
          const stored = data.data.design as Partial<DesignOptions>;
          setDesign({
            foregroundColor: stored.foregroundColor || DEFAULT_DESIGN.foregroundColor,
            backgroundColor: stored.backgroundColor || DEFAULT_DESIGN.backgroundColor,
            dotStyle: stored.dotStyle || DEFAULT_DESIGN.dotStyle,
            cornerStyle: stored.cornerStyle || DEFAULT_DESIGN.cornerStyle,
            eyeStyle: stored.eyeStyle || DEFAULT_DESIGN.eyeStyle,
            frameStyle: stored.frameStyle || DEFAULT_DESIGN.frameStyle,
            frameText: stored.frameText ?? null,
            logoFileId: stored.logoFileId ?? null,
            errorCorrectionLevel: stored.errorCorrectionLevel || DEFAULT_DESIGN.errorCorrectionLevel,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDesignLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [qr.id]);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsSaved(false);
    setDetailsError(null);

    try {
      const res = await fetch(`/api/qr/${qr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data: qrData }),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setQr(resData.data.qr ?? resData.data);
        setDetailsSaved(true);
        setTimeout(() => setDetailsSaved(false), 3000);
        router.refresh();
      } else {
        setDetailsError(resData.error?.message ?? "Failed to save details");
      }
    } catch {
      setDetailsError("Network error while updating QR code");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSaveDesign() {
    setSavingDesign(true);
    setDesignSaved(false);
    setDesignError(null);

    try {
      const res = await fetch(`/api/qr/${qr.id}/design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foregroundColor: design.foregroundColor,
          backgroundColor: design.backgroundColor,
          dotStyle: design.dotStyle,
          cornerStyle: design.cornerStyle,
          eyeStyle: design.eyeStyle,
          frameStyle: design.frameStyle ?? "none",
          frameText: design.frameText?.trim() ? design.frameText.trim() : null,
          logoFileId: design.logoFileId ?? null,
          errorCorrectionLevel: design.errorCorrectionLevel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDesignSaved(true);
        setTimeout(() => setDesignSaved(false), 3000);
      } else {
        setDesignError(data.error?.message ?? "Failed to save design");
      }
    } catch {
      setDesignError("Failed to save design");
    } finally {
      setSavingDesign(false);
    }
  }

  function copyShortLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const previewContent = getQrContent(qr);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left / Main Workspace: Content & Design */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === "content"
                ? "bg-white text-neutral-900 shadow-xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            <Settings2 className="w-4 h-4 text-blue-600" />
            Destination & Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("design")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === "design"
                ? "bg-white text-neutral-900 shadow-xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            <Palette className="w-4 h-4 text-indigo-600" />
            Visual Design & Styling
          </button>
        </div>

        {activeTab === "content" ? (
          <Card className="border-neutral-200 shadow-xs">
            <CardHeader className="pb-4 border-b border-neutral-100">
              <CardTitle className="text-base font-semibold text-neutral-900">
                Destination Settings
              </CardTitle>
              <CardDescription>
                Configure the destination content for this {qr.type} QR code. Dynamic changes take effect instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSaveDetails} className="space-y-5">
                {detailsError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {detailsError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="ws-name" className="text-sm font-medium text-neutral-700">
                    QR Code Name
                  </label>
                  <Input
                    id="ws-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Campaign QR"
                    required
                    maxLength={255}
                  />
                </div>

                <div className="pt-2">
                  <QrTypeFields type={qr.type} data={qrData} onChange={setQrData} />
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  {detailsSaved ? (
                    <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Changes saved successfully!
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400">
                      Modifications update existing printed scans immediately.
                    </span>
                  )}
                  <Button
                    type="submit"
                    disabled={savingDetails}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingDetails && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Content
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-neutral-200 shadow-xs">
            <CardHeader className="pb-4 border-b border-neutral-100">
              <CardTitle className="text-base font-semibold text-neutral-900">
                Visual Styling
              </CardTitle>
              <CardDescription>
                Customize foreground colors, eye patterns, body shapes, logo overlays, and call-to-action frames.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              {designError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {designError}
                </div>
              )}

              {designLoaded ? (
                <DesignPicker design={design} onChange={setDesign} />
              ) : (
                <div className="py-12 flex items-center justify-center text-neutral-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading design customizer…</span>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                {designSaved ? (
                  <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Design saved!
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">
                    High-contrast dark-on-light colors scan most reliably.
                  </span>
                )}
                <Button
                  type="button"
                  onClick={handleSaveDesign}
                  disabled={savingDesign || !designLoaded}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {savingDesign && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Design
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right / Side Panel: Live Preview & Quick Actions */}
      <div className="lg:col-span-5 space-y-6">
        {/* Live Preview Card */}
        <Card className="border-neutral-200 shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50">
            <CardTitle className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Live QR Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <div className="p-3 bg-white border border-neutral-200 rounded-2xl shadow-xs">
              <QrPreview content={previewContent} design={design} size={220} />
            </div>

            {/* Short URL Box */}
            <div className="w-full flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Dynamic Short URL</p>
                <p className="font-mono text-xs text-neutral-800 truncate">{publicUrl}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={copyShortLink}
                className="h-8 gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            {/* Download and Share CTAs */}
            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <Button
                type="button"
                onClick={() => setDownloadOpen(true)}
                className="gap-2 bg-neutral-900 hover:bg-neutral-800 text-white w-full"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Link href={`/q/${qr.shortCode}`} target="_blank" className="w-full">
                <Button variant="outline" className="gap-2 w-full">
                  <ExternalLink className="w-4 h-4" />
                  Test Scan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights Card */}
        <Card className="border-neutral-200 shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Scan Telemetry
            </CardTitle>
            <Link href={`/dashboard/qr/${qr.id}/analytics`}>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2">
                Detailed View →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <div>
                <p className="text-xs font-medium text-emerald-900">Total Recorded Scans</p>
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {qr.scanCount?.toLocaleString() ?? 0}
                </p>
              </div>
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-none text-xs">
                {qr.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <DownloadQrDialog
        qr={downloadOpen ? qr : null}
        design={design}
        onOpenChange={(next) => !next && setDownloadOpen(false)}
      />
    </div>
  );
}
