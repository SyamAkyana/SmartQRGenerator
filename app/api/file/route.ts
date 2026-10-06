// app/api/file/route.ts
// POST /api/file — upload a file (multipart/form-data, max 10 MB)
// GET  /api/file — list all files for the authenticated user

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { storeFile, listFiles, countFiles } from "@/lib/file/service";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_TIERS,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** POST /api/file — upload a file */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const ip = getClientIp(req.headers);
  const rateLimit = await checkRateLimit(
    `file:upload:${session.user.id}:${ip}`,
    RATE_LIMIT_TIERS.FILE_UPLOAD.limit,
    RATE_LIMIT_TIERS.FILE_UPLOAD.windowMs
  );
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetAt, rateLimit.limit, rateLimit.remaining);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Expected multipart/form-data" } },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "No file provided" } },
      { status: 400 },
    );
  }

  // Read file bytes — max 10 MB + small safety margin
  const buffer = Buffer.from(await file.arrayBuffer());

  // Use the user-supplied name (optional "name" field) or the original filename
  const displayName = (formData.get("name") as string) || file.name || "upload";

  const result = await storeFile(session.user.id, buffer, file.type, displayName);

  if (!result.success) {
    const status = result.error.code === "PAYLOAD_TOO_LARGE" ? 413
      : result.error.code === "UNSUPPORTED_TYPE" ? 415
      : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: { file: result.file } }, { status: 201 });
}

/** GET /api/file — list all files for the authenticated user */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const files = await listFiles(session.user.id, { limit, offset });
  const total = await countFiles(session.user.id);

  return NextResponse.json({ success: true, data: { files, total } });
}
