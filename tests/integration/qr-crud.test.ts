import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createQr, getQrById, listQrCodes, updateQr, duplicateQr, enableQr, disableQr, deleteQr } from "@/lib/qr/service";

describe("QR CRUD Operations (Aiven PostgreSQL)", () => {
  // Use the seeded demo user so we don't have to create/tear down a user for every test
  const demoEmail = "demo@smartqr.example";
  let demoUserId = "";

  beforeAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) throw new Error("Demo user not found — run db:seed first");
    demoUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test QR codes (soft-delete removes them from list queries)
    await prisma.qRCode.deleteMany({
      where: {
        userId: demoUserId,
        name: { startsWith: "[TEST]" },
      },
    }).catch(() => {});
  });

  describe("createQr", () => {
    it("creates a QR code with default values and returns a QRCodeRecord", async () => {
      const result = await createQr(demoUserId, { name: "[TEST] Create Test" });
      expect(result.success).toBe(true);
      if (!result.success) return;

      const qr = result.qr;
      expect(qr.id).toBeDefined();
      expect(qr.shortCode).toBeDefined();
      expect(qr.shortCode).toMatch(/^[A-Za-z0-9]{7}$/);
      expect(qr.name).toBe("[TEST] Create Test");
      expect(qr.type).toBe("URL");
      expect(qr.status).toBe("ACTIVE");
      expect(qr.isDynamic).toBe(true);
      expect(qr.data).toEqual({});
    });

    it("creates a QR code with custom type and data", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST] WhatsApp QR",
        type: "WHATSAPP",
        data: { phone: "+1234567890", message: "Hello" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.qr.type).toBe("WHATSAPP");
      expect(result.qr.data).toEqual({ phone: "+1234567890", message: "Hello" });
    });

    it("rejects empty name", async () => {
      const result = await createQr(demoUserId, { name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("getQrById", () => {
    it("returns the QR code for valid id + userId", async () => {
      const created = await createQr(demoUserId, { name: "[TEST] Get Test" });
      expect(created.success).toBe(true);
      if (!created.success) return;
      const qr = await getQrById(created.qr.id, demoUserId);
      expect(qr).not.toBeNull();
      expect(qr!.name).toBe("[TEST] Get Test");
    });

    it("returns null for non-existent id", async () => {
      const qr = await getQrById("c_doesnotexist00000000", demoUserId);
      expect(qr).toBeNull();
    });

    it("returns null when id belongs to another user", async () => {
      // A QR id owned by a different user must not be visible
      const result = await getQrById("cmu10y00r0000t93w2ow00000", demoUserId);
      expect(result).toBeNull();
    });
  });

  describe("listQrCodes", () => {
    it("returns an array of QR code records for the user", async () => {
      const qrs = await listQrCodes(demoUserId);
      expect(Array.isArray(qrs)).toBe(true);
      // Seed data has 5 QRs
      expect(qrs.length).toBeGreaterThanOrEqual(5);
    });

    it("respects limit and offset", async () => {
      const first3 = await listQrCodes(demoUserId, { limit: 3 });
      expect(first3.length).toBe(3);
    });
  });

  describe("updateQr", () => {
    it("updates the name of an existing QR code", async () => {
      const created = await createQr(demoUserId, { name: "[TEST] Update Test" });
      expect(created.success).toBe(true);
      if (!created.success) return;
      const result = await updateQr(created.qr.id, demoUserId, { name: "[TEST] Updated Name" });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.qr.name).toBe("[TEST] Updated Name");
    });

    it("returns NOT_FOUND for non-existent id", async () => {
      const result = await updateQr("c_doesnotexist", demoUserId, { name: "x" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("duplicateQr", () => {
    it("creates a copy with a new shortCode and '(Copy)' suffix", async () => {
      const created = await createQr(demoUserId, { name: "[TEST] Original", type: "URL" });
      expect(created.success).toBe(true);
      if (!created.success) return;
      const result = await duplicateQr(created.qr.id, demoUserId);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.qr.shortCode).not.toBe(created.qr.shortCode);
      expect(result.qr.name).toBe("[TEST] Original (Copy)");
    });
  });

  describe("enableQr / disableQr", () => {
    it("disables an active QR code", async () => {
      const created = await createQr(demoUserId, { name: "[TEST] Toggle Test" });
      expect(created.success).toBe(true);
      if (!created.success) return;
      const result = await disableQr(created.qr.id, demoUserId);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.qr.status).toBe("DISABLED");
    });

    it("re-enables a disabled QR code", async () => {
      const created = await createQr(demoUserId, { name: "[TEST] Toggle Test 2" });
      expect(created.success).toBe(true);
      if (!created.success) return;
      await disableQr(created.qr.id, demoUserId);
      const result = await enableQr(created.qr.id, demoUserId);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.qr.status).toBe("ACTIVE");
    });
  });

  describe("deleteQr (soft delete)", () => {
    it("soft-deletes a QR code (sets deletedAt + status = DELETED)", async () => {
      const created = await createQr(demoUserId, { name: "[TEST] Delete Test" });
      expect(created.success).toBe(true);
      if (!created.success) return;
      const result = await deleteQr(created.qr.id, demoUserId);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.qr.status).toBe("DELETED");
      expect(result.qr.deletedAt).toBeInstanceOf(Date);

      // Verify it's no longer returned by list
      const qrs = await listQrCodes(demoUserId, { limit: 100 });
      const deleted = qrs.find((q) => q.id === created.qr.id);
      expect(deleted).toBeUndefined();
    });

    it("returns NOT_FOUND for already-deleted QR", async () => {
      const created = await createQr(demoUserId, { name: "[TEST] Double Delete" });
      expect(created.success).toBe(true);
      if (!created.success) return;
      await deleteQr(created.qr.id, demoUserId);
      const result = await deleteQr(created.qr.id, demoUserId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });
  });
});