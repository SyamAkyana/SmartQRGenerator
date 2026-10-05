"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Palette, Info, Sparkles } from "lucide-react";
import { createQrAction } from "@/app/actions/qr";
import type { QRCodeRecord } from "@/lib/qr/service";
import { QrTypeFields } from "./qr-type-fields";
import { QrPreview, type DesignOptions } from "./qr-preview";
import { DesignPicker } from "./design-picker";
import {
  formatUrlPayload,
  formatWifiPayload,
  formatVCardPayload,
  formatPhonePayload,
  formatEmailPayload,
  formatTextPayload,
} from "@/lib/qr/static-payloads";
import { cn } from "@/lib/utils";

const QR_TYPES = [
  { value: "URL", label: "Website URL" },
  { value: "FILE", label: "Document / File" },
  { value: "MULTI_LINK", label: "Multi-Link Landing Page" },
  { value: "WIFI", label: "Wi-Fi Network" },
  { value: "PHONE", label: "Phone Call" },
  { value: "EMAIL", label: "Send Email" },
  { value: "WHATSAPP", label: "WhatsApp Message" },
  { value: "CONTACT", label: "Contact Card (vCard)" },
  { value: "MAP", label: "Map Location" },
  { value: "TEXT", label: "Plain Text" },
];

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

interface CreateQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (qr: QRCodeRecord) => void;
}

function getDraftPayload(type: string, data: Record<string, any>): string {
  switch (type) {
    case "URL":
      return formatUrlPayload(data.url || "") || "https://example.com";
    case "WIFI":
      return (
        formatWifiPayload({
          ssid: data.ssid || "GuestWiFi",
          password: data.password || "",
          encryption: data.authType || "WPA",
          hidden: Boolean(data.hidden),
        }) || "WIFI:S:GuestWiFi;T:WPA;;"
      );
    case "CONTACT":
      return (
        formatVCardPayload({
          firstName: data.firstName || "John",
          lastName: data.lastName || "Doe",
          phone: data.phone || "+1234567890",
          email: data.email || "john@example.com",
          organization: data.organization,
          title: data.jobTitle,
          website: data.website,
          address: data.city || data.street,
        }) || "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD"
      );
    case "PHONE":
      return formatPhonePayload(data.phone || "+1234567890") || "tel:+1234567890";
    case "EMAIL":
      return (
        formatEmailPayload({
          email: data.email || "hello@example.com",
          subject: data.subject,
          body: data.body,
        }) || "mailto:hello@example.com"
      );
    case "WHATSAPP":
      return data.phone
        ? `https://wa.me/${String(data.phone).replace(/\D/g, "")}`
        : "https://wa.me/1234567890";
    case "TEXT":
      return formatTextPayload(data.text || "Hello from SmartQR") || "Hello from SmartQR";
    case "MAP":
      return data.location
        ? `geo:0,0?q=${encodeURIComponent(data.location)}`
        : "geo:0,0?q=New York";
    default:
      return "https://smartqr.example";
  }
}

export function CreateQrDialog({ open, onOpenChange, onSuccess }: CreateQrDialogProps) {
  const [tab, setTab] = useState<"details" | "design">("details");
  const [name, setName] = useState("");
  const [type, setType] = useState("URL");
  const [qrData, setQrData] = useState<Record<string, any>>({});
  const [design, setDesign] = useState<DesignOptions>(DEFAULT_DESIGN);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setQrData({});
  };

  const draftPayload = getDraftPayload(type, qrData);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type);
    formData.append("data", JSON.stringify(qrData));
    formData.append(
      "design",
      JSON.stringify({
        foregroundColor: design.foregroundColor,
        backgroundColor: design.backgroundColor,
        dotStyle: design.dotStyle,
        cornerStyle: design.cornerStyle,
        eyeStyle: design.eyeStyle,
        frameStyle: design.frameStyle ?? "none",
        frameText: design.frameText?.trim() ? design.frameText.trim() : null,
        logoFileId: design.logoFileId ?? null,
        errorCorrectionLevel: design.errorCorrectionLevel,
      })
    );

    // Also append standard fields for fallback
    Object.entries(qrData).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    });

    const result = await createQrAction(null, formData);

    if (result.success) {
      const qr = (result.data as { qr: QRCodeRecord }).qr;
      onSuccess(qr);
      onOpenChange(false);
      setName("");
      setType("URL");
      setQrData({});
      setDesign(DEFAULT_DESIGN);
      setTab("details");
    } else {
      setError(result.error ?? "Something went wrong");
    }
    setPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-900 flex items-center justify-between">
            <span>Create New QR Code</span>
            <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Dynamic & Customizable
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            Set up your destination and customize colors, logos, and frame styles.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-neutral-200 pb-3">
          <button
            type="button"
            data-testid="create-details-tab"
            onClick={() => setTab("details")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
              tab === "details"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "text-neutral-600 border-transparent hover:bg-neutral-100"
            )}
          >
            <Info className="w-4 h-4" />
            Destination Details
          </button>
          <button
            type="button"
            data-testid="create-design-tab"
            onClick={() => setTab("design")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
              tab === "design"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "text-neutral-600 border-transparent hover:bg-neutral-100"
            )}
          >
            <Palette className="w-4 h-4" />
            Visual Design
            {design.logoFileId && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>
        </div>

        <form id="create-qr-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {error && (
            <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="overflow-y-auto pr-1 flex-1 py-2">
            {tab === "details" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="create-name" className="text-sm font-medium text-neutral-700">
                    Campaign / QR Name
                  </label>
                  <Input
                    id="create-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer Marketing Campaign"
                    required
                    maxLength={255}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="create-type" className="text-sm font-medium text-neutral-700">
                    Destination Type
                  </label>
                  <Select value={type} onValueChange={(val) => { if (val) handleTypeChange(val); }}>
                    <SelectTrigger id="create-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {QR_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <QrTypeFields type={type} data={qrData} onChange={setQrData} />
                </div>
              </div>
            ) : (
              <div className="grid gap-6 py-2 md:grid-cols-[220px_1fr]">
                <div className="flex flex-col items-center gap-3">
                  <QrPreview content={draftPayload} design={design} size={180} />
                  <p className="text-xs text-neutral-400 text-center max-w-[180px]">
                    Live design preview updated instantly.
                  </p>
                </div>
                <div className="max-h-[360px] overflow-y-auto pr-1">
                  <DesignPicker design={design} onChange={setDesign} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-neutral-100 flex justify-between sm:justify-between items-center mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (tab === "design") {
                  setTab("details");
                } else {
                  onOpenChange(false);
                }
              }}
            >
              {tab === "design" ? "Back to Details" : "Cancel"}
            </Button>

            <div className="flex items-center gap-2">
              {tab === "details" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTab("design")}
                  className="gap-1.5"
                >
                  <Palette className="w-4 h-4 text-blue-600" />
                  Customize Design
                </Button>
              )}
              <Button
                type="submit"
                disabled={pending}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create QR Code
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
