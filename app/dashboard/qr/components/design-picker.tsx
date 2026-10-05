"use client";

import { useMemo, useRef, useState } from "react";
import type { DesignOptions } from "./qr-preview";
import { checkQrContrast } from "@/lib/qr/contrast";
import { BUILTIN_ICONS, isBuiltinIcon, getBuiltinIconById } from "@/lib/qr/icons";
import { DESIGNER_PRESETS, type DesignerPreset } from "@/lib/qr/presets";
import {
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  Image as ImageIcon,
  Palette,
  Shapes,
  ShieldCheck,
  Check,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOT_STYLES = [
  { value: "square", label: "Square", swatch: "bg-neutral-900" },
  { value: "circle", label: "Circle", swatch: "bg-neutral-900 rounded-full" },
  { value: "diamond", label: "Diamond", swatch: "bg-neutral-900 rotate-45 w-3 h-3" },
  { value: "fluid", label: "Fluid", swatch: "bg-neutral-900 rounded-md" },
  { value: "star", label: "Star", swatch: "bg-neutral-900 rounded-xs" },
];

const CORNER_STYLES = [
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "extra-rounded", label: "Rounded" },
];

const EYE_STYLES = [
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "asteroid", label: "Asteroid" },
];

const FRAME_STYLES = [
  { value: "none", label: "None" },
  { value: "box", label: "Simple Box" },
  { value: "rounded", label: "Rounded Border" },
  { value: "banner", label: "Top Banner" },
];

const EC_LEVELS = [
  { value: "L", label: "L — 7%", desc: "Low recovery, compact matrix" },
  { value: "M", label: "M — 15%", desc: "Standard for general digital codes" },
  { value: "Q", label: "Q — 25%", desc: "Recommended for printed media" },
  { value: "H", label: "H — 30%", desc: "Max recovery (Required for Logo QRs)" },
];

const QUICK_COLORS = [
  { hex: "#000000", label: "Classic Black" },
  { hex: "#2563eb", label: "Royal Blue" },
  { hex: "#4f46e5", label: "Modern Indigo" },
  { hex: "#7c3aed", label: "Velvet Purple" },
  { hex: "#059669", label: "Emerald Green" },
  { hex: "#e11d48", label: "Sunset Rose" },
  { hex: "#d97706", label: "Warm Amber" },
  { hex: "#0f172a", label: "Cyber Slate" },
];

interface DesignPickerProps {
  design: DesignOptions;
  onChange: (design: DesignOptions) => void;
}

export function DesignPicker({ design, onChange }: DesignPickerProps) {
  const set = (patch: Partial<DesignOptions>) => onChange({ ...design, ...patch });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const contrast = useMemo(() => {
    return checkQrContrast(design.foregroundColor || "#000000", design.backgroundColor || "#ffffff");
  }, [design.foregroundColor, design.backgroundColor]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      const res = await fetch("/api/file", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success || !data.data?.file?.id) {
        setLogoError(data.error?.message ?? "Logo upload failed");
        return;
      }
      set({
        logoFileId: data.data.file.id,
        errorCorrectionLevel: "H", // Auto-upgrade to high EC for logo scannability
      });
    } catch {
      setLogoError("Logo upload failed. Please try again.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSelectBuiltinIcon(iconId: string) {
    if (design.logoFileId === iconId) {
      set({ logoFileId: null });
      return;
    }
    set({
      logoFileId: iconId,
      errorCorrectionLevel: "H", // Auto-upgrade to high EC for logo scannability
    });
  }

  function applyPreset(preset: DesignerPreset) {
    set({
      foregroundColor: preset.design.foregroundColor,
      backgroundColor: preset.design.backgroundColor,
      dotStyle: preset.design.dotStyle,
      cornerStyle: preset.design.cornerStyle,
      eyeStyle: preset.design.eyeStyle,
      frameStyle: preset.design.frameStyle,
      frameText: preset.design.frameText ?? null,
    });
  }

  const activeBuiltinIcon = isBuiltinIcon(design.logoFileId)
    ? getBuiltinIconById(design.logoFileId)
    : null;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* CARD 1: 1-CLICK BRAND ICONS & CUSTOM LOGO                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Logo & Center Branding
            </h3>
          </div>
          {design.logoFileId && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              <ShieldCheck className="w-3 h-3 text-blue-600" /> EC-H Shield Active
            </span>
          )}
        </div>

        {/* Selected Logo Card & Upload Button */}
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {design.logoFileId ? (
              <div className="relative w-11 h-11 rounded-lg border border-neutral-200 overflow-hidden bg-white p-1 shadow-2xs flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeBuiltinIcon ? activeBuiltinIcon.dataUri : `/api/file/${design.logoFileId}`}
                  alt="Embedded Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg border-2 border-dashed border-neutral-300 bg-white flex items-center justify-center text-neutral-400">
                <ImageIcon className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-neutral-900">
                {activeBuiltinIcon
                  ? `${activeBuiltinIcon.name}`
                  : design.logoFileId
                  ? "Custom Logo Uploaded"
                  : "No Logo Selected"}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {design.logoFileId
                  ? "Auto-centered with 30% Reed-Solomon data recovery."
                  : "Select a brand icon below or upload your PNG/SVG logo."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="logo-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {uploadingLogo ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-neutral-500" />
                  {design.logoFileId ? "Replace" : "Upload"}
                </>
              )}
            </button>

            {design.logoFileId && (
              <button
                type="button"
                onClick={() => set({ logoFileId: null })}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-red-600 hover:border-red-200 transition-colors"
                title="Remove logo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        {logoError && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
            {logoError}
          </p>
        )}

        {/* 1-Click Brand Icons Library */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wide">
              1-Click Brand Icons
            </label>
            <span className="text-[11px] text-neutral-400">18 ready-to-use vector icons</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {BUILTIN_ICONS.map((icon) => {
              const isSelected = design.logoFileId === icon.id;
              return (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => handleSelectBuiltinIcon(icon.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all group",
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/70"
                  )}
                  title={icon.name}
                >
                  <div className="w-6 h-6 relative flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icon.dataUri} alt={icon.name} className="w-5 h-5 object-contain" />
                  </div>
                  <span className="text-[10px] font-medium text-neutral-700 truncate w-full text-center mt-1">
                    {icon.name}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CARD 2: 1-CLICK DESIGNER PRESETS                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            1-Click Designer Themes
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DESIGNER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group"
            >
              <div
                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-[10px] shadow-2xs"
                style={{ backgroundColor: preset.previewColor }}
              >
                QR
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                  {preset.name}
                </p>
                <p className="text-[10px] text-neutral-500 truncate">{preset.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CARD 3: COLORS & CTA FRAME                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Colors & Call-to-Action Frame
          </h3>
        </div>

        {/* Quick Color Swatches */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wide">
            Quick Palette Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => set({ foregroundColor: c.hex, backgroundColor: "#ffffff" })}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all",
                  design.foregroundColor?.toLowerCase() === c.hex.toLowerCase()
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Hex Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Foreground Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(design.foregroundColor) ? design.foregroundColor : "#000000"}
                onChange={(e) => set({ foregroundColor: e.target.value })}
                className="w-9 h-9 rounded-lg cursor-pointer border border-neutral-200 p-0.5"
                aria-label="Foreground color"
              />
              <input
                type="text"
                value={design.foregroundColor || "#000000"}
                onChange={(e) => set({ foregroundColor: e.target.value })}
                aria-label="Foreground color hex"
                spellCheck={false}
                maxLength={7}
                className="w-28 px-2.5 py-1.5 font-mono text-xs text-neutral-700 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(design.backgroundColor) ? design.backgroundColor : "#ffffff"}
                onChange={(e) => set({ backgroundColor: e.target.value })}
                className="w-9 h-9 rounded-lg cursor-pointer border border-neutral-200 p-0.5"
                aria-label="Background color"
              />
              <input
                type="text"
                value={design.backgroundColor || "#ffffff"}
                onChange={(e) => set({ backgroundColor: e.target.value })}
                aria-label="Background color hex"
                spellCheck={false}
                maxLength={7}
                className="w-28 px-2.5 py-1.5 font-mono text-xs text-neutral-700 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Scannability & Contrast Gauge */}
        {contrast.warning && (
          <div
            data-testid="contrast-warning"
            className={`flex items-start gap-2 p-3 rounded-lg text-xs border ${
              !contrast.isScannable
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                Contrast ratio: {contrast.ratio}:1 — {contrast.isScannable ? "Warning" : "Critically low contrast"}
              </p>
              <p className="mt-0.5 text-neutral-600">{contrast.warning}</p>
            </div>
          </div>
        )}

        {/* CTA Frame Style */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <label className="text-xs font-medium text-neutral-700">Call-To-Action Frame</label>
          <div className="flex flex-wrap gap-2">
            {FRAME_STYLES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => set({ frameStyle: f.value })}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  (design.frameStyle || "none") === f.value
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frame Text Banner */}
        {design.frameStyle && design.frameStyle !== "none" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Frame Banner Text</label>
            <input
              type="text"
              value={design.frameText ?? ""}
              onChange={(e) => set({ frameText: e.target.value })}
              placeholder="e.g. SCAN ME"
              maxLength={30}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CARD 4: SHAPES & MATRIX GEOMETRY                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Shapes className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Shapes & Matrix Geometry
          </h3>
        </div>

        {/* Dot Matrix Style */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-700">Dot Matrix Style</label>
          <div className="flex flex-wrap gap-2">
            {DOT_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                data-testid={`dot-style-${s.value}`}
                onClick={() => set({ dotStyle: s.value })}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                  design.dotStyle === s.value
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                <span className={`w-3.5 h-3.5 ${s.swatch}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corner Square Style */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-700">Corner Square Style</label>
          <div className="flex flex-wrap gap-2">
            {CORNER_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                data-testid={`corner-style-${s.value}`}
                onClick={() => set({ cornerStyle: s.value })}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  design.cornerStyle === s.value
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corner Eye Style */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-700">Corner Eye Style</label>
          <div className="flex flex-wrap gap-2">
            {EYE_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                data-testid={`eye-style-${s.value}`}
                onClick={() => set({ eyeStyle: s.value })}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  design.eyeStyle === s.value
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Correction Level */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <label className="text-xs font-medium text-neutral-700">Error Correction Level</label>
          <div className="grid grid-cols-2 gap-2">
            {EC_LEVELS.map((ec) => (
              <button
                key={ec.value}
                type="button"
                onClick={() => set({ errorCorrectionLevel: ec.value })}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-colors",
                  design.errorCorrectionLevel === ec.value
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                <p className="text-xs font-semibold">{ec.label}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{ec.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
