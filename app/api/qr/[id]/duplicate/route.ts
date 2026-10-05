import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { duplicateQr } from "@/lib/qr/service";

type RouteParams = { params: Promise<{ id: string }> };

/** POST /api/qr/[id]/duplicate — duplicate a QR code */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const result = await duplicateQr(id, session.user.id);
  if (!result.success) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: { qr: result.qr } }, { status: 201 });
}