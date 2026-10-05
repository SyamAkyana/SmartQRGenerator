import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createQr, listQrCodes } from "@/lib/qr/service";
import { createQrSchema } from "@/lib/qr/types";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_TIERS,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

/** GET /api/qr — list all QR codes for the authenticated user */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const qrs = await listQrCodes(session.user.id, { limit, offset });
  return NextResponse.json({ success: true, data: { qrCodes: qrs } });
}

/** POST /api/qr — create a new QR code */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const rateLimit = await checkRateLimit(
    `qr:create:${session.user.id}:${ip}`,
    RATE_LIMIT_TIERS.QR_MUTATION.limit,
    RATE_LIMIT_TIERS.QR_MUTATION.windowMs
  );
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetAt, rateLimit.limit, rateLimit.remaining);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const parsed = createQrSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 422 }
    );
  }

  const result = await createQr(session.user.id, parsed.data);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { qr: result.qr } }, { status: 201 });
}
