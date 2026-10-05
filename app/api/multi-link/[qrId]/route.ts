import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getMultiLinkPageByQrId,
  updateMultiLinkPage,
  updateMultiLinkPageSchema,
} from "@/lib/multi-link/service";

type RouteParams = { params: Promise<{ qrId: string }> };

/** GET /api/multi-link/[qrId] — get page metadata + items */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { qrId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const page = await getMultiLinkPageByQrId(qrId);
  if (!page) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Page not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { page } });
}

/** PUT /api/multi-link/[qrId] — update page metadata */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { qrId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = updateMultiLinkPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      },
      { status: 422 }
    );
  }

  const result = await updateMultiLinkPage(qrId, session.user.id, parsed.data);
  if (!result.success) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: { page: result.data } });
}