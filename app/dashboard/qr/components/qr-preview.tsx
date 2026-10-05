"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import type { DotType, CornerSquareType, CornerDotType } from "qr-code-styling";
import { getBuiltinIconDataUri, isBuiltinIcon } from "@/lib/qr/icons";

export interface DesignOptions {
  foregroundColor: string;
  backgroundColor: string;
  dotStyle: string;
  cornerStyle: string;
  eyeStyle: string;
  frameStyle?: string;
  frameText?: string | null;
  logoFileId?: string | null;
  errorCorrectionLevel: string;
}

interface QrPreviewProps {
  content: string;
  design: DesignOptions;
  size?: number;
}

/** Map user-facing labels to qr-code-styling enum values. */
export function toDotStyle(s: string): DotType {
  const map: Record<string, DotType> = {
    square: "square",
    circle: "rounded",
    diamond: "dots",
    fluid: "rounded",
    star: "rounded",
  };
  return map[s] ?? "square";
}

export function toCornerStyle(s: string): CornerSquareType {
  const map: Record<string, CornerSquareType> = {
    square: "square",
    circle: "dot",
    "extra-rounded": "extra-rounded",
  };
  return map[s] ?? "square";
}

export function toEyeStyle(s: string): CornerDotType {
  const map: Record<string, CornerDotType> = {
    square: "square",
    circle: "dot",
    asteroid: "dot",
  };
  return map[s] ?? "square";
}

export function logoImageUrl(logoFileId?: string | null): string | undefined {
  if (!logoFileId) return undefined;
  if (isBuiltinIcon(logoFileId)) {
    return getBuiltinIconDataUri(logoFileId);
  }
  return `/api/file/${logoFileId}`;
}

export function QrPreview({ content, design, size = 200 }: QrPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const effectiveContent = content?.trim() ? content : "https://smartqr.example";
  const logoSrc = logoImageUrl(design?.logoFileId);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg",
      data: effectiveContent,
      margin: 8,
      qrOptions: {
        errorCorrectionLevel: (design?.errorCorrectionLevel as "L" | "M" | "Q" | "H") || (logoSrc ? "H" : "M"),
      },
      dotsOptions: {
        color: design?.foregroundColor || "#000000",
        type: toDotStyle(design?.dotStyle || "square"),
      },
      backgroundOptions: { color: design?.backgroundColor || "#ffffff" },
      cornersSquareOptions: {
        color: design?.foregroundColor || "#000000",
        type: toCornerStyle(design?.cornerStyle || "square"),
      },
      cornersDotOptions: {
        color: design?.foregroundColor || "#000000",
        type: toEyeStyle(design?.eyeStyle || "square"),
      },
      ...(logoSrc
        ? {
            image: logoSrc,
            imageOptions: {
              hideBackgroundDots: true,
              imageSize: 0.28,
              margin: 4,
            },
          }
        : {}),
    });

    container.innerHTML = "";
    qr.append(container);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [
    effectiveContent,
    design?.foregroundColor,
    design?.backgroundColor,
    design?.dotStyle,
    design?.cornerStyle,
    design?.eyeStyle,
    design?.logoFileId,
    design?.errorCorrectionLevel,
    logoSrc,
    size,
  ]);

  const hasFrame = design?.frameStyle && design.frameStyle !== "none";
  const frameText = design?.frameText?.trim();

  return (
    <div
      className={`flex flex-col items-center justify-center transition-all ${
        hasFrame
          ? "p-4 border-2 shadow-sm " +
            (design.frameStyle === "rounded"
              ? "rounded-2xl"
              : design.frameStyle === "banner"
                ? "rounded-lg border-t-8"
                : "rounded-lg")
          : "rounded-xl"
      }`}
      style={{
        backgroundColor: design?.backgroundColor || "#ffffff",
        borderColor: design?.foregroundColor || "#000000",
      }}
    >
      {hasFrame && frameText && (
        <div
          className="mb-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
          style={{
            backgroundColor: design?.foregroundColor || "#000000",
            color: design?.backgroundColor || "#ffffff",
          }}
        >
          {frameText}
        </div>
      )}

      <div
        ref={ref}
        className="flex items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}
