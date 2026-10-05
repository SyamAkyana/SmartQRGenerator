import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPublicQr } from "@/lib/qr/public";
import { recordScanFromHeaders } from "@/lib/qr/scan";
import { resolveQr } from "@/lib/qr/resolve";
import { InactiveQrPage } from "./components/inactive-qr-page";
import { TextQrPage } from "./components/text-qr-page";
import { ContactQrPage } from "./components/contact-qr-page";
import { WifiQrPage } from "./components/wifi-qr-page";
import { FileQrPage } from "./components/file-qr-page";
import { MultiLinkQrPage } from "./components/multi-link-qr-page";
import { InvalidQrPage } from "./components/invalid-qr-page";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_TIERS,
} from "@/lib/security/rate-limit";

interface Props {
  params: Promise<{ shortCode: string }>;
}

/** Cheap format check for shortCode — rejects paths that could never be valid. */
const SHORT_CODE_PATTERN = /^[A-Za-z0-9_-]{4,32}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortCode } = await params;
  if (!SHORT_CODE_PATTERN.test(shortCode)) return { title: "QR Code Not Found" };

  const lookup = await getPublicQr(shortCode);
  if (lookup.status === "missing") return { title: "QR Code Not Found" };
  if (lookup.status === "inactive") return { title: `QR — ${lookup.qr.status.charAt(0)}${lookup.qr.status.slice(1).toLowerCase()}` };
  return {
    title: lookup.qr.name,
    description: `Scan this QR code to visit ${lookup.qr.name}`,
  };
}

export default async function PublicQrPage({ params }: Props) {
  const { shortCode } = await params;

  // 1. Validate shortCode format (spec §11.1)
  if (!SHORT_CODE_PATTERN.test(shortCode)) notFound();

  // Rate limit public scans to prevent log-stuffing DoS
  const headerStore = await headers();
  const ip = getClientIp(headerStore);
  const rateLimit = await checkRateLimit(
    `scan:${ip}`,
    RATE_LIMIT_TIERS.PUBLIC_SCAN.limit,
    RATE_LIMIT_TIERS.PUBLIC_SCAN.windowMs
  );
  if (!rateLimit.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Too Many Requests</h1>
          <p className="text-neutral-600">
            Please wait a moment before scanning again.
          </p>
        </div>
      </div>
    );
  }

  // 2–4. Lookup: missing → 404, inactive → unavailable page, active → resolve
  const lookup = await getPublicQr(shortCode);
  if (lookup.status === "missing") notFound();
  if (lookup.status === "inactive") return <InactiveQrPage qr={lookup.qr} />;

  // 5–6. Record scan analytics (spec §11.6) — fire-and-forget, never blocks
  const { qr } = lookup;
  recordScanFromHeaders(qr.id, headerStore, headerStore.get("referer")).catch(() => {});

  // 7. Resolve based on type (spec §11.7)
  const action = resolveQr(qr);

  // 8. Redirect or render (spec §11.8)
  switch (action.kind) {
    case "redirect":
      redirect(action.url, "replace");
    case "render": {
      switch (action.component) {
        case "text":
          return <TextQrPage qr={qr} />;
        case "contact":
          return <ContactQrPage qr={qr} />;
        case "wifi":
          return <WifiQrPage qr={qr} />;
        case "file": {
          // Phase 5: redirect to the file download endpoint (auth-gated)
          const fileId = (qr.data as Record<string, unknown>)?.fileId as string | undefined;
          if (fileId) redirect(`/api/file/${fileId}`, "replace");
          return <FileQrPage qr={qr} />;
        }
        case "multi-link": {
          const { getMultiLinkPageByQrId } = await import("@/lib/multi-link/service");
          const page = await getMultiLinkPageByQrId(qr.id);
          return <MultiLinkQrPage qr={qr} page={page} />;
        }
      }
    }
    case "invalid":
      return <InvalidQrPage qr={qr} reason={action.reason} />;
  }
}
