import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getDashboardStats } from "@/lib/analytics/dashboard";
import { getRecentScans, getScanBreakdown, getScanStats } from "@/lib/qr/analytics";
import { recordScan } from "@/lib/qr/scan";
import { createQr, getQrById } from "@/lib/qr/service";

function makeRequest(headers: Record<string, string | null>): Request {
  return {
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
  } as unknown as Request;
}

describe("Analytics scan recording & ownership (Phase 8)", () => {
  const demoEmail = "demo@smartqr.example";
  let demoUserId = "";
  let testQrId = "";

  beforeAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) throw new Error("Demo user not found — run db:seed first");
    demoUserId = user.id;

    const created = await createQr(demoUserId, {
      name: "[TEST] Analytics Scan",
      type: "URL",
      data: { url: "https://example.com" },
    });
    if (!created.success) throw new Error("Failed to create analytics test QR");
    testQrId = created.qr.id;
  });

  afterAll(async () => {
    if (testQrId) {
      await prisma.scanEvent.deleteMany({ where: { qrCodeId: testQrId } }).catch(() => {});
      await prisma.qRCode.deleteMany({ where: { id: testQrId } }).catch(() => {});
    }
  });

  it("records a scan event with parsed device, browser, and OS", async () => {
    await recordScan(
      testQrId,
      makeRequest({
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        "x-forwarded-for": "203.0.113.10",
      }),
      "https://referrer.example"
    );

    const recent = await getRecentScans(testQrId, 5);
    expect(recent.length).toBeGreaterThanOrEqual(1);
    expect(recent[0].deviceType).toBe("mobile");
    expect(recent[0].browser).toBe("Safari");
    expect(recent[0].os).toBe("iOS");
    expect(recent[0].referer).toBe("https://referrer.example");
  });

  it("returns scan stats and breakdowns for the scanned QR", async () => {
    const stats = await getScanStats(testQrId, 30);
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.last7d).toBeGreaterThanOrEqual(1);
    expect(stats.last30d).toBeGreaterThanOrEqual(1);

    const devices = await getScanBreakdown(testQrId, "deviceType");
    expect(devices.some((d) => d.value === "mobile" && d.count >= 1)).toBe(true);
  });

  it("does not expose a QR to a non-owner", async () => {
    const owned = await getQrById(testQrId, demoUserId);
    expect(owned?.id).toBe(testQrId);

    const foreign = await getQrById(testQrId, "not-the-owner-id");
    expect(foreign).toBeNull();
  });

  it("aggregates dashboard stats only for the authenticated user's QR codes", async () => {
    const stats = await getDashboardStats(demoUserId);
    expect(stats.totalQrCodes).toBeGreaterThanOrEqual(1);
    expect(stats.activeQrCodes).toBeGreaterThanOrEqual(1);
    expect(stats.totalScans).toBeGreaterThanOrEqual(1);

    const empty = await getDashboardStats("not-the-owner-id");
    expect(empty.totalQrCodes).toBe(0);
    expect(empty.totalScans).toBe(0);
  });
});
