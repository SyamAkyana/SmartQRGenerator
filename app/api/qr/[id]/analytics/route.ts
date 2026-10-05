/**
 * GET /api/qr/:id/analytics
 * Returns scan stats for a specific QR code (owner-only).
 * Spec §26 — Analytics API.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQrById } from "@/lib/qr/service";
import { getScanStats, getScanBreakdown, getRecentScans } from "@/lib/qr/analytics";
import { z } from "zod";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Must be logged in" } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid days parameter" } },
      { status: 400 }
    );
  }
  const days = parsed.data.days;

  const qr = await getQrById(id, session.user.id);
  if (!qr) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "QR code not found" } },
      { status: 404 }
    );
  }

  const qrId = qr.id;
  const [stats, recentScans, deviceBreakdown, browserBreakdown, osBreakdown] = await Promise.all([
    getScanStats(qrId, days),
    getRecentScans(qrId, 20),
    getScanBreakdown(qrId, "deviceType"),
    getScanBreakdown(qrId, "browser"),
    getScanBreakdown(qrId, "os"),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      stats,
      recentScans,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
    },
  });
}