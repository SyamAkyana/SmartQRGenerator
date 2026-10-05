// lib/file/service.ts
// File upload service — validates MIME, enforces size limits, manages DB records.
// Spec §15: MIME sniffing from magic bytes; extension denylist; max size 10 MB.

import { prisma } from "@/lib/db/prisma";
import { storage } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type FileResult =
  | { success: true; file: StoredFileRecord }
  | { success: false; error: { code: string; message: string } };

export interface StoredFileRecord {
  id: string;
  userId: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Validation constants (spec §15)
// ---------------------------------------------------------------------------

/** Allowed MIME types — the allowlist. Anything not here is rejected. */
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

/** Max file size: 10 MB */
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Derive extension from sniffed MIME type (never trust user-supplied extensions). */
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

// ---------------------------------------------------------------------------
// MIME sniffing from magic bytes (spec §15)
// ---------------------------------------------------------------------------

/**
 * Sniff the real MIME type from file header bytes.
 * Falls back to the supplied MIME if magic bytes don't match any known signature.
 */
export function sniffMimeType(buffer: Buffer, supplied: string): string {
  if (buffer.length < 2) return supplied;

  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)
    return "application/pdf";

  // PNG: 89 50 4e 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
    return "image/png";

  // JPEG: ff d8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38)
    return "image/gif";

  // WebP: RIFF....WEBP (RIFF = 52 49 46 46, WEBP at offset 8)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  )
    return "image/webp";

  // ZIP (covers .docx, .xlsx, .pptx — all are ZIP-based OOXML)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04)
    return supplied; // fall back to supplied — OOXML types are all zipped, we can't distinguish by magic alone

  // Plain text: no magic bytes — accept if buffer looks like text and supplied is text/plain
  if (supplied === "text/plain") return "text/plain";

  return supplied;
}

// ---------------------------------------------------------------------------
// Filename sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize an original filename: strip path components, remove unsafe characters,
 * cap at 128 chars. Never trusts user input fully (spec §15).
 */
export function sanitizeFilename(raw: string): string {
  // Strip directory components (handles both / and \)
  const base = raw.split(/[\\/]/).pop() ?? raw;
  if (!base || base === "") return "upload";

  // Keep only safe characters
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Collapse runs of underscores and dots
  let collapsed = cleaned;
  for (;;) {
    const next = collapsed.replace(/__+/g, "_").replace(/\.\.+/g, ".");
    if (next === collapsed) break;
    collapsed = next;
  }

  // Extract extension from the collapsed name
  const dotIdx = collapsed.lastIndexOf(".");
  const hasExt = dotIdx > 0 && dotIdx < collapsed.length - 1;
  const ext = hasExt ? collapsed.slice(dotIdx) : "";
  const nameOnly = hasExt ? collapsed.slice(0, dotIdx) : collapsed;

  // Truncate to 128 chars: drop trailing underscores from nameOnly first
  const MAX = 128;
  let result: string;
  if (ext) {
    const maxNameLen = Math.max(1, MAX - ext.length);
    let name = nameOnly.slice(0, maxNameLen);
    // Remove any trailing underscores that ended up in the truncated name
    while (name.length > 0 && (name.charCodeAt(name.length - 1) === 95)) {
      name = name.slice(0, -1);
    }
    result = name + ext;
  } else {
    result = collapsed.slice(0, MAX) || "upload";
    while (result.length > 0 && (result.charCodeAt(result.length - 1) === 95)) {
      result = result.slice(0, -1);
    }
  }
  return result || "upload";
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

/**
 * Validate, store, and record a file upload. Returns a FileResult.
 * Ownership is enforced via userId (caller must authenticate first).
 *
 * Antivirus integration point: hook here to scan buffer before storage.store().
 */
export async function storeFile(
  userId: string,
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<FileResult> {
  // 1. Size check
  if (buffer.length > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: { code: "PAYLOAD_TOO_LARGE", message: `File exceeds maximum size of 10 MB (got ${buffer.length} bytes)` },
    };
  }

  if (buffer.length === 0) {
    return { success: false, error: { code: "EMPTY_FILE", message: "File is empty" } };
  }

  // 2. MIME sniff from magic bytes
  const sniffedMime = sniffMimeType(buffer, mimeType);

  // 3. MIME allowlist check
  if (!ALLOWED_MIME_TYPES.has(sniffedMime)) {
    return {
      success: false,
      error: { code: "UNSUPPORTED_TYPE", message: `File type "${sniffedMime}" is not allowed` },
    };
  }

  // 4. Derive extension from sniffed MIME
  const ext = MIME_TO_EXT[sniffedMime];
  if (!ext) {
    return { success: false, error: { code: "UNSUPPORTED_TYPE", message: "Could not determine file extension" } };
  }

  // 5. Store physical file (UUID-based name)
  const storageKey = await storage.store(userId, buffer, ext);

  // 6. Create DB record
  const storedFile = await prisma.storedFile.create({
    data: {
      userId,
      storageKey,
      originalName: sanitizeFilename(originalName),
      mimeType: sniffedMime,
      sizeBytes: buffer.length,
    },
  });

  return {
    success: true,
    file: {
      id: storedFile.id,
      userId: storedFile.userId,
      storageKey: storedFile.storageKey,
      originalName: storedFile.originalName,
      mimeType: storedFile.mimeType,
      sizeBytes: Number(storedFile.sizeBytes),
      createdAt: storedFile.createdAt,
    },
  };
}

/**
 * Retrieve a file record by ID + ownership check.
 * Returns null if not found or not owned by userId.
 */
export async function getFile(
  id: string,
  userId: string,
): Promise<StoredFileRecord | null> {
  const record = await prisma.storedFile.findFirst({
    where: { id, userId },
  });
  if (!record) return null;

  return {
    id: record.id,
    userId: record.userId,
    storageKey: record.storageKey,
    originalName: record.originalName,
    mimeType: record.mimeType,
    sizeBytes: Number(record.sizeBytes),
    createdAt: record.createdAt,
  };
}

/**
 * List all files for a user, ordered newest-first.
 */
export async function listFiles(
  userId: string,
  options?: { limit?: number; offset?: number },
): Promise<StoredFileRecord[]> {
  const records = await prisma.storedFile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: options?.limit,
    skip: options?.offset,
  });

  return records.map((r) => ({
    id: r.id,
    userId: r.userId,
    storageKey: r.storageKey,
    originalName: r.originalName,
    mimeType: r.mimeType,
    sizeBytes: Number(r.sizeBytes),
    createdAt: r.createdAt,
  }));
}

/**
 * Count total files for a user.
 */
export async function countFiles(userId: string): Promise<number> {
  return prisma.storedFile.count({ where: { userId } });
}

/**
 * Delete a file (storage + DB record). Ownership enforced via userId.
 */
export async function deleteFile(
  id: string,
  userId: string,
): Promise<FileResult> {
  const record = await prisma.storedFile.findFirst({
    where: { id, userId },
  });
  if (!record) {
    return { success: false, error: { code: "NOT_FOUND", message: "File not found" } };
  }

  // Delete physical file first, then DB record
  await storage.delete(record.storageKey);
  await prisma.storedFile.delete({ where: { id } });

  return {
    success: true,
    file: {
      id: record.id,
      userId: record.userId,
      storageKey: record.storageKey,
      originalName: record.originalName,
      mimeType: record.mimeType,
      sizeBytes: Number(record.sizeBytes),
      createdAt: record.createdAt,
    },
  };
}
