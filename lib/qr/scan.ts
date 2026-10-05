import { prisma } from "@/lib/db/prisma";

export function parseUserAgent(ua: string): { deviceType: string; browser: string; os: string } {
  const uaLower = ua.toLowerCase();
  let deviceType = "desktop";
  if (/mobile|android|iphone|ipad/i.test(ua)) deviceType = /tablet|ipad/i.test(ua) ? "tablet" : "mobile";

  let browser = "Unknown";
  if (/edg\//i.test(uaLower) || /edge\//i.test(uaLower)) browser = "Edge";
  else if (/opr\/|opera/i.test(uaLower)) browser = "Opera";
  else if (/chrome\//i.test(uaLower) || /crios\//i.test(uaLower)) browser = "Chrome";
  else if (/firefox\//i.test(uaLower) || /fxios\//i.test(uaLower)) browser = "Firefox";
  else if (/safari/i.test(uaLower)) browser = "Safari";

  let os = "Unknown";
  if (/windows/i.test(uaLower)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(uaLower)) os = "iOS";
  else if (/android/i.test(uaLower)) os = "Android";
  else if (/mac os x|macintosh/i.test(uaLower)) os = "macOS";
  else if (/linux/i.test(uaLower)) os = "Linux";

  return { deviceType, browser, os };
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? null;
}

export async function recordScan(
  qrCodeId: string,
  request: Request,
  referer: string | null
): Promise<void> {
  const ua = request.headers.get("user-agent") ?? "";
  const ip = getClientIp(request);
  const { deviceType, browser, os } = parseUserAgent(ua);

  try {
    await prisma.scanEvent.create({
      data: {
        qrCodeId,
        ipAddress: ip,
        deviceType,
        browser,
        os,
        referer: referer ?? null,
        scannedAt: new Date(),
      },
    });
  } catch {
    // Don't fail the redirect if scan recording fails
  }
}

/**
 * Record a scan from plain header values (used by server components,
 * where a raw `Request` object isn't available). Mirrors `recordScan`.
 */
export async function recordScanFromHeaders(
  qrCodeId: string,
  headers: Headers,
  referer: string | null
): Promise<void> {
  const reqLike = {
    headers: {
      get: (name: string) => headers.get(name),
    },
  } as unknown as Request;
  await recordScan(qrCodeId, reqLike, referer);
}