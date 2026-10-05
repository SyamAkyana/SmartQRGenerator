"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, Loader2, Link2, Info } from "lucide-react";
import type { StoredFileRecord } from "@/lib/file/service";

interface QrTypeFieldsProps {
  type: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function QrTypeFields({ type, data, onChange }: QrTypeFieldsProps) {
  const [existingFiles, setExistingFiles] = useState<StoredFileRecord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user files when type is FILE
  useEffect(() => {
    if (type === "FILE") {
      setLoadingFiles(true);
      fetch("/api/file")
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && Array.isArray(resData.data?.files)) {
            setExistingFiles(resData.data.files);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingFiles(false));
    }
  }, [type]);

  const updateField = (key: string, val: any) => {
    onChange({ ...data, [key]: val });
  };

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const res = await fetch("/api/file", {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();

      if (resData.success && resData.data?.file) {
        const newFile = resData.data.file;
        setExistingFiles((prev) => [newFile, ...prev]);
        onChange({
          ...data,
          fileId: newFile.id,
          fileName: newFile.originalName,
          sizeBytes: newFile.sizeBytes,
          mimeType: newFile.mimeType,
        });
      } else {
        setUploadError(resData.error?.message ?? "Upload failed");
      }
    } catch {
      setUploadError("Network error while uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  switch (type) {
    case "URL":
      return (
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium text-neutral-700 flex items-center justify-between">
            <span>Destination Website URL</span>
            <span className="text-xs text-neutral-400">Optional</span>
          </label>
          <Input
            id="url"
            name="url"
            type="url"
            value={data.url ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("url", e.target.value)}
            placeholder="https://example.com/promo"
          />
          <p className="text-xs text-neutral-500">
            Scanners will automatically be redirected to this URL upon scanning.
          </p>
        </div>
      );

    case "PHONE":
      return (
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-neutral-700 flex items-center justify-between">
            <span>Phone Number</span>
            <span className="text-xs text-neutral-400">Optional</span>
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={data.phone ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("phone", e.target.value)}
            placeholder="+1 555-123-4567"
          />
          <p className="text-xs text-neutral-500">
            Scanners will instantly open their dialer with this phone number pre-filled.
          </p>
        </div>
      );

    case "EMAIL":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700 flex items-center justify-between">
              <span>Recipient Email</span>
              <span className="text-xs text-neutral-400">Optional</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={data.email ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("email", e.target.value)}
              placeholder="contact@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-sm font-medium text-neutral-700">
              Subject Line <span className="text-xs font-normal text-neutral-400">(Optional)</span>
            </label>
            <Input
              id="subject"
              name="subject"
              value={data.subject ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("subject", e.target.value)}
              placeholder="Inquiry from QR Code"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="body" className="text-sm font-medium text-neutral-700">
              Message Body <span className="text-xs font-normal text-neutral-400">(Optional)</span>
            </label>
            <Textarea
              id="body"
              name="body"
              value={data.body ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField("body", e.target.value)}
              placeholder="Hi there, I scanned your QR code and would like more information."
              rows={3}
            />
          </div>
        </div>
      );

    case "WHATSAPP":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="wa-phone" className="text-sm font-medium text-neutral-700 flex items-center justify-between">
              <span>WhatsApp Number (with country code)</span>
              <span className="text-xs text-neutral-400">Optional</span>
            </label>
            <Input
              id="wa-phone"
              name="phone"
              type="tel"
              value={data.phone ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("phone", e.target.value)}
              placeholder="15551234567"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="wa-message" className="text-sm font-medium text-neutral-700">
              Pre-filled Message <span className="text-xs font-normal text-neutral-400">(Optional)</span>
            </label>
            <Textarea
              id="wa-message"
              name="message"
              value={data.message ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField("message", e.target.value)}
              placeholder="Hello! I would like to learn more about your services."
              rows={2}
            />
          </div>
        </div>
      );

    case "MAP":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="location" className="text-sm font-medium text-neutral-700">
              Location Address or Place Name
            </label>
            <Input
              id="location"
              name="location"
              value={data.location ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("location", e.target.value)}
              placeholder="Times Square, New York, NY"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="latitude" className="text-xs font-medium text-neutral-600">
                Latitude (Optional)
              </label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={data.latitude ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("latitude", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="40.7580"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="longitude" className="text-xs font-medium text-neutral-600">
                Longitude (Optional)
              </label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={data.longitude ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("longitude", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="-73.9855"
              />
            </div>
          </div>
        </div>
      );

    case "WIFI":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="ssid" className="text-sm font-medium text-neutral-700 flex items-center justify-between">
              <span>Network SSID (Name)</span>
              <span className="text-xs text-neutral-400">Optional</span>
            </label>
            <Input
              id="ssid"
              name="ssid"
              value={data.ssid ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("ssid", e.target.value)}
              placeholder="Office_Guest_WiFi"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wifi-password" className="text-sm font-medium text-neutral-700">
                Password
              </label>
              <Input
                id="wifi-password"
                name="password"
                type="text"
                value={data.password ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("password", e.target.value)}
                placeholder="SecretPass123"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="authType" className="text-sm font-medium text-neutral-700">
                Security Type
              </label>
              <Select
                value={data.authType ?? "WPA"}
                onValueChange={(val) => updateField("authType", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="WPA/WPA2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">None (Open)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="hidden"
              name="hidden"
              checked={Boolean(data.hidden)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("hidden", e.target.checked)}
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="hidden" className="text-xs text-neutral-600">
              Hidden Network (SSID is not broadcasted)
            </label>
          </div>
        </div>
      );

    case "CONTACT":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-sm font-medium text-neutral-700">
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                value={data.firstName ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("firstName", e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-medium text-neutral-700">
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                value={data.lastName ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("lastName", e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="contact-phone" className="text-sm font-medium text-neutral-700">
                Phone
              </label>
              <Input
                id="contact-phone"
                name="phone"
                type="tel"
                value={data.phone ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("phone", e.target.value)}
                placeholder="+1 555-0199"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="text-sm font-medium text-neutral-700">
                Email
              </label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                value={data.email ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("email", e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="organization" className="text-sm font-medium text-neutral-700">
                Company / Org
              </label>
              <Input
                id="organization"
                name="organization"
                value={data.organization ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("organization", e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jobTitle" className="text-sm font-medium text-neutral-700">
                Job Title
              </label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={data.jobTitle ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("jobTitle", e.target.value)}
                placeholder="Product Director"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="website" className="text-sm font-medium text-neutral-700">
              Website
            </label>
            <Input
              id="website"
              name="website"
              type="url"
              value={data.website ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("website", e.target.value)}
              placeholder="https://janedoe.me"
            />
          </div>
        </div>
      );

    case "TEXT":
      return (
        <div className="space-y-2">
          <label htmlFor="text" className="text-sm font-medium text-neutral-700 flex items-center justify-between">
            <span>Plain Text Note</span>
            <span className="text-xs text-neutral-400">Optional</span>
          </label>
          <Textarea
            id="text"
            name="text"
            value={data.text ?? ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField("text", e.target.value)}
            placeholder="Type your message, notes, coupon codes, or instructions here..."
            rows={4}
          />
        </div>
      );

    case "FILE":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 flex items-center justify-between">
              <span>Attach Hosted File</span>
              <span className="text-xs text-neutral-400">Max 10 MB</span>
            </label>

            {data.fileId ? (
              <div className="flex items-center justify-between p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <FileText className="w-5 h-5 text-cyan-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {data.fileName ?? "Selected File"}
                    </p>
                    {data.sizeBytes && (
                      <p className="text-xs text-neutral-500">
                        {(data.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange({
                      ...data,
                      fileId: undefined,
                      fileName: undefined,
                      sizeBytes: undefined,
                      mimeType: undefined,
                    })
                  }
                  className="text-xs text-neutral-600 hover:text-red-600 h-7 px-2"
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="border border-dashed border-neutral-300 rounded-lg p-4 text-center hover:bg-neutral-50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.docx,.xlsx,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-neutral-400" />
                    <div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5"
                      >
                        {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {uploading ? "Uploading File…" : "Upload New File"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      PDF, Images, Word, Excel, PowerPoint (max 10MB)
                    </p>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-xs text-red-600">{uploadError}</p>
                )}

                {/* Or pick from existing uploaded files */}
                {existingFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-neutral-600">
                      Or select from previously uploaded files:
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 border border-neutral-200 rounded-lg p-1">
                      {existingFiles.map((file) => (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...data,
                              fileId: file.id,
                              fileName: file.originalName,
                              sizeBytes: file.sizeBytes,
                              mimeType: file.mimeType,
                            })
                          }
                          className="w-full flex items-center justify-between p-2 rounded-md hover:bg-neutral-100 text-left text-xs transition-colors"
                        >
                          <span className="truncate text-neutral-800 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            {file.originalName}
                          </span>
                          <span className="text-neutral-400 text-[10px] shrink-0 ml-2">
                            {(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );

    case "MULTI_LINK":
      return (
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
            <Link2 className="w-4 h-4 text-indigo-600" />
            <span>Interactive Multi-Link Landing Page</span>
          </div>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Create a custom mobile landing page (like Linktree) to showcase multiple links, social media profiles, and documents under a single dynamic QR code. You can customize the links and design directly in the workspace editor.
          </p>
        </div>
      );

    default:
      return null;
  }
}
