import { ExternalLink } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import type { PageWithItems } from "@/lib/multi-link/service";
import { QrPageShell } from "./qr-page-shell";

type Props = {
  qr: QRCodeRecord;
  page: PageWithItems | null;
};

const THEME_CLASSES = {
  default: {
    wrapper: "bg-white text-neutral-900",
    card: "bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-sm",
    title: "text-neutral-900",
    description: "text-neutral-600",
    link: "bg-blue-600 text-white hover:bg-blue-700",
    icon: "text-white",
    emptyIcon: "bg-neutral-100 text-neutral-400",
    accent: "text-neutral-500",
  },
  minimal: {
    wrapper: "bg-white text-neutral-900",
    card: "bg-white shadow-none hover:shadow-sm",
    title: "text-neutral-900",
    description: "text-neutral-500",
    link: "bg-neutral-900 text-white hover:bg-neutral-800",
    icon: "text-white",
    emptyIcon: "bg-neutral-100 text-neutral-400",
    accent: "text-neutral-400",
  },
  dark: {
    wrapper: "bg-neutral-900 text-white",
    card: "bg-neutral-800 border border-neutral-700 hover:border-neutral-600",
    title: "text-white",
    description: "text-neutral-300",
    link: "bg-blue-500 text-white hover:bg-blue-400",
    icon: "text-white",
    emptyIcon: "bg-neutral-700 text-neutral-400",
    accent: "text-neutral-400",
  },
};

// Block dangerous URL schemes as a defence-in-depth layer (primary validation is in the service)
const DANGEROUS_SCHEMES = ["javascript:", "data:", "vbscript:", "file:"];

function safeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.toLowerCase();
    return !DANGEROUS_SCHEMES.some((s) => scheme.startsWith(s));
  } catch {
    return false;
  }
}

/** Public landing page for MULTI_LINK QR codes. */
export function MultiLinkQrPage({ qr, page }: Props) {
  const themeKey = page?.theme ?? "default";
  const theme = THEME_CLASSES[themeKey as keyof typeof THEME_CLASSES] ?? THEME_CLASSES.default;

  const title = page?.title ?? qr.name;
  const description = page?.description ?? null;

  // Filter to enabled items and validate URLs (defence-in-depth)
  const items = (page?.items ?? []).filter(
    (item) => item.enabled && safeUrl(item.url),
  );

  return (
    <QrPageShell>
      <div className={`w-full flex flex-col items-center gap-4 ${theme.wrapper}`}>
        {/* Logo — /api/file/[id]?publicLogo=1 is auth-free and owner-controlled */}
        {page?.logoFileId ? (
          <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/file/${page.logoFileId}?publicLogo=1`}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${theme.emptyIcon}`}
          >
            <span className="text-2xl font-bold">
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className={`text-2xl font-bold ${theme.title}`}>{title}</h1>

        {/* Description */}
        {description && (
          <p className={`text-sm max-w-xs ${theme.description}`}>{description}</p>
        )}

        {/* Links */}
        <div className="w-full flex flex-col gap-3 mt-2">
          {items.length === 0 ? (
            <p className={`text-sm ${theme.accent} text-center`}>
              No links have been added yet.
            </p>
          ) : (
            items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${theme.card}`}
              >
                {item.icon ? (
                  <span className="text-xl flex-shrink-0" role="img" aria-label={item.label}>
                    {item.icon}
                  </span>
                ) : (
                  <ExternalLink className={`w-5 h-5 flex-shrink-0 ${theme.accent}`} />
                )}
                <span className={`font-medium text-sm ${theme.title}`}>{item.label}</span>
              </a>
            ))
          )}
        </div>
      </div>
    </QrPageShell>
  );
}