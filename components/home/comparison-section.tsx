import Link from "next/link";
import { Check, X, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPARISON_ROWS = [
  {
    feature: "Immediate 1-Click Generation",
    description: "Generate and download print-ready QR codes in seconds",
    static: true,
    dynamic: true,
  },
  {
    feature: "No Sign-Up or Login Required",
    description: "Instant access for quick one-off static tasks",
    static: true,
    dynamic: false,
    dynamicNote: "Free Account",
  },
  {
    feature: "Edit Destination Anytime",
    description: "Update the target URL or content after printing marketing materials",
    static: false,
    dynamic: true,
  },
  {
    feature: "Real-Time Scan Counter & Timeline",
    description: "Monitor scan volumes, peak hours, and campaign engagement",
    static: false,
    dynamic: true,
  },
  {
    feature: "Geographic & Device Intelligence",
    description: "Track visitor cities, countries, and mobile OS (iOS/Android)",
    static: false,
    dynamic: true,
  },
  {
    feature: "Mobile Multi-Link Landing Pages",
    description: "Create customized link hubs, bio links, and restaurant menus",
    static: false,
    dynamic: true,
  },
  {
    feature: "PDF & Document Cloud Hosting",
    description: "Direct file hosting with auto-updating downloads",
    static: false,
    dynamic: true,
  },
  {
    feature: "High-Resolution SVG & PNG Vector Export",
    description: "Crystal-clear 1024px exports suitable for billboards and packaging",
    static: true,
    dynamic: true,
  },
];

export function ComparisonSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Clear & Transparent
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
          Static vs Dynamic QR Codes
        </h2>
        <p className="text-base sm:text-lg text-neutral-600">
          Choose the right engine for your needs. Use static for one-time links with zero login, or
          supercharge with dynamic campaigns to track scans and edit destinations anytime.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-neutral-900 text-white p-4 sm:p-6 items-center">
          <div className="col-span-6 sm:col-span-6 font-semibold text-sm sm:text-base">
            Capabilities & Features
          </div>
          <div className="col-span-3 sm:col-span-3 text-center font-bold text-xs sm:text-sm text-neutral-300">
            Free Static QR
          </div>
          <div className="col-span-3 sm:col-span-3 text-center font-bold text-xs sm:text-sm text-emerald-400 flex items-center justify-center gap-1">
            <span>Dynamic Pro</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] uppercase tracking-wide">
              Free Plan
            </span>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {COMPARISON_ROWS.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 p-4 sm:p-5 items-center hover:bg-neutral-50/80 transition-colors"
            >
              <div className="col-span-6 sm:col-span-6 pr-2 sm:pr-4">
                <p className="text-sm sm:text-base font-semibold text-neutral-900">{row.feature}</p>
                <p className="text-xs text-neutral-500 hidden sm:block mt-0.5">{row.description}</p>
              </div>

              {/* Static Column */}
              <div className="col-span-3 sm:col-span-3 flex items-center justify-center">
                {row.static ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Dynamic Column */}
              <div className="col-span-3 sm:col-span-3 flex items-center justify-center">
                {row.dynamic ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : row.dynamicNote ? (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {row.dynamicNote}
                  </span>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Banner */}
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">
                Ready to create high-impact dynamic QR codes?
              </p>
              <p className="text-xs text-neutral-600">
                Sign up in 30 seconds. No credit card required.
              </p>
            </div>
          </div>

          <Link href="/register">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 shadow-md shadow-indigo-600/20 gap-2">
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
