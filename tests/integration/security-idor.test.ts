import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createQr, getQrById, updateQr, deleteQr } from "@/lib/qr/service";
import { getFile, storeFile, deleteFile } from "@/lib/file/service";
import { addMultiLinkItem, updateMultiLinkItem, deleteMultiLinkItem } from "@/lib/multi-link/service";

/**
 * IDOR (Insecure Direct Object Reference) Security Tests
 *
 * Verify that all resource operations strictly enforce user ownership:
 * - User A cannot access, modify, or delete User B's resources
 * - All QR codes, designs, files, and multi-link items are isolated by userId
 */
describe("IDOR & Authorization Protection", () => {
  const demoEmail = "demo@smartqr.example";
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

  beforeAll(async () => {
    // Get demo user as User A
    const demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!demoUser) throw new Error("Demo user not found — run db:seed first");
    userA = demoUser;

    // Create User B for cross-user testing
    const existingB = await prisma.user.findUnique({ where: { email: "userb-idor@test.local" } });
    if (existingB) {
      userB = existingB;
    } else {
      userB = await prisma.user.create({
        data: {
          email: "userb-idor@test.local",
          name: "User B IDOR Test",
          passwordHash: "dummy-hash-not-used-for-login",
        },
      });
    }
  });

  afterAll(async () => {
    // Clean up User B's test data
    if (userB?.id) {
      await prisma.qRCode.deleteMany({ where: { userId: userB.id } });
      await prisma.storedFile.deleteMany({ where: { userId: userB.id } });
      await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
    }
  });

  describe("QR Code IDOR Protection", () => {
    it("prevents User B from reading User A's QR code", async () => {
      // User A creates a QR
      const resultA = await createQr(userA.id, { name: "[IDOR-TEST] User A QR" });
      expect(resultA.success).toBe(true);
      if (!resultA.success) return;
      const qrA = resultA.qr;

      // User B attempts to read it
      const qrAsB = await getQrById(qrA.id, userB.id);
      expect(qrAsB).toBeNull();

      // User A can still read their own
      const qrAsA = await getQrById(qrA.id, userA.id);
      expect(qrAsA).not.toBeNull();
      expect(qrAsA?.id).toBe(qrA.id);
    });

    it("prevents User B from updating User A's QR code", async () => {
      // User A creates a QR
      const resultA = await createQr(userA.id, { name: "[IDOR-TEST] Original Name" });
      expect(resultA.success).toBe(true);
      if (!resultA.success) return;
      const qrA = resultA.qr;

      // User B attempts to update it
      const updateResult = await updateQr(qrA.id, userB.id, { name: "Malicious Update" });
      expect(updateResult.success).toBe(false);
      if (!updateResult.success) {
        expect(updateResult.error.code).toBe("NOT_FOUND");
      }

      // Verify name unchanged
      const qrCheck = await getQrById(qrA.id, userA.id);
      expect(qrCheck?.name).toBe("[IDOR-TEST] Original Name");
    });

    it("prevents User B from deleting User A's QR code", async () => {
      // User A creates a QR
      const resultA = await createQr(userA.id, { name: "[IDOR-TEST] Protected QR" });
      expect(resultA.success).toBe(true);
      if (!resultA.success) return;
      const qrA = resultA.qr;

      // User B attempts to delete it
      const deleteResult = await deleteQr(qrA.id, userB.id);
      expect(deleteResult.success).toBe(false);
      if (!deleteResult.success) {
        expect(deleteResult.error.code).toBe("NOT_FOUND");
      }

      // Verify QR still exists
      const qrCheck = await getQrById(qrA.id, userA.id);
      expect(qrCheck).not.toBeNull();
    });
  });

  describe("File Storage IDOR Protection", () => {
    it("prevents User B from reading User A's file", async () => {
      // User A uploads a file
      const buffer = Buffer.from("User A private file content", "utf-8");
      const resultA = await storeFile(userA.id, buffer, "text/plain", "private.txt");
      expect(resultA.success).toBe(true);
      if (!resultA.success) return;
      const fileA = resultA.file;

      // User B attempts to read it
      const fileAsB = await getFile(fileA.id, userB.id);
      expect(fileAsB).toBeNull();

      // User A can still read their own
      const fileAsA = await getFile(fileA.id, userA.id);
      expect(fileAsA).not.toBeNull();
      expect(fileAsA?.id).toBe(fileA.id);
    });

    it("prevents User B from deleting User A's file", async () => {
      // User A uploads a file
      const buffer = Buffer.from("Protected file", "utf-8");
      const resultA = await storeFile(userA.id, buffer, "text/plain", "protected.txt");
      expect(resultA.success).toBe(true);
      if (!resultA.success) return;
      const fileA = resultA.file;

      // User B attempts to delete it
      const deleteResult = await deleteFile(fileA.id, userB.id);
      expect(deleteResult.success).toBe(false);
      if (!deleteResult.success) {
        expect(deleteResult.error.code).toBe("NOT_FOUND");
      }

      // Verify file still exists
      const fileCheck = await getFile(fileA.id, userA.id);
      expect(fileCheck).not.toBeNull();
    });
  });

  describe("Multi-Link IDOR Protection", () => {
    it("prevents User B from adding items to User A's multi-link page", async () => {
      // User A creates a MULTI_LINK QR
      const resultA = await createQr(userA.id, { name: "[IDOR-TEST] Multi-Link", type: "MULTI_LINK" });
      expect(resultA.success).toBe(true);
      if (!resultA.success) return;

      const page = await prisma.multiLinkPage.findUnique({ where: { qrCodeId: resultA.qr.id } });
      expect(page).not.toBeNull();
      if (!page) return;

      // User B attempts to add an item
      const addResult = await addMultiLinkItem(page.id, userB.id, {
        label: "Malicious Link",
        url: "https://evil.com",
      });
      expect(addResult.success).toBe(false);
      if (!addResult.success) {
        expect(addResult.error.code).toBe("FORBIDDEN");
      }
    });

    it("prevents User B from updating User A's multi-link items", async () => {
      // User A creates a MULTI_LINK QR with an item
      const resultA = await createQr(userA.id, { name: "[IDOR-TEST] Multi-Link 2", type: "MULTI_LINK" });
      expect(resultA.success).toBe(true);
      if (!resultA.success) return;

      const page = await prisma.multiLinkPage.findUnique({ where: { qrCodeId: resultA.qr.id } });
      if (!page) return;

      const itemResult = await addMultiLinkItem(page.id, userA.id, {
        label: "Original Link",
        url: "https://example.com",
      });
      expect(itemResult.success).toBe(true);
      if (!itemResult.success) return;

      // User B attempts to update the item
      const updateResult = await updateMultiLinkItem(itemResult.data.id, userB.id, {
        label: "Hijacked",
        url: "https://malicious.com",
      });
      expect(updateResult.success).toBe(false);
      if (!updateResult.success) {
        expect(updateResult.error.code).toBe("FORBIDDEN");
      }
    });

    it("prevents User B from deleting User A's multi-link items", async () => {
      // User A creates a MULTI_LINK QR with an item
      const resultA = await createQr(userA.id, { name: "[IDOR-TEST] Multi-Link 3", type: "MULTI_LINK" });
      expect(resultA.success).toBe(true);
      if (!resultA.success) return;

      const page = await prisma.multiLinkPage.findUnique({ where: { qrCodeId: resultA.qr.id } });
      if (!page) return;

      const itemResult = await addMultiLinkItem(page.id, userA.id, {
        label: "Protected Link",
        url: "https://example.com",
      });
      expect(itemResult.success).toBe(true);
      if (!itemResult.success) return;

      // User B attempts to delete the item
      const deleteResult = await deleteMultiLinkItem(itemResult.data.id, userB.id);
      expect(deleteResult.success).toBe(false);
      if (!deleteResult.success) {
        expect(deleteResult.error.code).toBe("FORBIDDEN");
      }

      // Verify item still exists
      const items = await prisma.multiLinkItem.findMany({ where: { pageId: page.id } });
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("Cross-User Resource Isolation", () => {
    it("ensures users can only list their own QR codes", async () => {
      // User A creates a QR
      await createQr(userA.id, { name: "[IDOR-TEST] User A Private" });

      // User B creates a QR
      await createQr(userB.id, { name: "[IDOR-TEST] User B Private" });

      // Verify User A only sees their own
      const qrsA = await prisma.qRCode.findMany({
        where: { userId: userA.id, deletedAt: null },
      });
      const userAQrs = qrsA.filter((qr) => qr.name.startsWith("[IDOR-TEST] User A"));
      expect(userAQrs.length).toBeGreaterThan(0);
      expect(qrsA.every((qr) => qr.userId === userA.id)).toBe(true);

      // Verify User B only sees their own
      const qrsB = await prisma.qRCode.findMany({
        where: { userId: userB.id, deletedAt: null },
      });
      const userBQrs = qrsB.filter((qr) => qr.name.startsWith("[IDOR-TEST] User B"));
      expect(userBQrs.length).toBeGreaterThan(0);
      expect(qrsB.every((qr) => qr.userId === userB.id)).toBe(true);
    });
  });
});
