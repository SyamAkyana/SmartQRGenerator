// lib/qr/contrast.ts
// Contrast calculation and scannability checker for QR codes (Spec §20).

/** Parse a 6-character hex color string into [r, g, b] (0-255). */
function parseHexColor(hex: string): [number, number, number] | null {
  const match = hex.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

/** Calculate sRGB relative luminance according to WCAG 2.1 formula. */
export function getRelativeLuminance(hex: string): number {
  const rgb = parseHexColor(hex);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    const srgb = val / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Calculate contrast ratio between two hex colors (range: 1.0 to 21.0). */
export function getContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = getRelativeLuminance(fgHex);
  const l2 = getRelativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

export interface ContrastCheckResult {
  ratio: number;
  isScannable: boolean;
  isInverted: boolean;
  warning?: string;
}

/**
 * Check whether a foreground and background color combination is scannable for QR codes.
 * Standard QR scanners require sufficient contrast (ratio >= 3.0:1) and prefer dark modules on light background.
 */
export function checkQrContrast(foregroundColor: string, backgroundColor: string): ContrastCheckResult {
  const ratio = getContrastRatio(foregroundColor, backgroundColor);
  const fgLum = getRelativeLuminance(foregroundColor);
  const bgLum = getRelativeLuminance(backgroundColor);
  const isInverted = fgLum > bgLum;

  if (ratio < 2.5) {
    return {
      ratio,
      isScannable: false,
      isInverted,
      warning: "Critically low contrast. Most QR scanners will fail to read this code.",
    };
  }

  if (ratio < 4.0) {
    return {
      ratio,
      isScannable: true,
      isInverted,
      warning: "Moderate contrast. Some camera scanners in low light may have difficulty scanning.",
    };
  }

  if (isInverted) {
    return {
      ratio,
      isScannable: true,
      isInverted: true,
      warning: "Light QR code on dark background. Works with most modern scanners, but traditional scanners prefer dark-on-light.",
    };
  }

  return {
    ratio,
    isScannable: true,
    isInverted: false,
  };
}
