import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteQr, getQrById, updateQr } from "@/lib/qr/service";
import { updateQrSchema } from "@/lib/qr/types";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_TIERS,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/qr/[id] — get a single QR code (ownership enforced) */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const qr = await getQrById(id, session.user.id);
  if (!qr) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QR code not found" } }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { qr } });
}

/** PUT /api/qr/[id] — update a QR code */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const rateLimit = await checkRateLimit(
    `qr:update:${session.user.id}:${ip}`,
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

  const parsed = updateQrSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 422 }
    );
  }

  const result = await updateQr(id, session.user.id, parsed.data);
  if (!result.success) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: { qr: result.qr } });
}

/** DELETE /api/qr/[id] — soft-delete a QR code */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const rateLimit = await checkRateLimit(
    `qr:delete:${session.user.id}:${ip}`,
    RATE_LIMIT_TIERS.QR_MUTATION.limit,
    RATE_LIMIT_TIERS.QR_MUTATION.windowMs
  );
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetAt, rateLimit.limit, rateLimit.remaining);
  }

  const result = await deleteQr(id, session.user.id);
  if (!result.success) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: { qr: result.qr } });
}
