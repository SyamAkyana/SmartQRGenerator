/**
 * Phase 8 — Analytics: unit tests for scan.ts and analytics.ts
 * Tests parseUserAgent, getClientIp, recordScan, getScanStats,
 * getScanBreakdown, and getRecentScans.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClientIp, parseUserAgent, recordScan } from "@/lib/qr/scan";
import { getRecentScans, getScanBreakdown, getScanStats } from "@/lib/qr/analytics";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    scanEvent: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  scanEvent: {
    count: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  $queryRaw: ReturnType<typeof vi.fn>;
};

function makeRequest(headers: Record<string, string | null>): Request {
  return {
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
  } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseUserAgent", () => {
  it("detects Chrome on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
    const result = parseUserAgent(ua);
    expect(result.browser).toBe("Chrome");
    expect(result.os).toBe("Windows");
    expect(result.deviceType).toBe("desktop");
  });

  it("detects Safari on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
    const result = parseUserAgent(ua);
    expect(result.browser).toBe("Safari");
    expect(result.os).toBe("macOS");
    expect(result.deviceType).toBe("desktop");
  });

  it("detects Firefox on Linux", () => {
    const ua = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";
    const result = parseUserAgent(ua);
    expect(result.browser).toBe("Firefox");
    expect(result.os).toBe("Linux");
  });

  it("detects Edge on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0";
    const result = parseUserAgent(ua);
    expect(result.browser).toBe("Edge");
    expect(result.os).toBe("Windows");
  });

  it("detects mobile device type from iPhone user agent", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    const result = parseUserAgent(ua);
    expect(result.deviceType).toBe("mobile");
    expect(result.os).toBe("iOS");
  });

  it("detects mobile device type from Android user agent", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6615.53 Mobile Safari/537.36";
    const result = parseUserAgent(ua);
    expect(result.deviceType).toBe("mobile");
    expect(result.os).toBe("Android");
  });

  it("detects tablet (iPad) device type", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    const result = parseUserAgent(ua);
    expect(result.deviceType).toBe("tablet");
    expect(result.os).toBe("iOS");
  });

  it("defaults to Unknown browser and OS for empty string", () => {
    const result = parseUserAgent("");
    expect(result.browser).toBe("Unknown");
    expect(result.os).toBe("Unknown");
    expect(result.deviceType).toBe("desktop");
  });

  it("defaults to Unknown for unrecognized browser patterns", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    const result = parseUserAgent(ua);
    expect(result.browser).toBe("Unknown");
  });
});

describe("getClientIp", () => {
  it("returns first IP from x-forwarded-for when present", () => {
    const req = makeRequest({ "x-forwarded-for": "203.0.113.1, 198.51.100.1, 10.0.0.1" });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = makeRequest({ "x-forwarded-for": null, "x-real-ip": "192.168.1.1" });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("returns null when neither header is present", () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBeNull();
  });
});

describe("getScanStats", () => {
  it("returns total, last7d, last30d counts and a time series", async () => {
    const mockTimeSeries = [
      { date: new Date("2024-01-01"), count: BigInt(5) },
      { date: new Date("2024-01-02"), count: BigInt(3) },
    ];

    prismaMock.scanEvent.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(42)
      .mockResolvedValueOnce(87);
    prismaMock.$queryRaw.mockResolvedValue(mockTimeSeries);

    const result = await getScanStats("qr-abc-123", 30);

    expect(result.total).toBe(100);
    expect(result.last7d).toBe(42);
    expect(result.last30d).toBe(87);
    expect(result.timeSeries).toHaveLength(2);
    expect(result.timeSeries[0].count).toBe(5);
    expect(result.timeSeries[1].count).toBe(3);
  });

  it("returns zeros when no scans exist", async () => {
    prismaMock.scanEvent.count.mockResolvedValue(0);
    prismaMock.$queryRaw.mockResolvedValue([]);

    const result = await getScanStats("qr-empty", 30);

    expect(result.total).toBe(0);
    expect(result.last7d).toBe(0);
    expect(result.last30d).toBe(0);
    expect(result.timeSeries).toEqual([]);
  });
});

describe("getScanBreakdown", () => {
  it("returns device type breakdown with percentages", async () => {
    prismaMock.scanEvent.groupBy.mockResolvedValue([
      { deviceType: "mobile", _count: { deviceType: 60 } },
      { deviceType: "desktop", _count: { deviceType: 30 } },
      { deviceType: "tablet", _count: { deviceType: 10 } },
    ]);

    const result = await getScanBreakdown("qr-abc", "deviceType");

    expect(result).toHaveLength(3);
    expect(result[0].value).toBe("mobile");
    expect(result[0].count).toBe(60);
    expect(result[0].percentage).toBe(60);
    expect(result[1].value).toBe("desktop");
    expect(result[1].percentage).toBe(30);
    expect(result[2].value).toBe("tablet");
    expect(result[2].percentage).toBe(10);
  });

  it("returns 0% for empty counts", async () => {
    prismaMock.scanEvent.groupBy.mockResolvedValue([]);

    const result = await getScanBreakdown("qr-abc", "browser");

    expect(result).toEqual([]);
  });

  it("maps null deviceType values to 'Unknown'", async () => {
    prismaMock.scanEvent.groupBy.mockResolvedValue([
      { deviceType: null, _count: { deviceType: 5 } },
    ]);

    const result = await getScanBreakdown("qr-abc", "deviceType");

    expect(result[0].value).toBe("Unknown");
    expect(result[0].count).toBe(5);
  });
});

describe("getRecentScans", () => {
  it("returns recent scans with normalized nulls", async () => {
    const mockScans = [
      {
        id: "s1",
        ipAddress: "1.2.3.4",
        deviceType: "mobile",
        browser: "Chrome",
        os: "Android",
        referer: null,
        scannedAt: new Date(),
      },
      {
        id: "s2",
        ipAddress: null,
        deviceType: null,
        browser: null,
        os: null,
        referer: null,
        scannedAt: new Date(),
      },
    ];
    prismaMock.scanEvent.findMany.mockResolvedValue(mockScans);

    const result = await getRecentScans("qr-abc", 20);

    expect(result).toHaveLength(2);
    expect(result[0].ipAddress).toBe("1.2.3.4");
    expect(result[0].deviceType).toBe("mobile");
    expect(result[0].browser).toBe("Chrome");
    expect(result[1].ipAddress).toBeNull();
    expect(result[1].deviceType).toBe("Unknown");
    expect(result[1].browser).toBe("Unknown");
    expect(result[1].os).toBe("Unknown");
    expect(result[1].referer).toBeNull();
  });

  it("respects the limit parameter", async () => {
    prismaMock.scanEvent.findMany.mockResolvedValue([]);

    await getRecentScans("qr-abc", 5);

    expect(prismaMock.scanEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });
});

describe("recordScan", () => {
  it("creates a scanEvent with parsed user agent data", async () => {
    prismaMock.scanEvent.create.mockResolvedValue({ id: "scan-1" });

    const req = makeRequest({
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1",
      "x-forwarded-for": "8.8.8.8",
      referer: "https://google.com",
    });

    await recordScan("qr-abc", req, "https://google.com");

    expect(prismaMock.scanEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        qrCodeId: "qr-abc",
        ipAddress: "8.8.8.8",
        deviceType: "mobile",
        browser: "Safari",
        os: "iOS",
        referer: "https://google.com",
      }),
    });
  });

  it("swallows errors and does not throw", async () => {
    prismaMock.scanEvent.create.mockRejectedValue(new Error("DB error"));

    await expect(recordScan("qr-abc", makeRequest({}), null)).resolves.toBeUndefined();
  });

  it("handles empty user-agent gracefully", async () => {
    prismaMock.scanEvent.create.mockResolvedValue({ id: "scan-2" });

    await recordScan("qr-abc", makeRequest({}), null);

    expect(prismaMock.scanEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        qrCodeId: "qr-abc",
        deviceType: "desktop",
        browser: "Unknown",
        os: "Unknown",
        ipAddress: null,
      }),
    });
  });
});
