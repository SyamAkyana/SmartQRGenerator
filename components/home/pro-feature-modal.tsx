"use client";

import Link from "next/link";
import {
  Sparkles,
  Zap,
  BarChart3,
  Layers,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProFeatureInfo {
  id: string;
  title: string;
  subtitle: string;
  icon: "zap" | "chart" | "multilink" | "file" | "logo";
  highlights: string[];
}

const FEATURE_DETAILS: Record<string, ProFeatureInfo> = {
  dynamic: {
    id: "dynamic",
    title: "Dynamic QR Code",
    subtitle: "Change destination URL anytime without reprinting your QR codes.",
    icon: "zap",
    highlights: [
      "Update destination URL anytime after printing flyers, packaging, or cards",
      "Automatic failover and URL redirect validation",
      "Real-time scan counter and click routing",
      "Never worry about broken links on physical materials",
    ],
  },
  multilink: {
    id: "multilink",
    title: "Multi-Link Landing Page",
    subtitle: "Create a mobile-optimized hub for your links, menus, and socials.",
    icon: "multilink",
    highlights: [
      "Build a sleek mobile-first landing page with custom themes",
      "Add unlimited links with customizable icons and labels",
      "Perfect for digital restaurant menus, link-in-bio, and portfolios",
      "Instant real-time updates directly from your dashboard",
    ],
  },
  file: {
    id: "file",
    title: "PDF & File Hosting",
    subtitle: "Host and share PDFs, brochures, and images directly via QR scan.",
    icon: "file",
    highlights: [
      "Fast cloud hosting for restaurant menus, catalogs, and flyers",
      "Replace uploaded files anytime while keeping the exact same QR code",
      "Optimized mobile viewer with instant download support",
      "Zero bandwidth limits for customer scans",
    ],
  },
  analytics: {
    id: "analytics",
    title: "Real-Time Scan Analytics",
    subtitle: "Track who scans your QR codes with geographic and device insights.",
    icon: "chart",
    highlights: [
      "Total & unique scan counts over time with interactive charts",
      "City and country breakdown with geographic distribution",
      "Device & Operating System insights (iOS, Android, Windows, Mac)",
      "Peak scanning hours and campaign performance tracking",
    ],
  },
  logo: {
    id: "logo",
    title: "Custom Brand Logo & Icons",
    subtitle: "Embed your company logo in the center of the QR matrix.",
    icon: "logo",
    highlights: [
      "Upload high-resolution PNG, SVG, or JPEG brand logos",
      "Automatic High Error Correction (EC-H) shield prevents scan errors",
      "Pre-loaded social icons (WhatsApp, Instagram, Wi-Fi, LinkedIn, YouTube)",
      "Pixel-perfect contrast and safe padding around your icon",
    ],
  },
};

interface ProFeatureModalProps {
  featureKey: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProFeatureModal({ featureKey, isOpen, onClose }: ProFeatureModalProps) {
  if (!isOpen || !featureKey) return null;

  const feature = FEATURE_DETAILS[featureKey] || FEATURE_DETAILS.dynamic;

  const getIcon = () => {
    switch (feature.icon) {
      case "zap":
        return <Zap className="w-6 h-6 text-amber-500" />;
      case "chart":
        return <BarChart3 className="w-6 h-6 text-blue-500" />;
      case "multilink":
        return <Layers className="w-6 h-6 text-purple-500" />;
      case "file":
        return <FileText className="w-6 h-6 text-emerald-500" />;
      case "logo":
        return <ImageIcon className="w-6 h-6 text-pink-500" />;
      default:
        return <Sparkles className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Gradient Top Header */}
        <div className="relative p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider text-white">
              <Sparkles className="w-3.5 h-3.5" />
              Dynamic Pro Feature
            </span>
          </div>

          <div className="flex items-start gap-3 mt-3">
            <div className="p-3 bg-white rounded-xl shadow-md shrink-0">{getIcon()}</div>
            <div>
              <h3 className="text-xl font-bold leading-tight">{feature.title}</h3>
              <p className="text-sm text-white/90 mt-1">{feature.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Included with your free account:
          </p>

          <div className="space-y-2.5">
            {feature.highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-700 leading-snug">{highlight}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="flex-1" onClick={onClose}>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 shadow-md shadow-indigo-500/20 group">
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link href="/login" onClick={onClose}>
              <Button variant="outline" className="w-full sm:w-auto font-medium border-neutral-300">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <button
              onClick={onClose}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline underline-offset-4"
            >
              Or continue with Free Static QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
