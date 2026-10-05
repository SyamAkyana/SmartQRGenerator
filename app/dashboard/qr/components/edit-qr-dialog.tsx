"use client";

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
import { Input } from "@/components/ui/input";
import { Loader2, Palette, Info, Download } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import { getQrContent } from "@/lib/qr/generate";
import { QrPreview, type DesignOptions } from "./qr-preview";
import { DesignPicker } from "./design-picker";
import { DownloadQrDialog } from "./download-qr-dialog";
import { QrTypeFields } from "./qr-type-fields";
import { cn } from "@/lib/utils";

interface EditQrDialogProps {
  qr: QRCodeRecord | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (qr: QRCodeRecord) => void;
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

function TabButton({
  active,
  onClick,
  icon,
  label,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
        active
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "text-neutral-600 border-transparent hover:bg-neutral-100"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function EditQrDialog({ qr, onOpenChange, onSuccess }: EditQrDialogProps) {
  const [tab, setTab] = useState<"details" | "design">("details");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(qr?.name ?? "");
  const [qrData, setQrData] = useState<Record<string, any>>({});
  const [design, setDesign] = useState<DesignOptions>(DEFAULT_DESIGN);
  const [designSaved, setDesignSaved] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [designLoaded, setDesignLoaded] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const open = qr !== null;

  useEffect(() => {
    if (!qr) {
      setName("");
      setQrData({});
      setDesign(DEFAULT_DESIGN);
      setDesignSaved(false);
      setDesignError(null);
      setDetailsError(null);
      setDesignLoaded(false);
      return;
    }

    setName(qr.name);
    setQrData((qr.data as Record<string, any>) || {});

    let cancelled = false;
    setDesignLoaded(false);
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
  }, [qr?.id]);

  async function saveDetails() {
    if (!qr) return;
    setPending(true);
    setDetailsError(null);
    try {
      const res = await fetch(`/api/qr/${qr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data: qrData }),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        onSuccess(resData.data.qr ?? resData.data);
        onOpenChange(false);
      } else {
        setDetailsError(resData.error?.message ?? "Failed to save details");
      }
    } catch {
      setDetailsError("Network error while updating QR code");
    } finally {
      setPending(false);
    }
  }

  async function handleSaveDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await saveDetails();
  }

  async function handleSaveDesign() {
    if (!qr) return;
    setPending(true);
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
      setPending(false);
    }
  }

  const previewContent = qr ? getQrContent(qr) : "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-neutral-900">Edit QR Code</DialogTitle>
            <DialogDescription className="text-sm text-neutral-500">
              Update destination details or customize the QR code visual design.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-1 border-b border-neutral-200 pb-3">
            <TabButton
              active={tab === "details"}
              onClick={() => setTab("details")}
              icon={<Info className="w-4 h-4" />}
              label="Destination Details"
            />
            <TabButton
              active={tab === "design"}
              onClick={() => setTab("design")}
              icon={<Palette className="w-4 h-4" />}
              label="Visual Design"
              testId="design-tab"
            />
          </div>

          <div className="overflow-y-auto pr-1 flex-1 py-2">
            {tab === "details" ? (
              <form id="edit-qr-form" onSubmit={handleSaveDetails} className="space-y-4">
                {detailsError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {detailsError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="edit-name" className="text-sm font-medium text-neutral-700">
                    Name
                  </label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My QR Code"
                    required
                    maxLength={255}
                  />
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-500 flex items-center justify-between">
                  <span>Type: <strong className="text-neutral-800">{qr?.type}</strong></span>
                  <span>Short Code: <strong className="font-mono text-neutral-800">{qr?.shortCode}</strong></span>
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  {qr && <QrTypeFields type={qr.type} data={qrData} onChange={setQrData} />}
                </div>
              </form>
            ) : (
              <div className="grid gap-6 py-2 md:grid-cols-[220px_1fr]">
                <div className="flex flex-col items-center gap-3">
                  <QrPreview content={previewContent} design={design} size={180} />
                  <p className="text-xs text-neutral-400 text-center max-w-[180px]">
                    Live preview of your customized QR code.
                  </p>
                </div>
                <div className="max-h-[360px] overflow-y-auto pr-1">
                  {designLoaded ? (
                    <DesignPicker design={design} onChange={setDesign} />
                  ) : (
                    <p className="text-sm text-neutral-400" data-testid="design-loading">
                      Loading design…
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-neutral-100 flex justify-between sm:justify-between items-center mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {tab === "details" ? (
              <Button type="submit" form="edit-qr-form" disabled={pending} className="gap-2 bg-blue-600 hover:bg-blue-700">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {designError && (
                  <p className="text-xs text-red-600 max-w-[180px]" data-testid="design-save-error">
                    {designError}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  data-testid="edit-download-btn"
                  onClick={() => setDownloadOpen(true)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveDesign}
                  disabled={pending || !designLoaded}
                  data-testid="save-design-btn"
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : designSaved ? (
                    "Saved ✓"
                  ) : (
                    "Save Design"
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DownloadQrDialog
        qr={downloadOpen ? qr : null}
        design={design}
        onOpenChange={(next) => !next && setDownloadOpen(false)}
      />
    </>
  );
}
