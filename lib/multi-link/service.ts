import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// URL safety — block dangerous schemes before they reach href attributes
// ---------------------------------------------------------------------------

const DANGEROUS_SCHEMES = [
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
] as const;

export function isSafeUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || /[\x00-\x1F\x7F]/.test(trimmed)) return false;
  if (/^\s*(javascript|data|vbscript|file):/i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    const scheme = parsed.protocol.toLowerCase();
    if (DANGEROUS_SCHEMES.some((s) => scheme.startsWith(s))) return false;
    return ["http:", "https:", "mailto:", "tel:"].includes(scheme);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const multiLinkItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required").max(100),
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
  icon: z.string().nullish(),
  sortOrder: z.number().int().optional(),
  enabled: z.boolean().optional(),
});

export const updateMultiLinkPageSchema = z.object({
  title: z.string().max(200).nullish(),
  description: z.string().max(500).nullish(),
  theme: z.enum(["default", "minimal", "dark"]).optional(),
});

export const multiLinkItemsSchema = z.object({
  items: z.array(multiLinkItemSchema),
});

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type MultiLinkPageRecord = {
  id: string;
  qrCodeId: string;
  title: string | null;
  description: string | null;
  theme: string;
  logoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MultiLinkItemRecord = {
  id: string;
  pageId: string;
  label: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  enabled: boolean;
};

export type PageWithItems = MultiLinkPageRecord & {
  items: MultiLinkItemRecord[];
};

export type PageResult =
  | { success: true; data: PageWithItems }
  | { success: false; error: { code: string; message: string } };

export type ItemsResult =
  | { success: true; data: MultiLinkItemRecord[] }
  | { success: false; error: { code: string; message: string } };

export type ItemResult =
  | { success: true; data: MultiLinkItemRecord }
  | { success: false; error: { code: string; message: string } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Verify ownership by checking qrCode.userId */
async function verifyOwnership(pageId: string, userId: string): Promise<boolean> {
  const page = await prisma.multiLinkPage.findFirst({
    where: {
      id: pageId,
      qrCode: { userId },
    },
  });
  return page !== null;
}

// ---------------------------------------------------------------------------
// Page operations
// ---------------------------------------------------------------------------

/**
 * Get a multi-link page with all its items ordered by sortOrder.
 */
export async function getMultiLinkPageByQrId(qrId: string): Promise<PageWithItems | null> {
  const page = await prisma.multiLinkPage.findUnique({
    where: { qrCodeId: qrId },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!page) return null;
  return {
    id: page.id,
    qrCodeId: page.qrCodeId,
    title: page.title,
    description: page.description,
    theme: page.theme,
    logoFileId: page.logoFileId,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    items: page.items.map((item) => ({
      id: item.id,
      pageId: item.pageId,
      label: item.label,
      url: item.url,
      icon: item.icon,
      sortOrder: item.sortOrder,
      enabled: item.enabled,
    })),
  };
}

/**
 * Create an empty multi-link page for a given QR code.
 * Returns the created page ID.
 */
export async function createMultiLinkPage(qrId: string): Promise<string> {
  const page = await prisma.multiLinkPage.create({
    data: {
      qrCodeId: qrId,
    },
  });
  return page.id;
}

/**
 * Update page metadata (title, description, theme).
 * Ownership is verified via qrCode.userId.
 */
export async function updateMultiLinkPage(
  qrId: string,
  userId: string,
  data: { title?: string | null; description?: string | null; theme?: string }
): Promise<PageResult> {
  // Verify ownership
  const owner = await prisma.qRCode.findFirst({
    where: { id: qrId, userId },
  });
  if (!owner) {
    return { success: false, error: { code: "NOT_FOUND", message: "Page not found" } };
  }

  const page = await prisma.multiLinkPage.findUnique({
    where: { qrCodeId: qrId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!page) {
    return { success: false, error: { code: "NOT_FOUND", message: "Page not found" } };
  }

  const updated = await prisma.multiLinkPage.update({
    where: { id: page.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.theme !== undefined && { theme: data.theme }),
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return {
    success: true,
    data: {
      id: updated.id,
      qrCodeId: updated.qrCodeId,
      title: updated.title,
      description: updated.description,
      theme: updated.theme,
      logoFileId: updated.logoFileId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      items: updated.items.map((item) => ({
        id: item.id,
        pageId: item.pageId,
        label: item.label,
        url: item.url,
        icon: item.icon,
        sortOrder: item.sortOrder,
        enabled: item.enabled,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Item operations
// ---------------------------------------------------------------------------

/**
 * Get all items for a page ordered by sortOrder.
 */
export async function getMultiLinkItems(pageId: string): Promise<MultiLinkItemRecord[]> {
  const items = await prisma.multiLinkItem.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
  });
  return items.map((item) => ({
    id: item.id,
    pageId: item.pageId,
    label: item.label,
    url: item.url,
    icon: item.icon,
    sortOrder: item.sortOrder,
    enabled: item.enabled,
  }));
}

/**
 * Add a new item to a page.
 * Ownership is verified via page.qrCode.userId.
 */
export async function addMultiLinkItem(
  pageId: string,
  userId: string,
  data: { label: string; url: string; icon?: string }
): Promise<ItemResult> {
  if (!isSafeUrl(data.url)) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "URL uses a forbidden protocol" } };
  }

  const valid = await verifyOwnership(pageId, userId);
  if (!valid) {
    return { success: false, error: { code: "FORBIDDEN", message: "Not authorized to modify this page" } };
  }

  // Get max sortOrder
  const maxItem = await prisma.multiLinkItem.findFirst({
    where: { pageId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (maxItem?.sortOrder ?? -1) + 1;

  const item = await prisma.multiLinkItem.create({
    data: {
      pageId,
      label: data.label,
      url: data.url,
      icon: data.icon ?? null,
      sortOrder,
    },
  });

  return {
    success: true,
    data: {
      id: item.id,
      pageId: item.pageId,
      label: item.label,
      url: item.url,
      icon: item.icon,
      sortOrder: item.sortOrder,
      enabled: item.enabled,
    },
  };
}

/**
 * Update a single item.
 * Ownership is verified via page.qrCode.userId.
 */
export async function updateMultiLinkItem(
  id: string,
  userId: string,
  data: { label?: string; url?: string; icon?: string | null; sortOrder?: number; enabled?: boolean }
): Promise<ItemResult> {
  if (data.url !== undefined && !isSafeUrl(data.url)) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "URL uses a forbidden protocol" } };
  }

  const existing = await prisma.multiLinkItem.findUnique({
    where: { id },
    include: { page: { include: { qrCode: true } } },
  });
  if (!existing || existing.page.qrCode.userId !== userId) {
    return { success: false, error: { code: "FORBIDDEN", message: "Not authorized to modify this item" } };
  }

  const updated = await prisma.multiLinkItem.update({
    where: { id },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.enabled !== undefined && { enabled: data.enabled }),
    },
  });

  return {
    success: true,
    data: {
      id: updated.id,
      pageId: updated.pageId,
      label: updated.label,
      url: updated.url,
      icon: updated.icon,
      sortOrder: updated.sortOrder,
      enabled: updated.enabled,
    },
  };
}

/**
 * Delete a single item.
 * Ownership is verified via page.qrCode.userId.
 */
export async function deleteMultiLinkItem(id: string, userId: string): Promise<ItemResult> {
  const existing = await prisma.multiLinkItem.findUnique({
    where: { id },
    include: { page: { include: { qrCode: true } } },
  });
  if (!existing || existing.page.qrCode.userId !== userId) {
    return { success: false, error: { code: "FORBIDDEN", message: "Not authorized to delete this item" } };
  }

  await prisma.multiLinkItem.delete({ where: { id } });

  return {
    success: true,
    data: {
      id: existing.id,
      pageId: existing.pageId,
      label: existing.label,
      url: existing.url,
      icon: existing.icon,
      sortOrder: existing.sortOrder,
      enabled: existing.enabled,
    },
  };
}

/**
 * Bulk upsert items: delete removed ones, update existing, create new.
 * Ownership is verified via page.qrCode.userId.
 */
export async function upsertMultiLinkItems(
  pageId: string,
  userId: string,
  items: Array<{ id?: string; label: string; url: string; icon?: string | null; sortOrder?: number; enabled?: boolean }>
): Promise<ItemsResult> {
  // Validate all URLs before any DB writes
  for (const item of items) {
    if (!isSafeUrl(item.url)) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: `URL "${item.url}" uses a forbidden protocol` } };
    }
  }

  const valid = await verifyOwnership(pageId, userId);
  if (!valid) {
    return { success: false, error: { code: "FORBIDDEN", message: "Not authorized to modify this page" } };
  }

  // Get current item IDs
  const currentItems = await prisma.multiLinkItem.findMany({
    where: { pageId },
    select: { id: true },
  });
  const currentIds = new Set(currentItems.map((i) => i.id));

  // Determine which to keep/create/update
  const submittedIds = new Set(items.filter((i) => i.id).map((i) => i.id as string));
  const toDelete = [...currentIds].filter((id) => !submittedIds.has(id));

  // Delete removed items
  if (toDelete.length > 0) {
    await prisma.multiLinkItem.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  // Upsert each submitted item
  const results: MultiLinkItemRecord[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sortOrder = item.sortOrder ?? i;
    if (item.id && currentIds.has(item.id)) {
      // Update existing
      const updated = await prisma.multiLinkItem.update({
        where: { id: item.id },
        data: {
          label: item.label,
          url: item.url,
          icon: item.icon ?? null,
          sortOrder,
          ...(item.enabled !== undefined && { enabled: item.enabled }),
        },
      });
      results.push({
        id: updated.id,
        pageId: updated.pageId,
        label: updated.label,
        url: updated.url,
        icon: updated.icon,
        sortOrder: updated.sortOrder,
        enabled: updated.enabled,
      });
    } else {
      // Create new
      const created = await prisma.multiLinkItem.create({
        data: {
          pageId,
          label: item.label,
          url: item.url,
          icon: item.icon ?? null,
          sortOrder,
          enabled: item.enabled ?? true,
        },
      });
      results.push({
        id: created.id,
        pageId: created.pageId,
        label: created.label,
        url: created.url,
        icon: created.icon,
        sortOrder: created.sortOrder,
        enabled: created.enabled,
      });
    }
  }

  return { success: true, data: results };
}

/**
 * Reorder items by updating sortOrder for each item.
 * Ownership is verified via page.qrCode.userId.
 */
export async function reorderMultiLinkItems(
  pageId: string,
  userId: string,
  itemIds: string[]
): Promise<ItemsResult> {
  const valid = await verifyOwnership(pageId, userId);
  if (!valid) {
    return { success: false, error: { code: "FORBIDDEN", message: "Not authorized to modify this page" } };
  }

  // Update sortOrder for each item
  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.multiLinkItem.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  const items = await getMultiLinkItems(pageId);
  return { success: true, data: items };
}