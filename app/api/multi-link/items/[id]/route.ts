import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  updateMultiLinkItem,
  deleteMultiLinkItem,
  multiLinkItemSchema,
} from "@/lib/multi-link/service";

type RouteParams = { params: Promise<{ id: string }> };

/** PUT /api/multi-link/items/[id] — update a single item */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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

  const parsed = multiLinkItemSchema.partial().safeParse(body);
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

  const result = await updateMultiLinkItem(id, session.user.id, parsed.data);
  if (!result.success) {
    const status = result.error.code === "FORBIDDEN" ? 403 : 404;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: { item: result.data } });
}

/** DELETE /api/multi-link/items/[id] — delete a single item */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const result = await deleteMultiLinkItem(id, session.user.id);
  if (!result.success) {
    const status = result.error.code === "FORBIDDEN" ? 403 : 404;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: { item: result.data } });
}