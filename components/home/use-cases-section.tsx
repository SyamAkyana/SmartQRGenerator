import {
  Utensils,
  Users,
  ShoppingBag,
  Building2,
  Share2,
  FileCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const USE_CASES = [
  {
    icon: Utensils,
    color: "from-amber-500 to-orange-600",
    badge: "Hospitality & Dining",
    title: "Contactless Menus & Guest Wi-Fi",
    description:
      "Update your daily specials and wine lists without reprinting table stickers. Enable guests to join Wi-Fi with a single scan.",
    stat: "+45% faster table turnaround",
  },
  {
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    badge: "Networking & Events",
    title: "Digital Business Cards (vCard)",
    description:
      "Share your phone, email, website, and socials instantly at trade shows and conferences. Zero paper waste.",
    stat: "1-tap direct contact save",
  },
  {
    icon: ShoppingBag,
    color: "from-purple-500 to-pink-600",
    badge: "Retail & Packaging",
    title: "Product Guides & Warranty Registration",
    description:
      "Place dynamic QR codes on product boxes to link directly to manuals, warranty sign-ups, and review pages.",
    stat: "3.2x higher review submissions",
  },
  {
    icon: Share2,
    color: "from-emerald-500 to-teal-600",
    badge: "Social & Creators",
    title: "Multi-Link Bio Hub",
    description:
      "Direct your followers to your Spotify, YouTube, Instagram, and store from a single mobile-optimized hub.",
    stat: "Zero third-party commissions",
  },
  {
    icon: Building2,
    color: "from-cyan-500 to-blue-600",
    badge: "Offices & Facilities",
    title: "Visitor Check-in & Wi-Fi Access",
    description:
      "Streamline guest arrivals with secure WPA2/WPA3 Wi-Fi connection codes and check-in forms at the front desk.",
    stat: "Instant password auto-fill",
  },
  {
    icon: FileCheck,
    color: "from-rose-500 to-red-600",
    badge: "Corporate & Real Estate",
    title: "PDF Brochures & Property Flyers",
    description:
      "Attach downloadable floor plans and high-res property portfolios directly to yard signs and flyers.",
    stat: "Replace PDF anytime post-print",
  },
];

export function UseCasesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Real-World Applications
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
          Built for Every Industry & Workflow
        </h2>
        <p className="text-base sm:text-lg text-neutral-600">
          From neighborhood cafes and indie creators to global brands, SmartQR powers millions of
          seamless physical-to-digital connections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {USE_CASES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="group relative bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle top gradient glow on hover */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${item.color}`}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-md`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-neutral-600 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>{item.stat}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
