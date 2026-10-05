import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { storeFile, getFile, listFiles, deleteFile } from "@/lib/file/service";
import { storage } from "@/lib/storage";

describe("File Storage (Phase 5) — Aiven PostgreSQL", () => {
  const demoEmail = "demo@smartqr.example";
  let demoUserId = "";
  const storedFileIds: string[] = [];
  const storedStorageKeys: string[] = [];

  beforeAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) throw new Error("Demo user not found — run db:seed first");
    demoUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test files from storage
    for (const key of storedStorageKeys) {
      await storage.delete(key).catch(() => {});
    }
    // Clean up test DB records
    if (storedFileIds.length > 0) {
      await prisma.storedFile.deleteMany({ where: { id: { in: storedFileIds } } }).catch(() => {});
    }
  });

  describe("storeFile", () => {
    it("stores a valid PDF file and returns a record", async () => {
      // Minimal PDF: %PDF-1.4
      const pdfBuffer = Buffer.from("%PDF-1.4 test content");
      const result = await storeFile(demoUserId, pdfBuffer, "application/pdf", "test-document.pdf");

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.file.userId).toBe(demoUserId);
      expect(result.file.mimeType).toBe("application/pdf");
      expect(result.file.originalName).toBe("test-document.pdf");
      expect(result.file.sizeBytes).toBe(pdfBuffer.length);
      expect(result.file.storageKey).toBeTruthy();
      expect(result.file.id).toBeTruthy();

      storedFileIds.push(result.file.id);
      storedStorageKeys.push(result.file.storageKey);

      // Verify file exists on disk
      const exists = await storage.exists(result.file.storageKey);
      expect(exists).toBe(true);
    });

    it("sniffs MIME from magic bytes and uses it for extension", async () => {
      // PNG magic bytes: 89 50 4e 47
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const result = await storeFile(demoUserId, pngBuffer, "application/octet-stream", "photo.png");

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.file.mimeType).toBe("image/png");
      expect(result.file.storageKey).toMatch(/\.png$/);

      storedFileIds.push(result.file.id);
      storedStorageKeys.push(result.file.storageKey);
    });

    it("rejects executable file types", async () => {
      // Create a buffer that looks like a PE executable (MZ header)
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      const result = await storeFile(demoUserId, exeBuffer, "application/octet-stream", "malware.exe");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe("UNSUPPORTED_TYPE");
    });

    it("rejects files exceeding 10 MB", async () => {
      // 11 MB PDF
      const oversized = Buffer.alloc(11 * 1024 * 1024);
      oversized.write("%PDF", 0);
      const result = await storeFile(demoUserId, oversized, "application/pdf", "big.pdf");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("rejects empty files", async () => {
      const result = await storeFile(demoUserId, Buffer.alloc(0), "application/pdf", "empty.pdf");
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe("EMPTY_FILE");
    });

    it("sanitizes path traversal in original name", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 test");
      const result = await storeFile(demoUserId, pdfBuffer, "application/pdf", "../../../etc/passwd.pdf");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.file.originalName).not.toContain("..");
      expect(result.file.originalName).not.toContain("/");

      storedFileIds.push(result.file.id);
      storedStorageKeys.push(result.file.storageKey);
    });
  });

  describe("getFile", () => {
    it("returns the file record when ownership matches", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 lookup test");
      const storeResult = await storeFile(demoUserId, pdfBuffer, "application/pdf", "lookup.pdf");
      expect(storeResult.success).toBe(true);
      if (!storeResult.success) return;

      storedFileIds.push(storeResult.file.id);
      storedStorageKeys.push(storeResult.file.storageKey);

      const file = await getFile(storeResult.file.id, demoUserId);
      expect(file).not.toBeNull();
      expect(file?.id).toBe(storeResult.file.id);
      expect(file?.originalName).toBe("lookup.pdf");
    });

    it("returns null when ownership does not match", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 owner test");
      const storeResult = await storeFile(demoUserId, pdfBuffer, "application/pdf", "owner.pdf");
      expect(storeResult.success).toBe(true);
      if (!storeResult.success) return;

      storedFileIds.push(storeResult.file.id);
      storedStorageKeys.push(storeResult.file.storageKey);

      // Try to access with a different (fake) userId
      const file = await getFile(storeResult.file.id, "c_fakeuser12345");
      expect(file).toBeNull();
    });

    it("returns null for non-existent file", async () => {
      const file = await getFile("c_nonexistent1234", demoUserId);
      expect(file).toBeNull();
    });
  });

  describe("listFiles", () => {
    it("lists only files belonging to the user", async () => {
      const files = await listFiles(demoUserId);
      expect(files.length).toBeGreaterThan(0);
      files.forEach((f) => expect(f.userId).toBe(demoUserId));
    });
  });

  describe("deleteFile", () => {
    it("deletes file from both storage and database", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 delete test");
      const storeResult = await storeFile(demoUserId, pdfBuffer, "application/pdf", "delete-me.pdf");
      expect(storeResult.success).toBe(true);
      if (!storeResult.success) return;

      // Delete the file
      const deleteResult = await deleteFile(storeResult.file.id, demoUserId);
      expect(deleteResult.success).toBe(true);

      // Verify gone from DB
      const file = await getFile(storeResult.file.id, demoUserId);
      expect(file).toBeNull();

      // Verify gone from storage
      const exists = await storage.exists(storeResult.file.storageKey);
      expect(exists).toBe(false);
    });

    it("returns NOT_FOUND for non-existent file", async () => {
      const result = await deleteFile("c_nonexistent1234", demoUserId);
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe("NOT_FOUND");
    });

    it("returns NOT_FOUND when ownership does not match", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 ownership test");
      const storeResult = await storeFile(demoUserId, pdfBuffer, "application/pdf", "owner-only.pdf");
      expect(storeResult.success).toBe(true);
      if (!storeResult.success) return;

      storedFileIds.push(storeResult.file.id);
      storedStorageKeys.push(storeResult.file.storageKey);

      // Try to delete as wrong user
      const deleteResult = await deleteFile(storeResult.file.id, "c_fakeuser12345");
      expect(deleteResult.success).toBe(false);
      if (deleteResult.success) return;
      expect(deleteResult.error.code).toBe("NOT_FOUND");
    });
  });
});
