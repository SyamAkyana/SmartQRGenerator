import Link from "next/link";
import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  QrCode,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Smartphone,
  BarChart3,
  Sparkles,
  Download,
  Layers,
  HelpCircle,
  Lock,
  Globe2,
  CheckCircle2,
} from "lucide-react";
import { InstantQrGenerator } from "@/components/home/instant-qr-generator";
import { ComparisonSection } from "@/components/home/comparison-section";
import { UseCasesSection } from "@/components/home/use-cases-section";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white group">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              SmartQR
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
            <a href="#generator" className="hover:text-white transition-colors">
              Free Generator
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Static vs Dynamic
            </a>
            <a href="#use-cases" className="hover:text-white transition-colors">
              Use Cases
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard"
                className={buttonVariants({
                  variant: "default",
                  className: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-600/20 font-semibold",
                })}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({
                    variant: "ghost",
                    className: "text-neutral-300 hover:text-white hover:bg-neutral-800/80 font-medium",
                  })}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({
                    variant: "default",
                    className: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white shadow-md shadow-indigo-500/20 font-semibold",
                  })}
                >
                  Free Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Interactive Generator */}
      <section id="generator" className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-semibold text-neutral-200 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Zero Sign-Up Required for Static QRs • Instant Free Download</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Instant Free QR Codes. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Unlimited Dynamic Power.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Generate and download high-resolution static QR codes for links, Wi-Fi, contacts, and text
            in seconds with zero login. When you need editable destinations and scan analytics,
            switch to Dynamic QRs with a free account.
          </p>
        </div>

        {/* Embedded Interactive Static QR Generator */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <InstantQrGenerator />
        </div>
      </section>

      {/* Feature Matrix / Highlights */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            Next-Gen QR Infrastructure
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Everything You Need to Connect Physical & Digital
          </h2>
          <p className="text-base text-neutral-400">
            Engineered with modern vector standards, sub-100ms redirects, and privacy-first analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Dynamic URL Routing</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Update destination links anytime after printing flyers, product packaging, or business
                cards. Never reprint for a changed link again.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1 pt-2">
              <span>Unlimited Destination Edits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Real-Time Analytics</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Track scans over time, geographic cities/countries, and mobile operating systems (iOS
                vs Android) with interactive charts.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-purple-400 flex items-center gap-1 pt-2">
              <span>Detailed Geographic Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-pink-600/20 text-pink-400 flex items-center justify-center border border-pink-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Multi-Link Landing Pages</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Build mobile-optimized digital menus, link-in-bio hubs, and product catalogs with custom
                themes and brand colors.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-pink-400 flex items-center gap-1 pt-2">
              <span>No-Code Mobile Page Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Download className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Print-Ready Vector SVG</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Export ultra-crisp vector SVG and 1024x1024 PNG formats ready for large-format billboards,
                apparel, and glossy print materials.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 pt-2">
              <span>Zero Pixelation at Any Size</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Static vs Dynamic Comparison Section */}
      <div id="comparison" className="bg-neutral-900/40 border-y border-neutral-900">
        <ComparisonSection />
      </div>

      {/* Use Cases Section */}
      <div id="use-cases">
        <UseCasesSection />
      </div>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-neutral-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-base">
              Can I use the QR generator for free without signing up?
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Yes! You can immediately generate and download free static QR codes (URL, Wi-Fi, vCard,
              Phone, SMS, Email, Text) directly on this page without creating an account.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-base">
              Do static QR codes expire?
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              No. Static QR codes encode data directly into the matrix and will work forever. They do
              not depend on any server or subscription.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-base">
              What is the advantage of a Dynamic QR code?
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Dynamic QR codes route through SmartQR's high-speed redirect engine. This allows you to
              update the target destination anytime after printing, track scan analytics, and host
              documents or multi-link pages.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-base">
              Are there any third-party ads or watermarks on scan?
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Never. SmartQR is built with zero interstitial advertisements, zero popups, and clean
              white-label redirection to your destination.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-base">
              Can I customize the colors, shapes, and frames?
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Yes. You can select custom foreground and background colors, dot styles, corner frames,
              and CTA frames (&ldquo;SCAN ME&rdquo;, &ldquo;CONNECT WI-FI&rdquo;). We also include a built-in contrast validator.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-base">
              What export formats are supported?
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              You can download high-resolution PNG (1024x1024) for digital screens and scalable vector
              SVG for professional print materials and billboards.
            </p>
          </div>
        </div>
      </section>

      {/* High-Conversion Bottom Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 sm:p-12 text-center text-white overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              100% Free Account Setup
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Start Creating Smart Dynamic QR Codes Today
            </h2>
            <p className="text-sm sm:text-base text-white/90">
              Join thousands of businesses, creators, and event organizers using SmartQR to connect
              their physical products to digital experiences.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-neutral-900 hover:bg-neutral-100 font-bold px-8 shadow-lg shadow-black/20"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#generator">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 font-semibold"
                >
                  Try Static Generator
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-base text-white">
              <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg text-white">
                <QrCode className="w-4 h-4" />
              </div>
              <span>SmartQR</span>
            </div>
            <p className="text-neutral-500 leading-relaxed">
              The high-performance QR code generator and dynamic link routing platform. Free static
              generation, zero ads, and enterprise-grade uptime.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">
              Supported QR Formats
            </h4>
            <ul className="space-y-1.5">
              <li>Website URLs & Links</li>
              <li>Wi-Fi Network Configuration</li>
              <li>vCard Digital Contact Cards</li>
              <li>Instant Phone & SMS Dialing</li>
              <li>Email Composition</li>
              <li>Plain Text & Location Notes</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">
              Dynamic Features
            </h4>
            <ul className="space-y-1.5">
              <li>Editable Destination URLs</li>
              <li>Real-time Scan Analytics</li>
              <li>Multi-Link Mobile Landing Pages</li>
              <li>PDF & Image Document Hosting</li>
              <li>Custom Brand Logo Embedding</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">
              Security & Reliability
            </h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Interstitial Ads</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sub-100ms Redirect Engine</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Encrypted Authentication</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>WCAG Contrast Verification</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-600">
          <p>© {new Date().getFullYear()} SmartQR. Built with Next.js App Router, Prisma, and PostgreSQL.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-neutral-400 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-neutral-400 transition-colors">
              Create Account
            </Link>
            <Link href="/dashboard" className="hover:text-neutral-400 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
