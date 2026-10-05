"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import QRCodeStyling from "qr-code-styling";
import type { DotType, CornerSquareType, CornerDotType } from "qr-code-styling";
import {
  Globe,
  Wifi,
  UserCheck,
  Phone,
  MessageSquare,
  Mail,
  FileText,
  Zap,
  Layers,
  BarChart3,
  Download,
  Sparkles,
  RefreshCw,
  Check,
  AlertTriangle,
  Lock,
  Palette,
  Eye,
  Sliders,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatUrlPayload,
  formatWifiPayload,
  formatVCardPayload,
  formatPhonePayload,
  formatSmsPayload,
  formatEmailPayload,
  formatTextPayload,
} from "@/lib/qr/static-payloads";
import { ProFeatureModal } from "@/components/home/pro-feature-modal";

type TabType = "url" | "wifi" | "vcard" | "phone" | "sms" | "email" | "text";
type ProTabType = "dynamic" | "multilink" | "file" | "analytics";

const COLOR_PRESETS = [
  { label: "Classic", fg: "#000000", bg: "#ffffff" },
  { label: "Indigo", fg: "#4338ca", bg: "#ffffff" },
  { label: "Emerald", fg: "#047857", bg: "#ffffff" },
  { label: "Sunset", fg: "#c2410c", bg: "#ffffff" },
  { label: "Ruby", fg: "#be123c", bg: "#ffffff" },
  { label: "Cyber Dark", fg: "#38bdf8", bg: "#0f172a" },
];

const CTA_FRAMES = [
  { id: "none", label: "No Frame" },
  { id: "SCAN ME", label: "SCAN ME" },
  { id: "VISIT SITE", label: "VISIT SITE" },
  { id: "CONNECT WI-FI", label: "CONNECT WI-FI" },
  { id: "SAVE CONTACT", label: "SAVE CONTACT" },
];

function getLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0;
  const rgb = [
    parseInt(clean.substring(0, 2), 16) / 255,
    parseInt(clean.substring(2, 4), 16) / 255,
    parseInt(clean.substring(4, 6), 16) / 255,
  ].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function getContrastRatio(fg: string, bg: string): number {
  try {
    const l1 = getLuminance(fg);
    const l2 = getLuminance(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  } catch {
    return 21;
  }
}

export function InstantQrGenerator() {
  const [activeTab, setActiveTab] = useState<TabType>("url");
  const [proModalFeature, setProModalFeature] = useState<ProTabType | null>(null);

  // Payload form states
  const [urlInput, setUrlInput] = useState("https://smartqr.io");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  const [vcardFirst, setVcardFirst] = useState("");
  const [vcardLast, setVcardLast] = useState("");
  const [vcardOrg, setVcardOrg] = useState("");
  const [vcardTitle, setVcardTitle] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardWebsite, setVcardWebsite] = useState("");

  const [phoneInput, setPhoneInput] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [textInput, setTextInput] = useState("");

  // Styling options
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [dotStyle, setDotStyle] = useState<DotType>("square");
  const [cornerStyle, setCornerStyle] = useState<CornerSquareType>("square");
  const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotType>("square");
  const [frameText, setFrameText] = useState("none");
  const [copied, setCopied] = useState(false);

  // Compute active payload
  const currentPayload = useMemo(() => {
    switch (activeTab) {
      case "url":
        return formatUrlPayload(urlInput) || "https://smartqr.io";
      case "wifi":
        return (
          formatWifiPayload({
            ssid: wifiSsid || "Guest-WiFi",
            password: wifiPassword,
            encryption: wifiEncryption,
            hidden: wifiHidden,
          }) || "WIFI:S:Guest-WiFi;T:WPA;P:password;;"
        );
      case "vcard":
        return (
          formatVCardPayload({
            firstName: vcardFirst || "Alex",
            lastName: vcardLast || "Morgan",
            organization: vcardOrg,
            title: vcardTitle,
            phone: vcardPhone,
            email: vcardEmail,
            website: vcardWebsite,
          }) || "BEGIN:VCARD\nVERSION:3.0\nFN:Alex Morgan\nEND:VCARD"
        );
      case "phone":
        return formatPhonePayload(phoneInput || "+1234567890") || "tel:+1234567890";
      case "sms":
        return (
          formatSmsPayload({
            phoneNumber: smsPhone || "+1234567890",
            message: smsMessage,
          }) || "SMSTO:+1234567890"
        );
      case "email":
        return (
          formatEmailPayload({
            email: emailTo || "hello@example.com",
            subject: emailSubject,
            body: emailBody,
          }) || "mailto:hello@example.com"
        );
      case "text":
        return formatTextPayload(textInput) || "Welcome to SmartQR";
      default:
        return "https://smartqr.io";
    }
  }, [
    activeTab,
    urlInput,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    wifiHidden,
    vcardFirst,
    vcardLast,
    vcardOrg,
    vcardTitle,
    vcardPhone,
    vcardEmail,
    vcardWebsite,
    phoneInput,
    smsPhone,
    smsMessage,
    emailTo,
    emailSubject,
    emailBody,
    textInput,
  ]);

  const contrastRatio = useMemo(() => getContrastRatio(fgColor, bgColor), [fgColor, bgColor]);
  const isHighContrast = contrastRatio >= 4.5;
  const isPoorContrast = contrastRatio < 2.5;

  // Real-time canvas/SVG preview container
  const previewRef = useRef<HTMLDivElement>(null);
  const qrStylingInstance = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!previewRef.current) return;

    const qr = new QRCodeStyling({
      width: 240,
      height: 240,
      type: "svg",
      data: currentPayload,
      margin: 8,
      qrOptions: { errorCorrectionLevel: "M" },
      dotsOptions: { color: fgColor, type: dotStyle },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { color: fgColor, type: cornerStyle },
      cornersDotOptions: { color: fgColor, type: cornerDotStyle },
    });

    qrStylingInstance.current = qr;
    previewRef.current.innerHTML = "";
    qr.append(previewRef.current);

    return () => {
      if (previewRef.current) previewRef.current.innerHTML = "";
    };
  }, [currentPayload, fgColor, bgColor, dotStyle, cornerStyle, cornerDotStyle]);

  // Export handlers
  const handleDownload = async (extension: "png" | "svg") => {
    const exportInstance = new QRCodeStyling({
      width: 1024,
      height: 1024,
      type: extension === "svg" ? "svg" : "canvas",
      data: currentPayload,
      margin: 24,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: { color: fgColor, type: dotStyle },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { color: fgColor, type: cornerStyle },
      cornersDotOptions: { color: fgColor, type: cornerDotStyle },
    });

    await exportInstance.download({
      name: `smartqr-static-${activeTab}`,
      extension,
    });
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(currentPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-neutral-200/80 overflow-hidden text-neutral-900 transition-all">
      {/* Type Selector Header */}
      <div className="bg-neutral-900 text-white p-3 sm:p-4 border-b border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Instant Free Generator
            </span>
            <span className="text-xs text-neutral-400">| No Sign-Up Needed</span>
          </div>
          <span className="text-xs text-neutral-400 hidden sm:inline">
            Over 2.4M+ Free QRs Generated
          </span>
        </div>

        {/* Static Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "url"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>URL / Link</span>
          </button>

          <button
            onClick={() => setActiveTab("wifi")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "wifi"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Wi-Fi</span>
          </button>

          <button
            onClick={() => setActiveTab("vcard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "vcard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>vCard Contact</span>
          </button>

          <button
            onClick={() => setActiveTab("phone")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "phone"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            <Phone className="w-4 h-4 text-amber-400" />
            <span>Phone</span>
          </button>

          <button
            onClick={() => setActiveTab("sms")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "sms"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-green-400" />
            <span>SMS</span>
          </button>

          <button
            onClick={() => setActiveTab("email")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "email"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            <Mail className="w-4 h-4 text-pink-400" />
            <span>Email</span>
          </button>

          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "text"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Text / Note</span>
          </button>

          {/* Pro Feature Triggers */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-neutral-700">
            <button
              onClick={() => setProModalFeature("dynamic")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Dynamic URL</span>
              <Lock className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            <button
              onClick={() => setProModalFeature("multilink")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Multi-Link</span>
              <Lock className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            <button
              onClick={() => setProModalFeature("analytics")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Analytics</span>
              <Lock className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Generator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 lg:p-8">
        {/* Left Column: Dynamic Forms & Customization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dynamic Input Forms */}
          <div className="bg-neutral-50/80 rounded-2xl p-5 border border-neutral-200/60 shadow-inner">
            {activeTab === "url" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="url-input" className="text-sm font-semibold text-neutral-800">
                    Website or Destination URL
                  </Label>
                  <span className="text-xs text-neutral-500">Auto-formats https://</span>
                </div>
                <div className="relative">
                  <Globe className="w-5 h-5 absolute left-3.5 top-3 text-neutral-400" />
                  <Input
                    id="url-input"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="pl-11 h-11 bg-white border-neutral-300 focus-visible:ring-indigo-500 text-sm font-medium"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-neutral-400 self-center">Quick fill:</span>
                  <button
                    onClick={() => setUrlInput("https://smartqr.io")}
                    className="text-xs px-2.5 py-1 rounded-md bg-white border border-neutral-200 hover:border-indigo-400 text-neutral-600 transition-colors"
                  >
                    smartqr.io
                  </button>
                  <button
                    onClick={() => setUrlInput("https://instagram.com/yourbrand")}
                    className="text-xs px-2.5 py-1 rounded-md bg-white border border-neutral-200 hover:border-indigo-400 text-neutral-600 transition-colors"
                  >
                    Instagram
                  </button>
                  <button
                    onClick={() => setUrlInput("https://youtube.com/@channel")}
                    className="text-xs px-2.5 py-1 rounded-md bg-white border border-neutral-200 hover:border-indigo-400 text-neutral-600 transition-colors"
                  >
                    YouTube
                  </button>
                </div>
              </div>
            )}

            {activeTab === "wifi" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Wi-Fi Network Configuration
                  </Label>
                  <span className="text-xs text-emerald-600 font-medium">1-Click Auto Join</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="wifi-ssid" className="text-xs text-neutral-600 mb-1 block">
                      Network Name (SSID) *
                    </Label>
                    <Input
                      id="wifi-ssid"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. BlueBottleCoffee_Guest"
                      className="bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="wifi-password" className="text-xs text-neutral-600 mb-1 block">
                        Password
                      </Label>
                      <Input
                        id="wifi-password"
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="Network password"
                        className="bg-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="wifi-enc" className="text-xs text-neutral-600 mb-1 block">
                        Encryption
                      </Label>
                      <select
                        id="wifi-enc"
                        value={wifiEncryption}
                        onChange={(e) =>
                          setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")
                        }
                        className="w-full h-9 px-3 rounded-md border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3 (Recommended)</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open Network)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="wifi-hidden"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <Label htmlFor="wifi-hidden" className="text-xs text-neutral-600 cursor-pointer">
                      Hidden Network (SSID is not broadcasted)
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "vcard" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Digital Business Card (vCard)
                  </Label>
                  <span className="text-xs text-blue-600 font-medium">Instant Add to Contacts</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="vc-first" className="text-xs text-neutral-600 mb-1 block">
                      First Name *
                    </Label>
                    <Input
                      id="vc-first"
                      value={vcardFirst}
                      onChange={(e) => setVcardFirst(e.target.value)}
                      placeholder="Alex"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vc-last" className="text-xs text-neutral-600 mb-1 block">
                      Last Name
                    </Label>
                    <Input
                      id="vc-last"
                      value={vcardLast}
                      onChange={(e) => setVcardLast(e.target.value)}
                      placeholder="Morgan"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="vc-phone" className="text-xs text-neutral-600 mb-1 block">
                      Phone Number
                    </Label>
                    <Input
                      id="vc-phone"
                      value={vcardPhone}
                      onChange={(e) => setVcardPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vc-email" className="text-xs text-neutral-600 mb-1 block">
                      Email Address
                    </Label>
                    <Input
                      id="vc-email"
                      value={vcardEmail}
                      onChange={(e) => setVcardEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="vc-org" className="text-xs text-neutral-600 mb-1 block">
                      Company / Organization
                    </Label>
                    <Input
                      id="vc-org"
                      value={vcardOrg}
                      onChange={(e) => setVcardOrg(e.target.value)}
                      placeholder="Acme Studio"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vc-title" className="text-xs text-neutral-600 mb-1 block">
                      Job Title
                    </Label>
                    <Input
                      id="vc-title"
                      value={vcardTitle}
                      onChange={(e) => setVcardTitle(e.target.value)}
                      placeholder="Creative Director"
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "phone" && (
              <div className="space-y-3">
                <Label htmlFor="phone-input" className="text-sm font-semibold text-neutral-800">
                  Direct Phone Call Dialing
                </Label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3.5 top-3 text-neutral-400" />
                  <Input
                    id="phone-input"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-11 h-11 bg-white text-sm"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Scanning this QR code prompts the visitor to dial this phone number immediately.
                </p>
              </div>
            )}

            {activeTab === "sms" && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-neutral-800">Direct SMS Message</Label>
                <div className="space-y-2">
                  <Input
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="Recipient Phone Number (e.g. +15551234567)"
                    className="bg-white"
                  />
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Pre-filled text message (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-neutral-800">Instant Email Draft</Label>
                <div className="space-y-2">
                  <Input
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="Recipient Email (e.g. hello@smartqr.io)"
                    className="bg-white"
                  />
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject Line (e.g. Partnership Inquiry)"
                    className="bg-white"
                  />
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email body text..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "text" && (
              <div className="space-y-3">
                <Label htmlFor="text-input" className="text-sm font-semibold text-neutral-800">
                  Plain Text, Address, or Promo Code
                </Label>
                <textarea
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type any message, address, coupon code, or product notes..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Styling & Color Customizer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-600" />
                Color Palette & Contrast
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isPoorContrast
                    ? "bg-red-100 text-red-700"
                    : isHighContrast
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {isPoorContrast ? "⚠️ Poor Contrast" : isHighContrast ? "✓ 100% Scannable" : "✓ Good Scannability"}
              </span>
            </div>

            {/* Quick Color Presets */}
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setFgColor(preset.fg);
                    setBgColor(preset.bg);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    fgColor === preset.fg && bgColor === preset.bg
                      ? "border-indigo-600 bg-indigo-50/80 ring-1 ring-indigo-500"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs"
                    style={{ backgroundColor: preset.fg }}
                  />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            {/* Matrix Shape Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <Label className="text-xs text-neutral-600 mb-1 block">Dot Pattern</Label>
                <select
                  value={dotStyle}
                  onChange={(e) => setDotStyle(e.target.value as DotType)}
                  className="w-full h-8 px-2.5 rounded-lg border border-neutral-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="dots">Dots</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-neutral-600 mb-1 block">Corner Frame</Label>
                <select
                  value={cornerStyle}
                  onChange={(e) => setCornerStyle(e.target.value as CornerSquareType)}
                  className="w-full h-8 px-2.5 rounded-lg border border-neutral-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="square">Square</option>
                  <option value="dot">Circle</option>
                  <option value="extra-rounded">Rounded</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-neutral-600 mb-1 block">CTA Frame</Label>
                <select
                  value={frameText}
                  onChange={(e) => setFrameText(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-neutral-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {CTA_FRAMES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Matrix Preview & Instant Downloads */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between bg-gradient-to-b from-neutral-50/90 to-indigo-50/40 rounded-2xl p-6 border border-neutral-200/80 shadow-sm text-center">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Live Matrix Preview
              </span>
              <button
                onClick={handleCopyPayload}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                title="Copy raw encoded payload"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Copied Payload!" : "Copy Payload"}
              </button>
            </div>

            {/* QR Frame Container */}
            <div
              className={`inline-flex flex-col items-center justify-center p-4 rounded-2xl shadow-xl transition-all border-2 mx-auto ${
                frameText !== "none" ? "border-neutral-900" : "border-neutral-200/80"
              }`}
              style={{
                backgroundColor: bgColor,
                borderColor: frameText !== "none" ? fgColor : undefined,
              }}
            >
              {frameText !== "none" && (
                <div
                  className="mb-2 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-xs"
                  style={{
                    backgroundColor: fgColor,
                    color: bgColor,
                  }}
                >
                  {frameText}
                </div>
              )}

              <div
                ref={previewRef}
                className="w-60 h-60 flex items-center justify-center bg-transparent"
              />

              <p className="text-[10px] text-neutral-400 mt-2 font-mono tracking-tight max-w-[220px] truncate">
                {currentPayload}
              </p>
            </div>

            {isPoorContrast && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Colors are too similar. Cameras might struggle to read this QR.</span>
              </div>
            )}
          </div>

          {/* Download & Pro CTAs */}
          <div className="w-full space-y-3 pt-6">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleDownload("png")}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 rounded-xl shadow-md gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>PNG (1024px)</span>
              </Button>

              <Button
                onClick={() => handleDownload("svg")}
                variant="outline"
                className="w-full border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-medium py-2.5 rounded-xl shadow-xs gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Vector SVG</span>
              </Button>
            </div>

            {/* Dynamic Upgrade Teaser */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/60 text-left flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Need to edit this destination later?
                </p>
                <p className="text-[11px] text-neutral-600">
                  Switch to Dynamic QR with scan tracking.
                </p>
              </div>
              <button
                onClick={() => setProModalFeature("dynamic")}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 whitespace-nowrap shadow-xs"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Modal */}
      <ProFeatureModal
        featureKey={proModalFeature}
        isOpen={Boolean(proModalFeature)}
        onClose={() => setProModalFeature(null)}
      />
    </div>
  );
}
