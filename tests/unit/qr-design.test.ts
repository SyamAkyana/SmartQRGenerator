import { describe, it, expect } from "vitest";
import { checkQrContrast, getContrastRatio, getRelativeLuminance } from "@/lib/qr/contrast";
import { getExportFilename, RESOLUTION_OPTIONS } from "@/lib/qr/export-utils";
import { toDotStyle, toCornerStyle, toEyeStyle, logoImageUrl } from "@/app/dashboard/qr/components/qr-preview";
import { designSchema } from "@/lib/qr/design";

describe("QR Contrast & Scannability Checker (Spec §20)", () => {
  describe("getRelativeLuminance", () => {
    it("returns ~0 for pure black", () => {
      expect(getRelativeLuminance("#000000")).toBeCloseTo(0, 3);
    });

    it("returns 1 for pure white", () => {
      expect(getRelativeLuminance("#ffffff")).toBeCloseTo(1, 3);
    });

    it("handles hex with or without hash prefix", () => {
      expect(getRelativeLuminance("ffffff")).toBeCloseTo(1, 3);
      expect(getRelativeLuminance("#ffffff")).toBeCloseTo(1, 3);
    });

    it("returns 0 for invalid hex values", () => {
      expect(getRelativeLuminance("invalid")).toBe(0);
      expect(getRelativeLuminance("")).toBe(0);
    });
  });

  describe("getContrastRatio", () => {
    it("calculates 21:1 for black and white", () => {
      expect(getContrastRatio("#000000", "#ffffff")).toBe(21);
      expect(getContrastRatio("#ffffff", "#000000")).toBe(21);
    });

    it("calculates 1:1 for identical colors", () => {
      expect(getContrastRatio("#123456", "#123456")).toBe(1);
    });
  });

  describe("checkQrContrast", () => {
    it("reports excellent scannability for standard black on white", () => {
      const result = checkQrContrast("#000000", "#ffffff");
      expect(result.ratio).toBe(21);
      expect(result.isScannable).toBe(true);
      expect(result.isInverted).toBe(false);
      expect(result.warning).toBeUndefined();
    });

    it("identifies inverted color schemes (light on dark)", () => {
      const result = checkQrContrast("#ffffff", "#000000");
      expect(result.ratio).toBe(21);
      expect(result.isScannable).toBe(true);
      expect(result.isInverted).toBe(true);
      expect(result.warning).toContain("Light QR code on dark background");
    });

    it("flags critically low contrast as un-scannable", () => {
      const result = checkQrContrast("#111111", "#222222");
      expect(result.ratio).toBeLessThan(2.5);
      expect(result.isScannable).toBe(false);
      expect(result.warning).toContain("Critically low contrast");
    });

    it("flags moderate contrast warning for borderline ratios", () => {
      const result = checkQrContrast("#888888", "#ffffff");
      expect(result.ratio).toBeGreaterThanOrEqual(2.5);
      expect(result.ratio).toBeLessThan(4.0);
      expect(result.isScannable).toBe(true);
      expect(result.warning).toContain("Moderate contrast");
    });
  });
});

describe("QR Export Filename & Resolution Utils (Spec §21)", () => {
  describe("getExportFilename", () => {
    it("sanitizes names and appends format extension", () => {
      expect(getExportFilename("Menu 2026", "png")).toBe("Menu_2026-qr.png");
      expect(getExportFilename("Spring Flyer!", "svg")).toBe("Spring_Flyer-qr.svg");
    });

    it("strips pre-existing file extensions from the base name", () => {
      expect(getExportFilename("document.pdf", "png")).toBe("document-qr.png");
      expect(getExportFilename("banner.png", "svg")).toBe("banner-qr.svg");
    });

    it("provides fallback for empty or whitespace strings", () => {
      expect(getExportFilename("", "png")).toBe("qrcode-qr.png");
      expect(getExportFilename("   ", "svg")).toBe("qrcode-qr.svg");
    });
  });

  describe("RESOLUTION_OPTIONS", () => {
    it("contains standard resolution tiers up to 2048px", () => {
      const values = RESOLUTION_OPTIONS.map((r) => r.value);
      expect(values).toEqual([256, 512, 1024, 2048]);
    });
  });
});

describe("QR Style Mappers", () => {
  describe("toDotStyle", () => {
    it("maps recognized dot styles", () => {
      expect(toDotStyle("square")).toBe("square");
      expect(toDotStyle("circle")).toBe("rounded");
      expect(toDotStyle("diamond")).toBe("dots");
      expect(toDotStyle("fluid")).toBe("rounded");
      expect(toDotStyle("star")).toBe("rounded");
    });

    it("defaults unknown styles to square", () => {
      expect(toDotStyle("unknown")).toBe("square");
    });
  });

  describe("toCornerStyle", () => {
    it("maps recognized corner styles", () => {
      expect(toCornerStyle("square")).toBe("square");
      expect(toCornerStyle("circle")).toBe("dot");
      expect(toCornerStyle("extra-rounded")).toBe("extra-rounded");
    });

    it("defaults unknown corner styles to square", () => {
      expect(toCornerStyle("invalid")).toBe("square");
    });
  });

  describe("toEyeStyle", () => {
    it("maps recognized eye styles", () => {
      expect(toEyeStyle("square")).toBe("square");
      expect(toEyeStyle("circle")).toBe("dot");
      expect(toEyeStyle("asteroid")).toBe("dot");
    });

    it("defaults unknown eye styles to square", () => {
      expect(toEyeStyle("invalid")).toBe("square");
    });
  });

  describe("logoImageUrl", () => {
    it("returns the authenticated file URL when a logo id is present", () => {
      expect(logoImageUrl("file_abc")).toBe("/api/file/file_abc");
    });

    it("returns undefined when no logo is set", () => {
      expect(logoImageUrl(null)).toBeUndefined();
      expect(logoImageUrl(undefined)).toBeUndefined();
      expect(logoImageUrl("")).toBeUndefined();
    });
  });
});

describe("Design Zod Schema Validation", () => {
  it("accepts valid custom design payload", () => {
    const valid = {
      foregroundColor: "#123456",
      backgroundColor: "#abcdef",
      dotStyle: "circle",
      cornerStyle: "extra-rounded",
      eyeStyle: "asteroid",
      frameStyle: "banner",
      frameText: "SCAN ME",
      errorCorrectionLevel: "H",
    };
    const result = designSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex colors", () => {
    expect(designSchema.safeParse({ foregroundColor: "blue" }).success).toBe(false);
    expect(designSchema.safeParse({ backgroundColor: "#FFF" }).success).toBe(false);
    expect(designSchema.safeParse({ foregroundColor: "#1234567" }).success).toBe(false);
  });

  it("rejects invalid enum values", () => {
    expect(designSchema.safeParse({ dotStyle: "hexagonal" }).success).toBe(false);
    expect(designSchema.safeParse({ cornerStyle: "triangle" }).success).toBe(false);
    expect(designSchema.safeParse({ errorCorrectionLevel: "X" }).success).toBe(false);
  });

  it("enforces max length on frame text", () => {
    expect(designSchema.safeParse({ frameText: "A".repeat(50) }).success).toBe(true);
    expect(designSchema.safeParse({ frameText: "A".repeat(51) }).success).toBe(false);
  });

  it("accepts null frameText and logoFileId so a save with no frame/logo is valid", () => {
    const result = designSchema.safeParse({
      foregroundColor: "#1e40af",
      backgroundColor: "#f0f9ff",
      frameStyle: "none",
      frameText: null,
      logoFileId: null,
    });
    expect(result.success).toBe(true);
  });
});
