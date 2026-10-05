import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDesign, upsertDesign, type DesignData } from "@/lib/qr/design";
import { getQrById } from "@/lib/qr/service";

type RouteParams = { params: Promise<{ id: string }> };

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
  const design = await getDesign(id);
  return NextResponse.json({ success: true, data: { design } });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
  let body: Partial<DesignData>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: { code: "INVALID_JSON", message: "Invalid JSON body" } }, { status: 400 });
  }
  const result = await upsertDesign(id, session.user.id, body);
  if (!result.success) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true, data: { design: result.design } });
}