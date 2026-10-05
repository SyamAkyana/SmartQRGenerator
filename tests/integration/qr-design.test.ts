import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createQr } from "@/lib/qr/service";
import { getDesign, upsertDesign } from "@/lib/qr/design";

describe("QR Design Persistence & Scannability Integration", () => {
  const demoEmail = "demo@smartqr.example";
  let demoUserId = "";
  let testQrId = "";

  beforeAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) throw new Error("Demo user not found — run db:seed first");
    demoUserId = user.id;

    // Create a dedicated QR for design tests
    const created = await createQr(demoUserId, { name: "[TEST] Design Spec Test" });
    if (!created.success) throw new Error("Failed to create test QR");
    testQrId = created.qr.id;
  });

  afterAll(async () => {
    // Cleanup created test QR and its design record
    if (testQrId) {
      await prisma.qRDesign.deleteMany({ where: { qrCodeId: testQrId } }).catch(() => {});
      await prisma.qRCode.deleteMany({ where: { id: testQrId } }).catch(() => {});
    }
  });

  it("returns default design values when no design has been saved yet", async () => {
    const design = await getDesign(testQrId);
    expect(design.qrCodeId).toBe(testQrId);
    expect(design.foregroundColor).toBe("#000000");
    expect(design.backgroundColor).toBe("#ffffff");
    expect(design.dotStyle).toBe("square");
    expect(design.cornerStyle).toBe("square");
    expect(design.eyeStyle).toBe("square");
    expect(design.frameStyle).toBe("none");
    expect(design.frameText).toBeNull();
    expect(design.errorCorrectionLevel).toBe("M");
  });

  it("persists custom design styling via upsertDesign", async () => {
    const updateResult = await upsertDesign(testQrId, demoUserId, {
      foregroundColor: "#1e40af",
      backgroundColor: "#f0f9ff",
      dotStyle: "circle",
      cornerStyle: "extra-rounded",
      eyeStyle: "asteroid",
      frameStyle: "banner",
      frameText: "SCAN FOR SPECIALS",
      errorCorrectionLevel: "H",
    });

    expect(updateResult.success).toBe(true);
    if (!updateResult.success) return;

    expect(updateResult.design.foregroundColor).toBe("#1e40af");
    expect(updateResult.design.backgroundColor).toBe("#f0f9ff");
    expect(updateResult.design.dotStyle).toBe("circle");
    expect(updateResult.design.cornerStyle).toBe("extra-rounded");
    expect(updateResult.design.eyeStyle).toBe("asteroid");
    expect(updateResult.design.frameStyle).toBe("banner");
    expect(updateResult.design.frameText).toBe("SCAN FOR SPECIALS");
    expect(updateResult.design.errorCorrectionLevel).toBe("H");

    // Fetch again to verify database persistence
    const fetched = await getDesign(testQrId);
    expect(fetched.foregroundColor).toBe("#1e40af");
    expect(fetched.frameText).toBe("SCAN FOR SPECIALS");
    expect(fetched.errorCorrectionLevel).toBe("H");
  });

  it("rejects design updates when QR belongs to a different user", async () => {
    const fakeOtherUserId = "other_user_id_123456789";
    const result = await upsertDesign(testQrId, fakeOtherUserId, {
      foregroundColor: "#ff0000",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("rejects invalid design payloads with validation error", async () => {
    const result = await upsertDesign(testQrId, demoUserId, {
      foregroundColor: "not-a-color",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
