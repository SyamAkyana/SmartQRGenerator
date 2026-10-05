// lib/qr/presets.ts
// 1-Click Designer Style Presets for SmartQR

export interface DesignerPreset {
  id: string;
  name: string;
  description: string;
  category: "modern" | "business" | "creative" | "dark";
  previewColor: string;
  design: {
    foregroundColor: string;
    backgroundColor: string;
    dotStyle: string;
    cornerStyle: string;
    eyeStyle: string;
    frameStyle: string;
    frameText?: string | null;
  };
}

export const DESIGNER_PRESETS: DesignerPreset[] = [
  {
    id: "classic-mono",
    name: "Classic Monolith",
    description: "High-contrast clean black & white for universal scannability",
    category: "modern",
    previewColor: "#000000",
    design: {
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
      dotStyle: "square",
      cornerStyle: "square",
      eyeStyle: "square",
      frameStyle: "none",
      frameText: null,
    },
  },
  {
    id: "modern-indigo",
    name: "Modern Indigo",
    description: "Vibrant indigo with rounded corners and CTA frame",
    category: "modern",
    previewColor: "#4f46e5",
    design: {
      foregroundColor: "#4f46e5",
      backgroundColor: "#ffffff",
      dotStyle: "circle",
      cornerStyle: "extra-rounded",
      eyeStyle: "circle",
      frameStyle: "banner",
      frameText: "SCAN ME",
    },
  },
  {
    id: "emerald-pro",
    name: "Emerald Business",
    description: "Professional emerald green with organic fluid styling",
    category: "business",
    previewColor: "#059669",
    design: {
      foregroundColor: "#059669",
      backgroundColor: "#ffffff",
      dotStyle: "fluid",
      cornerStyle: "circle",
      eyeStyle: "circle",
      frameStyle: "rounded",
      frameText: "VISIT US",
    },
  },
  {
    id: "sunset-coral",
    name: "Sunset Coral",
    description: "Warm coral tone with diamond matrix for events & retail",
    category: "creative",
    previewColor: "#e11d48",
    design: {
      foregroundColor: "#e11d48",
      backgroundColor: "#ffffff",
      dotStyle: "diamond",
      cornerStyle: "extra-rounded",
      eyeStyle: "circle",
      frameStyle: "box",
      frameText: "EXPLORE",
    },
  },
  {
    id: "royal-purple",
    name: "Royal Velvet",
    description: "Creative purple with rounded eyes and modern box frame",
    category: "creative",
    previewColor: "#7c3aed",
    design: {
      foregroundColor: "#7c3aed",
      backgroundColor: "#ffffff",
      dotStyle: "circle",
      cornerStyle: "circle",
      eyeStyle: "asteroid",
      frameStyle: "box",
      frameText: "CONNECT",
    },
  },
  {
    id: "cyber-slate",
    name: "Cyber Slate",
    description: "Deep charcoal tone on crisp white for tech and apps",
    category: "dark",
    previewColor: "#0f172a",
    design: {
      foregroundColor: "#0f172a",
      backgroundColor: "#ffffff",
      dotStyle: "square",
      cornerStyle: "extra-rounded",
      eyeStyle: "square",
      frameStyle: "none",
      frameText: null,
    },
  },
  {
    id: "ocean-cyan",
    name: "Ocean Breeze",
    description: "Fresh ocean cyan with soft rounded dots",
    category: "modern",
    previewColor: "#0284c7",
    design: {
      foregroundColor: "#0284c7",
      backgroundColor: "#ffffff",
      dotStyle: "fluid",
      cornerStyle: "extra-rounded",
      eyeStyle: "circle",
      frameStyle: "banner",
      frameText: "SCAN NOW",
    },
  },
];
