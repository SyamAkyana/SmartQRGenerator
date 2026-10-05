import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createQr, updateQr, disableQr, deleteQr } from "@/lib/qr/service";
import { getPublicQr } from "@/lib/qr/public";
import { resolveQr } from "@/lib/qr/resolve";

describe("QR Resolution (Phase 4) — Aiven PostgreSQL", () => {
  const demoEmail = "demo@smartqr.example";
  let demoUserId = "";

  beforeAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) throw new Error("Demo user not found — run db:seed first");
    demoUserId = user.id;
  });

  afterAll(async () => {
    await prisma.qRCode
      .deleteMany({ where: { userId: demoUserId, name: { startsWith: "[TEST-P4]" } } })
      .catch(() => {});
  });

  describe("resolveQr — core acceptance", () => {
    it("resolves a valid URL QR to a redirect", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] URL Resolve",
        type: "URL",
        data: { url: "https://example.com" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      const action = resolveQr(result.qr);
      expect(action.kind).toBe("redirect");
      if (action.kind === "redirect") expect(action.url).toBe("https://example.com");
    });

    it("QR destination changes but shortCode stays the same", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Dynamic Change",
        type: "URL",
        data: { url: "https://first-destination.com" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      const shortCode = result.qr.shortCode;

      // First destination resolves correctly
      const action1 = resolveQr(result.qr);
      expect(action1.kind).toBe("redirect");
      if (action1.kind === "redirect") expect(action1.url).toBe("https://first-destination.com");

      // Update the destination — same QR record, new data
      const updateResult = await updateQr(result.qr.id, demoUserId, {
        data: { url: "https://second-destination.com" },
      });
      expect(updateResult.success).toBe(true);
      if (!updateResult.success) return;

      // ShortCode is unchanged
      expect(updateResult.qr.shortCode).toBe(shortCode);

      // Second destination resolves correctly
      const action2 = resolveQr(updateResult.qr);
      expect(action2.kind).toBe("redirect");
      if (action2.kind === "redirect") expect(action2.url).toBe("https://second-destination.com");
    });

    it("blocks javascript: URLs at resolution time", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Dangerous URL",
        type: "URL",
        data: { url: "javascript:alert('xss')" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      const action = resolveQr(result.qr);
      expect(action.kind).toBe("invalid");
    });
  });

  describe("getPublicQr — status handling", () => {
    it("returns 'active' for an active QR", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Public Active",
        type: "TEXT",
        data: { text: "Hello" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      const lookup = await getPublicQr(result.qr.shortCode);
      expect(lookup.status).toBe("active");
    });

    it("returns 'inactive' for a disabled QR", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Public Disabled",
        type: "TEXT",
        data: { text: "Hi" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      await disableQr(result.qr.id, demoUserId);
      const lookup = await getPublicQr(result.qr.shortCode);
      expect(lookup.status).toBe("inactive");
    });

    it("returns 'missing' for a soft-deleted QR", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Public Deleted",
        type: "TEXT",
        data: { text: "Bye" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      await deleteQr(result.qr.id, demoUserId);
      const lookup = await getPublicQr(result.qr.shortCode);
      expect(lookup.status).toBe("missing");
    });

    it("returns 'missing' for an unknown shortCode", async () => {
      const lookup = await getPublicQr("ZZZZZZZ");
      expect(lookup.status).toBe("missing");
    });
  });

  describe("resolveQr — per type", () => {
    it("resolves PHONE to tel: redirect", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Phone",
        type: "PHONE",
        data: { phone: "+96812345678" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      const action = resolveQr(result.qr);
      expect(action.kind).toBe("redirect");
      if (action.kind === "redirect") expect(action.url).toMatch(/^tel:/);
    });

    it("resolves EMAIL to mailto: redirect", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Email",
        type: "EMAIL",
        data: { email: "test@example.com" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      const action = resolveQr(result.qr);
      expect(action.kind).toBe("redirect");
      if (action.kind === "redirect") expect(action.url).toMatch(/^mailto:/);
    });

    it("resolves WHATSAPP to wa.me redirect", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] WhatsApp",
        type: "WHATSAPP",
        data: { phone: "+96812345678" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      const action = resolveQr(result.qr);
      expect(action.kind).toBe("redirect");
      if (action.kind === "redirect") expect(action.url).toContain("wa.me");
    });

    it("resolves MAP to Google Maps redirect", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Map",
        type: "MAP",
        data: { latitude: 23.588, longitude: 58.383 },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      const action = resolveQr(result.qr);
      expect(action.kind).toBe("redirect");
      if (action.kind === "redirect") expect(action.url).toContain("google.com/maps");
    });

    it("resolves TEXT to render action", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Text",
        type: "TEXT",
        data: { text: "Hello World" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(resolveQr(result.qr)).toEqual({ kind: "render", component: "text" });
    });

    it("resolves WIFI to render action", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] WiFi",
        type: "WIFI",
        data: { ssid: "TestNet", password: "pass123" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(resolveQr(result.qr)).toEqual({ kind: "render", component: "wifi" });
    });

    it("resolves CONTACT to render action", async () => {
      const result = await createQr(demoUserId, {
        name: "[TEST-P4] Contact",
        type: "CONTACT",
        data: { firstName: "Alice", phone: "+15550001111" },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(resolveQr(result.qr)).toEqual({ kind: "render", component: "contact" });
    });
  });
});