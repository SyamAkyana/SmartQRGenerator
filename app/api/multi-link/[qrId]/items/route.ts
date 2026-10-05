import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getMultiLinkPageByQrId,
  upsertMultiLinkItems,
  multiLinkItemsSchema,
} from "@/lib/multi-link/service";

type RouteParams = { params: Promise<{ qrId: string }> };

/** GET /api/multi-link/[qrId]/items — list items for a page */
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

  return NextResponse.json({ success: true, data: { items: page.items } });
}

/** PUT /api/multi-link/[qrId]/items — bulk upsert items */
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

  const parsed = multiLinkItemsSchema.safeParse(body);
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

  // Get page ID from qrId
  const page = await getMultiLinkPageByQrId(qrId);
  if (!page) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Page not found" } },
      { status: 404 }
    );
  }

  const result = await upsertMultiLinkItems(page.id, session.user.id, parsed.data.items);
  if (!result.success) {
    const status = result.error.code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: { items: result.data } });
}