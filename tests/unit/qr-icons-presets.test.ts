import { describe, it, expect } from "vitest";
import {
  BUILTIN_ICONS,
  isBuiltinIcon,
  getBuiltinIconById,
  getBuiltinIconDataUri,
} from "@/lib/qr/icons";
import { DESIGNER_PRESETS } from "@/lib/qr/presets";
import { checkQrContrast } from "@/lib/qr/contrast";

describe("Built-in Brand Icons Library", () => {
  it("provides 18 high-quality brand and utility icons", () => {
    expect(BUILTIN_ICONS.length).toBeGreaterThanOrEqual(18);
  });

  it("every icon has a valid id, name, category, color, and base64 dataUri", () => {
    for (const icon of BUILTIN_ICONS) {
      expect(icon.id).toMatch(/^icon:[a-z0-9-]+$/);
      expect(icon.name).toBeTruthy();
      expect(["social", "utility", "brand"]).toContain(icon.category);
      expect(icon.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(icon.dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(icon.svg).toContain("<svg");
      expect(icon.svg).toContain("</svg>");
    }
  });

  it("includes primary brand and utility icons", () => {
    const iconIds = BUILTIN_ICONS.map((i) => i.id);
    expect(iconIds).toContain("icon:whatsapp");
    expect(iconIds).toContain("icon:instagram");
    expect(iconIds).toContain("icon:youtube");
    expect(iconIds).toContain("icon:x");
    expect(iconIds).toContain("icon:wifi");
    expect(iconIds).toContain("icon:location");
    expect(iconIds).toContain("icon:globe");
    expect(iconIds).toContain("icon:spotify");
    expect(iconIds).toContain("icon:apple");
  });

  it("isBuiltinIcon identifies icon IDs accurately", () => {
    expect(isBuiltinIcon("icon:whatsapp")).toBe(true);
    expect(isBuiltinIcon("icon:custom-name")).toBe(true);
    expect(isBuiltinIcon("cm123abc456")).toBe(false);
    expect(isBuiltinIcon(null)).toBe(false);
    expect(isBuiltinIcon(undefined)).toBe(false);
    expect(isBuiltinIcon("")).toBe(false);
  });

  it("getBuiltinIconById and getBuiltinIconDataUri retrieve matching icons", () => {
    const whatsapp = getBuiltinIconById("icon:whatsapp");
    expect(whatsapp).toBeDefined();
    expect(whatsapp?.name).toBe("WhatsApp");

    const dataUri = getBuiltinIconDataUri("icon:whatsapp");
    expect(dataUri).toBeDefined();
    expect(dataUri).toBe(whatsapp?.dataUri);

    expect(getBuiltinIconById("icon:non-existent")).toBeUndefined();
    expect(getBuiltinIconDataUri("icon:non-existent")).toBeUndefined();
    expect(getBuiltinIconDataUri(null)).toBeUndefined();
  });
});

describe("Designer Presets Library", () => {
  it("provides curated presets across multiple categories", () => {
    expect(DESIGNER_PRESETS.length).toBeGreaterThanOrEqual(7);
  });

  it("every preset has valid design properties and styling options", () => {
    for (const preset of DESIGNER_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(["modern", "business", "creative", "dark"]).toContain(preset.category);
      expect(preset.design.foregroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(preset.design.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(["square", "circle", "diamond", "fluid", "star"]).toContain(preset.design.dotStyle);
      expect(["square", "circle", "extra-rounded"]).toContain(preset.design.cornerStyle);
      expect(["square", "circle", "asteroid"]).toContain(preset.design.eyeStyle);
      expect(["none", "box", "rounded", "banner"]).toContain(preset.design.frameStyle);
    }
  });

  it("all presets have scannable contrast ratios", () => {
    for (const preset of DESIGNER_PRESETS) {
      const contrast = checkQrContrast(preset.design.foregroundColor, preset.design.backgroundColor);
      expect(contrast.isScannable).toBe(true);
      expect(contrast.ratio).toBeGreaterThanOrEqual(3.0);
    }
  });
});
